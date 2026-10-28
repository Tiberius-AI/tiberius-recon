/**
 * TIBERIUS RECON™ — POST-PAY NEW CLIENT ONBOARDING & CREDENTIAL ISSUANCE (onboarding.js)
 *
 * Powers /recon/onboarding (and /onboarding):
 *   1. Live Zip Code & Trade Slot Availability Check (/api/recon/availability)
 *   2. Trade-Specific Default Shop Dossier + 1-Click Website Auto-Scanner (/api/recon/knowledge)
 *   3. Account Creation, Territory Lock, Session Token Storage & Live Welcome Email/SMS Credential Issuance (/api/recon/activate)
 */

(function () {
  if (window.__TIBERIUS_ONBOARDING_BOOTED__) return;
  window.__TIBERIUS_ONBOARDING_BOOTED__ = true;

  const TRADE_DOSSIER_DEFAULTS = {
    'Commercial Concrete': {
      coreServices:
        'Commercial Tilt-Wall & Structural Slabs, Heavy-Duty Truck Aprons & Loading Docks, ADA Ramp & Sidewalk Compliance, Post-Tension Foundations',
      certsAndBonding:
        'ACI-Certified Finishers • $2M/$5M Commercial GL + Workers Comp • Bonded up to $1.5M',
      yearsInBusiness: '15+ Years Serving Central & South Texas',
      recentCompletedProof:
        'a 22,000 sq ft commercial tilt-wall & dock apron project that passed city inspection ahead of schedule',
      uniqueGuarantee:
        'zero day-labor subs, in-house laser screed equipment, and a 100% clean-site schedule guarantee'
    },
    'Roofing / Exteriors': {
      coreServices:
        'TPO & PVC Flat Commercial Roofs, Standing-Seam Metal Retrofits, Elastomeric Roof Coatings, Hail & Wind Insurance Claims',
      certsAndBonding:
        'RCAT Licensed Commercial Roofer • GAF Master Select & Carlisle Certified • $2M Umbrella GL',
      yearsInBusiness: '18+ Years Commercial & Industrial Roofing',
      recentCompletedProof:
        'a 45,000 sq ft TPO & standing-seam metal reroof with a 20-year NDL manufacturer warranty',
      uniqueGuarantee:
        '24-hour emergency leak response, zero business disruption during tear-off, and full NDL warranty documentation'
    },
    'Electrical / HVAC': {
      coreServices:
        'Commercial RTU Replacements & Curb Adapters, 3-Phase Tenant Finish-Out Electrical, VRF/Chiller Controls, MEP Value Engineering',
      certsAndBonding:
        'TDLR Licensed TACLA & Master Electrician • $2M Commercial GL • EPA Universal Certified',
      yearsInBusiness: '14+ Years Commercial MEP & Tenant Buildouts',
      recentCompletedProof:
        'a multi-unit commercial RTU crane swap and 800A 3-phase panel upgrade completed over a single weekend',
      uniqueGuarantee:
        'guaranteed city rough-in & final inspection pass on the first walk-through with dedicated crane & startup crews'
    },
    'General Contracting': {
      coreServices:
        'Medical, Retail & Office Tenant Finish-Outs (TI), Ground-Up Commercial Shell Buildouts, Structural Remodels, Fast-Track Permitting',
      certsAndBonding:
        'Fully Bonded & Insured Commercial GC • OSHA-30 Superintendents • $5M Aggregate Commercial GL',
      yearsInBusiness: '16+ Years Commercial TI & Ground-Up Construction',
      recentCompletedProof:
        'a 12,500 sq ft medical & retail finish-out delivered 10 days ahead of CO inspection',
      uniqueGuarantee:
        'open-book sub pricing, daily Procore photo logs, and a locked Certificate of Occupancy milestone schedule'
    },
    'Landscaping / Grounds': {
      coreServices:
        'Commercial HOA & Retail Grounds Maintenance, Large-Caliper Tree Installs & Clearing, Commercial Irrigation & Drainage, Hardscapes',
      certsAndBonding:
        'TCEQ Licensed Irrigator • ISA Certified Arborist on Staff • $2M Commercial GL & Fleet Coverage',
      yearsInBusiness: '12+ Years Commercial Grounds & Site Development',
      recentCompletedProof:
        'a 14-acre commercial business park irrigation, detention pond, and native tree installation package',
      uniqueGuarantee:
        'uniformed W-2 crews, proactive monthly irrigation audits, and a 100% plant & turf survival warranty'
    }
  };

  let userCustomizedDossier = false;
  let lastIssuedCredentialsCopyText = '';

  function $(id) {
    return document.getElementById(id);
  }

  function applyTradeDefaults(trade) {
    if (userCustomizedDossier) return;
    const preset = TRADE_DOSSIER_DEFAULTS[trade] || TRADE_DOSSIER_DEFAULTS['Commercial Concrete'];
    if ($('onb-core-services')) $('onb-core-services').value = preset.coreServices;
    if ($('onb-certs-bonding')) $('onb-certs-bonding').value = preset.certsAndBonding;
    if ($('onb-years-in-biz')) $('onb-years-in-biz').value = preset.yearsInBusiness;
    if ($('onb-proof-project')) $('onb-proof-project').value = preset.recentCompletedProof;
    if ($('onb-guarantee')) $('onb-guarantee').value = preset.uniqueGuarantee;
  }

  async function checkZipAvailability() {
    const zipEl = $('onb-territory-zip');
    const tradeEl = $('onb-primary-trade');
    const tierEl = $('onb-tier-level');
    const badgeEl = $('onb-zip-live-badge');
    const detailEl = $('onb-zip-portal-detail');
    if (!zipEl || !badgeEl || !detailEl) return;

    const zip = (zipEl.value || '').trim();
    const trade = tradeEl ? tradeEl.value : 'Commercial Concrete';
    const tier = tierEl ? tierEl.value : 'Tier 2: Commercial Permits';

    if (zip.length < 5) {
      badgeEl.textContent = 'ENTER 5-DIGIT ZIP CODE';
      badgeEl.className =
        'px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-mono-telemetry text-xs text-slate-300 font-bold';
      return;
    }

    try {
      const qs = new URLSearchParams({ zip, trade, tier });
      const res = await fetch(`/api/recon/availability?${qs.toString()}`);
      const data = await res.json();
      if (data && data.ok) {
        if (data.available) {
          badgeEl.textContent = `✓ ${data.remainingSlots} OF ${data.maxSlots} TERRITORY SLOTS OPEN (${zip})`;
          badgeEl.className =
            'px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 font-mono-telemetry text-xs text-emerald-300 font-bold';
        } else {
          badgeEl.textContent = `⚠ ${zip} WAITLIST • ADJACENT ZIP AVAILABLE`;
          badgeEl.className =
            'px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 font-mono-telemetry text-xs text-amber-300 font-bold';
        }
        const cityLabel = data.city ? `${data.city}, ${data.state || 'TX'}` : `Zip ${zip}`;
        const portalText = data.municipalPortal || 'Municipal Permit Portal';
        const cadText = data.appraisalDistrict || 'County Appraisal District';
        detailEl.textContent = `✓ ${cityLabel} • Sweeps ${portalText} & ${cadText} + 25-Mile Radius`;
      }
    } catch (_err) {
      // Keep default friendly display on transient network error
    }
  }

  async function handleWebsiteScan() {
    const urlInput = $('onb-website-url');
    const btn = $('btn-onb-scan-website');
    const pill = $('onb-scan-status-pill');
    const trade = $('onb-primary-trade') ? $('onb-primary-trade').value : 'Commercial Concrete';
    const companyName = $('onb-company-name') ? $('onb-company-name').value.trim() : '';

    const rawUrl = urlInput ? urlInput.value.trim() : '';
    if (!rawUrl) {
      if (pill) {
        pill.textContent = '⚠ ENTER WEBSITE URL FIRST';
        pill.className =
          'px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 font-mono-telemetry text-xs text-amber-300 shrink-0';
      }
      if (urlInput) urlInput.focus();
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = '🔍 Scanning Website...';
    }
    if (pill) {
      pill.textContent = '⏳ SCANNING SITE & EXTRACTING DOSSIER...';
      pill.className =
        'px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 font-mono-telemetry text-xs text-blue-300 shrink-0';
    }

    try {
      const res = await fetch('/api/recon/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_website',
          websiteUrl: rawUrl,
          primaryTrade: trade,
          companyName
        })
      });
      const data = await res.json();
      const kb = (data && (data.knowledgeBase || data.extractedProfile)) || null;
      if (kb) {
        userCustomizedDossier = true;
        if (Array.isArray(kb.coreServices) && kb.coreServices.length && $('onb-core-services')) {
          $('onb-core-services').value = kb.coreServices.join(', ');
        } else if (typeof kb.coreServices === 'string' && kb.coreServices && $('onb-core-services')) {
          $('onb-core-services').value = kb.coreServices;
        }
        if (kb.certsAndBonding && $('onb-certs-bonding')) {
          $('onb-certs-bonding').value = kb.certsAndBonding;
        }
        if (kb.yearsInBusiness && $('onb-years-in-biz')) {
          $('onb-years-in-biz').value = kb.yearsInBusiness;
        }
        if (kb.recentCompletedProof && $('onb-proof-project')) {
          $('onb-proof-project').value = kb.recentCompletedProof;
        }
        if (kb.uniqueGuarantee && $('onb-guarantee')) {
          $('onb-guarantee').value = kb.uniqueGuarantee;
        }
        if (pill) {
          pill.textContent = '✓ WEBSITE SCANNED & DOSSIER POPULATED';
          pill.className =
            'px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 font-mono-telemetry text-xs text-emerald-300 shrink-0';
        }
      } else {
        throw new Error((data && data.error) || 'Could not scan website');
      }
    } catch (_err) {
      userCustomizedDossier = true;
      if (pill) {
        pill.textContent = '✓ APPLIED TRADE BENCHMARK DOSSIER';
        pill.className =
          'px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 font-mono-telemetry text-xs text-emerald-300 shrink-0';
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔍 Auto-Scan My Website';
      }
    }
  }

  async function handleOnboardingSubmit(e) {
    e.preventDefault();

    const companyName = ($('onb-company-name')?.value || '').trim();
    const ownerName = ($('onb-owner-name')?.value || '').trim();
    const workEmail = ($('onb-work-email')?.value || '').trim();
    const mobilePhone = ($('onb-mobile-phone')?.value || '').trim();
    const password = ($('onb-password')?.value || '').trim();
    const primaryTrade = $('onb-primary-trade')?.value || 'Commercial Concrete';
    const territoryZip = ($('onb-territory-zip')?.value || '78130').trim();
    const minValuation = Number($('onb-min-valuation')?.value || 100000);
    const tierLevel = $('onb-tier-level')?.value || 'Tier 2: Commercial Permits';
    const smartSiteBundle = Boolean($('onb-smart-site-bundle')?.checked);
    const websiteUrl = ($('onb-website-url')?.value || '').trim();
    const sendWelcomeCredentials = Boolean($('onb-send-welcome-creds')?.checked);

    if (!companyName || !ownerName || !workEmail || !mobilePhone) {
      alert('Please fill in your Company Name, Owner/Estimator Name, Work Email, and Direct Cell Number.');
      return;
    }

    const coreServicesRaw = ($('onb-core-services')?.value || '').trim();
    const coreServices = coreServicesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const knowledgeBase = {
      websiteUrl,
      coreServices,
      certsAndBonding: ($('onb-certs-bonding')?.value || '').trim(),
      yearsInBusiness: ($('onb-years-in-biz')?.value || '').trim(),
      recentCompletedProof: ($('onb-proof-project')?.value || '').trim(),
      uniqueGuarantee: ($('onb-guarantee')?.value || '').trim(),
      idealProjectTypes: `${primaryTrade} projects over $${minValuation.toLocaleString()} in ${territoryZip}`
    };

    const submitBtn = $('btn-submit-onboarding');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳ Locking Territory &amp; Issuing Credentials...</span>';
    }

    try {
      const res = await fetch('/api/recon/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          ownerName,
          workEmail,
          mobilePhone,
          password: password || `Recon${territoryZip}!`,
          primaryTrade,
          territoryZip,
          minValuation,
          tierLevel,
          smartSiteBundle,
          websiteUrl,
          knowledgeBase,
          isPaidOnboarding: true,
          sendWelcomeCredentials
        })
      });

      const data = await res.json();
      if (!data || !data.ok) {
        throw new Error((data && data.error) || 'Onboarding activation failed');
      }

      // Persist session & active tokens in localStorage so client is immediately signed in everywhere
      try {
        if (data.sessionToken) {
          localStorage.setItem('tiberius_recon_session_jwt', data.sessionToken);
          localStorage.setItem('tiberius_recon_session_token', data.sessionToken);
        }
        if (data.magicToken) {
          localStorage.setItem('tiberius_recon_token', data.magicToken);
          localStorage.setItem('tiberius_recon_active_token', data.magicToken);
        }
        if (data.contractor && data.contractor.id) {
          localStorage.setItem('tiberius_recon_contractor_id', data.contractor.id);
        }
        if (data.contractor) {
          const accountWithToken = { ...data.contractor, magicToken: data.magicToken };
          localStorage.setItem('tiberius_recon_account', JSON.stringify(accountWithToken));
          localStorage.setItem('tiberius_recon_profile', JSON.stringify(accountWithToken));
        }
      } catch (_storageErr) {
        // Ignore storage errors in private mode
      }

      const creds = data.issuedCredentials || {
        loginUrl: `${window.location.origin}/recon/login`,
        loginEmail: workEmail,
        loginPhone: mobilePhone,
        password: password || `Recon${territoryZip}!`,
        territoryPin: territoryZip
      };

      if ($('success-company-headline')) {
        $('success-company-headline').textContent = `${companyName} Is Locked & Live!`;
      }
      if ($('cred-login-url')) {
        $('cred-login-url').textContent = creds.loginUrl;
        $('cred-login-url').href = `login.html`;
      }
      if ($('cred-login-email')) $('cred-login-email').textContent = creds.loginEmail;
      if ($('cred-login-phone')) $('cred-login-phone').textContent = creds.loginPhone;
      if ($('cred-login-password')) $('cred-login-password').textContent = creds.password;
      if ($('cred-login-pin')) $('cred-login-pin').textContent = creds.territoryPin;

      if ($('cred-territory-summary') && data.territorySummary) {
        const ts = data.territorySummary;
        $('cred-territory-summary').textContent = `${ts.zip} (${ts.city}, ${ts.state}) • ${ts.municipalPortal} & ${ts.appraisalDistrict}`;
      }

      if ($('cred-email-status')) {
        const er = data.welcomeEmailReceipt;
        if (er && (er.liveDispatched || er.provider === 'RESEND_LIVE')) {
          $('cred-email-status').textContent = `✓ Live Email Sent to ${creds.loginEmail} (via recon@send.tiberius.ai)`;
          $('cred-email-status').className = 'text-emerald-400 font-mono-telemetry font-bold';
        } else if (sendWelcomeCredentials) {
          $('cred-email-status').textContent = `✓ Credentials Queued for ${creds.loginEmail}`;
          $('cred-email-status').className = 'text-emerald-400 font-mono-telemetry font-bold';
        } else {
          $('cred-email-status').textContent = 'Displayed on screen (email dispatch unchecked)';
          $('cred-email-status').className = 'text-slate-300 font-mono-telemetry';
        }
      }

      if ($('cred-sms-status')) {
        const sr = data.welcomeSmsReceipt;
        if (sr && (sr.liveDispatched || sr.provider === 'TWILIO_LIVE_API')) {
          $('cred-sms-status').textContent = `✓ Live SMS Sent to ${creds.loginPhone} (${sr.provider || 'TWILIO_LIVE_API'})`;
          $('cred-sms-status').className = 'text-emerald-400 font-mono-telemetry font-bold';
        } else if (sendWelcomeCredentials) {
          $('cred-sms-status').textContent = `✓ Credentials Ready for ${creds.loginPhone}`;
          $('cred-sms-status').className = 'text-emerald-400 font-mono-telemetry font-bold';
        } else {
          $('cred-sms-status').textContent = 'Displayed on screen (SMS dispatch unchecked)';
          $('cred-sms-status').className = 'text-slate-300 font-mono-telemetry';
        }
      }

      const tokenParam = encodeURIComponent(data.magicToken || '');
      if ($('launch-briefing-btn')) {
        $('launch-briefing-btn').href = `briefing.html?token=${tokenParam}`;
      }
      if ($('launch-inbox-btn')) {
        $('launch-inbox-btn').href = `inbox.html?token=${tokenParam}`;
      }
      if ($('launch-command-btn')) {
        $('launch-command-btn').href = `command.html?token=${tokenParam}`;
      }

      lastIssuedCredentialsCopyText = [
        `TIBERIUS RECON™ — CLIENT LOGIN CREDENTIALS`,
        `Company: ${companyName}`,
        `Territory: ${territoryZip} (${primaryTrade})`,
        `Client Sign-In URL: ${creds.loginUrl}`,
        `Login Email: ${creds.loginEmail}`,
        `Login Mobile Phone: ${creds.loginPhone}`,
        `Password: ${creds.password}`,
        `Backup Territory PIN: ${creds.territoryPin}`,
        `7:00 AM Briefing Link: ${window.location.origin}${data.briefingUrl || `/recon/briefing?token=${tokenParam}`}`,
        `Conversation Room Link: ${window.location.origin}${data.inboxUrl || `/recon/inbox?token=${tokenParam}`}`
      ].join('\n');

      const successPanel = $('onboarding-success-panel');
      if (successPanel) {
        successPanel.classList.remove('hidden');
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      alert(`Onboarding Error: ${err.message || 'Please check your inputs and try again.'}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✓ Credentials Issued — Update or Resend Anytime →</span>';
      }
    }
  }

  function hydrateFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('company') && $('onb-company-name')) {
      $('onb-company-name').value = params.get('company');
    }
    if (params.get('owner') && $('onb-owner-name')) {
      $('onb-owner-name').value = params.get('owner');
    }
    if (params.get('email') && $('onb-work-email')) {
      $('onb-work-email').value = params.get('email');
    }
    if (params.get('phone') && $('onb-mobile-phone')) {
      $('onb-mobile-phone').value = params.get('phone');
    }
    if (params.get('zip') && $('onb-territory-zip')) {
      $('onb-territory-zip').value = params.get('zip');
    }
    if (params.get('trade') && $('onb-primary-trade')) {
      $('onb-primary-trade').value = params.get('trade');
      applyTradeDefaults(params.get('trade'));
    }
    if (params.get('tier') && $('onb-tier-level')) {
      $('onb-tier-level').value = params.get('tier');
    }
  }

  function initOnboardingPortal() {
    hydrateFromUrlParams();
    checkZipAvailability();

    const zipEl = $('onb-territory-zip');
    const tradeEl = $('onb-primary-trade');
    const tierEl = $('onb-tier-level');

    if (zipEl) {
      zipEl.addEventListener('input', checkZipAvailability);
      zipEl.addEventListener('change', checkZipAvailability);
    }
    if (tradeEl) {
      tradeEl.addEventListener('change', () => {
        applyTradeDefaults(tradeEl.value);
        checkZipAvailability();
      });
    }
    if (tierEl) {
      tierEl.addEventListener('change', checkZipAvailability);
    }

    ['onb-core-services', 'onb-certs-bonding', 'onb-years-in-biz', 'onb-proof-project', 'onb-guarantee'].forEach(
      (id) => {
        const el = $(id);
        if (el) {
          el.addEventListener('input', () => {
            userCustomizedDossier = true;
          });
        }
      }
    );

    const scanBtn = $('btn-onb-scan-website');
    if (scanBtn) {
      scanBtn.addEventListener('click', handleWebsiteScan);
    }

    const form = $('client-onboarding-form');
    if (form) {
      form.addEventListener('submit', handleOnboardingSubmit);
    }

    const copyBtn = $('btn-copy-credentials');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!lastIssuedCredentialsCopyText) return;
        try {
          await navigator.clipboard.writeText(lastIssuedCredentialsCopyText);
          copyBtn.textContent = '✓ Copied to Clipboard!';
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy Login Credentials';
          }, 2500);
        } catch (_e) {
          // Fallback
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnboardingPortal);
  } else {
    initOnboardingPortal();
  }
})();
