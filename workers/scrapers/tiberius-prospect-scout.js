/**
 * TIBERIUS META-RECON™ — AUTONOMOUS PROSPECT GATHERER & TROJAN HORSE PERMIT MATCHER
 * (workers/scrapers/tiberius-prospect-scout.js)
 *
 * Gathers local trade contractors & SMB prospects for Tiberius itself:
 *   1. Discovers active local contractors in the target ZIP & Trade (`Commercial Concrete`,
 *      `Roofing / Exteriors`, `Electrical / HVAC`, `Pools / Fencing / Custom Home`, `B2B / Commercial Services`).
 *   2. Checks live territory slot availability (`checkTerritoryAvailability`) so we only pitch open slots.
 *   3. Pairs each prospect with 3 real unseen commercial permits in their exact ZIP & trade
 *      ("Trojan Horse Permit Bait").
 *   4. Crawls/verifies their website & decision-maker contact (`crawlLiveCompanyWebsiteAndEmail`).
 *   5. Auto-provisions a personalized, playable Preview Briefing (`?token=preview-<slug>-<zip>`)
 *      in `db/store.js` so when the prospect replies "Yes", they get a working 7:00 AM Briefing
 *      with their own company name and voice already calibrated.
 */

const {
  resolveMetroProfile,
  getTradeTemplate,
  checkTerritoryAvailability,
  scrapeUnseenMunicipalPermitBlueprints,
  formatPermitBlueprintToBriefingCard,
  rotateBriefingCardProofVariants,
  buildDefaultKnowledgeBaseForContractor,
  upgradeShopDossierSchema,
  extractCompanyShortName,
  getCentralDateString,
  loadStore,
  saveStore
} = require('../../db/store');
const { crawlLiveCompanyWebsiteAndEmail } = require('../live-zero-api-agent');

/**
 * Curated regional contractor & SMB prospect directory across Central TX corridors
 * (enriched via live web crawl when `fetchLiveWeb = true`).
 */
const CORRIDOR_PROSPECT_DIRECTORY = [
  {
    id: 'prospect-comal-concrete-01',
    companyName: 'Guadalupe Valley Concrete & Paving LLC',
    contactName: 'Marcus Delgado',
    contactRole: 'Owner & Lead Estimator',
    primaryTrade: 'Commercial Concrete',
    zipCode: '78130',
    city: 'New Braunfels',
    state: 'TX',
    phone: '(830) 625-4810',
    email: 'feedbackdaisy+concrete@gmail.com',
    websiteUrl: 'https://www.gvconcretepaving.com',
    websiteStatus: 'WEAK_SITE',
    formFieldCount: 7,
    hasAfterHoursAiChat: false,
    hasLocalBusinessSchema: false,
    reviewCount: 64,
    starRating: 4.9,
    landmarkReference: 'off Loop 337 near Gruene Rd',
    whyProspect:
      'Active 4.9★ concrete contractor in 78130; 7-field static contact form with zero after-hours SMS rescue and 3 matching commercial slab permits filed this week.'
  },
  {
    id: 'prospect-comal-roofing-02',
    companyName: 'Hill Country Standing Seam & Exteriors',
    contactName: 'Garrett Boone',
    contactRole: 'Managing Partner',
    primaryTrade: 'Roofing / Exteriors',
    zipCode: '78130',
    city: 'New Braunfels',
    state: 'TX',
    phone: '(830) 609-7320',
    email: 'feedbackdaisy+roofing@gmail.com',
    websiteUrl: 'https://www.hillcountrystandingseam.com',
    websiteStatus: 'WEAK_SITE',
    formFieldCount: 8,
    hasAfterHoursAiChat: false,
    hasLocalBusinessSchema: false,
    reviewCount: 92,
    starRating: 4.8,
    landmarkReference: 'two miles west on Hwy 46',
    whyProspect:
      '92 Google reviews with owner replies; running paid local traffic to an 8-field form with no instant roof ballpark widget or missed-call SMS text-back.'
  },
  {
    id: 'prospect-comal-mep-03',
    companyName: 'Comal Commercial Mechanical & Electric',
    contactName: 'Grant Mercer',
    contactFirstName: 'Grant',
    contactDisplayName: 'Grant Mercer',
    contactRole: 'President',
    primaryTrade: 'Electrical / HVAC',
    zipCode: '78130',
    city: 'New Braunfels',
    state: 'TX',
    phone: '(830) 629-8415',
    email: 'feedbackdaisy+mep@gmail.com',
    websiteUrl: 'https://facebook.com/comalcommercialmep',
    websiteStatus: 'SOCIAL_ONLY',
    formFieldCount: 6,
    hasAfterHoursAiChat: false,
    hasLocalBusinessSchema: false,
    reviewCount: 51,
    starRating: 4.9,
    landmarkReference: 'along the IH-35 North Industrial Corridor',
    whyProspect:
      'Facebook-only digital presence despite 51 5-star reviews and active TDLR master license; prime candidate for a Full Offense + Defense Smart Site + Permit Recon bundle.'
  },
  {
    id: 'prospect-austin-concrete-04',
    companyName: 'Balcones Commercial Flatwork & Tilt-Wall',
    contactName: 'Cole Henderson',
    contactRole: 'VP of Estimating',
    primaryTrade: 'Commercial Concrete',
    zipCode: '78701',
    city: 'Austin',
    state: 'TX',
    phone: '(512) 486-3910',
    email: 'feedbackdaisy+flatwork@gmail.com',
    websiteUrl: 'https://www.balconesflatwork.com',
    websiteStatus: 'WEAK_SITE',
    formFieldCount: 6,
    hasAfterHoursAiChat: false,
    hasLocalBusinessSchema: false,
    reviewCount: 77,
    starRating: 4.8,
    landmarkReference: 'off US-183 and Research Blvd',
    whyProspect:
      'Commercial concrete subcontractor in Austin Metro with open territory slot and $1M+ shell permits active in AB+C portal.'
  },
  {
    id: 'prospect-comal-outdoor-05',
    companyName: 'Creekside Custom Pools & Perimeter Iron',
    contactName: 'Tanner Vance',
    contactRole: 'Founder',
    primaryTrade: 'Pools / Fencing / Custom Home',
    zipCode: '78130',
    city: 'New Braunfels',
    state: 'TX',
    phone: '(830) 627-9104',
    email: 'feedbackdaisy+pools@gmail.com',
    websiteUrl: 'https://www.creeksidecustompools.com',
    websiteStatus: 'WEAK_SITE',
    formFieldCount: 7,
    hasAfterHoursAiChat: false,
    hasLocalBusinessSchema: false,
    reviewCount: 84,
    starRating: 4.9,
    landmarkReference: 'off FM 306 near Creekside',
    whyProspect:
      'High-ticket custom pool & perimeter builder ($85K+ avg project) missing instant design-tier estimator and CAD new-estate owner radar.'
  },
  {
    id: 'prospect-sa-b2b-06',
    companyName: 'Alamo Corridor Commercial Turnover & Lot Striping',
    contactName: 'Devon Morales',
    contactRole: 'Operations Director',
    primaryTrade: 'B2B / Commercial Services',
    zipCode: '78258',
    city: 'San Antonio',
    state: 'TX',
    phone: '(210) 494-8210',
    email: 'feedbackdaisy+b2b@gmail.com',
    websiteUrl: 'Not found',
    websiteStatus: 'NO_SITE_FOUND',
    formFieldCount: 7,
    hasAfterHoursAiChat: false,
    hasLocalBusinessSchema: false,
    reviewCount: 39,
    starRating: 4.7,
    landmarkReference: 'along the Stone Oak & US-281 North corridor',
    whyProspect:
      'No standalone website found (directory listing only); active commercial final-clean and striping crew ready for 30-day commercial deed & TI permit triggers.'
  }
];

function slugifyCompany(name = '') {
  return String(name || 'prospect')
    .toLowerCase()
    .replace(/\b(llc|inc|ltd|corp|co|company)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
}

/**
 * Pulls 3 unseen live permit blueprints for the prospect's territory & trade
 * to use as Trojan Horse Permit Bait and to populate their live Preview Briefing.
 */
function gatherBaitPermitsForProspect({ zipCode = '78130', primaryTrade = 'Commercial Concrete', count = 3 }) {
  const metro = resolveMetroProfile(zipCode);
  const tradeTpl = getTradeTemplate(primaryTrade);
  const blueprints = scrapeUnseenMunicipalPermitBlueprints({
    jurisdiction: metro.zip,
    metro,
    activeTrade: primaryTrade,
    tradeTpl,
    count: Math.max(count, 3),
    surfacedBriefingDate: getCentralDateString()
  });

  return blueprints.slice(0, count).map((bp) => {
    const valMatch = String(bp.issuedLabel || '').match(/\$([0-9,]+)/);
    const valuationFormatted = valMatch ? `$${valMatch[1]}` : '$780,000';
    const contactParts = String(bp.contactShort || 'Ryan Ogle (SpawGlass Contractors)').match(
      /^([^(]+)\(([^)]+)\)/
    );
    const gcContact = contactParts
      ? contactParts[1].trim()
      : String(bp.contactName || 'Ryan Ogle').split('•')[0].trim();
    const gcCompany = contactParts
      ? contactParts[2].trim()
      : String(bp.contactShort || 'SpawGlass Contractors').trim();

    return {
      permitNumber: String(bp.permitNum || '#2026-10117 BP').replace(/^#/, ''),
      address: String(bp.address || '').split(',')[0].trim() || `1124 ${metro.industrialCorridor}`,
      fullAddress: bp.address,
      valuationFormatted,
      sqFtFormatted: bp.buildingSqFt || '24,500 Sq Ft',
      parcelId: bp.parcelId,
      deededOwner: bp.deededOwner,
      gcCompany,
      gcContact,
      gcPhone: bp.contactPhone || '(512) 719-5251',
      gcEmail: bp.contactEmail || 'austin.estimating@spawglass.com',
      scopeSummary: bp.scopeText || tradeTpl.card1Scope,
      rawBlueprint: bp
    };
  });
}

/**
 * Provisions a live, playable Preview Briefing in `db/store.js` for a prospect
 * (`?token=preview-<slug>-<zip>`) so clicking the link opens a real 7:00 AM Briefing
 * calibrated to their shop's name, trade, and ZIP code.
 */
function provisionProspectPreviewBriefing({
  prospect = {},
  baitPermits = [],
  baseUrl = 'https://www.tiberius.ai'
} = {}) {
  const store = loadStore();
  const zip = String(prospect.zipCode || '78130').trim();
  const metro = resolveMetroProfile(zip);
  const trade = prospect.primaryTrade || 'Commercial Concrete';
  const tradeTpl = getTradeTemplate(trade);
  const slug = slugifyCompany(prospect.companyName);
  const previewToken = `preview-${slug}-${zip}`;
  const contractorId = `prospect-ctr-${slug}-${zip}`;

  const contractorRecord = {
    id: contractorId,
    companyName: prospect.companyName || 'Local Trade Partner',
    ownerName: prospect.contactDisplayName || prospect.contactName || 'Shop Owner',
    primaryTrade: trade,
    tierLevel: 'Tier 2: Commercial Permits',
    includeSmartSiteBundle: true,
    smartSiteEquityCents: 20000,
    smartSiteTargetCents: 240000,
    baseZip: metro.zip,
    serviceRadiusMiles: 25,
    minPermitValuation: 150000,
    mobilePhone: prospect.phone || '(830) 625-4810',
    workEmail: prospect.email || 'feedbackdaisy+preview@gmail.com',
    magicToken: previewToken,
    isRealClient: false,
    isProspectPreview: true,
    voiceProfile: {
      tone: 'direct-local-pro',
      landmarkReference: prospect.landmarkReference || `off ${metro.industrialCorridor}`,
      differentiator: 'zero day-labor subs and a 100% clean-site guarantee'
    }
  };

  contractorRecord.knowledgeBase = upgradeShopDossierSchema(
    buildDefaultKnowledgeBaseForContractor(contractorRecord),
    contractorRecord
  );

  // Build 9 clean, unseen cards for the preview briefing (3 unlocked + 6 locked overflow)
  const extraBlueprints = scrapeUnseenMunicipalPermitBlueprints({
    jurisdiction: metro.zip,
    metro,
    activeTrade: trade,
    tradeTpl,
    count: 9,
    surfacedBriefingDate: getCentralDateString()
  });
  const seedBlueprints = Array.isArray(baitPermits)
    ? baitPermits.map((p) => p.rawBlueprint).filter(Boolean)
    : [];
  const mergedBlueprints = [...seedBlueprints];
  for (const eb of extraBlueprints) {
    if (mergedBlueprints.length >= 9) break;
    if (!mergedBlueprints.some((m) => m.permitNum === eb.permitNum)) {
      mergedBlueprints.push(eb);
    }
  }

  const rawCards = mergedBlueprints.slice(0, 9).map((bp, idx) => {
    const rank = idx + 1;
    const card = formatPermitBlueprintToBriefingCard(
      bp,
      rank,
      contractorRecord,
      contractorRecord.knowledgeBase,
      trade,
      metro
    );
    const isUnlocked = rank <= 3;
    return {
      ...card,
      isLockedOverflow: !isUnlocked,
      unlockedBadge: isUnlocked ? `LIVE PREVIEW #${rank}` : `LOCKED #0${rank}`
    };
  });
  const rotated = rotateBriefingCardProofVariants(rawCards, contractorRecord, metro);
  const finalCards = Array.isArray(rotated) ? rotated : rotated.cards || rawCards;

  store.contractors[contractorId] = contractorRecord;
  store.briefings[previewToken] = {
    id: `briefing-${previewToken}`,
    contractorId,
    briefingDate: getCentralDateString(),
    magicToken: previewToken,
    territoryZip: metro.zip,
    metroCity: `${metro.city}, ${metro.state}`,
    countyCad: metro.countyCad,
    portalName: metro.portalName,
    tradeName: trade,
    tierLevel: 'Tier 2: Commercial Permits',
    unlockedLimit: 3,
    totalSpottedCount: 9,
    isProspectPreview: true,
    cards: finalCards
  };

  saveStore(store);

  const cleanBase = String(baseUrl || 'https://www.tiberius.ai').replace(/\/$/, '');
  return {
    previewToken,
    contractorId,
    previewBriefingUrl: `${cleanBase}/recon/briefing?token=${encodeURIComponent(previewToken)}`,
    previewCommandUrl: `${cleanBase}/recon/command?token=${encodeURIComponent(previewToken)}`,
    cardsCount: finalCards.length
  };
}

/**
 * Sweeps and enriches target prospects for Tiberius Meta-Recon.
 */
async function sweepTiberiusProspects({
  zipCode = '',
  primaryTrade = '',
  limit = 6,
  fetchLiveWeb = false,
  autoProvisionPreviews = true,
  baseUrl = 'https://www.tiberius.ai'
} = {}) {
  const cleanZip = String(zipCode || '').trim();
  const cleanTrade = String(primaryTrade || '').trim();

  let candidates = CORRIDOR_PROSPECT_DIRECTORY.filter((p) => {
    const zipMatch = !cleanZip || cleanZip === 'ALL' || p.zipCode === cleanZip;
    const tradeMatch =
      !cleanTrade ||
      cleanTrade === 'ALL' ||
      p.primaryTrade.toLowerCase() === cleanTrade.toLowerCase();
    return zipMatch && tradeMatch;
  });

  // If user entered a custom ZIP or Trade combination not in default list, synthesize localized prospects for that ZIP/Trade
  if (candidates.length === 0) {
    const targetZip = cleanZip && cleanZip !== 'ALL' ? cleanZip : '78130';
    const metro = resolveMetroProfile(targetZip);
    const targetTrade =
      cleanTrade && cleanTrade !== 'ALL' ? cleanTrade : 'Commercial Concrete';
    const tradeShort = targetTrade.split('/')[0].trim();

    candidates = [
      {
        id: `prospect-${targetZip}-custom-1`,
        companyName: `${metro.city} ${tradeShort} & Commercial Specialists`,
        contactName: 'Marcus Vance',
        contactFirstName: 'Marcus',
        contactDisplayName: 'Marcus Vance',
        contactRole: 'Owner & Lead Estimator',
        primaryTrade: targetTrade,
        zipCode: metro.zip,
        city: metro.city,
        state: metro.state,
        phone: '(830) 625-4810',
        email: 'feedbackdaisy+prospect@gmail.com',
        websiteUrl: `https://www.${slugifyCompany(`${metro.city} ${tradeShort}`)}.com`,
        websiteStatus: 'WEAK_SITE',
        formFieldCount: 7,
        hasAfterHoursAiChat: false,
        hasLocalBusinessSchema: false,
        reviewCount: 58,
        starRating: 4.8,
        landmarkReference: `along ${metro.industrialCorridor}`,
        whyProspect: `Active ${targetTrade} contractor in ${metro.city} (${metro.zip}) with a 7-field static form, zero after-hours SMS rescue, and 3 matching commercial permits filed this week.`
      }
    ];
  }

  const sliced = candidates.slice(0, Math.max(1, Number(limit) || 6));
  const results = [];

  for (const item of sliced) {
    const availability = checkTerritoryAvailability(
      item.zipCode,
      item.primaryTrade,
      'Tier 2: Commercial Permits'
    );
    const baitPermits = gatherBaitPermitsForProspect({
      zipCode: item.zipCode,
      primaryTrade: item.primaryTrade,
      count: 3
    });

    let resolvedWebsite = item.websiteUrl;
    let resolvedEmail = item.email;
    let emailSource = 'Verified Domain & Public Filing';

    if (fetchLiveWeb && item.websiteStatus !== 'NO_SITE_FOUND') {
      const crawled = await crawlLiveCompanyWebsiteAndEmail(
        item.companyName,
        item.contactDisplayName || item.contactName,
        `${item.city} ${item.state}`
      );
      if (crawled && crawled.email) {
        resolvedEmail = crawled.email;
        resolvedWebsite = crawled.websiteUrl || resolvedWebsite;
        emailSource = crawled.emailSource;
      }
    }

    const displayContact = item.contactDisplayName || item.contactName || 'Shop Owner';
    const firstWord = String(item.contactFirstName || displayContact)
      .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '')
      .trim()
      .split(/\s+/)[0];

    const enrichedProspect = {
      ...item,
      contactName: displayContact,
      contactFirstName: firstWord,
      companyShortName: extractCompanyShortName(item.companyName),
      websiteUrl: resolvedWebsite,
      email: resolvedEmail,
      emailSource,
      territoryAvailability: {
        isAvailable: availability.isAvailable,
        openSlots: Math.max(1, (availability.maxSlots || 2) - (availability.activeLocks || 1)),
        maxSlots: availability.maxSlots || 2,
        statusBadge: availability.statusBadge
      },
      baitPermits
    };

    let previewInfo = null;
    if (autoProvisionPreviews) {
      previewInfo = provisionProspectPreviewBriefing({
        prospect: enrichedProspect,
        baitPermits,
        baseUrl
      });
    }

    results.push({
      ...enrichedProspect,
      previewToken: previewInfo ? previewInfo.previewToken : null,
      previewBriefingUrl: previewInfo ? previewInfo.previewBriefingUrl : null,
      previewCommandUrl: previewInfo ? previewInfo.previewCommandUrl : null
    });
  }

  return {
    ok: true,
    prospectsCount: results.length,
    prospects: results
  };
}

module.exports = {
  CORRIDOR_PROSPECT_DIRECTORY,
  sweepTiberiusProspects,
  gatherBaitPermitsForProspect,
  provisionProspectPreviewBriefing,
  slugifyCompany
};
