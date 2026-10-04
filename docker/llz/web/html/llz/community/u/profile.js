/* Public LabZocial profile viewer */
(function () {
  const API = '/labs/api';
  const TOKEN_KEY = 'laden_v12_token';

  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function usernameFromLocation() {
    const params = new URLSearchParams(location.search);
    if (params.get('u')) return params.get('u').trim();
    const m = location.pathname.match(/\/community\/u\/([^\/]+)\/?/i)
      || location.pathname.match(/\/zocial\/([^\/]+)\/?/i);
    if (m && m[1] && m[1].toLowerCase() !== 'index.html') return decodeURIComponent(m[1]);
    const hash = (location.hash || '').replace(/^#/, '');
    return hash || '';
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

  async function api(path) {
    const headers = {};
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(API + path, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || res.statusText);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function render(u) {
    const card = document.getElementById('profile-card');
    const st = document.getElementById('profile-status');
    const acts = document.getElementById('profile-actions');
    if (st) st.hidden = true;
    if (!card) return;
    const z = u.zocial || {};
    const pc = presenceClass(u.last_seen);
    const pills = [];
    if (z.fav_tool) pills.push('<span class="zocial-pill">tool <b>' + esc(z.fav_tool) + '</b></span>');
    if (z.fav_distro) pills.push('<span class="zocial-pill">distro <b>' + esc(z.fav_distro) + '</b></span>');
    if (z.fav_track) pills.push('<span class="zocial-pill">track <b>' + esc(z.fav_track) + '</b></span>');
    if (z.role_title) pills.push('<span class="zocial-pill">role <b>' + esc(z.role_title) + '</b></span>');
    if (z.location) pills.push('<span class="zocial-pill">📍 <b>' + esc(z.location) + '</b></span>');
    if (u.title_label || u.title) pills.push('<span class="zocial-pill">' + esc(u.title_label || u.title) + '</span>');
    if (u.lab_id) pills.push('<span class="zocial-pill">Lab ID <b>' + esc(u.lab_id) + '</b></span>');
    const links = (z.links || []).map(l =>
      '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label || l.url) + '</a>'
    ).join('');
    let av = '';
    if (u.avatar_id && window.LadenAvatars && window.LadenAvatars.html) {
      try { window.LadenAvatars.ensureCss && window.LadenAvatars.ensureCss(); } catch {}
      av = '<div style="width:88px;height:88px;border-radius:20px;overflow:hidden">' + window.LadenAvatars.html(u.avatar_id) + '</div>';
    }
    card.hidden = false;
    card.innerHTML =
      '<div class="zocial-card-top">' + av +
        '<div class="zocial-card-meta">' +
          '<p class="zocial-card-name">' + esc(u.display_name || u.username) +
            (pc ? ' <span class="presence ' + pc + '" title="presence"></span>' : '') + '</p>' +
          '<p class="zocial-card-nick">@' + esc(u.username) + '</p>' +
          '<div class="zocial-pills">' + (pills.join('') || '<span class="zocial-pill">member</span>') + '</div>' +
        '</div>' +
      '</div>' +
      (z.bio ? '<p class="zocial-bio">' + esc(z.bio) + '</p>' : '<p class="zocial-bio muted">No bio yet — check back after they fill LabZocial.</p>') +
      (links ? '<div class="zocial-links">' + links + '</div>' : '') +
      '<p class="mono tiny" style="margin:.9rem 0 0">XP ' + esc(u.xp != null ? u.xp : '—') +
        ' · LLT ' + esc(u.llt != null ? u.llt : '—') +
        (u.online ? ' · <span style="color:var(--green)">online</span>' : '') + '</p>';

    document.title = '@' + u.username + ' · LabZocial — Laden Labs';

    if (acts) {
      acts.hidden = false;
      const bits = [];
      bits.push('<a class="btn btn-cyan" href="/community/">LLZ feed</a>');
      if (u.is_self) {
        bits.push('<a class="btn btn-primary" href="/account/#acct-zocial">Edit profile</a>');
      } else {
        bits.push('<a class="btn btn-ghost" href="/messages/?u=' + encodeURIComponent(u.username) + '">Message</a>');
        bits.push('<a class="btn btn-ghost" href="/community/#friends">Friends</a>');
      }
      acts.innerHTML = bits.join('');
    }
  }

  async function init() {
    const uname = usernameFromLocation();
    const st = document.getElementById('profile-status');
    if (!uname) {
      if (st) st.textContent = 'Missing username. Try /community/u/<username>/';
      return;
    }
    try {
      const data = await api('/community/u/' + encodeURIComponent(uname));
      render(data.user || data.profile);
      // heartbeat if logged in
      if (token()) {
        try { await fetch(API + '/community/heartbeat', { method: 'POST', headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
      }
    } catch (e) {
      if (st) st.textContent = e.status === 404 ? 'Operator not found.' : ('Could not load profile: ' + (e.message || e));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
