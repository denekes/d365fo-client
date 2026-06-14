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
  const lit = shade(color, 0.3), dark = shade(color, -0.42);
  const HIDE_L = '#7c5e3e', HIDE = '#5f4830', HIDE_D = '#3d2e1e';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 26, 62, 8, 0, 0, TAU); ctx.fill();

  // flowing tail
  ctx.lineCap = 'round';
  ctx.strokeStyle = HIDE_D; ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-52, -34);
  ctx.quadraticCurveTo(-80, -28 + Math.sin(lp * 2) * 5, -84, 6 + Math.sin(lp * 2 + 1) * 4);
  ctx.stroke();
  ctx.strokeStyle = shade(HIDE_D, 0.18); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-54, -32); ctx.quadraticCurveTo(-74, -20, -78, 8); ctx.stroke();

  // far legs
  ctx.strokeStyle = HIDE_D; ctx.lineWidth = 9;
  for (const [ox, ph] of [[-34, 0], [34, Math.PI]]) {
    const sw = Math.sin(lp + ph) * 16;
    ctx.beginPath(); ctx.moveTo(ox, -28); ctx.quadraticCurveTo(ox + sw * 0.4, -4, ox + sw, 24); ctx.stroke();
    ctx.fillStyle = '#1b150d'; ctx.beginPath(); roundRectPath(ox + sw - 5, 20, 11, 8, 2); ctx.fill();
  }

  // muscular body
  const bodyG = ctx.createLinearGradient(0, -60, 0, -8);
  bodyG.addColorStop(0, HIDE_L); bodyG.addColorStop(0.6, HIDE); bodyG.addColorStop(1, HIDE_D);
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.ellipse(-6, -34, 56, 25, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(HIDE, -0.12);
  ctx.beginPath(); ctx.ellipse(-44, -34, 18, 22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = HIDE_L;
  ctx.beginPath(); ctx.ellipse(40, -37, 16, 20, 0, 0, TAU); ctx.fill();

  // near legs
  ctx.strokeStyle = HIDE; ctx.lineWidth = 10;
  for (const [ox, ph] of [[-26, Math.PI * 0.9], [42, Math.PI * 1.9]]) {
    const sw = Math.sin(lp + ph) * 17;
    ctx.beginPath(); ctx.moveTo(ox, -28); ctx.quadraticCurveTo(ox + sw * 0.4, -2, ox + sw, 25); ctx.stroke();
    ctx.fillStyle = '#241c12'; ctx.beginPath(); roundRectPath(ox + sw - 5, 21, 11, 8, 2); ctx.fill();
  }
  ctx.lineCap = 'butt';

  // caparison drape with scalloped heraldic hem
  const capG = ctx.createLinearGradient(0, -50, 0, -6);
  capG.addColorStop(0, lit); capG.addColorStop(1, dark);
  ctx.fillStyle = capG;
  ctx.beginPath();
  ctx.moveTo(-58, -46); ctx.lineTo(46, -46); ctx.lineTo(40, -10);
  for (let i = 0; i < 7; i++) ctx.lineTo(34 - i * 15, -10 + (i % 2 ? 0 : 10));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = lit; ctx.fillRect(-14, -42, 8, 30);

  // neck + head with bridle
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(36, -46); ctx.quadraticCurveTo(60, -66, 66, -82);
  ctx.lineTo(80, -74); ctx.quadraticCurveTo(72, -52, 52, -34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = HIDE;
  ctx.beginPath(); ctx.ellipse(78, -76, 17, 9, -0.45, 0, TAU); ctx.fill();
  ctx.fillStyle = HIDE_L; ctx.beginPath(); ctx.ellipse(84, -78, 7, 5, -0.45, 0, TAU); ctx.fill();
  ctx.fillStyle = HIDE_D; ctx.beginPath(); ctx.moveTo(63, -84); ctx.lineTo(67, -97); ctx.lineTo(73, -84); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0d0906'; ctx.beginPath(); ctx.arc(80, -80, 2.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#241208'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(70, -86); ctx.lineTo(90, -78); ctx.stroke();
  ctx.strokeStyle = HIDE_D; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(42, -52); ctx.quadraticCurveTo(56, -68, 66, -82); ctx.stroke();

  // ---- rider ----
  ctx.save();
  ctx.translate(-2, -54);
  if (fall > 0) { ctx.translate(-fall * 72, -fall * 54 + fall * fall * 95); ctx.rotate(-fall * 2.3); }
  // saddle + leg
  ctx.fillStyle = '#3a2616'; ctx.beginPath(); roundRectPath(-16, -2, 30, 8, 3); ctx.fill();
  ctx.fillStyle = '#565f69'; ctx.beginPath(); roundRectPath(-12, 2, 12, 18, 4); ctx.fill();
  ctx.fillStyle = '#363c44'; ctx.fillRect(-14, 18, 16, 6);
  // breastplate + surcoat
  const tG = ctx.createLinearGradient(-16, -40, 16, -2);
  tG.addColorStop(0, lit); tG.addColorStop(0.6, color); tG.addColorStop(1, dark);
  ctx.fillStyle = tG; ctx.beginPath(); roundRectPath(-15, -40, 30, 42, 9); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); roundRectPath(-12, -38, 9, 30, 5); ctx.fill();
  ctx.fillStyle = lit; ctx.fillRect(-2, -38, 4, 34); ctx.fillRect(-11, -26, 22, 5);
  const pa = ctx.createRadialGradient(-13, -36, 1, -13, -34, 11);
  pa.addColorStop(0, STEEL_L); pa.addColorStop(1, _STEEL_D);
  ctx.fillStyle = pa; ctx.beginPath(); ctx.arc(-12, -34, 9, 0, TAU); ctx.fill();
  // heater shield
  ctx.save(); ctx.translate(-20, -18); ctx.rotate(-0.1);
  const shg = ctx.createLinearGradient(-12, -14, 12, 16);
  shg.addColorStop(0, shade(color, 0.18)); shg.addColorStop(1, shade(color, -0.4));
  ctx.fillStyle = shg;
  ctx.beginPath(); ctx.moveTo(-13, -16); ctx.lineTo(13, -16); ctx.lineTo(13, 6); ctx.quadraticCurveTo(0, 22, -13, 6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(245,235,205,0.9)'; ctx.fillRect(-2, -14, 4, 34); ctx.fillRect(-11, -2, 22, 5);
  ctx.restore();
  // couched lance: shaft, grip bands, vamplate, steel tip, pennon
  const la = -0.1 - (o.lanceUp || 0) * 0.5;
  ctx.save(); ctx.translate(8, -20); ctx.rotate(la);
  ctx.fillStyle = '#9a7440';
  ctx.beginPath(); ctx.moveTo(0, -4.5); ctx.lineTo(104, -2.2); ctx.lineTo(104, 2.2); ctx.lineTo(0, 4.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a5630'; ctx.fillRect(20, -4, 3, 8); ctx.fillRect(46, -3.6, 3, 7);
  ctx.fillStyle = STEEL; ctx.beginPath(); ctx.arc(14, 0, 9, -1.4, 1.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = lit;
  ctx.beginPath(); ctx.moveTo(72, -3); ctx.lineTo(95, -9); ctx.lineTo(88, -2.5); ctx.lineTo(95, 4); ctx.lineTo(72, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = STEEL_L; ctx.beginPath(); ctx.moveTo(104, -3); ctx.lineTo(119, 0); ctx.lineTo(104, 3); ctx.closePath(); ctx.fill();
  ctx.restore();
  // great helm with crest
  const hG = ctx.createLinearGradient(-11, -58, 11, -38);
  hG.addColorStop(0, STEEL_L); hG.addColorStop(1, _STEEL_D);
  ctx.fillStyle = hG; ctx.beginPath(); roundRectPath(-11, -58, 22, 24, 6); ctx.fill();
  ctx.fillStyle = '#14171d'; ctx.fillRect(-11, -50, 22, 3.5);
  ctx.fillStyle = _STEEL_D; for (let i = 0; i < 3; i++) ctx.fillRect(-6 + i * 5, -44, 2, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-9, -40); ctx.lineTo(-9, -56); ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = lit; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(-16, -73, -30, -62); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(-14, -68, -28, -60); ctx.stroke();
  ctx.lineCap = 'butt';
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

/* =========================================================
   high-quality character art
   figures are painted once at reference scale into an offscreen
   sprite (cached per colour) then blitted — detail + performance
   ========================================================= */
const STEEL_L = '#d6dce3', STEEL = '#9aa4af', _STEEL_D = '#586169';
const SKIN = '#d8b48c', SKIN_D = 'rgba(90,55,30,0.5)';
const _figCache = {};
function bakeFigure(key, box, paint) {
  if (_figCache[key]) return _figCache[key];
  const c = document.createElement('canvas');
  c.width = box.w; c.height = box.h;
  const prev = ctx;
  ctx = c.getContext('2d');
  ctx.translate(box.ox, box.oy);
  paint();
  ctx = prev;
  const spr = { c, ox: box.ox, oy: box.oy };
  _figCache[key] = spr;
  return spr;
}
function blitFigure(spr, x, y, scale, dir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(spr.c, -spr.ox * scale, -spr.oy * scale, spr.c.width * scale, spr.c.height * scale);
  ctx.restore();
}

/* a shaded man-at-arms: mail, plate, surcoat, kite shield, spear, bascinet */
function paintManAtArms(color) {
  const lit = shade(color, 0.32), dark = shade(color, -0.44);
  // contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath(); ctx.ellipse(2, 2, 30, 8, 0, 0, TAU); ctx.fill();
  // shield on the back (left) arm
  ctx.save();
  ctx.translate(-25, -84); ctx.rotate(-0.12);
  const shG = ctx.createLinearGradient(-22, -30, 22, 34);
  shG.addColorStop(0, shade(color, 0.16)); shG.addColorStop(1, shade(color, -0.5));
  ctx.fillStyle = shG;
  ctx.beginPath();
  ctx.moveTo(-22, -30); ctx.lineTo(22, -30); ctx.lineTo(22, 8);
  ctx.quadraticCurveTo(0, 42, -22, 8); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#e9dcb4'; ctx.stroke();
  ctx.fillStyle = 'rgba(245,235,205,0.92)';
  ctx.fillRect(-4, -28, 8, 60); ctx.fillRect(-20, -6, 40, 8);
  ctx.fillStyle = STEEL; ctx.beginPath(); ctx.arc(0, 2, 4.5, 0, TAU); ctx.fill();
  ctx.restore();
  // legs (mail chausses) + sabatons
  const legG = ctx.createLinearGradient(-18, 0, 18, 0);
  legG.addColorStop(0, _STEEL_D); legG.addColorStop(0.5, STEEL); legG.addColorStop(1, _STEEL_D);
  ctx.fillStyle = legG;
  ctx.beginPath(); roundRectPath(-17, -56, 14, 56, 6); ctx.fill();
  ctx.beginPath(); roundRectPath(4, -56, 15, 58, 6); ctx.fill();
  ctx.fillStyle = '#363c44';
  ctx.beginPath(); roundRectPath(-22, -8, 22, 10, 4); ctx.fill();
  ctx.beginPath(); roundRectPath(0, -8, 26, 10, 4); ctx.fill();
  ctx.fillStyle = 'rgba(228,236,245,0.4)';
  ctx.fillRect(-15, -52, 3, 48); ctx.fillRect(6, -52, 3, 50);
  // surcoat torso
  const tG = ctx.createLinearGradient(-30, -122, 34, -54);
  tG.addColorStop(0, lit); tG.addColorStop(0.55, color); tG.addColorStop(1, dark);
  ctx.fillStyle = tG;
  ctx.beginPath();
  ctx.moveTo(-25, -56); ctx.lineTo(-29, -104);
  ctx.quadraticCurveTo(-30, -118, -15, -120);
  ctx.lineTo(15, -120);
  ctx.quadraticCurveTo(30, -118, 29, -104);
  ctx.lineTo(25, -56);
  ctx.quadraticCurveTo(0, -48, -25, -56); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.45; ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-7, -112); ctx.lineTo(-11, -54); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -110); ctx.lineTo(13, -56); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = lit;                              // heraldic cross
  ctx.fillRect(-3, -112, 6, 46); ctx.fillRect(-16, -96, 32, 6);
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-26, -64, 52, 7);
  ctx.fillStyle = '#c9a44a'; ctx.fillRect(-5, -65, 10, 9);
  // mail collar + pauldrons
  ctx.fillStyle = _STEEL_D;
  ctx.beginPath(); ctx.arc(0, -119, 11, Math.PI, 0); ctx.fill();
  for (const ox of [-17, 17]) {
    const pa = ctx.createRadialGradient(ox - 3, -118, 2, ox, -114, 12);
    pa.addColorStop(0, STEEL_L); pa.addColorStop(1, _STEEL_D);
    ctx.fillStyle = pa; ctx.beginPath(); ctx.arc(ox, -114, 11, 0, TAU); ctx.fill();
  }
  // spear arm + spear
  ctx.strokeStyle = STEEL; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(15, -110); ctx.lineTo(30, -84); ctx.stroke();
  ctx.strokeStyle = '#caa37a'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(30, -84); ctx.lineTo(34, -74); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#7a5a32'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(34, -150); ctx.lineTo(28, -4); ctx.stroke();
  ctx.fillStyle = STEEL_L;
  ctx.beginPath();
  ctx.moveTo(34, -150); ctx.quadraticCurveTo(40, -160, 35, -172);
  ctx.quadraticCurveTo(30, -160, 34, -150); ctx.closePath(); ctx.fill();
  // head + bascinet
  ctx.fillStyle = '#caa37a'; ctx.fillRect(-5, -128, 10, 10);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -132, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = SKIN_D; ctx.beginPath(); ctx.arc(0, -128, 9, 0.2, Math.PI - 0.2); ctx.fill();
  const hG = ctx.createLinearGradient(-12, -152, 12, -126);
  hG.addColorStop(0, STEEL_L); hG.addColorStop(1, _STEEL_D);
  ctx.fillStyle = hG;
  ctx.beginPath();
  ctx.moveTo(-11, -134); ctx.quadraticCurveTo(-12, -153, 0, -158);
  ctx.quadraticCurveTo(12, -153, 11, -134);
  ctx.lineTo(9, -130); ctx.lineTo(-9, -130); ctx.closePath(); ctx.fill();
  ctx.fillStyle = _STEEL_D; ctx.fillRect(-1.5, -140, 3, 11);
  ctx.fillStyle = 'rgba(18,22,28,0.85)'; ctx.fillRect(-9, -139, 6.5, 3); ctx.fillRect(2.5, -139, 6.5, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-9, -137); ctx.quadraticCurveTo(-10, -152, 0, -156); ctx.stroke();
  // plume
  ctx.lineCap = 'round';
  ctx.strokeStyle = lit; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, -158); ctx.quadraticCurveTo(-14, -170, -26, -162); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -158); ctx.quadraticCurveTo(-12, -166, -24, -160); ctx.stroke();
  ctx.lineCap = 'butt';
}

/* a knight on a barded warhorse: caparison, lance, great helm */
function paintCavalry(color) {
  const lit = shade(color, 0.3), dark = shade(color, -0.44);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(6, 2, 58, 9, 0, 0, TAU); ctx.fill();
  // far legs
  ctx.strokeStyle = '#433423'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-30, -44); ctx.lineTo(-34, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, -44); ctx.lineTo(40, -2); ctx.stroke();
  // body
  const bG = ctx.createLinearGradient(0, -80, 0, -28);
  bG.addColorStop(0, '#7c5e3e'); bG.addColorStop(1, '#4f3d28');
  ctx.fillStyle = bG;
  ctx.beginPath(); ctx.ellipse(0, -52, 58, 26, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(48, -50, 16, 22, 0, 0, TAU); ctx.fill();
  // near legs + hooves
  ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-24, -46); ctx.lineTo(-28, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, -46); ctx.lineTo(46, -2); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#241c12';
  for (const fx of [-34, -28, 40, 46]) ctx.fillRect(fx - 4, -5, 9, 5);
  // tail
  ctx.strokeStyle = '#2c2014'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-54, -56); ctx.quadraticCurveTo(-74, -46, -76, -10); ctx.stroke();
  // neck + head
  ctx.fillStyle = bG;
  ctx.beginPath();
  ctx.moveTo(46, -62); ctx.quadraticCurveTo(66, -86, 72, -102);
  ctx.lineTo(86, -96); ctx.quadraticCurveTo(80, -72, 58, -48); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(85, -98, 16, 9, -0.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#241a10'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(52, -66); ctx.quadraticCurveTo(64, -86, 72, -100); ctx.stroke();
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.moveTo(71, -106); ctx.lineTo(75, -116); ctx.lineTo(80, -104); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#100b07'; ctx.beginPath(); ctx.arc(87, -99, 2.2, 0, TAU); ctx.fill();
  ctx.lineCap = 'butt';
  // caparison drape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-54, -58); ctx.lineTo(42, -58); ctx.lineTo(38, -22);
  for (let i = 0; i < 8; i++) ctx.lineTo(32 - i * 12, -22 + (i % 2 ? 0 : 9));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = lit; ctx.fillRect(-14, -54, 6, 26);
  // rider
  ctx.save(); ctx.translate(-2, -70);
  ctx.fillStyle = '#565f69'; ctx.beginPath(); roundRectPath(-7, -2, 14, 22, 5); ctx.fill();
  const rG = ctx.createLinearGradient(-16, -34, 16, 2);
  rG.addColorStop(0, lit); rG.addColorStop(1, dark);
  ctx.fillStyle = rG; ctx.beginPath(); roundRectPath(-15, -34, 30, 36, 9); ctx.fill();
  ctx.fillStyle = lit; ctx.fillRect(-2, -32, 4, 30); ctx.fillRect(-12, -20, 24, 5);
  // shield
  ctx.fillStyle = shade(color, 0.12);
  ctx.beginPath(); ctx.moveTo(-22, -26); ctx.lineTo(-4, -26); ctx.lineTo(-4, 2); ctx.quadraticCurveTo(-14, 13, -22, 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 2; ctx.stroke();
  // couched lance
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.moveTo(4, -16); ctx.lineTo(98, -30); ctx.stroke();
  ctx.fillStyle = STEEL_L;
  ctx.beginPath(); ctx.moveTo(98, -30); ctx.lineTo(112, -33); ctx.lineTo(98, -25); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(color, -0.2); ctx.beginPath(); ctx.arc(10, -18, 6, 0, TAU); ctx.fill();
  // great helm
  const hG = ctx.createLinearGradient(-10, -54, 10, -32);
  hG.addColorStop(0, STEEL_L); hG.addColorStop(1, _STEEL_D);
  ctx.fillStyle = hG; ctx.beginPath(); roundRectPath(-10, -54, 20, 24, 6); ctx.fill();
  ctx.fillStyle = '#15181e'; ctx.fillRect(-10, -46, 20, 3.5);
  ctx.fillStyle = _STEEL_D; ctx.fillRect(-1.5, -42, 3, 10);
  ctx.lineCap = 'round';
  ctx.strokeStyle = color; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, -54); ctx.quadraticCurveTo(-12, -64, -24, -58); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
}

const FOOT_BOX = { w: 130, h: 192, ox: 56, oy: 178 };
const CAV_BOX = { w: 220, h: 164, ox: 98, oy: 148 };
function drawSoldier(x, y, s, color, dir, lunge = 0) {
  const spr = bakeFigure('foot_' + color, FOOT_BOX, () => paintManAtArms(color));
  blitFigure(spr, x + lunge * 10 * dir, y + 18, s * 0.27, dir);
}
function drawMiniKnight(x, y, s, color, dir, lunge = 0) {
  const spr = bakeFigure('cav_' + color, CAV_BOX, () => paintCavalry(color));
  blitFigure(spr, x + lunge * 12 * dir, y + 12, s * 0.36, dir);
}


/* archery butt for the Robin Hood contest */
function drawTarget(x, y, r) {
  ctx.save();
  ctx.strokeStyle = '#5a4226'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x - r * 0.5, y + r); ctx.lineTo(x - r * 0.25, y + r * 1.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + r * 0.5, y + r); ctx.lineTo(x + r * 0.25, y + r * 1.8); ctx.stroke();
  ctx.fillStyle = '#cdb87e';
  ctx.beginPath(); ctx.arc(x, y, r * 1.08, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#9c8650'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x, y, r * 1.08 - i * 2.6, 0, TAU); ctx.stroke(); }
  const rings = [[1.0, '#efe6cf'], [0.92, '#2a2622'], [0.66, '#3a72b0'], [0.42, '#c8423a'], [0.18, '#f5c542']];
  for (const [rr, c] of rings) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r * rr, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5;
  for (const [rr] of rings) { ctx.beginPath(); ctx.arc(x, y, r * rr, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
function drawStuckArrow(x, y, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.strokeStyle = '#7a5a32'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(2, 0); ctx.stroke();
  ctx.fillStyle = '#5a6e3a';
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-42, -6); ctx.lineTo(-30, 0); ctx.lineTo(-42, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b9c2cc';
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawArcher(x, y, s, draw = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const pull = draw * 7;
  const GR = '#2f6e34', GRL = '#43884a', GRD = '#1f4a24';
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 32, 16, 4, 0, 0, TAU); ctx.fill();
  // cloak draped behind
  ctx.fillStyle = GRD;
  ctx.beginPath(); ctx.moveTo(-7, -22); ctx.quadraticCurveTo(-21, -4, -16, 26); ctx.lineTo(-1, 26); ctx.lineTo(-2, -18); ctx.closePath(); ctx.fill();
  // legs + boots
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6b5230'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(-7, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, 8); ctx.lineTo(8, 28); ctx.stroke();
  ctx.strokeStyle = '#33240f'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-7, 30); ctx.lineTo(-10, 31); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 30); ctx.lineTo(11, 31); ctx.stroke();
  ctx.lineCap = 'butt';
  // tunic
  const tG = ctx.createLinearGradient(-10, -16, 10, 10);
  tG.addColorStop(0, GRL); tG.addColorStop(1, GRD);
  ctx.fillStyle = tG; ctx.beginPath(); roundRectPath(-9, -16, 18, 26, 5); ctx.fill();
  ctx.fillStyle = GR; ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(9, 2); ctx.lineTo(11, 13); ctx.lineTo(-11, 13); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.4; ctx.strokeStyle = GRD; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-3, 8); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-10, 0, 20, 4); ctx.fillStyle = '#c9a44a'; ctx.fillRect(-2, 0, 4, 4);
  // baldric + quiver of arrows
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(7, 5); ctx.stroke();
  ctx.save(); ctx.translate(-10, -15); ctx.rotate(-0.5); ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); roundRectPath(0, 0, 7, 20, 2); ctx.fill(); ctx.restore();
  const fcol = ['#d8453a', '#efe8d2', '#3a72b0'];
  for (let i = 0; i < 3; i++) {
    const dx = -12 + i * 3;
    ctx.strokeStyle = '#caa37a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(dx, -17); ctx.lineTo(dx - 2, -27); ctx.stroke();
    ctx.fillStyle = fcol[i]; ctx.beginPath(); ctx.arc(dx - 2, -27, 1.7, 0, TAU); ctx.fill();
  }
  // head, hood, face
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(1, -22, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = SKIN_D; ctx.beginPath(); ctx.arc(1, -19, 6, 0.2, Math.PI - 0.2); ctx.fill();
  ctx.fillStyle = GR;
  ctx.beginPath();
  ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-8, -35, 3, -35);
  ctx.quadraticCurveTo(10, -34, 9, -22);
  ctx.quadraticCurveTo(5, -26, 1, -26); ctx.quadraticCurveTo(-3, -26, -6, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GRD;
  ctx.beginPath(); ctx.moveTo(3, -35); ctx.quadraticCurveTo(14, -35, 18, -28); ctx.lineTo(11, -26); ctx.quadraticCurveTo(7, -31, 3, -31); ctx.closePath(); ctx.fill();
  ctx.lineCap = 'round'; ctx.strokeStyle = '#d8453a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(8, -31); ctx.quadraticCurveTo(16, -37, 22, -31); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#241a12'; ctx.beginPath(); ctx.arc(4, -23, 1.1, 0, TAU); ctx.fill();
  // longbow, bracer, drawn arrow
  const bowX = 20, nock = 2 - pull;
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1, -10); ctx.lineTo(bowX, -10); ctx.stroke();
  ctx.strokeStyle = '#7a4a28'; ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(bowX - 2, -38); ctx.quadraticCurveTo(bowX + 13, -10, bowX - 2, 18); ctx.stroke();
  ctx.strokeStyle = '#efe8d2'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(bowX - 2, -38); ctx.lineTo(nock, -10); ctx.lineTo(bowX - 2, 18); ctx.stroke();
  ctx.strokeStyle = '#7a5a32'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(nock, -10); ctx.lineTo(bowX + 9, -10); ctx.stroke();
  ctx.fillStyle = '#cdd4dc'; ctx.beginPath(); ctx.moveTo(bowX + 9, -10); ctx.lineTo(bowX + 4, -12.5); ctx.lineTo(bowX + 4, -7.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GR; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1, -10); ctx.lineTo(nock, -10); ctx.stroke();
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
    // crown emblem haloed in god rays
    const pulse = 1 + Math.sin(gTime * 2) * 0.04;
    sunRays(W / 2, 300, 270, '#ffd75e', 0.09, 13, 0.03);
    glow(W / 2, 300, 200, 'rgba(255,210,110,0.55)', 0.7);
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
    // cinematic light: warm sun from the south-west, cool depth opposite
    glow(150, MAPY + 760, 620, 'rgba(255,228,150,0.16)', 0.9);
    ctx.fillStyle = 'rgba(40,30,70,0.10)';
    ctx.fillRect(W / 2, MAPY, W / 2, MAPH * 0.5);
    this.drawCloudShadows();
    this.drawRoutes();
    this.drawBanners();
    this.drawBirds();
    this.drawFrame();
    vignette(0.34);
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
    // deep water with a warm sun-glint band
    const g = ctx.createLinearGradient(0, MAPY, 0, MAPY + MAPH);
    g.addColorStop(0, '#1d3b58');
    g.addColorStop(0.45, '#27506e');
    g.addColorStop(1, '#122a42');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    glow(560, MAPY + 180, 320, 'rgba(255,214,140,0.35)', 0.5);
    if (!this.glints) {
      const rg = mulberry32(99);
      this.glints = Array.from({ length: 60 }, () => ({
        x: 380 + rg() * 330, y: MAPY + 40 + rg() * 320, p: rg() * TAU,
      }));
    }
    for (const s of this.glints) {
      if (MapGen.terrAt(s.x, s.y) >= 0) continue;
      const a = Math.max(0, Math.sin(gTime * 1.6 + s.p));
      ctx.fillStyle = `rgba(255,235,190,${a * 0.5})`;
      ctx.fillRect(s.x, s.y, 3, 2);
    }
    ctx.strokeStyle = 'rgba(220,240,255,0.1)';
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
    ctx.globalAlpha = 0.45 + 0.2 * Math.sin(gTime * 1.1);
    ctx.drawImage(MapGen.foamCanvas, 0, MAPY);
    ctx.globalAlpha = 1;
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

  drawBirds() {
    ctx.strokeStyle = 'rgba(30,26,30,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const bx = ((gTime * (16 + i * 5) + i * 190) % (W + 160)) - 80;
      const by = MAPY + 120 + i * 130 + Math.sin(gTime * 1.5 + i) * 22;
      const fl = Math.sin(gTime * 6 + i * 2) * 5;
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - fl);
      ctx.quadraticCurveTo(bx, by + 3, bx + 8, by - fl);
      ctx.stroke();
    }
  },

  drawCloudShadows() {
    ctx.fillStyle = 'rgba(12,22,42,0.085)';
    for (let i = 0; i < 3; i++) {
      const x = ((gTime * (7 + i * 3) + i * 320) % (W + 520)) - 260;
      const y = MAPY + 180 + i * 290;
      ctx.beginPath();
      ctx.ellipse(x, y, 190, 80, 0.3, 0, TAU);
      ctx.ellipse(x + 120, y + 40, 120, 55, -0.2, 0, TAU);
      ctx.fill();
    }
  },

  drawFrame() {
    // chart border
    ctx.strokeStyle = 'rgba(201,164,74,0.75)';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, MAPY - 2, W - 16, MAPH + 4);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(232,216,168,0.45)';
    ctx.strokeRect(16, MAPY + 6, W - 32, MAPH - 12);
    for (const [cx, cy] of [[8, MAPY - 2], [W - 8, MAPY - 2], [8, MAPY + MAPH + 2], [W - 8, MAPY + MAPH + 2]]) {
      ctx.fillStyle = '#c9a44a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 11, cy); ctx.lineTo(cx, cy + 11); ctx.lineTo(cx - 11, cy);
      ctx.closePath(); ctx.fill();
    }
    // compass rose in the western sea
    const rx = 80, ry = MAPY + 150;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#e8d8a8';
    ctx.fillStyle = '#e8d8a8';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(rx, ry, 34, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx, ry, 25, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8, len = i % 2 ? 18 : 33;
      ctx.beginPath();
      ctx.moveTo(rx + Math.cos(a) * 6, ry + Math.sin(a) * 6);
      ctx.lineTo(rx + Math.cos(a) * len, ry + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(rx, ry - 46); ctx.lineTo(rx + 7, ry - 28); ctx.lineTo(rx - 7, ry - 28);
    ctx.closePath(); ctx.fill();
    text('N', rx, ry - 58, 20, '#e8d8a8');
    ctx.restore();
    // a serpent in the southern sea
    const sx = 600, sy = MAPY + 905;
    ctx.strokeStyle = 'rgba(180,220,210,0.5)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + i * 34, sy, 14, Math.PI + 0.4, TAU - 0.4, i % 2 === 1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(sx - 22, sy - 2);
    ctx.lineTo(sx - 36, sy - 18 + Math.sin(gTime * 2) * 2);
    ctx.stroke();
    ctx.lineCap = 'butt';
  },

  /* land-border march routes from the selected province */
  drawRoutes() {
    if (this.selected < 0) return;
    const sel = S.terr[this.selected];
    const [sx, sy] = MapGen.center(this.selected);
    const fromMine = sel.owner === 0 && !sel.sherwood;
    ctx.save();
    for (const a of MapGen.adj[this.selected]) {
      const [ax, ay] = MapGen.center(a);
      const tgt = S.terr[a];
      const march = fromMine && tgt.owner !== 0 && !tgt.sherwood;
      ctx.setLineDash([9, 8]);
      ctx.lineDashOffset = -gTime * 30;
      ctx.lineWidth = march ? 4 : 2.5;
      ctx.strokeStyle = march
        ? `rgba(255,210,90,${0.5 + 0.32 * Math.sin(gTime * 4)})`
        : (tgt.sherwood ? 'rgba(120,210,120,0.4)' : 'rgba(232,222,190,0.26)');
      ctx.beginPath(); ctx.moveTo(sx, sy + 6); ctx.lineTo(ax, ay + 6); ctx.stroke();
    }
    ctx.restore();
  },

  drawBanners() {
    for (const t of S.terr) {
      const [x, y] = MapGen.center(t.id);
      const col = t.sherwood ? '#2f7036' : (t.owner < 0 ? NEUTRAL_COLOR : S.lords[t.owner].color);
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
      if (t.sherwood) {
        // a bow-and-arrow device for the outlaw banner
        const by = y - 21 + wv * 0.6;
        ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(x + 22, by, 9, -1.15, 1.15); ctx.stroke();
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x + 14, by - 8.5); ctx.lineTo(x + 14, by + 8.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 11, by); ctx.lineTo(x + 31, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 28, by - 3); ctx.lineTo(x + 31, by); ctx.lineTo(x + 28, by + 3); ctx.stroke();
      } else {
        textShadow(String(t.garrison), x + 23, y - 21 + wv * 0.6, 21, '#fff');
      }
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
    const totalProvs = S.terr.filter(t => !t.sherwood).length;
    text(`${provs} / ${totalProvs} provinces`, 52, 94, 19, provs >= totalProvs - 2 ? '#ffd75e' : '#a89c80', 'left');
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

  drawSherwood() {
    const x = 30, y = 815, w = W - 60, h = 230;
    panel(x, y, w, h, { top: '#22401f', bot: '#13260f' });
    ctx.fillStyle = '#2f7036';
    roundRect(x + 24, y + 22, 12, 56, 4); ctx.fill();
    textShadow('Sherwood Forest', x + 50, y + 38, 30, '#c4ec9e', 'left');
    text('The greenwood — Robin Hood and his outlaws', x + 50, y + 70, 19, '#9fc28a', 'left');
    this.infoBtns = [];
    const cd = sherwoodCooldown();
    if (!playerBordersSherwood()) {
      text('Win a province bordering the greenwood', x + 28, y + 112, 21, '#cbbf9f', 'left');
      text('to earn an audience with Robin Hood.', x + 28, y + 142, 21, '#cbbf9f', 'left');
    } else if (cd > 0) {
      text('Robin and his men are abroad on the', x + 28, y + 112, 21, '#cbbf9f', 'left');
      text(`king's roads. Return in ${cd} month${cd > 1 ? 's' : ''}.`, x + 28, y + 142, 21, '#cbbf9f', 'left');
    } else {
      text('Prove your eye at the contest of the bow,', x + 28, y + 104, 20, '#cbbf9f', 'left');
      text('and his archers will rally to your cause.', x + 28, y + 128, 20, '#cbbf9f', 'left');
      const b = makeBtn(x + 20, y + 150, w - 40, 60, 'Seek Robin Hood’s Aid', () => {
        S.actionUsed = true; setScene(ArcheryScene);
      }, { color: '#2f6e34', size: 24 });
      b.enabled = !S.actionUsed && !this.aiQueue;
      this.infoBtns.push(b);
    }
    for (const b of this.infoBtns) drawBtn(b);
  },

  drawInfo() {
    const t = S.terr[this.selected];
    if (t.sherwood) { this.drawSherwood(); return; }
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
    this.terrain = TERR_DEFS[ti].sherwood ? 'forest' : TERR_DEFS[ti].terrain;
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
    // golden-hour battlefield
    const sky = ctx.createLinearGradient(0, 0, 0, 560);
    sky.addColorStop(0, '#503a5e');
    sky.addColorStop(0.55, '#b86850');
    sky.addColorStop(1, '#f0c080');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 560);
    sunRays(W / 2, 505, 360, '#ffe0a8', 0.12, 12, 0.03);
    glow(W / 2, 505, 220, 'rgba(255,222,150,0.9)', 0.85);
    ctx.fillStyle = '#fff0cc';
    ctx.beginPath(); ctx.arc(W / 2, 510, 64, 0, TAU); ctx.fill();
    // rooks wheeling over the field
    ctx.strokeStyle = 'rgba(30,22,30,0.7)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const bx = ((gTime * (26 + i * 7) + i * 260) % (W + 160)) - 80;
      const by = 130 + i * 52 + Math.sin(gTime * 2 + i) * 12;
      const fl = Math.sin(gTime * 7 + i * 2) * 6;
      ctx.beginPath();
      ctx.moveTo(bx - 9, by - fl);
      ctx.quadraticCurveTo(bx, by + 4, bx + 9, by - fl);
      ctx.stroke();
    }
    this.drawTerrainScenery();
    // haze rolling over the distant field
    ctx.fillStyle = 'rgba(240,200,140,0.12)';
    for (let i = 0; i < 2; i++) {
      const hx = ((gTime * (11 + i * 6)) % (W + 600)) - 300;
      ctx.beginPath();
      ctx.ellipse(hx, 580 + i * 26, 280, 26, 0, 0, TAU);
      ctx.fill();
    }
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
    vignette(0.42);
    if (this.phase === 'stance') text('Choose your tactics...', W / 2, 1180, 26, '#e8d8b0');
    else textShadow(`The Battle of ${this.t.name}`, W / 2, 1180, 30, '#ffd75e');
  },
  /* area-dependent horizon + battleground */
  drawTerrainScenery() {
    const terr = this.terrain;
    const G = {
      plain:  ['#5f8a38', '#46682d', '#2c451d'],
      forest: ['#3f6030', '#2c4a22', '#1c3216'],
      moor:   ['#6f6a42', '#544a32', '#37301f'],
      mount:  ['#71705a', '#524d3c', '#322f24'],
    }[terr] || ['#5f8a38', '#46682d', '#2c451d'];

    if (terr === 'mount') {
      const ranges = [['#aeb8c2', 466, 70], ['#8b95a0', 492, 96], ['#69707b', 520, 120]];
      for (const [col, base, amp] of ranges) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(0, 564);
        for (let x = 0; x <= W; x += 16) ctx.lineTo(x, base - Math.abs(fnoise(x * 0.014 + base, base) - 0.5) * amp * 2);
        ctx.lineTo(W, 564); ctx.closePath(); ctx.fill();
      }
      // snow on the nearest peaks
      ctx.fillStyle = 'rgba(236,242,246,0.9)';
      for (let x = 0; x <= W; x += 16) {
        const py = 520 - Math.abs(fnoise(x * 0.014 + 520, 520) - 0.5) * 240;
        if (py < 470) { ctx.beginPath(); ctx.moveTo(x - 7, py + 16); ctx.lineTo(x, py); ctx.lineTo(x + 7, py + 16); ctx.closePath(); ctx.fill(); }
      }
    } else if (terr === 'forest') {
      ctx.fillStyle = '#33502a';
      ctx.beginPath(); ctx.moveTo(0, 560);
      for (let x = 0; x <= W; x += 28) ctx.lineTo(x, 524 + fnoise(x * 0.008, 3) * 30);
      ctx.lineTo(W, 560); ctx.closePath(); ctx.fill();
      // a dense treeline silhouette
      for (let x = -10; x < W + 20; x += 26) {
        const h = 30 + fnoise(x * 0.05, 9) * 26;
        ctx.fillStyle = '#24411e';
        ctx.beginPath(); ctx.arc(x, 548 - h * 0.4, 18, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1c1410'; ctx.fillRect(x - 3, 548 - h * 0.4, 6, h);
      }
    } else if (terr === 'moor') {
      const downs = [['#7a6e8a', 500, 0.5], ['#6a6450', 526, 0.85]];
      for (const [col, base, amp] of downs) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(0, 560);
        for (let x = 0; x <= W; x += 30) ctx.lineTo(x, base + Math.sin(x * 0.01 + base) * 18 * amp + fnoise(x * 0.01, base) * 20);
        ctx.lineTo(W, 560); ctx.closePath(); ctx.fill();
      }
    } else { // plains — layered green downs
      const downs = [['#6f9a46', 498], ['#5a8038', 522]];
      for (const [col, base] of downs) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(0, 560);
        for (let x = 0; x <= W; x += 36) ctx.lineTo(x, base + Math.sin(x * 0.006 + base) * 16 + fnoise(x * 0.008, base) * 22);
        ctx.lineTo(W, 560); ctx.closePath(); ctx.fill();
      }
    }

    const grd = ctx.createLinearGradient(0, 540, 0, H);
    grd.addColorStop(0, G[0]); grd.addColorStop(0.5, G[1]); grd.addColorStop(1, G[2]);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 540, W, H - 540);
    // a rolling near edge of the field
    ctx.fillStyle = G[0];
    ctx.beginPath(); ctx.moveTo(0, 560);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 548 + fnoise(x * 0.01, 8.1) * 24);
    ctx.lineTo(W, 620); ctx.lineTo(0, 620); ctx.closePath(); ctx.fill();

    // foreground detail keyed to the land
    const rg = mulberry32(7);
    if (terr === 'moor') {
      for (let i = 0; i < 60; i++) { const x = rg() * W, y = 640 + rg() * 560; ctx.fillStyle = rg() < 0.5 ? '#7a4f72' : '#4a5a32'; ctx.fillRect(x, y, 3, 3); }
    } else if (terr === 'mount') {
      for (let i = 0; i < 26; i++) { const x = rg() * W, y = 650 + rg() * 560, s = 4 + rg() * 9; ctx.fillStyle = '#6a6452'; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.3, s * 0.7, 0, TAU); ctx.fill(); }
    } else {
      ctx.strokeStyle = 'rgba(20,40,16,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 90; i++) { const x = rg() * W, y = 640 + rg() * 560; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rg() * 4 - 2, y - 6 - rg() * 5); ctx.stroke(); }
    }
  },
  drawHost(cx, dir, color, soldiers, knights) {
    const total = soldiers + knights;
    if (total <= 0) return;
    const icons = Math.min(12, total);
    const kIcons = Math.round(icons * knights / total);
    let n = 0;
    for (let row = 0; row < 3 && n < icons; row++) {
      for (let col = 0; col < 4 && n < icons; col++, n++) {
        const x = cx + dir * (col * 60) + (row % 2) * 24 * dir;
        const y = 712 + row * 96;
        if (n < kIcons) drawMiniKnight(x, y, 2.0, color, dir, this.lunge);
        else drawSoldier(x, y, 2.2, color, dir, this.lunge);
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
    if (Math.abs(d) > 3.4) {
      slowMo(0.22, 0.55);
      burst(W / 2, 930, 16, { color: '#caa', spMax: 200 });
    } else if (Math.abs(d) > 0.8) {
      slowMo(0.4, 0.3);
    }
    if (this.pWins === true) {
      for (let i = 0; i < 36; i++) {
        spawn(rnd(60, W - 60), rnd(260, 330), {
          vx: rnd(-40, 40), vy: rnd(20, 90), g: 60, life: rnd(1.2, 2.2),
          size: rnd(4, 7), color: pick(['#ffd75e', '#e85a4a', '#7ac0e8', '#a8e87a', '#e8a8d8']),
          shrink: false,
        });
      }
    }
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
    // late-afternoon sky burning toward sunset
    const sky = ctx.createLinearGradient(0, 0, 0, 470);
    sky.addColorStop(0, '#31406e');
    sky.addColorStop(0.55, '#a05a68');
    sky.addColorStop(1, '#eeb070');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 470);
    sunRays(140, 215, 280, '#ffd9a0', 0.1, 11, 0.04);
    glow(140, 215, 170, 'rgba(255,210,140,0.85)', 0.8);
    ctx.fillStyle = '#ffeac0';
    ctx.beginPath(); ctx.arc(140, 215, 38, 0, TAU); ctx.fill();
    // warm clouds
    for (let i = 0; i < 4; i++) {
      const cx = ((gTime * 9 + i * 210) % (W + 240)) - 120;
      const cy = 80 + i * 48;
      ctx.fillStyle = `rgba(255,224,200,${0.5 - i * 0.07})`;
      for (const [ox, oy, r] of [[0, 0, 34], [30, 6, 26], [-30, 8, 24]]) {
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, TAU); ctx.fill();
      }
    }
    // hazy hills, far to near
    ctx.fillStyle = 'rgba(110,90,130,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 296 + fnoise(x * 0.004, 1.1) * 52);
    ctx.lineTo(W, 470); ctx.lineTo(0, 470);
    ctx.closePath(); ctx.fill();
    drawCastleSilhouette(580, 322, 0.7, 'rgba(74,60,92,0.85)');
    ctx.fillStyle = 'rgba(86,74,98,0.8)';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    for (let x = 0; x <= W; x += 36) ctx.lineTo(x, 342 + fnoise(x * 0.006, 6.4) * 40);
    ctx.lineTo(W, 470); ctx.lineTo(0, 470);
    ctx.closePath(); ctx.fill();
    // grandstand with a striped canopy
    ctx.fillStyle = '#5e4226';
    ctx.fillRect(0, 332, W, 118);
    for (let i = 0; i * 48 < W; i++) {
      ctx.fillStyle = i % 2 ? '#b8413a' : '#e8dcc2';
      ctx.fillRect(i * 48, 296, 48, 30);
      ctx.beginPath();
      ctx.arc(i * 48 + 24, 326, 24, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(40,26,14,0.35)';
    ctx.fillRect(0, 332, W, 16);
    for (let i = 0; i < 12; i++) {
      const fx = 30 + i * 62;
      ctx.fillStyle = i % 2 ? player().color : this.foe.color;
      ctx.beginPath();
      ctx.moveTo(fx, 242); ctx.lineTo(fx + 20, 250 + Math.sin(gTime * 3 + i) * 3); ctx.lineTo(fx, 260);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx, 238); ctx.lineTo(fx, 296); ctx.stroke();
    }
    const cheer = this.phase === 'impact' ? 6 : 1.5;
    for (const c of this.crowd) {
      ctx.fillStyle = c.c;
      ctx.beginPath();
      ctx.arc(c.x, c.y + Math.sin(gTime * 6 + c.p) * cheer, 8, 0, TAU);
      ctx.fill();
    }
    // torch-lit field
    const grass = ctx.createLinearGradient(0, 450, 0, H);
    grass.addColorStop(0, '#6a8848');
    grass.addColorStop(0.5, '#55703c');
    grass.addColorStop(1, '#3a5230');
    ctx.fillStyle = grass;
    ctx.fillRect(0, 450, W, H - 450);
    ctx.fillStyle = 'rgba(255,236,190,0.05)';
    for (let i = 0; i < 5; i++) ctx.fillRect(0, 490 + i * 150, W, 60);
    // the tilt barrier, hung with shields
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(0, 930, W, 22);
    ctx.fillStyle = '#74664a';
    ctx.fillRect(0, 952, W, 8);
    for (let i = 0; i < 7; i++) {
      const sx2 = 50 + i * 105;
      ctx.fillStyle = i % 2 ? this.foe.color : player().color;
      ctx.beginPath();
      ctx.moveTo(sx2 - 11, 935); ctx.lineTo(sx2 + 11, 935); ctx.lineTo(sx2 + 11, 952);
      ctx.quadraticCurveTo(sx2, 962, sx2 - 11, 952);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 1.5; ctx.stroke();
    }
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
    if (this.phase === 'run' && this.t > 0.35) {
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const ly = 840 + ((i * 53) % 220);
        const lx = (gTime * 1400 + i * 197) % (W + 260) - 130;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 90 - this.t * 50, ly);
        ctx.stroke();
      }
    }
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
    vignette(0.34);
    if (this.phase === 'ready') {
      textShadow('Tap to begin the pass!', W / 2, 1140, 34, '#ffe9a0');
    } else if (this.phase === 'impact') {
      letterbox(easeOut(clamp(this.t * 4, 0, 1)));
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
      spawn(b.x, b.y, {
        vx: rnd(-20, 20), vy: rnd(-20, 20), g: -30, life: rnd(0.25, 0.5),
        size: rnd(3, 6), color: pick(['#ff9a40', '#ffce6a', '#e85a30']),
      });
      if (Math.random() < 0.4) spawn(b.x, b.y, { vx: 0, vy: -10, g: -20, life: 0.6, size: 5, color: 'rgba(90,80,75,0.5)' });
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
    // a siege by night
    const sky = ctx.createLinearGradient(0, 0, 0, 700);
    sky.addColorStop(0, '#070b1e');
    sky.addColorStop(0.6, '#1c1a3a');
    sky.addColorStop(1, '#3a2c44');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 700);
    if (!this.stars) {
      const rg = mulberry32(7);
      this.stars = Array.from({ length: 80 }, () => ({ x: rg() * W, y: rg() * 600, r: 0.6 + rg() * 1.6, p: rg() * TAU }));
    }
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(gTime * 0.9 + s.p));
      ctx.fillStyle = '#dce6ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    glow(110, 220, 130, 'rgba(220,228,255,0.6)', 0.6);
    ctx.fillStyle = '#e4e2d2';
    ctx.beginPath(); ctx.arc(110, 220, 42, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(7,11,30,0.85)';
    ctx.beginPath(); ctx.arc(94, 210, 36, 0, TAU); ctx.fill();
    // far hills
    ctx.fillStyle = '#0e0e22';
    ctx.beginPath();
    ctx.moveTo(0, 680);
    for (let x = 0; x <= W; x += 36) ctx.lineTo(x, 650 + fnoise(x * 0.005, 2.7) * 60);
    ctx.lineTo(W, 700); ctx.lineTo(0, 700);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#322a24';
    ctx.fillRect(0, 690, W, H - 690);
    ctx.fillStyle = '#28221c';
    ctx.fillRect(0, 1020, W, H - 1020);
    // the castle keep behind the walls
    ctx.fillStyle = '#231e16';
    ctx.fillRect(620, 480, 100, 540);
    for (let i = 0; i < 4; i++) ctx.fillRect(620 + i * 26, 462, 14, 18);
    glow(662, 571, 60, 'rgba(255,180,80,0.7)', 0.5 + 0.2 * Math.sin(gTime * 2.2));
    ctx.fillStyle = `rgba(255,200,90,${0.6 + 0.35 * Math.sin(gTime * 2.2)})`;
    ctx.fillRect(655, 560, 14, 22);
    ctx.fillStyle = `rgba(255,200,90,${0.5 + 0.35 * Math.sin(gTime * 1.7 + 2)})`;
    ctx.fillRect(688, 640, 12, 18);
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
      ctx.fillStyle = r.seg.hp === 2 ? '#6e6654' : '#5c5446';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      const ml = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
      ml.addColorStop(0, 'rgba(150,170,220,0.16)');
      ml.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = ml;
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
      // a defender and a brazier on top
      drawSoldier(r.x + 46, r.y - 22, 1.4, col, -1);
      const bx = r.x + 14, by = r.y - 20;
      glow(bx, by - 6, 56, 'rgba(255,160,70,0.7)', 0.5 + 0.15 * Math.sin(gTime * 8 + r.i * 2));
      ctx.fillStyle = '#3a3026';
      ctx.fillRect(bx - 8, by, 16, 7);
      const fl = Math.sin(gTime * 9 + r.i) * 3;
      ctx.fillStyle = '#ff9a30';
      ctx.beginPath(); ctx.ellipse(bx, by - 8, 6, 11 + fl, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath(); ctx.ellipse(bx, by - 5, 3.5, 6, 0, 0, TAU); ctx.fill();
      if (Math.random() < 0.15) {
        spawn(bx, by - 12, { vx: rnd(-12, 12), vy: rnd(-50, -25), g: -20, life: 0.7, size: 2.5, color: '#ffb050' });
      }
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
    // torchlight around the catapult crew
    glow(170, 850, 230, 'rgba(255,160,70,0.45)', 0.55 + 0.08 * Math.sin(gTime * 6));
    // a flaming boulder in flight
    if (this.boulder) {
      const b = this.boulder;
      glow(b.x, b.y, 60, 'rgba(255,150,50,0.9)', 0.7);
      ctx.fillStyle = '#4a423a';
      ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,70,0.85)';
      ctx.beginPath(); ctx.arc(b.x - 5, b.y - 5, 7, 0, TAU); ctx.fill();
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
    vignette(0.5);
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
    // pools of torchlight on the flagstones
    glow(120, 760, 260, 'rgba(255,160,70,0.35)', 0.55);
    glow(600, 760, 260, 'rgba(255,160,70,0.35)', 0.55);
    glow(600, 130, 120, 'rgba(220,228,255,0.5)', 0.5);
    // night mist creeping through the courtyard
    ctx.fillStyle = 'rgba(160,170,200,0.06)';
    for (let i = 0; i < 3; i++) {
      const fx = ((gTime * (8 + i * 5) + i * 300) % (W + 560)) - 280;
      ctx.beginPath();
      ctx.ellipse(fx, 880 + i * 90, 240, 42, 0, 0, TAU);
      ctx.fill();
    }
    // duelists
    const lungeP = this.phase === 'hit' && this.flash.includes('!') && this.ehp < 3 ? Math.max(0, 1 - this.t * 2) : 0;
    drawSoldier(220 + lungeP * 60, 880, 4.2, player().color, 1, lungeP);
    drawSoldier(500, 866, 4.2, this.foe.color, -1, this.php < 3 && this.phase === 'hit' ? Math.max(0, 1 - this.t * 2) : 0);
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

/* ---------------- Robin Hood: the contest of the bow ---------------- */
const ArcheryScene = {
  enter() {
    this.arrow = 1;
    this.scores = [];
    this.shots = [];
    this.phase = 'aim';
    this.t = 0;
    this.flyT = 0;
    this.aimPt = null;
    this.tx = 556; this.ty = 642; this.tr = 90;
    this.trees = Array.from({ length: 12 }, () => ({ x: rnd(20, W - 20), y: rnd(300, 520), s: rnd(0.7, 1.3) }));
    this.merry = [{ x: 250, y: 1120 }, { x: 360, y: 1140 }, { x: 92, y: 1150 }];
    Modal.show({
      title: 'Into the Greenwood',
      lines: [
        'You step beneath the oaks of Sherwood. Robin Hood leans on his longbow and names a wager: match his eye at the butts, and his Merry Men are yours.',
        'A reticle drifts across the target — tap to loose each of your three arrows. The gold at the centre scores highest.',
      ],
      buttons: [{ label: 'Take up the bow', fn: () => Sfx.whoosh() }],
    });
  },
  reticle() {
    const sp = 2.0 + this.arrow * 0.55;
    return [this.tx + Math.sin(this.t * sp) * this.tr * 1.3,
            this.ty + Math.cos(this.t * sp * 1.37) * this.tr * 1.25];
  },
  loose() {
    if (this.phase !== 'aim') return;
    this.aimPt = this.reticle();
    this.phase = 'fly';
    this.flyT = 0;
    Sfx.whoosh();
  },
  update(dt) {
    this.t += dt;
    if (this.phase === 'fly') { this.flyT += dt; if (this.flyT >= 0.42) this.impact(); }
  },
  impact() {
    const [x, y] = this.aimPt;
    const d = dist(x, y, this.tx, this.ty);
    let ring = 0;
    if (d < this.tr * 0.18) ring = 10;
    else if (d < this.tr * 0.42) ring = 7;
    else if (d < this.tr * 0.66) ring = 5;
    else if (d < this.tr * 0.92) ring = 3;
    this.shots.push({ x, y, ring });
    this.scores.push(ring);
    if (ring >= 10) { Sfx.fanfare(); burst(x, y, 20, { color: '#ffd75e', spMax: 240 }); slowMo(0.4, 0.25); shake = 8; buzz(60); }
    else if (ring > 0) { Sfx.clash(); burst(x, y, 12, { color: '#d8c79a', spMax: 180 }); shake = 4; buzz(25); }
    else { Sfx.thud(); burst(x, y, 8, { color: '#6a8a4a', spMax: 120 }); }
    if (this.arrow >= 3) this.finish();
    else { this.arrow++; this.phase = 'aim'; }
  },
  finish() {
    this.phase = 'done';
    const total = this.scores.reduce((a, b) => a + b, 0);
    const r = grantRobinAid(total);
    const quality = total >= 24 ? 'Robin himself claps you on the back — a marksman after his own heart!'
      : total >= 13 ? 'Robin nods, well pleased with your aim.'
        : 'Robin grins: “Stay a while — you’ll learn the bow yet.”';
    const lines = [quality];
    let band = `${r.men} Merry Men longbowmen`;
    if (r.knights) band += ` and ${r.knights} seasoned outlaw${r.knights > 1 ? 's' : ''}`;
    lines.push(band + ' join your host.');
    if (r.gold > 0 && r.rival) lines.push(`Robin’s purse brings you ${r.gold} gold, lifted from ${r.rival.name}.`);
    Sfx.fanfare();
    Modal.show({
      title: `A Score of ${total}`,
      lines,
      buttons: [{ label: 'Back to the Map', fn: () => setScene(MapScene) }],
    });
  },
  render() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2a401f');
    sky.addColorStop(0.5, '#37512a');
    sky.addColorStop(1, '#21341a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    sunRays(W * 0.66, -40, 760, '#e6f4b4', 0.06, 9, 0.02);
    glow(W * 0.66, 70, 360, 'rgba(210,240,150,0.22)', 0.5);
    // canopy of trees behind
    for (const tr of this.trees) {
      const { x, y, s } = tr;
      ctx.fillStyle = '#1c1410'; ctx.fillRect(x - 5 * s, y + 18 * s, 10 * s, 70 * s);
      ctx.fillStyle = '#22401d';
      ctx.beginPath(); ctx.arc(x, y, 36 * s, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2c5026';
      ctx.beginPath(); ctx.arc(x - 15 * s, y + 6 * s, 26 * s, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 16 * s, y + 4 * s, 24 * s, 0, TAU); ctx.fill();
    }
    // clearing floor
    const grd = ctx.createLinearGradient(0, 540, 0, H);
    grd.addColorStop(0, '#41582a');
    grd.addColorStop(1, '#2a3c1c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 560, W, H - 560);
    // target + stuck arrows
    drawTarget(this.tx, this.ty, this.tr);
    for (const sh of this.shots) drawStuckArrow(sh.x, sh.y, rnd(-0.05, 0.05));
    // Merry Men spectators
    for (const m of this.merry) drawArcher(m.x, m.y, 2.4, 0.2);
    // Robin
    drawArcher(150, 980, 4.6, this.phase === 'aim' ? 0.5 + 0.5 * Math.abs(Math.sin(gTime * 2)) : (this.phase === 'fly' ? 0.1 : 0.3));
    // the arrow in flight
    if (this.phase === 'fly') {
      const k = this.flyT / 0.42;
      const [ex, ey] = this.aimPt;
      const ax = lerp(196, ex, k);
      const ay = lerp(930, ey, k) - Math.sin(k * Math.PI) * 70;
      drawStuckArrow(ax, ay, Math.atan2(ey - 930, ex - 196) * 0.4 + 0.3);
    }
    // aim reticle
    if (this.phase === 'aim') {
      const [rx, ry] = this.reticle();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rx, ry, 15, 0, TAU); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - 22, ry); ctx.lineTo(rx - 7, ry);
      ctx.moveTo(rx + 7, ry); ctx.lineTo(rx + 22, ry);
      ctx.moveTo(rx, ry - 22); ctx.lineTo(rx, ry - 7);
      ctx.moveTo(rx, ry + 7); ctx.lineTo(rx, ry + 22);
      ctx.stroke();
    }
    vignette(0.4);
    panel(20, 20, W - 40, 92, { r: 12 });
    textShadow('The Contest of the Bow', W / 2, 50, 28, '#dff0b0');
    text(`Arrow ${Math.min(this.arrow, 3)} of 3      Score ${this.scores.reduce((a, b) => a + b, 0)}`,
      W / 2, 84, 22, '#cbbf9f');
    if (this.phase === 'aim') textShadow('Tap to loose!', W / 2, 1200, 32, '#ffe9a0');
  },
  onTap() { if (this.phase === 'aim') this.loose(); },
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
      sunRays(W / 2, 380, 330, '#ffd75e', 0.11, 13, 0.035);
      glow(W / 2, 380, 260, 'rgba(255,210,110,0.6)', 0.75);
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
