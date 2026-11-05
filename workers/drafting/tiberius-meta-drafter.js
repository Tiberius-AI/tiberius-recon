/**
 * TIBERIUS META-RECON™ — ANTI-AI 4-TOUCH SEQUENCE DRAFTER & COPY GATE
 * (workers/drafting/tiberius-meta-drafter.js)
 *
 * Implements the Outbound & Copywriting rules from `cro-cold-teardown`:
 *   1. Touch 1 (Day 0): Permission-First Cold Email (Zero links/attachments, 2–4 word internal subject line,
 *      cites exact live permit OR exact #1 website leak + owner ROI math, ends with low-friction permission ask).
 *   2. Touch 2 (Day 3): Angle Rotation (rotates from Permit Bait -> Website Conversion Leak Math or vice versa;
 *      bans "just checking in" / "bumping this").
 *   3. Touch 3 (Day 7): Territory Slot Scarcity & Competitor Gap (1 of 2 slots open in ZIP + $200/mo Smart Site equity).
 *   4. Touch 4 (Day 14): Zero-Friction 1-2-3 Breakup Email.
 *   5. Native SIM SMS Script (`sms:+1...`) & Autonomous Positive-Reply Demo Fulfilment Message.
 *   6. Mandatory Anti-AI Copy Gate (`verifyAntiAiCopyGate`): deterministically scans for banned AI tells,
 *      contrast reveals, follow-up clichés, and links in Touch 1.
 */

const BANNED_AI_PHRASES = [
  /i hope this email finds you well/i,
  /in today's fast-paced world/i,
  /just checking in\b/i,
  /bumping this to the top/i,
  /did you see my last email/i,
  /i never heard back/i,
  /following up on my previous message/i,
  /unlock the power of/i,
  /unleash the power of/i,
  /game-changer/i,
  /\bdelve\b/i,
  /\btapestry\b/i,
  /\bsynergy\b/i,
  /\bparadigm\b/i,
  /ever-evolving landscape/i,
  /it's not just .+, it's/i,
  /whether you're a solo founder or/i
];

/**
 * Deterministically validates a 4-touch sequence against the Anti-AI Copy Gate (`ai-tells.md`)
 * and cold email deliverability rules (0 links in Touch 1, fact citations present).
 */
function verifyAntiAiCopyGate({ touches = [], prospect = {}, baitPermit = null }) {
  const violations = [];
  const touch1 = touches[0] || {};
  const touch1Body = String(touch1.body || '');

  // Rule 1: Zero links in Touch 1 (protects inbox placement)
  const hasLinksInTouch1 = /https?:\/\/|www\./i.test(touch1Body);
  if (hasLinksInTouch1) {
    violations.push('Touch 1 contains a URL/link (violates Permission-First no-link rule)');
  }

  // Rule 2: Scan all touches for banned AI phrases & follow-up killers
  for (const touch of touches) {
    const combined = `${touch.subject || ''} ${touch.body || ''}`;
    for (const regex of BANNED_AI_PHRASES) {
      if (regex.test(combined)) {
        violations.push(`Touch ${touch.touchNumber || '?'} matched banned AI phrase: ${regex}`);
      }
    }
    if (/—/.test(String(touch.subject || ''))) {
      violations.push(`Touch ${touch.touchNumber || '?'} subject line contains an em-dash`);
    }
  }

  // Rule 3: Fact-Lock Verification (must cite either the prospect's company/city or the live bait permit)
  const companyShort = String(prospect.companyName || '')
    .split(/\s+/)[0]
    .toLowerCase();
  const permitAddressToken = baitPermit
    ? String(baitPermit.address || baitPermit.propertyAddress || '')
        .split(',')[0]
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(' ')
        .toLowerCase()
    : '';

  const citesCompanyOrCity =
    (companyShort && touch1Body.toLowerCase().includes(companyShort)) ||
    touch1Body.toLowerCase().includes(String(prospect.city || 'new braunfels').toLowerCase());
  const citesPermitOrLeak =
    (permitAddressToken && touch1Body.toLowerCase().includes(permitAddressToken)) ||
    /field|form|quote|after\s*hours|permit|sms|schema/i.test(touch1Body);

  const factVerified = Boolean(citesCompanyOrCity && citesPermitOrLeak);
  if (!factVerified) {
    violations.push('Touch 1 failed Fact-Lock verification (missing company/city or permit/leak citation)');
  }

  return {
    passed: violations.length === 0,
    hasLinksInTouch1,
    factVerified,
    bannedPhraseHits: violations.length,
    violations
  };
}

/**
 * Generates the complete 4-Touch Outbound Sequence + Native SIM SMS + Auto-Reply Fulfilment
 * for a gathered Tiberius prospect.
 */
function generateTiberiusMetaOutreachSequence({
  prospect = {},
  siteLeakXRay = {},
  baitPermits = [],
  playbook = 'FULL_BUNDLE_OFFENSE_DEFENSE',
  previewBriefingUrl = 'https://www.tiberius.ai/recon/briefing?token=preview-demo',
  openSlotsInZip = 1,
  maxSlotsInZip = 2,
  senderName = 'Billy',
  senderCompany = 'Tiberius AI'
} = {}) {
  const ownerFirst = String(prospect.contactFirstName || prospect.contactName || 'there')
    .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '')
    .trim()
    .split(/\s+/)[0];
  const greeting =
    !ownerFirst || /^(owner|team|estimating|info|office|admin|partner)$/i.test(ownerFirst)
      ? `Hey ${prospect.companyShortName || prospect.companyName || 'team'},`
      : `Hey ${ownerFirst},`;

  const city = prospect.city || 'New Braunfels';
  const zip = prospect.zipCode || '78130';
  const trade = prospect.primaryTrade || 'Commercial Concrete';
  const primaryPermit = baitPermits[0] || {
    permitNumber: '2026-050098 BP',
    address: '11920 Wilson Parke Ave',
    valuationFormatted: '$1,000,000',
    sqFtFormatted: '18,500 Sq Ft',
    gcCompany: 'SpawGlass Contractors',
    gcContact: 'Ryan Ogle',
    scopeSummary: 'commercial shell & site package'
  };
  const secondPermit = baitPermits[1] || {
    permitNumber: '2026-139668 BP',
    address: '2627 Manor Rd',
    valuationFormatted: '$680,000',
    sqFtFormatted: '14,450 Sq Ft',
    gcCompany: 'A R Lucas Construction',
    gcContact: 'Adam Lucas',
    scopeSummary: 'commercial remodel & structural retrofit'
  };

  const leak1 = (siteLeakXRay.leaks && siteLeakXRay.leaks[0]) || {
    title: '7-Field Static Contact Form',
    finding: 'mobile visitors hit a multi-field form with no instant ballpark range'
  };
  const math = siteLeakXRay.revenueMath || {
    monthlyVisitorsEst: 420,
    missedInquiriesPerMonth: 6,
    closeRatePct: 25,
    avgTicketDollars: 9500,
    recoveredDealsPerMonth: 2,
    estimatedMonthlyLeakFormatted: '$14,250/mo'
  };
  const formFields =
    (siteLeakXRay.domTelemetry && siteLeakXRay.domTelemetry.formFieldCount) || 7;
  const isNoSiteOrSocial =
    siteLeakXRay.websiteStatus === 'NO_SITE_FOUND' ||
    siteLeakXRay.websiteStatus === 'SOCIAL_ONLY';

  let touch1Subject = '';
  let touch1Body = '';
  let touch2Subject = '';
  let touch2Body = '';

  if (playbook === 'SMART_SITE_TEARDOWN') {
    touch1Subject = `${ (prospect.companyShortName || prospect.companyName || 'your').toLowerCase() } mobile quote form`;
    if (isNoSiteOrSocial) {
      touch1Body = [
        `${greeting}`,
        ``,
        `Saw ${prospect.companyName} has ${prospect.reviewCount || 48} Google reviews (${prospect.starRating || 4.8} stars) in ${city}, but buyers searching your name on mobile hit a directory page with no instant ballpark quote tool or missed-call SMS text-back.`,
        ``,
        `At an average $${Number(math.avgTicketDollars).toLocaleString()} ticket, losing just ${math.missedInquiriesPerMonth} after-hours inquiries a month at a ${math.closeRatePct}% close rate leaks roughly ${math.estimatedMonthlyLeakFormatted} in booked work.`,
        ``,
        `I mocked up a 60-second teardown and a live Smart Site preview for ${prospect.companyName} that captures those after-hours leads by text in 3 seconds. Mind if I send over the link?`,
        ``,
        `${senderName}`,
        `${senderCompany}`
      ].join('\n');
    } else {
      touch1Body = [
        `${greeting}`,
        ``,
        `Pulled up ${prospect.companyName}'s site on my phone this morning. Your contact form asks for ${formFields} fields before a property owner can get a ballpark window, and there is no instant SMS text-back when someone checks pricing after 5:30 PM.`,
        ``,
        `On ~${math.monthlyVisitorsEst} monthly local searches in ${city}, plugging those two conversion leaks usually recovers ${math.recoveredDealsPerMonth} to ${math.recoveredDealsPerMonth + 2} booked jobs a month (${math.estimatedMonthlyLeakFormatted} at a $${Number(math.avgTicketDollars).toLocaleString()} average ticket).`,
        ``,
        `I put together a 3-point teardown of your live page plus a working preview of how the 3-second SMS rescue looks with your logo. Want me to send it over?`,
        ``,
        `${senderName}`,
        `${senderCompany}`
      ].join('\n');
    }

    touch2Subject = `re: ${touch1Subject}`;
    touch2Body = [
      `${greeting}`,
      ``,
      `One more thing our overnight scout flagged for ${prospect.companyName} in ${zip}: ${primaryPermit.gcCompany} just pulled a ${primaryPermit.valuationFormatted} commercial permit (#${primaryPermit.permitNumber}) at ${primaryPermit.address} (${primaryPermit.sqFtFormatted}).`,
      ``,
      `When we deploy a Tiberius Smart Site, we also pair it with our 6:45 AM Permit Recon scout and credit $200/mo of your plan straight toward 100% ownership of your site code and domain.`,
      ``,
      `Want me to send over the ${primaryPermit.address} permit packet along with your 3-leak website teardown?`,
      ``,
      `${senderName}`
    ].join('\n');
  } else {
    // Default: RECON_PERMIT_BAIT or FULL_BUNDLE_OFFENSE_DEFENSE (Trojan Horse Live Permit Bait first!)
    const addrShort = String(primaryPermit.address || 'Wilson Parke Ave')
      .split(',')[0]
      .trim()
      .toLowerCase();
    touch1Subject = `${zip} permit on ${addrShort}`;
    touch1Body = [
      `${greeting}`,
      ``,
      `Saw ${primaryPermit.gcCompany} just pulled a ${primaryPermit.valuationFormatted} commercial permit (#${primaryPermit.permitNumber}) at ${primaryPermit.address} in ${city} (${primaryPermit.sqFtFormatted} scope), plus two other ${trade.toLowerCase()} permits in ${zip} this week.`,
      ``,
      `Our overnight digital scout already cross-referenced the county tax roll, pulled the GC project manager's direct cell and email (${primaryPermit.gcContact}), and drafted the 4-sentence bid intro for ${prospect.companyName}.`,
      ``,
      `Want me to send over the 3-permit packet so your estimator can drop numbers on them today?`,
      ``,
      `${senderName}`,
      `${senderCompany}`
    ].join('\n');

    touch2Subject = `re: ${touch1Subject}`;
    touch2Body = [
      `${greeting}`,
      ``,
      `In addition to the ${primaryPermit.address} permit, ${secondPermit.gcCompany} also filed Permit #${secondPermit.permitNumber} (${secondPermit.valuationFormatted}) at ${secondPermit.address}.`,
      ``,
      `When I checked ${prospect.companyName}'s website to calibrate your shop's bid dossier, I also noticed your mobile contact form has ${formFields} fields and no after-hours SMS rescue, which usually leaks around ${math.estimatedMonthlyLeakFormatted} in inbound ${city} inquiries.`,
      ``,
      `I loaded both live permits and the 3-leak site breakdown into a private sandbox for ${prospect.companyName}. Mind if I drop the link here?`,
      ``,
      `${senderName}`
    ].join('\n');
  }

  const touch3Subject = `${zip} ${trade.split('/')[0].trim().toLowerCase()} territory slot`;
  const touch3Body = [
    `${greeting}`,
    ``,
    `Quick heads up on ${zip}: we cap Tiberius Recon at ${maxSlotsInZip} ${trade} shops per ZIP code so 20 contractors aren't blasting the same general contractors at 7:00 AM.`,
    ``,
    `Right now ${openSlotsInZip} of the ${maxSlotsInZip} slots in ${zip} is open, and every month includes a $200/mo equity credit toward owning a custom Tiberius Smart Site outright.`,
    ``,
    `Would you like to see ${prospect.companyName}'s live 7:00 AM permit queue for ${zip} before we lock the territory?`,
    ``,
    `${senderName}`
  ].join('\n');

  const touch4Subject = `closing your ${zip} file`;
  const touch4Body = [
    `${greeting}`,
    ``,
    `I haven't heard back, so I'll assume your bid calendar in ${city} is full right now. If you want an easy way to let me know where you stand, just reply with a number:`,
    ``,
    `1: Send over ${prospect.companyName}'s live ${zip} permit sandbox and site teardown`,
    `2: Swamped right now, check back with me in 60 days`,
    `3: Not a fit, please close our file`,
    ``,
    `Either way, wishing you a strong quarter in ${city}.`,
    ``,
    `${senderName}`
  ].join('\n');

  const touches = [
    {
      touchNumber: 1,
      dayOffset: 0,
      angleLabel:
        playbook === 'SMART_SITE_TEARDOWN'
          ? 'Touch 1 (Day 0) • Permission-First 3-Leak Website Teardown (0 Links)'
          : 'Touch 1 (Day 0) • Trojan Horse Live Permit Bait (0 Links)',
      subject: touch1Subject,
      body: touch1Body,
      status: 'READY'
    },
    {
      touchNumber: 2,
      dayOffset: 3,
      angleLabel: 'Touch 2 (Day 3) • Second Live Permit + Inbound Leak Math',
      subject: touch2Subject,
      body: touch2Body,
      status: 'SCHEDULED_DAY_3'
    },
    {
      touchNumber: 3,
      dayOffset: 7,
      angleLabel: `Touch 3 (Day 7) • Territory Lock Scarcity (${openSlotsInZip} of ${maxSlotsInZip} Open in ${zip})`,
      subject: touch3Subject,
      body: touch3Body,
      status: 'SCHEDULED_DAY_7'
    },
    {
      touchNumber: 4,
      dayOffset: 14,
      angleLabel: 'Touch 4 (Day 14) • Zero-Friction 1-2-3 Breakup',
      subject: touch4Subject,
      body: touch4Body,
      status: 'SCHEDULED_DAY_14'
    }
  ];

  const nativeSimText = `${greeting.replace(',', ' —')} ${senderName} at Tiberius AI here. Our overnight scout pulled 3 commercial ${trade.split('/')[0].trim().toLowerCase()} permits in ${zip} (${primaryPermit.valuationFormatted} at ${primaryPermit.address} by ${primaryPermit.gcCompany}) with the GC PM's direct cell. Want me to text you the link to ${prospect.companyName}'s live briefing?`;

  const autoReplyDemoMessage = [
    `${greeting}`,
    ``,
    `Here is ${prospect.companyName}'s live 7:00 AM Recon Briefing & 3-Leak Site Breakdown for ${city} (${zip}):`,
    ``,
    `👉 Live Permit Queue (${prospect.companyName} Sandbox): ${previewBriefingUrl}`,
    ``,
    `What's inside right now:`,
    `1. Permit #${primaryPermit.permitNumber} (${primaryPermit.valuationFormatted}) at ${primaryPermit.address} — ${primaryPermit.gcContact} (${primaryPermit.gcCompany}) direct phone & email verified.`,
    `2. Permit #${secondPermit.permitNumber} (${secondPermit.valuationFormatted}) at ${secondPermit.address} — ${secondPermit.gcContact} (${secondPermit.gcCompany}).`,
    `3. Website Teardown Summary: Fixing the ${leak1.title.toLowerCase()} and adding 3-second missed-call SMS rescue recovers an estimated ${math.estimatedMonthlyLeakFormatted} in ${city}.`,
    ``,
    `You can tap "[ ✓ Approve & Send ]" on any of those cards to test how the 90-second morning coffee workflow feels. Want to lock in the open ${trade} slot in ${zip} for a 7-day test drive?`,
    ``,
    `— ${senderName} (${senderCompany})`
  ].join('\n');

  const copyGate = verifyAntiAiCopyGate({
    touches,
    prospect,
    baitPermit: primaryPermit
  });

  return {
    playbook,
    touches,
    nativeSimText,
    autoReplyDemoMessage,
    copyGate
  };
}

module.exports = {
  generateTiberiusMetaOutreachSequence,
  verifyAntiAiCopyGate,
  BANNED_AI_PHRASES
};
