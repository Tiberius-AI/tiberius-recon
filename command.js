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

  const cmdAccountProfileForm = document.getElementById('cmd-account-profile-form');
  const cmdAccountFeedback = document.getElementById('cmd-account-feedback');
  const acctUsernameInput = document.getElementById('acct-username-input');
  const acctOwnerInput = document.getElementById('acct-owner-input');
  const acctCompanyInput = document.getElementById('acct-company-input');
  const acctEmailInput = document.getElementById('acct-email-input');
  const acctPhoneInput = document.getElementById('acct-phone-input');
  const acctPinInput = document.getElementById('acct-pin-input');
  const acctNewPasswordInput = document.getElementById('acct-new-password-input');

  const cmdClientEmailForm = document.getElementById('cmd-client-email-form');
  const cmdClientEmailFeedback = document.getElementById('cmd-client-email-feedback');
  const clientEmailStatusPill = document.getElementById('client-email-status-pill');
  const clientEmailModeSelect = document.getElementById('client-email-mode-select');
  const clientEmailComposeSelect = document.getElementById('client-email-compose-select');
  const clientSmtpFieldsWrap = document.getElementById('client-smtp-fields-wrap');
  const clientSmtpPresetSelect = document.getElementById('client-smtp-preset-select');
  const clientSmtpHostInput = document.getElementById('client-smtp-host-input');
  const clientSmtpPortInput = document.getElementById('client-smtp-port-input');
  const clientSmtpUserInput = document.getElementById('client-smtp-user-input');
  const clientSmtpPassInput = document.getElementById('client-smtp-pass-input');
  const clientSmtpTestBtn = document.getElementById('client-smtp-test-btn');

  const SMTP_PRESET_MAP = {
    gmail: { host: 'smtp.gmail.com', port: 465 },
    m365: { host: 'smtp.office365.com', port: 587 },
    privateemail: { host: 'mail.privateemail.com', port: 465 },
    yahoo: { host: 'smtp.mail.yahoo.com', port: 465 },
    zoho: { host: 'smtp.zoho.com', port: 465 },
    custom: { host: '', port: 465 }
  };

  function syncClientEmailFieldsVisibility() {
    if (!clientSmtpFieldsWrap || !clientEmailModeSelect) return;
    const isSmtp = clientEmailModeSelect.value === 'CLIENT_SMTP';
    clientSmtpFieldsWrap.classList.toggle('hidden', !isSmtp);
  }

  if (clientEmailModeSelect) {
    clientEmailModeSelect.addEventListener('change', syncClientEmailFieldsVisibility);
  }
  if (clientSmtpPresetSelect) {
    clientSmtpPresetSelect.addEventListener('change', () => {
      const p = SMTP_PRESET_MAP[clientSmtpPresetSelect.value] || SMTP_PRESET_MAP.custom;
      if (clientSmtpHostInput && p.host) clientSmtpHostInput.value = p.host;
      if (clientSmtpPortInput && p.port) clientSmtpPortInput.value = String(p.port);
    });
  }

  function renderClientEmailSettings(c = {}) {
    const cfg = (c && c.clientEmailConfig) || {};
    if (clientEmailModeSelect) {
      clientEmailModeSelect.value = cfg.mode === 'CLIENT_SMTP' ? 'CLIENT_SMTP' : 'NATIVE_APP';
    }
    if (clientEmailComposeSelect) {
      clientEmailComposeSelect.value = cfg.preferredComposeTarget || 'MAILTO';
    }
    if (clientSmtpPresetSelect) {
      clientSmtpPresetSelect.value = cfg.providerPreset || 'gmail';
    }
    const presetDefaults = SMTP_PRESET_MAP[cfg.providerPreset || 'gmail'] || SMTP_PRESET_MAP.gmail;
    if (clientSmtpHostInput) {
      clientSmtpHostInput.value = cfg.smtpHost || presetDefaults.host;
    }
    if (clientSmtpPortInput) {
      clientSmtpPortInput.value = String(cfg.smtpPort || presetDefaults.port || 465);
    }
    if (clientSmtpUserInput) {
      clientSmtpUserInput.value = cfg.smtpUser || c.workEmail || '';
    }
    if (clientSmtpPassInput) {
      clientSmtpPassInput.value = '';
      clientSmtpPassInput.placeholder = cfg.hasSmtpPassword
        ? '•••••••••••• (Encrypted — leave blank to keep)'
        : 'xxxx xxxx xxxx xxxx';
    }
    if (clientEmailStatusPill) {
      if (cfg.isSmtpReady) {
        clientEmailStatusPill.textContent = '⚡ EMAIL: 1-TAP SHOP SMTP ACTIVE';
        clientEmailStatusPill.className =
          'px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono-telemetry text-[10px] text-emerald-800 font-bold';
      } else {
        clientEmailStatusPill.textContent = '✉️ EMAIL: MY MAIL APP';
        clientEmailStatusPill.className =
          'px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-mono-telemetry text-[10px] text-[#1E40AF] font-bold';
      }
    }
    syncClientEmailFieldsVisibility();
  }

  function renderAccountProfile(c = {}) {
    if (acctUsernameInput && c.username) acctUsernameInput.value = c.username;
    if (acctOwnerInput && c.ownerName) acctOwnerInput.value = c.ownerName;
    if (acctCompanyInput && c.companyName) acctCompanyInput.value = c.companyName;
    if (acctEmailInput && c.workEmail) acctEmailInput.value = c.workEmail;
    if (acctPhoneInput && c.mobilePhone) acctPhoneInput.value = c.mobilePhone;
    if (acctPinInput && (c.accessPin || c.baseZip)) acctPinInput.value = c.accessPin || c.baseZip;
    if (acctNewPasswordInput) acctNewPasswordInput.value = '';
    renderClientEmailSettings(c);
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
        renderAccountProfile(c);
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

  if (cmdAccountProfileForm) {
    cmdAccountProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (cmdAccountFeedback) cmdAccountFeedback.classList.add('hidden');

      const payload = {
        action: 'update_profile',
        token: activeToken,
        username: acctUsernameInput ? acctUsernameInput.value.trim() : undefined,
        ownerName: acctOwnerInput ? acctOwnerInput.value.trim() : undefined,
        companyName: acctCompanyInput ? acctCompanyInput.value.trim() : undefined,
        workEmail: acctEmailInput ? acctEmailInput.value.trim() : undefined,
        mobilePhone: acctPhoneInput ? acctPhoneInput.value.trim() : undefined,
        accessPin: acctPinInput ? acctPinInput.value.trim() : undefined,
        newPassword:
          acctNewPasswordInput && acctNewPasswordInput.value.trim()
            ? acctNewPasswordInput.value.trim()
            : undefined
      };

      try {
        const resp = await fetch('/api/recon/auth', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          if (cmdAccountFeedback) {
            cmdAccountFeedback.textContent = `⚠️ ${(data && data.error) || 'Failed to update profile.'}`;
            cmdAccountFeedback.className =
              'mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono-telemetry font-bold';
            cmdAccountFeedback.classList.remove('hidden');
          }
          return;
        }

        if (data.sessionToken) {
          localStorage.setItem('tiberius_recon_session_jwt', data.sessionToken);
        }
        if (data.account) {
          localStorage.setItem('tiberius_recon_account', JSON.stringify(data.account));
          renderAccountProfile(data.account);
          if (data.account.knowledgeBase) {
            renderKnowledgeBase(data.account.knowledgeBase);
          }
          if (cmdContractorTitle) {
            cmdContractorTitle.textContent = `${data.account.companyName} — ${data.account.primaryTrade} (${data.account.baseZip})`;
          }
        }
        if (cmdAccountFeedback) {
          cmdAccountFeedback.textContent = `✓ SAVED PROFILE (@${data.account.username} • ${data.account.workEmail})${
            data.passwordChanged ? ' & UPDATED PASSWORD' : ''
          }`;
          cmdAccountFeedback.className =
            'mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-telemetry font-bold';
          cmdAccountFeedback.classList.remove('hidden');
        }
      } catch (err) {
        if (cmdAccountFeedback) {
          cmdAccountFeedback.textContent = `⚠️ Error: ${err.message}`;
          cmdAccountFeedback.className =
            'mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono-telemetry font-bold';
          cmdAccountFeedback.classList.remove('hidden');
        }
      }
    });
  }

  function collectClientEmailConfigPayload() {
    const cfg = {
      mode: clientEmailModeSelect ? clientEmailModeSelect.value : 'NATIVE_APP',
      preferredComposeTarget: clientEmailComposeSelect ? clientEmailComposeSelect.value : 'MAILTO',
      providerPreset: clientSmtpPresetSelect ? clientSmtpPresetSelect.value : 'gmail',
      smtpHost: clientSmtpHostInput ? clientSmtpHostInput.value.trim() : '',
      smtpPort: clientSmtpPortInput ? Number(clientSmtpPortInput.value) || 465 : 465,
      smtpUser: clientSmtpUserInput ? clientSmtpUserInput.value.trim() : '',
      fromEmail: clientSmtpUserInput ? clientSmtpUserInput.value.trim() : ''
    };
    const rawPass = clientSmtpPassInput ? clientSmtpPassInput.value.trim() : '';
    if (rawPass) {
      cfg.smtpPass = rawPass;
    }
    return cfg;
  }

  function showClientEmailFeedback(msg, isError = false) {
    if (!cmdClientEmailFeedback) return;
    cmdClientEmailFeedback.textContent = msg;
    cmdClientEmailFeedback.className = isError
      ? 'mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono-telemetry font-bold'
      : 'mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-telemetry font-bold';
    cmdClientEmailFeedback.classList.remove('hidden');
  }

  if (cmdClientEmailForm) {
    cmdClientEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (cmdClientEmailFeedback) cmdClientEmailFeedback.classList.add('hidden');

      try {
        const resp = await fetch('/api/recon/auth', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'update_profile',
            token: activeToken,
            clientEmailConfig: collectClientEmailConfigPayload()
          })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          showClientEmailFeedback(
            `⚠️ ${(data && data.error) || 'Could not save outbound email settings.'}`,
            true
          );
          return;
        }
        if (data.sessionToken) {
          localStorage.setItem('tiberius_recon_session_jwt', data.sessionToken);
        }
        if (data.account) {
          localStorage.setItem('tiberius_recon_account', JSON.stringify(data.account));
          renderClientEmailSettings(data.account);
        }
        const savedCfg = (data.account && data.account.clientEmailConfig) || {};
        showClientEmailFeedback(
          savedCfg.isSmtpReady
            ? `✓ 1-TAP SHOP SMTP SAVED & ENCRYPTED (${savedCfg.smtpUser} via ${savedCfg.smtpHost}:${savedCfg.smtpPort})`
            : `✓ CLIENT-OWNED MAIL APP HANDOFF ACTIVE (${savedCfg.preferredComposeTarget || 'MAILTO'})`
        );
      } catch (err) {
        showClientEmailFeedback(`⚠️ Error: ${err.message}`, true);
      }
    });
  }

  if (clientSmtpTestBtn) {
    clientSmtpTestBtn.addEventListener('click', async () => {
      if (cmdClientEmailFeedback) cmdClientEmailFeedback.classList.add('hidden');
      const origLabel = clientSmtpTestBtn.textContent;
      clientSmtpTestBtn.textContent = '🧪 Testing Shop SMTP...';
      clientSmtpTestBtn.disabled = true;

      try {
        const resp = await fetch('/api/recon/auth', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'test_client_smtp',
            token: activeToken,
            clientEmailConfig: collectClientEmailConfigPayload()
          })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          showClientEmailFeedback(
            `⚠️ ${(data && data.error) || 'Shop SMTP test failed.'}`,
            true
          );
          return;
        }
        showClientEmailFeedback(
          `✅ LIVE SHOP SMTP TEST DELIVERED FROM ${data.receipt.from} → ${data.receipt.to} (${data.receipt.providerMessageId})`
        );
      } catch (err) {
        showClientEmailFeedback(`⚠️ Error: ${err.message}`, true);
      } finally {
        clientSmtpTestBtn.textContent = origLabel;
        clientSmtpTestBtn.disabled = false;
      }
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
  const metaCustomZipInput = document.getElementById('meta-custom-zip-input');
  const metaTradeSelect = document.getElementById('meta-trade-select');
  const metaPlaybookSelect = document.getElementById('meta-playbook-select');
  const metaLiveSweepBtn = document.getElementById('meta-live-sweep-btn');
  const metaSweepBtn = document.getElementById('meta-sweep-btn');
  const metaRunDripBtn = document.getElementById('meta-run-drip-btn');
  const metaToggleIntakeBtn = document.getElementById('meta-toggle-intake-btn');
  const metaCloseIntakeBtn = document.getElementById('meta-close-intake-btn');
  const metaIntakeDrawer = document.getElementById('meta-intake-drawer');
  const metaAddProspectForm = document.getElementById('meta-add-prospect-form');
  const metaAddSubmitBtn = document.getElementById('meta-add-submit-btn');
  const metaCsvSampleBtn = document.getElementById('meta-csv-sample-btn');
  const metaCsvFileInput = document.getElementById('meta-csv-file-input');
  const metaCsvTextarea = document.getElementById('meta-csv-textarea');
  const metaCsvImportBtn = document.getElementById('meta-csv-import-btn');
  const metaFeedback = document.getElementById('meta-action-feedback');
  const metaProspectsGrid = document.getElementById('meta-prospects-grid');
  const metaStatProspects = document.getElementById('meta-stat-prospects');
  const metaStatHot = document.getElementById('meta-stat-hot');
  const metaStatLeak = document.getElementById('meta-stat-leak');
  const metaStatGate = document.getElementById('meta-stat-gate');
  const metaStatSent = document.getElementById('meta-stat-sent');
  const metaStatRadar = document.getElementById('meta-stat-radar');
  const metaRadarStrip = document.getElementById('meta-radar-strip');
  const metaRadarFeedList = document.getElementById('meta-radar-feed-list');

  let activeMetaRecon = null;
  const selectedTouchByProspect = {};

  function resolveSelectedMetaZip() {
    const customZip = metaCustomZipInput ? metaCustomZipInput.value.replace(/\D/g, '').trim() : '';
    if (/^\d{5}$/.test(customZip)) return customZip;
    return metaZipSelect ? metaZipSelect.value : 'ALL';
  }

  if (metaZipSelect && metaCustomZipInput) {
    metaZipSelect.addEventListener('change', () => {
      metaCustomZipInput.value = '';
    });
  }

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

  function formatSourceBadgeHtml(p) {
    const src = String(p.sourceType || 'SANDBOX_DEMO').toUpperCase();
    const label = p.licenseBadge || src;
    if (src === 'LIVE_TDLR' || src === 'LIVE_TX_COMPTROLLER' || src === 'LIVE_MUNICIPAL_PERMIT') {
      return `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 font-mono-telemetry text-[10px] text-emerald-300 font-bold">🏛️ ${escapeHtml(label)}</span>`;
    }
    if (src === 'MANUAL_ENTRY' || src === 'CSV_IMPORT') {
      return `<span class="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 font-mono-telemetry text-[10px] text-purple-200 font-bold">✍️ ${escapeHtml(label)}</span>`;
    }
    return `<span class="px-2 py-0.5 rounded-full bg-slate-700/80 border border-slate-600 font-mono-telemetry text-[10px] text-slate-300">🧪 ${escapeHtml(label)}</span>`;
  }

  function renderMetaRadarFeed(metaRecon) {
    if (!metaRadarStrip || !metaRadarFeedList) return;
    const feed = Array.isArray(metaRecon.radarFeed) ? metaRecon.radarFeed : [];
    if (feed.length === 0) {
      metaRadarStrip.classList.add('hidden');
      return;
    }
    metaRadarStrip.classList.remove('hidden');
    metaRadarFeedList.innerHTML = feed
      .slice(0, 4)
      .map((item) => {
        const cleanDigits = String(item.phone || '').replace(/\D/g, '');
        const telHref = cleanDigits.length >= 10 ? `tel:+1${cleanDigits.slice(-10)}` : '';
        const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now';
        return `<div class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30">
          <div class="text-slate-200 font-mono-telemetry text-[11px]">
            <span class="text-emerald-400 font-bold">👀 ${escapeHtml(item.eventType)}</span> •
            <span class="text-white font-bold">${escapeHtml(item.companyName)}</span>
            (${escapeHtml(item.contactName || 'Prospect')} • ${escapeHtml(item.deviceHint || 'Web')} • ${escapeHtml(timeStr)})
          </div>
          ${
            telHref
              ? `<a href="${escapeHtml(telHref)}" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]">📞 Call Now (${escapeHtml(item.phone)})</a>`
              : ''
          }
        </div>`;
      })
      .join('');
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
    if (metaStatRadar) {
      metaStatRadar.textContent = `${m.previewsOpenedCount || 0} Viewed`;
    }

    renderMetaRadarFeed(metaRecon);

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
        const tel = p.previewTelemetry || {};
        const totalRadarHits = Number(tel.viewsCount || 0) + Number(tel.interactionsCount || 0);
        const hasEmail = Boolean(p.email && String(p.email).includes('@'));
        const hasPhone = Boolean(p.phone && String(p.phone).replace(/\D/g, '').length >= 10);

        const radarPillHtml =
          totalRadarHits > 0
            ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/60 font-mono-telemetry text-[11px] text-emerald-200 font-bold">👀 VIEWED ${totalRadarHits}x (${escapeHtml(tel.lastDeviceHint || 'Live')})</span>`
            : '';

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
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 font-mono-telemetry text-[11px] text-amber-300 font-bold">
                  ${escapeHtml(xray.leadScore || 'HOT')} • ${escapeHtml(p.primaryTrade)} (${escapeHtml(p.zipCode)})
                </span>
                ${formatSourceBadgeHtml(p)}
                ${radarPillHtml}
              </div>
              <div class="flex items-center gap-1.5">
                ${statusBadge}
                <button
                  type="button"
                  data-meta-delete="${escapeHtml(p.id)}"
                  title="Remove card"
                  class="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-red-300 text-xs cursor-pointer"
                >✕</button>
              </div>
            </div>

            <div>
              <h3 class="font-display font-extrabold text-lg text-white">
                ${escapeHtml(p.companyName)}
              </h3>
              <p class="text-xs text-slate-300 font-mono-telemetry mt-0.5">
                👤 ${escapeHtml(p.contactName)} (${escapeHtml(p.contactRole)}) • 📞 ${escapeHtml(p.phone || 'Add Phone')} • ✉️ ${escapeHtml(p.email || 'No Public Email — Use SIM Text')}
              </p>
              <p class="text-[11px] text-slate-400 font-mono-telemetry mt-0.5">
                🌐 ${escapeHtml(p.websiteUrl || 'Not found')} • ✓ Anti-AI Gate: ${p.copyGate && p.copyGate.passed ? 'PASS (0 Links T1)' : 'CHECK'}
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
                ${hasEmail ? '' : 'disabled'}
                class="${hasEmail ? 'btn-trust-emerald cursor-pointer' : 'bg-slate-700 text-slate-400 cursor-not-allowed'} px-3.5 py-2 rounded-xl text-xs font-bold"
              >
                ${hasEmail ? `✓ Send Touch ${touchNum} Email` : 'No Email (Use SIM Text)'}
              </button>
              ${
                hasPhone
                  ? `<a
                      href="${escapeHtml(p.nativeSimUri || '#')}"
                      data-meta-send-sms="${escapeHtml(p.id)}"
                      class="btn-outline-slate px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                    >
                      📲 Native SIM Text
                    </a>`
                  : ''
              }
              <button
                type="button"
                data-meta-sim-reply="${escapeHtml(p.id)}"
                class="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-xs font-bold cursor-pointer"
              >
                ⚡ Simulate Reply
              </button>
              <button
                type="button"
                data-meta-test-radar="${escapeHtml(p.id)}"
                data-preview-token="${escapeHtml(p.previewToken || '')}"
                class="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25 text-xs font-bold cursor-pointer"
              >
                📡 Test Open Radar
              </button>
              <a
                href="/recon/watch?token=${encodeURIComponent(p.previewToken || 'demo-7am-briefing')}&amp;viewer=admin"
                target="_blank"
                rel="noopener"
                class="px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 hover:bg-purple-500/30 text-xs font-bold inline-flex items-center gap-1"
              >
                🎥 Loom Video
              </a>
            </div>
            <a
              href="/recon/briefing?token=${encodeURIComponent(p.previewToken || 'demo-7am-briefing')}&amp;viewer=admin"
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
    const jwt = localStorage.getItem('tiberius_recon_session_jwt');
    if (!jwt) return;
    try {
      const authResp = await fetch('/api/recon/auth', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const authData = await authResp.json();
      if (!authData || !authData.authenticated || authData.role !== 'ADMIN') {
        return;
      }
      const metaModuleEl = document.getElementById('meta-recon-module');
      if (metaModuleEl) metaModuleEl.classList.remove('hidden');

      const resp = await fetch('/api/recon/meta-outreach', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await resp.json();
      if (data && data.ok && data.metaRecon) {
        renderMetaRecon(data.metaRecon);
      }
    } catch (_err) {
      // Ignore offline error
    }
  }

  if (metaToggleIntakeBtn && metaIntakeDrawer) {
    metaToggleIntakeBtn.addEventListener('click', () => {
      metaIntakeDrawer.classList.toggle('hidden');
    });
  }
  if (metaCloseIntakeBtn && metaIntakeDrawer) {
    metaCloseIntakeBtn.addEventListener('click', () => {
      metaIntakeDrawer.classList.add('hidden');
    });
  }

  if (metaLiveSweepBtn) {
    metaLiveSweepBtn.addEventListener('click', async () => {
      const orig = metaLiveSweepBtn.textContent;
      metaLiveSweepBtn.textContent = '🌐 Crawling TX Open Data & Websites...';
      metaLiveSweepBtn.disabled = true;
      try {
        const resp = await fetch('/api/recon/meta-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sweep',
            zipCode: resolveSelectedMetaZip(),
            primaryTrade: metaTradeSelect ? metaTradeSelect.value : 'ALL',
            playbook: metaPlaybookSelect ? metaPlaybookSelect.value : 'FULL_BUNDLE_OFFENSE_DEFENSE',
            liveDiscovery: true,
            fetchLiveWeb: true,
            includeSavedCustom: true,
            limit: 6
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.metaRecon) {
          renderMetaRecon(data.metaRecon);
          showMetaFeedback(
            `🌐 Live Real-Contractor Scout pulled ${data.metaRecon.prospects.length} active TX contractors (TDLR + Comptroller + Live Domain/DOM X-Ray) and provisioned ${data.metaRecon.metrics.livePreviewsProvisioned} live Preview Briefings!`
          );
        }
      } catch (_err) {
        // Ignore
      } finally {
        metaLiveSweepBtn.textContent = orig;
        metaLiveSweepBtn.disabled = false;
      }
    });
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
            zipCode: resolveSelectedMetaZip(),
            primaryTrade: metaTradeSelect ? metaTradeSelect.value : 'ALL',
            playbook: metaPlaybookSelect ? metaPlaybookSelect.value : 'FULL_BUNDLE_OFFENSE_DEFENSE',
            includeSavedCustom: true
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

  if (metaAddProspectForm) {
    metaAddProspectForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const companyEl = document.getElementById('meta-add-company');
      const contactEl = document.getElementById('meta-add-contact');
      const phoneEl = document.getElementById('meta-add-phone');
      const emailEl = document.getElementById('meta-add-email');
      const websiteEl = document.getElementById('meta-add-website');
      const zipEl = document.getElementById('meta-add-zip');
      const tradeEl = document.getElementById('meta-add-trade');

      const orig = metaAddSubmitBtn ? metaAddSubmitBtn.textContent : '';
      if (metaAddSubmitBtn) {
        metaAddSubmitBtn.textContent = '⚡ Crawling Site, Pairing Permits & Building Preview...';
        metaAddSubmitBtn.disabled = true;
      }
      try {
        const resp = await fetch('/api/recon/meta-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_prospect',
            companyName: companyEl ? companyEl.value.trim() : '',
            contactName: contactEl ? contactEl.value.trim() : '',
            phone: phoneEl ? phoneEl.value.trim() : '',
            email: emailEl ? emailEl.value.trim() : '',
            websiteUrl: websiteEl ? websiteEl.value.trim() : '',
            zipCode: zipEl ? zipEl.value.trim() : '78130',
            primaryTrade: tradeEl ? tradeEl.value : 'Commercial Concrete',
            playbook: metaPlaybookSelect ? metaPlaybookSelect.value : 'FULL_BUNDLE_OFFENSE_DEFENSE',
            fetchLiveWeb: true
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.metaRecon) {
          renderMetaRecon(data.metaRecon);
          showMetaFeedback(
            `✓ Added ${data.prospect.companyName} (${data.prospect.zipCode}), paired 3 real permits, and provisioned live Preview Briefing: ${data.prospect.previewBriefingUrl}`
          );
          if (companyEl) companyEl.value = '';
          if (contactEl) contactEl.value = '';
          if (phoneEl) phoneEl.value = '';
          if (emailEl) emailEl.value = '';
          if (websiteEl) websiteEl.value = '';
        }
      } catch (_err) {
        // Ignore
      } finally {
        if (metaAddSubmitBtn) {
          metaAddSubmitBtn.textContent = orig;
          metaAddSubmitBtn.disabled = false;
        }
      }
    });
  }

  if (metaCsvSampleBtn && metaCsvTextarea) {
    metaCsvSampleBtn.addEventListener('click', () => {
      metaCsvTextarea.value = [
        'company,contact,email,phone,website,zip,trade',
        'Pioneer Roofing Solutions LLC,Owner,,512-922-3939,https://www.pioneerroofingsolutions.com,78130,Roofing / Exteriors',
        'New Braunfels Pool Company,Estimating,info@nbpoolpros.com,830-660-6270,https://nbpoolpros.com,78130,Pools / Fencing / Custom Home'
      ].join('\n');
    });
  }

  if (metaCsvFileInput && metaCsvTextarea) {
    metaCsvFileInput.addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        metaCsvTextarea.value = String(reader.result || '');
      };
      reader.readAsText(file);
    });
  }

  if (metaCsvImportBtn && metaCsvTextarea) {
    metaCsvImportBtn.addEventListener('click', async () => {
      const rawCsv = metaCsvTextarea.value.trim();
      if (!rawCsv) {
        showMetaFeedback('⚠️ Paste CSV lines or upload a .csv file first.');
        return;
      }
      const orig = metaCsvImportBtn.textContent;
      metaCsvImportBtn.textContent = '📥 Importing & Building Live Previews...';
      metaCsvImportBtn.disabled = true;
      try {
        const resp = await fetch('/api/recon/meta-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'import_csv',
            csvText: rawCsv,
            defaultZipCode: resolveSelectedMetaZip(),
            defaultTrade: metaTradeSelect ? metaTradeSelect.value : 'Commercial Concrete',
            playbook: metaPlaybookSelect ? metaPlaybookSelect.value : 'FULL_BUNDLE_OFFENSE_DEFENSE',
            fetchLiveWeb: true
          })
        });
        const data = await resp.json();
        if (data && data.ok && data.metaRecon) {
          renderMetaRecon(data.metaRecon);
          showMetaFeedback(
            `📥 Imported ${data.importedCount} real contractor(s) from CSV, ran 3-Leak Website X-Rays, and provisioned ${data.importedCount} live Preview Briefings!`
          );
          metaCsvTextarea.value = '';
        } else if (data && data.error) {
          showMetaFeedback(`⚠️ CSV Import Error: ${data.error}`);
        }
      } catch (_err) {
        // Ignore
      } finally {
        metaCsvImportBtn.textContent = orig;
        metaCsvImportBtn.disabled = false;
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

      const delBtn = e.target.closest('[data-meta-delete]');
      if (delBtn) {
        const pid = delBtn.getAttribute('data-meta-delete');
        try {
          const resp = await fetch('/api/recon/meta-outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_prospect', prospectId: pid })
          });
          const data = await resp.json();
          if (data && data.ok && data.metaRecon) {
            renderMetaRecon(data.metaRecon);
            showMetaFeedback('✓ Removed prospect card from Meta-Recon board.');
          }
        } catch (_err) {
          // Ignore
        }
        return;
      }

      const radarBtn = e.target.closest('[data-meta-test-radar]');
      if (radarBtn) {
        const pid = radarBtn.getAttribute('data-meta-test-radar');
        const pTok = radarBtn.getAttribute('data-preview-token');
        radarBtn.textContent = '📡 Firing Radar...';
        try {
          const resp = await fetch('/api/recon/meta-outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'track_preview_event',
              prospectId: pid,
              token: pTok,
              eventType: 'PREVIEW_BRIEFING_OPENED',
              deviceHint: 'iPhone (Radar Test)',
              forceAlert: true
            })
          });
          const data = await resp.json();
          if (data && data.ok && data.metaRecon) {
            renderMetaRecon(data.metaRecon);
            showMetaFeedback(
              `📡 Live Preview Radar triggered for ${data.prospect.companyName}! Founder SMS Alert: "${data.radarSmsReceipt ? data.radarSmsReceipt.smsBody : 'Logged'}"`
            );
          }
        } catch (_err) {
          // Ignore
        }
        return;
      }

      const sendBtn = e.target.closest('[data-meta-send-email]');
      if (sendBtn) {
        if (sendBtn.disabled) return;
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
          } else if (data && data.error) {
            showMetaFeedback(`⚠️ ${data.error}`);
            if (activeMetaRecon) renderMetaRecon(activeMetaRecon);
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
