/* Caleb — mentor popup */
(function () {
  const DISCORD_SERVER_ID = '544175121364025346'; // set to enable Discord widget iframe
  const DISCORD_INVITE = 'https://discord.gg/BavZjwXp2';
  window.LADEN_DISCORD = { serverId: DISCORD_SERVER_ID, invite: DISCORD_INVITE };

  const OPEN_KEY = 'caleb_labs_open';
  const HISTORY_KEY = 'caleb_labs_history_v2';

  const INTENTS = [
    {
      keys: [/^(hi|hello|hey|yo|sup|hallo)\b/i, /\bhowdy\b/i],
      reply: (q) => {
        const name = calebDisplayName();
        const who = name === 'guest' ? '' : ', ' + name;
        return "Hey" + who + " — good to see you.\n\nI'm Caleb. I hang around Laden to unstick you when a lab gets weird. Ask me whatever: flags, where to click, a gentle nudge on XSS or JWT… your call.";
      }
    },
    {
      keys: [/\bhelp\b/i, /\bwhat can you\b/i, /\bcommands?\b/i, /\bwhat do you do\b/i],
      reply: "Happy to help. I'm best at:\n• getting you started without the overwhelm\n• flag format & how submit works\n• login / account stuff\n• soft hints (XSS, base64, JWT, robots, IDOR…)\n• Discord, store, reports, staying in scope\n\nIf you want a bigger spoil, just say **spoiler** — I'll lean in a bit harder."
    },
    {
      keys: [/who are you/i, /\bcaleb\b.*\byou\b/i, /what(?:'s| is) caleb/i],
      reply: "I'm Caleb — the mentor popup on Laden. Not a live human on the other end, but I try to talk like a friendly operator who already did the labs. Ask me like you'd ask a teammate on Discord."
    },
    {
      keys: [/thanks|thank you|thx|ty\b/i],
      reply: "Anytime. Go get that flag — I'm right here if you stall again."
    },
    {
      keys: [/how are you|how's it going|whats up|what's up/i],
      reply: "Doing alright — grids humming, flags waiting. You hunting something specific, or just poking around?"
    },
    {
      keys: [/flag format/i, /\bladen\{/i, /what(?:'s| is) the flag/i, /\bflags?\b/i],
      reply: "Flags look like this: `LLZ{something_here}`.\n\nAll lowercase, underscores are fine. When you find one, drop it into the submit box on the challenge (Challenges page for the free trio, or Labs when you're logged in). And yeah — don't paste real secrets into chat. Ever."
    },
    {
      keys: [/how (do i |to )?start/i, /\bbegin\b/i, /\bgetting started\b/i, /\bnewbie\b/i],
      reply: "Easy path, no pressure:\n\n1. Skim the ethics bit — only stuff you're allowed to touch.\n2. Try the **3 free challenges** on the homepage (or `/challenges/`) — they rotate, keep it fun.\n3. When you want the full board + XP, hit **Enter Labs** and make an account.\n4. Stuck? Ask me for a hint. Soft first; say **spoiler** if you want more.\n\nYou've got this."
    },
    {
      keys: [/lab login/i, /\blogin\b/i, /demo (account|cred)/i, /create account|register|sign ?up/i, /password reset|forgot/i],
      reply: "For a real account: open **Login** (top right) → Create — username, email, password. Same login works across Labs.\n\nForgot password? There's a reset flow on `/account/` (mails go to the outbox for now).\n\nOld demo names may still exist on Labs, but fresh accounts are the way — then your XP actually sticks."
    },
    {
      keys: [/\btracks?\b/i, /challenge board/i, /what labs/i, /24 challenge/i, /\bchallenges?\b/i],
      reply: "Two vibes:\n\n• **Challenges** (`/challenges/`) — the same 3 free ones as main. Light, loud, fun.\n• **Labs** (`/labs/`) — member HQ. Full board, tracks, XP, the works.\n\nBrowse as a guest on the free trio; log in when you want to submit and save progress."
    },
    {
      keys: [/\bllc\b/i, /\bterminal\b/i, /console/i],
      reply: "LLC is the little slide-up console (kali-lite tools). Toggle it from the nav or Ctrl+`. Handy for base64, hashes, quick curls — scoped to Laden. Still at `/terminal/` and in lab rooms — Oracle just took the top-nav slot."
    },
    {
      keys: [/\bllo\b/i, /\boracle\b/i, /what is (the )?oracle/i, /knowledge (page|channel)/i],
      reply: "LLO is the **Laden Labs Oracle** — `/oracle/`. GitHub is the force behind the search: you ask, the gateway proxies GitHub search (code / repos / issues), guests don't need a token. I'm the mentor voice on top — tap **Ask Caleb** on a hit and I'll help you read it."
    },
    {
      keys: [/suggest.*(quer|search|oracle)/i, /quer(y|ies) for (bug|hunt|xss|jwt)/i, /better (search|query)/i, /how do i search github/i, /how to search (xss|github)/i],
      reply: "Oracle query tips (ethical / public only):\n\n• Be specific: `XSS writeup language:markdown`, `JWT none alg`, `SSRF bypass`\n• Scope with qualifiers: `repo:owner/name`, `language:js`, `in:file path:README`\n• For hunting learning: pair the vulnerability name with `writeup`, `poc`, or `lab`\n• Switch tabs: **Code** for snippets, **Repos** for projects, **Issues** for discussions\n\nTry those suggestion chips on `/oracle/` — or tell me a topic and I'll craft a query."
    },
    {
      keys: [/interpret.*(oracle|hit|result|github)/i, /oracle hit:/i, /help me (read|interpret)/i, /what should i look for/i],
      reply: (q) => {
        const soft = "When you read an Oracle hit: (1) open the GitHub link, (2) check it's public knowledge / writeup — not a live target, (3) note the technique, (4) try the idea only on Laden Labs or authorized scope. Paste a title/path here if you want a tighter read.";
        if (/jwt/i.test(q)) return soft + "\n\nJWT angle: look for `alg`, `none`, forged claims, or decode helpers — then practice on the **jwt-none** lab, not random apps.";
        if (/xss/i.test(q)) return soft + "\n\nXSS angle: reflection vs stored, sinks, CSP. Soft practice lives in Laden Labs reflection rooms.";
        if (/ssrf/i.test(q)) return soft + "\n\nSSRF angle: URL fetchers, cloud metadata, allowlists — keep it in the SSRF lab.";
        return soft;
      }
    },
    {
      keys: [/github.*(search|token|rate)/i, /oracle.*(fail|error|rate)/i, /force behind/i],
      reply: "The Oracle talks to GitHub through Laden's gateway (`/labs/api/oracle/search`). Your browser never holds a GitHub token — guests can search. If you hit a rate shimmer, wait a minute. Empty results? Broaden the query or flip Code/Repos/Issues."
    },

    {
      keys: [/\bxss\b/i, /cross.?site/i, /alert\(/i],
      reply: (q) => gentleOrSpoiler(q,
        "XSS, soft nudge: look for anywhere your typing comes back as HTML. If the page reflects you raw, a tiny script-shaped thought is enough for this lab — think \"does my input land inside the page?\"",
        "Alright, stronger: on the reflection lab, drop something like `<script>alert(1)</script>` in the echo box. When it smells script + alert, it hands you the flag."
      )
    },
    {
      keys: [/base64|b64|not encryption/i],
      reply: (q) => gentleOrSpoiler(q,
        "Base64 isn't a lock — it's just a weird way to write the same bytes. See a long A–Za–z0–9+/= string? Decode it (`base64 -d`, LLC, or DevTools) and read what's underneath.",
        "Bigger spoil: try decoding `bGFkZW57YjY0X2lzX25vdF9zZWNyZXR9` — that should spit out a `LLZ{…}`."
      )
    },
    {
      keys: [/\bjwt\b/i, /alg.?none/i, /json web token/i],
      reply: (q) => gentleOrSpoiler(q,
        "JWTs are three chunks: header.payload.signature. Peek at the header's `alg`. A classic mess-up is `alg: none` with an empty sig — then anyone can mint claims. For the lab, decode the middle part and read it; don't stress crypto yet.",
        "Stronger: the demo token uses `alg: none`. Base64url-decode the payload — look for a `flag` field with `LLZ{jwt_…}`."
      )
    },
    {
      keys: [/robots\.?txt/i, /\brobots\b/i, /secret-path/i, /disallow/i],
      reply: (q) => gentleOrSpoiler(q,
        "Robots.txt is a treasure map people leave in public. Open it, read the Disallow lines, then actually visit those paths. Half the time the \"secret\" is just sitting there.",
        "Spoil mode: follow the Disallow target (secret path / backup style file) and read the flag inside."
      )
    },
    {
      keys: [/\bidor\b/i, /insecure direct/i, /object reference/i, /user.?id/i],
      reply: (q) => gentleOrSpoiler(q,
        "IDOR vibe: you can see *your* thing. What if you change the id to someone else's — does the app still say yes? Try bumping `?id=` (or whatever the lab uses) and watch the response.",
        "Spoil: on the IDOR mini-lab, request another user's id. If authz is missing, the body often leaks a `LLZ{…}`."
      )
    },
    {
      keys: [/hidden.?dir|directory|bak\b|\.bak/i],
      reply: (q) => gentleOrSpoiler(q,
        "Hidden dirs / backups: people leave `.bak`, old copies, guessable folders. Think \"what would I name a backup at 2am?\" Then try it.",
        "Spoil-ish: look for a classic `.bak` style path on that recon lab — the flag likes hiding in backup files."
      )
    },
    {
      keys: [/rot13|caesar|cipher/i],
      reply: (q) => gentleOrSpoiler(q,
        "ROT13 is the joke cipher that still shows up. Shift letters 13 places — or run it twice and you should be back where you started. LLC has a rot13 helper if you want.",
        "Spoil: apply ROT13 to the ciphertext on the Caesar warmup — the flag drops out in plain `LLZ{…}`."
      )
    },
    {
      keys: [/open.?redirect|next=|url=/i],
      reply: (q) => gentleOrSpoiler(q,
        "Open redirects: a `next=` / `url=` param that trusts whatever you pass. Fun for phishing demos; for the lab, read the learn text and find the defense-flavored flag.",
        "Spoil: the open-redirect lab keeps the flag on the page once you understand the bad pattern — you don't need to phish anyone."
      )
    },
    {
      keys: [/\bstore\b/i, /merch/i, /hoodie/i, /cart/i],
      reply: "Merch desk is `/store/` — hoodie, stickers, the usual. Cart's a demo; nobody's charging your card. Grab a sticker pack for the vibe if you want."
    },
    {
      keys: [/\bdiscord\b/i, /community/i, /invite/i],
      reply: () => {
        const inv = (window.LADEN_DISCORD && window.LADEN_DISCORD.invite) || DISCORD_INVITE;
        return "Come hang on Discord: " + inv + "\n\nSay hi, share writeups, keep spoilers tagged. We're friendlier when nobody ruins a lab for the next person.";
      }
    },
    {
      keys: [/ethic/i, /\bscope\b/i, /authoriz/i, /legal/i, /permission/i],
      reply: "Real talk: only test what you own or have **written** okay for. Proof of concept, not chaos. No pivoting off-scope. Laden is for learning the craft the right way — that's the whole point."
    },
    {
      keys: [/report/i, /writeup/i, /bug bounty/i],
      reply: "Good reports read like a calm teammate wrote them:\n\n1. Steps to reproduce\n2. Impact (why it matters)\n3. Fix idea\n4. Evidence (screenshot / short PoC)\n\nClear > dramatic. Spoilers behind tags on the forum. Programs remember who makes their life easy."
    },
    {
      keys: [/forum/i],
      reply: "Forum preview sits at `/forum/`. Inside Labs (after login) you get the fuller thread view. Introduce yourself, share notes, keep OpSec tidy."
    },
    {
      keys: [/hint/i, /stuck/i, /nudge/i, /clue/i],
      reply: "Tell me which lab or topic — XSS, base64, JWT, robots, IDOR, ROT13, redirect… I'll give a soft nudge first. Add the word **spoiler** if you want me to be less coy."
    },
    {
      keys: [/bye|goodbye|see ya|cya|later/i],
      reply: "Catch you later. Hunt clean — I'll be here when you're back."
    },
    {
      keys: [/openclaw|websocket|gateway/i],
      reply: "I'm the local mentor now — keyword matching, always on. The old live claw gateway isn't in the loop on this shell. Still happy to talk labs with you though."
    }
  ];

  function gentleOrSpoiler(q, gentle, spoiler) {
    if (/\bspoiler\b/i.test(q)) {
      return spoiler + "\n\nNo shame in the spoil — use it, then try the next one without me.";
    }
    return gentle + "\n\nWant me to be less subtle? Say **spoiler**.";
  }

  function matchReply(text) {
    const q = (text || '').trim();
    if (!q) return "I'm listening — type something, or tap a chip below.";
    for (const intent of INTENTS) {
      if (intent.keys.some(re => re.test(q))) {
        const r = intent.reply;
        return typeof r === 'function' ? r(q) : r;
      }
    }
    return "Hmm, I didn't quite catch that.\n\nTry something like \"How do I start?\", \"Flag format\", \"Lab login\", or a topic — XSS, JWT, base64, robots, IDOR. Or just say hi again and we'll reset.";
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatMsg(text) {
    return esc(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  let panel, msgs, input, fab;

  function saveOpen(v) {
    try { sessionStorage.setItem(OPEN_KEY, v ? '1' : '0'); } catch (_) {}
  }
  function wasOpen() {
    try { return sessionStorage.getItem(OPEN_KEY) === '1'; } catch (_) { return false; }
  }

  function pushMsg(role, text) {
    const m = el('div', 'caleb-msg ' + role, formatMsg(text));
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    try {
      const hist = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
      hist.push({ role, text });
      while (hist.length > 40) hist.shift();
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    } catch (_) {}
  }


  function calebDisplayName() {
    try {
      const t = localStorage.getItem('laden_v12_token');
      if (t) {
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const u = p.usr || p.username;
        if (u) return u;
      }
    } catch {}
    try {
      const nick = (sessionStorage.getItem('laden_guest_nick') || '').trim();
      if (nick) return nick;
    } catch {}
    return 'guest';
  }

  function calebGreeting() {
    const name = calebDisplayName();
    const onOracle = /\/oracle\/?$/i.test(location.pathname);
    if (onOracle) {
      const who = name === 'guest' ? '' : ', ' + name;
      return "Hey" + who + " — Oracle channel.\n\nGitHub answers underneath; I help you aim the query and read the hits. Tap a chip, or hit **Ask Caleb** on a result.";
    }
    if (name === 'guest') {
      return "Hey — welcome in.\n\nI'm Caleb, your mentor on Laden. Ask me anything about the labs, or tap a chip below. No rush.";
    }
    return "Hey " + name + " — good to see you.\n\nI'm Caleb. Stuck on a lab, need a flag format reminder, or just saying hi? I'm here.";
  }

  function restoreHistory() {
    try {
      const hist = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
      if (!hist.length) {
        pushMsg('bot', calebGreeting());
        return;
      }
      hist.forEach(h => {
        const m = el('div', 'caleb-msg ' + h.role, formatMsg(h.text));
        msgs.appendChild(m);
      });
      msgs.scrollTop = msgs.scrollHeight;
    } catch (_) {
      pushMsg('bot', calebGreeting());
    }
  }

  function labAudio() {
    return window.__ladenLabAudio || null;
  }
  function syncMuteButton() {
    const btn = panel && panel.querySelector('[data-caleb-mute]');
    if (!btn) return;
    const api = labAudio();
    const muted = !!(api && typeof api.isMuted === 'function' && api.isMuted());
    btn.textContent = muted ? 'Unmute' : 'Mute';
    btn.setAttribute('data-ask', muted ? 'unmute' : 'mute');
  }
  function handleMusic(raw) {
    const q = String(raw || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!q) return false;
    const down = /(volume down|quieter|softer|lower the volume|turn it down|skru ned|lavere|svakere)/.test(q);
    const up = !down && /(volume up|louder|higher volume|turn it up|skru opp|høyere|hoyere|sterkere)/.test(q);
    const muteAsk = /(^|\b)(mute|unmute|demp|lyd av|lyd på|skru av lyden|skru på lyden)(\b|$)/.test(q);
    const daycore = /(daycore|after dark)/.test(q);
    const other = /(jessica|other song|the other one|annen sang|andre sang|bytt sang|bytt spor|switch song|switch track)/.test(q);
    if (!(up || down || muteAsk || daycore || other)) return false;
    const api = labAudio();
    if (!api) {
      pushMsg('bot', 'Music is still loading.');
      return true;
    }
    if (up) pushMsg('bot', 'Volume ' + api.volumeUp() + '.');
    else if (down) pushMsg('bot', 'Volume ' + api.volumeDown() + '.');
    else if (muteAsk) {
      const nowMuted = api.toggleMute();
      pushMsg('bot', nowMuted ? 'Muted.' : 'Unmuted.');
    } else if (daycore) {
      api.playDaycore();
      pushMsg('bot', 'Daycore.');
    } else {
      const name = api.switchTrack();
      pushMsg('bot', name === 'jessica' ? 'Jessica.' : 'Daycore.');
    }
    syncMuteButton();
    return true;
  }
  function send(text) {
    const q = (text || input.value || '').trim();
    if (!q) return;
    input.value = '';
    pushMsg('user', q);
    if (handleMusic(q)) return;
    setTimeout(() => pushMsg('bot', matchReply(q)), 180);
  }

  function setCalebOpen(on) {
    try {
      document.body.classList.toggle('caleb-open', !!on);
      document.documentElement.classList.toggle('caleb-open', !!on);
      window.dispatchEvent(new CustomEvent('caleb-open', { detail: { open: !!on } }));
    } catch {}
  }
  function openPanel() {
    panel.classList.remove('hidden');
    saveOpen(true);
    setCalebOpen(true);
    input && input.focus();
  }
  function closePanel() {
    panel.classList.add('hidden');
    saveOpen(false);
    setCalebOpen(false);
  }
  function toggle() {
    if (panel.classList.contains('hidden')) openPanel();
    else closePanel();
  }

  function mount() {
    if (document.getElementById('caleb-labs-root')) return;

    const root = el('div', '', null);
    root.id = 'caleb-labs-root';

    fab = el('button', 'caleb-fab', null);
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open Caleb');
    fab.innerHTML = '<span class="caleb-avatar" aria-hidden="true">🤖<span class="caleb-online" title="Online"></span></span><span class="label">Caleb</span>';
    fab.addEventListener('click', toggle);

    panel = el('div', 'caleb-panel hidden', null);
    panel.innerHTML = `
      <div class="caleb-head">
        <div class="caleb-avatar" aria-hidden="true">🤖<span class="caleb-online" title="Online"></span></div>
        <div>
          <strong>Caleb</strong>
          <small class="caleb-status">online</small>
        </div>
        <button type="button" class="caleb-close" aria-label="Close">×</button>
      </div>
      <div class="caleb-sound" data-caleb-sound>
        <button type="button" data-ask="volume up">Up</button>
        <button type="button" data-ask="volume down">Down</button>
        <button type="button" data-caleb-mute data-ask="mute">Mute</button>
      </div>
      <div class="caleb-msgs" id="caleb-msgs"></div>
      <div class="caleb-chips" id="caleb-chips"></div>
      <div class="caleb-input-row">
        <input id="caleb-input" placeholder="Ask Caleb…" autocomplete="off" />
        <button type="button" id="caleb-send">Send</button>
      </div>`;

    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    msgs = panel.querySelector('#caleb-msgs');
    input = panel.querySelector('#caleb-input');
    panel.querySelector('.caleb-close').addEventListener('click', closePanel);
    panel.querySelector('#caleb-send').addEventListener('click', () => send());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });

    if (!document.getElementById('caleb-sound-style')) {
      const style = document.createElement('style');
      style.id = 'caleb-sound-style';
      style.textContent = '.caleb-sound{display:flex;gap:6px;padding:0 12px 8px}.caleb-sound button{flex:1;min-height:40px;border:1px solid rgba(0,229,255,.45);background:transparent;color:inherit;cursor:pointer;font:600 13px/1 inherit;letter-spacing:.04em;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.caleb-sound button:hover{background:rgba(0,229,255,.12)}';
      document.head.appendChild(style);
    }
    panel.querySelectorAll('[data-ask]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => { event.stopPropagation(); });
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleMusic(button.getAttribute('data-ask'));
      });
    });
    syncMuteButton();

    const onOracle = /\/oracle\/?$/i.test(location.pathname);
    const chips = onOracle ? [
      ['What is LLO?', 'What is LLO / the Oracle?'],
      ['Suggest queries', 'Suggest Oracle queries for bug hunting'],
      ['How to search XSS?', 'How do I search GitHub for XSS writeups?'],
      ['Interpret hits', 'Help me interpret Oracle results'],
      ['Flag format', 'Flag format']
    ] : [
      ['How do I start?', 'How do I start?'],
      ['Flag format', 'Flag format'],
      ['I\'m stuck', 'I\'m stuck'],
      ['Hint: base64', 'Hint: base64'],
      ['Discord', 'Discord']
    ];
    const chipBox = panel.querySelector('#caleb-chips');
    chips.forEach(([label, q]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => { openPanel(); send(q); });
      chipBox.appendChild(b);
    });

    restoreHistory();

    document.querySelectorAll('[data-caleb]').forEach(node => {
      node.addEventListener('click', (e) => {
        e.preventDefault();
        openPanel();
      });
      if (node.tagName === 'A') node.setAttribute('href', '#caleb-labs');
    });

    if (wasOpen()) openPanel();
  }

  window.CalebLabs = {
    isOpen() { return !!(panel && !panel.classList.contains('hidden')); },
    open: function () { if (panel) openPanel(); },
    close: function () { if (panel) closePanel(); },
    ask: function (text) {
      if (!panel) mount();
      openPanel();
      const q = (text || '').trim();
      if (q) setTimeout(() => send(q), 60);
    },
  };
  window.openCalebLabs = function (preset) {
    if (!panel) mount();
    openPanel();
    if (preset && String(preset).trim()) {
      setTimeout(() => send(String(preset).trim()), 60);
    }
  };

  // Discord widget helper for pages that include a slot
  window.renderDiscordSlot = function (selector) {
    const slot = document.querySelector(selector || '[data-discord-slot]');
    if (!slot) return;
    const id = (window.LADEN_DISCORD && window.LADEN_DISCORD.serverId) || '';
    const invite = (window.LADEN_DISCORD && window.LADEN_DISCORD.invite) || DISCORD_INVITE;
    if (id) {
      slot.innerHTML = `<iframe title="Discord" src="https://discord.com/widget?id=${encodeURIComponent(id)}&theme=dark" allowtransparency="true" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" data-discord-id="${esc(id)}"></iframe>`;
    } else {
      slot.innerHTML = `
        <div>
          <div class="discord-mark" style="margin:0 auto .7rem;width:44px;height:44px;border-radius:12px;background:var(--discord);display:grid;place-items:center;font-size:1.3rem">✈</div>
          <p style="color:var(--text);font-weight:600;margin-bottom:.35rem">Join the Laden Discord</p>
          <p class="muted" style="font-size:.85rem;margin-bottom:.8rem">Widget idle — set <code>DISCORD_SERVER_ID</code> to embed. Invite ready below.</p>
          <a class="btn btn-discord" href="${invite}" target="_blank" rel="noopener">discord.gg/BavZjwXp2</a>
        </div>`;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mount(); window.renderDiscordSlot(); });
  } else {
    mount();
    window.renderDiscordSlot();
  }
})();
