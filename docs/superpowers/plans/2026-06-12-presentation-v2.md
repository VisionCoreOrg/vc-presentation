# VisionCore Presentation v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a keyboard-driven, dark "command center" slide-deck (8 slides) in pure HTML/CSS/JS for the VisionCore LPR thesis defense, culminating in the animated data-pipeline slide.

**Architecture:** Single-page deck of 8 `<section class="slide">` elements; exactly one is `.active` at a time. `app.js` owns a small state object: current slide index + the slide-5 pipeline animation state machine. Slide 5 has internal sub-states (9 manual steps) that block forward deck navigation until complete. Animation uses a single glowing particle moved between absolutely-positioned nodes via `getBoundingClientRect` + CSS transitions; the node holding the data glows.

**Tech Stack:** Plain HTML5 + CSS3 (custom properties, transitions, keyframes) + vanilla JS (no frameworks, no modules — plain `<script>` so it runs from `file://`). Self-hosted variable fonts (Space Grotesk, JetBrains Mono).

**Verification model:** This is a static visual deck — there is no unit-test harness (the no-frameworks/offline constraint rules one out, and forcing one violates YAGNI). Each task is verified by opening `index.html` in a browser and confirming specific, observable behavior. Treat the "Verify" steps as the test: if the observed behavior doesn't match, the task is not done.

**Files (final layout at `vc-presentation/` root):**
- `index.html` — the 8 slide sections + shared chrome (section label, progress)
- `style.css` — design tokens, base layout, per-slide styles, animations
- `app.js` — keyboard navigation + slide-5 pipeline state machine
- `fonts/` — self-hosted `.woff2` (SpaceGrotesk variable, JetBrainsMono variable)
- `roteiro-animacao.md` — already present (reference, untouched)

The old v1 files (`apresenta_o_interativa_visioncore.html`, `script.js`, `style.css`) are already deleted from the working tree; Task 1 finalizes that and creates the v2 scaffold.

**Design tokens (use everywhere — never hardcode hex):**
```
--bg:        #1D2938;  /* graphite base */
--surface:   #2A616E;  /* cards, service blocks */
--accent:    #13B37E;  /* primary accent */
--neon:      #07EF5C;  /* particle, active glow, progress */
--text:      #EAF2F0;  /* body text (high contrast for projector) */
--text-dim:  #9DB4B0;  /* secondary text — still legible, never tiny+gray */
```

---

## Task 1: Scaffold the deck (8 blank slides + keyboard nav)

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`
- Delete (finalize): `apresenta_o_interativa_visioncore.html`, `script.js` (root v1 — already `D` in git status)

- [ ] **Step 1: Create `index.html`** with 8 empty slides and shared chrome.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>VisionCore — Apresentação</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main id="deck">
    <section class="slide" id="s1" data-label="00 · VISIONCORE"></section>
    <section class="slide" id="s2" data-label="01 · O PROBLEMA"></section>
    <section class="slide" id="s3" data-label="02 · A SOLUÇÃO"></section>
    <section class="slide" id="s4" data-label="03 · ARQUITETURA"></section>
    <section class="slide" id="s5" data-label="03 · PIPELINE"></section>
    <section class="slide" id="s6" data-label="04 · DEMO AO VIVO"></section>
    <section class="slide" id="s7" data-label="05 · PRÓXIMOS PASSOS"></section>
    <section class="slide" id="s8" data-label="VISIONCORE"></section>
  </main>

  <div id="section-label"></div>
  <div id="progress"></div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`** with tokens, reset, and the deck/slide base.

```css
:root {
  --bg: #1D2938; --surface: #2A616E; --accent: #13B37E;
  --neon: #07EF5C; --text: #EAF2F0; --text-dim: #9DB4B0;
  --slide-pad: 6vmin;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; background: var(--bg); color: var(--text); }
body { font-family: system-ui, sans-serif; }  /* replaced with Space Grotesk in Task 2 */

#deck { position: relative; height: 100vh; width: 100vw; }

.slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center;
  padding: var(--slide-pad);
  opacity: 0; visibility: hidden;
  transition: opacity .45s ease;
}
.slide.active { opacity: 1; visibility: visible; }

#section-label {
  position: fixed; top: 4vmin; left: 6vmin;
  font-size: 1.1rem; letter-spacing: .15em; color: var(--text-dim);
}
#progress {
  position: fixed; bottom: 4vmin; right: 6vmin;
  font-size: 1rem; color: var(--text-dim);
}
```

- [ ] **Step 3: Create `app.js`** with slide state + keyboard navigation.

```js
'use strict';

const slides = Array.from(document.querySelectorAll('.slide'));
const sectionLabel = document.getElementById('section-label');
const progress = document.getElementById('progress');

const state = {
  current: 0,
  pipelineComplete: false, // set true by pipeline machine (Task 7) when slide 5 done
};

// Hooks the pipeline machine (Task 7) registers into. No-ops until then.
const hooks = {
  onEnterSlide5() {},
  advancePipeline() {},
  resetPipeline() {},
  isPipelineActive() { return false; }, // true while animating & not yet complete
};
window.VC = { state, hooks };

function render() {
  slides.forEach((s, i) => s.classList.toggle('active', i === state.current));
  sectionLabel.textContent = slides[state.current].dataset.label || '';
  progress.textContent = `${state.current + 1} / ${slides.length}`;
}

function goTo(i) {
  if (i < 0 || i >= slides.length) return;
  state.current = i;
  render();
  if (i === 4) hooks.onEnterSlide5();
}

function next() {
  // Slide 5 (index 4): block forward nav until the pipeline animation completes.
  if (state.current === 4 && !state.pipelineComplete) return;
  goTo(state.current + 1);
}
function prev() { goTo(state.current - 1); }

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault(); next(); break;
    case 'ArrowLeft':
      e.preventDefault(); prev(); break;
    case 'Enter':
    case 'ArrowDown':
      if (state.current === 4) { e.preventDefault(); hooks.advancePipeline(); }
      break;
    case 'Escape':
      if (state.current === 4) { e.preventDefault(); hooks.resetPipeline(); }
      break;
  }
});

render();
```

- [ ] **Step 4: Verify nav in browser.**

Run: open `index.html` in a browser (or `xdg-open index.html`).
Expected:
- Blank dark slides; top-left shows `00 · VISIONCORE`; bottom-right shows `1 / 8`.
- `→` / `Space` advances label + counter up to `8 / 8`; `←` goes back.
- On slide 5 (`5 / 8`, label `03 · PIPELINE`), pressing `→` does **nothing** (blocked — pipeline not implemented yet so `pipelineComplete` stays false). `←` still works. This block is expected and will be released in Task 7.

- [ ] **Step 5: Commit.**

```bash
git add index.html style.css app.js
git rm --cached --ignore-unmatch apresenta_o_interativa_visioncore.html script.js
git add -A
git commit -m "feat: scaffold v2 deck with keyboard navigation"
```

---

## Task 2: Self-hosted fonts + typographic base

**Files:**
- Create: `fonts/SpaceGrotesk.woff2`, `fonts/JetBrainsMono.woff2`
- Modify: `style.css`

- [ ] **Step 1: Download the variable fonts** into `fonts/`.

```bash
mkdir -p fonts
curl -L -o fonts/SpaceGrotesk.woff2 \
  "https://github.com/floriankarsten/space-grotesk/raw/master/fonts/webfonts/SpaceGrotesk%5Bwght%5D.woff2"
curl -L -o fonts/JetBrainsMono.woff2 \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/webfonts/JetBrainsMono%5Bwght%5D.woff2"
```
If a URL 404s, fetch the equivalent variable `.woff2` from the project's GitHub releases and save under the same filename. Verify each file is > 20 KB (not an HTML error page): `ls -la fonts/`.

- [ ] **Step 2: Add `@font-face` + apply** at the top of `style.css` (above `:root`).

```css
@font-face {
  font-family: 'Space Grotesk'; src: url('fonts/SpaceGrotesk.woff2') format('woff2');
  font-weight: 300 700; font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono'; src: url('fonts/JetBrainsMono.woff2') format('woff2');
  font-weight: 400 700; font-display: swap;
}
```
Then add font variables to `:root`:
```css
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
```
And change `body { font-family: ... }` to `font-family: var(--font-sans);`.

- [ ] **Step 3: Add shared type helpers** to `style.css`.

```css
.slide h1 { font-size: clamp(2.5rem, 6vmin, 5rem); font-weight: 600; line-height: 1.05; }
.slide h2 { font-size: clamp(1.8rem, 4vmin, 3rem); font-weight: 600; }
.slide p  { font-size: clamp(1.1rem, 2.2vmin, 1.6rem); color: var(--text); line-height: 1.4; }
.mono { font-family: var(--font-mono); letter-spacing: .02em; }
.kicker { font-family: var(--font-mono); color: var(--neon); letter-spacing: .12em;
          text-transform: uppercase; font-size: 1rem; }
```

- [ ] **Step 4: Verify.** Reload `index.html`. Expected: section label + progress now render in Space Grotesk (rounded geometric look), not the default system font. No layout shift / no missing-font boxes.

- [ ] **Step 5: Commit.**

```bash
git add fonts style.css
git commit -m "feat: add self-hosted fonts and typographic base"
```

---

## Task 3: Slide 1 (Capa) + Slide 8 (Encerramento, mirror)

**Files:**
- Modify: `index.html` (fill `#s1`, `#s8`)
- Modify: `style.css`

- [ ] **Step 1: Fill `#s1` and `#s8`** in `index.html`.

```html
<!-- #s1 -->
<section class="slide cover" id="s1" data-label="00 · VISIONCORE">
  <div class="cover-grid" aria-hidden="true"></div>
  <div class="cover-body">
    <p class="kicker">License Plate Recognition</p>
    <h1 class="wordmark">Vision<span>Core</span></h1>
    <p class="tagline">Estacionamentos inteligentes com visão computacional</p>
  </div>
  <footer class="cover-foot">
    <span>Engenharia de Software · TCC 2026.1</span>
    <span class="mono">VisionCore LPR</span>
  </footer>
</section>

<!-- #s8 -->
<section class="slide cover" id="s8" data-label="VISIONCORE">
  <div class="cover-grid" aria-hidden="true"></div>
  <div class="cover-body">
    <h1 class="wordmark">Vision<span>Core</span></h1>
    <p class="tagline">Obrigado pela atenção.</p>
  </div>
  <footer class="cover-foot">
    <span>Engenharia de Software · TCC 2026.1</span>
    <span class="mono">VisionCore LPR</span>
  </footer>
</section>
```
Integrantes/contatos: leave the footer as-is for now (the group decides later); no placeholder names.

- [ ] **Step 2: Add cover styles** to `style.css`.

```css
.cover { justify-content: center; align-items: flex-start; }
.cover-body { position: relative; z-index: 1; }
.wordmark { letter-spacing: -.02em; }
.wordmark span { color: var(--neon); }
.tagline { font-size: clamp(1.3rem, 2.6vmin, 2rem); color: var(--text-dim); margin-top: 1.5vmin; }
.cover .kicker { margin-bottom: 2vmin; }
.cover-foot {
  position: absolute; bottom: var(--slide-pad); left: var(--slide-pad);
  right: var(--slide-pad); display: flex; justify-content: space-between;
  color: var(--text-dim); font-size: 1rem;
}
/* subtle neon grid backdrop */
.cover-grid {
  position: absolute; inset: 0; opacity: .12;
  background-image:
    linear-gradient(var(--surface) 1px, transparent 1px),
    linear-gradient(90deg, var(--surface) 1px, transparent 1px);
  background-size: 4vmin 4vmin;
  mask-image: radial-gradient(circle at 30% 50%, #000 0%, transparent 70%);
}
```

- [ ] **Step 3: Verify.** Reload. Slide 1: "VisionCore" with "Core" in neon, tagline below, kicker above, footer at bottom, faint grid backdrop. Slide 8 (press through or jump): mirrors slide 1 with "Obrigado pela atenção." Text is large and high-contrast.

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add cover and closing slides"
```

---

## Task 4: Slide 2 (O Problema) with animated counters

**Files:**
- Modify: `index.html` (fill `#s2`)
- Modify: `style.css`
- Modify: `app.js` (counter trigger on slide enter)

- [ ] **Step 1: Fill `#s2`** in `index.html`.

```html
<section class="slide problem" id="s2" data-label="01 · O PROBLEMA">
  <div class="problem-grid">
    <div class="problem-text">
      <p class="kicker">O Problema</p>
      <h1>Pátios privados ainda operam de forma <span class="hl">reativa</span>.</h1>
      <p>Filas nas catracas, fricção na portaria e ausência de dados históricos
         estruturados para auditoria de incidentes.</p>
    </div>
    <div class="problem-stats">
      <div class="stat">
        <div class="stat-num"><span class="count" data-to="60">0</span>%</div>
        <p>dos motoristas enfrentam filas e lentidão na portaria</p>
      </div>
      <div class="stat">
        <div class="stat-num">~<span class="count" data-to="100">0</span>%</div>
        <p>priorizam estabelecimentos com estacionamento inteligente</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add styles** to `style.css`.

```css
.problem-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 8vmin; align-items: center; }
.hl { color: var(--accent); }
.problem-stats { display: flex; flex-direction: column; gap: 5vmin; }
.stat-num { font-family: var(--font-mono); font-weight: 700; font-size: clamp(3rem, 9vmin, 7rem);
            color: var(--neon); line-height: 1; }
.stat p { color: var(--text-dim); margin-top: 1vmin; }
```

- [ ] **Step 3: Add a reusable counter trigger** to `app.js`. Insert this function and wire it into `goTo`.

```js
function runCounters(slideEl) {
  slideEl.querySelectorAll('.count').forEach((el) => {
    const to = parseInt(el.dataset.to, 10);
    const dur = 900;
    const start = performance.now();
    el.textContent = '0';
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = Math.round(to * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
```
In `goTo`, after `render();`, add:
```js
  runCounters(slides[i]);
```
(`runCounters` is a no-op on slides without `.count` elements, so it is safe to call for every slide.)

- [ ] **Step 4: Verify.** Navigate to slide 2. Expected: the two numbers animate from 0 up to **60** and **100** (~0.9 s, easing out) each time you enter the slide. Layout: problem text left, two big neon stats right.

- [ ] **Step 5: Commit.**

```bash
git add index.html style.css app.js
git commit -m "feat: add problem slide with animated counters"
```

---

## Task 5: Slide 3 (A Solução)

**Files:**
- Modify: `index.html` (fill `#s3`)
- Modify: `style.css`

- [ ] **Step 1: Fill `#s3`** in `index.html`.

```html
<section class="slide solution" id="s3" data-label="02 · A SOLUÇÃO">
  <p class="kicker">A Solução</p>
  <h1>VisionCore: LPR de baixo custo sobre a infraestrutura que já existe.</h1>
  <div class="cards-3">
    <div class="card">
      <h2 class="mono">Baixo custo</h2>
      <p>Reaproveita câmeras IP já instaladas no local, sem hardware dedicado.</p>
    </div>
    <div class="card">
      <h2 class="mono">Padrão de rede</h2>
      <p>Integra via protocolos padronizados (RTSP) — vídeo bruto vira entrada do pipeline.</p>
    </div>
    <div class="card">
      <h2 class="mono">Dados estruturados</h2>
      <p>Transforma frames em transações: placa, horário e status de acesso auditáveis.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add card styles** to `style.css` (shared `.card` / `.cards-3`, reused by Task 9).

```css
.cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3vmin; margin-top: 5vmin; }
.card {
  background: var(--surface); border-radius: 1.2vmin; padding: 3.5vmin;
  border: 1px solid rgba(7,239,92,.18);
}
.card h2 { color: var(--neon); font-size: clamp(1.3rem, 2.8vmin, 2rem); margin-bottom: 1.5vmin; }
.card p { color: var(--text); }
.solution h1 { max-width: 24ch; margin-top: 1.5vmin; }
```

- [ ] **Step 3: Verify.** Slide 3: kicker + headline, three surface cards in a row with neon mono titles, readable body text.

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add solution slide"
```

---

## Task 6: Slide 4 (Arquitetura — visão geral)

**Files:**
- Modify: `index.html` (fill `#s4`)
- Modify: `style.css`

- [ ] **Step 1: Fill `#s4`** in `index.html`. Five containerized service blocks.

```html
<section class="slide arch" id="s4" data-label="03 · ARQUITETURA">
  <p class="kicker">Arquitetura</p>
  <h1>Microsserviços containerizados, comunicação assíncrona.</h1>
  <p class="arch-sub">Cada serviço roda isolado em seu container Docker e conversa
     com os demais por mensagens — não por chamadas diretas acopladas.</p>
  <div class="svc-row">
    <div class="svc"><span class="svc-tag mono">borda</span><b>vc-camera-mock</b></div>
    <div class="svc"><span class="svc-tag mono">storage</span><b>MinIO</b></div>
    <div class="svc"><span class="svc-tag mono">fila</span><b>Redis</b></div>
    <div class="svc"><span class="svc-tag mono">IA</span><b>vc-worker-portaria</b></div>
    <div class="svc"><span class="svc-tag mono">api + ui</span><b>vc-api-core</b></div>
  </div>
</section>
```

- [ ] **Step 2: Add styles** to `style.css`.

```css
.arch-sub { color: var(--text-dim); max-width: 60ch; margin-top: 1.5vmin; }
.svc-row { display: flex; gap: 2.5vmin; margin-top: 6vmin; flex-wrap: wrap; }
.svc {
  flex: 1 1 0; min-width: 16ch; background: var(--surface);
  border: 1px solid rgba(7,239,92,.18); border-radius: 1vmin;
  padding: 3vmin 2vmin; display: flex; flex-direction: column; gap: 1.2vmin;
}
.svc-tag { color: var(--neon); font-size: .9rem; letter-spacing: .1em; text-transform: uppercase; }
.svc b { font-size: clamp(1.1rem, 2.2vmin, 1.5rem); }
```

- [ ] **Step 3: Verify.** Slide 4: headline + subtitle, then a row of 5 service blocks each with a neon mono tag and the container name.

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add architecture overview slide"
```

---

## Task 7: Slide 5 (Pipeline animation) — the core

This is the largest task. It is split into 7a–7e, each independently verifiable and committed.

### Task 7a: Structure — external scene + diagram stage + side panel

**Files:**
- Modify: `index.html` (fill `#s5`)
- Modify: `style.css`

- [ ] **Step 1: Fill `#s5`** in `index.html`.

```html
<section class="slide pipeline" id="s5" data-label="03 · PIPELINE">
  <!-- Phase: external scene -->
  <div class="phase scene active" id="phase-scene">
    <div class="road">
      <div class="car" id="car">🚗</div>
      <div class="camera" id="camera"><div class="cone"></div>📷</div>
      <div class="gate" id="gate"></div>
      <div class="badge" id="scene-badge"></div>
    </div>
  </div>

  <!-- Phase: pipeline diagram -->
  <div class="phase diagram" id="phase-diagram">
    <div class="stage" id="stage">
      <div class="node" id="n-cam"       data-name="Camera-mock"     style="left:6%;  top:42%;">📷<span>camera-mock</span></div>
      <div class="node" id="n-minio"     data-name="MinIO"          style="left:32%; top:14%;">🗄️<span>MinIO</span></div>
      <div class="node" id="n-redis"     data-name="Redis"          style="left:32%; top:68%;">📨<span>Redis</span></div>
      <div class="node" id="n-worker"    data-name="Worker-portaria" style="left:58%; top:42%;">🧠<span>worker-portaria</span></div>
      <div class="node" id="n-api"       data-name="API-core"       style="left:80%; top:20%;">⚙️<span>api-core</span></div>
      <div class="node" id="n-dashboard" data-name="Dashboard"      style="left:80%; top:64%;">🖥️<span>Dashboard</span></div>
      <div class="particle" id="particle"></div>
    </div>
    <aside class="side-panel" id="side-panel">
      <div class="sp-op mono" id="sp-op"></div>
      <div class="sp-name" id="sp-name"></div>
      <div class="sp-desc" id="sp-desc"></div>
    </aside>
  </div>
</section>
```

- [ ] **Step 2: Add base styles** for the two phases + nodes + particle to `style.css`.

```css
.pipeline { padding: 0; }
.phase { position: absolute; inset: 0; opacity: 0; visibility: hidden; transition: opacity .5s ease; }
.phase.active { opacity: 1; visibility: visible; }

/* external scene */
.road { position: absolute; inset: 0; display: flex; align-items: center; }
.road::after { content:''; position:absolute; left:0; right:0; top:60%; height:2px; background:var(--surface); }
.car { position: absolute; left: -12%; top: 52%; font-size: 7vmin; transition: left 1s ease; }
.camera { position: absolute; left: 40%; top: 20%; font-size: 6vmin; }
.cone { position: absolute; left: 50%; top: 100%; width: 0; height: 0; opacity: 0;
        border-left: 6vmin solid transparent; border-right: 6vmin solid transparent;
        border-top: 16vmin solid rgba(7,239,92,.18); transform: translateX(-50%);
        transition: opacity .4s ease; }
.gate { position: absolute; left: 62%; top: 46%; width: 14vmin; height: .8vmin;
        background: var(--neon); transform-origin: left center; transition: transform .8s ease; }
.badge { position: absolute; left: 40%; top: 8%; padding: 1.2vmin 2.4vmin; border-radius: 1vmin;
         background: var(--neon); color: var(--bg); font-weight: 700; opacity: 0;
         transition: opacity .3s ease; }

/* diagram */
.stage { position: absolute; inset: 0; right: 32%; }
.node { position: absolute; transform: translate(-50%, -50%);
        display: flex; flex-direction: column; align-items: center; gap: .6vmin;
        font-size: 4.5vmin; background: var(--surface); border: 2px solid transparent;
        border-radius: 1.2vmin; padding: 2vmin 2.5vmin; transition: all .35s ease; opacity: .55; }
.node span { font-family: var(--font-mono); font-size: 1.05rem; color: var(--text); }
.node.lit { opacity: 1; border-color: var(--neon);
            box-shadow: 0 0 3vmin rgba(7,239,92,.55); }
.particle { position: absolute; width: 1.8vmin; height: 1.8vmin; border-radius: 50%;
            background: var(--neon); box-shadow: 0 0 2.5vmin 1vmin rgba(7,239,92,.7);
            opacity: 0; pointer-events: none; transform: translate(-50%, -50%); }

/* side panel */
.side-panel { position: absolute; right: 0; top: 0; bottom: 0; width: 30%;
              padding: 6vmin 4vmin; display: flex; flex-direction: column; justify-content: center;
              gap: 1.5vmin; border-left: 1px solid var(--surface); opacity: 0; transition: opacity .3s; }
.side-panel.show { opacity: 1; }
.sp-op { color: var(--neon); font-size: 1.4rem; letter-spacing: .05em; }
.sp-name { font-size: clamp(1.6rem, 3.2vmin, 2.4rem); font-weight: 600; }
.sp-desc { color: var(--text-dim); font-size: clamp(1.1rem, 2vmin, 1.4rem); }
```

- [ ] **Step 3: Verify.** Navigate to slide 5. Expected: you see the **external scene** (road line, camera, gate bar, car off-screen left). The diagram phase is hidden (`opacity:0`). Nothing animates yet (Task 7d wires it). The forward-nav block from Task 1 is still in effect.

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add pipeline slide structure (scene + diagram + side panel)"
```

### Task 7b: STEPS data + pipeline machine skeleton

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Append the pipeline module** to `app.js` (after the existing code). It registers into the `hooks` object from Task 1.

```js
/* ---------- Slide 5: pipeline state machine ---------- */
(function pipeline() {
  const STEPS = [
    { phase: 'scene',    action: 'carArrives' },
    { phase: 'scene',    action: 'cameraDetects' },
    { phase: 'diagram',  from: 'cam',    to: 'minio',     op: 'S3 PUT',   panel: 'minio' },
    { phase: 'diagram',  from: 'cam',    to: 'redis',     op: 'LPUSH',    panel: 'redis' },
    { phase: 'diagram',  from: 'redis',  to: 'worker',    op: 'BLPOP',    panel: 'worker' },
    { phase: 'diagram',  from: 'worker', to: 'minio',     op: 'S3 GET',   panel: 'minio' },
    { phase: 'diagram',  from: 'worker', to: 'api',       op: 'HTTP POST',panel: 'api' },
    { phase: 'diagram',  from: 'api',    to: 'dashboard', op: 'HTTP GET', panel: 'dashboard' },
    { phase: 'conclusao',action: 'gateOpens' },
  ];

  const PANELS = {
    minio:     { name: 'MinIO',            desc: 'Guarda a imagem (object storage).' },
    redis:     { name: 'Redis',            desc: 'Fila de eventos entre os serviços.' },
    worker:    { name: 'Worker-portaria',  desc: 'Detecta a placa com IA e lê o texto.' },
    api:       { name: 'API-core',         desc: 'Registra a transação.' },
    dashboard: { name: 'Dashboard',        desc: 'Operador vê em tempo real.' },
  };

  const NODE_EL = {
    cam: 'n-cam', minio: 'n-minio', redis: 'n-redis',
    worker: 'n-worker', api: 'n-api', dashboard: 'n-dashboard',
  };

  let idx = -1;       // -1 = not started; 0..STEPS.length-1 = step done
  let busy = false;   // true while a particle/transition is mid-flight

  const $ = (id) => document.getElementById(id);

  function reset() { /* filled in Task 7d */ }
  function advance() { /* filled in Task 7d */ }

  // Wire into the global hooks (replaces the no-ops from Task 1)
  window.VC.hooks.onEnterSlide5 = () => { if (idx === -1) reset(); };
  window.VC.hooks.advancePipeline = advance;
  window.VC.hooks.resetPipeline = reset;
  window.VC.hooks.isPipelineActive = () => idx > -1 && idx < STEPS.length - 1;

  // expose for the next sub-tasks
  window.VC._pipeline = { STEPS, PANELS, NODE_EL, $, get idx(){return idx;}, set idx(v){idx=v;},
                          get busy(){return busy;}, set busy(v){busy=v;} };
})();
```

- [ ] **Step 2: Verify.** Reload, go to slide 5, open the console. Run `window.VC._pipeline.STEPS.length` → expect `9`. No errors on load. (Behavior unchanged visually — `reset`/`advance` are still empty.)

- [ ] **Step 3: Commit.**

```bash
git add app.js
git commit -m "feat: add pipeline STEPS data and machine skeleton"
```

### Task 7c: Phase switching + reset

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Implement `reset()` and a `setPhase()` helper** inside the `pipeline` IIFE (replace the empty `reset`).

```js
  function setPhase(name) {
    ['phase-scene','phase-diagram'].forEach((id) => {
      const el = $(id);
      if (id === 'phase-diagram') el.classList.toggle('active', name === 'diagram');
      else el.classList.toggle('active', name !== 'diagram'); // scene shows for scene+conclusao
    });
  }

  function clearNodes() {
    Object.values(NODE_EL).forEach((id) => $(id).classList.remove('lit'));
  }

  function reset() {
    idx = -1; busy = false;
    setPhase('scene');
    clearNodes();
    $('particle').style.opacity = '0';
    $('side-panel').classList.remove('show');
    $('car').style.left = '-12%';
    $('camera').querySelector('.cone').style.opacity = '0';
    $('scene-badge').style.opacity = '0';
    $('gate').style.transform = 'rotate(0deg)';
    window.VC.state.pipelineComplete = false;
  }
```

- [ ] **Step 2: Verify.** Reload, go to slide 5 (triggers `onEnterSlide5` → `reset`). Press `Esc`: scene resets cleanly (car off-screen, gate flat, no badge). Switching to a later slide is still blocked. In console, `window.VC.state.pipelineComplete` → `false`.

- [ ] **Step 3: Commit.**

```bash
git add app.js
git commit -m "feat: implement pipeline phase switching and reset"
```

### Task 7d: `advance()` — scene steps, particle travel, conclusion

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Implement `advance()`** inside the `pipeline` IIFE (replace the empty `advance`). Add a `moveParticle` helper.

```js
  function showPanel(key, op) {
    const p = PANELS[key];
    $('sp-op').textContent = op;
    $('sp-name').textContent = p.name;
    $('sp-desc').textContent = p.desc;
    $('side-panel').classList.add('show');
  }

  function centerOf(nodeId) {
    const stage = $('stage').getBoundingClientRect();
    const r = $(NODE_EL[ /^n-/.test(nodeId) ? nodeId.slice(2) : nodeId ] || nodeId).getBoundingClientRect();
    return { x: r.left + r.width/2 - stage.left, y: r.top + r.height/2 - stage.top };
  }

  function moveParticle(from, to, onArrive) {
    const a = centerOf(from), b = centerOf(to);
    const particle = $('particle');
    busy = true;
    // place at source instantly
    particle.style.transition = 'none';
    particle.style.left = a.x + 'px'; particle.style.top = a.y + 'px'; particle.style.opacity = '1';
    void particle.offsetWidth; // force reflow
    // travel to destination
    particle.style.transition = 'left .7s ease, top .7s ease';
    particle.style.left = b.x + 'px'; particle.style.top = b.y + 'px';
    const done = () => {
      particle.removeEventListener('transitionend', done);
      $(NODE_EL[to]).classList.add('lit');
      busy = false;
      onArrive && onArrive();
    };
    particle.addEventListener('transitionend', done);
  }

  function advance() {
    if (busy) return;                       // ignore input mid-flight
    if (idx >= STEPS.length - 1) return;     // already finished
    idx += 1;
    const step = STEPS[idx];

    if (step.phase === 'scene') {
      setPhase('scene');
      if (step.action === 'carArrives') {
        $('car').style.left = '46%';
      } else if (step.action === 'cameraDetects') {
        $('camera').querySelector('.cone').style.opacity = '1';
        const b = $('scene-badge'); b.textContent = 'PLACA DETECTADA'; b.style.opacity = '1';
      }
    } else if (step.phase === 'diagram') {
      setPhase('diagram');
      if (idx > 0 && STEPS[idx-1].phase !== 'diagram') clearNodes(); // entering diagram: clean slate
      $(NODE_EL[step.from]).classList.add('lit');
      moveParticle(step.from, step.to, () => {
        $(NODE_EL[step.from]).classList.remove('lit'); // origin dims; destination stays lit
        showPanel(step.panel, step.op);
      });
    } else if (step.phase === 'conclusao') {
      setPhase('scene');
      $('particle').style.opacity = '0';
      $('side-panel').classList.remove('show');
      $('gate').style.transform = 'rotate(-72deg)';
      const b = $('scene-badge'); b.textContent = 'ACESSO LIBERADO ✓'; b.style.opacity = '1';
      $('car').style.left = '120%';
      window.VC.state.pipelineComplete = true; // releases forward deck nav
    }
  }
```

Note on `centerOf`: nodes are keyed by short name (`cam`, `minio`, ...) via `NODE_EL`; the helper accepts those keys. Simplify by replacing the function body with the direct form below to avoid the regex (clearer):
```js
  function centerOf(key) {
    const stage = $('stage').getBoundingClientRect();
    const r = $(NODE_EL[key]).getBoundingClientRect();
    return { x: r.left + r.width/2 - stage.left, y: r.top + r.height/2 - stage.top };
  }
```
Use this simpler `centerOf` (delete the earlier regex version).

- [ ] **Step 2: Verify the full 9-step sequence** in browser on slide 5:
  1. `Enter` → car drives in from left, stops mid-road.
  2. `Enter` → camera cone lights, "PLACA DETECTADA" badge appears.
  3. `Enter` → crossfade to diagram; cam node lit; particle flies cam→MinIO; MinIO lights, cam dims; side panel shows `S3 PUT` / MinIO.
  4. `Enter` → particle cam→Redis; panel `LPUSH` / Redis.
  5. `Enter` → Redis→Worker; `BLPOP` / Worker.
  6. `Enter` → Worker→MinIO; `S3 GET` / MinIO.
  7. `Enter` → Worker→API; `HTTP POST` / API-core.
  8. `Enter` → API→Dashboard; `HTTP GET` / Dashboard.
  9. `Enter` → crossfade back to scene; gate lifts; "ACESSO LIBERADO ✓"; car exits right.
  - Pressing `Enter` rapidly mid-flight does nothing (the `busy` guard). `Esc` resets to step 0 at any point.

- [ ] **Step 3: Verify forward-nav release.** After step 9, press `→`: deck advances to slide 6 (`6 / 8`). Before step 9, `→` is blocked. Press `←` to return to slide 4 anytime.

- [ ] **Step 4: Commit.**

```bash
git add app.js
git commit -m "feat: implement pipeline animation (scene, particle travel, conclusion)"
```

### Task 7e: Edges + entrance polish

**Files:**
- Modify: `index.html` (add an SVG edge layer inside `#stage`, before the nodes)
- Modify: `style.css`

- [ ] **Step 1: Add a faint SVG edge layer** as the first child of `#stage` in `index.html`.

```html
      <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="6"  y1="42" x2="32" y2="14"/>
        <line x1="6"  y1="42" x2="32" y2="68"/>
        <line x1="32" y1="68" x2="58" y2="42"/>
        <line x1="58" y1="42" x2="32" y2="14"/>
        <line x1="58" y1="42" x2="80" y2="20"/>
        <line x1="80" y1="20" x2="80" y2="64"/>
      </svg>
```

- [ ] **Step 2: Style the edges** very subtly (the spec wants the line near-invisible — the particle is the star).

```css
.edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.edges line { stroke: var(--surface); stroke-width: .25; opacity: .5; vector-effect: non-scaling-stroke; }
```

- [ ] **Step 3: Verify.** On slide 5 diagram phase, faint connector lines are visible between the nodes (subtle, not competing with the neon particle). The particle still travels correctly over them.

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add faint pipeline edges"
```

---

## Task 8: Slide 6 (Demo ao vivo)

**Files:**
- Modify: `index.html` (fill `#s6`)
- Modify: `style.css`

- [ ] **Step 1: Fill `#s6`** in `index.html`. The real system is served by the nginx gateway on port 80 → `http://localhost`.

```html
<section class="slide demo" id="s6" data-label="04 · DEMO AO VIVO">
  <div class="demo-grid">
    <div class="demo-left">
      <p class="kicker">Demonstração</p>
      <h1>Do conceito ao sistema rodando.</h1>
      <ul class="demo-list">
        <li>OCR real lendo placas no pipeline ao vivo</li>
        <li>Depurador visual: crop YOLO × imagem binarizada (OpenCV)</li>
        <li>Acurácia: Levenshtein / CER contra o ground truth</li>
      </ul>
    </div>
    <div class="demo-right">
      <a class="demo-btn" href="http://localhost" target="_blank" rel="noopener">
        Abrir ambiente real ↗
      </a>
      <p class="demo-hint mono">http://localhost · nginx gateway (porta 80)</p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add styles** to `style.css`.

```css
.demo-grid { display: grid; grid-template-columns: 1.3fr .7fr; gap: 6vmin; align-items: center; }
.demo-list { list-style: none; margin-top: 3vmin; display: flex; flex-direction: column; gap: 2vmin; }
.demo-list li { position: relative; padding-left: 3vmin; color: var(--text); font-size: clamp(1.1rem,2.2vmin,1.5rem); }
.demo-list li::before { content: '▸'; position: absolute; left: 0; color: var(--neon); }
.demo-right { display: flex; flex-direction: column; align-items: center; gap: 2vmin; }
.demo-btn {
  display: inline-block; background: var(--neon); color: var(--bg); font-weight: 700;
  font-size: clamp(1.3rem, 2.6vmin, 1.8rem); padding: 2.5vmin 4vmin; border-radius: 1.2vmin;
  text-decoration: none; box-shadow: 0 0 3vmin rgba(7,239,92,.45); transition: transform .2s ease;
}
.demo-btn:hover { transform: scale(1.04); }
.demo-hint { color: var(--text-dim); font-size: 1rem; }
```

- [ ] **Step 3: Verify.** Slide 6: left column lists what will be proven; right column has a large neon "Abrir ambiente real ↗" button. Clicking opens `http://localhost` in a new tab (will only load if the stack is running — the link target is what matters here).

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add live demo bridge slide"
```

---

## Task 9: Slide 7 (Próximos passos)

**Files:**
- Modify: `index.html` (fill `#s7`)
- Modify: `style.css`

- [ ] **Step 1: Fill `#s7`** in `index.html`. Reuses `.cards-3` / `.card` from Task 5.

```html
<section class="slide roadmap" id="s7" data-label="05 · PRÓXIMOS PASSOS">
  <p class="kicker">Próximos passos</p>
  <h1>Refinar o que já entrega — e expandir o escopo.</h1>
  <div class="cards-3">
    <div class="card roadmap-card">
      <span class="rm-tag mono">algoritmos</span>
      <h2 class="mono">Classificação pré-binarização</h2>
      <p>Classificar a imagem antes da binarização para escolher o tratamento e elevar a assertividade do OCR.</p>
    </div>
    <div class="card roadmap-card">
      <span class="rm-tag mono">algoritmos</span>
      <h2 class="mono">Pré-processamento</h2>
      <p>Refino dos filtros de OpenCV (CLAHE, Otsu) para placas em condições adversas.</p>
    </div>
    <div class="card roadmap-card">
      <span class="rm-tag mono">novo serviço</span>
      <h2 class="mono">vc-worker-pátio</h2>
      <p>Monitoramento espacial de vagas — detecção de ocupação por polígonos (próximo semestre).</p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add styles** to `style.css`.

```css
.roadmap h1 { max-width: 26ch; margin-top: 1.5vmin; }
.roadmap-card { display: flex; flex-direction: column; gap: 1.2vmin; }
.rm-tag { color: var(--accent); font-size: .85rem; letter-spacing: .1em; text-transform: uppercase; }
.roadmap-card h2 { margin-bottom: .5vmin; }
```

- [ ] **Step 3: Verify.** Slide 7: kicker + headline + three roadmap cards (two "algoritmos", one "novo serviço"). No GPU card.

- [ ] **Step 4: Commit.**

```bash
git add index.html style.css
git commit -m "feat: add roadmap slide"
```

---

## Task 10: Integration pass + projector contrast review

**Files:**
- Modify: `style.css` / `index.html` as needed (fixes only)

- [ ] **Step 1: Full run-through.** Open `index.html`, press `→`/`Enter` from slide 1 to slide 8 end-to-end. Confirm:
  - Every slide transitions cleanly (fade), section label + progress update.
  - Counters fire on slide 2; pipeline runs all 9 steps on slide 5; demo button on slide 6; roadmap on slide 7; closing mirrors cover on slide 8.
  - `Esc` on slide 5 resets the animation; re-running works.

- [ ] **Step 2: Projector contrast check.** Zoom the browser to ~67% (simulates projector distance) and confirm: no text relies on small dim gray; edge/operation labels (`S3 PUT`, etc.) are readable; neon-on-graphite has clear contrast. Bump any `--text-dim` usage that reads too faint to `--text`, or increase its size. Fix inline.

- [ ] **Step 3: Re-test slide 5 after any node-position edits.** Because the particle reads live `getBoundingClientRect`, moving a node in HTML automatically keeps the particle aligned — but re-run the 9 steps once to confirm no node overlaps the side panel at the target resolution.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "polish: integration pass and projector contrast"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- Design system / tokens → Tasks 1–2. ✓
- Deck nav + slide-5 sub-states + Esc reset → Tasks 1, 7b–7d. ✓
- Pure HTML/CSS/JS, offline, self-hosted fonts → Tasks 1–2. ✓
- 8 slides (capa, problema+counters, solução, arquitetura, pipeline, demo, próximos passos, encerramento) → Tasks 3–9. ✓
- Pipeline 9-step animation + particle model + side panels + crossfades → Task 7. ✓
- Próximos passos = algoritmos + worker-pátio, no GPU → Task 9. ✓
- Demo opens real system at localhost:80 → Task 8. ✓
- Overwrite root (v1 removed) → Task 1. ✓

**Open decisions from spec — now resolved:** fonts = self-hosted Space Grotesk + JetBrains Mono (Task 2); demo URL = `http://localhost` (Task 8); v2 location = repo root, v1 overwritten (Task 1). Integrantes/contatos intentionally left blank (group decides) — no placeholder names, not a plan gap.

**Placeholder scan:** No "TBD"/"handle edge cases" steps; every code step contains real code. ✓
**Type consistency:** `hooks` (onEnterSlide5/advancePipeline/resetPipeline/isPipelineActive), `NODE_EL` keys (cam/minio/redis/worker/api/dashboard), `centerOf(key)`, `STEPS` shape, `state.pipelineComplete` — names consistent across Tasks 1 and 7. ✓
