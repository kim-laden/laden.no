/* Lounge v1.1 DEMO — local flag check (no production DB) */
(() => {
  const $ = (s, el=document) => el.querySelector(s);
  const slug = document.body.dataset.labSlug;
  const flagHash = document.body.dataset.flagHash;
  const solvedKey = 'llz_v11_solved';

  function toast(msg) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__tt);
    window.__tt = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str.trim()));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function getSolved() {
    try { return JSON.parse(localStorage.getItem(solvedKey) || '[]'); } catch { return []; }
  }
  function markSolved(s) {
    const a = getSolved();
    if (!a.includes(s)) { a.push(s); localStorage.setItem(solvedKey, JSON.stringify(a)); }
  }

  function updateSolvedChrome() {
    if (getSolved().includes(slug)) {
      const meta = $('#room-meta');
      if (meta && !meta.dataset.cleared) {
        meta.dataset.cleared = '1';
        meta.innerHTML += ' · <span style="color:var(--green)">CLEARED (local demo)</span>';
      }
    }
  }

  async function checkFlag(raw) {
    const h = await sha256hex(raw);
    return flagHash && h === flagHash;
  }

  async function submitFlag() {
    const input = $('#flag-in');
    const msg = $('#flag-msg');
    const flag = (input && input.value) || '';
    if (!flag.trim()) {
      msg.className = 'msg bad'; msg.textContent = 'Paste an LLZ{…} flag.';
      return;
    }
    const ok = await checkFlag(flag);
    if (ok) {
      markSolved(slug);
      msg.className = 'msg ok';
      msg.textContent = 'Correct — booth cleared (demo local only, not production XP).';
      toast('Flag accepted · demo');
      updateSolvedChrome();
    } else {
      msg.className = 'msg bad';
      msg.textContent = 'Nope — keep learning.';
    }
  }

  function revealFlag(flag) {
    const out = $('#widget-out');
    if (out) out.textContent = 'Flag: ' + flag;
    const input = $('#flag-in');
    if (input) input.value = flag;
  }

  function buildWidget() {
    const box = $('#room-widget');
    if (!box) return;
    const type = box.dataset.widget;
    let cfg = {};
    try { cfg = JSON.parse(box.dataset.cfg || '{}'); } catch {}

    if (type === 'quiz') {
      const opts = (cfg.options || []).map((o,i) =>
        `<button type="button" data-i="${i}">${escapeHtml(o.t).replace(/\n/g,'<br>')}</button>`
      ).join('');
      box.innerHTML = `<h3>Bench check</h3><div class="quiz-opts">${opts}</div><div class="out" id="widget-out"></div>`;
      box.querySelectorAll('.quiz-opts button').forEach(btn => {
        btn.onclick = () => {
          const o = cfg.options[Number(btn.dataset.i)];
          box.querySelectorAll('.quiz-opts button').forEach(b => b.classList.remove('is-good','is-bad'));
          if (o.ok) {
            btn.classList.add('is-good');
            revealFlag(cfg.flag);
            $('#widget-out').textContent = 'Correct. Flag filled — hit Submit.';
          } else {
            btn.classList.add('is-bad');
            $('#widget-out').textContent = 'Not that one — reread Learn.';
          }
        };
      });
    } else if (type === 'input') {
      box.innerHTML = `<h3>Bench check</h3>
        <div class="widget-row">
          <input id="widget-in" class="mono" placeholder="${escapeHtml(cfg.placeholder||'answer')}" autocomplete="off">
          <button class="btn btn-primary" type="button" id="widget-go">Check</button>
        </div>
        <div class="out" id="widget-out"></div>`;
      $('#widget-go').onclick = () => {
        let v = ($('#widget-in').value || '').trim();
        let expect = String(cfg.expect || '');
        if (cfg.normalize === 'spaces') {
          v = v.replace(/\s+/g,' ').trim().toLowerCase();
          expect = expect.replace(/\s+/g,' ').trim().toLowerCase();
        }
        if (v === expect) {
          revealFlag(cfg.flag);
          $('#widget-out').textContent = 'Correct. Flag filled — hit Submit.';
        } else {
          $('#widget-out').textContent = 'Not quite.';
        }
      };
    } else if (type === 'fizzbuzz') {
      box.innerHTML = `<h3>Bench check</h3>
        <div class="widget-row">
          <button class="btn btn-primary" type="button" id="widget-go">Run correct FizzBuzz</button>
        </div>
        <div class="out" id="widget-out"></div>`;
      $('#widget-go').onclick = () => {
        const n = cfg.n || 15;
        const lines = [];
        for (let i=1;i<=n;i++) {
          let s = '';
          if (i%3===0) s+='Fizz';
          if (i%5===0) s+='Buzz';
          lines.push(s || String(i));
        }
        $('#widget-out').textContent = lines.join('\n') + '\n\nFlag: ' + cfg.flag;
        const input = $('#flag-in');
        if (input) input.value = cfg.flag;
      };
    } else if (type === 'reveal') {
      box.innerHTML = `<h3>Bench check</h3>
        <p class="muted">The flag is already in the lab body — copy it into the submit box.</p>
        <div class="widget-row">
          <button class="btn btn-cyan" type="button" id="widget-go">Fill flag from leak</button>
        </div>
        <div class="out" id="widget-out"></div>`;
      $('#widget-go').onclick = () => {
        revealFlag(cfg.flag);
        $('#widget-out').textContent = 'Copied into submit box. In real ops: rotate the key.';
      };
    }
  }

  function escapeHtml(s) {
    return String(s==null?'':s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('chapter-code');
    buildWidget();
    updateSolvedChrome();
    const go = $('#flag-go');
    if (go) go.onclick = submitFlag;
    const fin = $('#flag-in');
    if (fin) fin.addEventListener('keydown', e => { if (e.key === 'Enter') submitFlag(); });
  });
})();
