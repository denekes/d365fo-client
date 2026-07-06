'use strict';
/* =========================================================
   Crown of Albion — core engine
   canvas / loop / input / ui / audio / particles / modal
   ========================================================= */

const W = 720, H = 1280;
const TAU = Math.PI * 2;
let canvas, ctx, drawScale = 1;

/* ---------------- utils ---------------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hexRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex, amt) {
  let [r, g, b] = hexRGB(hex);
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function mix(hexA, hexB, t) {
  const a = hexRGB(hexA), b = hexRGB(hexB);
  return `rgb(${lerp(a[0], b[0], t) | 0},${lerp(a[1], b[1], t) | 0},${lerp(a[2], b[2], t) | 0})`;
}

/* deterministic 2d value-noise (for map + textures) */
function vnHash(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = vnHash(xi, yi), b = vnHash(xi + 1, yi);
  const c = vnHash(xi, yi + 1), d = vnHash(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fnoise(x, y) { // 2 octaves
  return vnoise(x, y) * 0.66 + vnoise(x * 2.13 + 7.7, y * 2.13 + 3.1) * 0.34;
}

/* ---------------- text ---------------- */
const FONT = 'Georgia, "Times New Roman", serif';
function text(s, x, y, size, color = '#f0e6d2', align = 'center', bold = false, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}
function textShadow(s, x, y, size, color = '#f0e6d2', align = 'center', bold = true) {
  text(s, x + 2, y + 3, size, 'rgba(0,0,0,0.55)', align, bold);
  text(s, x, y, size, color, align, bold);
}
function wrapLines(s, size, maxW) {
  ctx.font = `${size}px ${FONT}`;
  const words = String(s).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------------- ui: buttons & panels ---------------- */
function makeBtn(x, y, w, h, label, fn, opts = {}) {
  return Object.assign({ x, y, w, h, label, fn, enabled: true, size: 26, color: '#5a3d22' }, opts);
}
function drawBtn(b) {
  ctx.save();
  ctx.globalAlpha *= b.enabled ? 1 : 0.4;
  const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  g.addColorStop(0, shade(b.color, 0.25));
  g.addColorStop(0.5, b.color);
  g.addColorStop(1, shade(b.color, -0.35));
  roundRect(b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#c9a44a';
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,235,180,0.35)';
  roundRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6, 9);
  ctx.stroke();
  textShadow(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.size, '#f5e9c8');
  ctx.restore();
}
function btnAt(list, x, y) {
  for (const b of list) {
    if (b.enabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function panel(x, y, w, h, opts = {}) {
  ctx.save();
  const r = opts.r || 18;
  // grounded drop shadow, drawn (shadowBlur is too slow in software rendering)
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(x - 3, y + 5, w + 6, h + 8, r + 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  roundRect(x + 2, y + 9, w - 4, h, r);
  ctx.fill();
  roundRect(x, y, w, h, r);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, opts.top || '#3a2c1c');
  g.addColorStop(1, opts.bot || '#241a10');
  ctx.fillStyle = g;
  ctx.globalAlpha *= (opts.alpha === undefined ? 0.96 : opts.alpha);
  ctx.fill();
  ctx.globalAlpha = 1;
  // top sheen so the panel reads as lit, not flat
  const sh = ctx.createLinearGradient(0, y, 0, y + h * 0.3);
  sh.addColorStop(0, 'rgba(255,240,205,0.12)');
  sh.addColorStop(1, 'rgba(255,240,205,0)');
  roundRect(x + 3, y + 3, w - 6, h * 0.3, Math.max(4, r - 5));
  ctx.fillStyle = sh;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#c9a44a';
  roundRect(x, y, w, h, r);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,235,180,0.25)';
  roundRect(x + 5, y + 5, w - 10, h - 10, r - 6);
  ctx.stroke();
  // corner rivets
  for (const [rx, ry] of [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]]) {
    ctx.fillStyle = '#e2c26a';
    ctx.beginPath(); ctx.arc(rx, ry, 3.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,38,10,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(rx - 1, ry - 1, 1.1, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* engraved gold display type for titles and headers */
function titleText(s, x, y, size, align = 'center') {
  ctx.save();
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = Math.max(2, size * 0.05);
  const g = ctx.createLinearGradient(0, y - size * 0.52, 0, y + size * 0.52);
  g.addColorStop(0, '#fff4d0');
  g.addColorStop(0.45, '#f2cf7a');
  g.addColorStop(0.75, '#cd9c3f');
  g.addColorStop(1, '#8a5f1a');
  ctx.fillStyle = g;
  ctx.fillText(s, x, y);
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.strokeStyle = 'rgba(56,36,10,0.85)';
  ctx.strokeText(s, x, y);
  ctx.restore();
}

/* small icons drawn in vector */
function drawCoin(x, y, r = 11) {
  ctx.save();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  g.addColorStop(0, '#ffe9a0'); g.addColorStop(0.7, '#e2b53e'); g.addColorStop(1, '#8a6418');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#6e4d10'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(110,77,16,0.7)';
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, TAU); ctx.stroke();
  ctx.restore();
}
function drawStar(x, y, r, color = '#ffd75e') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}
function drawCrown(x, y, s, color = '#e8bd4a') {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = shade('#e8bd4a', -0.5);
  ctx.lineWidth = 0.12;
  ctx.beginPath();
  ctx.moveTo(-1, 0.55); ctx.lineTo(-1.15, -0.45); ctx.lineTo(-0.55, 0.05);
  ctx.lineTo(0, -0.75); ctx.lineTo(0.55, 0.05); ctx.lineTo(1.15, -0.45);
  ctx.lineTo(1, 0.55); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillRect(-1, 0.55, 2, 0.3);
  ctx.fillStyle = '#c33a4b';
  ctx.beginPath(); ctx.arc(0, 0.7, 0.13, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2c6fb3';
  ctx.beginPath(); ctx.arc(-0.6, 0.7, 0.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0.6, 0.7, 0.1, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawSword(x, y, s, ang = -Math.PI / 4) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = '#cdd4dc';
  ctx.beginPath();
  ctx.moveTo(0, -1.1); ctx.lineTo(0.1, -0.95); ctx.lineTo(0.1, 0.25);
  ctx.lineTo(-0.1, 0.25); ctx.lineTo(-0.1, -0.95); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a9842f';
  ctx.fillRect(-0.3, 0.25, 0.6, 0.12);
  ctx.fillStyle = '#6b4a22';
  ctx.fillRect(-0.07, 0.37, 0.14, 0.4);
  ctx.fillStyle = '#a9842f';
  ctx.beginPath(); ctx.arc(0, 0.85, 0.11, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawCastleIcon(x, y, s, color = '#cfc6b4') {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(40,30,20,0.6)';
  ctx.lineWidth = 0.08;
  ctx.fillRect(-1, -0.3, 2, 1.1);
  ctx.strokeRect(-1, -0.3, 2, 1.1);
  for (let i = -1; i <= 1; i++) ctx.fillRect(i * 0.7 - 0.18, -0.62, 0.36, 0.36);
  ctx.fillRect(-1.35, -0.9, 0.5, 1.7);
  ctx.fillRect(0.85, -0.9, 0.5, 1.7);
  ctx.strokeRect(-1.35, -0.9, 0.5, 1.7);
  ctx.strokeRect(0.85, -0.9, 0.5, 1.7);
  ctx.fillStyle = '#4a3826';
  ctx.beginPath();
  ctx.moveTo(-0.25, 0.8); ctx.lineTo(-0.25, 0.25);
  ctx.arc(0, 0.25, 0.25, Math.PI, 0);
  ctx.lineTo(0.25, 0.8); ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawHelmIcon(x, y, s, color = '#b9c2cc') {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-0.7, 0.8); ctx.lineTo(-0.7, -0.1);
  ctx.arc(0, -0.1, 0.7, Math.PI, 0);
  ctx.lineTo(0.7, 0.8); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c2026';
  ctx.fillRect(-0.7, 0.05, 1.4, 0.18);
  ctx.fillStyle = shade('#b9c2cc', -0.3);
  ctx.fillRect(-0.08, -0.85, 0.16, 0.3);
  ctx.restore();
}

/* ---------------- input ---------------- */
const Input = {
  x: 0, y: 0, down: false,
  downX: 0, downY: 0, downT: 0,
};
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
}
function bindInput() {
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sfx.ensure();
    const [x, y] = toLogical(e);
    Input.x = x; Input.y = y; Input.down = true;
    Input.downX = x; Input.downY = y; Input.downT = performance.now();
    dispatch('down', x, y);
  });
  canvas.addEventListener('pointermove', e => {
    const [x, y] = toLogical(e);
    Input.x = x; Input.y = y;
    if (Input.down) dispatch('move', x, y);
  });
  const up = e => {
    if (!Input.down) return;
    const [x, y] = toLogical(e);
    Input.x = x; Input.y = y; Input.down = false;
    dispatch('up', x, y);
    const dt = performance.now() - Input.downT;
    if (dt < 450 && dist(x, y, Input.downX, Input.downY) < 24) dispatch('tap', x, y);
    else {
      const dx = x - Input.downX, dy = y - Input.downY;
      if (Math.hypot(dx, dy) > 50 && dt < 700) {
        dispatch('swipe', Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      }
    }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}
function dispatch(kind, a, b) {
  if (Modal.active) { if (kind === 'tap') Modal.tap(a, b); return; }
  const s = scene;
  if (!s) return;
  const fn = { down: s.onDown, move: s.onMove, up: s.onUp, tap: s.onTap, swipe: s.onSwipe }[kind];
  if (fn) fn.call(s, a, b);
}
function buzz(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* unsupported */ }
}

/* ---------------- audio (procedural, multi-voice) ---------------- */
const Sfx = {
  ac: null, master: null, wet: null, on: true, musicOn: true,
  nextBar: 0, barI: 0,
  /* the court theme: an A section in A minor and a lifted B section that
     turns toward the relative major, where the horns enter */
  progA: [
    { root: 45, chord: [57, 60, 64], mel: [[76, 2], [72, 2]] },
    { root: 43, chord: [55, 59, 62], mel: [[74, 2], [71, 2]] },
    { root: 41, chord: [53, 57, 60], mel: [[72, 2], [69, 2]] },
    { root: 45, chord: [57, 60, 64], mel: [[69, 1], [72, 1], [76, 2]] },
    { root: 38, chord: [50, 53, 57], mel: [[74, 2], [69, 2]] },
    { root: 36, chord: [48, 52, 55], mel: [[72, 2], [67, 2]] },
    { root: 40, chord: [52, 56, 59], mel: [[71, 2], [68, 2]] },
    { root: 45, chord: [57, 60, 64], mel: [[69, 3], [71, 1]] },
  ],
  progB: [
    { root: 48, chord: [60, 64, 67], mel: [[79, 2], [76, 1], [77, 1]], horns: true },
    { root: 43, chord: [55, 59, 62], mel: [[79, 1.5], [78, 0.5], [74, 2]], horns: true },
    { root: 45, chord: [57, 60, 64], mel: [[76, 2], [72, 2]], horns: true },
    { root: 41, chord: [53, 57, 60], mel: [[72, 1], [74, 1], [76, 2]], horns: true },
    { root: 48, chord: [60, 64, 67], mel: [[79, 2], [81, 2]], horns: true },
    { root: 43, chord: [55, 59, 62], mel: [[79, 2], [74, 2]], horns: true },
    { root: 40, chord: [52, 56, 59], mel: [[76, 1.5], [74, 0.5], [71, 2]], horns: true },
    { root: 45, chord: [57, 60, 64], mel: [[69, 4]], horns: true },
  ],
  /* the war theme: a grim, driving four bars under battles and sieges */
  progWar: [
    { root: 45, chord: [57, 60, 64], mel: [[69, 1], [69, 0.5], [72, 0.5], [69, 2]], horns: true, drums: 2 },
    { root: 45, chord: [57, 60, 64], mel: [[74, 1.5], [72, 0.5], [69, 2]], drums: 2 },
    { root: 41, chord: [53, 57, 60], mel: [[72, 1], [72, 0.5], [74, 0.5], [77, 2]], horns: true, drums: 2 },
    { root: 40, chord: [52, 56, 59], mel: [[76, 2], [68, 2]], horns: true, drums: 2 },
  ],
  ensure() {
    if (!this.ac) {
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const ac = this.ac;
      // mastering chain: everything through a gentle bus compressor —
      // it glues the ensemble and makes the mix read as produced
      this.bus = ac.createGain();
      this.bus.gain.value = 0.95;
      let out = this.bus;
      try {
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -20;
        comp.knee.value = 22;
        comp.ratio.value = 4;
        comp.attack.value = 0.008;
        comp.release.value = 0.22;
        this.bus.connect(comp);
        out = comp;
      } catch (e) { /* raw bus */ }
      out.connect(ac.destination);
      this.master = ac.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.bus);
      // a generated hall reverb for cinematic space
      try {
        const len = Math.floor(ac.sampleRate * 2.4);
        const imp = ac.createBuffer(2, len, ac.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = imp.getChannelData(ch);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
        }
        this.conv = ac.createConvolver(); this.conv.buffer = imp;
        this.wet = ac.createGain(); this.wet.gain.value = 0.26;
        this.master.connect(this.conv); this.conv.connect(this.wet); this.wet.connect(this.bus);
      } catch (e) { /* no reverb */ }
      this.nextBar = ac.currentTime + 0.35;
      this.initStreams();
    }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  /* real recorded music: drop looping orchestral tracks into music/ and
     point these paths at them — they take over from the procedural score.
     e.g. MUSIC: { court: 'music/theme-court.ogg', war: 'music/theme-war.ogg' } */
  MUSIC: { court: '', war: '' },
  initStreams() {
    if (this.streams || typeof Audio === 'undefined') return;
    this.streams = {};
    for (const name of ['court', 'war']) {
      const src = this.MUSIC[name];
      if (!src) continue;
      const entry = { el: null, ready: false };
      this.streams[name] = entry;
      try {
        const a = new Audio(src);
        a.loop = true;
        a.volume = 0;
        a.addEventListener('canplaythrough', () => { entry.el = a; entry.ready = true; }, { once: true });
        a.addEventListener('error', () => { /* missing — the synth score plays */ });
        a.load();
      } catch (e) { /* no file */ }
    }
  },
  theme: 'court',
  setTheme(name) {
    if (this.theme === name) return;
    this.theme = name;
    this.barI = 0;
    if (this.ac) this.nextBar = this.ac.currentTime + 0.25;
  },
  freq(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  /* one shaped voice with ADSR, routed through master (so it gets reverb) */
  voice(f, dur, { type = 'triangle', vol = 0.1, slide = 0, delay = 0, attack = 0.012, detune = 0 } = {}) {
    if (!this.ac || !this.on || !this.master) return;
    const t = this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.06);
  },
  tone(f, dur, opts = {}) { this.voice(f, dur, Object.assign({ type: 'square', vol: 0.12 }, opts)); },
  noise(dur, vol = 0.2, delay = 0, low = false) {
    if (!this.ac || !this.on || !this.master) return;
    const t = this.ac.currentTime + delay;
    const n = Math.floor(this.ac.sampleRate * dur);
    const buf = this.ac.createBuffer(1, n, this.ac.sampleRate);
    const d = buf.getChannelData(0);
    let v = 0;
    for (let i = 0; i < n; i++) {
      const wh = Math.random() * 2 - 1;
      v = low ? v * 0.92 + wh * 0.08 : wh;
      d[i] = v * (1 - i / n);
    }
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const g = this.ac.createGain(); g.gain.value = vol;
    src.connect(g).connect(this.master);
    src.start(t);
  },
  // a soft timpani/war-drum
  kick(delay, strong) {
    this.voice(strong ? 96 : 84, 0.2, { type: 'sine', vol: strong ? 0.16 : 0.09, slide: -56, delay, attack: 0.005 });
    this.noise(0.12, strong ? 0.05 : 0.03, delay, true);
  },
  /* a plucked string via Karplus-Strong: a noise burst circulating through a
     tuned delay + lowpass feedback loop — a genuinely lute-like tone */
  pluck(f, dur = 1.1, vol = 0.25, delay = 0, pan = 0) {
    const ac = this.ac;
    if (!ac || !this.on || !this.master) return;
    const t = ac.currentTime + delay;
    const blen = Math.max(2, Math.round(ac.sampleRate / f));
    const buf = ac.createBuffer(1, blen, ac.sampleRate);
    const bd = buf.getChannelData(0);
    for (let i = 0; i < blen; i++) bd[i] = Math.random() * 2 - 1;
    const burst = ac.createBufferSource();
    burst.buffer = buf;
    const dl = ac.createDelay(0.1);
    dl.delayTime.value = 1 / f;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(9000, f * 7);
    const fb = ac.createGain();
    fb.gain.setValueAtTime(0.985, t);
    fb.gain.linearRampToValueAtTime(0.55, t + dur);   // let the string die out
    const out = ac.createGain();
    out.gain.setValueAtTime(vol, t);
    out.gain.exponentialRampToValueAtTime(0.001, t + dur);
    burst.connect(dl);
    dl.connect(lp); lp.connect(fb); fb.connect(dl);   // the feedback loop
    dl.connect(out);
    let tail = out;
    if (ac.createStereoPanner) {
      const pn = ac.createStereoPanner();
      pn.pan.value = pan;
      out.connect(pn);
      tail = pn;
    }
    tail.connect(this.master);
    burst.start(t);
    burst.stop(t + blen / ac.sampleRate + 0.01);
    setTimeout(() => {
      try { dl.disconnect(); lp.disconnect(); fb.disconnect(); out.disconnect(); tail.disconnect(); } catch (e) { /* gone */ }
    }, (delay + dur + 0.4) * 1000);
  },
  /* a breathy flute: sine with vibrato and a whisper of filtered air */
  flute(f, dur, vol = 0.06, delay = 0) {
    const ac = this.ac;
    if (!ac || !this.on || !this.master) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5.2;
    const lfoG = ac.createGain();
    lfoG.gain.value = 9;                 // vibrato depth in cents
    lfo.connect(lfoG);
    lfoG.connect(o.detune);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.09);
    g.gain.setValueAtTime(vol, t + Math.max(0.1, dur - 0.12));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
    lfo.start(t); lfo.stop(t + dur + 0.05);
    this.noise(Math.min(0.2, dur * 0.3), vol * 0.12, delay, true);
  },
  /* a noble horn: saw + soft square through a swelling lowpass */
  horn(f, dur, vol = 0.05, delay = 0, pan = 0) {
    const ac = this.ac;
    if (!ac || !this.on || !this.master) return;
    const t = ac.currentTime + delay;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(560, t);
    lp.frequency.linearRampToValueAtTime(1350, t + Math.min(0.5, dur * 0.5));
    lp.frequency.linearRampToValueAtTime(760, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.14);
    g.gain.setValueAtTime(vol, t + Math.max(0.15, dur - 0.2));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    lp.connect(g);
    let tail = g;
    if (ac.createStereoPanner) {
      const pn = ac.createStereoPanner();
      pn.pan.value = pan;
      g.connect(pn);
      tail = pn;
    }
    tail.connect(this.master);
    for (const [type, det] of [['sawtooth', -4], ['square', 3]]) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      o.detune.setValueAtTime(det, t);
      o.connect(lp);
      o.start(t); o.stop(t + dur + 0.05);
    }
  },
  /* bells, harp run and horns for the wedding */
  weddingSting() {
    const run = [69, 72, 76, 79, 81, 84];
    run.forEach((m, i) => this.pluck(this.freq(m), 1.4, 0.22, i * 0.09, 0.3));
    const triad = [[64, 0], [67, 0.5], [72, 1.0], [76, 1.5]];
    for (const [m, d] of triad) {
      this.horn(this.freq(m), 1.6, 0.055, d, -0.2);
      this.voice(this.freq(m + 12), 2.2, { type: 'sine', vol: 0.045, delay: d + 0.1, attack: 0.01 });
    }
    this.kick(0, true); this.kick(1.0, true);
    for (let i = 0; i < 3; i++) this.pluck(this.freq(88), 2.4, 0.12, 1.6 + i * 0.5, 0);
  },
  /* warm strings: detuned saws through a gentle lowpass, spread in stereo */
  pad(f, dur, delay = 0, pan = 0) {
    const ac = this.ac;
    if (!ac || !this.on || !this.master) return;
    const t = ac.currentTime + delay;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 850;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    lp.connect(g);
    let tail = g;
    if (ac.createStereoPanner) {
      const pn = ac.createStereoPanner();
      pn.pan.value = pan;
      g.connect(pn);
      tail = pn;
    }
    tail.connect(this.master);
    for (const det of [-6, 5]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o.detune.setValueAtTime(det, t);
      o.connect(lp);
      o.start(t); o.stop(t + dur + 0.05);
    }
  },
  tap() { this.voice(660, 0.06, { type: 'triangle', vol: 0.07 }); },
  coin() { this.voice(880, 0.07, { type: 'square', vol: 0.06 }); this.voice(1320, 0.12, { type: 'square', vol: 0.06, delay: 0.07 }); },
  clash() { this.noise(0.16, 0.22); this.voice(220, 0.12, { type: 'sawtooth', vol: 0.09, slide: -120 }); },
  thud() { this.noise(0.3, 0.28, 0, true); this.voice(70, 0.25, { type: 'sine', vol: 0.22, slide: -30 }); },
  crack() { this.noise(0.4, 0.32, 0, true); this.noise(0.15, 0.28); },
  whoosh() { this.noise(0.25, 0.09, 0, true); },
  fanfare() {
    // brass-like triad rising to the octave — voiced in thirds for majesty
    const seq = [[64, 0], [64, 0.13], [64, 0.26], [67, 0.42], [72, 0.62], [76, 0.86]];
    for (const [m, d] of seq) {
      this.voice(this.freq(m), 0.4, { type: 'sawtooth', vol: 0.05, delay: d, attack: 0.02 });
      this.voice(this.freq(m), 0.4, { type: 'square', vol: 0.035, delay: d, detune: 6 });
      this.voice(this.freq(m - 12), 0.4, { type: 'triangle', vol: 0.06, delay: d });
    }
    this.kick(0, true); this.kick(0.42, true); this.kick(0.86, true);
  },
  dirge() {
    const seq = [[57, 0], [55, 0.45], [53, 0.9], [52, 1.4]];
    for (const [m, d] of seq) {
      this.voice(this.freq(m), 0.6, { type: 'triangle', vol: 0.09, delay: d, attack: 0.04 });
      this.voice(this.freq(m - 12), 0.7, { type: 'sine', vol: 0.06, delay: d });
    }
    this.kick(0, false); this.kick(0.9, false);
  },
  update() {
    if (!this.ac || !this.on || !this.master) return;
    // real recorded tracks take over whenever the player has provided them
    if (this.streams) {
      let usingStream = false;
      for (const name of ['court', 'war']) {
        const st = this.streams[name];
        if (!st || !st.ready || !st.el) continue;
        usingStream = true;
        const active = this.musicOn && this.theme === name;
        const target = active ? 0.55 : 0;
        st.el.volume += (target - st.el.volume) * 0.06;
        if (active && st.el.paused) st.el.play().catch(() => {});
        if (!active && st.el.volume < 0.01 && !st.el.paused) st.el.pause();
      }
      if (usingStream) return;
    }
    if (!this.musicOn || this.theme === 'none') return;
    const war = this.theme === 'war';
    const beat = war ? 0.44 : 0.5, bar = beat * 4;
    while (this.nextBar < this.ac.currentTime + 0.7) {
      const delay = Math.max(0, this.nextBar - this.ac.currentTime);
      // court: A A B A across 8-bar sections; war: its own grim loop
      let b;
      if (war) {
        b = this.progWar[this.barI % this.progWar.length];
      } else {
        const section = Math.floor(this.barI / 8) % 4;
        const prog = section === 2 ? this.progB : this.progA;
        b = prog[this.barI % 8];
      }
      // plucked bass with a round sub underneath
      this.pluck(this.freq(b.root - 12), 1.6, 0.34, delay, -0.15);
      this.voice(this.freq(b.root - 24), beat * 1.9, { type: 'sine', vol: 0.06, attack: 0.03, delay });
      this.pluck(this.freq(b.root - (war ? 12 : 5)), 1.4, 0.22, delay + beat * 2, -0.15);
      // string pad carrying the chord, spread across the stage
      b.chord.forEach((m, i) => {
        this.pad(this.freq(m), bar * 1.02, delay, [-0.45, 0.1, 0.45][i % 3]);
      });
      // horns crown the harmony where the score calls for them
      if (b.horns) {
        this.horn(this.freq(b.chord[0] - 12), bar * 0.96, war ? 0.055 : 0.045, delay, -0.25);
        this.horn(this.freq(b.chord[2] - 12), bar * 0.96, war ? 0.045 : 0.035, delay + 0.03, 0.25);
      }
      // lute arpeggio dancing over the chord (the court's grace note)
      if (!war) {
        const arp = [0, 1, 2, 1];
        for (let i = 0; i < 4; i++) {
          this.pluck(this.freq(b.chord[arp[i]] + 12), 0.8, i === 0 ? 0.16 : 0.11, delay + i * beat, 0.35);
        }
      } else {
        // war: an insistent ostinato on the root
        for (let i = 0; i < 8; i++) {
          this.pluck(this.freq(b.root), 0.4, i % 2 ? 0.1 : 0.16, delay + i * beat * 0.5, 0.2);
        }
      }
      // the flute sings the melody, a lute doubling each phrase's attack
      let mt = delay;
      for (const [m, beats] of b.mel) {
        const d2 = beats * beat * 0.95;
        this.flute(this.freq(m), d2, war ? 0.045 : 0.055, mt);
        this.pluck(this.freq(m), Math.min(1.1, d2), 0.1, mt, 0.2);
        mt += beats * beat;
      }
      // drums: stately at court, doubled and heavy at war
      this.kick(delay, true);
      this.kick(delay + beat * 2, war);
      if (b.drums >= 2) {
        this.kick(delay + beat * 1.5, false);
        this.kick(delay + beat * 3, true);
        this.noise(0.05, 0.04, delay + beat, false);
        this.noise(0.05, 0.05, delay + beat * 3.5, false);
      }
      this.nextBar += bar;
      this.barI++;
    }
  },
};

/* ---------------- particles ---------------- */
const parts = [];
function spawn(x, y, o = {}) {
  parts.push({
    x, y,
    vx: o.vx !== undefined ? o.vx : rnd(-60, 60),
    vy: o.vy !== undefined ? o.vy : rnd(-90, -20),
    g: o.g !== undefined ? o.g : 220,
    life: o.life || rnd(0.4, 0.9),
    t: 0,
    size: o.size || rnd(2, 5),
    color: o.color || '#caa',
    shrink: o.shrink !== undefined ? o.shrink : true,
  });
}
function burst(x, y, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), sp = rnd(o.spMin || 30, o.spMax || 180);
    spawn(x, y, Object.assign({}, o, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 40) }));
  }
}
function updParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}
function drawParts() {
  for (const p of parts) {
    const k = 1 - p.t / p.life;
    ctx.globalAlpha = k;
    ctx.fillStyle = p.color;
    const s = p.shrink ? p.size * k : p.size;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

/* ---------------- toasts ---------------- */
const toasts = [];
function toast(msg, color = '#f0e6d2') { toasts.push({ msg, color, t: 0 }); }
function drawToasts(dt) {
  while (toasts.length > 4) toasts.shift();
  let y = 150;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const t = toasts[i];
    t.t += dt;
    if (t.t > 3.6) { toasts.splice(i, 1); continue; }
  }
  for (const t of toasts) {
    const a = t.t < 0.25 ? t.t / 0.25 : t.t > 3 ? clamp(1 - (t.t - 3) / 0.6, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = a * 0.92;
    ctx.font = `bold 24px ${FONT}`;
    const w = ctx.measureText(t.msg).width + 50;
    roundRect(W / 2 - w / 2, y, w, 44, 12);
    ctx.fillStyle = '#1c1410';
    ctx.fill();
    ctx.strokeStyle = '#c9a44a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = a;
    text(t.msg, W / 2, y + 23, 24, t.color, 'center', true);
    ctx.restore();
    y += 54;
  }
}

/* ---------------- modal ---------------- */
const Modal = {
  active: null,
  show(o) {
    // o: {title, lines: string|string[], buttons:[{label,fn,color}], icon?, w?}
    o.w = o.w || 560;
    o.t = 0;
    if (typeof o.lines === 'string') o.lines = [o.lines];
    o.lines = o.lines || [];
    this.active = o;
    Sfx.tap();
  },
  close() { this.active = null; },
  layout(o) {
    const wrapped = [];
    for (const ln of o.lines) for (const w of wrapLines(ln, 26, o.w - 80)) wrapped.push(w);
    const btnRows = o.buttons.length;
    const h = 110 + wrapped.length * 34 + btnRows * 74 + 20 + (o.icon ? 60 : 0);
    return { wrapped, h, x: W / 2 - o.w / 2, y: H / 2 - h / 2 };
  },
  render(dt) {
    const o = this.active;
    if (!o) return;
    o.t += dt;
    const k = easeOut(clamp(o.t / 0.18, 0, 1));
    ctx.fillStyle = `rgba(5,5,10,${0.6 * k})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(k, k);
    ctx.translate(-W / 2, -H / 2);
    const { wrapped, h, x, y } = this.layout(o);
    panel(x, y, o.w, h);
    let cy = y + 56;
    if (o.icon) { o.icon(W / 2, cy + 10); cy += 60; }
    titleText(o.title, W / 2, cy, 34);
    cy += 50;
    for (const ln of wrapped) { text(ln, W / 2, cy, 26, '#ead9b8'); cy += 34; }
    cy += 10;
    o._btns = [];
    for (const b of o.buttons) {
      const bb = makeBtn(x + 40, cy, o.w - 80, 60, b.label, b.fn, { color: b.color || '#5a3d22' });
      o._btns.push(bb);
      drawBtn(bb);
      cy += 74;
    }
    ctx.restore();
  },
  tap(x, y) {
    const o = this.active;
    if (!o || !o._btns) return;
    const b = btnAt(o._btns, x, y);
    if (b) {
      Sfx.tap();
      this.close();
      if (b.fn) b.fn();
    }
  },
};

/* ---------------- scene & loop ---------------- */
let scene = null, gTime = 0, shake = 0;
let timeScale = 1, slowMoT = 0;
let figSheen = 0.16;   // how strongly baked figures catch the scene light
/* adaptive quality: after a few seconds, drop the costliest cosmetic layer
   (film grain) if this renderer can't hold a healthy frame rate */
let grainOn = true, _fxT = 0, _fxN = 0, _fxLocked = false;
function slowMo(scale, dur) { timeScale = scale; slowMoT = dur; }
function setScene(s, ...args) {
  if (scene && scene.exit) scene.exit();
  scene = s;
  if (s.enter) s.enter(...args);
}
let lastTs = 0;
function frame(ts) {
  const rawDt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  if (slowMoT > 0) { slowMoT -= rawDt; if (slowMoT <= 0) timeScale = 1; }
  if (!_fxLocked && gTime > 2 && rawDt > 0) {
    _fxT += rawDt; _fxN++;
    if (_fxN >= 120) {
      _fxLocked = true;
      if (_fxN / _fxT < 44) grainOn = false;
    }
  }
  const dt = rawDt * timeScale;
  gTime += dt;
  Sfx.update();
  if (scene && scene.update) scene.update(dt);
  ctx.setTransform(drawScale, 0, 0, drawScale, 0, 0);
  ctx.save();
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 30);
    ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
  }
  ctx.fillStyle = '#10131c';
  ctx.fillRect(-20, -20, W + 40, H + 40);
  if (scene && scene.render) scene.render(dt);
  updParts(dt);
  drawParts();
  ctx.restore();
  drawGrade();
  Modal.render(dt);
  drawToasts(dt);
  requestAnimationFrame(frame);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = W * s + 'px';
  canvas.style.height = H * s + 'px';
  canvas.width = Math.max(1, Math.round(W * s * dpr));
  canvas.height = Math.max(1, Math.round(H * s * dpr));
  drawScale = canvas.width / W;
}

/* ---------------- cinematic helpers ---------------- */
const _vigCache = {};
function vignette(strength = 0.4) {
  // building a radial gradient every frame is costly; bake once per strength
  const key = strength.toFixed(2);
  let c = _vigCache[key];
  if (!c) {
    c = document.createElement('canvas');
    c.width = W / 2; c.height = H / 2;
    const vc = c.getContext('2d');
    const g = vc.createRadialGradient(W / 4, H / 4, H * 0.15, W / 4, H / 4, H * 0.37);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(8,6,14,${strength})`);
    vc.fillStyle = g;
    vc.fillRect(0, 0, c.width, c.height);
    _vigCache[key] = c;
  }
  ctx.drawImage(c, 0, 0, W, H);
}
function letterbox(k) {
  if (k <= 0) return;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, 92 * k);
  ctx.fillRect(0, H - 92 * k, W, 92 * k);
}

/* full-frame colour grade + animated film grain.
   alpha is baked into the layers so each is ONE plain source-over blit —
   'overlay' compositing at full screen is far too slow in software rendering */
let _gradeCv = null, _grainCv = null;
const GRAIN_W = 840, GRAIN_H = 1400;
function drawGrade() {
  if (!_gradeCv) {
    _gradeCv = document.createElement('canvas');
    _gradeCv.width = 180; _gradeCv.height = 320;
    const gc = _gradeCv.getContext('2d');
    // warm key light upper-left fading to nothing mid-frame...
    let g = gc.createRadialGradient(30, 60, 10, 30, 60, 300);
    g.addColorStop(0, 'rgba(255,196,120,0.14)');
    g.addColorStop(1, 'rgba(255,196,120,0)');
    gc.fillStyle = g;
    gc.fillRect(0, 0, 180, 320);
    // ...and a cool shade pooling lower-right
    g = gc.createRadialGradient(160, 280, 10, 160, 280, 320);
    g.addColorStop(0, 'rgba(52,66,120,0.15)');
    g.addColorStop(1, 'rgba(52,66,120,0)');
    gc.fillStyle = g;
    gc.fillRect(0, 0, 180, 320);
  }
  if (!_grainCv) {
    _grainCv = document.createElement('canvas');
    _grainCv.width = GRAIN_W; _grainCv.height = GRAIN_H;
    const gx = _grainCv.getContext('2d');
    const img = gx.createImageData(GRAIN_W, GRAIN_H);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random();
      const light = v > 0.5;
      const c = light ? 255 : 0;
      img.data[i] = c; img.data[i + 1] = c; img.data[i + 2] = c;
      img.data[i + 3] = Math.abs(v - 0.5) * 26;   // subtle, pre-baked alpha
    }
    gx.putImageData(img, 0, 0);
  }
  ctx.drawImage(_gradeCv, 0, 0, W, H);
  if (grainOn) {
    const jx = -(gTime * 61 % (GRAIN_W - W)), jy = -(gTime * 47 % (GRAIN_H - H));
    ctx.drawImage(_grainCv, jx, jy);
  }
}
function sunRays(x, y, r, color, alpha, n = 10, speed = 0.05) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(gTime * speed);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    ctx.rotate(TAU / n);
    ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(gTime * 0.8 + i * 1.7));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r, -r * 0.055);
    ctx.lineTo(r, r * 0.055);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function glow(x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function initEngine() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', resize);
  resize();
  bindInput();
}
