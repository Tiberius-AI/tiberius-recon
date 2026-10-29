/**
 * TIBERIUS RECON™ — LIVE 7:00 AM MOBILE BRIEFING APPLICATION (briefing.js)
 * Features:
 * 1. Loads live contractor briefing by ?token=... from GET /api/recon/briefing (with offline client fallback)
 * 2. Renders 3 Unlocked Recon Cards (or all 9 when unlocked) with CAD Tax Roll X-Ray Drawer
 * 3. Inline 4-Sentence Draft Editor ([ ✎ Edit Intro ] / [ ✓ Save ])
 * 4. 1-Tap [ ✓ Approve & Send ] + Zero-Setup Native SMS (sms:) & Native Email (mailto:) Handoff
 * 5. 1-Click Locked Territory Overflow Unlocker & Live 2:00 AM Sweep Re-Runner
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__TIBERIUS_BRIEFING_APP_INITIALIZED__) return;
  window.__TIBERIUS_BRIEFING_APP_INITIALIZED__ = true;

  const ENGINE_SCHEMA_VERSION = '2.4';
  const urlParams = new URLSearchParams(window.location.search);
  const activeToken = urlParams.get('token') || urlParams.get('t') || localStorage.getItem('tiberius_recon_token') || 'demo-7am-briefing';
  localStorage.setItem('tiberius_recon_token', activeToken);

  /**
   * Invalidates any cached localStorage pitches, Shop Dossiers, or account objects
   * saved under an older schema so fresh v2.4 cards and dossiers always render.
   */
  function invalidateStaleLocalStorageCache(force = false) {
    try {
      const savedSchema = localStorage.getItem('tiberius_recon_schema_version');
      const rawAccount = localStorage.getItem('tiberius_recon_account') || '';
      const rawProfile = localStorage.getItem('tiberius_recon_profile') || '';
      const rawBriefing = localStorage.getItem('tiberius_recon_briefing') || '';
      const rawCards = localStorage.getItem('tiberius_recon_cards') || '';
      const combinedCache = `${rawAccount} ${rawProfile} ${rawBriefing} ${rawCards}`;

      const hasLegacyStrings =
        combinedCache.includes('multi-family roof preventative maintenance') ||
        combinedCache.includes('bidding@structurainc.com •') ||
        combinedCache.includes('Hey Estimating Team') ||
        combinedCache.includes('right here in New Braunfels off IH-35 & FM 306');

      if (force || savedSchema !== ENGINE_SCHEMA_VERSION || hasLegacyStrings) {
        [
          'tiberius_recon_account',
          'tiberius_recon_profile',
          'tiberius_recon_dossier',
          'tiberius_recon_knowledge_base',
          'tiberius_recon_briefing',
          'tiberius_recon_cards'
        ].forEach((key) => localStorage.removeItem(key));
        localStorage.setItem('tiberius_recon_schema_version', ENGINE_SCHEMA_VERSION);
      }
    } catch (_err) {
      // Ignore storage access errors in private browsing
    }
  }

  function syncFreshDossierToLocalStorage(contractor) {
    if (!contractor) return;
    try {
      const stamped = {
        ...contractor,
        schemaVersion: ENGINE_SCHEMA_VERSION
      };
      localStorage.setItem('tiberius_recon_account', JSON.stringify(stamped));
      localStorage.setItem('tiberius_recon_profile', JSON.stringify(stamped));
      localStorage.setItem('tiberius_recon_schema_version', ENGINE_SCHEMA_VERSION);
    } catch (_err) {
      // Ignore storage access errors
    }
  }

  invalidateStaleLocalStorageCache(false);

  const navCommandLink = document.getElementById('nav-command-link');
  const mobileCommandLink = document.getElementById('mobile-command-link');
  const navInboxLink = document.getElementById('nav-inbox-link');
  if (navCommandLink) navCommandLink.href = `command.html?token=${encodeURIComponent(activeToken)}`;
  if (mobileCommandLink) mobileCommandLink.href = `command.html?token=${encodeURIComponent(activeToken)}`;
  if (navInboxLink) navInboxLink.href = `inbox.html?token=${encodeURIComponent(activeToken)}`;

  const navTerritoryPill = document.getElementById('nav-territory-pill');
  const briefingTierBadge = document.getElementById('briefing-tier-badge');
  const briefingExclusivityBadge = document.getElementById('briefing-exclusivity-badge');
  const briefingMainTitle = document.getElementById('briefing-main-title');
  const briefingSubtitle = document.getElementById('briefing-subtitle');
  const briefingApprovedCounter = document.getElementById('briefing-approved-counter');
  const briefingCardsGrid = document.getElementById('briefing-cards-grid');
  const briefingLockedVault = document.getElementById('briefing-locked-vault');
  const lockedVaultHeading = document.getElementById('locked-vault-heading');
  const lockedOverflowGrid = document.getElementById('locked-overflow-grid');
  const sentLogsContainer = document.getElementById('briefing-sent-logs-container');

  const calibratorTradeSelect = document.getElementById('calibrator-trade-select');
  const calibratorZipInput = document.getElementById('calibrator-zip-input');
  const calibratorLandmarkInput = document.getElementById('calibrator-landmark-input');
  const calibratorApplyBtn = document.getElementById('calibrator-apply-btn');
  const resetAllBtn = document.getElementById('briefing-reset-all-btn');
  const runNightSweepBtn = document.getElementById('briefing-run-night-sweep-btn');
  const liveZeroApiBtn = document.getElementById('briefing-live-zero-api-btn');
  const nightSweepBanner = document.getElementById('night-sweep-telemetry-banner');
  const nightSweepText = document.getElementById('night-sweep-telemetry-text');
  const unlockFullQueueBtn = document.getElementById('unlock-full-queue-btn');

  let state = {
    briefing: null,
    contractor: null,
    availability: null,
    sentLogs: [],
    editingCardId: null
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildCleanSmsHref(phone, draftBody) {
    const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');
    const cleanBody = String(draftBody || '').replace(/^"|"$/g, '');
    return `sms:${cleanPhone}?body=${encodeURIComponent(cleanBody)}`;
  }

  function buildCleanMailtoHref(email, subject, draftBody) {
    const cleanBody = String(draftBody || '').replace(/^"|"$/g, '');
    return `mailto:${encodeURIComponent(email || '')}?subject=${encodeURIComponent(subject || 'Project Bid Inquiry')}&body=${encodeURIComponent(cleanBody)}`;
  }

  function sanitizeContactNameDisplay(rawContactName) {
    const raw = String(rawContactName || '').trim();
    if (!raw) return 'Preconstruction Desk • Commercial Estimating';
    if (raw.includes('•')) {
      const parts = raw.split('•').map((s) => s.trim());
      if (parts[0].includes('@')) {
        return `Preconstruction Desk • ${parts.slice(1).join(' • ')}`;
      }
      return `${parts[0]} • ${parts.slice(1).join(' • ')}`;
    }
    if (raw.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(raw)) {
      return 'Preconstruction Desk • Commercial Estimating';
    }
    return raw;
  }

  function renderAll() {
    if (!state.briefing) return;

    const b = state.briefing;
    const c = state.contractor || {};
    const unlockedCards = (b.cards || []).filter((card) => !card.isLockedOverflow);
    const lockedCards = (b.cards || []).filter((card) => card.isLockedOverflow);
    const approvedCount = unlockedCards.filter((card) => card.approvalStatus === 'sent').length;

    const isNewBraunfelsCorridor =
      b.territoryZip === '78130' ||
      b.territoryZip === '78132' ||
      /new braunfels/i.test(String(b.metroCity || ''));

    if (navTerritoryPill) {
      navTerritoryPill.textContent = isNewBraunfelsCorridor
        ? `78130 / 78132 (New Braunfels) • ${b.tradeName}`
        : `${b.territoryZip} (${b.metroCity || 'Local Metro'}) • ${b.tradeName}`;
    }
    if (briefingTierBadge) {
      briefingTierBadge.textContent = (b.tierLevel || 'TIER 2: COMMERCIAL PERMITS').toUpperCase();
    }
    if (briefingExclusivityBadge && state.availability) {
      briefingExclusivityBadge.textContent = state.availability.statusBadge;
    }
    if (briefingMainTitle) {
      const zipLabel = isNewBraunfelsCorridor ? '78130 / 78132' : b.territoryZip;
      briefingMainTitle.textContent = `07:00 AM Briefing: ${unlockedCards.length} Verified ${b.tradeName} Deals in ${zipLabel}.`;
    }
    if (briefingSubtitle) {
      briefingSubtitle.textContent = `Swept at 2:04 AM from ${b.portalName || 'Municipal Portals'} & verified at 4:30 AM against ${b.countyCad || 'County Appraisal District Tax Rolls'}. Nothing sends without your tap.`;
    }
    if (briefingApprovedCounter) {
      briefingApprovedCounter.textContent = `Deals Approved This Morning: ${approvedCount}/${unlockedCards.length}`;
    }

    if (calibratorTradeSelect && b.tradeName) {
      calibratorTradeSelect.value = b.tradeName;
    }
    if (calibratorZipInput && b.territoryZip) {
      calibratorZipInput.value = b.territoryZip;
    }
    if (
      calibratorLandmarkInput &&
      c.voiceProfile &&
      typeof c.voiceProfile.landmarkReference === 'string'
    ) {
      calibratorLandmarkInput.value = c.voiceProfile.landmarkReference;
    }

    renderUnlockedCards(unlockedCards);
    renderLockedOverflow(lockedCards, b);
    renderSentLogs();
  }

  function renderUnlockedCards(unlockedCards) {
    if (!briefingCardsGrid) return;

    briefingCardsGrid.innerHTML = unlockedCards
      .map((card, idx) => {
        const isSent = card.approvalStatus === 'sent';
        const isEditing = state.editingCardId === card.id;
        const smsHref = buildCleanSmsHref(card.contactPhone, card.draftBody);
        const mailtoHref = buildCleanMailtoHref(card.contactEmail, card.draftSubject, card.draftBody);

        if (isSent) {
          return `
            <article class="bg-emerald-50/80 border-2 border-emerald-600 rounded-2xl shadow-md p-5 sm:p-6 flex flex-col justify-between transition-all" data-card-id="${card.id}">
              <div>
                <div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-emerald-200">
                  <span class="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                    ✓ Dispatched (${escapeHtml(card.dispatchChannel || '1-TAP SEND')})
                  </span>
                  <span class="font-mono-telemetry text-[11px] text-emerald-800">${escapeHtml(card.approvedTimeLabel || `07:01:${14 + idx * 11} AM`)}</span>
                </div>

                <div class="font-mono-telemetry text-[11px] text-emerald-800 font-bold mb-1">${escapeHtml(card.cardNumber)}</div>
                <h2 class="font-display font-extrabold text-xl text-[#0F172A] mb-2">
                  Sent to ${escapeHtml(card.contactShort)}
                </h2>
                <p class="text-[#334155] text-xs sm:text-sm leading-relaxed mb-4">
                  Dispatched to <strong class="text-[#0F172A]">${escapeHtml(card.contactEmail)}</strong> • <strong class="text-[#0F172A]">${escapeHtml(card.contactPhone)}</strong>.
                </p>

                <div class="p-3.5 rounded-xl bg-white border border-emerald-200 mb-4">
                  <div class="font-mono-telemetry text-[10px] text-emerald-800 font-bold mb-1">DISPATCHED 4-SENTENCE INTRO:</div>
                  <p class="text-xs text-slate-700 italic leading-relaxed">${escapeHtml(card.draftBody)}</p>
                </div>
              </div>

              <div class="pt-3 border-t border-emerald-200 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <a href="${smsHref}" class="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100">
                    📱 Open SMS
                  </a>
                  <a href="${mailtoHref}" class="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100">
                    ✉️ Open Email
                  </a>
                </div>
                <button
                  type="button"
                  data-action="reset-card"
                  data-card-id="${card.id}"
                  class="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  Undo / Edit
                </button>
              </div>
            </article>
          `;
        }

        return `
          <article class="bg-white border border-slate-200 rounded-2xl shadow-md p-5 sm:p-6 flex flex-col justify-between" data-card-id="${card.id}">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="font-mono-telemetry text-[11px] text-[#1E40AF] font-bold">${escapeHtml(card.cardNumber)}</span>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono-telemetry text-[10px] text-emerald-800">${escapeHtml(card.unlockedBadge)}</span>
              </div>

              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono-telemetry text-[11px] font-bold mb-3 ${card.pillClass || 'bg-[#FEF3C7] border-amber-300 text-[#D97706]'}">
                <span>${escapeHtml(card.pillIcon || '⚡')}</span>
                <span>${escapeHtml(card.pillText)}</span>
              </div>

              <h2 class="font-display font-extrabold text-xl text-[#0F172A] leading-snug mb-1.5">
                ${escapeHtml(card.headline)}
              </h2>

              ${
                card.cadCallout
                  ? `<p class="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3">${escapeHtml(card.cadCallout)}</p>`
                  : `<p class="text-xs text-[#64748B] font-medium mb-3">${escapeHtml(card.subMeta)}</p>`
              }

              <!-- Decision-Maker Contact Box -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                <div class="font-mono-telemetry text-[10px] text-[#1E40AF] mb-0.5">${escapeHtml(card.contactHeader)}</div>
                <div class="text-xs sm:text-sm font-bold text-[#0F172A]">${escapeHtml(sanitizeContactNameDisplay(card.contactName))}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">${escapeHtml(card.contactMeta)}</div>
                <div class="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono-telemetry text-slate-700">
                  <span>📞 ${escapeHtml(card.contactPhone)}</span>
                  <span class="truncate max-w-[190px]">✉️ ${escapeHtml(card.contactEmail)}</span>
                </div>
                ${
                  card.websiteUrl || card.permitPortalUrl
                    ? `<div class="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[10px] font-mono-telemetry">
                        ${card.websiteUrl ? `<a href="${escapeHtml(card.websiteUrl)}" target="_blank" rel="noopener" class="text-blue-700 hover:underline truncate">🌐 Live Site: ${escapeHtml(card.websiteUrl.replace(/^https?:\/\/(www\.)?/, ''))}</a>` : ''}
                        ${card.permitPortalUrl ? `<a href="${escapeHtml(card.permitPortalUrl)}" target="_blank" rel="noopener" class="text-emerald-700 hover:underline whitespace-nowrap">🏛️ City Record ↗</a>` : ''}
                      </div>`
                    : ''
                }
              </div>

              <!-- 4-Sentence Draft Box (Inline Editable) -->
              <div class="mb-4">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="font-mono-telemetry text-[10px] text-[#64748B]">${escapeHtml(card.draftLabel)}</span>
                  <button
                    type="button"
                    data-action="${isEditing ? 'save-draft' : 'toggle-edit'}"
                    data-card-id="${card.id}"
                    class="font-mono-telemetry text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                  >
                    ${isEditing ? '✓ SAVE DRAFT EDITS' : '✎ EDIT ANY WORD'}
                  </button>
                </div>

                ${
                  isEditing
                    ? `<textarea id="draft-editor-${card.id}" rows="5" class="enterprise-input text-xs leading-relaxed">${escapeHtml(card.draftBody)}</textarea>`
                    : `<div class="outreach-draft-box">${escapeHtml(card.draftBody)}</div>`
                }
              </div>
            </div>

            <!-- 1-Tap Approve & Send + Native Handoff Buttons -->
            <div class="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                data-action="approve-send"
                data-channel="CLOUD_DISPATCH"
                data-card-id="${card.id}"
                class="btn-trust-emerald w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center cursor-pointer"
              >
                [ ✓ Approve &amp; Send ]
              </button>

              <div class="grid grid-cols-3 gap-1.5">
                <a
                  href="${smsHref}"
                  data-action="native-handoff"
                  data-channel="NATIVE_SMS"
                  data-card-id="${card.id}"
                  class="btn-outline-slate py-2 px-2 rounded-lg text-[11px] font-bold text-center inline-flex items-center justify-center gap-1"
                >
                  <span>📱 Text</span>
                </a>
                <a
                  href="${mailtoHref}"
                  data-action="native-handoff"
                  data-channel="NATIVE_EMAIL"
                  data-card-id="${card.id}"
                  class="btn-outline-slate py-2 px-2 rounded-lg text-[11px] font-bold text-center inline-flex items-center justify-center gap-1"
                >
                  <span>✉️ Mail</span>
                </a>
                <button
                  type="button"
                  data-action="copy-intro"
                  data-card-id="${card.id}"
                  class="btn-outline-slate py-2 px-2 rounded-lg text-[11px] font-bold text-center inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>📋 Copy</span>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function renderLockedOverflow(lockedCards, briefing) {
    if (!briefingLockedVault || !lockedOverflowGrid) return;

    if (!lockedCards || lockedCards.length === 0) {
      briefingLockedVault.classList.add('hidden');
      return;
    }

    briefingLockedVault.classList.remove('hidden');
    if (lockedVaultHeading) {
      lockedVaultHeading.textContent = `${lockedCards.length} Additional Verified Recon Cards Spotted in ${briefing.territoryZip} Last Night (Locked on Free 3-a-Day Test Drive)`;
    }

    lockedOverflowGrid.innerHTML = lockedCards
      .map(
        (card) => `
        <div class="bg-white/95 border border-amber-200 rounded-xl px-3.5 py-3 flex items-center justify-between gap-2 text-xs">
          <span class="font-mono-telemetry font-bold text-amber-900 whitespace-nowrap">[${escapeHtml(card.unlockedBadge)}]</span>
          <span class="text-slate-900 font-semibold truncate">${escapeHtml(card.headline)}</span>
          <span class="redacted-preview-text font-mono text-slate-500 whitespace-nowrap">${escapeHtml(card.redactedPreview || 'Verified Owner')}</span>
        </div>
      `
      )
      .join('');
  }

  function renderSentLogs() {
    if (!sentLogsContainer) return;
    const sentCards =
      state.briefing && state.briefing.cards
        ? state.briefing.cards.filter((c) => c.approvalStatus === 'sent')
        : [];

    if (sentCards.length === 0) {
      sentLogsContainer.innerHTML = `
        <p class="text-xs font-mono-telemetry text-slate-500">
          No cards dispatched yet this morning. Tap [ ✓ Approve &amp; Send ] on any card above to log and dispatch your 4-sentence intro.
        </p>
      `;
      return;
    }

    sentLogsContainer.innerHTML = sentCards
      .map(
        (c) => `
        <div class="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="font-mono-telemetry text-[11px] text-emerald-800 font-bold">
              ✓ ${escapeHtml(c.cardNumber)} • DISPATCHED AT ${escapeHtml(c.approvedTimeLabel || '07:01 AM')} VIA ${escapeHtml(c.dispatchChannel || 'CLOUD_EMAIL')}
            </div>
            <div class="font-bold text-slate-900 text-sm">${escapeHtml(c.headline)} → ${escapeHtml(c.contactShort)}</div>
          </div>
          <span class="font-mono-telemetry text-xs text-emerald-700 font-bold">HUMAN APPROVED ✓</span>
        </div>
      `
      )
      .join('');
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const jwt = localStorage.getItem('tiberius_recon_session_jwt');
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    return headers;
  }

  async function loadBriefing() {
    invalidateStaleLocalStorageCache(false);
    try {
      const resp = await fetch(
        `/api/recon/briefing?token=${encodeURIComponent(activeToken)}&fresh=1&v=${ENGINE_SCHEMA_VERSION}`,
        {
          headers: getAuthHeaders(),
          cache: 'no-store'
        }
      );
      if (!resp.ok) throw new Error('API non-200');
      const data = await resp.json();
      if (data && data.ok && data.briefing) {
        state.briefing = data.briefing;
        state.contractor = data.contractor;
        state.availability = data.availability;
        state.sentLogs = data.sentLogs || [];
        syncFreshDossierToLocalStorage(data.contractor);
        renderAll();
      }
    } catch (_err) {
      // Fallback handled gracefully
    }
  }

  async function sendCardAction(payload) {
    const activeTrade = calibratorTradeSelect ? calibratorTradeSelect.value : undefined;
    const activeZip = calibratorZipInput ? calibratorZipInput.value.trim() : undefined;
    const activeLandmark = calibratorLandmarkInput ? calibratorLandmarkInput.value.trim() : undefined;
    try {
      const resp = await fetch('/api/recon/approve', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          token: activeToken,
          primaryTrade: activeTrade,
          territoryZip: activeZip,
          landmarkReference: activeLandmark,
          ...payload
        })
      });
      const data = await resp.json();
      if (data && data.ok && data.briefing) {
        state.briefing = data.briefing;
        if (data.contractor) state.contractor = data.contractor;
        state.editingCardId = null;
        renderAll();
      }
    } catch (_err) {
      // Optimistic UI fallback if offline
      if (state.briefing && state.briefing.cards) {
        const card = state.briefing.cards.find((c) => c.id === payload.cardId);
        if (card && payload.action === 'approve-send') {
          card.approvalStatus = 'sent';
          card.dispatchChannel = payload.dispatchChannel || 'CLOUD_DISPATCH';
          card.approvedTimeLabel = '07:01:18 AM';
        } else if (card && payload.action === 'reset-card') {
          card.approvalStatus = 'ready';
        } else if (payload.action === 'unlock-full-queue') {
          state.briefing.cards.forEach((c, idx) => {
            c.isLockedOverflow = false;
            c.unlockedBadge = `UNLOCKED #${idx + 1}`;
          });
        }
        renderAll();
      }
    }
  }

  if (briefingCardsGrid) {
    briefingCardsGrid.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const cardId = target.getAttribute('data-card-id');
      if (!cardId) return;

      if (action === 'toggle-edit') {
        state.editingCardId = cardId;
        renderAll();
        return;
      }

      if (action === 'save-draft') {
        const editorEl = document.getElementById(`draft-editor-${cardId}`);
        const updatedText = editorEl ? editorEl.value : undefined;
        sendCardAction({
          action: 'save-draft',
          cardId,
          updatedDraftBody: updatedText
        });
        return;
      }

      if (action === 'approve-send') {
        const editorEl = document.getElementById(`draft-editor-${cardId}`);
        const updatedText = editorEl ? editorEl.value : undefined;
        const channel = target.getAttribute('data-channel') || 'CLOUD_DISPATCH';
        sendCardAction({
          action: 'approve-send',
          cardId,
          updatedDraftBody: updatedText,
          dispatchChannel: channel
        });
        return;
      }

      if (action === 'native-handoff') {
        const channel = target.getAttribute('data-channel') || 'NATIVE_SMS';
        sendCardAction({
          action: 'approve-send',
          cardId,
          dispatchChannel: channel
        });
        return;
      }

      if (action === 'reset-card') {
        sendCardAction({
          action: 'reset-card',
          cardId
        });
        return;
      }

      if (action === 'copy-intro') {
        const card = state.briefing && state.briefing.cards
          ? state.briefing.cards.find((c) => c.id === cardId)
          : null;
        if (card && navigator.clipboard) {
          const cleanText = String(card.draftBody || '').replace(/^"|"$/g, '');
          navigator.clipboard.writeText(cleanText);
          target.innerHTML = '<span>✓ Copied</span>';
          setTimeout(() => {
            target.innerHTML = '<span>📋 Copy</span>';
          }, 1800);
        }
      }
    });
  }

  const exportCsvBtn = document.getElementById('briefing-export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!state.briefing || !state.briefing.cards) return;
      const unlocked = state.briefing.cards.filter((c) => !c.isLockedOverflow);
      const headers = [
        'Card Rank',
        'Permit Badge',
        'Headline / Address',
        'CAD Callout',
        'Contact Name',
        'Phone',
        'Email',
        'Website',
        'Status',
        '4-Sentence Intro'
      ];
      const rows = unlocked.map((c) => [
        c.cardRank,
        c.pillText,
        c.headline,
        c.cadCallout || c.subMeta || '',
        c.contactName,
        c.contactPhone,
        c.contactEmail,
        c.websiteUrl || '',
        c.approvalStatus,
        String(c.draftBody || '').replace(/^"|"$/g, '')
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tiberius-recon-7am-briefing-${state.briefing.territoryZip || 'live'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  async function recalibrateBriefing() {
    invalidateStaleLocalStorageCache(true);
    const primaryTrade = calibratorTradeSelect ? calibratorTradeSelect.value : 'Commercial Concrete';
    const territoryZip = calibratorZipInput ? calibratorZipInput.value.trim() : '78130';
    const landmarkReference = calibratorLandmarkInput ? calibratorLandmarkInput.value.trim() : '';

    if (calibratorApplyBtn) calibratorApplyBtn.textContent = 'Calibrating...';
    try {
      const resp = await fetch('/api/recon/briefing', {
        method: 'POST',
        headers: getAuthHeaders(),
        cache: 'no-store',
        body: JSON.stringify({
          token: activeToken,
          primaryTrade,
          territoryZip,
          landmarkReference,
          forceRegenerate: true,
          schemaVersion: ENGINE_SCHEMA_VERSION
        })
      });
      const data = await resp.json();
      if (data && data.ok && data.briefing) {
        state.briefing = data.briefing;
        state.contractor = data.contractor;
        state.availability = data.availability;
        syncFreshDossierToLocalStorage(data.contractor);
        renderAll();
      }
    } catch (_err) {
      // Ignore
    } finally {
      if (calibratorApplyBtn) calibratorApplyBtn.textContent = 'Recalibrate Cards →';
    }
  }

  if (calibratorApplyBtn) {
    calibratorApplyBtn.addEventListener('click', recalibrateBriefing);
  }
  if (calibratorTradeSelect) {
    calibratorTradeSelect.addEventListener('change', recalibrateBriefing);
  }

  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      sendCardAction({ action: 'reset-all' });
    });
  }

  if (unlockFullQueueBtn) {
    unlockFullQueueBtn.addEventListener('click', () => {
      sendCardAction({
        action: 'unlock-full-queue',
        upgradeTier: 'Tier 3: Full CAD + Residential Dominion (Unlocked)'
      });
    });
  }

  if (runNightSweepBtn) {
    runNightSweepBtn.addEventListener('click', async () => {
      const zipCode = calibratorZipInput ? calibratorZipInput.value.trim() : '78130';
      const primaryTrade = calibratorTradeSelect ? calibratorTradeSelect.value : 'Commercial Concrete';
      runNightSweepBtn.textContent = 'Running 2:00 AM Sweep...';
      try {
        const resp = await fetch('/api/recon/cron-morning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            zipCode,
            primaryTrade,
            rotateBatch: true
          })
        });
        const data = await resp.json();
        if (data && data.ok) {
          if (data.briefing) {
            state.briefing = data.briefing;
            renderAll();
          }
          if (nightSweepBanner && nightSweepText) {
            const scanned = data.stages.stage1_0200am_portalRecon.totalRowsScanned;
            const matches = data.stages.stage2_0430am_cadXRayAndContacts.parcelsVerified;
            const batchTag = data.batchLabel ? ` • ROTATED TO ${data.batchLabel.toUpperCase()}` : '';
            nightSweepText.textContent = `✓ 02:00 AM SWEEP COMPLETE FOR ${zipCode}: ${scanned} PORTAL ROWS SCANNED • ${matches} CAD TAX ROLL PARCELS VERIFIED${batchTag}`;
            nightSweepBanner.classList.remove('hidden');
          }
        }
      } catch (_err) {
        // Ignore
      } finally {
        runNightSweepBtn.textContent = '⚡ Re-Run 2:00 AM Sweep';
      }
    });
  }

  if (liveZeroApiBtn) {
    liveZeroApiBtn.addEventListener('click', async () => {
      const primaryTrade = calibratorTradeSelect ? calibratorTradeSelect.value : 'Commercial Concrete';
      const landmarkReference = calibratorLandmarkInput
        ? calibratorLandmarkInput.value.trim()
        : 'two miles east off IH-35';

      liveZeroApiBtn.textContent = '🛰️ Crawling Live Permits & Websites...';
      try {
        const resp = await fetch('/api/recon/live-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            primaryTrade,
            landmarkReference
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.briefing) {
          state.briefing = data.briefing;
          renderAll();
          if (nightSweepBanner && nightSweepText) {
            nightSweepText.textContent = `🛰️ ZERO-API LIVE AGENT COMPLETE (${data.elapsedSeconds}s): PULLED ${data.rawRowsFetched} REAL CITY PERMITS + CRAWLED LIVE CONTRACTOR WEBSITES & EMAILS`;
            nightSweepBanner.classList.remove('hidden');
          }
        }
      } catch (_err) {
        // Ignore
      } finally {
        liveZeroApiBtn.textContent = '🛰️ Pull Real Live Permits (Zero-API Agent)';
      }
    });
  }

  loadBriefing();

  /* ==========================================================================
     21ST.DEV ("G3") WEBGL1 'SILK' SHADER & PIXEL-GRID FOOTER ENGINE
     ========================================================================== */
  (function initG3PortalEffects() {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('g-root', 'g3-root');

    const VERT_SRC = 'attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0.0,1.0); }';
    const FRAG_SRC = [
      'precision highp float; varying vec2 v_uv; uniform float u_time; uniform vec2 u_res;',
      'uniform vec3 u_c0; uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;',
      'vec3 mixCol(vec3 a, vec3 b, float t){ return mix(a, b, clamp(t,0.0,1.0)); }',
      'vec3 pal(float t){ t=clamp(t,0.0,1.0); if(t<0.333)return mixCol(u_c0,u_c1,t*3.0); if(t<0.666)return mixCol(u_c1,u_c2,(t-0.333)*3.0); return mixCol(u_c2,u_c3,(t-0.666)*3.0); }',
      'void main(){',
      '  vec2 p=(v_uv-0.5)*vec2(u_res.x/max(u_res.y,1.0),1.0)*1.15; float t=u_time*0.35;',
      '  float s=sin(p.x*3.0+p.y*2.0+t*1.1+sin(p.y*5.0-t)*0.6);',
      '  float s2=cos(p.x*2.0-p.y*4.0+t*0.7+s*0.8); float v=s*0.5+s2*0.5;',
      '  float h=smoothstep(-0.85,0.85,v); float sh=pow(max(0.0,1.0-abs(v)),4.0);',
      '  gl_FragColor=vec4(clamp(pal(h*0.82)+u_c3*sh*0.32,0.0,1.0),1.0);',
      '}'
    ].join('\n');

    document.querySelectorAll('canvas[data-g3-shader="silk"]').forEach((canvas) => {
      const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
      if (!gl) return;
      const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, VERT_SRC); gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, FRAG_SRC); gl.compileShader(fs);
      const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'a_pos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uRes = gl.getUniformLocation(prog, 'u_res');
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c0'), 0.02, 0.02, 0.03);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c1'), 0.0, 0.063, 0.247);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c2'), 0.0, 0.204, 1.0);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_c3'), 0.31, 0.435, 1.0);
      const start = performance.now();
      function loop(now) {
        const w = Math.max(1, Math.floor(canvas.clientWidth * 0.75));
        const h = Math.max(1, Math.floor(canvas.clientHeight * 0.75));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
        gl.uniform1f(uTime, (now - start) * 0.001);
        gl.uniform2f(uRes, w, h);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    });

    document.querySelectorAll('canvas.g3-footer-pixel-canvas').forEach((canvas) => {
      const word = canvas.getAttribute('data-pixel-word') || 'TIBERIUS RECON';
      const w = Math.max(320, canvas.clientWidth || 1100), h = Math.max(80, canvas.clientHeight || 96);
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const cell = 5, cols = Math.floor(w / cell), rows = Math.floor(h / cell);
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const octx = off.getContext('2d'); if (!octx) return;
      octx.fillStyle = '#000'; octx.fillRect(0, 0, cols, rows);
      octx.fillStyle = '#fff'; octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.font = `800 ${Math.min(rows * 0.75, cols / (word.length * 0.62))}px "General Sans", "Inter", sans-serif`;
      octx.fillText(word, cols / 2, rows / 2);
      const data = octx.getImageData(0, 0, cols, rows).data;
      for (let y = 0; y < rows; y++) {
        const fade = 1 - (y / rows) * 0.75;
        for (let x = 0; x < cols; x++) {
          if (data[(y * cols + x) * 4] > 90) {
            ctx.fillStyle = (x + y) % 5 === 0 ? `rgba(79,111,255,${(0.55 * fade).toFixed(2)})` : `rgba(244,244,245,${(0.26 * fade).toFixed(2)})`;
            ctx.fillRect(x * cell, y * cell, cell - 1.2, cell - 1.2);
          }
        }
      }
    });
  })();
})();
