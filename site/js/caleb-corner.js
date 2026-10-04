/* Corner control for the Laden business site. Scripted asks only.
   Volume, songs, and a short set of visitor replies. No chat backend. */
(function () {
  'use strict';
  if (window.__ladenCalebCorner) return;
  window.__ladenCalebCorner = true;

  var path = (location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/llz' || path.indexOf('/llz/') === 0) return;
  if (path === '/levi' || path.indexOf('/levi/') === 0) return;
  if (path === '/demo/skarverakk' || path.indexOf('/demo/skarverakk/') === 0) return;
  if ((path === '/demo' || path.indexOf('/demo/') === 0) && path.indexOf('/demo/ladenv1.1') !== 0) return;

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

  function contactPath() {
    return english() ? '/en/contact/' : '/kontakt/';
  }

  function portfolioPath() {
    return english() ? '/en/portfolio/' : '/portefolje/';
  }

  function dashPath() {
    return english() ? '/en/portfolio/dash/' : '/portefolje/dash/';
  }

  var topics = [
    {
      test: /\b(skarverakk|festival)\b/,
      en: 'Skarverakk is a festival demo, not a finished product. Open it at /demo/skarverakk/.',
      no: 'Skarverakk er en festivaldemo, ikke et ferdig produkt. Åpne den på /demo/skarverakk/.'
    },
    {
      test: /\b(papirglider|papir|levi)\b/,
      en: 'PapirGlider Klubben is live at /levi/. A club site for precise folds and long glides.',
      no: 'PapirGlider Klubben er live på /levi/. Klubbside for presise folder og lange glideflukter.'
    },
    {
      test: /\b(lab'?z|labs|llz|laden labs)\b/,
      en: 'Lab\'z is live at /llz. Labs, forum and gear for ethical practice. Gear prices are in NOK. The cart does not charge.',
      no: 'Lab\'z er live på /llz. Labs, forum og gear for etisk øving. Gear-prisene er i NOK. Kurven trekker ingenting.'
    },
    {
      test: /\b(ldash|ladenops|dash|android|apk|iphone|nedlasting|download)\b/,
      en: 'Ldash downloads are on ' + 'DASH' + '. Mac, Windows, Linux and Android. No iPhone install file. Apple\'s terms block a normal download, so that one is the open-source code.',
      no: 'Ldash-nedlastingene ligger på ' + 'DASH' + '. Mac, Windows, Linux og Android. Ingen iPhone-fil. Apples vilkår sperrer en vanlig nedlasting, så den er åpen kildekode.'
    },
    {
      test: /\b(portef[oø]lje|portfolio|projects|prosjekt)\b/,
      en: 'Portfolio is at PORT. Skarverakk is a demo. Lab\'z, PapirGlider and Ldash are live. Ldash downloads are on the Ldash page.',
      no: 'Porteføljen er på PORT. Skarverakk er en demo. Lab\'z, PapirGlider og Ldash kjører. Ldash lastes ned fra Ldash-siden.'
    },
    {
      test: /\b(pris|price|prices|nok|kurv|cart|betaling|charge|cost|koster|kostnad|kost|hvor mye|how much)\b/,
      en: 'Client work has no package price. Describe the need and you get a proposal. Lab\'z gear is listed in NOK, and that cart is a demo. Nothing is charged.',
      no: 'Oppdrag har ingen pakkepris. Beskriv behovet, så får du et tilbud. Gear i Lab\'z står i NOK, og den kurven er en demo. Ingenting trekkes.'
    },
    {
      test: /\b(oslo|adresse|address|where are|hvor er|hvor holder|location|bes[oø]k)\b/,
      en: 'Oslo. Schweigaards gate 60 B, 0656 Oslo. post@laden.no or 994 49 677. A person replies within a couple of hours. We are open 24/7.',
      no: 'Oslo. Schweigaards gate 60 B, 0656 Oslo. post@laden.no eller 994 49 677. Et menneske svarer innen et par timer. Vi er åpne 24/7.'
    },
    {
      test: /\b(kurs|course|courses|foredrag|talk|talks|oppl[æa]ring|training)\b/,
      en: 'Courses and talks on the AI tools a team already pays for. At your place or on screen. Ask for a course proposal, or write post@laden.no.',
      no: 'Kurs og foredrag om AI-verktøyene teamet allerede betaler for. Hos dere eller på skjerm. Be om et kursforslag, eller skriv til post@laden.no.'
    },
    {
      test: /\b(start|tilbud|proposal|quote|kontakt|contact|kom i gang|get started|how do i|komme i gang|ring|e-?post|email|phone|telefon)\b/,
      en: 'Start with the problem or the idea. Contact is at CONTACT. Or write post@laden.no. We reply within a couple of hours with a proposal, not a newsletter. We are open 24/7.',
      no: 'Start med problemet eller idéen. Kontakt er på CONTACT. Eller skriv til post@laden.no. Vi svarer innen et par timer med et tilbud, ikke et nyhetsbrev. Vi er åpne 24/7.'
    },
    {
      test: /\b(hva (gj[øo]r|lager|bygger)|what do you|what does laden|who is laden|hvem er laden|tjeneste|services|hosting|merkevare|brand|produkt|product|om laden|about laden|build)\b/,
      en: 'We take it from the idea to a finished product. Hosting, brand, website, app, and the thing that has to run. Oslo. You deal with us, not four vendors.',
      no: 'Vi tar det fra idé til ferdig produkt. Hosting, merkevare, nettside, app og det som skal kjøre. Oslo. Du forholder deg til oss, ikke fire leverandører.'
    },
    {
      test: /^(hei|hello|hi|hey|hvem er du|who are you|hjelp|help)\b/,
      en: 'Caleb. We ship the product, not a pile of vendors. Ask how to start, or have a look around.',
      no: 'Caleb. Vi leverer produktet, ikke en haug med leverandører. Spør hvordan du starter, eller se deg rundt.'
    }
  ];

  function fill(text) {
    return text
      .replace('DASH', dashPath())
      .replace('PORT', portfolioPath())
      .replace('CONTACT', contactPath());
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
    for (i = 0; i < topics.length; i++) {
      if (topics[i].test.test(q)) {
        reply(fill(topics[i].en), fill(topics[i].no));
        return;
      }
    }
    reply(
      'I don\'t have that. Use Contact at ' + contactPath() + ', or write post@laden.no.',
      'Den har jeg ikke. Bruk Kontakt på ' + contactPath() + ', eller skriv til post@laden.no.'
    );
  }

  if (!document.getElementById('laden-caleb-style')) {
    var style = document.createElement('style');
    style.id = 'laden-caleb-style';
    style.textContent = [
      '#laden-caleb{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:80;font:500 14px/1.35 Inter,sans-serif;color:#fff}',
      '#laden-caleb .caleb-fab{min-height:32px;padding:0 11px;border:1px solid #fff;background:#000;color:#fff;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-size:12px}',
      '#laden-caleb .caleb-fab:hover,#laden-caleb .caleb-fab[aria-expanded="true"]{background:#fff;color:#000}',
      '#laden-caleb .caleb-panel{position:absolute;right:0;bottom:48px;width:min(300px,calc(100vw - 32px));min-height:183px;background:#000;border:1px solid #fff;padding:12px}',
      '#laden-caleb .caleb-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}',
      '#laden-caleb .caleb-x{background:transparent;color:#fff;border:0;font-size:18px;cursor:pointer;line-height:1}',
      '#laden-caleb .caleb-log{min-height:2.6em;max-height:9.5em;overflow:auto;margin:0 0 8px;color:#cfcfcf;font-size:13px}',
      '#laden-caleb .caleb-log p{margin:0 0 4px}',
      '#laden-caleb .caleb-actions{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}',
      '#laden-caleb .caleb-actions button{border:1px solid #fff;background:#000;color:#fff;min-height:44px;min-width:44px;padding:0 12px;cursor:pointer;font-size:13px;letter-spacing:.03em;line-height:1;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
      '#laden-caleb .caleb-ask button{border:1px solid #fff;background:#000;color:#fff;height:22px;min-height:22px;padding:0 7px;cursor:pointer;font-size:11px;line-height:1}',
      '#laden-caleb .caleb-actions button:hover,#laden-caleb .caleb-ask button:hover{background:#fff;color:#000}',
      '#laden-caleb .caleb-ask{display:flex;gap:6px}',
      '#laden-caleb .caleb-ask input{flex:1;min-width:0;width:0;height:22px;min-height:22px;background:#000;color:#fff;border:1px solid #fff;padding:0 7px;font-size:11px;line-height:1}',
      '#laden-caleb .caleb-x:hover{color:#000;background:#fff}',
      '#laden-caleb .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}'
    ].join('');
    document.head.appendChild(style);
  }

  function greetedAlready() {
    try { return sessionStorage.getItem('laden-caleb-greeted') === '1'; } catch (e) { return false; }
  }

  function markGreeted() {
    try { sessionStorage.setItem('laden-caleb-greeted', '1'); } catch (e) {}
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
    if (document.getElementById('laden-caleb')) return;
    var en = english();
    var root = document.createElement('div');
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
        /* Same reason as the corner note: this tap must not resume playback
           before Mute can pause it. */
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
      say(en
        ? 'Caleb. We take the idea and ship the product. Have a look. I\'m here if you want the short version.'
        : 'Caleb. Vi tar idéen og leverer produktet. Se deg rundt. Jeg er her hvis du vil ha den korte versjonen.');
      markGreeted();
      armCollapse();
    }
    greeting = false;
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
