/* Tip pages — filters + Ask Caleb + i18n overlay */
(function () {
  function openCaleb(text) {
    if (typeof window.openCalebLabs === 'function') window.openCalebLabs(text || '');
    else if (window.CalebLabs && typeof window.CalebLabs.ask === 'function') window.CalebLabs.ask(text || '');
  }

  function tipSlugFromPath() {
    var m = location.pathname.match(/\/tips\/([a-z0-9-]+)\/?/i);
    return m ? m[1] : '';
  }

  function applyTipArticle() {
    var slug = tipSlugFromPath();
    if (!slug || slug === 'assets') return;
    var pack = null;
    if (window.LadenI18n && LadenI18n.getLang() === 'no' &&
        window.LadenI18nContent && LadenI18nContent.no && LadenI18nContent.no.tips) {
      pack = LadenI18nContent.no.tips[slug] || null;
    }
    // cache EN originals once
    var hero = document.querySelector('.tip-hero');
    var body = document.querySelector('.tip-body');
    if (!window.__ladenTipEn && hero) {
      var h1 = hero.querySelector('h1');
      var blurb = hero.querySelector('p.muted');
      window.__ladenTipEn = {
        title: h1 ? h1.textContent : '',
        blurb: blurb ? blurb.textContent : '',
        body: body ? body.innerHTML : '',
        docTitle: document.title
      };
    }
    var en = window.__ladenTipEn;
    if (!en) return;
    var h1 = hero && hero.querySelector('h1');
    var blurb = hero && hero.querySelector('p.muted');
    if (pack) {
      if (h1) h1.textContent = pack.title || en.title;
      if (blurb) blurb.textContent = pack.blurb || en.blurb;
      if (body && pack.body_html) body.innerHTML = pack.body_html;
      document.title = (pack.title || en.title) + ' — Tips · Laden Labs';
    } else {
      if (h1) h1.textContent = en.title;
      if (blurb) blurb.textContent = en.blurb;
      if (body) body.innerHTML = en.body;
      document.title = en.docTitle;
    }
    // eyebrow
    var eye = hero && hero.querySelector('.eyebrow');
    if (eye) {
      var tool = (eye.textContent || '').split('·').pop().trim();
      var label = (window.LadenI18n && LadenI18n.t) ? LadenI18n.t('tip.operator') : 'Operator tip';
      // keep tool name after ·
      var raw = eye.textContent || '';
      var parts = raw.split('·');
      var toolPart = parts.length > 1 ? parts.slice(1).join('·').trim() : '';
      eye.innerHTML = '<span class="pulse"></span> ' + label + (toolPart ? (' · ' + toolPart) : '');
    }
  }

  function applyTipsIndex() {
    var grid = document.getElementById('tips-index');
    if (!grid) return;
    if (!window.__ladenTipsIndexEn) {
      window.__ladenTipsIndexEn = {};
      grid.querySelectorAll('.tip-card-link').forEach(function (card) {
        var href = card.getAttribute('href') || '';
        var m = href.match(/\/tips\/([a-z0-9-]+)\/?/i);
        if (!m) return;
        var slug = m[1];
        var h3 = card.querySelector('h3');
        var p = card.querySelector('p');
        window.__ladenTipsIndexEn[slug] = {
          title: h3 ? h3.textContent : '',
          blurb: p ? p.textContent : ''
        };
        card.setAttribute('data-tip-slug', slug);
      });
    }
    var no = (window.LadenI18n && LadenI18n.getLang() === 'no' &&
      window.LadenI18nContent && LadenI18nContent.no && LadenI18nContent.no.tips) || null;
    grid.querySelectorAll('.tip-card-link[data-tip-slug]').forEach(function (card) {
      var slug = card.getAttribute('data-tip-slug');
      var en = window.__ladenTipsIndexEn[slug];
      if (!en) return;
      var pack = no && no[slug];
      var h3 = card.querySelector('h3');
      var p = card.querySelector('p');
      if (h3) h3.textContent = (pack && pack.title) || en.title;
      if (p) p.textContent = (pack && pack.blurb) || en.blurb;
    });
  }

  function applyAll() {
    applyTipArticle();
    applyTipsIndex();
  }

  const btn = document.getElementById('tip-caleb');
  if (btn) {
    btn.addEventListener('click', function () {
      openCaleb(btn.getAttribute('data-ask') || 'Help me with this operator tip.');
    });
  }

  const filters = document.getElementById('tip-filters');
  const grid = document.getElementById('tips-index');
  if (filters && grid) {
    filters.addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-filter]');
      if (!b) return;
      const f = b.getAttribute('data-filter');
      filters.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active', x === b));
      grid.querySelectorAll('.tip-card-link').forEach(card => {
        const tool = (card.querySelector('.tool') || {}).textContent || '';
        const show = f === 'all' || tool.toLowerCase().indexOf(f.toLowerCase()) === 0;
        card.classList.toggle('is-hidden', !show);
      });
    });
  }

  // Deep-link /community/#tips → open tips tab if present
  if (location.hash === '#tips' && location.pathname.indexOf('/community') === 0) {
    const tab = document.querySelector('.comm-tab[data-tab="tips"]');
    if (tab) tab.click();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
  document.addEventListener('laden:lang', applyAll);
})();
