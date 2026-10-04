/* FUCK FUCK'EM — browser port (Laden teal facelift) */
(function () {
  'use strict';

  const W = 960, H = 600, HALF_H = H >> 1;
  const FOV = Math.PI / 3, HALF_FOV = FOV / 2;
  const NUM_RAYS = W >> 1;
  const MAX_DEPTH = 24;
  const DELTA_ANGLE = FOV / NUM_RAYS;
  const DIST_TO_PLANE = (W / 2) / Math.tan(HALF_FOV);
  const MOVE_SPEED = 3.8;
  const TITLE = "FUCK FUCK'EM";
  const MOUSE_SENS = 0.003;
  const TAU = Math.PI * 2;

  const RAW_MAP = [
    "##############################",
    "#S..#..........#.............#",
    "#...#..........#.............#",
    "#...#..........#.............#",
    "#...#######....#.............#",
    "#..............#.............#",
    "#..###.........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#.........................#",
    "#..#.........................#",
    "#..#.........................#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
    "#..#...........#.............#",
  ];

  const MAP_H = RAW_MAP.length;
  const MAP_W = RAW_MAP[0].length;
  const WORLD_MAP = [];
  let SPAWN = { x: 2.5, y: 2.5 };

  for (let y = 0; y < MAP_H; y++) {
    const line = [];
    const row = RAW_MAP[y];
    for (let x = 0; x < MAP_W; x++) {
      const ch = row[x];
      if (ch === 'S') {
        SPAWN = { x: x + 0.5, y: y + 0.5 };
        line.push(0);
      } else if (ch === '#') {
        line.push(1);
      } else {
        line.push(0);
      }
    }
    WORLD_MAP.push(line);
  }

  const CEIL_COLOR = [12, 22, 24];
  const FLOOR_COLOR = [28, 32, 30];

  const PIG_COP = 'pig_cop';
  const OCTABRAIN = 'octabrain';
  const TROOPER = 'assault_trooper';
  const ENFORCER = 'enforcer';
  const MARIO = 'mario';
  const LUIGI = 'luigi';

  const ENEMY_DEFS = {
    [PIG_COP]:   { hp: 40,  speed: 1.6, dmg: 8,  range: 1.2, color: [255, 140, 160], scale: 0.9, boss: false },
    [OCTABRAIN]: { hp: 30,  speed: 2.2, dmg: 12, range: 0.8, color: [160, 60, 220],  scale: 0.7, boss: false },
    [TROOPER]:   { hp: 50,  speed: 1.4, dmg: 10, range: 1.5, color: [60, 100, 200],  scale: 1.0, boss: false },
    [ENFORCER]:  { hp: 55,  speed: 1.2, dmg: 14, range: 1.8, color: [255, 120, 140], scale: 1.0, boss: false },
    [MARIO]:     { hp: 300, speed: 1.8, dmg: 20, range: 2.0, color: [220, 40, 40],   scale: 1.6, boss: true },
    [LUIGI]:     { hp: 250, speed: 2.4, dmg: 18, range: 2.0, color: [40, 180, 60],   scale: 1.6, boss: true },
  };

  const ENEMY_SPAWNS = [
    [PIG_COP,   5.5,  3.5],
    [TROOPER,   8.5,  7.5],
    [OCTABRAIN, 4.5,  10.5],
    [PIG_COP,   6.5,  14.5],
    [ENFORCER,  3.5,  18.5],
    [TROOPER,   9.5,  22.5],
    [OCTABRAIN, 5.5,  26.5],
    [PIG_COP,   7.5,  4.5],
    [TROOPER,   4.5,  8.5],
    [MARIO,     22.5, 10.5],
    [LUIGI,     25.5, 18.5],
  ];

  function isWall(mx, my) {
    if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return true;
    return WORLD_MAP[my | 0][mx | 0] === 1;
  }

  function rgb(c, a) {
    if (a == null) return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
    return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
  }

  function shadeColor(base, shade) {
    return [base[0] * shade, base[1] * shade, base[2] * shade];
  }

  let nextEnemyId = 0;
  class Enemy {
    constructor(etype, x, y) {
      this.id = ++nextEnemyId;
      this.etype = etype;
      const d = ENEMY_DEFS[etype];
      this.x = x; this.y = y;
      this.hp = d.hp; this.maxHp = d.hp;
      this.speed = d.speed; this.dmg = d.dmg; this.range = d.range;
      this.color = d.color; this.scale = d.scale; this.boss = d.boss;
      this.alive = true;
      this.attackCd = 0; this.hurtFlash = 0;
      this.wanderAngle = Math.random() * TAU;
      this.bossPhase = 0;
    }
    distTo(px, py) { return Math.hypot(this.x - px, this.y - py); }
    update(dt, px, py, player) {
      if (!this.alive) return;
      this.attackCd = Math.max(0, this.attackCd - dt);
      this.hurtFlash = Math.max(0, this.hurtFlash - dt);
      this.bossPhase += dt;
      const d = this.distTo(px, py);
      if (d < 0.3) return;
      let angle;
      if (this.boss) {
        if (this.etype === MARIO) {
          angle = Math.atan2(py - this.y, px - this.x);
          const mul = d > 3 ? 1.3 : 0.6;
          this.x += Math.cos(angle) * this.speed * dt * mul;
          this.y += Math.sin(angle) * this.speed * dt * mul;
        } else {
          angle = Math.atan2(py - this.y, px - this.x);
          const strafe = Math.sin(this.bossPhase * 3) * 1.5;
          this.x += (Math.cos(angle) + Math.cos(angle + Math.PI / 2) * strafe) * this.speed * dt;
          this.y += (Math.sin(angle) + Math.sin(angle + Math.PI / 2) * strafe) * this.speed * dt;
        }
      } else {
        angle = Math.atan2(py - this.y, px - this.x);
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
      }
      if (isWall(this.x, this.y)) {
        this.x -= Math.cos(angle) * this.speed * dt * 2;
        this.y -= Math.sin(angle) * this.speed * dt * 2;
      }
      if (d < this.range && this.attackCd <= 0) {
        player.takeDamage(this.dmg);
        this.attackCd = this.boss ? 1.2 : 0.8;
      }
    }
    takeHit(dmg) {
      if (!this.alive) return false;
      this.hp -= dmg;
      this.hurtFlash = 0.15;
      if (this.hp <= 0) { this.alive = false; return true; }
      return false;
    }
  }

  class Player {
    constructor() {
      this.x = SPAWN.x; this.y = SPAWN.y;
      this.angle = 0;
      this.hp = 100; this.maxHp = 100;
      this.ammo = 50; this.kills = 0;
      this.shootCd = 0; this.hurtFlash = 0;
      this.dead = false; this.won = false;
    }
    takeDamage(amount) {
      if (this.dead) return;
      this.hp -= amount;
      this.hurtFlash = 0.3;
      if (this.hp <= 0) { this.hp = 0; this.dead = true; }
    }
    shoot() {
      if (this.shootCd > 0 || this.ammo <= 0 || this.dead) return false;
      this.ammo -= 1;
      this.shootCd = 0.25;
      return true;
    }
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const resumeEl = document.getElementById('ffe-resume');
  const resumeBtn = document.getElementById('ffe-resume-btn');
  const gateEl = document.getElementById('ffe-gate');

  const keys = Object.create(null);
  let pointerLocked = false;
  let wantLock = false;

  // Soft auth gate — same JWT as rest of site
  function hasSession() {
    try { return !!(localStorage.getItem('laden_v12_token') || ''); } catch (_) { return false; }
  }
  if (!hasSession()) {
    gateEl.classList.add('show');
    gateEl.setAttribute('aria-hidden', 'false');
  }

  function buildSprites() {
    const sprites = {};
    function make(etype, w, h, drawFn) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      drawFn(g, w, h);
      sprites[etype] = c;
    }
    function drawPig(g, w, h) {
      g.fillStyle = 'rgb(255,160,180)';
      g.beginPath(); g.ellipse(w/2, h*0.58, w/4, h/4, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgb(255,180,190)';
      g.beginPath(); g.ellipse(w/2, h*0.29, w/6, h/8, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgb(60,60,80)';
      g.beginPath(); g.ellipse(w/2, h*0.6, w/6, h/10, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgb(40,40,40)';
      g.beginPath(); g.arc(w/2 - 8, h/5 + 4, 4, 0, TAU); g.fill();
      g.beginPath(); g.arc(w/2 + 8, h/5 + 4, 4, 0, TAU); g.fill();
      g.fillStyle = 'rgb(50,50,70)';
      g.fillRect(w/2 - 12, h/8, 24, 8);
    }
    function drawOcta(g, w, h) {
      g.fillStyle = 'rgb(140,50,200)';
      g.beginPath(); g.ellipse(w/2, h*0.4, w/4, h/6, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgb(100,30,160)'; g.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        const tx = w/2 + Math.cos(a) * w/3;
        const ty = h/2 + Math.sin(a) * h/4 + h/6;
        g.beginPath(); g.moveTo(w/2, h/3); g.lineTo(tx, ty); g.stroke();
      }
    }
    function drawTrooper(g, w, h) {
      g.fillStyle = 'rgb(50,90,180)'; g.fillRect(w/3, h/4, w/3, h/2);
      g.fillStyle = 'rgb(70,110,200)'; g.fillRect(w/3, h/6, w/3, h/6);
      g.fillStyle = 'rgb(30,60,140)';
      g.fillRect(w/4, h/2, w/6, h/3); g.fillRect(w/2, h/2, w/6, h/3);
    }
    function drawEnforcer(g, w, h) {
      drawPig(g, w, h);
      g.fillStyle = 'rgb(80,60,40)'; g.fillRect(w/2 + 4, h/3, 16, 6);
    }
    function drawMario(g, w, h) {
      g.fillStyle = 'rgb(200,30,30)'; g.fillRect(w/4, h/8, w/2, h/6);
      g.fillStyle = 'rgb(255,200,160)';
      g.beginPath(); g.ellipse(w/2, h*0.3, w/4, h/10, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgb(30,60,200)'; g.fillRect(w/4, h/2, w/2, h/3);
      g.fillStyle = 'rgb(60,30,10)'; g.fillRect(w/3, h/2 + 8, w/3, 6);
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(w/2 - 10, h/4, 5, 0, TAU); g.fill();
      g.beginPath(); g.arc(w/2 + 10, h/4, 5, 0, TAU); g.fill();
      g.fillStyle = 'rgb(30,30,30)';
      g.beginPath(); g.arc(w/2 - 8, h/4 + 2, 3, 0, TAU); g.fill();
      g.beginPath(); g.arc(w/2 + 8, h/4 + 2, 3, 0, TAU); g.fill();
      g.fillStyle = 'rgb(255,220,0)';
      g.beginPath(); g.arc(w/2, h/8 + 2, 6, 0, TAU); g.fill();
    }
    function drawLuigi(g, w, h) {
      g.fillStyle = 'rgb(40,160,50)'; g.fillRect(w/4, h/8, w/2, h/6);
      g.fillStyle = 'rgb(255,200,160)';
      g.beginPath(); g.ellipse(w/2, h*0.3, w/4, h/10, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgb(30,60,200)'; g.fillRect(w/4, h/2, w/2, h/3);
      g.fillStyle = 'rgb(60,30,10)'; g.fillRect(w/3, h/2 + 8, w/3, 6);
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(w/2 - 10, h/4, 5, 0, TAU); g.fill();
      g.beginPath(); g.arc(w/2 + 10, h/4, 5, 0, TAU); g.fill();
      g.fillStyle = 'rgb(30,30,30)';
      g.beginPath(); g.arc(w/2 - 8, h/4 + 2, 3, 0, TAU); g.fill();
      g.beginPath(); g.arc(w/2 + 8, h/4 + 2, 3, 0, TAU); g.fill();
      g.fillStyle = 'rgb(255,220,0)';
      g.beginPath(); g.arc(w/2, h/8 + 2, 6, 0, TAU); g.fill();
    }
    make(PIG_COP, 64, 80, drawPig);
    make(OCTABRAIN, 64, 64, drawOcta);
    make(TROOPER, 64, 80, drawTrooper);
    make(ENFORCER, 64, 80, drawEnforcer);
    make(MARIO, 80, 100, drawMario);
    make(LUIGI, 80, 100, drawLuigi);
    return sprites;
  }

  const sprites = buildSprites();

  const game = {
    state: 'title',
    player: null,
    enemies: [],
    zBuffer: new Float64Array(NUM_RAYS),
    shootAnim: 0,
    msgTimer: 0,
    msgText: '',
  };

  function startGame() {
    if (!hasSession()) {
      gateEl.classList.add('show');
      return;
    }
    game.player = new Player();
    game.enemies = ENEMY_SPAWNS.map(([t, x, y]) => new Enemy(t, x, y));
    game.state = 'playing';
    game.msgText = 'BLAST THE DUKE CREATURES. KILL MARIO & LUIGI!';
    game.msgTimer = 4.0;
    game.shootAnim = 0;
    wantLock = true;
    requestPointerLock();
  }

  function requestPointerLock() {
    if (!hasSession()) return;
    try { canvas.requestPointerLock(); } catch (_) {}
  }

  function showResume(show) {
    resumeEl.classList.toggle('show', show);
    resumeEl.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function castRays() {
    const p = game.player;
    const px = p.x, py = p.y;
    const startAngle = p.angle - HALF_FOV;

    // Correct draw order vs pygame bug: ceiling + floor FIRST, then walls
    ctx.fillStyle = rgb(CEIL_COLOR);
    ctx.fillRect(0, 0, W, HALF_H);
    for (let y = HALF_H; y < H; y++) {
      const row = y - HALF_H;
      if (row === 0) continue;
      const shade = Math.min(1, row / HALF_H) * 0.7 + 0.3;
      ctx.fillStyle = rgb(shadeColor(FLOOR_COLOR, shade));
      ctx.fillRect(0, y, W, 1);
    }

    for (let ray = 0; ray < NUM_RAYS; ray++) {
      const angle = startAngle + ray * DELTA_ANGLE;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      let depthH = MAX_DEPTH;
      if (sinA !== 0) {
        let yH, dy;
        if (sinA > 0) { yH = (py | 0) + 1; dy = 1; }
        else { yH = py | 0; dy = -1; }
        depthH = (yH - py) / sinA;
        const deltaH = dy / sinA;
        let xH = px + depthH * cosA;
        let hit = false;
        for (let i = 0; i < MAX_DEPTH; i++) {
          if (isWall(xH, yH - (dy < 0 ? 1e-6 : 0))) { hit = true; break; }
          depthH += deltaH;
          xH = px + depthH * cosA;
          yH += dy;
        }
        if (!hit) depthH = MAX_DEPTH;
      }

      let depthV = MAX_DEPTH;
      if (cosA !== 0) {
        let xV, dx;
        if (cosA > 0) { xV = (px | 0) + 1; dx = 1; }
        else { xV = px | 0; dx = -1; }
        depthV = (xV - px) / cosA;
        const deltaV = dx / cosA;
        let yV = py + depthV * sinA;
        let hit = false;
        for (let i = 0; i < MAX_DEPTH; i++) {
          if (isWall(xV - (dx < 0 ? 1e-6 : 0), yV)) { hit = true; break; }
          depthV += deltaV;
          xV += dx;
          yV = py + depthV * sinA;
        }
        if (!hit) depthV = MAX_DEPTH;
      }

      let depth = Math.min(depthH, depthV);
      depth *= Math.cos(p.angle - angle);
      game.zBuffer[ray] = Math.max(depth, 0.001);

      const wallH = Math.min((DIST_TO_PLANE / game.zBuffer[ray]) | 0, H);
      const wallTop = HALF_H - (wallH >> 1);
      const shade = Math.max(0.2, 1.0 - game.zBuffer[ray] / MAX_DEPTH);
      const base = depthH < depthV ? [90, 65, 45] : [70, 50, 35];
      ctx.fillStyle = rgb(shadeColor(base, shade));
      ctx.fillRect(ray * 2, wallTop, 2, wallH);
    }
  }

  function renderSprites() {
    const p = game.player;
    const px = p.x, py = p.y;
    const list = [];
    for (const e of game.enemies) {
      if (!e.alive) continue;
      const dx = e.x - px, dy = e.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.3) continue;
      let delta = Math.atan2(dy, dx) - p.angle;
      while (delta > Math.PI) delta -= TAU;
      while (delta < -Math.PI) delta += TAU;
      if (Math.abs(delta) > HALF_FOV + 0.3) continue;
      list.push({ dist, e, delta });
    }
    list.sort((a, b) => b.dist - a.dist);

    for (const { dist, e, delta } of list) {
      const screenX = ((0.5 + delta / FOV) * W) | 0;
      const spriteH = (DIST_TO_PLANE / dist * e.scale) | 0;
      const spriteW = spriteH;
      if (spriteH < 4) continue;
      const top = HALF_H - (spriteH >> 1);
      const left = screenX - (spriteW >> 1);
      const tex = sprites[e.etype];
      if (!tex) continue;

      // Column occlusion against z-buffer
      const rayStart = Math.max(0, (left / 2) | 0);
      const rayEnd = Math.min(NUM_RAYS, ((left + spriteW) / 2) | 0);
      let anyVisible = false;
      for (let r = rayStart; r < rayEnd; r++) {
        if (dist < game.zBuffer[r]) { anyVisible = true; break; }
      }
      if (!anyVisible) continue;

      ctx.save();
      // Clip columns behind walls
      ctx.beginPath();
      for (let r = rayStart; r < rayEnd; r++) {
        if (dist < game.zBuffer[r]) {
          ctx.rect(r * 2, 0, 2, H);
        }
      }
      ctx.clip();
      if (e.hurtFlash > 0) {
        ctx.filter = 'brightness(1.8) sepia(1) hue-rotate(-50deg) saturate(4)';
      }
      ctx.drawImage(tex, left, top, spriteW, spriteH);
      ctx.restore();
    }
  }

  function shootRaycast() {
    const p = game.player;
    let best = null, bestDist = 999;
    for (const e of game.enemies) {
      if (!e.alive) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 12) continue;
      const ea = Math.atan2(dy, dx);
      let diff = Math.abs(ea - p.angle);
      if (diff > Math.PI) diff = TAU - diff;
      const hitAngle = 0.08 + 0.15 / Math.max(dist, 1);
      if (diff < hitAngle && dist < bestDist) {
        best = e; bestDist = dist;
      }
    }
    if (best) {
      const dmg = best.boss ? 25 : 35;
      if (best.takeHit(dmg)) {
        p.kills += 1;
        if (best.boss) {
          game.msgText = best.etype.toUpperCase() + ' IS DOWN!';
          game.msgTimer = 2.5;
        }
      }
      game.shootAnim = 0.15;
    }
    const bosses = game.enemies.filter(e => e.boss);
    if (bosses.length && bosses.every(b => !b.alive)) {
      p.won = true;
      game.state = 'won';
      wantLock = false;
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }

  function drawGun() {
    const gunY = H - 120 + (game.shootAnim * 30) | 0;
    ctx.fillStyle = 'rgb(60,60,60)';
    ctx.fillRect(W / 2 - 20, gunY, 40, 80);
    ctx.fillStyle = 'rgb(40,40,40)';
    ctx.fillRect(W / 2 - 8, gunY - 30, 16, 40);
    if (game.shootAnim > 0) {
      ctx.fillStyle = 'rgb(255,200,50)';
      ctx.beginPath(); ctx.arc(W / 2, gunY - 40, 12, 0, TAU); ctx.fill();
    }
  }

  function drawText(str, x, y, size, color, align) {
    ctx.font = `bold ${size}px "JetBrains Mono", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(str, x, y);
  }

  function drawHud() {
    const p = game.player;
    ctx.fillStyle = 'rgb(60,20,20)';
    ctx.fillRect(20, H - 50, 200, 20);
    const hpW = (196 * p.hp / p.maxHp) | 0;
    ctx.fillStyle = p.hp < 30 ? 'rgb(200,40,40)' : 'rgb(40,180,60)';
    ctx.fillRect(22, H - 48, hpW, 16);
    drawText(`HP ${p.hp}`, 20, H - 70, 14, '#fff');
    drawText(`AMMO ${p.ammo}`, 240, H - 48, 14, 'rgb(61,255,240)');
    const alive = game.enemies.reduce((n, e) => n + (e.alive ? 1 : 0), 0);
    drawText(`KILLS ${p.kills}  LEFT ${alive}`, 400, H - 48, 14, 'rgb(180,200,198)');

    for (const e of game.enemies) {
      if (!(e.boss && e.alive)) continue;
      const label = e.etype === MARIO ? 'MARIO' : 'LUIGI';
      const bx = e.etype === MARIO ? 22 : 222;
      ctx.fillStyle = 'rgb(40,40,40)';
      ctx.fillRect(bx, 20, 180, 14);
      const bw = (176 * e.hp / e.maxHp) | 0;
      ctx.fillStyle = rgb(e.color);
      ctx.fillRect(bx + 2, 22, bw, 10);
      drawText(`${label} ${e.hp}`, bx, 4, 14, '#fff');
    }

    if (p.hurtFlash > 0) {
      const alpha = 120 * p.hurtFlash / 0.3 / 255;
      ctx.fillStyle = `rgba(180,0,0,${alpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    const cx = W / 2, cy = H / 2;
    ctx.strokeStyle = 'rgb(61,255,240)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke();

    if (game.msgTimer > 0) {
      drawText(game.msgText, W / 2, H - 100, 18, 'rgb(61,255,240)', 'center');
    }
  }

  function drawTitle() {
    // Dark teal void
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgb(6,12,14)');
    g.addColorStop(0.45, 'rgb(5,8,10)');
    g.addColorStop(1, 'rgb(4,6,8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Soft teal bloom
    const bloom = ctx.createRadialGradient(W/2, H*0.28, 20, W/2, H*0.28, 280);
    bloom.addColorStop(0, 'rgba(46,196,182,0.14)');
    bloom.addColorStop(1, 'rgba(46,196,182,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);

    drawText('LADEN', W / 2, H / 4 - 36, 14, 'rgb(46,196,182)', 'center');
    drawText('BUILD YOUR DREAM', W / 2, H / 4 - 16, 11, 'rgb(122,146,144)', 'center');
    drawText("FUCK FUCK'EM", W / 2, H / 4 + 18, 40, 'rgb(61,255,240)', 'center');
    drawText('LEVEL 1: SEWER OF RAGE', W / 2, H / 4 + 72, 16, 'rgb(46,196,182)', 'center');
    drawText('Enemies: Pig Cops, Octabrains, Troopers, Enforcers', W / 2, H / 2 + 8, 14, 'rgb(180,200,198)', 'center');
    drawText('BOSS: MARIO & LUIGI — kill both to win!', W / 2, H / 2 + 34, 14, 'rgb(255,120,140)', 'center');
    drawText('CLICK OR PRESS ENTER TO START', W / 2, (H * 2) / 3 + 8, 18, 'rgb(61,255,240)', 'center');
    drawText('WASD move | Mouse look | LMB shoot | ESC unlock mouse', W / 2, H - 56, 13, 'rgb(122,146,144)', 'center');
  }

  function drawEnd(won) {
    ctx.fillStyle = 'rgba(4,8,10,0.78)';
    ctx.fillRect(0, 0, W, H);
    if (won) {
      drawText("YOU FUCKED 'EM!", W / 2, H / 3, 42, 'rgb(61,255,240)', 'center');
      drawText(`Kills: ${game.player.kills}`, W / 2, H / 3 + 60, 18, 'rgb(180,200,198)', 'center');
      drawText('BUILD YOUR DREAM', W / 2, H / 3 + 92, 12, 'rgb(46,196,182)', 'center');
    } else {
      drawText('YOU DIED', W / 2, H / 3, 42, 'rgb(255,77,109)', 'center');
      drawText('The plumbers got you.', W / 2, H / 3 + 60, 18, 'rgb(180,200,198)', 'center');
    }
    drawText('ENTER to retry | ESC unlocks mouse', W / 2, H / 2 + 40, 16, 'rgb(122,146,144)', 'center');
  }

  function handleInput(dt) {
    if (game.state !== 'playing') return;
    const p = game.player;
    const sinA = Math.sin(p.angle), cosA = Math.cos(p.angle);
    const speed = MOVE_SPEED * dt;
    let nx = p.x, ny = p.y;
    if (keys['KeyW'] || keys['ArrowUp']) { nx += cosA * speed; ny += sinA * speed; }
    if (keys['KeyS'] || keys['ArrowDown']) { nx -= cosA * speed; ny -= sinA * speed; }
    if (keys['KeyA'] || keys['ArrowLeft']) { nx += sinA * speed; ny -= cosA * speed; }
    if (keys['KeyD'] || keys['ArrowRight']) { nx -= sinA * speed; ny += cosA * speed; }
    if (!isWall(nx, p.y)) p.x = nx;
    if (!isWall(p.x, ny)) p.y = ny;

    p.shootCd = Math.max(0, p.shootCd - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    game.shootAnim = Math.max(0, game.shootAnim - dt);
    game.msgTimer = Math.max(0, game.msgTimer - dt);

    for (const e of game.enemies) e.update(dt, p.x, p.y, p);
    if (p.dead) {
      game.state = 'dead';
      wantLock = false;
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }

  // Events
  window.addEventListener('keydown', (ev) => {
    keys[ev.code] = true;
    if (ev.code === 'Escape') {
      // Let browser exit pointer lock; show resume overlay
      return;
    }
    if (game.state === 'title' && (ev.code === 'Enter' || ev.code === 'Space')) {
      ev.preventDefault();
      startGame();
    } else if ((game.state === 'dead' || game.state === 'won') && ev.code === 'Enter') {
      ev.preventDefault();
      startGame();
    }
  });
  window.addEventListener('keyup', (ev) => { keys[ev.code] = false; });

  canvas.addEventListener('click', (ev) => {
    if (!hasSession()) {
      gateEl.classList.add('show');
      return;
    }
    if (game.state === 'title') {
      startGame();
      return;
    }
    if (game.state === 'playing') {
      if (!pointerLocked) {
        wantLock = true;
        requestPointerLock();
        showResume(false);
        return;
      }
      if (ev.button === 0 && game.player && game.player.shoot()) {
        shootRaycast();
      }
    }
  });

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
    if (game.state === 'playing' && !pointerLocked) showResume(true);
    else showResume(false);
  });

  document.addEventListener('mousemove', (ev) => {
    if (game.state !== 'playing' || !pointerLocked || !game.player) return;
    game.player.angle += ev.movementX * MOUSE_SENS;
  });

  resumeBtn.addEventListener('click', () => {
    wantLock = true;
    showResume(false);
    requestPointerLock();
    canvas.focus();
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (game.state === 'title') {
      drawTitle();
    } else if (game.state === 'playing') {
      handleInput(dt);
      castRays();
      renderSprites();
      drawGun();
      drawHud();
    } else if (game.state === 'dead') {
      castRays();
      renderSprites();
      drawEnd(false);
    } else if (game.state === 'won') {
      castRays();
      renderSprites();
      drawEnd(true);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
