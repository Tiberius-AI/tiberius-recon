/**
 * TIBERIUS RECON™ — 3-PANE REPLY & FOLLOW-UP CONVERSATION ROOM (inbox.js)
 *
 * Powers:
 * 1. Pane 1: Deal Thread Queue & Stage Filter Pills (All, 🔥 Replies, ⏳ Follow-Up, 📅 Booked)
 * 2. Pane 2: Two-Way Conversation Timeline, 1-Tap AI Drafter (using Client Knowledge Base),
 *            Day-3 Follow-Up Bumper, Site Walk Proposer, and Reply Dispatcher
 * 3. Pane 3: Permit + County CAD X-Ray Dossier & Active Client Knowledge Base Drawer
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__TIBERIUS_INBOX_ROOM_INITIALIZED__) return;
  window.__TIBERIUS_INBOX_ROOM_INITIALIZED__ = true;

  const urlParams = new URLSearchParams(window.location.search);
  const activeToken =
    urlParams.get('token') ||
    urlParams.get('t') ||
    localStorage.getItem('tiberius_recon_token') ||
    'demo-7am-briefing';
  localStorage.setItem('tiberius_recon_token', activeToken);

  ['nav-briefing-link', 'header-briefing-btn', 'footer-briefing-link'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = `briefing.html?token=${encodeURIComponent(activeToken)}`;
  });

  ['nav-command-link', 'cta-command-link', 'pane-edit-kb-link', 'footer-command-link'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = `command.html?token=${encodeURIComponent(activeToken)}`;
  });

  const contractorTitleEl = document.getElementById('inbox-contractor-title');
  const kbBadgeEl = document.getElementById('inbox-kb-badge');
  const metricHotEl = document.getElementById('metric-hot-replies');
  const metricFollowUpEl = document.getElementById('metric-followups-due');
  const metricWalksEl = document.getElementById('metric-walks-booked');
  const metricTotalEl = document.getElementById('metric-total-threads');

  const threadListEl = document.getElementById('inbox-thread-list');
  const filterBtns = document.querySelectorAll('.inbox-filter-btn');

  const activeStageBadgeEl = document.getElementById('active-thread-stage-badge');
  const activeStageSelectEl = document.getElementById('active-thread-stage-select');
  const activeContactEl = document.getElementById('active-thread-contact');
  const activePropertyEl = document.getElementById('active-thread-property');
  const activePhoneEl = document.getElementById('active-thread-phone');
  const activeEmailEl = document.getElementById('active-thread-email');
  const activeReplyToEl = document.getElementById('active-thread-replyto');
  const messagesContainerEl = document.getElementById('thread-messages-container');

  const btnDraftKbReply = document.getElementById('btn-draft-kb-reply');
  const btnDraftDay3Bump = document.getElementById('btn-draft-day3-bump');
  const btnDraftSiteWalk = document.getElementById('btn-draft-site-walk');
  const btnDraftNativeSim = document.getElementById('btn-draft-native-sim');
  const btnNativeSimLaunch = document.getElementById('btn-native-sim-launch');
  const drafterStatusPill = document.getElementById('drafter-status-pill');

  const replyForm = document.getElementById('reply-composer-form');
  const replyTextarea = document.getElementById('reply-composer-textarea');
  const replyChannelSelect = document.getElementById('reply-channel-select');
  const replySendFeedback = document.getElementById('reply-send-feedback');
  const simulateReplyBtn = document.getElementById('simulate-reply-btn');

  // Pane 3 Voicemail, Dossier & Knowledge Base Elements
  const voicemailScriptTextEl = document.getElementById('voicemail-script-text');
  const voicemailCallLinkEl = document.getElementById('voicemail-call-link');
  const btnLogVoicemail = document.getElementById('btn-log-voicemail');
  const dossierValuationEl = document.getElementById('dossier-valuation-badge');
  const dossierHeadlineEl = document.getElementById('dossier-headline');
  const dossierAddressEl = document.getElementById('dossier-address');
  const dossierParcelEl = document.getElementById('dossier-parcel');
  const dossierAssessedEl = document.getElementById('dossier-assessed');
  const dossierOwnerEl = document.getElementById('dossier-owner');
  const dossierFootprintEl = document.getElementById('dossier-footprint');

  const kbDrawerServicesEl = document.getElementById('kb-drawer-services');
  const kbDrawerCertsEl = document.getElementById('kb-drawer-certs');
  const kbDrawerProofEl = document.getElementById('kb-drawer-proof');
  const kbDrawerWarrantyEl = document.getElementById('kb-drawer-warranty');
  const kbDrawerSignatureEl = document.getElementById('kb-drawer-signature');

  // Step 3: Master Twilio A2P & Two-Stage Subaccount + Scout SMS Alert Log Elements
  const testScout7amSmsBtn = document.getElementById('test-scout-7am-sms-btn');
  const a2pStageBadgeEl = document.getElementById('a2p-stage-badge');
  const a2pMasterSummaryEl = document.getElementById('a2p-master-summary');
  const a2pSubaccountStagePillEl = document.getElementById('a2p-subaccount-stage-pill');
  const a2pSubaccountDescEl = document.getElementById('a2p-subaccount-desc');
  const btnToggleA2pStage = document.getElementById('btn-toggle-a2p-stage');
  const scoutAlertCountPillEl = document.getElementById('scout-alert-count-pill');
  const scoutAlertsLogListEl = document.getElementById('scout-alerts-log-list');

  // Live Delivery Tester Elements
  const btnToggleApiKeys = document.getElementById('btn-toggle-api-keys');
  const testApiKeysDrawer = document.getElementById('test-api-keys-drawer');
  const testOverrideEmailEl = document.getElementById('test-override-email');
  const testOverridePhoneEl = document.getElementById('test-override-phone');
  const cfgResendKeyEl = document.getElementById('cfg-resend-key');
  const cfgResendFromEl = document.getElementById('cfg-resend-from');
  const cfgTwilioSidEl = document.getElementById('cfg-twilio-sid');
  const cfgTwilioTokenEl = document.getElementById('cfg-twilio-token');
  const cfgTwilioFromEl = document.getElementById('cfg-twilio-from');
  const btnSendLiveTestEmail = document.getElementById('btn-send-live-test-email');
  const btnSendLiveTestSms = document.getElementById('btn-send-live-test-sms');
  const liveTestReceiptBox = document.getElementById('live-test-receipt-box');

  const STORAGE_KEYS = {
    overrideEmail: 'tiberius_test_override_email',
    overridePhone: 'tiberius_test_override_phone',
    resendKey: 'tiberius_cfg_resend_key',
    resendFrom: 'tiberius_cfg_resend_from',
    twilioSid: 'tiberius_cfg_twilio_sid',
    twilioToken: 'tiberius_cfg_twilio_token',
    twilioFrom: 'tiberius_cfg_twilio_from'
  };

  function initTestConfigFromStorage() {
    // Purge any browser-autofilled login password that doesn't start with 're_'
    const existingResend = localStorage.getItem(STORAGE_KEYS.resendKey);
    if (existingResend && !/^re_[A-Za-z0-9_]{15,}$/.test(existingResend)) {
      localStorage.removeItem(STORAGE_KEYS.resendKey);
    }
    const existingTwilioSid = localStorage.getItem(STORAGE_KEYS.twilioSid);
    if (existingTwilioSid && !/^AC[a-f0-9]{32}$/i.test(existingTwilioSid)) {
      localStorage.removeItem(STORAGE_KEYS.twilioSid);
      localStorage.removeItem(STORAGE_KEYS.twilioToken);
    }

    const map = [
      [testOverrideEmailEl, STORAGE_KEYS.overrideEmail],
      [testOverridePhoneEl, STORAGE_KEYS.overridePhone],
      [cfgResendKeyEl, STORAGE_KEYS.resendKey],
      [cfgResendFromEl, STORAGE_KEYS.resendFrom],
      [cfgTwilioSidEl, STORAGE_KEYS.twilioSid],
      [cfgTwilioTokenEl, STORAGE_KEYS.twilioToken],
      [cfgTwilioFromEl, STORAGE_KEYS.twilioFrom]
    ];
    map.forEach(([el, key]) => {
      if (!el) return;
      const saved = localStorage.getItem(key);
      if (saved) el.value = saved;
      el.addEventListener('input', () => {
        localStorage.setItem(key, el.value.trim());
      });
    });
  }
  initTestConfigFromStorage();

  function getTestOverridesAndConfig() {
    return {
      overrideEmail: testOverrideEmailEl ? testOverrideEmailEl.value.trim() : '',
      overridePhone: testOverridePhoneEl ? testOverridePhoneEl.value.trim() : '',
      providerConfig: {
        resendApiKey: cfgResendKeyEl ? cfgResendKeyEl.value.trim() : '',
        resendFromEmail: cfgResendFromEl ? cfgResendFromEl.value.trim() : '',
        twilioAccountSid: cfgTwilioSidEl ? cfgTwilioSidEl.value.trim() : '',
        twilioAuthToken: cfgTwilioTokenEl ? cfgTwilioTokenEl.value.trim() : '',
        twilioFromNumber: cfgTwilioFromEl ? cfgTwilioFromEl.value.trim() : ''
      }
    };
  }

  function showLiveTestReceipt(htmlContent, isWarning = false) {
    if (!liveTestReceiptBox) return;
    liveTestReceiptBox.className = `p-3 rounded-lg bg-slate-900 border ${
      isWarning ? 'border-amber-400/50 text-amber-300' : 'border-emerald-400/50 text-emerald-300'
    } font-mono-telemetry text-[11px] leading-relaxed`;
    liveTestReceiptBox.innerHTML = htmlContent;
    liveTestReceiptBox.classList.remove('hidden');
  }

  if (btnToggleApiKeys && testApiKeysDrawer) {
    btnToggleApiKeys.addEventListener('click', () => {
      testApiKeysDrawer.classList.toggle('hidden');
    });
  }

  let roomState = null;
  let selectedThreadId = null;
  let activeFilter = 'ALL';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getStagePillStyle(stage) {
    if (stage === 'REPLIED_HOT') {
      return 'bg-amber-500/20 border-amber-400/50 text-amber-300';
    }
    if (stage === 'FOLLOWUP_DUE') {
      return 'bg-blue-500/20 border-blue-400/50 text-blue-300';
    }
    if (stage === 'SITE_WALK_BOOKED') {
      return 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300';
    }
    return 'bg-slate-700/80 border-slate-600 text-slate-200';
  }

  function renderKnowledgeBaseDrawer(kb = {}) {
    if (kbDrawerServicesEl && Array.isArray(kb.coreServices)) {
      kbDrawerServicesEl.innerHTML = kb.coreServices
        .map(
          (srv) =>
            `<span class="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-600 text-slate-200 text-[11px] font-medium">${escapeHtml(
              srv
            )}</span>`
        )
        .join('');
    }
    if (kbDrawerCertsEl && kb.certificationsAndBonding) {
      kbDrawerCertsEl.textContent = kb.certificationsAndBonding;
    }
    if (kbDrawerProofEl && kb.proofProjects) {
      kbDrawerProofEl.textContent = kb.proofProjects;
    }
    if (kbDrawerWarrantyEl && kb.warrantyAndGuarantee) {
      kbDrawerWarrantyEl.textContent = kb.warrantyAndGuarantee;
    }
    if (kbDrawerSignatureEl && kb.signatureLine) {
      kbDrawerSignatureEl.textContent = kb.signatureLine;
    }
  }

  function renderMetrics(metrics = {}) {
    if (metricHotEl) metricHotEl.textContent = String(metrics.hotRepliesCount ?? 0);
    if (metricFollowUpEl) metricFollowUpEl.textContent = String(metrics.followUpDueCount ?? 0);
    if (metricWalksEl) metricWalksEl.textContent = String(metrics.bookedWalksCount ?? 0);
    if (metricTotalEl) metricTotalEl.textContent = String(metrics.totalThreads ?? 0);
  }

  function getFilteredThreads() {
    if (!roomState || !Array.isArray(roomState.threads)) return [];
    if (activeFilter === 'ALL') return roomState.threads;
    return roomState.threads.filter((t) => t.stage === activeFilter);
  }

  function renderThreadList() {
    if (!threadListEl) return;
    const threads = getFilteredThreads();
    if (threads.length === 0) {
      threadListEl.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 text-center">
          No threads in this stage filter yet.
        </div>
      `;
      return;
    }

    threadListEl.innerHTML = threads
      .map((thread) => {
        const isSelected = thread.id === selectedThreadId;
        const lastMsg = thread.messages[thread.messages.length - 1];
        const previewText = lastMsg ? lastMsg.body.slice(0, 88) + (lastMsg.body.length > 88 ? '...' : '') : '';
        const borderClass = isSelected
          ? 'border-blue-400 ring-1 ring-blue-400/50 bg-slate-800'
          : 'border-slate-700 bg-slate-800/80 hover:border-slate-500';

        return `
          <button
            type="button"
            data-thread-id="${escapeHtml(thread.id)}"
            class="w-full text-left p-3.5 rounded-xl border ${borderClass} transition-all space-y-1.5 cursor-pointer block"
          >
            <div class="flex items-center justify-between gap-1.5">
              <span class="px-2 py-0.5 rounded-md border text-[10px] font-mono-telemetry font-bold ${getStagePillStyle(
                thread.stage
              )}">
                ${escapeHtml(thread.stageBadge)}
              </span>
              <span class="font-mono-telemetry text-[10px] text-emerald-400 font-bold shrink-0">
                ${escapeHtml(thread.dealValuation)}
              </span>
            </div>

            <div class="font-bold text-xs sm:text-sm text-white truncate">
              ${escapeHtml(thread.contactShort || thread.contactName)}
            </div>

            <div class="text-[11px] text-amber-300 font-mono-telemetry truncate">
              ${escapeHtml(thread.propertyAddress)}
            </div>

            <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              ${escapeHtml(previewText)}
            </p>

            <div class="flex items-center justify-between pt-1 text-[10px] font-mono-telemetry text-slate-400">
              <span>${escapeHtml(thread.lastActivityLabel)}</span>
              <span class="text-blue-300">${escapeHtml(thread.messages.length)} msgs</span>
            </div>
          </button>
        `;
      })
      .join('');

    threadListEl.querySelectorAll('[data-thread-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedThreadId = btn.getAttribute('data-thread-id');
        renderThreadList();
        renderActiveThread();
      });
    });
  }

  function renderActiveThread() {
    if (!roomState || !Array.isArray(roomState.threads)) return;
    const thread =
      roomState.threads.find((t) => t.id === selectedThreadId) || roomState.threads[0];
    if (!thread) return;
    selectedThreadId = thread.id;

    if (activeStageBadgeEl) {
      activeStageBadgeEl.textContent = thread.stageBadge;
      activeStageBadgeEl.className = `px-2.5 py-1 rounded-full border font-mono-telemetry text-[11px] font-bold ${getStagePillStyle(
        thread.stage
      )}`;
    }
    if (activeStageSelectEl) {
      activeStageSelectEl.value = thread.stage;
    }
    if (activeContactEl) activeContactEl.textContent = thread.contactName;
    if (activePropertyEl) {
      activePropertyEl.textContent = `${thread.headline} • ${thread.propertyAddress}`;
    }
    if (activePhoneEl) {
      const digits = String(thread.contactPhone || '').replace(/\D/g, '');
      activePhoneEl.href = `tel:+1${digits.slice(-10)}`;
      activePhoneEl.textContent = `📞 ${thread.contactPhone}`;
    }
    if (activeEmailEl) {
      activeEmailEl.href = `mailto:${thread.contactEmail}`;
      activeEmailEl.textContent = `✉️ ${thread.contactEmail}`;
    }
    if (activeReplyToEl && thread.replyToAddress) {
      activeReplyToEl.textContent = thread.replyToAddress;
    }
    if (voicemailScriptTextEl && thread.voicemailScript) {
      voicemailScriptTextEl.textContent = thread.voicemailScript;
    }
    if (voicemailCallLinkEl) {
      const digits = String(thread.contactPhone || '').replace(/\D/g, '');
      voicemailCallLinkEl.href = `tel:+1${digits.slice(-10)}`;
      voicemailCallLinkEl.textContent = `📞 Dial ${thread.contactPhone}`;
    }

    // Render messages timeline
    if (messagesContainerEl) {
      messagesContainerEl.innerHTML = (thread.messages || [])
        .map((msg) => {
          const isProspect = msg.sender === 'PROSPECT';
          const boxStyle = isProspect
            ? 'bg-slate-800 border-emerald-500/50 text-white mr-4'
            : 'bg-blue-950/70 border-blue-500/40 text-slate-100 ml-4';
          const badgeHtml = isProspect
            ? `<span class="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono-telemetry text-[10px] font-bold">INBOUND PROSPECT REPLY</span>`
            : `<span class="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono-telemetry text-[10px] font-bold">OUTBOUND CONTRACTOR</span>`;

          return `
            <div class="p-3.5 rounded-xl border ${boxStyle} space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  ${badgeHtml}
                  <span class="font-bold text-xs text-white">${escapeHtml(msg.senderName)}</span>
                </div>
                <span class="font-mono-telemetry text-[10px] text-slate-400">${escapeHtml(
                  msg.timestamp
                )}</span>
              </div>
              <p class="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-line">${escapeHtml(
                msg.body
              )}</p>
            </div>
          `;
        })
        .join('');
      messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
    }

    // Render Pane 3 Permit & CAD Dossier
    const cad = thread.cadDetails || {};
    if (dossierValuationEl) dossierValuationEl.textContent = thread.dealValuation || '$240,000';
    if (dossierHeadlineEl) dossierHeadlineEl.textContent = thread.headline;
    if (dossierAddressEl) dossierAddressEl.textContent = thread.propertyAddress;
    if (dossierParcelEl) dossierParcelEl.textContent = cad.parcelId || 'CAD-VERIFIED';
    if (dossierAssessedEl) dossierAssessedEl.textContent = cad.assessedValue || '$1,850,000';
    if (dossierOwnerEl) dossierOwnerEl.textContent = cad.deededOwner || 'Verified Property Owner';
    if (dossierFootprintEl) {
      dossierFootprintEl.textContent = `${cad.buildingSqFt || '18,500 Sq Ft'} • ${
        cad.lotAcres || '2.4 Acres'
      } • ${cad.countyName || 'County CAD Verified'}`;
    }
  }

  function renderFullRoom(state) {
    if (!state || !state.ok) return;
    roomState = state;
    const c = state.contractor || {};
    const b = state.briefing || {};
    if (contractorTitleEl) {
      contractorTitleEl.textContent = `${c.companyName || 'Contractor'} (${
        b.territoryZip || c.baseZip || '78130'
      }) — Conversation & Follow-Up Room`;
    }
    if (kbBadgeEl && state.knowledgeBase) {
      kbBadgeEl.textContent = `🧠 SHOP DOSSIER ACTIVE: ${(
        state.knowledgeBase.coreServices || []
      ).length} SERVICES LOADED`;
    }
    if (!selectedThreadId && Array.isArray(state.threads) && state.threads[0]) {
      selectedThreadId = state.threads[0].id;
    }
    renderMetrics(state.metrics);
    renderKnowledgeBaseDrawer(state.knowledgeBase);
    renderTwilioAndScoutAlerts(state.twilioA2PState, state.scoutAlertLogs);
    renderThreadList();
    renderActiveThread();
  }

  function renderTwilioAndScoutAlerts(a2p = {}, logs = []) {
    const master = a2p.scoutToContractorAlerts || {};
    const twoStage = a2p.twoStageProvisioning || {};
    if (a2pMasterSummaryEl && master.masterSenderNumber) {
      a2pMasterSummaryEl.textContent = `Tiberius AI LLC Master 10DLC (${master.masterSenderNumber}) → ${
        master.contractorMobile || '(830) 555-0194'
      }`;
    }
    if (a2pSubaccountStagePillEl && twoStage.currentStage) {
      a2pSubaccountStagePillEl.textContent = twoStage.currentStage;
    }
    if (a2pStageBadgeEl && twoStage.currentStage) {
      a2pStageBadgeEl.textContent =
        twoStage.currentStage === 'STAGE_2_DEDICATED_SUBACCOUNT'
          ? 'STAGE 2 DEDICATED 10DLC'
          : 'MASTER A2P + BRIDGE POOL';
    }
    if (a2pSubaccountDescEl && twoStage.stageLabel) {
      a2pSubaccountDescEl.textContent = twoStage.stageLabel;
    }
    if (btnToggleA2pStage && twoStage.currentStage) {
      btnToggleA2pStage.textContent =
        twoStage.currentStage === 'STAGE_2_DEDICATED_SUBACCOUNT'
          ? '↺ Switch Back to Stage 1 Bridge Pool'
          : '⚡ Promote to Stage 2 Dedicated Subaccount';
    }
    if (scoutAlertCountPillEl) {
      scoutAlertCountPillEl.textContent = `${Array.isArray(logs) ? logs.length : 0} sent`;
    }
    if (btnToggleApiKeys && a2p.envStatus) {
      const twReady = a2p.envStatus.hasTwilioEnvKeys;
      const reReady = a2p.envStatus.hasResendEnvKey;
      btnToggleApiKeys.textContent =
        twReady && reReady
          ? '✓ Twilio & Resend Server Keys Active ▾'
          : twReady
          ? '✓ Twilio Active on Server • Add Resend Key ▾'
          : '🔑 Configure Resend / Twilio Keys ▾';
    }
    if (scoutAlertsLogListEl && Array.isArray(logs)) {
      scoutAlertsLogListEl.innerHTML = logs
        .slice(0, 6)
        .map(
          (entry) => `
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
            <div class="flex items-center justify-between gap-1.5 text-[10px] font-mono-telemetry">
              <span class="${
                String(entry.alertType || '').includes('HOT') ? 'text-amber-300' : 'text-emerald-400'
              } font-bold">${escapeHtml(entry.alertType)}</span>
              <span class="text-slate-400">${escapeHtml(entry.timestamp)}</span>
            </div>
            <p class="text-[11px] text-slate-200 leading-snug">${escapeHtml(entry.smsBody)}</p>
          </div>
        `
        )
        .join('');
    }
  }

  async function loadRoomState() {
    try {
      const resp = await fetch(`/api/recon/inbox?token=${encodeURIComponent(activeToken)}`);
      const data = await resp.json();
      if (data && data.ok) {
        renderFullRoom(data);
      }
    } catch (_err) {
      // Ignore
    }
  }

  async function requestAiDraft(actionType, statusLabel) {
    if (!selectedThreadId) return;
    if (drafterStatusPill) drafterStatusPill.textContent = statusLabel || 'DRAFTING...';
    try {
      const resp = await fetch('/api/recon/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken,
          action: actionType,
          threadId: selectedThreadId
        })
      });
      const data = await resp.json();
      if (data && data.ok && data.draftText && replyTextarea) {
        replyTextarea.value = data.draftText;
        replyTextarea.focus();
        if (drafterStatusPill) {
          drafterStatusPill.textContent = '✓ DRAFTED FROM SHOP KNOWLEDGE BASE';
        }
      }
    } catch (_err) {
      if (drafterStatusPill) drafterStatusPill.textContent = 'READY ✓';
    }
  }

  if (btnDraftKbReply) {
    btnDraftKbReply.addEventListener('click', () =>
      requestAiDraft('draft_kb_reply', 'PULLING SHOP KNOWLEDGE BASE...')
    );
  }
  if (btnDraftDay3Bump) {
    btnDraftDay3Bump.addEventListener('click', () =>
      requestAiDraft('draft_day3_bump', 'DRAFTING DAY-3 BUMP...')
    );
  }
  if (btnDraftSiteWalk) {
    btnDraftSiteWalk.addEventListener('click', () =>
      requestAiDraft('draft_site_walk', 'PROPOSING SITE WALK...')
    );
  }
  if (btnDraftNativeSim) {
    btnDraftNativeSim.addEventListener('click', async () => {
      if (replyChannelSelect) replyChannelSelect.value = 'NATIVE_SIM_SMS';
      await requestAiDraft('draft_native_sim_sms', 'DRAFTING NATIVE SIM TEXT...');
    });
  }

  if (btnNativeSimLaunch) {
    btnNativeSimLaunch.addEventListener('click', async () => {
      if (!roomState || !selectedThreadId) return;
      const activeThread =
        roomState.threads.find((t) => t.id === selectedThreadId) || roomState.threads[0] || {};
      const body =
        (replyTextarea && replyTextarea.value.trim()) ||
        activeThread.nativeSimDraft ||
        'Hey — just sent you an email regarding your permit filing. Open to a quick site walk Thursday at 9am?';

      try {
        const testCfg = getTestOverridesAndConfig();
        const resp = await fetch('/api/recon/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            threadId: selectedThreadId,
            channel: 'NATIVE_SIM_SMS',
            messageBody: body,
            overridePhone: testCfg.overridePhone,
            providerConfig: testCfg.providerConfig
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.roomState) {
          if (replyTextarea) replyTextarea.value = '';
          renderFullRoom(data.roomState);
          if (replySendFeedback) {
            replySendFeedback.textContent =
              '✓ NATIVE SIM TEXT LOGGED & PRE-FILLED FOR YOUR PERSONAL PHONE SIM ($0 A2P RISK)';
            replySendFeedback.classList.remove('hidden');
            setTimeout(() => replySendFeedback.classList.add('hidden'), 4500);
          }
          if (data.nativeSimUri) {
            window.location.href = data.nativeSimUri;
          }
        }
      } catch (_err) {
        // Ignore
      }
    });
  }

  if (btnLogVoicemail) {
    btnLogVoicemail.addEventListener('click', async () => {
      if (!selectedThreadId) return;
      try {
        const resp = await fetch('/api/recon/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            action: 'log_voicemail_left',
            threadId: selectedThreadId
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.roomState) {
          renderFullRoom(data.roomState);
        }
      } catch (_err) {
        // Ignore
      }
    });
  }

  if (replyForm) {
    replyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = replyTextarea ? replyTextarea.value.trim() : '';
      if (!body || !selectedThreadId) return;

      const channel = replyChannelSelect ? replyChannelSelect.value : 'RESEND_EMAIL';

      try {
        const testCfg = getTestOverridesAndConfig();
        const resp = await fetch('/api/recon/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            threadId: selectedThreadId,
            messageBody: body,
            channel,
            overrideEmail: testCfg.overrideEmail,
            overridePhone: testCfg.overridePhone,
            providerConfig: testCfg.providerConfig
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.roomState) {
          if (replyTextarea) replyTextarea.value = '';
          renderFullRoom(data.roomState);
          const pr = data.providerReceipt || {};
          if (replySendFeedback) {
            const replyTo = pr.replyToAddress || '';
            replySendFeedback.textContent =
              pr.provider === 'RESEND_LIVE'
                ? `✅ DELIVERED LIVE VIA RESEND TO ${pr.to} (ID: ${pr.providerMessageId})`
                : pr.provider === 'TWILIO_MASTER_A2P_LIVE'
                ? `✅ DELIVERED LIVE VIA TWILIO SMS TO ${pr.toPhone} (SID: ${pr.twilioSid})`
                : replyTo
                ? `✓ SENT (${pr.deliveryStatus}) • REPLY-TO: ${replyTo}`
                : '✓ REPLY DISPATCHED & LOGGED IN CONVERSATION TIMELINE';
            replySendFeedback.classList.remove('hidden');
            setTimeout(() => replySendFeedback.classList.add('hidden'), 6000);
          }

          // Optional native device handoff if contractor chose Native SIM SMS or Native Mail
          const activeThread =
            roomState.threads.find((t) => t.id === selectedThreadId) || {};
          const targetEmail = testCfg.overrideEmail || activeThread.contactEmail;
          if (channel === 'NATIVE_SIM_SMS' && data.nativeSimUri) {
            window.location.href = data.nativeSimUri;
          } else if (channel === 'NATIVE_EMAIL' && targetEmail) {
            window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(
              'Re: ' + (activeThread.headline || 'Permit Bid')
            )}&body=${encodeURIComponent(body)}`;
          }
        }
      } catch (_err) {
        // Ignore
      }
    });
  }

  if (btnSendLiveTestEmail) {
    btnSendLiveTestEmail.addEventListener('click', async () => {
      const testCfg = getTestOverridesAndConfig();
      if (!testCfg.overrideEmail) {
        showLiveTestReceipt(
          '⚠️ Please type your own email address in <strong>YOUR TEST EMAIL ADDRESS (TO:)</strong> above first.',
          true
        );
        if (testOverrideEmailEl) testOverrideEmailEl.focus();
        return;
      }

      const activeThread =
        (roomState &&
          Array.isArray(roomState.threads) &&
          roomState.threads.find((t) => t.id === selectedThreadId)) ||
        (roomState && roomState.threads && roomState.threads[0]) ||
        {};
      const messageBody =
        (replyTextarea && replyTextarea.value.trim()) ||
        `Hi — this is a live Tiberius Recon™ test email for ${
          activeThread.headline || 'your commercial permit'
        } (${
          activeThread.propertyAddress || '78130'
        }). Reply directly to this email to test the Conversation Room inbound webhook! — ${
          roomState?.knowledgeBase?.signatureLine || 'Tiberius Recon'
        }`;

      btnSendLiveTestEmail.textContent = '📧 Sending Live Test Email...';
      try {
        const resp = await fetch('/api/recon/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            threadId: selectedThreadId || 'thread-deal-1',
            channel: 'RESEND_EMAIL',
            messageBody,
            overrideEmail: testCfg.overrideEmail,
            providerConfig: testCfg.providerConfig
          })
        });
        const data = await resp.json();
        if (data && data.ok) {
          if (data.roomState) renderFullRoom(data.roomState);
          const pr = data.providerReceipt || {};
          if (pr.provider === 'RESEND_LIVE') {
            showLiveTestReceipt(
              `✅ <strong>LIVE EMAIL DELIVERED VIA RESEND!</strong><br/>To: ${escapeHtml(
                pr.to
              )}<br/>From: ${escapeHtml(pr.from)}<br/>Resend ID: ${escapeHtml(
                pr.providerMessageId
              )}<br/>Reply-To: ${escapeHtml(pr.replyToAddress)}`,
              false
            );
          } else {
            if (testApiKeysDrawer) testApiKeysDrawer.classList.remove('hidden');
            showLiveTestReceipt(
              `⚠️ <strong>QUEUED IN SIMULATION MODE (${escapeHtml(
                pr.deliveryStatus
              )})</strong><br/>To send a real email to <strong>${escapeHtml(
                testCfg.overrideEmail
              )}</strong>, paste your <code>RESEND_API_KEY</code> (starts with <code>re_</code>) in the <strong>Configure Resend / Twilio Keys</strong> box above (or in Vercel Env Vars) and click Send again.`,
              true
            );
          }
        }
      } catch (err) {
        showLiveTestReceipt(`❌ Error: ${escapeHtml(err.message)}`, true);
      } finally {
        btnSendLiveTestEmail.textContent = '📧 Send Live Test Email (Resend)';
      }
    });
  }

  if (btnSendLiveTestSms) {
    btnSendLiveTestSms.addEventListener('click', async () => {
      const testCfg = getTestOverridesAndConfig();
      if (!testCfg.overridePhone) {
        showLiveTestReceipt(
          '⚠️ Please type your mobile number in <strong>YOUR TEST CELL NUMBER (TO:)</strong> above first.',
          true
        );
        if (testOverridePhoneEl) testOverridePhoneEl.focus();
        return;
      }

      btnSendLiveTestSms.textContent = '📲 Sending Live Test SMS...';
      try {
        const resp = await fetch('/api/recon/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            action: 'send_morning_briefing_sms',
            overridePhone: testCfg.overridePhone,
            providerConfig: testCfg.providerConfig
          })
        });
        const data = await resp.json();
        if (data && data.ok) {
          if (data.roomState) renderFullRoom(data.roomState);
          const r = data.receipt || {};
          if (r.provider === 'TWILIO_MASTER_A2P_LIVE') {
            showLiveTestReceipt(
              `✅ <strong>LIVE SMS DELIVERED VIA TWILIO!</strong><br/>To: ${escapeHtml(
                r.toPhone
              )}<br/>From: ${escapeHtml(r.fromNumber)}<br/>Twilio SID: ${escapeHtml(r.twilioSid)}`,
              false
            );
          } else {
            if (testApiKeysDrawer) testApiKeysDrawer.classList.remove('hidden');
            showLiveTestReceipt(
              `⚠️ <strong>QUEUED IN SIMULATION MODE (${escapeHtml(
                r.deliveryStatus
              )})</strong><br/>To deliver a real Twilio SMS to <strong>${escapeHtml(
                testCfg.overridePhone
              )}</strong>, paste your <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code> in the <strong>Configure Resend / Twilio Keys</strong> box above (or use the <strong>📱 Text from My Phone (Native SIM)</strong> button for $0 key-free texting).`,
              true
            );
          }
        }
      } catch (err) {
        showLiveTestReceipt(`❌ Error: ${escapeHtml(err.message)}`, true);
      } finally {
        btnSendLiveTestSms.textContent = '📲 Send Live Test Text (Twilio SMS)';
      }
    });
  }

  if (testScout7amSmsBtn) {
    testScout7amSmsBtn.addEventListener('click', async () => {
      testScout7amSmsBtn.textContent = '📲 Sending 6:45 AM Scout SMS...';
      try {
        const testCfg = getTestOverridesAndConfig();
        const resp = await fetch('/api/recon/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            action: 'send_morning_briefing_sms',
            overridePhone: testCfg.overridePhone,
            providerConfig: testCfg.providerConfig
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.roomState) {
          renderFullRoom(data.roomState);
        }
      } catch (_err) {
        // Ignore
      } finally {
        testScout7amSmsBtn.textContent = '✓ 6:45 AM Scout SMS Sent to Your Cell';
        setTimeout(() => {
          testScout7amSmsBtn.textContent = '📲 Test 6:45 AM Scout SMS Alert';
        }, 3500);
      }
    });
  }

  if (btnToggleA2pStage) {
    btnToggleA2pStage.addEventListener('click', async () => {
      const currentStage = roomState?.twilioA2PState?.twoStageProvisioning?.currentStage;
      const nextStage =
        currentStage === 'STAGE_2_DEDICATED_SUBACCOUNT'
          ? 'STAGE_1_BRIDGE_POOL'
          : 'STAGE_2_DEDICATED_SUBACCOUNT';
      try {
        const resp = await fetch('/api/recon/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            action: 'provision_twilio_subaccount',
            stage: nextStage
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.roomState) {
          renderFullRoom(data.roomState);
        }
      } catch (_err) {
        // Ignore
      }
    });
  }

  if (simulateReplyBtn) {
    simulateReplyBtn.addEventListener('click', async () => {
      if (!selectedThreadId) return;
      simulateReplyBtn.textContent = '⚡ Simulating Prospect Reply...';
      try {
        const resp = await fetch('/api/recon/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            action: 'simulate_inbound_reply',
            threadId: selectedThreadId
          })
        });
        const data = await resp.json();
        if (data && data.ok) {
          // Also fire the automatic Scout-to-Contractor Hot Reply SMS Alert
          const alertResp = await fetch('/api/recon/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: activeToken,
              action: 'send_hot_reply_sms',
              threadId: selectedThreadId
            })
          });
          const alertData = await alertResp.json();
          if (alertData && alertData.ok && alertData.roomState) {
            renderFullRoom(alertData.roomState);
          } else if (data.roomState) {
            renderFullRoom(data.roomState);
          }
        }
      } catch (_err) {
        // Ignore
      } finally {
        simulateReplyBtn.textContent = '⚡ Simulate Live Prospect Reply';
      }
    });
  }

  if (activeStageSelectEl) {
    activeStageSelectEl.addEventListener('change', async () => {
      if (!selectedThreadId) return;
      const newStage = activeStageSelectEl.value;
      try {
        const resp = await fetch('/api/recon/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            action: 'update_stage',
            threadId: selectedThreadId,
            stage: newStage
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.roomState) {
          renderFullRoom(data.roomState);
        }
      } catch (_err) {
        // Ignore
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-filter') || 'ALL';
      filterBtns.forEach((b) => {
        const isCurrent = b === btn;
        b.className = isCurrent
          ? 'inbox-filter-btn px-2.5 py-1 rounded-lg text-[11px] font-mono-telemetry bg-blue-600 text-white font-bold cursor-pointer'
          : 'inbox-filter-btn px-2.5 py-1 rounded-lg text-[11px] font-mono-telemetry bg-slate-800 text-slate-300 border border-slate-700 hover:text-white cursor-pointer';
      });
      renderThreadList();
    });
  });

  loadRoomState();
})();
