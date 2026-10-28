/**
 * GET / POST /api/recon/briefing
 * - GET ?token=... : Retrieves the live 7:00 AM Morning Briefing, Unlocked Cards, Locked Overflow,
 *                    CAD X-Ray Metadata, and Contractor Command Settings.
 * - POST : Updates Contractor Command Settings (Trade, Zip, Min Valuation, Shop Voice, Smart Site Equity)
 *          and re-calibrates the morning briefing cards.
 */

const {
  getBriefingByToken,
  updateContractorCommand,
  hydrateAccountFromSession,
  ensureCloudAccountsSynced
} = require('../../db/store');
const { extractSessionFromRequest } = require('../../db/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Recon-Session');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sessionClaims = extractSessionFromRequest(req);
  const hydrated = sessionClaims ? hydrateAccountFromSession(sessionClaims) : null;

  if (req.method === 'GET') {
    const requestedToken = req.query && (req.query.token || req.query.t);
    const token =
      requestedToken ||
      (hydrated && hydrated.account && hydrated.account.magicToken) ||
      'demo-7am-briefing';

    await ensureCloudAccountsSynced({ token });
    const data = getBriefingByToken(token);
    if (!data) {
      return res.status(404).json({ ok: false, error: 'Morning briefing not found' });
    }
    return res.status(200).json({
      ok: true,
      authenticatedAccount: hydrated ? hydrated.account : null,
      ...data
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const token =
      body.token ||
      (hydrated && hydrated.account && hydrated.account.magicToken) ||
      'demo-7am-briefing';
    await ensureCloudAccountsSynced({ token });
    const result = updateContractorCommand({
      token,
      primaryTrade: body.primaryTrade,
      territoryZip: body.territoryZip,
      tierLevel: body.tierLevel,
      minPermitValuation: body.minPermitValuation,
      includeSmartSiteBundle: body.includeSmartSiteBundle,
      landmarkReference: body.landmarkReference,
      recentWin: body.recentWin,
      differentiator: body.differentiator
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
