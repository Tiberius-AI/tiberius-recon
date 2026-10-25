const MOBILE_SCROLL_SCRUB = false; // Flip to true to enable damped scroll-scrubbing on viewports <= 768px

/**
 * TIBERIUS RECON™ — "THE SILVER PLATTER" INTERACTIVE ENGINE
 * 1. Pinned 300vh Scroll-Scrubbed Tactical Canvas Engine (with Math.floor + Math.ceil sub-frame blending)
 * 2. Live 7:00 AM "Silver Platter" Queue Simulator (5 Trades, 3 Unlocked Cards, Locked Territory Vault)
 * 3. Offense + Defense Smart Site Equity Pricing Toggle
 * 4. Frictionless Single-Card Territory Activation Vault + Live 07:00:00 AM Countdown
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. TRADE PRESETS DATASET FOR THE 7:00 AM "SILVER PLATTER" SIMULATOR
     ========================================================================== */
  const TRADE_PRESETS = {
    concrete: {
      label: 'Commercial Concrete & Paving',
      vaultTradeMatch: 'Commercial Concrete',
      cards: [
        {
          id: 'card-01',
          slotLabel: 'CARD 01 • UPSTREAM COMMERCIAL PERMIT',
          triggerBadge: 'PERMIT FILED 14 HRS AGO • VALUATION: $240,000',
          sourceBadge: 'MUNICIPAL ACCELA PORTAL • #BP-2026-08941',
          projectTitle: '4820 Industrial Pkwy, Suite B — 18,500 Sq Ft Tilt-Wall Dock & Heavy Apron',
          decisionMaker: 'Marcus Vance • Sr. Project Manager @ Apex Commercial Builders',
          verifiedMeta: 'Direct Email + Cell Verified • 3.8 Miles From Your Shop',
          cadXrayBadge: null,
          outreachDraft:
            'Hey Marcus — saw the $240,000 commercial shell and dock apron permit filed yesterday at 4820 Industrial Pkwy. Our commercial concrete crew just poured a 22,000 sq ft heavy-load truck court two miles east on Commerce Dr and passed city inspection ahead of schedule. We have a laser-screed crew opening up next month and would love to drop off numbers on the flatwork and dock pits. Mind if I send over our commercial spec sheet and bid calendar this afternoon?'
        },
        {
          id: 'card-02',
          slotLabel: 'CARD 02 • LIVE B2B ACCOUNT / PROPERTY MGR TRIGGER',
          triggerBadge: 'NEW PROPERTY ACQUISITION • 140-UNIT COMPLEX',
          sourceBadge: 'LIVE B2B & DEED RECON • PORTFOLIO EXPANSION',
          projectTitle: 'Oakridge Commons & 3 Retail Pads — 6100 Westheimer Rd (84,000 Sq Ft Lot)',
          decisionMaker: 'Dana Sterling • Regional Facilities Director @ Crestview Commercial Mgmt',
          verifiedMeta: 'Direct Inbox + Office Line • Q4 CapEx Paving Budget Active',
          cadXrayBadge: null,
          outreachDraft:
            'Hi Dana — congrats to the Crestview team on closing the acquisition at Oakridge Commons and the 3 adjacent retail pads on Westheimer. When we drove the property yesterday, we noticed heavy alligator cracking near the north dumpster enclosure and delivery lane that usually triggers tenant complaints. We specialize in weekend phased commercial concrete replacement and ADA ramp upgrades so zero tenants lose parking access. Can I swing by Thursday morning to measure those sections and leave you a clean CapEx repair breakdown?'
        },
        {
          id: 'card-03',
          slotLabel: 'CARD 03 • HIGH-VALUE RESIDENTIAL PERMIT + CAD X-RAY',
          triggerBadge: 'CUSTOM ADDITION / BUILD PERMIT + CAD PARCEL MATCH',
          sourceBadge: 'COUNTY CAD TAX ROLL X-RAY • PARCEL #CAD-90418-A',
          projectTitle: '1140 Whispering Pines Ln — Detached 4-Bay Coach House & Circular Drive',
          decisionMaker: 'Dr. Robert & Elena Harrison • Verified Property Owners (Deed Match)',
          verifiedMeta: 'Homestead Verified • Direct Owner Contact Unlocked',
          cadXrayBadge: 'Assessed Value: $940,000 • 4,120 Sq Ft • 1.4 Acres • Verified Owner Match',
          outreachDraft:
            'Hi Robert — noticed the city permit approved this week for the detached 4-bay coach house and drive expansion on your 1.4-acre estate on Whispering Pines. Our residential architectural concrete team builds reinforced post-tension slabs and stamped circular motor courts for custom homes across the neighborhood. Because we pour our own 4,000 PSI fiber-mesh mixes with zero day-labor subs, our driveways stay crack-free through clay shifts. Would you be open to a quick 10-minute site walk this week before you lock in your flatwork contractor?'
        }
      ],
      lockedRows: [
        {
          title: '[LOCKED] $410,000 Commercial Shell Permit — Filed Yesterday 4:15 PM',
          redactedMeta: 'GC: Horizon Retail Builders • 26,000 Sq Ft Slab & Curb Scope',
          tierTag: 'TIER 2+ REQUIRED'
        },
        {
          title: '[LOCKED] Regional Property Mgr — 4 Plazas Seeking Subs',
          redactedMeta: 'VP Ops: Claire Sterling • 420,000 Sq Ft GLA • Bollard & Apron Bid',
          tierTag: 'FULL QUEUE LOCKED'
        },
        {
          title: '[LOCKED] 3,900 Sq Ft Custom Build — CAD Verified Owner',
          redactedMeta: 'CAD Val: $1,180,000 • 2.1 Acres • 4,800 Sq Ft Exposed Aggregate Drive',
          tierTag: 'TIER 3 CAD X-RAY'
        }
      ]
    },

    roofing: {
      label: 'Roofing & Storm Restoration',
      vaultTradeMatch: 'Roofing / Exteriors',
      cards: [
        {
          id: 'card-01',
          slotLabel: 'CARD 01 • UPSTREAM COMMERCIAL PERMIT',
          triggerBadge: 'PERMIT FILED 14 HRS AGO • VALUATION: $240,000',
          sourceBadge: 'MUNICIPAL ENERGOV PORTAL • #CM-2026-44109',
          projectTitle: '7400 Corporate Center Dr — 32,000 Sq Ft Medical Plaza TI & Roof Curb Remodel',
          decisionMaker: 'Grant Holloway • Director of Construction @ Vanguard Medical Partners',
          verifiedMeta: 'Direct Email + Mobile Verified • 4.2 Miles From Your Office',
          cadXrayBadge: null,
          outreachDraft:
            'Hey Grant — saw the $240,000 commercial TI and mechanical curb modification permit filed yesterday at 7400 Corporate Center Dr. Whenever RTUs get swapped on an existing TPO membrane, improper curb flashing voids the manufacturer warranty unless a certified commercial roofer ties it in. Our commercial service crew is working 10 minutes away on Belt Line and can turn around a manufacturer-certified TPO curb & penetration bid in 24 hours. Mind if I send over our commercial warranty credentials and schedule a quick roof walk?'
        },
        {
          id: 'card-02',
          slotLabel: 'CARD 02 • LIVE B2B ACCOUNT / PROPERTY MGR TRIGGER',
          triggerBadge: 'NEW PROPERTY ACQUISITION • 140-UNIT COMPLEX',
          sourceBadge: 'LIVE B2B & PORTFOLIO RECON • DEED TRANSFER',
          projectTitle: 'Sycamore Ridge Multi-Family (14 Buildings • Aged 18-Yr Composition Shingle)',
          decisionMaker: 'Valerie Brooks • Senior Asset Manager @ Monarch Multi-Family Group',
          verifiedMeta: 'Direct Inbox + Cell • Post-Close Insurance Inspection Window',
          cadXrayBadge: null,
          outreachDraft:
            'Hi Valerie — saw that Monarch Multi-Family just closed on the 140-unit Sycamore Ridge complex off Preston Rd. County records show the current roofs across Buildings 1–14 are approaching 18 years old and sat directly inside last spring’s 1.75-inch hail swath. We run complimentary drone thermal and hail-density forensics for commercial asset managers so you know your exact carrier claim leverage or CapEx reserve numbers. Can we fly the property this week and hand you the bound inspection binder?'
        },
        {
          id: 'card-03',
          slotLabel: 'CARD 03 • HIGH-VALUE RESIDENTIAL PERMIT + CAD X-RAY',
          triggerBadge: 'CUSTOM ADDITION / BUILD PERMIT + CAD PARCEL MATCH',
          sourceBadge: 'COUNTY CAD TAX ROLL X-RAY • PARCEL #CAD-77312-R',
          projectTitle: '804 Bridlewood Estates Ct — 1,450 Sq Ft Guest Wing Addition & Tie-In',
          decisionMaker: 'Jonathan & Claire Mercer • Verified Property Owners (CAD Deed Match)',
          verifiedMeta: 'Assessed Estate Match • Architectural Standing-Seam & Slate Zone',
          cadXrayBadge: 'Assessed Value: $940,000 • 4,120 Sq Ft • 1.4 Acres • Verified Owner Match',
          outreachDraft:
            'Hi Jonathan — saw the building permit filed this week for the new guest wing addition at your Bridlewood Estates property. Matching an addition roof valley into a 4,120 sq ft custom roofline without color mismatch or valley leaks takes custom on-site sheet metal fabrication. Our custom residential division specializes in luxury estate tie-ins, standing-seam copper accents, and Class 4 impact upgrades. Would you like us to drop off physical shingle and metal samples this week while framing is underway?'
        }
      ],
      lockedRows: [
        {
          title: '[LOCKED] $410,000 Commercial Shell Permit — Filed Yesterday 4:15 PM',
          redactedMeta: 'GC: Summit Retail Group • 28,500 Sq Ft 60-Mil TPO Roof Package',
          tierTag: 'TIER 2+ REQUIRED'
        },
        {
          title: '[LOCKED] Regional Property Mgr — 4 Plazas Seeking Subs',
          redactedMeta: 'Dir. Facilities: Mark Jensen • Annual Leak Service & Elastomeric Coating',
          tierTag: 'FULL QUEUE LOCKED'
        },
        {
          title: '[LOCKED] 3,900 Sq Ft Custom Build — CAD Verified Owner',
          redactedMeta: 'CAD Val: $1,180,000 • 2.1 Acres • Standing-Seam Metal Roof Spec',
          tierTag: 'TIER 3 CAD X-RAY'
        }
      ]
    },

    mep: {
      label: 'Electrical & Mechanical (MEP)',
      vaultTradeMatch: 'Electrical / HVAC',
      cards: [
        {
          id: 'card-01',
          slotLabel: 'CARD 01 • UPSTREAM COMMERCIAL PERMIT',
          triggerBadge: 'PERMIT FILED 14 HRS AGO • VALUATION: $240,000',
          sourceBadge: 'MUNICIPAL ACCELA PORTAL • #TI-2026-19204',
          projectTitle: '2900 Legacy Town Center — 9,800 Sq Ft Restaurant & Cold-Storage TI Buildout',
          decisionMaker: 'Derek Lin • Estimating Director @ Ironwood Commercial General Contractors',
          verifiedMeta: 'Direct Estimator Email + Cell • MEP Sub Numbers Needed This Week',
          cadXrayBadge: null,
          outreachDraft:
            'Hey Derek — saw Ironwood pulled the $240,000 shell TI permit yesterday for the 9,800 sq ft restaurant and cold-storage buildout at 2900 Legacy Town Center. Commercial kitchen hood makeup air, walk-in 3-phase feeds, and 800-amp panel upgrades are our bread and butter. We just finished two restaurant buildouts in the same jurisdiction and know the chief MEP inspector’s exact rough-in checklist. Can you send over the MEP plan link so we can get you a sharp number by Thursday?'
        },
        {
          id: 'card-02',
          slotLabel: 'CARD 02 • LIVE B2B ACCOUNT / PROPERTY MGR TRIGGER',
          triggerBadge: 'GC BIDDING 3 LOCAL RETAIL PADS • NEW PROPERTY ACQUISITION • 140-UNIT COMPLEX',
          sourceBadge: 'LIVE B2B & BID BOARD RECON • ACTIVE SUB INVITE',
          projectTitle: 'Parkway Crossing Retail Pads A, B & C + 140-Unit Mixed-Use Annex',
          decisionMaker: 'Brian Kowalski • VP of Operations @ Beacon Retail Development',
          verifiedMeta: 'Verified Direct Line • Seeking Local MEP & Service Partners',
          cadXrayBadge: null,
          outreachDraft:
            'Hi Brian — noticed Beacon Retail Development is breaking ground on the 3 retail pads at Parkway Crossing alongside the 140-unit annex. Finding an MEP contractor who actually staffs full-time licensed journeymen and hits inspection dates without holding up drywall is tough right now. We run 12 stocked commercial trucks locally and handle both ground-up shell rough-ins and ongoing 24/7 preventative maintenance. Do you have 5 minutes tomorrow to see if we should be on your bid list for Pads A–C?'
        },
        {
          id: 'card-03',
          slotLabel: 'CARD 03 • HIGH-VALUE RESIDENTIAL PERMIT + CAD X-RAY',
          triggerBadge: 'CUSTOM ADDITION / BUILD PERMIT + CAD PARCEL MATCH',
          sourceBadge: 'COUNTY CAD TAX ROLL X-RAY • PARCEL #CAD-55109-E',
          projectTitle: '308 Saddlebrook Estates Rd — Custom Casita, Outdoor Kitchen & 400A Service Upgrade',
          decisionMaker: 'Michael & Sarah Thornton • Verified Property Owners (CAD Match)',
          verifiedMeta: '4,120 Sq Ft Main Residence • Whole-Home Generator & Variable VRF Candidate',
          cadXrayBadge: 'Assessed Value: $940,000 • 4,120 Sq Ft • 1.4 Acres • Verified Owner Match',
          outreachDraft:
            'Hi Michael — saw the new building permit filed for the custom casita and outdoor pavilion at your 1.4-acre Saddlebrook Estates property. Whenever homeowners add a detached casita and outdoor kitchen on a 4,120 sq ft estate, it’s the ideal time to upgrade to a 400-amp smart distribution panel, dedicated mini-split climate zones, and a 26kW standby generator. Our master electricians and HVAC engineers handle all trenching, utility coordination, and city load calculations in-house. Could we stop by this week to give you a turnkey quote on the casita MEP and backup power?'
        }
      ],
      lockedRows: [
        {
          title: '[LOCKED] $410,000 Commercial Shell Permit — Filed Yesterday 4:15 PM',
          redactedMeta: 'GC: Apex Industrial • 1,200A 480V Switchgear & 4x 15-Ton RTU Spec',
          tierTag: 'TIER 2+ REQUIRED'
        },
        {
          title: '[LOCKED] Regional Property Mgr — 4 Plazas Seeking Subs',
          redactedMeta: 'Portfolio Dir: Rachel Vance • LED Parking Lot Retrofits + Quarterly HVAC PM',
          tierTag: 'FULL QUEUE LOCKED'
        },
        {
          title: '[LOCKED] 3,900 Sq Ft Custom Build — CAD Verified Owner',
          redactedMeta: 'CAD Val: $1,180,000 • 2.1 Acres • Lutron Lighting + 3-Zone High-SEER HVAC',
          tierTag: 'TIER 3 CAD X-RAY'
        }
      ]
    },

    pools: {
      label: 'Custom Pools, Fencing & Outdoor',
      vaultTradeMatch: 'Pools / Fencing / Custom Home',
      cards: [
        {
          id: 'card-01',
          slotLabel: 'CARD 01 • UPSTREAM COMMERCIAL / HOA PERMIT',
          triggerBadge: 'PERMIT FILED 14 HRS AGO • VALUATION: $240,000',
          sourceBadge: 'MUNICIPAL PORTAL • #AM-2026-66310',
          projectTitle: 'The Enclave at Creekwood — Phase II Amenity Deck, Perimeter Wrought Iron & Cabana',
          decisionMaker: 'Trevor Maddox • Land Development Manager @ SilverOak Communities',
          verifiedMeta: 'Direct Builder Contact Verified • Phase II Sub Walk Next Week',
          cadXrayBadge: null,
          outreachDraft:
            'Hey Trevor — saw SilverOak Communities just filed the $240,000 amenity center and perimeter enclosure permit for Phase II at The Enclave at Creekwood. Our commercial outdoor division fabricates heavy-gauge ornamental iron perimeter fencing, automated entry gates, and travertine amenity hardscapes on tight developer timelines. We’ve built three HOA amenity packages in the county over the past 12 months with zero punch-list delays. Can I send over our commercial portfolio and get on your bid sheet for Phase II?'
        },
        {
          id: 'card-02',
          slotLabel: 'CARD 02 • LIVE B2B ACCOUNT / CUSTOM BUILDER TRIGGER',
          triggerBadge: 'NEW PROPERTY ACQUISITION • 140-UNIT COMPLEX',
          sourceBadge: 'LIVE B2B & PROPERTY RECON • EXTERIOR UPGRADE',
          projectTitle: 'The Villas at Stonebridge (140 Townhome Units — Courtyards & Security Gates)',
          decisionMaker: 'Lauren Ashworth • Regional Community Director @ Hawthorne Residential',
          verifiedMeta: 'Direct Email + Mobile • Soliciting Pool Re-Plaster & Perimeter Fence Bids',
          cadXrayBadge: null,
          outreachDraft:
            'Hi Lauren — noticed Hawthorne Residential recently took over management at the 140-unit Villas at Stonebridge property. We saw on the property update notice that you’re upgrading the resort pool deck, security access gates, and common-area cedar privacy dividers this quarter. We carry full $5M commercial GL coverage and handle commercial pool resurfacing, code-compliant barrier fencing, and shade structures under one roof. Would Tuesday or Wednesday work for a 15-minute walk-through on site?'
        },
        {
          id: 'card-03',
          slotLabel: 'CARD 03 • HIGH-VALUE RESIDENTIAL PERMIT + CAD X-RAY',
          triggerBadge: 'CUSTOM ADDITION / BUILD PERMIT + CAD PARCEL MATCH',
          sourceBadge: 'COUNTY CAD TAX ROLL X-RAY • PARCEL #CAD-31804-P',
          projectTitle: '2210 Barton Creek Overlook — New Custom Home Final Frame + Unimproved 1.4-Acre Rear Lot',
          decisionMaker: 'Brett & Melissa Callahan • Verified Property Owners (CAD Homestead Match)',
          verifiedMeta: '1.4-Acre Cul-de-Sac Lot • Zero Existing Pool Permit on File',
          cadXrayBadge: 'Assessed Value: $940,000 • 4,120 Sq Ft • 1.4 Acres • Verified Owner Match',
          outreachDraft:
            'Hi Brett — congrats on the progress at your 4,120 sq ft custom home on Barton Creek Overlook! Our County CAD X-Ray shows your 1.4-acre cul-de-sac lot has the ideal rear elevation for a negative-edge gunite pool, sunken fire pit lounge, and custom cedar-and-steel estate fencing before final landscaping goes in. Designing the pool, outdoor kitchen, and perimeter fencing right as framing wraps saves tearing up irrigation and sod later. Would you and Melissa like a complimentary 3D backyard architectural rendering this week?'
        }
      ],
      lockedRows: [
        {
          title: '[LOCKED] $410,000 Commercial Shell Permit — Filed Yesterday 4:15 PM',
          redactedMeta: 'Developer: Crestline Estates • 1,850 LF Ornamental Iron & Masonry Screening',
          tierTag: 'TIER 2+ REQUIRED'
        },
        {
          title: '[LOCKED] Regional Property Mgr — 4 Plazas Seeking Subs',
          redactedMeta: 'HOA Portfolio Mgr: Kevin Ross • 6 Community Pools & Gate Access Systems',
          tierTag: 'FULL QUEUE LOCKED'
        },
        {
          title: '[LOCKED] 3,900 Sq Ft Custom Build — CAD Verified Owner',
          redactedMeta: 'CAD Val: $1,180,000 • 2.1 Acres • Custom Infinity Pool + Cabana Candidate',
          tierTag: 'TIER 3 CAD X-RAY'
        }
      ]
    },

    b2b: {
      label: 'Commercial Property Services (B2B)',
      vaultTradeMatch: 'B2B / Commercial Services',
      cards: [
        {
          id: 'card-01',
          slotLabel: 'CARD 01 • UPSTREAM COMMERCIAL PERMIT',
          triggerBadge: 'PERMIT FILED 14 HRS AGO • VALUATION: $240,000',
          sourceBadge: 'MUNICIPAL CERTIFICATE OF OCCUPANCY & TI LOG • #CO-2026-30812',
          projectTitle: '1500 Commerce Metro Blvd — 42,000 Sq Ft Class-A Office & Logistics Hub Move-In',
          decisionMaker: 'natalie.greene@sterlinglogistics.io • VP of Workplace Operations',
          verifiedMeta: 'Direct Executive Email + Cell • 30-Day Pre-Occupancy Service Window',
          cadXrayBadge: null,
          outreachDraft:
            'Hi Natalie — saw the $240,000 tenant finish-out permit and upcoming occupancy schedule filed yesterday for your new 42,000 sq ft hub at 1500 Commerce Metro Blvd. Whenever companies move into a freshly built-out facility, locking in a reliable post-construction detail and nightly commercial facility maintenance crew before Day 1 prevents headaches for your ops team. We service 1.2M sq ft of Class-A industrial and office space within 15 minutes of your new building with background-checked uniformed crews. Can I drop off a customized monthly facility maintenance proposal this week?'
        },
        {
          id: 'card-02',
          slotLabel: 'CARD 02 • LIVE B2B ACCOUNT / PROPERTY MGR TRIGGER',
          triggerBadge: 'NEW PROPERTY ACQUISITION • 140-UNIT COMPLEX',
          sourceBadge: 'LIVE B2B & COUNTY DEED RECON • MANAGEMENT CHANGE',
          projectTitle: 'Highland Park Executive Center & 140-Unit Mixed-Use Retail Commons',
          decisionMaker: 'Gregory Vance • Senior Portfolio Manager @ Lincoln Commercial Real Estate',
          verifiedMeta: 'Direct Phone + Email • Vendor Re-Bid Window Triggered 48 Hrs Ago',
          cadXrayBadge: null,
          outreachDraft:
            'Hi Gregory — saw that Lincoln Commercial Real Estate just assumed management of Highland Park Executive Center and the 140-unit mixed-use commons. Usually during the first 30 days of a management transition, inherited exterior maintenance, pressure washing, and day-porter vendors get re-evaluated to bring the asset up to Lincoln’s standards. We provide consolidated commercial property maintenance with photo-verified morning checklists so your property managers never have to chase vendors. Do you have 10 minutes Thursday to compare our service rates against your inherited contracts?'
        },
        {
          id: 'card-03',
          slotLabel: 'CARD 03 • HIGH-VALUE ESTATE PERMIT + CAD X-RAY',
          triggerBadge: 'CUSTOM ADDITION / BUILD PERMIT + CAD PARCEL MATCH',
          sourceBadge: 'COUNTY CAD TAX ROLL X-RAY • PARCEL #CAD-64920-B',
          projectTitle: '920 Meadowbrook Reserve — 4,120 Sq Ft Estate Remodel & Private Compound',
          decisionMaker: 'Arthur & Victoria Pendelton • Verified Property Owners (CAD Deed Match)',
          verifiedMeta: '1.4-Acre Gated Parcel • High-Net-Worth Estate Maintenance Match',
          cadXrayBadge: 'Assessed Value: $940,000 • 4,120 Sq Ft • 1.4 Acres • Verified Owner Match',
          outreachDraft:
            'Hi Arthur — noticed the city permit issued this week as your 4,120 sq ft Meadowbrook Reserve remodel wraps up on your 1.4-acre property. After major estate renovations, construction dust and exterior runoff often leave architectural glass, stone terraces, and mature landscaping needing white-glove restoration. Our private estate maintenance team looks after 18 properties in Meadowbrook Reserve on a recurring monthly schedule. Would you like us to perform a complimentary post-construction exterior assessment before you host your first gathering?'
        }
      ],
      lockedRows: [
        {
          title: '[LOCKED] $410,000 Commercial Shell Permit — Filed Yesterday 4:15 PM',
          redactedMeta: 'Tenant: Apex BioLabs • 34,000 Sq Ft Post-Construction & Recurring Janitorial',
          tierTag: 'TIER 2+ REQUIRED'
        },
        {
          title: '[LOCKED] Regional Property Mgr — 4 Plazas Seeking Subs',
          redactedMeta: 'Sr. PM: Amanda Cole • 4 Retail Plazas Soliciting Sweeping & Porter Bids',
          tierTag: 'FULL QUEUE LOCKED'
        },
        {
          title: '[LOCKED] 3,900 Sq Ft Custom Build — CAD Verified Owner',
          redactedMeta: 'CAD Val: $1,180,000 • 2.1 Acres • Full-Year Estate Grounds Contract',
          tierTag: 'TIER 3 CAD X-RAY'
        }
      ]
    }
  };

  /* ==========================================================================
     2. PINNED 300VH SCROLL-SCRUBBED CANVAS HERO CONTROLLER
     - Top-level MOBILE_SCROLL_SCRUB flag honored
     - requestAnimationFrame lerp (current += (target - current) * 0.08)
     - Sub-frame alpha crossfading (Math.floor + Math.ceil blending)
     ========================================================================== */
  const heroTrack = document.getElementById('hero-track');
  const heroSticky = document.getElementById('hero-sticky');
  const canvas = document.getElementById('recon-hero-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const stagePanels = [
    document.getElementById('hero-stage-0'),
    document.getElementById('hero-stage-1'),
    document.getElementById('hero-stage-2')
  ];
  const stageTabs = Array.from(document.querySelectorAll('[data-stage-jump]'));
  const heroProgressBar = document.getElementById('hero-progress-bar');
  const heroTelemetryClock = document.getElementById('hero-telemetry-clock');
  const hudCardStatus = document.getElementById('hud-card-status');
  const hudCardDot = document.getElementById('hud-card-dot');
  const hudCardTime = document.getElementById('hud-card-time');

  let target = 0.0;
  let current = 0.0;
  let activeStageIndex = 0;
  let isMobileStaticActive = false;
  let canvasWidth = 1440;
  let canvasHeight = 900;
  let dpr = 1;

  // Offscreen buffers for the 3 procedural visual states so Math.floor + Math.ceil
  // sub-frame alpha crossfading blends razor-sharp tactical layers at 60fps
  const stateBuffers = [
    document.createElement('canvas'),
    document.createElement('canvas'),
    document.createElement('canvas')
  ];

  // Deterministic suburban & commercial parcel nodes for the tactical map
  const PARCEL_NODES = [
    { id: 'CAD-90418', x: 0.58, y: 0.28, w: 0.11, h: 0.12, val: '$940K CAD', type: 'cad', prime: true },
    { id: 'BP-08941', x: 0.73, y: 0.44, w: 0.13, h: 0.14, val: '$240K PERMIT', type: 'permit', prime: true },
    { id: 'B2B-140U', x: 0.54, y: 0.62, w: 0.14, h: 0.13, val: '140-UNIT B2B', type: 'b2b', prime: true },
    { id: 'LOT-104B', x: 0.18, y: 0.22, w: 0.09, h: 0.10, val: '$410K SHELL', type: 'dormant', prime: false },
    { id: 'LOT-209A', x: 0.34, y: 0.20, w: 0.10, h: 0.11, val: 'PARCEL #209', type: 'dormant', prime: false },
    { id: 'LOT-312C', x: 0.24, y: 0.48, w: 0.11, h: 0.12, val: 'ACCELA NODE', type: 'dormant', prime: false },
    { id: 'LOT-418D', x: 0.39, y: 0.70, w: 0.10, h: 0.11, val: 'CAD TAX ROLL', type: 'dormant', prime: false },
    { id: 'LOT-522E', x: 0.82, y: 0.22, w: 0.10, h: 0.11, val: 'ENERGOV PORTAL', type: 'dormant', prime: false },
    { id: 'LOT-619F', x: 0.77, y: 0.72, w: 0.11, h: 0.11, val: '3,900 SF BUILD', type: 'dormant', prime: false }
  ];

  function buildStateBuffers(w, h) {
    stateBuffers.forEach((buf, stateIdx) => {
      buf.width = w * dpr;
      buf.height = h * dpr;
      const bctx = buf.getContext('2d');
      bctx.save();
      bctx.scale(dpr, dpr);

      // Base Obsidian Canvas Fill
      bctx.fillStyle = '#07090E';
      bctx.fillRect(0, 0, w, h);

      // Ambient radial glow specific to each state
      const grad = bctx.createRadialGradient(
        w * 0.65,
        h * 0.48,
        20,
        w * 0.65,
        h * 0.48,
        Math.max(w, h) * 0.65
      );
      if (stateIdx === 0) {
        grad.addColorStop(0, 'rgba(30, 41, 59, 0.42)');
        grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.18)');
        grad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      } else if (stateIdx === 1) {
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.20)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.06)');
        grad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      } else {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.07)');
        grad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      }
      bctx.fillStyle = grad;
      bctx.fillRect(0, 0, w, h);

      // Suburban GIS / Blueprint Grid Lines
      const gridStep = 56;
      bctx.lineWidth = 1;
      bctx.strokeStyle =
        stateIdx === 0
          ? 'rgba(148, 163, 184, 0.07)'
          : stateIdx === 1
          ? 'rgba(245, 158, 11, 0.08)'
          : 'rgba(16, 185, 129, 0.08)';

      for (let x = 0; x < w; x += gridStep) {
        bctx.beginPath();
        bctx.moveTo(x, 0);
        bctx.lineTo(x, h);
        bctx.stroke();
      }
      for (let y = 0; y < h; y += gridStep) {
        bctx.beginPath();
        bctx.moveTo(0, y);
        bctx.lineTo(w, y);
        bctx.stroke();
      }

      // Arterial Roads / Subdivision Vectors
      bctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      bctx.lineWidth = 1.5;
      bctx.beginPath();
      bctx.moveTo(w * 0.1, h * 0.38);
      bctx.lineTo(w * 0.92, h * 0.38);
      bctx.moveTo(w * 0.48, h * 0.08);
      bctx.lineTo(w * 0.48, h * 0.92);
      bctx.stroke();

      // State 2 & 3 Radar Rings centered on East Territory Cluster
      const radarCx = w * 0.65;
      const radarCy = h * 0.48;
      const radii = [110, 210, 320, 440];
      radii.forEach((r) => {
        bctx.beginPath();
        bctx.arc(radarCx, radarCy, r, 0, Math.PI * 2);
        if (stateIdx === 0) {
          bctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
        } else if (stateIdx === 1) {
          bctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        } else {
          bctx.strokeStyle = 'rgba(16, 185, 129, 0.24)';
        }
        bctx.lineWidth = 1;
        bctx.stroke();
      });

      // Draw Parcel Polygons & Nodes for each state
      PARCEL_NODES.forEach((p) => {
        const px = p.x * w;
        const py = p.y * h;
        const pw = p.w * w;
        const ph = p.h * h;

        if (stateIdx === 0) {
          // State 1 (0.00 - 0.33): Subtle suburban parcel map grid with scattered dormant permit nodes
          bctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
          bctx.strokeStyle = p.prime ? 'rgba(245, 158, 11, 0.28)' : 'rgba(148, 163, 184, 0.18)';
          bctx.lineWidth = 1;
          bctx.fillRect(px, py, pw, ph);
          bctx.strokeRect(px, py, pw, ph);

          bctx.fillStyle = p.prime ? '#F59E0B' : '#64748B';
          bctx.beginPath();
          bctx.arc(px + 12, py + 12, 3.5, 0, Math.PI * 2);
          bctx.fill();
        } else if (stateIdx === 1) {
          // State 2 (0.34 - 0.66): Amber radar sweep connecting municipal portals, CAD polygons & commercial properties
          bctx.fillStyle = p.prime ? 'rgba(245, 158, 11, 0.14)' : 'rgba(15, 23, 42, 0.55)';
          bctx.strokeStyle = p.prime ? 'rgba(245, 158, 11, 0.75)' : 'rgba(245, 158, 11, 0.28)';
          bctx.lineWidth = p.prime ? 1.75 : 1;
          bctx.fillRect(px, py, pw, ph);
          bctx.strokeRect(px, py, pw, ph);

          // Data extraction lines to radar hub
          bctx.save();
          bctx.setLineDash([5, 4]);
          bctx.strokeStyle = p.prime ? 'rgba(245, 158, 11, 0.65)' : 'rgba(245, 158, 11, 0.22)';
          bctx.beginPath();
          bctx.moveTo(px + pw / 2, py + ph / 2);
          bctx.lineTo(radarCx, radarCy);
          bctx.stroke();
          bctx.restore();
        } else {
          // State 3 (0.67 - 1.00): Emerald lock-on state converging into the 7:00 AM Silver Platter delivery feed
          bctx.fillStyle = p.prime ? 'rgba(16, 185, 129, 0.18)' : 'rgba(15, 23, 42, 0.35)';
          bctx.strokeStyle = p.prime ? 'rgba(16, 185, 129, 0.90)' : 'rgba(148, 163, 184, 0.14)';
          bctx.lineWidth = p.prime ? 2 : 1;
          bctx.fillRect(px, py, pw, ph);
          bctx.strokeRect(px, py, pw, ph);

          if (p.prime) {
            // Converging Emerald Lock-On Vectors into 7:00 AM Silver Platter Feed
            bctx.strokeStyle = 'rgba(16, 185, 129, 0.78)';
            bctx.lineWidth = 1.8;
            bctx.beginPath();
            bctx.moveTo(px + pw / 2, py + ph / 2);
            bctx.lineTo(w * 0.76, h * 0.48);
            bctx.stroke();
          }
        }

        // Parcel Telemetry Labels
        bctx.font = '600 10px "JetBrains Mono", monospace';
        bctx.fillStyle =
          stateIdx === 0
            ? 'rgba(148, 163, 184, 0.65)'
            : stateIdx === 1
            ? 'rgba(252, 211, 77, 0.9)'
            : p.prime
            ? 'rgba(110, 231, 183, 0.98)'
            : 'rgba(148, 163, 184, 0.45)';
        bctx.fillText(p.id + ' • ' + p.val, px + 8, py + ph - 10);
      });

      bctx.restore();
    });
  }

  function resizeHeroCanvas() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    buildStateBuffers(canvasWidth, canvasHeight);
  }

  function updateStageHUD(progress) {
    // Stage 1: 0.00 - 0.33 | Stage 2: 0.34 - 0.66 | Stage 3: 0.67 - 1.00
    let nextStage = 0;
    if (progress >= 0.67) {
      nextStage = 2;
    } else if (progress >= 0.34) {
      nextStage = 1;
    }

    if (heroProgressBar) {
      const pct = Math.max(8, Math.min(100, Math.round(progress * 100)));
      heroProgressBar.style.width = pct + '%';
    }

    if (nextStage !== activeStageIndex) {
      activeStageIndex = nextStage;
      stagePanels.forEach((panel, idx) => {
        if (!panel) return;
        if (idx === activeStageIndex) {
          panel.classList.add('is-active');
        } else {
          panel.classList.remove('is-active');
        }
      });

      stageTabs.forEach((tab, idx) => {
        const isCurrent = idx === activeStageIndex;
        tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
        if (isCurrent) {
          tab.className =
            'hero-stage-tab px-3 py-1.5 rounded-lg text-[11px] font-mono-telemetry border transition-all ' +
            (idx === 2
              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
              : 'bg-amber-500/20 border-amber-400/60 text-amber-200');
        } else {
          tab.className =
            'hero-stage-tab px-3 py-1.5 rounded-lg text-[11px] font-mono-telemetry border transition-all bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200';
        }
      });

      if (heroTelemetryClock) {
        if (activeStageIndex === 0) {
          heroTelemetryClock.textContent = '07:00 AM COFFEE HOOK • TERRITORY READY';
          heroTelemetryClock.className = 'font-mono-telemetry text-xs text-amber-400';
        } else if (activeStageIndex === 1) {
          heroTelemetryClock.textContent = '02:14:08 AM CST • NIGHT SHIFT RECON ACTIVE';
          heroTelemetryClock.className = 'font-mono-telemetry text-xs text-amber-300';
        } else {
          heroTelemetryClock.textContent = '07:00:00 AM CST • SILVER PLATTER QUEUE READY';
          heroTelemetryClock.className = 'font-mono-telemetry text-xs text-emerald-400';
        }
      }

      if (hudCardStatus && hudCardDot && hudCardTime) {
        if (activeStageIndex === 0) {
          hudCardStatus.textContent = 'RECON SCOUT • DORMANT PARCEL INDEX';
          hudCardStatus.className = 'font-mono-telemetry text-xs text-amber-300';
          hudCardDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 dot-pulse-amber';
          hudCardTime.textContent = 'STAGE 01 / 03';
        } else if (activeStageIndex === 1) {
          hudCardStatus.textContent = '02:14:08 AM • EXTRACTING PERMITS & CAD';
          hudCardStatus.className = 'font-mono-telemetry text-xs text-amber-300';
          hudCardDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 dot-pulse-amber';
          hudCardTime.textContent = 'STAGE 02 / 03';
        } else {
          hudCardStatus.textContent = '07:00:00 AM • 3 SILVER PLATTER CARDS LOCKED';
          hudCardStatus.className = 'font-mono-telemetry text-xs text-emerald-300';
          hudCardDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 dot-pulse-emerald';
          hudCardTime.textContent = 'STAGE 03 / 03';
        }
      }
    }
  }

  function renderHeroCanvasFrame(progress, timestamp) {
    if (!ctx || !canvas) return;

    // Map normalized progress (0.0 -> 1.0) across the 3 visual states (0.0 -> 2.0)
    const stateFloat = Math.max(0, Math.min(2, progress * 2));
    const lowerIndex = Math.floor(stateFloat);
    const upperIndex = Math.min(2, Math.ceil(stateFloat));
    const subFrameAlpha = stateFloat % 1;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sub-Frame Blending Engine: Math.floor at globalAlpha = 1 + Math.ceil at globalAlpha = stateFloat % 1
    ctx.globalAlpha = 1;
    ctx.drawImage(stateBuffers[lowerIndex], 0, 0);

    if (upperIndex !== lowerIndex && subFrameAlpha > 0) {
      ctx.globalAlpha = subFrameAlpha;
      ctx.drawImage(stateBuffers[upperIndex], 0, 0);
    }

    // Dynamic Procedural Telemetry Overlay (Sweep & Lock-On Reticles)
    ctx.globalAlpha = 1;
    ctx.scale(dpr, dpr);

    const radarCx = canvasWidth * 0.65;
    const radarCy = canvasHeight * 0.48;
    const sweepAngle = (timestamp * 0.0012 + progress * Math.PI * 3) % (Math.PI * 2);

    // State 2 Amber Radar Sweep Beam (0.20 -> 0.80)
    const amberSweepIntensity =
      progress < 0.25
        ? 0.25
        : progress <= 0.68
        ? 0.9
        : Math.max(0.15, 1 - (progress - 0.68) * 2.5);

    ctx.save();
    ctx.translate(radarCx, radarCy);
    ctx.rotate(sweepAngle);
    const beamGrad = ctx.createLinearGradient(0, 0, 340, 0);
    if (progress >= 0.67) {
      beamGrad.addColorStop(0, `rgba(16, 185, 129, ${0.45 * amberSweepIntensity})`);
      beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    } else {
      beamGrad.addColorStop(0, `rgba(245, 158, 11, ${0.48 * amberSweepIntensity})`);
      beamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    }
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 340, -0.32, 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Prime Parcel Target Lock Reticles
    PARCEL_NODES.forEach((p) => {
      if (!p.prime) return;
      const cx = (p.x + p.w / 2) * canvasWidth;
      const cy = (p.y + p.h / 2) * canvasHeight;

      ctx.save();
      ctx.strokeStyle =
        progress >= 0.67
          ? 'rgba(16, 185, 129, 0.92)'
          : progress >= 0.34
          ? 'rgba(245, 158, 11, 0.85)'
          : 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.6;
      const pulseRadius = 14 + Math.sin(timestamp * 0.004 + p.x * 10) * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }

  function updateScrollTarget() {
    if (!heroTrack || !heroSticky) return;

    const commandNavbar = document.getElementById('command-navbar');
    if (commandNavbar) {
      if (window.scrollY > 24) {
        commandNavbar.classList.add('is-scrolled');
      } else {
        commandNavbar.classList.remove('is-scrolled');
      }
    }

    if (isMobileStaticActive) {
      heroSticky.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const trackRect = heroTrack.getBoundingClientRect();
    const maxScroll = Math.max(1, heroTrack.offsetHeight - window.innerHeight);
    const scrolledInTrack = Math.min(Math.max(0, -trackRect.top), maxScroll);
    target = Math.max(0, Math.min(1, scrolledInTrack / maxScroll));

    // Reinforce sticky viewport pinning across the 300vh track when html, body { overflow-x: hidden } is set
    if (heroSticky.offsetTop === 0 && trackRect.top < 0) {
      heroSticky.style.transform = `translate3d(0, ${scrolledInTrack}px, 0)`;
    } else {
      heroSticky.style.transform = 'translate3d(0, 0, 0)';
    }
  }

  function syncViewportMode() {
    const isSmallViewport = window.innerWidth <= 768;
    isMobileStaticActive = isSmallViewport && !MOBILE_SCROLL_SCRUB;

    if (heroTrack) {
      if (isMobileStaticActive) {
        heroTrack.classList.add('mobile-static-mode');
      } else {
        heroTrack.classList.remove('mobile-static-mode');
      }
    }

    resizeHeroCanvas();

    if (isMobileStaticActive) {
      // Static crisp composite backdrop on viewports <= 768px when MOBILE_SCROLL_SCRUB === false
      renderHeroCanvasFrame(0.48, performance.now());
    } else {
      updateScrollTarget();
    }
  }

  function animationLoop(timestamp) {
    if (!isMobileStaticActive) {
      updateScrollTarget();
      // Linear interpolation: current += (target - current) * 0.08
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 0.0005) {
        current = target;
      }
      updateStageHUD(current);
      renderHeroCanvasFrame(current, timestamp || performance.now());
    }
    window.requestAnimationFrame(animationLoop);
  }

  // Smooth-scroll handler for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Stage Switcher Tabs (Click to Jump/Scroll to Stage 01, 02, or 03)
  stageTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const stageIdx = parseInt(tab.getAttribute('data-stage-jump') || '0', 10);
      const stageTargets = [0.08, 0.50, 0.86];
      const desiredProgress = stageTargets[stageIdx] ?? 0;

      if (isMobileStaticActive) {
        target = desiredProgress;
        current = desiredProgress;
        updateStageHUD(desiredProgress);
        renderHeroCanvasFrame(desiredProgress, performance.now());
      } else if (heroTrack) {
        const maxScroll = Math.max(1, heroTrack.offsetHeight - window.innerHeight);
        const scrollDest = desiredProgress * maxScroll;
        window.scrollTo({ top: scrollDest, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: scrollDest, behavior: 'smooth' });
        document.body.scrollTo({ top: scrollDest, behavior: 'smooth' });
      }
    });
  });

  window.addEventListener(
    'scroll',
    () => {
      if (!isMobileStaticActive) {
        updateScrollTarget();
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', syncViewportMode);

  /* ==========================================================================
     3. SECTION 4: LIVE 7:00 AM "SILVER PLATTER" QUEUE SIMULATOR + LOCKED VAULT
     ========================================================================== */
  let activeTradeKey = 'concrete';
  // Track state of each card per trade: 'ready' | 'sent' | 'skipped'
  const cardStates = {};
  const customDraftEdits = {};

  const simulatorCardsGrid = document.getElementById('simulator-cards-grid');
  const lockedVaultRowsEl = document.getElementById('locked-vault-rows');
  const dealsFiredCounterEl = document.getElementById('deals-fired-counter');
  const activeTradeLabelEl = document.getElementById('simulator-active-trade-label');
  const resetAllSimulatorBtn = document.getElementById('reset-all-simulator-btn');
  const simulatorTradePills = Array.from(document.querySelectorAll('#simulator-trade-pills [data-trade-key]'));

  function getCardStateKey(tradeKey, cardId) {
    return `${tradeKey}__${cardId}`;
  }

  function countFiredDealsForCurrentTrade() {
    const preset = TRADE_PRESETS[activeTradeKey];
    if (!preset) return 0;
    return preset.cards.reduce((acc, card) => {
      const state = cardStates[getCardStateKey(activeTradeKey, card.id)] || 'ready';
      return acc + (state === 'sent' ? 1 : 0);
    }, 0);
  }

  function updateDealsFiredHeader() {
    const firedCount = countFiredDealsForCurrentTrade();
    if (dealsFiredCounterEl) {
      dealsFiredCounterEl.textContent = `Deals Fired This Morning: ${firedCount}/3`;
    }
    const preset = TRADE_PRESETS[activeTradeKey];
    if (activeTradeLabelEl && preset) {
      activeTradeLabelEl.textContent = `Active Trade Preset: ${preset.label} • 3 Free Test-Drive Cards Unlocked`;
    }
  }

  function renderLockedVaultRows() {
    const preset = TRADE_PRESETS[activeTradeKey];
    if (!lockedVaultRowsEl || !preset) return;

    lockedVaultRowsEl.innerHTML = preset.lockedRows
      .map(
        (row) => `
        <div class="locked-vault-row rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/40 font-mono-telemetry text-[11px] text-amber-300 font-bold">[LOCKED]</span>
            <span class="font-semibold text-sm sm:text-base text-white">${row.title}</span>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono-telemetry">
            <span class="redacted-blur text-slate-300">${row.redactedMeta}</span>
            <span class="text-amber-400">${row.tierTag}</span>
          </div>
        </div>
      `
      )
      .join('');
  }

  function renderSimulatorCards() {
    const preset = TRADE_PRESETS[activeTradeKey];
    if (!simulatorCardsGrid || !preset) return;

    simulatorCardsGrid.innerHTML = preset.cards
      .map((card, idx) => {
        const stateKey = getCardStateKey(activeTradeKey, card.id);
        const state = cardStates[stateKey] || 'ready';
        const currentDraft = customDraftEdits[stateKey] ?? card.outreachDraft;

        if (state === 'sent') {
          return `
            <article class="glass-emerald-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300" data-card-id="${card.id}">
              <div>
                <div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-emerald-400/30">
                  <span class="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/60 font-mono-telemetry text-xs text-emerald-200 font-bold">
                    SENT IN 3.2 SECONDS ✓
                  </span>
                  <span class="font-mono-telemetry text-[11px] text-emerald-300">07:01:${12 + idx * 14} AM CST</span>
                </div>

                <div class="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center mb-4">
                  <svg class="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 class="font-display font-bold text-xl text-white mb-2">
                  Dispatched to ${card.decisionMaker.split('•')[0].trim()}
                </h3>

                <p class="text-emerald-100 text-sm leading-relaxed mb-4 font-medium">
                  "Boom. In real life, that message just landed in their inbox from your address while your competitors are still asleep."
                </p>

                <div class="p-3.5 rounded-xl bg-slate-950/75 border border-emerald-500/30 mb-4">
                  <div class="font-mono-telemetry text-[10px] text-emerald-400 mb-1">DISPATCHED MESSAGE PREVIEW:</div>
                  <p class="text-xs text-slate-300 line-clamp-3 italic">${currentDraft}</p>
                </div>
              </div>

              <div class="pt-3 border-t border-emerald-500/25 flex items-center justify-between">
                <span class="font-mono-telemetry text-[11px] text-emerald-300">1-CLICK HUMAN APPROVAL VERIFIED</span>
                <button type="button" data-action="reset-card" data-card-id="${card.id}" class="text-xs font-mono-telemetry text-white hover:text-amber-300 underline cursor-pointer">
                  Reset Card
                </button>
              </div>
            </article>
          `;
        }

        if (state === 'skipped') {
          return `
            <article class="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between opacity-75 border border-white/10" data-card-id="${card.id}">
              <div>
                <div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
                  <span class="px-3 py-1 rounded-full bg-slate-800 border border-white/15 font-mono-telemetry text-xs text-slate-300">
                    SKIPPED FOR TODAY
                  </span>
                  <span class="font-mono-telemetry text-[11px] text-slate-400">${card.slotLabel}</span>
                </div>
                <h3 class="font-display font-bold text-lg text-slate-300 mb-2">${card.projectTitle}</h3>
                <p class="text-xs text-slate-400 mb-4">
                  Card archived from this morning's queue. Your Digital Scout learns your project preferences automatically.
                </p>
              </div>
              <div class="pt-3 border-t border-white/10 flex items-center justify-between">
                <span class="font-mono-telemetry text-[11px] text-slate-400">ARCHIVED</span>
                <button type="button" data-action="reset-card" data-card-id="${card.id}" class="text-xs font-mono-telemetry text-amber-300 hover:text-amber-200 underline cursor-pointer">
                  Reset Card
                </button>
              </div>
            </article>
          `;
        }

        // Default 'ready' state
        return `
          <article class="glass-card glass-card-interactive rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-white/15" data-card-id="${card.id}">
            <div>
              <!-- Top Slot & Portal Source Header -->
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="font-mono-telemetry text-[11px] text-slate-400">${card.slotLabel}</span>
                <span class="px-2.5 py-0.5 rounded bg-slate-900/90 border border-white/10 font-mono-telemetry text-[10px] text-emerald-400">
                  UNLOCKED #0${idx + 1}
                </span>
              </div>

              <!-- Trigger Badge -->
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 font-mono-telemetry text-[11px] text-amber-300 font-bold mb-2.5">
                <span>⚡</span>
                <span>${card.triggerBadge}</span>
              </div>

              <!-- Portal Source Badge -->
              <div class="font-mono-telemetry text-[11px] text-slate-400 mb-2">
                SOURCE: <span class="text-slate-200">${card.sourceBadge}</span>
              </div>

              <!-- Project Address & Scope -->
              <h3 class="font-display font-bold text-lg sm:text-xl text-white leading-snug mb-3">
                ${card.projectTitle}
              </h3>

              ${
                card.cadXrayBadge
                  ? `
                <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 mb-3">
                  <div class="font-mono-telemetry text-[10px] text-emerald-400 mb-0.5">CAD PROPERTY X-RAY MATCH:</div>
                  <div class="text-xs font-semibold text-emerald-100">${card.cadXrayBadge}</div>
                </div>
              `
                  : ''
              }

              <!-- Decision-Maker Box -->
              <div class="p-3 rounded-xl bg-slate-950/75 border border-white/10 mb-4">
                <div class="font-mono-telemetry text-[10px] text-amber-300 mb-0.5">VERIFIED DECISION-MAKER:</div>
                <div class="text-xs sm:text-sm font-bold text-white">${card.decisionMaker}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">${card.verifiedMeta}</div>
              </div>

              <!-- Editable 4-Sentence Outreach Textarea -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-1.5">
                  <label for="textarea-${card.id}" class="font-mono-telemetry text-[10px] text-slate-300">
                    PRE-WRITTEN 4-SENTENCE OUTREACH (EDITABLE):
                  </label>
                  <span id="edit-hint-${card.id}" class="font-mono-telemetry text-[10px] text-emerald-400">
                    READY IN YOUR VOICE
                  </span>
                </div>
                <textarea
                  id="textarea-${card.id}"
                  rows="5"
                  data-textarea-card="${card.id}"
                  class="outreach-textarea"
                >${currentDraft}</textarea>
              </div>
            </div>

            <!-- Interactive Card Controls -->
            <div class="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-action="approve-send"
                data-card-id="${card.id}"
                class="btn-emerald-primary flex-1 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold text-center cursor-pointer"
              >
                [ ✓ Approve &amp; Send ]
              </button>
              <button
                type="button"
                data-action="quick-edit"
                data-card-id="${card.id}"
                class="btn-glass-secondary py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer"
              >
                [ ✎ Quick Edit ]
              </button>
              <button
                type="button"
                data-action="skip-card"
                data-card-id="${card.id}"
                class="py-2.5 px-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                [ Skip ]
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    updateDealsFiredHeader();
  }

  // Event delegation for simulator card controls & live textarea edits
  if (simulatorCardsGrid) {
    simulatorCardsGrid.addEventListener('input', (e) => {
      const targetEl = e.target;
      if (targetEl && targetEl.matches('[data-textarea-card]')) {
        const cardId = targetEl.getAttribute('data-textarea-card');
        customDraftEdits[getCardStateKey(activeTradeKey, cardId)] = targetEl.value;
      }
    });

    simulatorCardsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const cardId = btn.getAttribute('data-card-id');
      if (!cardId) return;

      const stateKey = getCardStateKey(activeTradeKey, cardId);

      if (action === 'approve-send') {
        const textarea = document.getElementById(`textarea-${cardId}`);
        if (textarea) {
          customDraftEdits[stateKey] = textarea.value;
        }
        cardStates[stateKey] = 'sent';
        renderSimulatorCards();
      } else if (action === 'quick-edit') {
        const textarea = document.getElementById(`textarea-${cardId}`);
        const editHint = document.getElementById(`edit-hint-${cardId}`);
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        if (editHint) {
          editHint.textContent = 'EDITING LIVE — TAP APPROVE WHEN READY';
          editHint.className = 'font-mono-telemetry text-[10px] text-amber-300';
        }
      } else if (action === 'skip-card') {
        cardStates[stateKey] = 'skipped';
        renderSimulatorCards();
      } else if (action === 'reset-card') {
        cardStates[stateKey] = 'ready';
        renderSimulatorCards();
      }
    });
  }

  // Trade Preset Selector Pills
  simulatorTradePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const nextKey = pill.getAttribute('data-trade-key');
      if (!nextKey || !TRADE_PRESETS[nextKey]) return;

      activeTradeKey = nextKey;
      simulatorTradePills.forEach((p) => {
        const isSelected = p.getAttribute('data-trade-key') === activeTradeKey;
        p.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        p.classList.toggle('is-active', isSelected);
      });

      renderSimulatorCards();
      renderLockedVaultRows();

      // Also sync the Territory Activation Vault trade selection
      const vaultMatch = TRADE_PRESETS[activeTradeKey].vaultTradeMatch;
      if (vaultMatch) {
        selectVaultTrade(vaultMatch);
      }
    });
  });

  if (resetAllSimulatorBtn) {
    resetAllSimulatorBtn.addEventListener('click', () => {
      const preset = TRADE_PRESETS[activeTradeKey];
      if (!preset) return;
      preset.cards.forEach((card) => {
        const stateKey = getCardStateKey(activeTradeKey, card.id);
        cardStates[stateKey] = 'ready';
        delete customDraftEdits[stateKey];
      });
      renderSimulatorCards();
    });
  }

  /* ==========================================================================
     4. SECTION 6: INTERACTIVE PRICING MATRIX WITH "OFFENSE + DEFENSE"
        SMART SITE EQUITY TOGGLE
     ========================================================================== */
  const toggleStandaloneBtn = document.getElementById('toggle-mode-standalone');
  const toggleBundleBtn = document.getElementById('toggle-mode-bundle');
  const priceTier1El = document.getElementById('price-tier-1');
  const priceTier2El = document.getElementById('price-tier-2');
  const priceTier3El = document.getElementById('price-tier-3');
  const priceSub1El = document.getElementById('price-sub-tier-1');
  const priceSub2El = document.getElementById('price-sub-tier-2');
  const priceSub3El = document.getElementById('price-sub-tier-3');
  const bundleSavingsBadges = Array.from(document.querySelectorAll('.bundle-savings-badge'));
  const smartSiteBonusPanels = Array.from(document.querySelectorAll('.smart-site-bonus-panel'));
  const vaultSmartSiteCheckbox = document.getElementById('vault-smart-site-checkbox');

  let currentPricingMode = 'standalone'; // 'standalone' | 'bundle'

  function setPricingMode(mode) {
    currentPricingMode = mode === 'bundle' ? 'bundle' : 'standalone';
    const isBundle = currentPricingMode === 'bundle';

    if (toggleStandaloneBtn && toggleBundleBtn) {
      toggleStandaloneBtn.setAttribute('aria-pressed', (!isBundle).toString());
      toggleBundleBtn.setAttribute('aria-pressed', isBundle.toString());

      if (isBundle) {
        toggleStandaloneBtn.classList.remove('is-active-standalone');
        toggleStandaloneBtn.classList.add('text-slate-300');
        toggleBundleBtn.classList.add('is-active-bundle');
        toggleBundleBtn.classList.remove('text-slate-300');
      } else {
        toggleStandaloneBtn.classList.add('is-active-standalone');
        toggleStandaloneBtn.classList.remove('text-slate-300');
        toggleBundleBtn.classList.remove('is-active-bundle');
        toggleBundleBtn.classList.add('text-slate-300');
      }
    }

    if (priceTier1El) priceTier1El.textContent = isBundle ? '$547' : '$297';
    if (priceTier2El) priceTier2El.textContent = isBundle ? '$847' : '$597';
    if (priceTier3El) priceTier3El.textContent = isBundle ? '$1,147' : '$897';

    if (priceSub1El) {
      priceSub1El.textContent = isBundle
        ? 'INCLUDES SMART SITE (+$200/MO EQUITY CREDIT)'
        : 'STARTS WITH 7-DAY FREE TEST DRIVE (3 DEALS/DAY)';
    }
    if (priceSub2El) {
      priceSub2El.textContent = isBundle
        ? 'INCLUDES SMART SITE (+$200/MO EQUITY CREDIT)'
        : 'STARTS WITH 7-DAY FREE TEST DRIVE (3 DEALS/DAY)';
    }
    if (priceSub3El) {
      priceSub3El.textContent = isBundle
        ? '100% ZIP EXCLUSIVE + SMART SITE EQUITY BUNDLE'
        : 'LOCKS OUT DIRECT COMPETITORS IN YOUR ZIP';
    }

    bundleSavingsBadges.forEach((badge) => {
      badge.classList.toggle('hidden', !isBundle);
    });

    smartSiteBonusPanels.forEach((panel) => {
      panel.classList.toggle('hidden', !isBundle);
    });

    if (vaultSmartSiteCheckbox) {
      vaultSmartSiteCheckbox.checked = isBundle;
    }
  }

  if (toggleStandaloneBtn) {
    toggleStandaloneBtn.addEventListener('click', () => setPricingMode('standalone'));
  }
  if (toggleBundleBtn) {
    toggleBundleBtn.addEventListener('click', () => setPricingMode('bundle'));
  }

  // Nav links with data-activate-bundle="true" automatically switch to Mode B when clicked
  document.querySelectorAll('[data-activate-bundle="true"]').forEach((link) => {
    link.addEventListener('click', () => {
      setPricingMode('bundle');
    });
  });

  /* ==========================================================================
     5. SECTION 7: FRICTIONLESS SINGLE-CARD TERRITORY ACTIVATION VAULT
     ========================================================================== */
  let selectedVaultTrade = 'Commercial Concrete';
  let selectedVaultTier = 'Tier 2: Commercial Permits';
  let countdownInterval = null;

  const vaultTradeButtons = Array.from(document.querySelectorAll('#vault-trade-pills [data-vault-trade]'));
  const vaultTierButtons = Array.from(document.querySelectorAll('#vault-tier-pills [data-vault-tier]'));
  const pricingTierCtas = Array.from(document.querySelectorAll('.pricing-tier-cta[data-select-tier]'));
  const activationForm = document.getElementById('territory-activation-form');
  const vaultFormView = document.getElementById('vault-form-view');
  const vaultConfirmationView = document.getElementById('vault-confirmation-view');
  const vaultResetBtn = document.getElementById('vault-reset-btn');

  const confirmTradeVal = document.getElementById('confirm-trade-val');
  const confirmZipVal = document.getElementById('confirm-zip-val');
  const confirmTierVal = document.getElementById('confirm-tier-val');
  const confirmContactVal = document.getElementById('confirm-contact-val');
  const sevenAmCountdownEl = document.getElementById('seven-am-countdown');

  function selectVaultTrade(tradeName) {
    selectedVaultTrade = tradeName;
    vaultTradeButtons.forEach((btn) => {
      const match = btn.getAttribute('data-vault-trade') === tradeName;
      btn.classList.toggle('is-selected', match);
    });
  }

  function selectVaultTier(tierName) {
    selectedVaultTier = tierName;
    vaultTierButtons.forEach((btn) => {
      const match = btn.getAttribute('data-vault-tier') === tierName;
      btn.classList.toggle('is-selected', match);
    });
  }

  vaultTradeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-vault-trade');
      if (val) selectVaultTrade(val);
    });
  });

  vaultTierButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-vault-tier');
      if (val) selectVaultTier(val);
    });
  });

  pricingTierCtas.forEach((cta) => {
    cta.addEventListener('click', () => {
      const tier = cta.getAttribute('data-select-tier');
      if (tier) selectVaultTier(tier);
    });
  });

  function formatSecondsToHHMMSS(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
  }

  function getSecondsUntilNextSevenAM() {
    const now = new Date();
    const target7AM = new Date(now);
    target7AM.setHours(7, 0, 0, 0);
    if (now >= target7AM) {
      target7AM.setDate(target7AM.getDate() + 1);
    }
    return Math.max(1, Math.floor((target7AM.getTime() - now.getTime()) / 1000));
  }

  function startSevenAMCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    let remaining = getSecondsUntilNextSevenAM();
    if (sevenAmCountdownEl) {
      sevenAmCountdownEl.textContent = formatSecondsToHHMMSS(remaining);
    }
    countdownInterval = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      if (sevenAmCountdownEl) {
        sevenAmCountdownEl.textContent = formatSecondsToHHMMSS(remaining);
      }
    }, 1000);
  }

  if (activationForm) {
    activationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const zipInput = document.getElementById('vault-zip-input');
      const phoneInput = document.getElementById('vault-phone-input');
      const emailInput = document.getElementById('vault-email-input');

      const zipVal = zipInput && zipInput.value.trim() ? zipInput.value.trim() : '75024 (Local Metro Radius)';
      const phoneVal = phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : 'SMS Queue Armed';
      const emailVal = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'Primary Inbox Armed';
      const includeSmartSite = vaultSmartSiteCheckbox && vaultSmartSiteCheckbox.checked;

      if (confirmTradeVal) confirmTradeVal.textContent = selectedVaultTrade;
      if (confirmZipVal) confirmZipVal.textContent = zipVal;
      if (confirmTierVal) {
        confirmTierVal.textContent = includeSmartSite
          ? `${selectedVaultTier} + Smart Site Equity`
          : selectedVaultTier;
      }
      if (confirmContactVal) {
        confirmContactVal.textContent = `DISPATCH ARMED FOR: ${phoneVal.toUpperCase()} • ${emailVal.toUpperCase()}`;
      }

      if (vaultFormView && vaultConfirmationView) {
        vaultFormView.classList.add('hidden');
        vaultConfirmationView.classList.remove('hidden');
      }

      startSevenAMCountdown();
    });
  }

  if (vaultResetBtn) {
    vaultResetBtn.addEventListener('click', () => {
      if (vaultFormView && vaultConfirmationView) {
        vaultConfirmationView.classList.add('hidden');
        vaultFormView.classList.remove('hidden');
      }
    });
  }

  /* ==========================================================================
     6. MOBILE NAVIGATION DRAWER TOGGLE
     ========================================================================== */
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

  if (mobileNavToggle && mobileNavDrawer) {
    mobileNavToggle.addEventListener('click', () => {
      const isHidden = mobileNavDrawer.classList.contains('hidden');
      mobileNavDrawer.classList.toggle('hidden', !isHidden);
      mobileNavToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    document.querySelectorAll('.mobile-nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.add('hidden');
        mobileNavToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ==========================================================================
     7. INITIALIZE APPLICATION ON LOAD
     ========================================================================== */
  renderSimulatorCards();
  renderLockedVaultRows();
  syncViewportMode();
  window.requestAnimationFrame(animationLoop);
})();
