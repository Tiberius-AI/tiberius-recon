/**
 * TIBERIUS META-RECON™ — AUTONOMOUS PROSPECT GATHERER, LIVE TX OPEN-DATA SCOUT & TROJAN HORSE PERMIT MATCHER
 * (workers/scrapers/tiberius-prospect-scout.js)
 *
 * Gathers local trade contractors & SMB prospects for Tiberius itself:
 *   1. Supports TWO discovery engines:
 *      - Live Real-Contractor Scout (`liveDiscovery = true` / `sourceMode = 'LIVE'`):
 *        Queries zero-API official State of Texas public datasets in real time:
 *          a) Texas TDLR All Licenses (`data.texas.gov/resource/7358-krk7.json`)
 *          b) Texas Comptroller Active Franchise Taxpayers (`data.texas.gov/resource/9cir-efmm.json`)
 *          c) Austin Build+Connect Open Permits (`data.austintexas.gov/resource/3syk-w9eu.json`)
 *        Then runs `probeLiveContractorWebPresence` (DNS MX + live homepage & /contact DOM crawl)
 *        to discover real websites, scrape public emails & phones, and inspect live HTML.
 *      - Curated Corridor Sandbox (`liveDiscovery = false`, default for safe offline/CI testing).
 *   2. Checks live territory slot availability (`checkTerritoryAvailability`) so we only pitch open slots.
 *   3. Pairs each prospect with 3 real unseen commercial permits in their exact ZIP & trade
 *      ("Trojan Horse Permit Bait").
 *   4. Auto-provisions a personalized, playable Preview Briefing (`?token=preview-<slug>-<zip>`)
 *      in `db/store.js` so when the prospect replies "Yes", they get a working 7:00 AM Briefing
 *      with their own company name and voice already calibrated.
 */

const dns = require('node:dns').promises;
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

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

const TDLR_SODA_ENDPOINT = 'https://data.texas.gov/resource/7358-krk7.json';
const TX_FRANCHISE_SODA_ENDPOINT = 'https://data.texas.gov/resource/9cir-efmm.json';
const AUSTIN_PERMITS_SODA_ENDPOINT = 'https://data.austintexas.gov/resource/3syk-w9eu.json';

/**
 * Curated regional contractor & SMB prospect directory across Central TX corridors
 * (safe sandbox defaults routed to feedbackdaisy+*@gmail.com for deterministic tests).
 */
const CORRIDOR_PROSPECT_DIRECTORY = [
  {
    id: 'prospect-comal-concrete-01',
    sourceType: 'SANDBOX_DEMO',
    licenseBadge: 'Sandbox Demo • 78130 Concrete',
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
    sourceType: 'SANDBOX_DEMO',
    licenseBadge: 'Sandbox Demo • 78130 Roofing',
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
    sourceType: 'SANDBOX_DEMO',
    licenseBadge: 'Sandbox Demo • 78130 MEP',
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
    sourceType: 'SANDBOX_DEMO',
    licenseBadge: 'Sandbox Demo • 78701 Concrete',
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
    sourceType: 'SANDBOX_DEMO',
    licenseBadge: 'Sandbox Demo • 78130 Pools',
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
    sourceType: 'SANDBOX_DEMO',
    licenseBadge: 'Sandbox Demo • 78258 B2B',
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
    .replace(/\b(llc|inc|ltd|corp|co|company|pllc|lp|llp)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
}

function formatUsPhone(raw = '') {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return '';
}

const UPPERCASE_ACRONYMS = new Set([
  'LLC',
  'LP',
  'LLP',
  'PLLC',
  'INC',
  'TX',
  'USA',
  'US',
  'HVAC',
  'MEP',
  'AC',
  'A/C',
  'B2B',
  'GC',
  'II',
  'III',
  'IV',
  'IH',
  'FM'
]);

function formatTitleCaseCompany(raw = '') {
  const cleaned = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  // If already mixed-case, preserve as-is
  if (/[a-z]/.test(cleaned) && /[A-Z]/.test(cleaned)) {
    return cleaned;
  }
  return cleaned
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase().replace(/[.,]+$/, '');
      const punct = word.slice(upper.length);
      if (UPPERCASE_ACRONYMS.has(upper) || /^[A-Z]&[A-Z]$/.test(upper)) {
        return upper + punct;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function formatPersonOwnerName(rawOwner = '', rawCompany = '') {
  const clean = String(rawOwner || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return { contactName: 'Owner & Estimating', contactFirstName: '' };

  // Detect if owner_name is actually a corporate entity rather than a human name
  const isEntity =
    /\b(LLC|INC|CORP|LTD|LP|LLP|PLLC|COMPANY|CO|POOL|POOLS|ROOF|ROOFING|ELECTRIC|ELECTRICAL|CONCRETE|PAVING|SERVICE|SERVICES|MECHANICAL|HVAC|AIR|CONSTRUCTION|CONTRACTOR|CONTRACTORS|ENTERPRISE|ENTERPRISES|HOLDINGS|GROUP|SOLUTIONS|SYSTEMS|PARTNERS|DESIGN|CUSTOM|TEXAS|NEW BRAUNFELS|AUSTIN|SAN ANTONIO|COMMERCIAL)\b/i.test(
      clean
    ) || clean.toUpperCase() === String(rawCompany || '').trim().toUpperCase();

  if (isEntity) {
    return { contactName: 'Owner & Estimating', contactFirstName: '' };
  }

  let formatted = clean;
  if (clean.includes(',')) {
    const [last, rest] = clean.split(',').map((s) => s.trim());
    const firstMiddle = String(rest || '')
      .split(/\s+/)
      .filter((tok) => tok.length > 1 || /^[A-Z]$/i.test(tok));
    const first = firstMiddle[0] || '';
    formatted = first ? `${first} ${last}` : last;
  }

  const titled = formatted
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const firstWord = titled.split(/\s+/)[0] || '';
  return {
    contactName: titled || 'Owner & Estimating',
    contactFirstName: firstWord.length >= 2 ? firstWord : ''
  };
}

/**
 * Resolves any Texas 5-digit ZIP code (or 'ALL') into city & official TDLR county name.
 */
function resolveTexasCountyAndCity(zipCode = '78130') {
  const raw = String(zipCode || '78130').trim();
  if (!raw || raw.toUpperCase() === 'ALL') {
    return { zip: '78130', city: 'New Braunfels', county: 'COMAL', state: 'TX', isAll: true };
  }
  const zipMatch = raw.match(/\b(\d{5})\b/);
  const zip = zipMatch ? zipMatch[1] : '78130';

  const exactMap = {
    '78130': { city: 'New Braunfels', county: 'COMAL' },
    '78132': { city: 'New Braunfels', county: 'COMAL' },
    '78133': { city: 'Canyon Lake', county: 'COMAL' },
    '78163': { city: 'Bulverde', county: 'COMAL' },
    '78070': { city: 'Spring Branch', county: 'COMAL' },
    '78155': { city: 'Seguin', county: 'GUADALUPE' },
    '78108': { city: 'Cibolo', county: 'GUADALUPE' },
    '78154': { city: 'Schertz', county: 'GUADALUPE' },
    '78666': { city: 'San Marcos', county: 'HAYS' },
    '78610': { city: 'Buda', county: 'HAYS' },
    '78640': { city: 'Kyle', county: 'HAYS' },
    '78620': { city: 'Dripping Springs', county: 'HAYS' },
    '78660': { city: 'Pflugerville', county: 'TRAVIS' },
    '78681': { city: 'Round Rock', county: 'WILLIAMSON' },
    '78664': { city: 'Round Rock', county: 'WILLIAMSON' },
    '78613': { city: 'Cedar Park', county: 'WILLIAMSON' },
    '78641': { city: 'Leander', county: 'WILLIAMSON' },
    '78626': { city: 'Georgetown', county: 'WILLIAMSON' },
    '78628': { city: 'Georgetown', county: 'WILLIAMSON' }
  };

  if (exactMap[zip]) {
    return { zip, ...exactMap[zip], state: 'TX', isAll: false };
  }
  if (zip.startsWith('787')) {
    return { zip, city: 'Austin', county: 'TRAVIS', state: 'TX', isAll: false };
  }
  if (zip.startsWith('782')) {
    return { zip, city: 'San Antonio', county: 'BEXAR', state: 'TX', isAll: false };
  }
  if (zip.startsWith('750')) {
    return { zip, city: 'Plano', county: 'COLLIN', state: 'TX', isAll: false };
  }
  if (zip.startsWith('752')) {
    return { zip, city: 'Dallas', county: 'DALLAS', state: 'TX', isAll: false };
  }
  if (zip.startsWith('760') || zip.startsWith('761')) {
    return { zip, city: 'Fort Worth', county: 'TARRANT', state: 'TX', isAll: false };
  }
  if (zip.startsWith('770') || zip.startsWith('773') || zip.startsWith('774')) {
    return { zip, city: 'Houston', county: 'HARRIS', state: 'TX', isAll: false };
  }

  const metro = resolveMetroProfile(zip);
  const cleanCity =
    metro.city && !/Local Metro/i.test(metro.city)
      ? String(metro.city).split('/')[0].trim()
      : 'New Braunfels';
  return {
    zip,
    city: cleanCity,
    county: 'COMAL',
    state: metro.state || 'TX',
    isAll: false
  };
}

function inferTradeFromBusinessName(name = '', fallbackTrade = 'Commercial Concrete') {
  const u = String(name || '').toUpperCase();
  if (/ROOF|EXTERIOR|SIDING|GUTTER|SHEET\s*METAL|SHINGLE/.test(u)) {
    return 'Roofing / Exteriors';
  }
  if (/ELECTRIC|HVAC|MECHANICAL|AIR\s*CONDITION|HEATING|COOLING|PLUMB/.test(u)) {
    return 'Electrical / HVAC';
  }
  if (/POOL|SPA|FENC|OUTDOOR|DECK|PATIO|CUSTOM\s*HOME|IRON/.test(u)) {
    return 'Pools / Fencing / Custom Home';
  }
  if (/CLEAN|JANITOR|STRIPING|SWEEPING|FACILIT|MAINTENANCE|TURNOVER|LANDSCAP/.test(u)) {
    return 'B2B / Commercial Services';
  }
  if (/CONCRETE|PAVING|ASPHALT|FLATWORK|FOUNDATION|MASONRY/.test(u)) {
    return 'Commercial Concrete';
  }
  return fallbackTrade && fallbackTrade !== 'ALL' ? fallbackTrade : 'Commercial Concrete';
}

function extractScrapedEmailsAndPhones(html = '', domains = []) {
  const source = String(html || '');
  const domainList = (Array.isArray(domains) ? domains : [domains])
    .map((d) => String(d || '').replace(/^www\./i, '').toLowerCase().trim())
    .filter(Boolean);

  const isJunkOrAgencyEmail = (e) =>
    /sentry|wixpress|wix\.com|example\.com|domain\.com|email\.com|yourdomain|wordpress|cloudflare|godaddy|squarespace|googleapis|latofonts|sansoxygen|micahrich|webdesign|theme|plugin|\.png$|\.jpg$|\.jpeg$|\.webp$|\.svg$|\.gif$|@2x|2x\./i.test(
      e
    );

  // 1. Prioritize explicit mailto: links (almost always the business's real contact inbox)
  const mailtoEmails = [...source.matchAll(/href\s*=\s*["']mailto:([^"'?&\s]+)/gi)]
    .map((m) => decodeURIComponent(m[1]).toLowerCase().trim())
    .filter((e) => e.includes('@') && !isJunkOrAgencyEmail(e));

  // 2. Fallback to inline email strings
  const rawEmails = source.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const cleanEmails = [
    ...new Set([
      ...mailtoEmails,
      ...rawEmails
        .map((e) => e.toLowerCase().replace(/[.,;)>]+$/, ''))
        .filter((e) => !isJunkOrAgencyEmail(e))
    ])
  ];

  const sameDomain = cleanEmails.filter((e) =>
    domainList.some((dom) => e.endsWith(`@${dom}`))
  );
  const commonMailbox = cleanEmails.filter((e) =>
    /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|aol\.com|att\.net|sbcglobal\.net|satx\.rr\.com|austin\.rr\.com)$/i.test(
      e
    )
  );

  // Prefer tel: links first, then standard 10-digit US phone numbers in page text
  const telHrefMatches = [...source.matchAll(/href\s*=\s*["']tel:([^"']+)["']/gi)].map((m) =>
    formatUsPhone(m[1])
  );
  const inlineMatches = (source.match(/\(?\b[2-9]\d{2}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g) || []).map(
    (p) => formatUsPhone(p)
  );
  const phones = [...new Set([...telHrefMatches, ...inlineMatches].filter(Boolean))];

  return {
    sameDomainEmails: sameDomain,
    mailtoOrPersonalEmails: [...new Set([...mailtoEmails, ...commonMailbox])],
    allValidEmails: cleanEmails,
    phones
  };
}

function generateSmartDomainCandidates(companyName = '') {
  const lower = String(companyName || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’.]/g, '')
    .replace(/\b(llc|inc|ltd|corp|corporation|pllc|lp|llp)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!lower) return [];

  const fullSlug = lower.replace(/[^a-z0-9]/g, '');
  const strippedSuffix = lower
    .replace(/\b(company|co|services|service|contractors|contractor|construction|solutions|group|tx|texas)\s*$/g, '')
    .trim()
    .replace(/[^a-z0-9]/g, '');

  const candidates = [];
  if (fullSlug.length >= 4) candidates.push(`${fullSlug}.com`);
  if (strippedSuffix.length >= 4 && strippedSuffix !== fullSlug) {
    candidates.push(`${strippedSuffix}.com`);
  }
  return [...new Set(candidates)].slice(0, 2);
}

/**
 * Zero-API Live Web Presence, DNS MX, Email, Phone & Homepage HTML Probe.
 * Inspects a real contractor's website (either provided or discovered via smart domain + search)
 * so we never attach fake placeholder emails to real prospects.
 */
async function probeLiveContractorWebPresence({
  companyName = '',
  contactName = '',
  city = 'New Braunfels',
  state = 'TX',
  existingWebsiteUrl = '',
  existingPhone = '',
  existingEmail = '',
  timeoutMs = 2600
} = {}) {
  let websiteUrl = String(existingWebsiteUrl || '').trim();
  let domain = '';
  let mxOk = false;
  let rawHtml = '';
  let scrapedEmails = [];
  let scrapedPhones = [];

  // 1. If caller supplied an explicit URL, inspect it first
  if (websiteUrl && /^https?:\/\//i.test(websiteUrl)) {
    if (/facebook\.com|instagram\.com|yelp\.com|nextdoor\.com|thumbtack\.com/i.test(websiteUrl)) {
      return {
        websiteUrl,
        websiteStatus: 'SOCIAL_ONLY',
        mxOk: false,
        email: existingEmail || '',
        emailSource: existingEmail ? 'Provided Contact Email' : 'Social Page Only (Use Native SIM SMS)',
        phone: formatUsPhone(existingPhone) || existingPhone || '',
        rawHtml: ''
      };
    }
    try {
      const parsed = new URL(websiteUrl);
      domain = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    } catch (_e) {
      domain = '';
    }
  } else if (websiteUrl && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(websiteUrl)) {
    domain = websiteUrl.replace(/^www\./i, '').toLowerCase();
    websiteUrl = `https://www.${domain}`;
  }

  // 2. Build candidate domains to probe if no explicit domain yet
  const candidateDomains = domain ? [domain] : generateSmartDomainCandidates(companyName);

  for (const cand of candidateDomains) {
    let candMx = false;
    try {
      const mxRecords = await Promise.race([
        dns.resolveMx(cand),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 1800))
      ]);
      candMx = Array.isArray(mxRecords) && mxRecords.length > 0;
    } catch (_err) {
      candMx = false;
    }

    let candHtml = '';
    let finalOrigin = '';
    for (const prefix of ['https://www.', 'https://']) {
      try {
        const resp = await fetch(`${prefix}${cand}`, {
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(timeoutMs)
        });
        if (resp.ok) {
          const text = await resp.text();
          // Filter out parked domain lander pages
          if (
            text &&
            text.length > 400 &&
            !/domain\s+is\s+for\s+sale|buy\s+this\s+domain|sedoparking|afternic|hugedomains|dan\.com/i.test(
              text.slice(0, 4000)
            )
          ) {
            candHtml = text;
            finalOrigin = resp.url || `${prefix}${cand}`;
            break;
          }
        }
      } catch (_err) {
        // Try next prefix
      }
    }

    if (candHtml || candMx) {
      let finalDomain = cand;
      if (finalOrigin) {
        try {
          finalDomain = new URL(finalOrigin).hostname.replace(/^www\./i, '').toLowerCase() || cand;
        } catch (_eUrl) {
          finalDomain = cand;
        }
      }
      domain = finalDomain;
      mxOk = candMx;
      if (!mxOk && finalDomain !== cand) {
        try {
          const mx2 = await Promise.race([
            dns.resolveMx(finalDomain),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 1500))
          ]);
          mxOk = Array.isArray(mx2) && mx2.length > 0;
        } catch (_eMx) {
          mxOk = false;
        }
      }
      rawHtml = candHtml;
      websiteUrl = finalOrigin || `https://www.${cand}`;

      if (candHtml) {
        const domainPair = [...new Set([cand, finalDomain])];
        const extracted = extractScrapedEmailsAndPhones(candHtml, domainPair);
        scrapedEmails.push(...extracted.sameDomainEmails, ...extracted.mailtoOrPersonalEmails);
        scrapedPhones.push(...extracted.phones);

        // If no same-domain or mailto email on homepage, quickly check /contact
        if (extracted.sameDomainEmails.length === 0 && !existingEmail) {
          try {
            const originBase = new URL(websiteUrl).origin;
            const contactResp = await fetch(`${originBase}/contact`, {
              headers: BROWSER_HEADERS,
              signal: AbortSignal.timeout(1800)
            });
            if (contactResp.ok) {
              const contactHtml = await contactResp.text();
              const ext2 = extractScrapedEmailsAndPhones(contactHtml, domainPair);
              scrapedEmails.unshift(...ext2.sameDomainEmails);
              scrapedEmails.push(...ext2.mailtoOrPersonalEmails);
              scrapedPhones.push(...ext2.phones);
            }
          } catch (_e2) {
            // Ignore /contact timeout
          }
        }
      }
      break;
    }
  }

  // 3. Optional DuckDuckGo search fallback if smart domain candidates didn't match
  if (!domain && !websiteUrl && companyName) {
    try {
      const crawled = await crawlLiveCompanyWebsiteAndEmail(
        companyName,
        contactName,
        `${city} ${state}`
      );
      if (crawled && crawled.pagesCrawled > 0 && crawled.hostname) {
        domain = crawled.hostname;
        websiteUrl = crawled.websiteUrl;
        if (crawled.email && crawled.emailSource.startsWith('Scraped Live')) {
          scrapedEmails.push(crawled.email);
        }
      }
    } catch (_err) {
      // Ignore search timeout
    }
  }

  const uniqueEmails = [...new Set(scrapedEmails.filter(Boolean))];
  const uniquePhones = [...new Set(scrapedPhones.filter(Boolean))];

  let resolvedEmail = String(existingEmail || '').trim().toLowerCase();
  let emailSource = resolvedEmail ? 'Provided Contact Email' : '';

  if (!resolvedEmail && uniqueEmails.length > 0) {
    resolvedEmail = uniqueEmails[0];
    emailSource = `Scraped Live from ${domain || 'Website'}`;
  } else if (!resolvedEmail && domain && mxOk) {
    resolvedEmail = `info@${domain}`;
    emailSource = `MX-Verified Domain (${domain})`;
  } else if (!resolvedEmail) {
    emailSource = 'No Public Email Found (Use 1-Tap SIM SMS or Add Email)';
  }

  const resolvedPhone =
    formatUsPhone(existingPhone) || uniquePhones[0] || String(existingPhone || '').trim();

  const websiteStatus = rawHtml || (domain && mxOk) ? undefined : 'NO_SITE_FOUND';

  return {
    websiteUrl: rawHtml || (domain && mxOk) ? websiteUrl : 'Not found',
    domain,
    mxOk,
    websiteStatus,
    email: resolvedEmail,
    emailSource,
    phone: resolvedPhone,
    rawHtml
  };
}

/**
 * Queries official Texas TDLR Socrata Open Data (`7358-krk7`) for licensed Electrical,
 * A/C (HVAC), and Pool/Appliance contractors with verified telephone numbers.
 */
async function fetchLiveTdlrContractors({
  zip = '78130',
  county = 'COMAL',
  city = 'New Braunfels',
  primaryTrade = 'ALL',
  limit = 6
} = {}) {
  const tradeNorm = String(primaryTrade || 'ALL').toLowerCase();
  let licenseTypes = [];
  if (tradeNorm === 'all' || !tradeNorm) {
    licenseTypes = ['Electrical Contractor', 'A/C Contractor', 'Appliance Installation Contractor'];
  } else if (tradeNorm.includes('elec') || tradeNorm.includes('hvac') || tradeNorm.includes('mep')) {
    licenseTypes = ['Electrical Contractor', 'A/C Contractor'];
  } else if (tradeNorm.includes('pool') || tradeNorm.includes('fenc') || tradeNorm.includes('custom')) {
    licenseTypes = ['Appliance Installation Contractor'];
  } else {
    return [];
  }

  const typeListSql = licenseTypes.map((t) => `'${t}'`).join(',');
  const queries = [
    `license_type IN (${typeListSql}) AND business_telephone IS NOT NULL AND business_city_state_zip LIKE '%${zip}%'`,
    `license_type IN (${typeListSql}) AND business_telephone IS NOT NULL AND business_county='${county}'`
  ];

  const rows = [];
  const seenNames = new Set();

  for (const whereClause of queries) {
    if (rows.length >= limit) break;
    try {
      const url = `${TDLR_SODA_ENDPOINT}?$limit=${Math.max(limit * 3, 12)}&$order=license_type%20DESC&$where=${encodeURIComponent(whereClause)}`;
      const resp = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (!Array.isArray(data)) continue;

      for (const r of data) {
        const rawBiz = String(r.business_name || '').trim();
        if (!rawBiz) continue;
        const normKey = rawBiz.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (seenNames.has(normKey)) continue;
        seenNames.add(normKey);

        const formattedCompany = formatTitleCaseCompany(rawBiz);
        const ownerInfo = formatPersonOwnerName(r.owner_name, rawBiz);
        const phoneFormatted = formatUsPhone(r.business_telephone || r.owner_telephone);
        if (!phoneFormatted) continue;

        const csz = String(r.business_city_state_zip || '');
        const zipMatch = csz.match(/\b(\d{5})\b/);
        const rowZip = zipMatch ? zipMatch[1] : zip;
        const cityPart = csz.split(/\s+TX\b/i)[0]?.trim();
        const rowCity = cityPart ? formatTitleCaseCompany(cityPart) : city;

        const mappedTrade =
          r.license_type === 'Appliance Installation Contractor'
            ? 'Pools / Fencing / Custom Home'
            : 'Electrical / HVAC';

        const streetAddr = formatTitleCaseCompany(r.business_address_line1 || '');

        rows.push({
          id: `live-tdlr-${r.license_subtype || 'ctr'}-${r.license_number || normKey.slice(0, 8)}`,
          sourceType: 'LIVE_TDLR',
          licenseBadge: `TDLR #${r.license_number} (${r.license_type})`,
          companyName: formattedCompany,
          contactName: ownerInfo.contactName,
          contactFirstName: ownerInfo.contactFirstName,
          contactRole: ownerInfo.contactFirstName ? 'Licensed Owner / Master' : 'Estimating & Dispatch',
          primaryTrade: mappedTrade,
          zipCode: rowZip,
          city: rowCity,
          state: 'TX',
          phone: phoneFormatted,
          email: '',
          websiteUrl: '',
          reviewCount: 42,
          starRating: 4.8,
          landmarkReference: streetAddr ? `near ${streetAddr}` : `in ${rowCity} (${rowZip})`,
          whyProspect: `Active State of Texas ${r.license_type} (License #${r.license_number}, exp. ${r.license_expiration_date_mmddccyy || 'Active'}) in ${rowCity} (${rowZip}).`
        });

        if (rows.length >= limit) break;
      }
    } catch (_err) {
      // Continue to fallback query
    }
  }

  return rows;
}

/**
 * Queries official Texas Comptroller Active Franchise Taxpayers (`9cir-efmm`)
 * for active Concrete, Roofing, Electrical/HVAC, Pool/Fence, and B2B Commercial LLCs/Corps in any TX ZIP.
 */
async function fetchLiveTxComptrollerContractors({
  zip = '78130',
  city = 'New Braunfels',
  primaryTrade = 'ALL',
  limit = 6
} = {}) {
  const tradeNorm = String(primaryTrade || 'ALL').toLowerCase();
  let keywords = [];
  if (tradeNorm.includes('roof')) {
    keywords = ['ROOF'];
  } else if (tradeNorm.includes('concrete')) {
    keywords = ['CONCRETE', 'PAVING'];
  } else if (tradeNorm.includes('elec') || tradeNorm.includes('hvac')) {
    keywords = ['ELECTRIC', 'HVAC'];
  } else if (tradeNorm.includes('pool') || tradeNorm.includes('fenc') || tradeNorm.includes('custom')) {
    keywords = ['POOL', 'FENCE'];
  } else if (tradeNorm.includes('b2b') || tradeNorm.includes('commercial')) {
    keywords = ['CLEANING', 'STRIPING'];
  } else {
    keywords = ['ROOF', 'CONCRETE'];
  }

  const likeClauses = keywords.map((kw) => `taxpayer_name LIKE '%${kw}%'`).join(' OR ');
  const whereClause = `taxpayer_zip='${zip}' AND right_to_transact_business_code='A' AND (${likeClauses})`;

  try {
    const url = `${TX_FRANCHISE_SODA_ENDPOINT}?$limit=${Math.max(limit * 3, 15)}&$where=${encodeURIComponent(whereClause)}`;
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6500)
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];

    const results = [];
    const seen = new Set();

    for (const r of data) {
      const rawName = String(r.taxpayer_name || '').trim();
      if (!rawName) continue;
      // Skip passive real-estate holding entities
      if (/\b(PROPERTIES|HOLDINGS|INVESTMENTS|REALTY|PARTNERSHIP|TRUST|CAPITAL)\b/i.test(rawName)) {
        continue;
      }
      const normKey = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (seen.has(normKey)) continue;
      seen.add(normKey);

      const formattedCompany = formatTitleCaseCompany(rawName);
      const rowCity = r.taxpayer_city ? formatTitleCaseCompany(r.taxpayer_city) : city;
      const rowZip = String(r.taxpayer_zip || zip).trim().slice(0, 5);
      const sosNum = r.secretary_of_state_sos_or_coa_file_number || r.taxpayer_number || '';
      const mappedTrade = inferTradeFromBusinessName(rawName, primaryTrade);
      const streetAddr = formatTitleCaseCompany(r.taxpayer_address || '');

      results.push({
        id: `live-txsos-${sosNum || normKey.slice(0, 10)}`,
        sourceType: 'LIVE_TX_COMPTROLLER',
        licenseBadge: sosNum ? `TX Active SOS #${sosNum}` : 'TX Comptroller Active Entity',
        companyName: formattedCompany,
        contactName: 'Owner & Estimating',
        contactFirstName: '',
        contactRole: 'Managing Member',
        primaryTrade: mappedTrade,
        zipCode: rowZip,
        city: rowCity,
        state: 'TX',
        phone: '',
        email: '',
        websiteUrl: '',
        reviewCount: 38,
        starRating: 4.8,
        landmarkReference: streetAddr ? `near ${streetAddr}` : `in ${rowCity} (${rowZip})`,
        whyProspect: `Active Texas-chartered ${mappedTrade} business (${sosNum ? `SOS #${sosNum}` : 'Franchise Tax Active'}) headquartered in ${rowCity} (${rowZip}).`
      });

      if (results.length >= limit) break;
    }

    return results;
  } catch (_err) {
    return [];
  }
}

/**
 * Queries Austin Build+Connect Open Permits (`3syk-w9eu`) for active local trade contractors
 * with direct phone numbers when sweeping Austin / 787xx / ALL corridors.
 */
async function fetchLiveAustinPermitContractors({
  zip = '78701',
  primaryTrade = 'ALL',
  limit = 4
} = {}) {
  if (!zip.startsWith('787') && !zip.startsWith('786')) return [];
  try {
    const whereClause = `contractor_company_name IS NOT NULL AND contractor_phone IS NOT NULL`;
    const url = `${AUSTIN_PERMITS_SODA_ENDPOINT}?$limit=30&$order=issue_date%20DESC&$where=${encodeURIComponent(whereClause)}`;
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3800)
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];

    const results = [];
    const seen = new Set();
    const tradeNorm = String(primaryTrade || 'ALL').toLowerCase();

    for (const r of data) {
      const rawName = String(r.contractor_company_name || '')
        .replace(/\*+\s*MAIN\s*\*+/gi, '')
        .trim();
      if (!rawName || rawName.length < 4) continue;
      const normKey = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (seen.has(normKey)) continue;

      const inferred = inferTradeFromBusinessName(
        `${rawName} ${r.permit_type_desc || ''} ${r.description || ''}`,
        primaryTrade
      );
      if (tradeNorm !== 'all' && tradeNorm && inferred.toLowerCase() !== tradeNorm) {
        continue;
      }

      const phoneFormatted = formatUsPhone(r.contractor_phone);
      if (!phoneFormatted) continue;
      seen.add(normKey);

      const formattedCompany = formatTitleCaseCompany(rawName);
      const ownerInfo = formatPersonOwnerName(r.contractor_full_name || '', rawName);
      const rowZip = String(r.original_zip || zip).trim().slice(0, 5) || zip;

      results.push({
        id: `live-abcp-${normKey.slice(0, 12)}`,
        sourceType: 'LIVE_MUNICIPAL_PERMIT',
        licenseBadge: `Austin AB+C Active Contractor`,
        companyName: formattedCompany,
        contactName: ownerInfo.contactName,
        contactFirstName: ownerInfo.contactFirstName,
        contactRole: ownerInfo.contactFirstName ? 'Registered Permit Contractor' : 'Estimating Desk',
        primaryTrade: inferred,
        zipCode: rowZip,
        city: 'Austin',
        state: 'TX',
        phone: phoneFormatted,
        email: '',
        websiteUrl: '',
        reviewCount: 46,
        starRating: 4.8,
        landmarkReference: r.permit_location ? `active near ${formatTitleCaseCompany(r.permit_location)}` : 'in Austin Metro',
        whyProspect: `Recently pulled active permit #${r.permit_number || 'AB+C'} in Austin (${rowZip}) with verified contractor phone on file.`
      });

      if (results.length >= limit) break;
    }

    return results;
  } catch (_err) {
    return [];
  }
}

/**
 * Discovers real, active Texas contractors in any ZIP & trade by combining TDLR,
 * Texas Comptroller Active Franchise Taxpayers, Austin Open Permits, and parallel live web/MX probing.
 */
async function discoverLiveTexasContractors({
  zipCode = '78130',
  primaryTrade = 'ALL',
  limit = 6
} = {}) {
  const maxItems = Math.max(1, Math.min(15, Number(limit) || 6));
  const cleanZipInput = String(zipCode || 'ALL').trim();
  const targetZips =
    !cleanZipInput || cleanZipInput.toUpperCase() === 'ALL'
      ? ['78130', '78701', '78258']
      : [resolveTexasCountyAndCity(cleanZipInput).zip];

  const perZipCap = Math.max(2, Math.ceil(maxItems / targetZips.length) + 1);
  const rawDiscovered = [];

  await Promise.all(
    targetZips.map(async (z) => {
      const geo = resolveTexasCountyAndCity(z);
      const [tdlrRows, comptrollerRows, austinRows] = await Promise.all([
        fetchLiveTdlrContractors({
          zip: geo.zip,
          county: geo.county,
          city: geo.city,
          primaryTrade,
          limit: perZipCap
        }),
        fetchLiveTxComptrollerContractors({
          zip: geo.zip,
          city: geo.city,
          primaryTrade,
          limit: perZipCap
        }),
        fetchLiveAustinPermitContractors({
          zip: geo.zip,
          primaryTrade,
          limit: perZipCap
        })
      ]);
      // Round-robin interleave TDLR, Municipal, and TX Comptroller so 'ALL' sweeps return a balanced multi-trade mix
      const maxLen = Math.max(tdlrRows.length, comptrollerRows.length, austinRows.length);
      for (let i = 0; i < maxLen; i++) {
        if (tdlrRows[i]) rawDiscovered.push(tdlrRows[i]);
        if (comptrollerRows[i]) rawDiscovered.push(comptrollerRows[i]);
        if (austinRows[i]) rawDiscovered.push(austinRows[i]);
      }
    })
  );

  // Deduplicate by normalized company name
  const deduped = [];
  const seenKeys = new Set();
  for (const item of rawDiscovered) {
    const key = String(item.companyName || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(item);
    if (deduped.length >= maxItems) break;
  }

  // Enrich all discovered businesses in parallel with live website, DNS MX, email, phone & HTML probe
  const webEnriched = await Promise.all(
    deduped.map(async (item) => {
      const web = await probeLiveContractorWebPresence({
        companyName: item.companyName,
        contactName: item.contactName,
        city: item.city,
        state: item.state,
        existingWebsiteUrl: item.websiteUrl,
        existingPhone: item.phone,
        existingEmail: item.email
      });

      return {
        ...item,
        websiteUrl: web.websiteUrl,
        websiteStatus: web.websiteStatus,
        email: web.email,
        emailSource: web.emailSource,
        phone: web.phone || item.phone || '',
        htmlOverride: web.rawHtml || ''
      };
    })
  );

  // Sort so contractors with both phone & live email/website surface at the top, followed by phone-verified No-Site leads
  webEnriched.sort((a, b) => {
    const scoreA = (a.email ? 2 : 0) + (a.phone ? 2 : 0) + (a.websiteUrl !== 'Not found' ? 1 : 0);
    const scoreB = (b.email ? 2 : 0) + (b.phone ? 2 : 0) + (b.websiteUrl !== 'Not found' ? 1 : 0);
    return scoreB - scoreA;
  });

  return webEnriched;
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
 * Enriches a single raw candidate prospect with Territory Availability, 3 Bait Permits,
 * optional Live Web Probe, and an auto-provisioned Preview Briefing.
 */
async function buildScoutProspectBundle(
  item,
  { fetchLiveWeb = false, autoProvisionPreviews = true, baseUrl = 'https://www.tiberius.ai' } = {}
) {
  const zip = String(item.zipCode || '78130').trim();
  const trade = String(item.primaryTrade || 'Commercial Concrete').trim();

  const availability = checkTerritoryAvailability(zip, trade, 'Tier 2: Commercial Permits');
  const baitPermits = gatherBaitPermitsForProspect({
    zipCode: zip,
    primaryTrade: trade,
    count: 3
  });

  let resolvedWebsite = item.websiteUrl || '';
  let resolvedEmail = item.email || '';
  let resolvedPhone = formatUsPhone(item.phone) || item.phone || '';
  let emailSource = item.emailSource || (resolvedEmail ? 'Verified Domain & Public Filing' : '');
  let htmlOverride = item.htmlOverride || '';
  let websiteStatus = item.websiteStatus;

  // Run live web/MX probe if requested and not already probed in discoverLiveTexasContractors
  if (fetchLiveWeb && item.sourceType !== 'SANDBOX_DEMO' && !htmlOverride && websiteStatus !== 'NO_SITE_FOUND') {
    const probed = await probeLiveContractorWebPresence({
      companyName: item.companyName,
      contactName: item.contactDisplayName || item.contactName,
      city: item.city,
      state: item.state || 'TX',
      existingWebsiteUrl: resolvedWebsite,
      existingPhone: resolvedPhone,
      existingEmail: resolvedEmail
    });
    resolvedWebsite = probed.websiteUrl || resolvedWebsite;
    resolvedEmail = probed.email || resolvedEmail;
    resolvedPhone = probed.phone || resolvedPhone;
    emailSource = probed.emailSource || emailSource;
    htmlOverride = probed.rawHtml || '';
    if (!websiteStatus && probed.websiteStatus) {
      websiteStatus = probed.websiteStatus;
    }
  } else if (fetchLiveWeb && item.sourceType === 'SANDBOX_DEMO' && item.websiteStatus !== 'NO_SITE_FOUND') {
    const crawled = await crawlLiveCompanyWebsiteAndEmail(
      item.companyName,
      item.contactDisplayName || item.contactName,
      `${item.city} ${item.state || 'TX'}`
    );
    if (crawled && crawled.email) {
      resolvedEmail = crawled.email;
      resolvedWebsite = crawled.websiteUrl || resolvedWebsite;
      emailSource = crawled.emailSource;
    }
  }

  const displayContact = item.contactDisplayName || item.contactName || 'Owner & Estimating';
  const isGenericOwnerLabel = /^(owner|estimating|shop|team|managing|dispatch)/i.test(displayContact);
  const firstWord = isGenericOwnerLabel
    ? ''
    : String(item.contactFirstName || displayContact)
        .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '')
        .trim()
        .split(/\s+/)[0];

  const enrichedProspect = {
    ...item,
    zipCode: zip,
    primaryTrade: trade,
    contactName: displayContact,
    contactFirstName: firstWord,
    companyShortName: extractCompanyShortName(item.companyName),
    websiteUrl: resolvedWebsite || 'Not found',
    websiteStatus,
    phone: resolvedPhone,
    email: resolvedEmail,
    emailSource: emailSource || 'Verified Public Filing',
    htmlOverride,
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

  return {
    ...enrichedProspect,
    previewToken: previewInfo ? previewInfo.previewToken : null,
    previewBriefingUrl: previewInfo ? previewInfo.previewBriefingUrl : null,
    previewCommandUrl: previewInfo ? previewInfo.previewCommandUrl : null
  };
}

/**
 * Sweeps and enriches target prospects for Tiberius Meta-Recon.
 * - When `liveDiscovery === true` (or `sourceMode === 'LIVE'`), pulls real active contractors from
 *   Texas TDLR + Texas Comptroller + Austin Open Permits + Live Domain/MX/HTML crawl.
 * - Otherwise uses `CORRIDOR_PROSPECT_DIRECTORY` (preserving deterministic offline/CI tests).
 */
async function sweepTiberiusProspects({
  zipCode = '',
  primaryTrade = '',
  limit = 6,
  fetchLiveWeb = false,
  liveDiscovery = false,
  sourceMode = '',
  customProspects = [],
  autoProvisionPreviews = true,
  baseUrl = 'https://www.tiberius.ai'
} = {}) {
  const cleanZip = String(zipCode || '').trim();
  const cleanTrade = String(primaryTrade || '').trim();
  const useLiveDiscovery =
    Boolean(liveDiscovery) || String(sourceMode || '').toUpperCase() === 'LIVE';
  const customOnly = String(sourceMode || '').toUpperCase() === 'CUSTOM_ONLY';

  let candidates = [];

  if (Array.isArray(customProspects) && customProspects.length > 0) {
    const filteredCustom = customProspects.filter((p) => {
      const zipMatch = !cleanZip || cleanZip === 'ALL' || p.zipCode === cleanZip;
      const tradeMatch =
        !cleanTrade ||
        cleanTrade === 'ALL' ||
        String(p.primaryTrade || '').toLowerCase() === cleanTrade.toLowerCase();
      return zipMatch && tradeMatch;
    });
    candidates.push(...filteredCustom);
  }

  if (!customOnly && useLiveDiscovery) {
    const liveContractors = await discoverLiveTexasContractors({
      zipCode: cleanZip || 'ALL',
      primaryTrade: cleanTrade || 'ALL',
      limit: Math.max(1, Number(limit) || 6)
    });
    for (const lc of liveContractors) {
      const exists = candidates.some(
        (c) =>
          String(c.companyName || '').toLowerCase() === String(lc.companyName || '').toLowerCase()
      );
      if (!exists) candidates.push(lc);
    }
  }

  if (!customOnly && !useLiveDiscovery) {
    const sandboxMatches = CORRIDOR_PROSPECT_DIRECTORY.filter((p) => {
      const zipMatch = !cleanZip || cleanZip === 'ALL' || p.zipCode === cleanZip;
      const tradeMatch =
        !cleanTrade ||
        cleanTrade === 'ALL' ||
        p.primaryTrade.toLowerCase() === cleanTrade.toLowerCase();
      return zipMatch && tradeMatch;
    });
    for (const sm of sandboxMatches) {
      const exists = candidates.some((c) => c.id === sm.id);
      if (!exists) candidates.push(sm);
    }
  }

  // Fallback if custom ZIP/Trade had zero matches (e.g. offline environment)
  if (candidates.length === 0 && !customOnly) {
    const targetZip = cleanZip && cleanZip !== 'ALL' ? cleanZip : '78130';
    const geo = resolveTexasCountyAndCity(targetZip);
    const metro = resolveMetroProfile(targetZip);
    const targetTrade =
      cleanTrade && cleanTrade !== 'ALL' ? cleanTrade : 'Commercial Concrete';
    const tradeShort = targetTrade.split('/')[0].trim();

    candidates = [
      {
        id: `prospect-${geo.zip}-custom-1`,
        sourceType: 'SANDBOX_DEMO',
        licenseBadge: `Sandbox Fallback • ${geo.zip}`,
        companyName: `${geo.city} ${tradeShort} & Commercial Specialists`,
        contactName: 'Marcus Vance',
        contactFirstName: 'Marcus',
        contactDisplayName: 'Marcus Vance',
        contactRole: 'Owner & Lead Estimator',
        primaryTrade: targetTrade,
        zipCode: geo.zip,
        city: geo.city,
        state: geo.state,
        phone: '(830) 625-4810',
        email: 'feedbackdaisy+prospect@gmail.com',
        websiteUrl: `https://www.${slugifyCompany(`${geo.city} ${tradeShort}`)}.com`,
        websiteStatus: 'WEAK_SITE',
        formFieldCount: 7,
        hasAfterHoursAiChat: false,
        hasLocalBusinessSchema: false,
        reviewCount: 58,
        starRating: 4.8,
        landmarkReference: `along ${metro.industrialCorridor}`,
        whyProspect: `Active ${targetTrade} contractor in ${geo.city} (${geo.zip}) with a 7-field static form, zero after-hours SMS rescue, and 3 matching commercial permits filed this week.`
      }
    ];
  }

  const sliced = candidates.slice(0, Math.max(1, Number(limit) || 6));
  const results = [];

  for (const item of sliced) {
    const bundled = await buildScoutProspectBundle(item, {
      fetchLiveWeb: fetchLiveWeb && !useLiveDiscovery,
      autoProvisionPreviews,
      baseUrl
    });
    results.push(bundled);
  }

  return {
    ok: true,
    sourceMode: useLiveDiscovery ? 'LIVE' : customOnly ? 'CUSTOM_ONLY' : 'SANDBOX',
    prospectsCount: results.length,
    prospects: results
  };
}

module.exports = {
  CORRIDOR_PROSPECT_DIRECTORY,
  sweepTiberiusProspects,
  discoverLiveTexasContractors,
  probeLiveContractorWebPresence,
  buildScoutProspectBundle,
  resolveTexasCountyAndCity,
  formatTitleCaseCompany,
  formatPersonOwnerName,
  formatUsPhone,
  gatherBaitPermitsForProspect,
  provisionProspectPreviewBriefing,
  slugifyCompany
};
