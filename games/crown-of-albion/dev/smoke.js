'use strict';
/* Headless smoke test: stubs the DOM/canvas, loads the game scripts,
   then exercises map generation, the economy, combat and the AI.
   Run with:  node dev/smoke.js  (from games/crown-of-albion/) */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---- minimal canvas/DOM stubs ---- */
function makeCtx(w, h) {
  const noop = () => {};
  return new Proxy({}, {
    get(t, prop) {
      if (prop === 'measureText') return () => ({ width: 50 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: noop });
      }
      if (prop === 'createImageData') {
        return (iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) });
      }
      if (prop === 'putImageData' || prop === 'getImageData') {
        return prop === 'getImageData'
          ? (x, y, iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) })
          : noop;
      }
      if (prop === 'canvas') return { width: w, height: h };
      return noop;
    },
    set() { return true; },
  });
}
function makeCanvas() {
  const c = {
    width: 300, height: 150,
    style: {},
    getContext: () => makeCtx(c.width, c.height),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 1280 }),
    addEventListener: () => {},
  };
  return c;
}

const listeners = {};
const storage = {};
const sandbox = {
  console,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0,
  setTimeout: (fn) => 0,
  navigator: {},
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; },
  },
  document: {
    createElement: tag => makeCanvas(),
    getElementById: () => makeCanvas(),
  },
  window: {
    devicePixelRatio: 1,
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    innerWidth: 720, innerHeight: 1280,
  },
};
sandbox.window.AudioContext = undefined;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['js/core.js', 'js/world.js', 'js/scenes.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInContext(src, sandbox, { filename: f });
}

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`  ok  ${name}`);
  else { console.error(`FAIL  ${name}`); failures++; }
}

vm.runInContext(`
  // boot (fires the 'load' listener path manually)
  initEngine();
  MapGen.build();
  setScene(TitleScene);

  __r = {};
  __r.allLand = MapGen.area.every(a => a > 200);
  __r.allAdj = MapGen.adj.every(s => s.size >= 1);
  __r.centerHit = MapGen.terrAt(360, 620) >= 0;
  __r.seaMiss = MapGen.terrAt(5, 130) === -1 && MapGen.terrAt(715, 1115) === -1;

  newGame(0, 1);
  __r.lords = S.lords.length === 4 && S.lords[0].isPlayer;
  __r.homes = HOME_TERRS.every((ti, li) => S.terr[ti].owner === li && S.terr[ti].castle === 1);
  __r.neutrals = S.terr.filter(t => t.owner === -1 && !t.sherwood).length === 8;
  __r.targets = targetsFor(0).length >= 1;
  __r.save = hasSave();

  // Sherwood Forest: exists, unconquerable, never a march target, land-bordered
  __r.sherwoodExists = SHERWOOD >= 0 && S.terr[SHERWOOD].sherwood && S.terr[SHERWOOD].owner === -1;
  __r.sherwoodHasLandBorder = MapGen.adj[SHERWOOD].size >= 2;
  let sherwoodTargetable = false;
  for (let li = 0; li < S.lords.length; li++) if (targetsFor(li).includes(SHERWOOD)) sherwoodTargetable = true;
  __r.sherwoodSafe = !sherwoodTargetable;
  // land-only adjacency: no two provinces are "adjacent" unless they touch on land
  __r.adjSymmetric = MapGen.adj.every((set, i) => [...set].every(j => MapGen.adj[j].has(i)));
  // Robin's aid grants Merry Men, loot and a cooldown
  const beforeS = S.lords[0].army.s, beforeGold = S.lords[0].gold;
  const aid = grantRobinAid(26);
  __r.robinAid = S.lords[0].army.s > beforeS && aid.men > 0 && sherwoodCooldown() > 0;

  // battle math: a big host should beat a small garrison nearly always
  let wins = 0;
  for (let i = 0; i < 60; i++) {
    const t = { garrison: 8, castle: 0 };
    if (simBattle(S.lords[0], { s: 40, k: 8 }, t, 0, 1).win) wins++;
  }
  __r.battleStrongWins = wins > 55;
  // and a tiny host should usually lose against a fortress
  wins = 0;
  for (let i = 0; i < 60; i++) {
    const t = { garrison: 30, castle: 2 };
    if (simBattle(S.lords[0], { s: 4, k: 0 }, t, 0, 1).win) wins++;
  }
  __r.battleWeakLoses = wins < 10;
  // breach helps the attacker
  let winsNoBreach = 0, winsBreach = 0;
  for (let i = 0; i < 200; i++) {
    if (simBattle(S.lords[0], { s: 18, k: 2 }, { garrison: 16, castle: 2 }, 0, 1).win) winsNoBreach++;
    if (simBattle(S.lords[0], { s: 18, k: 2 }, { garrison: 16, castle: 2 }, 0.9, 1).win) winsBreach++;
  }
  __r.breachHelps = winsBreach > winsNoBreach;

  // run 40 AI months; the world must stay consistent
  for (let m = 0; m < 40; m++) {
    for (const l of S.lords) if (!l.isPlayer) aiTakeTurn(l);
    collectIncome();
    advanceMonth();
  }
  __r.consistent = S.terr.every(t => t.owner >= -1 && t.owner < 4 && t.garrison >= 0);
  __r.aliveSync = S.lords.every(l => l.isPlayer || l.alive === (S.terr.some(t => t.owner === l.id)));
  __r.aiExpanded = S.terr.filter(t => t.owner > 0).length > 3;
  __r.sherwoodStaysFree = S.terr[SHERWOOD].owner === -1;  // AI never took it over 40 months

  // capture + elimination wiring
  const victim = S.lords.find(l => !l.isPlayer && l.alive);
  if (victim) {
    for (const t of S.terr) if (t.owner === victim.id) captureTerr(t.id, 0, S.lords[0]);
    __r.elim = !victim.alive;
  } else __r.elim = true;

  // save / load round trip
  saveGame();
  const gold = S.lords[0].gold;
  S = null;
  __r.load = loadGame() && S.lords[0].gold === gold;

  // scene plumbing: every scene renders & updates without throwing
  __r.scenes = true;
  try {
    setScene(SelectScene); scene.render(0.016);
    setScene(MapScene); scene.update(0.016); scene.render(0.016);
    scene.onTap(360, 620); scene.render(0.016);          // select a territory
    Modal.show({ title: 't', lines: 'x', buttons: [{ label: 'ok' }] });
    Modal.render(0.016); Modal.tap(360, 640); Modal.close();
    const foe = S.lords[1];
    setScene(JoustScene, foe, 'gold'); Modal.close();
    scene.startPass();
    for (let i = 0; i < 200 && scene === JoustScene && scene.phase !== 'done'; i++) {
      scene.update(0.016); scene.render(0.016);
      if (scene.phase === 'run' && i === 30) scene.lockAim();
      if (scene.phase === 'ready') scene.startPass();
    }
    Modal.close();
    const target = targetsFor(0)[0];
    if (target !== undefined) {
      S.terr[target].castle = 1;
      setScene(SiegeScene, target); Modal.close();
      scene.onDown(150, 800); scene.onMove(60, 900); scene.onUp(60, 900);
      for (let i = 0; i < 400 && scene === SiegeScene; i++) { scene.update(0.016); scene.render(0.016); }
      Modal.close();
      if (scene === BattleScene) {
        scene.begin(1);
        for (let i = 0; i < 400 && scene === BattleScene && scene.phase !== 'done'; i++) {
          scene.update(0.016); scene.render(0.016);
        }
        Modal.close();
      }
    }
    setScene(RaidScene, S.lords[1]); Modal.close();
    scene.nextPrompt();
    for (let i = 0; i < 600 && scene === RaidScene && scene.phase !== 'done'; i++) {
      scene.update(0.016); scene.render(0.016);
      if (scene.phase === 'prompt') scene.resolve(true);
    }
    Modal.close();
    setScene(ArcheryScene); Modal.close();
    for (let i = 0; i < 400 && scene === ArcheryScene && scene.phase !== 'done'; i++) {
      scene.update(0.016); scene.render(0.016);
      if (scene.phase === 'aim') scene.loose();
    }
    Modal.close();
    setScene(EndScene, true); scene.update(0.016); scene.render(0.016);
    setScene(EndScene, false); scene.update(0.016); scene.render(0.016);
    setScene(TitleScene); scene.update(0.016); scene.render(0.016);
  } catch (e) {
    __r.scenes = false;
    __r.sceneErr = e.stack;
  }
`, sandbox, { filename: 'smoke-body' });

const r = sandbox.__r;
check('map: every territory has land', r.allLand);
check('map: every territory has a neighbour', r.allAdj);
check('map: centre tap hits land', r.centerHit);
check('map: corners are sea', r.seaMiss);
check('state: four lords, player first', r.lords);
check('state: home provinces assigned with castles', r.homes);
check('state: eight neutral provinces', r.neutrals);
check('state: player has marchable targets', r.targets);
check('state: autosave written', r.save);
check('sherwood: exists as a free, unconquerable province', r.sherwoodExists);
check('sherwood: has land borders', r.sherwoodHasLandBorder);
check('sherwood: is never a march target', r.sherwoodSafe);
check('map: land adjacency is symmetric', r.adjSymmetric);
check('robin: aid grants Merry Men, loot and a cooldown', r.robinAid);
check('battle: strong host wins', r.battleStrongWins);
check('battle: weak host loses vs fortress', r.battleWeakLoses);
check('battle: breached walls help the attacker', r.breachHelps);
check('ai: 40 months leave world consistent', r.consistent);
check('ai: alive flag matches holdings', r.aliveSync);
check('ai: rivals expand', r.aiExpanded);
check('sherwood: stays free after 40 AI months', r.sherwoodStaysFree);
check('rules: losing all land eliminates a lord', r.elim);
check('save: load round-trips', r.load);
check('scenes: all scenes run without throwing', r.scenes);
if (r.sceneErr) console.error(r.sceneErr);

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nAll smoke checks passed.');
