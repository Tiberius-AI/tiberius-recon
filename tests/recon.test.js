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

    console.log('[17/17] Testing Two-Stage Twilio Bridge Pool -> Dedicated Subaccount Promotion...');
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

    console.log('\n✅ ALL 17 TIBERIUS RECON™ END-TO-END, RESEND/TWILIO WEBHOOK, MASTER A2P SCOUT SMS, NATIVE SIM & CONVERSATION ROOM TESTS PASSED.');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
