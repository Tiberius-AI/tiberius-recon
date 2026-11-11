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
  ensureCloudAccountsSynced,
  isDemoModeEnabled
} = require('../../db/store');
const { extractSessionFromRequest } = require('../../db/auth');
const { recordProspectPreviewRadarEvent } = require('../../workers/meta-recon-orchestrator');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Recon-Session');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sessionClaims = extractSessionFromRequest(req);

  if (req.method === 'GET') {
    const requestedToken = req.query && (req.query.token || req.query.t);
    const demoRequested = isDemoModeEnabled({
      demo: req.query && req.query.demo
    });
    const initialToken =
      requestedToken ||
      (sessionClaims && sessionClaims.magicToken) ||
      'demo-7am-briefing';

    await ensureCloudAccountsSynced({ token: initialToken });
    const hydrated = sessionClaims ? hydrateAccountFromSession(sessionClaims) : null;
    const token =
      requestedToken ||
      (hydrated && hydrated.account && hydrated.account.magicToken) ||
      'demo-7am-briefing';

    const requestedDate = req.query && req.query.date ? String(req.query.date).trim() : undefined;
    const autoScrape = !(
      req.query &&
      (req.query.autoScrape === 'false' || req.query.autoScrape === '0')
    );

    const data = getBriefingByToken(token, {
      demo: demoRequested,
      date: requestedDate,
      autoScrape,
      forceRegenerate: false
    });
    if (!data) {
      return res.status(404).json({ ok: false, error: 'Morning briefing not found' });
    }

    let radarReceipt = null;
    if (
      String(token).startsWith('preview-') &&
      req.query &&
      (req.query.trackOpen === '1' || req.query.trackOpen === 'true') &&
      req.query.viewer !== 'admin'
    ) {
      const radarRes = await recordProspectPreviewRadarEvent({
        token,
        eventType: 'PREVIEW_BRIEFING_OPENED',
        userAgent: (req.headers && req.headers['user-agent']) || '',
        isAdminViewer: Boolean(hydrated && hydrated.account && hydrated.account.role === 'ADMIN')
      });
      radarReceipt = radarRes ? radarRes.radarSmsReceipt || radarRes.event : null;
    }

    return res.status(200).json({
      ok: true,
      authenticatedAccount: hydrated ? hydrated.account : null,
      radarReceipt,
      ...data
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const demoRequested = isDemoModeEnabled({
      demo: body.demo !== undefined ? body.demo : req.query && req.query.demo
    });
    const initialToken =
      body.token ||
      (sessionClaims && sessionClaims.magicToken) ||
      'demo-7am-briefing';
    await ensureCloudAccountsSynced({ token: initialToken });
    const hydrated = sessionClaims ? hydrateAccountFromSession(sessionClaims) : null;
    const token =
      body.token ||
      (hydrated && hydrated.account && hydrated.account.magicToken) ||
      'demo-7am-briefing';
    const autoScrape =
      body.autoScrape !== false &&
      !(req.query && (req.query.autoScrape === 'false' || req.query.autoScrape === '0'));
    const result = updateContractorCommand({
      token,
      primaryTrade: body.primaryTrade,
      territoryZip: body.territoryZip,
      tierLevel: body.tierLevel,
      minPermitValuation: body.minPermitValuation,
      includeSmartSiteBundle: body.includeSmartSiteBundle,
      landmarkReference: body.landmarkReference,
      recentWin: body.recentWin,
      differentiator: body.differentiator,
      autoScrape,
      demo: demoRequested
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
