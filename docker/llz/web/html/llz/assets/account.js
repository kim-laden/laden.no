(() => {
  const API = '/labs/api';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const QUOTES = [
    'Scope is a love language. Written permission first — then curiosity.',
    'Encoding is not encryption. Base64 is a costume, not a vault.',
    'A quiet finding with a clear PoC beats a loud CVSS flex.',
    'robots.txt is a treasure map, not a lock. Still: stay in scope.',
    'alg=none is a nightmare you only need to meet once.',
    'Report like a pro: summary, steps, impact, fix. Signal over noise.',
    'The best exploit is the one you never run out of scope.',
    'HttpOnly + Secure are small flags with large consequences.',
    'Read the error twice before you rewrite the payload. Noise hides the tell.',
    'Slow is smooth. Smooth is fast. One clean request beats a spray.',
  ];
  const FACTS = [
    'JWT stands for JSON Web Token — three Base64url chunks: header.payload.signature.',
    'ROT13 is its own inverse: apply it twice and you’re back.',
    'SHA-256 digests are always 64 hex characters.',
    'IDOR = changing an id and seeing someone else’s data without an authz check.',
    'Open redirects often fuel phishing chains and OAuth token theft.',
    'SSRF hunters always think about link-local metadata (169.254.169.254).',
    'CSP with unsafe-inline is basically a polite suggestion.',
    'The Laden motto behind Scope First is three words: hunt ethically always.',
  ];
  let factIdx = Math.floor(Math.random() * FACTS.length);

  function token() { return localStorage.getItem('laden_v12_token') || ''; }

  function isAdminUser(u) {
    if (!u) return false;
    if (Number(u.is_admin) === 1) return true;
    if (String(u.role || '').toLowerCase() === 'admin') return true;
    const n = String(u.username || '').toLowerCase();
    return n === 'laden' || n === 'admin';
  }

  function showLlaEntry(u) {
    const el = document.getElementById('acct-lla');
    if (!el) return;
    el.classList.toggle('hidden', !isAdminUser(u));
  }



  const LLD_KEY = 'laden_lld';
  let lldServerOptIn = false; // authoritative from /me (per account); default OFF
  function lldOptedIn() {
    return !!lldServerOptIn;
  }
  function mirrorLldCache(on) {
    try {
      if (on) localStorage.setItem(LLD_KEY, '1');
      else localStorage.removeItem(LLD_KEY);
    } catch (_) {}
    try { window.dispatchEvent(new Event('laden-lld')); } catch {}
  }
  function applyLldFromUser(u) {
    const on = !!(u && (Number(u.lld_opt_in) === 1 || (u.settings && u.settings.lld_opt_in)));
    lldServerOptIn = on;
    // Force-clear stale browser opt-in when this account is OFF
    mirrorLldCache(on);
    paintLldOptIn();
    return on;
  }
  function paintLldOptIn() {
    const box = document.getElementById('acct-lld-optin');
    const st = document.getElementById('acct-lld-status');
    const open = document.getElementById('acct-lld-open');
    const on = lldOptedIn();
    if (box) box.checked = on;
    if (st) {
      st.textContent = on ? 'Joined' : 'Off';
      st.classList.toggle('off', !on);
    }
    if (open) open.classList.toggle('hidden', !on);
  }
  async function setLldOptInApi(on) {
    const tok = token();
    if (!tok) throw new Error('login');
    const res = await fetch(API + '/account/lld', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + tok,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ opt_in: !!on }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(data.error || ('http_' + res.status));
      e.data = data;
      throw e;
    }
    const u = data.user || data;
    applyLldFromUser(u.lld_opt_in != null ? u : { lld_opt_in: data.lld_opt_in, settings: data.settings });
    return data;
  }
  function wireLldOptIn() {
    const box = document.getElementById('acct-lld-optin');
    const saveBtn = document.getElementById('acct-lld-save');
    const msg = document.getElementById('acct-lld-msg');
    if (!box || box._wired) return;
    box._wired = true;
    // Never checked by default — only after /me says so. Checkbox alone does not persist.
    box.checked = false;
    function setMsg(text, kind) {
      if (!msg) return;
      msg.textContent = text || '';
      msg.className = 'muted mono' + (kind ? (' ' + kind) : '');
      msg.style.margin = '.55rem 0 0';
      msg.style.fontSize = '.75rem';
      msg.style.minHeight = '1.1em';
    }
    box.addEventListener('change', () => {
      const dirty = !!box.checked !== lldOptedIn();
      setMsg(dirty ? 'Unsaved — press Save to commit.' : '', '');
    });
    async function doSave() {
      const want = !!box.checked;
      if (saveBtn) saveBtn.disabled = true;
      box.disabled = true;
      setMsg('Saving…', '');
      try {
        await setLldOptInApi(want);
        setMsg(want ? 'Saved · LLD on. Lounge CTA shows dev. next visit.' : 'Saved · LLD off.', 'ok');
        try { window.dispatchEvent(new Event('laden-lld')); } catch {}
      } catch (_) {
        box.checked = lldOptedIn();
        paintLldOptIn();
        setMsg('Save failed — try again.', 'err');
      } finally {
        box.disabled = false;
        if (saveBtn) saveBtn.disabled = false;
      }
    }
    if (saveBtn && !saveBtn._wired) {
      saveBtn._wired = true;
      saveBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        doSave();
      });
    }
    paintLldOptIn();
  }

  /* ── Z Drive manager ─────────────────────────────────────────── */
  const ZMGR_API = API; // same /labs/api
  let zmgrCwd = '/'; // set to /labz/<user> after quota
  let zmgrEditPath = null;

  function zmgrEl(id) { return document.getElementById(id); }

  function zmgrFmt(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function zmgrStatus(msg, kind) {
    const el = zmgrEl('zmgr-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'zmgr-status' + (kind ? ' ' + kind : '');
  }

  async function zmgrFetch(method, path, body) {
    const tok = token();
    if (!tok) throw new Error('login');
    const opts = { method, headers: { Authorization: 'Bearer ' + tok } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(ZMGR_API + path, opts);
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const e = new Error(data.error || ('http_' + res.status));
      e.data = data;
      throw e;
    }
    return data;
  }

  function zmgrJoin(cwd, name) {
    if (cwd === '/') return '/' + name;
    return cwd.replace(/\/$/, '') + '/' + name;
  }

  function zmgrParent(cwd) {
    if (!cwd || cwd === '/') return '/';
    const i = cwd.lastIndexOf('/');
    return i <= 0 ? '/' : cwd.slice(0, i);
  }

  async function zmgrRefreshQuota(q) {
    if (!q) {
      try { q = await zmgrFetch('GET', '/zdrive/quota'); } catch { return; }
    }
    const used = q.used || 0, quota = q.quota || (10 * 1024 * 1024);
    const pct = quota ? Math.min(100, Math.round(100 * used / quota)) : 0;
    const bar = zmgrEl('zmgr-bar');
    if (bar) bar.style.width = pct + '%';
    const u = zmgrEl('zmgr-used'); if (u) u.textContent = zmgrFmt(used) + ' used';
    const f = zmgrEl('zmgr-free'); if (f) f.textContent = zmgrFmt(Math.max(0, quota - used));
    const p = zmgrEl('zmgr-pct'); if (p) p.textContent = pct + '%';
  }

  async function zmgrList() {
    const list = zmgrEl('zmgr-list');
    const cwdLab = zmgrEl('zmgr-cwd');
    if (cwdLab) cwdLab.textContent = zmgrCwd;
    if (!list) return;
    list.innerHTML = '<div class="zmgr-row"><span class="muted">Loading…</span></div>';
    try {
      const data = await zmgrFetch('GET', '/zdrive/ls?path=' + encodeURIComponent(zmgrCwd));
      await zmgrRefreshQuota(data);
      const entries = data.entries || [];
      if (!entries.length) {
        list.innerHTML = '<div class="zmgr-row"><span class="muted">(empty — mkdir or new file)</span></div>';
        return;
      }
      list.innerHTML = '';
      for (const e of entries) {
        const row = document.createElement('div');
        row.className = 'zmgr-row';
        row.setAttribute('role', 'listitem');
        const name = document.createElement('span');
        name.className = 'name' + (e.kind === 'dir' ? ' dir' : '') + (e.shared ? ' shared' : '');
        name.textContent = e.name + (e.kind === 'dir' ? '/' : '');
        name.title = e.path;
        name.addEventListener('click', () => {
          if (e.kind === 'dir') { zmgrCwd = e.path; zmgrList(); }
          else zmgrOpenFile(e.path);
        });
        const sz = document.createElement('span');
        sz.className = 'sz';
        sz.textContent = e.kind === 'dir' ? 'dir' : zmgrFmt(e.size);
        const acts = document.createElement('div');
        acts.className = 'acts';
        if (e.kind === 'file') {
          const openBtn = document.createElement('button');
          openBtn.type = 'button'; openBtn.textContent = 'edit';
          openBtn.onclick = () => zmgrOpenFile(e.path);
          const shareBtn = document.createElement('button');
          shareBtn.type = 'button'; shareBtn.textContent = e.shared ? 'unshare' : 'share';
          shareBtn.onclick = async () => {
            try {
              await zmgrFetch('POST', '/zdrive/share', { path: e.path, shared: !e.shared });
              zmgrStatus(e.shared ? 'Unshared' : 'Shared to Community', 'ok');
              zmgrList();
            } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
          };
          acts.appendChild(openBtn); acts.appendChild(shareBtn);
        }
        const delBtn = document.createElement('button');
        delBtn.type = 'button'; delBtn.textContent = 'rm'; delBtn.className = 'danger';
        delBtn.onclick = async () => {
          if (!confirm('Delete ' + e.path + (e.kind === 'dir' ? ' (and contents)?' : '?'))) return;
          try {
            await zmgrFetch('POST', '/zdrive/rm', { path: e.path, recursive: e.kind === 'dir' });
            if (zmgrEditPath === e.path) zmgrCloseEdit();
            zmgrStatus('Removed ' + e.path, 'ok');
            zmgrList();
          } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
        };
        acts.appendChild(delBtn);
        row.appendChild(name); row.appendChild(sz); row.appendChild(acts);
        list.appendChild(row);
      }
      zmgrStatus('');
    } catch (err) {
      list.innerHTML = '<div class="zmgr-row"><span class="muted">Could not load Z Drive</span></div>';
      zmgrStatus(String(err.message || err), 'err');
    }
  }

  async function zmgrOpenFile(path) {
    try {
      const data = await zmgrFetch('GET', '/zdrive/read?path=' + encodeURIComponent(path));
      zmgrEditPath = path;
      const ed = zmgrEl('zmgr-editor');
      if (ed) ed.classList.add('open');
      const lab = zmgrEl('zmgr-edit-path'); if (lab) lab.textContent = path;
      const ta = zmgrEl('zmgr-text'); if (ta) ta.value = data.content || '';
      zmgrStatus('Editing ' + path);
    } catch (err) {
      zmgrStatus(String(err.message || err), 'err');
    }
  }

  function zmgrCloseEdit() {
    zmgrEditPath = null;
    const ed = zmgrEl('zmgr-editor');
    if (ed) ed.classList.remove('open');
    const ta = zmgrEl('zmgr-text'); if (ta) ta.value = '';
  }

  function zmgrBind() {
    const root = zmgrEl('acct-zdrive');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';
    zmgrEl('zmgr-up')?.addEventListener('click', () => { zmgrCwd = zmgrParent(zmgrCwd); zmgrList(); });
    zmgrEl('zmgr-refresh')?.addEventListener('click', () => zmgrList());
    zmgrEl('zmgr-mkdir')?.addEventListener('click', async () => {
      const name = (zmgrEl('zmgr-newname')?.value || '').trim().replace(/^\/+/, '');
      if (!name) { zmgrStatus('Name a folder first', 'err'); return; }
      const path = zmgrJoin(zmgrCwd, name.split('/')[0]);
      try {
        await zmgrFetch('POST', '/zdrive/mkdir', { path, parents: true });
        zmgrEl('zmgr-newname').value = '';
        zmgrStatus('Created ' + path, 'ok');
        zmgrList();
      } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
    });
    zmgrEl('zmgr-newfile')?.addEventListener('click', async () => {
      let name = (zmgrEl('zmgr-newname')?.value || '').trim().replace(/^\/+/, '');
      if (!name) name = 'notes.txt';
      if (!name.includes('.')) name += '.txt';
      const path = zmgrJoin(zmgrCwd, name.split('/')[0]);
      try {
        await zmgrFetch('POST', '/zdrive/write', { path, content: '' });
        zmgrEl('zmgr-newname').value = '';
        zmgrStatus('Created ' + path, 'ok');
        await zmgrList();
        zmgrOpenFile(path);
      } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
    });
    zmgrEl('zmgr-save')?.addEventListener('click', async () => {
      if (!zmgrEditPath) return;
      const content = zmgrEl('zmgr-text')?.value ?? '';
      try {
        const r = await zmgrFetch('POST', '/zdrive/write', { path: zmgrEditPath, content });
        zmgrStatus('Saved · ' + zmgrFmt(r.size) + ' · quota ' + zmgrFmt(r.used) + '/' + zmgrFmt(r.quota), 'ok');
        zmgrRefreshQuota(r);
        zmgrList();
      } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
    });
    zmgrEl('zmgr-share')?.addEventListener('click', async () => {
      if (!zmgrEditPath) return;
      try {
        await zmgrFetch('POST', '/zdrive/share', { path: zmgrEditPath, shared: true });
        zmgrStatus('Shared to Community pool', 'ok');
        zmgrList();
      } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
    });
    zmgrEl('zmgr-unshare')?.addEventListener('click', async () => {
      if (!zmgrEditPath) return;
      try {
        await zmgrFetch('POST', '/zdrive/share', { path: zmgrEditPath, shared: false });
        zmgrStatus('Unshared', 'ok');
        zmgrList();
      } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
    });
    zmgrEl('zmgr-delete')?.addEventListener('click', async () => {
      if (!zmgrEditPath) return;
      if (!confirm('Delete ' + zmgrEditPath + '?')) return;
      try {
        await zmgrFetch('POST', '/zdrive/rm', { path: zmgrEditPath });
        zmgrCloseEdit();
        zmgrStatus('Deleted', 'ok');
        zmgrList();
      } catch (err) { zmgrStatus(String(err.message || err), 'err'); }
    });
    zmgrEl('zmgr-close-edit')?.addEventListener('click', () => zmgrCloseEdit());
  }

  async function zmgrShow(on) {
    const root = zmgrEl('acct-zdrive');
    if (!root) return;
    if (!on) { root.hidden = true; return; }
    root.hidden = false;
    zmgrBind();
    try {
      const q = await zmgrFetch('GET', '/zdrive/quota');
      if (q.home) zmgrCwd = q.home;
      await zmgrRefreshQuota(q);
    } catch {}
    await zmgrList();
  }

  function show(logged) {
    zmgrShow(logged);
    const gate = $('#acct-gate');
    const info = $('#acct-info');
    if (gate) gate.classList.toggle('hidden', logged);
    if (info) info.classList.toggle('hidden', !logged);
  
    const lla = document.getElementById('acct-lla');
    if (lla && !logged) lla.classList.add('hidden');
  }
  function setFact() {
    const el = $('#fact-text');
    if (el) el.textContent = FACTS[factIdx % FACTS.length];
  }

  function renderAccountLabcard(u) {
    const el = $('#acct-labcard-card');
    if (!el || !window.LabCard || !window.LabCard.renderInto) return;
    const p = u || (window.LabCard.getProfile && window.LabCard.getProfile()) || {};
    const username = p.username || 'hunter';
    const labId = p.lab_id || (p.id != null ? '969-' + String(p.id).padStart(3, '0') : '969-???');
    const balance = (window.LLT && typeof window.LLT.balance === 'function')
      ? window.LLT.balance() : (p.llt != null ? p.llt : 100);
    const currentXp = (window.LLT && window.LLT.get && window.LLT.get().xp != null)
      ? window.LLT.get().xp : (p.xp != null ? p.xp : 0);
    window.LabCard.renderInto(el, {
      member: true,
      variant: 'account',
      name: p.display_name || username,
      nick: username,
      lab_id: labId,
      title: p.title || '',
      title_label: p.title_label || '',
      llt: balance,
      xp: currentXp,
      role: p.role || 'member',
      skin: p.labcard_skin || 'default',
      avatar_id: p.avatar_id || p.avatar || '',
      avatar: p.avatar_id || p.avatar || '',
    });
  }
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function calebCheer(u) {
    const name = (u && (u.display_name || u.username)) || 'operator';
    const solved = Number(u && u.solved) || 0;
    const total = Math.max(1, Number(u && u.total_challenges) || 24);
    const pct = Math.min(100, Math.round((solved / total) * 100));
    const xp = Number(u && u.xp) || 0;
    const llt = (u && u.llt != null) ? Number(u.llt) : null;
    const friends = Number(u && u.friend_count) || 0;
    const day = Math.floor(Date.now() / 86400000);
    const pick = (arr) => arr[(day + solved + xp) % arr.length];

    if (!u) {
      return pick([
        'Hey — log in and I’ll tailor this. I’m watching the board for you.',
        'Sign in, operator. I’ve got a personal note waiting.',
      ]);
    }

    if (solved <= 0) {
      return pick([
        'Hey ' + name + ' — fresh board, clean slate. Grab any Lab Lounge card and I’ll be in your corner.',
        name + ', zero flags yet and that’s fine. First LLZ{…} hits different. You’ve got this.',
        'Welcome in, ' + name + '. Open Lab Lounge, pick something that looks fun — I’ll cheer the submit.',
      ]);
    }
    if (pct >= 100 || solved >= total) {
      return pick([
        name + ' — you cleared the board. Absolute menace. Stretch into LLC / mzfconsole or drop a tip on LLZ LabZocial.',
        'Full clear, ' + name + '. I’m proud of that grind. Teach someone on Community or hunt a harder track.',
      ]);
    }
    if (pct >= 60) {
      return pick([
        name + ' — ' + solved + '/' + total + ' (' + pct + '%). You’re deep in. Finish strong; I’m hyped for you.',
        'Look at you, ' + name + ': ' + solved + ' flags banked. That mid-late stretch is where legends form.',
        name + ', ' + xp + ' XP and climbing. Keep the rhythm — one clean solve at a time.',
      ]);
    }
    if (pct >= 25) {
      return pick([
        'Nice pace, ' + name + ' — ' + solved + ' down. Momentum beats perfection. Next flag’s closer than it looks.',
        name + ': ' + solved + '/' + total + ' solved. You’re not guessing anymore — you’re hunting. Love that.',
        'Hey ' + name + ' — solid middle stretch. Take a breath, then crack one more before you bounce.',
      ]);
    }
    // early progress
    let line = pick([
      'Hey ' + name + ' — ' + solved + ' flag' + (solved === 1 ? '' : 's') + ' already. That’s a real start. Keep poking.',
      name + ', early wins stack. ' + solved + '/' + total + ' — don’t overthink the next one.',
      'Proud of you, ' + name + '. ' + solved + ' in the bag. Scope first, then curiosity — you know the drill.',
    ]);
    if (llt != null && llt >= 500) {
      line += ' Wallet looking healthy too (' + llt + ' LLT).';
    } else if (friends >= 3) {
      line += ' Crew of ' + friends + ' on LLZ LabZocial — nice.';
    } else if (xp >= 100) {
      line += ' ' + xp + ' XP already. Respect.';
    }
    return line;
  }

  function setQuote(u) {
    const el = $('#daily-quote');
    if (!el) return;
    const day = Math.floor(Date.now() / 86400000);
    const tip = QUOTES[day % QUOTES.length];
    const cheer = calebCheer(u || null);
    el.innerHTML =
      '<p class="caleb-cheer">' + escHtml(cheer) + '</p>' +
      '<p class="caleb-tip">“' + escHtml(tip) + '”</p>' +
      '<span class="caleb-attr">— Caleb</span>';
  }
  function setOk(msg) {
    const el = $('#acct-ok');
    if (el) el.textContent = msg || '';
  }
  function setTab(tab) {
    const forms = {
      login: $('#acct-login'),
      register: $('#acct-register'),
      forgot: $('#acct-forgot'),
      reset: $('#acct-reset'),
    };
    Object.keys(forms).forEach(k => {
      if (forms[k]) forms[k].classList.toggle('hidden', k !== tab);
    });
    $$('#acct-tabs button').forEach(b => {
      const on = (tab === 'reset') ? false : (b.dataset.acctTab === tab);
      b.classList.toggle('active', on);
    });
  }

  async function loadTracks() {
    const box = $('#track-chips');
    if (!box) return;
    try {
      const res = await fetch(API + '/challenges', {
        headers: token() ? { Authorization: 'Bearer ' + token() } : {}
      });
      const data = await res.json();
      const list = data.challenges || [];
      const tracks = {};
      list.forEach(c => { tracks[c.track] = (tracks[c.track] || 0) + 1; });
      box.innerHTML = Object.keys(tracks).sort().map(t =>
        `<span class="tag">${t} · ${tracks[t]}</span>`
      ).join('');
    } catch {
      box.innerHTML = '<span class="muted">Tracks load after login.</span>';
    }
  }

  async function loadMe() {
    const tok = token();
    if (!tok) { show(false); return; }
    try {
      const res = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + tok } });
      const data = await res.json();
      if (!res.ok) throw new Error('auth');
      const u = data.user || data;
      show(true);
      renderAccountLabcard(u);
      const user = u.username || 'hunter';
      $('#info-user').textContent = user;
      $('#info-xp').textContent = u.xp ?? 0;
      const solved = u.solved ?? 0;
      const total = u.total_challenges ?? 24;
      $('#info-solved').textContent = solved;
      $('#info-total').textContent = total;
      $('#info-role').textContent = u.role || 'member';
      showLlaEntry(u);
      wireLldOptIn();
      const em = $('#info-email');
      if (em) em.textContent = u.email || '—';
      $('#info-display').textContent =
        (u.display_name ? u.display_name + ' · ' : '') +
        'Dashboard for ethical operators. Labs=LLZ, social=LabZocial, guide=Z. Flags LLZ{…}.';
      $('#acct-title').textContent = 'Welcome, ' + (u.display_name || user);
      const pct = total ? Math.min(100, Math.round((solved / total) * 100)) : 0;
      const bar = $('#info-progress');
      if (bar) bar.style.width = pct + '%';
      const lab = $('#info-progress-label');
      if (lab) lab.textContent = solved + ' / ' + total + ' · ' + pct + '%';
      const ring = $('#mdash-ring');
      if (ring) ring.style.setProperty('--mdash-pct', pct + '%');
      const pctLab = $('#mdash-pct-label');
      if (pctLab) pctLab.textContent = pct + '%';
      document.querySelectorAll('#nav-account,#nav-account-btn').forEach(el => {
        if (window.LabCard && window.LabCard.paintNavButton) window.LabCard.paintNavButton(el);
        else el.textContent = user;
      });
      const lltVal = (u.llt != null ? u.llt : '—');
      const xpVal = (u.xp != null ? u.xp : 0);
      const lltEl = $('#info-llt');
      if (lltEl) lltEl.textContent = lltVal;
      const lltCard = $('#info-llt-card');
      if (lltCard) lltCard.textContent = lltVal;
      const xpCard = $('#info-xp-card');
      if (xpCard) xpCard.textContent = xpVal;
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      setQuote(u);
      initLabcardPicker(u);
      initAvatarPicker(u);
      initTitleShop(u);
      await loadTracks();
      await loadFriendsSnippet();
    } catch {
      localStorage.removeItem('laden_v12_token');
      try { sessionStorage.removeItem('laden_llc_session_v1'); } catch {}
      try { window.dispatchEvent(new Event('laden-auth')); } catch {}
      show(false);
    }
  }

  $$('#acct-tabs button').forEach(b => {
    b.onclick = () => {
      setOk('');
      setTab(b.dataset.acctTab);
    };
  });

  const form = $('#acct-login');
  if (form) form.onsubmit = async (e) => {
    e.preventDefault();
    $('#acct-err').textContent = '';
    setOk('');
    const fd = new FormData(e.target);
    const user = String(fd.get('username') || '').trim();
    const pass = String(fd.get('password') || '');
    try {
      if (location.protocol === 'http:') {
        location.replace('https://' + location.host + location.pathname + location.search + location.hash);
        return;
      }
      const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      let data = null;
      try { data = await res.json(); } catch (_) { data = null; }
      if (!res.ok) {
        const code = (data && data.error) || ('http_' + res.status);
        throw new Error(code);
      }
      if (!data || !data.token) throw new Error('no_token');
      localStorage.setItem('laden_v12_token', data.token);
      try { window.dispatchEvent(new Event('laden-auth')); } catch {}
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      await loadMe();
    } catch (err) {
      const msg = String((err && err.message) || '');
      let text = 'Login failed — check username/email and password.';
      if (msg === 'http_404' || msg === 'http_502' || msg === 'http_503') {
        text = 'Login service unreachable. Open https://laden.no/account/ and try again.';
      } else if (msg === 'Failed to fetch' || msg === 'NetworkError when attempting to fetch resource.' || /NetworkError|Failed to fetch|Load failed/i.test(msg)) {
        text = 'Network error — use https://laden.no (not http) and retry.';
      } else if (msg === 'no_token') {
        text = 'Login response incomplete — hard-refresh and retry.';
      }
      $('#acct-err').textContent = text;
    }
  };

  const reg = $('#acct-register');
  if (reg) reg.onsubmit = async (e) => {
    e.preventDefault();
    $('#acct-reg-err').textContent = '';
    setOk('');
    const fd = new FormData(e.target);
    try {
      const res = await fetch(API + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fd.get('username'),
          email: fd.get('email'),
          password: fd.get('password'),
          display_name: fd.get('display_name') || undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data && data.error) || 'fail');
      localStorage.setItem('laden_v12_token', data.token);
      try { window.dispatchEvent(new Event('laden-auth')); } catch {}
      setOk('Account created. Welcome mail queued.');
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      await loadMe();
    } catch (err) {
      $('#acct-reg-err').textContent = err.message === 'username_or_email_taken'
        ? 'Username or email already taken.'
        : err.message === 'invalid_email'
          ? 'Enter a valid email.'
          : 'Could not create account.';
    }
  };

  const forgot = $('#acct-forgot');
  if (forgot) forgot.onsubmit = async (e) => {
    e.preventDefault();
    $('#acct-forgot-err').textContent = '';
    setOk('');
    const fd = new FormData(e.target);
    try {
      const res = await fetch(API + '/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error('fail');
      setOk(data.message || 'If that email is registered, a reset link has been sent.');
      e.target.reset();
    } catch {
      $('#acct-forgot-err').textContent = 'Request failed — try again.';
    }
  };

  const reset = $('#acct-reset');
  if (reset) reset.onsubmit = async (e) => {
    e.preventDefault();
    $('#acct-reset-err').textContent = '';
    setOk('');
    const fd = new FormData(e.target);
    try {
      const res = await fetch(API + '/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fd.get('token'), password: fd.get('password') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data && data.error) || 'fail');
      if (data.token) localStorage.setItem('laden_v12_token', data.token);
      try { window.dispatchEvent(new Event('laden-auth')); } catch {}
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      setOk('Password updated. You are signed in.');
      // clear reset query
      try {
        const u = new URL(location.href);
        u.searchParams.delete('reset');
        history.replaceState({}, '', u.pathname + u.search + u.hash);
      } catch {}
      await loadMe();
    } catch (err) {
      $('#acct-reset-err').textContent = err.message === 'invalid_or_expired_token'
        ? 'Reset link invalid or expired.'
        : 'Could not reset password.';
    }
  };

  const logout = $('#acct-logout');
  if (logout) logout.onclick = () => {
    localStorage.removeItem('laden_v12_token');
      try { sessionStorage.removeItem('laden_llc_session_v1'); } catch {}
      try { window.dispatchEvent(new Event('laden-auth')); } catch {}
    try { if (window.LabCard && window.LabCard.clearCache) window.LabCard.clearCache(); } catch {}
    show(false);
    setTab('login');
    document.querySelectorAll('#nav-account,#nav-account-btn').forEach(el => { el.textContent = 'Login'; });
  };

  const next = $('#fact-next');
  if (next) next.onclick = () => { factIdx++; setFact(); };

  // ?reset=TOKEN → show reset form
  let resetToken = '';
  try {
    resetToken = new URL(location.href).searchParams.get('reset') || '';
  } catch {}
  if (resetToken) {
    const tokInput = $('#acct-reset-token');
    if (tokInput) tokInput.value = resetToken;
    setTab('reset');
    setOk('Enter a new password to finish the reset.');
  } else {
    setTab('login');
  }


  // --- Lab card skin picker ---
  let selectedSkin = 'default';
  let appliedSkin = 'default';

  function skinMeta() {
    if (window.LabCard && window.LabCard.SKIN_META) return window.LabCard.SKIN_META;
    return {};
  }
  function skinList() {
    if (window.LabCard && window.LabCard.SKINS) return window.LabCard.SKINS.slice();
    return ['default','neon-grid','purple-haze','ice-ops','ember','matrix','gold-op','void'];
  }
  function setSkinMsg(msg, isErr) {
    const el = $('#labcard-skin-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isErr ? '#ff6b7a' : 'rgba(230,241,255,.65)';
  }
  function paintSkinGrid() {
    const grid = $('#labcard-skin-grid');
    if (!grid) return;
    if (window.LabCard && window.LabCard.injectCss) window.LabCard.injectCss();
    const meta = skinMeta();
    grid.innerHTML = skinList().map(id => {
      const m = meta[id] || { label: id, blurb: id };
      const sel = id === selectedSkin ? ' is-selected' : '';
      return `<button type="button" class="labcard-skin-opt${sel}" data-skin="${id}" role="option" aria-selected="${id===selectedSkin}">
        <div class="labcard-skin-preview pv-${id}" aria-hidden="true"></div>
        <strong>${m.label || id}</strong>
        <span>${m.blurb || ''}${id===appliedSkin ? ' · active' : ''}</span>
      </button>`;
    }).join('');
    grid.querySelectorAll('[data-skin]').forEach(btn => {
      btn.onclick = () => {
        selectedSkin = btn.getAttribute('data-skin');
        paintSkinGrid();
        setSkinMsg(selectedSkin === appliedSkin
          ? 'Already active — apply is free.'
          : 'Ready to apply · costs 10 LLT.');
      };
    });
    const cur = $('#labcard-current-skin');
    if (cur) cur.textContent = appliedSkin;
  }

  async function applyLabcardSkin() {
    const tok = token();
    if (!tok) { setSkinMsg('Sign in to customize.', true); return; }
    const skin = selectedSkin;
    setSkinMsg('Applying…');
    const btn = $('#labcard-apply');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(API + '/llt/labcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ skin }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { setSkinMsg('Session expired — sign in again.', true); return; }
      if (!res.ok || data.ok === false) {
        const err = data.error || 'failed';
        setSkinMsg(err === 'insufficient_llt'
          ? 'Not enough LLT (need 10). Earn more on challenges.'
          : err === 'invalid_skin' ? 'Invalid skin.' : ('Could not apply: ' + err), true);
        if (data.balance != null) {
          document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(data.balance); });
        }
        return;
      }
      appliedSkin = data.skin || skin;
      selectedSkin = appliedSkin;
      if (data.balance != null) {
        document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(data.balance); });
        const lltEl = $('#info-llt'); if (lltEl) lltEl.textContent = data.balance;
        const lltCard = $('#info-llt-card'); if (lltCard) lltCard.textContent = data.balance;
      }
      try {
        if (window.LabCard) {
          window.LabCard.clearCache();
          window.LabCard.setLocalSkin(appliedSkin);
          await window.LabCard.refresh(true);
        }
      } catch {}
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      paintSkinGrid();
      const charged = data.charged != null ? data.charged : 0;
      setSkinMsg(charged
        ? 'Skin applied · −' + charged + ' LLT. Hover your nav name to see it.'
        : 'Skin already active · no charge.');
    } catch {
      setSkinMsg('Network error — try again.', true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function initLabcardPicker(u) {
    const skin = (u && u.labcard_skin) || (window.LabCard && window.LabCard.getSkin && window.LabCard.getSkin()) || 'default';
    appliedSkin = skin;
    selectedSkin = skin;
    paintSkinGrid();
    const apply = $('#labcard-apply');
    if (apply && !apply._wired) {
      apply._wired = true;
      apply.onclick = () => applyLabcardSkin();
    }
  }



  // --- Member avatar picker (100 LLT) ---
  let selectedAvatar = '';
  let appliedAvatar = '';

  function avatarList() {
    if (window.LadenAvatars && window.LadenAvatars.list) return window.LadenAvatars.list();
    return [];
  }
  function setAvatarMsg(msg, isErr) {
    const el = $('#avatar-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isErr ? '#ff6b7a' : 'rgba(230,241,255,.65)';
  }
  function paintAvatarGrid() {
    const grid = $('#avatar-grid');
    if (!grid) return;
    try { if (window.LadenAvatars && window.LadenAvatars.ensureCss) window.LadenAvatars.ensureCss(); } catch {}
    const list = avatarList();
    if (!list.length) {
      grid.innerHTML = '<p class="muted">Avatars loading…</p>';
      return;
    }
    grid.innerHTML = list.map(m => {
      const id = m.id;
      const sel = id === selectedAvatar ? ' is-selected' : '';
      const html = (window.LadenAvatars && window.LadenAvatars.html) ? window.LadenAvatars.html(id) : '';
      return `<button type="button" class="laden-av-opt${sel}" data-avatar="${id}" role="option" aria-selected="${id===selectedAvatar}">
        ${html}
        <strong>${m.name || id}</strong>
        <span>${id}${id===appliedAvatar ? ' · active' : ''}</span>
      </button>`;
    }).join('');
    grid.querySelectorAll('[data-avatar]').forEach(btn => {
      btn.onclick = () => {
        selectedAvatar = btn.getAttribute('data-avatar') || '';
        paintAvatarGrid();
        setAvatarMsg(selectedAvatar === appliedAvatar
          ? 'Already active — apply is free.'
          : 'Ready to apply · costs 100 LLT.');
      };
    });
    const cur = $('#avatar-current');
    if (cur) cur.textContent = appliedAvatar || 'initials';
  }

  async function applyAvatar(forceId) {
    const tok = token();
    if (!tok) { setAvatarMsg('Sign in to customize.', true); return; }
    const avatar = forceId !== undefined ? forceId : selectedAvatar;
    if (!avatar) { setAvatarMsg('Pick an avatar first.', true); return; }
    setAvatarMsg('Applying…');
    const btn = $('#avatar-apply');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(API + '/llt/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ avatar }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { setAvatarMsg('Session expired — sign in again.', true); return; }
      if (!res.ok || data.ok === false) {
        const err = data.error || 'failed';
        setAvatarMsg(err === 'insufficient_llt'
          ? 'Not enough LLT (need 100). Earn more on challenges.'
          : err === 'invalid_avatar' ? 'Invalid avatar.' : ('Could not apply: ' + err), true);
        if (data.balance != null) {
          document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(data.balance); });
        }
        return;
      }
      appliedAvatar = data.avatar_id || data.avatar || avatar;
      selectedAvatar = appliedAvatar;
      if (data.balance != null) {
        document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(data.balance); });
        const lltEl = $('#info-llt'); if (lltEl) lltEl.textContent = data.balance;
        const lltCard = $('#info-llt-card'); if (lltCard) lltCard.textContent = data.balance;
      }
      try {
        if (window.LabCard) {
          window.LabCard.clearCache();
          if (window.LabCard.setLocalAvatar) window.LabCard.setLocalAvatar(appliedAvatar);
          await window.LabCard.refresh(true);
        }
      } catch {}
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      paintAvatarGrid();
      const charged = data.charged != null ? data.charged : 0;
      setAvatarMsg(charged
        ? 'Avatar applied · −' + charged + ' LLT. Hover your nav name — open Caleb for the scared look.'
        : 'Avatar already active · no charge.');
    } catch {
      setAvatarMsg('Network error — try again.', true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function initAvatarPicker(u) {
    const id = (u && (u.avatar_id || u.avatar)) || (window.LabCard && window.LabCard.getAvatar && window.LabCard.getAvatar()) || '';
    appliedAvatar = id;
    selectedAvatar = id || (avatarList()[0] && avatarList()[0].id) || '';
    paintAvatarGrid();
    const apply = $('#avatar-apply');
    if (apply && !apply._wired) {
      apply._wired = true;
      apply.onclick = () => applyAvatar();
    }
    const clear = $('#avatar-clear');
    if (clear && !clear._wired) {
      clear._wired = true;
      clear.onclick = () => {
        setAvatarMsg('Initials are free for guests; members keep their last paid avatar until they pick another. Pick any character above to change (100 LLT).');
      };
    }
  }



  // --- Titles shop ---
  let titleCatalog = [];
  let titleOwned = [];
  let titleEquipped = '';
  let titleSelected = '';

  function setTitleMsg(msg, isErr) {
    const el = $('#title-shop-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isErr ? '#ff6b7a' : 'rgba(230,241,255,.65)';
  }

  function paintTitleGrid() {
    const grid = $('#title-shop-grid');
    if (!grid) return;
    if (!titleCatalog.length) {
      grid.innerHTML = '<p class="muted">Loading titles…</p>';
      return;
    }
    grid.innerHTML = titleCatalog.map(item => {
      const id = item.id;
      const owned = titleOwned.indexOf(id) >= 0;
      const eq = id === titleEquipped;
      const sel = id === titleSelected ? ' is-selected' : '';
      const cls = 'title-shop-opt' + (owned ? ' is-owned' : '') + (eq ? ' is-equipped' : '') + sel;
      const badge = eq ? '<span class="title-badge">equipped</span>' : (owned ? '<span class="title-badge">owned</span>' : '');
      const price = owned ? 'Owned · equip free' : (item.price + ' LLT');
      return `<button type="button" class="${cls}" data-title="${id}" role="option" aria-selected="${id===titleSelected}">
        <strong>${item.label || id}</strong>
        <span class="title-blurb">${item.blurb || ''}</span>
        <span class="title-price">${price}</span> ${badge}
      </button>`;
    }).join('');
    grid.querySelectorAll('[data-title]').forEach(btn => {
      btn.onclick = () => {
        titleSelected = btn.getAttribute('data-title') || '';
        paintTitleGrid();
        const owned = titleOwned.indexOf(titleSelected) >= 0;
        const meta = titleCatalog.find(x => x.id === titleSelected);
        setTitleMsg(owned
          ? (titleSelected === titleEquipped ? 'Already equipped.' : 'Owned — click Equip.')
          : ('Buy for ' + ((meta && meta.price) || '?') + ' LLT, then Equip.'));
      };
    });
    const cur = $('#title-current');
    if (cur) {
      const meta = titleCatalog.find(x => x.id === titleEquipped);
      cur.textContent = meta ? meta.label : (titleEquipped || 'none');
    }
  }

  async function loadTitleCatalog(u) {
    try {
      const res = await fetch(API + '/llt/titles', {
        headers: token() ? { Authorization: 'Bearer ' + token() } : {},
      });
      const data = await res.json().catch(() => ({}));
      titleCatalog = data.catalog || [];
      titleOwned = data.owned || (u && u.titles) || [];
      titleEquipped = data.title || (u && u.title) || '';
      if (!titleSelected) titleSelected = titleEquipped || (titleCatalog[0] && titleCatalog[0].id) || '';
    } catch {
      titleCatalog = [];
    }
  }

  async function buyTitle() {
    const tok = token();
    if (!tok) { setTitleMsg('Sign in first.', true); return; }
    if (!titleSelected) { setTitleMsg('Pick a title.', true); return; }
    setTitleMsg('Buying…');
    const btn = $('#title-buy');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(API + '/llt/title/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ title: titleSelected }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { setTitleMsg('Session expired.', true); return; }
      if (!res.ok || data.ok === false) {
        setTitleMsg(data.error === 'insufficient_llt'
          ? 'Not enough LLT.'
          : ('Could not buy: ' + (data.error || 'failed')), true);
        if (data.balance != null) {
          document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(data.balance); });
        }
        return;
      }
      titleOwned = data.titles || titleOwned;
      if (data.balance != null) {
        document.querySelectorAll('[data-llt-balance]').forEach(el => { el.textContent = String(data.balance); });
        const lltEl = $('#info-llt'); if (lltEl) lltEl.textContent = data.balance;
        const lltCard = $('#info-llt-card'); if (lltCard) lltCard.textContent = data.balance;
      }
      try { if (window.LLT && window.LLT.sync) await window.LLT.sync(); } catch {}
      paintTitleGrid();
      const charged = data.charged != null ? data.charged : 0;
      setTitleMsg(charged
        ? 'Purchased · −' + charged + ' LLT. Now Equip it.'
        : (data.already_owned ? 'Already owned — Equip free.' : 'Owned.'));
    } catch {
      setTitleMsg('Network error.', true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function equipTitle(forceId) {
    const tok = token();
    if (!tok) { setTitleMsg('Sign in first.', true); return; }
    const tid = forceId !== undefined ? forceId : titleSelected;
    if (tid === undefined || tid === null) { setTitleMsg('Pick a title.', true); return; }
    if (tid && titleOwned.indexOf(tid) < 0) { setTitleMsg('Buy it first.', true); return; }
    setTitleMsg('Equipping…');
    const btn = $('#title-equip');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(API + '/llt/title/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ title: tid }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { setTitleMsg('Session expired.', true); return; }
      if (!res.ok || data.ok === false) {
        setTitleMsg('Could not equip: ' + (data.error || 'failed'), true);
        return;
      }
      titleEquipped = data.title || '';
      titleOwned = data.titles || titleOwned;
      try {
        if (window.LabCard) {
          window.LabCard.clearCache();
          if (window.LabCard.setLocalTitle) window.LabCard.setLocalTitle(titleEquipped, data.title_label || '');
          await window.LabCard.refresh(true);
        }
      } catch {}
      paintTitleGrid();
      setTitleMsg(titleEquipped
        ? ('Equipped · ' + (data.title_label || titleEquipped))
        : 'Title cleared — role shows again.');
    } catch {
      setTitleMsg('Network error.', true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function initTitleShop(u) {
    const lab = $('#title-lab-id');
    if (lab) lab.textContent = (u && u.lab_id) || (u && u.id != null ? ('969-' + String(u.id).padStart(3,'0')) : '—');
    loadTitleCatalog(u).then(() => {
      paintTitleGrid();
    });
    const buy = $('#title-buy');
    if (buy && !buy._wired) { buy._wired = true; buy.onclick = () => buyTitle(); }
    const eq = $('#title-equip');
    if (eq && !eq._wired) { eq._wired = true; eq.onclick = () => equipTitle(); }
    const clr = $('#title-clear');
    if (clr && !clr._wired) { clr._wired = true; clr.onclick = () => equipTitle(''); }
  }


  window.addEventListener('labcard-change', () => renderAccountLabcard());
  window.addEventListener('llt-change', () => renderAccountLabcard());
  wireLldOptIn();
  setQuote();
  setFact();
  loadMe();


  function zocialEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderZocialPreview(u) {
    const root = document.getElementById('acct-zocial-preview');
    if (!root) return;
    const z = (u && u.zocial) || {};
    const username = (u && u.username) || 'you';
    const name = (u && u.display_name) || username;
    const title = (u && (u.title_label || u.title)) || '';
    const pills = [];
    if (z.fav_tool) pills.push('<span class="zocial-pill">tool <b>' + zocialEsc(z.fav_tool) + '</b></span>');
    if (z.fav_distro) pills.push('<span class="zocial-pill">distro <b>' + zocialEsc(z.fav_distro) + '</b></span>');
    if (z.fav_track) pills.push('<span class="zocial-pill">track <b>' + zocialEsc(z.fav_track) + '</b></span>');
    if (z.role_title) pills.push('<span class="zocial-pill">role <b>' + zocialEsc(z.role_title) + '</b></span>');
    if (z.location) pills.push('<span class="zocial-pill">📍 <b>' + zocialEsc(z.location) + '</b></span>');
    if (title) pills.push('<span class="zocial-pill">' + zocialEsc(title) + '</span>');
    const links = (z.links || []).map(function (l) {
      return '<a href="' + zocialEsc(l.url) + '" target="_blank" rel="noopener">' + zocialEsc(l.label || l.url) + '</a>';
    }).join('');
    root.innerHTML =
      '<div class="zocial-card-top"><div class="zocial-card-meta">' +
        '<p class="zocial-card-name">' + zocialEsc(name) + '</p>' +
        '<p class="zocial-card-nick">@' + zocialEsc(username) + '</p>' +
        '<div class="zocial-pills">' + (pills.join('') || '<span class="zocial-pill">empty profile</span>') + '</div>' +
      '</div></div>' +
      (z.bio ? '<p class="zocial-bio">' + zocialEsc(z.bio) + '</p>' : '<p class="zocial-bio muted">No bio yet.</p>') +
      (links ? '<div class="zocial-links">' + links + '</div>' : '');
  }

  function fillZocialForm(u) {
    const z = (u && u.zocial) || {};
    const bio = document.getElementById('zocial-bio');
    const tool = document.getElementById('zocial-tool');
    const distro = document.getElementById('zocial-distro');
    const role = document.getElementById('zocial-role');
    const loc = document.getElementById('zocial-location');
    const track = document.getElementById('zocial-track');
    const link = document.getElementById('zocial-link');
    if (bio) bio.value = z.bio || '';
    if (tool) tool.value = z.fav_tool || '';
    if (distro) distro.value = z.fav_distro || '';
    if (role) role.value = z.role_title || '';
    if (loc) loc.value = z.location || '';
    if (track) track.value = z.fav_track || '';
    if (link) link.value = (z.links && z.links[0] && z.links[0].url) || '';
    const view = document.getElementById('acct-zocial-view');
    if (view && u && u.username) view.href = '/community/u/' + encodeURIComponent(u.username) + '/';
    renderZocialPreview(u);
  }

  function collectZocialForm() {
    const links = [];
    const link = (document.getElementById('zocial-link') && document.getElementById('zocial-link').value || '').trim();
    if (link) links.push({ label: '', url: link });
    return {
      bio: (document.getElementById('zocial-bio') && document.getElementById('zocial-bio').value || '').trim(),
      fav_tool: (document.getElementById('zocial-tool') && document.getElementById('zocial-tool').value || '').trim(),
      fav_distro: (document.getElementById('zocial-distro') && document.getElementById('zocial-distro').value || '').trim(),
      role_title: (document.getElementById('zocial-role') && document.getElementById('zocial-role').value || '').trim(),
      location: (document.getElementById('zocial-location') && document.getElementById('zocial-location').value || '').trim(),
      fav_track: (document.getElementById('zocial-track') && document.getElementById('zocial-track').value || '').trim(),
      links: links,
    };
  }

  function wireZocialForm() {
    const form = document.getElementById('acct-zocial-form');
    if (!form || form._wired) return;
    form._wired = true;
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const msg = document.getElementById('acct-zocial-msg');
      const btn = document.getElementById('acct-zocial-save');
      if (msg) { msg.textContent = ''; msg.className = 'mono muted'; }
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(API + '/account/zocial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
          body: JSON.stringify({ zocial: collectZocialForm() }),
        });
        const data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error((data && data.error) || 'save_failed');
        if (data.user) fillZocialForm(data.user);
        else renderZocialPreview({ zocial: data.zocial || {}, username: 'you' });
        if (msg) { msg.textContent = 'Saved to LabZocial.'; msg.classList.add('ok'); }
      } catch (e) {
        if (msg) { msg.textContent = String(e.message || e); msg.classList.add('err'); }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
    // live preview on input
    ['zocial-bio','zocial-tool','zocial-distro','zocial-role','zocial-location','zocial-track','zocial-link'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        const nick = (document.getElementById('info-user') && document.getElementById('info-user').textContent) || 'you';
        renderZocialPreview({
          username: nick,
          display_name: (function(){ var t=document.getElementById('acct-title'); return t ? t.textContent.replace(/^Welcome,\s*/, '') : nick; })(),
          zocial: collectZocialForm(),
        });
      });
    });
  }


  async function loadFriendsSnippet() {
    const countEl = document.getElementById('acct-friend-count');
    const incEl = document.getElementById('acct-friend-incoming');
    const listEl = document.getElementById('acct-friends-list');
    if (!countEl && !listEl) return;
    try {
      const res = await fetch(API + '/community/friends', {
        headers: { Authorization: 'Bearer ' + token() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error('friends');
      const friends = data.friends || [];
      const incoming = data.incoming || [];
      if (countEl) countEl.textContent = friends.length;
      if (incEl) incEl.textContent = incoming.length;
      if (listEl) {
        listEl.textContent = friends.length
          ? friends.slice(0, 8).map(f => '@' + f.username).join(' · ')
          : 'No friends yet — head to Community → Friends.';
      }
    } catch {
      if (countEl) countEl.textContent = '—';
      if (incEl) incEl.textContent = '—';
      if (listEl) listEl.textContent = 'Friends load after login.';
    }
  }

})();
