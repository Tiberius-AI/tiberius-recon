/**
 * TIBERIUS RECON™ — CONTRACTOR TERRITORY COMMAND & EQUITY PORTAL (command.js)
 * Powers:
 * 1. Real-time Zip Code Exclusivity & Tier Slot Checker (GET /api/recon/availability)
 * 2. Shop Voice & Minimum Permit Valuation Calibrator (POST /api/recon/briefing)
 * 3. $200/mo Rent-to-Own Smart Site Code Equity Simulator
 * 4. Instant 14-Second CAD Parcel & Deeded Owner X-Ray Tester
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__TIBERIUS_COMMAND_PORTAL_INITIALIZED__) return;
  window.__TIBERIUS_COMMAND_PORTAL_INITIALIZED__ = true;

  const urlParams = new URLSearchParams(window.location.search);
  const activeToken =
    urlParams.get('token') ||
    urlParams.get('t') ||
    localStorage.getItem('tiberius_recon_token') ||
    'demo-7am-briefing';
  localStorage.setItem('tiberius_recon_token', activeToken);

  ['nav-briefing-link', 'cta-briefing-link', 'hero-open-briefing-btn', 'footer-briefing-link'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = `/recon/briefing?token=${encodeURIComponent(activeToken)}`;
  });

  ['nav-inbox-link', 'cta-inbox-link', 'hero-open-inbox-btn', 'kb-open-inbox-link'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = `/recon/inbox?token=${encodeURIComponent(activeToken)}`;
  });

  const kbWebsiteInput = document.getElementById('kb-website-input');
  const kbScanBtn = document.getElementById('kb-scan-btn');
  const kbCrawlStatus = document.getElementById('kb-crawl-status');
  const kbEditorForm = document.getElementById('kb-editor-form');
  const kbServicesInput = document.getElementById('kb-services-input');
  const kbCertsInput = document.getElementById('kb-certs-input');
  const kbProofInput = document.getElementById('kb-proof-input');
  const kbWarrantyInput = document.getElementById('kb-warranty-input');
  const kbYearsInput = document.getElementById('kb-years-input');
  const kbCtaInput = document.getElementById('kb-cta-input');
  const kbSignatureInput = document.getElementById('kb-signature-input');
  const kbSaveFeedback = document.getElementById('kb-save-feedback');

  const cmdContractorTitle = document.getElementById('cmd-contractor-title');
  const cmdAvailabilityPill = document.getElementById('cmd-availability-pill');
  const cmdTradeSelect = document.getElementById('cmd-trade-select');
  const cmdTierSelect = document.getElementById('cmd-tier-select');
  const cmdZipInput = document.getElementById('cmd-zip-input');
  const cmdCheckZipBtn = document.getElementById('cmd-check-zip-btn');
  const cmdMinValuationSelect = document.getElementById('cmd-min-valuation-select');
  const cmdZipStatusTitle = document.getElementById('cmd-zip-status-title');
  const cmdZipStatusDesc = document.getElementById('cmd-zip-status-desc');
  const cmdLandmarkInput = document.getElementById('cmd-landmark-input');
  const cmdDifferentiatorInput = document.getElementById('cmd-differentiator-input');
  const cmdSettingsForm = document.getElementById('command-settings-form');
  const cmdSaveFeedback = document.getElementById('cmd-save-feedback');

  const equityAccruedLabel = document.getElementById('equity-accrued-label');
  const equityPctLabel = document.getElementById('equity-pct-label');
  const equityProgressBar = document.getElementById('equity-progress-bar');
  const simulateMonthCreditBtn = document.getElementById('simulate-month-credit-btn');

  const cadAddressInput = document.getElementById('cad-xray-address-input');
  const cadRunBtn = document.getElementById('cad-xray-run-btn');
  const cadResParcel = document.getElementById('cad-res-parcel');
  const cadResOwner = document.getElementById('cad-res-owner');
  const cadResMetrics = document.getElementById('cad-res-metrics');
  const cadResContact = document.getElementById('cad-res-contact');

  let currentEquityCents = 80000;
  const targetEquityCents = 240000;

  function renderEquityBar() {
    const accruedDollars = (currentEquityCents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const pct = Math.min(100, Math.round((currentEquityCents / targetEquityCents) * 100));
    if (equityAccruedLabel) equityAccruedLabel.textContent = `ACCRUED EQUITY: $${accruedDollars}`;
    if (equityPctLabel) {
      equityPctLabel.textContent =
        pct >= 100
          ? '100% CODE & DOMAIN OWNERSHIP UNLOCKED ✓'
          : `${pct}% TOWARD 100% BUYOUT ($2,400)`;
    }
    if (equityProgressBar) equityProgressBar.style.width = `${pct}%`;
  }

  function renderAvailability(avail) {
    if (!avail) return;
    if (cmdAvailabilityPill) {
      cmdAvailabilityPill.textContent = avail.isAvailable ? '✓ TERRITORY OPEN' : '🔒 ZIP LOCKED';
      cmdAvailabilityPill.className = avail.isAvailable
        ? 'px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-mono-telemetry text-xs text-emerald-800'
        : 'px-3 py-1 rounded-full bg-rose-50 border border-rose-200 font-mono-telemetry text-xs text-rose-800';
    }
    if (cmdZipStatusTitle) {
      cmdZipStatusTitle.textContent = avail.statusBadge;
      cmdZipStatusTitle.className = avail.isAvailable
        ? 'font-mono-telemetry text-emerald-800 font-bold'
        : 'font-mono-telemetry text-rose-700 font-bold';
    }
    if (cmdZipStatusDesc) {
      cmdZipStatusDesc.textContent = `${avail.statusReason} Connected to ${avail.portalName} & ${avail.countyCad}.`;
    }
  }

  async function checkAvailabilityLive() {
    const zip = cmdZipInput ? cmdZipInput.value.trim() : '78130';
    const trade = cmdTradeSelect ? cmdTradeSelect.value : 'Commercial Concrete';
    const tier = cmdTierSelect ? cmdTierSelect.value : 'Tier 2: Commercial Permits';
    try {
      const resp = await fetch(
        `/api/recon/availability?zip=${encodeURIComponent(zip)}&trade=${encodeURIComponent(trade)}&tier=${encodeURIComponent(tier)}`
      );
      const data = await resp.json();
      if (data && data.ok) {
        renderAvailability(data);
      }
    } catch (_err) {
      // Ignore
    }
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const jwt = localStorage.getItem('tiberius_recon_session_jwt');
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    return headers;
  }

  function renderKnowledgeBase(kb = {}) {
    if (kbWebsiteInput && kb.websiteUrl) kbWebsiteInput.value = kb.websiteUrl;
    if (kbServicesInput && Array.isArray(kb.coreServices)) {
      kbServicesInput.value = kb.coreServices.join(', ');
    }
    if (kbCertsInput && kb.certificationsAndBonding) {
      kbCertsInput.value = kb.certificationsAndBonding;
    }
    if (kbProofInput && kb.proofProjects) {
      kbProofInput.value = kb.proofProjects;
    }
    if (kbWarrantyInput && (kb.signatureGuarantee || kb.warrantyAndGuarantee)) {
      kbWarrantyInput.value = kb.signatureGuarantee || kb.warrantyAndGuarantee;
    }
    if (kbYearsInput && kb.yearsInBusiness) {
      kbYearsInput.value = kb.yearsInBusiness;
    }
    if (kbCtaInput && kb.preferredCta) {
      kbCtaInput.value = kb.preferredCta;
    }
    if (kbSignatureInput && kb.signatureLine) {
      kbSignatureInput.value = kb.signatureLine;
    }
    if (kbCrawlStatus && kb.crawlSource) {
      kbCrawlStatus.textContent = `✓ ${kb.crawlSource.toUpperCase()}`;
    }
  }

  async function loadCommandState() {
    try {
      const resp = await fetch(`/api/recon/briefing?token=${encodeURIComponent(activeToken)}`, {
        headers: getAuthHeaders()
      });
      const data = await resp.json();
      if (data && data.ok) {
        const c = data.contractor || {};
        const b = data.briefing || {};
        if (cmdContractorTitle && b.territoryZip) {
          cmdContractorTitle.textContent = `${c.companyName ? c.companyName + ' — ' : ''}${b.tradeName} (${b.territoryZip})`;
        }
        if (cmdTradeSelect && b.tradeName) cmdTradeSelect.value = b.tradeName;
        if (cmdTierSelect && b.tierLevel) cmdTierSelect.value = b.tierLevel;
        if (cmdZipInput && b.territoryZip) cmdZipInput.value = b.territoryZip;
        if (cmdMinValuationSelect && c.minPermitValuation) {
          cmdMinValuationSelect.value = String(c.minPermitValuation);
        }
        if (c.voiceProfile) {
          if (cmdLandmarkInput && c.voiceProfile.landmarkReference) {
            cmdLandmarkInput.value = c.voiceProfile.landmarkReference;
          }
          if (cmdDifferentiatorInput && c.voiceProfile.differentiator) {
            cmdDifferentiatorInput.value = c.voiceProfile.differentiator;
          }
        }
        if (c.knowledgeBase) {
          renderKnowledgeBase(c.knowledgeBase);
        }
        if (typeof c.smartSiteEquityCents === 'number' && c.smartSiteEquityCents > 0) {
          currentEquityCents = c.smartSiteEquityCents;
          renderEquityBar();
        }
        if (data.availability) {
          renderAvailability(data.availability);
        }
      }
    } catch (_err) {
      renderEquityBar();
    }
  }

  if (kbScanBtn) {
    kbScanBtn.addEventListener('click', async () => {
      const websiteVal = kbWebsiteInput ? kbWebsiteInput.value.trim() : '';
      const originalText = kbScanBtn.textContent;
      kbScanBtn.textContent = '🛰️ Crawling Live Website & Extracting Services...';
      kbScanBtn.disabled = true;

      try {
        const resp = await fetch('/api/recon/knowledge', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'scan_website',
            token: activeToken,
            websiteUrl: websiteVal,
            primaryTrade: cmdTradeSelect ? cmdTradeSelect.value : undefined
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.knowledgeBase) {
          if (data.knowledgeBase.tradeCategory && cmdTradeSelect) {
            cmdTradeSelect.value = data.knowledgeBase.tradeCategory;
          }
          renderKnowledgeBase(data.knowledgeBase);
          if (kbSaveFeedback) {
            kbSaveFeedback.textContent = `✓ WEBSITE SCANNED (${data.websiteUrl}) • KNOWLEDGE BASE & 7:00 AM DRAFTS UPDATED`;
            kbSaveFeedback.classList.remove('hidden');
            setTimeout(() => kbSaveFeedback.classList.add('hidden'), 5000);
          }
        }
      } catch (_err) {
        // Ignore
      } finally {
        kbScanBtn.textContent = originalText;
        kbScanBtn.disabled = false;
      }
    });
  }

  if (kbEditorForm) {
    kbEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const kbPayload = {
        websiteUrl: kbWebsiteInput ? kbWebsiteInput.value.trim() : '',
        coreServices: kbServicesInput ? kbServicesInput.value.trim() : '',
        certificationsAndBonding: kbCertsInput ? kbCertsInput.value.trim() : '',
        proofProjects: kbProofInput ? kbProofInput.value.trim() : '',
        signatureGuarantee: kbWarrantyInput ? kbWarrantyInput.value.trim() : '',
        warrantyAndGuarantee: kbWarrantyInput ? kbWarrantyInput.value.trim() : '',
        yearsInBusiness: kbYearsInput ? kbYearsInput.value.trim() : '',
        preferredCta: kbCtaInput ? kbCtaInput.value.trim() : '',
        signatureLine: kbSignatureInput ? kbSignatureInput.value.trim() : ''
      };

      try {
        const resp = await fetch('/api/recon/knowledge', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'save_knowledge',
            token: activeToken,
            knowledgeBase: kbPayload
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.knowledgeBase) {
          if (data.knowledgeBase.tradeCategory && cmdTradeSelect) {
            cmdTradeSelect.value = data.knowledgeBase.tradeCategory;
          }
          renderKnowledgeBase(data.knowledgeBase);
          if (cmdDifferentiatorInput && data.knowledgeBase.warrantyAndGuarantee) {
            cmdDifferentiatorInput.value = data.knowledgeBase.warrantyAndGuarantee;
          }
          if (kbSaveFeedback) {
            kbSaveFeedback.textContent = '✓ KNOWLEDGE BASE SAVED • ALL 7:00 AM INTROS & REPLY AGENTS UPDATED';
            kbSaveFeedback.classList.remove('hidden');
            setTimeout(() => kbSaveFeedback.classList.add('hidden'), 4000);
          }
        }
      } catch (_err) {
        // Ignore
      }
    });
  }

  if (cmdCheckZipBtn) {
    cmdCheckZipBtn.addEventListener('click', checkAvailabilityLive);
  }
  if (cmdTradeSelect) cmdTradeSelect.addEventListener('change', checkAvailabilityLive);
  if (cmdTierSelect) cmdTierSelect.addEventListener('change', checkAvailabilityLive);

  if (cmdSettingsForm) {
    cmdSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        token: activeToken,
        primaryTrade: cmdTradeSelect ? cmdTradeSelect.value : 'Commercial Concrete',
        tierLevel: cmdTierSelect ? cmdTierSelect.value : 'Tier 2: Commercial Permits',
        territoryZip: cmdZipInput ? cmdZipInput.value.trim() : '78130',
        minPermitValuation: cmdMinValuationSelect ? Number(cmdMinValuationSelect.value) : 100000,
        landmarkReference: cmdLandmarkInput ? cmdLandmarkInput.value.trim() : '',
        differentiator: cmdDifferentiatorInput ? cmdDifferentiatorInput.value.trim() : ''
      };

      try {
        const resp = await fetch('/api/recon/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data && data.ok) {
          if (data.availability) renderAvailability(data.availability);
          if (cmdContractorTitle && data.briefing) {
            cmdContractorTitle.textContent = `Territory Command: ${data.briefing.tradeName} (${data.briefing.territoryZip})`;
          }
          if (cmdSaveFeedback) {
            cmdSaveFeedback.classList.remove('hidden');
            setTimeout(() => cmdSaveFeedback.classList.add('hidden'), 3500);
          }
        }
      } catch (_err) {
        if (cmdSaveFeedback) {
          cmdSaveFeedback.classList.remove('hidden');
          setTimeout(() => cmdSaveFeedback.classList.add('hidden'), 3500);
        }
      }
    });
  }

  if (simulateMonthCreditBtn) {
    simulateMonthCreditBtn.addEventListener('click', () => {
      currentEquityCents = Math.min(targetEquityCents, currentEquityCents + 20000);
      renderEquityBar();
    });
  }

  if (cadRunBtn) {
    cadRunBtn.addEventListener('click', async () => {
      const addr = (cadAddressInput && cadAddressInput.value.trim()) || '16013 N IH 35';
      cadRunBtn.textContent = 'Scanning...';

      try {
        const resp = await fetch(`/api/recon/cad-lookup?address=${encodeURIComponent(addr)}`);
        const data = await resp.json();
        if (data && data.ok) {
          if (cadResParcel) {
            cadResParcel.textContent = `${data.parcelId} • PERMIT #${data.permitNumber}`;
          }
          if (cadResOwner) {
            cadResOwner.textContent = `${data.contactName} (${data.contractorCompany}) • ${data.address}`;
          }
          if (cadResMetrics) {
            cadResMetrics.textContent = `${data.valuationFormatted} Permit Valuation • ${data.squareFootageFormatted} • ${data.legalOwnerDescription}`;
          }
          if (cadResContact) {
            cadResContact.textContent = `DIRECT PHONE: ${data.contactPhone} • EMAIL: ${data.contactEmail}`;
          }
          return;
        }
      } catch (_err) {
        // Fallback below if offline
      } finally {
        cadRunBtn.textContent = 'Run X-Ray →';
      }
    });
  }

  renderEquityBar();
  loadCommandState();

  /* ==========================================================================
     MODULE 04 • TIBERIUS HQ AUTONOMOUS META-RECON™ ENGINE
     ========================================================================== */
  const metaZipSelect = document.getElementById('meta-zip-select');
  const metaTradeSelect = document.getElementById('meta-trade-select');
  const metaPlaybookSelect = document.getElementById('meta-playbook-select');
  const metaSweepBtn = document.getElementById('meta-sweep-btn');
  const metaRunDripBtn = document.getElementById('meta-run-drip-btn');
  const metaFeedback = document.getElementById('meta-action-feedback');
  const metaProspectsGrid = document.getElementById('meta-prospects-grid');
  const metaStatProspects = document.getElementById('meta-stat-prospects');
  const metaStatHot = document.getElementById('meta-stat-hot');
  const metaStatLeak = document.getElementById('meta-stat-leak');
  const metaStatGate = document.getElementById('meta-stat-gate');
  const metaStatSent = document.getElementById('meta-stat-sent');

  let activeMetaRecon = null;
  const selectedTouchByProspect = {};

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showMetaFeedback(message) {
    if (!metaFeedback) return;
    metaFeedback.textContent = message;
    metaFeedback.classList.remove('hidden');
  }

  function renderMetaRecon(metaRecon) {
    if (!metaRecon) return;
    activeMetaRecon = metaRecon;
    const m = metaRecon.metrics || {};
    if (metaStatProspects) metaStatProspects.textContent = String(m.totalProspectsGathered || 0);
    if (metaStatHot) metaStatHot.textContent = `${m.hotLeadsCount || 0} HOT`;
    if (metaStatLeak) metaStatLeak.textContent = m.totalMonthlyLeakFormatted || '$0/mo';
    if (metaStatGate) metaStatGate.textContent = `${m.antiAiGatePassRate || '100%'} PASS`;
    if (metaStatSent) {
      metaStatSent.textContent = `${m.touchesSentCount || 0} Sent • ${m.demosAutoDeliveredCount || 0} Demos`;
    }

    if (!metaProspectsGrid) return;
    const prospects = Array.isArray(metaRecon.prospects) ? metaRecon.prospects : [];

    metaProspectsGrid.innerHTML = prospects
      .map((p) => {
        const touchNum = selectedTouchByProspect[p.id] || 1;
        const activeTouch =
          (Array.isArray(p.touches) && p.touches.find((t) => t.touchNumber === touchNum)) ||
          (p.touches && p.touches[0]) ||
          {};
        const xray = p.siteLeakXRay || {};
        const math = xray.revenueMath || {};
        const primaryPermit = (p.baitPermits && p.baitPermits[0]) || {};
        const leaks = Array.isArray(xray.leaks) ? xray.leaks : [];
        const isDemoSent = p.outreachStatus === 'DEMO_SENT_HOT_LEAD';

        const statusBadge = isDemoSent
          ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 font-mono-telemetry text-[11px] text-emerald-300 font-bold">🔥 REPLIED • LIVE PREVIEW AUTO-SENT</span>`
          : `<span class="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 font-mono-telemetry text-[11px] text-blue-300">${escapeHtml(
              p.outreachStatus
            )}</span>`;

        const touchTabsHtml = [1, 2, 3, 4]
          .map((n) => {
            const tObj = (p.touches || []).find((t) => t.touchNumber === n) || {};
            const isSelected = n === touchNum;
            const sentMark = tObj.status === 'SENT' ? ' ✓' : tObj.status === 'HALTED_ON_REPLY' ? ' ⏸' : '';
            return `<button type="button" data-meta-touch-tab="${escapeHtml(p.id)}" data-touch-num="${n}" class="px-2.5 py-1 rounded-lg font-mono-telemetry text-[11px] cursor-pointer ${
              isSelected
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }">Touch ${n}${sentMark}</button>`;
          })
          .join('');

        return `
        <article class="p-5 rounded-2xl bg-slate-800/95 border border-slate-700 flex flex-col justify-between space-y-4">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 font-mono-telemetry text-[11px] text-amber-300 font-bold">
                  ${escapeHtml(xray.leadScore || 'HOT')} • ${escapeHtml(p.primaryTrade)} (${escapeHtml(p.zipCode)})
                </span>
                <span class="font-mono-telemetry text-[11px] text-emerald-400">
                  ✓ Anti-AI Gate: ${p.copyGate && p.copyGate.passed ? 'PASS (0 Links T1)' : 'CHECK'}
                </span>
              </div>
              ${statusBadge}
            </div>

            <div>
              <h3 class="font-display font-extrabold text-lg text-white">
                ${escapeHtml(p.companyName)}
              </h3>
              <p class="text-xs text-slate-300 font-mono-telemetry mt-0.5">
                👤 ${escapeHtml(p.contactName)} (${escapeHtml(p.contactRole)}) • 📞 ${escapeHtml(p.phone)} • ✉️ ${escapeHtml(p.email)}
              </p>
            </div>

            <!-- Trojan Horse Live Permit Bait + 3-Leak Revenue Math Callout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                <div class="font-mono-telemetry text-[10px] text-amber-300 uppercase">🛰️ Trojan Horse Permit Bait</div>
                <div class="font-bold text-white">Permit #${escapeHtml(primaryPermit.permitNumber)} (${escapeHtml(primaryPermit.valuationFormatted)})</div>
                <div class="text-slate-300">${escapeHtml(primaryPermit.address)} • GC: ${escapeHtml(primaryPermit.gcContact)} (${escapeHtml(primaryPermit.gcCompany)})</div>
              </div>
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                <div class="font-mono-telemetry text-[10px] text-emerald-300 uppercase">🔍 3-Leak Site X-Ray (${escapeHtml(xray.websiteStatus)})</div>
                <div class="font-bold text-emerald-400">${escapeHtml(math.estimatedMonthlyLeakFormatted || '$14,250/mo')} Est. Leaked Revenue</div>
                <div class="text-slate-300">${escapeHtml(leaks[0] ? leaks[0].title : 'Multi-field form & zero after-hours SMS')}</div>
              </div>
            </div>

            <!-- 4-Touch Sequence Selector & Message Preview -->
            <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono-telemetry text-[10px] text-blue-300 uppercase">${escapeHtml(activeTouch.angleLabel || 'Touch 1')}</span>
                <div class="flex items-center gap-1.5">${touchTabsHtml}</div>
              </div>
              <div class="font-mono-telemetry text-xs text-amber-200">
                Subject: <span class="text-white font-bold">${escapeHtml(activeTouch.subject)}</span>
              </div>
              <pre class="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800 max-h-44 overflow-y-auto">${escapeHtml(
                activeTouch.body
              )}</pre>
            </div>
          </div>

          <!-- Action Bar -->
          <div class="pt-2 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-meta-send-email="${escapeHtml(p.id)}"
                data-touch-num="${touchNum}"
                class="btn-trust-emerald px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✓ Send Touch ${touchNum} Email
              </button>
              <a
                href="${escapeHtml(p.nativeSimUri || '#')}"
                data-meta-send-sms="${escapeHtml(p.id)}"
                class="btn-outline-slate px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                📲 Native SIM Text
              </a>
              <button
                type="button"
                data-meta-sim-reply="${escapeHtml(p.id)}"
                class="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-xs font-bold cursor-pointer"
              >
                ⚡ Simulate "Yes, send it!" Reply
              </button>
            </div>
            <a
              href="/recon/briefing?token=${encodeURIComponent(p.previewToken || 'demo-7am-briefing')}"
              target="_blank"
              class="font-mono-telemetry text-xs text-blue-300 hover:text-white underline"
            >
              Open Live Preview Briefing →
            </a>
          </div>
        </article>`;
      })
      .join('');
  }

  async function loadMetaReconInitial() {
    if (!metaProspectsGrid) return;
    try {
      const resp = await fetch('/api/recon/meta-outreach');
      const data = await resp.json();
      if (data && data.ok && data.metaRecon) {
        renderMetaRecon(data.metaRecon);
      }
    } catch (_err) {
      // Ignore offline error
    }
  }

  if (metaSweepBtn) {
    metaSweepBtn.addEventListener('click', async () => {
      const orig = metaSweepBtn.textContent;
      metaSweepBtn.textContent = '🛰️ Sweeping & Building Previews...';
      metaSweepBtn.disabled = true;
      try {
        const resp = await fetch('/api/recon/meta-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sweep',
            zipCode: metaZipSelect ? metaZipSelect.value : 'ALL',
            primaryTrade: metaTradeSelect ? metaTradeSelect.value : 'ALL',
            playbook: metaPlaybookSelect ? metaPlaybookSelect.value : 'FULL_BUNDLE_OFFENSE_DEFENSE'
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.metaRecon) {
          renderMetaRecon(data.metaRecon);
          showMetaFeedback(
            `✓ Swept ${data.metaRecon.prospects.length} prospects, ran 3-Leak Website X-Rays, and auto-provisioned ${data.metaRecon.metrics.livePreviewsProvisioned} live Preview Briefings.`
          );
        }
      } catch (_err) {
        // Ignore
      } finally {
        metaSweepBtn.textContent = orig;
        metaSweepBtn.disabled = false;
      }
    });
  }

  if (metaRunDripBtn) {
    metaRunDripBtn.addEventListener('click', async () => {
      const orig = metaRunDripBtn.textContent;
      metaRunDripBtn.textContent = '⚡ Dispatching Autonomous Drip Batch...';
      metaRunDripBtn.disabled = true;
      try {
        const resp = await fetch('/api/recon/meta-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run_drip_batch',
            touchNumber: 1,
            maxBatchSize: 6
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.metaRecon) {
          renderMetaRecon(data.metaRecon);
          showMetaFeedback(
            `✓ Autonomous Drip Runner dispatched Touch 1 to ${data.dispatchedCount} Copy-Gate-verified prospect(s) via Resend with thread-locked reply routing.`
          );
        }
      } catch (_err) {
        // Ignore
      } finally {
        metaRunDripBtn.textContent = orig;
        metaRunDripBtn.disabled = false;
      }
    });
  }

  if (metaProspectsGrid) {
    metaProspectsGrid.addEventListener('click', async (e) => {
      const tabBtn = e.target.closest('[data-meta-touch-tab]');
      if (tabBtn) {
        const pid = tabBtn.getAttribute('data-meta-touch-tab');
        const tNum = Number(tabBtn.getAttribute('data-touch-num') || 1);
        selectedTouchByProspect[pid] = tNum;
        if (activeMetaRecon) renderMetaRecon(activeMetaRecon);
        return;
      }

      const sendBtn = e.target.closest('[data-meta-send-email]');
      if (sendBtn) {
        const pid = sendBtn.getAttribute('data-meta-send-email');
        const tNum = Number(sendBtn.getAttribute('data-touch-num') || 1);
        sendBtn.textContent = 'Sending...';
        try {
          const resp = await fetch('/api/recon/meta-outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_touch',
              prospectId: pid,
              touchNumber: tNum,
              channel: 'RESEND_EMAIL'
            })
          });
          const data = await resp.json();
          if (data && data.ok && data.metaRecon) {
            renderMetaRecon(data.metaRecon);
            showMetaFeedback(
              `✓ Dispatched Touch ${tNum} to ${data.prospect.contactName} (${data.prospect.companyName}) via Resend (${data.receipt.replyToAddress}).`
            );
          }
        } catch (_err) {
          // Ignore
        }
        return;
      }

      const simReplyBtn = e.target.closest('[data-meta-sim-reply]');
      if (simReplyBtn) {
        const pid = simReplyBtn.getAttribute('data-meta-sim-reply');
        simReplyBtn.textContent = '🤖 Auto-Replying...';
        try {
          const resp = await fetch('/api/recon/meta-outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'simulate_reply',
              prospectId: pid,
              rawReplyBody: 'Yes, send over the live permit packet and 3-leak breakdown!',
              autoSendDemoLink: true
            })
          });
          const data = await resp.json();
          if (data && data.ok && data.metaRecon) {
            renderMetaRecon(data.metaRecon);
            showMetaFeedback(
              `🔥 ${data.prospect.contactName} replied! Follow-ups halted & Autonomous Fulfilment Agent delivered live Preview Briefing (${data.prospect.previewBriefingUrl}).`
            );
          }
        } catch (_err) {
          // Ignore
        }
      }
    });
  }

  loadMetaReconInitial();

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
      const word = canvas.getAttribute('data-pixel-word') || 'TERRITORY COMMAND';
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
