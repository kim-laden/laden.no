(function () {
  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';
  const POLL_MS = 30000;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
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

  let me = null;
  let currentPeer = null;
  let currentThreadId = null;
  let pollTimer = null;

  function showGate() {
    $('#msg-app').classList.add('hidden');
    $('#msg-gate').classList.remove('hidden');
  }
  function showApp() {
    $('#msg-gate').classList.add('hidden');
    $('#msg-app').classList.remove('hidden');
  }

  function params() {
    const u = new URL(location.href);
    return { u: u.searchParams.get('u') || '', t: u.searchParams.get('t') || '' };
  }

  function setUrl(peerUser, threadId) {
    const u = new URL(location.href);
    if (peerUser) u.searchParams.set('u', peerUser);
    else u.searchParams.delete('u');
    if (threadId) u.searchParams.set('t', String(threadId));
    else u.searchParams.delete('t');
    history.replaceState(null, '', u.pathname + u.search);
  }

  async function loadInbox() {
    const data = await api('/messages/inbox');
    const box = $('#msg-thread-list');
    const threads = data.threads || [];
    if (!threads.length) {
      box.innerHTML = '<div class="muted" style="padding:.85rem;font-size:.82rem">No threads yet. Start a message.</div>';
      return threads;
    }
    box.innerHTML = threads.map(t => {
      const peer = t.peer || {};
      const last = t.last || {};
      const active = (currentThreadId && t.id === currentThreadId) ||
        (currentPeer && peer.username && peer.username.toLowerCase() === String(currentPeer).toLowerCase());
      const preview = last.body ? String(last.body).slice(0, 80) : '(empty)';
      const badge = t.unread ? `<span class="badge">${t.unread > 99 ? '99+' : t.unread}</span>` : '';
      const kind = last.kind && last.kind !== 'user' ? `[${last.kind}] ` : '';
      return `<button type="button" class="msg-item${active ? ' active' : ''}" data-tid="${t.id}" data-user="${esc(peer.username || '')}">
        <div class="peer"><span>@${esc(peer.username || '?')}</span>${badge}</div>
        <div class="preview">${esc(kind + preview)}</div>
      </button>`;
    }).join('');
    box.onclick = (ev) => {
      const btn = ev.target.closest('.msg-item');
      if (!btn) return;
      openThread({ tid: btn.dataset.tid, user: btn.dataset.user });
    };
    return threads;
  }

  function bubbleHtml(m) {
    const mine = me && m.sender_id === me.id;
    const kind = m.kind || 'user';
    const kindCls = kind !== 'user' ? ' kind-' + kind : '';
    const tag = kind !== 'user' ? `<span class="kind-tag">${esc(kind)}</span>` : '';
    return `<div class="msg-bubble ${mine ? 'mine' : 'theirs'}${kindCls}">
      <div class="meta">${tag}<span>${esc(m.created_at || '')}</span></div>
      <div>${esc(m.body)}</div>
    </div>`;
  }

  async function openThread(opts) {
    opts = opts || {};
    const q = opts.user ? ('?with=' + encodeURIComponent(opts.user))
      : opts.tid ? ('/' + opts.tid)
      : '';
    if (!q) return;
    try {
      const data = await api('/messages/thread' + (opts.tid && !opts.user ? '/' + opts.tid : ('?with=' + encodeURIComponent(opts.user || ''))));
      const peer = data.peer || {};
      currentPeer = peer.username || opts.user;
      currentThreadId = (data.thread && data.thread.id) || (opts.tid ? Number(opts.tid) : null);
      setUrl(currentPeer, currentThreadId);
      $('#msg-thread-empty').classList.add('hidden');
      $('#msg-thread-view').classList.remove('hidden');
      $('#msg-peer-name').textContent = '@' + (peer.username || '…');
      $('#msg-peer-sub').textContent = peer.display_name ? peer.display_name : '';
      const bubbles = $('#msg-bubbles');
      const msgs = data.messages || [];
      bubbles.innerHTML = msgs.length
        ? msgs.map(bubbleHtml).join('')
        : '<div class="muted mono" style="font-size:.8rem">No messages yet — say hi.</div>';
      bubbles.scrollTop = bubbles.scrollHeight;
      await loadInbox();
      if (window.LadenMessages && window.LadenMessages.refresh) {
        window.LadenMessages.refresh();
      }
    } catch (e) {
      if (typeof ladenToast === 'function') ladenToast('Thread: ' + (e.message || e));
      else alert(e.message || e);
    }
  }

  async function sendTo(to, body, statusEl) {
    const data = await api('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ to, body }),
    });
    if (statusEl) statusEl.textContent = 'sent';
    currentPeer = (data.peer && data.peer.username) || to;
    currentThreadId = data.thread_id;
    await openThread({ user: currentPeer, tid: data.thread_id });
    return data;
  }

  function bind() {
    $('#msg-refresh').onclick = () => loadInbox().catch(() => {});
    $('#msg-compose-toggle').onclick = () => {
      $('#msg-compose').classList.toggle('hidden');
      if (!$('#msg-compose').classList.contains('hidden')) {
        $('#msg-to').focus();
        preloadUsers();
      }
    };
    $('#msg-compose-cancel').onclick = () => {
      $('#msg-compose').classList.add('hidden');
      $('#msg-compose-status').textContent = '';
    };
    $('#msg-compose').onsubmit = async (e) => {
      e.preventDefault();
      const to = ($('#msg-to').value || '').trim();
      const body = ($('#msg-body').value || '').trim();
      const st = $('#msg-compose-status');
      try {
        await sendTo(to, body, st);
        e.target.reset();
        $('#msg-compose').classList.add('hidden');
        if (typeof ladenToast === 'function') ladenToast('Message sent');
      } catch (err) {
        st.textContent = err.message || 'error';
      }
    };
    $('#msg-to').addEventListener('input', () => {
      clearTimeout($('#msg-to')._t);
      $('#msg-to')._t = setTimeout(preloadUsers, 220);
    });
    $('#msg-reply').onsubmit = async (e) => {
      e.preventDefault();
      if (!currentPeer) return;
      const body = ($('#msg-reply-body').value || '').trim();
      if (!body) return;
      try {
        await sendTo(currentPeer, body);
        $('#msg-reply-body').value = '';
      } catch (err) {
        if (typeof ladenToast === 'function') ladenToast(err.message || 'send failed');
      }
    };
  }

  async function preloadUsers() {
    const q = ($('#msg-to').value || '').trim();
    try {
      const data = await api('/messages/users?q=' + encodeURIComponent(q));
      const dl = $('#msg-user-list');
      dl.innerHTML = (data.users || []).map(u =>
        `<option value="${esc(u.username)}">${esc(u.display_name || u.username)}</option>`
      ).join('');
    } catch {}
  }

  async function boot() {
    if (!token()) {
      showGate();
      return;
    }
    try {
      const data = await api('/me');
      me = data.user || data;
      showApp();
      bind();
      await loadInbox();
      const p = params();
      if (p.u) await openThread({ user: p.u });
      else if (p.t) await openThread({ tid: p.t });
      pollTimer = setInterval(() => {
        if (document.hidden) return;
        loadInbox().catch(() => {});
        if (currentPeer) openThread({ user: currentPeer, tid: currentThreadId }).catch(() => {});
      }, POLL_MS);
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
      }
      showGate();
    }
  }

  boot();
})();
