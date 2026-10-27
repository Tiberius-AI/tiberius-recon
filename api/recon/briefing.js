/**
 * GET / POST /api/recon/briefing
 * - GET ?token=... : Retrieves the live 7:00 AM Morning Briefing, Unlocked Cards, Locked Overflow,
 *                    CAD X-Ray Metadata, and Contractor Command Settings.
 * - POST : Updates Contractor Command Settings (Trade, Zip, Min Valuation, Shop Voice, Smart Site Equity)
 *          and re-calibrates the morning briefing cards.
 */

const { getBriefingByToken, updateContractorCommand } = require('../../db/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const token = (req.query && (req.query.token || req.query.t)) || 'demo-7am-briefing';
    const data = getBriefingByToken(token);
    if (!data) {
      return res.status(404).json({ ok: false, error: 'Morning briefing not found' });
    }
    return res.status(200).json({
      ok: true,
      ...data
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const result = updateContractorCommand({
      token: body.token || 'demo-7am-briefing',
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
