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

/* Mobile nav: hamburger for .nav-links (secondary when app tabs mount) */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    var nav = document.querySelector('header.nav');
    var links = document.querySelector('.nav-links');
    var inner = document.querySelector('.nav-inner');
    if (!nav || !links || !inner) return;
    if (document.getElementById('nav-menu-btn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'nav-menu-btn';
    btn.className = 'nav-menu-btn';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>';

    var cta = inner.querySelector('.nav-cta');
    if (cta) inner.insertBefore(btn, cta);
    else inner.appendChild(btn);

    function close() {
      links.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-menu-open');
    }
    function toggle() {
      var open = links.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-menu-open', open);
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });
    links.addEventListener('click', function (e) {
      if (e.target && e.target.closest('a')) close();
    });
    document.addEventListener('click', function (e) {
      if (!links.classList.contains('is-open')) return;
      if (e.target.closest('.nav-links') || e.target.closest('#nav-menu-btn')) return;
      close();
    });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 901px)').matches) close();
    });
  });
})();

/* Mobile app chrome: sticky bottom tab bar + More sheet (≤900px) */
(function () {
  var MQ = '(max-width: 900px)';
  var MORE_LINKS = [
    { href: '/labs/z-guide/', label: 'Z Guide', ico: 'Z' },
    { href: '/forum/', label: 'Forum', ico: '⌘' },
    { href: '/gear/', label: 'Gear', ico: '⚙' },
    { href: '/oracle/', label: 'Oracle', ico: '◈' },
    { href: '/challenges/', label: 'Challenges', ico: '⚑' },
    { href: '/messages/', label: 'Messages', ico: '✉' },
    { href: '/account/', label: 'Account', ico: '◉' },
    { href: '/tips/', label: 'Tips', ico: '✦' }
  ];

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function isMobile() {
    return window.matchMedia(MQ).matches;
  }

  function normPath(p) {
    p = String(p || '/').replace(/\/+$/, '') || '/';
    return p;
  }

  function openLLC() {
    if (window.LadenLLC && typeof window.LadenLLC.open === 'function') {
      window.LadenLLC.open();
      return true;
    }
    if (typeof window.openLLC === 'function') {
      window.openLLC();
      return true;
    }
    if (typeof window.openLadenTerminal === 'function') {
      window.openLadenTerminal();
      return true;
    }
    var toggle = document.getElementById('llc-toggle');
    if (toggle) {
      toggle.click();
      return true;
    }
    return false;
  }

  function ensureThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = '#05070a';
  }

  function markActive(tabs) {
    if (!tabs) return;
    var path = normPath(location.pathname);
    var llcOpen = document.body.classList.contains('llc-open');
    tabs.querySelectorAll('.app-tab').forEach(function (el) {
      el.classList.remove('is-active');
    });
    var key = null;
    if (llcOpen || path === '/terminal') key = 'console';
    else if (path === '/') key = 'home';
    else if (path === '/labs' || path.indexOf('/labs/') === 0) key = 'lounge';
    else if (path === '/community' || path.indexOf('/community/') === 0) key = 'community';
    else if (tabs.classList.contains('more-open')) key = 'more';
    if (key) {
      var btn = tabs.querySelector('.app-tab[data-tab="' + key + '"]');
      if (btn) btn.classList.add('is-active');
    }
  }

  function mount() {
    if (document.getElementById('laden-app-tabs')) {
      document.body.classList.add('laden-mobile-app');
      markActive(document.getElementById('laden-app-tabs'));
      return;
    }

    ensureThemeColor();

    var tabs = document.createElement('nav');
    tabs.id = 'laden-app-tabs';
    tabs.setAttribute('aria-label', 'App navigation');
    tabs.innerHTML =
      '<a class="app-tab" data-tab="home" href="/" aria-label="Home">' +
        '<span class="tab-ico" aria-hidden="true">⌂</span><span class="tab-label">Home</span></a>' +
      '<a class="app-tab" data-tab="lounge" href="/labs/" aria-label="Lounge">' +
        '<span class="tab-ico" aria-hidden="true">▣</span><span class="tab-label">Lounge</span></a>' +
      '<button type="button" class="app-tab app-tab-console" data-tab="console" aria-label="Console">' +
        '<span class="tab-ico" aria-hidden="true">$_</span><span class="tab-label">Console</span></button>' +
      '<a class="app-tab" data-tab="community" href="/community/" aria-label="Community">' +
        '<span class="tab-ico" aria-hidden="true">◈</span><span class="tab-label">Community</span></a>' +
      '<button type="button" class="app-tab" data-tab="more" aria-label="More" aria-expanded="false">' +
        '<span class="tab-ico" aria-hidden="true">⋯</span><span class="tab-label">More</span></button>';

    var backdrop = document.createElement('div');
    backdrop.id = 'laden-more-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    var sheet = document.createElement('div');
    sheet.id = 'laden-more-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'More');
    sheet.setAttribute('aria-hidden', 'true');
    var grid = MORE_LINKS.map(function (item) {
      return (
        '<a class="more-card" href="' + item.href + '">' +
          '<span class="more-ico" aria-hidden="true">' + item.ico + '</span>' +
          '<span class="more-label">' + item.label + '</span></a>'
      );
    }).join('');
    sheet.innerHTML =
      '<div class="more-handle" aria-hidden="true"></div>' +
      '<div class="more-title">More</div>' +
      '<div class="more-grid">' + grid + '</div>';

    document.body.appendChild(tabs);
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.body.classList.add('laden-mobile-app');

    var moreBtn = tabs.querySelector('[data-tab="more"]');
    var consoleBtn = tabs.querySelector('[data-tab="console"]');

    function closeMore() {
      sheet.classList.remove('open');
      backdrop.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
      tabs.classList.remove('more-open');
      markActive(tabs);
    }
    function openMore() {
      // Close hamburger dropdown if open
      var links = document.querySelector('.nav-links');
      var menuBtn = document.getElementById('nav-menu-btn');
      if (links) links.classList.remove('is-open');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-menu-open');

      sheet.classList.add('open');
      backdrop.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      if (moreBtn) moreBtn.setAttribute('aria-expanded', 'true');
      tabs.classList.add('more-open');
      markActive(tabs);
    }
    function toggleMore() {
      if (sheet.classList.contains('open')) closeMore();
      else openMore();
    }

    if (moreBtn) moreBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMore();
    });
    backdrop.addEventListener('click', closeMore);
    sheet.addEventListener('click', function (e) {
      if (e.target && e.target.closest('a')) closeMore();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) {
        closeMore();
      }
    });

    if (consoleBtn) consoleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeMore();
      if (!openLLC()) {
        if (window.__ladenSoftGo) window.__ladenSoftGo('/terminal/'); else location.href = '/terminal/';
        return;
      }
      markActive(tabs);
    });

    // Keep Console tab active while LLC drawer is open
    var obs = new MutationObserver(function () { markActive(tabs); });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    markActive(tabs);
  }

  function unmount() {
    var tabs = document.getElementById('laden-app-tabs');
    var sheet = document.getElementById('laden-more-sheet');
    var backdrop = document.getElementById('laden-more-backdrop');
    if (tabs) tabs.remove();
    if (sheet) sheet.remove();
    if (backdrop) backdrop.remove();
    document.body.classList.remove('laden-mobile-app');
  }

  function sync() {
    if (isMobile()) mount();
    else unmount();
  }

  ready(function () {
    sync();
    var mq = window.matchMedia(MQ);
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
  });
})();
