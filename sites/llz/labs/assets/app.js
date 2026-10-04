/* Laden Labs — API client (juiced). Caleb = mentor popup via caleb.js */
(() => {
  function locChallenge(c) {
    if (window.LadenI18n && typeof LadenI18n.localizeLab === 'function') return LadenI18n.localizeLab(c);
    return c;
  }
  function tt(key, vars) {
    if (window.LadenI18n && typeof LadenI18n.t === 'function') return LadenI18n.t(key, vars);
    return key;
  }

  const API = '/labs/api';

  const state = {
    token: localStorage.getItem('laden_v12_token') || '',
    user: null,
    challenges: [],
    track: 'all',
    view: 'labs',
    cart: JSON.parse(localStorage.getItem('laden_v12_cart') || '[]'),
  };

const GUEST_OK = (window.LADEN_FEATURED && window.LADEN_FEATURED.slugs)
    ? window.LADEN_FEATURED.slugs()
    : ['scope-first','robots-redux','reflect-101'];

  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__tt);
    window.__tt = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function api(path, opts={}) {
    const headers = Object.assign({'Content-Type': 'application/json'}, opts.headers || {});
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    const res = await fetch(API + path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { data, status: res.status });
    return data;
  }

  function showGate(on) {
    $('#gate').classList.toggle('hidden', !on);
    $('#dash').classList.toggle('on', !on);
    $('#dash').classList.toggle('hidden', on);
  }

  async function refreshMe() {
    if (!state.token) {
      state.user = null;
      $('#welcome').textContent = 'Free starter (from homepage)';
      $('#stat-xp').textContent = '—';
      $('#stat-solved').textContent = '—';
      $('#stat-total').textContent = String(GUEST_OK.length);
      $('#stat-role').textContent = 'guest';
      return;
    }
    const { user } = await api('/me');
    state.user = user;
    $('#welcome').textContent = `Welcome, ${user.display_name}`;
    $('#stat-xp').textContent = user.xp;
    $('#stat-solved').textContent = user.solved;
    $('#stat-total').textContent = user.total_challenges;
    $('#stat-role').textContent = user.role;
  }

  function lltFor(points) {
    return Math.max(5, Math.round(Number(points || 0) / 10));
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderChallenges() {
    const q = ($('#chal-search').value || '').toLowerCase();
    const grid = $('#chal-grid');
    let list = state.challenges;
    if (state.track !== 'all') list = list.filter(c => c.track === state.track);
    if (q) list = list.filter(c => (c.title + c.summary + c.track).toLowerCase().includes(q));
    grid.innerHTML = list.map(c => {
      c = locChallenge(c);
      const diff = (c.difficulty || 'easy').toLowerCase();
      const diffClass = diff === 'medium' ? 'med' : diff;
      const llt = c.llt != null ? c.llt : lltFor(c.points);
      return `
      <article class="card station ${c.solved ? 'solved' : ''} diff-${escapeHtml(diffClass)}" data-slug="${escapeHtml(c.slug)}">
        ${c.solved ? '<span class="station-stamp">CLEARED</span>' : ''}
        <div class="station-top">
          <span class="station-track">${escapeHtml(c.track)}</span>
          <span class="tag ${escapeHtml(diffClass)}">${escapeHtml(String(c.difficulty || '').toUpperCase())}</span>
        </div>
        <h4>${escapeHtml(c.title)}</h4>
        <p>${escapeHtml(c.summary)}</p>
        <div class="station-rewards">
          <span class="tag xp">${escapeHtml(c.points)} XP</span>
          <span class="tag llt">${escapeHtml(llt)} LLT</span>
        </div>
        <div class="station-foot">
          <span>${c.solved ? 'Booth cleared' : 'Open station'}</span>
          <span class="enter">${c.solved ? 'revisit →' : 'enter →'}</span>
        </div>
      </article>`;
    }).join('') || '<p class="muted">No stations on this frequency.</p>';
    $$('.card', grid).forEach(card => card.addEventListener('click', () => {
      location.href = '/labs/' + encodeURIComponent(card.dataset.slug) + '/';
    }));
  }

  async function openChallenge(slug) {
    const { challenge: raw } = await api('/challenges/' + slug);
    const c = locChallenge(raw);
    const box = $('#chal-detail');
    box.classList.remove('hidden');
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div>
          <span class="tag ${c.difficulty}">${c.difficulty.toUpperCase()}</span>
          <span class="tag">${c.track}</span>
          <span class="tag">${c.points} XP</span>
          ${c.solved ? '<span class="tag easy">SOLVED</span>' : ''}
          <h3 style="font-family:Orbitron,sans-serif;margin:.45rem 0;font-size:1.2rem;color:var(--text)">${c.title}</h3>
        </div>
        <button class="btn btn-ghost" type="button" id="close-chal">${tt('chal.close')}</button>
      </div>
      <div class="learn"><strong>${tt('chal.learnLabel')}</strong> ${c.learn}</div>
      <div class="chal-body">${c.body_html}</div>
      <p class="muted mono" style="font-size:.78rem;margin-top:.6rem">${tt('chal.hintLabel', { hint: c.hint || '—' })}</p>
      <div class="flag-row">
        <input id="flag-in" placeholder="LLZ{…}" value="${(c.flag_suggest || 'LLZ{...}').replace(/"/g, '')}" autocomplete="off" spellcheck="false">
        <button class="btn btn-primary" type="button" id="flag-go">${tt('room.submit')}</button>
        <button class="btn btn-cyan" type="button" data-caleb id="chal-caleb">${tt('room.askCaleb')}</button>
      </div>
      <div class="msg" id="flag-msg"></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#close-chal').onclick = () => box.classList.add('hidden');
    const flagIn = $('#flag-in');
    if (flagIn) {
      flagIn.addEventListener('focus', function once() {
        const v = flagIn.value;
        const a = v.indexOf('{');
        const b = v.lastIndexOf('}');
        if (a >= 0 && b > a) flagIn.setSelectionRange(a + 1, b);
        else flagIn.select();
        flagIn.removeEventListener('focus', once);
      });
    }
    const ask = $('#chal-caleb');
    if (ask) ask.onclick = (e) => { e.preventDefault(); if (window.openCalebLabs) window.openCalebLabs(); };
    $('#flag-go').onclick = async () => {
      const flag = $('#flag-in').value;
      const msg = $('#flag-msg');
      if (!state.token) {
        msg.className = 'msg bad';
        msg.innerHTML = 'Login to submit flags & save XP — <a href="/account/" style="color:var(--cyan)">account</a> or use the gate.';
        return;
      }
      try {
        const r = await api('/challenges/' + slug + '/submit', { method: 'POST', body: JSON.stringify({ flag }) });
        if (!r.ok) { msg.className = 'msg bad'; msg.textContent = r.message || 'Nope'; return; }
        msg.className = 'msg ok';
        msg.textContent = r.message + (r.points ? ` (+${r.points} XP)` : '');
        toast(r.message);
        await loadChallenges();
        await refreshMe();
        await loadActivity();
        openChallenge(slug);
      } catch (e) {
        msg.className = 'msg bad';
        msg.textContent = (e.data && e.data.message) || e.message || 'Nope';
      }
    };
  }

  async function loadChallenges() {
    const { challenges } = await api('/challenges');
    state.challenges = state.token
      ? challenges
      : challenges.filter(c => GUEST_OK.includes(c.slug));
    const tracks = [...new Set(challenges.map(c => c.track))].sort();
    $('#track-list').innerHTML = tracks.map(t =>
      `<button type="button" class="knob" data-track="${t}">${t} <span class="muted">(${challenges.filter(c=>c.track===t).length})</span></button>`
    ).join('');
    $$('#track-list button, .side button[data-track]').forEach(b => {
      b.onclick = () => {
        state.track = b.dataset.track;
        $$('.side button[data-track], #track-list button').forEach(x => x.classList.toggle('active', x.dataset.track === state.track));
        renderChallenges();
      };
    });
    const ops = document.getElementById('ambient-ops');
    if (ops) ops.textContent = state.token
      ? `${challenges.length} stations · operators online`
      : `${GUEST_OK.length} free starters · lounge gated`;
    renderChallenges();
  }

  async function loadActivity() {
    const { activity } = await api('/activity');
    $('#activity-feed').innerHTML = activity.map(a =>
      `<div>${a.message}<small>${a.kind} · ${a.created_at}</small></div>`
    ).join('') || '<div class="muted">Quiet for now.</div>';
  }

  async function loadForum() {
    const { threads } = await api('/forum/threads');
    $('#forum-list').innerHTML = threads.map(t => `
      <div class="thread">
        <h4>${t.pinned ? '📌 ' : ''}${t.title}</h4>
        <p class="muted">${t.body}</p>
        <div class="muted mono" style="font-size:.72rem;margin-top:.35rem">@${t.author} · ${t.replies} replies · ${t.tags}</div>
      </div>`).join('');
  }

  async function loadStore() {
    const { products } = await api('/store/products');
    const IMG = {hoodie:'/assets/products/hoodie.jpg',tee:'/assets/products/tee.jpg',cap:'/assets/products/cap.jpg',stickers:'/assets/products/stickers.jpg',usb:'/assets/products/usb.jpg',mug:'/assets/products/mug.jpg',pack:'/assets/products/pack.jpg',pass:'/assets/products/pass.jpg'};
    $('#store-grid').innerHTML = products.map(p => `
      <article class="card" style="cursor:default">
        <div class="product-art">${IMG[p.sku]?`<img src="${IMG[p.sku]}" alt="${p.name}" loading="lazy">`:(p.emoji||'')}</div>
        <span class="tag">${p.category}</span>
        <h4>${p.name}</h4>
        <p>${p.blurb}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;gap:.4rem">
          <span class="price">${p.price_nok} NOK</span>
          <button class="btn btn-primary" type="button" data-sku="${p.sku}" data-name="${p.name}" data-price="${p.price_nok}">Add</button>
        </div>
      </article>`).join('');
    $$('#store-grid button[data-sku]').forEach(b => b.onclick = () => {
      const sku = b.dataset.sku;
      const found = state.cart.find(x => x.sku === sku);
      if (found) found.qty++; else state.cart.push({ sku, name: b.dataset.name, price: +b.dataset.price, qty: 1 });
      persistCart(); toast('Added ' + b.dataset.name);
    });
  }

  function persistCart() {
    localStorage.setItem('laden_v12_cart', JSON.stringify(state.cart));
    renderCart();
  }
  function renderCart() {
    const c = state.cart || [];
    const count = c.reduce((s, x) => s + x.qty, 0);
    const nok = c.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0), 0);
    const btn = document.getElementById('cart-btn');
    const badge = document.getElementById('cart-count');
    const box = document.getElementById('cart-items');
    const total = document.getElementById('cart-total');
    if (badge) badge.textContent = nok + ' NOK';
    if (btn) btn.classList.toggle('has-items', count > 0);
    if (box) {
      box.innerHTML = c.length
        ? c.map(x => `<div><span>${x.qty}× ${x.name}</span><span>${x.qty * x.price}</span></div>`).join('')
        : '<div style="color:var(--muted)">Empty</div>';
    }
    if (total) total.textContent = c.reduce((s, x) => s + x.qty * x.price, 0) + ' NOK';
  }

  async function loadLeaders() {
    const { leaders } = await api('/leaderboard');
    $('#leader-list').innerHTML = leaders.map((l,i) =>
      `<div class="thread" style="display:flex;justify-content:space-between;gap:1rem">
        <div><strong>#${i+1} @${l.username}</strong><div class="muted">${l.display_name}</div></div>
        <div class="mono" style="text-align:right">${l.xp} XP<br><span class="muted">${l.solves} solves</span></div>
      </div>`).join('');
  }

  function setView(v) {
    state.view = v;
    ['labs','forum','store','leaders'].forEach(name => {
      $('#view-' + name).classList.toggle('hidden', name !== v);
    });
    $$('.side button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    if (v === 'forum') loadForum();
    if (v === 'store') loadStore();
    if (v === 'leaders') loadLeaders();
  }

  function pendingChal() {
    try {
      const u = new URL(location.href);
      const q = u.searchParams.get('chal') || u.searchParams.get('challenge');
      if (q) return q;
      return sessionStorage.getItem('laden_pending_chal') || '';
    } catch { return ''; }
  }

  async function enter() {
    showGate(false);
    await refreshMe();
    await loadChallenges();
    await loadActivity();
    setView('labs');
    renderCart();
    const slug = pendingChal();
    if (slug) {
      try { sessionStorage.removeItem('laden_pending_chal'); } catch {}
      try {
        const u = new URL(location.href);
        u.searchParams.delete('chal');
        u.searchParams.delete('challenge');
        history.replaceState({}, '', u.pathname + u.search + u.hash);
      } catch {}
      location.href = '/labs/' + encodeURIComponent(slug) + '/';
      return;
    }
  }

  $$('#auth-tabs button').forEach(b => b.onclick = () => {
    const tab = b.dataset.tab;
    $('#login-form').classList.toggle('hidden', tab !== 'login');
    $('#register-form').classList.toggle('hidden', tab !== 'register');
    $$('#auth-tabs button').forEach(x => {
      x.className = 'btn ' + (x.dataset.tab === tab ? 'btn-primary' : 'btn-ghost');
    });
  });

  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    $('#auth-err').textContent = '';
    const fd = new FormData(e.target);
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }) });
      state.token = r.token;
      localStorage.setItem('laden_v12_token', r.token);
      toast('Welcome, ' + r.user.display_name);
      await enter();
    } catch (err) {
      $('#auth-err').textContent = 'Login failed — check username/email and password.';
    }
  };

  $('#register-form').onsubmit = async (e) => {
    e.preventDefault();
    $('#reg-err').textContent = '';
    const fd = new FormData(e.target);
    try {
      const r = await api('/auth/register', { method: 'POST', body: JSON.stringify({
        username: fd.get('username'), email: fd.get('email'), password: fd.get('password'), display_name: fd.get('display_name')
      }) });
      state.token = r.token;
      localStorage.setItem('laden_v12_token', r.token);
      toast('Account created');
      await enter();
    } catch (err) {
      $('#reg-err').textContent = (err.data && err.data.error) || 'Register failed';
    }
  };

  $$('.side button[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
  $('#chal-search').addEventListener('input', renderChallenges);
  $('#clear-cart').onclick = () => { state.cart = []; persistCart(); };
  $('#checkout-btn').onclick = async () => {
    try {
      await api('/store/checkout', { method: 'POST', body: JSON.stringify({ items: state.cart }) });
      state.cart = []; persistCart(); toast('Demo checkout — no charge');
      loadActivity();
    } catch { toast('Login required'); }
  };

  // Wire data-caleb early (caleb.js also binds)
  document.querySelectorAll('[data-caleb]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (typeof window.openCalebLabs === 'function') {
        e.preventDefault();
        window.openCalebLabs();
      }
    });
  });




  // Labs dashboard is members-only. Guests may open one featured starter
  // deep-linked from the homepage (current rotating trio), not browse Labs.
  function wantGuestStarter(pending) {
    if (!pending || !GUEST_OK.includes(pending)) return false;
    try {
      const u = new URL(location.href);
      if (u.searchParams.get('guest') === '1') return true;
      if (sessionStorage.getItem('laden_guest_chal') === '1') return true;
    } catch {}
    return false;
  }

  (async () => {
    const pending = pendingChal();
    if (state.token) {
      try { await enter(); }
      catch { state.token=''; localStorage.removeItem('laden_v12_token'); showGate(true); }
    } else if (wantGuestStarter(pending)) {
      try { sessionStorage.removeItem('laden_guest_chal'); } catch {}
      try { await enter(); }
      catch { showGate(true); }
    } else {
      if (pending) {
        const tip = document.createElement('p');
        tip.className = 'muted';
        tip.style.cssText = 'margin-top:.75rem;font-size:.85rem';
        tip.innerHTML = `Labs is for members. After login you will open <strong style="color:var(--cyan)" class="mono">${pending}</strong>. Guests: try the free starters on the <a href="/#challenges">homepage</a>.`;
        const gate = document.querySelector('.gate-card');
        if (gate) gate.appendChild(tip);
        try { sessionStorage.setItem('laden_pending_chal', pending); } catch {}
      } else {
        const tip = document.createElement('p');
        tip.className = 'muted';
        tip.style.cssText = 'margin-top:.75rem;font-size:.85rem';
        tip.innerHTML = 'Labs is the member board. Guests can play the 3 free challenges on the <a href="/#challenges">homepage</a>.';
        const gate = document.querySelector('.gate-card');
        if (gate) gate.appendChild(tip);
      }
      showGate(true);
    }
  })();


  // Lounge ambient clock (Europe/Oslo already on box; show local label)
  (function loungeAmbient() {
    const el = document.getElementById('ambient-clock');
    if (!el) return;
    const tick = () => {
      try {
        const s = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
          timeZone: 'Europe/Oslo'
        });
        el.textContent = 'lounge · ' + s + ' Oslo';
      } catch {
        el.textContent = 'lounge · live';
      }
    };
    tick();
    setInterval(tick, 1000);
  })();

  const cartBtn = document.getElementById('cart-btn');
  const cartPop = document.getElementById('cart-pop');
  if (cartBtn && cartPop) {
    cartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cartPop.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-cart')) cartPop.classList.remove('open');
    });
  }


  document.addEventListener('laden:lang', () => {
    try { if (typeof renderChallenges === 'function') renderChallenges(); } catch (e) {}
  });
})();
