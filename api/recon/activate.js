/**
 * POST /api/recon/activate
 * Activates a Contractor's 7-Day Territory Test Drive, registers the Zip Code Lock,
 * generates their tailored 7:00 AM Morning Briefing (3 Unlocked + 9 Locked Overflow Cards),
 * and optionally forwards the activation event to LEAD_WEBHOOK_URL.
 */

const { activateTerritory } = require('../../db/store');
const { setSessionCookie } = require('../../db/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'Tiberius Recon Territory Activation Endpoint',
      status: 'online'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const activation = activateTerritory({
    primaryTrade: body.primaryTrade || body.trade || 'Commercial Concrete',
    tierLevel: body.tierLevel || body.tier || 'Tier 2: Commercial Permits',
    includeSmartSiteBundle: Boolean(body.includeSmartSiteBundle),
    territoryZip: body.territoryZip || body.zipCode || '75024',
    mobilePhone: body.mobilePhone || body.phone || '(555) 234-5678',
    bestEmail: body.bestEmail || body.email || 'you@company.com',
    companyName: body.companyName || '',
    ownerName: body.ownerName || '',
    minPermitValuation: body.minPermitValuation || 100000,
    accountPassword: body.accountPassword || body.password || ''
  });

  if (activation.sessionToken) {
    setSessionCookie(res, activation.sessionToken);
  }

  let webhookForwarded = false;
  if (process.env.LEAD_WEBHOOK_URL) {
    try {
      const resp = await fetch(process.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'TIBERIUS_RECON_TERRITORY_ACTIVATED',
          contractor: activation.contractor,
          briefing: activation.briefing,
          availability: activation.availability,
          timestamp: new Date().toISOString()
        })
      });
      webhookForwarded = resp.ok;
    } catch (_err) {
      webhookForwarded = false;
    }
  }

  return res.status(200).json({
    ...activation,
    webhookForwarded,
    smsPreview: `☕ Tiberius Recon Armed for ${activation.briefing.territoryZip} (${activation.briefing.metroCity}): Your Tiberius Scout will sweep ${activation.briefing.portalName} & ${activation.briefing.countyCad} at 2:00 AM. Preview your live 7:00 AM Briefing now: ${activation.briefing.briefingUrl}`
  });
};
