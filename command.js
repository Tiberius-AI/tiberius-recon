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

  if (window.__TIBERIUS_COMMAND_PORTAL_INITIALIZED__) return;
  window.__TIBERIUS_COMMAND_PORTAL_INITIALIZED__ = true;

  const urlParams = new URLSearchParams(window.location.search);
  const activeToken =
    urlParams.get('token') ||
    urlParams.get('t') ||
    localStorage.getItem('tiberius_recon_token') ||
    'demo-7am-briefing';
  localStorage.setItem('tiberius_recon_token', activeToken);

  ['nav-briefing-link', 'cta-briefing-link', 'hero-open-briefing-btn'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = `briefing.html?token=${encodeURIComponent(activeToken)}`;
  });

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

  async function loadCommandState() {
    try {
      const resp = await fetch(`/api/recon/briefing?token=${encodeURIComponent(activeToken)}`);
      const data = await resp.json();
      if (data && data.ok) {
        const c = data.contractor || {};
        const b = data.briefing || {};
        if (cmdContractorTitle && b.territoryZip) {
          cmdContractorTitle.textContent = `Territory Command: ${b.tradeName} (${b.territoryZip})`;
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
})();
