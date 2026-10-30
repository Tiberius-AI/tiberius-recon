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
      crewAndLicenseBadge: 'ACI-Certified Commercial Concrete Crew',
      coreServices:
        'Commercial Tilt-Wall & Monolithic Structural Slabs, Laser-Screed Warehouse Slabs & Dock Leveler Pits, Commercial Parking Lot Mill/Overlay & ADA Ramp Retrofits, High-PSI Service Bay Slabs & Trench Drains',
      coreCapabilities: [
        'Commercial Tilt-Wall & Monolithic Structural Slabs',
        'Laser-Screed Warehouse Slabs & Dock Leveler Pits',
        'Commercial Parking Lot Mill/Overlay & ADA Ramp Retrofits',
        'High-PSI Service Bay Slabs & Trench Drains'
      ],
      proofByArchetype: {
        groundUpShell:
          'a 36,000 sq ft commercial shell foundation, laser-screed slab & heavy-duty truck apron package in New Braunfels',
        commercialRetrofit:
          'a 48,000 sq ft commercial plaza parking lot mill/overlay, ADA ramp retrofit & structural curb replacement in New Braunfels',
        specialtyStructural:
          'a 28,000 sq ft engineered structural slab, recessed foundation & heavy-load pier cap package in New Braunfels'
      },
      proofAngles: [
        'a 36,000 sq ft commercial shell foundation, laser-screed slab & heavy-duty truck apron package in New Braunfels',
        'a 48,000 sq ft commercial plaza parking lot mill/overlay, ADA ramp retrofit & structural curb replacement in New Braunfels',
        'a 28,000 sq ft engineered structural slab, recessed foundation & heavy-load pier cap package in New Braunfels'
      ],
      certsAndBonding:
        'ACI-Certified Commercial Concrete Crew • $2M/$5M Commercial GL + Workers Comp • Bonded up to $1.5M',
      yearsInBusiness: '15+ Years Serving Central & South Texas',
      recentCompletedProof:
        'a 36,000 sq ft commercial shell foundation, laser-screed slab & heavy-duty truck apron package in New Braunfels',
      signatureGuarantee: 'laser-screed Ff/Fl flatness compliance',
      uniqueGuarantee: 'laser-screed Ff/Fl flatness compliance'
    },
    'Roofing / Exteriors': {
      crewAndLicenseBadge: 'RCAT Licensed Commercial Roofer',
      coreServices:
        'Engineered Standing-Seam Commercial Metal Roof Systems, Commercial Flat-to-Pitched Metal Retrofits, TPO & PVC Flat Commercial Roofs, Elastomeric Roof Coatings',
      coreCapabilities: [
        'Engineered Standing-Seam Commercial Metal Roof Systems',
        'Commercial Flat-to-Pitched Metal Retrofits',
        'TPO & PVC Flat Commercial Roofs',
        'Elastomeric Roof Coatings'
      ],
      proofByArchetype: {
        groundUpShell:
          'a 38,000 sq ft ground-up commercial shell standing-seam metal & membrane roof package in New Braunfels',
        commercialRetrofit:
          'a 45,000 sq ft commercial standing-seam metal roof & elastomeric CapEx retrofit in New Braunfels',
        specialtyStructural:
          'a 32,000 sq ft long-span structural standing-seam metal roof & custom architectural flashing package in New Braunfels'
      },
      proofAngles: [
        'a 38,000 sq ft ground-up commercial shell standing-seam metal & membrane roof package in New Braunfels',
        'a 45,000 sq ft commercial standing-seam metal roof & elastomeric CapEx retrofit in New Braunfels',
        'a 32,000 sq ft long-span structural standing-seam metal roof & custom architectural flashing package in New Braunfels'
      ],
      certsAndBonding:
        'RCAT Licensed Commercial Roofer • GAF Master Select & Carlisle Certified • $2M Umbrella GL',
      yearsInBusiness: '18+ Years Commercial & Industrial Roofing',
      recentCompletedProof:
        'a 45,000 sq ft commercial standing-seam metal roof & elastomeric CapEx retrofit in New Braunfels',
      signatureGuarantee: '20-year NDL weathertightness warranties',
      uniqueGuarantee: '20-year NDL weathertightness warranties'
    },
    'Electrical / HVAC': {
      crewAndLicenseBadge: 'TDLR Licensed Electrical & MEP Contractor',
      coreServices:
        'Commercial 3-Phase Switchgear & 1200A Power Distribution, High-SEER Packaged RTU & Make-Up Air Installations, Hospital-Grade Clinical MEP Rough-In, Exposed Spiral Ductwork & EMS Controls',
      coreCapabilities: [
        'Commercial 3-Phase Switchgear & 1200A Power Distribution',
        'High-SEER Packaged RTU & Make-Up Air Installations',
        'Hospital-Grade Clinical MEP Rough-In',
        'Exposed Spiral Ductwork & EMS Controls'
      ],
      proofByArchetype: {
        groundUpShell:
          'a 40,000 sq ft commercial shell 3-phase switchgear distribution & packaged RTU mechanical buildout in New Braunfels',
        commercialRetrofit:
          'a 44,000 sq ft multi-building CapEx high-SEER RTU replacement, EMS controls & LED retrofit in New Braunfels',
        specialtyStructural:
          'a 28,000 sq ft high-bay mechanical air-handling, custom spiral ductwork & 480V power distribution package in New Braunfels'
      },
      proofAngles: [
        'a 40,000 sq ft commercial shell 3-phase switchgear distribution & packaged RTU mechanical buildout in New Braunfels',
        'a 44,000 sq ft multi-building CapEx high-SEER RTU replacement, EMS controls & LED retrofit in New Braunfels',
        'a 28,000 sq ft high-bay mechanical air-handling, custom spiral ductwork & 480V power distribution package in New Braunfels'
      ],
      certsAndBonding:
        'TDLR Licensed Electrical & MEP Contractor • Class-A TACLA • $2M/$5M Commercial GL & Bonded',
      yearsInBusiness: '14+ Years Commercial MEP & Tenant Buildouts',
      recentCompletedProof:
        'a 40,000 sq ft commercial shell 3-phase switchgear distribution & packaged RTU mechanical buildout in New Braunfels',
      signatureGuarantee: 'turnkey Title 24 / IECC commissioning',
      uniqueGuarantee: 'turnkey Title 24 / IECC commissioning'
    },
    'Pools / Fencing / Custom Home': {
      crewAndLicenseBadge: 'AWS-Certified Commercial Site & Perimeter Crew',
      coreServices:
        'Commercial Chain-Link & Ornamental Steel Security Fencing, Automated Cantilever Slide Gates & Keypad Pedestals, Structural Steel Shade Canopies & Entry Canopies, Commercial Masonry Dumpster Enclosures & Site Bollards',
      coreCapabilities: [
        'Commercial Chain-Link & Ornamental Steel Security Fencing',
        'Automated Cantilever Slide Gates & Keypad Pedestals',
        'Structural Steel Shade Canopies & Entry Canopies',
        'Commercial Masonry Dumpster Enclosures & Site Bollards'
      ],
      proofByArchetype: {
        groundUpShell:
          'a 35,000 sq ft commercial site security fencing, cantilever slide gate & masonry enclosure package in New Braunfels',
        commercialRetrofit:
          'a 42,000 sq ft commercial campus perimeter fence upgrade, shade pergola & automated gate operator retrofit in New Braunfels',
        specialtyStructural:
          'a 26,000 sq ft architectural steel shade canopy, ornamental perimeter fencing & commercial patio hardscape package in New Braunfels'
      },
      proofAngles: [
        'a 35,000 sq ft commercial site security fencing, cantilever slide gate & masonry enclosure package in New Braunfels',
        'a 42,000 sq ft commercial campus perimeter fence upgrade, shade pergola & automated gate operator retrofit in New Braunfels',
        'a 26,000 sq ft architectural steel shade canopy, ornamental perimeter fencing & commercial patio hardscape package in New Braunfels'
      ],
      certsAndBonding:
        'AWS-Certified Commercial Site & Perimeter Crew • $2M/$5M Commercial GL • UL-325 Gate Compliance',
      yearsInBusiness: '16+ Years Commercial Site Amenities & Perimeter Security',
      recentCompletedProof:
        'a 35,000 sq ft commercial site security fencing, cantilever slide gate & masonry enclosure package in New Braunfels',
      signatureGuarantee: 'engineered wind-load & UL-325 gate compliance',
      uniqueGuarantee: 'engineered wind-load & UL-325 gate compliance'
    },
    'B2B / Commercial Services': {
      crewAndLicenseBadge: 'OSHA-Certified Commercial Turnover & Facility Crew',
      coreServices:
        'Post-Construction Final Clean & Pre-Occupancy Turnover Detailing, Commercial Parking Lot Striping & Sealcoating, Multi-Building Exterior Elastomeric Facade & Window Washing, Terminal Clinical-Grade Post-Construction Sanitization',
      coreCapabilities: [
        'Post-Construction Final Clean & Pre-Occupancy Turnover Detailing',
        'Commercial Parking Lot Striping & Sealcoating',
        'Multi-Building Exterior Elastomeric Facade & Window Washing',
        'Terminal Clinical-Grade Post-Construction Sanitization'
      ],
      proofByArchetype: {
        groundUpShell:
          'a 45,000 sq ft commercial shell post-construction final clean, glass detailing & lot striping turnover in New Braunfels',
        commercialRetrofit:
          'a 4-building, 60,000 sq ft commercial portfolio exterior facade wash, sealcoating/striping & common-area refresh in New Braunfels',
        specialtyStructural:
          'a 30,000 sq ft specialty commercial facility post-construction deep clean, high-bay detailing & floor prep package in New Braunfels'
      },
      proofAngles: [
        'a 45,000 sq ft commercial shell post-construction final clean, glass detailing & lot striping turnover in New Braunfels',
        'a 4-building, 60,000 sq ft commercial portfolio exterior facade wash, sealcoating/striping & common-area refresh in New Braunfels',
        'a 30,000 sq ft specialty commercial facility post-construction deep clean, high-bay detailing & floor prep package in New Braunfels'
      ],
      certsAndBonding:
        'OSHA-Certified Commercial Turnover & Facility Crew • Vendor-Compliance Ready (W-9, COI, $2M/$5M GL)',
      yearsInBusiness: '12+ Years Commercial Turnover & Facility Services',
      recentCompletedProof:
        'a 45,000 sq ft commercial shell post-construction final clean, glass detailing & lot striping turnover in New Braunfels',
      signatureGuarantee: 'bonded day-1 CO turnover & SLA compliance',
      uniqueGuarantee: 'bonded day-1 CO turnover & SLA compliance'
    }
  };
  TRADE_DOSSIER_DEFAULTS['General Contracting'] = TRADE_DOSSIER_DEFAULTS['Pools / Fencing / Custom Home'];
  TRADE_DOSSIER_DEFAULTS['Landscaping / Grounds'] = TRADE_DOSSIER_DEFAULTS['B2B / Commercial Services'];

  let userCustomizedDossier = false;
  let scannedCrewBadge = null;
  let scannedProofByArchetype = null;
  let scannedProofAngles = null;
  let scannedSignatureGuarantee = null;
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
        if (kb.tradeCategory && $('onb-primary-trade')) {
          $('onb-primary-trade').value = kb.tradeCategory;
        }
        if (kb.crewAndLicenseBadge) {
          scannedCrewBadge = kb.crewAndLicenseBadge;
        }
        if (kb.proofByArchetype && typeof kb.proofByArchetype === 'object') {
          scannedProofByArchetype = kb.proofByArchetype;
        }
        const caps = kb.coreCapabilities || kb.coreServices;
        if (Array.isArray(caps) && caps.length && $('onb-core-services')) {
          $('onb-core-services').value = caps.join(', ');
        } else if (typeof caps === 'string' && caps && $('onb-core-services')) {
          $('onb-core-services').value = caps;
        }
        if (Array.isArray(kb.proofAngles) && kb.proofAngles.length >= 3) {
          scannedProofAngles = kb.proofAngles;
        }
        if ((kb.certsAndBonding || kb.certificationsAndBonding) && $('onb-certs-bonding')) {
          $('onb-certs-bonding').value = kb.certsAndBonding || kb.certificationsAndBonding;
        }
        if (kb.yearsInBusiness && $('onb-years-in-biz')) {
          $('onb-years-in-biz').value = kb.yearsInBusiness;
        }
        if ((kb.recentCompletedProof || kb.proofProjects) && $('onb-proof-project')) {
          $('onb-proof-project').value = kb.recentCompletedProof || kb.proofProjects;
        }
        if ((kb.signatureGuarantee || kb.uniqueGuarantee || kb.warrantyAndGuarantee) && $('onb-guarantee')) {
          scannedSignatureGuarantee = kb.signatureGuarantee || kb.uniqueGuarantee || kb.warrantyAndGuarantee;
          $('onb-guarantee').value = scannedSignatureGuarantee;
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
    const preset = TRADE_DOSSIER_DEFAULTS[primaryTrade] || TRADE_DOSSIER_DEFAULTS['Commercial Concrete'];
    const proofAngles = scannedProofAngles || preset.proofAngles;
    const proofByArchetype = scannedProofByArchetype || preset.proofByArchetype;
    const crewAndLicenseBadge = scannedCrewBadge || preset.crewAndLicenseBadge;
    const guaranteeValue = ($('onb-guarantee')?.value || '').trim() || scannedSignatureGuarantee || preset.signatureGuarantee;

    const knowledgeBase = {
      websiteUrl,
      tradeCategory: primaryTrade,
      crewAndLicenseBadge,
      coreServices,
      coreCapabilities: coreServices,
      proofByArchetype,
      proofAngles,
      certsAndBonding: ($('onb-certs-bonding')?.value || '').trim(),
      yearsInBusiness: ($('onb-years-in-biz')?.value || '').trim(),
      recentCompletedProof: ($('onb-proof-project')?.value || '').trim(),
      signatureGuarantee: guaranteeValue,
      uniqueGuarantee: guaranteeValue,
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
      const rawTier = params.get('tier').toLowerCase();
      if (rawTier === 'tier1' || rawTier.includes('tier 1')) {
        $('onb-tier-level').value = 'Tier 1: B2B Deal Scout';
      } else if (rawTier === 'tier2' || rawTier.includes('tier 2')) {
        $('onb-tier-level').value = 'Tier 2: Commercial Permits';
      } else if (rawTier === 'tier3' || rawTier.includes('tier 3')) {
        $('onb-tier-level').value = 'Tier 3: Full Territory Exclusivity';
      } else {
        $('onb-tier-level').value = params.get('tier');
      }
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
