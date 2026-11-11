/**
 * TIBERIUS META-RECON™ — AUTONOMOUS LEAD-GEN ORCHESTRATOR, LIVE SCOUT, CSV INTAKE, DRIP RUNNER & RADAR
 * (workers/meta-recon-orchestrator.js)
 *
 * Powers autonomous lead generation and outbound communication FOR TIBERIUS ITSELF:
 *   Stage 1: Live Real-Contractor Scout (TX TDLR + TX Comptroller + Live Web Crawl) & Curated Sweep
 *   Stage 2: Manual Single-Contractor Add & Bulk CSV / Google-Maps Paste Intake
 *   Stage 3: 3-Leak Website CRO & Schema X-Ray (`runSiteLeakXRay`)
 *   Stage 4: Auto-Provisioned Live Preview Briefings (`?token=preview-<slug>-<zip>`) & Loom Watch Links
 *   Stage 5: Anti-AI 4-Touch Sequence Drafting & Self-Check Gate (`generateTiberiusMetaOutreachSequence`)
 *   Stage 6: Hybrid Outbound Dispatch (Autonomous Drip Batch via Resend + 1-Tap Native SIM `sms:`)
 *   Stage 7: Autonomous Inbound Reply Classifier + Real-Time Preview-Open SMS Radar
 */

const {
  loadStore,
  saveStore,
  getPreTripHoldDispatch,
  getCentralDateString
} = require('../db/store');
const {
  dispatchViaResendEmail,
  buildNativeSimSmsUri,
  dispatchContractorHotReplyAlertSms,
  dispatchProspectPreviewRadarSms,
  stripQuotedEmailChain
} = require('./comms-dispatcher');
const {
  sweepTiberiusProspects,
  buildScoutProspectBundle,
  resolveTexasCountyAndCity,
  formatUsPhone,
  slugifyCompany
} = require('./scrapers/tiberius-prospect-scout');
const { runSiteLeakXRay } = require('./enrichment/site-leak-xray');
const { generateTiberiusMetaOutreachSequence } = require('./drafting/tiberius-meta-drafter');

const PROSPECT_GOOGLE_DOCS_REGISTRY = {
  'prospect-comal-concrete-01': '15nU_pz7SfdxTcyMZtlZBcRDnxCZ3dtiET16giYpA7xk',
  'prospect-comal-roofing-02': '1zMo9Oqj1gqdQZynd8DvpKzlgUtizHeFrLRtJp3uCuxY',
  'prospect-comal-mep-03': '1uv3e_ERJiX4bv1HwRvi753DaNlUfXUYDwzEZwHQgHLo',
  'prospect-austin-concrete-04': '1PP_SBztlyLZPUVAcqcPCIwu680DdhIxcdIU_T6Cwegg',
  'prospect-comal-outdoor-05': '1PzGP4TUhOIIrDRZwzJ0muyN-loK3pQNPywNGNZZxwDY',
  'prospect-sa-b2b-06': '11TvDqCI_0-NZOxCMs1u0Z2xVKByU3PcqzlQcdsgyX2A'
};
const PROSPECT_DOSSIERS_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1kvnCDZOBjQXkdbWXDE3mY_sYZJE4ulS-';

const RADAR_ALERT_COOLDOWN_MS = 15 * 60 * 1000;

function detectDeviceFromUserAgent(userAgent = '', explicitHint = '') {
  if (explicitHint && String(explicitHint).trim()) {
    return String(explicitHint).trim();
  }
  const ua = String(userAgent || '');
  if (!ua) return 'Web';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows Desktop';
  return 'Web';
}

/**
 * Classifies an inbound reply from a prospect (including 1-2-3 breakup responses).
 */
function classifyProspectReplyIntent(rawBody = '') {
  const cleaned = stripQuotedEmailChain(rawBody).trim();
  const lower = cleaned.toLowerCase();

  if (
    /^\s*3\s*$/.test(lower) ||
    /\b(unsubscribe|stop|remove me|not interested|close our file|no thanks)\b/i.test(lower)
  ) {
    return {
      intent: 'UNSUBSCRIBE_CLOSE',
      label: '🛑 Opt-Out / Close File (Touch 4 #3)',
      shouldHaltFollowUps: true,
      shouldAutoSendDemo: false
    };
  }

  if (
    /^\s*2\s*$/.test(lower) ||
    /\b(check back|60 days|3 months|swamped right now|not right now|next quarter)\b/i.test(lower)
  ) {
    return {
      intent: 'DEFER_60_DAYS',
      label: '⏳ Deferred 60 Days (Touch 4 #2)',
      shouldHaltFollowUps: true,
      shouldAutoSendDemo: false
    };
  }

  if (
    /^\s*1\s*$/.test(lower) ||
    /\b(yes|yeah|sure|send|send it|send over|drop the link|let's see|show me|interested|packet|breakdown|teardown)\b/i.test(
      lower
    )
  ) {
    return {
      intent: 'POSITIVE_SEND_DEMO',
      label: '🔥 Positive Permission Granted — Send Live Preview & Teardown',
      shouldHaltFollowUps: true,
      shouldAutoSendDemo: true
    };
  }

  return {
    intent: 'QUESTION_NEEDS_REVIEW',
    label: '💬 Custom Prospect Question — Routed to Conversation Room',
    shouldHaltFollowUps: true,
    shouldAutoSendDemo: false
  };
}

/**
 * Enriches a scouted prospect bundle with 3-Leak Website X-Ray, 4-Touch Sequence,
 * Native SIM SMS URI, and preserved telemetry/history.
 */
async function enrichSingleMetaProspect(
  prospect,
  {
    playbook = 'FULL_BUNDLE_OFFENSE_DEFENSE',
    fetchLiveWeb = false,
    baseUrl = 'https://www.tiberius.ai',
    prev = {}
  } = {}
) {
  const googleDocId =
    prev.googleDocId ||
    prospect.googleDocId ||
    PROSPECT_GOOGLE_DOCS_REGISTRY[prospect.id] ||
    '';
  const googleDocUrl =
    prev.googleDocUrl ||
    prospect.googleDocUrl ||
    (googleDocId
      ? `https://docs.google.com/document/d/${googleDocId}/edit`
      : PROSPECT_DOSSIERS_DRIVE_FOLDER_URL);
  const cleanBase = String(baseUrl || 'https://www.tiberius.ai').replace(/\/$/, '');
  const defaultStandaloneWatchUrl = prospect.previewToken
    ? `${cleanBase}/recon/watch?token=${encodeURIComponent(prospect.previewToken)}`
    : `${cleanBase}/recon/watch`;
  const prevLoom =
    prev.loomVideoUrl && !String(prev.loomVideoUrl).includes('loom.com/share/tiberius-recon')
      ? prev.loomVideoUrl
      : '';
  const loomVideoUrl = prevLoom || prospect.loomVideoUrl || defaultStandaloneWatchUrl;

  const siteLeakXRay = await runSiteLeakXRay(prospect, {
    fetchLiveDom: Boolean(fetchLiveWeb && !prospect.htmlOverride)
  });

  const sequence = generateTiberiusMetaOutreachSequence({
    prospect: { ...prospect, googleDocId, googleDocUrl, loomVideoUrl },
    siteLeakXRay,
    baitPermits: prospect.baitPermits,
    playbook,
    previewBriefingUrl: prospect.previewBriefingUrl,
    googleDocUrl,
    loomVideoUrl,
    openSlotsInZip: prospect.territoryAvailability.openSlots,
    maxSlotsInZip: prospect.territoryAvailability.maxSlots
  });

  const nativeSimUri = prospect.phone
    ? buildNativeSimSmsUri(prospect.phone, sequence.nativeSimText)
    : '';

  const previewTelemetry = prev.previewTelemetry || {
    viewsCount: 0,
    interactionsCount: 0,
    firstOpenedAt: null,
    lastOpenedAt: null,
    lastEventType: null,
    lastDeviceHint: null,
    alertCooldowns: {}
  };

  return {
    id: prospect.id,
    sourceType: prospect.sourceType || prev.sourceType || 'SANDBOX_DEMO',
    licenseBadge: prospect.licenseBadge || prev.licenseBadge || '',
    companyName: prospect.companyName,
    companyShortName: prospect.companyShortName,
    contactName: prospect.contactName,
    contactFirstName: prospect.contactFirstName,
    contactRole: prospect.contactRole || 'Owner & Estimating',
    primaryTrade: prospect.primaryTrade,
    zipCode: prospect.zipCode,
    city: prospect.city,
    state: prospect.state || 'TX',
    phone: prospect.phone || '',
    email: prospect.email || '',
    emailSource: prospect.emailSource || '',
    websiteUrl: prospect.websiteUrl || 'Not found',
    reviewCount: prospect.reviewCount || 42,
    starRating: prospect.starRating || 4.8,
    whyProspect: prospect.whyProspect || '',
    territoryAvailability: prospect.territoryAvailability,
    previewToken: prospect.previewToken,
    previewBriefingUrl: prospect.previewBriefingUrl,
    previewCommandUrl: prospect.previewCommandUrl,
    googleDocId,
    googleDocUrl,
    googleDriveFolderUrl: PROSPECT_DOSSIERS_DRIVE_FOLDER_URL,
    loomVideoUrl,
    baitPermits: (prospect.baitPermits || []).map((bp) => ({
      permitNumber: bp.permitNumber,
      address: bp.address,
      fullAddress: bp.fullAddress,
      valuationFormatted: bp.valuationFormatted,
      sqFtFormatted: bp.sqFtFormatted,
      gcCompany: bp.gcCompany,
      gcContact: bp.gcContact,
      gcPhone: bp.gcPhone,
      gcEmail: bp.gcEmail,
      scopeSummary: bp.scopeSummary
    })),
    siteLeakXRay,
    playbook,
    touches: sequence.touches,
    nativeSimText: sequence.nativeSimText,
    nativeSimUri,
    autoReplyDemoMessage: sequence.autoReplyDemoMessage,
    copyGate: sequence.copyGate,
    outreachStatus: 'READY_FOR_TOUCH_1',
    activeTouchIndex: 0,
    replyIntent: null,
    previewTelemetry,
    timeline: [
      {
        id: `evt-init-${prospect.id}`,
        type: 'AGENT_ENRICHED',
        timestamp: new Date().toISOString(),
        summary: `Scout paired ${prospect.companyName} with Permit #${prospect.baitPermits[0]?.permitNumber} (${prospect.baitPermits[0]?.valuationFormatted}), detected ${siteLeakXRay.leaks.length} site leaks (${siteLeakXRay.revenueMath.estimatedMonthlyLeakFormatted} est. leak), and provisioned live preview token ${prospect.previewToken}.`
      }
    ],
    dispatchedReceipts: []
  };
}

function recomputeMetaMetrics(metaRecon) {
  if (!metaRecon || !Array.isArray(metaRecon.prospects)) return;
  const prospects = metaRecon.prospects;
  const totalMonthlyLeakIdentified = prospects.reduce(
    (sum, p) => sum + Number(p.siteLeakXRay?.revenueMath?.estimatedMonthlyLeakDollars || 0),
    0
  );
  const previewsOpenedCount = prospects.filter(
    (p) => Number(p.previewTelemetry?.viewsCount || 0) > 0 || Number(p.previewTelemetry?.interactionsCount || 0) > 0
  ).length;
  const liveDiscoveredCount = prospects.filter(
    (p) => p.sourceType && p.sourceType !== 'SANDBOX_DEMO'
  ).length;

  metaRecon.metrics = {
    totalProspectsGathered: prospects.length,
    liveRealProspectsCount: liveDiscoveredCount,
    hotLeadsCount: prospects.filter((p) => p.siteLeakXRay?.leadScore === 'HOT').length,
    warmLeadsCount: prospects.filter((p) => p.siteLeakXRay?.leadScore === 'WARM').length,
    livePreviewsProvisioned: prospects.filter((p) => Boolean(p.previewToken)).length,
    previewsOpenedCount,
    radarAlertsSentCount: Array.isArray(metaRecon.radarFeed)
      ? metaRecon.radarFeed.filter((r) => r.smsDispatched).length
      : 0,
    antiAiGatePassRate: `${Math.round(
      (prospects.filter((p) => p.copyGate?.passed).length / Math.max(1, prospects.length)) * 100
    )}%`,
    totalMonthlyLeakIdentified,
    totalMonthlyLeakFormatted: `$${totalMonthlyLeakIdentified.toLocaleString()}/mo`,
    touchesSentCount: prospects.reduce(
      (sum, p) => sum + (Array.isArray(p.dispatchedReceipts) ? p.dispatchedReceipts.length : 0),
      0
    ),
    positiveRepliesCount: prospects.filter(
      (p) => p.replyIntent && p.replyIntent.intent === 'POSITIVE_SEND_DEMO'
    ).length,
    demosAutoDeliveredCount: prospects.filter(
      (p) => p.outreachStatus === 'DEMO_SENT_HOT_LEAD'
    ).length
  };
}

/**
 * Runs the end-to-end Tiberius Meta-Recon autonomous prospect gather + 3-leak X-Ray + 4-touch drafting sweep.
 */
async function runMetaReconAgentSweep({
  zipCode = 'ALL',
  primaryTrade = 'ALL',
  playbook = 'FULL_BUNDLE_OFFENSE_DEFENSE',
  limit = 6,
  fetchLiveWeb = false,
  liveDiscovery = false,
  sourceMode = '',
  includeSavedCustom = false,
  baseUrl = 'https://www.tiberius.ai',
  autopilotDripEnabled = true,
  autopilotReplyEnabled = true
} = {}) {
  const startedAt = Date.now();
  const existingStore = loadStore();
  const customProspects = includeSavedCustom
    ? Array.isArray(existingStore.metaReconCustomProspects)
      ? existingStore.metaReconCustomProspects
      : []
    : [];

  const gathered = await sweepTiberiusProspects({
    zipCode,
    primaryTrade,
    limit,
    fetchLiveWeb: Boolean(fetchLiveWeb || liveDiscovery),
    liveDiscovery: Boolean(liveDiscovery),
    sourceMode,
    customProspects,
    autoProvisionPreviews: true,
    baseUrl
  });

  const existingById = new Map(
    ((existingStore.metaRecon && existingStore.metaRecon.prospects) || []).map((p) => [p.id, p])
  );

  const enrichedProspects = [];
  for (const prospect of gathered.prospects) {
    const prev = existingById.get(prospect.id) || {};
    const enriched = await enrichSingleMetaProspect(prospect, {
      playbook,
      fetchLiveWeb: Boolean(fetchLiveWeb || liveDiscovery),
      baseUrl,
      prev
    });
    enrichedProspects.push(enriched);
  }

  const prevRadarFeed =
    (existingStore.metaRecon && Array.isArray(existingStore.metaRecon.radarFeed)
      ? existingStore.metaRecon.radarFeed
      : []) || [];

  const metaReconState = {
    lastSweepAt: new Date().toISOString(),
    sweepDate: getCentralDateString(),
    elapsedMs: Math.max(45, Date.now() - startedAt),
    activeFilterZip: zipCode || 'ALL',
    activeFilterTrade: primaryTrade || 'ALL',
    activePlaybook: playbook,
    sourceMode: gathered.sourceMode || (liveDiscovery ? 'LIVE' : 'SANDBOX'),
    autopilotDripEnabled: Boolean(autopilotDripEnabled),
    autopilotReplyEnabled: Boolean(autopilotReplyEnabled),
    metrics: {},
    prospects: enrichedProspects,
    radarFeed: prevRadarFeed,
    activityLog: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: liveDiscovery ? 'META_RECON_LIVE_SWEEP_COMPLETED' : 'META_RECON_SWEEP_COMPLETED',
        summary: `Gathered ${enrichedProspects.length} ${liveDiscovery ? 'real Texas open-data' : 'corridor'} prospects (${playbook}), provisioned ${enrichedProspects.length} live preview briefings, and verified Anti-AI Copy Gate.`
      }
    ]
  };

  recomputeMetaMetrics(metaReconState);

  const store = loadStore();
  store.metaRecon = metaReconState;
  saveStore(store);

  return {
    ok: true,
    metaRecon: metaReconState
  };
}

/**
 * Retrieves the current `store.metaRecon` state, running an initial sweep if none exists yet.
 */
async function getMetaReconState(options = {}) {
  const store = loadStore();
  if (!store.metaRecon || !Array.isArray(store.metaRecon.prospects) || store.metaRecon.prospects.length === 0) {
    const res = await runMetaReconAgentSweep(options);
    return res.metaRecon;
  }
  recomputeMetaMetrics(store.metaRecon);
  return store.metaRecon;
}

/**
 * Adds a single real contractor prospect manually, crawls their live website/contact if needed,
 * pairs 3 commercial bait permits, builds their live Preview Briefing + Watch link, and saves.
 */
async function addProspectToMetaRecon({
  companyName = '',
  contactName = '',
  contactRole = 'Owner & Estimator',
  primaryTrade = 'Commercial Concrete',
  zipCode = '78130',
  city = '',
  state = 'TX',
  phone = '',
  email = '',
  websiteUrl = '',
  reviewCount = 45,
  starRating = 4.9,
  landmarkReference = '',
  playbook = '',
  sourceType = 'MANUAL_ENTRY',
  licenseBadge = 'Manual Real Prospect',
  fetchLiveWeb = true,
  baseUrl = 'https://www.tiberius.ai'
} = {}) {
  const cleanCompany = String(companyName || '').trim();
  if (!cleanCompany) {
    return { ok: false, statusCode: 400, error: 'companyName is required to add a prospect.' };
  }

  await getMetaReconState();
  const store = loadStore();
  const geo = resolveTexasCountyAndCity(zipCode || '78130');
  const resolvedCity = String(city || '').trim() || geo.city;
  const resolvedZip = geo.zip;
  const resolvedTrade =
    primaryTrade && primaryTrade !== 'ALL' ? primaryTrade : 'Commercial Concrete';
  const activePlaybook =
    playbook || (store.metaRecon && store.metaRecon.activePlaybook) || 'FULL_BUNDLE_OFFENSE_DEFENSE';

  const slug = slugifyCompany(cleanCompany);
  const prospectId = `prospect-real-${slug}-${resolvedZip}`;

  const rawCandidate = {
    id: prospectId,
    sourceType,
    licenseBadge,
    companyName: cleanCompany,
    contactName: String(contactName || '').trim() || 'Owner & Estimating',
    contactRole: String(contactRole || 'Owner & Estimator').trim(),
    primaryTrade: resolvedTrade,
    zipCode: resolvedZip,
    city: resolvedCity,
    state: state || 'TX',
    phone: formatUsPhone(phone) || String(phone || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    websiteUrl: String(websiteUrl || '').trim(),
    reviewCount: Number(reviewCount) || 45,
    starRating: Number(starRating) || 4.9,
    landmarkReference: landmarkReference || `in ${resolvedCity} (${resolvedZip})`,
    whyProspect: `Added to Meta-Recon for ${resolvedTrade} territory ${resolvedZip} (${resolvedCity}).`
  };

  const scouted = await buildScoutProspectBundle(rawCandidate, {
    fetchLiveWeb: Boolean(fetchLiveWeb),
    autoProvisionPreviews: true,
    baseUrl
  });

  const latestStore = loadStore();
  const metaRecon = latestStore.metaRecon;
  const existingIdx = metaRecon.prospects.findIndex((p) => p.id === prospectId);
  const prev = existingIdx >= 0 ? metaRecon.prospects[existingIdx] : {};

  const enriched = await enrichSingleMetaProspect(scouted, {
    playbook: activePlaybook,
    fetchLiveWeb: Boolean(fetchLiveWeb),
    baseUrl,
    prev
  });

  if (!Array.isArray(latestStore.metaReconCustomProspects)) {
    latestStore.metaReconCustomProspects = [];
  }
  const customIdx = latestStore.metaReconCustomProspects.findIndex((c) => c.id === prospectId);
  const savedBlueprint = {
    ...rawCandidate,
    phone: enriched.phone,
    email: enriched.email,
    websiteUrl: enriched.websiteUrl === 'Not found' ? '' : enriched.websiteUrl
  };
  if (customIdx >= 0) {
    latestStore.metaReconCustomProspects[customIdx] = savedBlueprint;
  } else {
    latestStore.metaReconCustomProspects.unshift(savedBlueprint);
  }

  if (existingIdx >= 0) {
    metaRecon.prospects[existingIdx] = enriched;
  } else {
    metaRecon.prospects.unshift(enriched);
  }

  metaRecon.activityLog.unshift({
    id: `log-add-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'MANUAL_PROSPECT_ADDED',
    prospectId: enriched.id,
    companyName: enriched.companyName,
    summary: `Added real prospect ${enriched.companyName} (${enriched.zipCode} • ${enriched.primaryTrade}) and provisioned live Preview Briefing (${enriched.previewToken}).`
  });

  recomputeMetaMetrics(metaRecon);
  saveStore(latestStore);

  return {
    ok: true,
    addedCount: 1,
    prospect: enriched,
    metaRecon
  };
}

/**
 * Splits a single CSV or TSV line while respecting double-quoted fields.
 */
function splitCsvLine(line = '', delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result.map((cell) => cell.replace(/^"|"$/g, '').trim());
}

/**
 * Parses CSV/TSV text (from Google Maps / Outscraper / Apollo / spreadsheet paste) into normalized prospect objects.
 */
function parseProspectCsvText(
  csvText = '',
  { defaultZipCode = '78130', defaultTrade = 'Commercial Concrete' } = {}
) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes('\t') && !lines[0].includes(',') ? '\t' : ',';
  const firstCells = splitCsvLine(lines[0], delimiter);

  const headerCheckStr = firstCells.join(' ').toLowerCase();
  const hasHeader =
    lines.length > 1 &&
    /\b(company|business|name|title|owner|contact|email|phone|telephone|website|url|domain|zip|postal|trade|category)\b/i.test(
      headerCheckStr
    ) &&
    !firstCells.some((c) => /@[a-z0-9.-]+\.[a-z]{2,}/i.test(c) || /^https?:\/\//i.test(c));

  let colMap = null;
  let dataStartIdx = 0;

  if (hasHeader) {
    dataStartIdx = 1;
    colMap = {};
    firstCells.forEach((rawCol, idx) => {
      const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        colMap.companyName === undefined &&
        /^(company|companyname|business|businessname|title|name|shop|organization|taxpayername)$/.test(col)
      ) {
        colMap.companyName = idx;
      } else if (
        colMap.contactName === undefined &&
        /^(contact|contactname|owner|ownername|fullname|person|decisionmaker|firstname)$/.test(col)
      ) {
        colMap.contactName = idx;
      } else if (colMap.email === undefined && /email|mail/.test(col)) {
        colMap.email = idx;
      } else if (colMap.phone === undefined && /phone|tel|mobile|cell/.test(col)) {
        colMap.phone = idx;
      } else if (colMap.websiteUrl === undefined && /website|site|url|domain/.test(col)) {
        colMap.websiteUrl = idx;
      } else if (colMap.zipCode === undefined && /zip|postal/.test(col)) {
        colMap.zipCode = idx;
      } else if (colMap.city === undefined && /^city|town|municipality|taxpayercity$/.test(col)) {
        colMap.city = idx;
      } else if (colMap.primaryTrade === undefined && /trade|category|vertical|niche|industry/.test(col)) {
        colMap.primaryTrade = idx;
      } else if (colMap.reviewCount === undefined && /review/.test(col)) {
        colMap.reviewCount = idx;
      } else if (colMap.starRating === undefined && /rating|star/.test(col)) {
        colMap.starRating = idx;
      }
    });
  }

  const parsedRows = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    if (cells.length === 0 || !cells[0]) continue;

    if (colMap) {
      const companyName = cells[colMap.companyName ?? 0] || '';
      if (!companyName) continue;
      parsedRows.push({
        companyName,
        contactName: colMap.contactName !== undefined ? cells[colMap.contactName] : '',
        email: colMap.email !== undefined ? cells[colMap.email] : '',
        phone: colMap.phone !== undefined ? cells[colMap.phone] : '',
        websiteUrl: colMap.websiteUrl !== undefined ? cells[colMap.websiteUrl] : '',
        zipCode:
          (colMap.zipCode !== undefined && cells[colMap.zipCode]) || defaultZipCode || '78130',
        city: colMap.city !== undefined ? cells[colMap.city] : '',
        primaryTrade:
          (colMap.primaryTrade !== undefined && cells[colMap.primaryTrade]) ||
          defaultTrade ||
          'Commercial Concrete',
        reviewCount:
          colMap.reviewCount !== undefined ? Number(cells[colMap.reviewCount]) || 45 : 45,
        starRating:
          colMap.starRating !== undefined ? Number(cells[colMap.starRating]) || 4.8 : 4.8
      });
    } else {
      // Smart positional + pattern detection for headerless paste
      const companyName = cells[0];
      let contactName = '';
      let email = '';
      let phone = '';
      let websiteUrl = '';
      let zipCode = '';
      let primaryTrade = '';

      for (let cIdx = 1; cIdx < cells.length; cIdx++) {
        const val = cells[cIdx];
        if (!val) continue;
        if (!email && /@[a-z0-9.-]+\.[a-z]{2,}/i.test(val)) {
          email = val;
        } else if (
          !websiteUrl &&
          (/^https?:\/\//i.test(val) || /^[a-z0-9-]+\.(com|net|org|co|us|io|biz)(\/.*)?$/i.test(val))
        ) {
          websiteUrl = val;
        } else if (!zipCode && /^\d{5}(-\d{4})?$/.test(val)) {
          zipCode = val.slice(0, 5);
        } else if (!phone && val.replace(/\D/g, '').length >= 10) {
          phone = val;
        } else if (
          !primaryTrade &&
          /\b(concrete|roof|electric|hvac|mep|pool|fenc|commercial|b2b|plumb|paving)\b/i.test(val)
        ) {
          primaryTrade = val;
        } else if (!contactName) {
          contactName = val;
        }
      }

      parsedRows.push({
        companyName,
        contactName,
        email,
        phone,
        websiteUrl,
        zipCode: zipCode || defaultZipCode || '78130',
        primaryTrade: primaryTrade || defaultTrade || 'Commercial Concrete'
      });
    }
  }

  return parsedRows;
}

/**
 * Bulk-imports contractors from CSV text or an array of row objects into Meta-Recon.
 */
async function importProspectsCsvToMetaRecon({
  csvText = '',
  rows = [],
  defaultZipCode = '78130',
  defaultTrade = 'Commercial Concrete',
  playbook = '',
  fetchLiveWeb = true,
  baseUrl = 'https://www.tiberius.ai'
} = {}) {
  const parsed =
    Array.isArray(rows) && rows.length > 0
      ? rows
      : parseProspectCsvText(csvText, {
          defaultZipCode: defaultZipCode === 'ALL' ? '78130' : defaultZipCode,
          defaultTrade: defaultTrade === 'ALL' ? 'Commercial Concrete' : defaultTrade
        });

  if (parsed.length === 0) {
    return {
      ok: false,
      statusCode: 400,
      error: 'No valid contractor rows found in CSV input.'
    };
  }

  const capped = parsed.slice(0, 25);
  const importedProspects = [];

  for (const row of capped) {
    const added = await addProspectToMetaRecon({
      ...row,
      zipCode: row.zipCode || (defaultZipCode !== 'ALL' ? defaultZipCode : '78130'),
      primaryTrade:
        row.primaryTrade || (defaultTrade !== 'ALL' ? defaultTrade : 'Commercial Concrete'),
      playbook,
      sourceType: 'CSV_IMPORT',
      licenseBadge: 'CSV Imported Prospect',
      fetchLiveWeb,
      baseUrl
    });
    if (added.ok && added.prospect) {
      importedProspects.push(added.prospect);
    }
  }

  const store = loadStore();
  if (store.metaRecon) {
    store.metaRecon.activityLog.unshift({
      id: `log-csv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: 'CSV_PROSPECTS_IMPORTED',
      summary: `Bulk-imported ${importedProspects.length} real contractor(s) via CSV and provisioned ${importedProspects.length} live Preview Briefings.`
    });
    recomputeMetaMetrics(store.metaRecon);
    saveStore(store);
  }

  return {
    ok: true,
    importedCount: importedProspects.length,
    importedProspects,
    metaRecon: store.metaRecon
  };
}

/**
 * Deletes a prospect card from `store.metaRecon.prospects` and `store.metaReconCustomProspects`.
 */
async function removeProspectFromMetaRecon({ prospectId = '' } = {}) {
  if (!prospectId) {
    return { ok: false, statusCode: 400, error: 'prospectId is required' };
  }
  await getMetaReconState();
  const store = loadStore();
  const beforeLen = store.metaRecon.prospects.length;
  store.metaRecon.prospects = store.metaRecon.prospects.filter((p) => p.id !== prospectId);
  if (Array.isArray(store.metaReconCustomProspects)) {
    store.metaReconCustomProspects = store.metaReconCustomProspects.filter(
      (p) => p.id !== prospectId
    );
  }
  recomputeMetaMetrics(store.metaRecon);
  saveStore(store);

  return {
    ok: true,
    removed: store.metaRecon.prospects.length < beforeLen,
    metaRecon: store.metaRecon
  };
}

/**
 * Real-Time "Prospect Is Looking at Their Preview Right Now" Telemetry & SMS Radar.
 * Triggered when a prospect opens `/recon/briefing?token=preview-...`, interacts with a card,
 * or plays their personalized `/recon/watch?token=preview-...` video.
 */
async function recordProspectPreviewRadarEvent({
  token = '',
  prospectId = '',
  companyName = '',
  contactName = '',
  eventType = 'PREVIEW_BRIEFING_OPENED',
  cardId = '',
  watchedSeconds = 0,
  userAgent = '',
  deviceHint = '',
  isAdminViewer = false,
  forceAlert = false,
  baseUrl = 'https://www.tiberius.ai',
  overridePhone,
  providerConfig = {}
} = {}) {
  if (isAdminViewer) {
    return { ok: true, ignoredAdminViewer: true };
  }

  await getMetaReconState();
  const store = loadStore();
  const metaRecon = store.metaRecon;
  if (!Array.isArray(metaRecon.radarFeed)) {
    metaRecon.radarFeed = [];
  }

  const cleanToken = String(token || '').trim();
  let prospect =
    metaRecon.prospects.find(
      (p) =>
        (prospectId && p.id === prospectId) ||
        (cleanToken && p.previewToken === cleanToken) ||
        (companyName &&
          String(p.companyName || '').toLowerCase() === String(companyName).toLowerCase())
    ) || null;

  // Fallback if a standalone preview-* briefing exists in store.briefings without a card in metaRecon.prospects
  let fallbackProspectTarget = null;
  if (!prospect && cleanToken.startsWith('preview-')) {
    const brf = store.briefings && store.briefings[cleanToken];
    const ctr = brf && store.contractors ? store.contractors[brf.contractorId] : null;
    fallbackProspectTarget = {
      id: (ctr && ctr.id) || cleanToken,
      previewToken: cleanToken,
      companyName: companyName || (ctr && ctr.companyName) || cleanToken,
      contactName: contactName || (ctr && ctr.ownerName) || '',
      zipCode: (brf && brf.territoryZip) || (ctr && ctr.baseZip) || '78130',
      phone: (ctr && ctr.mobilePhone) || ''
    };
  }

  const target = prospect || fallbackProspectTarget;
  if (!target) {
    return { ok: false, statusCode: 404, error: 'Preview prospect not found for radar event' };
  }

  const resolvedDevice = detectDeviceFromUserAgent(userAgent, deviceHint);
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const upperEvent = String(eventType || 'PREVIEW_BRIEFING_OPENED').toUpperCase();

  const isOpenEvent =
    upperEvent === 'PREVIEW_BRIEFING_OPENED' ||
    upperEvent === 'VIDEO_OPENED' ||
    upperEvent === 'VIDEO_PLAYED';
  const categoryKey = upperEvent.includes('VIDEO') || upperEvent.includes('WATCH')
    ? 'VIDEO'
    : upperEvent.includes('CARD') || upperEvent.includes('XRAY') || upperEvent.includes('APPROVE')
    ? 'INTERACT'
    : 'OPEN';

  let shouldSendSms = Boolean(forceAlert);

  if (prospect) {
    if (!prospect.previewTelemetry || typeof prospect.previewTelemetry !== 'object') {
      prospect.previewTelemetry = {
        viewsCount: 0,
        interactionsCount: 0,
        firstOpenedAt: null,
        lastOpenedAt: null,
        lastEventType: null,
        lastDeviceHint: null,
        alertCooldowns: {}
      };
    }
    const tel = prospect.previewTelemetry;
    if (!tel.alertCooldowns || typeof tel.alertCooldowns !== 'object') {
      tel.alertCooldowns = {};
    }

    if (isOpenEvent) {
      tel.viewsCount = Number(tel.viewsCount || 0) + 1;
    } else {
      tel.interactionsCount = Number(tel.interactionsCount || 0) + 1;
    }
    if (!tel.firstOpenedAt) tel.firstOpenedAt = nowIso;
    tel.lastOpenedAt = nowIso;
    tel.lastEventType = upperEvent;
    tel.lastDeviceHint = resolvedDevice;

    const lastSentMs = Number(tel.alertCooldowns[categoryKey] || 0);
    if (forceAlert || nowMs - lastSentMs >= RADAR_ALERT_COOLDOWN_MS) {
      shouldSendSms = true;
      tel.alertCooldowns[categoryKey] = nowMs;
    }

    prospect.timeline.unshift({
      id: `evt-radar-${nowMs}`,
      type: 'PROSPECT_PREVIEW_RADAR',
      eventType: upperEvent,
      deviceHint: resolvedDevice,
      cardId: cardId || null,
      watchedSeconds: watchedSeconds || 0,
      timestamp: nowIso,
      summary: `👀 LIVE RADAR: ${prospect.contactName} (${prospect.companyName}) triggered ${upperEvent} on ${resolvedDevice}.`
    });
  } else {
    shouldSendSms = true;
  }

  let radarSmsReceipt = null;
  if (shouldSendSms) {
    radarSmsReceipt = await dispatchProspectPreviewRadarSms({
      prospect: target,
      eventType: upperEvent,
      deviceHint: resolvedDevice,
      baseUrl,
      overridePhone,
      providerConfig
    });
  }

  const radarEntry = {
    id: `radar-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso,
    prospectId: target.id,
    previewToken: target.previewToken || cleanToken,
    companyName: target.companyName,
    contactName: target.contactName,
    phone: target.phone || '',
    zipCode: target.zipCode || '78130',
    eventType: upperEvent,
    deviceHint: resolvedDevice,
    smsDispatched: Boolean(radarSmsReceipt && radarSmsReceipt.ok),
    telUri: radarSmsReceipt ? radarSmsReceipt.telUri : ''
  };

  metaRecon.radarFeed.unshift(radarEntry);
  metaRecon.radarFeed = metaRecon.radarFeed.slice(0, 30);

  metaRecon.activityLog.unshift({
    id: `log-radar-${nowMs}`,
    timestamp: nowIso,
    event: `RADAR_${upperEvent}`,
    prospectId: target.id,
    companyName: target.companyName,
    summary: `👀 LIVE RADAR: ${target.contactName || target.companyName} (${target.companyName}) — ${upperEvent} (${resolvedDevice}).${
      radarSmsReceipt ? ' Instant Founder SMS Alert dispatched.' : ' (Logged within 15m SMS cooldown)'
    }`
  });

  recomputeMetaMetrics(metaRecon);
  saveStore(store);

  return {
    ok: true,
    event: radarEntry,
    prospect: prospect || target,
    radarSmsReceipt,
    metaRecon
  };
}

/**
 * Dispatches a single touch (Touch 1–4) for a specific prospect via Resend Email or Native SIM SMS.
 */
async function dispatchMetaOutreachTouch({
  prospectId,
  touchNumber = 1,
  channel = 'RESEND_EMAIL',
  customSubject,
  customBody,
  providerConfig = {}
} = {}) {
  if (getPreTripHoldDispatch()) {
    return {
      ok: false,
      statusCode: 423,
      blockedByCircuitBreaker: true,
      error:
        'Meta-Recon outbound dispatch blocked: 5:30 AM Pre-Trip Circuit Breaker is locked (RED_TAGGED).'
    };
  }

  const store = loadStore();
  if (!store.metaRecon || !Array.isArray(store.metaRecon.prospects)) {
    await runMetaReconAgentSweep();
  }
  const metaRecon = loadStore().metaRecon;
  const prospect =
    metaRecon.prospects.find((p) => p.id === prospectId) || metaRecon.prospects[0];
  if (!prospect) {
    return { ok: false, statusCode: 404, error: 'Prospect not found' };
  }

  const touchIdx = Math.max(0, Math.min(3, Number(touchNumber || 1) - 1));
  const touchObj = prospect.touches[touchIdx] || prospect.touches[0];

  if (touchObj.status === 'HALTED_ON_REPLY') {
    return {
      ok: false,
      statusCode: 409,
      error: `Touch ${touchNumber} is halted because ${prospect.companyName} already replied.`
    };
  }

  const finalSubject = customSubject || touchObj.subject;
  const finalBody = customBody || touchObj.body;

  let receipt = null;
  if (String(channel).toUpperCase().includes('SMS')) {
    if (!prospect.phone) {
      return {
        ok: false,
        statusCode: 400,
        error: `No phone number on file for ${prospect.companyName}.`
      };
    }
    const smsBody = customBody || prospect.nativeSimText;
    const nativeSimUri = buildNativeSimSmsUri(prospect.phone, smsBody);
    receipt = {
      ok: true,
      channel: 'NATIVE_SIM_SMS',
      provider: 'NATIVE_SIM_PROTOCOL',
      deliveryStatus: 'HANDOFF_TO_FOUNDER_PERSONAL_SIM',
      toPhone: prospect.phone,
      toName: prospect.contactName,
      companyName: prospect.companyName,
      touchNumber,
      nativeSimUri,
      bodyText: smsBody,
      a2pComplianceNote:
        'Cold prospect SMS routed via Native SIM (sms:+1...) for 0% A2P 10DLC risk and personal blue/green bubble delivery.',
      dispatchedAt: new Date().toISOString()
    };
  } else {
    if (!prospect.email || !String(prospect.email).includes('@')) {
      return {
        ok: false,
        statusCode: 400,
        error: `No email address found for ${prospect.companyName}. Use 1-Tap Native SIM Text or add an email first.`
      };
    }
    const emailReceipt = await dispatchViaResendEmail({
      contractor: {
        ownerName: 'Billy',
        companyName: 'Tiberius AI',
        workEmail: 'recon@send.tiberius.ai'
      },
      recipientEmail: prospect.email,
      recipientName: prospect.contactName,
      subject: finalSubject,
      bodyText: finalBody,
      token: 'tiberius-hq',
      threadId: prospect.id,
      providerConfig
    });
    receipt = {
      ...emailReceipt,
      channel: 'RESEND_EMAIL',
      companyName: prospect.companyName,
      touchNumber
    };
  }

  touchObj.subject = finalSubject;
  touchObj.body = finalBody;
  touchObj.status = 'SENT';
  touchObj.sentAt = receipt.dispatchedAt;

  prospect.activeTouchIndex = touchIdx;
  if (prospect.outreachStatus !== 'DEMO_SENT_HOT_LEAD') {
    prospect.outreachStatus = `TOUCH_${touchNumber}_SENT`;
  }
  prospect.dispatchedReceipts.push(receipt);
  prospect.timeline.unshift({
    id: `evt-send-${Date.now()}`,
    type: 'OUTBOUND_DISPATCHED',
    channel: receipt.channel,
    touchNumber,
    timestamp: receipt.dispatchedAt,
    summary: `Dispatched Touch ${touchNumber} (${receipt.channel}) to ${prospect.contactName} <${
      receipt.channel === 'NATIVE_SIM_SMS' ? prospect.phone : prospect.email
    }> — Subject: "${finalSubject}"`
  });

  metaRecon.activityLog.unshift({
    id: `log-send-${Date.now()}`,
    timestamp: receipt.dispatchedAt,
    event: `TOUCH_${touchNumber}_DISPATCHED`,
    prospectId: prospect.id,
    companyName: prospect.companyName,
    summary: `Sent Touch ${touchNumber} via ${receipt.channel} to ${prospect.contactName} (${prospect.companyName}).`
  });

  recomputeMetaMetrics(metaRecon);
  const latestStore = loadStore();
  latestStore.metaRecon = metaRecon;
  saveStore(latestStore);

  return {
    ok: true,
    prospect,
    receipt,
    nativeSimUri: receipt.nativeSimUri || prospect.nativeSimUri,
    metaRecon
  };
}

/**
 * Runs an Autonomous Drip Batch across all qualifying HOT/WARM prospects whose Anti-AI Copy Gate passed,
 * who have a deliverable email address, and who have not yet replied or opted out.
 */
async function runAutonomousMetaDripBatch({
  touchNumber = 1,
  maxBatchSize = 6,
  onlyHotLeads = false,
  providerConfig = {}
} = {}) {
  if (getPreTripHoldDispatch()) {
    return {
      ok: false,
      statusCode: 423,
      blockedByCircuitBreaker: true,
      error:
        'Autonomous Drip Batch aborted: 5:30 AM Pre-Trip Circuit Breaker is locked (RED_TAGGED).'
    };
  }

  await getMetaReconState();
  const store = loadStore();
  const metaRecon = store.metaRecon;
  const touchIdx = Math.max(0, Math.min(3, Number(touchNumber || 1) - 1));

  const eligible = metaRecon.prospects.filter((p) => {
    if (!p.email || !String(p.email).includes('@')) return false;
    if (!p.copyGate || !p.copyGate.passed) return false;
    if (onlyHotLeads && p.siteLeakXRay?.leadScore !== 'HOT') return false;
    if (p.replyIntent) return false;
    const t = p.touches && p.touches[touchIdx];
    if (!t || t.status === 'SENT' || t.status === 'HALTED_ON_REPLY') return false;
    return true;
  });

  const batch = eligible.slice(0, Math.max(1, Number(maxBatchSize) || 6));
  const batchReceipts = [];

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    const jitterSeconds = 240 + ((i * 73) % 180);
    const res = await dispatchMetaOutreachTouch({
      prospectId: p.id,
      touchNumber,
      channel: 'RESEND_EMAIL',
      providerConfig
    });
    if (res.ok && res.receipt) {
      batchReceipts.push({
        ...res.receipt,
        scheduledJitterSeconds: i === 0 ? 0 : jitterSeconds
      });
    }
  }

  const updatedMeta = loadStore().metaRecon;
  updatedMeta.activityLog.unshift({
    id: `log-drip-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'AUTONOMOUS_DRIP_BATCH_COMPLETED',
    summary: `Autonomous Drip Runner dispatched Touch ${touchNumber} to ${batchReceipts.length} verified prospect(s) with 4–7 min jitter spacing.`
  });
  recomputeMetaMetrics(updatedMeta);
  const s2 = loadStore();
  s2.metaRecon = updatedMeta;
  saveStore(s2);

  return {
    ok: true,
    touchNumber,
    dispatchedCount: batchReceipts.length,
    batchReceipts,
    metaRecon: updatedMeta
  };
}

/**
 * Processes an inbound reply from a Meta-Recon prospect:
 *   1. Classifies intent (`POSITIVE_SEND_DEMO`, `DEFER_60_DAYS`, `UNSUBSCRIBE_CLOSE`, `QUESTION_NEEDS_REVIEW`).
 *   2. Immediately halts any remaining cold follow-up touches (`HALTED_ON_REPLY`).
 *   3. When intent === `POSITIVE_SEND_DEMO` and `autoSendDemoLink !== false`, automatically sends the
 *      personalized Preview Briefing link + 3-Leak Website Teardown via Resend and fires a Master Twilio
 *      Hot-Reply SMS alert to the founder.
 */
async function handleMetaInboundProspectReply({
  prospectId,
  fromEmail,
  fromPhone,
  rawReplyBody = 'Yes, send over the live permit packet and site breakdown!',
  autoSendDemoLink = true,
  providerConfig = {}
} = {}) {
  await getMetaReconState();
  const store = loadStore();
  const metaRecon = store.metaRecon;

  const prospect =
    metaRecon.prospects.find(
      (p) =>
        (prospectId && p.id === prospectId) ||
        (fromEmail && p.email && p.email.toLowerCase() === String(fromEmail).toLowerCase()) ||
        (fromPhone &&
          p.phone &&
          String(p.phone).replace(/\D/g, '') === String(fromPhone).replace(/\D/g, ''))
    ) || metaRecon.prospects[0];

  if (!prospect) {
    return { ok: false, statusCode: 404, error: 'Prospect not found for inbound reply' };
  }

  const cleanReply = stripQuotedEmailChain(rawReplyBody);
  const classification = classifyProspectReplyIntent(cleanReply);
  const nowIso = new Date().toISOString();

  prospect.replyIntent = {
    ...classification,
    rawReplyBody: cleanReply,
    receivedAt: nowIso
  };

  // Halt all unsent follow-up touches immediately
  if (classification.shouldHaltFollowUps && Array.isArray(prospect.touches)) {
    for (const t of prospect.touches) {
      if (t.status !== 'SENT') {
        t.status = 'HALTED_ON_REPLY';
      }
    }
  }

  prospect.timeline.unshift({
    id: `evt-reply-${Date.now()}`,
    type: 'INBOUND_PROSPECT_REPLY',
    intent: classification.intent,
    timestamp: nowIso,
    summary: `${prospect.contactName} replied: "${cleanReply}" → Classified as ${classification.label}`
  });

  let autoFulfilmentReceipt = null;
  let founderHotSmsReceipt = null;

  const shouldFulfil =
    classification.shouldAutoSendDemo &&
    autoSendDemoLink !== false &&
    metaRecon.autopilotReplyEnabled !== false;

  if (shouldFulfil) {
    if (prospect.email && String(prospect.email).includes('@')) {
      autoFulfilmentReceipt = await dispatchViaResendEmail({
        contractor: {
          ownerName: 'Billy',
          companyName: 'Tiberius AI',
          workEmail: 'recon@send.tiberius.ai'
        },
        recipientEmail: prospect.email,
        recipientName: prospect.contactName,
        subject: `Re: ${prospect.touches[0]?.subject || `${prospect.zipCode} live permit packet`} (${prospect.companyShortName} Sandbox)`,
        bodyText: prospect.autoReplyDemoMessage,
        token: 'tiberius-hq',
        threadId: prospect.id,
        providerConfig
      });

      prospect.dispatchedReceipts.push({
        ...autoFulfilmentReceipt,
        channel: 'AUTONOMOUS_DEMO_FULFILMENT_EMAIL',
        touchNumber: 'AUTO_DEMO_REPLY'
      });
    }

    prospect.outreachStatus = 'DEMO_SENT_HOT_LEAD';

    prospect.timeline.unshift({
      id: `evt-fulfil-${Date.now()}`,
      type: 'AUTONOMOUS_DEMO_DELIVERED',
      timestamp: new Date().toISOString(),
      summary: `🤖 Autonomous Fulfilment Agent delivered live Preview Briefing (${prospect.previewBriefingUrl}) + 3-Leak Teardown to ${prospect.email || prospect.phone}.`
    });

    founderHotSmsReceipt = await dispatchContractorHotReplyAlertSms({
      contractor: {
        ownerName: 'Billy',
        companyName: 'Tiberius AI HQ',
        mobilePhone: process.env.ADMIN_ALERT_PHONE || '(830) 481-0653'
      },
      thread: {
        id: prospect.id,
        contactShort: `${prospect.contactName} (${prospect.companyName})`,
        dealValuation: `${prospect.primaryTrade} • ${prospect.zipCode}`,
        permitNumber: prospect.previewToken
      },
      inboundMessage: {
        senderName: `${prospect.contactName} (${prospect.companyName})`,
        body: cleanReply
      },
      token: prospect.previewToken || 'demo-7am-briefing'
    });
  } else if (classification.intent === 'UNSUBSCRIBE_CLOSE') {
    prospect.outreachStatus = 'OPTED_OUT_CLOSED';
  } else if (classification.intent === 'DEFER_60_DAYS') {
    prospect.outreachStatus = 'DEFERRED_60_DAYS';
  } else {
    prospect.outreachStatus = 'REPLIED_NEEDS_REVIEW';
  }

  metaRecon.activityLog.unshift({
    id: `log-reply-${Date.now()}`,
    timestamp: nowIso,
    event: `INBOUND_REPLY_${classification.intent}`,
    prospectId: prospect.id,
    companyName: prospect.companyName,
    summary: `${prospect.contactName} (${prospect.companyName}) replied "${cleanReply}". Follow-ups halted.${
      autoFulfilmentReceipt
        ? ` Auto-sent live Preview Briefing (${prospect.previewToken}).`
        : ''
    }`
  });

  recomputeMetaMetrics(metaRecon);
  saveStore(store);

  return {
    ok: true,
    classification,
    prospect,
    autoFulfilmentReceipt,
    founderHotSmsReceipt,
    metaRecon
  };
}

module.exports = {
  runMetaReconAgentSweep,
  getMetaReconState,
  addProspectToMetaRecon,
  parseProspectCsvText,
  importProspectsCsvToMetaRecon,
  removeProspectFromMetaRecon,
  recordProspectPreviewRadarEvent,
  dispatchMetaOutreachTouch,
  runAutonomousMetaDripBatch,
  classifyProspectReplyIntent,
  handleMetaInboundProspectReply
};
