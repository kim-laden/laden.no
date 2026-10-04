(() => {
  const input = document.getElementById('man-filter');
  const chips = document.getElementById('man-chips');
  const empty = document.getElementById('man-empty');
  let group = 'all';

  function apply() {
    const q = (input && input.value || '').trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('.man-card').forEach(card => {
      const g = card.dataset.group || '';
      const hay = [card.dataset.name, card.dataset.aliases, card.dataset.syn].join(' ').toLowerCase();
      const okG = group === 'all' || g === group;
      const okQ = !q || hay.includes(q);
      const on = okG && okQ;
      card.style.display = on ? '' : 'none';
      if (on) shown++;
    });
    document.querySelectorAll('[data-group-section]').forEach(sec => {
      const any = [...sec.querySelectorAll('.man-card')].some(c => c.style.display !== 'none');
      sec.style.display = any ? '' : 'none';
    });
    if (empty) empty.classList.toggle('hidden', shown > 0);
  }

  if (input) input.addEventListener('input', apply);
  if (chips) chips.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-group]');
    if (!btn) return;
    group = btn.dataset.group;
    chips.querySelectorAll('.man-chip-btn').forEach(b => b.classList.toggle('active', b === btn));
    apply();
  });
})();
