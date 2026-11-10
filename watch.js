/**
 * TIBERIUS RECON™ — STANDALONE LOOM-STYLE VIDEO PLAYER & 3% + 97% AI STITCH ENGINE
 * (watch.js)
 *
 * Powers `/recon/watch` (`watch.html`):
 *   - Mode 1 (`PREMADE_STANDARD`): Full pre-made video (`video/TIBERIUS RECON.mp4`) with zero personalization
 *     and zero sales-page scrolling.
 *   - Mode 2 (`PERSONALIZED_WRAPPER`): Pre-made video wrapped with dynamic prospect company name,
 *     contact name, territory ZIP, and 3 live unlocked permits in the right-hand Loom sidebar ($0 cost).
 *   - Mode 3 (`AI_STITCH_3_97`): Dual-buffer 5-second "3% Personalized Intro" (ElevenLabs voiceover +
 *     Loom Circular Bubble or HeyGen/D-ID MP4) that hands off seamlessly into the 97% Master Video at 0:05.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__TIBERIUS_WATCH_APP_INITIALIZED__) return;
  window.__TIBERIUS_WATCH_APP_INITIALIZED__ = true;

  const urlParams = new URLSearchParams(window.location.search);

  // DOM Elements — Header & Stage
  const watchModePill = document.getElementById('watch-mode-pill');
  const watchViewsPill = document.getElementById('watch-views-pill');
  const watchCopyLinkBtn = document.getElementById('watch-copy-link-btn');
  const watchToggleStudioBtn = document.getElementById('watch-toggle-studio-btn');
  const navOpenBriefingBtn = document.getElementById('nav-open-briefing-btn');

  const watchBadgeMode = document.getElementById('watch-badge-mode');
  const watchBadgeTerritory = document.getElementById('watch-badge-territory');
  const watchMainTitle = document.getElementById('watch-main-title');
  const watchMainSubtitle = document.getElementById('watch-main-subtitle');

  // DOM Elements — Video & Dual-Buffer Stitch
  const loomPersonalizedBanner = document.getElementById('loom-personalized-banner');
  const loomPersonalizedBannerText = document.getElementById('loom-personalized-banner-text');
  const loomMainVideo = document.getElementById('loom-main-video');
  const loomIntroVideo = document.getElementById('loom-intro-video');
  const loomIntroAudio = document.getElementById('loom-intro-audio');
  const loomIntroBoardOverlay = document.getElementById('loom-intro-board-overlay');
  const introBoardCountdown = document.getElementById('intro-board-countdown');
  const introBoardEyebrow = document.getElementById('intro-board-eyebrow');
  const introBoardHeadline = document.getElementById('intro-board-headline');
  const introBoardScriptCaption = document.getElementById('intro-board-script-caption');
  const introBoardProgress = document.getElementById('intro-board-progress');
  const skipIntroBtn = document.getElementById('skip-intro-btn');

  const loomAvatarBubble = document.getElementById('loom-avatar-bubble');
  const loomBubbleStatus = document.getElementById('loom-bubble-status');
  const loomBigPlayOverlay = document.getElementById('loom-big-play-overlay');
  const loomPlayCtaLabel = document.getElementById('loom-play-cta-label');
  const loomPlaySubLabel = document.getElementById('loom-play-sub-label');
  const toggleBubbleVisibilityBtn = document.getElementById('toggle-bubble-visibility-btn');
  const watchIntroStatusLabel = document.getElementById('watch-intro-status-label');
  const loomChaptersGrid = document.getElementById('loom-chapters-grid');

  // DOM Elements — Right Sidebar
  const watchSenderName = document.getElementById('watch-sender-name');
  const watchSidebarHeading = document.getElementById('watch-sidebar-heading');
  const watchSidebarDesc = document.getElementById('watch-sidebar-desc');
  const watchPrimaryCtaBtn = document.getElementById('watch-primary-cta-btn');
  const watchPrimaryCtaText = document.getElementById('watch-primary-cta-text');
  const watchGdocCtaBtn = document.getElementById('watch-gdoc-cta-btn');
  const watchPermitsHeading = document.getElementById('watch-permits-heading');
  const watchSidebarPermits = document.getElementById('watch-sidebar-permits');

  // DOM Elements — Loom Studio Drawer
  const loomStudioDrawer = document.getElementById('loom-studio-drawer');
  const studioCloseBtn = document.getElementById('studio-close-btn');
  const studioProspectSelect = document.getElementById('studio-prospect-select');
  const studioPersonalizationFields = document.getElementById('studio-personalization-fields');
  const studioCompanyInput = document.getElementById('studio-company-input');
  const studioContactInput = document.getElementById('studio-contact-input');
  const studioZipInput = document.getElementById('studio-zip-input');
  const studioTradeSelect = document.getElementById('studio-trade-select');
  const studioAiStitchBox = document.getElementById('studio-ai-stitch-box');
  const studioGenerateAiBtn = document.getElementById('studio-generate-ai-btn');
  const studioIntroScript = document.getElementById('studio-intro-script');
  const studioVoiceSelect = document.getElementById('studio-voice-select');
  const studioCustomAudioInput = document.getElementById('studio-custom-audio-input');
  const studioCustomVideoInput = document.getElementById('studio-custom-video-input');
  const studioBubbleCheckbox = document.getElementById('studio-bubble-checkbox');
  const studioApplyBtn = document.getElementById('studio-apply-btn');
  const studioResetStandardBtn = document.getElementById('studio-reset-standard-btn');
  const studioShareUrlOutput = document.getElementById('studio-share-url-output');
  const studioCopyUrlBtn = document.getElementById('studio-copy-url-btn');

  let state = {
    watchData: null,
    studioMode: 'PERSONALIZED_WRAPPER',
    selectedToken: urlParams.get('token') || urlParams.get('t') || '',
    videoId: urlParams.get('v') || urlParams.get('id') || '',
    isPlayingIntro: false,
    introCompleted: false,
    introTimerId: null,
    hasLoggedPlay: false,
    hasLoggedHalfway: false,
    bubbleVisible: true
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function trackWatchTelemetry(eventType, extra = {}) {
    const w = state.watchData || {};
    fetch('/api/recon/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_event',
        videoId: w.videoId || state.videoId,
        token: w.token || state.selectedToken,
        companyName: (w.prospect && w.prospect.companyName) || '',
        contactName: (w.prospect && w.prospect.contactName) || '',
        eventType,
        ...extra
      })
    }).catch(() => {});
  }

  function updateStudioModeUI(mode) {
    state.studioMode = mode;
    document.querySelectorAll('.studio-mode-btn').forEach((btn) => {
      const btnMode = btn.getAttribute('data-studio-mode');
      if (btnMode === mode) {
        btn.classList.add('active', 'border-blue-500', 'bg-blue-600/20');
        btn.classList.remove('border-slate-700', 'bg-slate-950');
      } else {
        btn.classList.remove('active', 'border-blue-500', 'bg-blue-600/20');
        btn.classList.add('border-slate-700', 'bg-slate-950');
      }
    });

    if (studioPersonalizationFields) {
      if (mode === 'PREMADE_STANDARD') {
        studioPersonalizationFields.classList.add('opacity-40', 'pointer-events-none');
      } else {
        studioPersonalizationFields.classList.remove('opacity-40', 'pointer-events-none');
      }
    }

    if (studioAiStitchBox) {
      if (mode === 'AI_STITCH_3_97') {
        studioAiStitchBox.classList.remove('hidden');
      } else {
        studioAiStitchBox.classList.add('hidden');
      }
    }
  }

  function renderWatchPage(data) {
    if (!data) return;
    state.watchData = data;
    state.introCompleted = false;

    const p = data.prospect || {};
    const player = data.player || {};
    const cta = data.cta || {};
    const telemetry = data.telemetry || {};
    const isPersonalized = Boolean(data.isPersonalized && data.mode !== 'PREMADE_STANDARD');
    const isAiStitch = data.mode === 'AI_STITCH_3_97';

    document.title = `${data.title} | Tiberius Recon™`;

    if (watchModePill) {
      watchModePill.textContent = isAiStitch
        ? '3% AI INTRO + 97% MASTER STITCH'
        : isPersonalized
        ? `PERSONALIZED FOR ${String(p.companyName || '').toUpperCase()}`
        : 'STANDALONE VIDEO WALKTHROUGH';
    }
    if (watchViewsPill && telemetry.viewsCount) {
      watchViewsPill.textContent = `👁️ ${telemetry.viewsCount} views`;
    }

    if (watchBadgeMode) {
      watchBadgeMode.textContent = isAiStitch
        ? '🎙️ 3% AI PERSONALIZED INTRO + 97% SYSTEM WALKTHROUGH'
        : isPersonalized
        ? `🎯 PREPARED FOR ${String(p.companyName || '').toUpperCase()}`
        : '90-SECOND SYSTEM WALKTHROUGH';
    }
    if (watchBadgeTerritory) {
      watchBadgeTerritory.textContent = isPersonalized
        ? `TERRITORY: ${p.territoryZip} (${p.city}) • ${String(p.tradeName || '').toUpperCase()}`
        : 'OVERNIGHT PERMIT & CAD TAX ROLL ENGINE';
    }

    if (watchMainTitle) watchMainTitle.textContent = data.title;
    if (watchMainSubtitle) watchMainSubtitle.textContent = data.subtitle;

    // Personalized Banner Pill Inside Player
    if (loomPersonalizedBanner && loomPersonalizedBannerText) {
      if (isPersonalized) {
        loomPersonalizedBanner.classList.remove('hidden');
        loomPersonalizedBannerText.textContent = `👋 PREPARED FOR ${String(
          p.contactName && p.contactName !== 'Estimating & Operations'
            ? `${p.contactName} @ ${p.companyName}`
            : p.companyName
        ).toUpperCase()} • ${p.territoryZip}`;
      } else {
        loomPersonalizedBanner.classList.add('hidden');
      }
    }

    // Play Overlay Labels
    if (loomPlayCtaLabel) {
      loomPlayCtaLabel.textContent = isPersonalized
        ? `▶ Watch ${p.companyName}'s 90-Second Recon Walkthrough`
        : '▶ Click to Watch 90-Second Walkthrough (1:30)';
    }
    if (loomPlaySubLabel) {
      loomPlaySubLabel.textContent = isAiStitch
        ? 'Includes 5s Personalized Intro + Full 7:00 AM System Walkthrough'
        : isPersonalized
        ? `Calibrated for ${p.territoryZip} (${p.city}) • ${p.tradeName}`
        : 'Zero scrolling required • Instant playback';
    }

    if (watchIntroStatusLabel) {
      watchIntroStatusLabel.textContent = isAiStitch
        ? 'Mode: 3% AI Intro (0:00–0:05) + 97% Master Video'
        : isPersonalized
        ? `Mode: Pre-Made Video + ${p.companyName} Wrapper`
        : 'Mode: Pre-Made Master Video (No Personalization)';
    }

    // Configure 5-Second Intro Board Content
    if (introBoardEyebrow) {
      introBoardEyebrow.textContent = `07:00 AM PERMIT QUEUE • ${p.territoryZip} (${p.city}) • ${p.tradeName}`;
    }
    if (introBoardHeadline) {
      introBoardHeadline.textContent = isPersonalized
        ? `Prepared for ${p.companyName}: 3 Active ${p.tradeName} Permits Pulled Overnight`
        : '3 Verified Commercial Permits Pulled Overnight in Your Territory';
    }
    if (introBoardScriptCaption) {
      introBoardScriptCaption.textContent = `"${player.introScript || ''}"`;
    }

    // Configure Audio / Video Buffers for Mode 3
    if (loomIntroAudio) {
      if (isAiStitch && player.introAudioUrl) {
        loomIntroAudio.src = player.introAudioUrl;
      } else {
        loomIntroAudio.removeAttribute('src');
      }
    }
    if (loomIntroVideo) {
      if (isAiStitch && player.introVideoUrl) {
        loomIntroVideo.src = player.introVideoUrl;
      } else {
        loomIntroVideo.removeAttribute('src');
        loomIntroVideo.classList.add('hidden');
      }
    }

    // Circular Bubble Visibility
    state.bubbleVisible = player.enableCircularBubble !== false;
    if (loomAvatarBubble) {
      if (state.bubbleVisible) {
        loomAvatarBubble.classList.remove('hidden');
      } else {
        loomAvatarBubble.classList.add('hidden');
      }
    }
    if (loomBubbleStatus) {
      loomBubbleStatus.textContent = isPersonalized
        ? `FOR ${String(p.contactFirstName || 'YOU').toUpperCase()}`
        : 'BILLY • AI';
    }

    // Reactions
    if (telemetry.reactions) {
      Object.entries(telemetry.reactions).forEach(([key, count]) => {
        const el = document.getElementById(`react-count-${key}`);
        if (el) el.textContent = String(count);
      });
    }

    // Right Sidebar CTA & Permits
    if (watchSenderName && data.sender) {
      watchSenderName.textContent = data.sender.name;
    }
    if (watchSidebarHeading) {
      watchSidebarHeading.textContent = isPersonalized
        ? `Open ${p.companyName}'s Live 7:00 AM Briefing`
        : 'Test-Drive Your Live 7:00 AM Permit Briefing Queue';
    }
    if (watchSidebarDesc) {
      watchSidebarDesc.textContent = isPersonalized
        ? `We loaded 3 unlocked ${p.tradeName} permits in ${p.territoryZip} (${p.city}) into a live sandbox for ${p.companyName}.${p.siteLeakSummary ? ` Plus: ${p.siteLeakSummary}.` : ''}`
        : 'Open the live interactive briefing to inspect the 3 unlocked permits, expand the County Appraisal District tax roll X-Ray, and test the 1-tap Approve & Send workflow.';
    }
    if (watchPrimaryCtaBtn && cta.primaryUrl) {
      watchPrimaryCtaBtn.href = cta.primaryUrl;
    }
    if (navOpenBriefingBtn && cta.primaryUrl) {
      navOpenBriefingBtn.href = cta.primaryUrl;
    }
    if (watchPrimaryCtaText && cta.primaryLabel) {
      watchPrimaryCtaText.textContent = cta.primaryLabel;
    }

    if (watchGdocCtaBtn) {
      if (p.googleDocUrl) {
        watchGdocCtaBtn.href = p.googleDocUrl;
        watchGdocCtaBtn.classList.remove('hidden');
        watchGdocCtaBtn.classList.add('inline-flex');
      } else {
        watchGdocCtaBtn.classList.add('hidden');
        watchGdocCtaBtn.classList.remove('inline-flex');
      }
    }

    if (watchPermitsHeading) {
      watchPermitsHeading.textContent = isPersonalized
        ? `3 Pulled Permits for ${p.companyName} (${p.territoryZip})`
        : `3 Sample Permits in ${p.territoryZip} (${p.city})`;
    }

    if (watchSidebarPermits && Array.isArray(data.sidebarPermits)) {
      watchSidebarPermits.innerHTML = data.sidebarPermits
        .map(
          (item) => `
          <div class="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 font-mono-telemetry text-[10px] text-amber-300 font-bold">
                ${escapeHtml(item.permitNumber)}
              </span>
              <span class="font-mono-telemetry text-[10px] text-emerald-400 font-bold">
                UNLOCKED #0${escapeHtml(item.rank)}
              </span>
            </div>
            <div class="font-display font-bold text-xs sm:text-sm text-white leading-snug">
              ${escapeHtml(item.headline)}
            </div>
            <div class="text-[11px] text-slate-300">
              📍 ${escapeHtml(item.address)}
            </div>
            <div class="pt-1 border-t border-slate-800/80 font-mono-telemetry text-[11px] text-blue-300 truncate">
              👤 ${escapeHtml(item.contactName)}
            </div>
          </div>`
        )
        .join('');
    }

    // Sync Studio Form Fields
    if (studioCompanyInput) {
      studioCompanyInput.value = isPersonalized ? p.companyName : '';
    }
    if (studioContactInput) {
      studioContactInput.value =
        isPersonalized && p.contactName !== 'Estimating & Operations' ? p.contactName : '';
    }
    if (studioZipInput) {
      studioZipInput.value = p.territoryZip || '78130';
    }
    if (studioTradeSelect && p.tradeName) {
      studioTradeSelect.value = p.tradeName;
    }
    if (studioIntroScript && player.introScript) {
      studioIntroScript.value = player.introScript;
    }
    if (studioShareUrlOutput) {
      studioShareUrlOutput.value = window.location.href;
    }

    updateStudioModeUI(data.mode || 'PREMADE_STANDARD');
  }

  /**
   * Starts the 97% Master Video (`#loom-main-video`) immediately with zero flash.
   */
  function startMainMasterVideo(seekSeconds = null) {
    if (state.introTimerId) {
      clearInterval(state.introTimerId);
      state.introTimerId = null;
    }
    state.isPlayingIntro = false;
    state.introCompleted = true;

    if (loomIntroAudio) {
      try {
        loomIntroAudio.pause();
      } catch (_e) {}
    }
    if (loomIntroVideo) {
      try {
        loomIntroVideo.pause();
      } catch (_e) {}
      loomIntroVideo.classList.add('hidden');
    }
    if (loomIntroBoardOverlay) {
      loomIntroBoardOverlay.classList.add('hidden');
    }
    if (loomBigPlayOverlay) {
      loomBigPlayOverlay.classList.add('hidden');
    }
    if (loomAvatarBubble) {
      loomAvatarBubble.classList.add('is-speaking');
    }

    if (loomMainVideo) {
      if (typeof seekSeconds === 'number' && !Number.isNaN(seekSeconds)) {
        try {
          loomMainVideo.currentTime = seekSeconds;
        } catch (_e) {}
      }
      loomMainVideo.controls = true;
      const playPromise = loomMainVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }
  }

  /**
   * Handles clicking the big Loom Play Overlay:
   * - If Mode 3 (`AI_STITCH_3_97`) is active and intro hasn't played yet, runs the 5-second
   *   3% personalized intro first, then seamlessly transitions into `loomMainVideo`.
   * - Otherwise, immediately plays `loomMainVideo`.
   */
  function handleMasterPlayClick() {
    if (!state.hasLoggedPlay) {
      state.hasLoggedPlay = true;
      trackWatchTelemetry('VIDEO_PLAYED');
    }

    if (loomBigPlayOverlay) {
      loomBigPlayOverlay.classList.add('hidden');
    }

    const w = state.watchData || {};
    const player = w.player || {};
    const isAiStitch = w.mode === 'AI_STITCH_3_97';

    if (isAiStitch && !state.introCompleted) {
      state.isPlayingIntro = true;
      const totalSec = Math.max(3, Math.min(12, Number(player.introDurationSeconds) || 5));
      let elapsedMs = 0;

      if (loomAvatarBubble) {
        loomAvatarBubble.classList.add('is-speaking');
      }

      // If a full-frame HeyGen/D-ID intro video URL was provided, play it in #loom-intro-video
      if (player.introVideoUrl && loomIntroVideo) {
        loomIntroVideo.classList.remove('hidden');
        loomIntroVideo.onended = () => startMainMasterVideo(0);
        loomIntroVideo.onerror = () => startMainMasterVideo(0);
        const vp = loomIntroVideo.play();
        if (vp && typeof vp.catch === 'function') {
          vp.catch(() => startMainMasterVideo(0));
        }
        return;
      }

      // Otherwise show the 5-Second Personalized Permit Board + Loom Circular Bubble + Voiceover Audio
      if (loomIntroBoardOverlay) {
        loomIntroBoardOverlay.classList.remove('hidden');
      }
      if (loomIntroAudio && player.introAudioUrl) {
        loomIntroAudio.currentTime = 0;
        const ap = loomIntroAudio.play();
        if (ap && typeof ap.catch === 'function') {
          ap.catch(() => {});
        }
      }

      state.introTimerId = setInterval(() => {
        elapsedMs += 200;
        const pct = Math.min(100, Math.round((elapsedMs / (totalSec * 1000)) * 100));
        const rem = Math.max(0, Math.ceil(totalSec - elapsedMs / 1000));
        if (introBoardProgress) introBoardProgress.style.width = `${pct}%`;
        if (introBoardCountdown) introBoardCountdown.textContent = `${rem}s`;

        if (elapsedMs >= totalSec * 1000) {
          startMainMasterVideo(0);
        }
      }, 200);
      return;
    }

    startMainMasterVideo();
  }

  if (loomBigPlayOverlay) {
    loomBigPlayOverlay.addEventListener('click', handleMasterPlayClick);
  }
  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', () => startMainMasterVideo(0));
  }

  if (loomMainVideo) {
    loomMainVideo.addEventListener('play', () => {
      if (loomBigPlayOverlay) loomBigPlayOverlay.classList.add('hidden');
      if (loomAvatarBubble) loomAvatarBubble.classList.add('is-speaking');
      if (!state.hasLoggedPlay) {
        state.hasLoggedPlay = true;
        trackWatchTelemetry('VIDEO_PLAYED');
      }
    });

    loomMainVideo.addEventListener('pause', () => {
      if (loomAvatarBubble) loomAvatarBubble.classList.remove('is-speaking');
    });

    loomMainVideo.addEventListener('ended', () => {
      if (loomAvatarBubble) loomAvatarBubble.classList.remove('is-speaking');
      trackWatchTelemetry('WATCHED_COMPLETED', {
        watchedSeconds: Math.round(loomMainVideo.duration || 90)
      });
    });

    loomMainVideo.addEventListener('timeupdate', () => {
      const t = loomMainVideo.currentTime || 0;
      if (!state.hasLoggedHalfway && t >= 40) {
        state.hasLoggedHalfway = true;
        trackWatchTelemetry('WATCHED_50_PCT', { watchedSeconds: Math.round(t) });
      }

      // Highlight active chapter button
      const chapterBtns = document.querySelectorAll('[data-chapter-time]');
      let activeIdx = 0;
      chapterBtns.forEach((btn, idx) => {
        const cTime = Number(btn.getAttribute('data-chapter-time') || 0);
        if (t >= cTime) activeIdx = idx;
      });
      chapterBtns.forEach((btn, idx) => {
        if (idx === activeIdx) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }

  // Speed Pills (`1x`, `1.25x`, `1.5x`, `2x`)
  document.querySelectorAll('[data-loom-speed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const speed = Number(btn.getAttribute('data-loom-speed') || 1);
      if (loomMainVideo) loomMainVideo.playbackRate = speed;
      if (loomIntroVideo) loomIntroVideo.playbackRate = speed;
      document.querySelectorAll('[data-loom-speed]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Chapter Buttons
  if (loomChaptersGrid) {
    loomChaptersGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-chapter-time]');
      if (!btn) return;
      const targetSec = Number(btn.getAttribute('data-chapter-time') || 0);
      startMainMasterVideo(targetSec);
    });
  }

  // Emoji Reactions
  document.querySelectorAll('[data-loom-reaction]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-loom-reaction');
      const countEl = document.getElementById(`react-count-${key}`);
      if (countEl) {
        countEl.textContent = String(Number(countEl.textContent || 0) + 1);
      }
      btn.classList.add('border-emerald-400', 'bg-emerald-500/20');
      trackWatchTelemetry('REACTION_CLICKED', { reactionKey: key });
    });
  });

  // Hide / Show Circular Speaker Bubble
  if (toggleBubbleVisibilityBtn && loomAvatarBubble) {
    toggleBubbleVisibilityBtn.addEventListener('click', () => {
      state.bubbleVisible = !state.bubbleVisible;
      if (state.bubbleVisible) {
        loomAvatarBubble.classList.remove('hidden');
        toggleBubbleVisibilityBtn.textContent = '👤 Hide Bubble';
      } else {
        loomAvatarBubble.classList.add('hidden');
        toggleBubbleVisibilityBtn.textContent = '👤 Show Bubble';
      }
    });
  }

  // Copy Watch Link Button in Top Navbar
  function copyTextToClipboard(text, btnEl, copiedLabel = '✓ Copied!') {
    const orig = btnEl ? btnEl.textContent : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (btnEl) {
      btnEl.textContent = copiedLabel;
      setTimeout(() => {
        btnEl.textContent = orig;
      }, 2200);
    }
  }

  if (watchCopyLinkBtn) {
    watchCopyLinkBtn.addEventListener('click', () => {
      copyTextToClipboard(window.location.href, watchCopyLinkBtn, '✓ Video Link Copied!');
    });
  }
  if (studioCopyUrlBtn && studioShareUrlOutput) {
    studioCopyUrlBtn.addEventListener('click', () => {
      copyTextToClipboard(studioShareUrlOutput.value, studioCopyUrlBtn, '✓ Copied!');
    });
  }

  // Toggle Studio Drawer (`?studio=1` or clicking button)
  if (watchToggleStudioBtn && loomStudioDrawer) {
    watchToggleStudioBtn.addEventListener('click', () => {
      loomStudioDrawer.classList.toggle('hidden');
    });
  }
  if (studioCloseBtn && loomStudioDrawer) {
    studioCloseBtn.addEventListener('click', () => {
      loomStudioDrawer.classList.add('hidden');
    });
  }
  if (urlParams.get('studio') === '1' || urlParams.get('studio') === 'true') {
    if (loomStudioDrawer) loomStudioDrawer.classList.remove('hidden');
  }

  // Studio Mode Buttons
  document.querySelectorAll('.studio-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.getAttribute('data-studio-mode') || 'PERSONALIZED_WRAPPER';
      updateStudioModeUI(m);
    });
  });

  // Studio Prospect Dropdown Auto-Fill
  if (studioProspectSelect) {
    studioProspectSelect.addEventListener('change', () => {
      const opt = studioProspectSelect.options[studioProspectSelect.selectedIndex];
      if (!opt || !opt.value) return;
      state.selectedToken = opt.value;
      if (studioCompanyInput) studioCompanyInput.value = opt.getAttribute('data-company') || '';
      if (studioContactInput) studioContactInput.value = opt.getAttribute('data-contact') || '';
      if (studioZipInput) studioZipInput.value = opt.getAttribute('data-zip') || '78130';
      if (studioTradeSelect) {
        studioTradeSelect.value = opt.getAttribute('data-trade') || 'Commercial Concrete';
      }
      if (state.studioMode === 'PREMADE_STANDARD') {
        updateStudioModeUI('PERSONALIZED_WRAPPER');
      }
    });
  }

  // Studio Auto-Write 5s AI Script & Attach Voiceover
  if (studioGenerateAiBtn) {
    studioGenerateAiBtn.addEventListener('click', async () => {
      const orig = studioGenerateAiBtn.textContent;
      studioGenerateAiBtn.textContent = 'Generating 5s Intro...';
      try {
        const resp = await fetch('/api/recon/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_ai_intro',
            companyName: studioCompanyInput ? studioCompanyInput.value.trim() : '',
            contactName: studioContactInput ? studioContactInput.value.trim() : '',
            territoryZip: studioZipInput ? studioZipInput.value.trim() : '78130',
            tradeName: studioTradeSelect ? studioTradeSelect.value : 'Commercial Concrete',
            customIntroAudioUrl:
              (studioCustomAudioInput && studioCustomAudioInput.value.trim()) ||
              (studioVoiceSelect && studioVoiceSelect.value) ||
              ''
          })
        });
        const data = await resp.json();
        if (data && data.ok) {
          if (studioIntroScript) studioIntroScript.value = data.introScript;
          updateStudioModeUI('AI_STITCH_3_97');
        }
      } catch (_err) {
        // Ignore
      } finally {
        studioGenerateAiBtn.textContent = orig;
      }
    });
  }

  // Apply Studio Settings & Save Standalone Watch Link
  if (studioApplyBtn) {
    studioApplyBtn.addEventListener('click', async () => {
      const orig = studioApplyBtn.textContent;
      studioApplyBtn.textContent = 'Building Link...';

      const isStandard = state.studioMode === 'PREMADE_STANDARD';
      const isAiStitch = state.studioMode === 'AI_STITCH_3_97';
      const companyName = isStandard ? '' : (studioCompanyInput && studioCompanyInput.value.trim()) || '';
      const contactName = isStandard ? '' : (studioContactInput && studioContactInput.value.trim()) || '';
      const territoryZip = (studioZipInput && studioZipInput.value.trim()) || '78130';
      const tradeName = (studioTradeSelect && studioTradeSelect.value) || 'Commercial Concrete';
      const introAudioUrl = isAiStitch
        ? (studioCustomAudioInput && studioCustomAudioInput.value.trim()) ||
          (studioVoiceSelect && studioVoiceSelect.value) ||
          ''
        : '';
      const introVideoUrl = isAiStitch
        ? (studioCustomVideoInput && studioCustomVideoInput.value.trim()) || ''
        : '';

      try {
        const resp = await fetch('/api/recon/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_watch_config',
            mode: state.studioMode,
            token: isStandard ? '' : state.selectedToken,
            companyName,
            contactName,
            territoryZip,
            tradeName,
            introScript: studioIntroScript ? studioIntroScript.value.trim() : '',
            introAudioUrl,
            introVideoUrl,
            enableCircularBubble: studioBubbleCheckbox ? studioBubbleCheckbox.checked : true
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.watch) {
          const newUrl = isStandard
            ? `${window.location.origin}${window.location.pathname}`
            : `${window.location.origin}${data.sharePath}`;
          window.history.replaceState({}, '', newUrl);
          if (studioShareUrlOutput) studioShareUrlOutput.value = newUrl;
          if (loomBigPlayOverlay) loomBigPlayOverlay.classList.remove('hidden');
          renderWatchPage(data.watch);
        }
      } catch (_err) {
        // Fallback URL update if offline
      } finally {
        studioApplyBtn.textContent = '✓ Applied & Link Ready!';
        setTimeout(() => {
          studioApplyBtn.textContent = orig;
        }, 2000);
      }
    });
  }

  // Reset to Pure Pre-Made Video (No Personalization)
  if (studioResetStandardBtn) {
    studioResetStandardBtn.addEventListener('click', async () => {
      state.selectedToken = '';
      state.videoId = '';
      if (studioProspectSelect) studioProspectSelect.value = '';
      if (studioCompanyInput) studioCompanyInput.value = '';
      if (studioContactInput) studioContactInput.value = '';
      updateStudioModeUI('PREMADE_STANDARD');
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, '', cleanUrl);
      if (studioShareUrlOutput) studioShareUrlOutput.value = cleanUrl;
      await loadWatchInitial();
    });
  }

  async function loadWatchInitial() {
    const query = new URLSearchParams(window.location.search);
    try {
      const resp = await fetch(`/api/recon/watch?${query.toString()}`);
      const data = await resp.json();
      if (data && data.ok) {
        renderWatchPage(data);
        trackWatchTelemetry('VIDEO_OPENED');
        return;
      }
    } catch (_err) {
      // Offline fallback below
    }

    renderWatchPage({
      ok: true,
      mode: 'PREMADE_STANDARD',
      isPersonalized: false,
      title: 'Tiberius Recon™ — 90-Second Autonomous Permit & CAD Tax Roll Walkthrough',
      subtitle:
        'Standalone System Walkthrough • Watch how Recon sweeps overnight building permits & county tax rolls before 7:00 AM.',
      prospect: {
        companyName: 'Your Contracting Business',
        territoryZip: '78130',
        city: 'New Braunfels',
        tradeName: 'Commercial Concrete'
      },
      player: {
        masterVideoUrl: '/recon/video/TIBERIUS%20RECON.mp4',
        posterUrl: '/recon/images/tiberius-recon-poster.jpg',
        enableCircularBubble: true
      },
      cta: {
        primaryLabel: 'Open Interactive 7:00 AM Briefing →',
        primaryUrl: '/recon/briefing?token=demo-7am-briefing'
      },
      sidebarPermits: []
    });
  }

  loadWatchInitial();
})();
