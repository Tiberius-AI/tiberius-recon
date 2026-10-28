/**
 * TIBERIUS RECON™ — 3-PANE REPLY & FOLLOW-UP CONVERSATION ROOM API
 * (api/recon/inbox.js)
 *
 * GET  /api/recon/inbox?token=... -> Returns active deal threads, contractor profile & Knowledge Base
 * POST /api/recon/inbox           ->
 *   - action === 'draft_kb_reply': Generates a context-aware reply using the client's Knowledge Base
 *   - action === 'draft_day3_bump': Generates a 2-sentence Day-3 follow-up bump
 *   - action === 'draft_site_walk': Proposes/confirms a Thursday 9:00 AM site walk
 *   - action === 'send_message': Appends contractor outbound message & updates stage
 *   - action === 'simulate_inbound_reply': Injects a live prospect reply to test the room
 *   - action === 'update_stage': Updates thread stage pill
 */

const {
  getConversationRoomState,
  processConversationAction
} = require('../../db/store');

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
      const result = processConversationAction({
        token: body.token || 'demo-7am-briefing',
        action: body.action,
        threadId: body.threadId,
        messageBody: body.messageBody,
        channel: body.channel,
        stage: body.stage
      });
      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
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
