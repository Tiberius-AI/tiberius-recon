/**
 * GET / POST /api/recon/alerts
 * Step 3 ("Scout-to-Contractor" Master Twilio A2P Alerts & Two-Stage Subaccount / Bridge Pool Engine):
 *   - GET: Returns contractor's `twilioA2PState` + `scoutAlertLogs`
 *   - POST `action: 'send_morning_briefing_sms'`: Dispatches the 06:45 AM / 07:00 AM Morning Briefing SMS
 *     from Tiberius AI's Master Twilio 10DLC number to the contractor's cell phone
 *   - POST `action: 'send_hot_reply_sms'`: Dispatches an instant Hot-Reply SMS alert to the contractor's cell
 *   - POST `action: 'provision_twilio_subaccount'`: Manages Stage 1 (Bridge Pool) -> Stage 2 (Dedicated Subaccount)
 */

const {
  getBriefingByToken,
  getConversationRoomState,
  recordScoutAlertLog,
  provisionContractorTwilioSubaccount
} = require('../../db/store');
const {
  getContractorTwilioA2PState,
  dispatchScoutMorningAlertSms,
  dispatchContractorHotReplyAlertSms
} = require('../../workers/comms-dispatcher');

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
      const token = (req.query && (req.query.token || req.query.t)) || 'demo-7am-briefing';
      const roomState = getConversationRoomState(token);
      if (!roomState || !roomState.ok) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: false, error: 'Contractor briefing not found' }));
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          ok: true,
          token: roomState.token,
          contractor: roomState.contractor,
          twilioA2PState: roomState.twilioA2PState,
          scoutAlertLogs: roomState.scoutAlertLogs
        })
      );
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const token = body.token || 'demo-7am-briefing';
      const action = body.action || 'send_morning_briefing_sms';

      if (action === 'provision_twilio_subaccount') {
        const provResult = provisionContractorTwilioSubaccount({
          token,
          stage: body.stage || 'STAGE_1_BRIDGE_POOL',
          einNumber: body.einNumber
        });
        res.statusCode = provResult.ok ? 200 : 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            ...provResult,
            action
          })
        );
      }

      const briefingBundle = getBriefingByToken(token);
      const roomState = getConversationRoomState(token);
      if (!briefingBundle || !roomState || !roomState.ok) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: false, error: 'Briefing not found' }));
      }

      const contractor = briefingBundle.contractor;
      const briefing = briefingBundle.briefing;

      if (action === 'send_morning_briefing_sms') {
        const receipt = await dispatchScoutMorningAlertSms({
          contractor,
          briefing,
          token: briefing.magicToken
        });
        const logResult = recordScoutAlertLog(briefing.magicToken, receipt);
        const updatedRoom = getConversationRoomState(briefing.magicToken);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            ok: true,
            action,
            receipt,
            alertEntry: logResult.entry,
            twilioA2PState: getContractorTwilioA2PState(contractor),
            scoutAlertLogs: logResult.scoutAlertLogs,
            roomState: updatedRoom
          })
        );
      }

      if (action === 'send_hot_reply_sms') {
        const activeThread =
          (roomState.threads || []).find((t) => t.id === body.threadId) ||
          (roomState.threads || [])[0] ||
          {};
        const lastMsg =
          (activeThread.messages || [])[activeThread.messages.length - 1] || {
            body: 'We are finalizing bids this week — can you meet Thursday at 9:00 AM?'
          };

        const receipt = await dispatchContractorHotReplyAlertSms({
          contractor,
          thread: activeThread,
          inboundMessage: lastMsg,
          token: briefing.magicToken
        });
        const logResult = recordScoutAlertLog(briefing.magicToken, receipt);
        const updatedRoom = getConversationRoomState(briefing.magicToken);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(
          JSON.stringify({
            ok: true,
            action,
            receipt,
            alertEntry: logResult.entry,
            twilioA2PState: getContractorTwilioA2PState(contractor),
            scoutAlertLogs: logResult.scoutAlertLogs,
            roomState: updatedRoom
          })
        );
      }

      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: `Unsupported alert action: ${action}` }));
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
