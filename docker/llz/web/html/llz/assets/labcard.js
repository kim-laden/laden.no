/* Shared nav brand title: keep the lockup consistent on every page. */
(function () {
  function pageLabel(path) {
    path = String(path || '/').replace(/\/+$/, '') || '/';
    if (path === '/') return '';
    if (path === '/oracle') return 'Oracle';
    if (path === '/forum') return 'Forum';
    if (path === '/gear') return 'Gear';
    if (path === '/challenges') return 'Challenges';
    if (path === '/community/u' || path.indexOf('/community/u/') === 0) return 'Profile';
    if (path === '/community') return 'Community';
    if (path === '/messages') return 'Messages';
    if (path === '/labs') return 'Lounge';
    if (path === '/labs/z-guide' || path.indexOf('/labs/z-guide/') === 0) return 'Z Guide';
    if (path === '/labs/manuals' || path.indexOf('/labs/manuals/') === 0) return 'Manuals';
    if (path === '/lld') return 'Developer';
    if (path === '/account') return 'Account';
    if (path === '/tips' || path.indexOf('/tips/') === 0) return 'Tips';
    if (path === '/terminal') return 'Console';
    if (path === '/store') return 'Store';
    if (path === '/games' || path.indexOf('/games/') === 0) return 'Arcade';
    if (path === '/lla') return 'Admin';
    if (path === '/zocial' || path.indexOf('/zocial/') === 0) return 'Profile';
    if (path.indexOf('/labs/') === 0) return 'Lab';
    return '';
  }

  function updateBrandTitle() {
    var brand = document.querySelector('header a.brand, a.brand');
    if (!brand) return;

    var logo = brand.querySelector('img.brand-logo');
    var name = brand.querySelector('.brand-name');
    var page = brand.querySelector('.brand-page');
    if (!name || !page) {
      var lockup = document.createElement('div');
      lockup.className = 'brand-text';
      name = document.createElement('span');
      name.className = 'brand-name';
      page = document.createElement('span');
      page.className = 'brand-page';
      lockup.appendChild(name);
      lockup.appendChild(page);
      brand.replaceChildren();
      if (logo) brand.appendChild(logo);
      brand.appendChild(lockup);
    }

    name.innerHTML = "Laden Lab'<span class=\"brand-z\">z</span>";
    var _pl = pageLabel(window.location && window.location.pathname); page.textContent = _pl ? (' ' + _pl) : '';
    if (logo) logo.alt = "Laden Lab'z";
  }

  if (typeof window.updateBrandTitle !== 'function') window.updateBrandTitle = updateBrandTitle;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.updateBrandTitle(); });
  else window.updateBrandTitle();
})();

/* Laden Labs ID card — hover the nav username / Login button */
(function () {
  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';
  const NICK_KEY = 'laden_guest_nick';
  const CACHE_KEY = 'laden_labcard_v1';
  const SKINS = [
    'default',
    'neon-grid',
    'purple-haze',
    'ice-ops',
    'ember',
    'matrix',
    'gold-op',
    'void',
  ];
  const SKIN_META = {
    default: { label: 'Default', blurb: 'Classic ops green' },
    'neon-grid': { label: 'Neon Grid', blurb: 'Cyan grid glow' },
    'purple-haze': { label: 'Purple Haze', blurb: 'Violet haze' },
    'ice-ops': { label: 'Ice Ops', blurb: 'Frost blue' },
    ember: { label: 'Ember', blurb: 'Hot amber' },
    matrix: { label: 'Matrix', blurb: 'Terminal rain' },
    'gold-op': { label: 'Gold Op', blurb: 'VIP gold' },
    void: { label: 'Void', blurb: 'Deep space' },
  };
  const COST = 10;

  // On lounge pages, let opted-in users jump from Lounge to LLD.
  // Keep this scoped to /labs/ so the site-wide Lounge CTA is unchanged.
  let lldOptInCached = false;
  try { lldOptInCached = localStorage.getItem('laden_lld') === '1'; } catch {}
  function mirrorLldCache(on) {
    try {
      if (on) localStorage.setItem('laden_lld', '1');
      else localStorage.removeItem('laden_lld');
    } catch {}
    lldOptInCached = !!on;
  }
  function updateLoungeNav() {
    const path = (window.location && window.location.pathname || '').replace(/\/+$/, '') || '/';
    // Lounge hub only (/labs). Outside lounge (and individual labs) keep Lounge CTA.
    if (path !== '/labs') return;
    const cta = document.querySelector(
      'header .nav-cta a[data-lounge-nav-cta], header .nav-cta a.btn.btn-primary[href="/labs/"]'
    );
    if (!cta) return;
    let label = cta.querySelector('[data-lounge-nav-label], [data-i18n="nav.lounge"]');
    if (!label) {
      label = document.createElement('span');
      cta.replaceChildren(label);
    }
    cta.setAttribute('data-lounge-nav-cta', '');
    label.setAttribute('data-lounge-nav-label', '');
    // Only show dev. when this account opted in (token + server/cache flag)
    const optedIn = !!(token() && lldOptInCached);
    if (optedIn) {
      cta.href = '/lld/';
      cta.classList.add('lld-nav-cta');
      cta.setAttribute('aria-label', 'dev.');
      label.removeAttribute('data-i18n');
      label.textContent = 'dev.';
    } else {
      cta.href = '/labs/';
      cta.classList.remove('lld-nav-cta');
      cta.removeAttribute('aria-label');
      label.setAttribute('data-i18n', 'nav.lounge');
      label.textContent = window.LadenI18n && typeof LadenI18n.t === 'function' ? LadenI18n.t('nav.lounge') : 'Lounge';
    }
  }
  async function syncLldFromMe() {
    if (!token()) {
      mirrorLldCache(false);
      updateLoungeNav();
      return;
    }
    try {
      const res = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + token() } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        mirrorLldCache(false);
        updateLoungeNav();
        return;
      }
      const u = data.user || data;
      const on = !!(Number(u.lld_opt_in) === 1 || (u.settings && u.settings.lld_opt_in));
      mirrorLldCache(on);
      updateLoungeNav();
    } catch {
      // If /me fails, force-clear so stale localStorage cannot show Dev
      mirrorLldCache(false);
      updateLoungeNav();
    }
  }

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function jwtUser() {
    const t = token();
    if (!t) return null;
    try {
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (p.exp && Date.now() / 1000 > p.exp) return null;
      const usr = p.usr || p.username || p.sub;
      return usr ? { username: usr } : null;
    } catch { return null; }
  }
  function guestNick() {
    try { return (sessionStorage.getItem(NICK_KEY) || '').trim(); } catch { return ''; }
  }
  function lltBal() {
    try {
      if (window.LLT && typeof window.LLT.balance === 'function') return window.LLT.balance();
    } catch {}
    return 100;
  }
  function normalizeSkin(s) {
    s = String(s || 'default').trim();
    return SKINS.indexOf(s) >= 0 ? s : 'default';
  }
  function initials(name, nick) {
    const s = (name || nick || '?').trim();
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  }
  function hueFrom(str) {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 360;
  }
  function avatarDataUri(name, nick) {
    const ini = initials(name, nick);
    const h = hueFrom(nick || name || 'guest');
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="hsl(' + h + ',70%,45%)"/>' +
      '<stop offset="100%" stop-color="hsl(' + ((h + 40) % 360) + ',80%,35%)"/>' +
      '</linearGradient></defs>' +
      '<rect width="96" height="96" rx="18" fill="url(#g)"/>' +
      '<text x="48" y="54" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="28" font-weight="700" fill="#03140c">' +
      ini.replace(/[<>&]/g, '') +
      '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  let profile = null; // { username, display_name, llt, xp, role, labcard_skin }
  let mountedCard = null;

  function clearCache() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch {}
  }

  async function fetchProfile(force) {
    const ju = jwtUser();
    if (!ju) {
      profile = null;
      return null;
    }
    if (!force) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached && cached.username === ju.username && Date.now() - (cached._ts || 0) < 60000) {
          profile = cached;
          return profile;
        }
      } catch {}
    }
    try {
      const res = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + token() } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { profile = null; return null; }
      const u = data.user || data;
      profile = {
        username: u.username || ju.username,
        display_name: u.display_name || u.username || ju.username,
        llt: u.llt != null ? u.llt : lltBal(),
        xp: u.xp || 0,
        role: u.role || 'member',
        title: u.title || '',
        title_label: u.title_label || '',
        lab_id: u.lab_id || (u.id != null ? ('969-' + String(u.id).padStart(3, '0')) : ''),
        id: u.id || null,
        labcard_skin: normalizeSkin(u.labcard_skin),
        avatar_id: (window.LadenAvatars && window.LadenAvatars.normalize)
          ? window.LadenAvatars.normalize(u.avatar_id || u.avatar || '')
          : String(u.avatar_id || u.avatar || '').trim(),
        _ts: Date.now(),
      };
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(profile)); } catch {}
      return profile;
    } catch {
      profile = {
        username: ju.username,
        display_name: ju.username,
        llt: lltBal(),
        xp: 0,
        role: 'member',
        title: '',
        title_label: '',
        lab_id: '',
        id: null,
        labcard_skin: 'default',
        avatar_id: '',
        _ts: Date.now(),
      };
      return profile;
    }
  }

  function paintNavButton(btn) {
    if (!btn) return;
    const ju = jwtUser();
    const p = profile && ju && profile.username === ju.username ? profile : ju;
    if (!ju || !p || !p.username) {
      btn.textContent = window.LadenI18n ? LadenI18n.t('nav.login') : 'Login';
      btn.removeAttribute('aria-label');
      btn.removeAttribute('title');
      return;
    }
    const username = String(p.username);
    const avatarId = String(p.avatar_id || '').trim();
    btn.textContent = '';
    const avatar = document.createElement('span');
    avatar.className = 'nav-account-av';
    avatar.setAttribute('aria-hidden', 'true');
    let rendered = false;
    if (avatarId && window.LadenAvatars && typeof window.LadenAvatars.html === 'function') {
      try {
        window.LadenAvatars.ensureCss && window.LadenAvatars.ensureCss();
        avatar.innerHTML = window.LadenAvatars.html(avatarId, 'sm');
        rendered = !!avatar.firstElementChild;
      } catch {}
    }
    if (!rendered) {
      const img = document.createElement('img');
      img.className = 'nav-account-fallback';
      img.alt = '';
      img.width = 22;
      img.height = 22;
      img.src = avatarDataUri(p.display_name || username, username);
      avatar.appendChild(img);
    }
    const label = document.createElement('span');
    label.className = 'nav-account-name';
    label.textContent = username;
    btn.appendChild(avatar);
    btn.appendChild(label);
    btn.setAttribute('aria-label', window.LadenI18n ? LadenI18n.t('auth.accountOf', {name: username}) : ('Account: ' + username));
    btn.setAttribute('title', username);
  }

  function injectCss() {
    try {
      if (window.LadenAvatars && window.LadenAvatars.ensureCss) window.LadenAvatars.ensureCss();
    } catch {}
    if (document.getElementById('labcard-css')) return;
    const s = document.createElement('style');
    s.id = 'labcard-css';
    s.textContent = `
.nav-labcard{position:relative;display:inline-flex;align-items:center}
.nav-labcard > a#nav-account,.nav-labcard > a#nav-account-btn{position:relative;z-index:2}
.labcard{
  position:absolute;top:100%;right:0;width:280px;z-index:80;
  padding:.55rem 0 0;opacity:0;visibility:hidden;transform:translateY(-6px) scale(.98);
  transition:opacity .18s ease,transform .18s ease,visibility .18s;
  pointer-events:none;
  filter:drop-shadow(0 18px 40px rgba(0,0,0,.55));
}
.labcard::before{
  content:"";display:block;height:.55rem;margin-top:-.55rem;
}
.nav-labcard:hover .labcard,.nav-labcard:focus-within .labcard,.labcard:hover,.labcard.is-open{
  opacity:1;visibility:visible;transform:translateY(0) scale(1);pointer-events:auto;
}
@media (max-width:900px){
  .nav-labcard{position:static}
  .labcard{
    position:fixed;top:auto;bottom:calc(72px + env(safe-area-inset-bottom,0px));
    left:12px;right:12px;width:auto;max-width:420px;margin:0 auto;
    z-index:12050;padding:.35rem 0 0;
    transform:translateY(12px) scale(.98);
    opacity:0;visibility:hidden;pointer-events:none;
  }
  /* Touch sticky-hover/focus must NOT show or hide over is-open */
  .nav-labcard:hover .labcard,
  .nav-labcard:focus-within .labcard,
  .labcard:hover{
    opacity:0;visibility:hidden;pointer-events:none;transform:translateY(12px) scale(.98);
  }
  .labcard.is-open,
  .nav-labcard:hover .labcard.is-open,
  .nav-labcard:focus-within .labcard.is-open,
  .labcard.is-open:hover{
    opacity:1 !important;visibility:visible !important;
    transform:translateY(0) scale(1) !important;pointer-events:auto !important;
  }
  /* Real mouse/trackpad on a narrow window can still hover-open */
  @media (hover:hover) and (pointer:fine){
    .nav-labcard:hover .labcard:not(.is-open),
    .nav-labcard:focus-within .labcard:not(.is-open){
      opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1);
    }
  }
  .labcard::before{display:none}
  .labcard-inner{max-height:min(70vh,520px);overflow:auto;-webkit-overflow-scrolling:touch}
  body.labcard-open{overflow:hidden}
  .labcard-backdrop{
    display:block;position:fixed;inset:0;z-index:12040;background:rgba(0,0,0,.55);
    opacity:0;pointer-events:none;transition:opacity .18s ease;
  }
  .labcard-backdrop.is-open{opacity:1;pointer-events:auto}
}

.labcard-inner{
  position:relative;overflow:hidden;border-radius:16px;
  border:1px solid rgba(0,255,157,.4);
  background:
    linear-gradient(145deg,rgba(6,18,14,.97),rgba(4,12,20,.98) 55%,rgba(10,8,24,.98)),
    radial-gradient(circle at 100% 0%,rgba(0,255,157,.18),transparent 45%);
  padding:1rem 1rem 1.05rem;
  --lc-accent:#00ff9d; --lc-accent2:#00e5ff; --lc-glow:rgba(0,255,157,.45);
}
.labcard-inner::before{
  content:"";position:absolute;inset:0;background:
    repeating-linear-gradient(-45deg,transparent,transparent 8px,rgba(0,255,157,.03) 8px,rgba(0,255,157,.03) 9px);
  pointer-events:none;
}
.labcard-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;position:relative}
.labcard-badge{
  font-family:JetBrains Mono,monospace;font-size:.62rem;letter-spacing:.12em;font-weight:700;
  padding:.2rem .45rem;border-radius:999px;background:linear-gradient(90deg,var(--lc-accent),var(--lc-accent2));color:#03140c;
}
.labcard-id{font-family:JetBrains Mono,monospace;font-size:.65rem;color:rgba(230,241,255,.55)}
.labcard-body{display:flex;gap:.85rem;align-items:center;position:relative}
.labcard-avatar{
  width:64px;height:64px;border-radius:16px;object-fit:cover;flex-shrink:0;
  border:2px solid var(--lc-glow);box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 18px color-mix(in srgb, var(--lc-accent) 35%, transparent);
  background:#0a1612;
}
.labcard-meta{min-width:0;flex:1}
.labcard-name{
  font-family:Orbitron,sans-serif;font-size:.95rem;font-weight:700;color:#e6f1ff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 .15rem;
}
.labcard-nick{font-family:JetBrains Mono,monospace;font-size:.78rem;color:var(--lc-accent2);margin:0 0 .45rem}
.labcard-row{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
.labcard-pill{
  font-size:.72rem;font-family:JetBrains Mono,monospace;padding:.25rem .5rem;border-radius:999px;
  border:1px solid color-mix(in srgb, var(--lc-accent) 40%, transparent);background:color-mix(in srgb, var(--lc-accent) 10%, transparent);color:#e6f1ff;
}
.labcard-pill b{color:var(--lc-accent)}
.labcard-foot{
  margin-top:.85rem;padding-top:.65rem;border-top:1px solid color-mix(in srgb, var(--lc-accent) 18%, transparent);
  font-size:.68rem;color:rgba(230,241,255,.45);font-family:JetBrains Mono,monospace;position:relative;
}
.labcard-guest .labcard-badge{background:linear-gradient(90deg,#a78bfa,#00e5ff)}

.labcard-foot-row{display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap}
.labcard-role{font-size:.65rem;color:rgba(230,241,255,.4);letter-spacing:.04em}
.labcard-logout{
  font-family:JetBrains Mono,monospace;font-size:.68rem;padding:.28rem .55rem;border-radius:8px;cursor:pointer;
  border:1px solid rgba(255,107,122,.45);background:rgba(255,107,122,.1);color:#ff8a8a;
}
.labcard-logout:hover{background:rgba(255,107,122,.22);border-color:rgba(255,107,122,.7)}
.labcard-title-pill{
  font-size:.68rem;font-family:JetBrains Mono,monospace;padding:.2rem .45rem;border-radius:999px;
  border:1px solid color-mix(in srgb, var(--lc-accent2) 45%, transparent);
  background:color-mix(in srgb, var(--lc-accent2) 12%, transparent);color:var(--lc-accent2);
  letter-spacing:.06em;text-transform:uppercase;
}

/* --- Account page: full-width Lab ID presentation --- */
.labcard-account .labcard-inner{
  padding:1.5rem 1.6rem 1.25rem;
}
.labcard-account-layout{
  display:grid;grid-template-columns:minmax(255px,.9fr) minmax(360px,1.1fr);
  gap:1.5rem;align-items:stretch;position:relative;
}
.labcard-account .labcard-identity{
  display:flex;flex-direction:column;justify-content:space-between;min-width:0;
  padding:.35rem .2rem .15rem;
}
.labcard-account .labcard-identity-main{
  display:flex;align-items:center;gap:1.25rem;min-width:0;
}
.labcard-account .labcard-identity .labcard-avatar-slot,
.labcard-account .labcard-identity .labcard-avatar-slot .laden-av,
.labcard-account .labcard-identity img.labcard-avatar{
  width:220px;height:220px;border-radius:36px;
}
.labcard-account .labcard-identity .labcard-avatar-slot{
  overflow:hidden;box-shadow:0 0 0 1px color-mix(in srgb,var(--lc-accent) 55%,transparent),0 0 32px color-mix(in srgb,var(--lc-accent) 24%,transparent);
}
.labcard-account .labcard-name{font-size:1.85rem;line-height:1.12;margin:0 0 .35rem}
.labcard-account .labcard-nick{font-size:.95rem;margin-bottom:.8rem}
.labcard-account .labcard-title-pill{font-size:.78rem;padding:.32rem .62rem}
.labcard-account .labcard-stats{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;
}
.labcard-account .labcard-stat-tile{
  min-height:82px;padding:.8rem .9rem;border:1px solid color-mix(in srgb,var(--lc-accent) 24%,transparent);
  border-radius:13px;background:rgba(0,0,0,.2);display:flex;flex-direction:column;justify-content:center;
}
.labcard-account .labcard-stat-label{
  font:700 .64rem/1.2 JetBrains Mono,monospace;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(230,241,255,.5);margin-bottom:.3rem;
}
.labcard-account .labcard-stat-value{
  color:#e6f1ff;font:700 1.15rem/1.2 Orbitron,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.labcard-account .labcard-stat-value.mono{font-family:JetBrains Mono,monospace;font-size:1.05rem;color:var(--lc-accent)}
.labcard-account .labcard-stat-title{font:700 .84rem/1.25 JetBrains Mono,monospace;color:var(--lc-accent2);white-space:normal}
.labcard-account .labcard-id{font-size:.85rem;color:var(--lc-accent2);letter-spacing:.08em}
.labcard-account .labcard-foot{margin-top:1.35rem;padding-top:.9rem}
@media (max-width:760px){
  .labcard-account-layout{grid-template-columns:1fr;gap:1.2rem}
  .labcard-account .labcard-identity-main{align-items:flex-start}
}
@media (max-width:520px){
  .labcard-account .labcard-inner{padding:1.1rem}
  .labcard-account .labcard-identity-main{gap:.9rem}
  .labcard-account .labcard-identity .labcard-avatar-slot,
  .labcard-account .labcard-identity .labcard-avatar-slot .laden-av,
  .labcard-account .labcard-identity img.labcard-avatar{width:148px;height:148px;border-radius:28px}
  .labcard-account .labcard-name{font-size:1.35rem}
  .labcard-account .labcard-stats{gap:.55rem}
  .labcard-account .labcard-stat-tile{min-height:70px;padding:.65rem}
}

/* --- skins --- */
.labcard[data-skin="neon-grid"] .labcard-inner{
  --lc-accent:#00e5ff; --lc-accent2:#7cfcff; --lc-glow:rgba(0,229,255,.55);
  border-color:rgba(0,229,255,.55);
  background:
    linear-gradient(145deg,rgba(2,12,24,.98),rgba(4,8,20,.98) 55%,rgba(0,20,32,.98)),
    radial-gradient(circle at 0% 100%,rgba(0,229,255,.22),transparent 50%);
  box-shadow:inset 0 0 0 1px rgba(0,229,255,.12),0 0 28px rgba(0,229,255,.18);
}
.labcard[data-skin="neon-grid"] .labcard-inner::before{
  background:
    linear-gradient(rgba(0,229,255,.07) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,229,255,.07) 1px,transparent 1px);
  background-size:14px 14px;
}

.labcard[data-skin="purple-haze"] .labcard-inner{
  --lc-accent:#c084fc; --lc-accent2:#e879f9; --lc-glow:rgba(192,132,252,.55);
  border-color:rgba(192,132,252,.5);
  background:
    linear-gradient(145deg,rgba(18,8,28,.98),rgba(10,6,22,.98) 50%,rgba(20,10,36,.98)),
    radial-gradient(circle at 90% 10%,rgba(232,121,249,.28),transparent 45%);
}
.labcard[data-skin="purple-haze"] .labcard-inner::before{
  background:radial-gradient(ellipse at 30% 120%,rgba(167,139,250,.2),transparent 55%),
    repeating-linear-gradient(120deg,transparent,transparent 10px,rgba(192,132,252,.04) 10px,rgba(192,132,252,.04) 11px);
}

.labcard[data-skin="ice-ops"] .labcard-inner{
  --lc-accent:#93c5fd; --lc-accent2:#e0f2fe; --lc-glow:rgba(147,197,253,.55);
  border-color:rgba(147,197,253,.55);
  background:
    linear-gradient(160deg,rgba(8,16,28,.98),rgba(12,22,36,.98) 60%,rgba(6,14,26,.98)),
    radial-gradient(circle at 80% 0%,rgba(186,230,253,.25),transparent 40%);
}
.labcard[data-skin="ice-ops"] .labcard-inner::before{
  background:repeating-linear-gradient(0deg,transparent,transparent 6px,rgba(186,230,253,.05) 6px,rgba(186,230,253,.05) 7px);
}

.labcard[data-skin="ember"] .labcard-inner{
  --lc-accent:#fb923c; --lc-accent2:#fbbf24; --lc-glow:rgba(251,146,60,.55);
  border-color:rgba(251,146,60,.5);
  background:
    linear-gradient(145deg,rgba(28,10,6,.98),rgba(18,8,6,.98) 55%,rgba(32,12,8,.98)),
    radial-gradient(circle at 100% 100%,rgba(239,68,68,.28),transparent 45%);
}
.labcard[data-skin="ember"] .labcard-inner::before{
  background:radial-gradient(circle at 20% 0%,rgba(251,191,36,.15),transparent 40%),
    repeating-linear-gradient(45deg,transparent,transparent 9px,rgba(251,146,60,.04) 9px,rgba(251,146,60,.04) 10px);
}

.labcard[data-skin="matrix"] .labcard-inner{
  --lc-accent:#22c55e; --lc-accent2:#86efac; --lc-glow:rgba(34,197,94,.55);
  border-color:rgba(34,197,94,.5);
  background:linear-gradient(180deg,#020805,#041008 40%,#030a06);
  font-variant-numeric:tabular-nums;
}
.labcard[data-skin="matrix"] .labcard-inner::before{
  background:
    repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(34,197,94,.06) 3px,rgba(34,197,94,.06) 4px),
    repeating-linear-gradient(90deg,transparent,transparent 11px,rgba(34,197,94,.04) 11px,rgba(34,197,94,.04) 12px);
}
.labcard[data-skin="matrix"] .labcard-name,
.labcard[data-skin="matrix"] .labcard-nick{color:#86efac;text-shadow:0 0 8px rgba(34,197,94,.45)}

.labcard[data-skin="gold-op"] .labcard-inner{
  --lc-accent:#fbbf24; --lc-accent2:#fde68a; --lc-glow:rgba(251,191,36,.55);
  border-color:rgba(251,191,36,.55);
  background:
    linear-gradient(145deg,rgba(24,18,6,.98),rgba(16,12,4,.98) 55%,rgba(28,20,8,.98)),
    radial-gradient(circle at 50% 0%,rgba(251,191,36,.22),transparent 50%);
  box-shadow:inset 0 0 24px rgba(251,191,36,.08),0 0 20px rgba(251,191,36,.12);
}
.labcard[data-skin="gold-op"] .labcard-inner::before{
  background:repeating-linear-gradient(-30deg,transparent,transparent 12px,rgba(251,191,36,.05) 12px,rgba(251,191,36,.05) 13px);
}
.labcard[data-skin="gold-op"] .labcard-badge{color:#1a1200}

.labcard[data-skin="void"] .labcard-inner{
  --lc-accent:#a78bfa; --lc-accent2:#67e8f9; --lc-glow:rgba(167,139,250,.5);
  border-color:rgba(167,139,250,.4);
  background:
    radial-gradient(circle at 20% 30%,rgba(99,102,241,.25),transparent 35%),
    radial-gradient(circle at 80% 70%,rgba(34,211,238,.18),transparent 40%),
    linear-gradient(160deg,#05050a,#0a0614 50%,#04040c);
}
.labcard[data-skin="void"] .labcard-inner::before{
  background:radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.5),transparent),
    radial-gradient(1px 1px at 70% 60%,rgba(255,255,255,.35),transparent),
    radial-gradient(1.5px 1.5px at 40% 80%,rgba(255,255,255,.4),transparent),
    radial-gradient(1px 1px at 85% 20%,rgba(255,255,255,.3),transparent);
}

/* ≤640 popover tweaks only on desktop widths; mobile sheet is handled above */
@media (min-width:901px) and (max-width:1100px){
  .labcard{width:min(280px,92vw)}
}

/* Account picker previews */
.labcard-skin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;margin:1rem 0}
.labcard-skin-opt{
  cursor:pointer;border-radius:14px;padding:.65rem;text-align:left;
  border:1px solid rgba(230,241,255,.12);background:rgba(0,0,0,.25);
  transition:border-color .15s,box-shadow .15s,transform .15s;
}
.labcard-skin-opt:hover{transform:translateY(-2px);border-color:rgba(0,255,157,.35)}
.labcard-skin-opt.is-selected{border-color:rgba(0,255,157,.65);box-shadow:0 0 0 1px rgba(0,255,157,.25),0 8px 24px rgba(0,0,0,.35)}
.labcard-skin-preview{
  height:64px;border-radius:10px;margin-bottom:.5rem;border:1px solid rgba(255,255,255,.1);
  position:relative;overflow:hidden;
}
.labcard-skin-preview::after{
  content:"";position:absolute;left:.55rem;top:.55rem;width:2.2rem;height:.55rem;border-radius:999px;
  background:linear-gradient(90deg,var(--pv-a,#00ff9d),var(--pv-b,#00e5ff));
}
.labcard-skin-opt strong{display:block;font-size:.85rem;color:#e6f1ff}
.labcard-skin-opt span{font-size:.72rem;color:rgba(230,241,255,.5);font-family:JetBrains Mono,monospace}
.labcard-skin-preview.pv-default{--pv-a:#00ff9d;--pv-b:#00e5ff;background:linear-gradient(145deg,#06120e,#0a0818)}
.labcard-skin-preview.pv-neon-grid{--pv-a:#00e5ff;--pv-b:#7cfcff;background:linear-gradient(145deg,#020c18,#001420);
  background-image:linear-gradient(rgba(0,229,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.12) 1px,transparent 1px),linear-gradient(145deg,#020c18,#001420);background-size:10px 10px,10px 10px,auto}
.labcard-skin-preview.pv-purple-haze{--pv-a:#c084fc;--pv-b:#e879f9;background:linear-gradient(145deg,#12081c,#140a24)}
.labcard-skin-preview.pv-ice-ops{--pv-a:#93c5fd;--pv-b:#e0f2fe;background:linear-gradient(160deg,#08101c,#0c1624)}
.labcard-skin-preview.pv-ember{--pv-a:#fb923c;--pv-b:#fbbf24;background:linear-gradient(145deg,#1c0a06,#200c08)}
.labcard-skin-preview.pv-matrix{--pv-a:#22c55e;--pv-b:#86efac;background:linear-gradient(180deg,#020805,#041008)}
.labcard-skin-preview.pv-gold-op{--pv-a:#fbbf24;--pv-b:#fde68a;background:linear-gradient(145deg,#181206,#1c1408)}
.labcard-skin-preview.pv-void{--pv-a:#a78bfa;--pv-b:#67e8f9;background:radial-gradient(circle at 30% 40%,#1e1b4b,#05050a 70%)}
.labcard-skin-actions{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.35rem}
.labcard-skin-msg{font-size:.82rem;min-height:1.2em;margin:.4rem 0 0}
`;
    document.head.appendChild(s);
  }

  function renderCard(el, data) {
    const member = !!data.member;
    const account = data.variant === 'account';
    const lounge = /^\/labs(?:\/|$)/.test((window.location && window.location.pathname) || '');
    const name = data.name || 'Operator';
    const nick = data.nick || 'guest';
    const bal = data.llt != null ? data.llt : lltBal();
    const xp = data.xp;
    const role = data.role || (member ? 'member' : 'guest');
    const titleLabel = (data.title_label || '').trim();
    const titleId = (data.title || '').trim();
    const labId = (data.lab_id || '').trim();
    const skin = member ? normalizeSkin(data.skin) : 'default';
    const avatarId = member ? String(data.avatar || data.avatar_id || '').trim() : '';
    const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
    });
    let avHtml = '';
    if (avatarId && window.LadenAvatars && window.LadenAvatars.html) {
      try { window.LadenAvatars.ensureCss && window.LadenAvatars.ensureCss(); } catch {}
      avHtml = '<div class="labcard-avatar-slot">' + window.LadenAvatars.html(avatarId) + '</div>';
    }
    if (!avHtml) {
      const av = avatarDataUri(name, nick);
      avHtml = '<div class="labcard-avatar-slot has-initials"><img class="labcard-avatar" alt="" width="64" height="64" src="' + av + '"></div>';
    }
    const idText = member ? (labId || '969-???') : 'GUEST';
    const titleText = titleLabel || titleId;
    const titleHtml = (member && titleText)
      ? '<span class="labcard-title-pill">' + esc(titleText) + '</span>' : '';
    const roleSecondary = member
      ? '<span class="labcard-role">' + (titleHtml ? ('role · ' + esc(role)) : esc(role).toUpperCase()) + '</span>' : '';
    el.className = 'labcard' + (member ? '' : ' labcard-guest') + (account ? ' labcard-account' : '');
    el.setAttribute('data-skin', skin);
    const accountLayout = account
      ? '<div class="labcard-account-layout">' +
        '<div class="labcard-identity">' +
          '<div class="labcard-identity-main">' + avHtml +
            '<div class="labcard-meta">' +
              '<p class="labcard-name" title="' + esc(name) + '">' + esc(name) + '</p>' +
              '<p class="labcard-nick">@' + esc(nick) + '</p>' + titleHtml +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="labcard-stats">' +
          '<div class="labcard-stat-tile"><span class="labcard-stat-label">XP</span><strong class="labcard-stat-value mono" data-llt-xp>' + (xp != null ? esc(xp) : '—') + '</strong></div>' +
          '<div class="labcard-stat-tile"><span class="labcard-stat-label">LLT balance</span><strong class="labcard-stat-value mono" data-llt-balance>' + esc(bal) + '</strong></div>' +
          '<div class="labcard-stat-tile"><span class="labcard-stat-label">Title</span><span class="labcard-stat-value labcard-stat-title">' + esc(titleText || 'No title equipped') + '</span></div>' +
          '<div class="labcard-stat-tile"><span class="labcard-stat-label">Role</span><span class="labcard-stat-value labcard-stat-title">' + esc(role) + '</span></div>' +
          '<div class="labcard-stat-tile"><span class="labcard-stat-label">Skin</span><span class="labcard-stat-value labcard-stat-title">' + esc(skin) + '</span></div>' +
        '</div>' +
      '</div>'
      : '<div class="labcard-body">' + avHtml + '<div class="labcard-meta">' +
          '<p class="labcard-name" title="' + esc(name) + '">' + esc(name) + '</p>' +
          '<p class="labcard-nick">@' + esc(nick) + '</p>' +
          '<div class="labcard-row">' + titleHtml +
            '<span class="labcard-pill">LLT <b data-llt-balance>' + esc(bal) + '</b></span>' +
            (xp != null ? '<span class="labcard-pill">XP <b data-llt-xp>' + esc(xp) + '</b></span>' : '') +
          '</div></div></div>';
    el.innerHTML =
      '<div class="labcard-inner">' +
      '<div class="labcard-top">' +
        '<span class="labcard-badge">' + (member ? 'LAB ID' : 'GUEST PASS') + '</span>' +
        '<span class="labcard-id">' + esc(idText) + '</span>' +
      '</div>' + accountLayout +
      '<div class="labcard-foot"><div class="labcard-foot-row">' +
        '<span>' + (member
          ? (roleSecondary + (roleSecondary ? ' · ' : '') + 'skin <b style="color:var(--lc-accent)">' + esc(skin) + '</b>'
            + ' · <a href="/account/" class="labcard-account-link" style="color:var(--cyan,#00e5ff)">Account</a>')
          : 'Session only · <a href="/account/" style="color:var(--cyan,#00e5ff)">create account</a>') +
        '</span>' +
        (member && !lounge ? '<button type="button" class="labcard-logout" data-labcard-logout>Log out</button>' : '') +
      '</div></div></div>';
    const lo = el.querySelector('[data-labcard-logout]');
    if (lo) lo.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); doLogout(); });
  }

  function paintFromState(card) {
    if (!card) return;
    const ju = jwtUser();
    if (ju && profile) {
      renderCard(card, {
        member: true,
        name: profile.display_name,
        nick: profile.username,
        llt: (window.LLT && window.LLT.balance) ? window.LLT.balance() : profile.llt,
        xp: (window.LLT && window.LLT.get && window.LLT.get().xp != null) ? window.LLT.get().xp : profile.xp,
        role: profile.role,
        title: profile.title || '',
        title_label: profile.title_label || '',
        lab_id: profile.lab_id || '',
        skin: profile.labcard_skin,
        avatar_id: profile.avatar_id || '',
        avatar: profile.avatar_id || '',
      });
      return;
    }
    if (ju) {
      renderCard(card, {
        member: true,
        name: ju.username,
        nick: ju.username,
        llt: lltBal(),
        xp: null,
        role: 'member',
        skin: 'default',
      });
      return;
    }
    const g = guestNick();
    renderCard(card, {
      member: false,
      name: g || 'Guest hunter',
      nick: g || 'guest',
      llt: lltBal(),
      xp: null,
      role: 'guest',
      skin: 'default',
    });
  }

  async function refresh(force) {
    await fetchProfile(!!force);
    document.querySelectorAll('#nav-account,#nav-account-btn').forEach(paintNavButton);
    if (mountedCard) paintFromState(mountedCard);
    try { window.dispatchEvent(new CustomEvent('labcard-change', { detail: { skin: profile && profile.labcard_skin } })); } catch {}
    return profile;
  }

  function setLocalSkin(skin) {
    skin = normalizeSkin(skin);
    if (profile) {
      profile.labcard_skin = skin;
      profile._ts = Date.now();
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(profile)); } catch {}
    }
    if (mountedCard) paintFromState(mountedCard);
  }

  function setLocalAvatar(avatarId) {
    avatarId = (window.LadenAvatars && window.LadenAvatars.normalize)
      ? window.LadenAvatars.normalize(avatarId)
      : String(avatarId || '').trim();
    if (profile) {
      profile.avatar_id = avatarId;
      profile._ts = Date.now();
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(profile)); } catch {}
    }
    document.querySelectorAll('#nav-account,#nav-account-btn').forEach(paintNavButton);
    if (mountedCard) paintFromState(mountedCard);
  }

  async function mount() {
    updateLoungeNav();
    try { syncLldFromMe(); } catch {}
    const btn = document.getElementById('nav-account') || document.getElementById('nav-account-btn');
    if (!btn || btn.closest('.nav-labcard')) return;
    injectCss();
    const wrap = document.createElement('div');
    wrap.className = 'nav-labcard';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    const card = document.createElement('div');
    card.className = 'labcard';
    card.setAttribute('role', 'tooltip');
    card.setAttribute('data-skin', 'default');
    wrap.appendChild(card);
    mountedCard = card;
    paintNavButton(btn);
    paintFromState(card);
    await fetchProfile();
    paintNavButton(btn);
    paintFromState(card);
    window.addEventListener('llt-change', () => paintFromState(card));
    window.addEventListener('laden-nick', () => paintFromState(card));

    let backdrop = document.getElementById('labcard-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'labcard-backdrop';
      backdrop.className = 'labcard-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
    function isMobileNav() {
      try { return window.matchMedia('(max-width: 900px)').matches; } catch (e) { return false; }
    }
    function closeLabcard() {
      card.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('labcard-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    function openLabcard() {
      card.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('labcard-open');
      backdrop.setAttribute('aria-hidden', 'false');
      paintFromState(card);
    }
    function toggleLabcard() {
      if (card.classList.contains('is-open')) closeLabcard();
      else openLabcard();
    }
    window.LabCardClose = closeLabcard;
    btn.addEventListener('click', function (e) {
      if (!isMobileNav()) return;
      // Guests: let Login navigate to /account/. Members: open ID card.
      if (!jwtUser()) return;
      e.preventDefault();
      e.stopPropagation();
      toggleLabcard();
      try { btn.blur(); } catch (err) {}
    }, true);
    backdrop.addEventListener('click', closeLabcard);
    card.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (a) closeLabcard();
      e.stopPropagation();
    });
    document.addEventListener('click', function (e) {
      if (!card.classList.contains('is-open')) return;
      if (e.target.closest && (e.target.closest('.labcard') || e.target.closest('.nav-labcard') || e.target.closest('#labcard-backdrop'))) return;
      closeLabcard();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLabcard();
    });
    window.addEventListener('resize', function () {
      if (!isMobileNav()) closeLabcard();
    });
  }


  function doLogout() {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    clearCache();
    profile = null;
    try {
      document.querySelectorAll('#nav-account,#nav-account-btn').forEach(function (el) { el.textContent = window.LadenI18n ? LadenI18n.t('nav.login') : 'Login'; });
    } catch {}
    if (mountedCard) {
      try { mountedCard.classList.remove('is-open'); } catch {}
      paintFromState(mountedCard);
    }
    try { if (typeof window.LabCardClose === 'function') window.LabCardClose(); } catch {}
    try {
      var bd = document.getElementById('labcard-backdrop');
      if (bd) bd.classList.remove('is-open');
      document.body.classList.remove('labcard-open');
    } catch {}
    try { window.dispatchEvent(new CustomEvent('laden-logout')); } catch {}
    var path = location.pathname || '';
    if (path.indexOf('/account') === 0) {
      location.reload();
    } else {
      location.href = '/account/';
    }
  }

  function setLocalTitle(title, titleLabel) {
    if (profile) {
      profile.title = title || '';
      profile.title_label = titleLabel || '';
      profile._ts = Date.now();
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(profile)); } catch {}
    }
    if (mountedCard) paintFromState(mountedCard);
  }

  window.LabCard = {
    SKINS,
    SKIN_META,
    COST,
    normalizeSkin,
    clearCache,
    refresh,
    setLocalSkin,
    setLocalAvatar,
    setLocalTitle,
    paintNavButton,
    logout: doLogout,
    getSkin() { return profile ? normalizeSkin(profile.labcard_skin) : 'default'; },
    getAvatar() { return profile ? (profile.avatar_id || '') : ''; },
    getTitle() { return profile ? (profile.title || '') : ''; },
    getLabId() { return profile ? (profile.lab_id || '') : ''; },
    getProfile() { return profile; },
    renderInto(el, data) {
      if (!el) return;
      injectCss();
      renderCard(el, data || {
        member: true,
        name: profile && profile.display_name,
        nick: profile && profile.username,
        lab_id: profile && profile.lab_id,
        title: profile && profile.title,
        title_label: profile && profile.title_label,
        llt: profile && profile.llt,
        xp: profile && profile.xp,
        role: profile && profile.role,
        skin: profile && profile.labcard_skin,
        avatar_id: profile && profile.avatar_id,
        avatar: profile && profile.avatar_id,
      });
    },
    injectCss,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  window.addEventListener('storage', function (e) {
    if (e.key === 'laden_lld') {
      try { lldOptInCached = localStorage.getItem('laden_lld') === '1'; } catch {}
      updateLoungeNav();
    }
    if (e.key === TOKEN_KEY) syncLldFromMe();
  });
  window.addEventListener('laden-lld', function () {
    try { lldOptInCached = localStorage.getItem('laden_lld') === '1'; } catch {}
    updateLoungeNav();
  });
  window.addEventListener('laden-auth', function () { syncLldFromMe(); });
})();

document.addEventListener('laden:lang', function () {
  try { if (window.LadenLabcard && LadenLabcard.refresh) LadenLabcard.refresh(); } catch (e) {}
  document.querySelectorAll('#nav-account,#nav-account-btn').forEach(function (el) {
    if (el.querySelector && el.querySelector('.nav-account-name')) return;
    if ((el.textContent || '').trim() === 'Login' || el.getAttribute('data-i18n') === 'nav.login' || (el.querySelector && el.querySelector('[data-i18n="nav.login"]'))) {
      var span = el.querySelector('[data-i18n="nav.login"]');
      var txt = window.LadenI18n ? LadenI18n.t('nav.login') : 'Login';
      if (span) span.textContent = txt; else if (!(el.querySelector && el.querySelector('.nav-account-name'))) el.textContent = txt;
    }
  });
});
