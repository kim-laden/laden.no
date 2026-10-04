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
    ['NX', 'nyx', 'solved Easy Pickings (+50)'],
    ['RK', 'r0kk', 'posted in Web Exploitation'],
    ['MV', 'maven', 'bought Laden Hoodie'],
    ['CL', 'caleb', 'dropped a gentle JWT hint'],
    ['ØL', 'øystein', 'started Hard: Broken Auth'],
    ['SK', 'skugge', 'unlocked badge: First Blood'],
    ['PT', 'payload', 'replied in OpSec Lounge'],
    ['HZ', 'haze', 'checked out Sticker Pack'],
    ['LB', 'labs', '24 challenges online · JWT+DB'],
  ];
  if (feed) {
    let i = 0;
    function add() {
      const [av, who, what] = events[i % events.length];
      i++;
      const el = document.createElement('div');
      el.className = 'feed-item';
      el.innerHTML = `<div class="avatar">${av}</div><div><strong>@${who}</strong><small>${what} · just now</small></div>`;
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

  // Minimal nav cart
  const CART_KEY = 'laden_v13_cart';
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
  }
  function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); }
  window.addToCart = function (id, name, price) {
    const c = getCart();
    const found = c.find(x => x.id === id);
    if (found) found.qty += 1; else c.push({ id, name, price, qty: 1 });
    saveCart(c);
    ladenToast('Added: ' + name);
    const pop = document.getElementById('cart-pop');
    if (pop) pop.classList.add('open');
  };
  window.clearCart = function () { saveCart([]); ladenToast('Cart cleared'); };
  window.checkoutDemo = function () {
    const c = getCart();
    if (!c.length) return ladenToast('Cart is empty');
    ladenToast('Demo checkout — no charge. Thanks!');
    saveCart([]);
    const pop = document.getElementById('cart-pop');
    if (pop) pop.classList.remove('open');
  };
  function renderCart() {
    const c = getCart();
    const count = c.reduce((s, x) => s + x.qty, 0);
    const btn = document.getElementById('cart-btn');
    const badge = document.getElementById('cart-count');
    const items = document.getElementById('cart-items');
    const total = document.getElementById('cart-total');
    if (badge) badge.textContent = String(count);
    if (btn) btn.classList.toggle('has-items', count > 0);
    if (items) {
      items.innerHTML = c.length
        ? c.map(x => `<div><span>${x.qty}× ${x.name}</span><span>${x.qty * x.price}</span></div>`).join('')
        : '<div style="color:var(--muted)">Empty</div>';
    }
    if (total) total.textContent = (c.reduce((s, x) => s + x.qty * x.price, 0)) + ' NOK';
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
      const diff = (c.difficulty || 'easy').toLowerCase();
      const tag = diff === 'hard' ? 'hard' : diff === 'med' || diff === 'medium' ? 'med' : 'easy';
      const cls = spotlight ? 'card chal-spotlight' : 'card';
      const badge = spotlight ? '<span class="chal-spotlight-badge">Try free</span>' : '';
      // Free trio + member clicks from main go to the Challenges page
      return `<a class="${cls}" href="/challenges/?chal=${encodeURIComponent(c.slug)}" style="color:inherit">
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
        if (headH2) headH2.textContent = 'New challenges every week!';
        if (headP) headP.innerHTML = 'Free rotators · earn <b>Laden Labs Tokens (LLT)</b> · <span class="mono">1 LLT = 1 NOK</span>. <a href="/challenges/">Play &amp; earn</a> · <a href="/account/">account</a> for full Labs + XP.';
      } else {
        list = track === 'all' ? all : all.filter(c => c.track === track);
        if (filters) filters.hidden = false;
        grid.classList.remove('chal-spotlight-grid');
        if (headH2) headH2.textContent = 'Your challenge board';
        if (headP) headP.innerHTML = 'Members: play here or in <a href="/labs/">Labs</a> — ' + all.length + ' challenges, submit <span class="mono">laden{…}</span>, bank XP.';
      }
      grid.innerHTML = list.map(c => cardHtml(c, !authed)).join('') || '<p class="muted">No challenges in this track.</p>';
      grid.querySelectorAll('a.card').forEach(a => {
        a.addEventListener('click', () => {
          try {
            const u = new URL(a.href);
            const slug = u.searchParams.get('chal');
            if (slug) sessionStorage.setItem('laden_pending_chal', slug);
          } catch {}
        });
      });
    }

    fetch('/labs/api/challenges')
      .then(r => r.json())
      .then(d => {
        all = d.challenges || [];
        const tracks = [...new Set(all.map(c => c.track))].sort();
        if (filters) {
          filters.innerHTML = ['all', ...tracks].map(t =>
            `<button type="button" data-track="${t}" class="${t==='all'?'active':''}">${t === 'all' ? 'All' : t} <span class="muted">(${t==='all'?all.length:all.filter(c=>c.track===t).length})</span></button>`
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
        grid.innerHTML = '<p class="muted">Could not load challenges. <a href="/labs/">Open Laden Labs</a> directly.</p>';
      });
  })();
