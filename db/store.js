/**
 * TIBERIUS RECON™ — UNIFIED RUNTIME DATA & TERRITORY ENGINE (db/store.js)
 *
 * Powers:
 * 1. Zip Code Exclusivity & Tier Capacity Ledger (Tier 2: Max 2/Zip | Tier 3: 100% Exclusive)
 * 2. Dynamic Trade- & Metro-Calibrated 7:00 AM Briefing Generator (3 Unlocked + 9 Locked Overflow)
 * 3. 1-Tap Human-in-the-Loop Approval, Draft Editing & Dispatch Logging
 * 4. Contractor Command Portal State, Voice Calibration & $200/mo Smart Site Equity Ledger
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCAL_STORE_PATH = path.join(__dirname, '.recon-store.json');
const TMP_STORE_PATH = path.join(os.tmpdir(), 'tiberius-recon-store.json');

/* ==========================================================================
   METRO & COUNTY APPRAISAL DISTRICT (CAD) DIRECTORY
   ========================================================================== */
const METRO_PROFILES = {
  '78130': {
    city: 'New Braunfels',
    state: 'TX',
    countyCad: 'Comal Appraisal District (Comal CAD)',
    portalName: 'City of New Braunfels EnerGov Portal',
    industrialCorridor: 'IH-35 Corridor & FM 306 Commercial Pkwy',
    commercialAvenue: 'Gruene Rd & Loop 337',
    estateNeighborhood: 'Havenwood at Hunters Crossing',
    landmarkStreet: 'two miles east off FM 306',
    nearbyZips: ['78132', '78133', '78163', '78666']
  },
  '782': {
    city: 'San Antonio',
    state: 'TX',
    countyCad: 'Bexar Appraisal District (BCAD)',
    portalName: 'San Antonio BuildSA Accela Portal',
    industrialCorridor: 'IH-10 East & Loop 1604 Industrial Pkwy',
    commercialAvenue: 'La Cantera Pkwy & Blanco Rd',
    estateNeighborhood: 'The Dominion & Shavano Park',
    landmarkStreet: 'two miles west off Loop 1604',
    nearbyZips: ['78257', '78258', '78249', '78015']
  },
  '787': {
    city: 'Austin',
    state: 'TX',
    countyCad: 'Travis Central Appraisal District (TCAD)',
    portalName: 'Austin Build + Connect (AB+C) Portal',
    industrialCorridor: 'US-183 South & Parmer Tech Corridor',
    commercialAvenue: 'Burnet Rd & Domain Northside',
    estateNeighborhood: 'Westlake Hills & Barton Creek',
    landmarkStreet: 'three miles north off Mopac',
    nearbyZips: ['78746', '78738', '78758', '78613']
  },
  '750': {
    city: 'Frisco / Plano',
    state: 'TX',
    countyCad: 'Collin Central Appraisal District (Collin CAD)',
    portalName: 'Plano / Frisco EnerGov Citizen Access',
    industrialCorridor: '4820 Industrial Pkwy, Suite B',
    commercialAvenue: 'Legacy West & Preston Rd',
    estateNeighborhood: '1140 Whispering Pines Ln (Willow Bend)',
    landmarkStreet: 'two miles east on Commerce Dr',
    nearbyZips: ['75024', '75034', '75093', '75078']
  },
  '770': {
    city: 'Houston',
    state: 'TX',
    countyCad: 'Harris Central Appraisal District (HCAD)',
    portalName: 'Houston Permitting Center (HPC) Accela',
    industrialCorridor: 'Beltway 8 & Northwest Industrial Pkwy',
    commercialAvenue: '6100 Westheimer Rd',
    estateNeighborhood: 'River Oaks & Memorial Villages',
    landmarkStreet: 'two miles south off I-10 Energy Corridor',
    nearbyZips: ['77024', '77056', '77079', '77401']
  }
};

function resolveMetroProfile(zipOrCityRaw) {
  const cleaned = String(zipOrCityRaw || '75024').trim();
  if (METRO_PROFILES[cleaned]) return { zip: cleaned, ...METRO_PROFILES[cleaned] };

  const prefix3 = cleaned.slice(0, 3);
  if (METRO_PROFILES[prefix3]) {
    return {
      zip: /^\d{5}$/.test(cleaned) ? cleaned : `${prefix3}24`,
      ...METRO_PROFILES[prefix3]
    };
  }

  const lower = cleaned.toLowerCase();
  if (lower.includes('braunfels') || lower.includes('comal')) {
    return { zip: '78130', ...METRO_PROFILES['78130'] };
  }
  if (lower.includes('san antonio') || lower.includes('bexar')) {
    return { zip: '78257', ...METRO_PROFILES['782'] };
  }
  if (lower.includes('austin') || lower.includes('travis')) {
    return { zip: '78746', ...METRO_PROFILES['787'] };
  }
  if (lower.includes('houston') || lower.includes('harris')) {
    return { zip: '77056', ...METRO_PROFILES['770'] };
  }

  const zipMatch = cleaned.match(/\b\d{5}\b/);
  const resolvedZip = zipMatch ? zipMatch[0] : '75024';
  const resolvedCity = zipMatch ? 'Local Metro Territory' : cleaned || 'Frisco / Plano';

  return {
    zip: resolvedZip,
    city: resolvedCity,
    state: 'TX',
    countyCad: `${resolvedCity} County Appraisal District (CAD)`,
    portalName: 'Municipal Accela & EnerGov Building Portal',
    industrialCorridor: '4820 Industrial Pkwy, Suite B',
    commercialAvenue: '6100 Westheimer Rd',
    estateNeighborhood: '1140 Whispering Pines Ln',
    landmarkStreet: 'two miles east on Commerce Dr',
    nearbyZips: ['75024', '75034', '78130', '78746']
  };
}

/* ==========================================================================
   TRADE-SPECIFIC SCOPE & DRAFT TEMPLATES
   ========================================================================== */
const TRADE_TEMPLATES = {
  'Commercial Concrete': {
    shortTrade: 'Commercial Concrete & Paving',
    card1Headline: '18,500 Sq Ft Commercial Buildout & Dock Apron',
    card1Scope: 'structural concrete foundation, loading dock apron & heavy-duty flatwork scope',
    card1CompletedJob: 'a 22,000 sq ft commercial tilt-wall & dock apron project',
    card2Headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
    card2Scope: 'ADA concrete flatwork, bollard installations, and Dumpster pad replacements',
    card3Headline: 'Custom Estate Addition & Architectural Motor Court',
    card3Scope: 'engineered post-tension foundation addition and architectural stamped motor court'
  },
  'Roofing / Exteriors': {
    shortTrade: 'Commercial & Custom Roofing',
    card1Headline: '18,500 Sq Ft Commercial Buildout & TPO Roof System',
    card1Scope: '60-mil mechanically attached TPO membrane, tapered insulation & sheet metal coping scope',
    card1CompletedJob: 'a 24,000 sq ft commercial TPO re-roof and curb package',
    card2Headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
    card2Scope: 'multi-family roof preventative maintenance, elastomeric coating & leak warranty transfers',
    card3Headline: 'Custom Estate Addition & Standing-Seam Metal Roof',
    card3Scope: '24-gauge standing-seam architectural metal roofing and custom copper flashing package'
  },
  'Electrical / HVAC': {
    shortTrade: 'Commercial Electrical & Mechanical (MEP)',
    card1Headline: '18,500 Sq Ft Commercial TI Buildout & 800A MEP Upgrade',
    card1Scope: '800A 3-phase switchgear distribution, LED high-bay package & 25-ton RTU mechanical scope',
    card1CompletedJob: 'a 22,000 sq ft commercial MEP tenant finish-out',
    card2Headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
    card2Scope: 'common-area LED parking lot retrofits, breaker panel upgrades & quarterly HVAC PM',
    card3Headline: 'Custom Estate Addition & Whole-Home Generator + VRF HVAC',
    card3Scope: 'service panel expansion, 48kW standby generator pad/transfer switch & multi-zone HVAC'
  },
  'Pools / Fencing / Custom Home': {
    shortTrade: 'Custom Outdoor, Pools & Estate Builds',
    card1Headline: '18,500 Sq Ft Commercial Amenity Deck & Perimeter Security',
    card1Scope: 'commercial architectural perimeter fencing, automated security gates & hardscape plaza',
    card1CompletedJob: 'a multi-pad commercial hardscape and controlled-access perimeter package',
    card2Headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
    card2Scope: 'community pool plaster/equipment modernization and wrought-iron perimeter enclosure',
    card3Headline: 'Custom Estate Addition, Negative-Edge Pool & Cabana',
    card3Scope: 'custom negative-edge gunite pool, outdoor kitchen pavilion & estate privacy masonry'
  },
  'B2B / Commercial Services': {
    shortTrade: 'B2B Commercial Facility Services',
    card1Headline: '18,500 Sq Ft Commercial Buildout & Post-Construction Turnkey',
    card1Scope: 'post-construction final spec detailing, exterior pressure restoration & ongoing facility contract',
    card1CompletedJob: 'a 22,000 sq ft commercial turnover package',
    card2Headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
    card2Scope: 'annual exterior facility maintenance, common-area porter & day-1 vendor transition',
    card3Headline: 'Custom Estate Addition & Private Estate Management',
    card3Scope: 'custom estate exterior turn-key commissioning and preventative maintenance schedule'
  }
};

function getTradeTemplate(trade) {
  return TRADE_TEMPLATES[trade] || TRADE_TEMPLATES['Commercial Concrete'];
}

/* ==========================================================================
   BUILD 3 UNLOCKED + 9 LOCKED BRIEFING CARDS FOR ANY TRADE & TERRITORY
   ========================================================================== */
function buildBriefingCardsForContractor(contractor) {
  const metro = resolveMetroProfile(contractor.baseZip);
  const tradeTpl = getTradeTemplate(contractor.primaryTrade);
  const voice = contractor.voiceProfile || {};
  const landmark = voice.landmarkReference || metro.landmarkStreet;
  const isPaidTier = contractor.status === 'PAID_ACTIVE';

  const unlockedCards = [
    {
      id: 'deal-1',
      cardRank: 1,
      cardNumber: 'CARD 01 • COMMERCIAL PERMIT',
      unlockedBadge: 'UNLOCKED #1',
      isLockedOverflow: false,
      pillIcon: '⚡',
      pillText: 'FILED 14 HRS AGO • $240,000 TI PERMIT',
      pillClass: 'bg-[#FEF3C7] border-amber-300 text-[#D97706]',
      headline: tradeTpl.card1Headline,
      subMeta: `Permit Address: ${metro.industrialCorridor} (${metro.city}, ${metro.state} ${metro.zip}) • ${metro.portalName} #BP-2026-08941`,
      cadCallout: null,
      cadDetails: {
        parcelId: `CAD-${metro.zip}-8941`,
        countyName: metro.countyCad,
        deededOwner: 'Industrial Parkway Holdings LLC',
        assessedValue: '$1,850,000',
        buildingSqFt: '18,500 Sq Ft',
        lotAcres: '2.4 Acres'
      },
      contactHeader: 'VERIFIED GC PROJECT MANAGER:',
      contactName: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
      contactShort: 'Marcus Vance (Apex Commercial Builders)',
      contactMeta: `Direct Work Email + Cell Verified • 3.8 Miles From Your Shop (${metro.zip})`,
      contactEmail: 'mvance@apexcommercialbuilders.com',
      contactPhone: '(512) 555-0148',
      draftLabel: '4-SENTENCE BID INTRO (YOUR VOICE):',
      draftSubject: `Bid numbers for ${metro.industrialCorridor} ($240K Permit #BP-2026-08941)`,
      draftBody: `"Hey Marcus — saw the $240,000 commercial TI buildout permit filed yesterday at ${metro.industrialCorridor}. Our crew just wrapped ${tradeTpl.card1CompletedJob} ${landmark} and passed city inspection ahead of schedule. We have a crew opening up next month and would love to drop off numbers on the ${tradeTpl.card1Scope}. Mind if I send over our commercial spec sheet and bid calendar this afternoon?"`,
      approvalStatus: 'ready',
      dispatchChannel: 'CLOUD_EMAIL',
      approvedAt: null,
      approvedTimeLabel: null
    },
    {
      id: 'deal-2',
      cardRank: 2,
      cardNumber: 'CARD 02 • B2B PROPERTY MANAGER',
      unlockedBadge: 'UNLOCKED #2',
      isLockedOverflow: false,
      pillIcon: '🏢',
      pillText: 'NEW ACQUISITION • 140-UNIT COMPLEX',
      pillClass: 'bg-[#FEF3C7] border-amber-300 text-[#D97706]',
      headline: tradeTpl.card2Headline,
      subMeta: `Property Address: ${metro.commercialAvenue} (${metro.city}, ${metro.state} ${metro.zip}) • Commercial Deed Transfer & Vendor Re-Bid Window`,
      cadCallout: null,
      cadDetails: {
        parcelId: `CAD-${metro.zip}-4410`,
        countyName: metro.countyCad,
        deededOwner: 'Crestview Commercial REIT IV LP',
        assessedValue: '$14,200,000',
        buildingSqFt: '142,000 Sq Ft',
        lotAcres: '8.6 Acres'
      },
      contactHeader: 'REGIONAL PROPERTY MANAGER MATCH:',
      contactName: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
      contactShort: 'Dana Sterling (Crestview Commercial Mgmt)',
      contactMeta: `Direct Inbox + Office Line • Active Q4 CapEx Upgrade Budget (${metro.city})`,
      contactEmail: 'dsterling@crestviewcommercial.com',
      contactPhone: '(512) 555-0182',
      draftLabel: '4-SENTENCE VENDOR INTRO (YOUR VOICE):',
      draftSubject: `Vendor packet for Oakridge Commons (${metro.commercialAvenue})`,
      draftBody: `"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex and adjacent retail pads on ${metro.commercialAvenue}. Usually during the first 30 days of a transition, inherited exterior trade vendors get re-evaluated to bring the property up to your standards. We carry full commercial coverage and specialize in weekend phased work on ${tradeTpl.card2Scope} so zero tenants lose access. Can I swing by Thursday to leave you a clean CapEx bid breakdown?"`,
      approvalStatus: 'ready',
      dispatchChannel: 'CLOUD_EMAIL',
      approvedAt: null,
      approvedTimeLabel: null
    },
    {
      id: 'deal-3',
      cardRank: 3,
      cardNumber: 'CARD 03 • RESIDENTIAL + CAD X-RAY',
      unlockedBadge: 'UNLOCKED #3',
      isLockedOverflow: false,
      pillIcon: '🏡',
      pillText: 'CUSTOM ADDITION + CAD TAX ROLL MATCH',
      pillClass: 'bg-blue-50 border-blue-200 text-[#1E40AF]',
      headline: `${metro.estateNeighborhood} — ${tradeTpl.card3Headline}`,
      subMeta: `Permit Address: ${metro.estateNeighborhood} (${metro.city}, ${metro.state} ${metro.zip}) • ${metro.countyCad} Verified`,
      cadCallout: '$940,000 Assessed Value • 4,120 Sq Ft • 1.4 Acres • Verified Homeowner',
      cadDetails: {
        parcelId: `CAD-${metro.zip}-90418A`,
        countyName: metro.countyCad,
        deededOwner: 'Dr. Robert & Elena Harrison',
        assessedValue: '$940,000',
        buildingSqFt: '4,120 Sq Ft',
        lotAcres: '1.4 Acres'
      },
      contactHeader: 'COUNTY APPRAISAL DISTRICT DEED MATCH:',
      contactName: 'Dr. Robert & Elena Harrison • Verified Property Owners',
      contactShort: 'Dr. Robert & Elena Harrison',
      contactMeta: `Parcel #CAD-90418-A (${metro.countyCad}) • Direct Owner Mobile & Email Verified`,
      contactEmail: 'rharrison.md@privateestate.org',
      contactPhone: '(512) 555-0199',
      draftLabel: '4-SENTENCE OWNER INTRO (YOUR VOICE):',
      draftSubject: `Quick question on your ${metro.estateNeighborhood} addition permit`,
      draftBody: `"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate at ${metro.estateNeighborhood}. Our custom residential team specializes in ${tradeTpl.card3Scope} across ${metro.city} with zero day-labor subs and a 100% clean-site guarantee. Because we coordinate directly with your framing schedule, we keep your project on timeline without headaches. Would you be open to a quick 10-minute site walk this week?"`,
      approvalStatus: 'ready',
      dispatchChannel: 'CLOUD_EMAIL',
      approvedAt: null,
      approvedTimeLabel: null
    }
  ];

  const overflowBlueprints = [
    {
      rank: 4,
      code: 'LOCKED #04',
      type: 'COMMERCIAL SHELL PERMIT',
      pillText: 'FILED 9 HRS AGO • $410,000 SHELL PERMIT',
      title: '$410,000 Commercial Shell & Retail Pad Permit',
      redacted: `Horizon GC • 4829 Main St (${metro.zip})`,
      contactName: 'Grant Mercer • VP Operations @ Horizon Commercial GC',
      contactEmail: 'gmercer@horizoncommercialgc.com',
      contactPhone: '(512) 555-0211',
      cadSummary: '$2,150,000 Assessed Value • 24,000 Sq Ft • 3.1 Acres'
    },
    {
      rank: 5,
      code: 'LOCKED #05',
      type: 'B2B REGIONAL PM',
      pillText: 'VENDOR RE-BID • 4 RETAIL PLAZAS',
      title: 'Regional PM — 4 Strip Plazas Seeking Qualified Trade Subs',
      redacted: 'Claire Sterling • 420,000 Sq Ft Portfolio',
      contactName: 'Claire Sterling • Senior Asset Manager @ Vantage Retail Group',
      contactEmail: 'csterling@vantageretail.com',
      contactPhone: '(512) 555-0234',
      cadSummary: '$18,400,000 Portfolio Value • 420,000 Sq Ft Combined'
    },
    {
      rank: 6,
      code: 'LOCKED #06',
      type: 'RESIDENTIAL + CAD X-RAY',
      pillText: 'NEW CUSTOM BUILD • $1.18M CAD MATCH',
      title: '3,900 Sq Ft Custom Build — $1.18M CAD Tax Roll Match',
      redacted: `Lot 14B Ridgeview • Verified Deeded Owner`,
      contactName: 'Jonathan & Brooke Prescot • Verified Property Owners',
      contactEmail: 'jprescot@prescotcapital.com',
      contactPhone: '(512) 555-0268',
      cadSummary: '$1,180,000 Assessed Value • 3,900 Sq Ft • 1.8 Acres'
    },
    {
      rank: 7,
      code: 'LOCKED #07',
      type: 'COMMERCIAL TI PERMIT',
      pillText: 'FILED 11 HRS AGO • $325,000 MEDICAL TI',
      title: '$325,000 Medical Office & Surgical Suite Finish-Out',
      redacted: `MedCore Builders • Suite 200 (${metro.zip})`,
      contactName: 'Derek Holloway • Lead Estimator @ MedCore Builders',
      contactEmail: 'dholloway@medcorebuilders.com',
      contactPhone: '(512) 555-0279',
      cadSummary: '$4,600,000 Assessed Value • 12,400 Sq Ft Medical Plaza'
    },
    {
      rank: 8,
      code: 'LOCKED #08',
      type: 'INDUSTRIAL WAREHOUSE PERMIT',
      pillText: 'FILED 16 HRS AGO • $580,000 TILT-WALL',
      title: '$580,000 Industrial Flex Warehouse & Laydown Yard',
      redacted: `Ironclad Construction • Parcel #8812 (${metro.zip})`,
      contactName: 'Wade Callahan • Project Director @ Ironclad Industrial',
      contactEmail: 'wcallahan@ironcladindustrial.com',
      contactPhone: '(512) 555-0290',
      cadSummary: '$3,950,000 Assessed Value • 32,000 Sq Ft • 4.5 Acres'
    },
    {
      rank: 9,
      code: 'LOCKED #09',
      type: 'RESIDENTIAL + CAD X-RAY',
      pillText: 'ESTATE REMODEL • $875K CAD MATCH',
      title: '4,450 Sq Ft Estate Wing & Outdoor Living Permit',
      redacted: `804 Oak Hollow Dr • Verified Deeded Owner`,
      contactName: 'Michael & Sarah Lindqvist • Verified Property Owners',
      contactEmail: 'mlindqvist@austinortho.com',
      contactPhone: '(512) 555-0314',
      cadSummary: '$875,000 Assessed Value • 4,450 Sq Ft • 1.2 Acres'
    }
  ];

  const overflowCards = overflowBlueprints.map((item) => ({
    id: `deal-${item.rank}`,
    cardRank: item.rank,
    cardNumber: `CARD 0${item.rank} • ${item.type}`,
    unlockedBadge: isPaidTier ? `UNLOCKED #${item.rank}` : item.code,
    isLockedOverflow: !isPaidTier,
    pillIcon: '⚡',
    pillText: item.pillText,
    pillClass: 'bg-[#FEF3C7] border-amber-300 text-[#D97706]',
    headline: item.title,
    subMeta: `Permit Address: ${item.redacted} • ${metro.portalName} #BP-2026-091${item.rank}`,
    cadCallout: item.cadSummary,
    contactHeader: 'VERIFIED DECISION-MAKER MATCH:',
    contactName: item.contactName,
    contactShort: item.contactName.split('•')[0].trim(),
    contactMeta: `Direct Email + Mobile Verified • ${metro.countyCad}`,
    contactEmail: item.contactEmail,
    contactPhone: item.contactPhone,
    redactedPreview: item.redacted,
    draftLabel: '4-SENTENCE BID INTRO (YOUR VOICE):',
    draftSubject: `Scope & bid availability for ${item.title}`,
    draftBody: `"Hi ${item.contactName.split(' ')[0]} — saw the county filing yesterday for the ${item.title} in ${metro.city} (${metro.zip}). Our ${tradeTpl.shortTrade} crew just wrapped a comparable project ${landmark} and passed inspection ahead of schedule. We have capacity opening next month and keep our job sites 100% turn-key. Mind if I send over our spec sheet and bid calendar today?"`,
    approvalStatus: 'ready',
    dispatchChannel: 'CLOUD_EMAIL',
    approvedAt: null,
    approvedTimeLabel: null
  }));

  return [...unlockedCards, ...overflowCards];
}

/* ==========================================================================
   DEFAULT INITIAL STORE SEED
   ========================================================================== */
function createDefaultStore() {
  const demoContractor = {
    id: '11111111-2222-3333-4444-555555555555',
    companyName: 'Lone Star Commercial Concrete & Paving',
    ownerName: 'Travis Miller',
    primaryTrade: 'Commercial Concrete',
    tierLevel: 'Tier 2: Commercial Permits',
    includeSmartSiteBundle: true,
    smartSiteEquityCents: 80000, // $800 accrued toward $2,400 ownership target
    smartSiteTargetCents: 240000,
    baseZip: '78130',
    serviceRadiusMiles: 25,
    minPermitValuation: 100000,
    minCadAssessedValue: 600000,
    mobilePhone: '(830) 555-0194',
    workEmail: 'travis@lonestarconcrete.com',
    voiceProfile: {
      tone: 'Direct Local Pro (Zero Fluff)',
      landmarkReference: 'two miles east off FM 306',
      recentWin: 'a 22,000 sq ft commercial tilt-wall & dock apron project',
      differentiator: 'zero day-labor subs and a 100% clean-site guarantee',
      ctaStyle: 'quick 10-minute site walk or bid calendar drop-off'
    },
    status: 'TRIAL_ACTIVE',
    createdAt: new Date().toISOString()
  };

  const demoCards = buildBriefingCardsForContractor(demoContractor);

  return {
    contractors: {
      [demoContractor.id]: demoContractor
    },
    territoryLocks: [
      {
        id: 'lock-demo-78130',
        zipCode: '78130',
        tradeCategory: 'Commercial Concrete',
        lockType: 'TIER_2_MAX_2',
        maxSlots: 2,
        contractorId: demoContractor.id,
        isActive: true,
        lockedAt: new Date().toISOString()
      },
      // Pre-seed one locked exclusive example (e.g., 79999) for testing waitlist/exclusivity collisions
      {
        id: 'lock-exclusive-79999',
        zipCode: '79999',
        tradeCategory: 'Commercial Concrete',
        lockType: 'TIER_3_EXCLUSIVE',
        maxSlots: 1,
        contractorId: 'exclusive-holder-999',
        isActive: true,
        lockedAt: new Date().toISOString()
      }
    ],
    briefings: {
      'demo-7am-briefing': {
        id: 'briefing-demo-001',
        magicToken: 'demo-7am-briefing',
        contractorId: demoContractor.id,
        briefingDate: new Date().toISOString().slice(0, 10),
        territoryZip: demoContractor.baseZip,
        metroCity: 'New Braunfels, TX',
        countyCad: 'Comal Appraisal District (Comal CAD)',
        tradeName: demoContractor.primaryTrade,
        tierLevel: demoContractor.tierLevel,
        includeSmartSiteBundle: demoContractor.includeSmartSiteBundle,
        unlockedLimit: 3,
        totalSpottedCount: 12,
        cards: demoCards,
        createdAt: new Date().toISOString()
      }
    },
    sentOutreachLogs: [],
    workerRuns: [
      {
        runId: 'recon-run-0200am-initial',
        startedAt: '02:04:12 AM',
        completedAt: '06:44:50 AM',
        portalsSwept: ['Accela Citizen Access', 'Tyler EnerGov', 'Comal CAD Tax Roll', 'BCAD GIS'],
        rawPermitsScanned: 412,
        cadMatchesVerified: 38,
        cardsGenerated: 12,
        status: 'COMPLETED'
      }
    ]
  };
}

let memoryStore = null;

function loadStore() {
  if (memoryStore) return memoryStore;

  for (const candidatePath of [LOCAL_STORE_PATH, TMP_STORE_PATH]) {
    try {
      if (fs.existsSync(candidatePath)) {
        const parsed = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
        if (parsed && parsed.briefings && parsed.briefings['demo-7am-briefing']) {
          memoryStore = parsed;
          return memoryStore;
        }
      }
    } catch (_err) {
      // Fallback to default store
    }
  }

  memoryStore = createDefaultStore();
  saveStore(memoryStore);
  return memoryStore;
}

function saveStore(store) {
  memoryStore = store;
  for (const candidatePath of [LOCAL_STORE_PATH, TMP_STORE_PATH]) {
    try {
      fs.writeFileSync(candidatePath, JSON.stringify(store, null, 2), 'utf8');
      return;
    } catch (_err) {
      // Ignore read-only filesystem errors on serverless edge; next path or memory handles it
    }
  }
}

/* ==========================================================================
   PUBLIC API FUNCTIONS
   ========================================================================== */

/**
 * Checks real-time zip code & trade capacity for Tier 1, Tier 2 (Max 2/Zip), or Tier 3 (100% Exclusive).
 */
function checkTerritoryAvailability({ zipCode, tradeCategory, tierLevel }) {
  const store = loadStore();
  const metro = resolveMetroProfile(zipCode);
  const normalizedZip = metro.zip;
  const normalizedTrade = tradeCategory || 'Commercial Concrete';
  const requestedTier = tierLevel || 'Tier 2: Commercial Permits';

  const activeLocks = store.territoryLocks.filter(
    (lock) =>
      lock.isActive &&
      lock.zipCode === normalizedZip &&
      lock.tradeCategory.toLowerCase() === normalizedTrade.toLowerCase()
  );

  const hasExclusiveLock = activeLocks.some((l) => l.lockType === 'TIER_3_EXCLUSIVE');
  const activeCount = activeLocks.length;

  let isAvailable = true;
  let slotsRemaining = 2;
  let maxSlots = 2;
  let statusBadge = '';
  let statusReason = '';

  if (hasExclusiveLock) {
    isAvailable = false;
    slotsRemaining = 0;
    maxSlots = 1;
    statusBadge = `LOCKED • TIER 3 EXCLUSIVE CLAIMED IN ${normalizedZip}`;
    statusReason = `Another ${normalizedTrade} contractor holds 100% Zip Exclusivity in ${normalizedZip}. Adjacent open territories: ${metro.nearbyZips.join(', ')}.`;
  } else if (requestedTier.includes('Tier 3')) {
    maxSlots = 1;
    if (activeCount === 0) {
      isAvailable = true;
      slotsRemaining = 1;
      statusBadge = `✓ ${normalizedZip} (${metro.city}) OPEN FOR 100% ZIP EXCLUSIVITY (1 OF 1 SLOT)`;
      statusReason = `You can lock out every competing ${normalizedTrade} contractor in ${normalizedZip} with Tier 3 Dominion.`;
    } else {
      isAvailable = true;
      slotsRemaining = 1;
      statusBadge = `⚡ ${normalizedZip} (${metro.city}) UPGRADE EXCLUSIVE SLOT AVAILABLE`;
      statusReason = `Claim Tier 3 Dominion to lock remaining capacity in ${normalizedZip} (${metro.countyCad}).`;
    }
  } else if (requestedTier.includes('Tier 2')) {
    maxSlots = 2;
    slotsRemaining = Math.max(0, 2 - activeCount);
    isAvailable = slotsRemaining > 0;
    statusBadge = isAvailable
      ? `✓ ${normalizedZip} (${metro.city}) AVAILABLE • ${slotsRemaining} OF 2 TRADE SLOTS OPEN`
      : `LOCKED • 2/2 TIER 2 SLOTS FILLED IN ${normalizedZip}`;
    statusReason = isAvailable
      ? `Capped at max 2 ${normalizedTrade} contractors in ${normalizedZip} (${metro.portalName}).`
      : `All 2 Tier 2 slots for ${normalizedTrade} in ${normalizedZip} are claimed. Try nearby: ${metro.nearbyZips.join(', ')}.`;
  } else {
    maxSlots = 5;
    slotsRemaining = Math.max(1, 5 - activeCount);
    isAvailable = true;
    statusBadge = `✓ ${normalizedZip} (${metro.city}) B2B DEAL SCOUT OPEN`;
    statusReason = `Nightly B2B property manager & GC recon active across ${metro.city}.`;
  }

  return {
    ok: true,
    zipCode: normalizedZip,
    city: metro.city,
    state: metro.state,
    countyCad: metro.countyCad,
    portalName: metro.portalName,
    tradeCategory: normalizedTrade,
    tierLevel: requestedTier,
    isAvailable,
    slotsRemaining,
    maxSlots,
    statusBadge,
    statusReason,
    nearbyOpenZips: metro.nearbyZips
  };
}

/**
 * Activates a new Territory Test Drive, locks the territory slot, and generates a live 7:00 AM Briefing.
 */
function activateTerritory({
  primaryTrade,
  tierLevel,
  includeSmartSiteBundle,
  territoryZip,
  mobilePhone,
  bestEmail,
  companyName,
  ownerName,
  minPermitValuation
}) {
  const store = loadStore();
  const availability = checkTerritoryAvailability({
    zipCode: territoryZip,
    tradeCategory: primaryTrade,
    tierLevel
  });

  const contractorId = `ctr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const magicToken = `recon-${availability.zipCode}-${Math.random().toString(36).slice(2, 8)}`;

  const contractor = {
    id: contractorId,
    companyName: companyName || `${availability.city} ${primaryTrade || 'Commercial'} Pros`,
    ownerName: ownerName || (bestEmail ? bestEmail.split('@')[0] : 'Shop Owner'),
    primaryTrade: availability.tradeCategory,
    tierLevel: availability.tierLevel,
    includeSmartSiteBundle: Boolean(includeSmartSiteBundle),
    smartSiteEquityCents: includeSmartSiteBundle ? 20000 : 0,
    smartSiteTargetCents: 240000,
    baseZip: availability.zipCode,
    serviceRadiusMiles: 25,
    minPermitValuation: Number(minPermitValuation) || 100000,
    minCadAssessedValue: 600000,
    mobilePhone: mobilePhone || '(555) 234-5678',
    workEmail: bestEmail || 'dispatch@contractor.com',
    voiceProfile: {
      tone: 'Direct Local Pro (Zero Fluff)',
      landmarkReference: resolveMetroProfile(availability.zipCode).landmarkStreet,
      recentWin: 'a 22,000 sq ft project that passed city inspection ahead of schedule',
      differentiator: 'zero day-labor subs and a 100% clean-site guarantee',
      ctaStyle: 'quick 10-minute site walk or bid calendar drop-off'
    },
    status: 'TRIAL_ACTIVE',
    createdAt: new Date().toISOString()
  };

  store.contractors[contractorId] = contractor;

  if (availability.isAvailable) {
    store.territoryLocks.push({
      id: `lock_${Date.now()}`,
      zipCode: availability.zipCode,
      tradeCategory: availability.tradeCategory,
      lockType: availability.tierLevel.includes('Tier 3')
        ? 'TIER_3_EXCLUSIVE'
        : availability.tierLevel.includes('Tier 2')
        ? 'TIER_2_MAX_2'
        : 'TIER_1_OPEN',
      maxSlots: availability.maxSlots,
      contractorId,
      isActive: true,
      lockedAt: new Date().toISOString()
    });
  }

  const cards = buildBriefingCardsForContractor(contractor);

  const briefing = {
    id: `brf_${Date.now()}`,
    magicToken,
    contractorId,
    briefingDate: new Date().toISOString().slice(0, 10),
    territoryZip: availability.zipCode,
    metroCity: `${availability.city}, ${availability.state}`,
    countyCad: availability.countyCad,
    portalName: availability.portalName,
    tradeName: availability.tradeCategory,
    tierLevel: availability.tierLevel,
    includeSmartSiteBundle: Boolean(includeSmartSiteBundle),
    unlockedLimit: 3,
    totalSpottedCount: cards.length,
    cards,
    createdAt: new Date().toISOString()
  };

  store.briefings[magicToken] = briefing;
  saveStore(store);

  return {
    ok: true,
    availability,
    contractor,
    briefing: {
      magicToken: briefing.magicToken,
      briefingUrl: `/briefing?token=${encodeURIComponent(briefing.magicToken)}`,
      commandUrl: `/command?token=${encodeURIComponent(briefing.magicToken)}`,
      territoryZip: briefing.territoryZip,
      metroCity: briefing.metroCity,
      countyCad: briefing.countyCad,
      portalName: briefing.portalName,
      unlockedCount: cards.filter((c) => !c.isLockedOverflow).length,
      lockedOverflowCount: cards.filter((c) => c.isLockedOverflow).length
    }
  };
}

/**
 * Retrieves a Morning Briefing by magicToken (falls back to 'demo-7am-briefing' if none provided).
 */
function getBriefingByToken(token) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) return null;

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  const availability = checkTerritoryAvailability({
    zipCode: briefing.territoryZip,
    tradeCategory: briefing.tradeName,
    tierLevel: briefing.tierLevel
  });

  return {
    briefing,
    contractor,
    availability,
    sentLogs: store.sentOutreachLogs.filter((l) => l.briefingToken === briefing.magicToken),
    latestWorkerRun: store.workerRuns[0] || null
  };
}

/**
 * Handles 1-Tap Approve & Send, Draft Editing, Resetting, or Unlocking All Overflow Cards.
 */
function processBriefingAction({
  token,
  action,
  cardId,
  updatedDraftBody,
  dispatchChannel,
  upgradeTier
}) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) {
    return { ok: false, error: 'Briefing not found' };
  }

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  if (action === 'reset-all') {
    briefing.cards.forEach((card) => {
      card.approvalStatus = 'ready';
      card.approvedAt = null;
      card.approvedTimeLabel = null;
    });
    saveStore(store);
    return { ok: true, briefing, contractor };
  }

  if (action === 'unlock-full-queue') {
    if (upgradeTier) {
      briefing.tierLevel = upgradeTier;
      if (contractor) contractor.tierLevel = upgradeTier;
    }
    if (contractor) contractor.status = 'PAID_ACTIVE';
    briefing.unlockedLimit = briefing.cards.length;
    briefing.cards.forEach((card, idx) => {
      card.isLockedOverflow = false;
      card.unlockedBadge = `UNLOCKED #${idx + 1}`;
    });
    saveStore(store);
    return { ok: true, briefing, contractor, unlockedAll: true };
  }

  const card = briefing.cards.find((c) => c.id === cardId);
  if (!card) {
    return { ok: false, error: `Card ${cardId} not found` };
  }

  if (action === 'save-draft') {
    if (typeof updatedDraftBody === 'string' && updatedDraftBody.trim()) {
      card.draftBody = updatedDraftBody.trim();
    }
    saveStore(store);
    return { ok: true, card, briefing };
  }

  if (action === 'reset-card') {
    card.approvalStatus = 'ready';
    card.approvedAt = null;
    card.approvedTimeLabel = null;
    saveStore(store);
    return { ok: true, card, briefing };
  }

  if (action === 'approve-send') {
    if (typeof updatedDraftBody === 'string' && updatedDraftBody.trim()) {
      card.draftBody = updatedDraftBody.trim();
    }
    const now = new Date();
    const secs = String(now.getSeconds()).padStart(2, '0');
    card.approvalStatus = 'sent';
    card.dispatchChannel = dispatchChannel || card.dispatchChannel || 'CLOUD_EMAIL';
    card.approvedAt = now.toISOString();
    card.approvedTimeLabel = `07:01:${secs} AM`;

    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      briefingToken: briefing.magicToken,
      cardId: card.id,
      cardNumber: card.cardNumber,
      headline: card.headline,
      recipientName: card.contactShort,
      recipientEmail: card.contactEmail,
      recipientPhone: card.contactPhone,
      channel: card.dispatchChannel,
      draftBody: card.draftBody,
      dispatchedAt: card.approvedAt,
      timeLabel: card.approvedTimeLabel
    };

    store.sentOutreachLogs.unshift(logEntry);
    saveStore(store);

    return {
      ok: true,
      card,
      logEntry,
      briefing
    };
  }

  return { ok: false, error: `Unsupported action: ${action}` };
}

/**
 * Updates Contractor Settings, Voice Calibration, or Smart Site Equity from the Command Portal.
 */
function updateContractorCommand({
  token,
  primaryTrade,
  territoryZip,
  tierLevel,
  minPermitValuation,
  includeSmartSiteBundle,
  landmarkReference,
  recentWin,
  differentiator
}) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) return { ok: false, error: 'Briefing not found' };

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  if (primaryTrade) {
    contractor.primaryTrade = primaryTrade;
    briefing.tradeName = primaryTrade;
  }
  if (territoryZip) {
    const metro = resolveMetroProfile(territoryZip);
    contractor.baseZip = metro.zip;
    briefing.territoryZip = metro.zip;
    briefing.metroCity = `${metro.city}, ${metro.state}`;
    briefing.countyCad = metro.countyCad;
    briefing.portalName = metro.portalName;
  }
  if (tierLevel) {
    contractor.tierLevel = tierLevel;
    briefing.tierLevel = tierLevel;
  }
  if (minPermitValuation !== undefined) {
    contractor.minPermitValuation = Number(minPermitValuation) || 100000;
  }
  if (typeof includeSmartSiteBundle === 'boolean') {
    contractor.includeSmartSiteBundle = includeSmartSiteBundle;
    briefing.includeSmartSiteBundle = includeSmartSiteBundle;
    if (includeSmartSiteBundle && contractor.smartSiteEquityCents === 0) {
      contractor.smartSiteEquityCents = 20000;
    }
  }

  contractor.voiceProfile = {
    ...contractor.voiceProfile,
    landmarkReference: landmarkReference || contractor.voiceProfile.landmarkReference,
    recentWin: recentWin || contractor.voiceProfile.recentWin,
    differentiator: differentiator || contractor.voiceProfile.differentiator
  };

  // Re-calibrate the briefing cards to reflect updated trade, zip, and shop voice
  briefing.cards = buildBriefingCardsForContractor(contractor);
  saveStore(store);

  return {
    ok: true,
    contractor,
    briefing,
    availability: checkTerritoryAvailability({
      zipCode: contractor.baseZip,
      tradeCategory: contractor.primaryTrade,
      tierLevel: contractor.tierLevel
    })
  };
}

module.exports = {
  resolveMetroProfile,
  getTradeTemplate,
  buildBriefingCardsForContractor,
  checkTerritoryAvailability,
  activateTerritory,
  getBriefingByToken,
  processBriefingAction,
  updateContractorCommand,
  loadStore,
  saveStore
};
