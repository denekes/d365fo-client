'use strict';
/* =========================================================
   Crown of Albion — world
   the isle of Britain / game state / economy / combat / AI
   ========================================================= */

const MAPY = 120, MAPH = 1000;          // map strip inside the screen
const HALFW = 360, HALFH = 500;         // half-resolution raster for territories

/* A simplified tracing of the Great Britain coastline (half-res coords,
   x right, y down). North tip first, down the east coast, back up the west. */
const BRITAIN = [
  [215, 25], [245, 38], [262, 60], [235, 80], [268, 98], [258, 122],
  [242, 132], [272, 148], [285, 178], [295, 215], [288, 228], [312, 245],
  [305, 278], [332, 295], [330, 322], [305, 348], [302, 362], [295, 378],
  [262, 392], [225, 398], [185, 396], [148, 388], [98, 396], [58, 384],
  [85, 368], [122, 345], [152, 322], [128, 330], [92, 318], [72, 306],
  [98, 290], [92, 262], [108, 250], [138, 238], [158, 242], [162, 215],
  [152, 192], [168, 172], [148, 158], [162, 138], [142, 118], [168, 98],
  [148, 72], [172, 52], [190, 38],
];

function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* The twelve provinces — historical regions of the isle. */
const TERR_DEFS = [
  { name: 'The Highlands', sx: 210, sy: 66,  terrain: 'mount' },
  { name: 'Argyll',        sx: 184, sy: 114, terrain: 'mount' },
  { name: 'Lothian',       sx: 230, sy: 150, terrain: 'plain' },
  { name: 'Northumbria',   sx: 256, sy: 188, terrain: 'moor' },
  { name: 'Cumbria',       sx: 184, sy: 206, terrain: 'mount' },
  { name: 'York',          sx: 252, sy: 248, terrain: 'plain' },
  { name: 'Gwynedd',       sx: 120, sy: 272, terrain: 'mount' },
  { name: 'Mercia',        sx: 214, sy: 300, terrain: 'forest' },
  { name: 'East Anglia',   sx: 298, sy: 318, terrain: 'plain' },
  { name: 'Wessex',        sx: 204, sy: 362, terrain: 'plain' },
  { name: 'Kent',          sx: 276, sy: 366, terrain: 'plain' },
  { name: 'Cornwall',      sx: 100, sy: 372, terrain: 'moor' },
  { name: 'Sherwood Forest', sx: 243, sy: 280, terrain: 'forest', sherwood: true },
];

const SHERWOOD = TERR_DEFS.findIndex(t => t.sherwood);

const HOME_TERRS = [9, 2, 8, 6];  // player Wessex; rivals Lothian, East Anglia, Gwynedd

const HEROES = [
  { name: 'Sir Aldric the Bold',  joust: 8, blade: 5, lead: 5, blurb: 'A tournament legend. None ride the tilt so true.' },
  { name: 'Lady Maren of Wessex', joust: 5, blade: 8, lead: 5, blurb: 'A duelist without equal, quick as winter wind.' },
  { name: 'Sir Corwin the Wise',  joust: 5, blade: 5, lead: 8, blurb: 'A master of war. Soldiers fight twice as hard under his banner.' },
];

const AI_LORDS = [
  { name: 'Lord Bran the Black',  color: '#34548f', joust: 7, blade: 6, lead: 6 },
  { name: 'Duke Osric of Anglia', color: '#3e7c3a', joust: 6, blade: 7, lead: 5 },
  { name: 'Baron Hadwin the Grim', color: '#6b4a9e', joust: 5, blade: 5, lead: 8 },
];

const PLAYER_COLOR = '#b3372c';
const NEUTRAL_COLOR = '#9a8a64';

const COSTS = { soldier: 8, knight: 25, catapult: 50, garrison: 30, castle: 120 };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const DIFFS = [
  { name: 'Squire', aiGold: 0.7, aiAggro: 1.7 },
  { name: 'Knight', aiGold: 1.0, aiAggro: 1.45 },
  { name: 'King',   aiGold: 1.35, aiAggro: 1.25 },
];

let S = null; // live game state

/* ---------------- map generation (deterministic) ---------------- */
const MapGen = {
  idx: null,            // Int8Array, HALFW*HALFH, territory id or -1 = sea
  area: [], cx: [], cy: [], adj: [],
  halfCanvas: null, landCanvas: null, grainCanvas: null, foamCanvas: null,

  inIsland(x, y) {
    // wobble the sample point so the coast reads hand-drawn, not vectory
    const jx = x + (fnoise(x * 0.06 + 3.7, y * 0.06 + 9.2) - 0.5) * 9;
    const jy = y + (fnoise(x * 0.06 + 17.3, y * 0.06 + 4.9) - 0.5) * 9;
    return inPoly(jx, jy, BRITAIN);
  },

  build() {
    const n = TERR_DEFS.length;
    this.idx = new Int8Array(HALFW * HALFH).fill(-1);
    this.area = new Array(n).fill(0);
    this.cx = new Array(n).fill(0);
    this.cy = new Array(n).fill(0);
    this.adj = Array.from({ length: n }, () => new Set());

    for (let y = 0; y < HALFH; y++) {
      for (let x = 0; x < HALFW; x++) {
        let island = this.inIsland(x, y);
        let best = -1, bestD = 1e9;
        for (let i = 0; i < n; i++) {
          const t = TERR_DEFS[i];
          const d = dist(x, y, t.sx, t.sy);
          if (d < 11) island = true; // make sure every seed sits on land
          const jit = 1 + 0.55 * (fnoise(x * 0.05 + i * 41.3, y * 0.05 + i * 17.7) - 0.5);
          const jd = d * jit;
          if (jd < bestD) { bestD = jd; best = i; }
        }
        if (!island) continue;
        this.idx[y * HALFW + x] = best;
        this.area[best]++;
        this.cx[best] += x;
        this.cy[best] += y;
      }
    }
    for (let i = 0; i < n; i++) {
      if (this.area[i] > 0) { this.cx[i] /= this.area[i]; this.cy[i] /= this.area[i]; }
      else { this.cx[i] = TERR_DEFS[i].sx; this.cy[i] = TERR_DEFS[i].sy; }
    }
    // adjacency from the raster
    for (let y = 0; y < HALFH - 1; y++) {
      for (let x = 0; x < HALFW - 1; x++) {
        const a = this.idx[y * HALFW + x];
        if (a < 0) continue;
        const r = this.idx[y * HALFW + x + 1];
        const d = this.idx[(y + 1) * HALFW + x];
        if (r >= 0 && r !== a) { this.adj[a].add(r); this.adj[r].add(a); }
        if (d >= 0 && d !== a) { this.adj[a].add(d); this.adj[d].add(a); }
      }
    }
    this.halfCanvas = document.createElement('canvas');
    this.halfCanvas.width = HALFW;
    this.halfCanvas.height = HALFH;
    this.landCanvas = document.createElement('canvas');
    this.landCanvas.width = W;
    this.landCanvas.height = MAPH;
    this.makeGrain();
    this.makeFoam();
    this.repaint();
  },

  makeGrain() {
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = W;
    this.grainCanvas.height = MAPH;
    const c = this.grainCanvas.getContext('2d');
    const img = c.createImageData(W, MAPH);
    for (let y = 0; y < MAPH; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const v = (fnoise(x * 0.05, y * 0.05) - 0.5) * 36;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const o = ((y + dy) * W + x + dx) * 4;
          img.data[o] = 128 + v; img.data[o + 1] = 128 + v; img.data[o + 2] = 128 + v;
          img.data[o + 3] = 26;
        }
      }
    }
    c.putImageData(img, 0, 0);
  },

  /* soft white surf hugging the coastline, blended over the sea each frame */
  makeFoam() {
    const half = document.createElement('canvas');
    half.width = HALFW;
    half.height = HALFH;
    const hc = half.getContext('2d');
    const img = hc.createImageData(HALFW, HALFH);
    for (let y = 1; y < HALFH - 1; y++) {
      for (let x = 1; x < HALFW - 1; x++) {
        if (this.idx[y * HALFW + x] >= 0) continue;
        let nearLand = 0;
        for (let r = 1; r <= 3; r++) {
          if (this.idx[y * HALFW + x + r] >= 0 || this.idx[y * HALFW + x - r] >= 0 ||
              this.idx[(y + r) * HALFW + x] >= 0 || this.idx[(y - r) * HALFW + x] >= 0) {
            nearLand = 4 - r;
            break;
          }
        }
        if (!nearLand) continue;
        const o = (y * HALFW + x) * 4;
        img.data[o] = 225; img.data[o + 1] = 240; img.data[o + 2] = 250;
        img.data[o + 3] = 50 + nearLand * 38;
      }
    }
    hc.putImageData(img, 0, 0);
    this.foamCanvas = document.createElement('canvas');
    this.foamCanvas.width = W;
    this.foamCanvas.height = MAPH;
    const fc = this.foamCanvas.getContext('2d');
    fc.imageSmoothingEnabled = true;
    fc.globalAlpha = 0.6;
    for (const [ox, oy] of [[0, 0], [1.5, 1], [-1.5, -1]]) {
      fc.drawImage(half, ox, oy, W, MAPH);
    }
  },

  ownerColor(i) {
    if (!S) return NEUTRAL_COLOR;
    const o = S.terr[i].owner;
    return o < 0 ? NEUTRAL_COLOR : S.lords[o].color;
  },

  repaint() {
    const hc = this.halfCanvas.getContext('2d');
    const img = hc.createImageData(HALFW, HALFH);
    const d = img.data;
    const base = hexRGB('#cdbd92');
    const cols = TERR_DEFS.map((def, i) => {
      if (def.sherwood) { const fg = hexRGB('#2f6e34'); return [fg[0], fg[1], fg[2]]; }
      const oc = hexRGB(this.ownerColor(i));
      return [
        base[0] * 0.55 + oc[0] * 0.45,
        base[1] * 0.55 + oc[1] * 0.45,
        base[2] * 0.55 + oc[2] * 0.45,
      ];
    });
    for (let y = 0; y < HALFH; y++) {
      for (let x = 0; x < HALFW; x++) {
        const o = (y * HALFW + x);
        const t = this.idx[o];
        if (t < 0) { d[o * 4 + 3] = 0; continue; }
        let [r, g, b] = cols[t];
        // border / coast shading — bold hand-inked outlines between provinces
        let border = false, coast = false;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
                                [x + 1, y + 1], [x - 1, y - 1]]) {
          if (nx < 0 || ny < 0 || nx >= HALFW || ny >= HALFH) { coast = true; continue; }
          const nv = this.idx[ny * HALFW + nx];
          if (nv < 0) coast = true;
          else if (nv !== t) border = true;
        }
        if (coast) { r *= 0.40; g *= 0.40; b *= 0.40; }
        else if (border) { r = r * 0.26 + 14; g = g * 0.26 + 11; b = b * 0.26 + 8; }
        // embossed relief, exaggerated in the mountains
        const mFac = TERR_DEFS[t].terrain === 'mount' ? 2.4 : 1;
        const e1 = fnoise(x * 0.035 + 11, y * 0.035 + 5);
        const e2 = fnoise((x + 1.6) * 0.035 + 11, (y + 1.6) * 0.035 + 5);
        const relief = (e1 - e2) * 130 * mFac;
        // warmer light in the south, cooler in the north
        const warmth = (y / HALFH - 0.45) * 16;
        const sh = (fnoise(x * 0.09, y * 0.09) - 0.5) * 22 + relief;
        d[o * 4] = clamp(r + sh + warmth, 0, 255);
        d[o * 4 + 1] = clamp(g + sh + warmth * 0.4, 0, 255);
        d[o * 4 + 2] = clamp(b + sh - warmth * 0.5, 0, 255);
        d[o * 4 + 3] = 255;
      }
    }
    hc.putImageData(img, 0, 0);
    const lc = this.landCanvas.getContext('2d');
    lc.clearRect(0, 0, W, MAPH);
    lc.imageSmoothingEnabled = true;
    lc.drawImage(this.halfCanvas, 0, 0, W, MAPH);
    lc.drawImage(this.grainCanvas, 0, 0);
    this.decorate(lc);
  },

  /* hand-inked terrain icons, medieval-chart style */
  decorate(lc) {
    const ink = 'rgba(58,40,24,0.6)';
    for (let i = 0; i < TERR_DEFS.length; i++) {
      const def = TERR_DEFS[i];
      if (def.terrain === 'plain') continue;
      const rng = mulberry32(i * 977 + 13);
      const cx = this.cx[i] * 2, cy = this.cy[i] * 2;
      const treeInk = def.sherwood ? 'rgba(18,54,26,0.9)' : ink;
      const goal = def.sherwood ? 11 : 5;
      let placed = 0, tries = 0;
      while (placed < goal && tries++ < 60) {
        const a = rng() * TAU, rr = (def.sherwood ? 18 : 34) + rng() * (def.sherwood ? 78 : 64);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.8;
        if (this.terrAt(x, y + MAPY) !== i) continue;
        if (Math.abs(x - cx) < 50 && y < cy + 4 && y > cy - 58) continue; // keep the banner clear
        lc.save();
        lc.translate(x, y);
        lc.strokeStyle = treeInk;
        lc.fillStyle = treeInk;
        lc.lineWidth = 2;
        if (def.terrain === 'mount') {
          lc.beginPath();
          lc.moveTo(-12, 6); lc.lineTo(-2, -10); lc.lineTo(8, 6);
          lc.stroke();
          lc.beginPath();
          lc.moveTo(-2, -10); lc.lineTo(2, -2);
          lc.stroke();
        } else if (def.terrain === 'forest') {
          const s = def.sherwood ? (0.8 + rng() * 0.7) : 1;
          lc.scale(s, s);
          lc.beginPath(); lc.arc(0, -6, 5.5, 0, TAU); lc.fill();
          lc.beginPath(); lc.arc(-4, -2, 4.5, 0, TAU); lc.fill();
          lc.beginPath(); lc.arc(4, -2, 4.5, 0, TAU); lc.fill();
          lc.strokeStyle = 'rgba(70,46,24,0.8)';
          lc.beginPath(); lc.moveTo(0, 2); lc.lineTo(0, 9); lc.stroke();
        } else { // moor
          lc.beginPath();
          lc.moveTo(-9, 0); lc.lineTo(-3, 0);
          lc.moveTo(1, 4); lc.lineTo(8, 4);
          lc.stroke();
        }
        lc.restore();
        placed++;
      }
    }
  },

  terrAt(px, py) {
    const x = Math.floor(px / 2), y = Math.floor((py - MAPY) / 2);
    if (x < 0 || y < 0 || x >= HALFW || y >= HALFH) return -1;
    return this.idx[y * HALFW + x];
  },

  center(i) { return [this.cx[i] * 2, MAPY + this.cy[i] * 2]; },
};

/* ---------------- game state ---------------- */
function newGame(heroIdx, diff) {
  const hero = HEROES[heroIdx];
  const lords = [
    { id: 0, name: hero.name, color: PLAYER_COLOR, isPlayer: true, alive: true,
      gold: 80, fame: 10, joust: hero.joust, blade: hero.blade, lead: hero.lead,
      army: { s: 10, k: 2, c: 0 } },
  ];
  AI_LORDS.forEach((a, i) => lords.push({
    id: i + 1, name: a.name, color: a.color, isPlayer: false, alive: true,
    gold: 80, fame: 10, joust: a.joust, blade: a.blade, lead: a.lead,
    army: { s: 10, k: 2, c: 0 },
  }));
  const terr = TERR_DEFS.map((t, i) => ({
    id: i, name: t.name, owner: -1,
    garrison: t.sherwood ? 0 : irnd(6, 14), castle: 0,
    sherwood: !!t.sherwood,
    income: t.sherwood ? 0 : clamp(5 + Math.round(MapGen.area[i] / 1800), 5, 15),
  }));
  HOME_TERRS.forEach((ti, li) => {
    terr[ti].owner = li;
    terr[ti].garrison = 10;
    terr[ti].castle = 1;
    terr[ti].income += 4;
  });
  S = { month: 2, year: 1191, diff, lords, terr, actionUsed: false, sherwoodReadyAt: 0, log: [] };
  MapGen.repaint();
  saveGame();
}

function player() { return S.lords[0]; }
function lordTerrs(li) { return S.terr.filter(t => t.owner === li); }
function dateStr() { return `${MONTHS[S.month % 12]}, ${S.year} AD`; }
function armyStr(a, lead = 0) { return a.s + a.k * 4 + lead * 1.5; }
function armySize(a) { return a.s + a.k; }
function defStr(t, breach = 0) {
  return t.garrison * (1 + 0.3 * t.castle * (1 - breach));
}
function effLead(l) { return l.lead + l.fame / 25; }

/* territories lord `li` can march on (adjacent to any owned territory) */
function targetsFor(li) {
  const out = new Set();
  for (const t of S.terr) {
    if (t.owner !== li) continue;
    for (const a of MapGen.adj[t.id]) {
      // only land-bordering provinces, and never the outlaw greenwood
      if (S.terr[a].owner !== li && !S.terr[a].sherwood) out.add(a);
    }
  }
  return [...out];
}

/* ---------------- Sherwood Forest / Robin Hood ---------------- */
function monthAbs() { return S.year * 12 + S.month; }
function sherwoodCooldown() { return Math.max(0, (S.sherwoodReadyAt || 0) - monthAbs()); }
function playerBordersSherwood() {
  if (SHERWOOD < 0) return false;
  for (const a of MapGen.adj[SHERWOOD]) if (S.terr[a].owner === 0) return true;
  return false;
}
function richestRival() {
  let best = null;
  for (const l of S.lords) if (!l.isPlayer && l.alive && (!best || l.gold > best.gold)) best = l;
  return best;
}
/* score 0..30 from the archery contest -> Merry Men, loot and fame */
function grantRobinAid(score) {
  const p = player();
  const men = Math.round(3 + score / 3);              // longbowmen, counted as soldiers
  const knights = score >= 24 ? 2 : score >= 13 ? 1 : 0;
  p.army.s += men; p.army.k += knights;
  let gold = 0; const rival = richestRival();
  if (rival) { gold = Math.min(rival.gold, 15 + score); rival.gold -= gold; p.gold += gold; }
  p.fame += 4 + Math.round(score / 6);
  S.sherwoodReadyAt = monthAbs() + 3;
  saveGame();
  return { men, knights, gold, rival };
}

/* ---------------- battle resolution (shared with AI) ---------------- */
/* returns rounds for animation + outcome; mutates nothing */
function simBattle(att, attArmy, defT, breach, stance = 1) {
  // stance: 0 cautious, 1 steady, 2 bold
  const dealt = [0.85, 1, 1.25][stance];
  const taken = [0.75, 1, 1.15][stance];
  const a = { s: attArmy.s, k: attArmy.k };
  let dGar = defT.garrison;
  const dMul = 1 + 0.3 * defT.castle * (1 - breach);
  const leadBonus = 1 + effLead(att) * 0.045;
  const rounds = [];
  let guard = 0;
  while (armySize(a) > 0 && dGar > 0 && guard++ < 40) {
    const A = (a.s + a.k * 4) * leadBonus;
    const D = dGar * dMul;
    let dLoss = Math.max(1, Math.round(A * rnd(0.07, 0.13) * dealt / dMul));
    let aLoss = Math.max(1, Math.round(D * rnd(0.07, 0.13) * taken));
    dLoss = Math.min(dLoss, dGar);
    aLoss = Math.min(aLoss, armySize(a));
    dGar -= dLoss;
    // soldiers die first
    const sl = Math.min(a.s, aLoss);
    a.s -= sl;
    a.k -= Math.min(a.k, aLoss - sl);
    rounds.push({ aLoss, dLoss, as: a.s, ak: a.k, dg: dGar });
  }
  return { rounds, win: dGar <= 0 && armySize(a) > 0, as: a.s, ak: a.k, dg: Math.max(0, dGar) };
}

/* apply a finished battle to the world */
function applyBattle(attLord, defT, res) {
  attLord.army.s = res.as;
  attLord.army.k = res.ak;
  if (res.win) {
    captureTerr(defT.id, attLord.id, attLord);
  } else {
    defT.garrison = Math.max(1, res.dg);
  }
}

function captureTerr(ti, li, lord) {
  const t = S.terr[ti];
  const prevOwner = t.owner;
  t.owner = li;
  const g = Math.min(8, lord.army.s);
  lord.army.s -= g;
  t.garrison = Math.max(2, g);
  lord.fame += 4;
  MapGen.repaint();
  if (prevOwner >= 0) checkElimination(prevOwner);
}

function checkElimination(li) {
  const l = S.lords[li];
  if (l.alive && lordTerrs(li).length === 0) {
    l.alive = false;
    l.army = { s: 0, k: 0, c: 0 };
    toast(`The house of ${l.name} has fallen!`, '#ffb0a0');
    Sfx.dirge();
  }
}

function playerWon() { return S.terr.every(t => t.sherwood || t.owner === 0); }
function playerLost() { return !S.lords[0].alive || lordTerrs(0).length === 0; }

/* ---------------- AI ---------------- */
function aiTakeTurn(l) {
  if (!l.alive) return;
  const diff = DIFFS[S.diff];
  // shopping
  let budget = l.gold * 0.8;
  const myTargets = targetsFor(l.id).map(i => S.terr[i]);
  const wantCat = myTargets.some(t => t.castle > 0) && l.army.c < 2;
  if (wantCat && budget >= COSTS.catapult && Math.random() < 0.5) {
    l.gold -= COSTS.catapult; budget -= COSTS.catapult; l.army.c++;
  }
  while (budget >= COSTS.knight && Math.random() < 0.55) {
    l.gold -= COSTS.knight; budget -= COSTS.knight; l.army.k++;
  }
  while (budget >= COSTS.soldier) {
    l.gold -= COSTS.soldier; budget -= COSTS.soldier; l.army.s++;
  }
  // pick a fight
  if (myTargets.length === 0) return;
  myTargets.sort((a, b) => defStr(a) - defStr(b));
  const target = myTargets[0];
  const myStr = armyStr(l.army, effLead(l));
  const breach = (target.castle > 0 && l.army.c > 0) ? 0.45 : 0;
  if (myStr > defStr(target, breach) * diff.aiAggro && armySize(l.army) > 6) {
    const res = simBattle(l, l.army, target, breach);
    const vsPlayer = target.owner === 0;
    applyBattle(l, target, res);
    if (res.win) {
      toast(`${l.name} has seized ${target.name}!`, vsPlayer ? '#ffb0a0' : '#e8d8b0');
      if (vsPlayer) { buzz(120); Sfx.crack(); }
    } else if (vsPlayer) {
      toast(`Your garrison at ${target.name} repelled ${l.name}!`, '#b8e8a8');
      Sfx.fanfare();
    }
  }
}

/* ---------------- events ---------------- */
const EVENTS = [
  {
    title: 'Bountiful Harvest',
    text: () => 'Your fields overflow with grain. The granaries pay 35 gold into your coffers.',
    apply: () => { player().gold += 35; Sfx.coin(); },
  },
  {
    title: 'Bandits on the Roads',
    text: () => 'Outlaws plague your lands and waylay your tax wagons. You lose 25 gold.',
    apply: () => { player().gold = Math.max(0, player().gold - 25); },
  },
  {
    title: 'Wandering Knights',
    text: () => 'Word of your renown spreads. Two knights-errant pledge their lances to your banner!',
    apply: () => { player().army.k += 2; Sfx.fanfare(); },
  },
  {
    title: 'Fever in the Camp',
    text: () => 'A grim fever sweeps your encampment. Some of your soldiers will not rise again.',
    apply: () => { player().army.s = Math.max(0, player().army.s - irnd(2, 5)); },
  },
  {
    title: 'A Gift from the Greenwood',
    text: () => 'A hooded archer leaves a heavy purse at your camp by night — Robin Hood robs the rich to aid the just cause. You gain 30 gold.',
    apply: () => { player().gold += 30; Sfx.coin(); },
  },
  {
    title: 'A Royal Tribute',
    text: () => 'Travelling minstrels sing of your deeds in every hall. Your fame grows.',
    apply: () => { player().fame += 8; Sfx.fanfare(); },
  },
];

function rollEvent() {
  if (Math.random() < 0.28) return pick(EVENTS);
  return null;
}

/* ---------------- turn flow ---------------- */
function collectIncome() {
  const diff = DIFFS[S.diff];
  for (const l of S.lords) {
    if (!l.alive) continue;
    let inc = lordTerrs(l.id).reduce((s, t) => s + t.income, 0);
    if (!l.isPlayer) inc = Math.round(inc * diff.aiGold) + 4;
    l.gold += inc;
    if (l.isPlayer) l.lastIncome = inc;
  }
}

function advanceMonth() {
  S.month++;
  if (S.month >= 12) { S.month = 0; S.year++; }
}

/* ---------------- save / load ---------------- */
const SAVE_KEY = 'crownOfAlbion.save.v3';
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    S = JSON.parse(raw);
    MapGen.repaint();
    return true;
  } catch (e) { return false; }
}
function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}
