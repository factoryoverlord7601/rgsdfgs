# Dungeon Forge

A tiny, polished 2D top-down procedural dungeon crawler built with HTML5 Canvas and vanilla ES modules — no build required.

Features
- BSP room-and-corridor procedural generation with seed support.
- Smooth player movement (WASD / arrow keys), touch D-pad for mobile.
- Enemies with simple AI, health, and melee combat.
- Items (healing), HUD, minimap, and fog-of-war lighting.
- All visuals generated in code (no external assets).
- Small procedural sound effects via WebAudio.
- Static-files friendly — drop onto any static host (GitHub Pages, Netlify, etc.) to release.

How to run locally
1. Clone or download the files.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
   - For local development it's recommended to use a simple static server if the browser blocks modules from file:// (example for Node.js):
     - `npx serve .` or `python -m http.server 8000`
3. Play: Arrow keys / WASD to move, Space to attack. On mobile, use the on-screen D-pad.

Release
- This is static and ready to publish: upload all files to a static host or a GitHub Pages branch.
- Optionally run a bundler/minifier (esbuild, rollup) to produce a single minified JS file for distribution.

License
MIT — See LICENSE file.

Enjoy and iterate — add new monsters, items, and systems to turn it into a full game!