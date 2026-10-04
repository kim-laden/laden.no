(() => {
  const KEY = 'laden_lld';
  const API = '/labs/api';
  const gate = document.getElementById('lld-gate');
  const main = document.getElementById('lld-main');
  let serverOptIn = null; // null = not synced yet; prefer API over localStorage

  function token() {
    try { return localStorage.getItem('laden_v12_token') || ''; } catch (_) { return ''; }
  }
  function hasSession() {
    return !!token();
  }
  function cacheOptedIn() {
    try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; }
  }
  function mirrorCache(on) {
    try {
      if (on) localStorage.setItem(KEY, '1');
      else localStorage.removeItem(KEY);
    } catch (_) {}
  }
  function optedIn() {
    if (serverOptIn === true) return true;
    if (serverOptIn === false) return false;
    // Fallback only before /me sync completes
    return cacheOptedIn();
  }

  function paint() {
    const ok = hasSession() && optedIn();
    if (gate) {
      gate.classList.toggle('show', !ok);
      gate.setAttribute('aria-hidden', ok ? 'true' : 'false');
    }
    if (main) main.classList.toggle('show', ok);
  }

  async function syncFromApi() {
    const tok = token();
    if (!tok) {
      serverOptIn = false;
      mirrorCache(false);
      paint();
      return;
    }
    try {
      const res = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + tok } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        serverOptIn = false;
        mirrorCache(false);
        paint();
        return;
      }
      const u = data.user || data;
      const on = !!(Number(u.lld_opt_in) === 1 || (u.settings && u.settings.lld_opt_in));
      serverOptIn = on;
      mirrorCache(on);
      paint();
    } catch (_) {
      // Keep gate up if we cannot confirm opt-in
      if (serverOptIn === null) {
        serverOptIn = false;
        paint();
      }
    }
  }

  paint();
  syncFromApi();
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === 'laden_v12_token') {
      if (e.key === 'laden_v12_token') syncFromApi();
      else paint();
    }
  });
  window.addEventListener('laden-auth', () => { syncFromApi(); });
  window.addEventListener('laden-lld', paint);
})();
