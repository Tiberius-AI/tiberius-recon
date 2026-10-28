/**
 * POST /api/webhooks/resend
 * Universal Resend Inbound Email Webhook Receiver (from `Communication Notes.txt` Section 2):
 *   - Catches email replies from GCs, Property Managers, and Homeowners
 *   - Strips out the quoted email chain ("On ... wrote:", "> ...")
 *   - Matches the thread via `reply+<token>+<threadId>@inbound.tiberius.ai` or sender email
 *   - Drops the reply directly into the 3-Pane Conversation Room chat view with a 🔥 HOT REPLY badge
 */

const { ingestInboundWebhookReply, recordScoutAlertLog } = require('../../db/store');
const { dispatchContractorHotReplyAlertSms } = require('../../workers/comms-dispatcher');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  }

  try {
    const payload = typeof req.body === 'object' && req.body ? req.body : {};
    // Support both Resend `{ type: 'email.received', data: {...} }` and direct webhook payloads
    const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;

    const fromRaw = data.from || data.sender || '';
    const toRaw = data.to || data.recipient || data.reply_to || '';
    const subject = data.subject || '';
    const rawBody = data.text || data.body || data.html || '';

    const result = ingestInboundWebhookReply({
      provider: 'RESEND',
      token: data.token || payload.token,
      threadId: data.threadId || payload.threadId,
      fromEmail: fromRaw,
      fromName: data.fromName || (String(fromRaw).split('<')[0] || '').trim() || undefined,
      toAddress: toRaw,
      subject,
      rawBody
    });

    // Automatically fire Master Twilio Hot-Reply SMS Alert to the contractor's cell phone
    const contractorAlertReceipt = await dispatchContractorHotReplyAlertSms({
      contractor: result.contractor,
      thread: result.thread,
      inboundMessage: result.inboundMessage,
      token: result.matchedToken
    });
    const alertLogResult = recordScoutAlertLog(result.matchedToken, contractorAlertReceipt);
    result.contractorAlertReceipt = contractorAlertReceipt;
    result.scoutAlertLogs = alertLogResult.scoutAlertLogs;
    if (result.roomState) {
      result.roomState.scoutAlertLogs = alertLogResult.scoutAlertLogs;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};
