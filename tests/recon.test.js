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
const net = require('node:net');
const { createReconServer } = require('../server');
const {
  SYNTHETIC_DEMO_PERMIT_NUMBERS,
  hasMirroringCadParcelId,
  isSyntheticDemoRecord,
  purgeSyntheticDemoPermits,
  getSqliteDb,
  recordSeenPermit,
  isPermitSeen,
  updateSeenPermitStatus,
  filterUnseenPermits,
  getSeenPermits,
  clearSeenPermits,
  extractSentence2FromDraft,
  extractCardPermitNumber,
  getPreTripHoldDispatch,
  setPreTripHoldDispatch,
  getPreTripAuditLogs,
  getCentralDateString,
  loadStore,
  saveStore,
  buildRealClientBriefingCards
} = require('../db/store');
const {
  runPreTripInspection,
  isProtectedVercelDeploymentUrl,
  normalizeFleetBaseUrl
} = require('../workers/pretrip-inspector');
const {
  formatPreTripEmailManifest,
  dispatchPreTripAdminSms,
  isFictionalEmailAddress,
  hasResolvableEmailDomain
} = require('../workers/comms-dispatcher');
const {
  buildLivePermitGreeting,
  resolvePermitValuation
} = require('../workers/live-zero-api-agent');

if (!process.env.TIBERIUS_LIVE_EMAIL_TEST) {
  process.env.TIBERIUS_TEST_SIMULATE_EMAIL = '1';
}

async function runTests() {
  clearSeenPermits();
  assert.strictEqual(isFictionalEmailAddress('mdelgado@gvconcretepaving.com'), true);
  assert.strictEqual(isFictionalEmailAddress('garrett@hillcountrystandingseam.com'), true);
  assert.strictEqual(isFictionalEmailAddress('grant@comalmep.com'), true);
  assert.strictEqual(isFictionalEmailAddress('chenderson@balconesflatwork.com'), true);
  assert.strictEqual(isFictionalEmailAddress('feedbackdaisy@gmail.com'), false);
  assert.strictEqual(isFictionalEmailAddress('feedbackdaisy+concrete@gmail.com'), false);
  assert.strictEqual(await hasResolvableEmailDomain('mdelgado@gvconcretepaving.com'), false);
  assert.strictEqual(await hasResolvableEmailDomain('feedbackdaisy@gmail.com'), true);
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
    assert.strictEqual(alertBriefingData.demoMode, false, 'Production briefing must not be in demoMode');
    assert.ok(
      alertBriefingData.briefing.cards.every((c) => !String(c.contactPhone || '').includes('555')),
      'A-lert Roof Systems cards must not contain 555 demo numbers'
    );
    assert.ok(
      alertBriefingData.briefing.cards.every((c) => !isSyntheticDemoRecord(c)),
      'Production briefing must never serve the 9 synthetic New Braunfels demo seed records (#BP-2026-06102 through #BP-2026-07189)'
    );

    console.log('[19/21] Testing Production Demo-Seed Purge, Empty-Queue Isolation & Gated ?demo=true 9-Card Matrix...');
    // Verify startup/explicit purge removes synthetic demo permits from SQLite & runtime store
    const storeForPurge = loadStore();
    const sqliteDb = getSqliteDb();
    assert.ok(sqliteDb, 'SQLite database must be initialized');
    sqliteDb
      .prepare(
        `INSERT OR REPLACE INTO briefing_deals (id, briefing_token, jurisdiction, permit_number, normalized_address, headline, contact_name, parcel_id, status)
         VALUES ('stale-demo-1', 'recon-78130-2101s6', '78130', 'BP-2026-06102', '2950 cold spring dr', 'Creekside Town Center Pad G', 'Wayne Lott', 'CAD-78130-6102', 'ready')`
      )
      .run();
    sqliteDb
      .prepare(
        `INSERT OR REPLACE INTO seen_permits (jurisdiction, permit_number, normalized_address, status)
         VALUES ('78130', 'BP-2026-06102', '2950 cold spring dr', 'surfaced')`
      )
      .run();

    const purgeResult = purgeSyntheticDemoPermits(storeForPurge);
    assert.strictEqual(purgeResult.ok, true);
    assert.ok(purgeResult.purgedSqlRows >= 2, 'Startup purge must delete synthetic demo rows from SQLite');
    const remainingStaleDeals = sqliteDb
      .prepare(`SELECT COUNT(*) AS cnt FROM briefing_deals WHERE permit_number IN (${SYNTHETIC_DEMO_PERMIT_NUMBERS.map(() => '?').join(',')})`)
      .get(...SYNTHETIC_DEMO_PERMIT_NUMBERS);
    assert.strictEqual(Number(remainingStaleDeals.cnt), 0, 'Zero synthetic demo rows may remain in briefing_deals');

    // Verify empty briefing queue with autoScrape=false does NOT auto-seed 9 static demo cards,
    // and with default autoScrape=true automatically scrapes 9 unseen live permits (never static demo cards)
    const liveStore = loadStore();
    const savedAlertCards = [...liveStore.briefings['recon-78130-2101s6'].cards];
    liveStore.briefings['recon-78130-2101s6'].cards = [];
    saveStore(liveStore);

    const emptyGetResp = await fetch(`${baseUrl}/api/recon/briefing?token=recon-78130-2101s6&autoScrape=false`);
    const emptyGetData = await emptyGetResp.json();
    assert.strictEqual(emptyGetData.ok, true);
    assert.strictEqual(
      emptyGetData.briefing.cards.length,
      0,
      'Empty briefing with autoScrape=false must return 0 cards, never auto-seeding demo cards'
    );

    const emptyPillResp = await fetch(`${baseUrl}/api/recon/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'recon-78130-2101s6',
        primaryTrade: 'Commercial Concrete',
        territoryZip: '78130',
        landmarkReference: '',
        autoScrape: false
      })
    });
    const emptyPillData = await emptyPillResp.json();
    assert.strictEqual(emptyPillData.ok, true);
    assert.strictEqual(
      emptyPillData.briefing.cards.length,
      0,
      'Clicking trade calibration pill with autoScrape=false must not fallback to 9 demo cards'
    );

    // Now verify default behavior (when no card would show): automatically scrapes 9 new unseen live permits!
    const autoScrapeResp = await fetch(`${baseUrl}/api/recon/briefing?token=recon-78130-2101s6`);
    const autoScrapeData = await autoScrapeResp.json();
    assert.strictEqual(autoScrapeData.ok, true);
    assert.strictEqual(
      autoScrapeData.briefing.cards.length,
      9,
      'When no card would show, production briefing must automatically scrape 9 new unseen live permits'
    );
    assert.ok(
      autoScrapeData.briefing.cards.every((c) => !isSyntheticDemoRecord(c)),
      'Auto-scraped live permits must never contain the 9 synthetic demo records'
    );

    // Verify Past Days Archive (?date=2026-10-31) returns archived past day's cards & historyDates list
    assert.ok(
      Array.isArray(autoScrapeData.historyDates) && autoScrapeData.historyDates.length >= 2,
      'Briefing response must include historyDates for viewing past days'
    );
    const pastDateResp = await fetch(
      `${baseUrl}/api/recon/briefing?token=recon-78130-2101s6&date=2026-10-31`
    );
    const pastDateData = await pastDateResp.json();
    assert.strictEqual(pastDateData.ok, true);
    assert.strictEqual(pastDateData.isHistoricalView, true, 'Requesting a past date must set isHistoricalView=true');
    assert.strictEqual(pastDateData.viewingDate, '2026-10-31');
    assert.strictEqual(pastDateData.briefing.cards.length, 9, 'Archived past date must return its 9 cards');
    assert.ok(
      pastDateData.briefing.cards.some((c) => c.approvalStatus === 'sent'),
      'Archived past date must preserve approvalStatus ("sent") of cards approved on that day'
    );

    // Restore live production cards for A-lert Roof Systems and reset trade to Roofing / Exteriors
    clearSeenPermits({ jurisdiction: '78130' });
    liveStore.briefings['recon-78130-2101s6'].cards = savedAlertCards;
    liveStore.contractors['44444444-5555-6666-7777-888888888888'].primaryTrade = 'Roofing / Exteriors';
    liveStore.briefings['recon-78130-2101s6'].tradeName = 'Roofing / Exteriors';
    saveStore(liveStore);

    // Now test explicit ?demo=true preview mode for the 9 New Braunfels demo permits & 5-Trade Matrix
    const demoBriefingResp = await fetch(
      `${baseUrl}/api/recon/briefing?token=recon-78130-2101s6&demo=true`
    );
    const demoBriefingData = await demoBriefingResp.json();
    assert.strictEqual(demoBriefingData.ok, true);
    assert.strictEqual(demoBriefingData.demoMode, true);

    const kbDossier = demoBriefingData.contractor.knowledgeBase;
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

    const cards = demoBriefingData.briefing.cards;
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

    // 2. Verify Sentence #1 persona-aware greeting & contact sanitization on ?demo=true cards (Cards 01-09)
    const card01 = cards.find((c) => c.cardNumber.includes('#BP-2026-06102')) || cards[0];
    assert.ok(
      card01.draftBody.includes('Hey Wayne & the Lott Brothers team — saw the commercial permit (#BP-2026-06102) filed for 2950 Cold Spring Dr in New Braunfels.'),
      `Unexpected Card 01 greeting: ${card01.draftBody}`
    );
    assert.ok(
      card01.contactMeta.includes('GC Office: Austin, TX | Jobsite: New Braunfels'),
      `Card 01 (512) contactMeta should distinguish Austin GC office vs New Braunfels jobsite: ${card01.contactMeta}`
    );

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

    // 4. Verify Landmark Override when NEARBY JOB LANDMARK (SENTENCE #2) is populated on live production cards
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
      landmarkOverrideData.briefing.cards.every((c) => !isSyntheticDemoRecord(c)),
      'Production landmark override must recalibrate live cards without introducing synthetic demo cards'
    );
    assert.ok(
      landmarkOverrideData.briefing.cards.every((c) =>
        c.draftBody.includes('two miles east off FM 306 & Hunter Rd')
      ),
      'Populating NEARBY JOB LANDMARK must inject the landmark phrase into Sentence #2 across all cards'
    );

    // 5. Verify 5-Trade × 9-Permit Matrix in resolvePermitScope (Sentence #3) + 4-Slot Trade-Agnostic Sentence #2 across all 5 Trade Calibration Pills (with demo: true)
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
          landmarkReference: '',
          demo: true
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
    const initialPermitNumbers = alertBriefingData.briefing.cards.map((c) => c.cardNumber);

    console.log('[20/21] Testing Daily Card Rotation + Cross-Day Deduplication (/api/recon/cron-morning)...');
    // 20. Verify Daily Card Rotation + 6:45 AM Sweep rotates A-lert Roof Systems to a fresh 9-card batch
    // with zero overlap against the previously surfaced batch in seen_permits
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
    assert.ok(
      rotateData.briefing.cards.every((c) => !isSyntheticDemoRecord(c)),
      'Rotated real client batch must never include synthetic demo permits'
    );
    assert.ok(
      rotateData.briefing.cards.every((c) => !initialPermitNumbers.includes(c.cardNumber)),
      'Cross-day rotation must never resurface permits already recorded in seen_permits'
    );

    // Verify Day 3 and Day 4+ rotation: once all 27 pre-built permits are in seen_permits,
    // Day 4 automatically scrapes 9 brand-new unseen live permits (#2026-10100 BP+) and archives each day
    const { rotateRealClientBriefing } = require('../db/store');
    const seenAcrossDays = new Set([
      ...initialPermitNumbers,
      ...rotateData.briefing.cards.map((c) => c.cardNumber)
    ]);
    const day3Rot = rotateRealClientBriefing({
      token: 'recon-78130-2101s6',
      briefingDate: '2026-11-04',
      advanceOffset: true
    });
    assert.strictEqual(day3Rot.ok, true);
    assert.strictEqual(day3Rot.briefing.cards.length, 9);
    day3Rot.briefing.cards.forEach((c) => {
      assert.ok(!seenAcrossDays.has(c.cardNumber), `Day 3 card ${c.cardNumber} must be unseen`);
      seenAcrossDays.add(c.cardNumber);
    });

    const day4Rot = rotateRealClientBriefing({
      token: 'recon-78130-2101s6',
      briefingDate: '2026-11-05',
      advanceOffset: true
    });
    assert.strictEqual(day4Rot.ok, true);
    assert.strictEqual(
      day4Rot.briefing.cards.length,
      9,
      'Day 4 (when pre-built pool is exhausted) must auto-scrape 9 new unseen live permits'
    );
    day4Rot.briefing.cards.forEach((c) => {
      assert.ok(!seenAcrossDays.has(c.cardNumber), `Day 4 auto-scraped card ${c.cardNumber} must be unseen`);
      assert.ok(!isSyntheticDemoRecord(c), 'Day 4 auto-scraped card must not be a synthetic demo record');
      seenAcrossDays.add(c.cardNumber);
    });

    // Verify Day 3 ('2026-11-04') was automatically archived and can be viewed via ?date=2026-11-04
    const archivedDay3Resp = await fetch(
      `${baseUrl}/api/recon/briefing?token=recon-78130-2101s6&date=2026-11-04`
    );
    const archivedDay3Data = await archivedDay3Resp.json();
    assert.strictEqual(archivedDay3Data.ok, true);
    assert.strictEqual(archivedDay3Data.isHistoricalView, true);
    assert.strictEqual(archivedDay3Data.viewingDate, '2026-11-04');
    assert.strictEqual(archivedDay3Data.briefing.cards.length, 9);
    assert.strictEqual(
      archivedDay3Data.briefing.cards[0].cardNumber,
      day3Rot.briefing.cards[0].cardNumber,
      'Viewing archived date 2026-11-04 must return the exact cards surfaced on 2026-11-04'
    );

    console.log('[21/21] Testing seen_permits SQLite Schema, Indexes, Address/Permit Deduplication & Status Transitions...');
    const schemaMasterRows = sqliteDb
      .prepare(
        `SELECT name, type FROM sqlite_master WHERE name IN ('seen_permits', 'idx_seen_permits_lookup', 'idx_seen_permits_address')`
      )
      .all();
    const schemaNames = schemaMasterRows.map((r) => r.name);
    assert.ok(schemaNames.includes('seen_permits'), 'seen_permits table must exist in SQLite');
    assert.ok(schemaNames.includes('idx_seen_permits_lookup'), 'idx_seen_permits_lookup index must exist');
    assert.ok(schemaNames.includes('idx_seen_permits_address'), 'idx_seen_permits_address index must exist');

    clearSeenPermits({ jurisdiction: '78130-TEST' });
    const firstRecord = recordSeenPermit({
      jurisdiction: '78130-TEST',
      permitNumber: '#BP-2026-99001',
      address: '1500 Industrial Parkway, New Braunfels, TX 78130',
      surfacedBriefingDate: '2026-11-01',
      status: 'surfaced'
    });
    assert.ok(firstRecord, 'recordSeenPermit must insert and return row');
    assert.strictEqual(firstRecord.permit_number, 'BP-2026-99001');
    assert.strictEqual(firstRecord.status, 'surfaced');
    assert.strictEqual(
      isPermitSeen({ jurisdiction: '78130-TEST', permitNumber: 'BP-2026-99001' }),
      true,
      'Permit must be marked seen by (jurisdiction, permit_number)'
    );
    assert.strictEqual(
      isPermitSeen({
        jurisdiction: '78130-TEST',
        permitNumber: 'BP-2026-OTHER',
        address: '1500 Industrial Pkwy, New Braunfels, TX 78130'
      }),
      true,
      'Permit must also be deduplicated by normalized_address ("Parkway" -> "pkwy")'
    );

    // Verify filterUnseenPermits excludes already-seen permits on consecutive day and surfaces only new ones
    const day2Candidates = [
      {
        permitNum: '#BP-2026-99001',
        address: '1500 Industrial Pkwy, New Braunfels, TX 78130',
        headline: 'Duplicate Permit From Day 1'
      },
      {
        permitNum: '#BP-2026-99002',
        address: '2800 Loop 337, New Braunfels, TX 78130',
        headline: 'Brand New Day 2 Permit'
      }
    ];
    const unseenDay2 = filterUnseenPermits(day2Candidates, {
      jurisdiction: '78130-TEST',
      surfacedBriefingDate: '2026-11-02',
      markAsSurfaced: true
    });
    assert.strictEqual(unseenDay2.length, 1, 'Only unseen permit should survive deduplication');
    assert.strictEqual(unseenDay2[0].permitNum, '#BP-2026-99002');

    // Verify status transitions: surfaced -> approved -> dismissed
    const approvedRow = updateSeenPermitStatus({
      jurisdiction: '78130-TEST',
      permitNumber: 'BP-2026-99002',
      status: 'approved'
    });
    assert.strictEqual(approvedRow.status, 'approved');

    // Re-seeing an approved permit as 'surfaced' during a scrape must NOT downgrade its 'approved' status
    const reseenApproved = recordSeenPermit({
      jurisdiction: '78130-TEST',
      permitNumber: 'BP-2026-99002',
      status: 'surfaced'
    });
    assert.strictEqual(
      reseenApproved.status,
      'approved',
      'Re-scraping an approved permit must preserve status="approved"'
    );

    // Dismissing a card via /api/recon/approve updates seen_permits.status = 'dismissed'
    const dismissResp = await fetch(`${baseUrl}/api/recon/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'recon-78130-2101s6',
        action: 'dismiss-card',
        cardId: 'deal-1'
      })
    });
    const dismissData = await dismissResp.json();
    assert.strictEqual(dismissData.ok, true);
    assert.strictEqual(dismissData.card.approvalStatus, 'dismissed');
    const dismissedLedgerRows = getSeenPermits({ jurisdiction: '78130', status: 'dismissed' });
    assert.ok(dismissedLedgerRows.length >= 1, 'Dismissing a card must record status="dismissed" in seen_permits');

    console.log('[22/25] Testing 5:30 AM Pre-Trip Inspector Check 1 (Seed & Canary Contamination Auto-Purge)...');
    clearSeenPermits();
    // Inject synthetic demo card (BP-2026-06102 + Wayne Lott) AND a canary mirroring CAD parcel card (Permit #2026-099124 + CAD-78130-9124)
    sqliteDb
      .prepare(
        `INSERT OR REPLACE INTO briefing_deals (briefing_token, briefing_date, permit_number, card_json) VALUES (?, ?, ?, ?)`
      )
      .run(
        'recon-78130-2101s6',
        '2026-11-02',
        'BP-2026-06102',
        JSON.stringify({
          id: 'deal-contaminated-1',
          cardNumber: 'CARD 01 • PERMIT #BP-2026-06102',
          contactName: 'Wayne Lott • Lott Brothers Construction',
          cadCallout: 'Comal CAD Parcel #CAD-78130-6102'
        })
      );

    const storeBeforeCheck1 = loadStore();
    storeBeforeCheck1.briefings['recon-78130-2101s6'].briefingDate = getCentralDateString();
    storeBeforeCheck1.briefings['recon-78130-2101s6'].cards[0] = {
      ...storeBeforeCheck1.briefings['recon-78130-2101s6'].cards[0],
      cardNumber: 'CARD 01 • PERMIT #BP-2026-06102',
      contactName: 'Wayne Lott • Lott Brothers Construction',
      cadCallout: 'Comal CAD Parcel #CAD-78130-6102'
    };
    storeBeforeCheck1.briefings['recon-78130-2101s6'].cards[1] = {
      ...storeBeforeCheck1.briefings['recon-78130-2101s6'].cards[1],
      cardNumber: 'CARD 02 • PERMIT #2026-099124 BP',
      cadCallout: 'Comal CAD Parcel #CAD-78130-9124 • $650,000 Valuation',
      cadDetails: { parcelId: 'CAD-78130-9124' }
    };
    assert.strictEqual(
      hasMirroringCadParcelId(storeBeforeCheck1.briefings['recon-78130-2101s6'].cards[1]),
      true,
      'hasMirroringCadParcelId must detect CAD-xxxxx-yyyy where yyyy mirrors last 4 digits of permit'
    );
    saveStore(storeBeforeCheck1);

    const preTripHeal1 = await runPreTripInspection({
      token: 'recon-78130-2101s6',
      baseUrl,
      simulateComms: true
    });
    assert.strictEqual(preTripHeal1.overallStatus, 'AUTO_HEALED', 'Check 1 contamination must trigger AUTO_HEALED');
    assert.strictEqual(preTripHeal1.holdDispatch, false, 'Auto-healed queue must not lock 6:45 AM dispatch');
    const check1Result = preTripHeal1.checks.find((c) => c.id === 'seed_and_canary_scan');
    assert.strictEqual(check1Result.status, 'AUTO_HEALED');
    assert.ok(preTripHeal1.heals.length >= 1, 'heals[] must log the Check 1 auto-purge');

    // Verify SQLite & active briefing cards are now 100% free of BP-2026-06102, Wayne Lott, and mirroring CAD-78130-9124
    const remainingSqlCanary = sqliteDb
      .prepare(`SELECT COUNT(*) AS cnt FROM briefing_deals WHERE permit_number = 'BP-2026-06102'`)
      .get();
    assert.strictEqual(remainingSqlCanary.cnt, 0, 'BP-2026-06102 must be purged from SQLite briefing_deals');
    const storeAfterCheck1 = loadStore();
    const cleanedCards1 = storeAfterCheck1.briefings['recon-78130-2101s6'].cards;
    assert.strictEqual(cleanedCards1.length, 9, 'Briefing must be replenished back to 9 clean cards');
    assert.ok(
      cleanedCards1.every((c) => !isSyntheticDemoRecord(c) && !hasMirroringCadParcelId(c)),
      'Zero synthetic or canary mirroring CAD cards may remain after Check 1 Auto-Heal'
    );

    console.log('[23/25] Testing Pre-Trip Check 2 (Prior-Day seen_permits Duplicate Removal & Live Replenishment) + Check 3 (Sentence #2 Proof Rotation)...');
    const storeBeforeCheck2 = loadStore();
    const targetBriefing2 = storeBeforeCheck2.briefings['recon-78130-2101s6'];
    targetBriefing2.briefingDate = getCentralDateString();
    const card0Permit = extractCardPermitNumber(targetBriefing2.cards[0]);
    const card1Permit = extractCardPermitNumber(targetBriefing2.cards[1]);

    // Mark card 0 and card 1 as already surfaced on a PRIOR date ('2026-10-30') in seen_permits
    sqliteDb
      .prepare(
        `UPDATE seen_permits SET surfaced_briefing_date = '2026-10-30' WHERE jurisdiction = '78130' AND permit_number IN (?, ?)`
      )
      .run(card0Permit, card1Permit);

    saveStore(storeBeforeCheck2);

    const preTripHeal2 = await runPreTripInspection({
      token: 'recon-78130-2101s6',
      baseUrl,
      simulateComms: true
    });
    assert.strictEqual(preTripHeal2.overallStatus, 'AUTO_HEALED');
    const check2Res = preTripHeal2.checks.find((c) => c.id === 'day_over_day_duplicate_check');
    assert.strictEqual(check2Res.status, 'AUTO_HEALED', 'Check 2 must auto-heal prior-day duplicate permits');

    const storeAfterCheck2 = loadStore();
    const healedCards2 = storeAfterCheck2.briefings['recon-78130-2101s6'].cards;
    assert.strictEqual(healedCards2.length, 9, 'Replenished queue must have 9 cards');
    const healedPermitNums = healedCards2.map((c) => extractCardPermitNumber(c));
    assert.ok(
      !healedPermitNums.includes(card0Permit) && !healedPermitNums.includes(card1Permit),
      'Prior-day duplicate permits must be removed and replaced with fresh unseen permits'
    );

    // Now force cards 2 and 3 to share an identical Sentence #2 string to verify Check 3 proof rotation auto-heal
    storeAfterCheck2.briefings['recon-78130-2101s6'].cards[3].draftBody =
      storeAfterCheck2.briefings['recon-78130-2101s6'].cards[2].draftBody;
    saveStore(storeAfterCheck2);

    const preTripHeal2And3 = await runPreTripInspection({
      token: 'recon-78130-2101s6',
      baseUrl,
      simulateComms: true
    });
    assert.strictEqual(preTripHeal2And3.overallStatus, 'AUTO_HEALED');
    const check3Res = preTripHeal2And3.checks.find((c) => c.id === 'sentence2_repetition_check');
    assert.strictEqual(check3Res.status, 'AUTO_HEALED', 'Check 3 must auto-rotate duplicate Sentence #2 proof strings');

    const storeAfterCheck3 = loadStore();
    const healedCards3 = storeAfterCheck3.briefings['recon-78130-2101s6'].cards;
    const s2Set = new Set(healedCards3.map((c) => extractSentence2FromDraft(c.draftBody).toLowerCase()));
    assert.strictEqual(
      s2Set.size,
      healedCards3.length,
      'Every card in the healed briefing must have a 100% unique Sentence #2 proof-point string'
    );

    // Running Pre-Trip again immediately after healing must return clean PASS
    const preTripCleanPass = await runPreTripInspection({
      token: 'recon-78130-2101s6',
      baseUrl,
      simulateComms: true
    });
    assert.strictEqual(preTripCleanPass.overallStatus, 'PASS', 'Clean queue must pass Pre-Trip with PASS');
    assert.strictEqual(preTripCleanPass.holdDispatch, false);
    assert.strictEqual(preTripCleanPass.heals.length, 0);
    assert.strictEqual(preTripCleanPass.failures.length, 0);
    assert.strictEqual(preTripCleanPass.agRepairPrompt, null);

    // Verify Vercel Cron protected deployment-hash URL normalization (prevents HTTP 401 on *-tiberius-projects-*.vercel.app)
    assert.strictEqual(
      isProtectedVercelDeploymentUrl(
        'https://tiberius-recon-7lhd3lout-tiberius-projects-d57bebb2.vercel.app'
      ),
      true,
      'Must identify Vercel deployment-hash preview URLs gated by Vercel Deployment Protection'
    );
    assert.strictEqual(
      isProtectedVercelDeploymentUrl('https://www.tiberius.ai'),
      false,
      'Public production domain must not be flagged as protected Vercel deployment URL'
    );
    assert.strictEqual(
      normalizeFleetBaseUrl(
        'https://tiberius-recon-7lhd3lout-tiberius-projects-d57bebb2.vercel.app'
      ),
      'https://www.tiberius.ai',
      'Protected Vercel deployment-hash URL must normalize to https://www.tiberius.ai'
    );

    console.log('[24/25] Testing Pre-Trip Check 5 RED_TAGGED, Antigravity Repair Prompt & 6:45 AM Circuit Breaker Lock on /api/recon/cron-morning...');
    const redTagReport = await runPreTripInspection({
      token: 'recon-78130-2101s6',
      baseUrl,
      simulateEndpointFailure: 'https://newbraunfelsinsider.com/health-check-probe',
      simulateComms: true
    });
    assert.strictEqual(redTagReport.overallStatus, 'RED_TAGGED', 'Unhealed check failure must set overallStatus = RED_TAGGED');
    assert.strictEqual(redTagReport.holdDispatch, true, 'RED_TAGGED must engage holdDispatch = true');
    assert.strictEqual(getPreTripHoldDispatch(), true, 'SQLite system_state pretrip_hold_dispatch must be true');
    assert.ok(
      typeof redTagReport.agRepairPrompt === 'string' &&
        redTagReport.agRepairPrompt.includes('Antigravity Emergency Repair Task') &&
        redTagReport.agRepairPrompt.includes('Check 4: Fleet Endpoint & Webhook Smoke Probe') &&
        redTagReport.agRepairPrompt.includes('server.js'),
      'RED_TAGGED report must include a ready-to-paste agRepairPrompt naming the failing check and suspect files'
    );

    // Verify 6:45 AM Circuit Breaker blocks /api/recon/cron-morning when pretrip_hold_dispatch is true
    const blockedCronResp = await fetch(`${baseUrl}/api/recon/cron-morning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(blockedCronResp.status, 423, 'Locked circuit breaker must return HTTP 423 Locked on /api/recon/cron-morning');
    const blockedCronData = await blockedCronResp.json();
    assert.strictEqual(blockedCronData.ok, false);
    assert.strictEqual(blockedCronData.blockedByCircuitBreaker, true);
    assert.strictEqual(blockedCronData.holdDispatch, true);

    const auditLogs = getPreTripAuditLogs();
    assert.ok(
      auditLogs.some((entry) => entry.event === 'CIRCUIT_BREAKER_BLOCKED_645AM_DISPATCH'),
      'Blocked 6:45 AM cron dispatch must be recorded in the Pre-Trip audit trail'
    );

    // Clear the Hold Lock via POST /api/recon/pretrip { action: 'clear_hold' } and verify /api/recon/cron-morning succeeds
    const clearHoldResp = await fetch(`${baseUrl}/api/recon/pretrip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_hold' })
    });
    const clearHoldData = await clearHoldResp.json();
    assert.strictEqual(clearHoldData.ok, true);
    assert.strictEqual(clearHoldData.holdDispatch, false);
    assert.strictEqual(getPreTripHoldDispatch(), false);

    console.log('[25/25] Testing 5:35 AM Resend Pre-Trip Manifest Email & Master Twilio SMS Alert Formatting...');
    const passEmail = formatPreTripEmailManifest(preTripCleanPass);
    const healEmail = formatPreTripEmailManifest(preTripHeal2And3);
    const redTagEmail = formatPreTripEmailManifest(redTagReport);

    assert.ok(passEmail.subject.startsWith('[🟢 PRE-TRIP PASS]'), 'PASS email subject must start with [🟢 PRE-TRIP PASS]');
    assert.ok(healEmail.subject.startsWith('[🟡 PRE-TRIP AUTO-HEALED]'), 'AUTO_HEALED email subject must start with [🟡 PRE-TRIP AUTO-HEALED]');
    assert.ok(
      redTagEmail.subject.startsWith('[🔴 PRE-TRIP RED-TAG — 6:45 AM HELD]'),
      'RED_TAGGED email subject must start with [🔴 PRE-TRIP RED-TAG — 6:45 AM HELD]'
    );
    assert.ok(
      redTagEmail.text.includes(redTagReport.agRepairPrompt) &&
        redTagEmail.html.includes('Antigravity Emergency Repair Task'),
      'RED_TAGGED email HTML & plain-text bodies must contain the copy-pasteable agRepairPrompt block'
    );

    const healSms = await dispatchPreTripAdminSms({
      report: preTripHeal2And3,
      baseUrl: 'https://www.tiberius.ai',
      simulateOnly: true
    });
    assert.strictEqual(healSms.ok, true);
    assert.ok(
      healSms.smsBody.includes('[PRE-TRIP AUTO-HEALED]') &&
        healSms.smsBody.includes('https://www.tiberius.ai/recon/admin'),
      'Auto-Healed SMS must summarize heals and link straight to /recon/admin'
    );

    const redTagSms = await dispatchPreTripAdminSms({
      report: redTagReport,
      baseUrl: 'https://www.tiberius.ai',
      simulateOnly: true
    });
    assert.strictEqual(redTagSms.ok, true);
    assert.ok(
      redTagSms.smsBody.includes('[PRE-TRIP RED-TAG]') &&
        redTagSms.smsBody.includes('6:45 AM Dispatch HELD') &&
        redTagSms.smsBody.includes('https://www.tiberius.ai/recon/admin'),
      'Red-Tagged SMS must warn that 6:45 AM Dispatch is HELD and link straight to /recon/admin'
    );

    console.log('[26/26] Testing Full-Account Live Permit Pull (78130 Territory Match, Zero Locked Vault, No $0 Permits, Role-Title Greeting & Persistent Archive Section)...');
    // 1. Verify greeting fallback for generic role titles ("Project Manager", "Preconstruction Desk", "Estimating Team")
    assert.strictEqual(
      buildLivePermitGreeting('Project Manager', 'SpawGlass Contractors Inc'),
      'Hey SpawGlass team —',
      'Project Manager must greet as "Hey [Company] team —", never "Hey Project —"'
    );
    assert.strictEqual(
      buildLivePermitGreeting('Preconstruction Desk', 'Joeris General Contractors'),
      'Hey Joeris team —',
      'Preconstruction Desk must greet as "Hey [Company] team —"'
    );
    assert.strictEqual(
      buildLivePermitGreeting('Estimating Team', 'Bartlett Cocke GC'),
      'Hey Bartlett Cocke GC team —',
      'Estimating Team must greet as "Hey [Company] team —"'
    );
    assert.strictEqual(
      buildLivePermitGreeting('Ryan Ogle', 'SpawGlass Contractors Inc'),
      'Hey Ryan —',
      'Named contact must still greet by first name'
    );

    // 2. Verify $0 permit valuation resolution & square-footage estimation
    const zeroValWithSqFt = resolvePermitValuation(
      { total_job_valuation: '0', total_valuation_remodel: '0', total_new_add_sqft: '18000' },
      150000
    );
    assert.ok(
      zeroValWithSqFt.valuation >= 150000 && zeroValWithSqFt.isEstimated === true,
      'Unvalued commercial sq-ft permit with "0" valuation must estimate valuation from sq ft instead of returning $0'
    );
    const zeroValNoSqFt = resolvePermitValuation(
      { total_job_valuation: '0', total_valuation_remodel: 0, total_new_add_sqft: 0 },
      150000
    );
    assert.strictEqual(
      zeroValNoSqFt.valuation,
      0,
      'Permit with $0 valuation and 0 sq ft must return 0 so it is filtered out'
    );

    // 3. Verify clicking Pull Real Live Permits (/api/recon/live-agent) on a 78130 full account:
    //    - Returns 9 unlocked cards (0 locked overflow cards)
    //    - Preserves 78130 / New Braunfels & Comal CAD territory (never overwrites with Austin AB+C / TCAD)
    //    - Contains zero "$0 PERMIT" strings and zero "Hey Project —" greetings
    //    - Preserves archivedBriefings and historyDates for the bottom Archived section
    const livePull78130Resp = await fetch(`${baseUrl}/api/recon/live-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'recon-78130-2101s6',
        primaryTrade: 'Roofing / Exteriors',
        territoryZip: '78130',
        landmarkReference: ''
      })
    });
    const livePull78130Data = await livePull78130Resp.json();
    assert.strictEqual(livePull78130Data.ok, true);
    assert.strictEqual(livePull78130Data.briefing.territoryZip, '78130');
    assert.ok(
      /New Braunfels/i.test(livePull78130Data.briefing.metroCity),
      `Expected New Braunfels metroCity after live pull on 78130, got: ${livePull78130Data.briefing.metroCity}`
    );
    assert.ok(
      /Comal/i.test(livePull78130Data.briefing.countyCad),
      `Expected Comal CAD after live pull on 78130, got: ${livePull78130Data.briefing.countyCad}`
    );
    assert.strictEqual(
      livePull78130Data.briefing.cards.length,
      9,
      'Full account live permit pull must return all 9 qualifying unseen permits'
    );
    assert.strictEqual(
      livePull78130Data.briefing.cards.filter((c) => c.isLockedOverflow).length,
      0,
      'Full account live permit pull must have 0 locked overflow cards'
    );
    for (const card of livePull78130Data.briefing.cards) {
      assert.ok(
        !/\$0\s+PERMIT/i.test(card.pillText),
        `Card ${card.cardNumber} must never display "$0 PERMIT": ${card.pillText}`
      );
      assert.ok(
        !/Hey\s+Project\b/i.test(card.draftBody),
        `Card ${card.cardNumber} must never greet as "Hey Project": ${card.draftBody}`
      );
    }
    assert.ok(
      Array.isArray(livePull78130Data.archivedBriefings) &&
        livePull78130Data.archivedBriefings.length >= 2,
      'Live permit pull response must keep archivedBriefings populated with past days cards'
    );

    const briefingPageResp = await fetch(`${baseUrl}/briefing`);
    const briefingPageHtml = await briefingPageResp.text();
    assert.ok(
      briefingPageHtml.includes('id="briefing-archived-section"') &&
        briefingPageHtml.includes('id="briefing-history-bar"') &&
        briefingPageHtml.includes('v2.6'),
      'briefing.html must render #briefing-archived-section, #briefing-history-bar, and v2.6'
    );

    console.log('[27/27] Testing Tiberius Meta-Recon™ Autonomous Lead-Gen, 3-Leak Website X-Ray, Trojan Horse Permit Bait, Anti-AI Copy Gate, Drip Runner & Autonomous Reply Fulfilment...');
    const { verifyAntiAiCopyGate } = require('../workers/drafting/tiberius-meta-drafter');

    // 1. Sweep prospects across all corridors via POST /api/recon/meta-outreach
    const metaSweepResp = await fetch(`${baseUrl}/api/recon/meta-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sweep',
        zipCode: 'ALL',
        primaryTrade: 'ALL',
        playbook: 'FULL_BUNDLE_OFFENSE_DEFENSE'
      })
    });
    const metaSweepData = await metaSweepResp.json();
    assert.strictEqual(metaSweepData.ok, true);
    assert.ok(
      metaSweepData.metaRecon && Array.isArray(metaSweepData.metaRecon.prospects),
      'Meta-Recon sweep must return enriched prospects array'
    );
    assert.strictEqual(metaSweepData.metaRecon.prospects.length, 6);
    assert.strictEqual(
      metaSweepData.metaRecon.metrics.antiAiGatePassRate,
      '100%',
      'All generated 4-touch sequences must pass the Anti-AI Copy Gate'
    );

    // 2. Verify each prospect has 3-Leak X-Ray, Revenue Math, 3 Bait Permits, 4 Touches, and a live playable Preview Briefing
    const firstProspect = metaSweepData.metaRecon.prospects[0];
    assert.ok(firstProspect.previewToken && firstProspect.previewToken.startsWith('preview-'));
    assert.strictEqual(firstProspect.siteLeakXRay.leaks.length, 3, 'Must detect 3 website conversion/SEO leaks');
    assert.ok(
      firstProspect.siteLeakXRay.revenueMath.estimatedMonthlyLeakDollars > 5000,
      'Must calculate monthly owner leaked revenue math'
    );
    assert.strictEqual(firstProspect.baitPermits.length, 3, 'Must pair 3 real unseen permits as Trojan Horse bait');
    assert.strictEqual(firstProspect.touches.length, 4, 'Must generate a 4-touch sequence (Day 0, 3, 7, 14)');
    assert.strictEqual(firstProspect.copyGate.passed, true);
    assert.strictEqual(firstProspect.copyGate.hasLinksInTouch1, false, 'Touch 1 must have 0 links to protect inbox placement');

    // Verify the auto-provisioned Preview Briefing works live via GET /api/recon/briefing?token=<previewToken>
    const previewBriefingResp = await fetch(
      `${baseUrl}/api/recon/briefing?token=${encodeURIComponent(firstProspect.previewToken)}`
    );
    const previewBriefingData = await previewBriefingResp.json();
    assert.strictEqual(previewBriefingData.ok, true);
    assert.strictEqual(previewBriefingData.contractor.companyName, firstProspect.companyName);
    assert.strictEqual(previewBriefingData.briefing.cards.length, 9);
    assert.strictEqual(
      previewBriefingData.briefing.cards.filter((c) => !c.isLockedOverflow).length,
      3,
      'Prospect preview briefing must show 3 unlocked live permits and 6 locked overflow permits'
    );

    // 3. Verify Anti-AI Copy Gate catches banned AI phrases and links in Touch 1 when injected
    const badCopyCheck = verifyAntiAiCopyGate({
      touches: [
        {
          touchNumber: 1,
          subject: 'Quick note — Game-Changer',
          body: 'I hope this email finds you well! Check https://tiberius.ai to unlock the power of AI.'
        },
        {
          touchNumber: 2,
          subject: 're: note',
          body: 'Just checking in and bumping this to the top of your inbox.'
        }
      ],
      prospect: firstProspect,
      baitPermit: firstProspect.baitPermits[0]
    });
    assert.strictEqual(badCopyCheck.passed, false, 'Anti-AI Copy Gate must reject AI clichés and links in Touch 1');
    assert.strictEqual(badCopyCheck.hasLinksInTouch1, true);
    assert.ok(badCopyCheck.violations.length >= 4);

    // 4. Verify Native SIM SMS handoff & Autonomous Drip Batch Runner
    const simSmsResp = await fetch(`${baseUrl}/api/recon/meta-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_touch',
        prospectId: firstProspect.id,
        touchNumber: 1,
        channel: 'NATIVE_SIM_SMS'
      })
    });
    const simSmsData = await simSmsResp.json();
    assert.strictEqual(simSmsData.ok, true);
    assert.ok(
      simSmsData.nativeSimUri.startsWith('sms:+18306254810?body='),
      `Expected Native SIM sms: URI for prospect, got: ${simSmsData.nativeSimUri}`
    );

    const dripResp = await fetch(`${baseUrl}/api/recon/meta-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'run_drip_batch',
        touchNumber: 1,
        maxBatchSize: 3
      })
    });
    const dripData = await dripResp.json();
    assert.strictEqual(dripData.ok, true);
    assert.strictEqual(dripData.dispatchedCount, 3, 'Autonomous Drip Batch must dispatch to 3 remaining eligible prospects');

    // 5. Verify Inbound Prospect Reply via /api/webhooks/resend (addressed to reply+tiberius-hq+<prospectId>@inbound.tiberius.ai)
    //    classifies positive permission ("Yes, send over the packet!"), halts Touch 2-4 follow-ups,
    //    and autonomously dispatches the prospect's live Preview Briefing link!
    const webhookReplyResp = await fetch(`${baseUrl}/api/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${firstProspect.contactName} <${firstProspect.email}>`,
        to: `reply+tiberius-hq+${firstProspect.id}@inbound.tiberius.ai`,
        subject: `Re: ${firstProspect.touches[0].subject}`,
        text: 'Yes, send over the 3-permit packet and the site breakdown!'
      })
    });
    const webhookReplyData = await webhookReplyResp.json();
    assert.strictEqual(webhookReplyData.ok, true);
    assert.strictEqual(webhookReplyData.classification.intent, 'POSITIVE_SEND_DEMO');
    assert.strictEqual(webhookReplyData.prospect.outreachStatus, 'DEMO_SENT_HOT_LEAD');
    assert.ok(
      webhookReplyData.autoFulfilmentReceipt && webhookReplyData.autoFulfilmentReceipt.ok,
      'Autonomous Fulfilment Agent must send the live Preview Briefing link via Resend'
    );
    assert.ok(
      webhookReplyData.founderHotSmsReceipt && webhookReplyData.founderHotSmsReceipt.ok,
      'Must fire Master Twilio Hot-Reply SMS alert to founder cell'
    );
    assert.ok(
      webhookReplyData.prospect.touches
        .slice(1)
        .every((t) => t.status === 'HALTED_ON_REPLY'),
      'Unsent cold follow-up touches (Touches 2–4) must be halted immediately upon prospect reply'
    );

    const commandPageResp = await fetch(`${baseUrl}/command`);
    const commandPageHtml = await commandPageResp.text();
    assert.ok(
      commandPageHtml.includes('id="meta-recon-module"') &&
        commandPageHtml.includes('TIBERIUS META-RECON™'),
      'command.html must render #meta-recon-module (Module 04: Tiberius Meta-Recon)'
    );

    console.log('[28/28] Testing Standalone Loom-Style Video Player (/watch & /api/recon/watch), 3-Mode Personalizer & 3% + 97% AI Stitch Engine...');
    const watchPageResp = await fetch(`${baseUrl}/recon/watch`);
    assert.strictEqual(watchPageResp.status, 200, 'Expected 200 for /recon/watch');
    const watchPageHtml = await watchPageResp.text();
    assert.ok(
      watchPageHtml.includes('id="loom-player-stage"') &&
        watchPageHtml.includes('id="loom-main-video"') &&
        watchPageHtml.includes('id="loom-avatar-bubble"') &&
        watchPageHtml.includes('id="loom-studio-drawer"'),
      'watch.html must render standalone Loom theater player, circular speaker bubble, and studio drawer'
    );

    // Mode 1: Pure Pre-Made Video (No Personalization)
    const watchStandardResp = await fetch(`${baseUrl}/api/recon/watch`);
    const watchStandardData = await watchStandardResp.json();
    assert.strictEqual(watchStandardData.ok, true);
    assert.strictEqual(watchStandardData.mode, 'PREMADE_STANDARD');
    assert.strictEqual(watchStandardData.isPersonalized, false);
    assert.strictEqual(watchStandardData.player.masterVideoUrl, '/recon/video/TIBERIUS%20RECON.mp4');

    // Mode 2: Personalized Prospect Wrapper (?token=preview-...)
    const watchProspectResp = await fetch(
      `${baseUrl}/api/recon/watch?token=${encodeURIComponent(firstProspect.previewToken)}`
    );
    const watchProspectData = await watchProspectResp.json();
    assert.strictEqual(watchProspectData.ok, true);
    assert.strictEqual(watchProspectData.mode, 'PERSONALIZED_WRAPPER');
    assert.strictEqual(watchProspectData.isPersonalized, true);
    assert.strictEqual(watchProspectData.prospect.companyName, firstProspect.companyName);
    assert.strictEqual(watchProspectData.sidebarPermits.length, 3);

    // Mode 3: 3% AI Intro + 97% Master Video Stitch Generation & Save
    const genIntroResp = await fetch(`${baseUrl}/api/recon/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_ai_intro',
        companyName: firstProspect.companyName,
        contactName: firstProspect.contactName,
        territoryZip: firstProspect.zipCode,
        tradeName: firstProspect.primaryTrade
      })
    });
    const genIntroData = await genIntroResp.json();
    assert.strictEqual(genIntroData.ok, true);
    assert.strictEqual(genIntroData.mode, 'AI_STITCH_3_97');
    assert.ok(genIntroData.introScript.includes('Marcus'));
    assert.ok(genIntroData.introAudioUrl.includes('/recon/voiceovers/'));

    const saveWatchResp = await fetch(`${baseUrl}/api/recon/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_watch_config',
        mode: 'AI_STITCH_3_97',
        token: firstProspect.previewToken,
        companyName: firstProspect.companyName,
        contactName: firstProspect.contactName,
        territoryZip: firstProspect.zipCode,
        tradeName: firstProspect.primaryTrade,
        introScript: genIntroData.introScript,
        introAudioUrl: genIntroData.introAudioUrl
      })
    });
    const saveWatchData = await saveWatchResp.json();
    assert.strictEqual(saveWatchData.ok, true);
    assert.strictEqual(saveWatchData.watch.mode, 'AI_STITCH_3_97');
    assert.ok(saveWatchData.shareUrl.includes('/recon/watch?token='));

    // Track Video Play Telemetry
    const trackPlayResp = await fetch(`${baseUrl}/api/recon/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_event',
        videoId: saveWatchData.videoId,
        token: firstProspect.previewToken,
        companyName: firstProspect.companyName,
        contactName: firstProspect.contactName,
        eventType: 'VIDEO_PLAYED'
      })
    });
    const trackPlayData = await trackPlayResp.json();
    assert.strictEqual(trackPlayData.ok, true);
    assert.ok(
      trackPlayData.founderAlertReceipt && trackPlayData.founderAlertReceipt.ok,
      'Playing a personalized preview video must trigger founder hot-alert SMS receipt'
    );

    console.log('[29/29] Testing Contractor & Master Admin Self-Service Profile, Username, Email & Password Updates...');
    // 1. Activate a test contractor account to test self-service profile & password updates
    const profileTestEmail = 'profiletest@sanantonioroofing.com';
    const profileActivateResp = await fetch(`${baseUrl}/api/recon/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'San Antonio Commercial Roofing',
        ownerName: 'Marcus Vance',
        workEmail: profileTestEmail,
        mobilePhone: '(210) 884-2910',
        territoryZip: '78205',
        primaryTrade: 'Roofing / Exteriors',
        password: 'InitialPassword2026!',
        pin: '78205'
      })
    });
    const profileActivateData = await profileActivateResp.json();
    assert.strictEqual(profileActivateData.ok, true);
    const contractorSessionToken = profileActivateData.sessionToken;
    const contractorIdForTest = profileActivateData.contractor.id;

    // 2. Contractor self-service profile & password update via POST /api/recon/auth (action: 'update_profile')
    const selfUpdateResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${contractorSessionToken}`
      },
      body: JSON.stringify({
        action: 'update_profile',
        username: 'marcus_vance_sa',
        ownerName: 'Marcus J. Vance',
        companyName: 'San Antonio Premier Commercial Roofing',
        workEmail: profileTestEmail,
        mobilePhone: '(210) 884-9999',
        accessPin: '9999',
        currentPassword: 'InitialPassword2026!',
        newPassword: 'UpdatedContractorPass2026!'
      })
    });
    const selfUpdateData = await selfUpdateResp.json();
    assert.strictEqual(selfUpdateData.ok, true, 'Contractor self-service profile & password update should succeed');
    assert.strictEqual(selfUpdateData.passwordChanged, true);
    assert.strictEqual(selfUpdateData.account.username, 'marcus_vance_sa');
    assert.strictEqual(selfUpdateData.account.ownerName, 'Marcus J. Vance');
    assert.strictEqual(selfUpdateData.account.companyName, 'San Antonio Premier Commercial Roofing');
    assert.strictEqual(selfUpdateData.account.mobilePhone, '(210) 884-9999');
    assert.strictEqual(selfUpdateData.account.accessPin, '9999');
    assert.ok(selfUpdateData.sessionToken, 'Updated sessionToken must be returned');

    // Verify login with old password fails, and login with new username + newPassword succeeds
    const oldPassLoginResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'marcus_vance_sa',
        secret: 'InitialPassword2026!'
      })
    });
    assert.strictEqual(oldPassLoginResp.status, 401, 'Old password must be rejected after password change');

    const newUsernameLoginResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'marcus_vance_sa',
        secret: 'UpdatedContractorPass2026!'
      })
    });
    const newUsernameLoginData = await newUsernameLoginResp.json();
    assert.strictEqual(newUsernameLoginData.ok, true, 'Contractor must be able to sign in with new username and new password');
    assert.strictEqual(newUsernameLoginData.account.id, contractorIdForTest);

    // 3. Master Admin self-service profile & password update via POST /api/recon/admin (action: 'update_admin_profile')
    const adminLoginForProfileResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'admin@tiberius.ai',
        secret: 'TiberiusAdmin2026!'
      })
    });
    const adminLoginForProfileData = await adminLoginForProfileResp.json();
    assert.strictEqual(adminLoginForProfileData.ok, true);
    const adminSessionToken = adminLoginForProfileData.sessionToken;

    const adminUpdateResp = await fetch(`${baseUrl}/api/recon/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSessionToken}`
      },
      body: JSON.stringify({
        action: 'update_admin_profile',
        username: 'tiberius_boss',
        workEmail: 'founder@tiberius.ai',
        ownerName: 'Tiberius Founder',
        companyName: 'Tiberius HQ Command',
        mobilePhone: '(830) 555-0199',
        currentPassword: 'TiberiusAdmin2026!',
        newPassword: 'NewMasterAdminPass2026!'
      })
    });
    const adminUpdateData = await adminUpdateResp.json();
    assert.strictEqual(adminUpdateData.ok, true, 'Master Admin self-profile & password update should succeed');
    assert.strictEqual(adminUpdateData.passwordChanged, true);
    assert.strictEqual(adminUpdateData.account.username, 'tiberius_boss');
    assert.strictEqual(adminUpdateData.account.email, 'founder@tiberius.ai');
    const updatedAdminSessionToken = adminUpdateData.sessionToken;

    // Verify Master Admin can log in with new username + new password
    const adminNewLoginResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'tiberius_boss',
        secret: 'NewMasterAdminPass2026!'
      })
    });
    const adminNewLoginData = await adminNewLoginResp.json();
    assert.strictEqual(adminNewLoginData.ok, true, 'Admin must be able to log in with updated username and password');
    assert.strictEqual(adminNewLoginData.account.role, 'ADMIN');

    // 4. Master Admin editing a client contractor's profile & resetting password via POST /api/recon/admin (action: 'update_client_account')
    const adminEditClientResp = await fetch(`${baseUrl}/api/recon/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${updatedAdminSessionToken}`
      },
      body: JSON.stringify({
        action: 'update_client_account',
        contractorId: contractorIdForTest,
        username: 'marcus_admin_override',
        ownerName: 'Marcus Vance (Verified)',
        companyName: 'San Antonio Commercial Roofing LLC',
        workEmail: profileTestEmail,
        mobilePhone: '(210) 884-7777',
        accessPin: '7777',
        territoryZip: '78205',
        newPassword: 'AdminResetClientPass2026!'
      })
    });
    const adminEditClientData = await adminEditClientResp.json();
    assert.strictEqual(adminEditClientData.ok, true, 'Master Admin client override should succeed');
    assert.strictEqual(adminEditClientData.passwordChanged, true);
    assert.strictEqual(adminEditClientData.account.username, 'marcus_admin_override');
    assert.strictEqual(adminEditClientData.account.accessPin, '7777');

    // Verify client can log in with the Admin-reset password
    const clientAfterAdminResetResp = await fetch(`${baseUrl}/api/recon/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: 'marcus_admin_override',
        secret: 'AdminResetClientPass2026!'
      })
    });
    const clientAfterAdminResetData = await clientAfterAdminResetResp.json();
    assert.strictEqual(clientAfterAdminResetData.ok, true, 'Client must be able to sign in with Admin-reset password');

    // Restore Master Admin back to default credentials so test runs remain idempotent
    const adminRestoreResp = await fetch(`${baseUrl}/api/recon/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${updatedAdminSessionToken}`
      },
      body: JSON.stringify({
        action: 'update_admin_profile',
        username: 'admin',
        workEmail: 'admin@tiberius.ai',
        ownerName: 'Master Admin',
        companyName: 'Tiberius Agency Command',
        mobilePhone: '(830) 555-0100',
        currentPassword: 'NewMasterAdminPass2026!',
        newPassword: 'TiberiusAdmin2026!'
      })
    });
    const adminRestoreData = await adminRestoreResp.json();
    assert.strictEqual(adminRestoreData.ok, true, 'Restoring default Master Admin credentials must succeed');

    console.log('[30/30] Testing Client-Owned Outbound Email (Mail App Handoff + Encrypted Shop SMTP) & Native Phone SMS...');
    // 1. Day-1 Default Handoff (Zero Setup) on /api/recon/approve
    const handoffEmailResp = await fetch(`${baseUrl}/api/recon/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'approve-send',
        cardId: 'deal-2',
        dispatchChannel: 'CLIENT_EMAIL'
      })
    });
    const handoffEmailData = await handoffEmailResp.json();
    assert.strictEqual(handoffEmailData.ok, true);
    assert.strictEqual(handoffEmailData.dispatchReceipt.provider, 'CLIENT_NATIVE_EMAIL_HANDOFF');
    assert.strictEqual(handoffEmailData.dispatchReceipt.handoffRequired, true);
    assert.ok(handoffEmailData.dispatchReceipt.mailtoUri.startsWith('mailto:'));
    assert.ok(handoffEmailData.dispatchReceipt.gmailWebUri.startsWith('https://mail.google.com/'));
    assert.ok(handoffEmailData.dispatchReceipt.outlookWebUri.startsWith('https://outlook.office.com/'));

    const handoffSmsResp = await fetch(`${baseUrl}/api/recon/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        action: 'approve-send',
        cardId: 'deal-3',
        dispatchChannel: 'NATIVE_SMS'
      })
    });
    const handoffSmsData = await handoffSmsResp.json();
    assert.strictEqual(handoffSmsData.ok, true);
    assert.strictEqual(handoffSmsData.dispatchReceipt.provider, 'NATIVE_SIM_PROTOCOL');
    assert.ok(handoffSmsData.dispatchReceipt.nativeSimUri.startsWith('sms:+1'));

    // 2. Tier B: Local Loopback Mock SMTP Server + Encrypted Shop SMTP 1-Tap Dispatch
    const capturedSmtpPayloads = [];
    const mockSmtpServer = net.createServer((sock) => {
      sock.write('220 127.0.0.1 ESMTP ShopMockReady\r\n');
      let inDataMode = false;
      let dataBuf = '';
      let lineRemainder = '';

      sock.on('data', (chunk) => {
        const str = chunk.toString('utf8');
        if (inDataMode) {
          dataBuf += str;
          if (dataBuf.includes('\r\n.\r\n')) {
            capturedSmtpPayloads.push(dataBuf);
            inDataMode = false;
            dataBuf = '';
            sock.write('250 2.0.0 OK Queued by Client Shop SMTP\r\n');
          }
          return;
        }
        lineRemainder += str;
        const lines = lineRemainder.split('\r\n');
        lineRemainder = lines.pop();
        for (const rawLine of lines) {
          const upper = rawLine.toUpperCase();
          if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
            sock.write('250-127.0.0.1 Hello\r\n250 AUTH PLAIN LOGIN\r\n');
          } else if (upper.startsWith('AUTH PLAIN')) {
            sock.write('235 2.7.0 Authentication successful\r\n');
          } else if (upper.startsWith('MAIL FROM:') || upper.startsWith('RCPT TO:')) {
            sock.write('250 2.1.0 OK\r\n');
          } else if (upper === 'DATA') {
            inDataMode = true;
            sock.write('354 End data with <CR><LF>.<CR><LF>\r\n');
          } else if (upper === 'QUIT') {
            sock.write('221 2.0.0 Bye\r\n');
            sock.end();
          } else {
            sock.write('250 OK\r\n');
          }
        }
      });
    });

    await new Promise((resolve) => mockSmtpServer.listen(0, '127.0.0.1', resolve));
    const mockSmtpPort = mockSmtpServer.address().port;

    try {
      // Save encrypted Shop SMTP config on the contractor account
      const saveSmtpResp = await fetch(`${baseUrl}/api/recon/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          token,
          clientEmailConfig: {
            mode: 'CLIENT_SMTP',
            preferredComposeTarget: 'GMAIL_WEB',
            providerPreset: 'custom',
            smtpHost: '127.0.0.1',
            smtpPort: mockSmtpPort,
            smtpUser: 'feedbackdaisy@gmail.com',
            fromEmail: 'feedbackdaisy@gmail.com',
            smtpPass: 'shop-app-pass-2026'
          }
        })
      });
      const saveSmtpData = await saveSmtpResp.json();
      assert.strictEqual(saveSmtpData.ok, true);
      assert.strictEqual(saveSmtpData.account.clientEmailConfig.hasSmtpPassword, true);
      assert.strictEqual(saveSmtpData.account.clientEmailConfig.isSmtpReady, true);
      assert.strictEqual(
        saveSmtpData.account.clientEmailConfig.smtpPassEncrypted,
        undefined,
        'Encrypted SMTP secret must never leak in API JSON'
      );

      // Verify Shop SMTP Self-Test endpoint
      const testSmtpResp = await fetch(`${baseUrl}/api/recon/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_client_smtp',
          token,
          testRecipientEmail: 'feedbackdaisy@gmail.com'
        })
      });
      const testSmtpData = await testSmtpResp.json();
      assert.strictEqual(testSmtpData.ok, true);
      assert.strictEqual(testSmtpData.receipt.provider, 'CLIENT_SMTP_LIVE');
      assert.strictEqual(capturedSmtpPayloads.length, 1);

      // Verify 1-Tap Morning Briefing approval dispatches live via contractor's own Shop SMTP
      const liveSmtpApproveResp = await fetch(`${baseUrl}/api/recon/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'approve-send',
          cardId: 'deal-4',
          dispatchChannel: 'CLIENT_EMAIL'
        })
      });
      const liveSmtpApproveData = await liveSmtpApproveResp.json();
      assert.strictEqual(liveSmtpApproveData.ok, true);
      assert.strictEqual(liveSmtpApproveData.providerDispatched, true);
      assert.strictEqual(liveSmtpApproveData.dispatchReceipt.provider, 'CLIENT_SMTP_LIVE');
      assert.strictEqual(liveSmtpApproveData.dispatchReceipt.handoffRequired, false);

      // Verify 3-Pane Conversation Room reply dispatches live via contractor's own Shop SMTP
      const liveSmtpReplyResp = await fetch(`${baseUrl}/api/recon/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          threadId: firstThreadId,
          channel: 'CLIENT_EMAIL',
          messageBody: 'Sending directly from our own shop mailbox — zero third-party Resend outreach.'
        })
      });
      const liveSmtpReplyData = await liveSmtpReplyResp.json();
      assert.strictEqual(liveSmtpReplyData.ok, true);
      assert.strictEqual(liveSmtpReplyData.handoffRequired, false);
      assert.strictEqual(liveSmtpReplyData.providerReceipt.provider, 'CLIENT_SMTP_LIVE');
      assert.ok(capturedSmtpPayloads.length >= 3);
      assert.ok(capturedSmtpPayloads[capturedSmtpPayloads.length - 1].includes('Reply-To:'));
    } finally {
      mockSmtpServer.close();
    }

    // Reset state for idempotent test runs
    clearSeenPermits();
    setPreTripHoldDispatch(false, 'Test suite cleanup');
    const finalStore = loadStore();
    if (finalStore.watchVideos) finalStore.watchVideos = {};
    if (finalStore.watchTelemetry) finalStore.watchTelemetry = [];
    if (finalStore.briefings) {
      for (const k of Object.keys(finalStore.briefings)) {
        if (k.startsWith('preview-')) delete finalStore.briefings[k];
      }
    }
    if (finalStore.contractors) {
      for (const k of Object.keys(finalStore.contractors)) {
        if (k.startsWith('prospect-ctr-') || finalStore.contractors[k].workEmail === profileTestEmail) {
          delete finalStore.contractors[k];
        }
      }
    }
    const alertCtr = finalStore.contractors['44444444-5555-6666-7777-888888888888'];
    if (alertCtr) {
      alertCtr.rotationOffset = 0;
      alertCtr.primaryTrade = 'Roofing / Exteriors';
      if (alertCtr.voiceProfile) alertCtr.voiceProfile.landmarkReference = '';
      const resetCards = buildRealClientBriefingCards(alertCtr, 0, { demo: false });
      finalStore.briefings['recon-78130-2101s6'].cards = resetCards;
      finalStore.briefings['recon-78130-2101s6'].tradeName = 'Roofing / Exteriors';
      saveStore(finalStore);
    }
    await runPreTripInspection({
      token: 'recon-78130-2101s6',
      baseUrl,
      simulateComms: true,
      sendNotifications: false
    });
    clearSeenPermits();

    console.log('\n✅ ALL 30 TIBERIUS RECON™ & META-RECON™ AUTONOMOUS LEAD-GEN END-TO-END TESTS PASSED.');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
