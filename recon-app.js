/**
 * TIBERIUS RECON™ - SALES PAGE INTERACTIVE CONTROLLER (app.js / recon-app.js)
 *
 * Powers:
 *   1. Contextual Personalized Recon Brief Campaign Banner & Section (?brief=1, ?from=brief, ?token=preview-...)
 *   2. Featured Recon Card Centerpiece Trade Switcher (Permit #BP-2026-08941 at 1420 Industrial Pkwy, Suite B)
 *   3. 6-Step Interactive Opportunity-to-Conversation Demonstration:
 *      - Trade Calibration across 5 Trades
 *      - Inline Outreach Draft Editing
 *      - 1-Tap Approve & Move to Conversation Room Preview
 *      - Interactive Conversation Room Reply & Site-Walk Confirmation
 *   4. Live Territory Zip Code Availability Checker (/api/recon/availability)
 *   5. 21st.dev ("G3") WebGL1 'Silk' Shader & Pixel-Grid Footer Wordmark
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') {
    if (typeof module !== 'undefined') {
      module.exports = require('./server');
    }
    return;
  }
  if (window.__TIBERIUS_RECON_SALES_APP_INITIALIZED__) return;
  window.__TIBERIUS_RECON_SALES_APP_INITIALIZED__ = true;

  /* ==========================================================================
     1. PERSONALIZED RECON BRIEF CAMPAIGN DETECTION & TOGGLE
     ========================================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const briefParam =
    urlParams.get('brief') ||
    urlParams.get('from') ||
    urlParams.get('campaign') ||
    urlParams.get('utm_campaign') ||
    '';
  const previewToken = urlParams.get('token') || urlParams.get('t') || '';
  const isFromPersonalizedBrief =
    briefParam === '1' ||
    briefParam === 'true' ||
    /brief|recon_brief|trojan|meta/i.test(briefParam) ||
    previewToken.startsWith('preview-');

  const topBriefBanner = document.getElementById('personalized-brief-top-banner');
  const briefBannerReopenLink = document.getElementById('brief-banner-reopen-link');
  const briefCollapsedPrompt = document.getElementById('personalized-brief-CollapsedPrompt');
  const briefExpandedCard = document.getElementById('personalized-brief-ExpandedCard');
  const briefSectionReopenBtn = document.getElementById('brief-section-reopen-btn');
  const btnRevealBriefMessage = document.getElementById('btn-reveal-personalized-brief-message');

  function activatePersonalizedBriefExperience() {
    if (topBriefBanner) topBriefBanner.classList.remove('hidden');
    if (briefCollapsedPrompt) briefCollapsedPrompt.classList.add('hidden');
    if (briefExpandedCard) briefExpandedCard.classList.remove('hidden');

    if (previewToken) {
      const targetHref = `/recon/briefing?token=${encodeURIComponent(previewToken)}`;
      if (briefBannerReopenLink) {
        briefBannerReopenLink.href = targetHref;
        briefBannerReopenLink.classList.remove('hidden');
      }
      if (briefSectionReopenBtn) {
        briefSectionReopenBtn.href = targetHref;
        briefSectionReopenBtn.textContent = 'Re-Open My Personalized Recon Brief →';
      }
    }
  }

  if (isFromPersonalizedBrief) {
    activatePersonalizedBriefExperience();
  }

  if (btnRevealBriefMessage) {
    btnRevealBriefMessage.addEventListener('click', () => {
      activatePersonalizedBriefExperience();
    });
  }

  /* ==========================================================================
     2. UNIFIED TRADE DATA FOR FEATURED CARD & 6-STEP INTERACTIVE DEMO
        (Consistent Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130)
     ========================================================================== */
  const TRADE_DEMO_DATA = {
    concrete: {
      tradeLabel: 'COMMERCIAL BUILDS',
      featuredTypeBadge: 'NEW COMMERCIAL BUILDING PERMIT • FILED YESTERDAY',
      featuredWhy:
        'This permit was just filed. You reach the builder weeks before other local contractors hear about it.',
      featuredDraft:
        '"Hey Grant - I saw the new $385,000 building permit filed for 2850 FM 306 in New Braunfels. Our local crew just finished a commercial build two miles away off IH-35. We have an opening next month and would love to give you a fast quote. Can I send our license and job photos today? - Travis Miller"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 JOB',
          headline: '$240,000 Commercial Building Upgrade',
          submeta: 'Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          why: 'Why it matters: $1,850,000 commercial building. Builders pick local crews right after this permit is filed.',
          contact: 'Marcus Vance • Project Manager @ Apex Builders',
          draft:
            '"Hey Marcus - I saw the $240,000 building permit filed for 1420 Industrial Pkwy in New Braunfels. Our local crew just finished a commercial job two miles away off FM 306. We have an opening next month and would love to give you a quote. Can I send our license and bid numbers today?"',
          replySender: 'MARCUS VANCE (APEX BUILDERS) - SAMPLE REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, New Braunfels, TX 78130',
          replyBody:
            '"Hey Travis - great timing. Our last crew backed out on 1420 Industrial Pkwy. Are you insured, and can you walk the job with me Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus - yes, we are fully insured and ready for 1420 Industrial Pkwy. See you on site Thursday at 9:00 AM with our proof of insurance and pricing. - Travis Miller'
        },
        2: {
          pill: 'NEW PROPERTY OWNER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons & Three Retail Buildings',
          submeta: 'Address: 2410 Gruene Rd, New Braunfels, TX 78130',
          why: 'Why it matters: $14,200,000 property sale. New property managers hire fresh local contractors in the first 30 days.',
          contact: 'Dana Sterling • Property Director @ Crestview Management',
          draft:
            '"Hi Dana - congrats on buying Oakridge Commons at 2410 Gruene Rd in New Braunfels. New owners usually line up reliable local contractors during the first month. Our insured local crew works weekends so your tenants never lose parking. Can I stop by Thursday to leave a quick quote?"',
          replySender: 'DANA STERLING (CRESTVIEW MANAGEMENT) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-218635 • 2410 Gruene Rd, New Braunfels, TX 78130',
          replyBody:
            '"Hi Travis - thanks for reaching out. We are adding two reliable local contractors for Oakridge Commons this month. Can you walk the property with me Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana - Thursday at 9:00 AM at 2410 Gruene Rd works great. I will bring our proof of insurance and local references. - Travis Miller'
        },
        3: {
          pill: 'HOME REMODEL PERMIT • OWNER MATCHED',
          headline: '1140 Whispering Pines Ln - Large Home Remodel',
          submeta: 'Address: 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          why: 'Why it matters: $940,000 home on 1.4 acres. Reach the homeowner directly instead of buying shared leads.',
          contact: 'Robert & Elena Harrison • Homeowners',
          draft:
            '"Hi Robert - I saw the city permit approved this week for your home remodel at 1140 Whispering Pines Ln. Our local crew has done dozens of projects in New Braunfels and keeps every yard spotless. Would you be open to a quick 10-minute quote walk this week?"',
          replySender: 'ROBERT HARRISON (HOMEOWNER) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Travis - we still need a reliable local contractor for the outside work. Can you stop by 1140 Whispering Pines Ln Thursday morning around 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert - Thursday at 9:00 AM at 1140 Whispering Pines Ln works great. I will bring photos from recent jobs in your neighborhood. - Travis Miller'
        }
      }
    },
    roofing: {
      tradeLabel: 'ROOFING JOBS',
      featuredTypeBadge: 'NEW COMMERCIAL ROOF PERMIT • FILED YESTERDAY',
      featuredWhy:
        'This roof permit was just filed. Reach the builder or owner before five other shops call.',
      featuredDraft:
        '"Hey Marcus - I saw the $240,000 commercial roof permit filed for 1420 Industrial Pkwy in New Braunfels. Our licensed local roof crew just finished a commercial job two miles away off FM 306. We have an opening next month and would love to drop off a fast quote. Can I send our license and warranty info today? - Jack Williams"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 ROOF JOB',
          headline: '$240,000 Commercial Roof Replacement',
          submeta: 'Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          why: 'Why it matters: $1,850,000 commercial building. Builders lock in their roof crew right after filing.',
          contact: 'Marcus Vance • Project Manager @ Apex Builders',
          draft:
            '"Hey Marcus - I saw the $240,000 commercial roof permit filed for 1420 Industrial Pkwy in New Braunfels. Our local roof crew just finished a warehouse job two miles away off FM 306. We have an opening next month and would love to give you a quote. Can I send our license and pricing today?"',
          replySender: 'MARCUS VANCE (APEX BUILDERS) - SAMPLE REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, New Braunfels, TX 78130',
          replyBody:
            '"Hey Jack - good timing. We still need a licensed local roof crew for 1420 Industrial Pkwy. Can you walk the building with us Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus - Thursday at 9:00 AM at 1420 Industrial Pkwy works great. I will bring our proof of insurance and 20-year warranty sheet. - Jack Williams'
        },
        2: {
          pill: 'NEW PROPERTY OWNER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons - Commercial Roof Inspection',
          submeta: 'Address: 2410 Gruene Rd, New Braunfels, TX 78130',
          why: 'Why it matters: $14,200,000 property sale. New owners check roof age and leaks right after closing.',
          contact: 'Dana Sterling • Property Director @ Crestview Management',
          draft:
            '"Hi Dana - congrats on buying Oakridge Commons at 2410 Gruene Rd in New Braunfels. New owners usually want a clear roof photo report during the first 30 days. Our insured local crew inspects multi-building properties with zero tenant bother. Can I stop by Thursday to give you a free photo check?"',
          replySender: 'DANA STERLING (CRESTVIEW MANAGEMENT) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-218635 • 2410 Gruene Rd, New Braunfels, TX 78130',
          replyBody:
            '"Hi Jack - we do need a baseline roof photo report on Buildings B and C at Oakridge Commons. Can you meet our manager on site Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana - locked in for Thursday at 9:00 AM at 2410 Gruene Rd. We will inspect Buildings B and C and bring a clean photo report. - Jack Williams'
        },
        3: {
          pill: 'HOME REMODEL PERMIT • OWNER MATCHED',
          headline: '1140 Whispering Pines Ln - Full Roof & Addition',
          submeta: 'Address: 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          why: 'Why it matters: $940,000 home remodel permit. Reach the homeowner directly with zero $150 shared lead fees.',
          contact: 'Robert & Elena Harrison • Homeowners',
          draft:
            '"Hi Robert - I saw the city permit approved this week for your home remodel at 1140 Whispering Pines Ln. Our local crew matches new roof additions to your main house with a leak-free guarantee. Would you be open to a quick 10-minute quote walk this week?"',
          replySender: 'ROBERT HARRISON (HOMEOWNER) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Jack - yes, we want the new roof section to match the rest of our home. Can you bring color samples by 1140 Whispering Pines Ln Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert - see you Thursday at 9:00 AM with color samples and a written quote. - Jack Williams'
        }
      }
    },
    hvac: {
      tradeLabel: 'HOME & COMMERCIAL REMODELS',
      featuredTypeBadge: 'NEW REMODEL PERMIT • FILED YESTERDAY',
      featuredWhy:
        'This remodel permit was just filed. Reach the builder or owner weeks before competitors hear about it.',
      featuredDraft:
        '"Hey Marcus - I saw the $240,000 commercial remodel permit filed for 1420 Industrial Pkwy in New Braunfels. Our licensed local crew just finished a similar job two miles away off FM 306. We have an opening next month and would love to give you a fast quote. Can I send our license and pricing today? - Carlos Mendez"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 REMODEL',
          headline: '$240,000 Commercial Building Remodel',
          submeta: 'Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          why: 'Why it matters: $1,850,000 commercial building needing licensed local remodel crews next month.',
          contact: 'Marcus Vance • Project Manager @ Apex Builders',
          draft:
            '"Hey Marcus - I saw the $240,000 remodel permit filed for 1420 Industrial Pkwy in New Braunfels. Our licensed crew just finished a commercial build two miles away off FM 306. Can I send over our license and quote sheet today?"',
          replySender: 'MARCUS VANCE (APEX BUILDERS) - SAMPLE REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, New Braunfels, TX 78130',
          replyBody:
            '"Hey Carlos - we are still taking quotes for 1420 Industrial Pkwy. Can you walk the building with me Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus - locking us in for Thursday at 9:00 AM at 1420 Industrial Pkwy with our license and insurance. - Carlos Mendez'
        },
        2: {
          pill: 'NEW PROPERTY OWNER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons - Full Property Upgrade',
          submeta: 'Address: 2410 Gruene Rd, New Braunfels, TX 78130',
          why: 'Why it matters: $14,200,000 property sale looking for fast, reliable local service crews.',
          contact: 'Dana Sterling • Property Director @ Crestview Management',
          draft:
            '"Hi Dana - congrats on buying Oakridge Commons at 2410 Gruene Rd in New Braunfels. New property owners usually line up dependable local crews right away. Can I stop by Thursday to leave our service rates?"',
          replySender: 'DANA STERLING (CRESTVIEW MANAGEMENT) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-218635 • 2410 Gruene Rd, New Braunfels, TX 78130',
          replyBody:
            '"Hi Carlos - we need a fast local shop for ongoing repairs at Oakridge Commons. Can you walk the property Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana - Thursday at 9:00 AM at 2410 Gruene Rd works great. Bringing our insurance and rate sheet. - Carlos Mendez'
        },
        3: {
          pill: 'HOME REMODEL PERMIT • OWNER MATCHED',
          headline: '1140 Whispering Pines Ln - Major Home Remodel',
          submeta: 'Address: 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          why: 'Why it matters: $940,000 home remodel permit. Reach the owner directly before anyone else.',
          contact: 'Robert & Elena Harrison • Homeowners',
          draft:
            '"Hi Robert - I saw the city permit approved this week for your remodel at 1140 Whispering Pines Ln. Our licensed local team works clean and stays on schedule. Would you be open to a quick 10-minute quote walk this week?"',
          replySender: 'ROBERT HARRISON (HOMEOWNER) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Carlos - yes, we are still getting quotes for the new addition. Can you meet us at 1140 Whispering Pines Ln Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert - locked in for Thursday at 9:00 AM at 1140 Whispering Pines Ln. - Carlos Mendez'
        }
      }
    },
    pools: {
      tradeLabel: 'HOME REMODELS',
      featuredTypeBadge: 'NEW HOME REMODEL PERMIT • OWNER MATCHED',
      featuredWhy:
        'High-dollar home remodel permits let you reach homeowners directly without $150 shared lead fees.',
      featuredDraft:
        '"Hi Robert - I saw the city permit approved this week for your home remodel at 1140 Whispering Pines Ln. Our local crew has built dozens of projects in New Braunfels and keeps every yard clean. Would you be open to a quick 10-minute quote walk this week? - Luke Mercer"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 EXTERIOR JOB',
          headline: '$240,000 Commercial Exterior Upgrade',
          submeta: 'Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          why: 'Why it matters: $1,850,000 commercial parcel needing outside site work before opening.',
          contact: 'Marcus Vance • Project Manager @ Apex Builders',
          draft:
            '"Hey Marcus - I saw the $240,000 permit filed for 1420 Industrial Pkwy in New Braunfels. Our local crew just wrapped a commercial job two miles away off FM 306. Can I send over our license and quote numbers today?"',
          replySender: 'MARCUS VANCE (APEX BUILDERS) - SAMPLE REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, New Braunfels, TX 78130',
          replyBody:
            '"Hey Luke - yes, we still need pricing on the outside work at 1420 Industrial Pkwy. Can you walk the site Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus - Thursday at 9:00 AM at 1420 Industrial Pkwy works great. Bringing our insurance and pricing sheet. - Luke Mercer'
        },
        2: {
          pill: 'NEW PROPERTY OWNER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons - Courtyard & Exterior Upgrade',
          submeta: 'Address: 2410 Gruene Rd, New Braunfels, TX 78130',
          why: 'Why it matters: $14,200,000 property sale upgrading outdoor common areas this quarter.',
          contact: 'Dana Sterling • Property Director @ Crestview Management',
          draft:
            '"Hi Dana - congrats on buying Oakridge Commons at 2410 Gruene Rd in New Braunfels. New owners often refresh outdoor tenant areas during the first 30 days. Can I stop by Thursday to leave a quick quote?"',
          replySender: 'DANA STERLING (CRESTVIEW MANAGEMENT) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-218635 • 2410 Gruene Rd, New Braunfels, TX 78130',
          replyBody:
            '"Hi Luke - we are planning to upgrade the main courtyard at Oakridge Commons soon. Can you meet on site Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana - locked in for Thursday at 9:00 AM at 2410 Gruene Rd to measure and bring a quote. - Luke Mercer'
        },
        3: {
          pill: 'HOME REMODEL PERMIT • OWNER MATCHED',
          headline: '1140 Whispering Pines Ln - Backyard & Home Remodel',
          submeta: 'Address: 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          why: 'Why it matters: $940,000 home on 1.4 acres in New Braunfels. Zero shared lead competition.',
          contact: 'Robert & Elena Harrison • Homeowners',
          draft:
            '"Hi Robert - I saw the city permit approved this week for your home remodel at 1140 Whispering Pines Ln. Our local crew coordinates cleanly with your build schedule so nothing gets delayed. Would you be open to a quick 10-minute site walk this week?"',
          replySender: 'ROBERT HARRISON (HOMEOWNER) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Luke - we want to start the backyard work right after the addition wraps up. Can you walk the yard Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert - Thursday at 9:00 AM at 1140 Whispering Pines Ln works great. Bringing photos of recent neighborhood jobs. - Luke Mercer'
        }
      }
    },
    b2b: {
      tradeLabel: 'PROPERTY SALES',
      featuredTypeBadge: 'COMMERCIAL PROPERTY SALE • NEW OWNER RECORD',
      featuredWhy:
        'When a commercial building sells, the new manager hires fresh local contractors within 30 days.',
      featuredDraft:
        '"Hi Dana - congrats on buying Oakridge Commons at 2410 Gruene Rd in New Braunfels. New property managers usually review local service contractors right after closing. Our insured crew handles ongoing building upkeep with fast response times. Can I drop off our rate sheet Thursday? - Cole Mercer"',
      cards: {
        1: {
          pill: 'PERMIT #BP-2026-08941 • $240,000 COMMERCIAL JOB',
          headline: '$240,000 Commercial Building Finish-Out',
          submeta: 'Address: 1420 Industrial Pkwy, Suite B, New Braunfels, TX 78130',
          why: 'Why it matters: Every commercial build needs reliable local crews before final city sign-off.',
          contact: 'Marcus Vance • Project Manager @ Apex Builders',
          draft:
            '"Hey Marcus - I saw the $240,000 building permit filed for 1420 Industrial Pkwy in New Braunfels. Our insured crew just wrapped a large commercial job two miles away off FM 306. Can I send over our commercial rate sheet today?"',
          replySender: 'MARCUS VANCE (APEX BUILDERS) - SAMPLE REPLY',
          replyMeta: 'Permit #BP-2026-08941 • 1420 Industrial Pkwy, New Braunfels, TX 78130',
          replyBody:
            '"Hey Cole - we always need dependable local crews before final walkthroughs. Can you walk 1420 Industrial Pkwy this Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hey Marcus - locking us in for Thursday at 9:00 AM at 1420 Industrial Pkwy with our rate sheet and insurance. - Cole Mercer'
        },
        2: {
          pill: 'NEW PROPERTY OWNER • 140-UNIT COMPLEX',
          headline: 'Oakridge Commons - Annual Property Upkeep',
          submeta: 'Address: 2410 Gruene Rd, New Braunfels, TX 78130',
          why: 'Why it matters: $14,200,000 property sale. One annual contract covers $199/mo Owner Radar for years.',
          contact: 'Dana Sterling • Property Director @ Crestview Management',
          draft:
            '"Hi Dana - congrats on buying the 140-unit Oakridge Commons property at 2410 Gruene Rd in New Braunfels. New managers usually review outside service contractors during the first month. Can I swing by Thursday to leave a simple monthly service quote?"',
          replySender: 'DANA STERLING (CRESTVIEW MANAGEMENT) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-218635 • 2410 Gruene Rd, New Braunfels, TX 78130',
          replyBody:
            '"Hi Cole - we are taking fresh bids for outside building upkeep at Oakridge Commons. Can you walk the property with me Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Dana - Thursday at 9:00 AM at 2410 Gruene Rd works great. Bringing our insurance and monthly pricing. - Cole Mercer'
        },
        3: {
          pill: 'HOME REMODEL PERMIT • OWNER MATCHED',
          headline: '1140 Whispering Pines Ln - Large Home Project',
          submeta: 'Address: 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          why: 'Why it matters: $940,000 home remodel needing exterior cleanup and ongoing care.',
          contact: 'Robert & Elena Harrison • Homeowners',
          draft:
            '"Hi Robert - I saw the city permit approved this week for your home remodel at 1140 Whispering Pines Ln. Our local team handles exterior detailing and ongoing property care across New Braunfels. Would you be open to a quick 10-minute quote walk this week?"',
          replySender: 'ROBERT HARRISON (HOMEOWNER) - SAMPLE REPLY',
          replyMeta: 'Parcel #78130-90418A • 1140 Whispering Pines Ln, New Braunfels, TX 78130',
          replyBody:
            '"Hi Cole - we will definitely need a full outside cleanup once the remodel wraps up. Can you stop by Thursday at 9:00 AM?"',
          suggestedFollowUp:
            'Hi Robert - Thursday at 9:00 AM at 1140 Whispering Pines Ln works great. - Cole Mercer'
        }
      }
    }
  };

  let currentTradeKey = 'concrete';
  let activeConversationCardIndex = 1;
  const approvedCardsState = { 1: false, 2: false, 3: false };

  function setWorkflowActiveStep(stepNum) {
    for (let i = 1; i <= 6; i++) {
      const pill = document.getElementById(`workflow-step-pill-${i}`);
      if (!pill) continue;
      if (i <= stepNum) {
        pill.className = 'p-3 rounded-md bg-blue-600/20 border border-blue-500 text-white transition-all';
      } else {
        pill.className = 'p-3 rounded-md bg-slate-900 border border-slate-800 text-slate-300 transition-all';
      }
    }
  }

  function updateFeaturedCardUI(tradeKey) {
    const data = TRADE_DEMO_DATA[tradeKey] || TRADE_DEMO_DATA.concrete;
    const c1 = data.cards[1];

    const typeBadgeEl = document.getElementById('featured-card-type-badge');
    const titleEl = document.getElementById('featured-card-title');
    const pillEl = document.getElementById('featured-card-permit-pill');
    const whyEl = document.getElementById('featured-card-why');
    const draftEl = document.getElementById('featured-card-draft');

    if (typeBadgeEl) typeBadgeEl.textContent = data.featuredTypeBadge;
    if (titleEl) titleEl.textContent = c1.headline;
    if (pillEl) pillEl.textContent = c1.pill;
    if (whyEl) whyEl.textContent = data.featuredWhy;
    if (draftEl) draftEl.textContent = data.featuredDraft;

    document.querySelectorAll('.featured-trade-btn').forEach((btn) => {
      const isSelected = btn.getAttribute('data-featured-trade') === tradeKey;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function updateDemoConversationPreview(cardIdx) {
    activeConversationCardIndex = cardIdx;
    const data = TRADE_DEMO_DATA[currentTradeKey] || TRADE_DEMO_DATA.concrete;
    const cardData = data.cards[cardIdx] || data.cards[1];

    const customDraftEl = document.getElementById(`card-${cardIdx}-draft`);
    const outboundText = customDraftEl
      ? customDraftEl.textContent.trim().replace(/^"|"$/g, '')
      : cardData.draft.replace(/^"|"$/g, '');

    const titleEl = document.getElementById('demo-conv-thread-title');
    const metaEl = document.getElementById('demo-conv-thread-meta');
    const outboundEl = document.getElementById('demo-conv-outbound-body');
    const inboundSenderEl = document.getElementById('demo-conv-inbound-sender');
    const inboundBodyEl = document.getElementById('demo-conv-inbound-body');
    const replyInputEl = document.getElementById('demo-conv-reply-input');
    const followUpBubbleEl = document.getElementById('demo-conv-followup-bubble');
    const sendFeedbackEl = document.getElementById('demo-conv-send-feedback');

    if (titleEl) titleEl.textContent = cardData.contact;
    if (metaEl) metaEl.textContent = cardData.replyMeta;
    if (outboundEl) outboundEl.textContent = outboundText;
    if (inboundSenderEl) inboundSenderEl.textContent = cardData.replySender;
    if (inboundBodyEl) inboundBodyEl.textContent = cardData.replyBody;
    if (replyInputEl) replyInputEl.value = cardData.suggestedFollowUp;
    if (followUpBubbleEl) followUpBubbleEl.classList.add('hidden');
    if (sendFeedbackEl) sendFeedbackEl.classList.add('hidden');
  }

  function applyTradeToDemoCards(tradeKey) {
    currentTradeKey = TRADE_DEMO_DATA[tradeKey] ? tradeKey : 'concrete';
    const data = TRADE_DEMO_DATA[currentTradeKey];

    updateFeaturedCardUI(currentTradeKey);

    document.querySelectorAll('.trade-pill-btn').forEach((btn) => {
      const isSelected = btn.getAttribute('data-trade') === currentTradeKey;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    [1, 2, 3].forEach((idx) => {
      const c = data.cards[idx];
      if (!c) return;
      const pillEl = document.getElementById(`card-${idx}-pill`);
      const headlineEl = document.getElementById(`card-${idx}-headline`);
      const submetaEl = document.getElementById(`card-${idx}-submeta`);
      const whyEl = document.getElementById(`card-${idx}-why`);
      const contactEl = document.getElementById(`card-${idx}-contact`);
      const draftEl = document.getElementById(`card-${idx}-draft`);
      const editorEl = document.getElementById(`card-${idx}-editor`);

      if (pillEl) pillEl.textContent = c.pill;
      if (headlineEl) headlineEl.textContent = c.headline;
      if (submetaEl) submetaEl.textContent = c.submeta;
      if (whyEl) whyEl.innerHTML = `<strong class="text-white">Why it matters:</strong> ${c.why.replace(/^Why it matters:\s*/i, '')}`;
      if (contactEl) contactEl.textContent = c.contact;
      if (draftEl) {
        draftEl.textContent = c.draft;
        draftEl.classList.remove('hidden');
      }
      if (editorEl) {
        editorEl.value = c.draft;
        editorEl.classList.add('hidden');
      }
    });

    updateDemoConversationPreview(activeConversationCardIndex);
  }

  // Bind Featured Card trade switcher buttons
  document.querySelectorAll('.featured-trade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tradeKey = btn.getAttribute('data-featured-trade') || 'concrete';
      applyTradeToDemoCards(tradeKey);
    });
  });

  // Bind Interactive Demo trade calibration buttons
  document.querySelectorAll('.trade-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tradeKey = btn.getAttribute('data-trade') || 'concrete';
      applyTradeToDemoCards(tradeKey);
      setWorkflowActiveStep(2);
    });
  });

  // Bind Inline Draft Editor buttons on Sample Cards 1, 2, 3
  document.querySelectorAll('.demo-edit-draft-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-edit-card');
      const draftEl = document.getElementById(`card-${idx}-draft`);
      const editorEl = document.getElementById(`card-${idx}-editor`);
      if (!draftEl || !editorEl) return;

      const isEditing = !editorEl.classList.contains('hidden');
      if (isEditing) {
        draftEl.textContent = editorEl.value.trim() || draftEl.textContent;
        editorEl.classList.add('hidden');
        draftEl.classList.remove('hidden');
        btn.textContent = '✎ Edit Draft';
        setWorkflowActiveStep(5);
      } else {
        editorEl.value = draftEl.textContent.trim();
        draftEl.classList.add('hidden');
        editorEl.classList.remove('hidden');
        editorEl.focus();
        btn.textContent = '✓ Save Draft';
        setWorkflowActiveStep(4);
      }
    });
  });

  function updateApprovedCounterUI() {
    const count = Object.values(approvedCardsState).filter(Boolean).length;
    const counterEl = document.getElementById('demo-approved-counter');
    if (counterEl) {
      counterEl.textContent = `Sample Cards Approved: ${count}/3`;
    }
  }

  // Bind 1-Tap Approve & Move to Conversation Room buttons
  document.querySelectorAll('[data-approve-card]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-approve-card') || 1);
      const editorEl = document.getElementById(`card-${idx}-editor`);
      const draftEl = document.getElementById(`card-${idx}-draft`);
      if (editorEl && !editorEl.classList.contains('hidden') && draftEl) {
        draftEl.textContent = editorEl.value.trim() || draftEl.textContent;
        editorEl.classList.add('hidden');
        draftEl.classList.remove('hidden');
      }

      approvedCardsState[idx] = true;
      updateApprovedCounterUI();

      const actionsEl = document.getElementById(`card-${idx}-actions`);
      const dispatchedEl = document.getElementById(`card-${idx}-dispatched`);
      if (actionsEl) actionsEl.classList.add('hidden');
      if (dispatchedEl) dispatchedEl.classList.remove('hidden');

      setWorkflowActiveStep(6);
      updateDemoConversationPreview(idx);

      const convStageEl = document.getElementById('demo-conversation-room-stage');
      if (convStageEl) {
        convStageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Bind Featured Centerpiece Card CTA to trigger Step 6 Conversation Flow preview
  const featuredCardDemoCta = document.getElementById('featured-card-demo-cta');
  if (featuredCardDemoCta) {
    featuredCardDemoCta.addEventListener('click', () => {
      setWorkflowActiveStep(5);
      updateDemoConversationPreview(1);
    });
  }

  // Bind Reset Demo Button
  const resetDemoBtn = document.getElementById('reset-demo-btn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      [1, 2, 3].forEach((idx) => {
        approvedCardsState[idx] = false;
        const actionsEl = document.getElementById(`card-${idx}-actions`);
        const dispatchedEl = document.getElementById(`card-${idx}-dispatched`);
        if (actionsEl) actionsEl.classList.remove('hidden');
        if (dispatchedEl) dispatchedEl.classList.add('hidden');
      });
      updateApprovedCounterUI();
      applyTradeToDemoCards(currentTradeKey);
      setWorkflowActiveStep(1);
    });
  }

  // Bind Step 6 Conversation Room Reply Composer buttons
  const demoConvDraftWalkBtn = document.getElementById('demo-conv-draft-walk-btn');
  const demoConvReplyInput = document.getElementById('demo-conv-reply-input');
  const demoConvSendReplyBtn = document.getElementById('demo-conv-send-reply-btn');
  const demoConvFollowupBubble = document.getElementById('demo-conv-followup-bubble');
  const demoConvFollowupSentText = document.getElementById('demo-conv-followup-sent-text');
  const demoConvSendFeedback = document.getElementById('demo-conv-send-feedback');
  const demoConvStatusPill = document.getElementById('demo-conv-status-pill');

  if (demoConvDraftWalkBtn && demoConvReplyInput) {
    demoConvDraftWalkBtn.addEventListener('click', () => {
      const data = TRADE_DEMO_DATA[currentTradeKey] || TRADE_DEMO_DATA.concrete;
      const cardData = data.cards[activeConversationCardIndex] || data.cards[1];
      demoConvReplyInput.value = cardData.suggestedFollowUp;
      demoConvReplyInput.focus();
    });
  }

  if (demoConvSendReplyBtn && demoConvReplyInput) {
    demoConvSendReplyBtn.addEventListener('click', () => {
      const text = demoConvReplyInput.value.trim();
      if (!text) return;
      if (demoConvFollowupSentText) {
        demoConvFollowupSentText.textContent = text;
      }
      if (demoConvFollowupBubble) {
        demoConvFollowupBubble.classList.remove('hidden');
      }
      if (demoConvSendFeedback) {
        demoConvSendFeedback.classList.remove('hidden');
      }
      if (demoConvStatusPill) {
        demoConvStatusPill.textContent = '📅 SITE WALK BOOKED - THU 9:00 AM (DEMO)';
        demoConvStatusPill.className =
          'px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-400/40 font-mono-telemetry text-[11px] text-emerald-300 font-bold';
      }
    });
  }

  /* ==========================================================================
     3. LIVE TERRITORY ZIP CODE AVAILABILITY CHECKER (/api/recon/availability)
        + DYNAMIC STRIPE ?client_reference_id= WIRING
     ========================================================================== */
  const zipCheckerForm = document.getElementById('zip-checker-form');
  const zipCheckerTrade = document.getElementById('zip-checker-trade');
  const zipCheckerInput = document.getElementById('zip-checker-input');
  const zipCheckerResult = document.getElementById('zip-checker-result');
  const zipCheckerStatusText = document.getElementById('zip-checker-status-text');

  const STRIPE_PAYMENT_LINKS = {
    'tier-1-checkout-link': 'https://buy.stripe.com/28EfZi0hZedt52KezH2sM0x',
    'tier-2-checkout-link': 'https://buy.stripe.com/7sYaEY3ubglB2UCfDL2sM0y',
    'tier-3-checkout-link': 'https://buy.stripe.com/4gM3cw9Szedtan4bnv2sM0z',
    'briefing-tier-1-checkout-link': 'https://buy.stripe.com/28EfZi0hZedt52KezH2sM0x',
    'briefing-tier-2-checkout-link': 'https://buy.stripe.com/7sYaEY3ubglB2UCfDL2sM0y',
    'briefing-tier-3-checkout-link': 'https://buy.stripe.com/4gM3cw9Szedtan4bnv2sM0z'
  };

  function syncStripeClientReferenceIds(zip, trade) {
    const safeZip = (String(zip || '78130').match(/\b\d{5}\b/) || ['78130'])[0];
    const safeTradeSlug = String(trade || 'Commercial_Concrete')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'Commercial_Concrete';
    const refId = `${safeZip}_${safeTradeSlug}`;

    document.querySelectorAll('a[data-stripe-base]').forEach((link) => {
      const canonicalBase = STRIPE_PAYMENT_LINKS[link.id] || link.getAttribute('data-stripe-base');
      if (canonicalBase) {
        link.setAttribute('data-stripe-base', canonicalBase);
        link.href = `${canonicalBase}?client_reference_id=${encodeURIComponent(refId)}`;
      }
    });

    const t1Label = document.getElementById('tier-1-checkout-label');
    const t2Label = document.getElementById('tier-2-checkout-label');
    const t3Label = document.getElementById('tier-3-checkout-label');
    if (t1Label) t1Label.textContent = `Start $199/Mo Trial in ${safeZip} →`;
    if (t2Label) t2Label.textContent = `Lock Zip ${safeZip} ($399/Mo Trial) →`;
    if (t3Label) t3Label.textContent = `Lock Exclusive Zip ${safeZip} ($599/Mo) →`;
  }

  syncStripeClientReferenceIds(
    zipCheckerInput ? zipCheckerInput.value : '78130',
    zipCheckerTrade ? zipCheckerTrade.value : 'Commercial Concrete'
  );

  if (zipCheckerTrade) {
    zipCheckerTrade.addEventListener('change', () => {
      const rawZip = zipCheckerInput ? zipCheckerInput.value.trim() : '78130';
      syncStripeClientReferenceIds(rawZip, zipCheckerTrade.value);
    });
  }
  if (zipCheckerInput) {
    zipCheckerInput.addEventListener('input', () => {
      const tradeVal = zipCheckerTrade ? zipCheckerTrade.value : 'Commercial Concrete';
      if (/\b\d{5}\b/.test(zipCheckerInput.value)) {
        syncStripeClientReferenceIds(zipCheckerInput.value, tradeVal);
      }
    });
  }

  if (zipCheckerForm) {
    zipCheckerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawZip = zipCheckerInput ? zipCheckerInput.value.trim() : '78130';
      const trade = zipCheckerTrade ? zipCheckerTrade.value : 'Commercial Concrete';
      const cleanZip = (rawZip.match(/\b\d{5}\b/) || ['78130'])[0];

      syncStripeClientReferenceIds(cleanZip, trade);

      if (zipCheckerStatusText) {
        zipCheckerStatusText.textContent = `Checking open slots in ${cleanZip}...`;
      }

      try {
        const resp = await fetch(
          `/api/recon/availability?zip=${encodeURIComponent(cleanZip)}&trade=${encodeURIComponent(
            trade
          )}&tier=${encodeURIComponent('Tier 2: Commercial Permits')}`
        );
        const data = await resp.json();
        if (data && data.ok && zipCheckerStatusText && zipCheckerResult) {
          if (data.isAvailable) {
            zipCheckerResult.className =
              'mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs';
            zipCheckerStatusText.className = 'font-mono-telemetry text-emerald-300 font-bold';
            zipCheckerStatusText.textContent = `✓ ZIP ${data.zipCode} (${data.city}) IS OPEN - Start your 7-day free trial below`;
          } else {
            zipCheckerResult.className =
              'mt-3 p-3 rounded-lg bg-amber-950/50 border border-amber-500/50 flex flex-wrap items-center justify-between gap-2 text-xs';
            zipCheckerStatusText.className = 'font-mono-telemetry text-amber-300 font-bold';
            zipCheckerStatusText.textContent = `🔒 ZIP ${data.zipCode} SOLD OUT - Nearby open zip codes: 78130, 78132, 78258`;
          }
          return;
        }
      } catch (_err) {
        // Fallback if offline
      }

      if (zipCheckerStatusText && zipCheckerResult) {
        if (cleanZip === '79999') {
          zipCheckerResult.className =
            'mt-3 p-3 rounded-lg bg-amber-950/50 border border-amber-500/50 flex flex-wrap items-center justify-between gap-2 text-xs';
          zipCheckerStatusText.className = 'font-mono-telemetry text-amber-300 font-bold';
          zipCheckerStatusText.textContent =
            '🔒 ZIP 79999 SOLD OUT - Nearby open zip codes: 78130, 78132, 78258';
        } else {
          zipCheckerResult.className =
            'mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs';
          zipCheckerStatusText.className = 'font-mono-telemetry text-emerald-300 font-bold';
          zipCheckerStatusText.textContent = `✓ ZIP ${cleanZip} IS OPEN - Lock your 7-day free trial below`;
        }
      }
    });
  }

  /* ==========================================================================
     4. 16:9 EXECUTIVE VIDEO OVERVIEW PLAYER & 21ST.DEV ("G3") VISUAL ENGINE
     ========================================================================== */
  const videoPlayerCard = document.getElementById('hero-video-player-card');
  const videoPosterView = document.getElementById('hero-video-poster-view');
  const heroOverviewVideo = document.getElementById('hero-overview-video');

  function openVideoWalkthrough() {
    if (!videoPlayerCard || !videoPosterView) return;
    if (heroOverviewVideo) {
      videoPosterView.classList.add('hidden');
      heroOverviewVideo.controls = true;
      const playPromise = heroOverviewVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }
  }

  if (heroOverviewVideo) {
    heroOverviewVideo.addEventListener('play', () => {
      if (videoPosterView) videoPosterView.classList.add('hidden');
      heroOverviewVideo.controls = true;
    });
  }

  if (videoPlayerCard) {
    videoPlayerCard.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (videoPosterView && videoPosterView.classList.contains('hidden')) return;
      openVideoWalkthrough();
    });
  }

  function initG3VisualEngine() {
    document.documentElement.classList.add('dark');
    if (document.body) {
      document.body.classList.add('g-root', 'g3-root');
    }

    // 4A. Scroll-Into-View Entrance Animation & 3D Scroll-Tilted Stage (--tilt-progress)
    const videoScrollStage = document.getElementById('hero-video-scroll-stage');
    const videoShowcaseShell = videoScrollStage ? videoScrollStage.querySelector('.video-showcase-shell') : null;

    if (videoScrollStage) {
      if ('IntersectionObserver' in window) {
        const videoRevealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                videoScrollStage.classList.add('is-in-view');
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        videoRevealObserver.observe(videoScrollStage);
      } else {
        videoScrollStage.classList.add('is-in-view');
      }
    }

    function syncHeroTilt() {
      const targetEl = videoShowcaseShell || videoPlayerCard;
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.14) / (vh * 0.72)));
      const eased = 0.25 + raw * 0.75;
      targetEl.style.setProperty('--tilt-progress', eased.toFixed(3));
      if (videoScrollStage && rect.top < vh * 0.88 && rect.bottom > 0) {
        videoScrollStage.classList.add('is-in-view');
      }
    }
    window.addEventListener('scroll', syncHeroTilt, { passive: true });
    syncHeroTilt();

    // 4B. Authentic 21st.dev WebGL1 'silk' Fragment Shader (OKLab + Film Grain)
    const VERT_SRC = [
      'attribute vec2 a_pos;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_pos * 0.5 + 0.5;',
      '  gl_Position = vec4(a_pos, 0.0, 1.0);',
      '}'
    ].join('\n');

    const FRAG_SRC = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform float u_time;',
      'uniform vec2 u_res;',
      'uniform vec3 u_c0;',
      'uniform vec3 u_c1;',
      'uniform vec3 u_c2;',
      'uniform vec3 u_c3;',
      '',
      'vec3 rgb2oklab(vec3 c) {',
      '  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;',
      '  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;',
      '  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;',
      '  float l_ = pow(max(l, 0.0), 1.0 / 3.0);',
      '  float m_ = pow(max(m, 0.0), 1.0 / 3.0);',
      '  float s_ = pow(max(s, 0.0), 1.0 / 3.0);',
      '  return vec3(',
      '    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,',
      '    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,',
      '    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_',
      '  );',
      '}',
      '',
      'vec3 oklab2rgb(vec3 c) {',
      '  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;',
      '  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;',
      '  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;',
      '  float l = l_ * l_ * l_;',
      '  float m = m_ * m_ * m_;',
      '  float s = s_ * s_ * s_;',
      '  return vec3(',
      '    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,',
      '    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,',
      '    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s',
      '  );',
      '}',
      '',
      'vec3 mixOklab(vec3 a, vec3 b, float t) {',
      '  return oklab2rgb(mix(rgb2oklab(a), rgb2oklab(b), clamp(t, 0.0, 1.0)));',
      '}',
      '',
      'vec3 paletteOklab(float t) {',
      '  t = clamp(t, 0.0, 1.0);',
      '  if (t < 0.333) return mixOklab(u_c0, u_c1, t * 3.0);',
      '  if (t < 0.666) return mixOklab(u_c1, u_c2, (t - 0.333) * 3.0);',
      '  return mixOklab(u_c2, u_c3, (t - 0.666) * 3.0);',
      '}',
      '',
      'float grainHash(vec2 p) {',
      '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
      '  p3 += dot(p3, p3.yzx + 33.33);',
      '  return fract((p3.x + p3.y) * p3.z);',
      '}',
      '',
      'void main() {',
      '  vec2 uv = v_uv;',
      '  float aspect = u_res.x / max(u_res.y, 1.0);',
      '  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);',
      '  float t = u_time * 0.35;',
      '  vec2 u = p * 1.15;',
      '  float s = sin(u.x * 3.0 + u.y * 2.0 + t * 1.1 + sin(u.y * 5.0 - t) * 0.6);',
      '  float s2 = cos(u.x * 2.0 - u.y * 4.0 + t * 0.7 + s * 0.8);',
      '  float v = s * 0.5 + s2 * 0.5;',
      '  float h = smoothstep(-0.85, 0.85, v);',
      '  float sheen = pow(max(0.0, 1.0 - abs(v)), 4.0);',
      '  vec3 col = paletteOklab(h * 0.82) + u_c3 * sheen * 0.32;',
      '  float g = (grainHash(gl_FragCoord.xy + fract(t) * 100.0) - 0.5) * 0.025;',
      '  gl_FragColor = vec4(clamp(col + g, 0.0, 1.0), 1.0);',
      '}'
    ].join('\n');

    function mountSilkShader(canvas) {
      const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
      if (!gl) return;

      function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
        return sh;
      }

      const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
      if (!vs || !fs) return;

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uRes = gl.getUniformLocation(prog, 'u_res');
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c0'), 0.02, 0.02, 0.03);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c1'), 0.0, 0.063, 0.247);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c2'), 0.0, 0.204, 1.0);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c3'), 0.31, 0.435, 1.0);

      let isVisible = true;
      const start = performance.now();

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr * 0.65));
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr * 0.65));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }

      resize();
      window.addEventListener('resize', resize, { passive: true });

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
          });
        });
        io.observe(canvas);
      }

      function render(now) {
        if (isVisible) {
          resize();
          gl.uniform1f(uTime, (now - start) * 0.001);
          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    document.querySelectorAll('canvas[data-g3-shader="silk"]').forEach(mountSilkShader);

    // 4C. 21st.dev Canvas 2D Pixel-Grid Wordmark Footer
    function renderPixelFooter(canvas) {
      const word = canvas.getAttribute('data-pixel-word') || 'TIBERIUS RECON';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, canvas.clientWidth || 1100);
      const h = Math.max(80, canvas.clientHeight || 100);
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const off = document.createElement('canvas');
      const cell = w < 640 ? 4 : 5;
      const cols = Math.floor(w / cell);
      const rows = Math.floor(h / cell);
      off.width = cols;
      off.height = rows;
      const octx = off.getContext('2d');
      if (!octx) return;

      octx.fillStyle = '#000';
      octx.fillRect(0, 0, cols, rows);
      octx.fillStyle = '#fff';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      const fontSize = Math.min(rows * 0.78, (cols / (word.length * 0.62)));
      octx.font = `800 ${fontSize}px "General Sans", "Inter", sans-serif`;
      octx.fillText(word, cols / 2, rows / 2);

      const data = octx.getImageData(0, 0, cols, rows).data;
      for (let y = 0; y < rows; y++) {
        const vFade = 1 - (y / rows) * 0.75;
        for (let x = 0; x < cols; x++) {
          const alpha = data[(y * cols + x) * 4];
          if (alpha > 90) {
            const isCobalt = (x + y) % 5 === 0;
            ctx.fillStyle = isCobalt
              ? `rgba(79, 111, 255, ${(0.58 * vFade).toFixed(2)})`
              : `rgba(244, 244, 245, ${(0.28 * vFade).toFixed(2)})`;
            ctx.fillRect(x * cell, y * cell, cell - 1.2, cell - 1.2);
          }
        }
      }
    }

    const pixelCanvases = Array.from(document.querySelectorAll('canvas.g3-footer-pixel-canvas'));
    pixelCanvases.forEach(renderPixelFooter);
    window.addEventListener('resize', () => pixelCanvases.forEach(renderPixelFooter), { passive: true });
  }

  initG3VisualEngine();
})();
