/**
 * POST /api/recon/send
 * Unified Outbound Dispatch Router (from `Communication Notes.txt` Section 2):
 *   - Dispatches Email via Resend API with custom thread Reply-To (`reply+<token>+<threadId>@inbound.tiberius.ai`)
 *   - Generates Native SIM (`sms:+1...`) URI for cold Recon prospect texting (Zero A2P 10DLC risk)
 *   - Logs the outbound bubble in the 3-Pane Conversation Room timeline
 */

const {
  getConversationRoomState,
  processConversationAction,
  ensureCloudAccountsSynced
} = require('../../db/store');
const {
  dispatchViaResendEmail,
  sendMasterTwilioSmsToContractor,
  buildNativeSimSmsUri
} = require('../../workers/comms-dispatcher');

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
    const token = body.token || 'demo-7am-briefing';
    await ensureCloudAccountsSynced({ token });
    const threadId = body.threadId || 'thread-deal-1';
    const channel = body.channel || 'RESEND_EMAIL';
    const messageBody = String(body.messageBody || body.draftBody || '').trim();
    const overrideEmail = body.overrideEmail ? String(body.overrideEmail).trim() : '';
    const overridePhone = body.overridePhone ? String(body.overridePhone).trim() : '';
    const providerConfig = body.providerConfig && typeof body.providerConfig === 'object' ? body.providerConfig : {};

    if (!messageBody) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: 'messageBody is required' }));
    }

    const currentState = getConversationRoomState(token);
    const activeThread =
      (currentState &&
        Array.isArray(currentState.threads) &&
        currentState.threads.find((t) => t.id === threadId)) ||
      (currentState && currentState.threads && currentState.threads[0]) ||
      {};

    const targetEmail = overrideEmail || activeThread.contactEmail;
    const targetPhone = overridePhone || activeThread.contactPhone;

    let providerReceipt = null;
    if (channel === 'TWILIO_TEST_SMS') {
      providerReceipt = await sendMasterTwilioSmsToContractor({
        toPhone: targetPhone,
        bodyText: messageBody,
        providerConfig
      });
    } else if (!String(channel).includes('SMS')) {
      providerReceipt = await dispatchViaResendEmail({
        contractor: currentState.contractor || {},
        recipientEmail: targetEmail,
        recipientName: activeThread.contactShort || activeThread.contactName,
        subject:
          body.subject ||
          `Re: ${activeThread.headline || 'Permit Bid'} (${activeThread.permitNumber || ''})`,
        bodyText: messageBody,
        token,
        threadId: activeThread.id || threadId,
        providerConfig
      });
    } else {
      providerReceipt = {
        ok: true,
        provider: 'NATIVE_SIM_PROTOCOL',
        deliveryStatus: 'HANDOFF_TO_CONTRACTOR_PERSONAL_SIM',
        toPhone: targetPhone,
        a2pComplianceNote:
          'Cold permit SMS routed via Native SIM (sms:+1...) to protect Twilio A2P 10DLC reputation.',
        nativeSimUri: buildNativeSimSmsUri(targetPhone, messageBody),
        dispatchedAt: new Date().toISOString()
      };
    }

    const updated = processConversationAction({
      token,
      action: 'send_message',
      threadId: activeThread.id || threadId,
      messageBody,
      channel,
      stage: body.stage,
      providerReceipt
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        ...updated,
        nativeSimUri: providerReceipt.nativeSimUri || updated.nativeSimUri,
        providerReceipt
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};
