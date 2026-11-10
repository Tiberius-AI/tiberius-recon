/**
 * GET / POST /api/recon/auth
 * Multi-Client Contractor & Master Agency Admin Authentication Endpoint
 * - GET: Validates active JWT session cookie / Bearer header and returns account identity
 * - POST (action='login'): Verifies email/phone + password/PIN and issues signed 30-day session
 * - POST (action='register'): Creates a new isolated Contractor Account & Territory Briefing
 * - POST (action='logout'): Clears the HttpOnly session cookie
 */

const {
  authenticateAccount,
  activateTerritory,
  hydrateAccountFromSession,
  updateAccountProfile,
  ensureCloudAccountsSynced
} = require('../../db/store');
const {
  extractSessionFromRequest,
  setSessionCookie,
  clearSessionCookie
} = require('../../db/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Recon-Session');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const sessionClaims = extractSessionFromRequest(req);
    const hydrated = sessionClaims ? hydrateAccountFromSession(sessionClaims) : null;
    if (!hydrated) {
      return res.status(200).json({
        ok: true,
        authenticated: false,
        role: null,
        account: null
      });
    }
    return res.status(200).json({
      ok: true,
      authenticated: true,
      role: hydrated.role,
      account: hydrated.account
    });
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = req.body || {};
    const defaultAction = req.method === 'PUT' || req.method === 'PATCH' ? 'update_profile' : 'login';
    const action = String(body.action || defaultAction).toLowerCase();

    if (action === 'logout') {
      clearSessionCookie(res);
      return res.status(200).json({ ok: true, loggedOut: true });
    }

    if (
      action === 'update_profile' ||
      action === 'change_password' ||
      action === 'update_account'
    ) {
      const sessionClaims = extractSessionFromRequest(req);
      const updateResult = updateAccountProfile({
        sessionClaims,
        identifier: body.identifier || body.currentIdentifier,
        targetAccountId: body.accountId || body.contractorId,
        token: body.token || body.magicToken,
        targetRole: body.targetRole,
        username: body.username,
        email: body.email,
        workEmail: body.workEmail !== undefined ? body.workEmail : body.bestEmail,
        ownerName: body.ownerName,
        companyName: body.companyName,
        mobilePhone: body.mobilePhone !== undefined ? body.mobilePhone : body.phone,
        websiteUrl: body.websiteUrl,
        accessPin: body.accessPin,
        primaryTrade: body.primaryTrade,
        territoryZip: body.territoryZip !== undefined ? body.territoryZip : body.baseZip,
        tierLevel: body.tierLevel,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword !== undefined ? body.newPassword : body.password
      });

      if (!updateResult.ok) {
        return res.status(400).json(updateResult);
      }

      if (updateResult.sessionToken) {
        setSessionCookie(res, updateResult.sessionToken);
      }
      return res.status(200).json(updateResult);
    }

    if (action === 'register') {
      const activation = activateTerritory({
        username: body.username || '',
        companyName: body.companyName || '',
        ownerName: body.ownerName || '',
        primaryTrade: body.primaryTrade || 'Commercial Concrete',
        tierLevel: body.tierLevel || 'Tier 2: Commercial Permits',
        includeSmartSiteBundle: Boolean(body.includeSmartSiteBundle),
        territoryZip: body.territoryZip || '78130',
        mobilePhone: body.mobilePhone || '(555) 234-5678',
        bestEmail: body.bestEmail || body.email || 'owner@contractor.com',
        accountPassword: body.password || body.accountPassword || 'recon2026'
      });

      if (activation.sessionToken) {
        setSessionCookie(res, activation.sessionToken);
      }

      return res.status(200).json({
        ok: true,
        role: 'CONTRACTOR',
        sessionToken: activation.sessionToken,
        account: {
          ...activation.contractor,
          magicToken: activation.briefing.magicToken
        },
        briefing: activation.briefing
      });
    }

    // Default: action === 'login'
    const identifier = body.identifier || body.email || body.username || body.phone || '';
    await ensureCloudAccountsSynced({ identifier });
    const result = authenticateAccount({
      identifier,
      password: body.password || body.pin || body.secret || ''
    });

    if (!result.ok) {
      return res.status(401).json(result);
    }

    setSessionCookie(res, result.sessionToken);
    return res.status(200).json(result);
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
