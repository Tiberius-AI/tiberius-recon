/**
 * POST /api/recon/activate
 * Activates a Contractor's 7-Day Territory Test Drive, registers the Zip Code Lock,
 * generates their tailored 7:00 AM Morning Briefing (3 Unlocked + 9 Locked Overflow Cards),
 * and optionally forwards the activation event to LEAD_WEBHOOK_URL.
 */

const {
  activateTerritory,
  updateContractorKnowledgeBase,
  processBriefingAction
} = require('../../db/store');
const { setSessionCookie } = require('../../db/auth');
const {
  dispatchViaResendEmail,
  sendMasterTwilioSmsToContractor
} = require('../../workers/comms-dispatcher');

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
      service: 'Tiberius Recon Territory Activation & Post-Pay Onboarding Endpoint',
      status: 'online'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const rawPassword =
    (body.password && String(body.password).trim()) ||
    (body.accountPassword && String(body.accountPassword).trim()) ||
    String(body.territoryZip || body.zipCode || '78130').trim();

  const activation = activateTerritory({
    primaryTrade: body.primaryTrade || body.trade || 'Commercial Concrete',
    tierLevel: body.tierLevel || body.tier || 'Tier 2: Commercial Permits',
    includeSmartSiteBundle: Boolean(
      body.includeSmartSiteBundle !== undefined ? body.includeSmartSiteBundle : body.smartSiteBundle
    ),
    territoryZip: body.territoryZip || body.zipCode || '75024',
    mobilePhone: body.mobilePhone || body.phone || '(555) 234-5678',
    bestEmail: body.workEmail || body.bestEmail || body.email || 'you@company.com',
    companyName: body.companyName || '',
    ownerName: body.ownerName || '',
    websiteUrl: body.websiteUrl || '',
    minPermitValuation: Number(body.minPermitValuation || body.minValuation || 100000),
    accountPassword: rawPassword,
    isRealClient: Boolean(body.isPaidOnboarding)
  });

  const magicToken = activation.briefing.magicToken;

  // Apply custom Shop Knowledge Base fields if provided during onboarding
  if (body.knowledgeBase && typeof body.knowledgeBase === 'object') {
    const kbIn = body.knowledgeBase;
    const normalizedKb = {
      ...kbIn,
      tradeCategory: kbIn.tradeCategory || body.primaryTrade || undefined,
      coreCapabilities: kbIn.coreCapabilities || kbIn.coreServices || undefined,
      coreServices: kbIn.coreServices || kbIn.coreCapabilities || undefined,
      proofAngles: Array.isArray(kbIn.proofAngles) ? kbIn.proofAngles : undefined,
      certificationsAndBonding:
        kbIn.certificationsAndBonding || kbIn.certsAndBonding || undefined,
      proofProjects:
        kbIn.proofProjects || kbIn.recentCompletedProof || undefined,
      warrantyAndGuarantee:
        kbIn.warrantyAndGuarantee || kbIn.uniqueGuarantee || undefined,
      idealJobProfile:
        kbIn.idealJobProfile || kbIn.idealProjectTypes || undefined
    };
    const kbResult = updateContractorKnowledgeBase({
      token: magicToken,
      knowledgeBase: normalizedKb
    });
    if (kbResult && kbResult.ok && kbResult.contractor) {
      activation.contractor = kbResult.contractor;
    }
  }

  // If this is a post-pay onboarding activation, unlock full daily queue immediately
  if (body.isPaidOnboarding) {
    processBriefingAction({
      token: magicToken,
      action: 'unlock-full-queue',
      upgradeTier: body.tierLevel || activation.contractor.tierLevel
    });
  }

  if (activation.sessionToken) {
    setSessionCookie(res, activation.sessionToken);
  }

  let welcomeEmailReceipt = null;
  let welcomeSmsReceipt = null;

  if (body.sendWelcomeCredentials) {
    const loginUrl = 'https://www.tiberius.ai/recon/login';
    const briefingUrl = `https://www.tiberius.ai/recon/briefing?token=${encodeURIComponent(magicToken)}`;
    const inboxUrl = `https://www.tiberius.ai/recon/inbox?token=${encodeURIComponent(magicToken)}`;
    const commandUrl = `https://www.tiberius.ai/recon/command?token=${encodeURIComponent(magicToken)}`;

    const emailBody = [
      `Welcome to Tiberius Recon™, ${activation.contractor.ownerName}!`,
      ``,
      `Your territory (${activation.briefing.territoryZip} — ${activation.briefing.metroCity}) and Shop Knowledge Base for ${activation.contractor.companyName} are now locked and active.`,
      ``,
      `=========================================`,
      `YOUR LOGIN CREDENTIALS`,
      `=========================================`,
      `• Login Portal: ${loginUrl}`,
      `• Login Email / Phone: ${activation.contractor.workEmail} (or ${activation.contractor.mobilePhone})`,
      `• Password: ${rawPassword}`,
      `• Backup Territory PIN: ${activation.contractor.accessPin}`,
      ``,
      `=========================================`,
      `YOUR DIRECT WORKSPACE LINKS`,
      `=========================================`,
      `• 07:00 AM Morning Briefing Cards: ${briefingUrl}`,
      `• 3-Pane Reply & Follow-Up Room: ${inboxUrl}`,
      `• Shop Knowledge Base & Territory Command: ${commandUrl}`,
      ``,
      `Your Digital Scout will sweep ${activation.briefing.portalName} and ${activation.briefing.countyCad} tonight at 2:00 AM and text your cell (${activation.contractor.mobilePhone}) at 6:45 AM.`,
      ``,
      `— Tiberius AI Command`
    ].join('\n');

    const onboardSnapshotB64 = Buffer.from(
      JSON.stringify({
        contractor: {
          ...activation.contractor,
          magicToken,
          isRealClient: true
        },
        rawPassword
      }),
      'utf8'
    ).toString('base64');

    const htmlBody = `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.55; white-space: pre-wrap;">${emailBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre><!-- TIBERIUS_ONBOARD_JSON:${onboardSnapshotB64} -->`;

    welcomeEmailReceipt = await dispatchViaResendEmail({
      contractor: {
        ownerName: 'Tiberius Recon Onboarding',
        companyName: 'Tiberius AI',
        workEmail: 'admin@tiberius.ai'
      },
      recipientEmail: activation.contractor.workEmail,
      recipientName: activation.contractor.ownerName,
      subject: `Welcome to Tiberius Recon™ — Your Login Credentials & ${activation.briefing.territoryZip} Territory Links`,
      bodyText: emailBody,
      htmlBody,
      token: magicToken,
      threadId: 'onboarding-welcome'
    });

    const smsBody = `☕ Welcome to Tiberius Recon, ${
      (activation.contractor.ownerName || 'Partner').split(' ')[0]
    }! Your ${activation.briefing.territoryZip} territory for ${
      activation.contractor.companyName
    } is live. Login at ${loginUrl} (Email: ${
      activation.contractor.workEmail
    } | Pass: ${rawPassword}) or open your 7:00 AM Briefing directly: ${briefingUrl}`;

    welcomeSmsReceipt = await sendMasterTwilioSmsToContractor({
      toPhone: activation.contractor.mobilePhone,
      bodyText: smsBody
    });
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
    magicToken,
    briefingUrl: activation.briefing.briefingUrl,
    inboxUrl: `/recon/inbox?token=${encodeURIComponent(magicToken)}`,
    commandUrl: `/recon/command?token=${encodeURIComponent(magicToken)}`,
    territorySummary: {
      zip: activation.briefing.territoryZip,
      city: activation.briefing.metroCity,
      state: 'TX',
      municipalPortal: activation.briefing.portalName,
      appraisalDistrict: activation.briefing.countyCad
    },
    issuedCredentials: {
      loginUrl: 'https://www.tiberius.ai/recon/login',
      loginEmail: activation.contractor.workEmail,
      loginPhone: activation.contractor.mobilePhone,
      password: rawPassword,
      territoryPin: activation.contractor.accessPin,
      accessPin: activation.contractor.accessPin,
      magicToken
    },
    welcomeEmailReceipt,
    welcomeSmsReceipt,
    webhookForwarded,
    smsPreview: `☕ Tiberius Recon Armed for ${activation.briefing.territoryZip} (${activation.briefing.metroCity}): Your Tiberius Scout will sweep ${activation.briefing.portalName} & ${activation.briefing.countyCad} at 2:00 AM. Preview your live 7:00 AM Briefing now: ${activation.briefing.briefingUrl}`
  });
};
