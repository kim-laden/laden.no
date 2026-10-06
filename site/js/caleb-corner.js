/* Corner control for the Laden business site. Scripted asks only.
   Volume, songs, visitor replies from a shared info bank, and an OS-matched
   persona (Caleb / MacGyver / Birman). No chat backend. OS stays on the client. */
(function () {
  'use strict';
  if (window.__ladenCalebCorner) return;
  window.__ladenCalebCorner = true;

  var path = (location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/llz' || path.indexOf('/llz/') === 0) return;
  if (path === '/levi' || path.indexOf('/levi/') === 0) return;
  if (path === '/demo/skarverakk' || path.indexOf('/demo/skarverakk/') === 0) return;
  if ((path === '/demo' || path.indexOf('/demo/') === 0) && path.indexOf('/demo/ladenv1.1') !== 0) return;

  var STORAGE_KEY = 'laden-bot-persona';
  var GREET_KEY = 'laden-caleb-greeted';
  var BANK_URL = '/js/bot/infobank.json';
  var PERSONA_URL = '/js/bot/personas.json';

  var state = {
    personaId: 'caleb',
    osFamily: 'unknown',
    bank: null,
    personas: null,
    topics: [],
    ready: false
  };

  function english() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  }

  function say(text) {
    var log = document.querySelector('#laden-caleb .caleb-log');
    if (!log) return;
    var line = document.createElement('p');
    line.textContent = text;
    log.appendChild(line);
    while (log.children.length > 5) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }

  function audio() {
    return window.__ladenBusinessAudio || null;
  }

  function reply(en, no) {
    say(english() ? en : no);
  }

  function detectOsFamily() {
    var platform = '';
    try {
      if (navigator.userAgentData && navigator.userAgentData.platform) {
        platform = String(navigator.userAgentData.platform);
      }
    } catch (e) {}
    var ua = '';
    try { ua = String(navigator.userAgent || ''); } catch (e2) {}
    var p = (platform || '').toLowerCase();
    var u = ua.toLowerCase();

    /* iPadOS often reports as Mac; touch points mark it as Apple tablet. */
    var touch = 0;
    try { touch = navigator.maxTouchPoints || 0; } catch (e3) {}
    if (/ipad|iphone|ipod/.test(u) || (p.indexOf('mac') >= 0 && touch > 1 && /mobile|safari/.test(u))) {
      return 'ios';
    }
    if (/android/.test(u) || p.indexOf('android') >= 0) return 'android';
    if (/win/.test(p) || /windows/.test(u)) return 'windows';
    if (/mac/.test(p) || /macintosh|mac os x/.test(u)) return 'mac';
    if (/linux/.test(p) || /linux/.test(u) || /cros/.test(u)) return 'linux';
    return 'unknown';
  }

  function readStoredPersona() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (v === 'caleb' || v === 'macgyver' || v === 'birman') return v;
    } catch (e) {}
    return null;
  }

  function writeStoredPersona(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
  }

  function mapOsToPersona(os) {
    var map = (state.personas && state.personas.map) || {
      linux: 'caleb', mac: 'macgyver', ios: 'macgyver',
      windows: 'birman', android: 'birman', unknown: 'caleb'
    };
    return map[os] || map.unknown || 'caleb';
  }

  function persona() {
    var bag = (state.personas && state.personas.personas) || {};
    return bag[state.personaId] || bag.caleb || {
      id: 'caleb', name: 'Caleb',
      greeting: {
        en: 'Caleb. We take the idea and ship the product. Have a look.',
        no: 'Caleb. Vi tar idéen og leverer produktet. Se deg rundt.'
      },
      whoami: {
        en: 'Caleb. We ship the product, not a pile of vendors.',
        no: 'Caleb. Vi leverer produktet, ikke en haug med leverandører.'
      },
      fallback: {
        en: 'I don\'t have that. Write post@laden.no.',
        no: 'Den har jeg ikke. Skriv til post@laden.no.'
      },
      ask_ph: { en: 'Ask Caleb', no: 'Spør Caleb' }
    };
  }

  function contactPath() {
    var p = state.bank && state.bank.paths && state.bank.paths.contact;
    if (p) return english() ? p.en : p.no;
    return english() ? '/en/contact/' : '/kontakt/';
  }

  function portfolioPath() {
    var p = state.bank && state.bank.paths && state.bank.paths.portfolio;
    if (p) return english() ? p.en : p.no;
    return english() ? '/en/portfolio/' : '/portefolje/';
  }

  function dashPath() {
    var p = state.bank && state.bank.paths && state.bank.paths.dash;
    if (p) return english() ? p.en : p.no;
    return english() ? '/en/portfolio/dash/' : '/portefolje/dash/';
  }

  function downloads() {
    return (state.bank && state.bank.downloads) || {};
  }

  function fill(text) {
    var d = downloads();
    return String(text || '')
      .replace(/DASH/g, dashPath())
      .replace(/PORT/g, portfolioPath())
      .replace(/CONTACT/g, contactPath())
      .replace(/docker_repo/g, d.docker_repo || 'https://github.com/kim-laden/ldash-docker')
      .replace(/docker_tar/g, d.docker_tar || 'https://github.com/kim-laden/ldash-docker/releases/download/v1.0/ldash-docker-1.0.tar.gz')
      .replace(/docker_local/g, d.docker_local || 'http://127.0.0.1:18084/docker/ldash/');
  }

  function osTip() {
    var tips = state.bank && state.bank.os_tips;
    if (!tips) return '';
    var key = state.osFamily;
    if (key === 'unknown') key = 'linux';
    var tip = tips[key];
    if (!tip) return '';
    return fill(english() ? tip.en : tip.no);
  }

  function compileTopics(bank) {
    var list = (bank && bank.topics) || [];
    var out = [];
    var i;
    for (i = 0; i < list.length; i++) {
      try {
        out.push({
          id: list[i].id,
          test: new RegExp(list[i].test, 'i'),
          en: list[i].en,
          no: list[i].no
        });
      } catch (err) {}
    }
    return out;
  }

  /* Built-in bank so first paint works if JSON is slow or blocked. */
  function builtinBank() {
    return {
      paths: {
        contact: { en: '/en/contact/', no: '/kontakt/' },
        portfolio: { en: '/en/portfolio/', no: '/portefolje/' },
        dash: { en: '/en/portfolio/dash/', no: '/portefolje/dash/' }
      },
      downloads: {
        macos: '/downloads/dash/Ldash-1.0-macOS-Setup.pkg',
        windows: '/downloads/dash/Ldash-1.0-Windows-Setup.exe',
        linux: '/downloads/dash/Ldash-1.0-Linux.tar.gz',
        android: '/downloads/dash/Ldash-1.0-Android.apk',
        docker_tar: 'https://github.com/kim-laden/ldash-docker/releases/download/v1.0/ldash-docker-1.0.tar.gz',
        docker_repo: 'https://github.com/kim-laden/ldash-docker',
        docker_local: 'http://127.0.0.1:18084/docker/ldash/'
      },
      os_tips: {
        linux: {
          en: 'For your Linux box: unpack Ldash-1.0-Linux.tar.gz and run sh linux/install.sh. Docker: docker_tar.',
          no: 'For Linux: pakk ut Ldash-1.0-Linux.tar.gz og kjør sh linux/install.sh. Docker: docker_tar.'
        },
        mac: {
          en: 'For Mac: Ldash-1.0-macOS-Setup.pkg (unsigned). No iPhone install file.',
          no: 'For Mac: Ldash-1.0-macOS-Setup.pkg (usignert). Ingen iPhone-fil.'
        },
        ios: {
          en: 'No iPhone install file for Ldash. On a Mac use the macOS package from DASH.',
          no: 'Ingen iPhone-fil for Ldash. På Mac: macOS-pakken fra DASH.'
        },
        windows: {
          en: 'For Windows: Ldash-1.0-Windows-Setup.exe (unsigned; SmartScreen may warn once).',
          no: 'For Windows: Ldash-1.0-Windows-Setup.exe (usignert; SmartScreen kan advare).'
        },
        android: {
          en: 'For Android: Ldash-1.0-Android.apk. Allow installs from this source.',
          no: 'For Android: Ldash-1.0-Android.apk. Tillat installasjon fra denne kilden.'
        }
      },
      topics: [
        { id: 'skarverakk', test: '\\b(skarverakk|festival)\\b',
          en: 'Skarverakk is a festival demo, not a finished product. Open it at /demo/skarverakk/.',
          no: 'Skarverakk er en festivaldemo, ikke et ferdig produkt. Åpne den på /demo/skarverakk/.' },
        { id: 'papirglider', test: '\\b(papirglider|papir|levi)\\b',
          en: 'PapirGlider Klubben is a browser club site at /levi/.',
          no: 'PapirGlider Klubben er en klubbside i nettleseren på /levi/.' },
        { id: 'labs', test: '\\b(lab\'?z|labs|llz|laden labs)\\b',
          en: 'Lab\'z is live at /llz. Browser-based. Gear prices in NOK; the cart does not charge.',
          no: 'Lab\'z er live på /llz. Nettleserbasert. Gear i NOK; kurven trekker ingenting.' },
        { id: 'ldash', test: '\\b(ldash|ladenops|dash|apk|iphone|nedlasting|download|installer)\\b',
          en: 'Ldash downloads are on DASH. Mac and Windows unsigned. No iPhone file. Docker: docker_repo.',
          no: 'Ldash-nedlastinger på DASH. Mac og Windows usignerte. Ingen iPhone-fil. Docker: docker_repo.' },
        { id: 'docker', test: '\\b(docker|compose|kali)\\b',
          en: 'Ldash Docker: docker_tar then compose up. Open docker_local. Kali/Debian ready.',
          no: 'Ldash Docker: docker_tar, deretter compose up. Åpne docker_local. Klar for Kali/Debian.' },
        { id: 'portfolio', test: '\\b(portef[oø]lje|portfolio|projects|prosjekt)\\b',
          en: 'Portfolio at PORT. Skarverakk is a demo. Lab\'z, PapirGlider and Ldash are live.',
          no: 'Portefølje på PORT. Skarverakk er demo. Lab\'z, PapirGlider og Ldash kjører.' },
        { id: 'price', test: '\\b(pris|price|prices|nok|kurv|cart|betaling|charge|cost|koster|kostnad|kost|hvor mye|how much)\\b',
          en: 'Client work has no package price here. Describe the need for a proposal. Lab\'z cart charges nothing.',
          no: 'Oppdrag har ingen pakkepris her. Beskriv behovet for tilbud. Lab\'z-kurven trekker ingenting.' },
        { id: 'location', test: '\\b(oslo|adresse|address|where are|hvor er|hvor holder|location|bes[oø]k)\\b',
          en: 'Oslo. Schweigaards gate 60 B, 0656 Oslo. post@laden.no or 994 49 677. Open 24/7.',
          no: 'Oslo. Schweigaards gate 60 B, 0656 Oslo. post@laden.no eller 994 49 677. Åpent 24/7.' },
        { id: 'courses', test: '\\b(kurs|course|courses|foredrag|talk|talks|oppl[æa]ring|training)\\b',
          en: 'Courses and talks on AI tools the team already pays for. Ask for a proposal, or post@laden.no.',
          no: 'Kurs og foredrag om AI-verktøy teamet allerede betaler for. Be om tilbud, eller post@laden.no.' },
        { id: 'contact', test: '\\b(start|tilbud|proposal|quote|kontakt|contact|kom i gang|get started|how do i|komme i gang|ring|e-?post|email|phone|telefon)\\b',
          en: 'Start with the problem or idea. Contact at CONTACT, or post@laden.no. Reply within a couple of hours. Open 24/7.',
          no: 'Start med problemet eller idéen. Kontakt på CONTACT, eller post@laden.no. Svar innen et par timer. Åpent 24/7.' },
        { id: 'about', test: '\\b(hva (gj[øo]r|lager|bygger)|what do you|what does laden|who is laden|hvem er laden|tjeneste|services|hosting|merkevare|brand|produkt|product|om laden|about laden|build|metode|method)\\b',
          en: 'Laden.no takes the idea to a finished product. Hosting, brand, site, app. Complete, stable, predictable. Edits after launch included in the service cost. Oslo. Org.nr 937 285 833. CEO Kim Engebakken.',
          no: 'Laden.no tar idéen til ferdig produkt. Hosting, merkevare, side, app. Komplett, stabilt, forutsigbart. Endringer etter lansering i tjenestekostnaden. Oslo. Org.nr 937 285 833. Daglig leder Kim Engebakken.' },
        { id: 'who', test: '^(hei|hello|hi|hey|hvem er du|who are you|hjelp|help)\\b',
          en: '__WHOAMI__', no: '__WHOAMI__' }
      ]
    };
  }

  function builtinPersonas() {
    return {
      map: {
        linux: 'caleb', mac: 'macgyver', ios: 'macgyver',
        windows: 'birman', android: 'birman', unknown: 'caleb'
      },
      personas: {
        caleb: {
          id: 'caleb', name: 'Caleb', accent: '#00ff9d',
          greeting: {
            en: 'Caleb. We take the idea and ship the product. Have a look. I\'m here if you want the short version.',
            no: 'Caleb. Vi tar idéen og leverer produktet. Se deg rundt. Jeg er her hvis du vil ha den korte versjonen.'
          },
          whoami: {
            en: 'Caleb — Linux side of Laden.no. We ship the product, not a pile of vendors. Ask how to start, or look around.',
            no: 'Caleb — Linux-siden av Laden.no. Vi leverer produktet, ikke en haug med leverandører. Spør hvordan du starter, eller se deg rundt.'
          },
          fallback: {
            en: 'I don\'t have that. Use Contact at CONTACT, or write post@laden.no.',
            no: 'Den har jeg ikke. Bruk Kontakt på CONTACT, eller skriv til post@laden.no.'
          },
          ask_ph: { en: 'Ask Caleb', no: 'Spør Caleb' }
        },
        macgyver: {
          id: 'macgyver', name: 'MacGyver', accent: '#5ac8fa',
          greeting: {
            en: 'MacGyver. Mac and iOS lane at Laden.no. Tell me what you need fixed or built — I\'ll keep it practical.',
            no: 'MacGyver. Mac- og iOS-sporet hos Laden.no. Si hva som skal fikses eller bygges — jeg holder det praktisk.'
          },
          whoami: {
            en: 'MacGyver — Mac and iOS at Laden.no. Practical fixes, clean handoff. Ask how to start, or browse the portfolio.',
            no: 'MacGyver — Mac og iOS hos Laden.no. Praktiske løsninger, ryddig overlevering. Spør hvordan du starter, eller se porteføljen.'
          },
          fallback: {
            en: 'Don\'t have that one. Contact at CONTACT, or post@laden.no — a person answers.',
            no: 'Den har jeg ikke. Kontakt på CONTACT, eller post@laden.no — et menneske svarer.'
          },
          ask_ph: { en: 'Ask MacGyver', no: 'Spør MacGyver' }
        },
        birman: {
          id: 'birman', name: 'Birman', accent: '#a78bfa',
          greeting: {
            en: 'Birman. Windows and Android at Laden.no. Ask plainly — I\'ll answer in order.',
            no: 'Birman. Windows og Android hos Laden.no. Spør rett fram — jeg svarer i rekkefølge.'
          },
          whoami: {
            en: 'Birman — Windows and Android at Laden.no. Methodical build and support. Ask how to start, or look around.',
            no: 'Birman — Windows og Android hos Laden.no. Metodisk bygging og støtte. Spør hvordan du starter, eller se deg rundt.'
          },
          fallback: {
            en: 'Not in my notes. Use Contact at CONTACT, or write post@laden.no.',
            no: 'Ikke i notatene mine. Bruk Kontakt på CONTACT, eller skriv til post@laden.no.'
          },
          ask_ph: { en: 'Ask Birman', no: 'Spør Birman' }
        }
      }
    };
  }

  function applyPersonaChrome() {
    var p = persona();
    var en = english();
    var root = document.getElementById('laden-caleb');
    if (!root) return;
    var name = p.name || 'Caleb';
    var strong = root.querySelector('.caleb-head strong');
    if (strong) strong.textContent = name;
    var fabSpan = root.querySelector('.caleb-fab span');
    if (fabSpan) fabSpan.textContent = name;
    var label = root.querySelector('label[for="caleb-q"]');
    var ph = (p.ask_ph && (en ? p.ask_ph.en : p.ask_ph.no)) || (en ? 'Ask ' + name : 'Spør ' + name);
    if (label) label.textContent = ph;
    var input = root.querySelector('#caleb-q');
    if (input) input.setAttribute('placeholder', ph);
    if (p.accent) {
      try { root.style.setProperty('--laden-bot-accent', p.accent); } catch (e) {}
      if (strong) strong.style.color = p.accent;
      if (fabSpan) {
        /* Keep FAB monochrome for brand; accent only on name in panel. */
      }
    }
    var sel = root.querySelector('[data-bot-persona]');
    if (sel && sel.value !== state.personaId) sel.value = state.personaId;
  }

  function ensurePersonaToggle(root) {
    if (root.querySelector('[data-bot-persona]')) return;
    var head = root.querySelector('.caleb-head');
    if (!head) return;
    var en = english();
    var wrap = document.createElement('label');
    wrap.className = 'caleb-persona';
    wrap.innerHTML =
      '<span class="sr-only">' + (en ? 'Agent' : 'Agent') + '</span>' +
      '<select data-bot-persona aria-label="' + (en ? 'Choose agent' : 'Velg agent') + '">' +
        '<option value="caleb">Caleb</option>' +
        '<option value="macgyver">MacGyver</option>' +
        '<option value="birman">Birman</option>' +
      '</select>';
    var x = head.querySelector('.caleb-x');
    if (x) head.insertBefore(wrap, x);
    else head.appendChild(wrap);
    var sel = wrap.querySelector('select');
    sel.value = state.personaId;
    sel.addEventListener('change', function () {
      var id = sel.value;
      if (id !== 'caleb' && id !== 'macgyver' && id !== 'birman') return;
      state.personaId = id;
      writeStoredPersona(id);
      applyPersonaChrome();
      var p = persona();
      say(en
        ? ('Switched to ' + p.name + '.')
        : ('Byttet til ' + p.name + '.'));
    });
  }

  function handle(raw) {
    var q = String(raw || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!q) return;
    var api = audio();
    var down = /(volume down|quieter|softer|lower the volume|turn it down|skru ned|lavere|svakere)/.test(q);
    var up = !down && /(volume up|louder|higher volume|turn it up|skru opp|høyere|hoyere|sterkere)/.test(q);
    var muteAsk = /(^|\b)(mute|unmute|demp|lyd av|lyd på|skru av lyden|skru på lyden)(\b|$)/.test(q);
    var daycore = /(daycore|after dark)/.test(q);
    var other = /(jessica|other song|the other one|annen sang|andre sang|bytt sang|bytt spor|switch song|switch track)/.test(q);
    if (up || down || muteAsk || daycore || other) {
      if (!api) {
        reply('Music is still loading.', 'Musikken laster fortsatt.');
        return;
      }
      if (up) {
        say((english() ? 'Volume ' : 'Volum ') + api.volumeUp() + '.');
        syncMuteButton();
        return;
      }
      if (down) {
        say((english() ? 'Volume ' : 'Volum ') + api.volumeDown() + '.');
        syncMuteButton();
        return;
      }
      if (muteAsk) {
        var nowMuted = api.toggleMute();
        say(english() ? (nowMuted ? 'Muted.' : 'Unmuted.') : (nowMuted ? 'Dempet.' : 'Lyd på.'));
        syncMuteButton();
        return;
      }
      if (daycore) {
        api.playDaycore();
        say('Daycore.');
        return;
      }
      var name = api.switchTrack();
      say(name === 'jessica' ? 'Jessica.' : 'Daycore.');
      return;
    }
    var i;
    var topics = state.topics.length ? state.topics : compileTopics(builtinBank());
    for (i = 0; i < topics.length; i++) {
      if (topics[i].test.test(q)) {
        var enText = topics[i].en;
        var noText = topics[i].no;
        if (enText === '__WHOAMI__' || noText === '__WHOAMI__') {
          var p = persona();
          reply(p.whoami.en, p.whoami.no);
          return;
        }
        var bodyEn = fill(enText);
        var bodyNo = fill(noText);
        if (topics[i].id === 'ldash' || topics[i].id === 'docker') {
          var tip = osTip();
          if (tip) {
            bodyEn = bodyEn + ' ' + tip;
            bodyNo = bodyNo + ' ' + tip;
          }
        }
        reply(bodyEn, bodyNo);
        return;
      }
    }
    var fb = persona().fallback;
    reply(fill(fb.en), fill(fb.no));
  }

  if (!document.getElementById('laden-caleb-style')) {
    var style = document.createElement('style');
    style.id = 'laden-caleb-style';
    style.textContent = [
      '#laden-caleb{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:80;font:500 14px/1.35 Inter,sans-serif;color:#FAEED8}',
      '#laden-caleb .caleb-fab{min-height:32px;padding:0 11px;border:1px solid #FAEED8;background:#000;color:#FAEED8;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-size:12px}',
      '#laden-caleb .caleb-fab:hover,#laden-caleb .caleb-fab[aria-expanded="true"]{background:#FAEED8;color:#000}',
      '#laden-caleb .caleb-panel{position:absolute;right:0;bottom:48px;width:min(300px,calc(100vw - 32px));min-height:183px;background:#000;border:1px solid #FAEED8;padding:12px}',
      '#laden-caleb .caleb-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:6px}',
      '#laden-caleb .caleb-head strong{flex:1;min-width:0}',
      '#laden-caleb .caleb-persona{display:flex;align-items:center;margin:0}',
      '#laden-caleb .caleb-persona select{appearance:none;-webkit-appearance:none;background:#000;color:#FAEED8;border:1px solid #FAEED8;font:500 10px/1 Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;padding:3px 6px;cursor:pointer;max-width:7.5rem}',
      '#laden-caleb .caleb-persona select:hover,#laden-caleb .caleb-persona select:focus{background:#FAEED8;color:#000;outline:0}',
      '#laden-caleb .caleb-x{background:transparent;color:#FAEED8;border:0;font-size:18px;cursor:pointer;line-height:1}',
      '#laden-caleb .caleb-log{min-height:2.6em;max-height:9.5em;overflow:auto;margin:0 0 8px;color:#cfcfcf;font-size:13px}',
      '#laden-caleb .caleb-log p{margin:0 0 4px}',
      '#laden-caleb .caleb-actions{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}',
      '#laden-caleb .caleb-actions button{border:1px solid #FAEED8;background:#000;color:#FAEED8;min-height:44px;min-width:44px;padding:0 12px;cursor:pointer;font-size:13px;letter-spacing:.03em;line-height:1;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
      '#laden-caleb .caleb-ask button{border:1px solid #FAEED8;background:#000;color:#FAEED8;height:22px;min-height:22px;padding:0 7px;cursor:pointer;font-size:11px;line-height:1}',
      '#laden-caleb .caleb-actions button:hover,#laden-caleb .caleb-ask button:hover{background:#FAEED8;color:#000}',
      '#laden-caleb .caleb-ask{display:flex;gap:6px}',
      '#laden-caleb .caleb-ask input{flex:1;min-width:0;width:0;height:22px;min-height:22px;background:#000;color:#FAEED8;border:1px solid #FAEED8;padding:0 7px;font-size:11px;line-height:1}',
      '#laden-caleb .caleb-x:hover{color:#000;background:#FAEED8}',
      '#laden-caleb .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}'
    ].join('');
    document.head.appendChild(style);
  }

  function greetedAlready() {
    try { return sessionStorage.getItem(GREET_KEY) === '1'; } catch (e) { return false; }
  }

  function markGreeted() {
    try { sessionStorage.setItem(GREET_KEY, '1'); } catch (e) {}
  }

  function syncMuteButton() {
    var btn = document.querySelector('#laden-caleb [data-caleb-mute]');
    if (!btn) return;
    var api = audio();
    var muted = api && typeof api.isMuted === 'function' ? api.isMuted() : false;
    var en = english();
    btn.textContent = muted ? (en ? 'Unmute' : 'Lyd') : (en ? 'Mute' : 'Demp');
    btn.setAttribute('data-ask', muted ? 'unmute' : 'mute');
  }

  function mount() {
    var en = english();
    var root = document.getElementById('laden-caleb');
    if (!root) {
      root = document.createElement('div');
      root.id = 'laden-caleb';
      root.innerHTML =
        '<div class="caleb-panel" hidden>' +
          '<div class="caleb-head"><strong>Caleb</strong>' +
            '<button type="button" class="caleb-x" aria-label="' + (en ? 'Close' : 'Lukk') + '">×</button></div>' +
          '<div class="caleb-log" aria-live="polite"></div>' +
          '<div class="caleb-actions">' +
            '<button type="button" data-ask="volume up">' + (en ? 'Up' : 'Opp') + '</button>' +
            '<button type="button" data-ask="volume down">' + (en ? 'Down' : 'Ned') + '</button>' +
            '<button type="button" data-ask="mute" data-caleb-mute>' + (en ? 'Mute' : 'Demp') + '</button>' +
          '</div>' +
          '<form class="caleb-ask">' +
            '<label class="sr-only" for="caleb-q">' + (en ? 'Ask Caleb' : 'Spør Caleb') + '</label>' +
            '<input id="caleb-q" name="q" autocomplete="off" maxlength="160" placeholder="' + (en ? 'Ask Caleb' : 'Spør Caleb') + '">' +
            '<button type="submit">' + (en ? 'Send' : 'Send') + '</button>' +
          '</form>' +
        '</div>' +
        '<button type="button" class="caleb-fab" aria-expanded="false">' +
          '<span>Caleb</span></button>';
      document.body.appendChild(root);
    }
    if (root.getAttribute('data-caleb-wired') === '1') {
      applyPersonaChrome();
      return;
    }
    root.setAttribute('data-caleb-wired', '1');
    ensurePersonaToggle(root);
    applyPersonaChrome();
    var panel = root.querySelector('.caleb-panel');
    var fab = root.querySelector('.caleb-fab');
    var hold = false;
    var collapseTimer = null;
    var greeting = true;
    function setOpen(on) {
      panel.hidden = !on;
      fab.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on && !greeting) {
        var input = root.querySelector('#caleb-q');
        if (input) input.focus();
      }
    }
    function armCollapse() {
      if (collapseTimer) clearTimeout(collapseTimer);
      collapseTimer = setTimeout(function () {
        collapseTimer = null;
        if (hold) return;
        var input = root.querySelector('#caleb-q');
        if (input && input.value) return;
        setOpen(false);
      }, 4500);
    }
    root.addEventListener('pointerenter', function () {
      hold = true;
      if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }
    });
    root.addEventListener('pointerleave', function () {
      hold = false;
    });
    fab.addEventListener('click', function () {
      if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }
      setOpen(panel.hidden);
    });
    root.querySelector('.caleb-x').addEventListener('click', function () {
      if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }
      setOpen(false);
    });
    var lastAskAt = 0;
    root.querySelectorAll('[data-ask]').forEach(function (button) {
      button.addEventListener('pointerdown', function (event) {
        event.stopPropagation();
      });
      button.addEventListener('click', function () {
        var now = Date.now();
        if (now - lastAskAt < 50) return;
        lastAskAt = now;
        handle(button.getAttribute('data-ask'));
        syncMuteButton();
      });
    });
    syncMuteButton();
    root.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      var input = root.querySelector('#caleb-q');
      handle(input.value);
      input.value = '';
    });
    if (!greetedAlready()) {
      setOpen(true);
      var p = persona();
      say(en ? p.greeting.en : p.greeting.no);
      markGreeted();
      armCollapse();
    }
    greeting = false;
  }

  function boot() {
    state.osFamily = detectOsFamily();
    state.personas = builtinPersonas();
    state.bank = builtinBank();
    state.topics = compileTopics(state.bank);
    var stored = readStoredPersona();
    state.personaId = stored || mapOsToPersona(state.osFamily);
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);

    function mergeRemote(bank, personas) {
      if (bank) {
        state.bank = bank;
        state.topics = compileTopics(bank);
      }
      if (personas) {
        state.personas = personas;
        if (!readStoredPersona()) {
          state.personaId = mapOsToPersona(state.osFamily);
        }
        applyPersonaChrome();
      }
      state.ready = true;
    }

    var bankP = fetch(BANK_URL, { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    var personaP = fetch(PERSONA_URL, { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    Promise.all([bankP, personaP]).then(function (pair) {
      mergeRemote(pair[0], pair[1]);
    });
  }

  boot();
})();
