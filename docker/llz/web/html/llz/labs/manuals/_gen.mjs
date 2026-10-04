#!/usr/bin/env node
/**
 * Generate LLC tool manuals shelf + per-tool pages from accurate llc.js behavior.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const NAV = `  <div class="wrap nav-inner">
    <a class="brand" href="/">
      <img class="brand-logo" src="/assets/products/logo.jpg?v=llz3" alt="Laden Labs" width="32" height="32">
      <div>Laden Labs</div>
    </a>
    <nav class="nav-links">
      <a href="/"><span data-i18n="nav.home">Home</span></a>
      <a href="/forum/"><span data-i18n="nav.forum">Forum</span></a>
      <a href="/gear/"><span data-i18n="nav.gear">Gear</span></a>
      <a href="/oracle/"><span data-i18n="nav.oracle">Oracle</span></a>
      <a href="/challenges/"><span data-i18n="nav.challenges">Challenges</span></a>
      <a href="/community/"><span data-i18n="nav.community">Community</span></a>
      <a href="/messages/" id="nav-messages"><span data-i18n="nav.messages">Messages</span></a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-cyan" href="/account/" id="nav-account"><span data-i18n="nav.login">Login</span></a>
      <a class="btn btn-primary btn-sm" href="/labs/"><span data-i18n="nav.lounge">Lounge</span></a>
    </div>
  </div>`;

const FOOTER = `<footer class="wrap footer lounge-footer manuals-footer">
  <div>
    <div class="brand-lockup" style="margin-bottom:.55rem">
      <img class="footer-logo" src="/assets/products/logo.jpg?v=llz3" alt="Laden Labs">
      <div>
        <strong style="color:var(--text)">LLC Manuals</strong>
        <div class="muted" style="font-size:.8rem"><span data-i18n="footer.tagline">Oslo · Authorized security work only</span></div>
      </div>
    </div>
    Educational console docs · fictional lab nets only
  </div>
  <p class="site-legal">© 2026 Laden AS · Org.nr. 937 285 833</p>
</footer>
<script src="/assets/nav-mobile.js"></script>
<script src="/assets/llc.js" defer></script>
<script src="/assets/legal.js" defer></script>`;

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function codeBlock(lines) {
  const body = (Array.isArray(lines) ? lines : String(lines).split('\n')).map(l => esc(l)).join('\n');
  return `<pre class="man-code"><code>${body}</code></pre>`;
}

function listHtml(items) {
  if (!items || !items.length) return '<p class="muted">—</p>';
  return '<ul class="man-list">' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
}

function seeAlso(links) {
  if (!links || !links.length) return '';
  return `<section class="man-section panel">
    <h2>See also</h2>
    <div class="man-seealso">${links.map(s => {
      const slug = typeof s === 'string' ? s : s.slug;
      const label = typeof s === 'string' ? s : (s.label || s.slug);
      return `<a class="man-chip" href="/labs/manuals/${slug}/">${esc(label)}</a>`;
    }).join('')}</div>
  </section>`;
}

/** @typedef {{ slug:string, title:string, group:string, synopsis:string, aliases?:string[], syntax?:string[], options?:string[], examples?:string[], notes?:string[], see?:(string|{slug:string,label?:string})[], fiction?:boolean }} Manual */

/** @type {Manual[]} */
const MANUALS = [
  // ── Filesystem ──────────────────────────────────────────────
  {
    slug: 'pwd', group: 'Filesystem', title: 'pwd',
    synopsis: 'Print the current working directory path.',
    syntax: ['pwd'],
    options: ['No flags — always prints the absolute LLC cwd.'],
    examples: ['pwd'],
    notes: ['Logged-in operators start on Z Drive home: /z/labz/&lt;you&gt;.', 'Guests start at /home/laden.'],
    see: ['cd', 'ls', 'df'],
  },
  {
    slug: 'ls', group: 'Filesystem', title: 'ls',
    synopsis: 'List directory entries (demo FS or Z Drive).',
    syntax: ['ls', 'ls [-l|-la|-al|-a] [path]'],
    options: [
      '<code>-l</code> / <code>-la</code> / <code>-al</code> / <code>-a</code> — long listing (mode, owner, size, date)',
      '<code>path</code> — directory or file to list (default: cwd)',
    ],
    examples: [
      'ls',
      'ls -la',
      'ls /nets',
      'ls -la /z/labz',
    ],
    notes: [
      'On Z Drive, shared files show a trailing <code>*</code>; locked entries show <code>(denied)</code>.',
      'Long listing uses owner <code>laden</code>/<code>llc</code> on the demo FS and your username / <code>zdrive</code> on Z.',
    ],
    see: ['cd', 'tree', 'find', 'pwd'],
  },
  {
    slug: 'cd', group: 'Filesystem', title: 'cd',
    synopsis: 'Change the current working directory.',
    syntax: ['cd', 'cd <path>', 'cd ~'],
    options: [
      'No args — jump to home (<code>/z/labz/&lt;you&gt;</code> when logged in, else <code>/home/laden</code>)',
      '<code>~</code> / <code>~/…</code> — home-relative paths',
    ],
    examples: [
      'cd /nets',
      'cd ~',
      'cd /z/labz',
      'cd Documents',
    ],
    notes: [
      'Other operators’ <code>/z/labz/*</code> homes are denied.',
      'Target must be a directory.',
    ],
    see: ['pwd', 'ls', 'df'],
  },
  {
    slug: 'cat', group: 'Filesystem', title: 'cat',
    synopsis: 'Print an entire file to the console.',
    syntax: ['cat <file>'],
    options: ['<code>file</code> — path on demo FS or Z Drive'],
    examples: [
      'cat /nets/TARGETS.md',
      'cat ~/samples/robots.txt',
      'cat /z/labz/operator/Documents/notes.txt',
    ],
    notes: ['Works on Z Drive via LabDrive API when logged in.'],
    see: ['head', 'tail', 'grep', 'echo'],
  },
  {
    slug: 'head', group: 'Filesystem', title: 'head',
    synopsis: 'Print the first 10 lines of a file.',
    syntax: ['head <file>'],
    options: ['Fixed 10-line window (no <code>-n</code> flag in LLC).'],
    examples: ['head /nets/TARGETS.md', 'head app.bundle.js'],
    notes: ['Same path rules as <code>cat</code>.'],
    see: ['cat', 'tail', 'grep'],
  },
  {
    slug: 'tail', group: 'Filesystem', title: 'tail',
    synopsis: 'Print the last 10 lines of a file.',
    syntax: ['tail <file>'],
    options: ['Fixed 10-line window (no <code>-n</code> / <code>-f</code> in LLC).'],
    examples: ['tail /nets/TARGETS.md', 'tail backup.bak'],
    see: ['cat', 'head', 'grep'],
  },
  {
    slug: 'tree', group: 'Filesystem', title: 'tree',
    synopsis: 'Print a recursive directory tree (demo FS only).',
    syntax: ['tree', 'tree [path]'],
    options: ['<code>path</code> — start directory (default: cwd)'],
    examples: ['tree', 'tree /nets', 'tree ~/samples'],
    notes: ['Z Drive: use <code>ls -la</code> instead — <code>tree</code> is not wired to LabDrive yet.'],
    see: ['ls', 'find', 'cd'],
  },
  {
    slug: 'find', group: 'Filesystem', title: 'find',
    synopsis: 'Recursively list all paths under a start directory.',
    syntax: ['find', 'find [path]'],
    options: ['No <code>-name</code> / <code>-type</code> filters — lists every path under start.'],
    examples: ['find', 'find /nets', 'find ~/samples'],
    notes: ['Z Drive: use <code>ls</code> for now.'],
    see: ['tree', 'ls', 'grep'],
  },
  {
    slug: 'mkdir', group: 'Filesystem', title: 'mkdir',
    synopsis: 'Create a directory on your Z Drive.',
    syntax: ['mkdir [-p|--parents] <dir>'],
    options: [
      '<code>-p</code> / <code>--parents</code> — create parent path segments',
      'Path must be under <code>/z/…</code>',
    ],
    examples: [
      'mkdir /z/labz/operator/Documents/ops',
      'mkdir -p Documents/reports/2026',
    ],
    notes: ['Demo FS is read-only for writes — mkdir only works on LabDrive.'],
    see: ['touch', 'rm', 'cd', 'df'],
  },
  {
    slug: 'touch', group: 'Filesystem', title: 'touch',
    synopsis: 'Create an empty file on Z Drive (or leave existing content).',
    syntax: ['touch <file>'],
    options: ['Path must be under <code>/z/…</code>'],
    examples: ['touch Documents/todo.txt', 'touch /z/labz/operator/Downloads/note.md'],
    notes: ['If the file already exists, content is left unchanged.'],
    see: ['echo', 'mkdir', 'rm'],
  },
  {
    slug: 'rm', group: 'Filesystem', title: 'rm',
    synopsis: 'Remove a file or directory on Z Drive.',
    syntax: ['rm [-r|-rf|-fr] <path>'],
    options: [
      '<code>-r</code> / <code>-rf</code> / <code>-fr</code> — recursive remove',
      'Without <code>-r</code>, directories fail (use <code>rmdir</code> or add <code>-r</code>)',
    ],
    examples: ['rm Documents/todo.txt', 'rm -r Documents/ops'],
    notes: ['Only on <code>/z/…</code>. Irreversible for your LabDrive objects.'],
    see: ['rmdir', 'mkdir', 'mv'],
  },
  {
    slug: 'rmdir', group: 'Filesystem', title: 'rmdir',
    synopsis: 'Remove an empty directory on Z Drive (non-recursive).',
    syntax: ['rmdir <path>'],
    options: ['Always non-recursive — directory must be empty.'],
    examples: ['rmdir Documents/empty-folder'],
    notes: ['For trees use <code>rm -r</code>.'],
    see: ['rm', 'mkdir'],
  },
  {
    slug: 'cp', group: 'Filesystem', title: 'cp',
    synopsis: 'Copy a file within Z Drive.',
    syntax: ['cp <src> <dst>'],
    options: ['Both paths must be under <code>/z</code>'],
    examples: [
      'cp Documents/notes.txt Documents/notes.bak',
      'cp Downloads/cap.cap Documents/cap.cap',
    ],
    see: ['mv', 'cat', 'df'],
  },
  {
    slug: 'mv', group: 'Filesystem', title: 'mv',
    synopsis: 'Move or rename a path within Z Drive.',
    syntax: ['mv <src> <dst>'],
    options: ['Both paths must be under <code>/z</code>'],
    examples: ['mv Documents/draft.txt Documents/final.txt'],
    see: ['cp', 'rm'],
  },
  {
    slug: 'echo', group: 'Filesystem', title: 'echo',
    synopsis: 'Print text, or write/append to a Z Drive file with redirection.',
    syntax: [
      'echo <text>',
      'echo <text> > <file>',
      'echo <text> >> <file>',
    ],
    options: [
      '<code>&gt;</code> — write (overwrite) to Z Drive file',
      '<code>&gt;&gt;</code> — append to Z Drive file',
      'Redirects only write under <code>/z/…</code>',
    ],
    examples: [
      'echo hello LLC',
      'echo scope-first > Documents/motto.txt',
      'echo more >> Documents/motto.txt',
    ],
    see: ['cat', 'touch', 'df'],
  },
  {
    slug: 'grep', group: 'Filesystem', title: 'grep',
    synopsis: 'Filter file lines matching a case-insensitive regex pattern.',
    syntax: ['grep <pat> <file>'],
    options: [
      '<code>pat</code> — JavaScript RegExp source (flag <code>i</code> always on)',
      '<code>file</code> — demo FS or Z Drive path',
    ],
    examples: [
      'grep labnet /nets/TARGETS.md',
      'grep flag backup.bak',
      'grep admin app.bundle.js',
    ],
    notes: ['Prints <code>(no matches)</code> when nothing hits.'],
    see: ['cat', 'find', 'lmap'],
  },

  // ── Z Drive ─────────────────────────────────────────────────
  {
    slug: 'df', group: 'Z Drive', title: 'df',
    aliases: ['zquota', 'quota'],
    synopsis: 'Show Z Drive (LabDrive) quota: used, free, and max.',
    syntax: ['df', 'zquota', 'quota'],
    options: ['No flags — all three names call the same quota endpoint.'],
    examples: ['df', 'zquota'],
    notes: [
      'Home: <code>/z/labz/&lt;you&gt;</code> with Documents · Downloads.',
      'Default quota ~10 MB (login required for full LabDrive).',
      'Manage shares and files also from <code>/account/</code>.',
      'Decoy FS flag hunt lives under <code>/z/opt/…</code>.',
    ],
    see: ['zshare', 'zunshare', 'cd', 'mkdir'],
  },
  {
    slug: 'zshare', group: 'Z Drive', title: 'zshare',
    synopsis: 'Share a Z Drive file into the Community pool.',
    syntax: ['zshare <file>'],
    options: ['<code>file</code> must be on <code>/z</code>'],
    examples: ['zshare Documents/writeup.md'],
    notes: ['Shared entries show <code>*</code> in <code>ls</code>.'],
    see: ['zunshare', 'df', 'ls'],
  },
  {
    slug: 'zunshare', group: 'Z Drive', title: 'zunshare',
    synopsis: 'Remove a file from the Community share pool.',
    syntax: ['zunshare <file>'],
    options: ['<code>file</code> must be on <code>/z</code>'],
    examples: ['zunshare Documents/writeup.md'],
    see: ['zshare', 'df'],
  },

  // ── Networks ────────────────────────────────────────────────
  {
    slug: 'ip', group: 'Networks', title: 'ip', fiction: true,
    synopsis: 'Show fictional LLC interface addresses, links, or routes.',
    syntax: [
      'ip a',
      'ip addr',
      'ip address',
      'ip link',
      'ip route',
    ],
    options: [
      '<code>a</code> / <code>addr</code> / <code>address</code> — full address dump',
      '<code>link</code> — link lines only',
      '<code>route</code> — demo routing table (eth0 / wlan0 / lo)',
    ],
    examples: ['ip a', 'ip addr', 'ip route'],
    notes: [
      'All output is fictional in-browser inventory — not your real NIC.',
      'Typical demo: eth0 10.13.37.50, wlan0 10.0.88.42.',
    ],
    see: ['ifconfig', 'iwconfig', 'iw', 'lmap'],
  },
  {
    slug: 'ifconfig', group: 'Networks', title: 'ifconfig', fiction: true,
    synopsis: 'Friendly alias for the fictional address dump (`ip a`).',
    syntax: ['ifconfig'],
    options: ['No arguments — prints the same block as <code>ip a</code>.'],
    examples: ['ifconfig'],
    notes: ['Educational fiction only.'],
    see: ['ip', 'iwconfig'],
  },
  {
    slug: 'iwconfig', group: 'Networks', title: 'iwconfig', fiction: true,
    synopsis: 'Show wireless (and non-wireless) interface status.',
    syntax: ['iwconfig', 'iwconfig [wlan0|wlan0mon]'],
    options: [
      'No args — all ifaces (lo/eth0 “no wireless”, plus wifi blocks)',
      '<code>wlan0</code> / <code>wlan0mon</code> — single iface; unknown name → error',
    ],
    examples: ['iwconfig', 'iwconfig wlan0', 'iwconfig wlan0mon'],
    notes: ['Monitor mode appears after <code>labcrack-ng-airmon start</code>.'],
    see: ['iw', 'labcrack-ng-airmon', 'ip'],
  },
  {
    slug: 'iw', group: 'Networks', title: 'iw', fiction: true,
    synopsis: 'List wifi phy / interface info (nl80211-flavored fiction).',
    syntax: ['iw', 'iw dev'],
    options: ['Other subcommands tip you toward <code>iwconfig</code>.'],
    examples: ['iw', 'iw dev'],
    see: ['iwconfig', 'labcrack-ng-airmon'],
  },
  {
    slug: 'labcrack-ng-airmon', group: 'Networks', title: 'labcrack-ng-airmon', fiction: true,
    aliases: ['airmon-ng', 'labmon'],
    synopsis: 'Put the fictional Laden USB Wi‑Fi dongle into monitor mode.',
    syntax: [
      'labcrack-ng-airmon start|stop [wlan0]',
      'labcrack-ng-airmon check',
      'labcrack-ng-airmon',
    ],
    options: [
      '<code>start</code> — enable monitor → <code>wlan0mon</code> (LN-USB-AC)',
      '<code>stop</code> — disable monitor, back to managed',
      '<code>check</code> / no args — show PHY table + usage',
      'Only <code>wlan0</code> / <code>wlan0mon</code> accepted',
    ],
    examples: [
      'labcrack-ng-airmon start',
      'labcrack-ng-airodump wlan0mon',
      'labcrack-ng-airmon stop',
    ],
    notes: [
      'Aliases: <code>airmon-ng</code>, <code>labmon</code>.',
      'Dongle: LabNet LN-USB-AC (fictional). Never attack real networks.',
    ],
    see: ['labcrack-ng-airodump', 'labcrack-ng', 'iwconfig'],
  },
  {
    slug: 'labcrack-ng-airodump', group: 'Networks', title: 'labcrack-ng-airodump', fiction: true,
    aliases: ['airodump-ng', 'labdump'],
    synopsis: 'Scan nearby fictional APs (requires monitor mode).',
    syntax: ['labcrack-ng-airodump [wlan0mon]'],
    options: [
      'Iface defaults to current monitor iface or <code>wlan0mon</code>',
      'Fails with tip to run airmon if not in monitor mode',
    ],
    examples: [
      'labcrack-ng-airmon start',
      'labcrack-ng-airodump',
      'labcrack-ng-airodump wlan0mon',
    ],
    notes: [
      'Aliases: <code>airodump-ng</code>, <code>labdump</code>.',
      'Prints BSSID / PWR / CH / ENC / ESSID table from LLC wifi inventory.',
    ],
    see: ['labcrack-ng-airmon', 'labcrack-ng'],
  },
  {
    slug: 'labcrack-ng', group: 'Networks', title: 'labcrack-ng', fiction: true,
    aliases: ['aircrack-ng'],
    synopsis: 'Educational WPA/WPA2 PSK cracker against demo .cap files.',
    syntax: [
      'labcrack-ng --help',
      'labcrack-ng --list',
      'labcrack-ng <cap> -w <wordlist>',
    ],
    options: [
      '<code>-h</code> / <code>--help</code> — suite help',
      '<code>--list</code> — list demo handshake captures',
      '<code>-w &lt;wordlist&gt;</code> — wordlist path (optional; built-in demo keys otherwise)',
    ],
    examples: [
      'labcrack-ng --list',
      'labcrack-ng /z/tmp/handshakes/laden-guest.cap -w /z/usr/share/wordlists/rockyou-demo.txt',
    ],
    notes: [
      'Alias: <code>aircrack-ng</code>.',
      'Demo captures: <code>/z/tmp/handshakes/laden-guest.cap</code>, <code>iot-lab.cap</code>, <code>/loot/wifi/cafe-free.cap</code>.',
      'Always fiction — password <code>laden-guest-2024</code> is educational only.',
    ],
    see: ['labcrack-ng-airmon', 'labcrack-ng-airodump', 'df'],
  },

  // ── Scanners ────────────────────────────────────────────────
  {
    slug: 'lmap', group: 'Scanners', title: 'lmap', fiction: true,
    aliases: ['nmap'],
    synopsis: 'Laden Mapper — educational nmap-like scanner for fictional LLC nets only.',
    syntax: [
      'lmap -h | --help',
      'lmap --list',
      'lmap -sn <cidr|net|host>',
      'lmap -sV <host>',
      'lmap -sC <host>',
      'lmap -p <ports> <host>',
      'lmap <host>',
    ],
    options: [
      '<code>-h</code> / <code>--help</code> — help',
      '<code>--list</code> — list fictional networks',
      '<code>-sn</code> — host discovery (ping-sweep style)',
      '<code>-sV</code> — version / service detection',
      '<code>-sC</code> — default-script flavored output',
      '<code>-p</code> — port list (<code>22,80,443</code> or <code>1-100</code>)',
      'Bare host — default top-ports probe',
    ],
    examples: [
      'lmap -h',
      'lmap --list',
      'lmap -sn 10.13.37.0/24',
      'lmap -sn labnet',
      'lmap -sV 10.13.37.10',
      'lmap -sC web01.labnet.llc',
      'lmap -p 22,80,443,3306 10.13.37.20',
    ],
    notes: [
      'Alias tip: typing <code>nmap</code> redirects you to <code>lmap</code> with the same args (or <code>-h</code>).',
      'Real-internet scanning is blocked. Inventory lives under <code>/nets</code> — try <code>cat /nets/TARGETS.md</code>.',
      'Primary range: labnet <code>10.13.37.0/24</code> (web01, admin, db01, jump, …).',
    ],
    see: ['mzfconsole', 'ip', 'hint'],
  },
  {
    slug: 'mzfconsole', group: 'Scanners', title: 'mzfconsole', fiction: true,
    aliases: ['mzf', 'msfconsole'],
    synopsis: 'Laden Metasploit-style framework REPL for fictional lab nets.',
    syntax: [
      'mzfconsole',
      'mzf',
      '# inside REPL:',
      'help | banner | version | exit | quit',
      'search <kw>',
      'use <path|#>',
      'back',
      'info | show info',
      'show options|payloads|modules|nets|targets',
      'set <OPT> <val> | unset <OPT>',
      'check | run | exploit | rexploit',
      'sessions [-l] | sessions -i <id>',
      'jobs | loot | route | workspace [name] | spool … | db_hosts',
    ],
    options: [
      '<strong>Core REPL</strong>',
      '<code>search</code> — filter module paths/names/desc',
      '<code>use</code> — select by path or numeric index from <code>show modules</code>',
      '<code>set</code> / <code>unset</code> — RHOSTS, RPORT, PAYLOAD, SESSION, …',
      '<code>check</code> — dry-run port/vuln match',
      '<code>run</code> / <code>exploit</code> / <code>rexploit</code> — launch current module',
      '<code>sessions -l</code> / <code>-i n</code> — list / interact (demo meterpreter)',
      '<code>show nets</code> — LLC fictional inventory',
      '<code>loot</code> · <code>route</code> · <code>workspace</code> · <code>spool</code> · <code>db_hosts</code>',
    ],
    examples: [
      'mzfconsole',
      'search admin',
      'use auxiliary/gather/labnet/admin_fingerprint',
      'run',
      'use exploit/labnet/admin/auth_bypass',
      'set RHOSTS 10.13.37.30',
      'check',
      'run',
      'sessions -l',
      'use post/labnet/admin/dump_config',
      'set SESSION 1',
      'run',
      'exit',
    ],
    notes: [
      'Aliases entering the REPL: <code>mzfconsole</code>, <code>mzf</code>, <code>msfconsole</code>. Bare <code>msf</code> prints a tip that msfconsole is not shipped — use <code>mzf</code>.',
      'Scope lock: only hosts under <code>/nets</code>. Real-internet exploits are blocked.',
      '<strong>Module families (catalog)</strong> — not separate manuals; use <code>show modules</code> / <code>search</code> in-console.',
      '<em>auxiliary</em>: scanner/discovery/udp_sweep, scanner/portscan/tcp, scanner/http/{title,dir_enum,ssl_version,http_methods}, scanner/ssh/ssh_version, scanner/mysql/mysql_version, scanner/modbus/find_unit_id, gather/labnet/admin_fingerprint',
      '<em>exploit</em>: labnet/http/laden_gw_rce, labnet/mysql/weak_login, labnet/admin/{auth_bypass,sqli_login,file_upload,idor_users,jwt_none,xss_stored,ssrf_debug,path_traversal,csrf_password,debug_console_rce,backup_expose,totp_bruteforce}, dmz/http/honeypot_trap, ot/modbus/register_write, wifi/http/captive_bypass',
      '<em>post</em>: labnet/gather/enum_jump, labnet/admin/{dump_config,hashdump}, labnet/pivot/route_add',
      'Demo flags look like <code>LLZ{mzf_admin_…}</code> — educational only.',
    ],
    see: ['lmap', 'hint', 'labs'],
  },

  // ── Helpers ─────────────────────────────────────────────────
  {
    slug: 'curl', group: 'Helpers', title: 'curl',
    aliases: ['wget'],
    synopsis: 'GET a same-origin / laden.no URL and print status + body (truncated).',
    syntax: ['curl <url|/labs/targets/…>', 'wget <url>'],
    options: [
      'Relative paths resolve against <code>location.origin</code>',
      'Host allowlist: laden.no, www.laden.no, current hostname, 127.0.0.1',
      'Body truncated at 8000 chars',
    ],
    examples: [
      'curl /labs/api/challenges',
      'curl https://laden.no/',
      'wget /robots.txt',
    ],
    notes: ['Off-scope hosts print <code>Blocked: LLC only reaches laden.no (scope).</code>'],
    see: ['wget', 'labs', 'open'],
  },
  {
    slug: 'wget', group: 'Helpers', title: 'wget',
    aliases: ['curl'],
    synopsis: 'Alias of curl — same GET helper and scope lock.',
    syntax: ['wget <url|/path>', 'curl <url>'],
    options: ['Identical implementation to <code>curl</code> in LLC.'],
    examples: ['wget /labs/api/challenges'],
    notes: ['Prefer documenting workflows under the <code>curl</code> manual.'],
    see: ['curl', 'labs'],
  },
  {
    slug: 'base64', group: 'Helpers', title: 'base64',
    synopsis: 'Encode or decode Base64 from a string or file.',
    syntax: ['base64 [-d|--decode] <file|str>'],
    options: [
      '<code>-d</code> / <code>--decode</code> — decode mode',
      'If path resolves to a file, its contents are used',
    ],
    examples: [
      'base64 hello',
      'base64 -d b64-sample.txt',
      'base64 -d SGVsbG8=',
    ],
    see: ['rot13', 'xxd', 'jwt'],
  },
  {
    slug: 'rot13', group: 'Helpers', title: 'rot13',
    synopsis: 'Apply ROT13 to a string or file contents.',
    syntax: ['rot13 <file|str>'],
    examples: ['rot13 Uryyb', 'rot13 rot13-sample.txt'],
    see: ['base64', 'xxd'],
  },
  {
    slug: 'xxd', group: 'Helpers', title: 'xxd',
    synopsis: 'Hex-dump a string or file (16-byte rows with ASCII gutter).',
    syntax: ['xxd <file|str>'],
    examples: ['xxd hello', 'xxd jwt-sample.token'],
    see: ['base64', 'cat'],
  },
  {
    slug: 'jwt', group: 'Helpers', title: 'jwt',
    synopsis: 'Decode a JWT header/payload (no signature verify) from token or file.',
    syntax: ['jwt decode <token|file>'],
    options: ['Subcommand <code>decode</code> is required.'],
    examples: [
      'jwt decode jwt-sample.token',
      'jwt decode eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.',
    ],
    notes: ['Pairs with lounge stations like jwt-none and mzf module <code>exploit/labnet/admin/jwt_none</code>.'],
    see: ['base64', 'hashid', 'mzfconsole'],
  },
  {
    slug: 'hashid', group: 'Helpers', title: 'hashid',
    synopsis: 'Guess common hash algorithm families from a digest string.',
    syntax: ['hashid <hash>'],
    examples: ['hashid 5d41402abc4b2a76b9719d911017c592'],
    see: ['md5', 'sha1', 'sha256'],
  },
  {
    slug: 'md5', group: 'Helpers', title: 'md5',
    synopsis: 'Compute MD5 of a string or file contents.',
    syntax: ['md5 <str|file>'],
    examples: ['md5 laden', 'md5 ~/samples/robots.txt'],
    see: ['sha1', 'sha256', 'hashid'],
  },
  {
    slug: 'sha1', group: 'Helpers', title: 'sha1',
    synopsis: 'Compute SHA-1 of a string or file contents.',
    syntax: ['sha1 <str|file>'],
    examples: ['sha1 laden'],
    see: ['md5', 'sha256', 'hashid'],
  },
  {
    slug: 'sha256', group: 'Helpers', title: 'sha256',
    synopsis: 'Compute SHA-256 of a string or file contents.',
    syntax: ['sha256 <str|file>'],
    examples: ['sha256 laden'],
    see: ['md5', 'sha1', 'hashid'],
  },
  {
    slug: 'labs', group: 'Helpers', title: 'labs',
    synopsis: 'List lounge challenges (difficulty, points, slug, title).',
    syntax: ['labs'],
    examples: ['labs', 'open hash-id'],
    notes: ['Fetches <code>/labs/api/challenges</code>.'],
    see: ['open', 'hint', 'man'],
  },
  {
    slug: 'open', group: 'Helpers', title: 'open',
    synopsis: 'Navigate the browser to a lab room by slug.',
    syntax: ['open <slug>'],
    options: ['Slug is lowercased and stripped to <code>[a-z0-9-]</code>'],
    examples: ['open hash-id', 'open jwt-none'],
    notes: ['Sets <code>laden_pending_chal</code> then goes to <code>/labs/&lt;slug&gt;/</code>.'],
    see: ['labs', 'hint'],
  },
  {
    slug: 'hint', group: 'Helpers', title: 'hint',
    synopsis: 'Print the current lab hint, or a general LLC challenge cheat-sheet.',
    syntax: ['hint'],
    examples: ['hint'],
    notes: [
      'Inside a lab room with <code>LADEN_LLC_CONTEXT.hint</code>, prints that hint.',
      'Otherwise prints sample paths: <code>~/samples</code>, <code>/nets</code>, lmap / mzf tips.',
    ],
    see: ['labs', 'open', 'lmap', 'mzfconsole'],
  },

  // ── Session ─────────────────────────────────────────────────
  {
    slug: 'clear', group: 'Session', title: 'clear',
    synopsis: 'Clear the LLC console screen.',
    syntax: ['clear'],
    examples: ['clear'],
    see: ['help', 'whoami'],
  },
  {
    slug: 'whoami', group: 'Session', title: 'whoami',
    synopsis: 'Print the current LLC username.',
    syntax: ['whoami'],
    examples: ['whoami'],
    see: ['id', 'pwd'],
  },
  {
    slug: 'id', group: 'Session', title: 'id',
    synopsis: 'Print a demo uid/gid line for the current operator.',
    syntax: ['id'],
    examples: ['id'],
    notes: ['Always demo: <code>uid=1000(&lt;you&gt;) gid=1000(llc) …</code>'],
    see: ['whoami', 'uname'],
  },
  {
    slug: 'uname', group: 'Session', title: 'uname',
    synopsis: 'Print the fictional LLC kernel banner.',
    syntax: ['uname'],
    examples: ['uname'],
    notes: ['Fixed string: Linux llc 6.1.0-kali-llc (browser).'],
    see: ['id', 'help'],
  },
  {
    slug: 'help', group: 'Session', title: 'help',
    aliases: ['?'],
    synopsis: 'Print the LLC command overview (filesystem, Z Drive, nets, helpers, session).',
    syntax: ['help', '?'],
    examples: ['help', '?'],
    notes: [
      'Also try <code>manuals</code> and <code>man &lt;tool&gt;</code> for this shelf.',
      'Toggle the console with the backtick key (<code>`</code>) on lounge pages.',
    ],
    see: ['manuals', 'lmap', 'mzfconsole'],
  },
  {
    slug: 'manuals', group: 'Session', title: 'manuals',
    aliases: ['man'],
    synopsis: 'Open or list the LLC manuals collection; man &lt;tool&gt; prints a short synopsis + URL.',
    syntax: ['manuals', 'man', 'man <tool>'],
    examples: ['manuals', 'man lmap', 'man mzfconsole'],
    notes: ['Implemented in LLC — prints https://laden.no/labs/manuals/ paths.'],
    see: ['help', 'lmap', 'mzfconsole'],
  },
];

const GROUPS = ['Filesystem', 'Z Drive', 'Networks', 'Scanners', 'Helpers', 'Session'];

function renderManualPage(m) {
  const aliasLine = m.aliases && m.aliases.length
    ? `<p class="man-aliases">Aliases: ${m.aliases.map(a => `<code>${esc(a)}</code>`).join(' · ')}</p>`
    : '';
  const fiction = m.fiction
    ? `<div class="man-banner fiction">Fictional / educational — LLC lab nets only. Do not use patterns against real systems without authorization.</div>`
    : '';
  const opts = (m.options || []).map(o => o);
  const notes = (m.notes || []).map(n => n);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(m.title)} — LLC Manuals · Laden Labs</title>
  <meta name="description" content="${esc(m.synopsis)}">
  <link rel="stylesheet" href="/labs/assets/styles.css">
  <link rel="stylesheet" href="/labs/manuals/manuals.css">
  <script src="/assets/i18n.js"></script>
  <link rel="canonical" href="https://laden.no/labs/manuals/${esc(m.slug)}/">
</head>
<body class="lab-lounge manuals-page">
<header class="nav">${NAV}</header>

<main class="wrap manuals-main">
  <nav class="room-crumb man-crumb" aria-label="Breadcrumb">
    <a href="/labs/">Lounge</a>
    <span class="sep">/</span>
    <a href="/labs/manuals/">Manuals</a>
    <span class="sep">/</span>
    <span class="mono">${esc(m.slug)}</span>
  </nav>

  <article class="man-hero panel terminal">
    <div class="eyebrow"><span class="pulse"></span> LLC · ${esc(m.group)} · tool manual</div>
    <h1 class="man-title"><span class="mono">${esc(m.title)}</span></h1>
    <p class="man-syn">${esc(m.synopsis)}</p>
    ${aliasLine}
    ${fiction}
  </article>

  <section class="man-section panel">
    <h2>Synopsis</h2>
    <p>${esc(m.synopsis)}</p>
  </section>

  <section class="man-section panel">
    <h2>Syntax</h2>
    ${codeBlock(m.syntax || [m.title])}
  </section>

  <section class="man-section panel">
    <h2>Options / Flags</h2>
    ${listHtml(opts.length ? opts : ['No special flags.'])}
  </section>

  <section class="man-section panel">
    <h2>Examples</h2>
    <p class="muted man-copy-hint">Copy-paste into LLC (backtick <code>\`</code> to toggle)</p>
    ${codeBlock(m.examples || [])}
  </section>

  <section class="man-section panel">
    <h2>Notes</h2>
    ${listHtml(notes.length ? notes : ['Behaves as implemented in LLC — educational browser workstation.'])}
  </section>

  ${seeAlso(m.see)}

  <section class="man-cta panel">
    <div>
      <strong>Open LLC</strong>
      <p class="muted">Press <code>\`</code> on any lounge page, or return to the Lab Lounge.</p>
    </div>
    <div class="man-cta-actions">
      <a class="btn btn-primary" href="/labs/?llc=1">Open Lounge + LLC</a>
      <a class="btn btn-ghost" href="/labs/manuals/">All manuals</a>
    </div>
  </section>
</main>

${FOOTER}
</body>
</html>`;
}

function renderIndex() {
  const cards = GROUPS.map(g => {
    const tools = MANUALS.filter(m => m.group === g);
    const cardsHtml = tools.map(m => {
      const aliases = (m.aliases || []).join(' ');
      return `<a class="man-card" href="/labs/manuals/${m.slug}/" data-group="${esc(g)}" data-name="${esc(m.title)}" data-aliases="${esc(aliases)}" data-syn="${esc(m.synopsis)}">
        <div class="man-card-top">
          <span class="man-card-name mono">${esc(m.title)}</span>
          ${m.fiction ? '<span class="tag man-tag-fic">fiction</span>' : ''}
        </div>
        <p class="man-card-syn">${esc(m.synopsis)}</p>
        ${(m.aliases && m.aliases.length) ? `<div class="man-card-aliases">${m.aliases.map(a => `<code>${esc(a)}</code>`).join(' ')}</div>` : ''}
      </a>`;
    }).join('\n');
    return `<section class="man-group" data-group-section="${esc(g)}">
      <h2 class="man-group-title">${esc(g)}</h2>
      <div class="man-grid">${cardsHtml}</div>
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLC Manuals — Laden Labs</title>
  <meta name="description" content="One guide per LLC console tool — filesystem, Z Drive, fictional nets, scanners, helpers.">
  <link rel="stylesheet" href="/labs/assets/styles.css">
  <link rel="stylesheet" href="/labs/manuals/manuals.css">
  <script src="/assets/i18n.js"></script>
  <link rel="canonical" href="https://laden.no/labs/manuals/">
</head>
<body class="lab-lounge manuals-index">
<header class="nav">${NAV}</header>

<main class="wrap manuals-main">
  <nav class="room-crumb man-crumb" aria-label="Breadcrumb">
    <a href="/labs/">Lounge</a>
    <span class="sep">/</span>
    <span>Manuals</span>
  </nav>

  <section class="panel terminal man-shelf-hero">
    <div class="eyebrow"><span class="pulse"></span> LLZ · LLC tool shelf</div>
    <h1 class="lounge-title">LLC <em>Manuals</em></h1>
    <p class="lounge-lede">One guide per console tool. Syntax and examples match the live LLC workstation — fictional nets only where marked.</p>
    <div class="man-shelf-actions">
      <a class="btn btn-primary" href="/labs/?llc=1">Open LLC</a>
      <a class="btn btn-cyan" href="/labs/">Back to Lounge</a>
      <span class="muted mono man-count">${MANUALS.length} tools</span>
    </div>
  </section>

  <div class="man-toolbar panel">
    <label class="man-search">
      <span class="sr-only">Filter manuals</span>
      <input id="man-filter" type="search" placeholder="Filter tools… lmap, zshare, jwt" autocomplete="off">
    </label>
    <div class="man-chips" id="man-chips" role="group" aria-label="Group filters">
      <button type="button" class="man-chip-btn active" data-group="all">All</button>
      ${GROUPS.map(g => `<button type="button" class="man-chip-btn" data-group="${esc(g)}">${esc(g)}</button>`).join('')}
    </div>
  </div>

  <div id="man-shelf">
    ${cards}
  </div>

  <p class="muted man-empty hidden" id="man-empty">No tools match that filter.</p>
</main>

${FOOTER}
<script src="/labs/manuals/manuals.js"></script>
</body>
</html>`;
}

const CSS = `/* LLC Manuals shelf — lounge-matched */
.manuals-main { padding: 1.25rem 1.25rem 4rem; max-width: 1100px; }
.man-crumb { display:flex; align-items:center; gap:.45rem; font-size:.82rem; color:var(--muted); margin-bottom:1rem; flex-wrap:wrap; }
.man-crumb a { color:var(--cyan); }
.man-crumb .sep { opacity:.5; }
.man-shelf-hero .lounge-title { font-family:Orbitron,sans-serif; margin:.35rem 0 .6rem; }
.man-shelf-hero em { color:var(--green); font-style:normal; }
.man-shelf-actions { display:flex; flex-wrap:wrap; gap:.55rem; align-items:center; margin-top:1rem; }
.man-count { font-size:.78rem; }
.man-toolbar { display:flex; flex-direction:column; gap:.75rem; margin:1rem 0 1.25rem; }
.man-search input {
  width:100%; background:rgba(0,0,0,.25); border:1px solid var(--border); border-radius:10px;
  color:var(--text); padding:.65rem .85rem; font-family:'JetBrains Mono',monospace; font-size:.85rem;
}
.man-search input:focus { outline:none; border-color:var(--green); }
.man-chips { display:flex; flex-wrap:wrap; gap:.4rem; }
.man-chip-btn {
  font-family:'JetBrains Mono',monospace; font-size:.72rem; letter-spacing:.04em;
  padding:.35rem .65rem; border-radius:999px; cursor:pointer;
  background:rgba(255,255,255,.03); border:1px solid var(--border); color:var(--muted);
}
.man-chip-btn:hover { border-color:rgba(0,255,157,.4); color:var(--green); }
.man-chip-btn.active { background:rgba(0,255,157,.12); border-color:rgba(0,255,157,.45); color:var(--green); }
.man-group { margin-bottom:1.75rem; }
.man-group-title {
  font-family:'JetBrains Mono',monospace; font-size:.72rem; letter-spacing:.12em; text-transform:uppercase;
  color:var(--muted); margin:0 0 .7rem;
}
.man-grid {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:.7rem;
}
.man-card {
  display:block; padding:.85rem .95rem; border-radius:12px;
  background:var(--panel); border:1px solid var(--border);
  transition:border-color .15s, box-shadow .15s, transform .15s;
  color:inherit; text-decoration:none;
}
.man-card:hover {
  border-color:rgba(0,255,157,.4); box-shadow:0 0 20px rgba(0,255,157,.08);
  transform:translateY(-1px); color:inherit;
}
.man-card-top { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-bottom:.35rem; }
.man-card-name { color:var(--green); font-weight:700; font-size:.95rem; }
.man-tag-fic { color:var(--amber); border-color:rgba(255,176,32,.35); background:rgba(255,176,32,.08); }
.man-card-syn { font-size:.82rem; color:var(--muted); margin:0; line-height:1.4; }
.man-card-aliases { margin-top:.45rem; display:flex; flex-wrap:wrap; gap:.3rem; }
.man-card-aliases code { font-size:.68rem; color:var(--cyan); opacity:.85; }
.man-empty { text-align:center; padding:2rem; }

.man-hero { margin-bottom:1rem; }
.man-title { font-family:Orbitron,sans-serif; font-size:1.55rem; margin:.35rem 0 .5rem; color:var(--green); }
.man-syn { color:var(--muted); margin:0 0 .5rem; max-width:52rem; }
.man-aliases { font-size:.82rem; color:var(--cyan); margin:.4rem 0 0; }
.man-banner.fiction {
  margin-top:.85rem; padding:.55rem .75rem; border-radius:8px;
  border:1px solid rgba(255,176,32,.35); background:rgba(255,176,32,.08);
  color:var(--amber); font-size:.8rem; font-family:'JetBrains Mono',monospace; line-height:1.45;
}
.man-section { margin-bottom:.85rem; }
.man-section h2 {
  font-family:'JetBrains Mono',monospace; font-size:.72rem; letter-spacing:.1em;
  text-transform:uppercase; color:var(--muted); margin:0 0 .65rem;
}
.man-code {
  margin:0; padding:.85rem 1rem; overflow:auto;
  background:rgba(0,0,0,.35); border:1px solid rgba(0,255,157,.15); border-radius:10px;
  font-family:'JetBrains Mono',monospace; font-size:.8rem; line-height:1.55; color:var(--green);
}
.man-list { margin:.2rem 0 0; padding-left:1.15rem; }
.man-list li { margin:.35rem 0; line-height:1.45; font-size:.9rem; }
.man-list code { color:var(--cyan); font-size:.84em; }
.man-seealso { display:flex; flex-wrap:wrap; gap:.4rem; }
.man-chip {
  display:inline-block; padding:.3rem .65rem; border-radius:999px;
  border:1px solid rgba(0,229,255,.35); background:rgba(0,229,255,.08);
  color:var(--cyan); font-family:'JetBrains Mono',monospace; font-size:.75rem;
}
.man-chip:hover { border-color:var(--green); color:var(--green); }
.man-cta {
  display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem;
  margin-top:1rem; border-color:rgba(0,255,157,.25);
}
.man-cta-actions { display:flex; flex-wrap:wrap; gap:.5rem; }
.man-copy-hint { font-size:.78rem; margin:0 0 .5rem; }
.manuals-footer { margin-top:2rem; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
@media (max-width:640px) {
  .man-grid { grid-template-columns:1fr; }
}
`;

const JS = `(() => {
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
`;

// Write files
fs.writeFileSync(path.join(ROOT, 'manuals.css'), CSS);
fs.writeFileSync(path.join(ROOT, 'manuals.js'), JS);
fs.writeFileSync(path.join(ROOT, 'index.html'), renderIndex());

for (const m of MANUALS) {
  const dir = path.join(ROOT, m.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderManualPage(m));
}

// Manifest for llc.js man map
const manMap = {};
for (const m of MANUALS) {
  manMap[m.slug] = { syn: m.synopsis, group: m.group };
  for (const a of (m.aliases || [])) {
    manMap[a] = { syn: m.synopsis, group: m.group, primary: m.slug };
  }
}
fs.writeFileSync(path.join(ROOT, 'man-map.json'), JSON.stringify({ tools: MANUALS.map(m => ({ slug: m.slug, group: m.group, aliases: m.aliases || [] })), map: manMap }, null, 2));

console.log('Generated', MANUALS.length, 'manuals + index at', ROOT);
