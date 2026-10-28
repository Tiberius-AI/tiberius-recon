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
const {
  hashPassword,
  verifyPassword,
  signSessionToken
} = require('./auth');
const {
  buildThreadReplyToAddress,
  parseThreadReplyToAddress,
  stripQuotedEmailChain,
  buildNativeSimSmsUri,
  getContractorTwilioA2PState
} = require('../workers/comms-dispatcher');

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
  if (TRADE_TEMPLATES[trade]) return TRADE_TEMPLATES[trade];
  const lower = String(trade || '').toLowerCase();
  if (lower.includes('roof') || lower.includes('exterior')) return TRADE_TEMPLATES['Roofing / Exteriors'];
  if (lower.includes('hvac') || lower.includes('electr') || lower.includes('mep') || lower.includes('mech')) {
    return TRADE_TEMPLATES['Electrical / HVAC'];
  }
  if (lower.includes('pool') || lower.includes('fenc') || lower.includes('outdoor')) {
    return TRADE_TEMPLATES['Pools / Fencing / Custom Home'];
  }
  if (lower.includes('b2b') || lower.includes('facility')) {
    return TRADE_TEMPLATES['B2B / Commercial Services'];
  }
  return TRADE_TEMPLATES['Commercial Concrete'];
}

/* ==========================================================================
   AUTONOMOUS CLIENT KNOWLEDGE BASE ("SHOP DOSSIER") BUILDER
   ========================================================================== */
function buildDefaultKnowledgeBaseForContractor(contractor = {}) {
  const metro = resolveMetroProfile(contractor.baseZip || '78130');
  const tradeTpl = getTradeTemplate(contractor.primaryTrade);
  const voice = contractor.voiceProfile || {};
  const landmark = voice.landmarkReference || metro.landmarkStreet;
  const companySlug = String(contractor.companyName || 'commercialpros')
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|company|systems|pros)\b/g, '')
    .replace(/[^a-z0-9]/g, '');

  const tradeLower = String(contractor.primaryTrade || '').toLowerCase();
  let coreServices = [
    'Commercial Tilt-Wall & Structural Slabs',
    'Heavy-Duty Truck Aprons & Loading Docks',
    'ADA Ramp & Sidewalk Compliance',
    'Post-Tension Custom Residential Foundations',
    'Weekend Phased Parking Lot Pouring'
  ];
  let certificationsAndBonding =
    'ACI-Certified Flatwork Finishers • $2M/$5M Commercial GL + Workers Comp • Bonded up to $1.5M Single Project';

  if (tradeLower.includes('roof')) {
    coreServices = [
      'Commercial TPO, PVC & EPDM Flat Roof Systems',
      '20-Year NDL Manufacturer Warranty Replacements',
      'Standing Seam Architectural Metal Roofing',
      'Drone Thermal Moisture & Hail Core Scans',
      'Multi-Family CapEx Phased Re-Roofing'
    ];
    certificationsAndBonding =
      'GAF Master Select & Johns Manville Peak Advantage • $2M/$5M Commercial GL • 20-Year NDL Warranty Certified';
  } else if (tradeLower.includes('hvac') || tradeLower.includes('electr') || tradeLower.includes('mech')) {
    coreServices = [
      'Commercial RTU Package Unit Replacements (5–25 Ton)',
      'Medical & Retail TI Mechanical/Electrical Buildouts',
      '3-Phase 480V Panel, Switchgear & Transformer Upgrades',
      'In-House Custom Sheet Metal Duct Fabrication',
      'Guaranteed 4-Hour Emergency Commercial SLA'
    ];
    certificationsAndBonding =
      'TDLR Class-A TACLA & Master Electrical License • EPA 608 Universal • $2M/$5M Commercial GL & Bonded';
  } else if (tradeLower.includes('build') || tradeLower.includes('remodel') || tradeLower.includes('pool')) {
    coreServices = [
      'Structural Custom Estate Additions & Guest Casitas',
      'Architectural Steel, Framing & Luxury Finish-Out',
      'Turnkey Commercial Tenant Improvements (TI)',
      'Custom Outdoor Living Pavilions & Pool Structures',
      'Dedicated Full-Time On-Site Superintendent'
    ];
    certificationsAndBonding =
      'Licensed Custom Builder & Commercial GC • $2M/$5M Builder Risk + GL • 10-Year Structural Warranty';
  } else if (tradeLower.includes('b2b') || tradeLower.includes('service') || tradeLower.includes('plumb')) {
    coreServices = [
      '24/7 Commercial Facility & Multi-Family SLA Contracts',
      'Night & Weekend Phased CapEx Upgrades (Zero Tenant Disruption)',
      'Hydro-Jetting, Backflow & Commercial MEP Maintenance',
      'Dedicated Regional Portfolio Account Manager',
      'Same-Day Digital Photo & Inspection Reporting'
    ];
    certificationsAndBonding =
      'Vendor-Compliance Ready (Net-30, W-9, COI on File) • $2M/$5M Commercial GL + Umbrella';
  }

  return {
    websiteUrl:
      contractor.websiteUrl ||
      `https://www.${companySlug || 'lonestarconcrete'}.com`,
    yearsInBusiness: '14+ Years Serving ' + metro.city + ' & Corridor',
    coreServices,
    certificationsAndBonding,
    warrantyAndGuarantee:
      voice.differentiator || 'zero day-labor subs and a 100% clean-site guarantee',
    proofProjects:
      voice.recentWin ||
      `${tradeTpl.card1CompletedJob} ${landmark} (passed city inspection ahead of schedule)`,
    idealJobProfile: `$${Number(contractor.minPermitValuation || 100000).toLocaleString()}+ Commercial Permits, Multi-Family CapEx & $${Number(
      contractor.minCadAssessedValue || 600000
    ).toLocaleString()}+ Custom Residential`,
    preferredCta:
      voice.ctaStyle || 'quick 10-minute site walk or COI + bid calendar drop-off',
    signatureLine: `${contractor.ownerName || 'Shop Owner'} • ${
      contractor.companyName || 'Commercial Pros'
    } • ${contractor.mobilePhone || '(512) 555-0194'}`,
    crawlSource: 'Verified Shop Onboarding Profile',
    lastUpdatedAt: new Date().toISOString()
  };
}

/* ==========================================================================
   BUILD 3 UNLOCKED + 9 LOCKED BRIEFING CARDS FOR ANY TRADE & TERRITORY
   ========================================================================== */
function buildBriefingCardsForContractor(contractor) {
  const metro = resolveMetroProfile(contractor.baseZip);
  const tradeTpl = getTradeTemplate(contractor.primaryTrade);
  const voice = contractor.voiceProfile || {};
  const kb = contractor.knowledgeBase || buildDefaultKnowledgeBaseForContractor(contractor);
  const landmark = voice.landmarkReference || metro.landmarkStreet;
  const isPaidTier = contractor.status === 'PAID_ACTIVE';
  const proofJobSnippet = kb.proofProjects || `${tradeTpl.card1CompletedJob} ${landmark}`;
  const guaranteeSnippet = kb.warrantyAndGuarantee || 'zero day-labor subs and a 100% clean-site guarantee';

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
      draftLabel: '4-SENTENCE BID INTRO (YOUR VOICE + SHOP KNOWLEDGE BASE):',
      draftSubject: `Bid numbers for ${metro.industrialCorridor} ($240K Permit #BP-2026-08941)`,
      draftBody: `"Hey Marcus — saw the $240,000 commercial TI buildout permit filed yesterday at ${metro.industrialCorridor}. Our crew just wrapped ${tradeTpl.card1CompletedJob} ${landmark} (${proofJobSnippet}) and passed city inspection ahead of schedule. We have a crew opening up next month and would love to drop off numbers on the ${tradeTpl.card1Scope}. Mind if I send over our commercial spec sheet and bid calendar this afternoon?"`,
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
      draftLabel: '4-SENTENCE VENDOR INTRO (YOUR VOICE + SHOP KNOWLEDGE BASE):',
      draftSubject: `Vendor packet for Oakridge Commons (${metro.commercialAvenue})`,
      draftBody: `"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex and adjacent retail pads on ${metro.commercialAvenue}. Usually during the first 30 days of a transition, inherited exterior trade vendors get re-evaluated to bring the property up to your standards. We carry full commercial coverage (${kb.certificationsAndBonding.split('•')[0].trim()}) and specialize in weekend phased work on ${tradeTpl.card2Scope} so zero tenants lose access. Can I swing by Thursday to leave you a clean CapEx bid breakdown?"`,
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
      draftLabel: '4-SENTENCE OWNER INTRO (YOUR VOICE + SHOP KNOWLEDGE BASE):',
      draftSubject: `Quick question on your ${metro.estateNeighborhood} addition permit`,
      draftBody: `"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate at ${metro.estateNeighborhood}. Our custom residential team specializes in ${tradeTpl.card3Scope} across ${metro.city} with ${guaranteeSnippet}. Because we coordinate directly with your framing schedule, we keep your project on timeline without headaches. Would you be open to a ${kb.preferredCta} this week?"`,
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
   CONVERSATION ROOM & FOLLOW-UP THREAD SEEDER
   ========================================================================== */
function createDefaultConversationThreads(contractor, cards = []) {
  const metro = resolveMetroProfile(contractor.baseZip || '78130');
  const tradeTpl = getTradeTemplate(contractor.primaryTrade);
  const kb = contractor.knowledgeBase || buildDefaultKnowledgeBaseForContractor(contractor);
  const c1 = cards[0] || {};
  const c2 = cards[1] || {};
  const c3 = cards[2] || {};
  const c4 = cards[3] || {};

  return [
    {
      id: 'thread-deal-1',
      cardId: 'deal-1',
      cardNumber: c1.cardNumber || 'CARD 01 • COMMERCIAL PERMIT',
      stage: 'REPLIED_HOT',
      stageBadge: '🔥 HOT REPLY — BID WALK REQUESTED',
      unread: true,
      dealValuation: '$240,000',
      permitNumber: '#BP-2026-08941',
      propertyAddress: `${metro.industrialCorridor}, ${metro.city}, ${metro.state} ${metro.zip}`,
      headline: c1.headline || tradeTpl.card1Headline,
      cadDetails: c1.cadDetails || {
        parcelId: `CAD-${metro.zip}-8941`,
        countyName: metro.countyCad,
        deededOwner: 'Industrial Parkway Holdings LLC',
        assessedValue: '$1,850,000',
        buildingSqFt: '18,500 Sq Ft',
        lotAcres: '2.4 Acres'
      },
      contactName: c1.contactName || 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
      contactShort: c1.contactShort || 'Marcus Vance (Apex Commercial Builders)',
      contactEmail: c1.contactEmail || 'mvance@apexcommercialbuilders.com',
      contactPhone: c1.contactPhone || '(512) 555-0148',
      channel: 'CLOUD_EMAIL',
      lastActivityLabel: '14 mins ago',
      followUpDueLabel: 'Reply Now — Bid Window Closes Friday',
      messages: [
        {
          id: 'msg-101',
          sender: 'CONTRACTOR',
          senderName: `${contractor.ownerName} (${contractor.companyName})`,
          timestamp: 'Today • 07:02 AM',
          channel: 'CLOUD_EMAIL',
          body: (c1.draftBody || '').replace(/^"|"$/g, '')
        },
        {
          id: 'msg-102',
          sender: 'PROSPECT',
          senderName: 'Marcus Vance (Apex Commercial Builders)',
          timestamp: 'Today • 08:19 AM',
          channel: 'CLOUD_EMAIL',
          body: `Hey ${
            (contractor.ownerName || 'there').split(' ')[0]
          } — timing is spot on. Our previous sub backed out on the ${
            tradeTpl.card1Scope
          } schedule at ${
            metro.industrialCorridor
          }. Do you guys carry $2M commercial GL + bonding, and can you walk the site with my superintendent this Thursday at 9:00 AM to review the plan set?`
        }
      ]
    },
    {
      id: 'thread-deal-2',
      cardId: 'deal-2',
      cardNumber: c2.cardNumber || 'CARD 02 • B2B PROPERTY MANAGER',
      stage: 'REPLIED_HOT',
      stageBadge: '🔥 HOT REPLY — VENDOR PACKET REQUESTED',
      unread: true,
      dealValuation: '$14,200,000 CapEx',
      permitNumber: `Deed Transfer • Parcel #CAD-${metro.zip}-4410`,
      propertyAddress: `${metro.commercialAvenue}, ${metro.city}, ${metro.state} ${metro.zip}`,
      headline: c2.headline || tradeTpl.card2Headline,
      cadDetails: c2.cadDetails || {
        parcelId: `CAD-${metro.zip}-4410`,
        countyName: metro.countyCad,
        deededOwner: 'Crestview Commercial REIT IV LP',
        assessedValue: '$14,200,000',
        buildingSqFt: '142,000 Sq Ft',
        lotAcres: '8.6 Acres'
      },
      contactName: c2.contactName || 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
      contactShort: c2.contactShort || 'Dana Sterling (Crestview Commercial Mgmt)',
      contactEmail: c2.contactEmail || 'dsterling@crestviewcommercial.com',
      contactPhone: c2.contactPhone || '(512) 555-0182',
      channel: 'CLOUD_EMAIL',
      lastActivityLabel: '42 mins ago',
      followUpDueLabel: 'Send W-9, COI & Warranty Summary',
      messages: [
        {
          id: 'msg-201',
          sender: 'CONTRACTOR',
          senderName: `${contractor.ownerName} (${contractor.companyName})`,
          timestamp: 'Today • 07:03 AM',
          channel: 'CLOUD_EMAIL',
          body: (c2.draftBody || '').replace(/^"|"$/g, '')
        },
        {
          id: 'msg-202',
          sender: 'PROSPECT',
          senderName: 'Dana Sterling (Crestview Commercial Mgmt)',
          timestamp: 'Today • 08:47 AM',
          channel: 'CLOUD_EMAIL',
          body: `Hi ${
            (contractor.ownerName || 'there').split(' ')[0]
          }, thanks for reaching out. We are onboarding two new preferred ${
            tradeTpl.shortTrade
          } vendors for Oakridge Commons this quarter. What specific services and warranties do you offer, and can you reply with your insurance/bonding details so I can add ${
            contractor.companyName
          } to Thursday's walk?`
        }
      ]
    },
    {
      id: 'thread-deal-3',
      cardId: 'deal-3',
      cardNumber: c3.cardNumber || 'CARD 03 • RESIDENTIAL + CAD X-RAY',
      stage: 'FOLLOWUP_DUE',
      stageBadge: '⏳ DAY-3 FOLLOW-UP READY',
      unread: false,
      dealValuation: '$940,000 Estate',
      permitNumber: `CAD Parcel #CAD-${metro.zip}-90418A`,
      propertyAddress: `${metro.estateNeighborhood}, ${metro.city}, ${metro.state} ${metro.zip}`,
      headline: c3.headline || `${metro.estateNeighborhood} — ${tradeTpl.card3Headline}`,
      cadDetails: c3.cadDetails || {
        parcelId: `CAD-${metro.zip}-90418A`,
        countyName: metro.countyCad,
        deededOwner: 'Dr. Robert & Elena Harrison',
        assessedValue: '$940,000',
        buildingSqFt: '4,120 Sq Ft',
        lotAcres: '1.4 Acres'
      },
      contactName: c3.contactName || 'Dr. Robert & Elena Harrison • Verified Property Owners',
      contactShort: c3.contactShort || 'Dr. Robert & Elena Harrison',
      contactEmail: c3.contactEmail || 'rharrison.md@privateestate.org',
      contactPhone: c3.contactPhone || '(512) 555-0199',
      channel: 'NATIVE_SMS',
      lastActivityLabel: 'Sent 3 days ago • Opened 2x',
      followUpDueLabel: '⚡ 1-Tap Day-3 Bump Recommended Today',
      messages: [
        {
          id: 'msg-301',
          sender: 'CONTRACTOR',
          senderName: `${contractor.ownerName} (${contractor.companyName})`,
          timestamp: '3 Days Ago • 07:05 AM',
          channel: 'CLOUD_EMAIL',
          body: (c3.draftBody || '').replace(/^"|"$/g, '')
        }
      ]
    },
    {
      id: 'thread-deal-4',
      cardId: 'deal-4',
      cardNumber: c4.cardNumber || 'CARD 04 • COMMERCIAL SHELL PERMIT',
      stage: 'SITE_WALK_BOOKED',
      stageBadge: '📅 SITE WALK BOOKED — THU 8:30 AM',
      unread: false,
      dealValuation: '$410,000',
      permitNumber: `#BP-2026-0914`,
      propertyAddress: `4829 Main St, ${metro.city}, ${metro.state} ${metro.zip}`,
      headline: c4.headline || '$410,000 Commercial Shell & Retail Pad Permit',
      cadDetails: {
        parcelId: `CAD-${metro.zip}-9104`,
        countyName: metro.countyCad,
        deededOwner: 'Horizon Commercial Development LP',
        assessedValue: '$2,150,000',
        buildingSqFt: '24,000 Sq Ft',
        lotAcres: '3.1 Acres'
      },
      contactName: 'Grant Mercer • VP Operations @ Horizon Commercial GC',
      contactShort: 'Grant Mercer (Horizon Commercial GC)',
      contactEmail: 'gmercer@horizoncommercialgc.com',
      contactPhone: '(512) 555-0211',
      channel: 'CLOUD_EMAIL',
      lastActivityLabel: 'Confirmed Yesterday',
      followUpDueLabel: 'Site Walk Locked: Thu 8:30 AM @ 4829 Main St',
      messages: [
        {
          id: 'msg-401',
          sender: 'CONTRACTOR',
          senderName: `${contractor.ownerName} (${contractor.companyName})`,
          timestamp: 'Yesterday • 07:04 AM',
          channel: 'CLOUD_EMAIL',
          body: (c4.draftBody || '').replace(/^"|"$/g, '')
        },
        {
          id: 'msg-402',
          sender: 'PROSPECT',
          senderName: 'Grant Mercer (Horizon Commercial GC)',
          timestamp: 'Yesterday • 10:12 AM',
          channel: 'CLOUD_EMAIL',
          body: `Appreciate the note ${
            (contractor.ownerName || '').split(' ')[0]
          }. Heard good things about your crew's work (${kb.proofProjects}). Let's meet at the 4829 Main St trailer Thursday at 8:30 AM and I'll hand you the full civil/architectural drawings.`
        },
        {
          id: 'msg-403',
          sender: 'CONTRACTOR',
          senderName: `${contractor.ownerName} (${contractor.companyName})`,
          timestamp: 'Yesterday • 10:28 AM',
          channel: 'CLOUD_EMAIL',
          body: `Locked in for Thursday at 8:30 AM at the 4829 Main St job trailer, Grant. Bringing our COI, W-9, and commercial unit-price sheet. — ${kb.signatureLine}`
        }
      ]
    }
  ];
}

function createDefaultScoutAlertLogs(contractor, briefingToken) {
  const firstName = String(contractor.ownerName || 'Shop Owner').trim().split(/\s+/)[0];
  return [
    {
      id: `alert_hot_${briefingToken}_0819`,
      alertType: 'HOT_PROSPECT_REPLY_SMS',
      timestamp: 'Today • 08:19 AM',
      toContractorPhone: contractor.mobilePhone,
      fromMasterTwilioNumber: '+18305550100',
      a2pCampaignModel: 'MASTER_TIBERIUS_A2P_10DLC',
      deliveryStatus: 'DELIVERED',
      smsBody: `🔥 TIBERIUS HOT REPLY: Marcus Vance (Sr. PM @ Apex Commercial Builders) just replied on #BP-2026-08941 ($240,000): "Hey ${firstName} — yes, we are finalizing our subs this week..." Tap to reply in 1 click: https://www.tiberius.ai/recon/inbox?token=${briefingToken}`
    },
    {
      id: `alert_7am_${briefingToken}_0645`,
      alertType: 'MORNING_BRIEFING_7AM_SMS',
      timestamp: 'Today • 06:45 AM',
      toContractorPhone: contractor.mobilePhone,
      fromMasterTwilioNumber: '+18305550100',
      a2pCampaignModel: 'MASTER_TIBERIUS_A2P_10DLC',
      deliveryStatus: 'DELIVERED',
      smsBody: `☕ TIBERIUS RECON 7:00 AM BRIEFING (${contractor.baseZip}): Morning ${firstName} — 3 verified ${contractor.primaryTrade} deals ($240,000 top permit) are unlocked & pre-drafted for ${contractor.companyName}. Tap to review & 1-tap send: https://www.tiberius.ai/recon/briefing?token=${briefingToken}`
    }
  ];
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
    websiteUrl: 'https://www.lonestarconcrete.com',
    passwordHash: hashPassword('concrete78130', 'salt_lonestar_78130'),
    accessPin: '78130',
    magicToken: 'demo-7am-briefing',
    role: 'CONTRACTOR',
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
  demoContractor.knowledgeBase = buildDefaultKnowledgeBaseForContractor(demoContractor);

  const secondContractor = {
    id: '22222222-3333-4444-5555-666666666666',
    companyName: 'Centex Industrial Roofing Systems',
    ownerName: 'Dana Vance',
    primaryTrade: 'Roofing / Exteriors',
    tierLevel: 'Tier 3: Full Territory Exclusivity',
    includeSmartSiteBundle: true,
    smartSiteEquityCents: 120000, // $1,200 accrued toward $2,400 ownership target
    smartSiteTargetCents: 240000,
    baseZip: '78701',
    serviceRadiusMiles: 30,
    minPermitValuation: 150000,
    minCadAssessedValue: 750000,
    mobilePhone: '(512) 555-0192',
    workEmail: 'dana@centexroofing.com',
    websiteUrl: 'https://www.centexroofing.com',
    passwordHash: hashPassword('roofing78701', 'salt_centex_78701'),
    accessPin: '78701',
    magicToken: 'centex-roofing-78701',
    role: 'CONTRACTOR',
    voiceProfile: {
      tone: 'Executive Commercial Estimator',
      landmarkReference: 'three miles north off Mopac & US-183',
      recentWin: 'a 48,000 sq ft TPO warehouse reroof completed with zero tenant disruption',
      differentiator: '20-year NDL manufacturer warranty and certified drone thermal scans',
      ctaStyle: '10-minute roof spec review or drone core walk'
    },
    status: 'PAID_ACTIVE',
    createdAt: new Date().toISOString()
  };
  secondContractor.knowledgeBase = buildDefaultKnowledgeBaseForContractor(secondContractor);

  const thirdContractor = {
    id: '33333333-4444-5555-6666-777777777777',
    companyName: 'Alamo Mechanical & Commercial HVAC',
    ownerName: 'Carlos Mendez',
    primaryTrade: 'Electrical / HVAC',
    tierLevel: 'Tier 2: Commercial Permits',
    includeSmartSiteBundle: false,
    smartSiteEquityCents: 0,
    smartSiteTargetCents: 240000,
    baseZip: '78258',
    serviceRadiusMiles: 25,
    minPermitValuation: 120000,
    minCadAssessedValue: 650000,
    mobilePhone: '(210) 555-0177',
    workEmail: 'carlos@alamohvac.com',
    websiteUrl: 'https://www.alamohvac.com',
    passwordHash: hashPassword('hvac78258', 'salt_alamo_78258'),
    accessPin: '78258',
    magicToken: 'alamo-hvac-78258',
    role: 'CONTRACTOR',
    voiceProfile: {
      tone: 'Direct Field Mechanical Lead',
      landmarkReference: 'two miles west off Loop 1604 & Blanco Rd',
      recentWin: 'a 15-ton multi-zone RTU package replacement ahead of crane schedule',
      differentiator: 'in-house sheet metal fabrication and guaranteed 4-hour emergency SLA',
      ctaStyle: 'quick mechanical schedule review this week'
    },
    status: 'PAID_ACTIVE',
    createdAt: new Date().toISOString()
  };
  thirdContractor.knowledgeBase = buildDefaultKnowledgeBaseForContractor(thirdContractor);

  const demoCards = buildBriefingCardsForContractor(demoContractor);
  const secondCards = buildBriefingCardsForContractor(secondContractor);
  const thirdCards = buildBriefingCardsForContractor(thirdContractor);

  return {
    adminAccount: {
      id: 'admin-master-tiberius',
      email: 'admin@tiberius.ai',
      name: 'Tiberius Master Agency Command',
      role: 'ADMIN',
      passwordHash: hashPassword('TiberiusAdmin2026!', 'salt_master_admin_2026')
    },
    contractors: {
      [demoContractor.id]: demoContractor,
      [secondContractor.id]: secondContractor,
      [thirdContractor.id]: thirdContractor
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
      {
        id: 'lock-centex-78701',
        zipCode: '78701',
        tradeCategory: 'Commercial Roofing',
        lockType: 'TIER_3_EXCLUSIVE',
        maxSlots: 1,
        contractorId: secondContractor.id,
        isActive: true,
        lockedAt: new Date().toISOString()
      },
      {
        id: 'lock-alamo-78258',
        zipCode: '78258',
        tradeCategory: 'Commercial HVAC',
        lockType: 'TIER_2_MAX_2',
        maxSlots: 2,
        contractorId: thirdContractor.id,
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
        portalName: 'City of New Braunfels EnerGov Portal',
        tradeName: demoContractor.primaryTrade,
        tierLevel: demoContractor.tierLevel,
        includeSmartSiteBundle: demoContractor.includeSmartSiteBundle,
        unlockedLimit: 3,
        totalSpottedCount: 12,
        cards: demoCards,
        createdAt: new Date().toISOString()
      },
      'centex-roofing-78701': {
        id: 'briefing-centex-002',
        magicToken: 'centex-roofing-78701',
        contractorId: secondContractor.id,
        briefingDate: new Date().toISOString().slice(0, 10),
        territoryZip: secondContractor.baseZip,
        metroCity: 'Austin, TX',
        countyCad: 'Travis Central Appraisal District (TCAD)',
        portalName: 'Austin Build + Connect (AB+C) Portal',
        tradeName: secondContractor.primaryTrade,
        tierLevel: secondContractor.tierLevel,
        includeSmartSiteBundle: secondContractor.includeSmartSiteBundle,
        unlockedLimit: 3,
        totalSpottedCount: 12,
        cards: secondCards,
        createdAt: new Date().toISOString()
      },
      'alamo-hvac-78258': {
        id: 'briefing-alamo-003',
        magicToken: 'alamo-hvac-78258',
        contractorId: thirdContractor.id,
        briefingDate: new Date().toISOString().slice(0, 10),
        territoryZip: thirdContractor.baseZip,
        metroCity: 'San Antonio, TX',
        countyCad: 'Bexar Appraisal District (BCAD)',
        portalName: 'San Antonio BuildSA Accela Portal',
        tradeName: thirdContractor.primaryTrade,
        tierLevel: thirdContractor.tierLevel,
        includeSmartSiteBundle: thirdContractor.includeSmartSiteBundle,
        unlockedLimit: 3,
        totalSpottedCount: 12,
        cards: thirdCards,
        createdAt: new Date().toISOString()
      }
    },
    conversationThreads: {
      'demo-7am-briefing': createDefaultConversationThreads(demoContractor, demoCards),
      'centex-roofing-78701': createDefaultConversationThreads(secondContractor, secondCards),
      'alamo-hvac-78258': createDefaultConversationThreads(thirdContractor, thirdCards)
    },
    scoutAlertLogs: {
      'demo-7am-briefing': createDefaultScoutAlertLogs(demoContractor, 'demo-7am-briefing'),
      'centex-roofing-78701': createDefaultScoutAlertLogs(secondContractor, 'centex-roofing-78701'),
      'alamo-hvac-78258': createDefaultScoutAlertLogs(thirdContractor, 'alamo-hvac-78258')
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

  const defaultStore = createDefaultStore();

  for (const candidatePath of [LOCAL_STORE_PATH, TMP_STORE_PATH]) {
    try {
      if (fs.existsSync(candidatePath)) {
        const parsed = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
        if (parsed && parsed.briefings && parsed.briefings['demo-7am-briefing']) {
          // Ensure multi-client accounts and adminAccount are present in upgraded stores
          parsed.adminAccount = parsed.adminAccount || defaultStore.adminAccount;
          parsed.contractors = {
            ...defaultStore.contractors,
            ...(parsed.contractors || {})
          };
          // Ensure demo contractors have passwordHash, magicToken & knowledgeBase
          Object.keys(parsed.contractors).forEach((id) => {
            const c = parsed.contractors[id];
            if (!c) return;
            if (defaultStore.contractors[id] && !c.passwordHash) {
              c.passwordHash = defaultStore.contractors[id].passwordHash;
              c.magicToken = defaultStore.contractors[id].magicToken;
              c.accessPin = defaultStore.contractors[id].accessPin;
            }
            if (!c.knowledgeBase) {
              c.knowledgeBase = buildDefaultKnowledgeBaseForContractor(c);
            }
          });
          parsed.briefings = {
            ...defaultStore.briefings,
            ...(parsed.briefings || {})
          };
          parsed.conversationThreads = {
            ...defaultStore.conversationThreads,
            ...(parsed.conversationThreads || {})
          };
          parsed.scoutAlertLogs = {
            ...defaultStore.scoutAlertLogs,
            ...(parsed.scoutAlertLogs || {})
          };
          memoryStore = parsed;
          return memoryStore;
        }
      }
    } catch (_err) {
      // Fallback to default store
    }
  }

  memoryStore = defaultStore;
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

function sanitizeContractor(contractor) {
  if (!contractor) return null;
  const copy = { ...contractor };
  delete copy.passwordHash;
  return copy;
}

function buildSessionClaimsForContractor(contractor, briefingToken) {
  return {
    sub: contractor.id,
    role: contractor.role || 'CONTRACTOR',
    email: contractor.workEmail,
    phone: contractor.mobilePhone,
    companyName: contractor.companyName,
    ownerName: contractor.ownerName,
    primaryTrade: contractor.primaryTrade,
    baseZip: contractor.baseZip,
    tierLevel: contractor.tierLevel,
    includeSmartSiteBundle: Boolean(contractor.includeSmartSiteBundle),
    magicToken: briefingToken || contractor.magicToken || 'demo-7am-briefing'
  };
}

/**
 * Activates a new Territory Test Drive, locks the territory slot, creates an isolated
 * password-protected Contractor Account, and generates a live 7:00 AM Briefing + signed JWT.
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
  websiteUrl,
  minPermitValuation,
  accountPassword
}) {
  const store = loadStore();
  const availability = checkTerritoryAvailability({
    zipCode: territoryZip,
    tradeCategory: primaryTrade,
    tierLevel
  });

  const contractorId = `ctr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const magicToken = `recon-${availability.zipCode}-${Math.random().toString(36).slice(2, 8)}`;
  const rawPassword =
    (accountPassword && String(accountPassword).trim()) ||
    availability.zipCode ||
    'recon2026';

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
    websiteUrl: websiteUrl ? String(websiteUrl).trim() : undefined,
    passwordHash: hashPassword(rawPassword),
    accessPin: availability.zipCode,
    magicToken,
    role: 'CONTRACTOR',
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
  contractor.knowledgeBase = buildDefaultKnowledgeBaseForContractor(contractor);

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
  store.conversationThreads = store.conversationThreads || {};
  store.conversationThreads[magicToken] = createDefaultConversationThreads(contractor, cards);
  saveStore(store);

  const sessionToken = signSessionToken(
    buildSessionClaimsForContractor(contractor, briefing.magicToken)
  );

  return {
    ok: true,
    sessionToken,
    availability,
    contractor: sanitizeContractor(contractor),
    briefing: {
      magicToken: briefing.magicToken,
      briefingUrl: `/briefing?token=${encodeURIComponent(briefing.magicToken)}`,
      commandUrl: `/command?token=${encodeURIComponent(briefing.magicToken)}`,
      inboxUrl: `/inbox?token=${encodeURIComponent(briefing.magicToken)}`,
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
  upgradeTier,
  primaryTrade,
  territoryZip,
  landmarkReference
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

  // Sync trade or zip if user changed the dropdown before clicking Unlock or Approve
  let needsCardRebuild = false;
  if (primaryTrade && primaryTrade !== briefing.tradeName) {
    briefing.tradeName = primaryTrade;
    if (contractor) contractor.primaryTrade = primaryTrade;
    needsCardRebuild = true;
  }
  if (territoryZip && String(territoryZip).trim() && String(territoryZip).trim() !== briefing.territoryZip) {
    const metro = resolveMetroProfile(territoryZip);
    briefing.territoryZip = metro.zip;
    briefing.metroCity = `${metro.city}, ${metro.state}`;
    briefing.countyCad = metro.countyCad;
    briefing.portalName = metro.portalName;
    if (contractor) contractor.baseZip = metro.zip;
    needsCardRebuild = true;
  }
  if (landmarkReference && contractor && contractor.voiceProfile && landmarkReference !== contractor.voiceProfile.landmarkReference) {
    contractor.voiceProfile.landmarkReference = landmarkReference;
    needsCardRebuild = true;
  }
  if (needsCardRebuild && contractor) {
    const wasAllUnlocked = briefing.unlockedLimit > 3;
    briefing.cards = buildBriefingCardsForContractor(contractor);
    if (wasAllUnlocked) {
      briefing.unlockedLimit = briefing.cards.length;
      briefing.cards.forEach((c, idx) => {
        c.isLockedOverflow = false;
        c.unlockedBadge = `UNLOCKED #${idx + 1}`;
      });
    }
  }

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

    // Ensure a live thread exists or is updated in the Conversation Room
    store.conversationThreads = store.conversationThreads || {};
    if (!store.conversationThreads[briefing.magicToken]) {
      store.conversationThreads[briefing.magicToken] = createDefaultConversationThreads(
        contractor,
        briefing.cards
      );
    }
    const threads = store.conversationThreads[briefing.magicToken];
    let existingThread = threads.find((t) => t.cardId === card.id);
    if (!existingThread) {
      existingThread = {
        id: `thread-${card.id}`,
        cardId: card.id,
        cardNumber: card.cardNumber,
        stage: 'FOLLOWUP_DUE',
        stageBadge: '📤 INTRO DISPATCHED — TRACKING OPENS',
        unread: false,
        dealValuation: (card.pillText && card.pillText.match(/\$[0-9,]+[KM]?/)?.[0]) || '$240,000',
        permitNumber: card.cardNumber,
        propertyAddress: card.subMeta || card.headline,
        headline: card.headline,
        cadDetails: card.cadDetails || {
          parcelId: `CAD-${briefing.territoryZip}-${card.cardRank || 1}01`,
          countyName: briefing.countyCad,
          deededOwner: 'Verified Property Owner / GC',
          assessedValue: card.cadCallout || '$1,450,000',
          buildingSqFt: '18,500 Sq Ft',
          lotAcres: '2.1 Acres'
        },
        contactName: card.contactName,
        contactShort: card.contactShort || card.contactName,
        contactEmail: card.contactEmail,
        contactPhone: card.contactPhone,
        channel: card.dispatchChannel,
        lastActivityLabel: 'Dispatched just now',
        followUpDueLabel: 'Day-3 Auto-Follow-Up Queued',
        messages: []
      };
      threads.unshift(existingThread);
    }
    existingThread.messages.push({
      id: `msg_${Date.now()}`,
      sender: 'CONTRACTOR',
      senderName: contractor ? `${contractor.ownerName} (${contractor.companyName})` : 'You',
      timestamp: `Today • ${card.approvedTimeLabel}`,
      channel: card.dispatchChannel,
      body: (card.draftBody || '').replace(/^"|"$/g, '')
    });
    existingThread.lastActivityLabel = `Dispatched ${card.approvedTimeLabel}`;

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
  const wasAllUnlocked = briefing.unlockedLimit > 3;
  briefing.cards = buildBriefingCardsForContractor(contractor);
  if (wasAllUnlocked) {
    briefing.unlockedLimit = briefing.cards.length;
    briefing.cards.forEach((c, idx) => {
      c.isLockedOverflow = false;
      c.unlockedBadge = `UNLOCKED #${idx + 1}`;
    });
  }
  saveStore(store);

  return {
    ok: true,
    contractor: sanitizeContractor(contractor),
    briefing,
    availability: checkTerritoryAvailability({
      zipCode: contractor.baseZip,
      tradeCategory: contractor.primaryTrade,
      tierLevel: contractor.tierLevel
    })
  };
}

/**
 * Authenticates either a Contractor Account (by email, phone, or magicToken + password/PIN)
 * or the Master Agency Admin (`admin@tiberius.ai` + `TiberiusAdmin2026!`).
 */
function authenticateAccount({ identifier, password }) {
  const store = loadStore();
  const cleanId = String(identifier || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  if (!cleanId || !cleanPass) {
    return { ok: false, error: 'Please enter both your email/phone and password or access PIN.' };
  }

  // 1. Check Master Agency Admin
  const admin = store.adminAccount;
  if (
    admin &&
    (cleanId === admin.email.toLowerCase() || cleanId === 'admin' || cleanId === 'master')
  ) {
    const validAdmin =
      verifyPassword(cleanPass, admin.passwordHash) || cleanPass === 'TiberiusAdmin2026!';
    if (!validAdmin) {
      return { ok: false, error: 'Invalid Master Agency Admin password.' };
    }

    const sessionToken = signSessionToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
      companyName: admin.name,
      ownerName: 'Master Admin',
      magicToken: 'demo-7am-briefing'
    });

    return {
      ok: true,
      role: 'ADMIN',
      sessionToken,
      account: {
        id: admin.id,
        companyName: admin.name,
        ownerName: 'Master Admin',
        workEmail: admin.email,
        role: 'ADMIN',
        magicToken: 'demo-7am-briefing'
      }
    };
  }

  // 2. Search Contractor Accounts by Email, Phone digits, or Magic Token
  const idDigits = cleanId.replace(/\D/g, '');
  const contractorsList = Object.values(store.contractors || {});
  const matchedContractor = contractorsList.find((c) => {
    const emailMatch = String(c.workEmail || '').trim().toLowerCase() === cleanId;
    const tokenMatch = String(c.magicToken || '').trim().toLowerCase() === cleanId;
    const cDigits = String(c.mobilePhone || '').replace(/\D/g, '');
    const phoneMatch = idDigits.length >= 7 && cDigits.endsWith(idDigits.slice(-7));
    return emailMatch || tokenMatch || phoneMatch;
  });

  if (!matchedContractor) {
    return {
      ok: false,
      error: 'No contractor account found matching that email or mobile phone.'
    };
  }

  const validPass =
    verifyPassword(cleanPass, matchedContractor.passwordHash) ||
    (matchedContractor.accessPin && cleanPass === String(matchedContractor.accessPin));

  if (!validPass) {
    return {
      ok: false,
      error: 'Incorrect password or territory PIN for this contractor account.'
    };
  }

  // Find or create the contractor's briefing
  let briefing = Object.values(store.briefings).find(
    (b) => b.contractorId === matchedContractor.id
  );
  if (!briefing && matchedContractor.magicToken) {
    briefing = store.briefings[matchedContractor.magicToken];
  }
  const magicToken = briefing ? briefing.magicToken : matchedContractor.magicToken || 'demo-7am-briefing';

  const sessionToken = signSessionToken(
    buildSessionClaimsForContractor(matchedContractor, magicToken)
  );

  return {
    ok: true,
    role: 'CONTRACTOR',
    sessionToken,
    account: sanitizeContractor({
      ...matchedContractor,
      magicToken
    }),
    briefing: briefing
      ? {
          magicToken: briefing.magicToken,
          briefingUrl: `/briefing?token=${encodeURIComponent(briefing.magicToken)}`,
          commandUrl: `/command?token=${encodeURIComponent(briefing.magicToken)}`,
          territoryZip: briefing.territoryZip,
          metroCity: briefing.metroCity,
          tradeName: briefing.tradeName,
          tierLevel: briefing.tierLevel
        }
      : null
  };
}

/**
 * Ensures a stateless signed session token's contractor and briefing exist in the runtime store
 * (providing seamless resilience across Vercel Serverless cold starts).
 */
function hydrateAccountFromSession(sessionClaims) {
  if (!sessionClaims || !sessionClaims.sub) return null;
  const store = loadStore();

  if (sessionClaims.role === 'ADMIN') {
    return {
      role: 'ADMIN',
      account: {
        id: store.adminAccount.id,
        companyName: store.adminAccount.name,
        ownerName: 'Master Admin',
        workEmail: store.adminAccount.email,
        role: 'ADMIN',
        magicToken: 'demo-7am-briefing'
      }
    };
  }

  let contractor = store.contractors[sessionClaims.sub];
  if (!contractor) {
    const metro = resolveMetroProfile(sessionClaims.baseZip || '78130');
    contractor = {
      id: sessionClaims.sub,
      companyName: sessionClaims.companyName || `${metro.city} Commercial Pros`,
      ownerName: sessionClaims.ownerName || 'Shop Owner',
      primaryTrade: sessionClaims.primaryTrade || 'Commercial Concrete',
      tierLevel: sessionClaims.tierLevel || 'Tier 2: Commercial Permits',
      includeSmartSiteBundle: Boolean(sessionClaims.includeSmartSiteBundle),
      smartSiteEquityCents: sessionClaims.includeSmartSiteBundle ? 20000 : 0,
      smartSiteTargetCents: 240000,
      baseZip: metro.zip,
      serviceRadiusMiles: 25,
      minPermitValuation: 100000,
      minCadAssessedValue: 600000,
      mobilePhone: sessionClaims.phone || '(555) 234-5678',
      workEmail: sessionClaims.email || 'dispatch@contractor.com',
      magicToken: sessionClaims.magicToken || `recon-${metro.zip}`,
      role: 'CONTRACTOR',
      voiceProfile: {
        tone: 'Direct Local Pro (Zero Fluff)',
        landmarkReference: metro.landmarkStreet,
        recentWin: 'a 22,000 sq ft project that passed city inspection ahead of schedule',
        differentiator: 'zero day-labor subs and a 100% clean-site guarantee',
        ctaStyle: 'quick 10-minute site walk or bid calendar drop-off'
      },
      status: 'TRIAL_ACTIVE',
      createdAt: new Date().toISOString()
    };
    store.contractors[contractor.id] = contractor;
  }

  const magicToken = sessionClaims.magicToken || contractor.magicToken || 'demo-7am-briefing';
  if (!store.briefings[magicToken]) {
    const metro = resolveMetroProfile(contractor.baseZip);
    const cards = buildBriefingCardsForContractor(contractor);
    store.briefings[magicToken] = {
      id: `brf_${Date.now()}`,
      magicToken,
      contractorId: contractor.id,
      briefingDate: new Date().toISOString().slice(0, 10),
      territoryZip: metro.zip,
      metroCity: `${metro.city}, ${metro.state}`,
      countyCad: metro.countyCad,
      portalName: metro.portalName,
      tradeName: contractor.primaryTrade,
      tierLevel: contractor.tierLevel,
      includeSmartSiteBundle: Boolean(contractor.includeSmartSiteBundle),
      unlockedLimit: 3,
      totalSpottedCount: cards.length,
      cards,
      createdAt: new Date().toISOString()
    };
    saveStore(store);
  }

  return {
    role: 'CONTRACTOR',
    account: sanitizeContractor({ ...contractor, magicToken }),
    briefing: store.briefings[magicToken]
  };
}

/**
 * Returns the complete Multi-Client Agency Roster & Territory Lock Overview for Master Admins.
 */
function getAdminAgencyOverview() {
  const store = loadStore();
  const contractors = Object.values(store.contractors || {}).map((c) => {
    const briefing =
      Object.values(store.briefings || {}).find((b) => b.contractorId === c.id) ||
      store.briefings[c.magicToken];
    const magicToken = briefing ? briefing.magicToken : c.magicToken || 'demo-7am-briefing';
    const cards = briefing && Array.isArray(briefing.cards) ? briefing.cards : [];
    const approvedCount = cards.filter((card) => card.approvalStatus === 'sent').length;
    const unlockedCount = cards.filter((card) => !card.isLockedOverflow).length;

    const baseRate = c.tierLevel && c.tierLevel.includes('Tier 3')
      ? 897
      : c.tierLevel && c.tierLevel.includes('Tier 1')
      ? 297
      : 597;
    const monthlyRate = baseRate + (c.includeSmartSiteBundle ? 250 : 0);

    return {
      ...sanitizeContractor(c),
      magicToken,
      briefingUrl: `/briefing?token=${encodeURIComponent(magicToken)}`,
      commandUrl: `/command?token=${encodeURIComponent(magicToken)}`,
      metroCity: briefing ? briefing.metroCity : resolveMetroProfile(c.baseZip).city,
      portalName: briefing ? briefing.portalName : resolveMetroProfile(c.baseZip).portalName,
      unlockedCount,
      totalCards: cards.length,
      approvedCount,
      monthlyRate
    };
  });

  const totalMrr = contractors.reduce((sum, c) => sum + (c.monthlyRate || 0), 0);
  const totalApprovedToday = contractors.reduce((sum, c) => sum + (c.approvedCount || 0), 0);

  return {
    ok: true,
    metrics: {
      totalClients: contractors.length,
      activeTerritoriesLocked: (store.territoryLocks || []).filter((l) => l.isActive).length,
      estimatedAgencyMrr: totalMrr,
      totalDealsApprovedToday: totalApprovedToday
    },
    clients: contractors,
    territoryLocks: store.territoryLocks || [],
    recentSentLogs: (store.sentOutreachLogs || []).slice(0, 15)
  };
}

/**
 * Updates the Contractor's Shop Knowledge Base ("Shop Dossier") and recalibrates their
 * 7:00 AM Briefing drafts & Conversation Room AI Drafter.
 */
function updateContractorKnowledgeBase({ token, knowledgeBase = {} }) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) return { ok: false, error: 'Briefing not found' };

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  const currentKb =
    contractor.knowledgeBase || buildDefaultKnowledgeBaseForContractor(contractor);

  const normalizedServices = Array.isArray(knowledgeBase.coreServices)
    ? knowledgeBase.coreServices.map((s) => String(s).trim()).filter(Boolean)
    : typeof knowledgeBase.coreServices === 'string' && knowledgeBase.coreServices.trim()
    ? knowledgeBase.coreServices
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : currentKb.coreServices;

  contractor.knowledgeBase = {
    ...currentKb,
    websiteUrl:
      knowledgeBase.websiteUrl !== undefined
        ? String(knowledgeBase.websiteUrl).trim()
        : currentKb.websiteUrl,
    yearsInBusiness:
      knowledgeBase.yearsInBusiness !== undefined
        ? String(knowledgeBase.yearsInBusiness).trim()
        : currentKb.yearsInBusiness,
    coreServices: normalizedServices,
    certificationsAndBonding:
      knowledgeBase.certificationsAndBonding !== undefined
        ? String(knowledgeBase.certificationsAndBonding).trim()
        : currentKb.certificationsAndBonding,
    warrantyAndGuarantee:
      knowledgeBase.warrantyAndGuarantee !== undefined
        ? String(knowledgeBase.warrantyAndGuarantee).trim()
        : currentKb.warrantyAndGuarantee,
    proofProjects:
      knowledgeBase.proofProjects !== undefined
        ? String(knowledgeBase.proofProjects).trim()
        : currentKb.proofProjects,
    idealJobProfile:
      knowledgeBase.idealJobProfile !== undefined
        ? String(knowledgeBase.idealJobProfile).trim()
        : currentKb.idealJobProfile,
    preferredCta:
      knowledgeBase.preferredCta !== undefined
        ? String(knowledgeBase.preferredCta).trim()
        : currentKb.preferredCta,
    signatureLine:
      knowledgeBase.signatureLine !== undefined
        ? String(knowledgeBase.signatureLine).trim()
        : currentKb.signatureLine,
    crawlSource: knowledgeBase.crawlSource || 'Manual / Live Website Sync',
    lastUpdatedAt: new Date().toISOString()
  };

  if (contractor.knowledgeBase.websiteUrl) {
    contractor.websiteUrl = contractor.knowledgeBase.websiteUrl;
  }

  // Keep voiceProfile synchronized with Knowledge Base
  contractor.voiceProfile = {
    ...(contractor.voiceProfile || {}),
    recentWin: contractor.knowledgeBase.proofProjects,
    differentiator: contractor.knowledgeBase.warrantyAndGuarantee,
    ctaStyle: contractor.knowledgeBase.preferredCta
  };

  const wasAllUnlocked = briefing.unlockedLimit > 3;
  briefing.cards = buildBriefingCardsForContractor(contractor);
  if (wasAllUnlocked) {
    briefing.unlockedLimit = briefing.cards.length;
    briefing.cards.forEach((c, idx) => {
      c.isLockedOverflow = false;
      c.unlockedBadge = `UNLOCKED #${idx + 1}`;
    });
  }

  saveStore(store);

  return {
    ok: true,
    contractor: sanitizeContractor(contractor),
    knowledgeBase: contractor.knowledgeBase,
    briefing
  };
}

function enrichThreadWithCommsMetadata(thread, contractor, briefingToken) {
  const kb = contractor.knowledgeBase || buildDefaultKnowledgeBaseForContractor(contractor);
  const prospectFirst = String(thread.contactShort || thread.contactName || 'there')
    .trim()
    .split(/\s+/)[0];
  const ownerFirst = String(contractor.ownerName || 'Shop Owner').trim().split(/\s+/)[0];
  const shortStreet = String(thread.propertyAddress || '').split(',')[0].trim();
  const replyToAddress = buildThreadReplyToAddress(briefingToken, thread.id);
  const topService = (kb.coreServices && kb.coreServices[0]) || contractor.primaryTrade || 'commercial work';

  const nativeSimDraft = `Hey ${prospectFirst} — ${ownerFirst} w/ ${contractor.companyName} here. Just sent you a quick note on the ${thread.dealValuation} permit at ${shortStreet} (${thread.permitNumber}). We just wrapped ${kb.proofProjects} nearby — open to a quick 10-min site walk Thursday at 9am?`;
  const nativeSimUri = buildNativeSimSmsUri(thread.contactPhone, nativeSimDraft);

  const voicemailScript = `"Hey ${prospectFirst}, this is ${contractor.ownerName} with ${contractor.companyName} here in ${
    resolveMetroProfile(contractor.baseZip).city
  }. Saw the ${thread.dealValuation} filing (${thread.permitNumber}) at ${shortStreet}. Our ${
    contractor.primaryTrade
  } crew just wrapped ${kb.proofProjects}, and we carry ${
    kb.certificationsAndBonding.split('•')[0].trim()
  } with ${kb.warrantyAndGuarantee}. I just shot our COI and spec sheet to your email — call or text me back on my cell at ${
    contractor.mobilePhone
  } if Thursday at 9:00 AM works to drop off numbers."`;

  return {
    ...thread,
    replyToAddress,
    nativeSimDraft,
    nativeSimUri,
    voicemailScript,
    topService
  };
}

/**
 * Returns the full state for the 3-Pane Reply & Follow-Up Conversation Room (`inbox.html`).
 */
function getConversationRoomState(token) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) return { ok: false, error: 'Briefing not found' };

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  if (!contractor.knowledgeBase) {
    contractor.knowledgeBase = buildDefaultKnowledgeBaseForContractor(contractor);
  }

  store.conversationThreads = store.conversationThreads || {};
  if (!store.conversationThreads[briefing.magicToken]) {
    store.conversationThreads[briefing.magicToken] = createDefaultConversationThreads(
      contractor,
      briefing.cards
    );
    saveStore(store);
  }

  const rawThreads = store.conversationThreads[briefing.magicToken];
  const threads = rawThreads.map((t) =>
    enrichThreadWithCommsMetadata(t, contractor, briefing.magicToken)
  );
  const hotRepliesCount = threads.filter((t) => t.stage === 'REPLIED_HOT').length;
  const followUpDueCount = threads.filter((t) => t.stage === 'FOLLOWUP_DUE').length;
  const bookedWalksCount = threads.filter((t) => t.stage === 'SITE_WALK_BOOKED').length;

  store.scoutAlertLogs = store.scoutAlertLogs || {};
  if (!store.scoutAlertLogs[briefing.magicToken]) {
    store.scoutAlertLogs[briefing.magicToken] = createDefaultScoutAlertLogs(
      contractor,
      briefing.magicToken
    );
  }

  const twilioA2PState = getContractorTwilioA2PState(contractor);

  return {
    ok: true,
    token: briefing.magicToken,
    contractor: sanitizeContractor(contractor),
    knowledgeBase: contractor.knowledgeBase,
    twilioA2PState,
    scoutAlertLogs: store.scoutAlertLogs[briefing.magicToken],
    commsPolicy: {
      primaryOutboundChannel: 'RESEND_EMAIL_WITH_REPLY_TO',
      coldSmsPolicy: 'NATIVE_SIM_HANDOFF_ONLY',
      twilioSubaccountStatus: twilioA2PState.twoStageProvisioning.currentStage
    },
    briefing: {
      magicToken: briefing.magicToken,
      territoryZip: briefing.territoryZip,
      metroCity: briefing.metroCity,
      countyCad: briefing.countyCad,
      portalName: briefing.portalName,
      tradeName: briefing.tradeName,
      tierLevel: briefing.tierLevel
    },
    metrics: {
      totalThreads: threads.length,
      hotRepliesCount,
      followUpDueCount,
      bookedWalksCount
    },
    threads
  };
}

/**
 * Handles actions inside the 3-Pane Conversation Room:
 * - 'send_message': sends a contractor reply & updates thread status
 * - 'draft_kb_reply': uses contractor.knowledgeBase + last prospect message to generate a smart reply
 * - 'draft_day3_bump': generates a 2-sentence Day-3 follow-up bump
 * - 'draft_site_walk': generates a Thursday 9:00 AM site-walk confirmation
 * - 'draft_native_sim_sms': generates a 2-sentence Native SIM text + `sms:+1...` URI (Zero A2P risk)
 * - 'draft_voicemail_script': generates a 20-second phone/voicemail script
 * - 'log_voicemail_left': logs a phone call / voicemail touch in the thread timeline
 * - 'simulate_inbound_reply': injects a realistic incoming reply from the GC/PM/Homeowner
 * - 'update_stage': updates the thread stage pill
 */
function processConversationAction({
  token,
  action,
  threadId,
  messageBody,
  channel = 'CLOUD_EMAIL',
  stage,
  providerReceipt
}) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) return { ok: false, error: 'Briefing not found' };

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];
  const kb = contractor.knowledgeBase || buildDefaultKnowledgeBaseForContractor(contractor);

  store.conversationThreads = store.conversationThreads || {};
  if (!store.conversationThreads[briefing.magicToken]) {
    store.conversationThreads[briefing.magicToken] = createDefaultConversationThreads(
      contractor,
      briefing.cards
    );
  }

  const threads = store.conversationThreads[briefing.magicToken];
  const thread = threads.find((t) => t.id === threadId) || threads[0];
  if (!thread) {
    return { ok: false, error: 'Conversation thread not found' };
  }

  const enriched = enrichThreadWithCommsMetadata(thread, contractor, briefing.magicToken);
  const prospectFirst = String(thread.contactShort || thread.contactName || 'there')
    .trim()
    .split(/\s+/)[0];
  const topServices = (kb.coreServices || []).slice(0, 3).join(', ');

  if (action === 'draft_kb_reply') {
    const lastMsg = thread.messages[thread.messages.length - 1];
    const lastBodyLower = String(lastMsg?.body || '').toLowerCase();

    let generatedDraft = '';
    if (lastBodyLower.includes('vendor') || lastBodyLower.includes('w-9') || lastBodyLower.includes('warrant')) {
      generatedDraft = `Hi ${prospectFirst} — happy to send our full vendor packet right over. ${contractor.companyName} specializes in ${topServices}, and we carry ${kb.certificationsAndBonding} backed by ${kb.warrantyAndGuarantee}. We also recently completed ${kb.proofProjects}. Can I lock in Thursday at 9:00 AM to walk ${thread.propertyAddress.split(',')[0]} with your team? — ${kb.signatureLine}`;
    } else {
      generatedDraft = `Hey ${prospectFirst} — yes, we carry ${kb.certificationsAndBonding} and our ${contractor.primaryTrade} crews specialize in ${topServices} (${kb.warrantyAndGuarantee}). We just wrapped ${kb.proofProjects}, so our crew is ready for the schedule at ${thread.propertyAddress.split(',')[0]}. Thursday at 9:00 AM works great for our estimator to meet on-site with our COI and unit-price sheet. — ${kb.signatureLine}`;
    }

    return {
      ok: true,
      action,
      threadId: thread.id,
      draftText: generatedDraft,
      replyToAddress: enriched.replyToAddress,
      knowledgeFactsUsed: [
        kb.certificationsAndBonding,
        topServices,
        kb.proofProjects,
        kb.warrantyAndGuarantee
      ]
    };
  }

  if (action === 'draft_day3_bump') {
    const bumpDraft = `Hi ${prospectFirst} — floating this back to the top of your inbox regarding the ${thread.headline} (${thread.propertyAddress.split(',')[0]}). Our ${contractor.primaryTrade} crew (${kb.yearsInBusiness}, ${kb.warrantyAndGuarantee}) has an opening in our bid calendar this week — open to a ${kb.preferredCta} on Thursday? — ${kb.signatureLine}`;
    return {
      ok: true,
      action,
      threadId: thread.id,
      draftText: bumpDraft,
      replyToAddress: enriched.replyToAddress
    };
  }

  if (action === 'draft_site_walk') {
    const walkDraft = `Hey ${prospectFirst} — locking us in for Thursday at 9:00 AM on-site at ${thread.propertyAddress.split(',')[0]}. I'll bring our COI (${kb.certificationsAndBonding.split('•')[0].trim()}), W-9, and a line-item bid sheet for the ${thread.headline}. My direct cell is ${contractor.mobilePhone} if anything shifts. — ${kb.signatureLine}`;
    return {
      ok: true,
      action,
      threadId: thread.id,
      draftText: walkDraft,
      replyToAddress: enriched.replyToAddress
    };
  }

  if (action === 'draft_native_sim_sms') {
    return {
      ok: true,
      action,
      threadId: thread.id,
      draftText: enriched.nativeSimDraft,
      nativeSimUri: enriched.nativeSimUri,
      contactPhone: thread.contactPhone
    };
  }

  if (action === 'draft_voicemail_script') {
    return {
      ok: true,
      action,
      threadId: thread.id,
      voicemailScript: enriched.voicemailScript,
      contactPhone: thread.contactPhone
    };
  }

  if (action === 'log_voicemail_left') {
    const nowLabel = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const vmMsg = {
      id: `msg_${Date.now()}_vm`,
      sender: 'CONTRACTOR',
      senderName: `${contractor.ownerName} (📞 Call / Voicemail + Native SIM)`,
      timestamp: `Today • ${nowLabel}`,
      channel: 'VOICE_CALL',
      body: `📞 Called ${thread.contactPhone} & left 20-second permit voicemail: ${enriched.voicemailScript}`
    };
    thread.messages.push(vmMsg);
    thread.unread = false;
    thread.lastActivityLabel = `Called & Left VM • ${nowLabel}`;
    saveStore(store);
    return {
      ok: true,
      action,
      thread: enrichThreadWithCommsMetadata(thread, contractor, briefing.magicToken),
      message: vmMsg,
      roomState: getConversationRoomState(briefing.magicToken)
    };
  }

  if (action === 'send_message') {
    const cleanBody = String(messageBody || '').trim();
    if (!cleanBody) {
      return { ok: false, error: 'Message body cannot be empty.' };
    }
    const nowLabel = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const effectiveChannel = channel || 'RESEND_EMAIL';
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: 'CONTRACTOR',
      senderName: `${contractor.ownerName} (${contractor.companyName})`,
      timestamp: `Today • ${nowLabel}`,
      channel: effectiveChannel,
      replyToAddress: enriched.replyToAddress,
      providerMessageId: providerReceipt?.providerMessageId || undefined,
      deliveryStatus: providerReceipt?.deliveryStatus || 'DISPATCHED',
      body: cleanBody
    };
    thread.messages.push(newMsg);
    thread.unread = false;
    thread.lastActivityLabel = `Replied Today • ${nowLabel}`;

    if (stage) {
      thread.stage = stage;
    } else if (
      cleanBody.toLowerCase().includes('thursday') ||
      cleanBody.toLowerCase().includes('walk') ||
      cleanBody.toLowerCase().includes('8:30') ||
      cleanBody.toLowerCase().includes('9:00')
    ) {
      thread.stage = 'SITE_WALK_BOOKED';
      thread.stageBadge = '📅 SITE WALK PROPOSED / CONFIRMED';
      thread.followUpDueLabel = 'Site Walk Scheduled • Bring COI & Bid Sheet';
    } else {
      thread.stage = 'AWAITING_REPLY';
      thread.stageBadge = '✅ REPLIED — AWAITING PROSPECT CONFIRMATION';
      thread.followUpDueLabel = 'Auto-Follow-Up Paused (Active Conversation)';
    }

    saveStore(store);
    return {
      ok: true,
      action,
      thread: enrichThreadWithCommsMetadata(thread, contractor, briefing.magicToken),
      message: newMsg,
      nativeSimUri: buildNativeSimSmsUri(thread.contactPhone, cleanBody),
      roomState: getConversationRoomState(briefing.magicToken)
    };
  }

  if (action === 'simulate_inbound_reply') {
    const nowLabel = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const inboundMsg = {
      id: `msg_${Date.now()}_in`,
      sender: 'PROSPECT',
      senderName: thread.contactShort,
      timestamp: `Today • ${nowLabel}`,
      channel: 'RESEND_INBOUND_WEBHOOK',
      body: `Sounds good ${(contractor.ownerName || '').split(' ')[0]} — Thursday at 9:00 AM at ${thread.propertyAddress.split(',')[0]} works for us. Please bring your COI, W-9, and any unit pricing on ${(kb.coreServices || [])[0] || contractor.primaryTrade}. See you on site.`
    };
    thread.messages.push(inboundMsg);
    thread.stage = 'REPLIED_HOT';
    thread.stageBadge = '🔥 NEW INBOUND REPLY — SITE WALK CONFIRMED';
    thread.unread = true;
    thread.lastActivityLabel = `New Reply • ${nowLabel}`;
    thread.followUpDueLabel = 'Prospect Confirmed Site Walk!';

    saveStore(store);
    return {
      ok: true,
      action,
      thread: enrichThreadWithCommsMetadata(thread, contractor, briefing.magicToken),
      message: inboundMsg,
      roomState: getConversationRoomState(briefing.magicToken)
    };
  }

  if (action === 'update_stage' && stage) {
    thread.stage = stage;
    const badgeMap = {
      REPLIED_HOT: '🔥 HOT REPLY — ACTION REQUIRED',
      FOLLOWUP_DUE: '⏳ DAY-3 FOLLOW-UP READY',
      SITE_WALK_BOOKED: '📅 SITE WALK BOOKED',
      AWAITING_REPLY: '✅ REPLIED — AWAITING CONFIRMATION'
    };
    thread.stageBadge = badgeMap[stage] || stage;
    thread.unread = false;
    saveStore(store);
    return {
      ok: true,
      action,
      thread: enrichThreadWithCommsMetadata(thread, contractor, briefing.magicToken),
      roomState: getConversationRoomState(briefing.magicToken)
    };
  }

  return { ok: false, error: `Unsupported conversation action: ${action}` };
}

/**
 * Universal Inbound Webhook Receiver (`ingestInboundWebhookReply`):
 * Processes real incoming email replies from `/api/webhooks/resend` and incoming SMS replies
 * from `/api/webhooks/twilio`, strips quoted email chains, matches the exact contractor
 * briefing & thread ID, appends the prospect reply to the Conversation Room, and flags it HOT.
 */
function ingestInboundWebhookReply({
  provider = 'RESEND',
  token,
  threadId,
  fromEmail,
  fromPhone,
  fromName,
  toAddress,
  subject,
  rawBody
}) {
  const store = loadStore();
  const parsedRouting = parseThreadReplyToAddress(toAddress);
  const resolvedToken =
    (parsedRouting && parsedRouting.token) ||
    (token && String(token).trim()) ||
    'demo-7am-briefing';
  const resolvedThreadId = (parsedRouting && parsedRouting.threadId) || threadId || null;

  const briefing = store.briefings[resolvedToken] || store.briefings['demo-7am-briefing'];
  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  store.conversationThreads = store.conversationThreads || {};
  if (!store.conversationThreads[briefing.magicToken]) {
    store.conversationThreads[briefing.magicToken] = createDefaultConversationThreads(
      contractor,
      briefing.cards
    );
  }

  const threads = store.conversationThreads[briefing.magicToken];
  let matchedThread = null;

  if (resolvedThreadId) {
    matchedThread = threads.find((t) => t.id === resolvedThreadId || t.cardId === resolvedThreadId);
  }
  if (!matchedThread && fromEmail) {
    const cleanEmail = String(fromEmail).toLowerCase().trim();
    matchedThread = threads.find((t) =>
      cleanEmail.includes(String(t.contactEmail || '').toLowerCase().trim())
    );
  }
  if (!matchedThread && fromPhone) {
    const inDigits = String(fromPhone).replace(/\D/g, '').slice(-7);
    if (inDigits.length >= 7) {
      matchedThread = threads.find((t) =>
        String(t.contactPhone || '').replace(/\D/g, '').endsWith(inDigits)
      );
    }
  }
  if (!matchedThread) {
    matchedThread = threads[0];
  }

  const cleanedBody = stripQuotedEmailChain(rawBody || subject || 'Interested — please send bid details.');
  const nowLabel = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const inboundMessage = {
    id: `msg_wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: 'PROSPECT',
    senderName: fromName || matchedThread.contactShort || matchedThread.contactName,
    timestamp: `Today • ${nowLabel}`,
    channel: provider === 'TWILIO' ? 'TWILIO_INBOUND_SMS' : 'RESEND_INBOUND_EMAIL',
    body: cleanedBody
  };

  matchedThread.messages.push(inboundMessage);
  matchedThread.stage = 'REPLIED_HOT';
  matchedThread.stageBadge =
    provider === 'TWILIO'
      ? '🔥 INBOUND SMS REPLY — ACTION REQUIRED'
      : '🔥 INBOUND EMAIL REPLY — ACTION REQUIRED';
  matchedThread.unread = true;
  matchedThread.lastActivityLabel = `Inbound ${provider} • ${nowLabel}`;
  matchedThread.followUpDueLabel = 'Prospect Replied — Respond Now';

  saveStore(store);

  return {
    ok: true,
    provider,
    matchedToken: briefing.magicToken,
    contractor: sanitizeContractor(contractor),
    threadId: matchedThread.id,
    cleanedBody,
    inboundMessage,
    thread: enrichThreadWithCommsMetadata(matchedThread, contractor, briefing.magicToken),
    roomState: getConversationRoomState(briefing.magicToken)
  };
}

/**
 * Appends a Master Twilio Scout-to-Contractor SMS Alert receipt to `store.scoutAlertLogs[token]`
 */
function recordScoutAlertLog(token, alertReceipt = {}) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  const effectiveToken = briefing ? briefing.magicToken : cleanToken;
  const contractor =
    (briefing && store.contractors[briefing.contractorId]) ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  store.scoutAlertLogs = store.scoutAlertLogs || {};
  if (!store.scoutAlertLogs[effectiveToken]) {
    store.scoutAlertLogs[effectiveToken] = createDefaultScoutAlertLogs(contractor, effectiveToken);
  }

  const nowLabel = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const entry = {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    alertType: alertReceipt.alertType || 'SCOUT_TO_CONTRACTOR_SMS',
    timestamp: `Today • ${nowLabel}`,
    toContractorPhone: alertReceipt.toPhone || contractor.mobilePhone,
    fromMasterTwilioNumber: alertReceipt.fromMasterNumber || '+18305550100',
    a2pCampaignModel: alertReceipt.a2pCampaignModel || 'MASTER_TIBERIUS_A2P_10DLC',
    deliveryStatus: alertReceipt.deliveryStatus || 'SIMULATED_MASTER_A2P_DELIVERED',
    providerMessageId: alertReceipt.providerMessageId,
    deepLinkUrl: alertReceipt.deepLinkUrl,
    smsBody: alertReceipt.smsBody || ''
  };

  store.scoutAlertLogs[effectiveToken].unshift(entry);
  saveStore(store);

  return {
    ok: true,
    entry,
    scoutAlertLogs: store.scoutAlertLogs[effectiveToken]
  };
}

/**
 * Manages the Two-Stage Twilio A2P Subaccount & Bridge Pool Provisioning (`Communication Notes.txt` Section 3):
 *   - Stage 1 (`STAGE_1_BRIDGE_POOL`): Day-1 instant activation using Tiberius AI's pre-verified Bridge Pool
 *   - Stage 2 (`STAGE_2_DEDICATED_SUBACCOUNT`): Transitions client to their dedicated Twilio Subaccount once A2P clears
 */
function provisionContractorTwilioSubaccount({ token, stage, einNumber }) {
  const store = loadStore();
  const cleanToken = String(token || 'demo-7am-briefing').trim();
  const briefing = store.briefings[cleanToken] || store.briefings['demo-7am-briefing'];
  if (!briefing) return { ok: false, error: 'Briefing not found' };

  const contractor =
    store.contractors[briefing.contractorId] ||
    store.contractors['11111111-2222-3333-4444-555555555555'];

  contractor.includeSmartSiteBundle = true;
  briefing.includeSmartSiteBundle = true;

  const targetStage =
    stage === 'STAGE_2_DEDICATED_SUBACCOUNT'
      ? 'STAGE_2_DEDICATED_SUBACCOUNT'
      : 'STAGE_1_BRIDGE_POOL';

  contractor.twilioSubaccount = {
    stage: targetStage,
    subaccountSid: `AC_sub_${contractor.id.slice(0, 8)}_${ contractor.baseZip }`,
    bridgeNumber: `+1830555${String(contractor.baseZip || '78130').slice(-4)}`,
    dedicatedNumber: `+1830555${String(contractor.baseZip || '78130').slice(-4)}`,
    einNumber: einNumber || 'XX-XXXXXXX (Verified Sole Prop / LLC)',
    a2pBrandStatus: targetStage === 'STAGE_2_DEDICATED_SUBACCOUNT' ? 'APPROVED_ACTIVE' : 'VETTING_IN_PROGRESS',
    updatedAt: new Date().toISOString()
  };

  saveStore(store);

  return {
    ok: true,
    contractor: sanitizeContractor(contractor),
    twilioA2PState: getContractorTwilioA2PState(contractor),
    roomState: getConversationRoomState(briefing.magicToken)
  };
}

module.exports = {
  resolveMetroProfile,
  getTradeTemplate,
  buildDefaultKnowledgeBaseForContractor,
  buildBriefingCardsForContractor,
  checkTerritoryAvailability,
  activateTerritory,
  getBriefingByToken,
  processBriefingAction,
  updateContractorCommand,
  updateContractorKnowledgeBase,
  getConversationRoomState,
  processConversationAction,
  ingestInboundWebhookReply,
  recordScoutAlertLog,
  provisionContractorTwilioSubaccount,
  authenticateAccount,
  hydrateAccountFromSession,
  getAdminAgencyOverview,
  sanitizeContractor,
  loadStore,
  saveStore
};
