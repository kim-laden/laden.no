/* Laden Labs v1.2 — API client (juiced). Caleb Labs = offline popup via caleb.js */
(() => {
  const API = '/v1.2/api';

  const state = {
    token: localStorage.getItem('laden_v12_token') || '',
    user: null,
    challenges: [],
    track: 'all',
    view: 'labs',
    cart: JSON.parse(localStorage.getItem('laden_v12_cart') || '[]'),
  };

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
    $('#logout-btn').classList.toggle('hidden', on);
  }

  async function refreshMe() {
    const { user } = await api('/me');
    state.user = user;
    $('#welcome').textContent = `Welcome, ${user.display_name}`;
    $('#stat-xp').textContent = user.xp;
    $('#stat-solved').textContent = user.solved;
    $('#stat-total').textContent = user.total_challenges;
    $('#stat-role').textContent = user.role;
  }

  function renderChallenges() {
    const q = ($('#chal-search').value || '').toLowerCase();
    const grid = $('#chal-grid');
    let list = state.challenges;
    if (state.track !== 'all') list = list.filter(c => c.track === state.track);
    if (q) list = list.filter(c => (c.title + c.summary + c.track).toLowerCase().includes(q));
    grid.innerHTML = list.map(c => `
      <article class="card ${c.solved ? 'solved' : ''}" data-slug="${c.slug}">
        <span class="tag ${c.difficulty}">${c.difficulty.toUpperCase()}</span>
        <span class="tag">${c.track}</span>
        <span class="tag">${c.points} XP</span>
        <h4>${c.title}${c.solved ? ' ✓' : ''}</h4>
        <p>${c.summary}</p>
      </article>`).join('') || '<p class="muted">No labs in this filter.</p>';
    $$('.card', grid).forEach(card => card.addEventListener('click', () => openChallenge(card.dataset.slug)));
  }

  async function openChallenge(slug) {
    const { challenge: c } = await api('/challenges/' + slug);
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
        <button class="btn btn-ghost" type="button" id="close-chal">Close</button>
      </div>
      <div class="learn"><strong>Learn:</strong> ${c.learn}</div>
      <div class="chal-body">${c.body_html}</div>
      <p class="muted mono" style="font-size:.78rem;margin-top:.6rem">Hint: ${c.hint || '—'}</p>
      <div class="flag-row">
        <input id="flag-in" placeholder="laden{...}" autocomplete="off" spellcheck="false">
        <button class="btn btn-primary" type="button" id="flag-go">Submit flag</button>
        <button class="btn btn-cyan" type="button" data-caleb id="chal-caleb">Ask Caleb</button>
      </div>
      <div class="msg" id="flag-msg"></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#close-chal').onclick = () => box.classList.add('hidden');
    const ask = $('#chal-caleb');
    if (ask) ask.onclick = (e) => { e.preventDefault(); if (window.openCalebLabs) window.openCalebLabs(); };
    $('#flag-go').onclick = async () => {
      const flag = $('#flag-in').value;
      const msg = $('#flag-msg');
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
    state.challenges = challenges;
    const tracks = [...new Set(challenges.map(c => c.track))].sort();
    $('#track-list').innerHTML = tracks.map(t =>
      `<button type="button" data-track="${t}">${t} <span class="muted">(${challenges.filter(c=>c.track===t).length})</span></button>`
    ).join('');
    $$('#track-list button, .side button[data-track]').forEach(b => {
      b.onclick = () => {
        state.track = b.dataset.track;
        $$('.side button[data-track], #track-list button').forEach(x => x.classList.toggle('active', x.dataset.track === state.track));
        renderChallenges();
      };
    });
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
    const btn = document.getElementById('cart-btn');
    const badge = document.getElementById('cart-count');
    const box = document.getElementById('cart-items');
    const total = document.getElementById('cart-total');
    if (badge) badge.textContent = String(count);
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
      try { await openChallenge(slug); } catch (e) { toast('Challenge not found: ' + slug); }
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
      $('#auth-err').textContent = 'Login failed — check demo credentials.';
    }
  };

  $('#register-form').onsubmit = async (e) => {
    e.preventDefault();
    $('#reg-err').textContent = '';
    const fd = new FormData(e.target);
    try {
      const r = await api('/auth/register', { method: 'POST', body: JSON.stringify({
        username: fd.get('username'), password: fd.get('password'), display_name: fd.get('display_name')
      }) });
      state.token = r.token;
      localStorage.setItem('laden_v12_token', r.token);
      toast('Account created');
      await enter();
    } catch (err) {
      $('#reg-err').textContent = (err.data && err.data.error) || 'Register failed';
    }
  };

  $('#logout-btn').onclick = () => {
    state.token = '';
    localStorage.removeItem('laden_v12_token');
    showGate(true);
    toast('Logged out');
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

  (async () => {
    const pending = pendingChal();
    if (pending && !state.token) {
      const tip = document.createElement('p');
      tip.className = 'muted';
      tip.style.cssText = 'margin-top:.75rem;font-size:.85rem';
      tip.innerHTML = `After login you will open <strong style="color:var(--cyan)" class="mono">${pending}</strong>.`;
      const gate = document.querySelector('.gate-card');
      if (gate) gate.appendChild(tip);
      try { sessionStorage.setItem('laden_pending_chal', pending); } catch {}
    }
    if (state.token) {
      try { await enter(); }
      catch { state.token=''; localStorage.removeItem('laden_v12_token'); showGate(true); }
    } else showGate(true);
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

})();
