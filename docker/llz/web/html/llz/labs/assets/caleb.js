/* Caleb — mentor popup */
(function () {
  const DISCORD_SERVER_ID = '544175121364025346'; // set to enable Discord widget iframe
  const DISCORD_INVITE = 'https://discord.gg/BavZjwXp2';
  window.LADEN_DISCORD = { serverId: DISCORD_SERVER_ID, invite: DISCORD_INVITE };

  const OPEN_KEY = 'caleb_labs_open';
  const HISTORY_KEY = 'caleb_labs_history';

  const INTENTS = [
    {
      keys: [/^(hi|hello|hey|yo|sup|hallo)\b/i, /\bhowdy\b/i],
      reply: "Hey operator. I'm Caleb — your mentor. Ask about flags, tracks, lab login, or drop a topic like XSS / JWT / base64. Ethical only."
    },
    {
      keys: [/\bhelp\b/i, /\bwhat can you\b/i, /\bcommands?\b/i],
      reply: "I can help with: how to start, flag format, lab login, tracks overview, gentle hints (XSS, base64, JWT, robots, IDOR), store, Discord, report writing, and ethics/scope. Say **spoiler** if you want a stronger hint."
    },
    {
      keys: [/who are you/i, /\bcaleb\b.*\byou\b/i, /what(?:'s| is) caleb/i],
      reply: "I'm **Caleb** — mentor for Laden AS. Scripted hints so you can hunt anytime."
    },
    {
      keys: [/flag format/i, /\bladen\{/i, /what(?:'s| is) the flag/i, /\bflags?\b/i],
      reply: "Flags use the format `LLZ{...}` — lowercase, underscores ok. Submit them in Laden Labs after you find them. Never paste real client secrets into chat."
    },
    {
      keys: [/how (do i |to )?start/i, /\bbegin\b/i, /\bgetting started\b/i, /\bnewbie\b/i],
      reply: "Start path: 1) Skim ethics — authorized targets only. 2) Enter **Laden Labs** at `/labs/`. 3) Login with demo `operator` / `hunt-ethically`. 4) Pick an Easy track lab. 5) Ask me for a gentle hint if you stall."
    },
    {
      keys: [/lab login/i, /\blogin\b/i, /demo (account|cred)/i, /operator/i, /hunt-ethically/i],
      reply: "Laden Labs demo logins:\n• `operator` / `hunt-ethically`\n• `newbie` / `learn-first`\n• `caleb` / `openclaw-demo`\nGate is at `/labs/`. API stays at `/labs/api`."
    },
    {
      keys: [/\btracks?\b/i, /challenge board/i, /what labs/i, /24 challenge/i],
      reply: "Laden Labs packs ~24 challenges across tracks (web, auth, recon, crypto-lite, etc.). Filter by track in the side rail. Each card teaches a bug class, then asks for `LLZ{…}`."
    },
    {
      keys: [/\bxss\b/i, /cross.?site/i, /alert\(/i],
      reply: (q) => gentleOrSpoiler(q,
        "XSS hint: find a sink that echoes your input into HTML. Think reflected input → script context. Try a tiny payload conceptually — this demo rewards detecting `<script>` + `alert`.",
        "Spoiler-ish: in the Friendly Alert / echo lab, inject something like `<script>alert(1)</script>` into the echo box. The demo reveals the flag when it detects script+alert."
      )
    },
    {
      keys: [/base64|b64|not encryption/i],
      reply: (q) => gentleOrSpoiler(q,
        "Base64 hint: it's encoding, not a vault. If you see a long A–Za–z0–9+/= blob, decode it (`echo … | base64 -d` or DevTools).",
        "Spoiler-ish: decode `bGFkZW57YjY0X2lzX25vdF9zZWNyZXR9` — you'll get a `LLZ{…}` flag."
      )
    },
    {
      keys: [/\bjwt\b/i, /alg.?none/i, /json web token/i],
      reply: (q) => gentleOrSpoiler(q,
        "JWT hint: three base64url parts — header.payload.signature. Check the header `alg`. Classic fail: `alg: none` with an empty signature. Decode the payload (not verify) for the demo flag claim.",
        "Spoiler-ish: the demo token uses `alg: none`. Base64-decode the middle segment — look for a `flag` field with `LLZ{jwt_…}`."
      )
    },
    {
      keys: [/robots\.?txt/i, /\brobots\b/i, /secret-path/i, /disallow/i],
      reply: (q) => gentleOrSpoiler(q,
        "Robots hint: scanners read `robots.txt` / Disallow lines. Follow the path operators were told to hide — often a plain text file.",
        "Spoiler-ish: open the Disallow target (e.g. secret-path / backup) and read the flag inside."
      )
    },
    {
      keys: [/\bidor\b/i, /insecure direct/i, /object reference/i, /user.?id/i],
      reply: (q) => gentleOrSpoiler(q,
        "IDOR hint: change an object id you own to one you don't — and watch authorization. Try incrementing `?id=` or similar on the mini lab page.",
        "Spoiler-ish: on the IDOR mini-lab, request another user's id. The response should leak a `LLZ{…}` when authz is missing."
      )
    },
    {
      keys: [/\bstore\b/i, /merch/i, /hoodie/i, /cart/i],
      reply: "Store lives at `/store/` (and a strip on Home). Same cyber theme, localStorage cart, demo checkout — no real charges. Ask Caleb if a SKU looks weird; stickers ship faster than hoodies in jokes only."
    },
    {
      keys: [/\bdiscord\b/i, /community/i, /invite/i],
      reply: () => {
        const inv = (window.LADEN_DISCORD && window.LADEN_DISCORD.invite) || DISCORD_INVITE;
        const id = (window.LADEN_DISCORD && window.LADEN_DISCORD.serverId) || DISCORD_SERVER_ID;
        return id
          ? `Discord widget is wired (server ${id}). Join via ${inv} — keep spoilers behind tags.`
          : `Discord CTA is ready. Invite placeholder: ${inv} — set DISCORD_SERVER_ID in caleb.js to embed the official widget.`;
      }
    },
    {
      keys: [/ethic/i, /\bscope\b/i, /authoriz/i, /legal/i, /permission/i],
      reply: "Ethics first: only systems you own or have **written** permission to test. PoC not pwn — stop at proof. No pivoting without approval. Laden Labs is a learning gateway, not a free-for-all."
    },
    {
      keys: [/report/i, /writeup/i, /bug bounty/i],
      reply: "Report writing: Steps to reproduce → Impact → Suggested fix → Evidence (screens/PoC). Keep tone professional. Spoilers go behind tags on the forum. Clean reports earn trust — and retainers."
    },
    {
      keys: [/forum/i],
      reply: "Forum preview is at `/forum/`. Full threads + replies live inside Laden Labs after login (API-backed). Introduce yourself, tag writeups, keep OpSec clean."
    },
    {
      keys: [/openclaw|websocket|gateway/i],
      reply: "Caleb runs as a local mentor — keyword matching only. The old claw gateway URL is retired on this demo shell."
    }
  ];

  function gentleOrSpoiler(q, gentle, spoiler) {
    return /\bspoiler\b/i.test(q) ? spoiler : gentle + "\n\n(Say **spoiler** if you want a stronger nudge.)";
  }

  function matchReply(text) {
    const q = (text || '').trim();
    if (!q) return "Type something — or tap a chip below.";
    for (const intent of INTENTS) {
      if (intent.keys.some(re => re.test(q))) {
        const r = intent.reply;
        return typeof r === 'function' ? r(q) : r;
      }
    }
    return "Not sure I caught that. Try: How do I start? · Flag format · Lab login · Hint: base64 · Discord — or ask about XSS / JWT / robots / IDOR / ethics.";
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
      if (!t) return 'guest';
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return p.usr || p.username || 'guest';
    } catch { return 'guest'; }
  }

  function calebGreeting() {
    return 'Hey ' + calebDisplayName() + ',\n how can i assist ? ;)';
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

  function send(text) {
    const q = (text || input.value || '').trim();
    if (!q) return;
    input.value = '';
    pushMsg('user', q);
    setTimeout(() => pushMsg('bot', matchReply(q)), 180);
  }

  function openPanel() {
    panel.classList.remove('hidden');
    saveOpen(true);
    input && input.focus();
  }
  function closePanel() {
    panel.classList.add('hidden');
    saveOpen(false);
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

    const chips = [
      ['How do I start?', 'How do I start?'],
      ['Flag format', 'Flag format'],
      ['Lab login', 'Lab login'],
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

  window.openCalebLabs = function () {
    if (!panel) mount();
    openPanel();
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
