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

  // hosts: every lord's army starts stationed at its home province
  __r.hostsAtHome = S.lords.every((l, i) => l.army.loc === HOME_TERRS[i]);
  // hosts: a stationed host makes its province far harder to take
  const defended = S.terr[HOME_TERRS[1]];           // Lothian, AI home with host
  S.lords[1].army.s = 20; S.lords[1].army.k = 4;
  let winsVsHost = 0, winsVsGarrison = 0;
  for (let i = 0; i < 80; i++) {
    S.lords[1].army.loc = defended.id;              // host at home
    if (simBattle(S.lords[0], { s: 25, k: 3 }, defended, 0, 1).win) winsVsHost++;
    S.lords[1].army.loc = -1;                       // host away
    if (simBattle(S.lords[0], { s: 25, k: 3 }, defended, 0, 1).win) winsVsGarrison++;
  }
  S.lords[1].army.loc = HOME_TERRS[1];
  S.lords[1].army.s = 10; S.lords[1].army.k = 2;
  __r.hostDefends = winsVsHost < winsVsGarrison - 10;
  // hosts: capturing a province with the enemy host in it forces a retreat
  const victim2 = S.lords[1];
  const homeT = S.terr[HOME_TERRS[1]];
  const other = S.terr.find(t => t.owner === -1 && !t.sherwood);
  other.owner = 1;                                   // give the AI a fallback province
  victim2.army.loc = homeT.id;
  const resCap = { win: true, as: 20, ak: 2, dg: 0, dhs: 0, dhk: 0, hadHost: true, rounds: [] };
  applyBattle(S.lords[0], homeT, resCap);
  __r.hostRetreats = victim2.army.loc === other.id && S.lords[0].army.loc === homeT.id;
  // put the world back for the checks that follow
  homeT.owner = 1; other.owner = -1; victim2.alive = true;
  victim2.army = { s: 10, k: 2, c: 0, loc: homeT.id };
  S.lords[0].army.loc = HOME_TERRS[0];
  S.terr.forEach(t => { if (t.owner === 0 && t.id !== HOME_TERRS[0]) t.owner = -1; });
  MapGen.repaint();

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
  __r.hostsValid = S.lords.every(l => !l.alive || lordTerrs(l.id).length === 0 ||
    (l.army.loc >= 0 && S.terr[l.army.loc].owner === l.id));
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

  // marriage: wedding a house yields its castled provinces (never the home
  // seat), sets the married state, and swears a truce
  newGame(0, 1);
  const dowryT = S.terr.find(t => t.owner === -1 && !t.sherwood);
  dowryT.owner = 1; dowryT.castle = 1;
  const wed = acceptMarriage(1);
  __r.marriageDowry = wed.dowry.some(t => t.id === dowryT.id) && dowryT.owner === 0;
  __r.marriageKeepsHome = S.terr[HOME_TERRS[1]].owner === 1;
  __r.marriageState = S.marriage.to === 1 && S.marriage.kin === AI_LORDS[0].kin && truceWith(1);
  // the truce holds: an overwhelming allied host must not strike your lands
  S.lords[1].army = { s: 80, k: 10, c: 2, loc: HOME_TERRS[1] };
  S.lords[1].gold = 500;
  for (const t of S.terr) if (t.owner === -1 && !t.sherwood) { t.owner = 0; t.garrison = 1; }
  MapGen.repaint();
  const beforeProvs = lordTerrs(0).length;
  for (let i = 0; i < 6; i++) aiTakeTurn(S.lords[1]);
  __r.trucePeace = lordTerrs(0).length === beforeProvs;
  // no second marriage, and no offers below the fame threshold
  __r.oneMarriage = rollMarriageOffer() === null;
  newGame(0, 1);   // a clean world for the scene walk

  // scene plumbing: every scene renders & updates without throwing
  __r.scenes = true;
  try {
    acceptMarriage(1);
    setScene(WeddingScene, 1, { dowry: [], gold: 40, kin: AI_LORDS[0].kin });
    for (let i = 0; i < 30; i++) { scene.update(0.016); scene.render(0.016); }
    scene.onTap(360, 640);
    if (scene !== MapScene) throw new Error('wedding did not return to the map');
    newGame(0, 1);
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
    // gesture classification: a short 30px right-swipe must count as 'right',
    // a slow long swipe must still register, and a still tap as 'tap'
    scene.nextPrompt();
    scene.prompt = 'right';
    const hp1 = scene.ehp;
    scene.onDown(300, 600); scene.onUp(330, 604);          // short flick right
    __r.raidShortSwipe = scene.ehp === hp1 - 1;
    scene.update(0.9); // leave 'hit'
    if (scene.phase !== 'prompt') scene.nextPrompt();
    scene.prompt = 'left';
    const hp2 = scene.ehp;
    scene.onDown(500, 600); scene.onUp(200, 640);          // long (slow) swipe left
    __r.raidLongSwipe = scene.ehp === hp2 - 1;
    scene.update(0.9);
    if (scene.phase !== 'prompt') scene.nextPrompt();
    scene.prompt = 'tap';
    const hp3 = scene.ehp;
    scene.onDown(360, 600); scene.onUp(365, 603);          // a still tap
    __r.raidTap = scene.ehp === hp3 - 1;
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
check('hosts: armies start stationed at home', r.hostsAtHome);
check('hosts: a stationed host defends its province', r.hostDefends);
check('hosts: a routed host retreats to friendly soil', r.hostRetreats);
check('battle: strong host wins', r.battleStrongWins);
check('battle: weak host loses vs fortress', r.battleWeakLoses);
check('battle: breached walls help the attacker', r.breachHelps);
check('ai: 40 months leave world consistent', r.consistent);
check('hosts: still on friendly soil after 40 months', r.hostsValid);
check('ai: alive flag matches holdings', r.aliveSync);
check('ai: rivals expand', r.aiExpanded);
check('sherwood: stays free after 40 AI months', r.sherwoodStaysFree);
check('rules: losing all land eliminates a lord', r.elim);
check('save: load round-trips', r.load);
check('marriage: dowry passes the castled provinces', r.marriageDowry);
check('marriage: the house keeps its home seat', r.marriageKeepsHome);
check('marriage: married state and truce are sworn', r.marriageState);
check('marriage: the wedding truce holds against attack', r.trucePeace);
check('marriage: only one match is ever offered', r.oneMarriage);
check('raid: a short 30px flick registers as a swipe', r.raidShortSwipe);
check('raid: a long slow swipe registers', r.raidLongSwipe);
check('raid: a still tap registers as a tap', r.raidTap);
check('scenes: all scenes run without throwing', r.scenes);
if (r.sceneErr) console.error(r.sceneErr);

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nAll smoke checks passed.');
