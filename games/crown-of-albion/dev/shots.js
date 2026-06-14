'use strict';
/* Capture gameplay screenshots with headless Chromium and report
   any runtime errors. Run with:  node dev/shots.js */

const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  await page.goto(url);
  await page.waitForTimeout(900);

  const shot = async name => {
    await page.screenshot({ path: path.join(__dirname, name) });
    console.log('captured', name);
  };

  await shot('shot-title.png');

  // hero select via a real click on "New Saga"
  await page.mouse.click(360, 920);
  await page.waitForTimeout(400);
  await shot('shot-select.png');

  // start a game and walk the scenes directly
  await page.evaluate(() => {
    newGame(0, 1);
    setScene(MapScene);
    MapScene.selected = HOME_TERRS[0];   // select Wessex to show land-march routes
  });
  await page.waitForTimeout(600);
  await shot('shot-map.png');

  // Sherwood Forest selected, with Robin Hood's aid available
  await page.evaluate(() => {
    Modal.close();
    for (const a of MapGen.adj[SHERWOOD]) { S.terr[a].owner = 0; break; } // hold a bordering province
    MapGen.repaint();
    setScene(MapScene);
    MapScene.selected = SHERWOOD;
  });
  await page.waitForTimeout(500);
  await shot('shot-sherwood.png');

  // Robin Hood archery contest
  await page.evaluate(() => {
    setScene(ArcheryScene);
    Modal.close();
    ArcheryScene.shots = [{ x: 556, y: 628, ring: 10 }, { x: 540, y: 660, ring: 5 }];
    ArcheryScene.arrow = 3;
  });
  await page.waitForTimeout(500);
  await shot('shot-archery.png');

  await page.evaluate(() => {
    Modal.close();
    setScene(JoustScene, S.lords[1], 'gold');
    Modal.close();
    JoustScene.startPass();
  });
  await page.waitForTimeout(1100);
  await shot('shot-joust.png');

  await page.evaluate(() => {
    Modal.close();
    const target = targetsFor(0)[0];
    S.terr[target].castle = 1;
    setScene(SiegeScene, target);
    Modal.close();
    SiegeScene.fire(620, -520);
  });
  await page.waitForTimeout(450);
  await shot('shot-siege.png');

  await page.evaluate(() => {
    Modal.close();
    const target = targetsFor(0)[0];
    setScene(BattleScene, target, 0.5);
    Modal.close();
    BattleScene.begin(1);
  });
  await page.waitForTimeout(1900);
  await shot('shot-battle.png');

  await page.evaluate(() => {
    Modal.close();
    setScene(RaidScene, S.lords[1]);
    Modal.close();
    RaidScene.nextPrompt();
  });
  await page.waitForTimeout(350);
  await shot('shot-raid.png');

  await page.evaluate(() => { Modal.close(); setScene(EndScene, true); });
  await page.waitForTimeout(1200);
  await shot('shot-victory.png');

  await browser.close();
  if (errors.length) {
    console.error('RUNTIME ERRORS:\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log('No runtime errors.');
})();
