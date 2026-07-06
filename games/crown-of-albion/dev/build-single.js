'use strict';
/* Bundle the game into a single self-contained HTML file with no external
   references, so it can be opened directly on a phone or hosted anywhere.
   Run with:  node dev/build-single.js  (from games/crown-of-albion/) */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const core = fs.readFileSync(path.join(root, 'js/core.js'), 'utf8');
const world = fs.readFileSync(path.join(root, 'js/world.js'), 'utf8');
const scenes = fs.readFileSync(path.join(root, 'js/scenes.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#10131c">
<title>Crown of Albion — A Medieval Saga of Conquest</title>
<style>
${css}
</style>
</head>
<body>
<canvas id="game" width="720" height="1280"></canvas>
<script>
${core}
</script>
<script>
${world}
</script>
<script>
${scenes}
</script>
</body>
</html>
`;

const out = path.join(root, 'crown-of-albion.html');
fs.writeFileSync(out, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Wrote ${path.relative(process.cwd(), out)} (${kb} KB, fully self-contained)`);
