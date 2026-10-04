(() => {
  function wire() {
    if (!window.LLT) return;
    const name = document.getElementById('llt-week-name');
    const price = document.getElementById('llt-week-price');
    const buy = document.getElementById('llt-week-buy');
    const msg = document.getElementById('llt-week-msg');
    if (name) name.textContent = window.LLT.WEEKLY_NAME;
    if (price) price.textContent = window.LLT.WEEKLY_PRICE + ' LLT';
    window.LLT.mountBalances();
    if (!buy) return;
    buy.onclick = async () => {
      buy.disabled = true;
      try {
        const r = await window.LLT.buyWeekly();
        if (!r.ok) {
          if (msg) {
            msg.className = 'msg bad';
            msg.textContent = r.error === 'unauthorized'
              ? 'Sign in to spend LLT across devices.'
              : 'Not enough LLT — earn more on /challenges/ (game + flags).';
          }
          return;
        }
        if (msg) {
          msg.className = 'msg ok';
          const bal = (r.wallet && r.wallet.balance != null) ? r.wallet.balance : window.LLT.balance();
          msg.textContent = (r.already ? 'Already claimed this week. ' : '') +
            'Added to cart · −' + window.LLT.WEEKLY_PRICE + ' LLT. Balance: ' + bal + ' LLT. (Demo checkout.)';
        }
        window.LLT.mountBalances();
        try {
          if (typeof window.__ladenRenderCart === 'function') window.__ladenRenderCart();
          else if (typeof renderCart === 'function') renderCart();
          else {
            const cart = JSON.parse(localStorage.getItem('laden_v12_cart') || '[]');
            const nok = (Array.isArray(cart) ? cart : []).reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0), 0);
            const el = document.getElementById('cart-count');
            if (el) el.textContent = nok + ' NOK';
          }
        } catch {}
      } finally {
        buy.disabled = false;
      }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
