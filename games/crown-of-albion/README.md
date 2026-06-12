# Crown of Albion

*A medieval saga of conquest* — an original, mobile-first HTML5 strategy game in the
spirit of the classic 8/16-bit "conquer the realm" genre: rule a province, raise
armies, win tournaments, lay siege to castles, and claim the crown.

Everything in the game — the art, the names, the music — is original and generated
in code at runtime. There are no external assets, no build step, and no dependencies.

![Title](dev/shot-title.png)

## How to play

Open `index.html` in any modern browser, or serve the folder:

```bash
cd games/crown-of-albion
python3 -m http.server 8080
# then visit http://localhost:8080 (works great on a phone on the same network)
```

The game is portrait-oriented and touch-first (mouse works too), with autosave —
close the tab and pick up where you left off via **Continue**.

## The goal

The king of Albion is dead. Twelve provinces lie in dispute between you and three
rival lords. **Claim all twelve provinces to win the crown.** Lose all of your
provinces and your house has fallen.

## Each month you can

| Action | What it does |
|---|---|
| **Recruit** | Hire soldiers (8g), knights (25g, worth four soldiers), catapults (50g, needed to breach castle walls). |
| **March** | Tap a bordering enemy or neutral province and attack it. Choose bold, steady, or cautious tactics. |
| **Tournament** | Challenge a rival lord to the joust — wager gold, or (with enough fame) an entire province. |
| **Night Raid** | Sneak into a rival's keep and duel the guard captain for a share of his treasury. Get caught and you'll be ransomed. |
| **Fortify** | Reinforce a garrison or build a castle in any province you own. |

Marching, tournaments, and raids share one action per month; recruiting and
fortifying are always available. Provinces pay taxes every month, and random
events — harvests, bandits, wandering knights, camp fever — keep the realm lively.

## The minigames

- **The Joust** — three passes against a rival lord. As you charge, tap to lock your
  lance on the swinging gauge: the helm scores best but is hardest to strike true.
  Unhorse him for 3 points; shatter your lance for 1.
- **The Siege** — drag back from your catapult, watch the trajectory preview, and
  release. Every wall segment you topple weakens the garrison before your assault
  goes in.
- **The Night Raid** — a torch-lit sword duel of reflexes: swipe the way the arrow
  points to cut, tap to parry, with an ever-shrinking timing window.

![Joust](dev/shot-joust.png)

## Features

- Procedurally generated kingdom map (noise-jittered Voronoi island, repainted
  live as borders change) with animated sea, ships, and waving heraldic banners
- Three playable champions with different strengths, and three difficulty levels
- Three rival AI lords who recruit, expand, besiege, and can be eliminated
- Fame system: renown from tourneys and conquest boosts your leadership in battle
  and unlocks province-stake wagers
- Procedural WebAudio soundtrack and effects (lute-style loop, fanfares, crashes),
  haptic feedback on supported phones, particles and screen shake throughout
- Autosave to `localStorage` after every significant action

## Development

No toolchain required. Two dev scripts (need Node; screenshots need Playwright):

```bash
node dev/smoke.js   # headless logic tests: map gen, battles, AI, save/load, scenes
node dev/shots.js   # drives the real game in headless Chromium and captures screenshots
```

Code layout:

- `js/core.js` — engine: canvas scaling, input (tap/swipe/drag), UI widgets,
  procedural audio, particles, toasts, modals
- `js/world.js` — map generation, game state, economy, battle resolution, AI, saves
- `js/scenes.js` — title, hero select, kingdom map, battle, joust, siege, raid, endings
