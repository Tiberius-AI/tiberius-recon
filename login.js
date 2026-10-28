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
    const sessionOpenInboxBtn = document.getElementById('session-open-inbox-btn');
    if (sessionOpenInboxBtn) {
      sessionOpenInboxBtn.href = `inbox.html?token=${encodeURIComponent(magicToken)}`;
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
        'p-5 rounded-2xl border border-slate-700 bg-slate-800/90 hover:border-slate-500 transition-colors flex flex-col justify-between gap-4 shadow-sm';

      card.innerHTML = `
        <div class="space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-telemetry font-bold uppercase ${
              client.tierLevel && client.tierLevel.includes('Tier 3')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }">
              ZIP ${client.baseZip} • ${client.tierLevel}
            </span>
            <span class="text-sm font-mono-telemetry font-bold text-amber-300">
              $${client.monthlyRate}/mo
            </span>
          </div>
          <h4 class="font-display font-extrabold text-white text-lg tracking-tight">${client.companyName}</h4>
          <p class="text-xs text-slate-200">
            <strong class="text-white">Owner:</strong> ${client.ownerName} • <strong class="text-white">Trade:</strong> ${client.primaryTrade}
          </p>
          <p class="text-xs font-mono-telemetry text-slate-300">
            Login: <span class="text-white">${client.workEmail}</span> • Phone: <span class="text-white">${client.mobilePhone}</span> • PIN: <span class="text-amber-300 font-bold">${client.accessPin || client.baseZip}</span>
          </p>
          <div class="pt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono-telemetry">
            <span class="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200">
              Queue: ${client.unlockedCount} Unlocked / ${client.totalCards} Total
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-emerald-400 font-semibold">
              Sent Today: ${client.approvedCount}
            </span>
            <span class="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-blue-300">
              Smart Site Equity: $${equityDollars.toLocaleString()}
            </span>
          </div>
        </div>
        <div class="pt-3.5 border-t border-slate-700/80 flex flex-wrap items-center gap-2">
          <a
            href="briefing.html?token=${encodeURIComponent(client.magicToken)}"
            data-switch-token="${client.magicToken}"
            class="client-impersonate-link px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs transition-colors"
          >
            ☕ 7:00 AM Briefing →
          </a>
          <a
            href="inbox.html?token=${encodeURIComponent(client.magicToken)}"
            data-switch-token="${client.magicToken}"
            class="client-impersonate-link px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs transition-colors"
          >
            💬 Conversation Room →
          </a>
          <a
            href="command.html?token=${encodeURIComponent(client.magicToken)}"
            data-switch-token="${client.magicToken}"
            class="client-impersonate-link px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-display font-bold text-xs transition-colors"
          >
            🧠 Knowledge Base &amp; Command →
          </a>
          <button
            type="button"
            data-sweep-token="${client.magicToken}"
            data-sweep-trade="${client.primaryTrade}"
            data-sweep-company="${client.companyName}"
            class="admin-sweep-client-btn px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-mono-telemetry font-bold text-[11px] transition-colors cursor-pointer"
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
      const word = canvas.getAttribute('data-pixel-word') || 'AGENCY COMMAND';
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
