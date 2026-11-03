/**
 * POST / GET /api/recon/live-agent
 * Executes the Zero-API Live Web & Municipal Permit Agent:
 *   1. Fetches real $150,000+ building permits issued in the last 30 days from public city records
 *   2. Crawls the live web (DuckDuckGo HTML + company homepages) to discover official domains & emails
 *   3. Injects the live scraped cards directly into the contractor's 7:00 AM Morning Briefing queue
 */

const { injectLiveZeroApiCardsIntoBriefing } = require('../../workers/live-zero-api-agent');
const { hydrateAccountFromSession, ensureCloudAccountsSynced } = require('../../db/store');
const { extractSessionFromRequest } = require('../../db/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Recon-Session');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const params = req.method === 'POST' ? req.body || {} : req.query || {};
  const sessionClaims = extractSessionFromRequest(req);

  try {
    const initialToken =
      params.token ||
      (sessionClaims && sessionClaims.magicToken) ||
      'demo-7am-briefing';
    await ensureCloudAccountsSynced({ token: initialToken });
    const hydrated = sessionClaims ? hydrateAccountFromSession(sessionClaims) : null;
    const resolvedToken =
      params.token ||
      (hydrated && hydrated.account && hydrated.account.magicToken) ||
      'demo-7am-briefing';
    const resolvedTerritoryZip =
      params.territoryZip ||
      params.zipCode ||
      params.zip ||
      (hydrated && hydrated.account && hydrated.account.baseZip) ||
      undefined;

    const result = await injectLiveZeroApiCardsIntoBriefing({
      token: resolvedToken,
      primaryTrade:
        params.primaryTrade ||
        params.trade ||
        (hydrated && hydrated.account && hydrated.account.primaryTrade) ||
        '',
      territoryZip: resolvedTerritoryZip,
      landmarkReference: params.landmarkReference !== undefined ? params.landmarkReference : undefined
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Zero-API live agent failed'
    });
  }
};
