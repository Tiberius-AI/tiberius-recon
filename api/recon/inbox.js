/**
 * TIBERIUS RECON™ — 3-PANE REPLY & FOLLOW-UP CONVERSATION ROOM API
 * (api/recon/inbox.js)
 *
 * GET  /api/recon/inbox?token=... -> Returns active deal threads, contractor profile, Knowledge Base,
 *                                    thread-specific Reply-To addresses, 20-sec Voicemail scripts & Native SIM URIs
 * POST /api/recon/inbox           ->
 *   - action === 'draft_kb_reply': Generates a context-aware reply using the client's Knowledge Base
 *   - action === 'draft_day3_bump': Generates a 2-sentence Day-3 follow-up bump
 *   - action === 'draft_site_walk': Proposes/confirms a Thursday 9:00 AM site walk
 *   - action === 'draft_native_sim_sms': Generates a 2-sentence Native SIM text (`sms:+1...`)
 *   - action === 'draft_voicemail_script': Generates a 20-second phone/voicemail script
 *   - action === 'log_voicemail_left': Logs a phone/voicemail touch into the timeline
 *   - action === 'send_message': Dispatches via Resend API (with thread Reply-To routing) or Native SIM handoff
 *   - action === 'simulate_inbound_reply': Injects a live prospect reply to test the room
 *   - action === 'update_stage': Updates thread stage pill
 */

const {
  getConversationRoomState,
  processConversationAction
} = require('../../db/store');
const { dispatchViaResendEmail } = require('../../workers/comms-dispatcher');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    if (req.method === 'GET') {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const token = urlObj.searchParams.get('token') || 'demo-7am-briefing';
      const state = getConversationRoomState(token);
      res.statusCode = state.ok ? 200 : 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(state));
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const token = body.token || 'demo-7am-briefing';
      const action = body.action;
      const threadId = body.threadId;
      const channel = body.channel || 'RESEND_EMAIL';

      let providerReceipt = null;
      if (action === 'send_message' && body.messageBody) {
        const currentState = getConversationRoomState(token);
        const activeThread =
          (currentState &&
            Array.isArray(currentState.threads) &&
            currentState.threads.find((t) => t.id === threadId)) ||
          (currentState && currentState.threads && currentState.threads[0]) ||
          {};

        if (!String(channel).includes('SMS')) {
          providerReceipt = await dispatchViaResendEmail({
            contractor: currentState.contractor || {},
            recipientEmail: activeThread.contactEmail,
            recipientName: activeThread.contactShort || activeThread.contactName,
            subject: `Re: ${activeThread.headline || 'Permit Bid'} (${activeThread.permitNumber || ''})`,
            bodyText: body.messageBody,
            token,
            threadId: activeThread.id || threadId
          });
        }
      }

      const result = processConversationAction({
        token,
        action,
        threadId,
        messageBody: body.messageBody,
        channel,
        stage: body.stage,
        providerReceipt
      });

      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          ...result,
          providerReceipt
        })
      );
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};
