/* Laden Community — LLZ LabZocial, LabNewz, tips, discussions */
(function () {
  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';
  const GUEST_KEY = 'laden_community_guest_posts';
  const REACTS = ['👍', '🔥', '💀'];
  const TOPICS = [
    'general', 'nmap', 'msfconsole', 'aircrack-ng', 'wireshark',
    'burp', 'hydra', 'sqlmap', 'john', 'hashcat', 'gobuster', 'ffuf'
  ];

  const seeded = {
    nmap: [
      { author: 'caleb', body: 'Start with -sn for discovery, then -sC -sV on live hosts. Save -A for when you need OS detect + traceroute noise.', ts: '2026-09-20T10:00:00+02:00', seed: true },
      { author: 'nyx', body: 'Anyone got a favourite NSE script set for HTTP labs? I lean http-enum + http-title.', ts: '2026-09-22T15:30:00+02:00', seed: true },
    ],
    msfconsole: [
      { author: 'skugge', body: 'Reminder: workspace per lab. search → info → set options → check → run. Never spray exploits blind on shared ranges.', ts: '2026-09-21T12:00:00+02:00', seed: true },
    ],
    'aircrack-ng': [
      { author: 'øystein', body: 'Lab AP only. Capture handshake, crack offline with a wordlist you own. Neighbour Wi-Fi is out of scope forever.', ts: '2026-09-19T18:00:00+02:00', seed: true },
    ],
    wireshark: [
      { author: 'maven', body: 'Filter cheatsheet sticky: http.request.method == "POST" and tcp.port == 443. Follow TCP stream when the payload looks chopped.', ts: '2026-09-23T09:10:00+02:00', seed: true },
    ],
    burp: [
      { author: 'payload', body: 'Match-and-replace for session cookies across Repeater saves hours. Also: Logger++ for writeup receipts.', ts: '2026-09-24T11:45:00+02:00', seed: true },
    ],
    hydra: [
      { author: 'r0kk', body: 'Throttle (-t 4). Scope letter first. Lab login pages only unless you have a signed SOW.', ts: '2026-09-18T14:20:00+02:00', seed: true },
    ],
    sqlmap: [
      { author: 'haze', body: '--batch is fine in your box. Climb --level/--risk slowly. Dump only tables you need for the report.', ts: '2026-09-17T16:00:00+02:00', seed: true },
    ],
    general: [
      { author: 'caleb', body: 'Welcome to Community / LLZ LabZocial. Ethical only — authorized targets, spoilers tagged, Oslo vibes.', ts: '2026-09-16T08:00:00+02:00', seed: true },
    ],
  };

  let state = {
    tab: 'llz',
    topic: 'general',
    labnewz: [],
    tips: [],
    apiPosts: [],
    friends: { friends: [], incoming: [], outgoing: [] },
    user: null,
    openComments: {},
    commentsCache: {},
    online: [],
    searchHits: [],
  };

  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }

  function parseUser() {
    const t = token();
    if (!t) return null;
    try {
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (p.exp && p.exp * 1000 < Date.now()) return null;
      return { username: p.usr || p.username || 'member', id: p.sub };
    } catch { return null; }
  }

  function guestPosts() {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); } catch { return []; }
  }
  function saveGuestPosts(arr) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(arr.slice(0, 40)));
  }

  function fmtTime(iso) {
    try {
      const d = new Date(iso.includes('T') || iso.includes('Z') || iso.includes('+') ? iso : iso.replace(' ', 'T') + 'Z');
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Oslo',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d) + ' Oslo';
    } catch { return iso; }
  }

  function initials(name) {
    return String(name || '?').slice(0, 2).toUpperCase();
  }

  function profileUrl(username) {
    return '/community/u/' + encodeURIComponent(username || '') + '/';
  }

  function presenceClass(lastSeen) {
    if (!lastSeen) return '';
    try {
      const t = new Date(lastSeen.includes('T') || lastSeen.includes('Z') ? lastSeen : lastSeen.replace(' ', 'T') + 'Z').getTime();
      const ago = Date.now() - t;
      if (ago < 5 * 60 * 1000) return 'on';
      if (ago < 60 * 60 * 1000) return 'recent';
    } catch {}
    return '';
  }

  async function api(path, opts) {
    const headers = Object.assign({}, (opts && opts.headers) || {});
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    if (opts && opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const res = await fetch(API + path, Object.assign({}, opts || {}, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || res.statusText);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setTab(name) {
    state.tab = name;
    document.querySelectorAll('.comm-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === name);
    });
    document.querySelectorAll('.comm-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'panel-' + name);
    });
    if (name === 'llz') renderLlz();
    if (name === 'friends') renderFriends();
    if (name === 'discussions') renderDiscussions();
  }

  function renderLabNewz() {
    const root = document.getElementById('lln-grid');
    if (!root) return;
    const sorted = state.labnewz.slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
    root.innerHTML = sorted.map((a, i) => `
      <article class="lln-card${i === 0 ? ' feature' : ''}">
        <div class="lln-meta"><span class="by">${esc(a.byline || 'LLN')}</span>
          ${(a.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}
        </div>
        <h3>${esc(a.title)}</h3>
        <p class="lede">${esc(a.lede)}</p>
        <div class="lln-meta"><span>${fmtTime(a.ts)}</span></div>
      </article>
    `).join('');
  }

  function tipHref(t) {
    if (t.href) return t.href;
    if (t.slug) return '/tips/' + t.slug + '/';
    return '/tips/';
  }

  function renderTips() {
    const root = document.getElementById('tips-grid');
    if (!root) return;
    root.innerHTML = state.tips.map(t => `
      <a class="tip-card tip-card-link" href="${esc(tipHref(t))}">
        <div class="tool">${esc(t.tool)} · <span class="tag ${esc(t.level || 'easy')}">${esc(t.level || 'tip')}</span></div>
        <h3>${esc(t.title)}</h3>
        <p>${t.body}</p>
        <span class="tip-open">Open full guide →</span>
      </a>
    `).join('') + `
      <a class="tip-card tip-card-link tip-index-cta" href="/tips/">
        <div class="tool">index</div>
        <h3>All operator tips</h3>
        <p>Browse every guide on /tips/ — shareable URLs, related labs, Oracle queries, Ask Caleb.</p>
        <span class="tip-open">Open tips index →</span>
      </a>`;
  }

  function llzPosts() {
    return state.apiPosts.filter(p => ['llz', 'lls', 'feed', 'general'].includes(p.topic));
  }

  function renderLlz() {
    const root = document.getElementById('llz-stream');
    const nudge = document.getElementById('llz-nudge');
    if (nudge) {
      nudge.innerHTML = state.user
        ? ''
        : 'Guests can read. <a href="/account/">Login</a> to post, react &amp; friend.';
    }
    if (!root) return;
    const posts = llzPosts();
    if (!posts.length) {
      root.innerHTML = '<div class="empty-state">LLZ LabZocial is quiet — be the first signal.</div>';
      return;
    }
    root.innerHTML = posts.slice(0, 40).map(p => {
      const reactions = p.reactions || {};
      const mine = new Set(p.my_reactions || []);
      const pc = presenceClass(p.author_last_seen);
      const reactHtml = REACTS.map(e => {
        const n = reactions[e] || 0;
        return `<button type="button" class="react-btn${mine.has(e) ? ' on' : ''}" data-react="${esc(e)}" data-pid="${p.id}">${e}<span class="cnt">${n || ''}</span></button>`;
      }).join('');
      const open = !!state.openComments[p.id];
      const comments = state.commentsCache[p.id] || [];
      const commentHtml = open ? `
        <div class="comment-box" data-comments="${p.id}">
          ${comments.map(c => `<div class="comment-item"><span class="who">@${esc(c.author)}</span> ${esc(c.body)}</div>`).join('') || '<div class="muted-line">No comments yet.</div>'}
          ${state.user ? `<form class="comment-form" data-pid="${p.id}"><input maxlength="1000" placeholder="Comment…" required><button class="btn btn-ghost" type="submit">Send</button></form>` : '<div class="muted-line">Login to comment.</div>'}
        </div>` : '';
      return `
      <article class="feed-card${p.from_friend ? ' friend-boost' : ''}" data-pid="${p.id}">
        <div class="av user">${esc(initials(p.author))}</div>
        <div>
          <div class="kind">
            ${pc ? `<span class="presence ${pc}" title="presence"></span>` : ''}
            <a href="${profileUrl(p.author)}" style="color:inherit;text-decoration:none">@${esc(p.author)}</a>
            ${p.from_friend ? '<span class="friend-tag"> · friend</span>' : ''}
            · #${esc(p.topic || 'llz')}
          </div>
          <p style="color:var(--text);margin:.35rem 0">${esc(p.body)}</p>
          <div class="lln-meta"><span>${fmtTime(p.created_at)}</span></div>
          <div class="react-bar">
            ${reactHtml}
            <button type="button" class="comment-toggle" data-toggle-comments="${p.id}">💬 ${p.comment_count || 0}</button>
          </div>
          ${commentHtml}
        </div>
      </article>`;
    }).join('');

    root.querySelectorAll('[data-react]').forEach(btn => {
      btn.addEventListener('click', () => onReact(btn.dataset.pid, btn.dataset.react));
    });
    root.querySelectorAll('[data-toggle-comments]').forEach(btn => {
      btn.addEventListener('click', () => toggleComments(btn.dataset.toggleComments));
    });
    root.querySelectorAll('.comment-form').forEach(form => {
      form.addEventListener('submit', onComment);
    });
  }

  async function onReact(pid, emoji) {
    if (!state.user) {
      const st = document.getElementById('llz-status');
      if (st) st.textContent = 'Login to react.';
      return;
    }
    try {
      const data = await api('/community/posts/' + pid + '/react', {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      const post = state.apiPosts.find(p => String(p.id) === String(pid));
      if (post) {
        post.reactions = data.reactions || {};
        post.my_reactions = data.my_reactions || [];
      }
      renderLlz();
    } catch (e) {
      const st = document.getElementById('llz-status');
      if (st) st.textContent = (e.data && e.data.error) || 'React failed';
    }
  }

  async function toggleComments(pid) {
    state.openComments[pid] = !state.openComments[pid];
    if (state.openComments[pid] && !state.commentsCache[pid]) {
      try {
        const data = await api('/community/posts/' + pid + '/comments');
        state.commentsCache[pid] = data.comments || [];
      } catch {
        state.commentsCache[pid] = [];
      }
    }
    renderLlz();
  }

  async function onComment(ev) {
    ev.preventDefault();
    const form = ev.target;
    const pid = form.dataset.pid;
    const input = form.querySelector('input');
    const body = (input && input.value || '').trim();
    if (!body || !state.user) return;
    try {
      const data = await api('/community/posts/' + pid + '/comments', {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      if (!state.commentsCache[pid]) state.commentsCache[pid] = [];
      state.commentsCache[pid].push(data.comment);
      const post = state.apiPosts.find(p => String(p.id) === String(pid));
      if (post) post.comment_count = (post.comment_count || 0) + 1;
      if (input) input.value = '';
      renderLlz();
    } catch (e) {
      const st = document.getElementById('llz-status');
      if (st) st.textContent = (e.data && e.data.error) || 'Comment failed';
    }
  }

  async function submitLlz(ev) {
    ev.preventDefault();
    const ta = document.getElementById('llz-body');
    const body = (ta && ta.value || '').trim();
    const status = document.getElementById('llz-status');
    if (!body) return;
    if (!state.user) {
      if (status) status.textContent = 'Login required to post on LLZ LabZocial.';
      return;
    }
    try {
      const data = await api('/community/posts', {
        method: 'POST',
        body: JSON.stringify({ body, topic: 'llz' }),
      });
      if (data.post) state.apiPosts.unshift(data.post);
      if (ta) ta.value = '';
      if (status) status.textContent = 'Live on LLZ.';
      renderLlz();
    } catch (e) {
      if (status) status.textContent = (e.data && e.data.error) || 'Post failed';
    }
  }

  function collectTopicPosts(topic) {
    const seeds = (seeded[topic] || []).map(s => Object.assign({}, s, { topic }));
    const api = state.apiPosts.filter(p => p.topic === topic).map(p => ({
      id: p.id,
      author: p.author,
      body: p.body,
      created_at: p.created_at,
      topic: p.topic,
    }));
    const guests = guestPosts().filter(p => p.topic === topic);
    return seeds.concat(api).concat(guests).sort((a, b) =>
      new Date(b.created_at || b.ts) - new Date(a.created_at || a.ts)
    );
  }

  function renderTopicList() {
    const root = document.getElementById('topic-list');
    if (!root) return;
    root.innerHTML = TOPICS.map(t => `
      <button type="button" class="topic-btn${t === state.topic ? ' active' : ''}" data-topic="${esc(t)}">#${esc(t)}</button>
    `).join('');
    root.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.topic = btn.dataset.topic;
        renderDiscussions();
      });
    });
  }

  function renderDiscussions() {
    renderTopicList();
    const list = document.getElementById('post-list');
    const nudge = document.getElementById('compose-nudge');
    const who = document.getElementById('compose-who');
    if (who) {
      who.textContent = state.user
        ? 'Posting as @' + state.user.username
        : 'Guest mode — drafts stay local until you login';
    }
    if (nudge) {
      nudge.innerHTML = state.user
        ? ''
        : 'Members get real persistence via API. <a href="/account/">Login</a> to publish.';
    }
    const posts = collectTopicPosts(state.topic);
    if (!list) return;
    if (!posts.length) {
      list.innerHTML = '<div class="empty-state">No posts in #' + esc(state.topic) + ' yet. Be first.</div>';
      return;
    }
    list.innerHTML = posts.map(p => `
      <article class="post-item">
        <div class="who">@${esc(p.author)}${p.guest ? ' <span class="guest">(guest draft)</span>' : ''}${p.seed ? ' · seeded' : ''}</div>
        <div class="body">${esc(p.body)}</div>
        <div class="when">${fmtTime(p.created_at || p.ts)}</div>
      </article>
    `).join('');
  }

  async function submitPost(ev) {
    ev.preventDefault();
    const ta = document.getElementById('post-body');
    const body = (ta && ta.value || '').trim();
    const status = document.getElementById('compose-status');
    if (!body) return;
    if (body.length > 2000) {
      if (status) status.textContent = 'Max 2000 characters.';
      return;
    }
    if (state.user) {
      try {
        const data = await api('/community/posts', {
          method: 'POST',
          body: JSON.stringify({ body, topic: state.topic }),
        });
        if (data.post) state.apiPosts.unshift(data.post);
        if (ta) ta.value = '';
        if (status) status.textContent = 'Published to #' + state.topic;
        renderDiscussions();
        renderLlz();
      } catch (e) {
        if (status) status.textContent = (e.data && e.data.error) || 'Post failed — try login again.';
      }
      return;
    }
    const draft = {
      author: 'guest',
      body,
      topic: state.topic,
      ts: new Date().toISOString(),
      guest: true,
    };
    const arr = guestPosts();
    arr.unshift(draft);
    saveGuestPosts(arr);
    if (ta) ta.value = '';
    if (status) status.textContent = 'Saved locally. Login to publish for real.';
    renderDiscussions();
  }

  function presenceDot(ls) {
    const pc = presenceClass(ls);
    return pc ? `<span class="presence ${pc}"></span>` : '';
  }

  function renderFriends() {
    const gate = document.getElementById('friends-gate');
    const panel = document.getElementById('friends-panel');
    if (!state.user) {
      if (gate) { gate.classList.remove('hidden'); gate.textContent = 'Login to manage friends on LLZ LabZocial.'; }
      if (panel) panel.classList.add('hidden');
      return;
    }
    if (gate) gate.classList.add('hidden');
    if (panel) panel.classList.remove('hidden');
    const f = state.friends;
    const inc = document.getElementById('friends-incoming');
    const acc = document.getElementById('friends-accepted');
    const out = document.getElementById('friends-outgoing');
    if (inc) {
      inc.innerHTML = (f.incoming || []).length
        ? f.incoming.map(r => `
          <div class="friend-row">
            <span class="name">${presenceDot(r.last_seen)}@${esc(r.username)}</span>
            <span class="actions">
              <button type="button" class="btn btn-primary" data-accept="${r.id}" style="padding:.25rem .55rem;font-size:.75rem">Accept</button>
              <button type="button" class="btn btn-ghost" data-decline="${r.id}" style="padding:.25rem .55rem;font-size:.75rem">Nope</button>
            </span>
          </div>`).join('')
        : '<div class="empty-state" style="padding:.7rem;font-size:.8rem">No pending requests.</div>';
      inc.querySelectorAll('[data-accept]').forEach(b => b.addEventListener('click', () => acceptFriend(b.dataset.accept)));
      inc.querySelectorAll('[data-decline]').forEach(b => b.addEventListener('click', () => declineFriend(b.dataset.decline)));
    }
    if (acc) {
      acc.innerHTML = (f.friends || []).length
        ? f.friends.map(r => `
          <div class="friend-row">
            <span class="name">${presenceDot(r.last_seen)}<a href="${profileUrl(r.username)}" style="color:inherit;text-decoration:none">@${esc(r.username)}</a></span>
            <span class="actions">
              <a class="btn btn-ghost" style="padding:.15rem .45rem;font-size:.7rem" href="${profileUrl(r.username)}">Profile</a>
              <a class="btn btn-ghost" style="padding:.15rem .45rem;font-size:.7rem" href="/messages/?u=${encodeURIComponent(r.username)}">Message</a>
            </span>
          </div>`).join('')
        : '<div class="empty-state" style="padding:.7rem;font-size:.8rem">No friends yet — send a request.</div>';
    }
    if (out) {
      out.innerHTML = (f.outgoing || []).length
        ? f.outgoing.map(r => `
          <div class="friend-row">
            <span class="name">${presenceDot(r.last_seen)}@${esc(r.username)} <span class="muted">pending</span></span>
          </div>`).join('')
        : '<div class="empty-state" style="padding:.7rem;font-size:.8rem">No outgoing requests.</div>';
    }
  }

  async function loadFriends() {
    if (!state.user) {
      state.friends = { friends: [], incoming: [], outgoing: [] };
      return;
    }
    try {
      state.friends = await api('/community/friends');
    } catch (e) {
      state.friends = { friends: [], incoming: [], outgoing: [] };
      console.warn('friends', e);
    }
  }

  async function sendFriendRequest(ev) {
    ev.preventDefault();
    const input = document.getElementById('friend-username');
    const status = document.getElementById('friend-req-status');
    const username = (input && input.value || '').trim();
    if (!username) return;
    try {
      const data = await api('/community/friends/request', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      if (status) status.textContent = data.hint === 'auto_accepted' ? 'Accepted (they asked you first).' : ('Status: ' + (data.status || 'ok'));
      if (input) input.value = '';
      await loadFriends();
      await loadApiPosts();
      renderFriends();
      renderLlz();
    } catch (e) {
      if (status) status.textContent = (e.data && e.data.error) || 'Request failed';
    }
  }

  async function acceptFriend(id) {
    try {
      await api('/community/friends/accept', { method: 'POST', body: JSON.stringify({ id: Number(id) }) });
      await loadFriends();
      await loadApiPosts();
      renderFriends();
      renderLlz();
    } catch (e) {
      console.warn(e);
    }
  }

  async function declineFriend(id) {
    try {
      await api('/community/friends/decline', { method: 'POST', body: JSON.stringify({ id: Number(id) }) });
      await loadFriends();
      renderFriends();
    } catch (e) {
      console.warn(e);
    }
  }

  async function loadApiPosts() {
    try {
      const data = await api('/community/posts?limit=80');
      state.apiPosts = data.posts || [];
    } catch (e) {
      state.apiPosts = [];
      console.warn('community posts API', e);
    }
  }

  async function pingMe() {
    if (!token()) return;
    try {
      const data = await api('/me');
      if (data.user) {
        state.user = {
          username: data.user.username,
          id: data.user.id,
          last_seen: data.user.last_seen,
          friend_count: data.user.friend_count,
        };
      }
    } catch {
      /* token stale — keep parseUser fallback */
    }
  }


  function renderOnline() {
    const list = document.getElementById('llz-online-list');
    const count = document.getElementById('llz-online-count');
    if (count) count.textContent = String((state.online || []).length);
    if (!list) return;
    const rows = state.online || [];
    if (!rows.length) {
      list.innerHTML = '<div class="muted-line" style="padding:.4rem;font-size:.8rem">Nobody pinging right now — open LabZocial to show up.</div>';
      return;
    }
    list.innerHTML = rows.map(u => `
      <a class="llz-online-row" href="${profileUrl(u.username)}">
        <span class="presence on"></span>
        <span class="name">@${esc(u.username)}</span>
        ${u.zocial && u.zocial.fav_tool ? `<span class="meta muted">${esc(u.zocial.fav_tool)}</span>` : ''}
      </a>`).join('');
  }

  function renderSearchResults() {
    const root = document.getElementById('llz-search-results');
    if (!root) return;
    const hits = state.searchHits || [];
    if (!hits.length) {
      root.hidden = true;
      root.innerHTML = '';
      return;
    }
    root.hidden = false;
    root.innerHTML = hits.map(u => `
      <a class="llz-hit" href="${esc(u.profile_url || profileUrl(u.username))}">
        <span>
          <span class="presence ${presenceClass(u.last_seen) || ''}"></span>
          <span class="who">@${esc(u.username)}</span>
          ${u.display_name && u.display_name !== u.username ? `<span class="meta"> · ${esc(u.display_name)}</span>` : ''}
        </span>
        <span class="meta">${u.zocial && u.zocial.fav_distro ? esc(u.zocial.fav_distro) : 'profile →'}</span>
      </a>`).join('');
  }

  async function loadOnline() {
    try {
      const data = await api('/community/online?limit=40');
      state.online = data.users || [];
    } catch (e) {
      state.online = [];
      console.warn('online', e);
    }
    renderOnline();
  }

  async function onSearch(ev) {
    ev.preventDefault();
    const input = document.getElementById('llz-search-q');
    const q = (input && input.value || '').trim();
    if (!q) {
      state.searchHits = [];
      renderSearchResults();
      return;
    }
    try {
      const data = await api('/community/users/search?q=' + encodeURIComponent(q));
      state.searchHits = data.users || [];
    } catch (e) {
      state.searchHits = [];
      console.warn('search', e);
    }
    renderSearchResults();
  }

  async function heartbeat() {
    if (!token()) return;
    try { await api('/community/heartbeat', { method: 'POST', body: '{}' }); } catch {}
  }

  function wireUi() {
    document.querySelectorAll('.comm-tab').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });
    const form = document.getElementById('compose-form');
    if (form) form.addEventListener('submit', submitPost);
    const llz = document.getElementById('llz-compose');
    if (llz) llz.addEventListener('submit', submitLlz);
    const fr = document.getElementById('friend-request-form');
    if (fr) fr.addEventListener('submit', sendFriendRequest);
    const sf = document.getElementById('llz-search-form');
    if (sf) sf.addEventListener('submit', onSearch);
    document.querySelectorAll('[data-goto-tab]').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.getAttribute('data-goto-tab')));
    });
    if (state.user) {
      document.querySelectorAll('#nav-account,#nav-account-btn').forEach(el => {
        if (window.LabCard && window.LabCard.paintNavButton) window.LabCard.paintNavButton(el);
        else el.textContent = state.user.username;
      });
    }
    const st = document.getElementById('comm-user-state');
    if (st) st.innerHTML = state.user
      ? '<span>Session</span><span><b>● @' + esc(state.user.username) + '</b></span>'
      : '<span>Session</span><span><b style="color:var(--amber)">○ guest</b></span>';
  }

  async function init() {
    state.user = parseUser();
    await pingMe();
    wireUi();
    try {
      const [nz, tips] = await Promise.all([
        fetch('labnewz.json').then(r => r.json()),
        fetch('tips.json').then(r => r.json()),
      ]);
      state.labnewz = nz;
      state.tips = tips;
    } catch (e) {
      console.warn('static data', e);
    }
    await loadApiPosts();
    await loadFriends();
    await loadOnline();
    await heartbeat();
    renderLabNewz();
    renderTips();
    renderLlz();
    renderFriends();
    renderDiscussions();
    renderOnline();
    const hashTab = (location.hash || '').replace(/^#/, '');
    if (hashTab && document.querySelector('.comm-tab[data-tab="' + hashTab + '"]')) setTab(hashTab);
    else setTab('llz');
    setInterval(() => { heartbeat(); loadOnline(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
