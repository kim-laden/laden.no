(function () {
  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';
  const POLL_MS = 5000;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function toast(msg) {
    const el = $('#lla-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 3200);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  async function api(path, opts) {
    const o = opts || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, o.headers || {});
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(API + path, Object.assign({}, o, { headers }));
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error(data.error || ('http_' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }
  function isAdminUser(u) {
    if (!u) return false;
    if (Number(u.is_admin) === 1) return true;
    if (String(u.role || '').toLowerCase() === 'admin') return true;
    const n = String(u.username || '').toLowerCase();
    return n === 'laden' || n === 'admin';
  }
  function fmtNum(n) {
    try { return Number(n).toLocaleString('en-US'); } catch { return String(n); }
  }
  function tickClock() {
    const el = $('#lla-clock');
    if (!el) return;
    const d = new Date();
    el.textContent = d.toLocaleTimeString('en-GB', { hour12: false }) + ' CEST';
  }

  let me = null;
  let pollTimer = null;

  function showGate(msg) {
    $('#lla-app').classList.add('hidden');
    $('#lla-gate').classList.remove('hidden');
    if (msg) $('#lla-gate-msg').textContent = msg;
  }
  function showApp() {
    $('#lla-gate').classList.add('hidden');
    $('#lla-app').classList.remove('hidden');
  }

  async function boot() {
    tickClock();
    setInterval(tickClock, 1000);
    if (!token()) {
      showGate('No session. Log in as an admin on the account page, then return to /lla/.');
      return;
    }
    try {
      const data = await api('/me');
      me = data.user || data;
      if (!isAdminUser(me)) {
        showGate('403 — your account is not ops/admin. Redirecting to account…');
        setTimeout(() => { location.href = '/account/'; }, 1800);
        return;
      }
      $('#lla-session').textContent = '@' + me.username + ' · admin';
      showApp();
      bindTabs();
      bindForms();
      await refreshAll();
      pollTimer = setInterval(() => {
        if (document.hidden) return;
        const tab = $('.lla-tab.active');
        if (!tab || tab.dataset.tab === 'overview') refreshOverview();
      }, POLL_MS);
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        showGate('Session expired. Log in again.');
      } else if (e.status === 403) {
        showGate('Forbidden — admin only.');
        setTimeout(() => { location.href = '/account/'; }, 1800);
      } else {
        showGate('Could not verify session: ' + (e.message || 'error'));
      }
    }
  }

  function bindTabs() {
    $$('.lla-tab').forEach(btn => {
      btn.onclick = () => {
        $$('.lla-tab').forEach(b => b.classList.toggle('active', b === btn));
        $$('.lla-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === btn.dataset.tab));
        loadTab(btn.dataset.tab);
      };
    });
  }

  async function loadTab(name) {
    try {
      if (name === 'overview') await refreshOverview();
      else if (name === 'users') await loadUsers();
      else if (name === 'economy') await loadEconomy();
      else if (name === 'challenges') await loadChallenges();
      else if (name === 'llz') await loadLlz();
      else if (name === 'messages') await loadMessagesMonitor();
      else if (name === 'control') await loadControl();
    } catch (e) {
      toast('err: ' + (e.message || e));
      if (e.status === 403) showGate('Admin required');
    }
  }

  async function refreshAll() {
    await refreshOverview();
  }

  async function refreshOverview() {
    const [ov, act, health] = await Promise.all([
      api('/admin/overview'),
      api('/admin/activity?limit=40'),
      api('/admin/health').catch(() => ({ version: '?' })),
    ]);
    const s = ov.stats || {};
    $('#lla-health').textContent = 'gw · ' + (health.version || ov.version || '?');
    const stats = [
      ['online', s.online],
      ['users', s.users],
      ['LLT supply', s.llt_supply],
      ['solves today', s.solves_today],
      ['solves Σ', s.solves_total],
      ['posts', s.posts],
      ['comments', s.comments],
      ['reactions', s.reactions],
      ['challenges', s.challenges],
      ['friend req', s.pending_friend_requests],
      ['admins', s.admins],
      ['disabled', s.disabled_users],
    ];
    $('#lla-stats').innerHTML = stats.map(([k, v]) =>
      `<div class="lla-stat"><b>${esc(fmtNum(v))}</b><span>${esc(k)}</span></div>`
    ).join('');
    const feed = $('#lla-feed');
    const items = act.activity || [];
    feed.innerHTML = items.length ? items.map(it =>
      `<div class="row"><span class="ts">${esc(it.created_at || '')}</span>` +
      `<span><span class="kind">[${esc(it.kind || it.source || '?')}]</span>${esc(it.message || '')}</span></div>`
    ).join('') : '<div class="muted">No activity yet.</div>';
    const ops = ov.ops || {};
    $('#lla-ops').textContent = JSON.stringify({
      version: ov.version,
      service: ov.service,
      online_window_sec: s.online_window_sec,
      restart_hint: ops.restart_hint,
      note: ops.note,
      you: me && me.username,
      lab_id: me && me.lab_id,
    }, null, 2);
    if (ops.restart_hint) {
      const rh = $('#ctrl-restart');
      if (rh) rh.textContent = ops.restart_hint;
    }
  }

  async function loadUsers(q) {
    const query = q != null ? q : ($('#users-q').value || '').trim();
    const url = '/admin/users?limit=200' + (query ? '&q=' + encodeURIComponent(query) : '');
    const data = await api(url);
    $('#users-count').textContent = (data.total || 0) + ' users';
    const tb = $('#users-table tbody');
    tb.innerHTML = (data.users || []).map(u => {
      const flags = [];
      if (u.is_admin) flags.push('<span class="lla-flag">ADMIN</span>');
      if (u.disabled) flags.push('<span class="lla-flag bad">DISABLED</span>');
      if (!u.email_verified) flags.push('<span class="lla-flag warn">UNVERIFIED</span>');
      return `<tr data-uid="${u.id}">
        <td class="mono">${esc(u.lab_id || '')}</td>
        <td><b>@${esc(u.username)}</b><div class="muted">${esc(u.display_name || '')}</div></td>
        <td>${esc(u.email || '—')}</td>
        <td>${esc(fmtNum(u.llt))}</td>
        <td>${esc(u.xp ?? 0)}</td>
        <td>${esc(u.title_label || u.title || '—')}</td>
        <td>${esc(u.last_seen || '—')}</td>
        <td>${flags.join('') || '—'}</td>
        <td class="lla-actions">
          <button type="button" data-act="msg" data-id="${u.id}" data-user="${esc(u.username)}">Msg</button>
          <button type="button" data-act="warn" data-id="${u.id}" data-user="${esc(u.username)}">Warn</button>
          <button type="button" data-act="grant" data-id="${u.id}" data-user="${esc(u.username)}">Grant</button>
          <button type="button" data-act="llt" data-id="${u.id}">±LLT</button>
          <button type="button" data-act="pw" data-id="${u.id}">PW</button>
          <button type="button" data-act="admin" data-id="${u.id}" data-v="${u.is_admin ? 0 : 1}">${u.is_admin ? 'Deadmin' : 'Admin'}</button>
          <button type="button" class="${u.disabled ? '' : 'danger'}" data-act="ban" data-id="${u.id}" data-v="${u.disabled ? 0 : 1}">${u.disabled ? 'Enable' : 'Disable'}</button>
        </td>
      </tr>`;
    }).join('');
    tb.onclick = async (ev) => {
      const btn = ev.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      try {
        if (act === 'msg' || act === 'warn' || act === 'grant') {
          const uname = btn.dataset.user || id;
          let kind = act === 'warn' ? 'warning' : act === 'grant' ? 'grant' : 'admin';
          let body = '';
          let llt_delta = undefined;
          let reason = '';
          if (kind === 'grant') {
            const d = prompt('LLT delta for @' + uname + ' (e.g. 50 or -20):');
            if (d == null || d === '') return;
            llt_delta = Number(d);
            reason = prompt('Reason:', 'lla_grant') || 'lla_grant';
            body = prompt('Message (optional, auto if empty):', '') || '';
          } else {
            body = prompt((kind === 'warning' ? 'Warning' : 'Message') + ' to @' + uname + ':', '');
            if (body == null || !String(body).trim()) return;
          }
          const payload = { to: uname, kind, body };
          if (llt_delta != null) payload.llt_delta = llt_delta;
          if (reason) payload.reason = reason;
          await api('/admin/messages/send', { method: 'POST', body: JSON.stringify(payload) });
          toast(kind + ' sent to @' + uname);
        } else if (act === 'llt') {
          const delta = prompt('LLT delta for user ' + id + ' (e.g. 50 or -20):');
          if (delta == null || delta === '') return;
          const reason = prompt('Reason:', 'lla_manual') || 'lla_manual';
          await api('/admin/users/' + id + '/llt', {
            method: 'POST', body: JSON.stringify({ delta: Number(delta), reason })
          });
          toast('LLT adjusted for #' + id);
          await loadUsers(query);
        } else if (act === 'pw') {
          const pw = prompt('Temporary password (min 8):');
          if (!pw) return;
          await api('/admin/users/' + id + '/password', {
            method: 'POST', body: JSON.stringify({ password: pw })
          });
          toast('Password reset for #' + id);
        } else if (act === 'admin') {
          await api('/admin/users/' + id, {
            method: 'POST', body: JSON.stringify({ is_admin: Number(btn.dataset.v) })
          });
          toast('Admin flag updated');
          await loadUsers(query);
        } else if (act === 'ban') {
          await api('/admin/users/' + id, {
            method: 'POST', body: JSON.stringify({ disabled: Number(btn.dataset.v) })
          });
          toast('Disable flag updated');
          await loadUsers(query);
        }
      } catch (e) {
        toast('fail: ' + (e.message || e));
      }
    };
  }

  async function loadEconomy() {
    const act = await api('/admin/activity?limit=80');
    const items = (act.activity || []).filter(i => i.kind === 'llt' || i.source === 'ledger');
    $('#llt-feed').innerHTML = items.length ? items.map(it =>
      `<div class="row"><span class="ts">${esc(it.created_at || '')}</span><span>${esc(it.message || '')}</span></div>`
    ).join('') : '<div class="muted">No ledger rows in feed.</div>';
  }

  async function loadChallenges() {
    const data = await api('/admin/challenges');
    const tb = $('#chal-table tbody');
    tb.innerHTML = (data.challenges || []).map(c =>
      `<tr>
        <td>${c.id}</td><td>${esc(c.slug)}</td><td>${esc(c.title)}</td>
        <td>${esc(c.track)}</td><td>${esc(c.difficulty)}</td>
        <td>${c.points}</td><td>${c.solve_count}</td>
        <td class="lla-actions"><button type="button" data-bump="${c.id}">+10 pts</button></td>
      </tr>`
    ).join('');
    tb.onclick = async (ev) => {
      const btn = ev.target.closest('button[data-bump]');
      if (!btn) return;
      try {
        await api('/admin/challenges/' + btn.dataset.bump + '/bump', {
          method: 'POST', body: JSON.stringify({ delta: 10 })
        });
        toast('Challenge bumped');
        await loadChallenges();
      } catch (e) { toast('fail: ' + e.message); }
    };
  }

  async function loadLlz() {
    const data = await api('/admin/llz/posts?limit=60');
    const box = $('#llz-posts');
    box.innerHTML = (data.posts || []).map(p =>
      `<article class="lla-post${p.hidden ? ' hidden-post' : ''}" data-pid="${p.id}">
        <div class="meta">#${p.id} · @${esc(p.author)} · #${esc(p.topic)} · ${esc(p.created_at)}
          · 💬${p.comments || 0} · ⚡${p.reactions || 0}
          ${p.hidden ? ' · HIDDEN' : ''}</div>
        <div class="body">${esc(p.body)}</div>
        <div class="lla-actions" style="margin-top:.45rem">
          <button type="button" data-act="hide" data-id="${p.id}" data-v="${p.hidden ? 0 : 1}">${p.hidden ? 'Unhide' : 'Hide'}</button>
          <button type="button" class="danger" data-act="del" data-id="${p.id}">Delete</button>
        </div>
      </article>`
    ).join('') || '<div class="muted">No posts.</div>';
    box.onclick = async (ev) => {
      const btn = ev.target.closest('button[data-act]');
      if (!btn) return;
      try {
        if (btn.dataset.act === 'hide') {
          await api('/admin/llz/posts/' + btn.dataset.id + '/hide', {
            method: 'POST', body: JSON.stringify({ hidden: Number(btn.dataset.v) })
          });
          toast('Post visibility updated');
        } else {
          if (!confirm('Delete post #' + btn.dataset.id + '?')) return;
          await api('/admin/llz/posts/' + btn.dataset.id + '/delete', {
            method: 'POST', body: '{}'
          });
          toast('Post deleted');
        }
        await loadLlz();
      } catch (e) { toast('fail: ' + e.message); }
    };
  }


  async function loadMessagesMonitor() {
    const q = ($('#dm-mon-q') && $('#dm-mon-q').value || '').trim();
    const user = ($('#dm-mon-user') && $('#dm-mon-user').value || '').trim();
    const kind = ($('#dm-mon-kind') && $('#dm-mon-kind').value || '').trim();
    const params = new URLSearchParams({ limit: '60' });
    if (q) params.set('q', q);
    if (user) params.set('user', user);
    if (kind) params.set('kind', kind);
    const [feed, threads] = await Promise.all([
      api('/admin/messages?' + params.toString()),
      api('/admin/messages/threads?' + new URLSearchParams({
        limit: '40',
        ...(user ? { user } : {}),
        ...(q ? { q } : {}),
      }).toString()),
    ]);
    const box = $('#dm-mon-feed');
    const items = feed.messages || [];
    box.innerHTML = items.length ? items.map(m =>
      `<div class="row" style="cursor:pointer" data-open-thread="${m.thread_id}">` +
      `<span class="ts">${esc(m.created_at || '')}</span>` +
      `<span><span class="kind">[${esc(m.kind)}]</span> @${esc(m.sender || '?')} → @${esc(m.recipient || '?')} · ` +
      `${esc((m.body_preview || m.body || '').slice(0, 120))}</span></div>`
    ).join('') : '<div class="muted">No messages match.</div>';
    box.onclick = (ev) => {
      const row = ev.target.closest('[data-open-thread]');
      if (!row) return;
      openMonThread(row.getAttribute('data-open-thread'));
    };
    const tb = $('#dm-mon-threads');
    const th = threads.threads || [];
    tb.innerHTML = th.length ? th.map(t => {
      const parts = (t.participants || []).map(p => '@' + (p.username || p.id)).join(' ↔ ');
      const last = t.last ? ((t.last.kind !== 'user' ? '[' + t.last.kind + '] ' : '') + (t.last.body || '').slice(0, 80)) : '';
      return `<div class="row" style="cursor:pointer" data-open-thread="${t.id}">` +
        `<span class="ts">#${t.id}</span>` +
        `<span>${esc(parts)} · <span class="muted">${t.message_count || 0} msgs</span><br><span class="muted">${esc(last)}</span></span></div>`;
    }).join('') : '<div class="muted">No threads.</div>';
    tb.onclick = (ev) => {
      const row = ev.target.closest('[data-open-thread]');
      if (!row) return;
      openMonThread(row.getAttribute('data-open-thread'));
    };
  }

  async function openMonThread(tid) {
    if (!tid) return;
    try {
      const data = await api('/admin/messages/thread/' + tid);
      const card = $('#dm-mon-transcript');
      card.classList.remove('hidden');
      $('#dm-mon-tid').textContent = '#' + tid;
      const parts = (data.participants || []).map(p => '@' + (p.username || p.id)).join(' ↔ ');
      $('#dm-mon-parts').textContent = parts + ' · ' + (data.note || 'ops view');
      const msgs = data.messages || [];
      $('#dm-mon-msgs').innerHTML = msgs.length ? msgs.map(m =>
        `<div class="row"><span class="ts">${esc(m.created_at || '')}</span>` +
        `<span><span class="kind">[${esc(m.kind || 'user')}]</span> sid:${m.sender_id}→${m.recipient_id}` +
        `${m.read_at ? '' : ' · UNREAD'}<br>${esc(m.body || '')}</span></div>`
      ).join('') : '<div class="muted">Empty thread.</div>';
      toast('Opened thread #' + tid + ' (audited)');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      toast('fail: ' + (e.message || e));
    }
  }


  async function loadControl() {
    const [ov, audit] = await Promise.all([
      api('/admin/overview'),
      api('/admin/audit?limit=40').catch(() => ({ audit: [] })),
    ]);
    if (ov.ops && ov.ops.restart_hint) {
      $('#ctrl-restart').textContent = ov.ops.restart_hint;
    }
    const items = audit.audit || [];
    $('#audit-feed').innerHTML = items.length ? items.map(a =>
      `<div class="row"><span class="ts">${esc(a.created_at)}</span>` +
      `<span>@${esc(a.actor || a.actor_id)} · <span class="kind">${esc(a.action)}</span> ${esc(a.target)} ${esc(a.detail || '')}</span></div>`
    ).join('') : '<div class="muted">No audit rows yet.</div>';
  }

  function bindForms() {
    $('#users-refresh').onclick = () => loadUsers();
    let t;
    $('#users-q').oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => loadUsers(), 280);
    };

    const monRef = $('#dm-mon-refresh');
    if (monRef) monRef.onclick = () => loadMessagesMonitor().catch(e => toast('err: ' + e.message));
    const monClose = $('#dm-mon-close');
    if (monClose) monClose.onclick = () => { const c = $('#dm-mon-transcript'); if (c) c.classList.add('hidden'); };
    let monT;
    ['dm-mon-q', 'dm-mon-user'].forEach(id => {
      const el = $('#' + id);
      if (!el) return;
      el.oninput = () => { clearTimeout(monT); monT = setTimeout(() => loadMessagesMonitor().catch(() => {}), 280); };
    });
    const monKind = $('#dm-mon-kind');
    if (monKind) monKind.onchange = () => loadMessagesMonitor().catch(() => {});

    $('#chal-refresh').onclick = () => loadChallenges();

    const dmForm = $('#dm-form');
    if (dmForm) {
      dmForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const kind = fd.get('kind') || 'admin';
        const payload = {
          to: (fd.get('to') || '').trim(),
          kind,
          body: (fd.get('body') || '').trim(),
          reason: (fd.get('reason') || '').trim(),
        };
        if (kind === 'grant') {
          const d = fd.get('llt_delta');
          if (d === '' || d == null) {
            $('#dm-msg').classList.add('err');
            $('#dm-msg').textContent = 'llt_delta required for grant';
            return;
          }
          payload.llt_delta = Number(d);
        }
        const msg = $('#dm-msg');
        try {
          const r = await api('/admin/messages/send', { method: 'POST', body: JSON.stringify(payload) });
          msg.classList.remove('err');
          let line = 'ok · ' + r.kind + ' → @' + ((r.peer && r.peer.username) || payload.to);
          if (r.llt) line += ' · LLT ' + r.llt.previous + ' → ' + r.llt.balance;
          msg.textContent = line;
          toast('DM sent');
          if (kind !== 'grant') e.target.reset();
        } catch (err) {
          msg.classList.add('err');
          msg.textContent = err.message || 'error';
        }
      };
    }

    $('#llz-refresh').onclick = () => loadLlz();
    $('#lla-retry').onclick = () => boot();
    $('#lla-logout').onclick = () => {
      localStorage.removeItem(TOKEN_KEY);
      location.href = '/account/';
    };

    $('#llt-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const uid = fd.get('user_id');
      const body = { reason: fd.get('reason') || 'lla_adjust' };
      const bal = fd.get('balance');
      const delta = fd.get('delta');
      if (bal !== '' && bal != null) body.balance = Number(bal);
      else body.delta = Number(delta);
      const msg = $('#llt-msg');
      try {
        const r = await api('/admin/users/' + uid + '/llt', { method: 'POST', body: JSON.stringify(body) });
        msg.classList.remove('err');
        msg.textContent = `ok · @${r.username} ${r.previous} → ${r.balance} (Δ ${r.delta})`;
        toast('LLT updated');
        await loadEconomy();
      } catch (err) {
        msg.classList.add('err');
        msg.textContent = err.message || 'error';
      }
    };

    $('#bcast-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const msg = $('#bcast-msg');
      try {
        const r = await api('/admin/broadcast', {
          method: 'POST',
          body: JSON.stringify({ body: fd.get('body'), topic: fd.get('topic') })
        });
        msg.classList.remove('err');
        msg.textContent = 'broadcast post #' + r.post_id;
        e.target.reset();
        toast('Broadcast sent');
      } catch (err) {
        msg.classList.add('err');
        msg.textContent = err.message || 'error';
      }
    };

    async function ctrlUser(patch, label) {
      const uid = ($('#ctrl-form [name=user_id]').value || '').trim();
      const msg = $('#ctrl-msg');
      if (!uid) { msg.classList.add('err'); msg.textContent = 'user id required'; return; }
      try {
        await api('/admin/users/' + uid, { method: 'POST', body: JSON.stringify(patch) });
        msg.classList.remove('err');
        msg.textContent = label + ' ok';
        toast(label);
      } catch (err) {
        msg.classList.add('err');
        msg.textContent = err.message || 'error';
      }
    }
    $('#ctrl-admin-on').onclick = () => ctrlUser({ is_admin: 1 }, 'admin granted');
    $('#ctrl-admin-off').onclick = () => ctrlUser({ is_admin: 0 }, 'admin revoked');
    $('#ctrl-ban').onclick = () => ctrlUser({ disabled: 1 }, 'disabled');
    $('#ctrl-unban').onclick = () => ctrlUser({ disabled: 0 }, 'enabled');
    $('#ctrl-pw').onclick = async () => {
      const uid = ($('#ctrl-form [name=user_id]').value || '').trim();
      const pw = ($('#ctrl-form [name=password]').value || '').trim();
      const msg = $('#ctrl-msg');
      try {
        await api('/admin/users/' + uid + '/password', {
          method: 'POST', body: JSON.stringify({ password: pw })
        });
        msg.classList.remove('err');
        msg.textContent = 'password reset ok';
        toast('password reset');
      } catch (err) {
        msg.classList.add('err');
        msg.textContent = err.message || 'error';
      }
    };
  }

  boot();
})();
