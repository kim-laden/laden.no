/* Laden Labs Tokens (LLT) — 1 LLT = 1 NOK
 * Guests: sessionStorage only (browser session).
 * Members (JWT): SQLite via /labs/api/llt* — mirrored in memory.
 */
(function () {
  const KEY = 'laden_llt_wallet_v1';
  const TOKEN_KEY = 'laden_v12_token';
  const API = '/labs/api';
  const START = 100;
  const WEEKLY_SKU = 'llt-week-sticker';
  const WEEKLY_NAME = 'Weekly LLT Sticker Drop';
  const WEEKLY_PRICE = 49;
  const HINT_COST = 3;

  // One-shot: clear sticky guest wallet from localStorage (intentional)
  try {
    if (localStorage.getItem(KEY) != null) localStorage.removeItem(KEY);
  } catch {}

  function weekId() {
    return Math.floor(Date.now() / 86400000 / 7);
  }

  function emptyWallet() {
    return {
      balance: START,
      earned: 0,
      spent: 0,
      xp: 0,
      solved: [],
      hints: [],
      weeklies: [],
      week: weekId(),
      gamePlays: 0,
      solved_count: 0,
    };
  }

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }

  function isLoggedIn() {
    const t = token();
    if (!t) return false;
    try {
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (p.exp && Date.now() / 1000 > p.exp) return false;
      return !!(p.usr || p.username || p.sub);
    } catch { return false; }
  }

  function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  let mem = null; // member in-memory cache

  function loadGuest() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (!raw || typeof raw.balance !== 'number') return emptyWallet();
      if (raw.week !== weekId()) raw.week = weekId();
      raw.hints = raw.hints || [];
      raw.solved = raw.solved || [];
      raw.weeklies = raw.weeklies || [];
      return raw;
    } catch {
      return emptyWallet();
    }
  }

  function saveGuest(w) {
    try { sessionStorage.setItem(KEY, JSON.stringify(w)); } catch {}
    paint(w);
  }

  function paint(w) {
    const bal = w && typeof w.balance === 'number' ? w.balance : START;
    const xp = w && typeof w.xp === 'number' ? w.xp : null;
    try { window.dispatchEvent(new CustomEvent('llt-change', { detail: { balance: bal, xp: xp } })); } catch {}
    document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(bal); });
    document.querySelectorAll('[data-llt-xp]').forEach(el => {
      if (xp == null) { el.textContent = '—'; return; }
      el.textContent = String(xp);
    });
    document.querySelectorAll('.llt-wallet').forEach(el => {
      if (xp != null && isLoggedIn()) {
        el.title = 'Laden Labs Tokens · score ' + xp + ' XP';
      } else {
        el.title = 'Laden Labs Tokens';
      }
    });
  }

  function applySnap(snap) {
    mem = {
      balance: Number(snap.balance) || 0,
      earned: Number(snap.earned) || 0,
      spent: Number(snap.spent) || 0,
      xp: Number(snap.xp) || 0,
      hints: Array.isArray(snap.hints) ? snap.hints.slice() : [],
      weeklies: Array.isArray(snap.weeklies) ? snap.weeklies.slice() : [],
      solved: [],
      solved_count: Number(snap.solved_count) || 0,
      week: weekId(),
      gamePlays: 0,
    };
    paint(mem);
    return mem;
  }

  async function api(path, opts) {
    const res = await fetch(API + path, Object.assign({}, opts || {}, { headers: authHeaders() }));
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function sync() {
    if (!isLoggedIn()) {
      mem = null;
      const g = loadGuest();
      paint(g);
      return g;
    }
    try {
      const { res, data } = await api('/llt');
      if (!res.ok) throw new Error(data.error || 'llt_sync_failed');
      return applySnap(data);
    } catch (e) {
      if (!mem) mem = emptyWallet();
      paint(mem);
      return mem;
    }
  }

  function current() {
    if (isLoggedIn()) return mem || emptyWallet();
    return loadGuest();
  }

  function guestCredit(n) {
    n = Math.max(0, Math.floor(n));
    const w = loadGuest();
    if (!n) return w;
    w.balance += n;
    w.earned = (w.earned || 0) + n;
    saveGuest(w);
    return w;
  }

  function guestDebit(n) {
    n = Math.max(0, Math.floor(n));
    const w = loadGuest();
    if (w.balance < n) return { ok: false, wallet: w };
    w.balance -= n;
    w.spent = (w.spent || 0) + n;
    saveGuest(w);
    return { ok: true, wallet: w };
  }

  const apiObj = {
    START,
    WEEKLY_SKU,
    WEEKLY_NAME,
    WEEKLY_PRICE,
    HINT_COST,
    weekId,
    isLoggedIn,
    sync,

    get() { return current(); },
    balance() { return current().balance; },
    xp() { return current().xp || 0; },

    /** Apply solve response from gateway (members). */
    applyFromSolve(r) {
      if (!r) return current();
      if (typeof r.llt === 'number') {
        if (!mem) mem = emptyWallet();
        mem.balance = r.llt;
        if (typeof r.xp === 'number') mem.xp = r.xp;
        if (r.llt_reward) mem.earned = (mem.earned || 0) + r.llt_reward;
        paint(mem);
        return mem;
      }
      return current();
    },

    async credit(n, why) {
      n = Math.max(0, Math.floor(n));
      if (!n) return current();
      if (!isLoggedIn()) return guestCredit(n);
      // members: only game credits go through /llt/game; generic credit is local cache noop
      if (why && /packet|tool-?drop|game/i.test(String(why))) {
        return apiObj.gamePayout(n);
      }
      const { res, data } = await api('/llt/game', {
        method: 'POST',
        body: JSON.stringify({ payout: Math.min(128, n) }),
      });
      if (res.ok) return applySnap(data);
      return current();
    },

    async gamePayout(payout) {
      payout = Math.max(0, Math.min(128, Math.floor(payout || 0)));
      if (!isLoggedIn()) {
        if (!payout) return { ok: true, credited: 0, wallet: loadGuest() };
        const w = guestCredit(payout);
        return { ok: true, credited: payout, wallet: w };
      }
      const { res, data } = await api('/llt/game', {
        method: 'POST',
        body: JSON.stringify({ payout }),
      });
      if (!res.ok) return { ok: false, credited: 0, wallet: current(), error: data.error };
      applySnap(data);
      return { ok: true, credited: data.credited || 0, wallet: mem };
    },

    async debit(n, why) {
      n = Math.max(0, Math.floor(n));
      if (!isLoggedIn()) return guestDebit(n);
      // members should use buyHint / buyWeekly — debit alone is not exposed server-side
      const w = current();
      if (w.balance < n) return { ok: false, wallet: w };
      return { ok: false, wallet: w, error: 'use_buy_endpoints' };
    },

    hasSolved(slug) {
      const w = current();
      return (w.solved || []).includes(slug);
    },

    async markSolved(slug, reward) {
      if (isLoggedIn()) {
        // Server awards on /challenges/:slug/submit — just refresh
        await sync();
        return { ok: true, reward: 0, wallet: current(), server: true };
      }
      const w = loadGuest();
      if ((w.solved || []).includes(slug)) return { ok: false, already: true, wallet: w };
      w.solved = w.solved || [];
      w.solved.push(slug);
      reward = Math.max(0, Math.floor(reward || 0));
      w.balance += reward;
      w.earned = (w.earned || 0) + reward;
      saveGuest(w);
      return { ok: true, reward, wallet: w };
    },

    hasHint(slug) {
      return (current().hints || []).includes(slug);
    },

    async buyHint(slug, cost) {
      cost = Math.max(1, Math.floor(cost || HINT_COST));
      if (apiObj.hasHint(slug)) return { ok: true, already: true, wallet: current() };
      if (!isLoggedIn()) {
        const r = guestDebit(cost);
        if (!r.ok) return r;
        const w = r.wallet;
        w.hints = w.hints || [];
        w.hints.push(slug);
        saveGuest(w);
        return { ok: true, wallet: w };
      }
      const { res, data } = await api('/llt/hint', {
        method: 'POST',
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) return { ok: false, error: 'unauthorized', wallet: current() };
      if (data && (data.balance != null)) applySnap(data);
      if (!res.ok || data.ok === false) {
        return { ok: false, error: data.error || 'hint_failed', wallet: current() };
      }
      return { ok: true, already: !!data.already, wallet: mem };
    },

    async buyWeekly() {
      if (!isLoggedIn()) {
        const r = guestDebit(WEEKLY_PRICE);
        if (!r.ok) return r;
        try {
          if (typeof window.addToCart === 'function') {
            window.addToCart(WEEKLY_SKU, WEEKLY_NAME + ' (LLT)', WEEKLY_PRICE);
          } else {
            const cart = JSON.parse(localStorage.getItem('laden_v12_cart') || '[]');
            const hit = cart.find(x => x.id === WEEKLY_SKU);
            if (hit) hit.qty += 1;
            else cart.push({ id: WEEKLY_SKU, name: WEEKLY_NAME + ' (LLT)', price: WEEKLY_PRICE, qty: 1 });
            localStorage.setItem('laden_v12_cart', JSON.stringify(cart));
          }
        } catch {}
        return r;
      }
      const { res, data } = await api('/llt/merch', {
        method: 'POST',
        body: JSON.stringify({ sku: WEEKLY_SKU }),
      });
      if (data && data.balance != null) applySnap(data);
      if (!res.ok || data.ok === false) {
        return { ok: false, error: data.error || 'merch_failed', wallet: current() };
      }
      try {
        if (typeof window.addToCart === 'function') {
          window.addToCart(WEEKLY_SKU, WEEKLY_NAME + ' (LLT)', WEEKLY_PRICE);
        } else {
          const cart = JSON.parse(localStorage.getItem('laden_v12_cart') || '[]');
          const hit = cart.find(x => x.id === WEEKLY_SKU);
          if (hit) hit.qty += 1;
          else cart.push({ id: WEEKLY_SKU, name: WEEKLY_NAME + ' (LLT)', price: WEEKLY_PRICE, qty: 1 });
          localStorage.setItem('laden_v12_cart', JSON.stringify(cart));
        }
      } catch {}
      return { ok: true, already: !!data.already, wallet: mem, ref: data.ref };
    },

    rewardForPoints(pts) {
      pts = Number(pts) || 0;
      return Math.max(5, Math.round(pts / 10));
    },

    mountBalances() {
      paint(current());
    },

    commercialHTML(compact) {
      const bal = apiObj.balance();
      const guestNudge = !isLoggedIn()
        ? `<p class="muted" style="margin:.4rem 0 0;font-size:.82rem">Want to keep your LLT? <a href="/account/">Create an account</a>.</p>`
        : '';
      if (compact) {
        return `<aside class="llt-ad llt-ad-compact">
          <div class="llt-ad-badge">LLT</div>
          <div>
            <strong>New challenges every week!</strong>
            <p class="muted">Earn <b>Laden Labs Tokens</b> · 1 LLT = 1 NOK · You have <span data-llt-balance>${bal}</span> LLT</p>
            ${guestNudge}
          </div>
          <a class="btn btn-primary" href="/challenges/">Play &amp; earn →</a>
        </aside>`;
      }
      return `<aside class="llt-ad">
        <div class="llt-ad-glow" aria-hidden="true"></div>
        <div class="llt-ad-badge">THIS WEEK</div>
        <h3>New challenges every week!</h3>
        <p>Hunt flags · play the mini-game · spend <b>Laden Labs Tokens (LLT)</b> on special hints &amp; the weekly merch drop.</p>
        <p class="llt-ad-rate mono">1 LLT = 1 NOK · starters get ${START} LLT</p>
        ${guestNudge}
        <div class="llt-ad-actions">
          <a class="btn btn-primary" href="/challenges/">Challenges + game</a>
          <a class="btn btn-ghost" href="/store/#llt-week">Weekly LLT offer</a>
          <span class="llt-pill">Balance: <b data-llt-balance>${bal}</b> LLT</span>
        </div>
      </aside>`;
    },

    injectCommercials() {
      document.querySelectorAll('[data-llt-ad]').forEach(slot => {
        const compact = slot.getAttribute('data-llt-ad') === 'compact';
        slot.innerHTML = apiObj.commercialHTML(compact);
      });
      apiObj.mountBalances();
    }
  };

  window.LLT = apiObj;

  if (!document.getElementById('llt-ad-css')) {
    const s = document.createElement('style');
    s.id = 'llt-ad-css';
    s.textContent = `
.llt-ad,.llt-ad-compact{position:relative;overflow:hidden;border-radius:16px;border:1px solid rgba(0,255,157,.28);
  background:linear-gradient(135deg,rgba(0,255,157,.1),rgba(0,229,255,.06) 50%,rgba(167,139,250,.08));
  padding:1.1rem 1.2rem;margin:1.25rem 0;box-shadow:0 12px 36px rgba(0,0,0,.35)}
.llt-ad-compact{display:flex;flex-wrap:wrap;gap:.85rem;align-items:center;justify-content:space-between}
.llt-ad h3{font-family:Orbitron,sans-serif;font-size:1.15rem;margin:.35rem 0 .5rem;
  background:linear-gradient(90deg,#e6f1ff,#00ff9d 60%,#00e5ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.llt-ad-badge{display:inline-block;font-size:.65rem;font-family:JetBrains Mono,monospace;letter-spacing:.08em;
  padding:.2rem .5rem;border-radius:999px;background:linear-gradient(90deg,#00ff9d,#00e5ff);color:#03140c;font-weight:700}
.llt-ad-rate{font-size:.8rem;color:var(--cyan);margin:.5rem 0}
.llt-ad-actions{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-top:.75rem}
.llt-pill{font-size:.85rem;padding:.4rem .75rem;border-radius:999px;border:1px solid rgba(0,255,157,.35);background:rgba(0,0,0,.25)}
.llt-ad-glow{position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,255,157,.25),transparent 70%);pointer-events:none}
.llt-wallet{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .7rem;border-radius:999px;
  border:1px solid rgba(0,255,157,.35);background:rgba(0,255,157,.08);font-size:.85rem}
.llt-wallet b{color:var(--green);font-family:JetBrains Mono,monospace}
`;
    document.head.appendChild(s);
  }

  function boot() {
    apiObj.mountBalances();
    apiObj.injectCommercials();
    if (isLoggedIn()) sync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
