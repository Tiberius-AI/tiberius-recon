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

const { processBriefingAction, getBriefingByToken } = require('../../db/store');
const { dispatchApprovedOutreach } = require('../../workers/dispatch/outbound-sender');

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

  const result = processBriefingAction({
    token,
    action,
    cardId: body.cardId,
    updatedDraftBody: body.updatedDraftBody,
    dispatchChannel: body.dispatchChannel || 'CLOUD_EMAIL',
    upgradeTier: body.upgradeTier,
    primaryTrade: body.primaryTrade,
    territoryZip: body.territoryZip,
    landmarkReference: body.landmarkReference
  });

  if (!result.ok) {
    return res.status(400).json(result);
  }

  let dispatchReceipt = null;
  if (action === 'approve-send' && result.card) {
    const context = getBriefingByToken(token) || {};
    dispatchReceipt = await dispatchApprovedOutreach({
      card: result.card,
      contractor: context.contractor,
      briefing: result.briefing,
      channel: body.dispatchChannel || 'CLOUD_EMAIL'
    });
    result.card.dispatchReceipt = dispatchReceipt;
  }

  return res.status(200).json({
    ...result,
    dispatchReceipt,
    providerDispatched: Boolean(dispatchReceipt && dispatchReceipt.liveDispatched)
  });
};
