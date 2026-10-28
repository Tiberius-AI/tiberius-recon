/**
 * POST / GET /api/recon/cron-morning
 * Triggers the 2:00 AM -> 4:30 AM -> 5:30 AM -> 6:45 AM Overnight Recon Pipeline
 * and returns a structured telemetry summary of scraped permits, CAD X-Ray matches,
 * Gemini 4-sentence drafts, and 6:45 AM SMS briefing dispatches.
 */

const { runNightlyReconPipeline } = require('../../workers/orchestrator');
const {
  getBriefingByToken,
  recordScoutAlertLog,
  rotateRealClientBriefing,
  rotateAllRealClientBriefings,
  ensureCloudAccountsSynced
} = require('../../db/store');
const { dispatchScoutMorningAlertSms } = require('../../workers/comms-dispatcher');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const params = req.method === 'POST' ? req.body || {} : req.query || {};
  await ensureCloudAccountsSynced({ token: params.token });

  const isAutomatedDailyCron = !params.token;
  const token = params.token || 'demo-7am-briefing';

  let rotationResult = null;
  if (params.token) {
    rotationResult = rotateRealClientBriefing({
      token: params.token,
      advanceOffset: Boolean(params.rotateBatch)
    });
  }

  const briefingBundle = getBriefingByToken(token);
  const summary = await runNightlyReconPipeline({
    zipCode:
      params.zipCode ||
      params.zip ||
      (briefingBundle && briefingBundle.briefing && briefingBundle.briefing.territoryZip) ||
      '78130',
    primaryTrade:
      params.primaryTrade ||
      params.trade ||
      (briefingBundle && briefingBundle.briefing && briefingBundle.briefing.tradeName) ||
      'Commercial Concrete',
    dryRun: true
  });

  const dailyClientSmsDispatches = [];
  let scoutMorningSmsReceipt = null;

  if (isAutomatedDailyCron) {
    // 6:45 AM Daily Automated Cron: rotate cards & send 6:45 AM SMS for all active real clients
    const rotatedClients = rotateAllRealClientBriefings({ advanceOffset: false });
    for (const item of rotatedClients) {
      const receipt = await dispatchScoutMorningAlertSms({
        contractor: item.contractor,
        briefing: item.briefing,
        token: item.token
      });
      recordScoutAlertLog(item.token, receipt);
      dailyClientSmsDispatches.push({
        token: item.token,
        companyName: item.contractor.companyName,
        toPhone: item.contractor.mobilePhone,
        batchLabel: item.batchLabel,
        receipt
      });
    }
    scoutMorningSmsReceipt = dailyClientSmsDispatches[0]?.receipt || null;
  }

  if (!scoutMorningSmsReceipt && briefingBundle && briefingBundle.contractor && briefingBundle.briefing) {
    scoutMorningSmsReceipt = await dispatchScoutMorningAlertSms({
      contractor: briefingBundle.contractor,
      briefing: briefingBundle.briefing,
      token: briefingBundle.briefing.magicToken
    });
    recordScoutAlertLog(briefingBundle.briefing.magicToken, scoutMorningSmsReceipt);
  }

  return res.status(200).json({
    ok: true,
    ...summary,
    rotated: Boolean(rotationResult && rotationResult.rotated),
    batchLabel: rotationResult ? rotationResult.batchLabel : undefined,
    briefing: briefingBundle ? briefingBundle.briefing : undefined,
    scoutMorningSmsReceipt,
    dailyClientSmsDispatches: dailyClientSmsDispatches.length ? dailyClientSmsDispatches : undefined
  });
};
