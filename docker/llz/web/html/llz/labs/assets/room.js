/* Lab room — /labs/<slug>/ dedicated challenge page */
(() => {
  const API = '/labs/api';
  const HINT_COST = 15;
  const TOKEN_KEY = 'laden_v12_token';

  const slug = (document.body.dataset.labSlug || pathSlug()).toLowerCase();
  function pathSlug() {
    const m = location.pathname.match(/\/labs\/([a-z0-9-]+)\/?$/i);
    return m ? m[1] : '';
  }

  const freeSlugs = () => {
    try {
      if (window.LADEN_FEATURED && typeof window.LADEN_FEATURED.slugs === 'function') {
        return window.LADEN_FEATURED.slugs();
      }
    } catch {}
    return ['scope-first', 'robots-redux', 'reflect-101'];
  };

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function loggedIn() { return !!token(); }

  async function api(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(API + path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { data, status: res.status });
    return data;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function tt(key, vars) {
    if (window.LadenI18n && typeof LadenI18n.t === 'function') return LadenI18n.t(key, vars);
    return key;
  }
  function loc(c) {
    if (window.LadenI18n && typeof LadenI18n.localizeLab === 'function') return LadenI18n.localizeLab(c);
    return c;
  }
  function W(slug, key, en) {
    if (window.LadenI18n && typeof LadenI18n.widgetStr === 'function') return LadenI18n.widgetStr(slug, key, en);
    return en;
  }
  function specialFor(slug) {
    const fb = (window.LLT_SPECIAL_HINTS && window.LLT_SPECIAL_HINTS[slug]) || tt('room.spoilerFallback');
    if (window.LadenI18n && typeof LadenI18n.specialHint === 'function') return LadenI18n.specialHint(slug, fb);
    return fb;
  }


  function isGuestOk(s) {
    return freeSlugs().includes(s);
  }

  function isSolvedLocal(s) {
    return (window.LLT && window.LLT.hasSolved && window.LLT.hasSolved(s)) || false;
  }

  function rewardPts(c) {
    return (window.LLT_POINTS && window.LLT_POINTS[c.slug]) || c.points || 50;
  }

  async function sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function normFlag(flag) {
    let s = String(flag || '').trim();
    s = s.replace(/^(laden|llz)\{/i, 'LLZ{');
    return s;
  }
  async function checkFlagLocal(s, flag) {
    const expect = (window.LLT_FLAG_HASHES && window.LLT_FLAG_HASHES[s]) || '';
    if (!expect) return false;
    const norm = normFlag(flag);
    try { return (await sha256hex(norm)) === expect; } catch { return false; }
  }

  /* —— LLC context per lab —— */
  const LLC_HINTS = {
    'scope-first': {
      blurb: 'Scope First — read the oath. LLC optional here; checklist is on the bench.',
      chips: [['help', 'help'], ['labs', 'labs']],
      prefill: '',
      hint: 'Toggle every rule on the bench. Motto uses underscores inside LLZ{…}.',
    },
    'banner-grab-lite': {
      blurb: 'Banner Whisper — inspect headers.txt or curl a target.',
      chips: [['cat headers', 'cat headers.txt'], ['curl robots', 'curl /labs/targets/robots.txt'], ['hint', 'hint']],
      prefill: 'cat headers.txt',
      hint: 'cat headers.txt — look for X-Laden-Trace.',
    },
    'robots-redux': {
      blurb: 'Robots Redux — fetch robots.txt live.',
      chips: [['curl robots', 'curl /labs/targets/robots.txt'], ['cat robots', 'cat robots.txt'], ['hint', 'hint']],
      prefill: 'curl /labs/targets/robots.txt',
      hint: 'curl /labs/targets/robots.txt and read the comment.',
    },
    'hidden-dir': {
      blurb: 'Hidden Directory — backup leftovers.',
      chips: [['curl bak', 'curl /labs/targets/backup/index.bak'], ['cat bak', 'cat backup/index.bak']],
      prefill: 'curl /labs/targets/backup/index.bak',
      hint: 'curl /labs/targets/backup/index.bak',
    },
    'reflect-101': {
      blurb: 'Reflection 101 — XSS echo lab. Use the bench iframe or open the target.',
      chips: [['open echo', 'curl /labs/targets/echo.html'], ['hint', 'hint']],
      prefill: '',
      hint: 'Inject a script containing alert in the echo box.',
    },
    'cookie-jar': {
      blurb: 'Cookie Jar — missing cookie flags.',
      chips: [['help', 'help'], ['labs', 'labs']],
      prefill: '',
      hint: 'Toggle flags until Secure + HttpOnly are on.',
    },
    'b64-again': {
      blurb: 'Encoding ≠ Encryption — decode with LLC.',
      chips: [['base64 -d', 'base64 -d b64-sample.txt'], ['cat b64', 'cat b64-sample.txt']],
      prefill: 'base64 -d b64-sample.txt',
      hint: 'base64 -d b64-sample.txt',
    },
    'rot-warm': {
      blurb: 'Caesar Warmup — ROT13 in LLC.',
      chips: [['rot13', 'rot13 rot13-sample.txt'], ['cat rot', 'cat rot13-sample.txt']],
      prefill: 'rot13 rot13-sample.txt',
      hint: 'rot13 rot13-sample.txt',
    },
    'hash-id': {
      blurb: 'Hash Identification — sha256 laden.',
      chips: [['sha256 laden', 'sha256 laden'], ['hashid', 'hashid']],
      prefill: 'sha256 laden',
      hint: 'sha256 laden — wrap the algo name in LLZ{…}.',
    },
    'jwt-none': {
      blurb: 'alg=none Nightmares — decode the sample JWT.',
      chips: [['jwt decode', 'jwt decode jwt-sample.token'], ['cat jwt', 'cat jwt-sample.token']],
      prefill: 'jwt decode jwt-sample.token',
      hint: 'jwt decode jwt-sample.token — read the payload flag.',
    },
    'idor-desk': {
      blurb: 'IDOR Desk — ticket ids without authz.',
      chips: [['curl idor', 'curl /labs/targets/idor.html?id=7'], ['hint', 'hint']],
      prefill: 'curl /labs/targets/idor.html?id=7',
      hint: 'Try ticket id=7 on the desk.',
    },
    'password-reset-poison': {
      blurb: 'Host Header Trust — simulate poisoned Host.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Build a reset URL from a hostile Host — the bug class is the flag.',
    },
    'sqli-logic': {
      blurb: 'SQLi Logic Gate — classic tautology.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Classic OR 1=1 → LLZ{or_1_equals_1}.',
    },
    'cmd-metachar': {
      blurb: 'Metacharacters — never shell user input.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Defense mindset flag on the bench.',
    },
    'cors-wild': {
      blurb: 'CORS Wildcards — Origin reflection risk.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Reflect Origin carefully — see bench simulator.',
    },
    'open-redirect': {
      blurb: 'Open Redirect — allowlist next=.',
      chips: [['curl redirect', 'curl /labs/targets/redirect.html?next=https://example.com']],
      prefill: 'curl /labs/targets/redirect.html?next=https://example.com',
      hint: 'Defense flag is on the redirect lab page.',
    },
    'ssrf-mind': {
      blurb: 'SSRF Mindset — block link-local metadata.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Classic cloud metadata starts 169.254…',
    },
    'path-traversal': {
      blurb: 'Traversal Taste — normalize and reject ..',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Normalize paths; reject dotdot.',
    },
    'report-quality': {
      blurb: 'Report Like a Pro — FLAG structure.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Order Findings · Log · Adverse · Guidance.',
    },
    'cvss-feel': {
      blurb: 'CVSS Feel — score honestly.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Don\'t inflate CVSS.',
    },
    'csp-bypass-talk': {
      blurb: 'CSP Conversations — dangerous source tokens.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'unsafe-inline weakens CSP.',
    },
    'js-secrets': {
      blurb: 'JS Secret Sprawl — read the bundle.',
      chips: [['curl bundle', 'curl /labs/targets/app.bundle.js'], ['cat bundle', 'cat app.bundle.js']],
      prefill: 'curl /labs/targets/app.bundle.js',
      hint: 'curl /labs/targets/app.bundle.js — rotate leaked keys.',
    },
    'rate-limit': {
      blurb: 'Rate Limit Reality — throttle auth.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Throttle auth endpoints.',
    },
    'tls-old': {
      blurb: 'TLS Time Capsule — disable legacy protocols.',
      chips: [['help', 'help']],
      prefill: '',
      hint: 'Disable SSLv3 / TLS1.0 / TLS1.1.',
    },
  };

  function applyLlcContext(s, title) {
    const ctx = LLC_HINTS[s] || {
      blurb: 'Lab room: ' + (title || s),
      chips: [['help', 'help'], ['labs', 'labs'], ['hint', 'hint']],
      prefill: '',
      hint: 'Type hint for toolbox tips.',
    };
    const noPack = (window.LadenI18n && LadenI18n.llcPack) ? LadenI18n.llcPack(s) : null;
    const payload = {
      slug: s,
      title: title || s,
      blurb: (noPack && noPack.blurb) || ctx.blurb,
      chips: ctx.chips,
      prefill: ctx.prefill || '',
      hint: (noPack && noPack.hint) || ctx.hint || '',
    };
    window.LADEN_LLC_CONTEXT = payload;
    if (typeof window.setLLCContext === 'function') {
      window.setLLCContext(payload);
    }
  }

  /* —— Interactive widgets —— */
  function widgetHtml(s) {
    switch (s) {
      case 'scope-first':
        return `<h3>${W(s,'h3','Scope plaque checklist')}</h3>
          <ul class="check-list" id="w-scope">
            <li><label><input type="checkbox" data-k="a"> AUTHORIZED TARGETS ONLY</label></li>
            <li><label><input type="checkbox" data-k="b"> NO SOCIAL ENGINEERING OF STAFF</label></li>
            <li><label><input type="checkbox" data-k="c"> REPORT, DON'T EXPLOIT BEYOND PoC</label></li>
          </ul>
          <p class="muted" style="font-size:.82rem;margin-top:.5rem">${W(s,'help','Check all three. Motto hint appears when the plaque is sealed.')}</p>
          <div class="out" id="w-out" hidden></div>`;
      case 'banner-grab-lite':
        return `<h3>${W(s,'h3','Header inspector')}</h3>
          <pre class="mono" id="w-headers">HTTP/1.1 200 OK
Server: laden-gw/1.2
X-Powered-By: ethical-coffee
X-Laden-Trace: LLZ{headers_tell_stories}
Content-Type: text/html</pre>
          <div class="widget-row">
            <button type="button" class="btn btn-cyan" id="w-copy">${W(s,'copy','Copy headers')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','Inspect in LLC')}</button>
          </div>`;
      case 'robots-redux':
        return `<h3>${W(s,'h3','Live target')}</h3>
          <p class="muted" style="font-size:.85rem;margin-bottom:.5rem">${W(s,'help','Fetch robots.txt — crawlers get hints, not locks.')}</p>
          <div class="widget-row">
            <a class="btn btn-primary" href="/labs/targets/robots.txt" target="_blank" rel="noopener">${W(s,'open','Open robots.txt')}</a>
            <button type="button" class="btn btn-cyan" id="w-fetch">${W(s,'fetch','Fetch here')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','curl in LLC')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'hidden-dir':
        return `<h3>${W(s,'h3','Path probe')}</h3>
          <div class="widget-row">
            <a class="btn btn-primary" href="/labs/targets/backup/index.bak" target="_blank" rel="noopener">${W(s,'open','Open index.bak')}</a>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','curl bak in LLC')}</button>
          </div>
          <div class="out" id="w-out">${W(s,'out','Try classic leftovers: .bak · .old · ~')}</div>`;
      case 'reflect-101':
        return `<h3>${W(s,'h3','Echo bench')}</h3>
          <iframe class="lab-frame" title="Echo lab" src="/labs/targets/echo.html"></iframe>
          <p class="muted" style="font-size:.8rem;margin-top:.4rem">${W(s,'orOpen','Or <a href="/labs/targets/echo.html" target="_blank" rel="noopener">open full page</a>.')}</p>`;
      case 'cookie-jar':
        return `<h3>${W(s,'h3','Set-Cookie flag builder')}</h3>
          <p class="mono muted" style="font-size:.8rem;margin-bottom:.45rem">session=demo; Path=/; SameSite=None</p>
          <ul class="check-list">
            <li><label><input type="checkbox" id="w-httponly"> HttpOnly</label></li>
            <li><label><input type="checkbox" id="w-secure"> Secure</label></li>
            <li><label><input type="checkbox" id="w-samesite"> ${W(s,'samesite','SameSite=Lax (better than None)')}</label></li>
          </ul>
          <div class="out" id="w-out">${W(s,'out','Toggle the two flags hunters cite first.')}</div>`;
      case 'b64-again':
        return `<h3>${W(s,'h3','Base64 decoder')}</h3>
          <textarea id="w-in" spellcheck="false">TExae2VuY29kaW5nX2lzX25vdF9jcnlwdG99</textarea>
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Decode')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','LLC base64 -d')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'rot-warm':
        return `<h3>${W(s,'h3','ROT13 bench')}</h3>
          <textarea id="w-in" spellcheck="false">YYM{ebg_vf_abg_frpher}</textarea>
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Apply ROT13')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','LLC rot13')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'hash-id':
        return `<h3>${W(s,'h3','Hash ID + sha256')}</h3>
          <input id="w-in" value="laden" spellcheck="false">
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','SHA-256')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','LLC sha256')}</button>
          </div>
          <div class="out" id="w-out">${W(s,'out','Length tells the algo. Flag wraps the name.')}</div>`;
      case 'jwt-none':
        return `<h3>${W(s,'h3','JWT decoder')}</h3>
          <textarea id="w-in" spellcheck="false">eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4iLCJmbGFnIjoiTExae2p3dF9ub25lX2lzX2Jyb2tlbn0ifQ.</textarea>
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Decode payload')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','LLC jwt decode')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'idor-desk':
        return `<h3>${W(s,'h3','Ticket desk')}</h3>
          <iframe class="lab-frame" title="IDOR desk" src="/labs/targets/idor.html"></iframe>
          <div class="widget-row" style="margin-top:.5rem">
            <a class="btn btn-ghost" href="/labs/targets/idor.html?id=7" target="_blank" rel="noopener">${W(s,'open','Open id=7')}</a>
            <button type="button" class="btn btn-cyan" id="w-llc">${W(s,'llc','curl id=7 in LLC')}</button>
          </div>`;
      case 'password-reset-poison':
        return `<h3>${W(s,'h3','Host header simulator')}</h3>
          <label class="muted" style="font-size:.8rem">${W(s,'label','Victim typed email · server builds reset link from Host')}</label>
          <input id="w-host" value="evil.example" spellcheck="false">
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Build reset URL')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'sqli-logic':
        return `<h3>${W(s,'h3','Which payload?')}</h3>
          <div class="quiz-opts" id="w-quiz">
            <button type="button" data-ok="0">' AND '1'='2</button>
            <button type="button" data-ok="1">' OR '1'='1</button>
            <button type="button" data-ok="0">DROP TABLE users;--</button>
            <button type="button" data-ok="0">admin'-- wait no quotes</button>
          </div>
          <div class="out" id="w-out">${W(s,'out','Pick the classic tautology used in string-built logins.')}</div>`;
      case 'cmd-metachar':
        return `<h3>${W(s,'h3','Dangerous metacharacters')}</h3>
          <ul class="check-list" id="w-meta">
            <li><label><input type="checkbox"> ${W(s,'sep', ';  command separator')}</label></li>
            <li><label><input type="checkbox"> ${W(s,'pipe','|  pipe')}</label></li>
            <li><label><input type="checkbox"> ${W(s,'chain','&amp;&amp;  chain')}</label></li>
            <li><label><input type="checkbox"> ${W(s,'sub','$() / backticks  substitution')}</label></li>
          </ul>
          <div class="out" id="w-out">${W(s,'out','Mark all breakouts. Defense: never shell=True with user input.')}</div>`;
      case 'cors-wild':
        return `<h3>${W(s,'h3','CORS pair simulator')}</h3>
          <div class="widget-row">
            <select id="w-acao"><option value="*">ACAO: *</option><option value="reflect">ACAO: reflect Origin</option><option value="fixed">ACAO: laden.no</option></select>
            <label style="display:flex;align-items:center;gap:.35rem;font-size:.85rem"><input type="checkbox" id="w-acac"> ACAC: true</label>
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Evaluate')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'open-redirect':
        return `<h3>${W(s,'h3','Redirect lab')}</h3>
          <iframe class="lab-frame" title="Redirect" src="/labs/targets/redirect.html?next=https://example.com"></iframe>
          <div class="widget-row" style="margin-top:.5rem">
            <a class="btn btn-ghost" href="/labs/targets/redirect.html?next=https://example.com" target="_blank" rel="noopener">${W(s,'open','Open target')}</a>
            <button type="button" class="btn btn-cyan" id="w-llc">${W(s,'llc','curl in LLC')}</button>
          </div>`;
      case 'ssrf-mind':
        return `<h3>${W(s,'h3','URL allowlist quiz')}</h3>
          <div class="quiz-opts" id="w-quiz">
            <button type="button" data-ok="0">https://169.254.169.254/latest/meta-data/</button>
            <button type="button" data-ok="0">file:///etc/passwd</button>
            <button type="button" data-ok="1">https://api.partner.example/v1/status</button>
            <button type="button" data-ok="0">http://127.0.0.1:8080/admin</button>
          </div>
          <div class="out" id="w-out">${W(s,'out','Which fetch is usually safe to allowlist?')}</div>`;
      case 'path-traversal':
        return `<h3>${W(s,'h3','Path normalizer')}</h3>
          <input id="w-in" value="../../etc/passwd" spellcheck="false">
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Normalize / reject')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'report-quality':
        return `<h3>${W(s,'h3','Order the FLAG report sections')}</h3>
          <p class="muted" style="font-size:.8rem;margin-bottom:.45rem">${W(s,'help','Click ↑ ↓ to sort: Findings · Log/steps · Adverse impact · Guidance fix')}</p>
          <ul class="order-list" id="w-order">
            <li data-id="G"><span class="handle">↕</span> ${W(s,'G','Guidance (fix advice)')}</li>
            <li data-id="F"><span class="handle">↕</span> ${W(s,'F','Findings summary')}</li>
            <li data-id="A"><span class="handle">↕</span> ${W(s,'A','Adverse impact')}</li>
            <li data-id="L"><span class="handle">↕</span> ${W(s,'L','Log / step-by-step PoC')}</li>
          </ul>
          <div class="widget-row">
            <button type="button" class="btn btn-ghost" data-move="up">${W(s,'up','Move up')}</button>
            <button type="button" class="btn btn-ghost" data-move="down">${W(s,'down','Move down')}</button>
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Check order')}</button>
          </div>
          <div class="out" id="w-out">${W(s,'out','Select a row, then move. Target order: F L A G')}</div>`;
      case 'cvss-feel':
        return `<h3>${W(s,'h3','Score this scenario')}</h3>
          <p style="font-size:.9rem;margin-bottom:.5rem">${W(s,'scenario','Stored XSS in an <b>authenticated admin</b> panel (no unauth RCE).')}</p>
          <div class="quiz-opts" id="w-quiz">
            <button type="button" data-ok="0">${W(s,'crit','Critical — always max it')}</button>
            <button type="button" data-ok="1">${W(s,'high','High — serious, but not unauth RCE')}</button>
            <button type="button" data-ok="0">${W(s,'low','Low — admins should know better')}</button>
            <button type="button" data-ok="0">${W(s,'info','Informational — XSS is dead')}</button>
          </div>
          <div class="out" id="w-out">${W(s,'out','Honesty builds hunter credibility.')}</div>`;
      case 'csp-bypass-talk':
        return `<h3>${W(s,'h3','CSP token highlighter')}</h3>
          <pre class="mono" id="w-csp">default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example</pre>
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Find weak token')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'js-secrets':
        return `<h3>${W(s,'h3','Bundle review')}</h3>
          <div class="widget-row">
            <a class="btn btn-primary" href="/labs/targets/app.bundle.js" target="_blank" rel="noopener">${W(s,'open','Open app.bundle.js')}</a>
            <button type="button" class="btn btn-cyan" id="w-fetch">${W(s,'fetch','Fetch here')}</button>
            <button type="button" class="btn btn-ghost" id="w-llc">${W(s,'llc','curl in LLC')}</button>
          </div>
          <div class="out" id="w-out">—</div>`;
      case 'rate-limit':
        return `<h3>${W(s,'h3','Login throttle demo')}</h3>
          <div class="widget-row">
            <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Attempt login')}</button>
            <span class="mono muted" id="w-count">0 / 5</span>
          </div>
          <div class="out" id="w-out">${W(s,'out','Hammer quietly and watch the throttle.')}</div>`;
      case 'tls-old':
        return `<h3>${W(s,'h3','Protocol picker')}</h3>
          <ul class="check-list" id="w-tls">
            <li><label><input type="checkbox" data-bad="1"> SSLv3</label></li>
            <li><label><input type="checkbox" data-bad="1"> TLS 1.0</label></li>
            <li><label><input type="checkbox" data-bad="1"> TLS 1.1</label></li>
            <li><label><input type="checkbox" checked data-bad="0"> TLS 1.2</label></li>
            <li><label><input type="checkbox" checked data-bad="0"> TLS 1.3</label></li>
          </ul>
          <button type="button" class="btn btn-primary" id="w-go">${W(s,'go','Apply policy')}</button>
          <div class="out" id="w-out">${W(s,'out','Disable legacy. Keep modern.')}</div>`;
      default:
        return `<h3>${W('default','h3','Lab bench')}</h3><p class="muted">${W('default','help','Use the body above and LLC for tooling.')}</p>`;
    }
  }

  function b64decode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    try { return decodeURIComponent(escape(atob(s))); } catch { return atob(s); }
  }
  function rot13(s) {
    return s.replace(/[A-Za-z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
    });
  }

  function wireWidget(s) {
    const root = document.getElementById('room-widget');
    if (!root) return;
    const out = () => document.getElementById('w-out');
    const openLlc = (cmd) => {
      if (cmd && window.LADEN_LLC_CONTEXT) window.LADEN_LLC_CONTEXT.prefill = cmd;
      if (typeof window.setLLCContext === 'function' && window.LADEN_LLC_CONTEXT) {
        window.setLLCContext(Object.assign({}, window.LADEN_LLC_CONTEXT, { prefill: cmd || window.LADEN_LLC_CONTEXT.prefill }));
      }
      if (window.openLLC) window.openLLC();
      else if (window.openLadenTerminal) window.openLadenTerminal();
    };

    if (s === 'scope-first') {
      root.querySelectorAll('#w-scope input').forEach(inp => {
        inp.addEventListener('change', () => {
          const all = [...root.querySelectorAll('#w-scope input')].every(x => x.checked);
          const el = out();
          if (!el) return;
          if (all) {
            el.hidden = false;
            el.textContent = W(s,'sealed','Plaque sealed. Motto: hunt ethically always → LLZ{hunt_ethically_always}');
          } else {
            el.hidden = true;
            el.textContent = '';
          }
        });
      });
    }
    if (s === 'banner-grab-lite') {
      const copy = document.getElementById('w-copy');
      if (copy) copy.onclick = async () => {
        const t = document.getElementById('w-headers')?.textContent || '';
        try { await navigator.clipboard.writeText(t); copy.textContent = W(s,'copied','Copied'); } catch { copy.textContent = W(s,'selectCopy','Select & copy'); }
      };
      const b = document.getElementById('w-llc');
      if (b) b.onclick = () => openLlc('cat headers.txt');
    }
    if (s === 'robots-redux' || s === 'js-secrets') {
      const url = s === 'robots-redux' ? '/labs/targets/robots.txt' : '/labs/targets/app.bundle.js';
      const fetchBtn = document.getElementById('w-fetch');
      if (fetchBtn) fetchBtn.onclick = async () => {
        const el = out();
        try {
          const r = await fetch(url);
          const t = await r.text();
          if (el) el.textContent = t.slice(0, 4000);
        } catch (e) { if (el) el.textContent = String(e.message || e); }
      };
      const b = document.getElementById('w-llc');
      if (b) b.onclick = () => openLlc('curl ' + url);
    }
    if (s === 'hidden-dir') {
      const b = document.getElementById('w-llc');
      if (b) b.onclick = () => openLlc('curl /labs/targets/backup/index.bak');
    }
    if (s === 'cookie-jar') {
      const sync = () => {
        const h = document.getElementById('w-httponly')?.checked;
        const sec = document.getElementById('w-secure')?.checked;
        const el = out();
        if (!el) return;
        if (h && sec) el.textContent = W(s,'yes','Yes — hunters mention HttpOnly + Secure first. Flag shape: LLZ{missing_httponly_secure}');
        else el.textContent = W(s,'still','Still missing: ') + [!h && 'HttpOnly', !sec && 'Secure'].filter(Boolean).join(' + ');
      };
      ['w-httponly', 'w-secure', 'w-samesite'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', sync);
      });
    }
    if (s === 'b64-again') {
      document.getElementById('w-go').onclick = () => {
        try { out().textContent = b64decode(document.getElementById('w-in').value.trim()); }
        catch (e) { out().textContent = String(e.message || e); }
      };
      document.getElementById('w-llc').onclick = () => openLlc('base64 -d b64-sample.txt');
    }
    if (s === 'rot-warm') {
      document.getElementById('w-go').onclick = () => {
        out().textContent = rot13(document.getElementById('w-in').value.trim());
      };
      document.getElementById('w-llc').onclick = () => openLlc('rot13 rot13-sample.txt');
    }
    if (s === 'hash-id') {
      document.getElementById('w-go').onclick = async () => {
        const v = document.getElementById('w-in').value;
        const hex = await sha256hex(v);
        out().textContent = W(s,'result','SHA-256({v}) =\n{hex}\n\n{n} hex chars → algo name is the flag keyword.').replace('{v}', JSON.stringify(v)).replace('{hex}', hex).replace('{n}', String(hex.length));
      };
      document.getElementById('w-llc').onclick = () => openLlc('sha256 laden');
    }
    if (s === 'jwt-none') {
      document.getElementById('w-go').onclick = () => {
        try {
          const tok = document.getElementById('w-in').value.trim();
          const parts = tok.split('.');
          const payload = JSON.parse(b64decode(parts[1]));
          out().textContent = JSON.stringify({ header: JSON.parse(b64decode(parts[0])), payload }, null, 2);
        } catch (e) { out().textContent = String(e.message || e); }
      };
      document.getElementById('w-llc').onclick = () => openLlc('jwt decode jwt-sample.token');
    }
    if (s === 'idor-desk' || s === 'open-redirect') {
      const b = document.getElementById('w-llc');
      if (b) b.onclick = () => openLlc(s === 'idor-desk'
        ? 'curl /labs/targets/idor.html?id=7'
        : 'curl /labs/targets/redirect.html?next=https://example.com');
    }
    if (s === 'password-reset-poison') {
      document.getElementById('w-go').onclick = () => {
        const host = (document.getElementById('w-host').value || 'evil.example').trim();
        out().textContent = W(s,'out','Reset email would contain:\nhttps://{host}/reset?token=…\n\nBug class → LLZ{host_header_poison}').replace('{host}', host);
      };
    }
    if (s === 'sqli-logic' || s === 'ssrf-mind' || s === 'cvss-feel') {
      root.querySelectorAll('#w-quiz button').forEach(btn => {
        btn.onclick = () => {
          root.querySelectorAll('#w-quiz button').forEach(b => b.classList.remove('is-good', 'is-bad'));
          const ok = btn.dataset.ok === '1';
          btn.classList.add(ok ? 'is-good' : 'is-bad');
          if (s === 'sqli-logic') out().textContent = ok ? W(s,'ok','Correct tautology class. Flag: LLZ{or_1_equals_1}') : W(s,'bad','Not the classic login tautology.');
          if (s === 'ssrf-mind') out().textContent = ok ? W(s,'ok','Partner HTTPS is the sane allowlist pick. Flag mindset: LLZ{block_link_local_meta}') : W(s,'bad','Block link-local, loopback, and file://.');
          if (s === 'cvss-feel') out().textContent = ok ? W(s,'ok','Honest High. Flag: LLZ{dont_inflate_cvss}') : W(s,'bad','Don\'t inflate — credibility matters.');
        };
      });
    }
    if (s === 'cmd-metachar') {
      root.querySelectorAll('#w-meta input').forEach(inp => {
        inp.addEventListener('change', () => {
          const n = [...root.querySelectorAll('#w-meta input')].filter(x => x.checked).length;
          out().textContent = n >= 4
            ? W(s,'all','All marked. Defense flag: LLZ{never_shell_user_input}')
            : W(s,'partial','{n}/4 breakouts marked.').replace('{n}', String(n));
        });
      });
    }
    if (s === 'cors-wild') {
      document.getElementById('w-go').onclick = () => {
        const acao = document.getElementById('w-acao').value;
        const acac = document.getElementById('w-acac').checked;
        let msg = '';
        if (acao === '*' && acac) msg = W(s,'starAcac','Browsers reject ACAO:* + credentials. Reflecting Origin with ACAC is the real bug.');
        else if (acao === 'reflect' && acac) msg = W(s,'reflect','Dangerous: reflecting arbitrary Origin with credentials. Flag: LLZ{cors_reflect_origin}');
        else if (acao === 'fixed') msg = W(s,'fixed','Allowlisted origin — healthier pattern.');
        else msg = W(s,'wild','Wildcard without credentials is often intentional for public APIs.');
        out().textContent = msg;
      };
    }
    if (s === 'path-traversal') {
      document.getElementById('w-go').onclick = () => {
        const raw = document.getElementById('w-in').value.trim();
        const bad = raw.includes('..') || raw.includes('%2e%2e');
        out().textContent = bad
          ? W(s,'bad','Rejected: contains ..\nDefense flag: LLZ{normalize_and_reject_dotdot}')
          : W(s,'ok','Looks clean after normalize (demo).');
      };
    }
    if (s === 'report-quality') {
      const list = document.getElementById('w-order');
      let selected = null;
      list.querySelectorAll('li').forEach(li => {
        li.onclick = () => {
          list.querySelectorAll('li').forEach(x => x.style.outline = '');
          selected = li;
          li.style.outline = '1px solid var(--cyan)';
        };
      });
      root.querySelectorAll('[data-move]').forEach(btn => {
        btn.onclick = () => {
          if (!selected) return;
          if (btn.dataset.move === 'up' && selected.previousElementSibling) {
            list.insertBefore(selected, selected.previousElementSibling);
          }
          if (btn.dataset.move === 'down' && selected.nextElementSibling) {
            list.insertBefore(selected.nextElementSibling, selected);
          }
        };
      });
      document.getElementById('w-go').onclick = () => {
        const order = [...list.querySelectorAll('li')].map(li => li.dataset.id).join('');
        out().textContent = order === 'FLAG'
          ? W(s,'ok','FLAG order locked. Submit LLZ{flag_report_structure}')
          : W(s,'cur','Current: {order} — need FLAG').replace('{order}', order);
      };
    }
    if (s === 'csp-bypass-talk') {
      document.getElementById('w-go').onclick = () => {
        const pre = document.getElementById('w-csp');
        pre.innerHTML = pre.textContent.replace(/'unsafe-inline'/g, '<span style="color:var(--red)">\'unsafe-inline\'</span>');
        out().textContent = W(s,'ok','Weak token spotted. Flag: LLZ{unsafe_inline}');
      };
    }
    if (s === 'rate-limit') {
      let n = 0;
      document.getElementById('w-go').onclick = () => {
        n++;
        const c = document.getElementById('w-count');
        if (c) c.textContent = Math.min(n, 5) + ' / 5';
        if (n >= 5) out().textContent = W(s,'ok','429 Too Many Requests (demo). Flag: LLZ{throttle_auth_endpoints}');
        else out().textContent = W(s,'try','Attempt #{n} accepted (demo). Keep going…').replace('{n}', String(n));
      };
    }
    if (s === 'tls-old') {
      document.getElementById('w-go').onclick = () => {
        const badOn = [...root.querySelectorAll('#w-tls input[data-bad="1"]')].some(x => x.checked);
        const goodOn = [...root.querySelectorAll('#w-tls input[data-bad="0"]')].every(x => x.checked);
        out().textContent = (!badOn && goodOn)
          ? W(s,'ok','Policy clean. Flag: LLZ{disable_legacy_tls}')
          : W(s,'bad','Disable SSLv3/TLS1.0/1.1; keep 1.2+.');
      };
    }
  }

  function showGate(kind, pendingSlug) {
    const gate = document.getElementById('room-gate');
    if (!gate) return;
    if (!kind) { gate.classList.add('hidden'); gate.innerHTML = ''; return; }
    gate.classList.remove('hidden');
    gate.classList.add('locked');
    if (kind === 'members') {
      gate.innerHTML = `<strong>${esc(tt('room.membersLab'))}</strong>
        <p class="muted" style="margin:.35rem 0 .7rem;font-size:.9rem">${esc(tt('room.membersBody'))}</p>
        <div class="flag-row">
          <a class="btn btn-primary" href="/labs/?chal=${encodeURIComponent(pendingSlug || slug)}">${esc(tt('room.loginViaLabs'))}</a>
          <a class="btn btn-ghost" href="/account/">${esc(tt('nav.account'))}</a>
          <a class="btn btn-cyan" href="/challenges/">${esc(tt('room.freeChallenges'))}</a>
        </div>`;
    }
  }

  function wireFlag(c) {
    const flagIn = document.getElementById('flag-in');
    const suggest = c.flag_suggest || (window.LLT_FLAG_SUGGEST && window.LLT_FLAG_SUGGEST[slug]) || 'LLZ{...}';
    if (flagIn) {
      flagIn.value = suggest;
      flagIn.addEventListener('focus', function once() {
        const v = flagIn.value;
        const a = v.indexOf('{');
        const b = v.lastIndexOf('}');
        if (a >= 0 && b > a) flagIn.setSelectionRange(a + 1, b);
        else flagIn.select();
        flagIn.removeEventListener('focus', once);
      });
    }
    const guestOk = isGuestOk(slug);
    const hinted = window.LLT && window.LLT.hasHint && window.LLT.hasHint(slug);
    const special = specialFor(slug);
    const box = document.getElementById('special-hint-box');
    if (box) {
      box.innerHTML = '<strong>' + esc(tt('room.specialHintLabel')) + '</strong> ' + esc(special);
      box.style.display = hinted ? '' : 'none';
    }
    const buy = document.getElementById('hint-buy');
    if (buy) {
      buy.disabled = !!hinted;
      buy.textContent = hinted ? tt('room.specialHintUnlocked') : tt('room.hintBuy', { cost: HINT_COST });
      buy.onclick = async () => {
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
        box.style.display = '';
        buy.disabled = true;
        buy.textContent = tt('room.specialHintUnlocked');
        msg.className = 'msg ok';
        const bal = (r.wallet && r.wallet.balance != null) ? r.wallet.balance : window.LLT.balance();
        msg.textContent = tt('room.hintUnlockedMsg', { cost: HINT_COST, bal: bal });
        if (window.LLT.mountBalances) window.LLT.mountBalances();
      };
    }
    const caleb = document.getElementById('room-caleb');
    if (caleb) caleb.onclick = (e) => { e.preventDefault(); if (window.openCalebLabs) window.openCalebLabs(); };

    document.getElementById('flag-go').onclick = async () => {
      const msg = document.getElementById('flag-msg');
      const flag = document.getElementById('flag-in').value;
      if (loggedIn()) {
        try {
          const r = await api('/challenges/' + encodeURIComponent(slug) + '/submit', {
            method: 'POST', body: JSON.stringify({ flag }),
          });
          if (!r.ok) { msg.className = 'msg bad'; msg.textContent = r.message || 'Nope'; return; }
          if (window.LLT && window.LLT.applyFromSolve) window.LLT.applyFromSolve(r);
          else if (window.LLT && window.LLT.sync) await window.LLT.sync();
          const got = r.llt_reward || 0;
          msg.className = 'msg ok';
          msg.textContent = (r.message || 'Correct!') + (r.points ? ` (+${r.points} XP)` : '') + (got ? ` · +${got} LLT` : '');
          renderSolved(true);
          return;
        } catch (e) {
          msg.className = 'msg bad';
          msg.textContent = (e.data && e.data.message) || e.message || 'Nope';
          return;
        }
      }
      if (!guestOk) {
        msg.className = 'msg bad';
        msg.innerHTML = tt('room.loginSubmit');
        return;
      }
      if (await checkFlagLocal(slug, flag)) {
        let got = 0;
        if (window.LLT && window.LLT.markSolved) {
          const r = await window.LLT.markSolved(slug, rewardPts(c));
          got = (r && r.awarded) || 0;
        }
        msg.className = 'msg ok';
        msg.textContent = tt('room.niceFlag') + (got ? ` · +${got} LLT` : tt('room.alreadyBanked')) +
          tt('room.keepLlt');
        renderSolved(true);
      } else {
        msg.className = 'msg bad';
        msg.textContent = tt('room.nopeHint');
      }
    };
  }

  function renderSolved(on) {
    const tags = document.getElementById('room-tags');
    if (!tags) return;
    let el = tags.querySelector('.room-solved-banner');
    if (on) {
      if (!el) {
        el = document.createElement('span');
        el.className = 'room-solved-banner';
        el.textContent = 'SOLVED';
        tags.appendChild(el);
      }
    }
  }

  async function boot() {
    document.body.classList.add('chapter-hack');
    if (!slug || slug === 'assets' || slug === 'targets' || slug === 'labs' || slug === 'api') {
      location.href = '/labs/';
      return;
    }
    const guestOk = isGuestOk(slug);
    if (!loggedIn() && !guestOk) {
      showGate('members', slug);
      try { sessionStorage.setItem('laden_pending_chal', slug); } catch {}
    } else {
      showGate(null);
    }

    const llcBtn = document.getElementById('room-llc-btn');
    if (llcBtn) llcBtn.onclick = () => {
      if (window.openLLC) window.openLLC();
      else if (window.openLadenTerminal) window.openLadenTerminal();
    };

    let c;
    try {
      const data = await api('/challenges/' + encodeURIComponent(slug));
      c = data.challenge;
    } catch (e) {
      document.getElementById('room-title').textContent = tt('room.notFound');
      document.getElementById('room-summary').textContent = tt('room.unknownSlug', { slug: slug });
      document.getElementById('room-meta').textContent = '404';
      return;
    }

    window.__ladenRoomChallenge = c;
    renderRoom(c, guestOk);
  }

  function renderRoom(raw, guestOk) {
    if (guestOk == null) guestOk = isGuestOk(slug);
    const c = loc(raw || window.__ladenRoomChallenge);
    if (!c) return;

    // static chrome labels
    const learnH = document.querySelector('#room-learn > h2');
    if (learnH) learnH.textContent = tt('room.learn');
    const benchH = document.querySelector('.room-work-head h2');
    if (benchH) benchH.textContent = tt('room.bench');
    const llcBtn = document.getElementById('room-llc-btn');
    if (llcBtn) llcBtn.textContent = tt('room.openLlc');
    const submitH = document.querySelector('#room-submit > h2');
    if (submitH) submitH.textContent = tt('room.submit');
    const flagGo = document.getElementById('flag-go');
    if (flagGo) flagGo.textContent = tt('room.submit');
    const calebBtn = document.getElementById('room-caleb');
    if (calebBtn) calebBtn.textContent = tt('room.askCaleb');

    document.title = tt('room.docTitle', { title: c.title });
    document.getElementById('crumb-slug').textContent = c.slug;
    (function () {
      const crumb = document.querySelector('.room-crumb');
      if (!crumb) return;
      const back = crumb.querySelector('a');
      if (!back) return;
      if (guestOk) {
        back.href = '/challenges/';
        back.textContent = 'Challenges';
      } else {
        back.href = '/labs/';
        back.textContent = 'Labs';
      }
    })();
    document.getElementById('room-title').textContent = c.title;
    document.getElementById('room-summary').textContent = c.summary || '';
    document.getElementById('room-learn-body').textContent = c.learn || '—';
    document.getElementById('room-body').innerHTML = c.body_html || '';
    document.getElementById('room-hint').textContent = tt('room.freeHint', { hint: c.hint || '—' });

    const tags = document.getElementById('room-tags');
    tags.innerHTML = `
      <span class="tag ${(c.difficulty || '').toLowerCase()}">${(c.difficulty || '').toUpperCase()}</span>
      <span class="tag">${esc(c.track || '')}</span>
      <span class="tag">${c.points || 0} XP</span>
      <span class="tag easy">+${rewardPts(c)} LLT</span>
      ${guestOk ? '<span class="tag easy">FREE</span>' : '<span class="tag">MEMBERS</span>'}`;
    const solved = c.solved || isSolvedLocal(slug);
    if (solved) renderSolved(true);

    const kind = guestOk ? tt('room.freeStarter') : tt('room.membersLabMeta');
    document.getElementById('room-meta').textContent =
      tt('room.metaLine', { slug: c.slug, kind: kind });

    const widget = document.getElementById('room-widget');
    widget.innerHTML = widgetHtml(slug);
    wireWidget(slug);

    // Members-only: hide submit if gated (still show learn for teaser)
    if (!loggedIn() && !guestOk) {
      const submit = document.getElementById('room-submit');
      if (submit) {
        submit.querySelectorAll('#flag-go, #hint-buy, #flag-in').forEach(el => { el.disabled = true; });
      }
    } else {
      wireFlag(c);
    }

    applyLlcContext(slug, c.title);
    // Late bind if llc.js loads after us (defer)
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (typeof window.setLLCContext === 'function') {
        applyLlcContext(slug, c.title);
        clearInterval(t);
      } else if (tries > 40) clearInterval(t);
    }, 100);

    if (window.LadenI18n && LadenI18n.apply) LadenI18n.apply(document);
  }

  document.addEventListener('laden:lang', () => {
    if (window.__ladenRoomChallenge) renderRoom(window.__ladenRoomChallenge);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
