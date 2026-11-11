/**
 * POST /api/recon/approve
 * Strict Human-in-the-Loop 1-Tap Dispatch Endpoint ("Nothing Sends Without Your Tap")
 * Actions supported:
 *  - approve-send: Marks card as sent, executes outbound Email/SMS dispatch via outbound-sender.js,
 *                  and returns the verifiable RFC-822 / SMS dispatch receipt.
 *  - save-draft: Saves inline edits to the 4-sentence intro
 *  - reset-card: Resets a single card back to 'ready'
 *  - reset-all: Resets all cards in the briefing back to 'ready'
 *  - unlock-full-queue: Upgrades trial briefing to unlock all overflow cards in the territory
 */

const {
  processBriefingAction,
  getBriefingByToken,
  getRawContractorForDispatch,
  ensureCloudAccountsSynced
} = require('../../db/store');
const { dispatchApprovedOutreach } = require('../../workers/dispatch/outbound-sender');
const { recordProspectPreviewRadarEvent } = require('../../workers/meta-recon-orchestrator');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const token = body.token || 'demo-7am-briefing';
  const action = body.action || 'approve-send';
  await ensureCloudAccountsSynced({ token });

  const result = processBriefingAction({
    token,
    action,
    cardId: body.cardId,
    updatedDraftBody: body.updatedDraftBody,
    dispatchChannel: body.dispatchChannel || 'CLIENT_EMAIL',
    upgradeTier: body.upgradeTier,
    primaryTrade: body.primaryTrade,
    territoryZip: body.territoryZip,
    landmarkReference: body.landmarkReference,
    briefingDate: body.briefingDate || body.date
  });

  if (!result.ok) {
    return res.status(400).json(result);
  }

  let dispatchReceipt = null;
  if (action === 'approve-send' && result.card) {
    if (result.alreadySent && result.card.dispatchReceipt) {
      dispatchReceipt = result.card.dispatchReceipt;
    } else {
      const context = getBriefingByToken(token) || {};
      const rawContractor = getRawContractorForDispatch({ token }) || context.contractor;
      dispatchReceipt = await dispatchApprovedOutreach({
        card: result.card,
        contractor: rawContractor,
        briefing: result.briefing,
        channel: body.dispatchChannel || 'CLIENT_EMAIL'
      });
      result.card.dispatchReceipt = dispatchReceipt;
    }
  }

  let radarReceipt = null;
  if (action === 'approve-send' && String(token).startsWith('preview-')) {
    const radarRes = await recordProspectPreviewRadarEvent({
      token,
      eventType: 'PREVIEW_CARD_APPROVED',
      cardId: body.cardId || '',
      userAgent: (req.headers && req.headers['user-agent']) || '',
      isAdminViewer: Boolean(body.viewer === 'admin')
    });
    radarReceipt = radarRes ? radarRes.radarSmsReceipt : null;
  }

  return res.status(200).json({
    ...result,
    dispatchReceipt,
    radarReceipt,
    providerDispatched: Boolean(dispatchReceipt && dispatchReceipt.liveDispatched)
  });
};
