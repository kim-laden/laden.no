/* LLO — Laden Labs Oracle client */
(function () {
  const API = '/labs/api/oracle/search';
  const form = document.getElementById('oracle-form');
  const input = document.getElementById('oracle-q');
  const statusEl = document.getElementById('oracle-status');
  const resultsEl = document.getElementById('oracle-results');
  const segBtns = document.querySelectorAll('.oracle-seg-btn');
  let searchType = 'code';
  let lastQuery = '';
  let lastItems = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'oracle-status mono' + (kind ? ' ' + kind : '');
  }

  function askCaleb(text) {
    if (typeof window.openCalebLabs === 'function') window.openCalebLabs();
    if (window.CalebLabs && typeof window.CalebLabs.ask === 'function') {
      window.CalebLabs.ask(text);
    } else if (window.CalebLabs && typeof window.CalebLabs.open === 'function') {
      // fallback: open only; user can type
      try {
        const inp = document.querySelector('#caleb-input');
        if (inp) { inp.value = text; inp.focus(); }
      } catch (_) {}
    }
  }

  function interpretPrompt(item) {
    const bits = [];
    if (item.title) bits.push(item.title);
    if (item.repo) bits.push('in ' + item.repo);
    if (item.path) bits.push('at ' + item.path);
    const subject = bits.join(' ') || lastQuery || 'these results';
    return 'Oracle hit: ' + subject + '. Help me interpret this for ethical hunting — what should I look for, and what query should I try next?';
  }

  function renderItems(items, meta) {
    resultsEl.innerHTML = '';
    if (!items.length) {
      resultsEl.innerHTML = `
        <div class="oracle-empty">
          <h3>Silence in the void</h3>
          <p class="muted">No ${esc(searchType)} matched <code>${esc(lastQuery)}</code>. Try a broader invocation, or ask Caleb for a better query.</p>
          <div style="margin-top:.75rem">
            <button type="button" class="btn btn-cyan" id="empty-caleb">Ask Caleb for queries</button>
          </div>
        </div>`;
      const b = document.getElementById('empty-caleb');
      if (b) b.onclick = () => askCaleb('Suggest Oracle queries related to: ' + lastQuery);
      return;
    }

    items.forEach((it, idx) => {
      const card = document.createElement('article');
      card.className = 'oracle-card';
      const title = it.title || it.name || it.path || 'Untitled';
      const url = it.html_url || it.url || '#';
      const repo = it.repo || '';
      const path = it.path || '';
      const snippet = it.snippet || it.body || '';
      const extra = it.state || it.language || '';
      card.innerHTML = `
        <div class="oracle-card-top">
          <h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></h3>
          <span class="mono muted" style="font-size:.68rem">#${idx + 1}</span>
        </div>
        <div class="oracle-meta">
          ${repo ? `<span class="repo">${esc(repo)}</span>` : ''}
          ${path ? `<span class="path">${esc(path)}</span>` : ''}
          ${extra ? `<span>${esc(extra)}</span>` : ''}
        </div>
        ${snippet ? `<pre class="oracle-snippet">${esc(snippet)}</pre>` : ''}
        <div class="oracle-card-actions">
          <a class="btn btn-ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open on GitHub</a>
          <button type="button" class="btn btn-cyan oracle-interpret" data-idx="${idx}">Ask Caleb</button>
        </div>`;
      resultsEl.appendChild(card);
    });

    resultsEl.querySelectorAll('.oracle-interpret').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-idx'));
        const item = lastItems[i];
        if (item) askCaleb(interpretPrompt(item));
      });
    });

    const total = (meta && meta.total_count != null) ? meta.total_count : items.length;
    setStatus(`The Oracle returns ${items.length} of ~${total} · type=${searchType} · q="${lastQuery}"`, 'ok');
  }

  function renderError(msg, detail) {
    resultsEl.innerHTML = `
      <div class="oracle-error">
        <h3>The channel flickered</h3>
        <p class="muted">${esc(msg)}</p>
        ${detail ? `<p class="mono" style="font-size:.72rem;margin-top:.5rem;color:var(--muted)">${esc(detail)}</p>` : ''}
        <div style="margin-top:.75rem;display:flex;gap:.4rem;justify-content:center;flex-wrap:wrap">
          <button type="button" class="btn btn-cyan" id="err-caleb">Ask Caleb</button>
          <button type="button" class="btn btn-ghost" id="err-retry">Retry</button>
        </div>
      </div>`;
    const c = document.getElementById('err-caleb');
    if (c) c.onclick = () => askCaleb('Oracle search failed for "' + lastQuery + '". What should I try instead?');
    const r = document.getElementById('err-retry');
    if (r) r.onclick = () => runSearch();
  }

  async function runSearch() {
    const q = (input.value || '').trim();
    if (!q) {
      setStatus('Speak a query first — the Oracle needs something to seek.', 'err');
      input.focus();
      return;
    }
    lastQuery = q;
    setStatus('Consulting the force…', 'ok');
    resultsEl.innerHTML = `<div class="oracle-loading"><span class="pulse-dot"></span> Searching GitHub ${esc(searchType)}…</div>`;

    try {
      const url = `${API}?q=${encodeURIComponent(q)}&type=${encodeURIComponent(searchType)}&per_page=12`;
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data.error || ('HTTP ' + res.status);
        const detail = data.message || data.detail || '';
        setStatus('Channel error: ' + err, 'err');
        renderError(err, detail);
        return;
      }
      lastItems = Array.isArray(data.items) ? data.items : [];
      renderItems(lastItems, data);
    } catch (e) {
      setStatus('Network veil — could not reach the Oracle proxy.', 'err');
      renderError('Network failure reaching /labs/api/oracle/search', String(e && e.message || e));
    }
  }

  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      segBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      searchType = btn.getAttribute('data-type') || 'code';
      if (lastQuery) runSearch();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });

  document.querySelectorAll('#oracle-chips .oracle-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      input.value = chip.getAttribute('data-q') || chip.textContent;
      runSearch();
    });
  });

  document.querySelectorAll('[data-caleb-ask]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      askCaleb(btn.getAttribute('data-caleb-ask') || 'Help me with the Oracle');
    });
  });

  const openBtn = document.getElementById('oracle-caleb-open');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openCalebLabs === 'function') window.openCalebLabs();
    });
  }

  // Oslo clock
  const clock = document.getElementById('oracle-clock');
  function tick() {
    try {
      const s = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour12: false });
      if (clock) clock.textContent = s + ' OSLO';
    } catch (_) {}
  }
  tick();
  setInterval(tick, 1000);

  // Deep-link ?q=
  try {
    const params = new URLSearchParams(location.search);
    const q0 = params.get('q');
    const t0 = params.get('type');
    if (t0 && ['code', 'repositories', 'issues'].includes(t0)) {
      searchType = t0;
      segBtns.forEach((b) => {
        const on = b.getAttribute('data-type') === t0;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    if (q0) {
      input.value = q0;
      runSearch();
    }
  } catch (_) {}
})();
