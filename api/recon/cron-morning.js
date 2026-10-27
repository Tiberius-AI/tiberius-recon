/**
 * POST / GET /api/recon/cron-morning
 * Triggers the 2:00 AM -> 4:30 AM -> 5:30 AM -> 6:45 AM Overnight Recon Pipeline
 * and returns a structured telemetry summary of scraped permits, CAD X-Ray matches,
 * Gemini 4-sentence drafts, and 6:45 AM SMS briefing dispatches.
 */

const { runNightlyReconPipeline } = require('../../workers/orchestrator');

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
  const summary = await runNightlyReconPipeline({
    zipCode: params.zipCode || params.zip || '78130',
    primaryTrade: params.primaryTrade || params.trade || 'Commercial Concrete',
    dryRun: true
  });

  return res.status(200).json({
    ok: true,
    ...summary
  });
};
