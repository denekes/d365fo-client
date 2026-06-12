'use strict';
/* =========================================================
   Crown of Albion — world
   map generation / game state / economy / combat / AI
   ========================================================= */

const MAPY = 120, MAPH = 1000;          // map strip inside the screen
const HALFW = 360, HALFH = 500;         // half-resolution raster for territories

const TERR_DEFS = [
  { name: 'Norhelm',    sx: 180, sy: 60 },
  { name: 'Greywick',   sx: 105, sy: 115 },
  { name: 'Ravenmoor',  sx: 255, sy: 115 },
  { name: 'Mistshore',  sx: 62,  sy: 200 },
  { name: 'Highfell',   sx: 180, sy: 178 },
  { name: 'Eastmarch',  sx: 298, sy: 200 },
  { name: 'Westvale',   sx: 112, sy: 272 },
  { name: 'Stonereach', sx: 238, sy: 262 },
  { name: 'Caer Bryn',  sx: 66,  sy: 330 },
  { name: 'Sunhollow',  sx: 180, sy: 345 },
  { name: 'Oakhaven',   sx: 292, sy: 330 },
  { name: 'Thornmere',  sx: 180, sy: 438 },
];

const HOME_TERRS = [11, 0, 5, 3];  // player, then the three rival lords

const HEROES = [
  { name: 'Sir Aldric the Bold',    joust: 8, blade: 5, lead: 5, blurb: 'A tournament legend. None ride the tilt so true.' },
  { name: 'Lady Maren of Thornmere',joust: 5, blade: 8, lead: 5, blurb: 'A duelist without equal, quick as winter wind.' },
  { name: 'Sir Corwin the Wise',    joust: 5, blade: 5, lead: 8, blurb: 'A master of war. Soldiers fight twice as hard under his banner.' },
];

const AI_LORDS = [
  { name: 'Lord Bran the Black',   color: '#34548f', joust: 7, blade: 6, lead: 6 },
  { name: 'Duke Osric of Eastmarch', color: '#3e7c3a', joust: 6, blade: 7, lead: 5 },
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
  halfCanvas: null, landCanvas: null, grainCanvas: null,

  inIsland(x, y) {
    const nx = (x - 180) / 152, ny = (y - 250) / 218;
    const r = nx * nx + ny * ny;
    const n = fnoise(x * 0.018 + 3.7, y * 0.018 + 9.2);
    return r + (n - 0.5) * 0.55 < 0.94;
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
    const cols = TERR_DEFS.map((_, i) => {
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
        // border / coast shading
        let border = false, coast = false;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (nx < 0 || ny < 0 || nx >= HALFW || ny >= HALFH) { coast = true; continue; }
          const nv = this.idx[ny * HALFW + nx];
          if (nv < 0) coast = true;
          else if (nv !== t) border = true;
        }
        if (coast) { r *= 0.45; g *= 0.45; b *= 0.45; }
        else if (border) { r *= 0.62; g *= 0.62; b *= 0.62; }
        const sh = (fnoise(x * 0.09, y * 0.09) - 0.5) * 26;
        d[o * 4] = clamp(r + sh, 0, 255);
        d[o * 4 + 1] = clamp(g + sh, 0, 255);
        d[o * 4 + 2] = clamp(b + sh, 0, 255);
        d[o * 4 + 3] = 255;
      }
    }
    hc.putImageData(img, 0, 0);
    const lc = this.landCanvas.getContext('2d');
    lc.clearRect(0, 0, W, MAPH);
    lc.imageSmoothingEnabled = true;
    lc.drawImage(this.halfCanvas, 0, 0, W, MAPH);
    lc.drawImage(this.grainCanvas, 0, 0);
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
    garrison: irnd(6, 14), castle: 0,
    income: clamp(5 + Math.round(MapGen.area[i] / 2600), 5, 15),
  }));
  HOME_TERRS.forEach((ti, li) => {
    terr[ti].owner = li;
    terr[ti].garrison = 10;
    terr[ti].castle = 1;
    terr[ti].income += 4;
  });
  S = { month: 2, year: 1191, diff, lords, terr, actionUsed: false, log: [] };
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
      if (S.terr[a].owner !== li) out.add(a);
    }
  }
  return [...out];
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

function playerWon() { return S.terr.every(t => t.owner === 0); }
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
const SAVE_KEY = 'crownOfAlbion.save.v1';
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
