'use strict';
/* =========================================================
   Crown of Albion — scenes
   title / select / map / battle / joust / siege / raid / end
   ========================================================= */

/* ---------------- shared scene art helpers ---------------- */

function skyGradient(y0, y1, top, bot) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  return g;
}

function drawCastleSilhouette(x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fillRect(-90, -60, 180, 60);
  for (let i = 0; i < 7; i++) ctx.fillRect(-90 + i * 28, -72, 14, 14);
  ctx.fillRect(-120, -110, 40, 110);
  ctx.fillRect(80, -110, 40, 110);
  for (const tx of [-120, 80]) {
    for (let i = 0; i < 3; i++) ctx.fillRect(tx + i * 16, -122, 8, 14);
  }
  ctx.fillRect(-16, -120, 32, 120);
  ctx.beginPath();
  ctx.moveTo(-16, -120); ctx.lineTo(0, -150); ctx.lineTo(16, -120);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* a side-view knight on horseback (joust) */
function drawJoustKnight(x, y, s, dir, color, o = {}) {
  // o: legPhase, lanceUp (0..1), fall (0..1 rider thrown back)
  const lp = o.legPhase || 0;
  const fall = o.fall || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);

  // tail
  ctx.strokeStyle = shade('#5a4630', -0.2);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-52, -32);
  ctx.quadraticCurveTo(-74, -26 + Math.sin(lp * 2) * 4, -78, -2);
  ctx.stroke();

  // legs (behind)
  ctx.strokeStyle = '#4a3a28';
  ctx.lineWidth = 8;
  for (const [ox, ph] of [[-38, 0], [30, Math.PI]]) {
    const sw = Math.sin(lp + ph) * 16;
    ctx.beginPath();
    ctx.moveTo(ox, -26);
    ctx.quadraticCurveTo(ox + sw * 0.4, 0, ox + sw, 22);
    ctx.stroke();
    ctx.fillStyle = '#241c12';
    ctx.fillRect(ox + sw - 5, 18, 10, 7);
  }

  // body
  ctx.fillStyle = '#5a4630';
  ctx.beginPath();
  ctx.ellipse(-6, -34, 56, 24, 0, 0, TAU);
  ctx.fill();

  // caparison (heraldic drape)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-56, -44);
  ctx.lineTo(46, -44);
  ctx.lineTo(40, -12);
  for (let i = 0; i < 6; i++) ctx.lineTo(34 - i * 16, -12 + (i % 2 ? 0 : 9));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8d8a8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // legs (front)
  ctx.strokeStyle = '#5a4630';
  ctx.lineWidth = 9;
  for (const [ox, ph] of [[-30, Math.PI * 0.9], [40, Math.PI * 1.9]]) {
    const sw = Math.sin(lp + ph) * 17;
    ctx.beginPath();
    ctx.moveTo(ox, -26);
    ctx.quadraticCurveTo(ox + sw * 0.4, 0, ox + sw, 23);
    ctx.stroke();
    ctx.fillStyle = '#2c2418';
    ctx.fillRect(ox + sw - 5, 19, 10, 7);
  }

  // neck + head
  ctx.fillStyle = '#5a4630';
  ctx.beginPath();
  ctx.moveTo(36, -46);
  ctx.quadraticCurveTo(58, -64, 64, -78);
  ctx.lineTo(78, -70);
  ctx.quadraticCurveTo(70, -50, 52, -34);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(76, -72, 16, 9, -0.45, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2c2418';
  ctx.beginPath();
  ctx.moveTo(64, -82); ctx.lineTo(68, -94); ctx.lineTo(73, -82);
  ctx.closePath(); ctx.fill();
  // mane
  ctx.strokeStyle = shade(color, -0.35);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(42, -52);
  ctx.quadraticCurveTo(56, -66, 64, -80);
  ctx.stroke();

  // rider (falls backward when unseated)
  ctx.save();
  ctx.translate(-4, -52);
  if (fall > 0) {
    ctx.translate(-fall * 70, -fall * 55 + fall * fall * 90);
    ctx.rotate(-fall * 2.2);
  }
  // torso
  ctx.fillStyle = shade(color, -0.15);
  ctx.beginPath();
  roundRectPath(-14, -36, 28, 38, 8);
  ctx.fill();
  ctx.strokeStyle = '#1c1410';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // shield (near side)
  ctx.fillStyle = shade(color, 0.15);
  ctx.beginPath();
  ctx.moveTo(-22, -26);
  ctx.lineTo(-2, -26);
  ctx.lineTo(-2, 0);
  ctx.quadraticCurveTo(-12, 12, -22, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8d8a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  // lance arm + lance
  const la = -0.12 - (o.lanceUp || 0) * 0.5;
  ctx.save();
  ctx.translate(10, -22);
  ctx.rotate(la);
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(0, -3.5, 96, 7);
  ctx.fillStyle = '#cdd4dc';
  ctx.beginPath();
  ctx.moveTo(96, -4); ctx.lineTo(110, 0); ctx.lineTo(96, 4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(color, -0.3);
  ctx.beginPath(); ctx.arc(8, 0, 8, 0, TAU); ctx.fill();
  ctx.restore();
  // helmet
  ctx.fillStyle = '#b9c2cc';
  ctx.beginPath();
  ctx.arc(0, -44, 11, Math.PI, 0);
  ctx.lineTo(11, -34);
  ctx.lineTo(-11, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#11141a';
  ctx.fillRect(-9, -42, 18, 3.5);
  // plume
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-2, -54);
  ctx.quadraticCurveTo(-16, -62, -24, -56);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function roundRectPath(x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* tiny soldier / knight figures for the battle scene */
function drawSoldier(x, y, s, color, dir, lunge = 0) {
  ctx.save();
  ctx.translate(x + lunge * 10 * dir, y);
  ctx.scale(s * dir, s);
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-4, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(5, 12); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  roundRectPath(-6, -22, 12, 16, 4);
  ctx.fill();
  ctx.fillStyle = '#c8b89a';
  ctx.beginPath(); ctx.arc(0, -27, 5.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7d8893';
  ctx.fillRect(-7, -31, 14, 4);
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(15, -30); ctx.stroke();
  ctx.fillStyle = '#aab4be';
  ctx.beginPath(); ctx.moveTo(14, -34); ctx.lineTo(18, -28); ctx.lineTo(12, -28); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawMiniKnight(x, y, s, color, dir, lunge = 0) {
  ctx.save();
  ctx.translate(x + lunge * 12 * dir, y);
  ctx.scale(s * dir, s);
  ctx.fillStyle = '#5a4630';
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4a3a28'; ctx.lineWidth = 3;
  for (const ox of [-9, 8]) { ctx.beginPath(); ctx.moveTo(ox, 4); ctx.lineTo(ox, 14); ctx.stroke(); }
  ctx.fillStyle = color;
  ctx.fillRect(-14, -6, 28, 7);
  ctx.fillStyle = '#b9c2cc';
  ctx.beginPath(); roundRectPath(-5, -20, 10, 14, 3); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -23, 4.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -27); ctx.quadraticCurveTo(-6, -31, -9, -28); ctx.stroke();
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(4, -14); ctx.lineTo(22, -18); ctx.stroke();
  ctx.restore();
}

/* ---------------- title ---------------- */
const TitleScene = {
  stars: [],
  enter() {
    this.stars = Array.from({ length: 90 }, () => ({ x: rnd(W), y: rnd(620), r: rnd(0.6, 2), p: rnd(TAU) }));
    this.buttons = [];
  },
  layoutButtons() {
    this.buttons = [];
    let y = 880;
    this.buttons.push(makeBtn(W / 2 - 180, y, 360, 78, 'New Saga', () => {
      setScene(SelectScene);
    }, { size: 30 }));
    y += 96;
    if (hasSave()) {
      this.buttons.push(makeBtn(W / 2 - 180, y, 360, 78, 'Continue', () => {
        if (loadGame()) setScene(MapScene);
        else toast('The chronicle could not be read.');
      }, { size: 30 }));
      y += 96;
    }
    this.buttons.push(makeBtn(W / 2 - 180, y, 360, 60, Sfx.on ? 'Sound: On' : 'Sound: Off', () => {
      Sfx.on = !Sfx.on;
    }, { size: 24, color: '#3a3a4a' }));
  },
  update() {
    if (Math.random() < 0.06) {
      spawn(rnd(W * 0.2, W * 0.8), rnd(700, 1100), {
        vx: rnd(-12, 12), vy: rnd(-26, -8), g: 0, life: rnd(1.5, 3),
        size: rnd(1.5, 3), color: 'rgba(255,220,130,0.9)', shrink: true,
      });
    }
  },
  render() {
    ctx.fillStyle = skyGradient(0, H, '#0b1026', '#2a2138');
    ctx.fillRect(0, 0, W, H);
    for (const s of this.stars) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(gTime * 0.8 + s.p));
      ctx.fillStyle = '#e8eeff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    // moon
    ctx.fillStyle = '#e8e4d2';
    ctx.beginPath(); ctx.arc(580, 150, 46, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(11,16,38,0.85)';
    ctx.beginPath(); ctx.arc(562, 140, 40, 0, TAU); ctx.fill();
    // hills + castle
    ctx.fillStyle = '#141226';
    ctx.beginPath();
    ctx.moveTo(0, 640);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 600 + fnoise(x * 0.006, 3.3) * 90);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();
    drawCastleSilhouette(W / 2, 622, 1.25, '#0c0a18');
    // window lights
    for (const [wx, wy] of [[-60, -40], [40, -36], [-2, -90]]) {
      ctx.fillStyle = `rgba(255,200,90,${0.55 + 0.4 * Math.sin(gTime * 3 + wx)})`;
      ctx.fillRect(W / 2 + wx * 1.25, 622 + wy * 1.25, 7, 10);
    }
    ctx.fillStyle = '#100e1e';
    ctx.fillRect(0, 760, W, H - 760);
    // crown emblem with glow
    const pulse = 1 + Math.sin(gTime * 2) * 0.04;
    ctx.save();
    ctx.shadowColor = 'rgba(255,210,90,0.8)';
    ctx.shadowBlur = 40 * pulse;
    drawCrown(W / 2, 300, 70 * pulse);
    ctx.restore();
    textShadow('CROWN', W / 2, 470, 92, '#ffd75e');
    textShadow('of ALBION', W / 2, 560, 64, '#e8c25e');
    text('~ A Medieval Saga of Conquest ~', W / 2, 640, 28, '#b9a8d8');
    this.layoutButtons();
    for (const b of this.buttons) drawBtn(b);
    text('Win the crown: claim all twelve provinces of Albion.', W / 2, 1210, 22, 'rgba(220,205,170,0.75)');
  },
  onTap(x, y) {
    const b = btnAt(this.buttons, x, y);
    if (b) { Sfx.tap(); b.fn(); }
  },
};

/* ---------------- hero select ---------------- */
const SelectScene = {
  enter() { this.cards = []; },
  render() {
    ctx.fillStyle = skyGradient(0, H, '#1c1626', '#0e0c16');
    ctx.fillRect(0, 0, W, H);
    textShadow('Choose Your Champion', W / 2, 90, 44, '#ffd75e');
    text('Each hero excels at a different path to the crown.', W / 2, 145, 24, '#cbbf9f');
    this.cards = [];
    HEROES.forEach((h, i) => {
      const x = 50, y = 200 + i * 300, w = W - 100, hh = 270;
      this.cards.push({ x, y, w, h: hh, i });
      panel(x, y, w, hh);
      // portrait roundel
      ctx.fillStyle = '#241c2c';
      ctx.beginPath(); ctx.arc(x + 92, y + 100, 62, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#c9a44a'; ctx.lineWidth = 3; ctx.stroke();
      drawHelmIcon(x + 92, y + 96, 46, ['#c8ced8', '#d8c8a8', '#a8b8c8'][i]);
      ctx.strokeStyle = PLAYER_COLOR; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(x + 88, y + 46); ctx.quadraticCurveTo(x + 66, y + 36, x + 56, y + 44); ctx.stroke();
      textShadow(h.name, x + 180, y + 52, 30, '#f5e9c8', 'left');
      const lines = wrapLines(h.blurb, 21, w - 220);
      lines.forEach((ln, li) => text(ln, x + 180, y + 88 + li * 26, 21, '#cbbf9f', 'left'));
      // stat bars
      const stats = [['Joust', h.joust], ['Blade', h.blade], ['Leadership', h.lead]];
      stats.forEach(([nm, v], si) => {
        const sy = y + 158 + si * 32;
        text(nm, x + 180, sy, 20, '#e8d8b0', 'left');
        ctx.fillStyle = '#1c1410';
        roundRect(x + 318, sy - 9, 240, 18, 8); ctx.fill();
        ctx.fillStyle = mix('#7a3030', '#e2b53e', v / 10);
        roundRect(x + 318, sy - 9, 240 * v / 10, 18, 8); ctx.fill();
        text(String(v), x + 580, sy, 20, '#ffd75e', 'left');
      });
      text('Tap to choose', x + w / 2, y + hh - 18, 18, 'rgba(220,205,170,0.55)');
    });
  },
  onTap(x, y) {
    for (const c of this.cards) {
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        Sfx.fanfare();
        this.pickDifficulty(c.i);
        return;
      }
    }
  },
  pickDifficulty(heroIdx) {
    Modal.show({
      title: 'How hard shall the road be?',
      lines: 'Choose the cunning and wealth of your rival lords.',
      buttons: DIFFS.map((d, i) => ({
        label: d.name,
        fn: () => {
          newGame(heroIdx, i);
          setScene(MapScene);
          Modal.show({
            title: 'The King is Dead!',
            lines: [
              'Albion has no ruler, and twelve provinces lie in dispute. Three rival lords muster their banners.',
              'Raise armies, win tournaments, lay siege to castles — and claim the crown for yourself.',
            ],
            buttons: [{ label: 'To Glory!', fn: () => Sfx.fanfare() }],
          });
        },
      })),
    });
  },
};

/* ---------------- the kingdom map ---------------- */
const MapScene = {
  selected: -1,
  recruitOpen: false,
  aiQueue: null,
  aiTimer: 0,
  ships: [{ x: 80, y: 940, v: 8 }, { x: 600, y: 250, v: -6 }],

  enter() {
    this.selected = -1;
    this.recruitOpen = false;
    this.aiQueue = null;
  },

  /* ---- turn flow ---- */
  endTurn() {
    if (this.aiQueue) return;
    this.selected = -1;
    this.recruitOpen = false;
    this.aiQueue = S.lords.filter(l => !l.isPlayer && l.alive).map(l => l.id);
    this.aiTimer = 0.4;
  },
  finishTurn() {
    this.aiQueue = null;
    collectIncome();
    advanceMonth();
    S.actionUsed = false;
    saveGame();
    if (playerLost()) { setScene(EndScene, false); return; }
    toast(`${dateStr()} — taxes bring ${player().lastIncome} gold`, '#ffe9a0');
    Sfx.coin();
    const ev = rollEvent();
    if (ev) {
      Modal.show({ title: ev.title, lines: ev.text(), buttons: [{ label: 'So Be It', fn: () => ev.apply() }] });
    }
  },

  update(dt) {
    for (const sh of this.ships) {
      sh.x += sh.v * dt;
      if (sh.x > W + 40) sh.x = -40;
      if (sh.x < -40) sh.x = W + 40;
    }
    if (this.aiQueue) {
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        if (this.aiQueue.length === 0) { this.finishTurn(); return; }
        const li = this.aiQueue.shift();
        aiTakeTurn(S.lords[li]);
        if (playerLost()) { setScene(EndScene, false); return; }
        this.aiTimer = 0.75;
      }
    }
  },

  /* ---- actions ---- */
  tryAttack(ti) {
    const t = S.terr[ti];
    const p = player();
    if (S.actionUsed) { toast('Your banners have already marched this month.'); return; }
    if (armySize(p.army) <= 0) { toast('You have no army! Recruit soldiers first.'); return; }
    const doBattle = breach => {
      S.actionUsed = true;
      setScene(BattleScene, ti, breach);
    };
    if (t.castle > 0 && p.army.c > 0) {
      Modal.show({
        title: `The Walls of ${t.name}`,
        lines: `A castle guards ${t.name}. Your ${p.army.c} catapult${p.army.c > 1 ? 's' : ''} can batter the walls before the assault.`,
        buttons: [
          { label: 'Lay Siege!', fn: () => { S.actionUsed = true; setScene(SiegeScene, ti); } },
          { label: 'Storm It Directly', fn: () => doBattle(0) },
          { label: 'Withdraw', fn: () => { S.actionUsed = false; } },
        ],
      });
    } else if (t.castle > 0) {
      Modal.show({
        title: 'A Fortified Province',
        lines: `${t.name} is guarded by castle walls and you have no catapults. The assault will be bloody.`,
        buttons: [
          { label: 'Attack Anyway', fn: () => doBattle(0) },
          { label: 'Withdraw', fn: () => {} },
        ],
      });
    } else {
      doBattle(0);
    }
  },

  openJoust() {
    if (S.actionUsed) { toast('Your banners have already marched this month.'); return; }
    const foes = S.lords.filter(l => !l.isPlayer && l.alive);
    if (!foes.length) { toast('No rival lords remain to challenge.'); return; }
    Modal.show({
      title: 'A Grand Tournament',
      lines: 'Send a herald — which lord do you challenge to the tilt?',
      buttons: foes.map(f => ({ label: f.name, fn: () => this.pickWager(f) })),
    });
  },
  pickWager(foe) {
    const canLand = player().fame >= 25 && lordTerrs(foe.id).length > 1 && lordTerrs(0).length > 1;
    const btns = [
      { label: 'Wager 50 Gold', fn: () => { S.actionUsed = true; setScene(JoustScene, foe, 'gold'); } },
    ];
    if (canLand) {
      btns.push({ label: 'Wager a Province!', color: '#6b2a2a', fn: () => { S.actionUsed = true; setScene(JoustScene, foe, 'land'); } });
    }
    btns.push({ label: 'Never Mind', fn: () => {} });
    Modal.show({
      title: `Challenge ${foe.name}`,
      lines: canLand
        ? 'Name the stakes. A province wagered is a province that may be lost...'
        : 'Name the stakes. (Win fame above 25 to wager whole provinces.)',
      buttons: btns,
    });
  },

  openRaid() {
    if (S.actionUsed) { toast('Your banners have already marched this month.'); return; }
    const foes = S.lords.filter(l => !l.isPlayer && l.alive);
    if (!foes.length) { toast('No rival lords remain to rob.'); return; }
    Modal.show({
      title: 'A Night Raid',
      lines: 'Steal into an enemy treasury under cover of dark. Whose gold do you covet?',
      buttons: foes.map(f => ({
        label: `${f.name} (${f.gold}g)`,
        fn: () => { S.actionUsed = true; setScene(RaidScene, f); },
      })),
    });
  },

  /* ---- rendering ---- */
  render(dt) {
    this.drawSea();
    ctx.drawImage(MapGen.landCanvas, 0, MAPY);
    this.drawBanners();
    this.drawHUD();
    if (this.selected >= 0) this.drawInfo();
    this.drawBottomBar();
    if (this.recruitOpen) this.drawRecruit();
    if (this.aiQueue) {
      ctx.fillStyle = 'rgba(8,8,14,0.45)';
      ctx.fillRect(0, 0, W, H);
      textShadow('The rival lords make their moves...', W / 2, H / 2, 34, '#e8d8b0');
    }
  },

  drawSea() {
    ctx.fillStyle = skyGradient(MAPY, MAPY + MAPH, '#27506e', '#16334c');
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(220,240,255,0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const y = MAPY + 60 + i * 110;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const yy = y + Math.sin(x * 0.03 + gTime * 1.4 + i * 2) * 5;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    for (const sh of this.ships) {
      if (MapGen.terrAt(sh.x, sh.y) >= 0) continue; // don't sail over land
      const bob = Math.sin(gTime * 2 + sh.x) * 3;
      ctx.save();
      ctx.translate(sh.x, sh.y + bob);
      ctx.scale(sh.v > 0 ? 1 : -1, 1);
      ctx.fillStyle = '#3a2c1c';
      ctx.beginPath();
      ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(10, 8); ctx.lineTo(-10, 8);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.stroke();
      ctx.fillStyle = '#e8e0c8';
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(12, -6); ctx.lineTo(0, -4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  },

  drawBanners() {
    for (const t of S.terr) {
      const [x, y] = MapGen.center(t.id);
      const col = t.owner < 0 ? NEUTRAL_COLOR : S.lords[t.owner].color;
      if (t.id === this.selected) {
        ctx.strokeStyle = `rgba(255,235,160,${0.6 + 0.4 * Math.sin(gTime * 5)})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y + 6, 42, 0, TAU); ctx.stroke();
      }
      if (t.castle > 0) drawCastleIcon(x - 28, y + 22, 11, t.castle > 1 ? '#e8dcc8' : '#bcb2a0');
      // pole
      ctx.strokeStyle = '#3a2c1c';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x, y - 34); ctx.stroke();
      // waving flag
      const wv = Math.sin(gTime * 3 + t.id) * 4;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y - 34);
      ctx.quadraticCurveTo(x + 24, y - 38 + wv, x + 46, y - 32 + wv);
      ctx.lineTo(x + 46, y - 8 + wv * 0.5);
      ctx.quadraticCurveTo(x + 24, y - 14 + wv, x, y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,15,10,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      textShadow(String(t.garrison), x + 23, y - 21 + wv * 0.6, 21, '#fff');
      if (t.owner === 0) drawCrown(x, y - 44, 8);
    }
  },

  drawHUD() {
    const p = player();
    panel(8, 6, W - 16, 106, { r: 14 });
    ctx.fillStyle = p.color;
    roundRect(24, 20, 14, 78, 5); ctx.fill();
    textShadow(p.name, 52, 36, 26, '#f5e9c8', 'left');
    text(dateStr(), 52, 68, 21, '#cbbf9f', 'left');
    const provs = lordTerrs(0).length;
    text(`${provs} / ${S.terr.length} provinces`, 52, 94, 19, provs >= 8 ? '#ffd75e' : '#a89c80', 'left');
    drawCoin(420, 34);
    textShadow(String(p.gold), 440, 34, 25, '#ffe9a0', 'left');
    drawStar(420, 70, 11);
    textShadow(String(p.fame), 440, 70, 25, '#ffd75e', 'left');
    text(`⚔ ${p.army.s} soldiers  ♞ ${p.army.k} knights  ⛨ ${p.army.c} catapults`, 420, 98, 18, '#cbbf9f', 'left');
    if (!S.actionUsed && !this.aiQueue) {
      ctx.fillStyle = `rgba(120,220,120,${0.6 + 0.4 * Math.sin(gTime * 4)})`;
      ctx.beginPath(); ctx.arc(682, 28, 7, 0, TAU); ctx.fill();
    }
  },

  drawInfo() {
    const t = S.terr[this.selected];
    const x = 30, y = 815, w = W - 60, h = 230;
    panel(x, y, w, h);
    const ownerName = t.owner < 0 ? 'No banner (free folk)' : S.lords[t.owner].name;
    const col = t.owner < 0 ? NEUTRAL_COLOR : S.lords[t.owner].color;
    ctx.fillStyle = col;
    roundRect(x + 24, y + 22, 12, 56, 4); ctx.fill();
    textShadow(t.name, x + 50, y + 38, 30, '#f5e9c8', 'left');
    text(ownerName, x + 50, y + 70, 21, '#cbbf9f', 'left');
    text(`Garrison ${t.garrison}   Income ${t.income}g   ${t.castle ? (t.castle > 1 ? 'Great Castle' : 'Castle') : 'No castle'}`,
      x + 24, y + 106, 21, '#e8d8b0', 'left');
    this.infoBtns = [];
    const p = player();
    if (t.owner === 0) {
      const b1 = makeBtn(x + 20, y + 134, 200, 64, `+5 Men ${COSTS.garrison}g`, () => {
        if (p.gold < COSTS.garrison) { toast('Not enough gold.'); return; }
        p.gold -= COSTS.garrison; t.garrison += 5; Sfx.coin(); saveGame();
      }, { size: 21 });
      b1.enabled = p.gold >= COSTS.garrison;
      this.infoBtns.push(b1);
      if (t.castle < 2) {
        const lbl = t.castle === 0 ? `Castle ${COSTS.castle}g` : `Great Castle ${COSTS.castle}g`;
        const b2 = makeBtn(x + 232, y + 134, 220, 64, lbl, () => {
          if (p.gold < COSTS.castle) { toast('Not enough gold.'); return; }
          p.gold -= COSTS.castle; t.castle++; Sfx.thud(); toast(`Masons raise walls at ${t.name}!`); saveGame();
        }, { size: 21 });
        b2.enabled = p.gold >= COSTS.castle;
        this.infoBtns.push(b2);
      }
    } else {
      const canReach = targetsFor(0).includes(t.id);
      if (canReach) {
        const b = makeBtn(x + 20, y + 134, w - 40, 64, `⚔  March on ${t.name}!`, () => this.tryAttack(t.id), { color: '#6b2a2a', size: 24 });
        b.enabled = !S.actionUsed && !this.aiQueue;
        this.infoBtns.push(b);
      } else {
        text('Too far — your armies can only march on bordering lands.', x + w / 2, y + 166, 20, '#a89c80');
      }
    }
    for (const b of this.infoBtns) drawBtn(b);
  },

  drawBottomBar() {
    panel(8, 1126, W - 16, 148, { r: 14 });
    this.barBtns = [
      makeBtn(24, 1140, 218, 58, 'Recruit', () => { this.recruitOpen = true; }, { size: 24 }),
      makeBtn(252, 1140, 218, 58, 'Tournament', () => this.openJoust(), { size: 24 }),
      makeBtn(480, 1140, 218, 58, 'Night Raid', () => this.openRaid(), { size: 24 }),
      makeBtn(24, 1206, 218, 58, Sfx.musicOn ? 'Music: On' : 'Music: Off', () => { Sfx.musicOn = !Sfx.musicOn; }, { size: 21, color: '#3a3a4a' }),
      makeBtn(252, 1206, 446, 58, 'End the Month ➤', () => this.endTurn(), { size: 25, color: '#2a4a2a' }),
    ];
    if (this.aiQueue) for (const b of this.barBtns) b.enabled = false;
    if (S.actionUsed) { this.barBtns[1].enabled = false; this.barBtns[2].enabled = false; }
    for (const b of this.barBtns) drawBtn(b);
  },

  drawRecruit() {
    ctx.fillStyle = 'rgba(8,8,14,0.6)';
    ctx.fillRect(0, 0, W, H);
    const x = 40, y = 330, w = W - 80, h = 560;
    panel(x, y, w, h);
    textShadow('Muster Your Host', W / 2, y + 52, 34, '#ffd75e');
    drawCoin(W / 2 - 50, y + 95);
    textShadow(String(player().gold) + ' gold', W / 2 + 16, y + 95, 25, '#ffe9a0');
    const p = player();
    const rows = [
      { nm: 'Soldier', desc: 'Sturdy spearmen', cost: COSTS.soldier, key: 's', icon: (ix, iy) => drawSoldier(ix, iy + 14, 1.5, p.color, 1) },
      { nm: 'Knight', desc: 'Worth four soldiers', cost: COSTS.knight, key: 'k', icon: (ix, iy) => drawMiniKnight(ix, iy + 10, 1.6, p.color, 1) },
      { nm: 'Catapult', desc: 'Breaks castle walls', cost: COSTS.catapult, key: 'c', icon: (ix, iy) => { drawCastleIcon(ix, iy, 12, '#8a7a5a'); } },
    ];
    this.recruitBtns = [];
    rows.forEach((r, i) => {
      const ry = y + 140 + i * 110;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(x + 18, ry, w - 36, 96, 12); ctx.fill();
      r.icon(x + 70, ry + 46);
      textShadow(r.nm, x + 130, ry + 30, 26, '#f5e9c8', 'left');
      text(r.desc, x + 130, ry + 62, 19, '#cbbf9f', 'left');
      text(`have ${p.army[r.key]}`, x + 130, ry + 84, 17, '#a89c80', 'left');
      const b = makeBtn(x + w - 200, ry + 18, 170, 60, `Hire ${r.cost}g`, () => {
        if (p.gold < r.cost) { toast('Not enough gold.'); return; }
        p.gold -= r.cost;
        p.army[r.key]++;
        Sfx.coin();
        saveGame();
      }, { size: 22 });
      b.enabled = p.gold >= r.cost;
      this.recruitBtns.push(b);
      drawBtn(b);
    });
    const done = makeBtn(x + w / 2 - 110, y + h - 80, 220, 60, 'Done', () => { this.recruitOpen = false; });
    this.recruitBtns.push(done);
    drawBtn(done);
  },

  onTap(x, y) {
    if (this.aiQueue) return;
    if (this.recruitOpen) {
      const b = btnAt(this.recruitBtns || [], x, y);
      if (b) b.fn();
      return;
    }
    let b = btnAt(this.barBtns || [], x, y);
    if (!b && this.selected >= 0) b = btnAt(this.infoBtns || [], x, y);
    if (b) { Sfx.tap(); b.fn(); return; }
    if (this.selected >= 0 && y >= 815 && y <= 1045) return; // tap inside info panel
    const t = MapGen.terrAt(x, y);
    if (t >= 0) {
      this.selected = (t === this.selected) ? -1 : t;
      Sfx.tap();
    } else if (y < 1126) {
      this.selected = -1;
    }
  },
};

/* ---------------- field battle ---------------- */
const BattleScene = {
  enter(ti, breach) {
    this.t = S.terr[ti];
    this.breach = breach;
    this.res = null;
    this.roundI = 0;
    this.timer = 0;
    this.phase = 'stance';
    this.view = { as: player().army.s, ak: player().army.k, dg: this.t.garrison };
    this.lunge = 0;
    const def = this.t.owner < 0 ? 'the free folk' : S.lords[this.t.owner].name;
    Modal.show({
      title: `The Battle of ${this.t.name}`,
      lines: `Your host meets the garrison of ${def}. How will you order the attack?`,
      buttons: [
        { label: 'Bold Assault (hit hard, bleed hard)', fn: () => this.begin(2), color: '#6b2a2a' },
        { label: 'Steady Advance', fn: () => this.begin(1) },
        { label: 'Cautious Press (spare your men)', fn: () => this.begin(0) },
      ],
    });
  },
  begin(stance) {
    this.res = simBattle(player(), player().army, this.t, this.breach, stance);
    this.phase = 'fight';
    this.timer = 0.6;
  },
  update(dt) {
    if (this.phase !== 'fight') return;
    this.lunge = Math.max(0, this.lunge - dt * 4);
    this.timer -= dt;
    if (this.timer > 0) return;
    if (this.roundI >= this.res.rounds.length) { this.finish(); return; }
    const r = this.res.rounds[this.roundI++];
    this.view = { as: r.as, ak: r.ak, dg: r.dg };
    this.lunge = 1;
    this.timer = 0.85;
    shake = 6;
    Sfx.clash();
    buzz(30);
    burst(W / 2 + rnd(-50, 50), 830 + rnd(-60, 60), 14, { color: '#d8c8a0', spMax: 220 });
    burst(W / 2 + rnd(-50, 50), 830, 6, { color: '#b33a2c', spMax: 140 });
  },
  finish() {
    this.phase = 'done';
    const win = this.res.win;
    const t = this.t;
    applyBattle(player(), t, this.res);
    saveGame();
    if (win) Sfx.fanfare(); else Sfx.dirge();
    Modal.show({
      title: win ? 'VICTORY!' : 'The Day Is Lost',
      lines: win
        ? `${t.name} is yours! Survivors of your host: ${this.res.as} soldiers, ${this.res.ak} knights. A garrison stays to hold it.`
        : `Your assault on ${t.name} was thrown back. Survivors: ${this.res.as} soldiers, ${this.res.ak} knights.`,
      buttons: [{
        label: 'Return to the Map',
        fn: () => {
          if (playerWon()) setScene(EndScene, true);
          else setScene(MapScene);
        },
      }],
    });
  },
  render() {
    // field at dawn
    ctx.fillStyle = skyGradient(0, 560, '#7e5a6e', '#d8a070');
    ctx.fillRect(0, 0, W, 560);
    ctx.fillStyle = 'rgba(255,230,180,0.85)';
    ctx.beginPath(); ctx.arc(W / 2, 520, 60, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3c5232';
    ctx.fillRect(0, 540, W, H - 540);
    ctx.fillStyle = '#46603a';
    ctx.beginPath();
    ctx.moveTo(0, 560);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 548 + fnoise(x * 0.01, 8.1) * 26);
    ctx.lineTo(W, 620); ctx.lineTo(0, 620);
    ctx.closePath(); ctx.fill();
    if (this.t.castle > 0) {
      drawCastleSilhouette(560, 545, 0.9, '#564a3a');
      if (this.breach > 0) {
        ctx.fillStyle = 'rgba(40,30,20,0.8)';
        ctx.beginPath(); ctx.arc(560, 510, 26, 0, TAU); ctx.fill();
      }
    }
    // armies
    const v = this.view;
    const defCol = this.t.owner < 0 ? NEUTRAL_COLOR : S.lords[this.t.owner].color;
    this.drawHost(150, 1, player().color, v.as, v.ak);
    this.drawHost(W - 150, -1, defCol, v.dg, 0);
    // banners & counts
    panel(20, 20, 320, 96, { r: 12 });
    text('Your Host', 60, 50, 22, '#f5e9c8', 'left');
    textShadow(`${v.as} ⚔   ${v.ak} ♞`, 60, 86, 27, '#ffe9a0', 'left');
    panel(W - 340, 20, 320, 96, { r: 12 });
    text('Defenders', W - 300, 50, 22, '#f5e9c8', 'left');
    textShadow(`${v.dg} ⚔`, W - 300, 86, 27, '#ffd0c0', 'left');
    if (this.phase === 'stance') text('Choose your tactics...', W / 2, 1180, 26, '#e8d8b0');
    else textShadow(`The Battle of ${this.t.name}`, W / 2, 1180, 30, '#ffd75e');
  },
  drawHost(cx, dir, color, soldiers, knights) {
    const total = soldiers + knights;
    const icons = Math.min(24, total);
    if (total <= 0) return;
    const kIcons = total > 0 ? Math.round(icons * knights / total) : 0;
    let n = 0;
    for (let row = 0; row < 4 && n < icons; row++) {
      for (let col = 0; col < 6 && n < icons; col++, n++) {
        const x = cx + dir * (col * 38) + (row % 2) * 12 * dir;
        const y = 680 + row * 92;
        if (n < kIcons) drawMiniKnight(x, y, 2.1, color, dir, this.lunge);
        else drawSoldier(x, y, 2.1, color, dir, this.lunge);
      }
    }
  },
  onTap() {
    if (this.phase === 'fight') this.timer = Math.min(this.timer, 0.08); // hurry the rounds along
  },
};

/* ---------------- the tournament (jousting) ---------------- */
const JoustScene = {
  ZONES: [
    { nm: 'Helm', q: 1.25 },
    { nm: 'Chest', q: 1.0 },
    { nm: 'Shield', q: 0.7 },
    { nm: 'Legs', q: 0.25 },
  ],
  enter(foe, wager) {
    this.foe = foe;
    this.wager = wager;
    this.pass = 1;
    this.scoreP = 0;
    this.scoreF = 0;
    this.phase = 'ready';
    this.t = 0;
    this.locked = -1;
    this.lockQ = 0;
    this.resultMsg = '';
    this.fallP = 0;
    this.fallF = 0;
    this.crowd = Array.from({ length: 70 }, () => ({
      x: rnd(40, W - 40), y: rnd(330, 430),
      c: pick(['#c9684a', '#7a9ac8', '#b8a858', '#9a6a9a', '#88a868']),
      p: rnd(TAU),
    }));
    Modal.show({
      title: 'The Tilt Awaits',
      lines: [
        `You ride against ${foe.name}. Three passes decide it — unhorse him for 3 points, shatter your lance for 1.`,
        'As you charge, tap to lock your lance on the gauge. The helm scores best but is hardest to strike true.',
      ],
      buttons: [{ label: 'Ride!', fn: () => Sfx.fanfare() }],
    });
  },
  startPass() {
    this.phase = 'run';
    this.t = 0;
    this.locked = -1;
    this.fallP = 0;
    this.fallF = 0;
    Sfx.whoosh();
  },
  markerPos() { // 0..1 oscillating, slowed by joust skill
    const speed = 4.6 - player().joust * 0.18;
    return 0.5 + 0.5 * Math.sin(this.t * speed * 2.2);
  },
  update(dt) {
    if (this.phase === 'run') {
      this.t += dt;
      if (this.t > 0.4 && Math.random() < 0.3) {
        spawn(140 + this.t * 180, 980, { vx: rnd(-60, -20), vy: rnd(-40, -5), g: 60, life: 0.5, color: 'rgba(180,160,120,0.7)', size: rnd(3, 7) });
        spawn(W - 140 - this.t * 180, 905, { vx: rnd(20, 60), vy: rnd(-40, -5), g: 60, life: 0.5, color: 'rgba(180,160,120,0.7)', size: rnd(3, 7) });
      }
      if (this.t >= 2.1) this.impact();
    } else if (this.phase === 'impact') {
      this.t += dt;
      this.fallP = this.pWins === false ? Math.min(1, this.fallP + dt * 1.6) : 0;
      this.fallF = this.pWins === true ? Math.min(1, this.fallF + dt * 1.6) : 0;
      if (this.t > 1.6) this.afterPass();
    }
  },
  lockAim() {
    if (this.locked >= 0) return;
    const m = this.markerPos();
    const zi = clamp(Math.floor(m * 4), 0, 3);
    this.locked = zi;
    // distance from the center of the zone = steadiness of the strike
    const zc = (zi + 0.5) / 4;
    this.lockQ = this.ZONES[zi].q * (1 - Math.abs(m - zc) * 2.4);
    Sfx.tap();
  },
  impact() {
    this.phase = 'impact';
    this.t = 0;
    const p = player();
    const q = this.locked >= 0 ? this.lockQ : 0.15; // froze in the saddle
    const pRoll = q * (3 + p.joust) + rnd(0, 3.5);
    const fRoll = (0.55 + rnd(0.45)) * (2.6 + this.foe.joust) * 0.62 + rnd(0, 3.5);
    const d = pRoll - fRoll;
    this.pWins = null;
    if (d > 3.4) { this.scoreP += 3; this.pWins = true; this.resultMsg = 'UNHORSED! A mighty blow!'; Sfx.crack(); shake = 12; buzz(80); }
    else if (d > 0.8) { this.scoreP += 1; this.resultMsg = 'Your lance shatters on his shield!'; Sfx.clash(); shake = 7; }
    else if (d > -0.8) { this.resultMsg = 'Both lances glance away...'; Sfx.whoosh(); }
    else if (d > -3.4) { this.scoreF += 1; this.resultMsg = 'His lance splinters against you!'; Sfx.clash(); shake = 7; }
    else { this.scoreF += 3; this.pWins = false; this.resultMsg = 'You are thrown from the saddle!'; Sfx.crack(); shake = 12; buzz(120); }
    burst(W / 2, 930, 22, { color: '#e8d8a8', spMax: 260, up: 80 });
    if (Math.abs(d) > 3.4) burst(W / 2, 930, 16, { color: '#caa', spMax: 200 });
  },
  afterPass() {
    if (this.pass >= 3 && this.scoreP !== this.scoreF) { this.finish(); return; }
    if (this.pass >= 5) { this.finish(); return; }
    this.pass++;
    this.phase = 'ready';
  },
  finish() {
    this.phase = 'done';
    const won = this.scoreP > this.scoreF;
    const p = player();
    let lines;
    if (this.wager === 'gold') {
      if (won) { const g = Math.min(50, this.foe.gold); p.gold += g; this.foe.gold -= g; p.fame += 8; lines = `The crowd roars your name! You take ${g} gold and your fame swells.`; }
      else { const g = Math.min(50, p.gold); p.gold -= g; this.foe.gold += g; p.fame = Math.max(0, p.fame - 5); lines = `Defeated before the crowd. ${g} gold goes to ${this.foe.name}.`; }
    } else {
      if (won) {
        const stake = pick(lordTerrs(this.foe.id).filter(t => t.id !== HOME_TERRS[this.foe.id])) || lordTerrs(this.foe.id)[0];
        stake.owner = 0; p.fame += 14; MapGen.repaint(); checkElimination(this.foe.id);
        lines = `By the laws of the tourney, ${stake.name} passes to your banner!`;
      } else {
        const stake = pick(lordTerrs(0).filter(t => t.id !== HOME_TERRS[0])) || lordTerrs(0)[0];
        stake.owner = this.foe.id; p.fame = Math.max(0, p.fame - 8); MapGen.repaint(); checkElimination(0);
        lines = `A bitter day — ${stake.name} passes to ${this.foe.name}.`;
      }
    }
    if (won) Sfx.fanfare(); else Sfx.dirge();
    saveGame();
    Modal.show({
      title: won ? 'Champion of the Tourney!' : 'Unhorsed and Humbled',
      lines: [`Final score ${this.scoreP} — ${this.scoreF}.`, lines],
      buttons: [{
        label: 'Return to the Map',
        fn: () => {
          if (playerLost()) setScene(EndScene, false);
          else if (playerWon()) setScene(EndScene, true);
          else setScene(MapScene);
        },
      }],
    });
  },
  render() {
    // afternoon sky
    ctx.fillStyle = skyGradient(0, 600, '#6fa3d0', '#cfe0e8');
    ctx.fillRect(0, 0, W, 600);
    // clouds
    for (let i = 0; i < 4; i++) {
      const cx = ((gTime * 9 + i * 210) % (W + 240)) - 120;
      const cy = 90 + i * 55;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [ox, oy, r] of [[0, 0, 34], [30, 6, 26], [-30, 8, 24]]) {
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, TAU); ctx.fill();
      }
    }
    drawCastleSilhouette(120, 330, 0.65, 'rgba(90,80,100,0.7)');
    // grandstand
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(0, 320, W, 130);
    ctx.fillStyle = '#54381e';
    ctx.fillRect(0, 300, W, 26);
    for (let i = 0; i < 12; i++) {
      const fx = 30 + i * 62;
      ctx.fillStyle = i % 2 ? player().color : this.foe.color;
      ctx.beginPath();
      ctx.moveTo(fx, 250); ctx.lineTo(fx + 20, 258 + Math.sin(gTime * 3 + i) * 3); ctx.lineTo(fx, 268);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx, 245); ctx.lineTo(fx, 300); ctx.stroke();
    }
    const cheer = this.phase === 'impact' ? 6 : 1.5;
    for (const c of this.crowd) {
      ctx.fillStyle = c.c;
      ctx.beginPath();
      ctx.arc(c.x, c.y + Math.sin(gTime * 6 + c.p) * cheer, 8, 0, TAU);
      ctx.fill();
    }
    // field
    ctx.fillStyle = '#5a7a42';
    ctx.fillRect(0, 450, W, H - 450);
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(0, 930, W, 22); // the tilt barrier
    ctx.fillStyle = '#74664a';
    ctx.fillRect(0, 952, W, 8);
    // riders
    let px = 130, fx = W - 130;
    if (this.phase === 'run') {
      const k = this.t / 2.1;
      px = lerp(-80, W / 2 - 95, k);
      fx = lerp(W + 80, W / 2 + 95, k);
    } else if (this.phase === 'impact') {
      px = W / 2 - 95; fx = W / 2 + 95;
    }
    const gal = this.phase === 'run' ? gTime * 22 : gTime * 3;
    drawJoustKnight(fx, 905, 1.15, -1, this.foe.color, { legPhase: gal + 2, fall: this.fallF });
    drawJoustKnight(px, 985, 1.3, 1, player().color, { legPhase: gal, fall: this.fallP });
    // aim gauge
    if (this.phase === 'run') {
      const gx = W - 84, gy = 440, gh = 280;
      panel(gx - 36, gy - 20, 110, gh + 70, { r: 12, alpha: 0.85 });
      this.ZONES.forEach((z, i) => {
        const zy = gy + i * (gh / 4);
        ctx.fillStyle = ['#b33a2c', '#c8842c', '#7a8a3a', '#5a6a7a'][i];
        roundRect(gx - 20, zy + 2, 60, gh / 4 - 4, 6);
        ctx.fill();
        text(z.nm, gx + 10, zy + gh / 8, 17, '#fff');
      });
      const my = gy + this.markerPos() * gh;
      if (this.locked < 0) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(gx - 32, my); ctx.lineTo(gx - 18, my - 9); ctx.lineTo(gx - 18, my + 9);
        ctx.closePath(); ctx.fill();
      } else {
        const zy = gy + (this.locked + 0.5) * (gh / 4);
        ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(gx + 10, zy, 26, 0, TAU); ctx.stroke();
      }
      text('TAP!', gx + 10, gy + gh + 30, 21, '#ffe9a0');
    }
    // scoreboard
    panel(W / 2 - 200, 20, 400, 110, { r: 14 });
    text(`Pass ${this.pass}`, W / 2, 48, 22, '#cbbf9f');
    textShadow(`You  ${this.scoreP}   —   ${this.scoreF}  Foe`, W / 2, 88, 32, '#ffd75e');
    if (this.phase === 'ready') {
      textShadow('Tap to begin the pass!', W / 2, 1140, 34, '#ffe9a0');
    } else if (this.phase === 'impact') {
      textShadow(this.resultMsg, W / 2, 1140, 30, '#ffd75e');
    }
  },
  onTap() {
    if (this.phase === 'ready') this.startPass();
    else if (this.phase === 'run') this.lockAim();
  },
};

/* ---------------- the siege ---------------- */
const SiegeScene = {
  enter(ti) {
    this.ti = ti;
    this.t = S.terr[ti];
    this.segs = [{ hp: 2 }, { hp: 2 }, { hp: 2 }];
    this.ammo = Math.min(8, 2 + player().army.c * 2);
    this.boulder = null;
    this.drag = null;
    this.armAnim = 0;
    this.doneTimer = -1;
    Modal.show({
      title: `The Siege of ${this.t.name}`,
      lines: [
        `Your engineers wheel ${player().army.c} catapult${player().army.c > 1 ? 's' : ''} into range — ${this.ammo} boulders are ready.`,
        'Drag back from the catapult and release to fire. Every wall you topple weakens the defenders before the assault.',
      ],
      buttons: [{ label: 'Loose!', fn: () => {} }],
    });
  },
  breach() { return this.segs.filter(s => s.hp <= 0).length / this.segs.length; },
  wallRects() {
    // three wall segments on the right
    return this.segs.map((s, i) => ({ x: 520, y: 560 + i * 110, w: 90, h: 104, seg: s, i }));
  },
  update(dt) {
    this.armAnim = Math.max(0, this.armAnim - dt * 3);
    if (this.boulder) {
      const b = this.boulder;
      b.vy += 760 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (Math.random() < 0.4) spawn(b.x, b.y, { vx: 0, vy: 0, g: 0, life: 0.3, size: 4, color: 'rgba(120,110,90,0.5)' });
      let hit = false;
      for (const r of this.wallRects()) {
        if (r.seg.hp > 0 && b.x > r.x && b.x < r.x + r.w + 60 && b.y > r.y && b.y < r.y + r.h) {
          r.seg.hp--;
          hit = true;
          shake = 11;
          Sfx.crack();
          buzz(60);
          burst(b.x, b.y, 26, { color: '#a89878', spMax: 300, up: 120 });
          if (r.seg.hp <= 0) {
            toast('A wall comes crashing down!', '#ffe9a0');
            burst(r.x + r.w / 2, r.y + r.h / 2, 40, { color: '#8a7a5a', spMax: 340, up: 160 });
          }
          break;
        }
      }
      if (hit || b.y > 1040 || b.x > W + 40) {
        if (!hit && b.y > 1040) { Sfx.thud(); burst(b.x, 1030, 12, { color: '#6a5a3a', spMax: 140 }); }
        this.boulder = null;
        if (this.ammo <= 0 || this.breach() >= 1) this.doneTimer = 1.1;
      }
    }
    if (this.doneTimer > 0) {
      this.doneTimer -= dt;
      if (this.doneTimer <= 0) this.finish();
    }
  },
  finish() {
    const br = this.breach();
    const pct = Math.round(br * 100);
    Modal.show({
      title: br >= 1 ? 'The Walls Are Rubble!' : br > 0 ? 'The Walls Are Breached' : 'The Walls Hold',
      lines: br > 0
        ? `Your barrage broke ${pct}% of the defences. Now — send in the army!`
        : 'Not one stone fell. The garrison jeers from the battlements. The assault must go in regardless.',
      buttons: [{ label: 'Sound the Charge!', fn: () => setScene(BattleScene, this.ti, br * 0.9) }],
    });
    if (br >= 1) this.t.garrison = Math.max(1, this.t.garrison - Math.round(this.t.garrison * 0.25));
  },
  fire(vx, vy) {
    if (this.boulder || this.ammo <= 0) return;
    this.ammo--;
    this.boulder = { x: 150, y: 800, vx, vy };
    this.armAnim = 1;
    Sfx.whoosh();
    Sfx.thud();
  },
  render() {
    // dusk sky
    ctx.fillStyle = skyGradient(0, 700, '#3c3050', '#c87850');
    ctx.fillRect(0, 0, W, 700);
    ctx.fillStyle = 'rgba(255,190,120,0.9)';
    ctx.beginPath(); ctx.arc(110, 240, 44, 0, TAU); ctx.fill();
    ctx.fillStyle = '#574a3a';
    ctx.fillRect(0, 690, W, H - 690);
    ctx.fillStyle = '#4a3e30';
    ctx.fillRect(0, 1020, W, H - 1020);
    // the castle keep behind the walls
    ctx.fillStyle = '#3e3428';
    ctx.fillRect(620, 480, 100, 540);
    for (let i = 0; i < 4; i++) ctx.fillRect(620 + i * 26, 462, 14, 18);
    ctx.fillStyle = `rgba(255,200,90,${0.5 + 0.4 * Math.sin(gTime * 2.2)})`;
    ctx.fillRect(655, 560, 14, 22);
    // defender flag
    const t = this.t;
    const col = t.owner < 0 ? NEUTRAL_COLOR : S.lords[t.owner].color;
    ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(670, 462); ctx.lineTo(670, 410); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(670, 410);
    ctx.quadraticCurveTo(700, 414 + Math.sin(gTime * 3) * 4, 722, 412);
    ctx.lineTo(722, 434); ctx.quadraticCurveTo(700, 432, 670, 430);
    ctx.closePath(); ctx.fill();
    // wall segments
    for (const r of this.wallRects()) {
      if (r.seg.hp <= 0) {
        ctx.fillStyle = '#5a4e3c';
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.arc(r.x + 12 + (i * 23) % r.w, r.y + r.h - 12 - (i % 3) * 14, 11, 0, TAU);
          ctx.fill();
        }
        continue;
      }
      ctx.fillStyle = r.seg.hp === 2 ? '#8a7e68' : '#776a54';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(40,32,22,0.5)';
      ctx.lineWidth = 2;
      for (let yy = r.y + 18; yy < r.y + r.h; yy += 22) {
        ctx.beginPath(); ctx.moveTo(r.x, yy); ctx.lineTo(r.x + r.w, yy); ctx.stroke();
      }
      for (let i = 0; i < 3; i++) ctx.fillRect(r.x + i * 32, r.y - 14, 18, 14);
      if (r.seg.hp === 1) { // cracked
        ctx.strokeStyle = '#2c2418'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(r.x + 20, r.y);
        ctx.lineTo(r.x + 40, r.y + 40);
        ctx.lineTo(r.x + 28, r.y + 70);
        ctx.lineTo(r.x + 52, r.y + r.h);
        ctx.stroke();
      }
      // a defender on top
      drawSoldier(r.x + 46, r.y - 22, 1.4, col, -1);
    }
    // catapult
    ctx.save();
    ctx.translate(150, 870);
    ctx.fillStyle = '#5a4226';
    ctx.fillRect(-70, 50, 150, 22);
    ctx.fillStyle = '#4a3a22';
    ctx.beginPath(); ctx.arc(-45, 78, 22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(45, 78, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2c2418';
    ctx.beginPath(); ctx.arc(-45, 78, 9, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(45, 78, 9, 0, TAU); ctx.fill();
    // throwing arm
    const armA = -0.9 + this.armAnim * 0.9 - (this.drag ? clamp(dist(this.drag.x, this.drag.y, this.drag.sx, this.drag.sy) / 600, 0, 0.4) : 0);
    ctx.save();
    ctx.rotate(armA);
    ctx.fillStyle = '#6b4f2c';
    ctx.fillRect(0, -9, 130, 18);
    ctx.fillStyle = '#3a2c1c';
    ctx.beginPath(); ctx.arc(130, 0, 16, 0.2, Math.PI - 0.2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#4a3a22';
    ctx.fillRect(-12, -30, 24, 100);
    ctx.restore();
    // boulder ready / in flight
    if (this.boulder) {
      ctx.fillStyle = '#6a6054';
      ctx.beginPath(); ctx.arc(this.boulder.x, this.boulder.y, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(this.boulder.x - 4, this.boulder.y - 5, 6, 0, TAU); ctx.fill();
    }
    // drag aim preview
    if (this.drag && !this.boulder && this.ammo > 0) {
      const [vx, vy] = this.dragVel();
      let bx = 150, by = 800, bvx = vx, bvy = vy;
      ctx.fillStyle = 'rgba(255,235,180,0.8)';
      for (let i = 0; i < 26; i++) {
        bvy += 760 * 0.05;
        bx += bvx * 0.05;
        by += bvy * 0.05;
        if (by > 1030) break;
        ctx.beginPath(); ctx.arc(bx, by, 4, 0, TAU); ctx.fill();
      }
    }
    // hud
    panel(20, 20, 330, 96, { r: 12 });
    text(`The Siege of ${t.name}`, 40, 50, 22, '#f5e9c8', 'left');
    textShadow(`Boulders: ${this.ammo}   Walls down: ${Math.round(this.breach() * 100)}%`, 40, 86, 22, '#ffe9a0', 'left');
    this.skipBtn = makeBtn(W - 220, 28, 190, 58, 'Charge Now', () => { this.ammo = 0; this.doneTimer = 0.01; }, { size: 21, color: '#6b2a2a' });
    drawBtn(this.skipBtn);
    if (!this.drag && !this.boulder && this.ammo > 0) {
      text('Drag back from the catapult, release to fire', W / 2, 1190, 24, 'rgba(240,230,200,0.85)');
    }
  },
  dragVel() {
    const dx = this.drag.sx - this.drag.x;
    const dy = this.drag.sy - this.drag.y;
    const p = clamp(Math.hypot(dx, dy) * 2.4, 120, 950);
    const a = Math.atan2(dy, dx);
    return [Math.cos(a) * p, Math.sin(a) * p];
  },
  onDown(x, y) {
    if (this.boulder || this.ammo <= 0) return;
    if (x < 420 && y > 500) this.drag = { sx: x, sy: y, x, y };
  },
  onMove(x, y) {
    if (this.drag) { this.drag.x = x; this.drag.y = y; }
  },
  onUp(x, y) {
    if (this.skipBtn && btnAt([this.skipBtn], x, y)) { Sfx.tap(); this.skipBtn.fn(); this.drag = null; return; }
    if (this.drag) {
      const [vx, vy] = this.dragVel();
      if (Math.hypot(vx, vy) > 160 && vx > 0) this.fire(vx, vy);
      this.drag = null;
    }
  },
};

/* ---------------- the night raid ---------------- */
const RaidScene = {
  enter(foe) {
    this.foe = foe;
    this.php = 3;
    this.ehp = 3;
    this.round = 0;
    this.phase = 'intro';
    this.prompt = null;
    this.t = 0;
    this.flash = '';
    Modal.show({
      title: 'Over the Wall by Night',
      lines: [
        `You slip into the keep of ${foe.name} — but the captain of the guard bars the treasury door, blade drawn.`,
        'Follow the prompts: SWIPE the way the arrow points to cut, TAP on the burst to parry. Three wounds end the fight.',
      ],
      buttons: [{ label: 'Steel Out!', fn: () => this.nextPrompt() }],
    });
  },
  nextPrompt() {
    this.round++;
    this.phase = 'prompt';
    this.prompt = pick(['left', 'right', 'tap']);
    this.window = Math.max(0.55, 1.15 - this.round * 0.07);
    this.t = 0;
  },
  resolve(ok) {
    if (this.phase !== 'prompt') return;
    this.phase = 'hit';
    this.t = 0;
    if (ok) {
      this.ehp--;
      this.flash = pick(['A telling cut!', 'You drive him back!', 'First blood yours!']);
      Sfx.clash();
      burst(480, 760, 16, { color: '#ffe9a0', spMax: 200 });
      buzz(40);
    } else {
      this.php--;
      this.flash = pick(['His blade bites!', 'Too slow!', 'You stumble back!']);
      Sfx.crack();
      shake = 8;
      burst(240, 760, 14, { color: '#c84a3a', spMax: 200 });
      buzz(90);
    }
  },
  update(dt) {
    this.t += dt;
    if (this.phase === 'prompt' && this.t > this.window) this.resolve(false);
    if (this.phase === 'hit' && this.t > 0.8) {
      if (this.ehp <= 0 || this.php <= 0) this.finish();
      else this.nextPrompt();
    }
  },
  finish() {
    this.phase = 'done';
    const p = player();
    const won = this.ehp <= 0;
    let lines;
    if (won) {
      const loot = Math.max(15, Math.round(this.foe.gold * 0.45));
      this.foe.gold = Math.max(0, this.foe.gold - loot);
      p.gold += loot;
      p.fame += 6;
      lines = `The guard yields! You escape over the wall with ${loot} gold from the coffers of ${this.foe.name}.`;
      Sfx.fanfare();
    } else {
      const ransom = Math.round(p.gold * 0.25);
      p.gold -= ransom;
      p.fame = Math.max(0, p.fame - 5);
      lines = `Caught! You are dragged before ${this.foe.name} and ransomed back to your own men for ${ransom} gold.`;
      Sfx.dirge();
    }
    saveGame();
    Modal.show({
      title: won ? 'The Treasury Is Lighter' : 'Captured!',
      lines,
      buttons: [{ label: 'Return to the Map', fn: () => setScene(MapScene) }],
    });
  },
  render() {
    // moonlit courtyard
    ctx.fillStyle = skyGradient(0, H, '#101428', '#1c1830');
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d8d4c2';
    ctx.beginPath(); ctx.arc(600, 130, 40, 0, TAU); ctx.fill();
    ctx.fillStyle = '#181426';
    ctx.fillRect(0, 280, W, 240);
    for (let i = 0; i < 9; i++) ctx.fillRect(i * 84, 258, 42, 24);
    // torches
    for (const tx of [120, 600]) {
      ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(tx, 420); ctx.lineTo(tx, 480); ctx.stroke();
      const fl = Math.sin(gTime * 9 + tx) * 4;
      ctx.fillStyle = '#ff9a30';
      ctx.beginPath(); ctx.ellipse(tx, 404 + fl * 0.4, 9, 17 + fl, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath(); ctx.ellipse(tx, 410 + fl * 0.4, 5, 9, 0, 0, TAU); ctx.fill();
      if (Math.random() < 0.2) spawn(tx, 400, { vx: rnd(-10, 10), vy: rnd(-50, -25), g: -20, life: 0.8, size: 2.5, color: '#ffb050' });
    }
    ctx.fillStyle = '#24202e';
    ctx.fillRect(0, 520, W, H - 520);
    // duelists
    const lungeP = this.phase === 'hit' && this.flash.includes('!') && this.ehp < 3 ? Math.max(0, 1 - this.t * 2) : 0;
    drawSoldier(240 + lungeP * 60, 800, 5, player().color, 1, lungeP);
    drawSoldier(480, 790, 5, this.foe.color, -1, this.php < 3 && this.phase === 'hit' ? Math.max(0, 1 - this.t * 2) : 0);
    // hearts
    const heart = (x, y, on) => {
      ctx.fillStyle = on ? '#d8453a' : 'rgba(120,120,130,0.35)';
      ctx.beginPath();
      ctx.arc(x - 7, y, 9, 0, TAU); ctx.arc(x + 7, y, 9, 0, TAU);
      ctx.moveTo(x - 15, y + 3); ctx.lineTo(x, y + 22); ctx.lineTo(x + 15, y + 3);
      ctx.fill();
    };
    panel(30, 24, 300, 86, { r: 12 });
    text('You', 60, 50, 22, '#f5e9c8', 'left');
    for (let i = 0; i < 3; i++) heart(70 + i * 44, 82, i < this.php);
    panel(W - 330, 24, 300, 86, { r: 12 });
    text('Guard Captain', W - 300, 50, 22, '#f5e9c8', 'left');
    for (let i = 0; i < 3; i++) heart(W - 290 + i * 44, 82, i < this.ehp);
    // prompt
    if (this.phase === 'prompt') {
      const k = 1 - this.t / this.window;
      const cy = 470;
      ctx.strokeStyle = `rgba(255,235,160,0.9)`;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(W / 2, cy, 70 * k + 28, 0, TAU); ctx.stroke();
      if (this.prompt === 'tap') {
        drawStar(W / 2, cy, 30, '#ffe9a0');
        textShadow('PARRY — TAP!', W / 2, cy + 100, 30, '#ffe9a0');
      } else {
        const d = this.prompt === 'left' ? -1 : 1;
        ctx.fillStyle = '#ffe9a0';
        ctx.beginPath();
        ctx.moveTo(W / 2 + d * 40, cy);
        ctx.lineTo(W / 2 - d * 20, cy - 26);
        ctx.lineTo(W / 2 - d * 20, cy + 26);
        ctx.closePath(); ctx.fill();
        textShadow(`SWIPE ${this.prompt.toUpperCase()}!`, W / 2, cy + 100, 30, '#ffe9a0');
      }
    } else if (this.phase === 'hit') {
      textShadow(this.flash, W / 2, 470, 34, this.ehp < this.php ? '#b8e8a8' : '#ffb0a0');
    }
    textShadow(`Round ${this.round}`, W / 2, 1190, 24, '#cbbf9f');
  },
  onTap() { if (this.phase === 'prompt') this.resolve(this.prompt === 'tap'); },
  onSwipe(dir) { if (this.phase === 'prompt') this.resolve(this.prompt === dir); },
};

/* ---------------- victory / defeat ---------------- */
const EndScene = {
  enter(won) {
    this.won = won;
    this.t = 0;
    if (won) { Sfx.fanfare(); setTimeout(() => Sfx.fanfare(), 900); }
    else Sfx.dirge();
    clearSave();
  },
  update(dt) {
    this.t += dt;
    if (this.won && Math.random() < 0.08) {
      burst(rnd(80, W - 80), rnd(150, 500), 26, {
        color: pick(['#ffd75e', '#ff9a50', '#c8e8ff', '#ffb0d0']),
        spMax: 240, up: 0, g: 140,
      });
      Sfx.tone(rnd(600, 1400), 0.18, { type: 'sine', vol: 0.03 });
    }
  },
  render() {
    if (this.won) {
      ctx.fillStyle = skyGradient(0, H, '#2a1c3c', '#0e0c16');
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.shadowColor = 'rgba(255,210,90,0.9)';
      ctx.shadowBlur = 60;
      drawCrown(W / 2, 380, 100 * (1 + Math.sin(gTime * 2) * 0.03));
      ctx.restore();
      textShadow('ALL ALBION IS YOURS', W / 2, 600, 52, '#ffd75e');
      textShadow('Long live the Sovereign!', W / 2, 680, 36, '#e8c25e');
      text(`Won in ${dateStr()} with ${player().fame} fame.`, W / 2, 760, 26, '#cbbf9f');
    } else {
      ctx.fillStyle = skyGradient(0, H, '#1c1c22', '#0a0a0e');
      ctx.fillRect(0, 0, W, H);
      drawCastleSilhouette(W / 2, 560, 1.3, '#0c0a12');
      ctx.fillStyle = 'rgba(200,80,40,0.25)';
      ctx.beginPath(); ctx.arc(W / 2, 470, 130 + Math.sin(gTime) * 14, 0, TAU); ctx.fill();
      textShadow('YOUR HOUSE HAS FALLEN', W / 2, 680, 48, '#c8b8b0');
      text('The last of your banners is torn down...', W / 2, 750, 26, '#8a7e78');
    }
    this.btn = makeBtn(W / 2 - 180, 900, 360, 78, 'Begin a New Saga', () => setScene(TitleScene), { size: 28 });
    drawBtn(this.btn);
  },
  onTap(x, y) {
    if (this.btn && btnAt([this.btn], x, y)) { Sfx.tap(); this.btn.fn(); }
  },
};

/* ---------------- boot ---------------- */
window.addEventListener('load', () => {
  initEngine();
  MapGen.build();
  setScene(TitleScene);
  requestAnimationFrame(frame);
});
