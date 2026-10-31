/**
 * TIBERIUS RECON™ — END-TO-END AUTOMATED VERIFICATION SUITE (tests/recon.test.js)
 * Verifies:
 *   1. Real-Time Territory Availability & Zip Exclusivity Rules (/api/recon/availability)
 *   2. Territory Activation & Tailored 7:00 AM Briefing Generation (/api/recon/activate)
 *   3. Morning Briefing Queue Retrieval & CAD X-Ray Metadata (/api/recon/briefing)
 *   4. 1-Tap Human-in-the-Loop Approve & Send + Inline Draft Editing (/api/recon/approve)
 *   5. 1-Click Locked Overflow Unlocker (/api/recon/approve -> unlock-full-queue)
 *   6. Contractor Command Portal Calibration (/api/recon/briefing POST)
 *   7. Overnight 2:00 AM -> 4:30 AM -> 5:30 AM -> 6:45 AM Recon Pipeline (/api/recon/cron-morning)
 */

const assert = require('assert');
const { createReconServer } = require('../server');

async function runTests() {
  const server = createReconServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log(`[1/7] Testing Territory Availability & Zip Exclusivity (${baseUrl}/api/recon/availability)...`);
    const availOpenResp = await fetch(
      `${baseUrl}/api/recon/availability?zip=78130&trade=Commercial%20Concrete&tier=Tier%202:%20Commercial%20Permits`
    );
    const availOpen = await availOpenResp.json();
    assert.strictEqual(availOpen.ok, true);
    assert.strictEqual(availOpen.zipCode, '78130');
    assert.strictEqual(availOpen.city, 'New Braunfels');
    assert.strictEqual(availOpen.isAvailable, true);

    // Check locked exclusive zip 79999
    const availLockedResp = await fetch(
      `${baseUrl}/api/recon/availability?zip=79999&trade=Commercial%20Concrete&tier=Tier%203:%20Full%20CAD`
    );
    const availLocked = await availLockedResp.json();
    assert.strictEqual(availLocked.isAvailable, false);
    assert.ok(availLocked.statusBadge.includes('LOCKED'));

    console.log('[2/7] Testing Live Territory Activation (/api/recon/activate)...');
    const activateResp = await fetch(`${baseUrl}/api/recon/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryTrade: 'Roofing / Exteriors',
        tierLevel: 'Tier 3: Full CAD + Residential Dominion',
        includeSmartSiteBundle: true,
        territoryZip: '78257',
        mobilePhone: '(210) 555-0192',
        bestEmail: 'owner@sanantonioroofing.com'
      })
    });
    const activated = await activateResp.json();
    assert.strictEqual(activated.ok, true);
    assert.strictEqual(activated.briefing.territoryZip, '78257');
    assert.strictEqual(activated.briefing.unlockedCount, 3);
    assert.strictEqual(activated.briefing.lockedOverflowCount, 6);
    const token = activated.briefing.magicToken;

    console.log('[3/7] Testing 7:00 AM Briefing Queue Retrieval (/api/recon/briefing)...');
    const briefingResp = await fetch(`${baseUrl}/api/recon/briefing?token=${encodeURIComponent(token)}`);
    const briefingData = await briefingResp.json();
    assert.strictEqual(briefingData.ok, true);
    assert.strictEqual(briefingData.briefing.cards.length, 9);
    assert.ok(briefingData.briefing.cards[0].headline.includes('TPO Roof System'));

    console.log('[4/7] Testing 1-Tap Approve & Send + Inline Draft Edit (/api/recon/approve)...');
    const customDraft =
      '"Hey Marcus — saw the $240,000 commercial roof permit filed yesterday in San Antonio. We would love to bid this TPO scope."';
    const approveResp = await fetch(`${baseUrl}/api/recon/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'approve-send',
        cardId: 'deal-1',
        updatedDraftBody: customDraft,
        dispatchChannel: 'CLOUD_EMAIL'
      })
    });
    const approved = await approveResp.json();
    assert.strictEqual(approved.ok, true);
    assert.strictEqual(approved.card.approvalStatus, 'sent');
    assert.strictEqual(approved.card.draftBody, customDraft);

    console.log('[5/7] Testing 1-Click Locked Territory Overflow Unlocker...');
    const unlockResp = await fetch(`${baseUrl}/api/recon/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'unlock-full-queue',
        upgradeTier: 'Tier 3: Full CAD + Residential Dominion'
      })
    });
    const unlocked = await unlockResp.json();
    assert.strictEqual(unlocked.ok, true);
    assert.strictEqual(unlocked.unlockedAll, true);
    const remainingLocked = unlocked.briefing.cards.filter((c) => c.isLockedOverflow).length;
    assert.strictEqual(remainingLocked, 0);

    console.log('[6/7] Testing Contractor Command Portal Recalibration...');
    const recalResp = await fetch(`${baseUrl}/api/recon/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        primaryTrade: 'Electrical / HVAC',
        territoryZip: '78746',
        landmarkReference: 'three miles north off Mopac'
      })
    });
    const recal = await recalResp.json();
    assert.strictEqual(recal.ok, true);
    assert.strictEqual(recal.briefing.territoryZip, '78746');
    assert.ok(recal.briefing.cards[0].draftBody.includes('three miles north off Mopac'));

    console.log('[7/9] Testing 2:00 AM -> 6:45 AM Overnight Recon Orchestrator (/api/recon/cron-morning)...');
    const cronResp = await fetch(`${baseUrl}/api/recon/cron-morning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zipCode: '78130',
        primaryTrade: 'Commercial Concrete'
      })
    });
    const cronData = await cronResp.json();
    assert.strictEqual(cronData.ok, true);
    assert.strictEqual(cronData.stages.stage3_0530am_geminiDrafts.zeroHallucinationPassRate, '100%');
    assert.ok(cronData.sampleCards.length >= 3);

    console.log('[8/9] Testing Zero-API Live Municipal Permit & Website Crawler (/api/recon/live-agent)...');
    const liveAgentResp = await fetch(`${baseUrl}/api/recon/live-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        primaryTrade: 'Commercial Concrete',
        landmarkReference: 'two miles east off IH-35'
      })
    });
    const liveAgentData = await liveAgentResp.json();
    assert.strictEqual(liveAgentData.ok, true);
    assert.strictEqual(liveAgentData.mode, 'ZERO_API_LIVE_WEB_RECON');
    assert.ok(liveAgentData.cards.length >= 3);
    assert.ok(liveAgentData.cards[0].contactPhone.length >= 10);

    console.log('[9/11] Testing Zero-API Live CAD Address & Parcel X-Ray (/api/recon/cad-lookup)...');
    const cadResp = await fetch(
      `${baseUrl}/api/recon/cad-lookup?address=${encodeURIComponent('16013 N IH 35')}`
    );
    const cadData = await cadResp.json();
    assert.strictEqual(cadData.ok, true);
    assert.strictEqual(cadData.mode, 'ZERO_API_LIVE_CAD_XRAY');
    assert.ok(cadData.parcelId.includes('TCAD'));

    console.log('[10/11] Testing Multi-Client Contractor Sign-In & Session Isolation (/api/recon/auth)...');
    const clientLoginResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'dana@centexroofing.com',
        password: 'roofing78701'
      })
    });
    const clientLoginData = await clientLoginResp.json();
    assert.strictEqual(clientLoginData.ok, true);
    assert.strictEqual(clientLoginData.role, 'CONTRACTOR');
    assert.strictEqual(clientLoginData.account.baseZip, '78701');
    assert.strictEqual(clientLoginData.account.magicToken, 'centex-roofing-78701');
    assert.ok(clientLoginData.sessionToken.length > 40);

    // Verify authenticated session retrieval using Bearer token
    const sessionCheckResp = await fetch(`${baseUrl}/api/recon/auth`, {
      headers: { Authorization: `Bearer ${clientLoginData.sessionToken}` }
    });
    const sessionCheckData = await sessionCheckResp.json();
    assert.strictEqual(sessionCheckData.authenticated, true);
    assert.strictEqual(sessionCheckData.account.companyName, 'Centex Industrial Roofing Systems');

    // Verify Contractor cannot access Master Admin API
    const unauthorizedAdminResp = await fetch(`${baseUrl}/api/recon/admin`, {
      headers: { Authorization: `Bearer ${clientLoginData.sessionToken}` }
    });
    assert.strictEqual(unauthorizedAdminResp.status, 401);

    console.log('[11/11] Testing Master Agency Admin Auth & Multi-Client Roster (/api/recon/admin)...');
    const adminLoginResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'admin@tiberius.ai',
        password: 'TiberiusAdmin2026!'
      })
    });
    const adminLoginData = await adminLoginResp.json();
    assert.strictEqual(adminLoginData.ok, true);
    assert.strictEqual(adminLoginData.role, 'ADMIN');

    const adminRosterResp = await fetch(`${baseUrl}/api/recon/admin`, {
      headers: { Authorization: `Bearer ${adminLoginData.sessionToken}` }
    });
    const adminRosterData = await adminRosterResp.json();
    assert.strictEqual(adminRosterData.ok, true);
    assert.ok(adminRosterData.clients.length >= 3);
    assert.ok(adminRosterData.metrics.estimatedAgencyMrr > 0);

    // Also verify static HTML endpoints respond 200
    for (const page of ['/', '/briefing', '/command', '/login', '/inbox']) {
      const pageResp = await fetch(`${baseUrl}${page}`);
      assert.strictEqual(pageResp.status, 200, `Expected 200 for ${page}`);
    }

    console.log('[12/13] Testing Autonomous Client Knowledge Base & Website Auto-Scanner (/api/recon/knowledge)...');
    const kbGetResp = await fetch(`${baseUrl}/api/recon/knowledge?token=${encodeURIComponent(token)}`);
    const kbGetData = await kbGetResp.json();
    assert.strictEqual(kbGetData.ok, true);
    assert.ok(Array.isArray(kbGetData.knowledgeBase.coreServices));
    assert.ok(kbGetData.knowledgeBase.coreServices.length >= 3);

    const kbSaveResp = await fetch(`${baseUrl}/api/recon/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_knowledge',
        token,
        knowledgeBase: {
          websiteUrl: 'https://www.sanantonioroofingpros.com',
          coreServices: 'TPO Flat Roofs, 20-Year NDL Warranties, Standing Seam Metal',
          certificationsAndBonding: 'GAF Master Select • $5M Commercial Umbrella • Bonded up to $2M',
          proofProjects: 'a 65,000 sq ft distribution center roof off I-10',
          warrantyAndGuarantee: 'zero tenant disruption and a 20-year NDL leak-free guarantee'
        }
      })
    });
    const kbSaveData = await kbSaveResp.json();
    assert.strictEqual(kbSaveData.ok, true);
    assert.strictEqual(kbSaveData.knowledgeBase.websiteUrl, 'https://www.sanantonioroofingpros.com');
    assert.ok(kbSaveData.briefing.cards[0].draftBody.includes('65,000 sq ft distribution center roof off I-10'));

    console.log('[13/13] Testing 3-Pane Conversation Room & Knowledge-Base AI Reply Drafter (/api/recon/inbox)...');
    const inboxGetResp = await fetch(`${baseUrl}/api/recon/inbox?token=${encodeURIComponent(token)}`);
    const inboxState = await inboxGetResp.json();
    assert.strictEqual(inboxState.ok, true);
    assert.ok(inboxState.threads.length >= 4);
    const firstThreadId = inboxState.threads[0].id;

    // Draft a reply using the updated Knowledge Base
    const draftReplyResp = await fetch(`${baseUrl}/api/recon/inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'draft_kb_reply',
        threadId: firstThreadId
      })
    });
    const draftReplyData = await draftReplyResp.json();
    assert.strictEqual(draftReplyData.ok, true);
    assert.ok(draftReplyData.draftText.includes('GAF Master Select'));
    assert.ok(draftReplyData.draftText.includes('65,000 sq ft distribution center roof off I-10'));

    // Send the reply in the Conversation Room
    const sendReplyResp = await fetch(`${baseUrl}/api/recon/inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'send_message',
        threadId: firstThreadId,
        messageBody: draftReplyData.draftText,
        channel: 'RESEND_EMAIL'
      })
    });
    const sendReplyData = await sendReplyResp.json();
    assert.strictEqual(sendReplyData.ok, true);
    assert.ok(sendReplyData.thread.messages.length >= 3);
    assert.ok(sendReplyData.providerReceipt.replyToAddress.includes(`reply+${token}+${firstThreadId}@`));

    console.log('[14/15] Testing Outbound Router (/api/recon/send), Native SIM SMS & 20-Sec Voicemail Script...');
    const nativeSimDraftResp = await fetch(`${baseUrl}/api/recon/inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'draft_native_sim_sms',
        threadId: firstThreadId
      })
    });
    const nativeSimDraftData = await nativeSimDraftResp.json();
    assert.strictEqual(nativeSimDraftData.ok, true);
    assert.ok(nativeSimDraftData.nativeSimUri.startsWith('sms:+1'));

    const outboundSendResp = await fetch(`${baseUrl}/api/recon/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        threadId: firstThreadId,
        channel: 'RESEND_EMAIL',
        messageBody: 'Confirming our estimator will bring the COI and unit-price sheet Thursday at 9:00 AM.'
      })
    });
    const outboundSendData = await outboundSendResp.json();
    assert.strictEqual(outboundSendData.ok, true);
    assert.ok(outboundSendData.providerReceipt.replyToAddress.includes('@inbound.tiberius.ai'));

    console.log('[15/15] Testing Universal Inbound Webhooks (/api/webhooks/resend & /api/webhooks/twilio)...');
    const resendWebhookResp = await fetch(`${baseUrl}/api/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email.received',
        data: {
          from: 'Marcus Vance <mvance@apexcommercialbuilders.com>',
          to: outboundSendData.providerReceipt.replyToAddress,
          subject: 'Re: Bid numbers for Industrial Pkwy',
          text: 'Perfect, see you Thursday at 9:00 AM at the job trailer.\n\nOn Thu, Oct 27, 2026 wrote:\n> Old quoted email text that should be stripped'
        }
      })
    });
    const resendWebhookData = await resendWebhookResp.json();
    assert.strictEqual(resendWebhookData.ok, true);
    assert.strictEqual(resendWebhookData.cleanedBody, 'Perfect, see you Thursday at 9:00 AM at the job trailer.');
    assert.strictEqual(resendWebhookData.thread.stage, 'REPLIED_HOT');
    assert.strictEqual(resendWebhookData.contractorAlertReceipt.alertType, 'HOT_PROSPECT_REPLY_SMS');
    assert.strictEqual(resendWebhookData.contractorAlertReceipt.a2pCampaignModel, 'MASTER_TIBERIUS_A2P_10DLC');

    const twilioWebhookResp = await fetch(`${baseUrl}/api/webhooks/twilio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: '+15125550182',
        To: '+18305550194',
        Body: 'Dana Sterling here — received your W-9 and COI, adding you to Thursday CapEx walk.',
        token
      }).toString()
    });
    const twilioWebhookData = await twilioWebhookResp.json();
    assert.strictEqual(twilioWebhookData.ok, true);
    assert.strictEqual(twilioWebhookData.threadId, 'thread-deal-2');
    assert.strictEqual(twilioWebhookData.thread.stage, 'REPLIED_HOT');
    assert.strictEqual(twilioWebhookData.contractorAlertReceipt.alertType, 'HOT_PROSPECT_REPLY_SMS');

    console.log('[16/17] Testing 6:45 AM Scout-to-Contractor Master Twilio SMS Alert (/api/recon/alerts)...');
    const morningAlertResp = await fetch(`${baseUrl}/api/recon/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'send_morning_briefing_sms'
      })
    });
    const morningAlertData = await morningAlertResp.json();
    assert.strictEqual(morningAlertData.ok, true);
    assert.strictEqual(morningAlertData.receipt.alertType, 'MORNING_BRIEFING_7AM_SMS');
    assert.strictEqual(morningAlertData.receipt.a2pCampaignModel, 'MASTER_TIBERIUS_A2P_10DLC');
    assert.ok(morningAlertData.receipt.smsBody.includes('/recon/briefing?token='));

    console.log('[17/18] Testing Two-Stage Twilio Bridge Pool -> Dedicated Subaccount Promotion...');
    const stage2Resp = await fetch(`${baseUrl}/api/recon/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'provision_twilio_subaccount',
        stage: 'STAGE_2_DEDICATED_SUBACCOUNT'
      })
    });
    const stage2Data = await stage2Resp.json();
    assert.strictEqual(stage2Data.ok, true);
    assert.strictEqual(
      stage2Data.twilioA2PState.twoStageProvisioning.currentStage,
      'STAGE_2_DEDICATED_SUBACCOUNT'
    );

    console.log('[18/18] Testing Post-Pay Client Onboarding Portal (/onboarding) & Credential Issuance...');
    const onbPageResp = await fetch(`${baseUrl}/onboarding`);
    assert.strictEqual(onbPageResp.status, 200);
    const onbHtml = await onbPageResp.text();
    assert.ok(onbHtml.includes('id="client-onboarding-form"'));

    const onbActivateResp = await fetch(`${baseUrl}/api/recon/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Hill Country Commercial Concrete LLC',
        ownerName: 'Mike Reynolds',
        workEmail: 'mike@apexcommercialbuilders.com',
        mobilePhone: '(830) 555-0177',
        password: 'HillCountry78666!',
        primaryTrade: 'Commercial Concrete',
        territoryZip: '78666',
        minValuation: 150000,
        tierLevel: 'Tier 2: Commercial Permits',
        smartSiteBundle: true,
        isPaidOnboarding: true,
        sendWelcomeCredentials: true,
        knowledgeBase: {
          coreServices: ['Commercial Tilt-Wall', 'Heavy-Duty Truck Aprons'],
          certsAndBonding: 'ACI Certified • $2M GL',
          yearsInBusiness: '15+ Years',
          recentCompletedProof: 'a 30,000 sq ft industrial slab in San Marcos',
          uniqueGuarantee: 'zero day-labor subs and on-time pour schedule'
        }
      })
    });
    const onbActivateData = await onbActivateResp.json();
    assert.strictEqual(onbActivateData.ok, true);
    assert.strictEqual(onbActivateData.issuedCredentials.loginEmail, 'mike@apexcommercialbuilders.com');
    assert.strictEqual(onbActivateData.issuedCredentials.password, 'HillCountry78666!');
    assert.strictEqual(onbActivateData.issuedCredentials.territoryPin, '78666');
    assert.strictEqual(onbActivateData.briefing.unlockedCount, 9);
    assert.strictEqual(onbActivateData.briefing.lockedOverflowCount, 0);
    assert.ok(onbActivateData.welcomeEmailReceipt);
    assert.ok(onbActivateData.welcomeSmsReceipt);

    // Verify newly onboarded real company briefing has zero 555 demo phone numbers and all 9 cards unlocked
    const onbBriefingResp = await fetch(
      `${baseUrl}/api/recon/briefing?token=${encodeURIComponent(onbActivateData.magicToken)}`
    );
    const onbBriefingData = await onbBriefingResp.json();
    assert.strictEqual(onbBriefingData.ok, true);
    assert.strictEqual(onbBriefingData.briefing.cards.length, 9);
    assert.ok(
      onbBriefingData.briefing.cards.every((c) => !c.isLockedOverflow),
      'All 9 cards must be unlocked upon Stripe 7-day trial onboarding'
    );
    assert.ok(
      onbBriefingData.briefing.cards.every((c) => !String(c.contactPhone || '').includes('555')),
      'Real onboarded client cards must not contain 555 demo numbers'
    );

    // Verify A-lert Roof Systems (feedbackdaisy+alert@gmail.com / getter8039) login + non-555 cards
    const alertLoginResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'feedbackdaisy+alert@gmail.com',
        password: 'getter8039'
      })
    });
    const alertLoginData = await alertLoginResp.json();
    assert.strictEqual(alertLoginData.ok, true);
    assert.strictEqual(alertLoginData.account.companyName, 'A-lert Roof Systems');
    assert.strictEqual(alertLoginData.account.magicToken, 'recon-78130-2101s6');

    const alertBriefingResp = await fetch(`${baseUrl}/api/recon/briefing?token=recon-78130-2101s6`);
    const alertBriefingData = await alertBriefingResp.json();
    assert.strictEqual(alertBriefingData.ok, true);
    assert.strictEqual(alertBriefingData.contractor.companyName, 'A-lert Roof Systems');
    assert.ok(
      alertBriefingData.briefing.cards.every((c) => !String(c.contactPhone || '').includes('555')),
      'A-lert Roof Systems cards must not contain 555 demo numbers'
    );

    console.log('[19/20] Testing Shop Dossier -> 9-Card Generation Pipeline (Greetings, Proof Rotation, Scope Matching, CTAs & ZIP/Office Polish)...');
    const kbDossier = alertBriefingData.contractor.knowledgeBase;
    assert.ok(Array.isArray(kbDossier.coreCapabilities) && kbDossier.coreCapabilities.length >= 3, 'shopDossier.coreCapabilities must be populated');
    assert.ok(kbDossier.crewAndLicenseBadge, 'shopDossier.crewAndLicenseBadge must be populated');
    assert.ok(kbDossier.signatureGuarantee, 'shopDossier.signatureGuarantee must be populated');
    assert.ok(
      kbDossier.proofByArchetype &&
        kbDossier.proofByArchetype.groundUpShell &&
        kbDossier.proofByArchetype.commercialRetrofit &&
        kbDossier.proofByArchetype.specialtyStructural,
      'shopDossier.proofByArchetype must contain groundUpShell, commercialRetrofit, and specialtyStructural'
    );
    assert.ok(Array.isArray(kbDossier.proofAngles) && kbDossier.proofAngles.length >= 3, 'shopDossier.proofAngles must contain 3 distinct variations');
    assert.notStrictEqual(kbDossier.proofAngles[0], kbDossier.proofAngles[1]);
    assert.notStrictEqual(kbDossier.proofAngles[1], kbDossier.proofAngles[2]);

    const cards = alertBriefingData.briefing.cards;
    assert.strictEqual(cards.length, 9);

    // 1. Kill the "multi-family" fallback bug and legacy hardcoded roofing string across all 9 commercial cards
    cards.forEach((c) => {
      assert.ok(
        !String(c.draftBody || '').toLowerCase().includes('multi-family roof preventative maintenance'),
        `Card ${c.cardNumber} must never output hardcoded "multi-family roof preventative maintenance"`
      );
      assert.ok(
        !String(c.draftBody || '').includes('in-house engineered metal roof systems, zero business disruption during install'),
        `Card ${c.cardNumber} must never output legacy hardcoded roofing guarantee string`
      );
    });

    // Verify operationalBenefit slot in Sentence #2:
    // Ground-Up / New Shell / Spec Industrial / New Storage / Gym (Cards 01, 02, 04, 05, 08) -> schedule/inspection milestone
    // CapEx / Multi-Tenant / TI / Retrofit (Cards 03, 06, 07, 09) -> zero tenant or business disruption
    const groundUpPermitIds = ['#BP-2026-06102', '#BP-2026-06245', '#BP-2026-06511', '#BP-2026-06640', '#BP-2026-07044'];
    const retrofitPermitIds = ['#BP-2026-06388', '#BP-2026-06792', '#BP-2026-06915', '#BP-2026-07189'];
    for (const pid of groundUpPermitIds) {
      const matched = cards.find((c) => c.cardNumber.includes(pid));
      assert.ok(matched, `Expected card for ${pid}`);
      assert.ok(
        matched.draftBody.includes("passing inspection ahead of the GC's turnover schedule"),
        `Ground-up/shell card ${pid} must use schedule/inspection milestone in Sentence #2: ${matched.draftBody}`
      );
      assert.ok(
        !matched.draftBody.includes('with zero tenant or business disruption during work'),
        `Ground-up/shell card ${pid} must not claim zero tenant disruption on an unoccupied new build: ${matched.draftBody}`
      );
    }
    for (const pid of retrofitPermitIds) {
      const matched = cards.find((c) => c.cardNumber.includes(pid));
      assert.ok(matched, `Expected card for ${pid}`);
      assert.ok(
        matched.draftBody.includes('with zero tenant or business disruption during work'),
        `CapEx/TI/Retrofit card ${pid} must use zero tenant or business disruption in Sentence #2: ${matched.draftBody}`
      );
    }

    // 2. Verify Sentence #1 persona-aware greeting & contact sanitization on Batch B (Cards 01-09)
    // Card 01: Wayne Lott @ Lott Brothers Construction (Case A - Named GC Estimator/Precon)
    const card01 = cards.find((c) => c.cardNumber.includes('#BP-2026-06102')) || cards[0];
    assert.ok(
      card01.draftBody.includes('Hey Wayne & the Lott Brothers team — saw the commercial permit (#BP-2026-06102) filed for 2950 Cold Spring Dr in New Braunfels.'),
      `Unexpected Card 01 greeting: ${card01.draftBody}`
    );
    assert.ok(
      card01.contactMeta.includes('GC Office: Austin, TX | Jobsite: New Braunfels'),
      `Card 01 (512) contactMeta should distinguish Austin GC office vs New Braunfels jobsite: ${card01.contactMeta}`
    );

    // Card 03: Lauren Vance @ Stream Realty Partners (Case B - Property Management / Ownership Persona)
    const card03 = cards.find((c) => c.cardNumber.includes('#BP-2026-06388'));
    assert.ok(card03, 'Card 03 (#BP-2026-06388) should be present');
    assert.ok(
      card03.draftBody.includes('Hey Lauren — saw the commercial CapEx permit (#BP-2026-06388) filed for Guadalupe River Business Park at 1420 Common St in New Braunfels.'),
      `Unexpected Card 03 PM greeting: ${card03.draftBody}`
    );
    assert.ok(
      card03.draftBody.includes('Mind if I send over our CapEx comparison numbers, warranty specs, and COI this afternoon? — Jack Williams • A-lert Roof Systems • (830) 481-0653'),
      `Card 03 PM closing CTA should use CapEx comparison numbers: ${card03.draftBody}`
    );

    // Card 04: David Keller @ Keller-Martin Construction (Self-Storage & Metal Envelope, 78132 ZIP, (210) San Antonio Office)
    const card04 = cards.find((c) => c.cardNumber.includes('#BP-2026-06511'));
    assert.ok(card04, 'Card 04 (#BP-2026-06511) should be present');
    assert.ok(
      card04.draftBody.includes('Hey David & the Keller-Martin team — saw the commercial permit (#BP-2026-06511) filed for 2180 State Hwy 46 W in New Braunfels.'),
      `Unexpected Card 04 greeting: ${card04.draftBody}`
    );
    assert.ok(
      /standing-seam metal|metal roof/i.test(card04.draftBody) && !/60-mil mechanically attached tpo/i.test(card04.draftBody),
      `Card 04 (Metal Envelope) must pitch standing-seam metal roof envelope, not 60-mil TPO: ${card04.draftBody}`
    );
    assert.strictEqual(card04.cadDetails.parcelId, 'CAD-78132-6511');
    assert.ok(card04.subMeta.includes('78132'), `Card 04 address should use 78132 ZIP: ${card04.subMeta}`);
    assert.ok(
      card04.contactMeta.includes('GC Office: San Antonio, TX | Jobsite: New Braunfels'),
      `Card 04 (210) contactMeta should distinguish San Antonio GC office: ${card04.contactMeta}`
    );

    // Card 07: Structura Inc (Case C - Generic Inbox fallback & Sanitized UI Contact Badge, 78132 ZIP)
    const card07 = cards.find((c) => c.cardNumber.includes('#BP-2026-06915'));
    assert.ok(card07, 'Card 07 (#BP-2026-06915) should be present');
    assert.strictEqual(
      card07.contactName,
      'Preconstruction Desk • Estimating @ Structura Inc',
      'Card 07 contactName must sanitize raw email address into Preconstruction Desk label'
    );
    assert.ok(
      card07.draftBody.includes('Hey Structura Inc Estimating Team — saw the commercial permit (#BP-2026-06915) filed for 715 Landa St in New Braunfels.'),
      `Unexpected Card 07 generic desk greeting: ${card07.draftBody}`
    );
    assert.strictEqual(card07.cadDetails.parcelId, 'CAD-78132-6915');

    // Card 08: Gymnasium (#BP-2026-07044) prioritizes structural standing-seam metal roof and never stuffs "self-storage"
    const card08 = cards.find((c) => c.cardNumber.includes('#BP-2026-07044'));
    assert.ok(card08, 'Card 08 (#BP-2026-07044) should be present');
    assert.ok(
      /standing-seam metal/i.test(card08.draftBody),
      `Card 08 (Gymnasium) must prioritize standing-seam metal capability: ${card08.draftBody}`
    );
    assert.ok(
      !card08.draftBody.toLowerCase().includes('self-storage'),
      `Card 08 (Municipal Gym) must never stuff "self-storage" into Sentence #2 or #3: ${card08.draftBody}`
    );

    // 3. Verify Sentence #2 rotates through 3 distinct proof angles when landmarkReference is blank
    const sentence2Set = new Set(
      cards.map((c) => {
        const parts = String(c.draftBody || '').split('. ');
        return parts[1] || '';
      })
    );
    assert.ok(
      sentence2Set.size >= 3,
      `When landmarkReference is blank, Sentence #2 must rotate through 3 distinct proof variations across the 9 cards (found ${sentence2Set.size})`
    );

    // 4. Verify Landmark Override when NEARBY JOB LANDMARK (SENTENCE #2) is populated
    const landmarkOverrideResp = await fetch(`${baseUrl}/api/recon/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'recon-78130-2101s6',
        primaryTrade: 'Roofing / Exteriors',
        territoryZip: '78130',
        landmarkReference: 'two miles east off FM 306 & Hunter Rd'
      })
    });
    const landmarkOverrideData = await landmarkOverrideResp.json();
    assert.strictEqual(landmarkOverrideData.ok, true);
    assert.ok(
      landmarkOverrideData.briefing.cards.every((c) =>
        c.draftBody.includes('two miles east off FM 306 & Hunter Rd')
      ),
      'Populating NEARBY JOB LANDMARK must inject the landmark phrase into Sentence #2 across all cards'
    );

    // 5. Verify 5-Trade × 9-Permit Matrix in resolvePermitScope (Sentence #3) + 4-Slot Trade-Agnostic Sentence #2 across all 5 Trade Calibration Pills
    const expectedScopesByTrade = {
      'Commercial Concrete': {
        '#BP-2026-06102': 'monolithic slab-on-grade, storefront sidewalk aprons & heavy-duty dumpster pad scope',
        '#BP-2026-06245': 'laser-screed reinforced warehouse slab, dock leveler pits & heavy truck apron paving',
        '#BP-2026-06388': 'commercial parking lot mill/overlay, ADA ramp retrofits & structural curb replacement',
        '#BP-2026-06511': 'vapor-barrier climate-controlled foundation slab, grade beams & concrete drive aisles',
        '#BP-2026-06640': 'vibration-isolated clinical slab, covered ambulance/drop-off canopy flatwork & site curbing',
        '#BP-2026-06792': 'high-PSI automotive service bay slabs, trench drains & multi-tenant parking flatwork',
        '#BP-2026-06915': 'interior structural slab saw-cutting, trenching pour-backs & polished concrete showroom floors',
        '#BP-2026-07044': 'long-span recessed athletic floor slab, structural pier caps & exterior site flatwork',
        '#BP-2026-07189': 'sloped chemical-resistant trench drain slabs, heavy fermentation tank pads & patio flatwork'
      },
      'Electrical / HVAC': {
        '#BP-2026-06102': 'commercial shell 3-phase switchgear, packaged RTU installation & tenant sub-metering scope',
        '#BP-2026-06245': '1200A industrial power distribution, high-bay LED lighting & warehouse make-up air units',
        '#BP-2026-06388': 'multi-building high-SEER RTU replacement, exterior LED retrofit & EMS controls upgrade',
        '#BP-2026-06511': 'climate-controlled dehumidification/HVAC package, corridor motion LEDs & low-voltage access rough-in',
        '#BP-2026-06640': 'hospital-grade electrical rough-in, redundant clinical HVAC zoning & backup generator transfer switch',
        '#BP-2026-06792': 'multi-tenant meter banks, automotive bay exhaust ventilation & high-output canopy lighting',
        '#BP-2026-06915': 'exposed spiral ductwork, architectural showroom lighting & commercial panel re-work',
        '#BP-2026-07044': 'high-volume gymnasium air handlers, high-bay impact-rated LED fixtures & fire alarm rough-in',
        '#BP-2026-07189': 'process chiller electrical feeds, high-capacity taproom HVAC & commercial exhaust hood makeup air'
      },
      'Pools / Fencing / Custom Home': {
        '#BP-2026-06102': 'architectural steel patio enclosures, decorative site bollards & commercial masonry dumpster enclosures',
        '#BP-2026-06245': '8-foot industrial chain-link & barbed-wire perimeter security fencing, cantilever slide gates & card-reader pedestals',
        '#BP-2026-06388': 'commercial perimeter fence replacement, tenant courtyard pergolas & automated gate operator upgrades',
        '#BP-2026-06511': 'ornamental steel security fencing, dual keypad-controlled cantilever slide gates & perimeter bollards',
        '#BP-2026-06640': 'healing garden shade structures, privacy screening walls & commercial site furnishings',
        '#BP-2026-06792': 'rear service-yard security fencing, double-swing utility gates & storefront bike/patio rails',
        '#BP-2026-06915': 'custom architectural entry canopies, exterior lounge decking & ornamental railing package',
        '#BP-2026-07044': 'athletic complex perimeter fencing, monument sign masonry & heavy-duty pedestrian gates',
        '#BP-2026-07189': 'custom structural steel beer-garden shade canopies, cedar/steel perimeter fencing & outdoor patio hardscaping'
      },
      'B2B / Commercial Services': {
        '#BP-2026-06102': 'post-construction final clean, storefront glass detailing & parking lot striping/pressure washing',
        '#BP-2026-06245': 'industrial warehouse floor scrubbing, dock apron striping & pre-occupancy construction turnover clean',
        '#BP-2026-06388': '4-building exterior elastomeric facade wash, parking lot sealcoating/striping & ongoing porter contract',
        '#BP-2026-06511': 'multi-phase post-construction debris haul-off, roll-up door detailing & drive-aisle sweeping',
        '#BP-2026-06640': 'terminal clinical-grade post-construction sanitization, bio-clean floor prep & exterior window washing',
        '#BP-2026-06792': 'multi-tenant buildout final clean, parking lot striping/fire-lane painting & exterior pressure washing',
        '#BP-2026-06915': 'showroom floor polishing/waxing, interior glass partition detailing & TI turnover clean',
        '#BP-2026-07044': 'athletic facility post-construction top-to-bottom clean, high-bay dusting & parking lot striping',
        '#BP-2026-07189': 'hospitality turnover deep clean, exterior facade washing & ongoing commercial property maintenance'
      },
      'Roofing / Exteriors': {
        '#BP-2026-06102': 'commercial shell standing-seam metal & TPO roof package, tapered insulation & custom architectural sheet metal scope',
        '#BP-2026-06245': 'industrial standing-seam metal & high-wind TPO roof system, expansion joint flashing & perimeter coping scope',
        '#BP-2026-06388': '4-building commercial CapEx standing-seam metal roof retrofit, elastomeric restoration & weather-tight curb flashing',
        '#BP-2026-06511': 'engineered standing-seam metal roof envelope, climate-controlled storage deck & weather-tight trim package',
        '#BP-2026-06640': 'clinical shell standing-seam metal & high-R TPO roof assembly, surgical rooftop MEP curb flashing & coping scope',
        '#BP-2026-06792': 'multi-tenant commercial standing-seam metal canopy, parapet coping & high-durability TPO roof assembly',
        '#BP-2026-06915': 'structural roof remodel, architectural standing-seam metal envelope & custom rooftop curb/flashing retrofit',
        '#BP-2026-07044': 'long-span structural standing-seam metal roof system, high-bay thermal insulation & custom perimeter flashing scope',
        '#BP-2026-07189': 'commercial standing-seam metal roof retrofit, architectural taproom fascia & high-thermal envelope upgrade'
      }
    };

    const expectedBadgeByTrade = {
      'Commercial Concrete': 'ACI-Certified Commercial Concrete Crew',
      'Electrical / HVAC': 'TDLR Licensed Electrical & MEP Contractor',
      'Pools / Fencing / Custom Home': 'AWS-Certified Commercial Site & Perimeter Crew',
      'B2B / Commercial Services': 'OSHA-Certified Commercial Turnover & Facility Crew',
      'Roofing / Exteriors': 'RCAT Licensed Commercial Roofer'
    };

    const expectedGuaranteeByTrade = {
      'Commercial Concrete': 'laser-screed Ff/Fl flatness compliance',
      'Electrical / HVAC': 'turnkey Title 24 / IECC commissioning',
      'Pools / Fencing / Custom Home': 'engineered wind-load & UL-325 gate compliance',
      'B2B / Commercial Services': 'bonded day-1 CO turnover & SLA compliance',
      'Roofing / Exteriors': '20-year NDL weathertightness warranties'
    };

    const tradePills = [
      'Commercial Concrete',
      'Electrical / HVAC',
      'Pools / Fencing / Custom Home',
      'B2B / Commercial Services',
      'Roofing / Exteriors'
    ];
    for (const pillTrade of tradePills) {
      const pillResp = await fetch(`${baseUrl}/api/recon/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'recon-78130-2101s6',
          primaryTrade: pillTrade,
          territoryZip: '78130',
          landmarkReference: ''
        })
      });
      const pillData = await pillResp.json();
      assert.strictEqual(pillData.ok, true);
      const expectedMap = expectedScopesByTrade[pillTrade];
      pillData.briefing.cards.forEach((c) => {
        assert.ok(
          !c.draftBody.toLowerCase().includes('multi-family roof preventative maintenance'),
          `Trade ${pillTrade} must never contain multi-family roof preventative maintenance`
        );
        assert.ok(
          c.draftBody.includes(expectedBadgeByTrade[pillTrade]),
          `Trade ${pillTrade} Sentence #2 must include crewAndLicenseBadge "${expectedBadgeByTrade[pillTrade]}": ${c.draftBody}`
        );
        assert.ok(
          c.draftBody.includes(expectedGuaranteeByTrade[pillTrade]),
          `Trade ${pillTrade} Sentence #2 must include signatureGuarantee "${expectedGuaranteeByTrade[pillTrade]}": ${c.draftBody}`
        );
        if (pillTrade !== 'Roofing / Exteriors') {
          assert.ok(
            !c.draftBody.toLowerCase().includes('60-mil mechanically attached tpo') &&
              !c.draftBody.toLowerCase().includes('20-year ndl weathertightness warranties') &&
              !c.draftBody.toLowerCase().includes('standing-seam metal roof'),
            `Non-roofing trade ${pillTrade} must not leak roofing terms in Sentence #2 or #3: ${c.draftBody}`
          );
        }
        const matchedPermitId = Object.keys(expectedMap).find((pid) => c.cardNumber.includes(pid));
        assert.ok(matchedPermitId, `Card ${c.cardNumber} should match one of the 9 New Braunfels permits`);
        assert.ok(
          c.draftBody.includes(expectedMap[matchedPermitId]),
          `Trade "${pillTrade}" on ${matchedPermitId} must include exact matrix scope "${expectedMap[matchedPermitId]}", got: ${c.draftBody}`
        );
      });
    }

    // 6. Verify Onboarding Website Scraper Alignment populates tradeCategory, crewAndLicenseBadge, signatureGuarantee, proofByArchetype & coreCapabilities
    const mepScanResp = await fetch(`${baseUrl}/api/recon/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'scan_website',
        token: 'demo-7am-briefing',
        websiteUrl: 'https://www.sparkcommercialelectric.com',
        companyName: 'Spark Commercial Electrical & MEP',
        primaryTrade: 'Electrical / HVAC'
      })
    });
    const mepScanData = await mepScanResp.json();
    assert.strictEqual(mepScanData.ok, true);
    assert.strictEqual(mepScanData.knowledgeBase.tradeCategory, 'Electrical / HVAC');
    assert.ok(
      /TDLR Licensed Electrical/i.test(mepScanData.knowledgeBase.crewAndLicenseBadge),
      `Expected TDLR Licensed Electrical badge from MEP website scan, got: ${mepScanData.knowledgeBase.crewAndLicenseBadge}`
    );
    assert.strictEqual(mepScanData.knowledgeBase.signatureGuarantee, 'turnkey Title 24 / IECC commissioning');
    assert.ok(
      mepScanData.knowledgeBase.proofByArchetype &&
        mepScanData.knowledgeBase.proofByArchetype.groundUpShell &&
        mepScanData.knowledgeBase.proofByArchetype.commercialRetrofit &&
        mepScanData.knowledgeBase.proofByArchetype.specialtyStructural,
      'Website scanner must populate proofByArchetype for all 3 archetypes'
    );

    const initialCard1Contact = alertBriefingData.briefing.cards[0].contactName;

    console.log('[20/20] Testing Daily Card Rotation + 6:45 AM Sweep (/api/recon/cron-morning)...');
    // 20. Verify Daily Card Rotation + 6:45 AM Sweep rotates A-lert Roof Systems to a fresh 9-card batch
    const rotateResp = await fetch(`${baseUrl}/api/recon/cron-morning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'recon-78130-2101s6',
        rotateBatch: true
      })
    });
    const rotateData = await rotateResp.json();
    assert.strictEqual(rotateData.ok, true);
    assert.strictEqual(rotateData.rotated, true);
    assert.ok(rotateData.briefing && Array.isArray(rotateData.briefing.cards));
    assert.strictEqual(rotateData.briefing.cards.length, 9);
    assert.notStrictEqual(rotateData.briefing.cards[0].contactName, initialCard1Contact);
    assert.ok(
      rotateData.briefing.cards.every((c) => !String(c.contactPhone || '').includes('555')),
      'Rotated real client batch must have zero 555 demo numbers'
    );

    // Rotate 2 more times so A-lert Roof Systems returns to default Batch B (rotationOffset 0) for idempotent test runs
    for (let r = 0; r < 2; r++) {
      await fetch(`${baseUrl}/api/recon/cron-morning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'recon-78130-2101s6',
          rotateBatch: true
        })
      });
    }

    console.log('\n✅ ALL 20 TIBERIUS RECON™ END-TO-END, SHOP DOSSIER PIPELINE, POST-PAY ONBOARDING, DAILY CARD ROTATION, RESEND/TWILIO WEBHOOK, MASTER A2P SCOUT SMS & CONVERSATION ROOM TESTS PASSED.');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
