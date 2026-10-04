/* Challenges — weekly free trio + LLT (Laden Labs Tokens) */
(() => {
  function tt(key, vars) {
    if (window.LadenI18n && typeof LadenI18n.t === 'function') return LadenI18n.t(key, vars);
    return key;
  }
  function locChallenge(c) {
    if (window.LadenI18n && typeof LadenI18n.localizeLab === 'function') return LadenI18n.localizeLab(c);
    return c;
  }
  function specialFor(slug) {
    const fb = (window.LLT_SPECIAL_HINTS && window.LLT_SPECIAL_HINTS[slug]) || tt('room.spoilerFallback');
    if (window.LadenI18n && typeof LadenI18n.specialHint === 'function') return LadenI18n.specialHint(slug, fb);
    return fb;
  }

  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';
  const NICK_KEY = 'laden_guest_nick';
  const HINT_COST = 3;
  const grid = document.getElementById('chal-grid');
  const panel = document.getElementById('chal-panel');
  const lead = document.getElementById('chal-lead');
  const cta = document.getElementById('chal-cta');
  const layout = document.querySelector('.chal-layout');
  const filters = document.getElementById('chal-filters');
  const search = document.getElementById('chal-search');
  if (!grid) return;

  const SPOTLIGHT = (window.LADEN_FEATURED && window.LADEN_FEATURED.slugs)
    ? window.LADEN_FEATURED.slugs()
    : ['scope-first', 'robots-redux', 'reflect-101'];

  /* Pin & rotate later — Lounge v1.1 code rooms */
  const CODE_SPOTLIGHT = (window.LADEN_CODE_FEATURED && Array.isArray(window.LADEN_CODE_FEATURED))
    ? window.LADEN_CODE_FEATURED.slice(0, 3)
    : ['fizzbuzz-flag', 'off-by-one', 'sql-string-concat'];

  const CODE_META = {
    'fizzbuzz-flag': {
      slug: 'fizzbuzz-flag', title: 'FizzBuzz Flag',
      summary: 'Classic loop discipline — count to the flag.',
      difficulty: 'easy', points: 40, track: 'algo'
    },
    'off-by-one': {
      slug: 'off-by-one', title: 'Off-By-One',
      summary: 'Fencepost errors: loops that go one too far.',
      difficulty: 'easy', points: 45, track: 'language'
    },
    'sql-string-concat': {
      slug: 'sql-string-concat', title: 'SQL String Concat',
      summary: 'Never build SQL with string concatenation of user input.',
      difficulty: 'med', points: 120, track: 'secure-code'
    }
  };

  let all = [];
  let openSlug = '';

  function getNick() {
    try { return (sessionStorage.getItem(NICK_KEY) || '').trim(); } catch { return ''; }
  }
  function setNick(v) {
    const clean = String(v || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    try {
      if (clean) sessionStorage.setItem(NICK_KEY, clean);
      else sessionStorage.removeItem(NICK_KEY);
    } catch {}
    return clean;
  }
  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function loggedIn() {
    const t = token();
    if (!t) return false;
    try {
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !!(p.usr || p.username || p.sub);
    } catch { return false; }
  }
  function displayHandle() {
    if (loggedIn()) {
      try {
        const t = token();
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return p.usr || p.username || 'member';
      } catch { return 'member'; }
    }
    return getNick() || 'guest';
  }
  function syncNickUI() {
    const wrap = document.getElementById('chal-nick-wrap');
    const input = document.getElementById('chal-nick');
    const hint = document.getElementById('chal-nick-hint');
    const clearBtn = document.getElementById('chal-nick-clear');
    if (!wrap) return;
    if (loggedIn()) { wrap.hidden = true; return; }
    wrap.hidden = false;
    const nick = getNick();
    if (input && document.activeElement !== input) input.value = nick;
    wrap.classList.toggle('is-set', !!nick);
    if (clearBtn) clearBtn.hidden = !nick;
    if (hint) {
      hint.textContent = nick
        ? ('Playing as ' + nick + ' this session — Caleb & LLC will use it.')
        : 'Guests only — stays in this browser tab. Caleb & LLC will use it.';
    }
  }
  function wireNick() {
    const input = document.getElementById('chal-nick');
    const save = document.getElementById('chal-nick-save');
    const clearBtn = document.getElementById('chal-nick-clear');
    if (!input || !save) return;
    const apply = () => {
      setNick(input.value);
      syncNickUI();
      try { window.dispatchEvent(new CustomEvent('laden-nick', { detail: { nick: getNick() } })); } catch {}
    };
    save.addEventListener('click', apply);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    if (clearBtn) clearBtn.addEventListener('click', () => {
      setNick(''); input.value = ''; syncNickUI();
      try { window.dispatchEvent(new CustomEvent('laden-nick', { detail: { nick: '' } })); } catch {}
    });
    syncNickUI();
  }

  function pendingSlug() {
    try {
      const u = new URL(location.href);
      return u.searchParams.get('chal') || u.searchParams.get('challenge') || '';
    } catch { return ''; }
  }
  async function api(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(API + path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { data, status: res.status });
    return data;
  }
  function diffTag(d) {
    d = (d || 'easy').toLowerCase();
    return d === 'hard' ? 'hard' : (d === 'med' || d === 'medium') ? 'med' : 'easy';
  }
  function trio() {
    const bySlug = Object.fromEntries(all.map(c => [c.slug, c]));
    let list = SPOTLIGHT.map(s => bySlug[s]).filter(Boolean);
    if (list.length < 3) {
      const used = new Set(list.map(c => c.slug));
      for (const c of all) {
        if (used.has(c.slug)) continue;
        list.push(c);
        if (list.length >= 3) break;
      }
    }
    return list;
  }
  function isSolvedLocal(slug) {
    return (window.LLT && window.LLT.hasSolved(slug)) || false;
  }
  function rewardPts(c) {
    const pts = (window.LLT_POINTS && window.LLT_POINTS[c.slug]) || c.points || 50;
    return window.LLT ? window.LLT.rewardForPoints(pts) : Math.max(5, Math.round(pts / 10));
  }

  function renderGrid() {
    const list = trio();
    const elShown = document.getElementById('stat-shown');
    if (elShown) elShown.textContent = String(list.length);
    syncNickUI();
    if (window.LLT) window.LLT.mountBalances();
    if (lead) {
      const guestKeep = loggedIn()
        ? ''
        : ' <strong>Want to keep your LLT?</strong> <a href="/account/">Create an account</a>.';
      lead.innerHTML = 'Weekly <strong>Hack</strong> rotators + a <strong>Code</strong> trio — <strong>new challenges every week!</strong> Crack flags for <b>LLT</b>, play Tool Drop, spend tokens on special hints or the weekly merch drop. <span class="mono">1 LLT = 1 NOK</span>. Full board stays in <a href="/labs/">Labs</a>.' + guestKeep;
    }
    if (cta) cta.hidden = false;
    if (filters) filters.hidden = true;
    if (search) search.hidden = true;
    grid.classList.add('chal-spotlight-grid');

    grid.innerHTML = list.map(c => {
      const open = c.slug === openSlug ? ' is-open' : '';
      const tag = diffTag(c.difficulty);
      const solved = (c.solved || isSolvedLocal(c.slug)) ? ' ✓' : '';
      const reward = rewardPts(c);
      c = locChallenge(c);
      return `<article class="card chal-spotlight chal-hack${open}" data-slug="${c.slug}">
        <span class="chal-spotlight-badge hack">Hack · this week</span>
        <span class="tag ${tag}">${(c.difficulty || 'easy').toUpperCase()} · ${c.points} XP</span>
        <h3>${c.title}${solved}</h3>
        <p>${c.summary || ''}</p>
        <div class="meta"><span>${c.track}</span><span class="mono">+${reward} LLT</span></div>
      </article>`;
    }).join('') || '<p class="muted">No challenges loaded.</p>';

    grid.querySelectorAll('article.card[data-slug]').forEach(card => {
      card.addEventListener('click', () => openChallenge(card.dataset.slug));
    });
  }

  function codeTrio() {
    return CODE_SPOTLIGHT.map(s => CODE_META[s]).filter(Boolean);
  }

  function renderCodeGrid() {
    const codeGrid = document.getElementById('code-chal-grid');
    if (!codeGrid) return;
    const list = codeTrio();
    codeGrid.innerHTML = list.map(c => {
      const tag = diffTag(c.difficulty);
      const solved = isSolvedLocal(c.slug) ? ' ✓' : '';
      const reward = rewardPts(c);
      const href = '/labs/v1.1/code/' + encodeURIComponent(c.slug) + '/';
      return `<a class="card chal-spotlight chal-code" href="${href}" data-slug="${c.slug}">
        <span class="chal-spotlight-badge code">Code · this week</span>
        <span class="tag ${tag}">${(c.difficulty || 'easy').toUpperCase()} · ${c.points} XP</span>
        <h3>${c.title}${solved}</h3>
        <p>${c.summary || ''}</p>
        <div class="meta"><span>${c.track}</span><span class="mono">+${reward} LLT</span></div>
      </a>`;
    }).join('') || '<p class="muted">No code challenges loaded.</p>';
  }

  async function awardSolve(slug, c) {
    if (!window.LLT) return 0;
    const r = await window.LLT.markSolved(slug, rewardPts(c || { slug, points: 50 }));
    return (r && r.ok) ? (r.reward || 0) : 0;
  }

  async function sha256hex(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function normFlag(flag) {
    let s = String(flag || '').trim();
    s = s.replace(/^(laden|llz)\{/i, 'LLZ{');
    return s;
  }
  async function checkFlagLocal(slug, flag) {
    const expect = (window.LLT_FLAG_HASHES && window.LLT_FLAG_HASHES[slug]) || '';
    if (!expect) return false;
    const norm = normFlag(flag);
    try { return (await sha256hex(norm)) === expect; } catch { return false; }
  }

  async function openChallenge(slug) {
    // Dedicated lab room for every challenge
    location.href = '/labs/' + encodeURIComponent(slug) + '/';
    return;
    if (!SPOTLIGHT.includes(slug) && !trio().some(c => c.slug === slug)) {
      location.href = '/labs/' + encodeURIComponent(slug) + '/';
      return;
    }
    openSlug = slug;
    renderGrid();
    try {
      const { challenge: c } = await api('/challenges/' + encodeURIComponent(slug));
      panel.classList.remove('hidden');
      layout.classList.add('with-panel');
      const solved = c.solved || isSolvedLocal(slug);
      const hinted = window.LLT && window.LLT.hasHint(slug);
      const special = specialFor(slug);
      c = locChallenge(c);
      const reward = rewardPts(c);
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start;flex-wrap:wrap">
          <div>
            <span class="tag ${diffTag(c.difficulty)}">${(c.difficulty || '').toUpperCase()}</span>
            <span class="tag">${c.track}</span>
            <span class="tag">${c.points} XP</span>
            <span class="tag easy">+${reward} LLT</span>
            ${solved ? '<span class="tag easy">SOLVED</span>' : ''}
            <h2 style="font-family:Orbitron,sans-serif;font-size:1.15rem;margin:.5rem 0 .25rem">${c.title}</h2>
            <div class="mono muted" style="font-size:.75rem">${c.slug}</div>
          </div>
          <button type="button" class="btn btn-ghost" id="chal-close">Close</button>
        </div>
        <div class="learn"><strong>${tt('chal.learnLabel')}</strong> ${c.learn || '—'}</div>
        <div class="chal-body">${c.body_html || ''}</div>
        <p class="muted mono" style="font-size:.78rem;margin-top:.6rem">${tt('chal.freeHint', { hint: c.hint || '—' })}</p>
        <div id="special-hint-box" class="learn" style="${hinted ? '' : 'display:none'}"><strong>${tt('room.specialHintLabel')}</strong> ${special}</div>
        <div class="flag-row">
          <input id="flag-in" placeholder="LLZ{…}" value="${(c.flag_suggest || (window.LLT_FLAG_SUGGEST && window.LLT_FLAG_SUGGEST[slug]) || 'LLZ{...}').replace(/"/g, '')}" autocomplete="off" spellcheck="false">
          <button class="btn btn-primary" type="button" id="flag-go">Submit flag</button>
        </div>
        <div class="flag-row">
          <button class="btn btn-cyan" type="button" id="hint-buy" ${hinted ? 'disabled' : ''}>${hinted ? tt('room.specialHintUnlocked') : tt('room.hintBuy', { cost: HINT_COST })}</button>
          <button class="btn btn-ghost" type="button" id="chal-caleb">Ask Caleb</button>
        </div>
        <div class="msg" id="flag-msg"></div>`;
      document.getElementById('chal-close').onclick = closePanel;
      const flagIn = document.getElementById('flag-in');
      if (flagIn) {
        flagIn.addEventListener('focus', function once() {
          const v = flagIn.value;
          const a = v.indexOf('{');
          const b = v.lastIndexOf('}');
          if (a >= 0 && b > a) flagIn.setSelectionRange(a + 1, b);
          else flagIn.select();
          flagIn.removeEventListener('focus', once);
        });
      }
      document.getElementById('chal-caleb').onclick = (e) => { e.preventDefault(); if (window.openCalebLabs) window.openCalebLabs(); };
      document.getElementById('hint-buy').onclick = async () => {
        const msg = document.getElementById('flag-msg');
        if (!window.LLT) return;
        if (window.LLT.hasHint(slug)) return;
        const r = await window.LLT.buyHint(slug, HINT_COST);
        if (!r.ok) {
          msg.className = 'msg bad';
          msg.textContent = r.error === 'unauthorized'
            ? tt('room.signInHints')
            : tt('room.notEnoughLlt');
          return;
        }
        document.getElementById('special-hint-box').style.display = '';
        document.getElementById('hint-buy').disabled = true;
        document.getElementById('hint-buy').textContent = tt('room.specialHintUnlocked');
        msg.className = 'msg ok';
        const bal = (r.wallet && r.wallet.balance != null) ? r.wallet.balance : window.LLT.balance();
        msg.textContent = tt('room.hintUnlockedMsg', { cost: HINT_COST, bal: bal });
        window.LLT.mountBalances();
      };
      document.getElementById('flag-go').onclick = async () => {
        const msg = document.getElementById('flag-msg');
        const flag = document.getElementById('flag-in').value;
        // Prefer API when logged in
        if (loggedIn()) {
          try {
            const r = await api('/challenges/' + encodeURIComponent(slug) + '/submit', {
              method: 'POST', body: JSON.stringify({ flag })
            });
            if (!r.ok) { msg.className = 'msg bad'; msg.textContent = r.message || 'Nope'; return; }
            if (window.LLT && window.LLT.applyFromSolve) window.LLT.applyFromSolve(r);
            else if (window.LLT && window.LLT.sync) await window.LLT.sync();
            const got = r.llt_reward || 0;
            msg.className = 'msg ok';
            msg.textContent = (r.message || 'Correct!') + (r.points ? ` (+${r.points} XP)` : '') + (got ? ` · +${got} LLT` : '');
            try { const d = await api('/challenges'); all = d.challenges || []; } catch {}
            openChallenge(slug);
            return;
          } catch (e) {
            msg.className = 'msg bad';
            msg.textContent = (e.data && e.data.message) || e.message || 'Nope';
            return;
          }
        }
        // Guest local verify for free trio (LLT session-only; hashes only)
        if (await checkFlagLocal(slug, flag)) {
          const got = await awardSolve(slug, c);
          msg.className = 'msg ok';
          msg.textContent = 'Nice! Flag accepted.' + (got ? ` · +${got} LLT` : ' (already banked)') +
            ' Want to keep your LLT? Create an account.';
          openChallenge(slug);
        } else {
          msg.className = 'msg bad';
          msg.textContent = tt('room.nopeHint');
        }
      };
      try {
        const u = new URL(location.href);
        u.searchParams.set('chal', slug);
        history.replaceState({}, '', u.pathname + u.search);
      } catch {}
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      panel.classList.remove('hidden');
      layout.classList.add('with-panel');
      panel.innerHTML = `<p class="msg bad">Could not open challenge.</p><button type="button" class="btn btn-ghost" id="chal-close">Close</button>`;
      document.getElementById('chal-close').onclick = closePanel;
    }
  }

  function closePanel() {
    openSlug = '';
    panel.classList.add('hidden');
    layout.classList.remove('with-panel');
    panel.innerHTML = '';
    try {
      const u = new URL(location.href);
      u.searchParams.delete('chal');
      u.searchParams.delete('challenge');
      history.replaceState({}, '', u.pathname + (u.search || ''));
    } catch {}
    renderGrid();
  }

  /* —— Tool Drop mini-game —— */
  function wireGame() {
    const stage = document.getElementById('game-stage');
    const btn = document.getElementById('game-start');
    if (!stage || !btn) return;

    const MAX_HIT = 128; // per correct; hourly/daily caps live on server
    const MODE_KEY = 'laden_llt_tooldrop_mode';
    const STREAK_KEY = 'laden_llt_tooldrop_streak';
    const BANK_KEY = 'laden_llt_tooldrop_banked';
    const bestEl = document.getElementById('game-best');
    const bankEl = document.getElementById('game-banked');
    const stakeEl = document.getElementById('game-stake');
    const cashBtn = document.getElementById('game-cashout');
    const modeNormalBtn = document.getElementById('game-mode-normal');
    const mode1337Btn = document.getElementById('game-mode-1337');

    // normal: 1→2→4… · 1337: 5→10→20…
    let mode = 'normal';
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === '1337' || m === 'normal') mode = m;
    } catch {}
    function baseStake() { return mode === '1337' ? 5 : 1; }
    function modeLabel() { return mode === '1337' ? '1337' : 'normal'; }

    // Light / obvious quotes — full deck rotates every round (no easy-only pool).
    const TOOLS = [
      {
        id: 'nmap', display: 'nmap',
        aliases: ['nmap'],
        quotes: [
          'Port scanner everyone opens with. Network Mapper. Three letters + map.',
          'Scan open ports on a host — the classic first recon command.',
          '“What ports are open?” You already know which tool.',
          'SYN scan a box and fingerprint SSH. Name the scanner.'
        ]
      },
      {
        id: 'burp', display: 'Burp Suite',
        aliases: ['burp', 'burpsuite', 'burp suite', 'burp-suite'],
        quotes: [
          'The HTTP proxy with Repeater and Intruder. Web pentester’s daily driver.',
          'Intercept the browser, tweak a cookie, replay the request.',
          'MITM proxy for hunting XSS — PortSwigger’s famous suite.',
          'Proxy a login and send it to Repeater. Which suite?'
        ]
      },
      {
        id: 'metasploit', display: 'Metasploit',
        aliases: ['metasploit', 'msf', 'msfconsole', 'metasploit framework'],
        quotes: [
          'msfconsole — search, use, set RHOSTS, get meterpreter.',
          'The big exploit framework when you already know the CVE.',
          'Pick a module, set the payload, catch a shell. Famous framework.',
          'Weaponize a known remote bug. Rapid7’s framework.'
        ]
      },
      {
        id: 'wireshark', display: 'Wireshark',
        aliases: ['wireshark', 'tshark'],
        quotes: [
          'GUI packet sniffer — open a PCAP and follow the TCP stream.',
          'Shark-themed packet analyzer. Filter http.request and watch cookies.',
          'Deep-dive a capture file without staying in the terminal.',
          'The friendly face of packet dissection (tshark’s big sibling).'
        ]
      },
      {
        id: 'sqlmap', display: 'sqlmap',
        aliases: ['sqlmap'],
        quotes: [
          'Automate SQLi — `--dbs` then `--dump`. Name that map.',
          'Point it at a juicy parameter and let it dump tables.',
          'The lazy (and loud) way to own a database via injection.',
          'Confirm SQL injection and extract users without writing payloads.'
        ]
      },
      {
        id: 'hydra', display: 'Hydra',
        aliases: ['hydra', 'thc-hydra', 'thc hydra'],
        quotes: [
          'THC’s multi-headed login cracker — spray SSH with a wordlist.',
          'Online brute force classic for FTP, RDP, HTTP forms…',
          'Too many auth attempts against a portal? Mythical many-headed tool.',
          'Parallel password guesses against a network service.'
        ]
      },
      {
        id: 'john', display: 'John the Ripper',
        aliases: ['john', 'john the ripper', 'johntheripper', 'jtr'],
        quotes: [
          'Offline hash cracker — the original “ripper”. Feed it shadow hashes.',
          'Wordlists + rules until the plaintext pops. First name’s enough.',
          'When rockyou runs dry, incremental mode. Classic cracker.',
          'Crack those NTLM dumps. Not hashcat — the older ripper.'
        ]
      },
      {
        id: 'hashcat', display: 'hashcat',
        aliases: ['hashcat'],
        quotes: [
          'GPU go brrr — crack hashes at absurd speed. Cat in the name.',
          'Rule/mask attacks for serious hash work on the GPU.',
          'When John is too slow, you bring this GPU hammer.',
          'Mode 1000, rockyou, optimized kernels — name the cracker.'
        ]
      },
      {
        id: 'gobuster', display: 'Gobuster',
        aliases: ['gobuster'],
        quotes: [
          'Go-fast dir buster — find /admin with a wordlist.',
          'Content discovery in Go. Dir mode + DNS mode.',
          'Spray common paths until a hidden 200 pops.',
          'Bust directories and subdomains. Go + buster.'
        ]
      },
      {
        id: 'ffuf', display: 'ffuf',
        aliases: ['ffuf', 'fuzz faster u fool'],
        quotes: [
          'FUZZ in the URL — fuzz faster, u fool. Four letters.',
          'Modern web fuzzer with filters and matchers.',
          'Recursive fuzzing for vhosts, params, and paths.',
          'Content discovery with more control than the old Go classic.'
        ]
      },
      {
        id: 'nikto', display: 'Nikto',
        aliases: ['nikto'],
        quotes: [
          'Noisy web scanner that yells about outdated Apache.',
          'Quick-and-dirty check for known bad files on a web root.',
          'Loud first pass for dangerous CGIs and misconfig.',
          'It complains about everything — still useful. Classic scanner name.'
        ]
      },
      {
        id: 'aircrack', display: 'Aircrack-ng',
        aliases: ['aircrack', 'aircrack-ng', 'aircrackng', 'aircrack ng'],
        quotes: [
          'Capture the WPA handshake, then crack the PSK offline. Air-suite.',
          'Wi-Fi: monitor mode, deauth, then break the key.',
          'airodump + this = “who left WPA2 on default?”',
          'Wireless suite for cracking captured handshakes.'
        ]
      },
      {
        id: 'responder', display: 'Responder',
        aliases: ['responder'],
        quotes: [
          'Poison LLMNR/NBT-NS and catch NetNTLM hashes on the LAN.',
          'Answer name requests on the internal network. Collect creds.',
          'WPAD and SMB auth fall into your lap. Classic poisoner.',
          'When Windows asks “who is FILESERVER?” — you answer.'
        ]
      },
      {
        id: 'bloodhound', display: 'BloodHound',
        aliases: ['bloodhound', 'blood hound', 'blood-hound'],
        quotes: [
          'Graph AD attack paths from your user to Domain Admin. Dog-themed.',
          'Ingest SharpHound data, find the shortest privilege path.',
          '“Why can helpdesk own the domain?” Ask the AD graph tool.',
          'Map Kerberos, ACLs, and group edges until DA lights up.'
        ]
      },
      {
        id: 'impacket', display: 'Impacket',
        aliases: ['impacket'],
        quotes: [
          'Python arsenal: psexec, secretsdump, GetUserSPNs…',
          'Dump NTDS remotely once you have the right creds. Impacket.',
          'Kerberoast with GetUserSPNs.py, then crack offline.',
          'SMB/RPC Swiss army knife for Windows lateral movement.'
        ]
      },
      {
        id: 'netcat', display: 'netcat',
        aliases: ['netcat', 'nc', 'ncat'],
        quotes: [
          '`nc -lvnp 4444` — catch a reverse shell. TCP Swiss army knife.',
          'Listen on a port, catch the callback. Two-letter alias works.',
          'Pipe files across the network with almost nothing installed.',
          'Banner-grab a service or shove a shell through a hole. Classic nc.'
        ]
      },
      {
        id: 'tcpdump', display: 'tcpdump',
        aliases: ['tcpdump'],
        quotes: [
          'CLI packet sniffer — capture on eth0 without a GUI.',
          '`tcp port 80` filter while you watch the wire. Dump packets.',
          'Quick PCAP from a jump box when Wireshark is not there.',
          'Write packets to disk for later. Terminal cousin of Wireshark.'
        ]
      },
      {
        id: 'openssl', display: 'OpenSSL',
        aliases: ['openssl'],
        quotes: [
          '`s_client -connect` to poke HTTPS by hand. Crypto toolkit.',
          'Check a TLS cert, generate a CSR, dig into cipher suites.',
          'Encrypt a file or build a quick self-signed cert.',
          'The command-line SSL/TLS toolkit every pentester leans on.'
        ]
      },
      {
        id: 'amass', display: 'Amass',
        aliases: ['amass', 'owasp amass'],
        quotes: [
          'OWASP subdomain enum — passive + active recon.',
          'Map every hostname before you pick a target. OWASP tool.',
          'DNS intel and OSINT to expand the external footprint.',
          'Find forgotten subdomains marketing forgot. Starts with A.'
        ]
      },
      {
        id: 'nuclei', display: 'Nuclei',
        aliases: ['nuclei'],
        quotes: [
          'YAML template vuln scanner from ProjectDiscovery.',
          'Fast hunter for known CVEs and misconfigs. Template-driven.',
          'Point templates at a host list and collect the hits.',
          'Mass-check a new CVE across the asset list. Nucleus-ish name.'
        ]
      }
    ];

    function norm(s) {
      return String(s || '').toLowerCase().replace(/[_./]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function matchTool(answer, tool) {
      const a = norm(answer);
      if (!a) return false;
      return tool.aliases.some(al => norm(al) === a);
    }
    function nextStake(streak) {
      const s = Math.max(0, Math.floor(streak || 0));
      const raw = baseStake() * Math.pow(2, s);
      return Math.min(MAX_HIT, raw);
    }
    function paintModeToggle() {
      if (modeNormalBtn) {
        modeNormalBtn.classList.toggle('is-active', mode === 'normal');
        modeNormalBtn.setAttribute('aria-pressed', mode === 'normal' ? 'true' : 'false');
      }
      if (mode1337Btn) {
        mode1337Btn.classList.toggle('is-active', mode === '1337');
        mode1337Btn.setAttribute('aria-pressed', mode === '1337' ? 'true' : 'false');
      }
    }
    function setMode(next) {
      if (next !== 'normal' && next !== '1337') return;
      if (next === mode) return;
      mode = next;
      try { localStorage.setItem(MODE_KEY, mode); } catch {}
      // switching mode resets multiplier (fair — different base)
      streak = 0;
      try { localStorage.setItem(STREAK_KEY, '0'); } catch {}
      paintModeToggle();
      hud();
      if (playing && !busy) {
        const line = document.getElementById('td-stake-line');
        const stake = nextStake(0);
        if (line) {
          line.innerHTML = modeLabel() + ' · Double or nothing · next: <b>' + stake + '</b> LLT · streak <b>0</b>';
        }
        const cash = document.getElementById('td-cash');
        if (cash) cash.hidden = true;
        const fb = document.getElementById('td-fb');
        if (fb) {
          fb.className = 'td-feedback ok';
          fb.textContent = 'mode → ' + modeLabel() + ' · streak reset · next ' + stake + ' LLT';
        }
      }
    }

    // Full prompt deck — rotate all quotes every round (no difficulty filter).
    const deck = [];
    TOOLS.forEach((t, ti) => t.quotes.forEach((_, qi) => deck.push({ ti, qi })));
    let order = [];
    let orderPos = 0;
    let lastKey = '';
    let playing = false;
    let current = null;
    let score = 0;
    let banked = 0;
    let streak = 0;
    let busy = false;

    try { streak = Number(localStorage.getItem(STREAK_KEY) || 0) || 0; } catch {}
    try { banked = Number(sessionStorage.getItem(BANK_KEY) || 0) || 0; } catch {}

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }
    function refillOrder() {
      order = shuffle(deck.slice());
      if (order.length > 1 && lastKey) {
        const first = order[0];
        const key = first.ti + ':' + first.qi;
        if (key === lastKey) {
          const swap = order.findIndex((x, i) => i > 0 && (x.ti + ':' + x.qi) !== lastKey);
          if (swap > 0) { const t = order[0]; order[0] = order[swap]; order[swap] = t; }
        }
      }
      orderPos = 0;
    }
    function nextPrompt() {
      if (!order.length || orderPos >= order.length) refillOrder();
      let pick = order[orderPos++];
      let key = pick.ti + ':' + pick.qi;
      if (key === lastKey && orderPos < order.length) {
        pick = order[orderPos++];
        key = pick.ti + ':' + pick.qi;
      }
      lastKey = key;
      current = pick;
      return pick;
    }
    function syncCashBtn() {
      if (!cashBtn) return;
      cashBtn.hidden = !(playing && streak > 0 && !busy);
      cashBtn.disabled = busy;
    }
    function hud() {
      const scoreEl = document.getElementById('game-score');
      const payEl = document.getElementById('game-pay');
      const stake = nextStake(streak);
      if (scoreEl) scoreEl.textContent = String(score);
      if (payEl) payEl.textContent = String(banked);
      if (bestEl) bestEl.textContent = String(streak);
      if (bankEl) bankEl.textContent = String(banked);
      if (stakeEl) {
        stakeEl.textContent = modeLabel() + ' · next: ' + stake + ' LLT';
      }
      syncCashBtn();
    }
    function handle() {
      if (window.LLT && window.LLT.displayName) {
        try { return String(window.LLT.displayName()).slice(0, 16); } catch {}
      }
      return displayHandle().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'guest';
    }

    function renderPrompt() {
      const pick = nextPrompt();
      const tool = TOOLS[pick.ti];
      const quote = tool.quotes[pick.qi];
      const stake = nextStake(streak);
      stage.classList.remove('is-ok', 'is-bad');
      stage.innerHTML = `
        <div class="td-stake-line mono" id="td-stake-line">${modeLabel()} · Double or nothing · next: <b>${stake}</b> LLT · streak <b>${streak}</b></div>
        <div class="td-quote">
          <span class="td-label">job brief // which tool?</span>
          ${quote.replace(/</g, '&lt;')}
        </div>
        <form class="td-prompt-row" id="td-form" autocomplete="off">
          <span class="td-ps1">${handle()}@llc:~$</span>
          <input class="td-input" id="td-answer" type="text" maxlength="48" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="tool name…" aria-label="Tool name">
        </form>
        <div class="td-actions">
          <button type="submit" form="td-form" class="btn btn-primary" id="td-go">Enter</button>
          <button type="button" class="btn btn-ghost" id="td-skip">Skip</button>
          <button type="button" class="btn btn-ghost" id="td-cash" ${streak > 0 ? '' : 'hidden'}>Cash out</button>
        </div>
        <div class="td-feedback" id="td-fb"></div>`;
      const form = document.getElementById('td-form');
      const input = document.getElementById('td-answer');
      const skip = document.getElementById('td-skip');
      const cash = document.getElementById('td-cash');
      form.onsubmit = (e) => { e.preventDefault(); submitAnswer(); };
      skip.onclick = () => { if (!busy) showNext(); };
      if (cash) cash.onclick = () => { if (!busy) doCashOut(); };
      setTimeout(() => { try { input.focus(); } catch {} }, 30);
      hud();
    }

    async function creditPayout(amount) {
      amount = Math.max(0, Math.min(MAX_HIT, Math.floor(amount || 0)));
      if (!amount) return { credited: 0 };
      if (!window.LLT) return { credited: 0 };
      try {
        if (window.LLT.gamePayout) return await window.LLT.gamePayout(amount);
        return await window.LLT.credit(amount, 'tool-drop');
      } catch {
        return { credited: 0 };
      }
    }

    function resetStreak() {
      streak = 0;
      try { localStorage.setItem(STREAK_KEY, '0'); } catch {}
    }

    function doCashOut() {
      if (!playing || busy || streak <= 0) return;
      const kept = streak;
      resetStreak();
      hud();
      const fb = document.getElementById('td-fb');
      stage.classList.remove('is-bad');
      stage.classList.add('is-ok');
      if (fb) {
        fb.className = 'td-feedback ok';
        fb.textContent = 'cashed out · streak ' + kept + ' banked · multiplier back to 1';
      }
      const cash = document.getElementById('td-cash');
      if (cash) cash.hidden = true;
      const line = document.getElementById('td-stake-line');
      if (line) line.innerHTML = modeLabel() + ' · Double or nothing · next: <b>' + baseStake() + '</b> LLT · streak <b>0</b>';
      setTimeout(() => { stage.classList.remove('is-ok'); showNext(); }, 700);
    }

    async function submitAnswer() {
      if (busy || !current) return;
      const input = document.getElementById('td-answer');
      const fb = document.getElementById('td-fb');
      const tool = TOOLS[current.ti];
      const ans = (input && input.value) || '';
      if (!norm(ans)) {
        if (fb) { fb.className = 'td-feedback bad'; fb.textContent = 'type a tool name…'; }
        return;
      }
      const stake = nextStake(streak);
      if (!matchTool(ans, tool)) {
        stage.classList.remove('is-ok');
        stage.classList.add('is-bad');
        if (fb) {
          fb.className = 'td-feedback bad';
          fb.textContent = 'bust · was ' + tool.display + ' · streak reset · next 1 LLT';
        }
        resetStreak();
        hud();
        const line = document.getElementById('td-stake-line');
        if (line) line.innerHTML = modeLabel() + ' · Double or nothing · next: <b>' + baseStake() + '</b> LLT · streak <b>0</b>';
        const cash = document.getElementById('td-cash');
        if (cash) cash.hidden = true;
        if (input) { input.select(); }
        setTimeout(() => {
          stage.classList.remove('is-bad');
          if (playing) showNext();
        }, 900);
        return;
      }
      busy = true;
      syncCashBtn();
      stage.classList.remove('is-bad');
      stage.classList.add('is-ok');
      if (fb) {
        fb.className = 'td-feedback ok';
        fb.textContent = 'hit · ' + tool.display + ' · banking +' + stake + ' LLT…';
      }
      const r = await creditPayout(stake);
      const credited = (r && r.credited != null) ? Number(r.credited) : 0;
      if (credited > 0) {
        score += 1;
        banked += credited;
        streak += 1;
        try { localStorage.setItem(STREAK_KEY, String(streak)); } catch {}
        try { sessionStorage.setItem(BANK_KEY, String(banked)); } catch {}
        const nxt = nextStake(streak);
        if (fb) {
          fb.textContent = 'hit · ' + tool.display + ' · +' + credited + ' LLT · next stake ' + nxt;
        }
      } else {
        if (fb) fb.textContent = 'hit · ' + tool.display + ' · payout capped / rate-limited — try later';
        // keep streak? user didn't earn — don't advance multiplier on zero credit
      }
      hud();
      if (window.LLT) window.LLT.mountBalances();
      setTimeout(() => { busy = false; showNext(); }, credited > 0 ? 750 : 1100);
    }

    function showNext() {
      if (!playing) return;
      renderPrompt();
    }

    function showIdle() {
      stage.classList.remove('is-ok', 'is-bad');
      stage.innerHTML = '<p class="muted td-idle" id="game-msg">Hit Start — double or nothing. Normal starts at 1 LLT; 1337 mode at 5. Each hit doubles. Same quote deck.</p>';
      syncCashBtn();
    }

    if (cashBtn) {
      cashBtn.onclick = () => {
        if (!playing || busy) return;
        doCashOut();
      };
    }
    if (modeNormalBtn) modeNormalBtn.onclick = () => setMode('normal');
    if (mode1337Btn) mode1337Btn.onclick = () => setMode('1337');
    paintModeToggle();

    btn.onclick = () => {
      if (playing) {
        playing = false;
        busy = false;
        btn.textContent = 'Start';
        showIdle();
        hud();
        return;
      }
      playing = true;
      score = 0;
      busy = false;
      // keep streak across start so a prior bust/cashout state is honest; fresh run still starts at current multiplier
      refillOrder();
      lastKey = '';
      btn.textContent = 'Stop';
      hud();
      renderPrompt();
    };

    hud();
    showIdle();
  }

  wireNick();
  wireGame();
  window.addEventListener('llt-change', () => { if (window.LLT) window.LLT.mountBalances(); });

  renderCodeGrid();

  fetch(API + '/challenges')
    .then(r => r.json())
    .then(d => {
      all = d.challenges || [];
      renderGrid();
      renderCodeGrid();
      const want = pendingSlug();
      if (want && (SPOTLIGHT.includes(want) || trio().some(c => c.slug === want))) {
        openChallenge(want);
      }
    })
    .catch(() => {
      grid.innerHTML = '<p class="muted">Could not load challenges. Try again in a moment.</p>';
      renderCodeGrid();
    });

  document.addEventListener('laden:lang', () => {
    try { if (typeof renderGrid === 'function') renderGrid(); } catch (e) {}
    try { if (typeof renderCodeGrid === 'function') renderCodeGrid(); } catch (e3) {}
    try { if (openSlug) openChallenge(openSlug); } catch (e2) {}
  });
})();
