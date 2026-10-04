/*! Laden AS legal line */
(function () {
  var TEXT = '© 2026 Laden AS · Org.nr. 937 285 833';
  function ensure() {
    if (document.querySelector('.site-legal')) return;
    var el = document.createElement('p');
    el.className = 'site-legal';
    el.textContent = TEXT;
    var foot = document.querySelector('footer.footer, footer');
    if (foot) {
      foot.appendChild(el);
      return;
    }
    // pages without footer (account, terminal, lla, …)
    var bar = document.createElement('div');
    bar.className = 'site-legal-bar';
    bar.appendChild(el);
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
})();
