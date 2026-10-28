/**
 * GET / POST /api/recon/admin
 * Protected Master Agency Command Endpoint (Requires `role === 'ADMIN'`)
 * - GET: Returns all separate client contractor accounts, active zip locks, MRR, and sent deal logs
 * - POST (action='create_client'): Onboards a new isolated contractor client account
 * - POST (action='run_client_live_recon'): Triggers the Zero-API Live Municipal Agent for a specific client
 */

const {
  getAdminAgencyOverview,
  activateTerritory,
  ensureCloudAccountsSynced
} = require('../../db/store');
const { extractSessionFromRequest } = require('../../db/auth');
const { injectLiveZeroApiCardsIntoBriefing } = require('../../workers/live-zero-api-agent');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Recon-Session');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sessionClaims = extractSessionFromRequest(req);
  if (!sessionClaims || sessionClaims.role !== 'ADMIN') {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized: Master Agency Admin sign-in required.'
    });
  }

  if (req.method === 'GET') {
    await ensureCloudAccountsSynced();
    return res.status(200).json(getAdminAgencyOverview());
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const action = String(body.action || '').toLowerCase();

    if (action === 'create_client') {
      const created = activateTerritory({
        companyName: body.companyName || 'New Client Contractor LLC',
        ownerName: body.ownerName || 'Shop Owner',
        primaryTrade: body.primaryTrade || 'Commercial Concrete',
        tierLevel: body.tierLevel || 'Tier 2: Commercial Permits',
        includeSmartSiteBundle: Boolean(body.includeSmartSiteBundle),
        territoryZip: body.territoryZip || '78130',
        mobilePhone: body.mobilePhone || '(555) 234-5678',
        bestEmail: body.bestEmail || 'client@contractor.com',
        accountPassword: body.accountPassword || body.password || 'recon2026'
      });

      return res.status(200).json({
        ok: true,
        createdClient: created.contractor,
        createdBriefing: created.briefing,
        overview: getAdminAgencyOverview()
      });
    }

    if (action === 'run_client_live_recon') {
      const liveResult = await injectLiveZeroApiCardsIntoBriefing({
        token: body.magicToken || 'demo-7am-briefing',
        primaryTrade: body.primaryTrade || 'Commercial Concrete'
      });

      return res.status(200).json({
        ok: true,
        liveResult: {
          mode: liveResult.mode,
          rawRowsFetched: liveResult.rawRowsFetched,
          elapsedSeconds: liveResult.elapsedSeconds
        },
        overview: getAdminAgencyOverview()
      });
    }

    return res.status(400).json({ ok: false, error: `Unsupported admin action: ${action}` });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
