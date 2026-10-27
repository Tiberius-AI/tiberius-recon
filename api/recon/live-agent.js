/**
 * POST / GET /api/recon/live-agent
 * Executes the Zero-API Live Web & Municipal Permit Agent:
 *   1. Fetches real $150,000+ building permits issued in the last 30 days from public city records
 *   2. Crawls the live web (DuckDuckGo HTML + company homepages) to discover official domains & emails
 *   3. Injects the live scraped cards directly into the contractor's 7:00 AM Morning Briefing queue
 */

const { injectLiveZeroApiCardsIntoBriefing } = require('../../workers/live-zero-api-agent');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const params = req.method === 'POST' ? req.body || {} : req.query || {};

  try {
    const result = await injectLiveZeroApiCardsIntoBriefing({
      token: params.token || 'demo-7am-briefing',
      primaryTrade: params.primaryTrade || params.trade || 'Commercial Concrete',
      landmarkReference: params.landmarkReference || 'two miles east off IH-35'
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Zero-API live agent failed'
    });
  }
};
