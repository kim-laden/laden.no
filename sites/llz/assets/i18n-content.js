/*! Laden Labs i18n content — Norwegian Bokmål labs/tips overlay */
(function () {
  'use strict';

  var CONTENT = {
  "no": {
    "labs": {
      "scope-first": {
        "title": "Scope First",
        "summary": "Operator-eden — les før du peker.",
        "learn": "Ekte bug bounties og pentests starter med skriftlig scope. Testing utenfor scope er ulovlig og brenner tillit.",
        "body_html": "<p>Les scope-plaketten. Flagget er fraseen vi lever etter, pakket inn i <code>LLZ{...}</code>.</p><pre class='mono'>AUTHORIZED TARGETS ONLY · NO SOCIAL ENGINEERING OF STAFF · REPORT, DON'T EXPLOIT BEYOND PoC</pre><p>Flaggformatet bruker understreker: tre-ords mottoet til denne plattformens gateway.</p><p class='mono muted'>Motto: hunt ethically always</p>",
        "hint": "Tre ord fra motto-linjen."
      },
      "banner-grab-lite": {
        "title": "Banner Whisper",
        "summary": "HTTP-svarheadere lekker stack-spor.",
        "learn": "Recon er passiv innsamling. Headere som Server, X-Powered-By og egne X-*-headere kartlegger angrepsflate uten at du sender exploits.",
        "body_html": "<p>Se på disse demo-headerne (tenk et svar):</p><pre class='mono'>HTTP/1.1 200 OK\nServer: laden-gw/1.2\nX-Powered-By: ethical-coffee\nX-Laden-Trace: LLZ{headers_tell_stories}\nContent-Type: text/html</pre>",
        "hint": "Se på X-Laden-Trace."
      },
      "robots-redux": {
        "title": "Robots Redux",
        "summary": "robots.txt er et skattekart, ikke en lås.",
        "learn": "Disallow-linjer er ønsker til crawlere, ikke tilgangskontroll. Hunters henter alltid /robots.txt tidlig.",
        "body_html": "<p>Åpne <a href='/labs/targets/robots.txt' target='_blank' rel='noopener'>/labs/targets/robots.txt</a> og finn notatet om den flaggede stien.</p>",
        "hint": "Følg Disallow-kommentarene."
      },
      "hidden-dir": {
        "title": "Hidden Directory",
        "summary": "Gjettbare stier og backup-filer.",
        "learn": "Vanlige wordlists finner .bak, .old, /admin, /.git. Directory brute-force må holde seg innenfor scope.",
        "body_html": "<p>Prøv å hente <a href='/labs/targets/backup/index.bak' target='_blank' rel='noopener'>/labs/targets/backup/index.bak</a>.</p>",
        "hint": "Klassisk .bak-endelse."
      },
      "reflect-101": {
        "title": "Reflection 101",
        "summary": "Uescapet refleksjon → XSS-klasse bugs.",
        "learn": "Cross-site scripting kjører angriper-script i offerets nettleser. Start med å finne hvor input blir eka ut.",
        "body_html": "<p>Bruk echo-labben: <a href='/labs/targets/echo.html' target='_blank' rel='noopener'>/labs/targets/echo.html</a>. Injiser et script som inneholder <code>alert</code>; labben avslører flagget.</p>",
        "hint": "script + alert i echo-boksen."
      },
      "cookie-jar": {
        "title": "Cookie Jar",
        "summary": "Sesjonscookies uten flagg.",
        "learn": "Secure, HttpOnly og SameSite reduserer tyveri og CSRF-risiko. Manglende flagg er rapporterbare funn.",
        "body_html": "<p>Demo Set-Cookie-linje:</p><pre class='mono'>Set-Cookie: session=demo; Path=/; SameSite=None</pre><p>Hva mangler som hunters nevner først? Kod svaret som <code>LLZ{missing_httponly_secure}</code>-stil — spesielt de to flaggene som ofte nevnes sammen.</p>",
        "hint": "HttpOnly og Secure."
      },
      "b64-again": {
        "title": "Encoding ≠ Encryption",
        "summary": "Base64 er reversibelt by design.",
        "learn": "Encoding endrer representasjon. Kryptering trenger en nøkkel. Å blande dem er en vanlig junior-feil — og en vanlig «hemmelighet» i villmarken.",
        "body_html": "<p>Dekod: <code class='mono'>TExae2VuY29kaW5nX2lzX25vdF9jcnlwdG99</code></p>",
        "hint": "echo | base64 -d"
      },
      "rot-warm": {
        "title": "Caesar Warmup",
        "summary": "ROT13 dukker fortsatt opp i vitser og CTFer.",
        "learn": "Klassiske cipheres lærer frekvenstenkning. Produksjonshemmeligheter stoler aldri på dem.",
        "body_html": "<p>ROT13: <code class='mono'>YYM{ebg_vf_abg_frpher}</code></p>",
        "hint": "Kjør ROT13 to ganger for å verifisere."
      },
      "hash-id": {
        "title": "Hash Identification",
        "summary": "Gjenkjenn vanlige digests før cracking.",
        "learn": "MD5=32 hex, SHA-1=40, SHA-256=64. Identifikasjon styrer tooling (hashcat-moduser).",
        "body_html": "<p>Denne digesten er 64 hex-tegn av ordet <code>laden</code> med SHA-256. Flagget wrapper algoritmenavnet:</p><pre class='mono'>e3b0c442... wait, compute sha256('laden') yourself.</pre><p>Flag: <code>LLZ{sha256}</code>-stil som navngir algoen brukt for passordet 'laden'.</p>",
        "hint": "64 hex → sha256."
      },
      "jwt-none": {
        "title": "alg=none Nightmares",
        "summary": "Å godta alg=none forfalsker identitet.",
        "learn": "JWT-headeren velger algoritmen. Biblioteker som ærer 'none' lar angripere strippe signaturer. Whitelist alltid algs server-side.",
        "body_html": "<p>Dekod payloaden til:</p><pre class='mono' style='white-space:pre-wrap;word-break:break-all'>eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4iLCJmbGFnIjoiTExae2p3dF9ub25lX2lzX2Jyb2tlbn0ifQ.</pre>",
        "hint": "Base64url-dekod midtdelen."
      },
      "idor-desk": {
        "title": "IDOR Desk",
        "summary": "Insecure Direct Object Reference.",
        "learn": "Hvis du bytter ?id=5→6 og ser en annen brukers data uten authz-sjekk, er det IDOR — en toppklasse i bug bounty.",
        "body_html": "<p>Åpne <a href='/labs/targets/idor.html' target='_blank' rel='noopener'>/labs/targets/idor.html</a> og bla ticket-IDer. Ticket 7 er ikke din…</p>",
        "hint": "Prøv id=7."
      },
      "password-reset-poison": {
        "title": "Host Header Trust",
        "summary": "Konsept: forgiftning av passord-reset-lenker.",
        "learn": "Hvis reset-eposter bruker Host-headeren til å bygge URLer, kan angripere peke ofre til onde domener. Valider Host / bruk allowlists.",
        "body_html": "<p>Tenk en reset-lenke bygget som <code>https://{Host}/reset?token=…</code>. Trygt mønster er en fast kanonisk host. Flagget dokumenterer bug-klassen:</p><p class='mono'>LLZ{host_header_poison}</p>",
        "hint": "Det ligger i learn-tekst-mønsteret."
      },
      "sqli-logic": {
        "title": "SQLi Logic Gate",
        "summary": "Boolsk logikk i login-queries (konseptuelt).",
        "learn": "SQL injection knuser query-strukturen. Selv uten live DB-dump lærer ' OR '1'='1 hvorfor parametriserte queries gjelder.",
        "body_html": "<p>Hvilken payload er den klassiske tautologien brukt i usikre string-bygde SQL-logins? Send inn som flagg som wrapper payloaden med understreker i stedet for mellomrom/anførselstegn:</p><p class='mono'>LLZ{or_1_equals_1}</p>",
        "hint": "Klassisk OR 1=1."
      },
      "cmd-metachar": {
        "title": "Metacharacters",
        "summary": "OS command injection-grunnkurs.",
        "learn": "Hvis brukerinput treffer et shell, bryter ; | && ` $() ut. Foretrekk argv-arrays, aldri shell=True.",
        "body_html": "<p>Farlig mønster: <code>os.system('ping ' + ip)</code>. Flagg forsvarsmindsettet:</p><p class='mono'>LLZ{never_shell_user_input}</p>",
        "hint": "Forsvarsfokusert flagg."
      },
      "cors-wild": {
        "title": "CORS Wildcards",
        "summary": "Access-Control-Allow-Origin: * med credentials er broken tenkning.",
        "learn": "CORS er en nettleserregel. Feilkonfig kan la onde sider lese autentiserte svar. Aldri reflekter vilkårlig Origin med ACAO + credentials.",
        "body_html": "<p>Dårlig par: <code>ACAO: *</code> + <code>ACAC: true</code> (nettlesere avviser, men å reflektere Origin er den ekte buggen). Flag:</p><p class='mono'>LLZ{cors_reflect_origin}</p>",
        "hint": "Reflekter Origin med omhu."
      },
      "open-redirect": {
        "title": "Open Redirect",
        "summary": "Uvaliderte next= / url=-parametre.",
        "learn": "Open redirects hjelper phishing og OAuth-token-tyveri-kjeder. Allowlist kun interne stier.",
        "body_html": "<p>Lab: <a href='/labs/targets/redirect.html?next=https://example.com' target='_blank' rel='noopener'>redirect.html?next=…</a>. Det pedagogiske flagget:</p><p class='mono'>LLZ{allowlist_redirects}</p>",
        "hint": "Forsvarsflagg på labsiden."
      },
      "ssrf-mind": {
        "title": "SSRF Mindset",
        "summary": "Server-side request forgery-konsepter.",
        "learn": "Når en server henter en URL du styrer, kan du treffe metadata-IPer (169.254.169.254), interne admin-paneler eller file://. Blokker schemer + private ranges.",
        "body_html": "<p>Klassisk cloud metadata-IP for mange providere starter med 169.254… Flag:</p><p class='mono'>LLZ{block_link_local_meta}</p>",
        "hint": "Link-local metadata."
      },
      "path-traversal": {
        "title": "Traversal Taste",
        "summary": "../-sekvenser rømmer tiltenkte mapper.",
        "learn": "Normaliser stier, avvis .., chroot/jail filtilgang. Download-endepunkter er hyppige ofre.",
        "body_html": "<p>Lab-stimønster <code>/labs/files?name=../../etc/passwd</code> (konseptuelt). Flag:</p><p class='mono'>LLZ{normalize_and_reject_dotdot}</p>",
        "hint": "dotdot-forsvar."
      },
      "report-quality": {
        "title": "Report Like a Pro",
        "summary": "Severity uten klar PoC kaster bort tid.",
        "learn": "Gode rapporter: summary, steg-for-steg PoC, impact, fix-råd, scope-note. Plattformer rangerer hunters på signal-kvalitet.",
        "body_html": "<p>Sorter seksjonene som akronymet FLAG: Findings summary, Log/steps, Adverse impact, Guidance fix — wrap som:</p><p class='mono'>LLZ{flag_report_structure}</p>",
        "hint": "FLAG-struktur."
      },
      "cvss-feel": {
        "title": "CVSS Feel",
        "summary": "Scor impact ærlig.",
        "learn": "CVSS er et språk for severity. Overscoring brenner kredibilitet; underscoring skjuler risiko.",
        "body_html": "<p>En stored XSS i et autentisert admin-panel er vanligvis High, ikke Critical som unauth RCE. Flagg ærlighetsregelen:</p><p class='mono'>LLZ{dont_inflate_cvss}</p>",
        "hint": "Ærlighet i scoring."
      },
      "csp-bypass-talk": {
        "title": "CSP Conversations",
        "summary": "Content-Security-Policy hever listen.",
        "learn": "CSP begrenser script-kilder. Svake policies ('unsafe-inline', wild CDNs) failer åpent. Hunters noterer CSP som defense-in-depth, ikke sølvkule.",
        "body_html": "<p>Flagg den farlige source-tokenen som ofte får skylda:</p><p class='mono'>LLZ{unsafe_inline}</p>",
        "hint": "CSP-nøkkelord."
      },
      "js-secrets": {
        "title": "JS Secret Sprawl",
        "summary": "Frontend-bundles lekker API-nøkler og admin-URLer.",
        "learn": "Gå alltid gjennom JavaScript etter credentials, skjulte ruter og feature flags. Roter alt som finnes; behandle som kompromittert.",
        "body_html": "<p>Åpne <a href='/labs/targets/app.bundle.js' target='_blank' rel='noopener'>/labs/targets/app.bundle.js</a>.</p>",
        "hint": "I bundle-kommentaren."
      },
      "rate-limit": {
        "title": "Rate Limit Reality",
        "summary": "Login-endepunkter uten throttling.",
        "learn": "Credential stuffing elsker stille logins. Rate limits, lockouts, MFA og anomaly-alarmen teller.",
        "body_html": "<p>Pedagogisk flagg for manglende kontroller:</p><p class='mono'>LLZ{throttle_auth_endpoints}</p>",
        "hint": "Throttle auth."
      },
      "tls-old": {
        "title": "TLS Time Capsule",
        "summary": "Gamle protokoller dukker fortsatt opp i scans.",
        "learn": "Slå av SSLv3/TLS1.0/1.1. Hunters noterer svake cipheres som funn med klare remediations.",
        "body_html": "<p>Flag:</p><p class='mono'>LLZ{disable_legacy_tls}</p>",
        "hint": "Legacy TLS."
      }
    },
    "tips": {
      "nmap-scripts-versions": {
        "title": "Scripts + versions uten -A",
        "blurb": "Foretrekk nmap -sC -sV -p- fremfor blind -A. Raskere feedback, mindre støy, samme intel på de fleste labs.",
        "body_html": "<h2>Guide</h2>\n    \n<p>Den klassiske muskelminne-greia er <code>nmap -A</code>. Det føles grundig — OS-detect, traceroute, scripts, versions — men på et flatt lab-nett kaster det ofte bort minutter og flommer scrollbacken med traceroute-hopp du aldri bruker.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Default scripts (<code>-sC</code>) pluss version-probes (<code>-sV</code>) gir deg samme actionable intel som <code>-A</code> for nesten hver Laden-lab: banners, HTTP-titler, SSH-versjoner og noen NSE soft-probes. Du hopper over OS-fingerprinting og traceroute-støy til du faktisk trenger det.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\"># Full TCP port sweep with default scripts + versions\nnmap -sC -sV -p- -oA recon/host TARGET\n\n# Faster first pass (top ports) then deepen\nnmap -sC -sV --top-ports 1000 TARGET\nnmap -sC -sV -p- --open TARGET</pre>\n<ul>\n  <li>Lagre output med <code>-oA</code> så writeupen din har kvittering.</li>\n  <li>Legg til <code>-T4</code> på egne lab-VMer; dropp til <code>-T3</code> hvis targetet ser skjørt ut.</li>\n  <li>Hent tilbake <code>-O</code> eller <code>--traceroute</code> bare når en rapport ber om OS/pathing.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">nmap -sC -sV -p- 10.10.10.50\n# Look for: http-title, ssh-hostkey, ssl-cert, ftp-anon</pre>\n<p>Når en tjeneste ser interessant ut, følg opp med et målrettet script: <code>nmap --script http-enum -p 80 TARGET</code> — fortsatt ingen grunn til full <code>-A</code>.</p>"
      },
      "nmap-host-discovery": {
        "title": "Host discovery først",
        "blurb": "På et flatt lab-nett: nmap -sn 10.10.0.0/24, så mål live hosts. Hopp over -Pn til du vet at ICMP er blokkert.",
        "body_html": "<h2>Guide</h2>\n<p>Ikke port-scan mørket. Finn først hvilke hosts som lever, så stemm på dem. På flate lab-nett sparer det tid og reduserer støy i notatene dine.</p>\n<h3>Hvorfor det gjelder</h3>\n<p><code>-sn</code> (ping scan / host discovery) mapper live-maskiner uten full port-sweep. Blind <code>-Pn</code> på hele subnet antar at alle er oppe og kaster bort probes — bruk det når ICMP/syn er blokkert, ikke som default.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\"># Discover live hosts on the lab VLAN\nnmap -sn 10.10.0.0/24 -oA recon/hosts\n\n# Then deep-scan only live targets\nnmap -sC -sV -p- -iL live.txt -oA recon/services</pre>\n<ul>\n  <li>Eksporter live IPer til en fil før den tunge scannen.</li>\n  <li>Hvis discovery ser tom ut, test én kjent host med <code>-Pn</code> før du antar at hele nettet er dødt.</li>\n  <li>Dokumenter discovery-kommandoen i writeupen — reviewers bryr seg om metode.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">nmap -sn 10.10.0.0/24\nnmap -Pn -sC -sV -p- 10.10.0.50   # when ICMP is filtered</pre>"
      },
      "burp-match-replace": {
        "title": "Match and replace",
        "blurb": "Proxy → Match and replace: auto-fix en header eller cookie på tvers av Repeater/Intruder. Slutt å hand-editte samme byte 40 ganger.",
        "body_html": "<h2>Guide</h2>\n<p>Hvis du limer inn samme Authorization-header eller bytter samme cookie manuelt i hvert Repeater-tab, brenner du flow. Match and replace gjør det én gang i proxyen.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>IDOR-, JWT- og session-labs krever ofte den samme bytte-operasjonen på tvers av dusinvis av requests. Regler i Proxy → Options → Match and replace (eller session handling) holder Intruder/Repeater synkro uten fingerfeil.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\"># Burp → Proxy → Match and replace\n# Type: Request header\n# Match: Cookie: SESSION=old\n# Replace: Cookie: SESSION=victim</pre>\n<ul>\n  <li>Scope regelen til lab-hosten så du ikke ødelegger andre faner.</li>\n  <li>Kombiner med Logger++ så byttet er synlig i historikken.</li>\n  <li>Slå av regelen når du er ferdig — glemte regler er stille sabotage.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">Match: ^Host: .*\nReplace: Host: laden.lab\n# useful for host-header poison labs — only on authorized targets</pre>"
      },
      "burp-logger": {
        "title": "Logger++ / Logger-fane",
        "blurb": "Behold full historikk av proxet trafikk. Når en bug reproduserer én gang, er scrollbacken writeup-ryggraden.",
        "body_html": "<h2>Guide</h2>\n<p>Buggen fyrte én gang. Du sveipet videre. Nå er PoC-en et minne. Logger (eller Logger++) er din writeup-tidslinje.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Proxy history rulles. Repeater-faner multipliserer. En dedikert logger som beholder filtrerbart, søkbart request/response-arkiv gjør «steg 4» i rapporten til copy-paste i stedet for rekonstruksjon.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\"># Install Logger++ (BApp) or use built-in Logger in newer Burp\n# Filter: host == lab target\n# Export interesting rows when the bug is stable</pre>\n<ul>\n  <li>Tag rows når noe ser rart ut — fremtidig-deg takker deg.</li>\n  <li>Eksporter før du restarter Burp eller bytter prosjekt.</li>\n  <li>Redact secrets før du limer logger inn i offentlige writeups.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">Filter: url contains /api/ticket\n# IDOR desk labs — keep every id= probe in one place</pre>"
      },
      "wireshark-http-posts": {
        "title": "Kun HTTP POSTs",
        "blurb": "Display filter: http.request.method == \"POST\". Kombiner med ip.addr== lab-targetet ditt.",
        "body_html": "<h2>Guide</h2>\n<p>En pcap full av støy skjuler login-POSTen. Filtrer hardt, så les.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>De fleste lab-auth-bugs og form-handlers lever i POST-bodies. Display filters kutter synet til det som betyr noe før du Follow Stream.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">http.request.method == \"POST\"\nhttp.request.method == \"POST\" && ip.addr == 10.10.10.50</pre>\n<ul>\n  <li>Høyreklikk en treffende packet → Follow → HTTP Stream for den fulle bodyen.</li>\n  <li>Eksporter Objects → HTTP hvis du trenger opplastede filer fra lab-pcapen.</li>\n  <li>Kombiner med <code>http.cookie</code> eller <code>http.authorization</code> når sessions lekker.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">http.request.uri contains \"login\"\nhttp.request.method == \"POST\" && frame contains \"password\"</pre>"
      },
      "wireshark-follow-stream": {
        "title": "Følg streamen",
        "blurb": "Høyreklikk → Follow → TCP/HTTP Stream. Bygg samtalen på nytt i stedet for å myse på frames.",
        "body_html": "<h2>Guide</h2>\n<p>Enkeltframes lyver om kontekst. Follow Stream bygger samtalen — request og response — slik appene så den.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>SQL-feil, redirect-kjeder og half-open handshakes blir åpenbare når du leser streamen topp-til-bunn i stedet for packet-for-packet.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\"># Right-click packet → Follow → TCP Stream\n# or Follow → HTTP Stream / TLS Stream when decrypted</pre>\n<ul>\n  <li>Bytt «Show and save data as» til ASCII / Raw etter behov.</li>\n  <li>Filtrer på <code>tcp.stream eq N</code> for å holde den samtalen i hovedvisningen.</li>\n  <li>For HTTPS i labs: installer lab-CA eller bruk key-log-fil når scope tillater dekryptering.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">tcp.stream eq 7\nhttp && tcp.stream eq 7</pre>"
      },
      "msf-search-info": {
        "title": "search + info før exploit",
        "blurb": "search type:exploit apache, så info / show options. Sett RHOSTS, sjekk required options, så run. Labs elsker tålmodighet.",
        "body_html": "<h2>Guide</h2>\n<p><code>use</code> uten <code>info</code> er hvordan du bomber feil RPORT. Søk, les, sett options, så kjør.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>msfconsole er et bibliotek. <code>search</code> finner kandidater; <code>info</code> forteller rank, targets og required options. Labs straffer utålmodighet mer enn manglende 0-days.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">search type:exploit apache\ninfo exploit/multi/http/….\nshow options\nset RHOSTS 10.10.10.50\nset RPORT 8080\nrun</pre>\n<ul>\n  <li>Sjekk <code>Required</code>-kolonnen før check/run.</li>\n  <li>Foretrekk exploits med Normal/Good/Excellent rank i labber — Average+ trenger mer babying.</li>\n  <li>Logg kommandoene dine; workspace + notes = renere writeups.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">search cve:2021 type:exploit\nsearch name:ssh type:auxiliary</pre>"
      },
      "msf-workspaces": {
        "title": "Workspaces holder deg ærlig",
        "blurb": "workspace -a lab-oslo isolerer hosts/loot per engagement. Ikke bland klient A med fredags-CTF-notater.",
        "body_html": "<h2>Guide</h2>\n<p>Én global hosts-tabell blander klient A med fredags-CTF. Workspaces er billig hygiene.</p>\n<h3>Hvorfor det gjelder</h3>\n<p><code>workspace -a</code> isolerer hosts, services, loot og notes per engagement. Mindre kryss-kontaminering, raskere rapportering, færre «vent, hvilken box?»-øyeblikk.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">workspace -a lab-oslo\nworkspace -a client-x\nworkspace               # list\nworkspace lab-oslo      # switch</pre>\n<ul>\n  <li>Navngi workspaces etter engasjement, ikke etter stemning.</li>\n  <li>Eksporter loot før du sletter et workspace.</li>\n  <li>Hold CTF-rot utenfor klient-workspaces — alltid.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">workspace -a laden-labs-week3\ndb_nmap -sC -sV 10.10.0.0/24</pre>"
      },
      "aircrack-own-ap": {
        "title": "Egen AP / egen handshake",
        "blurb": "Captur og crack kun nett du eier eller er kontraktet til å teste. Lab-kit + isolert AP = læring. Nabos SSID = nei.",
        "body_html": "<h2>Guide</h2>\n<p>Trådløs cracking er lovlig på nett du eier eller er skriftlig autorisert til å teste. Alt annet er en rask vei til trøbbel.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Labs og hjemme-kit (isolert AP + egen klient) lærer handshake-capture og ordbok-angrep uten å berøre naboens SSID. Scope er eden — samme som web-labs.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\"># On YOUR AP / contracted lab only\nairodump-ng -c CHANNEL --bssid YOUR_BSSID -w capture wlan0mon\naircrack-ng -w wordlist.txt capture-01.cap</pre>\n<ul>\n  <li>Dokumenter eierskap/autorisasjon før du starter.</li>\n  <li>Bruk et dedikert lab-SSID — aldri «øv» på fremmede nett.</li>\n  <li>Etter økt: gå ut av monitor mode og gjenopprett vanlig networking.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">airmon-ng start wlan0\nairodump-ng wlan0mon   # confirm YOUR bssid only</pre>"
      },
      "airmon-check-kill": {
        "title": "airmon-ng check kill",
        "blurb": "Drep NetworkManager-interferens før monitor mode. Husk å restarte networking etter lab-økten.",
        "body_html": "<h2>Guide</h2>\n<p>NetworkManager og wpa_supplicant elsker å stjele interfacet midt i en capture. <code>airmon-ng check kill</code> rydder dem ut — midlertidig.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Monitor mode dør stille når NM reconnecter. Drep interferensen før airodump, og planlegg å restarte tjenester etterpå så laptopen din ikke er offline for alltid.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">sudo airmon-ng check kill\nsudo airmon-ng start wlan0\n# … lab work …\nsudo airmon-ng stop wlan0mon\nsudo systemctl start NetworkManager   # or your distro equivalent</pre>\n<ul>\n  <li>Noter hvilke prosesser som ble drept så du kan starte dem igjen.</li>\n  <li>På noen distros: <code>systemctl restart NetworkManager</code> etter stop.</li>\n  <li>Ikke kjør check kill blindt på en delt box uten å si ifra.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">airmon-ng check\nairmon-ng check kill</pre>"
      },
      "hydra-throttle": {
        "title": "Throttle eller bli banna",
        "blurb": "Bruk -t 4 og respekter lockouts. Mot produksjon uten skriftlig scope: ikke. Mot labben din: vær fortsatt snill mot loggeren.",
        "body_html": "<h2>Guide</h2>\n<p>Hydra uten throttle er hvordan du lockouter en konto — eller deg selv — og ser stygg ut i loggene.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Labs lærer timing og lockout-atferd. Produksjon uten skriftlig scope er et hardt nei. Selv på egen lab: lave tråder, observer svar, eskaler forsiktig.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">hydra -l admin -P rockyou.txt -t 4 -f -V TARGET http-post-form \\\n  \"/login:user=^USER^&pass=^PASS^:F=Invalid\"</pre>\n<ul>\n  <li>Start med <code>-t 4</code> (eller lavere) og en liten wordlist-skive.</li>\n  <li>Respekter lockouts — pause hvis labben begynner å 429/403 etter N forsøk.</li>\n  <li>Aldri pek Hydra mot tredjeparts-login uten autorisasjon.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">hydra -L users.txt -P passwords.txt -t 2 ssh://10.10.10.50</pre>"
      },
      "sqlmap-level-risk": {
        "title": "Level/risk med vilje",
        "blurb": "Start lavt: default level/risk, så klatre. Legg til --tamper bare når en WAF faktisk blokkerer. Alltid --batch i labs du eier.",
        "body_html": "<h2>Guide</h2>\n<p>Max level/risk først er hvordan du bråker og triggere WAF-er. Klatre med vilje.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Default level/risk finner mange lab-injections. Høyere level legger til mer payload-variasjon; høyere risk er mer støyete (og farligere). Tamper-scripts er for når noe faktisk blokkerer, ikke for ego.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">sqlmap -u \"http://TARGET/item?id=1\" --batch --dbs\n# if blocked, then climb:\nsqlmap -u \"...\" --batch --level=3 --risk=2\n# WAF in the way?\nsqlmap -u \"...\" --batch --tamper=space2comment</pre>\n<ul>\n  <li>Bruk <code>--batch</code> i egne labs så prompts ikke stopper deg.</li>\n  <li>Øk én akse om gangen (level eller risk) og noter hva som endret deteksjon.</li>\n  <li>Hold dump utenfor scope — se tipset «Dump med intensjon».</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">sqlmap -r req.txt --batch --level=2 --risk=1 -p id</pre>"
      },
      "sqlmap-dump-intent": {
        "title": "Dump med intensjon",
        "blurb": "--tables / --columns før --dump. Vit hva du henter ut og hvorfor det er i scope.",
        "body_html": "<h2>Guide</h2>\n<p><code>--dump</code> av alt er ikke en flex — det er scope-creep med ekstra steg. Kartlegg først, trekk ut med hensikt.</p>\n<h3>Hvorfor det gjelder</h3>\n<p><code>--tables</code> / <code>--columns</code> viser hva som finnes. Du velger bare data som bevisst er i scope for lab-/rapportmålene. Mindre støy, renere PoC, færre «oops»-øyeblikk.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">sqlmap -u \"http://TARGET/item?id=1\" --batch --tables\nsqlmap -u \"...\" --batch -D appdb --columns\nsqlmap -u \"...\" --batch -D appdb -T users -C id,email --dump</pre>\n<ul>\n  <li>Skriv ned hvorfor hver dumpede kolonne er relevant for funnet.</li>\n  <li>Unngå PII-kolonner med mindre labben eksplisitt krever dem.</li>\n  <li>Lagre output under engagement-mappen, ikke Desktop.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">sqlmap -r req.txt --batch -D shop -T products --dump</pre>"
      },
      "john-format-detection": {
        "title": "Format-deteksjon",
        "blurb": "john --list=formats | rg -i sha, så --format= eksplisitt. Feil format = stille tristesse.",
        "body_html": "<h2>Guide</h2>\n<p>Feil <code>--format</code> er stille feil. John spinner, du antar svak policy, hash-en var aldri det du trodde.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Auto-deteksjon hjelper, men lab-hashes (spesielt rare wrap) vil at du skal bekrefte. List formater, grep det som matcher, sett <code>--format</code> eksplisitt.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">john --list=formats | rg -i 'sha|nt|md5'\njohn --format=Raw-SHA256 hashes.txt\njohn --show hashes.txt</pre>\n<ul>\n  <li>Sammenlign hex-lengde / prefix med kjente formater før du brenner CPU.</li>\n  <li>Bruk <code>--fork</code> fornuftig på lab-bokser; la laptopen puste.</li>\n  <li>Når format er bekreftet, dokumenter det i writeupen.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">john --list=formats | rg -i bcrypt\njohn --format=bcrypt shadow.lab</pre>"
      },
      "hashcat-mode-numbers": {
        "title": "Mode-numre teller",
        "blurb": "Eksempel: -m 1000 NTLM, -m 1800 sha512crypt. Sjekk example hashes-wikien før du brenner GPU-tid.",
        "body_html": "<h2>Guide</h2>\n<p><code>-m</code> er ikke valgfritt trivia. Feil mode = meningsløse kandidater og brent GPU-tid.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Hashcat modes mapper algoritme (+ litt wrapping) til et tall. Example hashes-wikien og <code>--example-hashes</code> er dine venner før <code>-a 0</code>-maratonen.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">hashcat --example-hashes | rg -i ntlm\nhashcat -m 1000 ntlm.txt rockyou.txt\nhashcat -m 1800 sha512crypt.txt rockyou.txt</pre>\n<ul>\n  <li>Bekreft mode mot en kjent sample før fulle wordlists.</li>\n  <li>Bruk <code>-O</code> / workload-profiler med omhu på delte lab-GPUer.</li>\n  <li>Noter mode-nummeret i rapporten ved siden av algo-navnet.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">hashcat -m 0 md5.txt wordlist.txt\nhashcat -m 1400 sha256.txt wordlist.txt</pre>"
      },
      "ffuf-filter-smart": {
        "title": "Filtrer smart",
        "blurb": "ffuf -u URL/FUZZ -w wordlist -mc 200,204,301,302,403 -fs <size> for å droppe kjedelige catch-all-svar.",
        "body_html": "<h2>Guide</h2>\n<p>Catch-all 200-er drukner signal. Filtrer på status <em>og</em> størrelse (eller ord/linjer) til støyen forsvinner.</p>\n<h3>Hvorfor det gjelder</h3>\n<p>Mange labs (og ekte apps) returnerer myke 200-er for missing paths. <code>-mc</code> holder interessante koder; <code>-fs</code>/<code>-fw</code>/<code>-fl</code> dropper den kjedelige default body-størrelsen.</p>\n<h3>How-to</h3>\n<pre class=\"mono tip-pre\">ffuf -u http://TARGET/FUZZ -w wordlist.txt -mc 200,204,301,302,403 -fs 42\n# calibrate: note the size of a known-miss, then -fs that size</pre>\n<ul>\n  <li>Calibrate med et tullete path først for å lære catch-all-størrelsen.</li>\n  <li>Legg til <code>-t</code> forsiktig — labs og lockouts gjelder fortsatt.</li>\n  <li>Lagre <code>-o</code> JSON/HTML for writeup-bevis.</li>\n</ul>\n<h3>Eksempler</h3>\n<pre class=\"mono tip-pre\">ffuf -u http://10.10.10.50/FUZZ -w raft-small-dirs.txt -mc 200,301,403 -fs 1234</pre>"
      }
    },
    "special_hints": {
      "scope-first": "Sjekk mottoet på plaketten i labben — format LLZ{…}.",
      "robots-redux": "Hent /labs/targets/robots.txt og følg Disallow-kommentarstien.",
      "reflect-101": "På echo.html: prøv en klassisk XSS-probe; labben avslører flagget når den fyrer.",
      "hidden-dir": "Se under /labs/targets/backup/ etter en glemt .bak.",
      "rot-warm": "Cipherteksten er ROT13 — dekod YYM{ebg_vf_abg_frpher}.",
      "open-redirect": "Forsvars-writeupen på labsiden holder flagget.",
      "banner-grab-lite": "Inspiser svarheadere — spesielt X-Laden-Trace.",
      "cookie-jar": "Hva mangler på Set-Cookie? HttpOnly + Secure.",
      "b64-again": "Dekod base64-blobben på labsiden."
    },
    "llc": {
      "scope-first": {
        "blurb": "Scope First — les eden. LLC er valgfritt her; sjekklista er på benken.",
        "hint": "Slå på alle reglene på benken. Motto bruker understreker inni LLZ{…}."
      },
      "banner-grab-lite": {
        "blurb": "Banner Whisper — inspiser headers.txt eller curl et target.",
        "hint": "cat headers.txt — se etter X-Laden-Trace."
      },
      "robots-redux": {
        "blurb": "Robots Redux — hent robots.txt live.",
        "hint": "curl /labs/targets/robots.txt og les kommentaren."
      },
      "hidden-dir": {
        "blurb": "Hidden Directory — backup-rester.",
        "hint": "curl /labs/targets/backup/index.bak"
      },
      "reflect-101": {
        "blurb": "Reflection 101 — XSS echo-lab. Bruk benk-iframe eller åpne target.",
        "hint": "Injiser et script med alert i echo-boksen."
      },
      "cookie-jar": {
        "blurb": "Cookie Jar — manglende cookie-flagg.",
        "hint": "Toggle flagg til Secure + HttpOnly er på."
      },
      "b64-again": {
        "blurb": "Encoding ≠ Encryption — dekod med LLC.",
        "hint": "base64 -d b64-sample.txt"
      },
      "rot-warm": {
        "blurb": "Caesar Warmup — ROT13 i LLC.",
        "hint": "rot13 rot13-sample.txt"
      },
      "hash-id": {
        "blurb": "Hash Identification — sha256 laden.",
        "hint": "sha256 laden — wrap algo-navnet i LLZ{…}."
      },
      "jwt-none": {
        "blurb": "alg=none Nightmares — dekod sample-JWT.",
        "hint": "jwt decode jwt-sample.token — les payload-flagget."
      },
      "idor-desk": {
        "blurb": "IDOR Desk — ticket-ider uten authz.",
        "hint": "Prøv ticket id=7 på disken."
      },
      "password-reset-poison": {
        "blurb": "Host Header Trust — simuler forgiftet Host.",
        "hint": "Bygg en reset-URL fra en fiendtlig Host — bug-klassen er flagget."
      },
      "sqli-logic": {
        "blurb": "SQLi Logic Gate — klassisk tautologi.",
        "hint": "Klassisk OR 1=1 → LLZ{or_1_equals_1}."
      },
      "cmd-metachar": {
        "blurb": "Metacharacters — aldri shell brukerinput.",
        "hint": "Forsvars-mindset-flagg på benken."
      },
      "cors-wild": {
        "blurb": "CORS Wildcards — Origin-refleksjonsrisiko.",
        "hint": "Reflekter Origin forsiktig — se benk-simulatoren."
      },
      "open-redirect": {
        "blurb": "Open Redirect — allowlist next=.",
        "hint": "Forsvarsflagget er på redirect-labsiden."
      },
      "ssrf-mind": {
        "blurb": "SSRF Mindset — blokker link-local metadata.",
        "hint": "Klassisk cloud metadata starter 169.254…"
      },
      "path-traversal": {
        "blurb": "Traversal Taste — normaliser og avvis ..",
        "hint": "Normaliser stier; avvis dotdot."
      },
      "report-quality": {
        "blurb": "Report Like a Pro — FLAG-struktur.",
        "hint": "Rekkefølge Findings · Log · Adverse · Guidance."
      },
      "cvss-feel": {
        "blurb": "CVSS Feel — scor ærlig.",
        "hint": "Ikke oppblås CVSS."
      },
      "csp-bypass-talk": {
        "blurb": "CSP Conversations — farlige source-tokens.",
        "hint": "unsafe-inline svekker CSP."
      },
      "js-secrets": {
        "blurb": "JS Secret Sprawl — les bundlen.",
        "hint": "curl /labs/targets/app.bundle.js — roter lekkede nøkler."
      },
      "rate-limit": {
        "blurb": "Rate Limit Reality — throttle auth.",
        "hint": "Throttle auth-endepunkter."
      },
      "tls-old": {
        "blurb": "TLS Time Capsule — slå av legacy-protokoller.",
        "hint": "Slå av SSLv3 / TLS1.0 / TLS1.1."
      }
    },
    "widgets": {
      "scope-first": {
        "h3": "Scope-plakett sjekkliste",
        "help": "Kryss av alle tre. Motto-hint dukker opp når plaketten er forseglet.",
        "sealed": "Plakett forseglet. Motto: hunt ethically always → LLZ{hunt_ethically_always}"
      },
      "banner-grab-lite": {
        "h3": "Header-inspektør",
        "copy": "Kopier headere",
        "llc": "Inspiser i LLC",
        "copied": "Kopiert",
        "selectCopy": "Marker & kopier"
      },
      "robots-redux": {
        "h3": "Live target",
        "help": "Hent robots.txt — crawlere får hints, ikke låser.",
        "open": "Åpne robots.txt",
        "fetch": "Hent her",
        "llc": "curl i LLC"
      },
      "hidden-dir": {
        "h3": "Sti-probe",
        "open": "Åpne index.bak",
        "llc": "curl bak i LLC",
        "out": "Prøv klassiske rester: .bak · .old · ~"
      },
      "reflect-101": {
        "h3": "Echo-benk",
        "orOpen": "Eller <a href=\"/labs/targets/echo.html\" target=\"_blank\" rel=\"noopener\">åpne full side</a>."
      },
      "cookie-jar": {
        "h3": "Set-Cookie flaggbygger",
        "samesite": "SameSite=Lax (bedre enn None)",
        "out": "Slå på de to flaggene hunters nevner først.",
        "yes": "Ja — hunters nevner HttpOnly + Secure først. Flaggform: LLZ{missing_httponly_secure}",
        "still": "Mangler fortsatt: "
      },
      "b64-again": {
        "h3": "Base64-dekoder",
        "go": "Dekod",
        "llc": "LLC base64 -d"
      },
      "rot-warm": {
        "h3": "ROT13-benk",
        "go": "Kjør ROT13",
        "llc": "LLC rot13"
      },
      "hash-id": {
        "h3": "Hash ID + sha256",
        "go": "SHA-256",
        "llc": "LLC sha256",
        "out": "Lengden avslører algoen. Flagget wrapper navnet.",
        "result": "SHA-256({v}) =\n{hex}\n\n{n} hex-tegn → algo-navnet er flagg-nøkkelordet."
      },
      "jwt-none": {
        "h3": "JWT-dekoder",
        "go": "Dekod payload",
        "llc": "LLC jwt decode"
      },
      "idor-desk": {
        "h3": "Ticket-disk",
        "open": "Åpne id=7",
        "llc": "curl id=7 i LLC"
      },
      "password-reset-poison": {
        "h3": "Host-header-simulator",
        "label": "Offer skrev e-post · server bygger reset-lenke fra Host",
        "go": "Bygg reset-URL",
        "out": "Reset-eposten ville inneholdt:\nhttps://{host}/reset?token=…\n\nBug-klasse → LLZ{host_header_poison}"
      },
      "sqli-logic": {
        "h3": "Hvilken payload?",
        "out": "Velg den klassiske tautologien brukt i string-bygde logins.",
        "ok": "Riktig tautologi-klasse. Flag: LLZ{or_1_equals_1}",
        "bad": "Ikke den klassiske login-tautologien."
      },
      "cmd-metachar": {
        "h3": "Farlige metategn",
        "sep": ";  kommando-separator",
        "pipe": "|  pipe",
        "chain": "&&  kjede",
        "sub": "$() / backticks  substitusjon",
        "out": "Marker alle breakouts. Forsvar: aldri shell=True med brukerinput.",
        "all": "Alle markert. Forsvarsflagg: LLZ{never_shell_user_input}",
        "partial": "{n}/4 breakouts markert."
      },
      "cors-wild": {
        "h3": "CORS-par-simulator",
        "go": "Evaluer",
        "starAcac": "Nettlesere avviser ACAO:* + credentials. Å reflektere Origin med ACAC er den ekte buggen.",
        "reflect": "Farlig: reflekterer vilkårlig Origin med credentials. Flag: LLZ{cors_reflect_origin}",
        "fixed": "Allowlistet origin — sunnere mønster.",
        "wild": "Wildcard uten credentials er ofte bevisst for offentlige APIer."
      },
      "open-redirect": {
        "h3": "Redirect-lab",
        "open": "Åpne target",
        "llc": "curl i LLC"
      },
      "ssrf-mind": {
        "h3": "URL-allowlist-quiz",
        "out": "Hvilken fetch er vanligvis trygg å allowliste?",
        "ok": "Partner-HTTPS er det fornuftige allowlist-valget. Flag-mindset: LLZ{block_link_local_meta}",
        "bad": "Blokker link-local, loopback og file://."
      },
      "path-traversal": {
        "h3": "Sti-normaliserer",
        "go": "Normaliser / avvis",
        "bad": "Avvist: inneholder ..\nForsvarsflagg: LLZ{normalize_and_reject_dotdot}",
        "ok": "Ser rent ut etter normalisering (demo)."
      },
      "report-quality": {
        "h3": "Sorter FLAG-rapportseksjonene",
        "help": "Klikk ↑ ↓ for å sortere: Findings · Log/steps · Adverse impact · Guidance fix",
        "G": "Guidance (fix-råd)",
        "F": "Findings summary",
        "A": "Adverse impact",
        "L": "Log / steg-for-steg PoC",
        "up": "Flytt opp",
        "down": "Flytt ned",
        "go": "Sjekk rekkefølge",
        "out": "Velg en rad, så flytt. Målorden: F L A G",
        "ok": "FLAG-orden låst. Send inn LLZ{flag_report_structure}",
        "cur": "Nå: {order} — trenger FLAG"
      },
      "cvss-feel": {
        "h3": "Scor dette scenariet",
        "scenario": "Stored XSS i et <b>autentisert admin</b>-panel (ingen unauth RCE).",
        "crit": "Critical — alltid maks",
        "high": "High — alvorlig, men ikke unauth RCE",
        "low": "Low — admins burde vite bedre",
        "info": "Informational — XSS er død",
        "out": "Ærlighet bygger hunter-kredibilitet.",
        "ok": "Ærlig High. Flag: LLZ{dont_inflate_cvss}",
        "bad": "Ikke oppblås — kredibilitet teller."
      },
      "csp-bypass-talk": {
        "h3": "CSP-token-highlighter",
        "go": "Finn svak token",
        "ok": "Svak token spotta. Flag: LLZ{unsafe_inline}"
      },
      "js-secrets": {
        "h3": "Bundle-review",
        "open": "Åpne app.bundle.js",
        "fetch": "Hent her",
        "llc": "curl i LLC"
      },
      "rate-limit": {
        "h3": "Login-throttle-demo",
        "go": "Forsøk login",
        "out": "Hamre stille og se throttle.",
        "ok": "429 Too Many Requests (demo). Flag: LLZ{throttle_auth_endpoints}",
        "try": "Forsøk #{n} godtatt (demo). Fortsett…"
      },
      "tls-old": {
        "h3": "Protokollvelger",
        "go": "Bruk policy",
        "out": "Slå av legacy. Behold moderne.",
        "ok": "Policy ren. Flag: LLZ{disable_legacy_tls}",
        "bad": "Slå av SSLv3/TLS1.0/1.1; behold 1.2+."
      },
      "default": {
        "h3": "Lab bench",
        "help": "Bruk body over og LLC for tooling."
      }
    },
    "free": {
      "tagline": "Tre gratis rotatorer — tjen LLT."
    }
  }
};

  window.LadenI18nContent = CONTENT;

  function localizeLab(c) {
    if (!c || !window.LadenI18n || LadenI18n.getLang() !== 'no') return c;
    var pack = (CONTENT.no && CONTENT.no.labs && CONTENT.no.labs[c.slug]) || null;
    if (!pack) return c;
    return Object.assign({}, c, pack);
  }

  function localizeTip(slug, fields) {
    fields = fields || {};
    if (!window.LadenI18n || LadenI18n.getLang() !== 'no') return fields;
    var pack = (CONTENT.no && CONTENT.no.tips && CONTENT.no.tips[slug]) || null;
    if (!pack) return fields;
    return Object.assign({}, fields, pack);
  }

  function specialHint(slug, fallback) {
    if (window.LadenI18n && LadenI18n.getLang() === 'no') {
      var h = CONTENT.no && CONTENT.no.special_hints && CONTENT.no.special_hints[slug];
      if (h) return h;
    }
    return fallback;
  }

  function widgetStr(slug, key, fallback) {
    if (!window.LadenI18n || LadenI18n.getLang() !== 'no') return fallback;
    var w = CONTENT.no && CONTENT.no.widgets && (CONTENT.no.widgets[slug] || CONTENT.no.widgets.default);
    if (w && w[key] != null) return w[key];
    return fallback;
  }

  function llcPack(slug) {
    if (!window.LadenI18n || LadenI18n.getLang() !== 'no') return null;
    return (CONTENT.no && CONTENT.no.llc && CONTENT.no.llc[slug]) || null;
  }

  if (window.LadenI18n) {
    LadenI18n.localizeLab = localizeLab;
    LadenI18n.localizeTip = localizeTip;
    LadenI18n.specialHint = specialHint;
    LadenI18n.widgetStr = widgetStr;
    LadenI18n.llcPack = llcPack;
  } else {
    window.LadenI18n = {
      getLang: function () { try { return localStorage.getItem('laden_lang') === 'no' ? 'no' : 'en'; } catch (e) { return 'en'; } },
      localizeLab: localizeLab,
      localizeTip: localizeTip,
      specialHint: specialHint,
      widgetStr: widgetStr,
      llcPack: llcPack
    };
  }

  // Re-attach helpers if i18n.js boots after this file
  document.addEventListener('DOMContentLoaded', function () {
    if (window.LadenI18n) {
      LadenI18n.localizeLab = localizeLab;
      LadenI18n.localizeTip = localizeTip;
      LadenI18n.specialHint = specialHint;
      LadenI18n.widgetStr = widgetStr;
      LadenI18n.llcPack = llcPack;
    }
  });
})();
