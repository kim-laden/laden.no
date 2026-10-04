/* laden force https — API proxy only on :443 */
(function () {
  try {
    if (location.protocol === 'http:' && /^(www\.)?laden\.no$/i.test(location.hostname)) {
      location.replace('https://' + location.host + location.pathname + location.search + location.hash);
    }
  } catch (e) {}
})();

/* Laden AS homepage / store / forum — no OpenClaw */
(function () {
  // Oslo clock
  const clock = document.getElementById('oslo-clock');
  function tick() {
    if (!clock) return;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    clock.textContent = fmt.format(new Date()) + ' Oslo';
  }
  tick(); setInterval(tick, 1000);

  // Live ops feed
  const feed = document.getElementById('live-feed');
  const events = [
    ['NX', 'nyx', 'feed.e0'],
    ['RK', 'r0kk', 'feed.e1'],
    ['MV', 'maven', 'feed.e2'],
    ['CL', 'caleb', 'feed.e3'],
    ['ØL', 'øystein', 'feed.e4'],
    ['SK', 'skugge', 'feed.e5'],
    ['PT', 'payload', 'feed.e6'],
    ['HZ', 'haze', 'feed.e7'],
    ['LB', 'labs', 'feed.e8'],
  ];
  if (feed) {
    let i = 0;
    function add() {
      const [av, who, what] = events[i % events.length];
      i++;
      const el = document.createElement('div');
      el.className = 'feed-item';
      const whatT = window.LadenI18n ? LadenI18n.t(what) : what;
      const just = window.LadenI18n ? LadenI18n.t('feed.justNow') : 'just now';
      el.innerHTML = `<div class="avatar">${av}</div><div><strong>@${who}</strong><small>${whatT} · ${just}</small></div>`;
      feed.prepend(el);
      while (feed.children.length > 6) feed.lastChild.remove();
    }
    for (let n = 0; n < 4; n++) add();
    setInterval(add, 7000);
  }

  // Member counter flicker
  const members = document.getElementById('member-count');
  if (members) {
    let n = 128;
    setInterval(() => {
      if (Math.random() > 0.7) {
        n += Math.random() > 0.5 ? 1 : 0;
        members.textContent = String(n);
      }
    }, 8000);
  }

  // Toast
  window.ladenToast = function (msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };

  // Minimal nav cart (same key as LLT / labs demo cart)
  const CART_KEY = 'laden_v12_cart';
  const CART_KEY_LEGACY = 'laden_v13_cart';
  function getCart() {
    try {
      let raw = localStorage.getItem(CART_KEY);
      if (!raw) {
        const legacy = localStorage.getItem(CART_KEY_LEGACY);
        if (legacy) {
          localStorage.setItem(CART_KEY, legacy);
          try { localStorage.removeItem(CART_KEY_LEGACY); } catch (_) {}
          raw = legacy;
        }
      }
      const c = JSON.parse(raw || '[]');
      return Array.isArray(c) ? c : [];
    } catch { return []; }
  }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); }
  window.addToCart = function (id, name, price) {
    const c = getCart();
    const found = c.find(x => x.id === id);
    if (found) found.qty += 1; else c.push({ id, name, price: Number(price) || 0, qty: 1 });
    saveCart(c);
    ladenToast((window.LadenI18n ? LadenI18n.t('cart.added', {name: name}) : ('Added: ' + name)));
    const pop = document.getElementById('cart-pop');
    if (pop) pop.classList.add('open');
  };
  window.clearCart = function () { saveCart([]); ladenToast(window.LadenI18n ? LadenI18n.t('cart.cleared') : 'Cart cleared'); };
  window.checkoutDemo = function () {
    const c = getCart();
    if (!c.length) return ladenToast(window.LadenI18n ? LadenI18n.t('cart.isEmpty') : 'Cart is empty');
    const pop = document.getElementById('cart-pop');
    if (pop) pop.classList.remove('open');
    location.href = '/gear/checkout/';
  };
  function renderCart() {
    const c = getCart();
    const count = c.reduce((s, x) => s + (Number(x.qty) || 0), 0);
    const nok = c.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0), 0);
    const btn = document.getElementById('cart-btn');
    const badge = document.getElementById('cart-count');
    const items = document.getElementById('cart-items');
    const total = document.getElementById('cart-total');
    if (badge) badge.textContent = nok + ' NOK';
    if (btn) btn.classList.toggle('has-items', count > 0);
    if (items) {
      items.innerHTML = c.length
        ? c.map(x => `<div><span>${x.qty}× ${escapeHtml(x.name)}</span><span>${(Number(x.qty)||0) * (Number(x.price)||0)} NOK</span></div>`).join('')
        : '<div style="color:var(--muted)">' + (window.LadenI18n ? LadenI18n.t('cart.empty') : 'Empty') + '</div>';
    }
    if (total) total.textContent = (c.reduce((s, x) => s + (Number(x.qty)||0) * (Number(x.price)||0), 0)) + ' NOK';
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
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
  renderCart();
  window.__ladenRenderCart = renderCart;

  // Wire [data-caleb] if caleb.js not yet loaded (fallback)
  document.querySelectorAll('[data-caleb]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (typeof window.openCalebLabs === 'function') {
        e.preventDefault();
        window.openCalebLabs();
      }
    });
  });
})();

  // Challenge board on homepage — 3 free for everyone; full board for members (Labs is the member area)
  (function homeChallenges() {
    const grid = document.getElementById('home-chal-grid');
    const filters = document.getElementById('home-chal-filters');
    const headH2 = document.querySelector('#challenges .section-head h2');
    const headP = document.querySelector('#challenges .section-head p');
    if (!grid) return;
    let all = [];
    let track = 'all';
    const SPOTLIGHT = (window.LADEN_FEATURED && window.LADEN_FEATURED.slugs)
      ? window.LADEN_FEATURED.slugs()
      : ['scope-first', 'robots-redux', 'reflect-101'];

    function loggedIn() {
      try {
        const t = localStorage.getItem('laden_v12_token');
        if (!t) return false;
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return !!(p.usr || p.username || p.sub);
      } catch { return false; }
    }

    function cardHtml(c, spotlight) {
      if (window.LadenI18n && typeof LadenI18n.localizeLab === 'function') c = LadenI18n.localizeLab(c);
      const diff = (c.difficulty || 'easy').toLowerCase();
      const tag = diff === 'hard' ? 'hard' : diff === 'med' || diff === 'medium' ? 'med' : 'easy';
      const cls = spotlight ? 'card chal-spotlight' : 'card';
      const badge = spotlight ? ('<span class="chal-spotlight-badge">' + (window.LadenI18n ? LadenI18n.t('chal.tryFree') : 'Try free') + '</span>') : '';
      // Free trio + member clicks from main go to the Challenges page
      return `<a class="${cls}" href="/labs/${encodeURIComponent(c.slug)}/" style="color:inherit">
          ${badge}
          <span class="tag ${tag}">${diff.toUpperCase()} · ${c.points}</span>
          <h3>${c.title}</h3>
          <p>${c.summary || ''}</p>
          <div class="meta"><span>${c.track}</span><span class="mono">${c.slug}</span></div>
        </a>`;
    }

    function render() {
      const authed = loggedIn();
      let list;
      if (!authed) {
        const bySlug = Object.fromEntries(all.map(c => [c.slug, c]));
        list = SPOTLIGHT.map(s => bySlug[s]).filter(Boolean);
        if (list.length < 3) {
          const used = new Set(list.map(c => c.slug));
          for (const c of all) {
            if (used.has(c.slug)) continue;
            list.push(c);
            if (list.length >= 3) break;
          }
        }
        if (filters) filters.hidden = true;
        grid.classList.add('chal-spotlight-grid');
        if (headH2) headH2.textContent = window.LadenI18n ? LadenI18n.t('chal.home.guestTitle') : 'New challenges every week!';
        if (headP) headP.innerHTML = window.LadenI18n ? LadenI18n.t('chal.home.guestLead') : 'Free rotators · earn <b>Laden Labs Tokens (LLT)</b> · <span class="mono">1 LLT = 1 NOK</span>. <a href="/challenges/">Play &amp; earn</a> · <a href="/account/">account</a> for full Labs + XP.';
      } else {
        list = track === 'all' ? all : all.filter(c => c.track === track);
        if (filters) filters.hidden = false;
        grid.classList.remove('chal-spotlight-grid');
        if (headH2) headH2.textContent = window.LadenI18n ? LadenI18n.t('chal.home.memberTitle') : 'Your challenge board';
        if (headP) headP.innerHTML = window.LadenI18n ? LadenI18n.t('chal.home.memberLead', {n: all.length}) : ('Members: play here or in <a href="/labs/">Labs</a> — ' + all.length + ' challenges, submit <span class="mono">LLZ{…}</span>, bank XP.');
      }
      grid.innerHTML = list.map(c => cardHtml(c, !authed)).join('') || ('<p class="muted">' + (window.LadenI18n ? LadenI18n.t('chal.home.empty') : 'No challenges in this track.') + '</p>');
      grid.querySelectorAll('a.card').forEach(a => {
        a.addEventListener('click', () => {
          try {
            const u = new URL(a.href);
            let slug = u.searchParams.get('chal');
            if (!slug) {
              const m = u.pathname.match(/\/labs\/([a-z0-9-]+)\/?$/i);
              if (m) slug = m[1];
            }
            if (slug) sessionStorage.setItem('laden_pending_chal', slug);
          } catch {}
        });
      });
    }

    window.__ladenRenderHomeChal = render;

    fetch('/labs/api/challenges')
      .then(r => r.json())
      .then(d => {
        all = d.challenges || [];
        const tracks = [...new Set(all.map(c => c.track))].sort();
        if (filters) {
          filters.innerHTML = ['all', ...tracks].map(t =>
            `<button type="button" data-track="${t}" class="${t==='all'?'active':''}">${t === 'all' ? (window.LadenI18n ? LadenI18n.t('chal.home.allBtn') : 'All') : t} <span class="muted">(${t==='all'?all.length:all.filter(c=>c.track===t).length})</span></button>`
          ).join('');
          filters.querySelectorAll('button').forEach(b => {
            b.onclick = () => {
              track = b.dataset.track;
              filters.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
              render();
            };
          });
        }
        render();
      })
      .catch(() => {
        grid.innerHTML = '<p class="muted">' + (window.LadenI18n ? LadenI18n.t('chal.home.error') : 'Could not load challenges. <a href="/labs/">Open Laden Labs</a> directly.') + '</p>';
      });
  })();


/* Unread DM badge — looks for #nav-messages */
(function () {
  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';
  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function ensureBadge(link) {
    let b = link.querySelector('.msg-nav-badge');
    if (!b) {
      b = document.createElement('span');
      b.className = 'msg-nav-badge';
      b.setAttribute('data-count', '0');
      link.appendChild(b);
    }
    return b;
  }
  async function refresh() {
    const link = document.getElementById('nav-messages');
    if (!link) return;
    const t = token();
    if (!t) {
      const b = link.querySelector('.msg-nav-badge');
      if (b) { b.textContent = ''; b.setAttribute('data-count', '0'); }
      return;
    }
    try {
      const res = await fetch(API + '/messages/unread', {
        headers: { Authorization: 'Bearer ' + t },
      });
      if (!res.ok) return;
      const data = await res.json();
      const n = Number(data.count || 0);
      const b = ensureBadge(link);
      b.setAttribute('data-count', String(n));
      b.textContent = n > 0 ? (n > 99 ? '99+' : String(n)) : '';
    } catch {}
  }
  window.LadenMessages = { refresh };
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();


/* Re-apply dynamic chrome on language change */
document.addEventListener('laden:lang', function () {
  try { if (typeof window.__ladenRenderCart === 'function') window.__ladenRenderCart(); } catch (e) {}
  try { if (typeof window.__ladenRenderHomeChal === 'function') window.__ladenRenderHomeChal(); } catch (e2) {}
});
