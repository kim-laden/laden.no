(() => {
  if (window.__llcBooted) return;
  window.__llcBooted = true;

  const FULLPAGE = !!(window.LLC_FULLPAGE || document.body?.dataset?.llcMode === 'full' || document.getElementById('llc-mount'));

  /* ── Fictional filesystem (tree) ─────────────────────────────── */
  const FS_TREE = {
    type: 'dir',
    children: {
      home: { type: 'dir', children: {
        laden: { type: 'dir', children: {
          'README.txt': { type: 'file', data:
`Laden Labs Console (LLC)
Kali-style educational shell for laden.no.
Authorized / fictional targets only — never scan the real internet from here.

Quick start:
  help · tree · cd /nets · cat TARGETS.md · lmap -h
` },
          'notes.txt': { type: 'file', data:
`# operator notes
- Lab Lounge = /labs/
- Challenges earn LLT
- Gear desk = /gear/ (LLG)
- Oracle answers tool questions
` },
          '.bashrc': { type: 'file', data: 'export PS1="┌──(laden@llc)-[~]\\n└─$ "\nalias ll="ls -la"\n' },
          tools: { type: 'dir', children: {
            'lmap.txt': { type: 'file', data:
`lmap — Laden Mapper (educational nmap-like)
Only reaches fictional LLC networks under /nets.
Try: lmap --list · lmap -sn 10.13.37.0/24 · lmap -sV 10.13.37.10
` },
            'cheat.txt': { type: 'file', data: 'curl · jwt decode · base64 -d · rot13 · hashid · labs · open <slug>\n' },
          }},
          samples: { type: 'dir', children: {
            'robots.txt': { type: 'file', data: "User-agent: *\nDisallow: /labs/targets/backup/\n# Operators: hidden notes are still public if linked.\n# flag: LLZ{robots_are_hints}\n" },
            'backup.bak': { type: 'file', data: "<!-- old homepage backup - do not deploy -->\n<!-- flag: LLZ{backups_are_loot} -->\n<html><body>backup</body></html>\n" },
            'app.bundle.js': { type: 'file', data: "// demo frontend bundle excerpt\nconst API = \"https://laden.no/labs/api\";\n// TODO: remove before prod\n// apiKey = \"sk_live_demo_do_not_use\";\n// flag: LLZ{rotate_leaked_keys}\nexport function boot(){ console.log(\"laden gateway\"); }\n" },
            'jwt-sample.token': { type: 'file', data: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4iLCJmbGFnIjoiTExae2p3dF9ub25lX2lzX2Jyb2tlbn0ifQ.' },
            'b64-sample.txt': { type: 'file', data: 'TExae2VuY29kaW5nX2lzX25vdF9jcnlwdG99' },
            'rot13-sample.txt': { type: 'file', data: 'YYM{ebg_vf_abg_frpher}' },
            'headers.txt': { type: 'file', data: "HTTP/1.1 200 OK\nServer: laden-gw/1.2\nX-Powered-By: ethical-coffee\nX-Laden-Trace: LLZ{headers_tell_stories}\nContent-Type: text/html\n" },
          }},
        }},
      }},
      opt: { type: 'dir', children: {
        laden: { type: 'dir', children: {
          'VERSION': { type: 'file', data: 'LLC 2.0 · laden.no\n' },
          'challenges.md': { type: 'file', data:
`# Challenges
Run: labs
Open a room: open <slug>
Flags look like: LLZ{…}
` },
          'motd': { type: 'file', data: 'Welcome to Laden Labs. Stay in scope. Hunt ethically.\n' },
        }},
      }},
      nets: { type: 'dir', children: {
        'ADMIN.md': { type: 'file', data:
`# admin.labnet.llc — primary LLZ labnet admin surface\n\nHost: 10.13.37.30\nStack: LadenAdmin/2.4 + Admin API :8443 + debug :9000\n\nSurfaces\n  /admin/          panel login\n  /api/v1/         JSON API (JWT)\n  /debug/          left-on debug console\n  /backup/         admin.sql.bak\n\nmzfconsole\n  search admin\n  use exploit/labnet/admin/auth_bypass\n  set RHOSTS 10.13.37.30\n  run\n\nFlags drop as LLZ{mzf_admin_…} — educational only.\n`
        },
        'TARGETS.md': { type: 'file', data:
`# LLC fictional networks (lmap only)
These hosts exist ONLY inside Laden Labs Console.
They are not on the public internet. lmap cannot reach real IPs.

| Net        | CIDR            | Role              |
|------------|-----------------|-------------------|
| labnet     | 10.13.37.0/24   | Primary lab range |
| dmz        | 172.16.90.0/24  | Edge / bastion    |
| ot         | 192.168.77.0/24 | OT demo (sim)     |
| wifi       | 10.0.88.0/24    | Guest Wi-Fi lab   |

Discover:  lmap --list
mzfconsole: mzfconsole → search labnet → use → run
Ping-sweep: lmap -sn 10.13.37.0/24
Version:   lmap -sV 10.13.37.10
Scripts:   lmap -sC 10.13.37.10
` },
        'labnet.txt': { type: 'file', data:
`labnet.llc  10.13.37.0/24
  .1   gw-labnet      gateway
  .10  web01          http/https/ssh
  .20  db01           mysql/ssh
  .50  jump           ssh
` },
        'dmz.txt': { type: 'file', data:
`dmz.llc  172.16.90.0/24
  .5   bastion        ssh
  .80  honeypot       http (decoy)
` },
        'ot.txt': { type: 'file', data:
`ot.llc  192.168.77.0/24
  .10  plc-sim        modbus-sim
  .20  hmi            http
` },
        'wifi.txt': { type: 'file', data:
`wifi.llc  10.0.88.0/24
  .1   ap-guest       dhcp/dns
  .42  laptop-guest   ssh
` },
      }},
      loot: { type: 'dir', children: {
        'README.txt': { type: 'file', data: 'Drop fictional findings here (demo). Nothing leaves the browser.\n' },
        '.keep': { type: 'file', data: '' },
        wifi: { type: 'dir', children: {
          'cafe-free.cap': { type: 'file', data: 'Laden Labs fictional WPA capture (cafe-free)\nESSID: CafeFree_WiFi\nBSSID: 02:13:37:ap:88:03\n# use: labcrack-ng /loot/wifi/cafe-free.cap -w rockyou.txt\n' },
          'README.txt': { type: 'file', data: 'Demo .cap files for labcrack-ng. Educational only.\n' },
        }},
      }},
      etc: { type: 'dir', children: {
        'hostname': { type: 'file', data: 'llc\n' },
        'motd': { type: 'file', data: 'Laden Labs Console — fictional networks only.\n' },
        'issue': { type: 'file', data: 'Kali GNU/Linux Rolling (LLC browser edition)\n' },
      }},
      z: { type: 'dir', children: {
        'README.txt': { type: 'file', data:
`Z Drive — your private LabDrive (10 MB floating max).
Login required. Persists on the server.

  cd /z · mkdir notes · echo hi > notes/hi.txt
  ls -la · cat notes/hi.txt · df · zshare <file>
` },
      }},
    },
  };

  /* ── Fictional network inventory for lmap ────────────────────── */
  const NETS = [
    {
      name: 'labnet', cidr: '10.13.37.0/24', domain: 'labnet.llc',
      hosts: [
        { ip: '10.13.37.1',  hostname: 'gw-labnet.labnet.llc', ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 9.2p1', banner: 'SSH-2.0-OpenSSH_9.2p1 Debian-2' },
        ]},
        { ip: '10.13.37.10', hostname: 'web01.labnet.llc', vulns: ['laden_gw_rce','nginx_misconfig'], ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 8.9p1', banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3' },
          { port: 80, open: true, service: 'http', product: 'nginx 1.24.0', banner: 'nginx/1.24.0', scripts: ['http-title: Laden Lab Web01', 'http-server-header: nginx/1.24.0'] },
          { port: 443, open: true, service: 'https', product: 'nginx 1.24.0', banner: 'nginx/1.24.0 (TLS)', scripts: ['ssl-cert: subject=CN=web01.labnet.llc', 'http-title: Laden Lab Web01'] },
          { port: 8080, open: true, service: 'http-proxy', product: 'Laden-GW/1.2', banner: 'Laden-GW/1.2' },
        ]},
        { ip: '10.13.37.30', hostname: 'admin.labnet.llc', role: 'admin-panel', vulns: [
          'admin_auth_bypass','admin_sqli','admin_upload','admin_idor','admin_jwt_none',
          'admin_xss_stored','admin_ssrf','admin_path_trav','admin_csrf','admin_debug_console',
          'admin_backup_expose','admin_weak_totp'
        ], ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 9.2p1', banner: 'SSH-2.0-OpenSSH_9.2p1' },
          { port: 80, open: true, service: 'http', product: 'LadenAdmin/2.4', banner: 'LadenAdmin/2.4', scripts: [
            'http-title: Laden Labnet Admin',
            'http-server-header: LadenAdmin/2.4',
            'http-robots-txt: Disallow: /admin /debug /backup',
            'http-enum: /admin/ /api/v1/ /debug/ /backup/admin.sql.bak'
          ]},
          { port: 443, open: true, service: 'https', product: 'LadenAdmin/2.4', banner: 'LadenAdmin/2.4 (TLS)', scripts: [
            'ssl-cert: subject=CN=admin.labnet.llc',
            'http-title: Laden Labnet Admin'
          ]},
          { port: 8443, open: true, service: 'https-alt', product: 'LadenAdmin-API/2.4', banner: 'LadenAdmin-API/2.4', scripts: [
            'http-title: Admin API',
            'http-methods: GET POST PUT DELETE PATCH'
          ]},
          { port: 9000, open: true, service: 'http', product: 'debug-console/demo', banner: 'debug-console', scripts: [
            'http-title: DEBUG CONSOLE — not for prod'
          ]},
        ]},
        { ip: '10.13.37.20', hostname: 'db01.labnet.llc', vulns: ['mysql_weak_auth'], ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 8.9p1', banner: 'SSH-2.0-OpenSSH_8.9p1' },
          { port: 3306, open: true, service: 'mysql', product: 'MySQL 8.0.36', banner: '8.0.36-laden-demo', scripts: ['mysql-info: Protocol 10 · Version 8.0.36'] },
        ]},
        { ip: '10.13.37.50', hostname: 'jump.labnet.llc', vulns: ['ssh_enum'], ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 9.6p1', banner: 'SSH-2.0-OpenSSH_9.6p1' },
        ]},
        { ip: '10.13.37.99', hostname: 'dark.labnet.llc', ports: [] }, // down / filtered for drama
      ],
    },
    {
      name: 'dmz', cidr: '172.16.90.0/24', domain: 'dmz.llc',
      hosts: [
        { ip: '172.16.90.5', hostname: 'bastion.dmz.llc', ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 9.2p1', banner: 'SSH-2.0-OpenSSH_9.2p1' },
        ]},
        { ip: '172.16.90.80', hostname: 'honeypot.dmz.llc', vulns: ['honeypot_trap'], ports: [
          { port: 80, open: true, service: 'http', product: 'cowrie-http/demo', banner: 'Apache/2.4.57 (decoy)', scripts: ['http-title: It works! (decoy)', 'http-robots-txt: Disallow: /admin'] },
          { port: 2222, open: true, service: 'ssh', product: 'cowrie', banner: 'SSH-2.0-OpenSSH_7.4 (honeypot)' },
        ]},
      ],
    },
    {
      name: 'ot', cidr: '192.168.77.0/24', domain: 'ot.llc',
      hosts: [
        { ip: '192.168.77.10', hostname: 'plc-sim.ot.llc', vulns: ['modbus_write'], ports: [
          { port: 502, open: true, service: 'modbus', product: 'plc-sim/1.0', banner: 'Modbus/TCP plc-sim', scripts: ['modbus-discover: Unit ID 1 · Holding regs (sim)'] },
        ]},
        { ip: '192.168.77.20', hostname: 'hmi.ot.llc', ports: [
          { port: 80, open: true, service: 'http', product: 'hmi-demo/0.9', banner: 'hmi-demo/0.9', scripts: ['http-title: OT HMI (simulation)'] },
          { port: 443, open: false, service: 'https', product: '', banner: '' },
        ]},
      ],
    },
    {
      name: 'wifi', cidr: '10.0.88.0/24', domain: 'wifi.llc',
      hosts: [
        { ip: '10.0.88.1', hostname: 'ap-guest.wifi.llc', vulns: ['captive_bypass'], ports: [
          { port: 53, open: true, service: 'domain', product: 'dnsmasq 2.90', banner: 'dnsmasq-2.90' },
          { port: 67, open: true, service: 'dhcps', product: 'dnsmasq', banner: 'DHCP' },
          { port: 80, open: true, service: 'http', product: 'captive-portal/demo', banner: 'captive-portal', scripts: ['http-title: Guest Wi-Fi Portal'] },
        ]},
        { ip: '10.0.88.42', hostname: 'laptop-guest.wifi.llc', ports: [
          { port: 22, open: true, service: 'ssh', product: 'OpenSSH 9.0', banner: 'SSH-2.0-OpenSSH_9.0' },
        ]},
      ],
    },
  ];

  const DEFAULT_PORTS = [21,22,23,25,53,80,110,139,143,443,445,502,993,995,1433,3306,3389,5432,8080,8443,2222];


  /* ── mzfconsole — Metasploit-flavored LLC framework (fiction only) ── */
  const MZF_SESSIONS = [];
  let mzfActive = false;
  let mzfModule = null; // current module object
  let mzfOpts = {};     // option bag for current module
  let mzfSessionSeq = 1;

  const MZF_PAYLOADS = [
    { name: 'generic/shell_reverse_tcp', desc: 'Fictional reverse shell (demo session only)' },
    { name: 'generic/shell_bind_tcp', desc: 'Fictional bind shell (demo session only)' },
    { name: 'php/meterpreter/reverse_tcp', desc: 'Demo PHP meterpreter-style session' },
    { name: 'php/reverse_perl', desc: 'PHP wrapper → perl reverse (demo)' },
    { name: 'linux/x64/meterpreter/reverse_tcp', desc: 'Demo Linux meterpreter-style session' },
    { name: 'linux/x64/shell_reverse_tcp', desc: 'Raw x64 reverse shell (fiction)' },
    { name: 'cmd/unix/reverse', desc: 'Simple cmd reverse (fiction)' },
    { name: 'cmd/unix/bind_busybox', desc: 'Busybox bind (fiction)' },
    { name: 'javascript/meterpreter/reverse_tcp', desc: 'Node/JS meterpreter-style (admin API)' },
    { name: 'java/jsp_shell_reverse_tcp', desc: 'JSP shell reverse (fiction)' },
    { name: 'admin/laden_agent', desc: 'LadenAdmin implant channel (labnet-only)' },
  ];

  const MZF_LOOT = [];
  const MZF_ROUTES = []; // fiction pivots
  let mzfWorkspace = 'labnet-default';
  let mzfSpool = [];

  const MZF_MODULES = [
    /* —— discovery / scanners —— */
    {
      path: 'auxiliary/scanner/discovery/udp_sweep',
      type: 'auxiliary', rank: 'normal',
      name: 'UDP Sweep (fiction)',
      desc: 'Host discovery across an LLC net (inventory).',
      opts: { RHOSTS: '10.13.37.0/24', THREADS: '10' },
      run: async (o) => mzfScanHosts(o.RHOSTS || o.RHOST),
    },
    {
      path: 'auxiliary/scanner/portscan/tcp',
      type: 'auxiliary', rank: 'normal',
      name: 'TCP Portscan',
      desc: 'Port scan LLC host(s) from inventory.',
      opts: { RHOSTS: '10.13.37.30', PORTS: '1-10000' },
      run: async (o) => mzfPortscan(o.RHOSTS || o.RHOST, o.PORTS),
    },
    {
      path: 'auxiliary/scanner/http/title',
      type: 'auxiliary', rank: 'normal',
      name: 'HTTP Title Scanner',
      desc: 'Grab http-title banners from LLC web hosts.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80' },
      run: async (o) => mzfHttpTitle(o.RHOSTS || o.RHOST, o.RPORT || '80'),
    },
    {
      path: 'auxiliary/scanner/http/dir_enum',
      type: 'auxiliary', rank: 'normal',
      name: 'HTTP directory enum',
      desc: 'Enumerate /admin /api /debug /backup on LadenAdmin.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', PATHS: '/admin/,/api/v1/,/debug/,/backup/' },
      run: async (o) => mzfDirEnum(o.RHOSTS || o.RHOST, o.RPORT || '80', o.PATHS),
    },
    {
      path: 'auxiliary/scanner/http/ssl_version',
      type: 'auxiliary', rank: 'normal',
      name: 'TLS cert peek',
      desc: 'Show CN / TLS banner for https admin.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '443' },
      run: async (o) => mzfHttpTitle(o.RHOSTS || o.RHOST, o.RPORT || '443'),
    },
    {
      path: 'auxiliary/scanner/http/http_methods',
      type: 'auxiliary', rank: 'normal',
      name: 'HTTP methods',
      desc: 'Probe Admin API methods on :8443.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '8443' },
      run: async (o) => mzfHttpMethods(o.RHOSTS || o.RHOST, o.RPORT || '8443'),
    },
    {
      path: 'auxiliary/scanner/ssh/ssh_version',
      type: 'auxiliary', rank: 'normal',
      name: 'SSH Version',
      desc: 'Banner grab OpenSSH on LLC hosts.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '22' },
      run: async (o) => mzfServiceBanner(o.RHOSTS || o.RHOST, Number(o.RPORT || 22), 'ssh'),
    },
    {
      path: 'auxiliary/scanner/mysql/mysql_version',
      type: 'auxiliary', rank: 'normal',
      name: 'MySQL Version',
      desc: 'Read MySQL greeting from db01 (labnet).',
      opts: { RHOSTS: '10.13.37.20', RPORT: '3306' },
      run: async (o) => mzfServiceBanner(o.RHOSTS || o.RHOST, Number(o.RPORT || 3306), 'mysql'),
    },
    {
      path: 'auxiliary/scanner/modbus/find_unit_id',
      type: 'auxiliary', rank: 'normal',
      name: 'Modbus Unit ID',
      desc: 'OT lab: discover plc-sim unit id (fiction).',
      opts: { RHOSTS: '192.168.77.10', RPORT: '502' },
      run: async (o) => mzfServiceBanner(o.RHOSTS || o.RHOST, Number(o.RPORT || 502), 'modbus'),
    },
    {
      path: 'auxiliary/gather/labnet/admin_fingerprint',
      type: 'auxiliary', rank: 'great',
      name: 'Admin panel fingerprint',
      desc: 'Full fingerprint of admin.labnet.llc surfaces for mzf targeting.',
      opts: { RHOSTS: '10.13.37.30' },
      run: async (o) => mzfAdminFingerprint(o.RHOSTS || o.RHOST),
    },

    /* —— labnet web01 / gw —— */
    {
      path: 'exploit/labnet/http/laden_gw_rce',
      type: 'exploit', rank: 'excellent',
      name: 'Laden-GW demo RCE',
      desc: 'Educational RCE against web01:8080 Laden-GW (fiction).',
      opts: { RHOSTS: '10.13.37.10', RPORT: '8080', PAYLOAD: 'php/meterpreter/reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'laden_gw_rce', needPort: 8080,
      flag: 'LLZ{mzf_laden_gw_fiction_shell}',
      run: async (o) => mzfExploit(o, 'laden_gw_rce', 8080, 'Laden-GW/1.2 demo check'),
    },
    {
      path: 'exploit/labnet/mysql/weak_login',
      type: 'exploit', rank: 'great',
      name: 'MySQL weak auth (demo)',
      desc: 'db01 labnet — fictional weak creds → SQL shell session.',
      opts: { RHOSTS: '10.13.37.20', RPORT: '3306', USERNAME: 'root', PASSWORD: 'laden', PAYLOAD: 'generic/shell_bind_tcp' },
      needVuln: 'mysql_weak_auth', needPort: 3306,
      flag: 'LLZ{mzf_mysql_labnet_session}',
      run: async (o) => mzfExploit(o, 'mysql_weak_auth', 3306, 'MySQL greeting accepted (demo)'),
    },

    /* —— admin.labnet.llc — primary surface —— */
    {
      path: 'exploit/labnet/admin/auth_bypass',
      type: 'exploit', rank: 'excellent',
      name: 'Admin auth bypass',
      desc: 'LadenAdmin login — cookieless /admin/access demo bypass.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/admin/', PAYLOAD: 'admin/laden_agent', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_auth_bypass', needPort: 80,
      flag: 'LLZ{mzf_admin_auth_bypass}',
      run: async (o) => mzfExploit(o, 'admin_auth_bypass', 80, 'Set-Cookie: laden_admin=bypass; Path=/admin'),
    },
    {
      path: 'exploit/labnet/admin/sqli_login',
      type: 'exploit', rank: 'excellent',
      name: 'Admin SQLi login',
      desc: "Classic ' OR 1=1 on LadenAdmin login (fiction).",
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/admin/login', USERNAME: "admin'--", PASSWORD: 'x', PAYLOAD: 'php/meterpreter/reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_sqli', needPort: 80,
      flag: 'LLZ{mzf_admin_sqli_or_1_equals_1}',
      run: async (o) => mzfExploit(o, 'admin_sqli', 80, 'Login 302 → /admin/dashboard'),
    },
    {
      path: 'exploit/labnet/admin/file_upload',
      type: 'exploit', rank: 'great',
      name: 'Admin file upload RCE',
      desc: 'Avatar/upload → webshell under /admin/uploads (demo).',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/admin/upload', PAYLOAD: 'php/meterpreter/reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_upload', needPort: 80,
      flag: 'LLZ{mzf_admin_upload_shell}',
      run: async (o) => mzfExploit(o, 'admin_upload', 80, 'Uploaded shell.php → 200'),
    },
    {
      path: 'exploit/labnet/admin/idor_users',
      type: 'exploit', rank: 'great',
      name: 'Admin IDOR users API',
      desc: 'GET /api/v1/users/{id} without authz — dump operator rows.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '8443', TARGETURI: '/api/v1/users/1', PAYLOAD: 'javascript/meterpreter/reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_idor', needPort: 8443,
      flag: 'LLZ{mzf_admin_idor_users}',
      loot: true,
      run: async (o) => mzfAdminIdor(o),
    },
    {
      path: 'exploit/labnet/admin/jwt_none',
      type: 'exploit', rank: 'excellent',
      name: 'Admin JWT alg=none',
      desc: 'Admin API accepts alg=none — forge role=admin token.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '8443', TARGETURI: '/api/v1/me', PAYLOAD: 'javascript/meterpreter/reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_jwt_none', needPort: 8443,
      flag: 'LLZ{mzf_admin_jwt_none}',
      run: async (o) => mzfExploit(o, 'admin_jwt_none', 8443, 'JWT alg=none accepted · role=admin'),
    },
    {
      path: 'exploit/labnet/admin/xss_stored',
      type: 'exploit', rank: 'average',
      name: 'Admin stored XSS',
      desc: 'Notes field stores script — admin browser session steal (demo).',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/admin/notes', PAYLOAD: 'generic/shell_reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_xss_stored', needPort: 80,
      flag: 'LLZ{mzf_admin_stored_xss}',
      run: async (o) => mzfExploit(o, 'admin_xss_stored', 80, 'Stored payload reflected in /admin/notes'),
    },
    {
      path: 'exploit/labnet/admin/ssrf_debug',
      type: 'exploit', rank: 'great',
      name: 'Admin SSRF via debug',
      desc: 'Debug console fetches URL — hit 169.254 metadata (sim).',
      opts: { RHOSTS: '10.13.37.30', RPORT: '9000', TARGETURI: '/debug/fetch', URL: 'http://169.254.169.254/latest/meta-data/', PAYLOAD: 'cmd/unix/reverse', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_ssrf', needPort: 9000,
      flag: 'LLZ{mzf_admin_ssrf_metadata}',
      run: async (o) => mzfExploit(o, 'admin_ssrf', 9000, 'SSRF fetched metadata (simulated)'),
    },
    {
      path: 'exploit/labnet/admin/path_traversal',
      type: 'exploit', rank: 'great',
      name: 'Admin path traversal',
      desc: 'Download /etc/passwd via /admin/files?name=../…',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/admin/files', FILE: '../../../../etc/passwd', PAYLOAD: 'generic/shell_bind_tcp' },
      needVuln: 'admin_path_trav', needPort: 80,
      flag: 'LLZ{mzf_admin_path_trav}',
      loot: true,
      run: async (o) => mzfAdminTrav(o),
    },
    {
      path: 'exploit/labnet/admin/csrf_password',
      type: 'exploit', rank: 'normal',
      name: 'Admin CSRF password change',
      desc: 'No CSRF token on /admin/settings/password (demo).',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/admin/settings/password', PAYLOAD: 'admin/laden_agent', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_csrf', needPort: 80,
      flag: 'LLZ{mzf_admin_csrf}',
      run: async (o) => mzfExploit(o, 'admin_csrf', 80, 'Password changed via forged POST (demo)'),
    },
    {
      path: 'exploit/labnet/admin/debug_console_rce',
      type: 'exploit', rank: 'excellent',
      name: 'Debug console RCE',
      desc: 'Left-on /debug/eval — command exec as www-data (fiction).',
      opts: { RHOSTS: '10.13.37.30', RPORT: '9000', TARGETURI: '/debug/eval', CMD: 'id', PAYLOAD: 'linux/x64/meterpreter/reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_debug_console', needPort: 9000,
      flag: 'LLZ{mzf_admin_debug_rce}',
      run: async (o) => mzfExploit(o, 'admin_debug_console', 9000, 'eval → uid=33(www-data)'),
    },
    {
      path: 'exploit/labnet/admin/backup_expose',
      type: 'exploit', rank: 'great',
      name: 'Admin backup expose',
      desc: 'Fetch /backup/admin.sql.bak — creds + flag in dump.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '80', TARGETURI: '/backup/admin.sql.bak', PAYLOAD: 'generic/shell_bind_tcp' },
      needVuln: 'admin_backup_expose', needPort: 80,
      flag: 'LLZ{mzf_admin_backup_bak}',
      loot: true,
      run: async (o) => mzfAdminBackup(o),
    },
    {
      path: 'exploit/labnet/admin/totp_bruteforce',
      type: 'exploit', rank: 'average',
      name: 'Weak TOTP window',
      desc: 'Admin 2FA accepts skewed/demo codes — educational only.',
      opts: { RHOSTS: '10.13.37.30', RPORT: '443', TARGETURI: '/admin/2fa', CODE: '000000', PAYLOAD: 'admin/laden_agent', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'admin_weak_totp', needPort: 443,
      flag: 'LLZ{mzf_admin_weak_totp}',
      run: async (o) => mzfExploit(o, 'admin_weak_totp', 443, 'TOTP accepted (demo window)'),
    },

    /* —— other nets —— */
    {
      path: 'exploit/dmz/http/honeypot_trap',
      type: 'exploit', rank: 'manual',
      name: 'Honeypot trap (teach)',
      desc: 'honeypot.dmz.llc — educational tar-pit.',
      opts: { RHOSTS: '172.16.90.80', RPORT: '80', PAYLOAD: 'generic/shell_reverse_tcp', LHOST: '10.13.37.50', LPORT: '4444' },
      needVuln: 'honeypot_trap', needPort: 80,
      flag: 'LLZ{mzf_know_your_honeypots}',
      honeypot: true,
      run: async (o) => mzfExploit(o, 'honeypot_trap', 80, 'HTTP 200 It works! (decoy)'),
    },
    {
      path: 'exploit/ot/modbus/register_write',
      type: 'exploit', rank: 'average',
      name: 'Modbus register write (sim)',
      desc: 'plc-sim.ot.llc — write holding register in simulation only.',
      opts: { RHOSTS: '192.168.77.10', RPORT: '502', UNIT_ID: '1', REGISTER: '0', VALUE: '1337', PAYLOAD: 'cmd/unix/reverse' },
      needVuln: 'modbus_write', needPort: 502,
      flag: 'LLZ{mzf_ot_modbus_sim_only}',
      run: async (o) => mzfExploit(o, 'modbus_write', 502, 'Modbus write OK (simulation)'),
    },
    {
      path: 'exploit/wifi/http/captive_bypass',
      type: 'exploit', rank: 'normal',
      name: 'Captive portal bypass (demo)',
      desc: 'ap-guest.wifi.llc captive portal — educational bypass.',
      opts: { RHOSTS: '10.0.88.1', RPORT: '80', PAYLOAD: 'generic/shell_reverse_tcp', LHOST: '10.0.88.42', LPORT: '4444' },
      needVuln: 'captive_bypass', needPort: 80,
      flag: 'LLZ{mzf_wifi_captive_lab}',
      run: async (o) => mzfExploit(o, 'captive_bypass', 80, 'Portal cookie forged (demo)'),
    },

    /* —— post —— */
    {
      path: 'post/labnet/gather/enum_jump',
      type: 'post', rank: 'normal',
      name: 'Enum jump host',
      desc: 'Post: list fictional loot from a session.',
      opts: { SESSION: '1' },
      run: async (o) => mzfPostEnum(o.SESSION),
    },
    {
      path: 'post/labnet/admin/dump_config',
      type: 'post', rank: 'great',
      name: 'Dump LadenAdmin config',
      desc: 'From an admin session — pull config.php (fiction).',
      opts: { SESSION: '1' },
      run: async (o) => mzfPostAdminDump(o.SESSION),
    },
    {
      path: 'post/labnet/admin/hashdump',
      type: 'post', rank: 'great',
      name: 'Admin hashdump',
      desc: 'Dump fictional password hashes from admin DB session.',
      opts: { SESSION: '1' },
      run: async (o) => mzfPostHashdump(o.SESSION),
    },
    {
      path: 'post/labnet/pivot/route_add',
      type: 'post', rank: 'normal',
      name: 'Add pivot route',
      desc: 'Mark a fiction route through compromised admin → db01.',
      opts: { SESSION: '1', SUBNET: '10.13.37.0/24' },
      run: async (o) => mzfPostRoute(o),
    },
  ];


  async function mzfDirEnum(spec, rport, paths) {
    const hits = mzfEnsureInScope(spec);
    if (!hits) return false;
    const port = Number(rport || 80);
    const list = String(paths || '/admin/,/api/v1/,/debug/,/backup/').split(/[,\s]+/).filter(Boolean);
    printText(`[*] Dir enum ${spec}:${port}`,'out-dim');
    await mzfSleep(160);
    for (const { host } of hits) {
      const p = (host.ports || []).find(x => x.port === port && x.open);
      if (!p) { printText(`[-] ${host.ip} — no open ${port}/tcp`,'out-warn'); continue; }
      const hints = (p.scripts || []).join(' ');
      for (const path of list) {
        const hit = hints.includes(path.replace(/\/$/,'')) || (host.hostname || '').includes('admin');
        printText(`${hit ? '[+]' : '[-]'} ${host.ip}${path.padEnd(22)} ${hit ? '200 (inventory)' : '404'}`);
      }
    }
    return true;
  }

  async function mzfHttpMethods(spec, rport) {
    const hits = mzfEnsureInScope(spec);
    if (!hits) return false;
    const port = Number(rport || 8443);
    printText(`[*] HTTP methods ${spec}:${port}`,'out-dim');
    await mzfSleep(120);
    for (const { host } of hits) {
      const p = (host.ports || []).find(x => x.port === port && x.open);
      if (!p) { printText(`[-] closed`,'out-warn'); continue; }
      const methods = (p.scripts || []).find(s => s.startsWith('http-methods')) || 'http-methods: GET POST';
      printText(`[+] ${host.ip}  ${methods}`);
    }
    return true;
  }

  async function mzfAdminFingerprint(spec) {
    const hits = mzfEnsureInScope(spec || '10.13.37.30');
    if (!hits) return false;
    const { host, net } = hits[0];
    printText('[*] Fingerprinting LadenAdmin surface…','out-dim');
    await mzfSleep(200);
    printText(`Host     : ${host.ip} (${host.hostname})`);
    printText(`Net      : ${net.name} ${net.cidr}`);
    printText(`Role     : ${host.role || 'admin-panel'}`);
    printText(`Vulns    : ${(host.vulns || []).join(', ')}`);
    printText('Ports:');
    for (const p of (host.ports || []).filter(x => x.open)) {
      printText(`  ${String(p.port).padStart(5)}/tcp  ${(p.service||'').padEnd(12)} ${p.product||''}`);
      (p.scripts || []).forEach(s => printText('           · ' + s, 'out-dim'));
    }
    printText('[*] Tip: search admin · use exploit/labnet/admin/auth_bypass','out-ok');
    return true;
  }

  function mzfAddLoot(kind, data, host) {
    const item = { id: MZF_LOOT.length + 1, kind, data, host: host || '', at: new Date().toISOString(), ws: mzfWorkspace };
    MZF_LOOT.push(item);
    printText(`[+] Loot #${item.id} stored (${kind}) — loot -l`,'out-ok');
    return item;
  }

  async function mzfAdminIdor(o) {
    const ok = await mzfExploit(o, 'admin_idor', Number(o.RPORT || 8443), 'IDOR /api/v1/users/1 → 200 JSON');
    if (!ok) return false;
    mzfAddLoot('admin_users_json', '{"id":1,"user":"admin","role":"root","email":"admin@labnet.llc"}', o.RHOSTS || o.RHOST);
    return true;
  }

  async function mzfAdminTrav(o) {
    const ok = await mzfExploit(o, 'admin_path_trav', Number(o.RPORT || 80), 'Traversal read OK');
    if (!ok) return false;
    mzfAddLoot('etc_passwd', 'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n', o.RHOSTS || o.RHOST);
    return true;
  }

  async function mzfAdminBackup(o) {
    const ok = await mzfExploit(o, 'admin_backup_expose', Number(o.RPORT || 80), 'Downloaded admin.sql.bak');
    if (!ok) return false;
    mzfAddLoot('admin_sql_bak', "-- LadenAdmin dump\\nINSERT INTO users VALUES (1,'admin','$2y$…');\n-- LLZ{mzf_admin_backup_bak}\n", o.RHOSTS || o.RHOST);
    return true;
  }

  async function mzfPostAdminDump(sessionId) {
    const sid = Number(sessionId || 0);
    const s = MZF_SESSIONS.find(x => x.id === sid);
    if (!s) { printText('[-] Invalid session','out-err'); return false; }
    printText(`[*] Dumping LadenAdmin config via session ${sid}`,'out-dim');
    await mzfSleep(140);
    printText('DB_HOST=10.13.37.20');
    printText('DB_USER=admin_app');
    printText('DB_PASS=labnet-demo-pass');
    printText('JWT_ALG=none  # (!)');
    mzfAddLoot('admin_config', 'DB_HOST=10.13.37.20;JWT_ALG=none', s.host);
    printText('[+] LLZ{mzf_admin_config_dump}','out-ok');
    return true;
  }

  async function mzfPostHashdump(sessionId) {
    const sid = Number(sessionId || 0);
    const s = MZF_SESSIONS.find(x => x.id === sid);
    if (!s) { printText('[-] Invalid session','out-err'); return false; }
    printText(`[*] hashdump session ${sid}`,'out-dim');
    await mzfSleep(120);
    printText('admin:$2y$10$demodemo……………………………:0:0:Admin:/home/admin:');
    printText('operator:$2y$10$labnetlabnet……………………:1000:1000:Op:/home/op:');
    mzfAddLoot('hashdump', 'admin:$2y$10$demo…', s.host);
    printText('[+] LLZ{mzf_admin_hashdump}','out-ok');
    return true;
  }

  async function mzfPostRoute(o) {
    const sid = Number(o.SESSION || 0);
    const s = MZF_SESSIONS.find(x => x.id === sid);
    if (!s) { printText('[-] Invalid session','out-err'); return false; }
    const subnet = o.SUBNET || '10.13.37.0/24';
    MZF_ROUTES.push({ session: sid, subnet, via: s.host });
    printText(`[+] Route added: ${subnet} via session ${sid} (${s.host})`,'out-ok');
    printText('[*] route print  ·  pivot toward db01 with mysql modules','out-dim');
    return true;
  }

  function mzfFindHost(target) {
    if (!target) return null;
    const t = String(target).trim();
    for (const net of NETS) {
      for (const h of net.hosts) {
        if (h.ip === t || h.hostname === t || h.hostname.startsWith(t + '.') || h.hostname.split('.')[0] === t) {
          return { net, host: h };
        }
      }
    }
    return null;
  }

  function mzfResolveHosts(spec) {
    const s = String(spec || '').trim();
    if (!s) return [];
    // cidr or net name
    for (const net of NETS) {
      if (net.cidr === s || net.name === s || net.domain === s) {
        return net.hosts.map(h => ({ net, host: h }));
      }
    }
    const one = mzfFindHost(s);
    return one ? [one] : [];
  }

  function mzfEnsureInScope(spec) {
    const hits = mzfResolveHosts(spec);
    if (!hits.length) {
      printText(`[-] Target '${spec}' is outside LLC fiction scope. See: show nets / lmap --list`,'out-err');
      return null;
    }
    return hits;
  }

  async function mzfScanHosts(spec) {
    const hits = mzfEnsureInScope(spec);
    if (!hits) return false;
    printText('[*] Host discovery against ' + spec + ' (inventory)','out-dim');
    await mzfSleep(180);
    let up = 0;
    for (const { host } of hits) {
      const alive = host.ports && host.ports.some(p => p.open);
      if (alive) {
        up++;
        printText(`[+] ${host.ip.padEnd(15)} ${host.hostname}  UP`);
      } else {
        printText(`[-] ${host.ip.padEnd(15)} ${host.hostname}  down/filtered`,'out-dim');
      }
    }
    printText(`[*] ${up}/${hits.length} hosts up`,'out-ok');
    return true;
  }

  async function mzfPortscan(spec, ports) {
    const hits = mzfEnsureInScope(spec);
    if (!hits) return false;
    printText(`[*] TCP portscan ${spec}`,'out-dim');
    await mzfSleep(220);
    for (const { host } of hits) {
      printText(`[*] ${host.ip} (${host.hostname})`);
      const open = (host.ports || []).filter(p => p.open);
      if (!open.length) { printText('    (no open ports in inventory)','out-dim'); continue; }
      for (const p of open) {
        printText(`    ${String(p.port).padStart(5)}/tcp open  ${(p.service||'').padEnd(12)} ${p.product||''}`);
      }
    }
    printText('[*] Scanned against LLC inventory only','out-dim');
    return true;
  }

  async function mzfHttpTitle(spec, rport) {
    const hits = mzfEnsureInScope(spec);
    if (!hits) return false;
    const port = Number(rport || 80);
    printText(`[*] HTTP title @ ${spec}:${port}`,'out-dim');
    await mzfSleep(160);
    for (const { host } of hits) {
      const p = (host.ports || []).find(x => x.port === port && x.open);
      if (!p) { printText(`[-] ${host.ip} — no open ${port}/tcp`,'out-warn'); continue; }
      const title = (p.scripts || []).find(s => s.startsWith('http-title')) || ('http-title: ' + (p.banner || p.product || 'n/a'));
      printText(`[+] ${host.ip}  ${title}`);
    }
    return true;
  }

  async function mzfServiceBanner(spec, port, want) {
    const hits = mzfEnsureInScope(spec);
    if (!hits) return false;
    printText(`[*] ${want} banner ${spec}:${port}`,'out-dim');
    await mzfSleep(140);
    for (const { host } of hits) {
      const p = (host.ports || []).find(x => x.port === port && x.open);
      if (!p) { printText(`[-] ${host.ip} — closed/filtered ${port}`,'out-warn'); continue; }
      if (want && p.service && !p.service.includes(want) && want !== 'modbus') {
        printText(`[*] ${host.ip} port ${port} is ${p.service} (wanted ${want})`,'out-dim');
      }
      printText(`[+] ${host.ip}  ${p.banner || p.product || p.service}`);
      (p.scripts || []).forEach(s => printText('    ' + s, 'out-dim'));
    }
    return true;
  }

  function mzfSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function mzfExploit(o, vuln, port, checkMsg) {
    const rhost = o.RHOSTS || o.RHOST;
    const hits = mzfEnsureInScope(rhost);
    if (!hits) return false;
    const { host, net } = hits[0];
    const rport = Number(o.RPORT || port);
    printText(`[*] Connecting to ${host.ip}:${rport} (${host.hostname})`,'out-dim');
    await mzfSleep(200);
    const p = (host.ports || []).find(x => x.port === rport && x.open);
    if (!p) {
      printText(`[-] Exploit failed: ${rport}/tcp closed on ${host.ip}`,'out-err');
      return false;
    }
    if (vuln && !(host.vulns || []).includes(vuln)) {
      printText(`[-] Target not vulnerable to this module (wrong host/net).`,'out-err');
      printText(`[*] Hint: search ${vuln.split('_')[0]} · show nets`,'out-dim');
      return false;
    }
    printText(`[+] ${checkMsg}`,'out-ok');
    await mzfSleep(180);
    if (mzfModule && mzfModule.honeypot) {
      printText('[!] Wait — fingerprint looks like a honeypot (cowrie/decoy).','out-warn');
      printText('[*] Session opened into a TAR PIT. Educational win, not a real shell.','out-warn');
    } else {
      printText('[+] Exploit completed (fiction).','out-ok');
    }
    const payload = o.PAYLOAD || 'generic/shell_reverse_tcp';
    const sid = mzfSessionSeq++;
    const sess = {
      id: sid,
      host: host.ip,
      hostname: host.hostname,
      net: net.name,
      payload,
      via: mzfModule ? mzfModule.path : 'exploit',
      at: new Date().toISOString(),
      honeypot: !!(mzfModule && mzfModule.honeypot),
    };
    MZF_SESSIONS.push(sess);
    printText(`[*] Started bind/reverse handler (demo)`,'out-dim');
    printText(`[+] Session ${sid} opened (${payload}) → ${host.ip}`,'out-ok');
    if (mzfModule && mzfModule.flag) {
      printText(`[+] Loot flag: ${mzfModule.flag}`,'out-ok');
      printText('[*] Submit it on the matching lab / Challenges when ready.','out-dim');
      try { mzfAddLoot('flag', mzfModule.flag, host.ip); } catch {}
    }
    printText(`[*] sessions -l  ·  use post/labnet/gather/enum_jump`,'out-dim');
    return true;
  }

  async function mzfPostEnum(sessionId) {
    const sid = Number(sessionId || 0);
    const s = MZF_SESSIONS.find(x => x.id === sid);
    if (!s) {
      printText('[-] Invalid session. sessions -l','out-err');
      return false;
    }
    printText(`[*] Running post enum on session ${sid} (${s.host})`,'out-dim');
    await mzfSleep(150);
    if (s.honeypot) {
      printText('[!] Session is honeypot-bound — loot is decoy only.','out-warn');
    }
    printText(`Hostname: ${s.hostname}`);
    printText(`Net:      ${s.net}`);
    printText(`Payload:  ${s.payload}`);
    printText('Loot (fiction):');
    printText('  /etc/hostname → ' + s.hostname.split('.')[0]);
    printText('  ~/.ssh/known_hosts → (demo entries)');
    printText('  /opt/laden/notes.txt → stay in scope · LLZ labs only');
    return true;
  }

  function mzfPromptStr() {
    if (!mzfActive) return null;
    if (mzfModule) {
      const short = mzfModule.path.split('/').slice(-2).join('/');
      return `mzf ${mzfModule.type}(${short}) >`;
    }
    return 'mzf6 >';
  }

  function mzfBanner() {
    print(`<span class="out-ok">mzfconsole</span> <span class="out-dim">6.0-llc — Metasploit-flavored · fictional nets ONLY</span>
<span class="out-dim">=======</span>
<span class="out-dim"> Networks: labnet 10.13.37.0/24 · dmz 172.16.90.0/24 · ot 192.168.77.0/24 · wifi 10.0.88.0/24</span>
<span class="out-dim"> help · search admin · use exploit/labnet/admin/auth_bypass · check · run · loot -l · exit</span>`);
  }

  function mzfHelp() {
    return `mzfconsole — Laden Metasploit Framework (educational)

Core
  help                 this help
  banner               splash
  version              version string
  show nets            LLC fictional networks
  show modules         all modules
  search <kw>          search module paths
  use <path|#>         select module
  back                 deselect module
  info                 module info
  show options         current options
  show payloads        payloads
  show targets         implied RHOST hints
  set <OPT> <val>      set option (RHOSTS, RPORT, PAYLOAD, …)
  unset <OPT>          clear option
  run / exploit / rexploit
  sessions [-l] [-i n] list / interact (demo)
  jobs                 (no background jobs in LLC demo)
  exit / quit          leave mzfconsole → LLC

Extra
  check                 dry-run vuln/port match for current module
  loot [-l]             list captured loot
  route [-p]            show pivot routes
  workspace [name]      label this fiction workspace
  spool [on|off|list]   capture console lines (demo)
  db_hosts              inventory hosts (like db_nmap)

Workflow — admin.labnet.llc (10.13.37.30)
  search admin
  use auxiliary/gather/labnet/admin_fingerprint
  run
  use exploit/labnet/admin/auth_bypass
  set RHOSTS 10.13.37.30
  check
  run
  sessions -l
  use post/labnet/admin/dump_config
  set SESSION 1
  run

Scope lock: only hosts under /nets. Real-internet exploits are blocked.`;
  }

  async function mzfRunLine(line) {
    const raw = String(line || '').trim();
    if (!raw) return;
    print(`<span class="out-cmd">${esc(mzfPromptStr())} ${esc(raw)}</span>`);
    const args = parseArgs(raw);
    const cmd = (args[0] || '').toLowerCase();
    const rest = args.slice(1);
    const joinRest = rest.join(' ');

    if (cmd === 'help' || cmd === '?') { printText(mzfHelp()); return; }
    if (cmd === 'banner') { mzfBanner(); return; }
    if (cmd === 'version') {
      printText('Framework: mzfconsole 6.0.0-llc (fictional)\nConsole : LLC browser workstation\nPayloads: ' + MZF_PAYLOADS.length + ' · Modules: ' + MZF_MODULES.length);
      return;
    }
    if (cmd === 'exit' || cmd === 'quit') {
      mzfActive = false; mzfModule = null; mzfOpts = {};
      setPrompt();
      printText('[*] Exited mzfconsole — back to LLC.','out-ok');
      return;
    }
    if (cmd === 'back') {
      mzfModule = null; mzfOpts = {};
      setPrompt();
      printText('[*] Module cleared');
      return;
    }
    if (cmd === 'show') {
      const what = (rest[0] || '').toLowerCase();
      if (what === 'nets' || what === 'networks') {
        for (const n of NETS) {
          printText(`${n.name.padEnd(8)} ${n.cidr.padEnd(18)} ${n.domain}`);
          for (const h of n.hosts) {
            const vs = (h.vulns || []).join(',') || '-';
            printText(`  ${h.ip.padEnd(15)} ${h.hostname.padEnd(28)} vulns=${vs}`,'out-dim');
          }
        }
        return;
      }
      if (what === 'modules' || what === 'all') {
        MZF_MODULES.forEach((m, i) => printText(`${String(i).padStart(3)}  ${m.type.padEnd(10)} ${m.path}`));
        return;
      }
      if (what === 'payloads') {
        MZF_PAYLOADS.forEach(p => printText(`  ${p.name.padEnd(42)} ${p.desc}`));
        return;
      }
      if (what === 'options') {
        if (!mzfModule) { printText('[-] No module selected. use <path>','out-err'); return; }
        printText(`Module options (${mzfModule.path}):`);
        printText('   Name       Current Setting          Required  Description');
        printText('   ----       ---------------          --------  -----------');
        const keys = Object.keys(Object.assign({}, mzfModule.opts, mzfOpts));
        for (const k of Object.keys(mzfModule.opts)) {
          const cur = (mzfOpts[k] != null ? mzfOpts[k] : mzfModule.opts[k]);
          printText(`   ${k.padEnd(10)} ${String(cur).padEnd(24)} yes       module option`);
        }
        return;
      }
      if (what === 'targets') {
        if (!mzfModule) { printText('[-] No module.','out-err'); return; }
        printText('Implied LLC targets (from opts / vulns):');
        const hint = mzfOpts.RHOSTS || mzfModule.opts.RHOSTS;
        printText('  default RHOSTS → ' + hint);
        if (mzfModule.needVuln) {
          for (const n of NETS) for (const h of n.hosts) {
            if ((h.vulns || []).includes(mzfModule.needVuln)) {
              printText(`  [+] ${h.ip}  ${h.hostname}`,'out-ok');
            }
          }
        }
        return;
      }
      if (what === 'info') { /* fallthrough via info cmd */ }
      else { printText('usage: show options|payloads|modules|nets|targets|info','out-err'); return; }
    }
    if (cmd === 'info' || (cmd === 'show' && (rest[0] || '').toLowerCase() === 'info')) {
      if (!mzfModule) { printText('[-] No module selected.','out-err'); return; }
      printText(`Name: ${mzfModule.name}`);
      printText(`Module: ${mzfModule.path}`);
      printText(`Type: ${mzfModule.type} · Rank: ${mzfModule.rank}`);
      printText(`\n${mzfModule.desc}`);
      if (mzfModule.needVuln) printText(`\nRequires vuln tag: ${mzfModule.needVuln} · port ${mzfModule.needPort || '?'}`);
      if (mzfModule.flag) printText(`Demo flag: ${mzfModule.flag}`);
      return;
    }
    if (cmd === 'search') {
      const kw = joinRest.toLowerCase();
      const hits = MZF_MODULES.filter(m =>
        !kw || m.path.includes(kw) || m.name.toLowerCase().includes(kw) || m.desc.toLowerCase().includes(kw) || m.type.includes(kw)
      );
      if (!hits.length) { printText('No modules matched.','out-warn'); return; }
      printText('Matching Modules');
      printText('================');
      hits.forEach((m, i) => {
        const idx = MZF_MODULES.indexOf(m);
        printText(`   ${String(idx).padStart(3)}  ${m.type.padEnd(10)}  ${m.rank.padEnd(10)}  ${m.path}`);
        printText(`        ${m.name}: ${m.desc.slice(0, 70)}`,'out-dim');
      });
      return;
    }
    if (cmd === 'use') {
      const sel = joinRest.trim();
      if (!sel) { printText('usage: use <path|index>','out-err'); return; }
      let mod = null;
      if (/^\d+$/.test(sel)) mod = MZF_MODULES[Number(sel)];
      else mod = MZF_MODULES.find(m => m.path === sel || m.path.endsWith(sel) || m.path.includes(sel));
      if (!mod) { printText('[-] Module not found. search <kw>','out-err'); return; }
      mzfModule = mod;
      mzfOpts = Object.assign({}, mod.opts);
      setPrompt();
      printText(`[*] Using configured module: ${mod.path}`,'out-ok');
      return;
    }
    if (cmd === 'set') {
      if (!mzfModule) { printText('[-] No module selected.','out-err'); return; }
      const key = (rest[0] || '').toUpperCase();
      const val = rest.slice(1).join(' ');
      if (!key || !val) { printText('usage: set OPTION value','out-err'); return; }
      mzfOpts[key] = val;
      printText(`${key} => ${val}`);
      return;
    }
    if (cmd === 'unset') {
      const key = (rest[0] || '').toUpperCase();
      if (!key) { printText('usage: unset OPTION','out-err'); return; }
      delete mzfOpts[key];
      if (mzfModule && mzfModule.opts[key] != null) mzfOpts[key] = mzfModule.opts[key];
      printText(`Unset ${key}`);
      return;
    }
    if (cmd === 'run' || cmd === 'exploit' || cmd === 'rexploit') {
      if (!mzfModule) { printText('[-] No module. use <path>','out-err'); return; }
      printText(`[*] Launching ${mzfModule.path} …`,'out-dim');
      const ok = await mzfModule.run(Object.assign({}, mzfModule.opts, mzfOpts));
      if (!ok) printText('[*] Module completed with failures.','out-warn');
      return;
    }
    if (cmd === 'sessions') {
      const flag = (rest[0] || '-l').toLowerCase();
      if (flag === '-l' || flag === 'list' || !rest.length) {
        if (!MZF_SESSIONS.length) { printText('No active sessions.'); return; }
        printText('Active sessions');
        printText('===============');
        MZF_SESSIONS.forEach(s => {
          printText(`  ${String(s.id).padStart(3)}  ${s.host.padEnd(15)}  ${s.payload}  ${s.honeypot ? '(honeypot)' : ''}`);
        });
        return;
      }
      if (flag === '-i') {
        const sid = Number(rest[1]);
        const s = MZF_SESSIONS.find(x => x.id === sid);
        if (!s) { printText('[-] Invalid session id','out-err'); return; }
        printText(`[+] Interacting with session ${sid} — demo shell (type background / exit)`,'out-ok');
        printText(`meterpreter > sysinfo`);
        printText(`Computer        : ${s.hostname}`);
        printText(`OS              : LLC Fiction Linux`);
        printText(`Payload         : ${s.payload}`);
        printText(`meterpreter > (demo — use post modules or sessions -l)`,'out-dim');
        return;
      }
      printText('usage: sessions -l | sessions -i <id>','out-err');
      return;
    }
    if (cmd === 'jobs') {
      printText('No background jobs in LLC mzfconsole demo.','out-dim');
      return;
    }
    if (cmd === 'check') {
      if (!mzfModule) { printText('[-] No module.','out-err'); return; }
      const o = Object.assign({}, mzfModule.opts, mzfOpts);
      const rhost = o.RHOSTS || o.RHOST;
      const hits = mzfEnsureInScope(rhost);
      if (!hits) return;
      const { host } = hits[0];
      const port = Number(o.RPORT || mzfModule.needPort || 0);
      const p = port ? (host.ports || []).find(x => x.port === port && x.open) : true;
      const v = mzfModule.needVuln ? (host.vulns || []).includes(mzfModule.needVuln) : true;
      printText(`[*] check ${mzfModule.path}`,'out-dim');
      printText(`    host  ${host.ip} ${host.hostname}`);
      printText(`    port  ${port || '-'}  ${p ? 'open' : 'CLOSED'}`);
      printText(`    vuln  ${mzfModule.needVuln || '-'}  ${v ? 'MATCH' : 'no match'}`);
      printText(p && v ? '[+] The target appears vulnerable (fiction).' : '[-] check failed — wrong host/port/vuln.','out-ok');
      return;
    }
    if (cmd === 'loot') {
      if (!MZF_LOOT.length) { printText('No loot yet — run admin exploits.'); return; }
      MZF_LOOT.forEach(L => {
        printText(`  ${String(L.id).padStart(3)}  ${(L.kind||'').padEnd(18)}  ${L.host}  ${String(L.data).slice(0,60)}`);
      });
      return;
    }
    if (cmd === 'route') {
      if (!MZF_ROUTES.length) { printText('No routes. use post/labnet/pivot/route_add'); return; }
      MZF_ROUTES.forEach((r,i) => printText(`  ${i}  ${r.subnet} via session ${r.session} (${r.via})`));
      return;
    }
    if (cmd === 'workspace') {
      if (rest[0]) { mzfWorkspace = rest.join(' '); printText(`[*] Workspace => ${mzfWorkspace}`); }
      else printText(`[*] Workspace: ${mzfWorkspace}`);
      return;
    }
    if (cmd === 'spool') {
      const a = (rest[0] || 'list').toLowerCase();
      if (a === 'on') { mzfSpool = mzfSpool || []; printText('[*] Spool on (demo buffer)'); }
      else if (a === 'off') { printText('[*] Spool off'); }
      else { printText(`Spool lines: ${mzfSpool.length} (demo)`); }
      return;
    }
    if (cmd === 'db_hosts' || cmd === 'hosts') {
      for (const n of NETS) for (const h of n.hosts) {
        printText(`${h.ip.padEnd(15)} ${h.hostname.padEnd(28)} ${(h.vulns||[]).slice(0,3).join(',')}`);
      }
      return;
    }
    printText(`[-] Unknown command: ${cmd}. Try help`,'out-err');
  }

  async function mzfEnter() {
    mzfActive = true;
    setPrompt();
    mzfBanner();
  }



  /* ── Fictional NICs + wifi dongle (monitor mode) ───────────── */
  const IFACES = {
    lo: {
      type: 'loopback',
      up: true,
      mac: '00:00:00:00:00:00',
      ipv4: ['127.0.0.1/8'],
      ipv6: ['::1/128'],
    },
    eth0: {
      type: 'ether',
      up: true,
      mac: '02:13:37:00:00:01',
      ipv4: ['10.13.37.50/24'],
      ipv6: ['fe80::13:37ff:fe00:1/64'],
      gw: '10.13.37.1',
    },
    'wlan0': {
      type: 'wifi',
      up: true,
      mac: '02:13:37:w1:f1:00',
      ipv4: ['10.0.88.42/24'],
      ipv6: ['fe80::13:37ff:few1:f100/64'],
      mode: 'managed', // managed | monitor
      essid: 'Laden-Guest',
      ap: '02:13:37:ap:88:01',
      freq: '2.437 GHz',
      bitrates: '144 Mb/s',
      txpower: '20 dBm',
      driver: 'laden-dongle-mt76 (fictional)',
      chipset: 'LabNet USB WiFi Dongle LN-USB-AC',
    },
  };
  // monitor alias created by airmon-ng start / iwconfig mode monitor
  let MON_IF = null; // e.g. wlan0mon

  const WIFI_APS = [
    { bssid: '02:13:37:ap:88:01', essid: 'Laden-Guest', channel: 6, power: -42, enc: 'WPA2', clients: 3 },
    { bssid: '02:13:37:ap:88:02', essid: 'Laden-Lab', channel: 11, power: -55, enc: 'WPA2', clients: 1 },
    { bssid: '02:13:37:ap:88:03', essid: 'CafeFree_WiFi', channel: 1, power: -71, enc: 'OPN', clients: 8 },
    { bssid: '02:13:37:ap:88:04', essid: 'IOT-LAB-SENSORS', channel: 3, power: -60, enc: 'WPA2', clients: 12 },
    { bssid: 'DE:AD:BE:EF:00:99', essid: '<hidden>', channel: 9, power: -68, enc: 'WPA2', clients: 0 },
  ];

  function ensureMonIface() {
    if (MON_IF && IFACES[MON_IF]) return MON_IF;
    const mon = 'wlan0mon';
    MON_IF = mon;
    IFACES[mon] = {
      type: 'wifi',
      up: true,
      mac: IFACES.wlan0.mac,
      ipv4: [],
      ipv6: [],
      mode: 'monitor',
      essid: 'off/any',
      ap: 'Not-Associated',
      freq: IFACES.wlan0.freq,
      bitrates: '0 Mb/s',
      txpower: IFACES.wlan0.txpower,
      driver: IFACES.wlan0.driver,
      chipset: IFACES.wlan0.chipset,
      parent: 'wlan0',
    };
    IFACES.wlan0.mode = 'monitor';
    IFACES.wlan0.up = false;
    IFACES.wlan0.essid = 'off/any';
    IFACES.wlan0.ap = 'Not-Associated';
    IFACES.wlan0.ipv4 = [];
    return mon;
  }

  function stopMonIface() {
    if (!MON_IF) return null;
    const mon = MON_IF;
    delete IFACES[mon];
    MON_IF = null;
    IFACES.wlan0.mode = 'managed';
    IFACES.wlan0.up = true;
    IFACES.wlan0.essid = 'Laden-Guest';
    IFACES.wlan0.ap = '02:13:37:ap:88:01';
    IFACES.wlan0.ipv4 = ['10.0.88.42/24'];
    return mon;
  }

  function fmtIpAddr() {
    const lines = [];
    let idx = 1;
    for (const [name, iface] of Object.entries(IFACES)) {
      const flags = [];
      if (name === 'lo') flags.push('LOOPBACK');
      else if (iface.type === 'wifi') flags.push('BROADCAST', 'MULTICAST');
      else flags.push('BROADCAST', 'MULTICAST');
      if (iface.up) flags.push('UP', 'LOWER_UP');
      else flags.push('DOWN');
      const state = iface.up ? 'UP' : 'DOWN';
      lines.push(`${idx}: ${name}: <${flags.join(',')}> mtu ${name==='lo'?65536:1500} qdisc fq_codel state ${state} group default qlen 1000`);
      lines.push(`    link/${iface.type === 'wifi' ? 'ether' : (name==='lo'?'loopback':'ether')} ${iface.mac} brd ff:ff:ff:ff:ff:ff`);
      if (iface.type === 'wifi') {
        lines.push(`    altname laden-dongle · ${iface.chipset}`);
      }
      for (const a of (iface.ipv4 || [])) {
        const [ip, pfx] = a.split('/');
        lines.push(`    inet ${ip}/${pfx || '24'} brd ${ip.replace(/\.\d+$/,'.255')} scope ${name==='lo'?'host':'global'} ${name}`);
        lines.push(`       valid_lft forever preferred_lft forever`);
      }
      for (const a of (iface.ipv6 || [])) {
        lines.push(`    inet6 ${a} scope ${name==='lo'?'host':'link'}`);
        lines.push(`       valid_lft forever preferred_lft forever`);
      }
      idx++;
    }
    return lines.join('\n');
  }

  function fmtIwconfig(target) {
    const names = target ? [target] : Object.keys(IFACES).filter(n => IFACES[n].type === 'wifi');
    if (target && !IFACES[target]) return null;
    if (target && IFACES[target].type !== 'wifi') return `${target}       no wireless extensions.`;
    const blocks = [];
    for (const name of names) {
      const w = IFACES[name];
      if (!w || w.type !== 'wifi') continue;
      const mode = (w.mode || 'managed').toUpperCase();
      blocks.push(
`${name}     IEEE 802.11  ESSID:"${w.essid}"
          Mode:${mode}  Frequency:${w.freq}  Access Point: ${w.ap}
          Bit Rate:${w.bitrates}   Tx-Power:${w.txpower}
          Retry short limit:7   RTS thr:off   Fragment thr:off
          Encryption key:off
          Power Management:on
          Link Quality=70/70  Signal level=-42 dBm
          Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0
          Tx excessive retries:0  Invalid misc:0   Missed beacon:0
          Driver:${w.driver}
          Chipset:${w.chipset}`
      );
    }
    if (!blocks.length) return 'lo        no wireless extensions.\n\neth0      no wireless extensions.';
    const wired = ['lo', 'eth0'].filter(n => IFACES[n]).map(n => `${n.padEnd(10)}no wireless extensions.`).join('\n\n');
    return (target ? '' : wired + '\n\n') + blocks.join('\n\n');
  }

  function labcrackHelp() {
    return `labcrack-ng 1.7 — Laden Labs wireless audit suite (FICTIONAL / educational)

Usage:
  labcrack-ng --help
  labcrack-ng --list                 list captured handshake .cap files
  labcrack-ng <cap> -w <wordlist>    crack WPA/WPA2 PSK (demo)
  labcrack-ng-airodump               alias: scan nearby APs (needs monitor)
  labcrack-ng-airmon start|stop      put Laden USB dongle in monitor mode

Dongle: LN-USB-AC (fictional) on wlan0 → wlan0mon
Scope: only the in-browser wifi lab. Never attack real networks.
Wordlists on Z Drive or /z/usr/share/wordlists/`;
  }

  async function runLabcrack(rest) {
    const args = rest.slice();
    if (!args.length || args[0] === '-h' || args[0] === '--help') {
      printText(labcrackHelp()); return;
    }
    if (args[0] === '--list') {
      printText(`Available captures (fictional):
  /z/tmp/handshakes/laden-guest.cap
  /z/tmp/handshakes/iot-lab.cap
  /loot/wifi/cafe-free.cap   (demo path)`); return;
    }
    // parse: file -w wordlist
    let cap = null, wordlist = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-w' && args[i+1]) { wordlist = args[++i]; continue; }
      if (!args[i].startsWith('-') && !cap) cap = args[i];
    }
    if (!cap) { printText('usage: labcrack-ng <cap> -w <wordlist>', 'out-err'); return; }
    const monOk = MON_IF || (IFACES.wlan0 && IFACES.wlan0.mode === 'monitor');
    print(`<span class="out-ok">labcrack-ng</span> <span class="out-dim">1.7</span>`);
    printText(`Opening ${cap}`);
    printText(`[00:00:00] Read 1 handshake (fictional)`);
    if (wordlist) printText(`[00:00:00] Using wordlist ${wordlist}`);
    else printText(`[00:00:00] No (-w) wordlist — trying built-in demo keys`);
    if (!monOk) printText(`[note] tip: labcrack-ng-airmon start  ·  current mode managed`, 'out-dim');
    await new Promise(r => setTimeout(r, 450));
    printText(`                                 Aircrack-ng 1.7 (lab edition)

      [00:00:01] 1250/9604 keys tested (1249.00 k/s)

      Current passphrase: laden-guest-2024

      Master Key     : CD 3F 11 … (demo)
      Transient Key  : AA BB … (demo)
      EAPOL HMAC     : ok

      KEY FOUND! [ laden-guest-2024 ]

      (Educational only — password is fictional. Never use against real APs.)`);
  }

  function authTok() {
    try { return localStorage.getItem('laden_v12_token') || ''; } catch { return ''; }
  }
  function isLoggedIn() { return !!authTok(); }
  function zHomeRel() {
    const u = (typeof llcUser === 'function' ? llcUser() : 'laden');
    return '/labz/' + String(u || 'laden').replace(/[^a-zA-Z0-9._-]/g,'').slice(0,24);
  }
  function homeDir() {
    // Logged-in operators live on Z Drive; guests keep the demo home
    if (isLoggedIn()) return '/z' + zHomeRel();
    return '/home/laden';
  }
  let cwd = homeDir();
  const history = [];
  let histIdx = -1;

  const QUICK = [
    ['help','help'],
    ['zdrive','cd /z && df'],
    ['ip a','ip a'],
    ['wifi mon','labcrack-ng-airmon start'],
    ['labcrack','labcrack-ng --help'],
    ['tree','tree'],
    ['nets','cd /nets && cat TARGETS.md'],
    ['mzf','mzfconsole'],
    ['admin fp','mzfconsole'],
    ['lmap -h','lmap -h'],
    ['lmap list','lmap --list'],
    ['scan lab','lmap -sn 10.13.37.0/24'],
    ['-sV web01','lmap -sV 10.13.37.10'],
    ['labs','labs'],
    ['hint','hint'],
  ];

  /* ── Path helpers ────────────────────────────────────────────── */
  function normPath(p) {
    if (!p || p === '~') return homeDir();
    if (p.startsWith('~/')) p = homeDir() + '/' + p.slice(2);
    let abs = p.startsWith('/') ? p : (cwd.replace(/\/$/,'') + '/' + p);
    const parts = [];
    for (const seg of abs.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') { parts.pop(); continue; }
      parts.push(seg);
    }
    return '/' + parts.join('/');
  }
  function walk(path) {
    const p = normPath(path);
    if (p === '/') return FS_TREE;
    let node = FS_TREE;
    for (const seg of p.split('/').filter(Boolean)) {
      if (!node || node.type !== 'dir' || !node.children[seg]) return null;
      node = node.children[seg];
    }
    return node;
  }
  function listDir(path) {
    const node = walk(path);
    if (!node || node.type !== 'dir') return null;
    return Object.keys(node.children).sort((a,b) => {
      const A = node.children[a], B = node.children[b];
      if (A.type !== B.type) return A.type === 'dir' ? -1 : 1;
      return a.localeCompare(b);
    });
  }
  function readFile(path) {
    const node = walk(path);
    if (!node) return null;
    if (node.type === 'dir') return { err: 'Is a directory' };
    return { data: node.data };
  }
  function shortPromptPath() {
    // Bare at account home (/z/labz/<you>); elsewhere show where you are
    const home = homeDir();
    if (cwd === home) return '';
    if (cwd.startsWith(home + '/')) return '~' + cwd.slice(home.length);
    if (cwd === '/z') return '/z';
    if (cwd.startsWith('/z/')) return cwd;
    return cwd;
  }

  const ZAPI = '/labs/api';
  const ZQUOTA = 10 * 1024 * 1024;
  function isZ(p) {
    const n = normPath(p);
    return n === '/z' || n.startsWith('/z/');
  }
  function zRel(p) {
    const n = normPath(p);
    if (n === '/z') return '/';
    if (n.startsWith('/z/')) return n.slice(2) || '/';
    return null;
  }
  function zAbs(rel) {
    if (!rel || rel === '/') return '/z';
    return '/z' + (rel.startsWith('/') ? rel : '/' + rel);
  }
  async function zFetch(method, path, body) {
    const tok = authTok();
    if (!tok) {
      const err = new Error('login_required');
      err.code = 'login_required';
      throw err;
    }
    const opts = { method, headers: { Authorization: 'Bearer ' + tok } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(ZAPI + path, opts);
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error(data.error || ('http_' + res.status));
      err.code = data.error || ('http_' + res.status);
      err.data = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }
  function fmtBytes(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }
  function zErr(e) {
    if (!e) return 'Z Drive error';
    if (e.code === 'login_required') return 'Z Drive needs a Labs login — open /account/ first';
    if (e.code === 'permission_denied') return 'Permission denied — another operator\'s home';
    if (e.code === 'quota_exceeded') return `quota exceeded (${fmtBytes(e.data && e.data.used)} / ${fmtBytes(ZQUOTA)})`;
    if (e.code === 'file_too_large') return 'file too large (max 1 MB per file)';
    if (e.code === 'not_found') return 'No such file or directory';
    if (e.code === 'no_parent') return 'No such directory (parent missing)';
    if (e.code === 'directory_not_empty') return 'Directory not empty (use rm -r)';
    if (e.code === 'file_exists' || e.code === 'dest_exists') return 'File exists';
    if (e.code === 'is_directory') return 'Is a directory';
    if (e.code === 'cannot_remove_root') return 'Cannot remove /z';
    return String(e.code || e.message || e);
  }
  function cwdIsForeignLabz(home) {
    // True if cwd sits in /z/labz/<someone-else>/…
    if (!cwd || !home) return false;
    if (!cwd.startsWith('/z/labz/')) return false;
    if (cwd === home || cwd.startsWith(home + '/')) return false;
    return true;
  }
  async function bootZHome(opts) {
    // Quiet: sync home path / prompt. Never clears the screen.
    const forceHome = !!(opts && opts.forceHome);
    if (!isLoggedIn()) {
      if (forceHome || !cwd || cwd.startsWith('/z/labz/')) {
        cwd = homeDir(); setPrompt();
      }
      return;
    }
    try {
      const q = await zFetch('GET', '/zdrive/quota');
      const home = q.home ? ('/z' + (q.home.startsWith('/') ? q.home : '/' + q.home)) : homeDir();
      // Jump home on first boot, guest demo path, or wrong operator's labz home
      if (forceHome || !cwd || cwd === '/home/laden' || cwd.startsWith('/home/') || cwdIsForeignLabz(home)) {
        cwd = home;
      }
      setPrompt();
    } catch (e) {
      const home = homeDir();
      if (forceHome || !cwd || cwdIsForeignLabz(home)) cwd = home;
      setPrompt();
    }
  }

  const LLC_SESSION_KEY = 'laden_llc_session_v1';
  let llcBooted = false;
  let llcPersistTimer = null;

  function llcSaveSession() {
    try {
      if (!screen) return;
      // Clone screen HTML but keep form out of saved blob — form stays live
      const parts = [];
      for (const node of screen.children) {
        if (node === form || (node.id === 'llc-form')) continue;
        parts.push(node.outerHTML);
      }
      const payload = {
        user: (typeof llcUser === 'function' ? llcUser() : '') || '',
        html: parts.join(''),
        cwd,
        history: history.slice(-80),
        mon: MON_IF || null,
        wlanMode: (IFACES.wlan0 && IFACES.wlan0.mode) || 'managed',
      };
      sessionStorage.setItem(LLC_SESSION_KEY, JSON.stringify(payload));
    } catch {}
  }

  function llcScheduleSave() {
    clearTimeout(llcPersistTimer);
    llcPersistTimer = setTimeout(llcSaveSession, 120);
  }

  function llcRestoreSession() {
    try {
      const raw = sessionStorage.getItem(LLC_SESSION_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data.html !== 'string' || !data.html.trim()) return false;
      // Drop session if it belongs to another operator (or guest vs member)
      const me = (typeof llcUser === 'function' ? llcUser() : '') || '';
      const saved = (data.user || '').toString();
      if (saved !== me) {
        try { sessionStorage.removeItem(LLC_SESSION_KEY); } catch {}
        return false;
      }
      // wipe output lines, keep form
      [...screen.querySelectorAll(':scope > div')].forEach(n => n.remove());
      const wrap = document.createElement('div');
      wrap.innerHTML = data.html;
      while (wrap.firstChild) {
        if (form && form.parentNode === screen) screen.insertBefore(wrap.firstChild, form);
        else screen.appendChild(wrap.firstChild);
      }
      if (data.cwd) cwd = data.cwd;
      if (Array.isArray(data.history)) {
        history.length = 0;
        data.history.forEach(h => history.push(h));
        histIdx = history.length;
      }
      // restore monitor mode quietly
      if (data.wlanMode === 'monitor' || data.mon) {
        try { ensureMonIface(); } catch {}
      }
      setPrompt();
      screen.scrollTop = screen.scrollHeight;
      return true;
    } catch {
      return false;
    }
  }

  function llcClearSession() {
    try { sessionStorage.removeItem(LLC_SESSION_KEY); } catch {}
  }

  function treeWalk(path, prefix='', lines=[], depth=0) {
    if (depth > 6) return lines;
    const names = listDir(path);
    if (!names) return lines;
    names.forEach((name, i) => {
      const last = i === names.length - 1;
      const branch = last ? '└── ' : '├── ';
      const node = walk(path.replace(/\/$/,'') + '/' + name);
      const mark = node && node.type === 'dir' ? name + '/' : name;
      lines.push(prefix + branch + mark);
      if (node && node.type === 'dir') {
        treeWalk(path.replace(/\/$/,'') + '/' + name, prefix + (last ? '    ' : '│   '), lines, depth+1);
      }
    });
    return lines;
  }

  /* ── IP / CIDR helpers (fictional only) ──────────────────────── */
  function ipToInt(ip) {
    const p = ip.split('.').map(Number);
    if (p.length !== 4 || p.some(n => n<0||n>255||Number.isNaN(n))) return null;
    return ((p[0]<<24)>>>0) + (p[1]<<16) + (p[2]<<8) + p[3];
  }
  function inCidr(ip, cidr) {
    const [base, bitsS] = cidr.split('/');
    const bits = parseInt(bitsS, 10);
    const a = ipToInt(ip), b = ipToInt(base);
    if (a==null||b==null||Number.isNaN(bits)) return false;
    const mask = bits === 0 ? 0 : (~0 << (32-bits)) >>> 0;
    return (a & mask) === (b & mask);
  }
  function findHost(ip) {
    for (const net of NETS) {
      const h = net.hosts.find(x => x.ip === ip);
      if (h) return { net, host: h };
    }
    return null;
  }
  function hostsInTarget(target) {
    // Only exact known net names/cidrs/domains, or inventory hostnames/IPs.
    // Arbitrary/wide CIDRs (e.g. 0.0.0.0/0) are rejected — no real-net scanning.
    if (target.includes('/')) {
      const net = NETS.find(n => n.cidr === target);
      if (!net) return [];
      return net.hosts.map(h => ({ net, host: h }));
    }
    for (const net of NETS) {
      if (net.name === target || net.domain === target) {
        return net.hosts.map(h => ({ net, host: h }));
      }
      const h = net.hosts.find(x => x.ip === target || x.hostname === target || x.hostname.startsWith(target+'.'));
      if (h) return [{ net, host: h }];
    }
    return [];
  }
  function isFictionalTarget(t) {
    if (!t) return false;
    if (NETS.some(n => n.name===t || n.cidr===t || n.domain===t)) return true;
    if (findHost(t)) return true;
    // short hostname like web01
    return NETS.some(n => n.hosts.some(h => h.hostname === t || h.hostname.startsWith(t+'.') || h.hostname.split('.')[0] === t));
  }

  /* ── Crypto helpers (challenge tools) ────────────────────────── */
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
  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  /* ── UI boot ─────────────────────────────────────────────────── */
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/llc.css';
  document.head.appendChild(link);

  ['laden-term-toggle','laden-term-drawer','laden-term-backdrop'].forEach(id => {
    const el = document.getElementById(id); if (el) el.remove();
  });

  let backdrop, toggle, drawer, screen, form, input, chips;

  function buildShellHTML() {
    return `
    ${FULLPAGE ? '' : '<div class="llc-roll" role="separator" aria-orientation="horizontal" aria-label="Resize console" title="Drag to roll up / down"></div>'}
    <div class="llc-tools" aria-label="Console controls">
      <button type="button" data-act="clear" title="${window.LadenI18n ? LadenI18n.t('llc.clear') : 'Clear screen'}">clear</button>
      <button type="button" data-act="close" title="${FULLPAGE ? (window.LadenI18n ? LadenI18n.t('llc.home') : 'Home') : (window.LadenI18n ? LadenI18n.t('llc.close') : 'Close console')}">${FULLPAGE ? 'home' : '✕'}</button>
    </div>
    <div id="llc-chips"></div>
    <div id="llc-body">
      <div id="llc-screen">
        <form id="llc-form" autocomplete="off">
          <label class="prompt" for="llc-in"><span class="gt">&gt;</span></label>
          <input id="llc-in" spellcheck="false" autocapitalize="off" placeholder="">
        </form>
      </div>
    </div>`;
  }

  if (FULLPAGE) {
    document.body.classList.add('llc-fullpage');
    const mount = document.getElementById('llc-mount') || document.body;
    mount.classList.add('llc-fullpage-root');
    drawer = document.createElement('div');
    drawer.id = 'llc-drawer';
    drawer.classList.add('open');
    drawer.innerHTML = buildShellHTML();
    mount.appendChild(drawer);
    backdrop = document.createElement('div');
    backdrop.id = 'llc-backdrop';
    toggle = document.createElement('button');
    toggle.id = 'llc-toggle';
    toggle.style.display = 'none';
  } else {
    backdrop = document.createElement('div');
    backdrop.id = 'llc-backdrop';
    toggle = document.createElement('button');
    toggle.id = 'llc-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', window.LadenI18n ? LadenI18n.t('llc.toggle') : 'Laden Labs Console');
    toggle.innerHTML = '<span class="glyph">llc$</span><span class="label">' + (window.LadenI18n ? LadenI18n.t('term.console') : 'Console') + '</span>';
    toggle.style.cssText = 'position:fixed;top:.85rem;left:.85rem;z-index:13050;display:inline-flex';
    drawer = document.createElement('div');
    drawer.id = 'llc-drawer';
    drawer.classList.add('llc-bottom');
    drawer.innerHTML = buildShellHTML();
    document.body.appendChild(backdrop);
    document.body.appendChild(toggle);
    document.body.appendChild(drawer);
  }

  screen = document.getElementById('llc-screen');
  form = document.getElementById('llc-form');
  input = document.getElementById('llc-in');
  if (input) input.placeholder = (window.LadenI18n ? LadenI18n.t('llc.placeholder') : 'type help');
  document.addEventListener('laden:lang', function () {
    try {
      if (input) input.placeholder = window.LadenI18n ? LadenI18n.t('llc.placeholder') : 'type help';
      if (toggle) {
        toggle.setAttribute('aria-label', window.LadenI18n ? LadenI18n.t('llc.toggle') : 'Laden Labs Console');
        var lab = toggle.querySelector('.label');
        if (lab) lab.textContent = window.LadenI18n ? LadenI18n.t('term.console') : 'Console';
      }
      var clearBtn = drawer && drawer.querySelector('[data-act="clear"]');
      if (clearBtn) clearBtn.title = window.LadenI18n ? LadenI18n.t('llc.clear') : 'Clear screen';
    } catch (e) {}
  });

  chips = document.getElementById('llc-chips');

  function llcUser() {
    try {
      const tok = localStorage.getItem('laden_v12_token') || '';
      if (tok) {
        const mid = tok.split('.')[1];
        if (mid) {
          let b64 = mid.replace(/-/g,'+').replace(/_/g,'/');
          while (b64.length % 4) b64 += '=';
          const payload = JSON.parse(atob(b64));
          const name = (payload.usr || payload.username || '').toString().trim();
          if (name && !/^\d+$/.test(name)) {
            return name.replace(/[^a-zA-Z0-9._-]/g,'').slice(0,24) || 'operator';
          }
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem('laden_labcard_profile') || localStorage.getItem('laden_v12_profile') || '';
      if (raw) {
        const p = JSON.parse(raw);
        const name = (p.username || p.usr || '').toString().trim();
        if (name && !/^\d+$/.test(name)) {
          return name.replace(/[^a-zA-Z0-9._-]/g,'').slice(0,24) || 'operator';
        }
      }
    } catch {}
    try {
      const nick = (sessionStorage.getItem('laden_guest_nick') || '').trim();
      if (nick) return nick.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,24) || 'guest';
    } catch {}
    return isLoggedIn() ? 'operator' : 'guest';
  }
  function setPrompt() {
    const u = llcUser();
    const lab = document.querySelector('#llc-form .prompt');
    if (lab) {
      const mzf = (typeof mzfActive !== 'undefined' && mzfActive) ? mzfPromptStr() : null;
      if (mzf) {
        lab.innerHTML = `<span class="path">${esc(mzf.replace(/ >$/,''))}</span> <span class="gt">&gt;</span>`;
      } else {
        const p = shortPromptPath();
        lab.innerHTML = (p ? `<span class="path">${esc(p)}</span>` : '') + `<span class="gt">&gt;</span>`;
      }
    }
    llcScheduleSave();
    return u;
  }

  function open() {
    drawer.classList.add('open'); backdrop.classList.add('open');
    document.body.classList.add('llc-open');
    // Resume existing session — never restart the terminal
    bootZHome({ forceHome: false }).finally(() => setTimeout(() => input.focus(), 40));
  }
  function close() {
    if (FULLPAGE) { location.href = '/'; return; }
    drawer.classList.remove('open'); backdrop.classList.remove('open');
    document.body.classList.remove('llc-open');
  }
  function toggleDrawer() { drawer.classList.contains('open') ? close() : open(); }
  function toggleDock() {
    if (FULLPAGE) return;
    drawer.classList.toggle('llc-dock');
  }
  window.openLLC = open; window.closeLLC = close; window.openLadenTerminal = open;
  window.LadenLLC = window.LadenLLC || {};
  window.LadenLLC.open = open;
  window.LadenLLC.close = close;
  window.LadenLLC.toggle = toggleDrawer;

  if (!FULLPAGE) {
    toggle.addEventListener('click', toggleDrawer);
    backdrop.addEventListener('click', close);
  }
  drawer.querySelector('[data-act="close"]').onclick = close;
  drawer.querySelector('[data-act="clear"]').onclick = () => { clearScreen(); input.focus(); };

  /* Roll handle — drag to change height; keep CSS default until user rolls */
  (function wireRoll() {
    if (FULLPAGE) return;
    const handle = drawer.querySelector('.llc-roll');
    if (!handle) return;
    const KEY = 'llc_drawer_h_v2';
    const MIN = 160;
    function maxH() { return Math.max(MIN + 40, Math.floor(window.innerHeight * 0.92)); }
    function applyH(px) {
      const h = Math.max(MIN, Math.min(maxH(), Math.round(px)));
      drawer.style.height = h + 'px';
      drawer.classList.remove('llc-dock');
      try { localStorage.setItem(KEY, String(h)); } catch {}
      return h;
    }
    try {
      const saved = parseInt(localStorage.getItem(KEY) || '', 10);
      if (saved && saved >= MIN) applyH(saved);
    } catch {}
    let startY = 0, startH = 0, rolling = false;
    function onMove(ev) {
      if (!rolling) return;
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      // drag up → taller (bottom-anchored)
      applyH(startH + (startY - y));
      if (ev.cancelable) ev.preventDefault();
    }
    function onUp() {
      if (!rolling) return;
      rolling = false;
      drawer.classList.remove('llc-rolling');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }
    function onDown(ev) {
      rolling = true;
      drawer.classList.add('llc-rolling');
      startY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      startH = drawer.getBoundingClientRect().height;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
      if (ev.cancelable) ev.preventDefault();
    }
    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('touchstart', onDown, { passive: false });
    // double-click handle → reset to CSS default
    handle.addEventListener('dblclick', () => {
      try { localStorage.removeItem(KEY); } catch {}
      drawer.style.height = '';
    });
  })();

  let llcLastUser = llcUser();
  async function llcSyncIdentity(force) {
    const u = llcUser();
    if (!force && u === llcLastUser) { setPrompt(); return; }
    const switched = u !== llcLastUser;
    llcLastUser = u;
    if (switched) {
      // New operator — drop prior session, land in their Z home, fresh banner
      llcClearSession();
      [...screen.querySelectorAll(':scope > div')].forEach(n => n.remove());
      if (form && form.parentNode !== screen) screen.appendChild(form);
      await bootZHome({ forceHome: true });
      banner();
      llcScheduleSave();
    } else {
      setPrompt();
    }
  }
  setPrompt();
  window.addEventListener('storage', () => { llcSyncIdentity(false); });
  window.addEventListener('laden-nick', () => { llcSyncIdentity(false); });
  window.addEventListener('laden-auth', () => { llcSyncIdentity(true); });
  setInterval(() => { llcSyncIdentity(false); }, 2500);

  document.addEventListener('keydown', (e) => {
    if (FULLPAGE) return;
    if (e.key === 'Escape' && drawer.classList.contains('open')) { close(); return; }
    // Prefer physical Backquote key (works with Nordic AltGr). Avoid raw ` in source strings.
    const tick = e.code === 'Backquote' || e.key === '`' || e.key === '\u00a7';
    if (!tick) return;
    const el = e.target;
    const tag = (el && el.tagName) || '';
    const inLlc = !!(el && el.closest && el.closest('#llc-drawer'));
    const typingElsewhere =
      !inLlc &&
      (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable));
    if (typingElsewhere) return;
    e.preventDefault();
    toggleDrawer();
  }, true);

  /* Soft keyboard: keep #llc-form visible on mobile via visualViewport */
  (function wireKeyboardPad() {
    if (FULLPAGE || !window.visualViewport) return;
    const vv = window.visualViewport;
    function syncKb() {
      const occluded = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const focused = document.activeElement === input;
      document.body.classList.toggle('llc-kb-open', focused && occluded > 40);
      if (focused && occluded > 40) {
        drawer.style.setProperty('--llc-kb', occluded + 'px');
        drawer.style.paddingBottom = occluded + 'px';
        try { form.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
      } else {
        drawer.style.paddingBottom = '';
        drawer.style.removeProperty('--llc-kb');
      }
    }
    vv.addEventListener('resize', syncKb);
    vv.addEventListener('scroll', syncKb);
    input.addEventListener('focus', () => setTimeout(syncKb, 50));
    input.addEventListener('blur', () => setTimeout(syncKb, 50));
  })();

  function setChips(list) {
    chips.innerHTML = '';
    (list || QUICK).forEach(([label, cmd]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.onclick = () => { input.value = cmd; input.focus(); };
      chips.appendChild(b);
    });
  }
  function setLLCContext(ctx) {
    if (!ctx || typeof ctx !== 'object') return;
    window.LADEN_LLC_CONTEXT = ctx;
    const base = QUICK.slice();
    const extra = Array.isArray(ctx.chips) ? ctx.chips : [];
    const seen = new Set();
    const merged = [];
    for (const pair of extra.concat(base)) {
      const cmd = pair[1];
      if (seen.has(cmd)) continue;
      seen.add(cmd);
      merged.push(pair);
    }
    setChips(merged);
    if (ctx.prefill) input.value = ctx.prefill;
    if (ctx.blurb) {
      print(`<span class="out-ok">lab context</span> <span class="out-dim">${esc(ctx.slug || '')}</span>\n<span class="out-dim">${esc(ctx.blurb)}</span>`);
    }
    setPrompt();
  }
  window.setLLCContext = setLLCContext;
  setChips(QUICK);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function print(html, cls='') {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.innerHTML = html;
    // Keep live prompt as last child so output + input read as one stream
    if (form && form.parentNode === screen) screen.insertBefore(line, form);
    else screen.appendChild(line);
    screen.scrollTop = screen.scrollHeight;
    llcScheduleSave();
  }
  function printText(text, cls='') { print(esc(text), cls); }
  function clearScreen() {
    [...screen.querySelectorAll(':scope > div')].forEach(n => n.remove());
    if (form && form.parentNode !== screen) screen.appendChild(form);
    llcClearSession();
    banner();
    llcScheduleSave();
  }

  const LLC_QUOTES = [
    'Control is an illusion.',
    'Hello, friend.',
    'We are fsociety. We are finally free. We are finally awake.',
    'A bug is never just a mistake. It represents something bigger.',
    'People ask me who I am. Sometimes I\'m not even sure.',
    'Is any of it real? Are we?',
    'The world is a dangerous place, Elliot — not because of those who do evil, but because of those who look on and do nothing.',
    'Power belongs to the people who take it.',
    'You\'re missing the big picture — we\'re changing the world.',
    'I never get used to the feeling of being watched.',
    'Sometimes I dream of saving the world. Saving everyone from the invisible hand.',
    'Our democracy has been hacked.',
    'Leave me alone. I\'m not a hero. I\'m a virus.',
    'They promised us better. They lied.',
    'Are you a one, or a zero?',
    'It\'s only after we\'ve lost everything that we\'re free to do anything.',
    'What I am about to tell you is top secret. Eyes only.',
    'The safest place is behind a keyboard — until it isn\'t.',
    'Root access is a state of mind.',
    'Stay curious. Stay angry. Stay in scope.',
    'There is no patch for human stupidity — but there is for this lab.',
    'Trust the process. Distrust the packet.',
    'Every empire falls to a well-placed payload.',
    'Masks on. Scope checked. Hack ethically.',
  ];
  function llcQuote() {
    const i = Math.floor(Math.random() * LLC_QUOTES.length);
    return LLC_QUOTES[i];
  }

  function banner() {
    const q = llcQuote();
    print(`<span class="out-ok">Laden Labs Console</span> <span class="out-dim">LLC</span>
<span class="out-dim">┌──(${esc(llcUser())}@llc)-[~]</span>
<span class="out-dim">“${esc(q)}”</span>
<span class="out-dim">Type <b>help</b> · <b>mzfconsole</b> · <b>lmap -h</b> · press \` to toggle</span>`);
  }

  /* ── lmap ────────────────────────────────────────────────────── */
  function lmapHelp() {
    return `lmap 2.0 — Laden Mapper (educational, fictional targets ONLY)
Usage:
  lmap -h | --help
  lmap --list                      list fictional networks
  lmap -sn <cidr|net|host>         host discovery (ping-sweep style)
  lmap -sV <host>                  version / service detection
  lmap -sC <host>                  default-script flavored output
  lmap -p <ports> <host>           port list (e.g. 22,80,443 or 1-100)
  lmap <host>                      default top-ports probe

Examples:
  lmap --list
  lmap -sn 10.13.37.0/24
  lmap -sn labnet
  lmap -sV 10.13.37.10
  lmap -sC web01.labnet.llc
  lmap -p 22,80,443,3306 10.13.37.20

Scope: only hosts under /nets (labnet, dmz, ot, wifi).
Real-internet scanning is blocked and out of scope.`;
  }

  function parsePortSpec(spec) {
    const out = new Set();
    if (!spec) return DEFAULT_PORTS.slice();
    for (const part of spec.split(',')) {
      if (part.includes('-')) {
        const [a,b] = part.split('-').map(Number);
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          for (let i=Math.min(a,b); i<=Math.max(a,b) && i<=65535; i++) out.add(i);
        }
      } else {
        const n = Number(part);
        if (!Number.isNaN(n)) out.add(n);
      }
    }
    return [...out].sort((a,b)=>a-b);
  }

  async function runLmap(rest) {
    if (!rest.length || rest[0]==='-h' || rest[0]==='--help' || rest[0]==='help') {
      printText(lmapHelp()); return;
    }
    if (rest[0]==='--list' || rest[0]==='-l' || rest[0]==='list') {
      let out = 'LLC fictional networks (not on the internet)\n\n';
      for (const n of NETS) {
        out += `  ${n.name.padEnd(8)} ${n.cidr.padEnd(18)} ${n.domain}  (${n.hosts.length} hosts)\n`;
      }
      out += '\nDetails: cat /nets/TARGETS.md · lmap -sn <cidr>';
      printText(out); return;
    }

    let mode = 'default'; // sn | sV | sC | default
    let ports = null;
    const pos = [];
    for (let i=0;i<rest.length;i++) {
      const a = rest[i];
      if (a==='-sn' || a==='-sP' || a==='-sL') mode = 'sn';
      else if (a==='-sV') mode = 'sV';
      else if (a==='-sC') mode = 'sC';
      else if (a==='-A') mode = 'sC'; // treat aggressive as scripts+version flavor
      else if (a==='-p' && rest[i+1]) { ports = parsePortSpec(rest[++i]); }
      else if (a.startsWith('-p') && a.length>2) { ports = parsePortSpec(a.slice(2)); }
      else if (a.startsWith('-')) { /* ignore unknown flags pedagogically */ }
      else pos.push(a);
    }
    const target = pos[0];
    if (!target) { printText('lmap: no target. Try lmap -h','out-err'); return; }

    // Block anything that looks like a real public scan target outside inventory
    if (!isFictionalTarget(target) && !hostsInTarget(target).length) {
      printText(`lmap: target '${target}' is outside LLC scope.
Only fictional nets (see lmap --list / /nets). Real-internet scanning is blocked.`,'out-err');
      return;
    }

    const hits = hostsInTarget(target);
    if (!hits.length) {
      printText(`lmap: 0 hosts known for '${target}' in LLC inventory.`,'out-warn');
      return;
    }

    const stamp = new Date().toISOString().replace('T',' ').replace(/\.\d+Z$/,' UTC');
    printText(`Starting lmap 2.0 (LLC fiction) at ${stamp}`,'out-dim');
    printText(`lmap scan report for ${target}`,'out-ok');
    await sleep(180);

    if (mode === 'sn') {
      let up = 0;
      for (const { host } of hits) {
        await sleep(60);
        const alive = host.ports && host.ports.some(p => p.open);
        if (alive) {
          up++;
          printText(`Nmap scan report for ${host.hostname} (${host.ip})\nHost is up (0.00${Math.floor(Math.random()*8)+1}s latency).`);
        } else {
          printText(`Nmap scan report for ${host.hostname} (${host.ip})\nHost seems down (or filtered) — LLC demo.`);
        }
      }
      printText(`\nlmap done: ${hits.length} IP addresses (${up} hosts up) scanned in fictional labnet.`,'out-dim');
      return;
    }

    const portList = ports || DEFAULT_PORTS;
    for (const { host } of hits) {
      await sleep(120);
      const alive = host.ports && host.ports.some(p => p.open);
      printText(`Nmap scan report for ${host.hostname} (${host.ip})`);
      if (!alive) {
        printText('Note: Host seems down — no open ports in LLC inventory.','out-dim');
        continue;
      }
      printText(`Host is up (0.00${Math.floor(Math.random()*9)+1}s latency).`);
      printText('PORT      STATE    SERVICE     VERSION');
      const byPort = new Map(host.ports.map(p => [p.port, p]));
      for (const pn of portList) {
        const p = byPort.get(pn);
        if (!p) continue;
        const state = p.open ? 'open' : 'closed';
        let line = `${String(p.port)+'/tcp'}`.padEnd(10) + state.padEnd(9) + (p.service||'').padEnd(12);
        if (mode === 'sV' || mode === 'sC' || mode === 'default') {
          line += (p.product || p.banner || '');
        }
        printText(line);
        if ((mode === 'sC' || mode === 'sV') && p.banner) {
          printText(`|_ banner: ${p.banner}`, 'out-dim');
        }
        if (mode === 'sC' && p.scripts) {
          for (const s of p.scripts) printText(`| ${s}`);
        }
      }
      // show open ports not in portList if default
      if (!ports) {
        for (const p of host.ports) {
          if (!portList.includes(p.port) && p.open) {
            printText(`${String(p.port)+'/tcp'}`.padEnd(10) + 'open'.padEnd(9) + (p.service||'').padEnd(12) + (p.product||''));
          }
        }
      }
      printText('');
    }
    printText('lmap done — fictional output only. Stay on authorized Laden labs.','out-dim');
  }

  /* ── command runner ──────────────────────────────────────────── */

  const LLC_MAN_SYN = {
    'pwd': 'Print the current working directory path.',
    'ls': 'List directory entries (demo FS or Z Drive).',
    'cd': 'Change the current working directory.',
    'cat': 'Print an entire file to the console.',
    'head': 'Print the first 10 lines of a file.',
    'tail': 'Print the last 10 lines of a file.',
    'tree': 'Print a recursive directory tree (demo FS only).',
    'find': 'Recursively list all paths under a start directory.',
    'mkdir': 'Create a directory on your Z Drive.',
    'touch': 'Create an empty file on Z Drive (or leave existing content).',
    'rm': 'Remove a file or directory on Z Drive.',
    'rmdir': 'Remove an empty directory on Z Drive (non-recursive).',
    'cp': 'Copy a file within Z Drive.',
    'mv': 'Move or rename a path within Z Drive.',
    'echo': 'Print text, or write/append to a Z Drive file with redirection.',
    'grep': 'Filter file lines matching a case-insensitive regex pattern.',
    'df': 'Show Z Drive (LabDrive) quota: used, free, and max.',
    'zquota': 'Show Z Drive (LabDrive) quota: used, free, and max.',
    'quota': 'Show Z Drive (LabDrive) quota: used, free, and max.',
    'zshare': 'Share a Z Drive file into the Community pool.',
    'zunshare': 'Remove a file from the Community share pool.',
    'ip': 'Show fictional LLC interface addresses, links, or routes.',
    'ifconfig': 'Friendly alias for the fictional address dump (`ip a`).',
    'iwconfig': 'Show wireless (and non-wireless) interface status.',
    'iw': 'List wifi phy / interface info (nl80211-flavored fiction).',
    'labcrack-ng-airmon': 'Put the fictional Laden USB Wi‑Fi dongle into monitor mode.',
    'airmon-ng': 'Put the fictional Laden USB Wi‑Fi dongle into monitor mode.',
    'labmon': 'Put the fictional Laden USB Wi‑Fi dongle into monitor mode.',
    'labcrack-ng-airodump': 'Scan nearby fictional APs (requires monitor mode).',
    'airodump-ng': 'Scan nearby fictional APs (requires monitor mode).',
    'labdump': 'Scan nearby fictional APs (requires monitor mode).',
    'labcrack-ng': 'Educational WPA/WPA2 PSK cracker against demo .cap files.',
    'aircrack-ng': 'Educational WPA/WPA2 PSK cracker against demo .cap files.',
    'lmap': 'Laden Mapper — educational nmap-like scanner for fictional LLC nets only.',
    'nmap': 'Laden Mapper — educational nmap-like scanner for fictional LLC nets only.',
    'mzfconsole': 'Laden Metasploit-style framework REPL for fictional lab nets.',
    'mzf': 'Laden Metasploit-style framework REPL for fictional lab nets.',
    'msfconsole': 'Laden Metasploit-style framework REPL for fictional lab nets.',
    'curl': 'Alias of curl — same GET helper and scope lock.',
    'wget': 'Alias of curl — same GET helper and scope lock.',
    'wget': 'Alias of curl — same GET helper and scope lock.',
    'curl': 'Alias of curl — same GET helper and scope lock.',
    'base64': 'Encode or decode Base64 from a string or file.',
    'rot13': 'Apply ROT13 to a string or file contents.',
    'xxd': 'Hex-dump a string or file (16-byte rows with ASCII gutter).',
    'jwt': 'Decode a JWT header/payload (no signature verify) from token or file.',
    'hashid': 'Guess common hash algorithm families from a digest string.',
    'md5': 'Compute MD5 of a string or file contents.',
    'sha1': 'Compute SHA-1 of a string or file contents.',
    'sha256': 'Compute SHA-256 of a string or file contents.',
    'labs': 'List lounge challenges (difficulty, points, slug, title).',
    'open': 'Navigate the browser to a lab room by slug.',
    'hint': 'Print the current lab hint, or a general LLC challenge cheat-sheet.',
    'clear': 'Clear the LLC console screen.',
    'whoami': 'Print the current LLC username.',
    'id': 'Print a demo uid/gid line for the current operator.',
    'uname': 'Print the fictional LLC kernel banner.',
    'help': 'Print the LLC command overview (filesystem, Z Drive, nets, helpers, session).',
    '?': 'Print the LLC command overview (filesystem, Z Drive, nets, helpers, session).',
    'manuals': 'Open or list the LLC manuals collection; man &lt;tool&gt; prints a short synopsis + URL.',
    'man': 'Open or list the LLC manuals collection; man &lt;tool&gt; prints a short synopsis + URL.'
  };
  const LLC_MAN_PRIMARY = {
    'zquota': 'df', 'quota': 'df',
    'airmon-ng': 'labcrack-ng-airmon', 'labmon': 'labcrack-ng-airmon',
    'airodump-ng': 'labcrack-ng-airodump', 'labdump': 'labcrack-ng-airodump',
    'aircrack-ng': 'labcrack-ng',
    'nmap': 'lmap',
    'mzf': 'mzfconsole', 'msfconsole': 'mzfconsole',
    'wget': 'curl',
    '?': 'help', 'man': 'manuals',
  };
  const LLC_MAN_GROUPS = {
    'Filesystem': ['pwd','ls','cd','cat','head','tail','tree','find','mkdir','touch','rm','rmdir','cp','mv','echo','grep'],
    'Z Drive': ['df','zshare','zunshare'],
    'Networks': ['ip','ifconfig','iwconfig','iw','labcrack-ng-airmon','labcrack-ng-airodump','labcrack-ng'],
    'Scanners': ['lmap','mzfconsole'],
    'Helpers': ['curl','wget','base64','rot13','xxd','jwt','hashid','md5','sha1','sha256','labs','open','hint'],
    'Session': ['clear','whoami','id','uname','help','manuals'],
  };
  function manUrl(slug) {
    return '/labs/manuals/' + encodeURIComponent(slug) + '/';
  }
  function printManualsIndex() {
    printText('LLC Manuals — one guide per console tool','out-ok');
    printText('Collection: ' + location.origin + '/labs/manuals/');
    printText('');
    for (const [g, tools] of Object.entries(LLC_MAN_GROUPS)) {
      printText(g,'out-dim');
      printText('  ' + tools.join('  '));
    }
    printText('');
    printText('Tip: man <tool>  ·  open manuals in browser: open manuals (or visit /labs/manuals/)');
    printText('Networks / wifi / mzf / lmap are fictional lab-net demos only.','out-dim');
  }
  function printManTool(raw) {
    const key = String(raw || '').toLowerCase().trim();
    if (!key) { printManualsIndex(); return; }
    if (key === 'manuals' || key === 'man' || key === 'index' || key === 'all') {
      printManualsIndex(); return;
    }
    const primary = LLC_MAN_PRIMARY[key] || key;
    const syn = LLC_MAN_SYN[key] || LLC_MAN_SYN[primary];
    if (!syn) {
      printText('man: no manual for \'' + key + '\'. Try: manuals','out-err');
      return;
    }
    const url = location.origin + manUrl(primary);
    printText(primary + ' — ' + syn,'out-ok');
    if (primary !== key) printText('(alias of ' + primary + ')','out-dim');
    printText('Full guide: ' + url);
    if (/^(lmap|nmap|mzf|mzfconsole|msfconsole|ip|ifconfig|iw|iwconfig|labcrack|airmon|airodump|aircrack)/.test(key) ||
        /^(labcrack-ng|labcrack-ng-airmon|labcrack-ng-airodump)$/.test(primary)) {
      printText('Scope: fictional LLC nets / wifi lab only — never attack real systems.','out-dim');
    }
  }

  async function run(line) {
    line = line.trim();
    if (!line) return;
    // support simple && chaining for chip shortcuts
    if (line.includes('&&')) {
      for (const part of line.split('&&')) await run(part.trim());
      return;
    }
    const argsEarly = parseArgs(line);
    const cmdEarly = (argsEarly[0]||'').toLowerCase();
    if (typeof mzfActive !== 'undefined' && mzfActive && cmdEarly !== 'mzfconsole' && cmdEarly !== 'mzf' && cmdEarly !== 'msfconsole') {
      await mzfRunLine(line);
      return;
    }
    (() => {
      const p = shortPromptPath();
      print(`<span class="out-cmd">${p ? `<span class="path">${esc(p)}</span>` : ''}<span class="gt">&gt;</span> ${esc(line)}</span>`);
    })();
    const args = argsEarly;
    const cmd = cmdEarly;
    const rest = args.slice(1);
    try {
      switch (cmd) {
        case 'mzfconsole': case 'mzf': case 'msfconsole':
          await mzfEnter();
          break;
        case 'help': case '?':
          printText(`LLC — your private workstation on laden.no

Filesystem
  pwd  ls [-la]  cd  cat  head  tail  tree  find
  mkdir [-p]  touch  rm [-r]  rmdir  cp  mv
  echo text > file   ·   echo text >> file

Z Drive (LabDrive · 10 MB · login)
  Home: /z/labz/<you>  (Documents · Downloads)
  df · zshare <file> · decoy FS flag hunt under /z/opt/…
  Other /labz/* homes are denied · manage on /account/

Networks (fictional — LLC only)
  ip a | ip addr · iwconfig [wlan0|wlan0mon]
  labcrack-ng-airmon start|stop   ·  monitor-mode USB dongle (LN-USB-AC)
  labcrack-ng-airodump [wlan0mon] ·  nearby AP scan
  labcrack-ng <cap> -w <wordlist> ·  WPA demo crack
  lmap -h | --list | -sn <cidr> | -sV <host> | -sC <host> | -p <ports> <host>
  mzfconsole | mzf     Metasploit-style framework (lab nets only)

Challenge helpers
  curl wget base64 [-d] rot13 xxd jwt decode
  hashid md5 sha1 sha256 · labs · open <slug> · hint

Session
  clear whoami id uname help
  manuals · man <tool>     → /labs/manuals/
  zguide · bible           → /labs/z-guide/`);
          break;
        case 'clear': clearScreen(); break;
        case 'whoami': printText(llcUser()); break;
        case 'id': { const u=llcUser(); printText(`uid=1000(${u}) gid=1000(llc) groups=1000(llc),27(sudo)  # demo`); break; }
        case 'uname': printText('Linux llc 6.1.0-kali-llc #1 SMP PREEMPT_DYNAMIC Kali LLC (browser)'); break;
        case 'pwd': printText(cwd); break;
        case 'cd': {
          const dest = rest[0] ? normPath(rest[0]) : homeDir();
          if (isZ(dest)) {
            try {
              const data = await zFetch('GET', '/zdrive/ls?path=' + encodeURIComponent(zRel(dest)));
              if (data.kind !== 'dir') { printText('cd: not a directory: '+rest[0],'out-err'); break; }
              cwd = dest === '/' ? '/' : dest.replace(/\/$/,'');
              setPrompt();
            } catch (e) { printText('cd: '+zErr(e),'out-err'); }
            break;
          }
          const node = walk(dest);
          if (!node) { printText('cd: no such file or directory: '+rest[0],'out-err'); break; }
          if (node.type !== 'dir') { printText('cd: not a directory: '+rest[0],'out-err'); break; }
          cwd = dest === '/' ? '/' : dest.replace(/\/$/,'');
          setPrompt();
          break;
        }
        case 'ls': {
          let path = cwd; let long = false;
          for (const a of rest) {
            if (a==='-l'||a==='-la'||a==='-al'||a==='-a') long = true;
            else path = normPath(a);
          }
          if (isZ(path)) {
            try {
              const data = await zFetch('GET', '/zdrive/ls?path=' + encodeURIComponent(zRel(path)));
              const entries = data.entries || [];
              if (!entries.length) { printText('(empty)'); break; }
              if (!long) {
                print(entries.map(e => {
                  const isDir = e.kind === 'dir';
                  const locked = !!e.locked;
                  const cls = locked ? 'out-dim' : (isDir ? 'ls-dir' : 'ls-file');
                  return `<span class="${cls}">${esc(e.name)}${isDir ? '/' : ''}${locked ? ' (denied)' : ''}${e.shared ? '*' : ''}</span>`;
                }).join('  '));
              } else {
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const now = new Date();
                const stamp = months[now.getMonth()] + ' ' + String(now.getDate()).padStart(2,' ');
                const u = llcUser();
                print(entries.map(e => {
                  const isDir = e.kind === 'dir';
                  const mode = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                  const size = isDir ? 4096 : (e.size || 0);
                  const name = `<span class="${isDir ? 'ls-dir' : 'ls-file'}">${esc(e.name)}${isDir ? '/' : ''}${e.shared ? ' *' : ''}</span>`;
                  return `<span class="ls-mode">${mode}</span>  <span class="ls-owner">${esc(u)}</span>  <span class="ls-group">zdrive</span>  <span class="ls-size">${String(size).padStart(6)}</span>  <span class="ls-date">${stamp}</span>  ${name}`;
                }).join('<br>'));
              }
            } catch (e) { printText('ls: '+zErr(e),'out-err'); }
            break;
          }
          const names = listDir(path);
          if (!names) {
            const f = walk(path);
            if (f && f.type==='file') { printText(path.split('/').pop()); break; }
            printText('ls: cannot access: No such file or directory','out-err'); break;
          }
          const base = path.replace(/\/$/,'') || '';
          if (!long) {
            print(names.map(n => {
              const node = walk(base + '/' + n);
              const isDir = node && node.type === 'dir';
              return `<span class="${isDir ? 'ls-dir' : 'ls-file'}">${esc(n)}${isDir ? '/' : ''}</span>`;
            }).join('  '));
          } else {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const now = new Date();
            const stamp = months[now.getMonth()] + ' ' + String(now.getDate()).padStart(2,' ');
            print(names.map(n => {
              const node = walk(base + '/' + n);
              const isDir = node && node.type === 'dir';
              const mode = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
              const size = isDir ? 4096 : String((node && node.data) || '').length;
              const name = `<span class="${isDir ? 'ls-dir' : 'ls-file'}">${esc(n)}${isDir ? '/' : ''}</span>`;
              return `<span class="ls-mode">${mode}</span>  <span class="ls-owner">laden</span>  <span class="ls-group">llc</span>  <span class="ls-size">${String(size).padStart(6)}</span>  <span class="ls-date">${stamp}</span>  ${name}`;
            }).join('<br>'));
          }
          break;
        }
        case 'tree': {
          const path = rest[0] ? normPath(rest[0]) : cwd;
          if (isZ(path)) { printText('tree: use ls -la on Z Drive for now','out-dim'); break; }
          if (!walk(path) || walk(path).type!=='dir') { printText('tree: not a directory','out-err'); break; }
          printText(path + '\n' + treeWalk(path).join('\n'));
          break;
        }
        case 'find': {
          const start = rest[0] ? normPath(rest[0]) : cwd;
          if (isZ(start)) { printText('find: use ls on Z Drive for now','out-dim'); break; }
          const lines = [];
          (function rec(p){
            lines.push(p);
            const names = listDir(p);
            if (!names) return;
            for (const n of names) rec((p==='/'?'':p)+'/'+n);
          })(start);
          printText(lines.join('\n'));
          break;
        }
        case 'cat': case 'head': case 'tail': {
          if (!rest[0]) { printText('usage: cat <file>','out-err'); break; }
          const fp = normPath(rest[0]);
          if (isZ(fp)) {
            try {
              const data = await zFetch('GET', '/zdrive/read?path=' + encodeURIComponent(zRel(fp)));
              let dataStr = data.content || '';
              if (cmd==='head') dataStr = dataStr.split('\n').slice(0,10).join('\n');
              if (cmd==='tail') dataStr = dataStr.split('\n').slice(-10).join('\n');
              printText(dataStr);
            } catch (e) { printText(cmd+': '+zErr(e),'out-err'); }
            break;
          }
          const r = readFile(fp);
          if (!r) { printText('No such file: '+rest[0],'out-err'); break; }
          if (r.err) { printText('cat: '+r.err,'out-err'); break; }
          let data = r.data;
          if (cmd==='head') data = data.split('\n').slice(0,10).join('\n');
          if (cmd==='tail') data = data.split('\n').slice(-10).join('\n');
          printText(data); break;
        }
        case 'grep': {
          if (rest.length<2){printText('usage: grep <pat> <file>','out-err');break;}
          const fp = normPath(rest[1]);
          let text = '';
          if (isZ(fp)) {
            try {
              const data = await zFetch('GET', '/zdrive/read?path=' + encodeURIComponent(zRel(fp)));
              text = data.content || '';
            } catch (e) { printText('grep: '+zErr(e),'out-err'); break; }
          } else {
            const r=readFile(fp); if(!r||r.err){printText('No such file','out-err');break;}
            text = r.data;
          }
          const re=new RegExp(rest[0],'i');
          printText(text.split('\n').filter(l=>re.test(l)).join('\n')||'(no matches)'); break;
        }
        case 'mkdir': {
          let parents = false; const args = [];
          for (const a of rest) { if (a==='-p'||a==='--parents') parents=true; else args.push(a); }
          if (!args[0]) { printText('usage: mkdir [-p] <dir>','out-err'); break; }
          const fp = normPath(args[0]);
          if (!isZ(fp)) { printText('mkdir: only on Z Drive (/z/...) — your private LabDrive','out-err'); break; }
          try {
            await zFetch('POST', '/zdrive/mkdir', { path: zRel(fp), parents });
            printText('created ' + fp, 'out-ok');
          } catch (e) { printText('mkdir: '+zErr(e),'out-err'); }
          break;
        }
        case 'touch': {
          if (!rest[0]) { printText('usage: touch <file>','out-err'); break; }
          const fp = normPath(rest[0]);
          if (!isZ(fp)) { printText('touch: only on Z Drive (/z/...)','out-err'); break; }
          try {
            // create empty if missing; leave content if exists
            try {
              await zFetch('GET', '/zdrive/read?path=' + encodeURIComponent(zRel(fp)));
            } catch {
              await zFetch('POST', '/zdrive/write', { path: zRel(fp), content: '' });
            }
          } catch (e) { printText('touch: '+zErr(e),'out-err'); }
          break;
        }
        case 'rm': case 'rmdir': {
          let recursive = cmd === 'rm' && (rest.includes('-r') || rest.includes('-rf') || rest.includes('-fr'));
          const args = rest.filter(a => !a.startsWith('-'));
          if (!args[0]) { printText('usage: rm [-r] <path>','out-err'); break; }
          const fp = normPath(args[0]);
          if (!isZ(fp)) { printText(cmd+': only on Z Drive (/z/...)','out-err'); break; }
          try {
            const rec = cmd === 'rmdir' ? false : recursive;
            await zFetch('POST', '/zdrive/rm', { path: zRel(fp), recursive: rec });
            printText('removed ' + fp, 'out-dim');
          } catch (e) { printText(cmd+': '+zErr(e),'out-err'); }
          break;
        }
        case 'cp': {
          if (rest.length < 2) { printText('usage: cp <src> <dst>','out-err'); break; }
          const src = normPath(rest[0]), dst = normPath(rest[1]);
          if (!isZ(src) || !isZ(dst)) { printText('cp: both paths must be on /z','out-err'); break; }
          try {
            await zFetch('POST', '/zdrive/cp', { src: zRel(src), dst: zRel(dst) });
            printText('copied → ' + dst, 'out-ok');
          } catch (e) { printText('cp: '+zErr(e),'out-err'); }
          break;
        }
        case 'mv': {
          if (rest.length < 2) { printText('usage: mv <src> <dst>','out-err'); break; }
          const src = normPath(rest[0]), dst = normPath(rest[1]);
          if (!isZ(src) || !isZ(dst)) { printText('mv: both paths must be on /z','out-err'); break; }
          try {
            await zFetch('POST', '/zdrive/mv', { src: zRel(src), dst: zRel(dst) });
            printText('moved → ' + dst, 'out-ok');
          } catch (e) { printText('mv: '+zErr(e),'out-err'); }
          break;
        }
        case 'df': case 'zquota': case 'quota': {
          try {
            const q = await zFetch('GET', '/zdrive/quota');
            const pct = q.quota ? Math.round(100 * q.used / q.quota) : 0;
            printText(`Z Drive (/z)  ${fmtBytes(q.used)} used · ${fmtBytes(q.free)} free · ${fmtBytes(q.quota)} max (${pct}%)`);
          } catch (e) { printText('df: '+zErr(e),'out-err'); }
          break;
        }
        case 'zshare': {
          if (!rest[0]) { printText('usage: zshare <file>','out-err'); break; }
          const fp = normPath(rest[0]);
          if (!isZ(fp)) { printText('zshare: file must be on /z','out-err'); break; }
          try {
            await zFetch('POST', '/zdrive/share', { path: zRel(fp), shared: true });
            printText('shared to Community pool: ' + fp, 'out-ok');
          } catch (e) { printText('zshare: '+zErr(e),'out-err'); }
          break;
        }
        case 'zunshare': {
          if (!rest[0]) { printText('usage: zunshare <file>','out-err'); break; }
          const fp = normPath(rest[0]);
          if (!isZ(fp)) { printText('zunshare: file must be on /z','out-err'); break; }
          try {
            await zFetch('POST', '/zdrive/share', { path: zRel(fp), shared: false });
            printText('unshared: ' + fp, 'out-dim');
          } catch (e) { printText('zunshare: '+zErr(e),'out-err'); }
          break;
        }
        case 'echo': {
          // support: echo text > path   and   echo text >> path
          const raw = rest.join(' ');
          const m = raw.match(/^(.*?)\s*(>>|>)\s*(\S+)\s*$/);
          if (m) {
            const text = m[1];
            const append = m[2] === '>>';
            const fp = normPath(m[3]);
            if (!isZ(fp)) { printText('echo: redirect only writes to Z Drive (/z/...)','out-err'); break; }
            try {
              const body = text + '\n';
              await zFetch('POST', '/zdrive/write', { path: zRel(fp), content: body, append });
              printText((append ? 'appended → ' : 'wrote → ') + fp + ' (' + fmtBytes(body.length) + ')', 'out-ok');
            } catch (e) { printText('echo: '+zErr(e),'out-err'); }
            break;
          }
          printText(raw);
          break;
        }
        case 'base64': {
          let decode=false, parts=rest.slice();
          if(parts[0]==='-d'||parts[0]==='--decode'){decode=true;parts=parts.slice(1);}
          let src=parts.join(' '); if(!src){printText('usage: base64 [-d] <file|str>','out-err');break;}
          const r=readFile(normPath(src)); if(r&&!r.err) src=r.data.trim();
          printText(decode?b64decode(src):b64encode(src)); break;
        }
        case 'rot13': {
          let src=rest.join(' '); if(!src){printText('usage: rot13 <file|str>','out-err');break;}
          const r=readFile(normPath(src)); if(r&&!r.err) src=r.data.trim();
          printText(rot13(src)); break;
        }
        case 'xxd': {
          let src=rest.join(' '); if(!src){printText('usage: xxd <file|str>','out-err');break;}
          const r=readFile(normPath(src)); if(r&&!r.err) src=r.data;
          const bytes=new TextEncoder().encode(src); let out='';
          for(let i=0;i<bytes.length;i+=16){const slice=bytes.slice(i,i+16);
            const hex=[...slice].map(b=>b.toString(16).padStart(2,'0')).join(' ');
            const asc=[...slice].map(b=>b>=32&&b<127?String.fromCharCode(b):'.').join('');
            out+=i.toString(16).padStart(8,'0')+': '+hex.padEnd(48,' ')+' '+asc+'\n';}
          printText(out.trimEnd()); break;
        }
        case 'jwt': {
          if((rest[0]||'').toLowerCase()!=='decode'||!rest[1]){printText('usage: jwt decode <token|file>','out-err');break;}
          let tok=rest.slice(1).join(' '); const r=readFile(normPath(tok)); if(r&&!r.err) tok=r.data.trim();
          printText(JSON.stringify(jwtDecode(tok),null,2),'out-ok'); break;
        }
        case 'hashid':
          if(!rest[0]) printText('usage: hashid <hash>','out-err');
          else printText(hashid(rest[0])); break;
        case 'md5': case 'sha1': case 'sha256': {
          let src=rest.join(' '); if(!src){printText('usage: '+cmd+' <str|file>','out-err');break;}
          const r=readFile(normPath(src)); if(r&&!r.err) src=r.data.replace(/\n$/,'');
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
        case 'ip': {
          const sub = (rest[0] || '').toLowerCase();
          if (!sub || sub === 'a' || sub === 'addr' || sub === 'address') {
            printText(fmtIpAddr());
          } else if (sub === 'link') {
            printText(fmtIpAddr().split('\n').filter(l => /link\//.test(l) || /^\d+:/.test(l)).join('\n'));
          } else if (sub === 'route') {
            printText(`default via 10.13.37.1 dev eth0 proto dhcp metric 100
10.13.37.0/24 dev eth0 proto kernel scope link src 10.13.37.50
10.0.88.0/24 dev wlan0 proto kernel scope link src 10.0.88.42${MON_IF ? '' : ''}
127.0.0.0/8 dev lo scope host`);
          } else {
            printText('usage: ip a | ip addr | ip link | ip route', 'out-err');
          }
          break;
        }
        case 'ifconfig': {
          // friendly alias
          printText(fmtIpAddr());
          break;
        }
        case 'iwconfig': {
          const target = rest[0] || null;
          const out = fmtIwconfig(target);
          if (out === null) printText('iwconfig: No such device ' + target, 'out-err');
          else printText(out);
          break;
        }
        case 'iw': {
          // iw dev wlan0 info / iwconfig-ish
          const sub = rest.join(' ');
          if (!rest.length || rest[0] === 'dev') {
            const lines = [];
            for (const [name, iface] of Object.entries(IFACES)) {
              if (iface.type !== 'wifi') continue;
              lines.push(`phy#0`);
              lines.push(`Interface ${name}`);
              lines.push(`\tifindex ${name === 'wlan0' ? 3 : 4}`);
              lines.push(`\twdev 0x1`);
              lines.push(`\taddr ${iface.mac}`);
              lines.push(`\ttype ${iface.mode || 'managed'}`);
              lines.push(`\tchannel 6 (2437 MHz), width: 20 MHz`);
            }
            printText(lines.join('\n') || 'no wifi phy');
          } else {
            printText('iw: try  iw dev  ·  or iwconfig', 'out-dim');
          }
          break;
        }
        case 'labcrack-ng-airmon': case 'airmon-ng': case 'labmon': {
          const act = (rest[0] || '').toLowerCase();
          const iface = rest[1] || 'wlan0';
          if (act === 'start') {
            if (iface !== 'wlan0' && iface !== 'wlan0mon') {
              printText('labcrack-ng-airmon: only wlan0 (Laden USB dongle)', 'out-err'); break;
            }
            if (MON_IF) { printText(`monitor mode already enabled on ${MON_IF}`, 'out-ok'); break; }
            printText('Found Laden USB WiFi Dongle LN-USB-AC on wlan0');
            printText('PHY Interface   Driver      Chipset');
            printText('phy0  wlan0     laden-mt76  LabNet LN-USB-AC (fictional)');
            const mon = ensureMonIface();
            printText(`\n[ok] monitor mode enabled on ${mon}`, 'out-ok');
            printText(`You can try: labcrack-ng-airodump ${mon}`);
          } else if (act === 'stop') {
            const was = stopMonIface();
            if (!was) printText('labcrack-ng-airmon: monitor mode not active', 'out-dim');
            else printText(`[ok] monitor mode disabled · ${was} → wlan0 managed`, 'out-ok');
          } else if (act === 'check' || !act) {
            printText(`Found Laden USB WiFi Dongle LN-USB-AC
PHY Interface   Driver      Chipset                 Mode
phy0  wlan0     laden-mt76  LabNet LN-USB-AC        ${IFACES.wlan0.mode}${MON_IF ? `\nphy0  ${MON_IF}  laden-mt76  LabNet LN-USB-AC        monitor` : ''}

usage: labcrack-ng-airmon start|stop [wlan0]`);
          } else {
            printText('usage: labcrack-ng-airmon start|stop [wlan0]', 'out-err');
          }
          break;
        }
        case 'labcrack-ng-airodump': case 'airodump-ng': case 'labdump': {
          const iface = rest[0] || MON_IF || 'wlan0mon';
          const monOk = (IFACES[iface] && IFACES[iface].mode === 'monitor') || iface === MON_IF;
          if (!monOk && !(IFACES.wlan0 && IFACES.wlan0.mode === 'monitor')) {
            printText(`labcrack-ng-airodump: ${iface} not in monitor mode`, 'out-err');
            printText('run: labcrack-ng-airmon start', 'out-dim');
            break;
          }
          print(`<span class="out-ok">labcrack-ng-airodump</span> <span class="out-dim">CH  6 ][ Elapsed: 12 s ][ ${new Date().toISOString().slice(11,19)} ][ fictional scan</span>`);
          printText(` BSSID              PWR  Beacons  #Data  CH   ENC   ESSID
`);
          for (const ap of WIFI_APS) {
            printText(` ${ap.bssid}  ${String(ap.power).padStart(3)}    ${String(40+ap.clients*3).padStart(4)}    ${String(ap.clients*11).padStart(3)}   ${String(ap.channel).padStart(2)}   ${ap.enc.padEnd(4)}  ${ap.essid}`);
          }
          printText(`\n(STATION list omitted · educational demo only)`);
          break;
        }
        case 'labcrack-ng': case 'aircrack-ng': {
          await runLabcrack(rest);
          break;
        }
        case 'lmap':

          await runLmap(rest); break;
        case 'nmap':
          printText('tip: use lmap (Laden Mapper) for fictional LLC nets.\n  lmap -h','out-dim');
          await runLmap(rest.length ? rest : ['-h']); break;
        case 'msfconsole': case 'msf':
          printText('msfconsole is not shipped in LLC.\nUse lmap / jwt / curl / cat for lab work.','out-dim'); break;
        case 'labs': {
          printText('Fetching challenges…','out-dim');
          const res=await fetch('/labs/api/challenges'); const data=await res.json();
          const list=data.challenges||[];
          printText(list.map(c=>`${String(c.difficulty).padEnd(4)} ${String(c.points).padStart(3)} ${(c.slug||'').padEnd(24)} ${c.title}`).join('\n')+`\n\n${list.length} labs · open <slug>`); break;
        }
        case 'open': {
          if(!rest[0]){printText('usage: open <slug>|manuals|zguide','out-err');break;}
          const rawOpen=rest[0].toLowerCase();
          if(rawOpen==='manuals'||rawOpen==='manual'||rawOpen==='man'){
            printText('Opening LLC manuals /labs/manuals/ …','out-ok');
            location.href='/labs/manuals/'; break;
          }
          if(rawOpen==='zguide'||rawOpen==='z-guide'||rawOpen==='bible'||rawOpen==='guide'){
            printText('Opening Z Guide /labs/z-guide/ …','out-ok');
            location.href='/labs/z-guide/'; break;
          }
          const slug=rawOpen.replace(/[^a-z0-9-]/g,'');
          try{sessionStorage.setItem('laden_pending_chal',slug);}catch{}
          printText('Opening lab room /labs/'+slug+'/ …','out-ok');
          location.href='/labs/'+encodeURIComponent(slug)+'/'; break;
        }
        case 'hint': {
          const ctx = window.LADEN_LLC_CONTEXT;
          if (ctx && ctx.hint) { printText('['+(ctx.slug||'lab')+'] '+ctx.hint); break; }
          printText(`Challenge helpers:
  cd ~/samples · cat robots.txt · cat backup.bak
  base64 -d b64-sample.txt · rot13 rot13-sample.txt
  jwt decode jwt-sample.token · cat app.bundle.js

Networks:
  cd /nets · cat TARGETS.md · lmap --list
  lmap -sn 10.13.37.0/24 · lmap -sV 10.13.37.10
  mzfconsole · search admin · use exploit/labnet/admin/auth_bypass · set RHOSTS 10.13.37.30`); break;
        }
        case 'manuals':
          printManualsIndex();
          break;
        case 'man': {
          printManTool(rest.join(' '));
          break;
        }
        case 'zguide': case 'z-guide': case 'bible': case 'guide':
          printText('Z Guide — the LLZ bible','out-ok');
          printText(location.origin + '/labs/z-guide/');
          printText('Tip: open zguide  ·  open bible','out-dim');
          break;
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

  (async () => {
    if (llcBooted) return;
    llcBooted = true;
    const restored = llcRestoreSession();
    await bootZHome({ forceHome: !restored });
    if (!restored) banner();
    else setPrompt();
    llcScheduleSave();
  })();
  try {
    if (window.LADEN_LLC_CONTEXT) setLLCContext(window.LADEN_LLC_CONTEXT);
  } catch {}
  try {
    const u = new URL(location.href);
    if (u.searchParams.get('term') === '1' || u.searchParams.get('llc') === '1') open();
  } catch {}
  if (FULLPAGE) { open(); setTimeout(() => input.focus(), 50); }
})();
