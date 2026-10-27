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

    console.log('[9/9] Testing Zero-API Live CAD Address & Parcel X-Ray (/api/recon/cad-lookup)...');
    const cadResp = await fetch(
      `${baseUrl}/api/recon/cad-lookup?address=${encodeURIComponent('16013 N IH 35')}`
    );
    const cadData = await cadResp.json();
    assert.strictEqual(cadData.ok, true);
    assert.strictEqual(cadData.mode, 'ZERO_API_LIVE_CAD_XRAY');
    assert.ok(cadData.parcelId.includes('TCAD'));

    // Also verify static HTML endpoints respond 200
    for (const page of ['/', '/briefing', '/command']) {
      const pageResp = await fetch(`${baseUrl}${page}`);
      assert.strictEqual(pageResp.status, 200, `Expected 200 for ${page}`);
    }

    console.log('\n✅ ALL 9 TIBERIUS RECON™ END-TO-END & LIVE ZERO-API AGENT TESTS PASSED.');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
