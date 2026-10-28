/**
 * POST /api/webhooks/twilio
 * Universal Twilio Inbound SMS Webhook Receiver (from `Communication Notes.txt` Section 2):
 *   - Accepts Twilio POST payloads (`From`, `To`, `Body`)
 *   - Matches the phone number to the active lead thread in the Conversation Room
 *   - Inserts the inbound SMS into the timeline and updates the thread stage to `REPLIED_HOT`
 */

const { ingestInboundWebhookReply } = require('../../db/store');

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
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const fromPhone = body.From || body.from || '';
    const toPhone = body.To || body.to || '';
    const smsBody = body.Body || body.body || body.text || '';

    const result = ingestInboundWebhookReply({
      provider: 'TWILIO',
      token: body.token,
      threadId: body.threadId,
      fromPhone,
      fromName: body.FromName || undefined,
      toAddress: toPhone,
      rawBody: smsBody
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};
