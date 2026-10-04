/* Lounge v1.1 LIVE — catalog-driven board with chapter + track + search */
(() => {
  const state = {
    stations: [],
    chapter: 'all',
    track: 'all',
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function lltFor(points) {
    return Math.max(5, Math.round(Number(points || 0) / 10));
  }

  function getSolved() {
    try { return JSON.parse(localStorage.getItem('llz_v11_solved') || '[]'); } catch { return []; }
  }

  function filtered() {
    const q = ($('#chal-search').value || '').toLowerCase();
    let list = state.stations;
    if (state.chapter !== 'all') list = list.filter(c => c.chapter === state.chapter);
    if (state.track !== 'all') list = list.filter(c => c.track === state.track);
    if (q) {
      list = list.filter(c =>
        (c.title + ' ' + c.summary + ' ' + c.track + ' ' + c.chapter + ' ' + c.slug)
          .toLowerCase().includes(q)
      );
    }
    return list;
  }

  function rebuildTracks() {
    let base = state.stations;
    if (state.chapter !== 'all') base = base.filter(c => c.chapter === state.chapter);
    const tracks = [...new Set(base.map(c => c.track))].sort();
    const valid = new Set(['all', ...tracks]);
    if (!valid.has(state.track)) state.track = 'all';

    $('#track-list').innerHTML = tracks.map(t => {
      const n = base.filter(c => c.track === t).length;
      const active = state.track === t ? ' active' : '';
      return `<button type="button" class="knob${active}" data-track="${escapeHtml(t)}">${escapeHtml(t)} <span class="muted">(${n})</span></button>`;
    }).join('');

    $$('.side button[data-track="all"]').forEach(b =>
      b.classList.toggle('active', state.track === 'all')
    );

    $$('#track-list button').forEach(b => {
      b.onclick = () => {
        state.track = b.dataset.track;
        $$('.side button[data-track], #track-list button').forEach(x =>
          x.classList.toggle('active', x.dataset.track === state.track)
        );
        render();
      };
    });
  }

  function render() {
    const solved = new Set(getSolved());
    const list = filtered();
    const grid = $('#chal-grid');
    grid.innerHTML = list.map(c => {
      const diff = (c.difficulty || 'easy').toLowerCase();
      const diffClass = diff === 'medium' ? 'med' : diff;
      const llt = lltFor(c.points);
      const isSolved = c.chapter === 'code' && solved.has(c.slug);
      const chClass = c.chapter === 'hack' ? 'hack' : 'code';
      const frameClass = c.chapter === 'hack' ? 'chapter-hack' : 'chapter-code';
      return `
      <article class="card station ${frameClass} ${isSolved ? 'solved' : ''} diff-${escapeHtml(diffClass)}"
               data-href="${escapeHtml(c.href)}" data-slug="${escapeHtml(c.slug)}" data-chapter="${escapeHtml(c.chapter || chClass)}">
        ${isSolved ? '<span class="station-stamp">CLEARED</span>' : ''}
        <div class="station-top">
          <span class="station-chapter ${chClass}">${escapeHtml(c.chapter)}</span>
          <span class="station-track">${escapeHtml(c.track)}</span>
          <span class="tag ${escapeHtml(diffClass)}">${escapeHtml(String(c.difficulty || '').toUpperCase())}</span>
        </div>
        <h4>${escapeHtml(c.title)}</h4>
        <p>${escapeHtml(c.summary)}</p>
        <div class="station-rewards">
          <span class="tag xp">${escapeHtml(c.points)} XP</span>
          <span class="tag llt">${escapeHtml(llt)} LLT</span>
        </div>
        <div class="station-foot">
          <span>${isSolved ? 'Booth cleared' : (c.chapter === 'hack' ? 'Live room' : 'Code bench')}</span>
          <span class="enter">${isSolved ? 'revisit →' : 'enter →'}</span>
        </div>
      </article>`;
    }).join('') || '<p class="muted">No stations on this frequency.</p>';

    $$('.card', grid).forEach(card => {
      card.addEventListener('click', () => {
        location.href = card.dataset.href;
      });
    });

    const localClears = getSolved().filter(s =>
      state.stations.some(c => c.chapter === 'code' && c.slug === s)
    ).length;
    const el = $('#stat-solved');
    if (el) el.textContent = String(localClears);
  }

  function applyChapter(ch) {
    state.chapter = ch;
    $$('#chapter-knobs .knob').forEach(b =>
      b.classList.toggle('active', b.dataset.chapter === state.chapter)
    );
    rebuildTracks();
    render();
    const url = new URL(location.href);
    if (ch === 'all') url.searchParams.delete('chapter');
    else url.searchParams.set('chapter', ch);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function tickClock() {
    const el = $('#ambient-clock');
    if (!el) return;
    const d = new Date();
    el.textContent = 'lounge · v1.1 · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function boot() {
    const params = new URLSearchParams(location.search);
    const ch = params.get('chapter');
    if (ch === 'hack' || ch === 'code' || ch === 'all') state.chapter = ch;

    const res = await fetch('/labs/v1.1/catalog.json', { cache: 'no-store' });
    const data = await res.json();
    state.stations = data.stations || [];

    if (data.stats) {
      const t = $('#stat-total'); if (t) t.textContent = data.stats.total;
      const h = $('#stat-hack'); if (h) h.textContent = data.stats.hack;
      const c = $('#stat-code'); if (c) c.textContent = data.stats.code;
    }

    $$('#chapter-knobs .knob').forEach(b => {
      b.classList.toggle('active', b.dataset.chapter === state.chapter);
      b.onclick = () => applyChapter(b.dataset.chapter);
    });

    const allTrack = $('.side button[data-track="all"]');
    if (allTrack) {
      allTrack.onclick = () => {
        state.track = 'all';
        $$('.side button[data-track], #track-list button').forEach(x =>
          x.classList.toggle('active', x.dataset.track === 'all')
        );
        render();
      };
    }

    const search = $('#chal-search');
    if (search) search.addEventListener('input', render);
    rebuildTracks();
    render();
    tickClock();
    setInterval(tickClock, 30000);
  }

  boot().catch(err => {
    const grid = $('#chal-grid');
    if (grid) grid.innerHTML = `<p class="muted">Failed to load catalog: ${escapeHtml(err.message)}</p>`;
  });
})();
