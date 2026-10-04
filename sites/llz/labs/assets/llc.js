
(() => {
  if (window.__llcBooted) return;
  window.__llcBooted = true;

  const FS = {
    'robots.txt': "User-agent: *\nDisallow: /labs/targets/backup/\n# Operators: hidden notes are still public if linked.\n# flag: laden{robots_are_hints}\n",
    'backup/index.bak': "<!-- old homepage backup - do not deploy -->\n<!-- flag: laden{backups_are_loot} -->\n<html><body>backup</body></html>\n",
    'app.bundle.js': "// demo frontend bundle excerpt\nconst API = \"https://laden.no/labs/api\";\n// TODO: remove before prod\n// apiKey = \"sk_live_demo_do_not_use\";\n// flag: laden{rotate_leaked_keys}\nexport function boot(){ console.log(\"laden gateway\"); }\n",
    'jwt-sample.token': 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4iLCJmbGFnIjoibGFkZW57and0X25vbmVfaXNfYnJva2VufSJ9.',
    'b64-sample.txt': 'bGFkZW57ZW5jb2RpbmdfaXNfbm90X2NyeXB0b30=',
    'rot13-sample.txt': 'ynqra{ebg_vf_abg_frpher}',
    'headers.txt': "HTTP/1.1 200 OK\nServer: laden-gw/1.2\nX-Powered-By: ethical-coffee\nX-Laden-Trace: laden{headers_tell_stories}\nContent-Type: text/html\n",
    'README.txt': "Laden Labs Console (LLC)\nkali-lite shell for laden.no challenges. Authorized targets only.\n",
  };

  const QUICK = [
    ['help','help'],['labs','labs'],['curl robots','curl /labs/targets/robots.txt'],
    ['cat bak','cat backup/index.bak'],['base64 -d','base64 -d b64-sample.txt'],
    ['rot13','rot13 rot13-sample.txt'],['jwt decode','jwt decode jwt-sample.token'],
    ['sha256 laden','sha256 laden'],['hint','hint']
  ];

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/llc.css';
  document.head.appendChild(link);

  // remove old terminal drawer nodes if present
  ['laden-term-toggle','laden-term-drawer','laden-term-backdrop'].forEach(id => {
    const el = document.getElementById(id); if (el) el.remove();
  });

  const backdrop = document.createElement('div');
  backdrop.id = 'llc-backdrop';
  const toggle = document.createElement('button');
  toggle.id = 'llc-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Laden Labs Console');
  toggle.innerHTML = '<span class="glyph">llc$</span><span class="label">Console</span>';
  const drawer = document.createElement('div');
  drawer.id = 'llc-drawer';
  drawer.innerHTML = `
    <div class="llc-bar">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="mono">guest@llc — Laden Labs Console</span>
      <button type="button" data-act="clear">clear</button>
      <button type="button" data-act="close">close</button>
    </div>
    <div id="llc-chips"></div>
    <div id="llc-screen"></div>
    <form id="llc-form" autocomplete="off">
      <label class="prompt" for="llc-in">┌──(guest@llc)-[~]<br>└─$</label>
      <input id="llc-in" spellcheck="false" autocapitalize="off" placeholder="help · curl · base64 · jwt · labs · open …">
    </form>`;
  document.body.appendChild(backdrop);
  document.body.appendChild(toggle);
  document.body.appendChild(drawer);

  const screen = document.getElementById('llc-screen');
  const form = document.getElementById('llc-form');
  const input = document.getElementById('llc-in');
  const chips = document.getElementById('llc-chips');

  function llcUser() {
    try {
      const tok = localStorage.getItem('laden_v12_token') || '';
      if (!tok) return 'guest';
      const mid = tok.split('.')[1];
      if (!mid) return 'guest';
      let b64 = mid.replace(/-/g,'+').replace(/_/g,'/');
      while (b64.length % 4) b64 += '=';
      const payload = JSON.parse(atob(b64));
      const name = (payload.usr || payload.username || payload.sub || '').toString().trim();
      if (!name || /^\d+$/.test(name)) return 'guest';
      return name.replace(/[^a-zA-Z0-9._-]/g,'').slice(0,24) || 'guest';
    } catch { return 'guest'; }
  }
  function setPrompt() {
    const u = llcUser();
    const lab = document.querySelector('#llc-form .prompt');
    if (lab) lab.innerHTML = `┌──(${u}@llc)-[~]<br>└─$`;
    const bar = document.querySelector('#llc-drawer .llc-bar .mono');
    if (bar) bar.textContent = `${u}@llc — Laden Labs Console`;
    return u;
  }

  const history = [];
  let histIdx = -1;

  function open() {
    drawer.classList.add('open'); backdrop.classList.add('open');
    document.body.classList.add('llc-open');
    setTimeout(() => input.focus(), 40);
  }
  function close() {
    drawer.classList.remove('open'); backdrop.classList.remove('open');
    document.body.classList.remove('llc-open');
  }
  function toggleDrawer() { drawer.classList.contains('open') ? close() : open(); }
  window.openLLC = open; window.closeLLC = close; window.openLadenTerminal = open;

  toggle.addEventListener('click', toggleDrawer);
  backdrop.addEventListener('click', close);
  drawer.querySelector('[data-act="close"]').onclick = close;
  drawer.querySelector('[data-act="clear"]').onclick = () => { screen.innerHTML=''; 

  setPrompt();
  banner();
  window.addEventListener("storage", setPrompt);
  setInterval(setPrompt, 4000); input.focus(); };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); toggleDrawer(); }
  });

  QUICK.forEach(([label, cmd]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.onclick = () => { input.value = cmd; input.focus(); };
    chips.appendChild(b);
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function print(html, cls='') {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.innerHTML = html;
    screen.appendChild(line);
    screen.scrollTop = screen.scrollHeight;
  }
  function printText(text, cls='') { print(esc(text), cls); }
  function banner() {
    print(`<span class="out-ok">Laden Labs Console</span> <span class="out-dim">LLC · kali-lite · tools for these challenges only</span>\n<span class="out-dim">Ctrl+\` toggle · Esc close · type <b>help</b></span>`);
  }

  function resolvePath(p) {
    if (!p) return null;
    p = p.replace(/^\.\//,'').replace(/^\/+/,'');
    if (p.startsWith('labs/')) p = p.slice(5);
    if (FS[p] != null) return p;
    return Object.keys(FS).find(k => k === p || k.endsWith('/'+p) || k.split('/').pop() === p) || null;
  }
  function readFile(p) { const k = resolvePath(p); return k != null ? FS[k] : null; }
  function b64decode(s) {
    s = s.replace(/-/g,'+').replace(/_/g,'/');
    while (s.length % 4) s += '=';
    try { return decodeURIComponent(escape(atob(s))); } catch { return atob(s); }
  }
  function b64encode(s) { return btoa(unescape(encodeURIComponent(s))); }
  function rot13(s) {
    return s.replace(/[A-Za-z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
    });
  }
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function md5(string) {
    function cmn(q,a,b,x,s,t){a=(a+q+x+t)|0;return(((a<<s)|(a>>>(32-s)))+b)|0;}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
    function md5cycle(x,k){let[a,b,c,d]=x;
      a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
      a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
      a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
      a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
      x[0]=(a+x[0])|0;x[1]=(b+x[1])|0;x[2]=(c+x[2])|0;x[3]=(d+x[3])|0;}
    function md5blk(s){const md5blks=[];for(let i=0;i<64;i+=4)md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);return md5blks;}
    function md51(s){const n=s.length;let state=[1732584193,-271733879,-1732584194,271733878],i;for(i=64;i<=n;i+=64)md5cycle(state,md5blk(s.substring(i-64,i)));s=s.substring(i-64);const tail=Array(16).fill(0);for(i=0;i<s.length;i++)tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);tail[i>>2]|=0x80<<((i%4)<<3);if(i>55){md5cycle(state,tail);for(let j=0;j<16;j++)tail[j]=0;}tail[14]=n*8;md5cycle(state,tail);return state;}
    function rhex(n){let s='';for(let j=0;j<4;j++)s+=('0'+((n>>(j*8))&255).toString(16)).slice(-2);return s;}
    return md51(unescape(encodeURIComponent(string))).map(rhex).join('');
  }
  function jwtDecode(token) {
    const parts = token.trim().split('.');
    if (parts.length < 2) throw new Error('not a JWT');
    const dec = (x) => JSON.parse(b64decode(x.replace(/-/g,'+').replace(/_/g,'/')));
    return { header: dec(parts[0]), payload: dec(parts[1]), signature: parts[2] || '(empty — alg=none?)' };
  }
  function hashid(h) {
    h = h.trim().toLowerCase();
    if (/^[a-f0-9]{32}$/.test(h)) return 'MD5 (32 hex)';
    if (/^[a-f0-9]{40}$/.test(h)) return 'SHA-1 (40 hex)';
    if (/^[a-f0-9]{64}$/.test(h)) return 'SHA-256 (64 hex)';
    if (/^[a-f0-9]{128}$/.test(h)) return 'SHA-512 (128 hex)';
    return 'Unknown';
  }
  function parseArgs(line) {
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g; const out=[]; let m;
    while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
    return out;
  }

  async function run(line) {
    line = line.trim();
    if (!line) return;
    print(`<span class="out-cmd">${esc(llcUser())}@llc$ ${esc(line)}</span>`);
    const args = parseArgs(line);
    const cmd = (args[0]||'').toLowerCase();
    const rest = args.slice(1);
    try {
      switch (cmd) {
        case 'help': case '?':
          printText(`LLC kali-lite — challenge toolkit\n\n  help clear whoami uname pwd ls cat head tail grep echo\n  curl wget base64 [-d] rot13 xxd jwt decode\n  hashid md5 sha1 sha256\n  labs open <slug> hint\n\nOnly tools needed for Laden Labs. Stay in scope.`); break;
        case 'clear': screen.innerHTML=''; banner(); break;
        case 'whoami': printText(llcUser()); break;
        case 'id': { const u=llcUser(); printText(`uid=1000(${u}) gid=1000(llc) groups=1000(llc)  # demo`); break; }
        case 'pwd': printText('/home/llc/labs'); break;
        case 'ls': case 'find': printText(Object.keys(FS).join('\n')); break;
        case 'uname': printText('Linux llc-kali 6.1.0-edu #1 SMP PREEMPT_DYNAMIC kali-lite (browser)'); break;
        case 'cat': case 'head': case 'tail': {
          if (!rest[0]) { printText('usage: cat <file>','out-err'); break; }
          let data = readFile(rest[0]);
          if (data == null) { printText('No such file: '+rest[0],'out-err'); break; }
          if (cmd==='head') data = data.split('\n').slice(0,10).join('\n');
          if (cmd==='tail') data = data.split('\n').slice(-10).join('\n');
          printText(data); break;
        }
        case 'grep': {
          if (rest.length<2){printText('usage: grep <pat> <file>','out-err');break;}
          const data=readFile(rest[1]); if(data==null){printText('No such file','out-err');break;}
          const re=new RegExp(rest[0],'i');
          printText(data.split('\n').filter(l=>re.test(l)).join('\n')||'(no matches)'); break;
        }
        case 'echo': printText(rest.join(' ')); break;
        case 'base64': {
          let decode=false, parts=rest.slice();
          if(parts[0]==='-d'||parts[0]==='--decode'){decode=true;parts=parts.slice(1);}
          let src=parts.join(' '); if(!src){printText('usage: base64 [-d] <file|str>','out-err');break;}
          const f=readFile(src); if(f!=null) src=f.trim();
          printText(decode?b64decode(src):b64encode(src)); break;
        }
        case 'rot13': {
          let src=rest.join(' '); if(!src){printText('usage: rot13 <file|str>','out-err');break;}
          const f=readFile(src); if(f!=null) src=f.trim();
          printText(rot13(src)); break;
        }
        case 'xxd': {
          let src=rest.join(' '); if(!src){printText('usage: xxd <file|str>','out-err');break;}
          const f=readFile(src); if(f!=null) src=f;
          const bytes=new TextEncoder().encode(src); let out='';
          for(let i=0;i<bytes.length;i+=16){const slice=bytes.slice(i,i+16);
            const hex=[...slice].map(b=>b.toString(16).padStart(2,'0')).join(' ');
            const asc=[...slice].map(b=>b>=32&&b<127?String.fromCharCode(b):'.').join('');
            out+=i.toString(16).padStart(8,'0')+': '+hex.padEnd(48,' ')+' '+asc+'\n';}
          printText(out.trimEnd()); break;
        }
        case 'jwt': {
          if((rest[0]||'').toLowerCase()!=='decode'||!rest[1]){printText('usage: jwt decode <token|file>','out-err');break;}
          let tok=rest.slice(1).join(' '); const f=readFile(tok); if(f!=null) tok=f.trim();
          printText(JSON.stringify(jwtDecode(tok),null,2),'out-ok'); break;
        }
        case 'hashid':
          if(!rest[0]) printText('usage: hashid <hash>','out-err');
          else printText(hashid(rest[0])); break;
        case 'md5': case 'sha1': case 'sha256': {
          let src=rest.join(' '); if(!src){printText('usage: '+cmd+' <str|file>','out-err');break;}
          const f=readFile(src); if(f!=null) src=f.replace(/\n$/,'');
          if(cmd==='md5') printText(md5(src));
          else if(cmd==='sha256') printText(await sha256(src));
          else { const buf=await crypto.subtle.digest('SHA-1', new TextEncoder().encode(src));
            printText([...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')); }
          break;
        }
        case 'curl': case 'wget': {
          let url=rest.join(' '); if(!url){printText('usage: curl <url|/labs/targets/…>','out-err');break;}
          if(url.startsWith('/')) url=location.origin+url;
          if(!/^https?:\/\//i.test(url)) url=location.origin+'/'+url.replace(/^\.\//,'');
          let u; try{u=new URL(url);}catch{printText('bad url','out-err');break;}
          if(!(u.hostname==='laden.no'||u.hostname==='www.laden.no'||u.hostname===location.hostname||u.hostname==='127.0.0.1')){
            printText('Blocked: LLC only reaches laden.no (scope).','out-err'); break; }
          printText('* GET '+u.href,'out-dim');
          const res=await fetch(u.href,{credentials:'omit'}); const text=await res.text();
          printText('HTTP '+res.status+'\n'+text.slice(0,8000)+(text.length>8000?'\n…':'')); break;
        }
        case 'nmap': printText('Educational stub — use curl / cat for Laden recon labs.','out-dim'); break;
        case 'msfconsole': case 'msf':
          printText('msfconsole is not shipped in LLC.\nUse jwt / curl / cat for auth & web labs instead.','out-dim'); break;
        case 'labs': {
          printText('Fetching challenges…','out-dim');
          const res=await fetch('/labs/api/challenges'); const data=await res.json();
          const list=data.challenges||[];
          printText(list.map(c=>`${String(c.difficulty).padEnd(4)} ${String(c.points).padStart(3)} ${(c.slug||'').padEnd(24)} ${c.title}`).join('\n')+`\n\n${list.length} labs · open <slug>`); break;
        }
        case 'open': {
          if(!rest[0]){printText('usage: open <slug>','out-err');break;}
          try{sessionStorage.setItem('laden_pending_chal',rest[0]);}catch{}
          printText('Opening '+rest[0]+'…','out-ok');
          location.href='/labs/?chal='+encodeURIComponent(rest[0]); break;
        }
        case 'hint':
          printText('curl /labs/targets/robots.txt · cat backup/index.bak · base64 -d b64-sample.txt\nrot13 rot13-sample.txt · jwt decode jwt-sample.token · cat app.bundle.js · sha256 laden'); break;
        default: printText(cmd+': command not found. Try help','out-err');
      }
    } catch (e) { printText(String(e.message||e),'out-err'); }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const line = input.value; input.value='';
    if (line.trim()) { history.push(line); histIdx = history.length; }
    await run(line);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key==='ArrowUp'){ e.preventDefault(); if(histIdx>0){histIdx--; input.value=history[histIdx]||'';} }
    else if (e.key==='ArrowDown'){ e.preventDefault(); if(histIdx<history.length-1){histIdx++; input.value=history[histIdx]||'';} else {histIdx=history.length; input.value='';} }
  });

  banner();
  try {
    const u = new URL(location.href);
    if (u.searchParams.get('term') === '1' || u.searchParams.get('llc') === '1') open();
  } catch {}
})();
