/**
 * TIBERIUS RECON™ — ENTERPRISE LIGHT-MODE INTERACTIVE ENGINE
 * 1. Sticky Light-Mode Navbar Scroll State & Smooth Anchor Navigation
 * 2. Chapter 1: 16:9 Executive Video Overview Card & "Watch 90-Second Overview ▶" Trigger
 * 3. Chapter 3: 7:00 AM "Silver Platter" Product Showcase (3 Clean White Deal Cards + 1-Tap Send)
 * 4. Chapter 4: Offense + Defense Smart Site Equity Pricing Toggle ($297 / $597 / $897)
 * 5. Chapter 5: Outcome-First FAQ Accordion (Questions #1 & #3 Open by Default)
 * 6. Chapter 6: Single-Card Territory Activation Vault + Live 07:00:00 AM Countdown
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') {
    if (typeof module !== 'undefined') {
      try {
        module.exports = require('./server');
      } catch (_e) {
        // Ignore when located in subfolder
      }
    }
    return;
  }
  if (window.__TIBERIUS_RECON_LIGHT_INITIALIZED__) return;
  window.__TIBERIUS_RECON_LIGHT_INITIALIZED__ = true;

  /* ==========================================================================
     1. STICKY NAVBAR SCROLL STATE & SMOOTH ANCHOR SCROLLING
     ========================================================================== */
  const commandNavbar = document.getElementById('command-navbar');

  function syncNavbarScrollState() {
    if (!commandNavbar) return;
    if (window.scrollY > 16) {
      commandNavbar.classList.add('is-scrolled');
    } else {
      commandNavbar.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', syncNavbarScrollState, { passive: true });
  syncNavbarScrollState();

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

  /* ==========================================================================
     2. CHAPTER 1: 16:9 EXECUTIVE VIDEO OVERVIEW PLAYER CARD
     ========================================================================== */
  const videoPlayerCard = document.getElementById('hero-video-player-card');
  const videoPosterView = document.getElementById('hero-video-poster-view');
  const videoActiveView = document.getElementById('hero-video-active-view');
  const videoCloseBtn = document.getElementById('hero-video-close-btn');
  const heroWatchOverviewBtn = document.getElementById('hero-watch-overview-btn');
  const walkthroughStepBadge = document.getElementById('walkthrough-step-badge');
  const walkthroughStepTitle = document.getElementById('walkthrough-step-title');
  const walkthroughStepDesc = document.getElementById('walkthrough-step-desc');
  const walkthroughStepTelemetry = document.getElementById('walkthrough-step-telemetry');
  const walkthroughStepButtons = Array.from(document.querySelectorAll('[data-walkthrough-step]'));

  const WALKTHROUGH_STEPS = [
    {
      badge: 'STEP 1 OF 3 • 2:00 AM DEEP PORTAL RECON',
      title: '2:00 AM: Overnight Permit Recon While the City Sleeps',
      desc: 'At 2:04 AM, while your trucks are parked for the night, your Tiberius Scout logs into suburban building departments (Accela & EnerGov) and runs recon on every $240,000+ commercial buildout, shell permit, and custom addition filed in the last 24 hours.',
      telemetry: 'LIVE CAPTURE: PERMIT #BP-2026-08941 • $240,000 TI PERMIT • FILED 14 HRS AGO'
    },
    {
      badge: 'STEP 2 OF 3 • 4:30 AM COUNTY TAX ROLL X-RAY',
      title: '4:30 AM: Pulls Parcel ID, Sq Ft & Owner Cell in 14 Seconds',
      desc: 'Your Tiberius Scout runs each street address and parcel ID through the County Appraisal District (CAD) tax roll—verifying the deeded owner, assessed property value, square footage, and direct GC Project Manager or Property Manager cell and work email.',
      telemetry: 'CAD X-RAY MATCH: $940,000 ASSESSED VALUE • 4,120 SQ FT • 1.4 ACRES • VERIFIED OWNER'
    },
    {
      badge: 'STEP 3 OF 3 • 7:00 AM RECON BRIEFING',
      title: '7:00 AM: Pour Your Coffee & Tap Send 3 Times in 90 Seconds',
      desc: 'At 6:45 AM, your Tiberius Scout texts you one link. Three verified recon cards sit on your screen with the permit proof on top and a custom 4-sentence intro written in your voice below. Tap [ ✓ Approve & Send ] and roll out to the job site.',
      telemetry: '07:00:00 AM RECON BRIEFING READY: 3 VERIFIED CARDS • NOTHING SENDS WITHOUT YOUR TAP ✓'
    }
  ];

  let walkthroughTimer = null;

  function renderWalkthroughStep(index) {
    const step = WALKTHROUGH_STEPS[index] || WALKTHROUGH_STEPS[0];
    if (walkthroughStepBadge) walkthroughStepBadge.textContent = step.badge;
    if (walkthroughStepTitle) walkthroughStepTitle.textContent = step.title;
    if (walkthroughStepDesc) walkthroughStepDesc.textContent = step.desc;
    if (walkthroughStepTelemetry) walkthroughStepTelemetry.textContent = step.telemetry;

    walkthroughStepButtons.forEach((btn, idx) => {
      if (idx === index) {
        btn.className =
          'walkthrough-pill px-2.5 py-1 rounded text-[10px] font-mono-telemetry bg-blue-600 text-white cursor-pointer';
      } else {
        btn.className =
          'walkthrough-pill px-2.5 py-1 rounded text-[10px] font-mono-telemetry bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer';
      }
    });
  }

  function openVideoWalkthrough() {
    if (!videoPlayerCard || !videoPosterView || !videoActiveView) return;

    const customVideoSrc = videoPlayerCard.getAttribute('data-video-src');
    if (customVideoSrc && customVideoSrc.trim() !== '') {
      videoPosterView.classList.add('hidden');
      videoActiveView.classList.remove('hidden');
      videoActiveView.innerHTML = `
        <video src="${customVideoSrc}" controls autoplay playsinline class="w-full h-full object-cover rounded-xl"></video>
      `;
      return;
    }

    videoPosterView.classList.add('hidden');
    videoActiveView.classList.remove('hidden');
    let currentStepIdx = 0;
    renderWalkthroughStep(currentStepIdx);

    if (walkthroughTimer) clearInterval(walkthroughTimer);
    walkthroughTimer = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % WALKTHROUGH_STEPS.length;
      renderWalkthroughStep(currentStepIdx);
    }, 5000);
  }

  function closeVideoWalkthrough(e) {
    if (e) e.stopPropagation();
    if (walkthroughTimer) {
      clearInterval(walkthroughTimer);
      walkthroughTimer = null;
    }
    if (videoPosterView && videoActiveView) {
      videoActiveView.classList.add('hidden');
      videoPosterView.classList.remove('hidden');
    }
  }

  if (videoPlayerCard) {
    videoPlayerCard.addEventListener('click', (e) => {
      if (
        e.target.closest('#hero-video-close-btn') ||
        e.target.closest('[data-walkthrough-step]') ||
        e.target.closest('a')
      ) {
        return;
      }
      if (videoActiveView && !videoActiveView.classList.contains('hidden')) {
        return;
      }
      openVideoWalkthrough();
    });

    videoPlayerCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVideoWalkthrough();
      }
    });
  }

  if (heroWatchOverviewBtn) {
    heroWatchOverviewBtn.addEventListener('click', () => {
      if (videoPlayerCard) {
        videoPlayerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      openVideoWalkthrough();
    });
  }

  if (videoCloseBtn) {
    videoCloseBtn.addEventListener('click', closeVideoWalkthrough);
  }

  walkthroughStepButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (walkthroughTimer) {
        clearInterval(walkthroughTimer);
        walkthroughTimer = null;
      }
      const stepIdx = parseInt(btn.getAttribute('data-walkthrough-step') || '0', 10);
      renderWalkthroughStep(stepIdx);
    });
  });

  /* ==========================================================================
     3. CHAPTER 3: CLEAN 7:00 AM "SILVER PLATTER" PRODUCT SHOWCASE
        (3 Clean White Deal Cards + 1-Tap Approve & Send Confirmation)
     ========================================================================== */
  const MORNING_DEAL_CARDS = [
    {
      id: 'deal-1',
      cardNumber: 'CARD 01 • COMMERCIAL PERMIT',
      unlockedBadge: 'UNLOCKED #1',
      pillText: 'FILED 14 HRS AGO • $240,000 TI PERMIT',
      pillClass: 'bg-[#FEF3C7] border-amber-300 text-[#D97706]',
      pillIcon: '⚡',
      headline: '18,500 Sq Ft Commercial Buildout & Dock Apron',
      subMeta: 'Permit Address: 4820 Industrial Pkwy, Suite B • Municipal Accela Portal #BP-2026-08941',
      cadCallout: null,
      contactHeader: 'VERIFIED GC PROJECT MANAGER:',
      contactName: 'Marcus Vance • Sr. PM @ Apex Commercial Builders',
      contactShort: 'Marcus Vance (Apex Commercial Builders)',
      contactMeta: 'Direct Work Email + Cell Verified • 3.8 Miles From Your Shop',
      draftLabel: '4-SENTENCE BID INTRO (YOUR VOICE):',
      draftBody:
        '"Hey Marcus — saw the $240,000 commercial TI buildout permit filed yesterday at 4820 Industrial Pkwy. Our commercial crew just wrapped a 22,000 sq ft project two miles east on Commerce Dr and passed city inspection ahead of schedule. We have a crew opening up next month and would love to drop off numbers on this scope. Mind if I send over our commercial spec sheet and bid calendar this afternoon?"'
    },
    {
      id: 'deal-2',
      cardNumber: 'CARD 02 • B2B PROPERTY MANAGER',
      unlockedBadge: 'UNLOCKED #2',
      pillText: 'NEW ACQUISITION • 140-UNIT COMPLEX',
      pillClass: 'bg-[#FEF3C7] border-amber-300 text-[#D97706]',
      pillIcon: '🏢',
      headline: 'Oakridge Commons & 3 Adjacent Retail Pads',
      subMeta: 'Property Address: 6100 Westheimer Rd • Commercial Deed Transfer & Vendor Re-Bid Window',
      cadCallout: null,
      contactHeader: 'REGIONAL PROPERTY MANAGER MATCH:',
      contactName: 'Dana Sterling • Regional Facilities Dir. @ Crestview Mgmt',
      contactShort: 'Dana Sterling (Crestview Commercial Mgmt)',
      contactMeta: 'Direct Inbox + Office Line • Active Q4 CapEx Upgrade Budget',
      draftLabel: '4-SENTENCE VENDOR INTRO (YOUR VOICE):',
      draftBody:
        '"Hi Dana — congrats to the Crestview team on closing the acquisition of the 140-unit Oakridge Commons complex and adjacent retail pads. Usually during the first 30 days of a transition, inherited exterior trade vendors get re-evaluated to bring the property up to your standards. We carry full commercial coverage and specialize in weekend phased work so zero tenants lose access. Can I swing by Thursday to leave you a clean CapEx bid breakdown?"'
    },
    {
      id: 'deal-3',
      cardNumber: 'CARD 03 • RESIDENTIAL + CAD X-RAY',
      unlockedBadge: 'UNLOCKED #3',
      pillText: 'CUSTOM ADDITION + CAD TAX ROLL MATCH',
      pillClass: 'bg-blue-50 border-blue-200 text-[#1E40AF]',
      pillIcon: '🏡',
      headline: '1140 Whispering Pines Ln — Custom Estate Addition',
      subMeta: null,
      cadCallout: '$940,000 Assessed Value • 4,120 Sq Ft • 1.4 Acres • Verified Homeowner',
      contactHeader: 'COUNTY APPRAISAL DISTRICT DEED MATCH:',
      contactName: 'Dr. Robert & Elena Harrison • Verified Property Owners',
      contactShort: 'Dr. Robert & Elena Harrison',
      contactMeta: 'Parcel #CAD-90418-A • Direct Owner Mobile & Email Verified',
      draftLabel: '4-SENTENCE OWNER INTRO (YOUR VOICE):',
      draftBody:
        '"Hi Robert — noticed the city permit approved this week for the custom addition on your 4,120 sq ft estate on Whispering Pines Ln. Our custom residential team specializes in high-end estate projects across the neighborhood with zero day-labor subs and a 100% clean-site guarantee. Because we coordinate directly with your framing schedule, we keep your project on timeline without headaches. Would you be open to a quick 10-minute site walk this week?"'
    }
  ];

  const cardStates = {
    'deal-1': 'ready',
    'deal-2': 'ready',
    'deal-3': 'ready'
  };

  const simulatorCardsGrid = document.getElementById('simulator-cards-grid');
  const dealsFiredCounterEl = document.getElementById('deals-fired-counter');
  const resetAllSimulatorBtn = document.getElementById('reset-all-simulator-btn');

  function updateDealsFiredHeader() {
    const firedCount = MORNING_DEAL_CARDS.reduce((acc, card) => {
      return acc + (cardStates[card.id] === 'sent' ? 1 : 0);
    }, 0);

    if (dealsFiredCounterEl) {
      dealsFiredCounterEl.textContent = `Deals Approved This Morning: ${firedCount}/3`;
    }
  }

  function renderSimulatorCards() {
    if (!simulatorCardsGrid) return;

    simulatorCardsGrid.innerHTML = MORNING_DEAL_CARDS.map((card, idx) => {
      const state = cardStates[card.id] || 'ready';

      if (state === 'sent') {
        return `
          <article class="bg-emerald-50/70 border-2 border-emerald-600 rounded-2xl shadow-md p-5 sm:p-6 flex flex-col justify-between transition-all duration-200" data-card-id="${card.id}">
            <div>
              <div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-emerald-200">
                <span class="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  ✓ Sent in 3.2 Seconds — Ready for Coffee
                </span>
                <span class="font-mono-telemetry text-[11px] text-emerald-800">07:01:${12 + idx * 14} AM</span>
              </div>

              <div class="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3.5 shadow-sm">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div class="font-mono-telemetry text-[11px] text-emerald-800 font-bold mb-1">${card.cardNumber}</div>
              <h3 class="font-display font-extrabold text-xl text-[#0F172A] mb-2">
                Dispatched to ${card.contactShort}
              </h3>

              <p class="text-[#334155] text-sm leading-relaxed mb-4">
                In real life, that custom 4-sentence intro from your Tiberius Scout just landed directly in their inbox from your address while your competitors are still asleep.
              </p>

              <div class="p-3.5 rounded-xl bg-white border border-emerald-200 mb-4">
                <div class="font-mono-telemetry text-[10px] text-emerald-800 font-bold mb-1">SENT MESSAGE LOG:</div>
                <p class="text-xs text-slate-600 italic line-clamp-3">${card.draftBody}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-emerald-200 flex items-center justify-between">
              <span class="font-mono-telemetry text-[11px] text-emerald-800 font-bold">✓ YOU APPROVE &amp; SEND</span>
              <button
                type="button"
                data-action="reset-card"
                data-card-id="${card.id}"
                class="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
              >
                Reset Demo
              </button>
            </div>
          </article>
        `;
      }

      return `
        <article class="bg-white border border-slate-200 rounded-2xl shadow-md p-5 sm:p-6 flex flex-col justify-between" data-card-id="${card.id}">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="font-mono-telemetry text-[11px] text-[#1E40AF] font-bold">${card.cardNumber}</span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono-telemetry text-[10px] text-emerald-800">${card.unlockedBadge}</span>
            </div>

            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono-telemetry text-[11px] font-bold mb-3 ${card.pillClass}">
              <span>${card.pillIcon}</span>
              <span>${card.pillText}</span>
            </div>

            <h3 class="font-display font-extrabold text-xl text-[#0F172A] leading-snug mb-1.5">
              ${card.headline}
            </h3>

            ${
              card.cadCallout
                ? `<p class="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3">${card.cadCallout}</p>`
                : `<p class="text-xs text-[#64748B] font-medium mb-4">${card.subMeta}</p>`
            }

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <div class="font-mono-telemetry text-[10px] text-[#1E40AF] mb-0.5">${card.contactHeader}</div>
              <div class="text-xs sm:text-sm font-bold text-[#0F172A]">${card.contactName}</div>
              <div class="text-[11px] text-[#64748B] mt-0.5">${card.contactMeta}</div>
            </div>

            <div class="mb-5">
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="font-mono-telemetry text-[10px] text-[#64748B]">${card.draftLabel}</span>
                <span class="font-mono-telemetry text-[10px] text-emerald-700 font-bold whitespace-nowrap">READY ✓</span>
              </div>
              <div class="outreach-draft-box">
                ${card.draftBody}
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200">
            <button
              type="button"
              data-action="approve-send"
              data-card-id="${card.id}"
              class="btn-trust-emerald w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center cursor-pointer"
            >
              [ ✓ Approve &amp; Send ]
            </button>
          </div>
        </article>
      `;
    }).join('');

    updateDealsFiredHeader();
  }

  if (simulatorCardsGrid) {
    simulatorCardsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const cardId = btn.getAttribute('data-card-id');
      if (!cardId) return;

      if (action === 'approve-send') {
        cardStates[cardId] = 'sent';
        renderSimulatorCards();
      } else if (action === 'reset-card') {
        cardStates[cardId] = 'ready';
        renderSimulatorCards();
      }
    });
  }

  if (resetAllSimulatorBtn) {
    resetAllSimulatorBtn.addEventListener('click', () => {
      Object.keys(cardStates).forEach((k) => {
        cardStates[k] = 'ready';
      });
      renderSimulatorCards();
    });
  }

  /* ==========================================================================
     4. CHAPTER 4: PRICING TIERS + SMART SITE EQUITY TOGGLE
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

  function setPricingMode(mode) {
    const isBundle = mode === 'bundle';

    if (toggleStandaloneBtn && toggleBundleBtn) {
      toggleStandaloneBtn.setAttribute('aria-pressed', (!isBundle).toString());
      toggleBundleBtn.setAttribute('aria-pressed', isBundle.toString());

      if (isBundle) {
        toggleStandaloneBtn.classList.remove('is-active');
        toggleStandaloneBtn.classList.add('text-slate-700', 'hover:bg-slate-50');
        toggleBundleBtn.classList.add('is-active-bundle');
        toggleBundleBtn.classList.remove('text-slate-700', 'hover:bg-slate-50');
      } else {
        toggleStandaloneBtn.classList.add('is-active');
        toggleStandaloneBtn.classList.remove('text-slate-700', 'hover:bg-slate-50');
        toggleBundleBtn.classList.remove('is-active-bundle');
        toggleBundleBtn.classList.add('text-slate-700', 'hover:bg-slate-50');
      }
    }

    if (priceTier1El) priceTier1El.textContent = isBundle ? '$547' : '$297';
    if (priceTier2El) priceTier2El.textContent = isBundle ? '$847' : '$597';
    if (priceTier3El) priceTier3El.textContent = isBundle ? '$1,147' : '$897';

    if (priceSub1El) {
      priceSub1El.textContent = isBundle
        ? 'INCLUDES SMART SITE (+$200/MO EQUITY CREDIT)'
        : 'STARTS WITH 7-DAY FREE TEST DRIVE (3 RECON CARDS/DAY)';
    }
    if (priceSub2El) {
      priceSub2El.textContent = isBundle
        ? 'INCLUDES SMART SITE (+$200/MO EQUITY CREDIT)'
        : 'STARTS WITH 7-DAY FREE TEST DRIVE (3 RECON CARDS/DAY)';
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

  /* ==========================================================================
     5. CHAPTER 5: OUTCOME-FIRST FAQ ACCORDION
     ========================================================================== */
  const faqItems = Array.from(document.querySelectorAll('#faq-accordion .faq-accordion-item'));

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', (!isOpen).toString());
    });
  });

  /* ==========================================================================
     6. CHAPTER 6: SINGLE-CARD TERRITORY ACTIVATION VAULT
     ========================================================================== */
  const vaultTradeSelect = document.getElementById('vault-trade-select-mobile');
  const vaultTierSelect = document.getElementById('vault-tier-select-mobile');
  const vaultZipInputEl = document.getElementById('vault-zip-input');
  const vaultAvailabilityBanner = document.getElementById('vault-live-availability-banner');
  const vaultAvailabilityText = document.getElementById('vault-availability-text');
  const pricingTierCtas = Array.from(document.querySelectorAll('.pricing-tier-cta[data-select-tier]'));
  const activationForm = document.getElementById('territory-activation-form');
  const vaultFormView = document.getElementById('vault-form-view');
  const vaultConfirmationView = document.getElementById('vault-confirmation-view');
  const vaultResetBtn = document.getElementById('vault-reset-btn');

  const confirmTradeVal = document.getElementById('confirm-trade-val');
  const confirmZipVal = document.getElementById('confirm-zip-val');
  const confirmTierVal = document.getElementById('confirm-tier-val');
  const confirmContactVal = document.getElementById('confirm-contact-val');
  const confirmOpenBriefingLink = document.getElementById('confirm-open-briefing-link');
  const confirmOpenCommandLink = document.getElementById('confirm-open-command-link');
  const sevenAmCountdownEl = document.getElementById('seven-am-countdown');

  let countdownInterval = null;
  let zipCheckDebounce = null;

  async function refreshVaultTerritoryAvailability() {
    const zip = vaultZipInputEl && vaultZipInputEl.value.trim() ? vaultZipInputEl.value.trim() : '78130';
    const trade = vaultTradeSelect ? vaultTradeSelect.value : 'Commercial Concrete';
    const tier = vaultTierSelect ? vaultTierSelect.value : 'Tier 2: Commercial Permits';

    try {
      const resp = await fetch(
        `/api/recon/availability?zip=${encodeURIComponent(zip)}&trade=${encodeURIComponent(trade)}&tier=${encodeURIComponent(tier)}`
      );
      if (!resp.ok) return;
      const data = await resp.json();
      if (data && data.ok && vaultAvailabilityText && vaultAvailabilityBanner) {
        vaultAvailabilityText.textContent = data.statusBadge;
        if (data.isAvailable) {
          vaultAvailabilityBanner.className =
            'p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2 text-xs font-mono-telemetry text-emerald-800';
        } else {
          vaultAvailabilityBanner.className =
            'p-3 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-2 text-xs font-mono-telemetry text-rose-800';
        }
      }
    } catch (_err) {
      // Keep default banner if offline
    }
  }

  if (vaultZipInputEl) {
    vaultZipInputEl.addEventListener('input', () => {
      if (zipCheckDebounce) clearTimeout(zipCheckDebounce);
      zipCheckDebounce = setTimeout(refreshVaultTerritoryAvailability, 260);
    });
  }
  if (vaultTradeSelect) vaultTradeSelect.addEventListener('change', refreshVaultTerritoryAvailability);
  if (vaultTierSelect) vaultTierSelect.addEventListener('change', refreshVaultTerritoryAvailability);

  pricingTierCtas.forEach((cta) => {
    cta.addEventListener('click', () => {
      const tier = cta.getAttribute('data-select-tier');
      if (tier && vaultTierSelect) {
        vaultTierSelect.value = tier;
        refreshVaultTerritoryAvailability();
      }
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
    activationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const zipInput = document.getElementById('vault-zip-input');
      const phoneInput = document.getElementById('vault-phone-input');
      const emailInput = document.getElementById('vault-email-input');
      const companyInput = document.getElementById('vault-company-input');
      const passwordInput = document.getElementById('vault-password-input');

      const selectedTrade = vaultTradeSelect ? vaultTradeSelect.value : 'Commercial Concrete';
      const selectedTier = vaultTierSelect ? vaultTierSelect.value : 'Tier 2: Commercial Permits';
      const zipVal = zipInput && zipInput.value.trim() ? zipInput.value.trim() : '78130';
      const phoneVal = phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : 'SMS Queue Armed';
      const emailVal = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'Primary Inbox Armed';
      const companyVal = companyInput && companyInput.value.trim() ? companyInput.value.trim() : '';
      const passwordVal = passwordInput && passwordInput.value.trim() ? passwordInput.value.trim() : '';
      const includeSmartSite = Boolean(vaultSmartSiteCheckbox && vaultSmartSiteCheckbox.checked);

      if (confirmTradeVal) confirmTradeVal.textContent = selectedTrade;
      if (confirmZipVal) confirmZipVal.textContent = zipVal;
      if (confirmTierVal) {
        confirmTierVal.textContent = includeSmartSite
          ? `${selectedTier} + Smart Site Equity`
          : selectedTier;
      }
      if (confirmContactVal) {
        confirmContactVal.textContent = `DISPATCH ARMED FOR: ${phoneVal.toUpperCase()} • ${emailVal.toUpperCase()}`;
      }

      if (vaultFormView && vaultConfirmationView) {
        vaultFormView.classList.add('hidden');
        vaultConfirmationView.classList.remove('hidden');
      }

      startSevenAMCountdown();

      try {
        const resp = await fetch('/api/recon/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: companyVal,
            accountPassword: passwordVal,
            primaryTrade: selectedTrade,
            tierLevel: selectedTier,
            includeSmartSiteBundle: includeSmartSite,
            territoryZip: zipVal,
            mobilePhone: phoneVal,
            bestEmail: emailVal
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.briefing) {
          const token = data.briefing.magicToken;
          localStorage.setItem('tiberius_recon_token', token);
          if (data.sessionToken) {
            localStorage.setItem('tiberius_recon_session_jwt', data.sessionToken);
          }
          if (data.contractor) {
            localStorage.setItem('tiberius_recon_account', JSON.stringify(data.contractor));
          }
          if (confirmZipVal) {
            confirmZipVal.textContent = `${data.briefing.territoryZip} (${data.briefing.metroCity})`;
          }
          if (confirmOpenBriefingLink) {
            confirmOpenBriefingLink.href = `briefing.html?token=${encodeURIComponent(token)}`;
          }
          if (confirmOpenCommandLink) {
            confirmOpenCommandLink.href = `command.html?token=${encodeURIComponent(token)}`;
          }
        }
      } catch (_err) {
        // Offline fallback preserves UI state
      }
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
})();
