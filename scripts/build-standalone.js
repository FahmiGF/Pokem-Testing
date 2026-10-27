import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function build() {
  console.log('Building standalone single-file bundle...');

  // 1. Bundle TypeScript to single IIFE JS
  const result = await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/main.ts')],
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
  });

  const bundledJs = result.outputFiles[0].text;
  const css = fs.readFileSync(path.join(rootDir, 'src/style.css'), 'utf-8');

  // 2. Generate play.html & dist/index.html (fully self-contained, 0 dependencies)
  const templateHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Pokémon 2D Web Adventure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
  <div id="app">
    <!-- Header Controls -->
    <header class="game-header">
      <div class="brand">
        <span class="pokeball-icon"></span>
        <h1>POKÉMON 2D WEB</h1>
      </div>
      <div class="header-actions">
        <button id="btn-sound" class="btn-retro" title="Toggle Sound (M)">🔊 AUDIO ON</button>
        <button id="btn-fullscreen" class="btn-retro" title="Toggle Fullscreen">⛶ FULL</button>
      </div>
    </header>

    <!-- Main Game Container -->
    <main class="console-body">
      <div class="screen-frame">
        <div class="screen-glare"></div>
        <canvas id="game-canvas" width="320" height="240"></canvas>
      </div>

      <!-- Controls & Quick Guide -->
      <div class="controls-container">
        <!-- Virtual D-PAD -->
        <div class="dpad" id="dpad">
          <button class="dpad-btn up" data-key="up" aria-label="Up">▲</button>
          <div class="dpad-middle">
            <button class="dpad-btn left" data-key="left" aria-label="Left">◀</button>
            <div class="dpad-center"></div>
            <button class="dpad-btn right" data-key="right" aria-label="Right">▶</button>
          </div>
          <button class="dpad-btn down" data-key="down" aria-label="Down">▼</button>
        </div>

        <!-- System / Help Info -->
        <div class="instructions-panel">
          <h3>🎮 KONTROL:</h3>
          <p><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> : Gerak / Navigasi</p>
          <p><kbd>Z</kbd> / <kbd>Space</kbd> : [A] Aksi / Pilih / Bicara</p>
          <p><kbd>X</kbd> : [B] Batal | <kbd>Shift</kbd> : Lari Cepat</p>
          <p><kbd>Enter</kbd> / <kbd>Esc</kbd> : [START] Menu / Pokédex / Save</p>
        </div>

        <!-- Action Buttons (A, B) & Start -->
        <div class="action-column">
          <div class="action-buttons">
            <div class="btn-group">
              <button class="round-btn btn-b" data-key="b" aria-label="B Button">B</button>
              <span class="btn-label">Batal (X)</span>
            </div>
            <div class="btn-group">
              <button class="round-btn btn-a" data-key="a" aria-label="A Button">A</button>
              <span class="btn-label">Pilih (Z)</span>
            </div>
          </div>
          <div class="system-buttons">
            <button class="pill-btn round-btn" data-key="start" aria-label="Start Button">START</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="game-footer">
      <p>Dibuat dengan HTML5 Canvas, Web Audio API & TypeScript • Berjalan 100% di browser</p>
    </footer>
  </div>

  <script>
${bundledJs}
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(rootDir, 'play.html'), templateHtml, 'utf-8');

  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'standalone-bundle.js'), bundledJs, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'index.html'), templateHtml, 'utf-8');
  }

  console.log('✓ Successfully generated standalone play.html and dist/index.html!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
