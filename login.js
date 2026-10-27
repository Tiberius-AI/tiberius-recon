/**
 * TIBERIUS RECON™ — MULTI-CLIENT AUTH & MASTER AGENCY COMMAND CONTROLLER (login.js)
 */

(function () {
  'use strict';

  const loginForm = document.getElementById('login-form');
  const identifierInput = document.getElementById('login-identifier');
  const passwordInput = document.getElementById('login-password');
  const errorBanner = document.getElementById('auth-error-banner');
  const successBanner = document.getElementById('auth-success-banner');

  const navAuthBadge = document.getElementById('nav-auth-status-badge');
  const navLogoutBtn = document.getElementById('nav-logout-btn');

  const activeSessionCard = document.getElementById('active-session-card');
  const sessionRolePill = document.getElementById('session-role-pill');
  const sessionCompanyName = document.getElementById('session-company-name');
  const sessionMetaLine = document.getElementById('session-meta-line');
  const sessionOpenBriefingBtn = document.getElementById('session-open-briefing-btn');
  const sessionOpenCommandBtn = document.getElementById('session-open-command-btn');

  const masterAdminPanel = document.getElementById('master-admin-panel');
  const adminKpiClients = document.getElementById('admin-kpi-clients');
  const adminKpiLocks = document.getElementById('admin-kpi-locks');
  const adminKpiMrr = document.getElementById('admin-kpi-mrr');
  const adminKpiApproved = document.getElementById('admin-kpi-approved');
  const adminClientsGrid = document.getElementById('admin-clients-grid');
  const adminActionStatus = document.getElementById('admin-action-status');
  const adminCreateClientForm = document.getElementById('admin-create-client-form');

  function getSessionHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const jwt = localStorage.getItem('tiberius_recon_session_jwt');
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    return headers;
  }

  function showMessage(type, text) {
    if (errorBanner) errorBanner.classList.add('hidden');
    if (successBanner) successBanner.classList.add('hidden');

    if (type === 'error' && errorBanner) {
      errorBanner.textContent = text;
      errorBanner.classList.remove('hidden');
    } else if (type === 'success' && successBanner) {
      successBanner.textContent = text;
      successBanner.classList.remove('hidden');
    }
  }

  function renderAuthenticatedSession(role, account) {
    if (!account) {
      if (navAuthBadge) navAuthBadge.textContent = 'Not Signed In';
      if (navLogoutBtn) navLogoutBtn.classList.add('hidden');
      if (activeSessionCard) activeSessionCard.classList.add('hidden');
      if (masterAdminPanel) masterAdminPanel.classList.add('hidden');
      return;
    }

    const magicToken = account.magicToken || 'demo-7am-briefing';
    localStorage.setItem('tiberius_recon_token', magicToken);
    localStorage.setItem('tiberius_recon_account', JSON.stringify(account));

    if (navAuthBadge) {
      navAuthBadge.textContent =
        role === 'ADMIN'
          ? `★ MASTER ADMIN (${account.workEmail})`
          : `✓ ${account.companyName} (${account.baseZip || ''})`;
      navAuthBadge.className =
        role === 'ADMIN'
          ? 'px-3 py-1.5 rounded-lg bg-slate-900 text-amber-300 text-xs font-mono-telemetry font-bold'
          : 'px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-telemetry font-bold';
    }
    if (navLogoutBtn) {
      navLogoutBtn.classList.remove('hidden');
    }

    if (activeSessionCard) {
      activeSessionCard.classList.remove('hidden');
    }
    if (sessionRolePill) {
      sessionRolePill.textContent = role === 'ADMIN' ? 'MASTER ADMIN' : 'CONTRACTOR CLIENT';
    }
    if (sessionCompanyName) {
      sessionCompanyName.textContent = account.companyName || 'Authenticated Account';
    }
    if (sessionMetaLine) {
      sessionMetaLine.textContent =
        role === 'ADMIN'
          ? `${account.workEmail} • Full Multi-Client Agency Access`
          : `${account.ownerName || 'Owner'} • ${account.primaryTrade || ''} • Zip ${account.baseZip || ''} • ${account.tierLevel || ''}`;
    }
    if (sessionOpenBriefingBtn) {
      sessionOpenBriefingBtn.href = `briefing.html?token=${encodeURIComponent(magicToken)}`;
    }
    if (sessionOpenCommandBtn) {
      sessionOpenCommandBtn.href = `command.html?token=${encodeURIComponent(magicToken)}`;
    }

    if (role === 'ADMIN') {
      if (masterAdminPanel) masterAdminPanel.classList.remove('hidden');
      loadAdminOverview();
    } else if (masterAdminPanel) {
      masterAdminPanel.classList.add('hidden');
    }
  }

  function renderAdminOverview(data) {
    if (!data || !data.ok) return;
    const metrics = data.metrics || {};
    if (adminKpiClients) adminKpiClients.textContent = String(metrics.totalClients || 0);
    if (adminKpiLocks) adminKpiLocks.textContent = String(metrics.activeTerritoriesLocked || 0);
    if (adminKpiMrr) {
      adminKpiMrr.textContent = `$${Number(metrics.estimatedAgencyMrr || 0).toLocaleString()}/mo`;
    }
    if (adminKpiApproved) {
      adminKpiApproved.textContent = String(metrics.totalDealsApprovedToday || 0);
    }

    if (!adminClientsGrid) return;
    adminClientsGrid.innerHTML = '';

    (data.clients || []).forEach((client) => {
      const equityDollars = Math.round(Number(client.smartSiteEquityCents || 0) / 100);
      const card = document.createElement('div');
      card.className =
        'p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-4';

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-telemetry font-bold uppercase ${
              client.tierLevel && client.tierLevel.includes('Tier 3')
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }">
              ZIP ${client.baseZip} • ${client.tierLevel}
            </span>
            <span class="text-xs font-mono-telemetry font-bold text-slate-700">
              $${client.monthlyRate}/mo
            </span>
          </div>
          <h4 class="font-display font-extrabold text-slate-900 text-base">${client.companyName}</h4>
          <p class="text-xs text-slate-600">
            <strong>Owner:</strong> ${client.ownerName} • <strong>Trade:</strong> ${client.primaryTrade}
          </p>
          <p class="text-[11px] font-mono-telemetry text-slate-500">
            Login: ${client.workEmail} • Phone: ${client.mobilePhone} • PIN: ${client.accessPin || client.baseZip}
          </p>
          <div class="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono-telemetry">
            <span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Queue: ${client.unlockedCount} Unlocked / ${client.totalCards} Total
            </span>
            <span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-emerald-700 font-semibold">
              Sent Today: ${client.approvedCount}
            </span>
            <span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700">
              Smart Site Equity: $${equityDollars.toLocaleString()}
            </span>
          </div>
        </div>
        <div class="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
          <a
            href="briefing.html?token=${encodeURIComponent(client.magicToken)}"
            data-switch-token="${client.magicToken}"
            class="client-impersonate-link px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs transition-colors"
          >
            Open 7:00 AM Briefing →
          </a>
          <a
            href="command.html?token=${encodeURIComponent(client.magicToken)}"
            data-switch-token="${client.magicToken}"
            class="client-impersonate-link px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs transition-colors"
          >
            Territory Command →
          </a>
          <button
            type="button"
            data-sweep-token="${client.magicToken}"
            data-sweep-trade="${client.primaryTrade}"
            data-sweep-company="${client.companyName}"
            class="admin-sweep-client-btn px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-mono-telemetry font-bold text-[11px] transition-colors"
          >
            ⚡ Run Live Zero-API Sweep
          </button>
        </div>
      `;

      adminClientsGrid.appendChild(card);
    });

    adminClientsGrid.querySelectorAll('.client-impersonate-link').forEach((link) => {
      link.addEventListener('click', () => {
        const tok = link.getAttribute('data-switch-token');
        if (tok) localStorage.setItem('tiberius_recon_token', tok);
      });
    });

    adminClientsGrid.querySelectorAll('.admin-sweep-client-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const magicToken = btn.getAttribute('data-sweep-token');
        const primaryTrade = btn.getAttribute('data-sweep-trade');
        const companyName = btn.getAttribute('data-sweep-company');
        const origLabel = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sweeping Live City Portal...';
        if (adminActionStatus) {
          adminActionStatus.textContent = `Running live Zero-API municipal sweep for ${companyName}...`;
        }
        try {
          const resp = await fetch('/api/recon/admin', {
            method: 'POST',
            headers: getSessionHeaders(),
            body: JSON.stringify({
              action: 'run_client_live_recon',
              magicToken,
              primaryTrade
            })
          });
          const resData = await resp.json();
          if (resData && resData.ok) {
            if (adminActionStatus) {
              adminActionStatus.textContent = `✓ Live Zero-API permits injected into ${companyName}'s 7:00 AM queue (${resData.liveResult.elapsedSeconds}s)`;
            }
            renderAdminOverview(resData.overview);
          }
        } catch (_err) {
          if (adminActionStatus) {
            adminActionStatus.textContent = 'Error running live sweep.';
          }
        } finally {
          btn.disabled = false;
          btn.textContent = origLabel;
        }
      });
    });
  }

  async function loadAdminOverview() {
    try {
      const resp = await fetch('/api/recon/admin', {
        method: 'GET',
        headers: getSessionHeaders()
      });
      if (!resp.ok) return;
      const data = await resp.json();
      renderAdminOverview(data);
    } catch (_err) {
      // Ignore offline error
    }
  }

  async function performLogin(identifier, password) {
    showMessage(null, '');
    try {
      const resp = await fetch('/api/recon/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier,
          password
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        showMessage('error', (data && data.error) || 'Invalid credentials.');
        return;
      }

      if (data.sessionToken) {
        localStorage.setItem('tiberius_recon_session_jwt', data.sessionToken);
      }

      showMessage(
        'success',
        data.role === 'ADMIN'
          ? '✓ Signed in as Tiberius Master Agency Admin. Roster unlocked below.'
          : `✓ Signed in as ${data.account.companyName} (Zip ${data.account.baseZip}).`
      );
      renderAuthenticatedSession(data.role, data.account);
    } catch (err) {
      showMessage('error', `Sign-in failed: ${err.message}`);
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idVal = identifierInput ? identifierInput.value.trim() : '';
      const passVal = passwordInput ? passwordInput.value.trim() : '';
      performLogin(idVal, passVal);
    });
  }

  document.querySelectorAll('.quick-login-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-quick-id');
      const qPass = btn.getAttribute('data-quick-pass');
      if (identifierInput) identifierInput.value = qId;
      if (passwordInput) passwordInput.value = qPass;
      performLogin(qId, qPass);
    });
  });

  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
      localStorage.removeItem('tiberius_recon_session_jwt');
      localStorage.removeItem('tiberius_recon_account');
      try {
        await fetch('/api/recon/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' })
        });
      } catch (_err) {
        // Ignore
      }
      renderAuthenticatedSession(null, null);
      showMessage('success', 'Signed out of session.');
    });
  }

  if (adminCreateClientForm) {
    adminCreateClientForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        action: 'create_client',
        companyName: document.getElementById('new-client-company').value.trim(),
        ownerName: document.getElementById('new-client-owner').value.trim(),
        primaryTrade: document.getElementById('new-client-trade').value,
        territoryZip: document.getElementById('new-client-zip').value.trim(),
        bestEmail: document.getElementById('new-client-email').value.trim(),
        mobilePhone: document.getElementById('new-client-phone').value.trim(),
        tierLevel: document.getElementById('new-client-tier').value,
        accountPassword: document.getElementById('new-client-password').value.trim(),
        includeSmartSiteBundle: true
      };

      try {
        const resp = await fetch('/api/recon/admin', {
          method: 'POST',
          headers: getSessionHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data && data.ok) {
          if (adminActionStatus) {
            adminActionStatus.textContent = `✓ Created client account ${data.createdClient.companyName} (Zip ${data.createdClient.baseZip})`;
          }
          renderAdminOverview(data.overview);
          adminCreateClientForm.reset();
        }
      } catch (_err) {
        if (adminActionStatus) {
          adminActionStatus.textContent = 'Error creating client account.';
        }
      }
    });
  }

  // Check active session on page load
  (async function checkInitialAuth() {
    try {
      const resp = await fetch('/api/recon/auth', {
        method: 'GET',
        headers: getSessionHeaders()
      });
      const data = await resp.json();
      if (data && data.ok && data.authenticated && data.account) {
        renderAuthenticatedSession(data.role, data.account);
      }
    } catch (_err) {
      // Ignore offline error
    }
  })();
})();
