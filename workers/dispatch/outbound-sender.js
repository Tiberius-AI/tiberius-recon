/**
 * TIBERIUS RECON™ — PRODUCTION MULTI-CHANNEL OUTBOUND DISPATCHER
 * (workers/dispatch/outbound-sender.js)
 *
 * Handles:
 *   1. 1-Tap Approved Outreach Email Dispatch (Resend API / Postmark API / Webhook / Dry-Run Receipt)
 *      with strict `Reply-To` mapped to the contractor's work email.
 *   2. 1-Tap Approved Outreach SMS Dispatch & 6:45 AM Morning Briefing Magic-Link SMS (Twilio REST API).
 *   3. Generates a verifiable RFC-822 / SMS Dispatch Receipt for the Human-in-the-Loop Audit Log.
 */

const {
  buildThreadReplyToAddress,
  buildNativeSimSmsUri,
  dispatchClientOwnedEmail
} = require('../comms-dispatcher');

/**
 * Dispatches an approved 4-sentence intro on behalf of the contractor using 100% Client-Owned channels
 * (Zero Resend / Zero Twilio A2P cold risk):
 *   - SMS: Contractor's own phone via Native SIM (`sms:+1...`)
 *   - Email: Contractor's own connected Shop SMTP (`CLIENT_SMTP_LIVE`) OR Day-1 Native Email App / Gmail / Outlook handoff (`mailto:` / web compose)
 */
async function dispatchApprovedOutreach({ card, contractor, briefing, channel = 'CLIENT_EMAIL' }) {
  const senderCompany = (contractor && contractor.companyName) || 'Lone Star Commercial Trades';
  const senderEmail = (contractor && contractor.workEmail) || '';
  const senderPhone = (contractor && contractor.mobilePhone) || '(830) 555-0194';
  const token =
    (briefing && briefing.magicToken) ||
    (contractor && contractor.magicToken) ||
    'demo-7am-briefing';
  const threadId = `thread-${card.id || 'deal-1'}`;
  const threadReplyTo = buildThreadReplyToAddress(token, threadId);

  const cleanBody = String(card.draftBody || '')
    .replace(/^"|"$/g, '')
    .trim();

  const emailSubject =
    card.draftSubject || `Project Bid Inquiry — ${card.headline || 'Recent Permit Filing'}`;

  const sigContact = senderEmail ? `${senderPhone} | ${senderEmail}` : senderPhone;
  const fullTextBody = `${cleanBody}\n\n—\n${senderCompany}\nDirect: ${sigContact}`;
  const nativeSimUri = buildNativeSimSmsUri(card.contactPhone, cleanBody);
  const isSmsChannel = String(channel || '').toUpperCase().includes('SMS');

  let emailResult = null;
  if (!isSmsChannel) {
    emailResult = await dispatchClientOwnedEmail({
      contractor: contractor || {},
      recipientEmail: card.contactEmail,
      recipientName: card.contactShort || card.contactName,
      subject: emailSubject,
      bodyText: fullTextBody,
      token,
      threadId,
      requestedChannel: channel
    });
  }

  const dispatchReceipt = {
    receiptId: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    channel,
    provider: isSmsChannel
      ? 'NATIVE_SIM_PROTOCOL'
      : (emailResult && emailResult.provider) || 'CLIENT_NATIVE_EMAIL_HANDOFF',
    fromDisplay: senderEmail ? `${senderCompany} <${senderEmail}>` : senderCompany,
    replyTo: threadReplyTo,
    contractorReplyTo: senderEmail,
    threadId,
    toName: card.contactShort || card.contactName,
    toEmail: card.contactEmail,
    toPhone: card.contactPhone,
    nativeSimUri,
    mailtoUri: emailResult ? emailResult.mailtoUri : undefined,
    gmailWebUri: emailResult ? emailResult.gmailWebUri : undefined,
    outlookWebUri: emailResult ? emailResult.outlookWebUri : undefined,
    preferredComposeUri: emailResult ? emailResult.preferredComposeUri : undefined,
    handoffRequired: isSmsChannel
      ? true
      : Boolean(!emailResult || emailResult.handoffRequired),
    a2pComplianceMode: isSmsChannel
      ? 'NATIVE_SIM_HANDOFF_ZERO_A2P_RISK'
      : 'CLIENT_OWNED_EMAIL_ZERO_SHARED_DOMAIN_RISK',
    subject: emailSubject,
    bodyText: fullTextBody,
    permitReference: card.cardNumber,
    propertyHeadline: card.headline,
    providerStatus: isSmsChannel
      ? 'HANDOFF_TO_CONTRACTOR_PERSONAL_SIM'
      : (emailResult && emailResult.deliveryStatus) || 'HANDOFF_TO_CLIENT_EMAIL_APP',
    liveDispatched: Boolean(emailResult && emailResult.liveDispatched),
    timestamp: new Date().toISOString()
  };

  // Downstream Webhook Forwarding (Make / Zapier / Tiberius Forge) if configured
  if (process.env.OUTREACH_DISPATCH_WEBHOOK_URL) {
    try {
      const resp = await fetch(process.env.OUTREACH_DISPATCH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'TIBERIUS_RECON_1TAP_APPROVED_DISPATCH',
          briefingToken: briefing ? briefing.magicToken : 'demo-7am-briefing',
          dispatchReceipt
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (resp.ok) {
        dispatchReceipt.liveDispatched = true;
        dispatchReceipt.providerStatus = 'WEBHOOK_FORWARDED_OK';
      }
    } catch (_err) {
      // Ignore webhook network errors
    }
  }

  return dispatchReceipt;
}

/**
 * Dispatches the 6:45 AM Morning Briefing Magic-Link SMS to the Contractor.
 */
async function dispatchMorningBriefingSmsToContractor({ contractor, briefing, baseUrl = 'https://www.tiberius.ai' }) {
  const token = (briefing && briefing.magicToken) || 'demo-7am-briefing';
  const link = `${baseUrl.replace(/\/$/, '')}/recon/briefing?token=${encodeURIComponent(token)}`;
  const unlockedCount = briefing && briefing.cards
    ? briefing.cards.filter((c) => !c.isLockedOverflow).length
    : 3;

  const smsText = `☕ Good morning — Your Tiberius Scout swept ${briefing.territoryZip || '78130'} permits & CAD tax rolls overnight. ${unlockedCount} verified ${briefing.tradeName || 'Commercial'} recon cards are ready for your 1-tap approval: ${link}`;

  let twilioSent = false;
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER &&
    contractor &&
    contractor.mobilePhone
  ) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const form = new URLSearchParams();
      form.append('To', contractor.mobilePhone);
      form.append('From', process.env.TWILIO_FROM_NUMBER);
      form.append('Body', smsText);

      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form.toString(),
          signal: AbortSignal.timeout(8000)
        }
      );
      twilioSent = resp.ok;
    } catch (_err) {
      twilioSent = false;
    }
  }

  return {
    ok: true,
    toPhone: (contractor && contractor.mobilePhone) || '(830) 555-0194',
    smsText,
    briefingLink: link,
    twilioSent
  };
}

module.exports = {
  dispatchApprovedOutreach,
  dispatchMorningBriefingSmsToContractor
};
