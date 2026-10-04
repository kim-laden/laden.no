/* Laden v1.1 shared */
(function () {
  const BASE = document.documentElement.getAttribute('data-base') || '.';
  const CALEB_TOKEN = 'f4779512766227de17222df1ae903d84a94c60ab55cae35c';
  const CALEB_URL = '/claw/#token=' + encodeURIComponent(CALEB_TOKEN)
    + '&gatewayUrl=' + encodeURIComponent('wss://laden.no/claw/');

  // Wire Caleb buttons
  document.querySelectorAll('[data-caleb]').forEach(el => {
    el.setAttribute('href', CALEB_URL);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  // Oslo clock
  const clock = document.getElementById('oslo-clock');
  function tick() {
    if (!clock) return;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    clock.textContent = fmt.format(new Date()) + ' CET/CEST';
  }
  tick(); setInterval(tick, 1000);

  // Fake live activity
  const feed = document.getElementById('live-feed');
  const events = [
    ['NX', 'nyx', 'solved Easy Pickings (+50)'],
    ['RK', 'r0kk', 'posted in Web Exploitation'],
    ['MV', 'maven', 'bought Laden Hoodie'],
    ['CL', 'caleb', 'answered a member question'],
    ['ØL', 'øystein', 'started Hard: Broken Auth'],
    ['SK', 'skugge', 'unlocked badge: First Blood'],
    ['PT', 'payload', 'replied in OpSec Lounge'],
    ['HZ', 'haze', 'checked out Sticker Pack'],
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
      if (Math.random() > 0.7) { n += Math.random() > 0.5 ? 1 : 0; members.textContent = String(n); }
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

  // Cart
  const CART_KEY = 'laden_v11_cart';
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
  };
  window.clearCart = function () { saveCart([]); ladenToast('Cart cleared'); };
  window.checkoutDemo = function () {
    const c = getCart();
    if (!c.length) return ladenToast('Cart is empty');
    ladenToast('Demo checkout — no charge. Thanks!');
    saveCart([]);
  };
  function renderCart() {
    const box = document.getElementById('cart-box');
    if (!box) return;
    const c = getCart();
    const items = document.getElementById('cart-items');
    const total = document.getElementById('cart-total');
    if (!c.length) {
      items.innerHTML = '<div style="color:var(--muted)">Empty</div>';
      total.textContent = '0 NOK';
      return;
    }
    items.innerHTML = c.map(x => `<div><span>${x.qty}× ${x.name}</span><span>${x.qty * x.price} NOK</span></div>`).join('');
    total.textContent = c.reduce((s, x) => s + x.qty * x.price, 0) + ' NOK';
  }
  renderCart();

  // Challenges — SHA-256 of flags (demo)
  // flags: laden{welcome_operator}, laden{robots_remember}, laden{b64_is_not_secret}, laden{xss_alert_friend}, laden{jwt_none_of_your_business}
  const challenges = {
    welcome: {
      title: 'Easy Pickings',
      diff: 'easy', points: 50,
      blurb: 'Warm-up. The welcome banner hides a classic CTF flag format.',
      body: `<p>Look at the page source of this challenge panel. Operators leave notes in HTML comments.</p>
<!-- flag: laden{welcome_operator} -->
<p class="mono" style="margin-top:.8rem;color:var(--muted)">Hint: view-source / DevTools Elements.</p>`,
      hash: '6f3c0e0e8c8f0c1a0f2e6d4b9a7c5e3d1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6' // placeholder replaced below
    },
    robots: {
      title: 'Robots Remember',
      diff: 'easy', points: 75,
      blurb: 'Something interesting is listed in a robots-style list.',
      body: `<p>Fetch the demo path below and find what scanners are told to avoid.</p>
<pre class="mono" style="background:#080b10;padding:.8rem;border-radius:10px;border:1px solid var(--border);margin-top:.6rem;white-space:pre-wrap">Disallow: /v1.1/challenges/secret-path.txt</pre>
<p style="margin-top:.6rem"><a href="secret-path.txt">Open secret-path.txt</a></p>`,
      hash: ''
    },
    b64: {
      title: 'Not Encryption',
      diff: 'med', points: 100,
      blurb: 'Base64 is encoding, not a vault.',
      body: `<p>Decode this blob:</p>
<pre class="mono" style="background:#080b10;padding:.8rem;border-radius:10px;border:1px solid var(--border);margin-top:.6rem;overflow:auto">bGFkZW57YjY0X2lzX25vdF9zZWNyZXR9</pre>`,
      hash: ''
    },
    xss: {
      title: 'Friendly Alert',
      diff: 'med', points: 120,
      blurb: 'A tiny reflected XSS playground (sandboxed demo).',
      body: `<p>The echo box below is intentionally weak. Make it run <code>alert(1)</code> conceptually — for this demo, submit the flag revealed when you inject a script tag containing the word alert.</p>
<input id="xss-in" placeholder="<script>…</script>" style="width:100%;margin-top:.5rem;background:#080b10;border:1px solid var(--border);color:var(--text);border-radius:10px;padding:.7rem;font-family:JetBrains Mono,monospace">
<button class="btn btn-ghost" style="margin-top:.5rem" type="button" id="xss-go">Echo</button>
<div id="xss-out" style="margin-top:.7rem;padding:.7rem;border-radius:10px;background:#080b10;border:1px solid var(--border);min-height:2.5rem"></div>
<p class="mono" style="margin-top:.6rem;color:var(--muted);font-size:.8rem">Demo only — not a real sink. Flag appears if payload includes &lt;script&gt; and alert.</p>`,
      hash: ''
    },
    jwt: {
      title: 'None of Your Business',
      diff: 'hard', points: 200,
      blurb: 'A classic alg=none style demo token.',
      body: `<p>This “session” JWT uses a broken algorithm claim. Decode the payload.</p>
<pre class="mono" style="background:#080b10;padding:.8rem;border-radius:10px;border:1px solid var(--border);margin-top:.6rem;white-space:pre-wrap;overflow:auto">eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoibWVtYmVyIiwiZmxhZyI6ImxhZGVue2p3dF9ub25lX29mX3lvdXJfYnVzaW5lc3N9In0.</pre>`,
      hash: ''
    }
  };

  async function sha256hex(str) {
    const data = new TextEncoder().encode(str.trim());
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Precomputed hashes for demo flags
  const FLAG_HASHES = {
    welcome: 'b7c8e2a1f0d94e6b5a3c1d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8', // will set real below
  };

  // Compute real hashes at runtime for the known flags (so we don't hardcode wrong)
  const KNOWN = {
    welcome: 'laden{welcome_operator}',
    robots: 'laden{robots_remember}',
    b64: 'laden{b64_is_not_secret}',
    xss: 'laden{xss_alert_friend}',
    jwt: 'laden{jwt_none_of_your_business}'
  };

  const solvedKey = 'laden_v11_solved';
  function getSolved() {
    try { return JSON.parse(localStorage.getItem(solvedKey) || '{}'); } catch { return {}; }
  }
  function markSolved(id) {
    const s = getSolved(); s[id] = true; localStorage.setItem(solvedKey, JSON.stringify(s));
  }

  window.initChallenges = async function () {
    const list = document.getElementById('chal-list');
    const panel = document.getElementById('chal-panel');
    if (!list || !panel) return;

    const hashes = {};
    for (const [id, flag] of Object.entries(KNOWN)) hashes[id] = await sha256hex(flag);

    const solved = getSolved();
    const ids = Object.keys(challenges);

    function renderList() {
      list.innerHTML = ids.map(id => {
        const c = challenges[id];
        const done = solved[id] ? ' ✓' : '';
        return `<button type="button" data-id="${id}" class="${id === (window.__chal || 'welcome') ? 'active' : ''}">
          <span class="tag ${c.diff}">${c.diff.toUpperCase()} · ${c.points}pts</span>
          <div style="margin-top:.35rem;font-weight:600">${c.title}${done}</div>
          <small>${c.blurb}</small>
        </button>`;
      }).join('');
      list.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => show(btn.dataset.id)));
    }

    function show(id) {
      window.__chal = id;
      const c = challenges[id];
      const done = getSolved()[id];
      panel.innerHTML = `
        <span class="tag ${c.diff}">${c.diff.toUpperCase()}</span>
        <h2 style="font-family:Orbitron,sans-serif;margin:.4rem 0 .5rem">${c.title}</h2>
        <p style="color:var(--muted);margin-bottom:.8rem">${c.blurb} · <span class="mono">${c.points} pts</span>${done ? ' · <span style="color:var(--green)">Solved</span>' : ''}</p>
        <div>${c.body}</div>
        <div class="flag-row">
          <input id="flag-in" placeholder="laden{...}" autocomplete="off" spellcheck="false">
          <button class="btn btn-primary" type="button" id="flag-go">Submit flag</button>
        </div>
        <div class="msg" id="flag-msg"></div>`;
      renderList();

      const xssGo = document.getElementById('xss-go');
      if (xssGo) {
        xssGo.addEventListener('click', () => {
          const v = document.getElementById('xss-in').value || '';
          const out = document.getElementById('xss-out');
          // Intentionally naive demo
          out.innerHTML = v;
          if (/<script[\s>]/i.test(v) && /alert/i.test(v)) {
            out.innerHTML += `<div style="margin-top:.5rem;color:var(--green)" class="mono">Payload detected. Flag: laden{xss_alert_friend}</div>`;
          }
        });
      }

      document.getElementById('flag-go').addEventListener('click', async () => {
        const val = document.getElementById('flag-in').value || '';
        const msg = document.getElementById('flag-msg');
        const h = await sha256hex(val);
        if (h === hashes[id]) {
          markSolved(id);
          msg.className = 'msg ok';
          msg.textContent = 'Correct — nice work, operator.';
          ladenToast('+' + c.points + ' pts · ' + c.title);
          show(id);
        } else {
          msg.className = 'msg bad';
          msg.textContent = 'Nope. Try again.';
        }
      });
    }

    show('welcome');
  };

  if (document.body.dataset.page === 'challenges') {
    initChallenges();
  }
})();
