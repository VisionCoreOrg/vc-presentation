# Interactive Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the automated one-shot pipeline animation with a step-by-step presenter-controlled animation featuring a crossfade between car scene and pipeline diagram, using the VisionCore brand palette.

**Architecture:** A `STEPS[]` array declares all 8 animation steps. `nextStep()` reads the current step, detects phase changes (triggering a CSS crossfade 400ms before executing), then dispatches to a dedicated action function. CSS `[data-phase]` selectors on `#slide-pipeline` control which layer is visible.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step. Open the `.html` file directly in a browser to test each task.

---

## Files

- Modify: `style.css` — tasks 1 and 2
- Modify: `apresenta_o_interativa_visioncore.html` — task 3
- Modify: `script.js` — tasks 4, 5, and 6

---

## Task 1: Update CSS color palette tokens

**Files:**
- Modify: `style.css` (lines 1–21, `:root` block)

- [ ] **Step 1.1 — Replace the `:root` block in `style.css`**

Find the existing `:root { ... }` block and replace it entirely with:

```css
:root {
  --bg:       #1D2938;
  --bg2:      #182230;
  --card:     #1a2536;
  --card2:    #1f2d42;
  --border:   #243548;
  --border2:  #2c3f58;
  --accent:   #07EF5C;
  --cyan:     #2A616E;
  --emerald:  #13B37E;
  --rose:     #f43f5e;
  --amber:    #f59e0b;
  --text:     #f1f5f9;
  --text2:    #94a3b8;
  --text3:    #64748b;
  --mono:     'JetBrains Mono', 'Fira Code', monospace;
  --sans:     'Inter', system-ui, sans-serif;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 1.2 — Update progress bar gradient to use `--accent`**

Find:
```css
background: linear-gradient(90deg, var(--cyan), var(--emerald));
```
Replace with:
```css
background: linear-gradient(90deg, var(--accent), var(--emerald));
```

- [ ] **Step 1.3 — Update cover title `em` gradient**

Find:
```css
.cover-title em {
  font-style: normal;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--emerald) 100%);
```
Replace with:
```css
.cover-title em {
  font-style: normal;
  background: linear-gradient(135deg, var(--accent) 0%, var(--emerald) 100%);
```

- [ ] **Step 1.4 — Update CTA button gradient (slide 3)**

Find:
```css
background: linear-gradient(135deg, var(--cyan), var(--emerald));
```
Replace with:
```css
background: linear-gradient(135deg, var(--accent), var(--emerald));
```

- [ ] **Step 1.5 — Verify in browser**

Open `apresenta_o_interativa_visioncore.html` in a browser. Check:
- Background is dark navy (`#1D2938`), noticeably different from the old near-black
- The progress bar at top glows lime green when you navigate slides
- The cover title "LPR" shows a lime-to-green gradient
- The "Acessar Ambiente de Homologação" button (slide 3) is lime-to-green

- [ ] **Step 1.6 — Commit**

```bash
git add style.css
git commit -m "style: apply VisionCore brand palette to presentation tokens"
```

---

## Task 2: Replace simulation CSS with layer + car scene + step indicator CSS

**Files:**
- Modify: `style.css`

- [ ] **Step 2.1 — Delete the old pipeline simulator CSS block**

Find and delete everything from:
```css
/* ═══════════════════════════════════════════════════════════
   SLIDE 2 — PIPELINE SIMULATOR
══════════════════════════════════════════════════════════════ */
```
...all the way through the end of `/* ─── Car Scene ─────────────────────────────────────────── */` section, including `.plate-chip { ... }`.

This removes: `#slide-pipeline`, `.pipeline-header`, `.sim-controls`, `.sim-btn`, `.sim-btn-dot`, `@keyframes dot-ping`, `#minio-badge`, `.pipeline-svg-wrap`, `#pipelineSvg`, `.p-node-bg`, `.p-node-icon`, `.p-node-label`, `.p-node-sub`, `.p-edge`, `.p-edge-label`, `#particle`, `.car-scene`, `.road`, `.road-line`, `.cam-mount`, `.cam-pole`, `.cam-head`, `.cam-cone`, `.gate-post`, `.gate-bar`, `#detect-badge`, `#sim-car`, `.plate-chip`.

- [ ] **Step 2.2 — Add new pipeline slide CSS**

Append this entire block to the end of the CSS where the deleted block was:

```css
/* ═══════════════════════════════════════════════════════════
   SLIDE 2 — PIPELINE (step-by-step)
══════════════════════════════════════════════════════════════ */
#slide-pipeline {
  padding-bottom: 28px;
  background: #07111e;
  justify-content: space-between;
}

.pipeline-slide-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  margin-bottom: 12px;
}

/* ─── Layers container ─────────────────────────────────── */
.pipeline-layers {
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 0 -64px; /* bleed to slide edges, compensate for slide padding */
}

.car-layer,
.pipeline-layer {
  position: absolute;
  inset: 0;
  transition: opacity 0.4s ease;
}

/* Phase visibility */
#slide-pipeline[data-phase="idle"] .car-layer,
#slide-pipeline[data-phase="external"] .car-layer,
#slide-pipeline[data-phase="conclusion"] .car-layer {
  opacity: 1; pointer-events: auto;
}
#slide-pipeline[data-phase="idle"] .pipeline-layer,
#slide-pipeline[data-phase="external"] .pipeline-layer,
#slide-pipeline[data-phase="conclusion"] .pipeline-layer {
  opacity: 0; pointer-events: none;
}
#slide-pipeline[data-phase="pipeline"] .car-layer {
  opacity: 0; pointer-events: none;
}
#slide-pipeline[data-phase="pipeline"] .pipeline-layer {
  opacity: 1; pointer-events: auto;
}

/* ─── Car layer inner scene ────────────────────────────── */
.car-scene-inner {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 220px;
  background: linear-gradient(180deg, transparent 0%, rgba(7,239,92,.015) 100%);
  border-top: 1px solid var(--border);
  overflow: hidden;
}

.road {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 50px;
  background: #0a1220;
  border-top: 1px solid var(--border);
}
.road-line {
  position: absolute; top: 50%; left: 0; right: 0;
  height: 2px;
  background: repeating-linear-gradient(
    90deg, #1e2d45 0, #1e2d45 24px, transparent 24px, transparent 48px
  );
  transform: translateY(-50%);
}

.cam-mount {
  position: absolute; left: 120px; bottom: 50px;
  display: flex; flex-direction: column; align-items: center;
  z-index: 3;
}
.cam-pole {
  width: 2px; height: 60px;
  background: linear-gradient(180deg, var(--border2), var(--border));
}
.cam-head {
  width: 36px; height: 22px;
  background: var(--card2); border: 1px solid var(--border2);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
}
.cam-head svg { width: 18px; height: 18px; }

.cam-cone {
  position: absolute; left: 138px; bottom: 50px;
  width: 0; height: 0;
  border-top: 30px solid transparent;
  border-bottom: 30px solid transparent;
  border-right: 90px solid rgba(7,239,92,.05);
  border-left: none;
  transition: border-right-color .3s;
}
.cam-cone.flash { border-right-color: rgba(7,239,92,.4); }

.gate-post {
  position: absolute; left: 380px; bottom: 50px;
  width: 12px; height: 80px;
  background: linear-gradient(180deg, var(--border2), var(--border));
  border-radius: 3px 3px 0 0;
  z-index: 3;
}
.gate-bar {
  position: absolute; left: 388px; bottom: 129px;
  width: 180px; height: 5px;
  background: linear-gradient(90deg, var(--rose), #ff6080);
  border-radius: 3px;
  transform-origin: 0% 50%;
  transform: rotate(0deg);
  transition: transform .8s var(--ease-out);
  z-index: 3;
  box-shadow: 0 0 8px rgba(244,63,94,.4);
}
.gate-bar.open {
  transform: rotate(-90deg);
  box-shadow: 0 0 12px rgba(7,239,92,.6);
  background: linear-gradient(90deg, var(--emerald), #34d399);
}

#detect-badge {
  position: absolute; left: 250px; bottom: 105px;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: .1em; font-weight: 600;
  padding: 6px 12px; border-radius: 6px;
  opacity: 0; transform: translateY(6px);
  transition: opacity .3s, transform .3s;
  z-index: 5; white-space: nowrap;
}
#detect-badge.show  { opacity: 1; transform: translateY(0); }
#detect-badge.ok    { color: var(--emerald); background: rgba(19,179,126,.12); border: 1px solid rgba(19,179,126,.3); }
#detect-badge.fail  { color: var(--rose);    background: rgba(244,63,94,.12);  border: 1px solid rgba(244,63,94,.3); }

#sim-car {
  position: absolute; bottom: 46px;
  width: 180px;
  transform: translateX(-600px);
  transition: none;
  z-index: 4;
}
#sim-car svg {
  width: 180px; fill: none; stroke: var(--text2);
  stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
}
.plate-chip {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  font-family: var(--mono); font-size: 9px; font-weight: 600;
  letter-spacing: .1em; color: #090f1c;
  background: #e8f4ff; border-radius: 2px;
  padding: 2px 6px; white-space: nowrap;
}

/* ─── Pipeline layer ───────────────────────────────────── */
.pipeline-layer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 64px;
}
.pipeline-layer #pipelineSvg {
  width: 100%; height: auto; max-height: 100%;
  overflow: visible;
}

/* SVG node / edge styles (unchanged from original) */
.p-node-bg {
  fill: var(--card2); stroke: var(--border2); stroke-width: 1;
  transition: filter .3s;
}
.p-node-bg.active-node {
  stroke: var(--accent);
  filter: drop-shadow(0 0 8px rgba(7,239,92,.5));
}
.p-node-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.p-node-label { font-family: var(--mono); font-size: 10px; fill: var(--text); font-weight: 600; letter-spacing: .04em; }
.p-node-sub   { font-family: var(--mono); font-size: 8px; fill: var(--text3); letter-spacing: .06em; }

.p-edge { fill: none; stroke: var(--border2); stroke-width: 1.5; marker-end: url(#arrowGray); }
.p-edge.active-edge { stroke: var(--accent); marker-end: url(#arrowAccent); transition: stroke .2s; }

.p-edge-label { font-family: var(--mono); font-size: 8px; fill: var(--text3); letter-spacing: .08em; }

#particle {
  r: 5;
  fill: #07EF5C;
  filter: drop-shadow(0 0 6px #07EF5C);
  opacity: 0;
}

/* ─── Step indicator ───────────────────────────────────── */
#step-indicator {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 0 4px;
  position: relative;
  z-index: 2;
}
.step-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}
.step-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--border2);
  transition: background .3s, transform .3s, box-shadow .3s;
}
.step-dot.active {
  background: var(--accent);
  transform: scale(1.5);
  box-shadow: 0 0 8px var(--accent);
}
.step-dot.done {
  background: rgba(7,239,92,.35);
}
.step-phase-sep {
  width: 1px; height: 14px;
  background: var(--border2);
  margin: 0 4px;
}
#step-label {
  font-family: var(--mono); font-size: 10px;
  color: var(--text3); letter-spacing: .08em;
}
```

- [ ] **Step 2.3 — Add `arrowAccent` SVG marker** (needed for active edges)

In the HTML file (task 3 will do this), the SVG `<defs>` block needs a new marker. Note this here; it will be added in Task 3 alongside the HTML restructure.

- [ ] **Step 2.4 — Commit**

```bash
git add style.css
git commit -m "style: add layer layout, expanded car scene, step indicator CSS"
```

---

## Task 3: Restructure Slide 2 HTML

**Files:**
- Modify: `apresenta_o_interativa_visioncore.html`

- [ ] **Step 3.1 — Replace the entire `<!-- ══ SLIDE 2 — PIPELINE SIMULATOR ══ -->` section**

Find the block starting with `<!-- ══ SLIDE 2 — PIPELINE SIMULATOR ══════════════════════ -->` and ending with the closing `</section>` of `#slide-pipeline`. Replace the entire block with:

```html
<!-- ══ SLIDE 2 — PIPELINE ══════════════════════════════════ -->
<section class="slide" id="slide-pipeline" data-phase="idle">
  <div class="grid-bg"></div>

  <div class="pipeline-slide-header anim-in" style="--anim-order:0">
    <p class="slide-eyebrow" style="color:var(--emerald)">02 / Arquitetura e Pipeline</p>
    <h2 class="slide-title">Simulador do Pipeline de Dados</h2>
  </div>

  <!-- Layers: car scene ↔ pipeline diagram (crossfade via data-phase) -->
  <div class="pipeline-layers anim-in" style="--anim-order:1">

    <!-- Car layer — visible in phases: idle, external, conclusion -->
    <div class="car-layer">
      <div class="car-scene-inner">
        <div class="road"><div class="road-line"></div></div>

        <!-- Camera -->
        <div class="cam-mount">
          <div class="cam-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="cam-pole"></div>
        </div>
        <div class="cam-cone" id="cam-cone"></div>

        <!-- Gate -->
        <div class="gate-post"></div>
        <div class="gate-bar" id="gate-bar"></div>

        <!-- Detection Badge -->
        <div id="detect-badge">PLACA DETECTADA · BRA·3E99</div>

        <!-- Car -->
        <div id="sim-car">
          <svg viewBox="0 0 140 56" preserveAspectRatio="xMidYMid meet">
            <path d="M5 43 L5 30 C5 26 8 23 12 23 L34 23 L48 8 L92 8 L108 23 L128 23 C131 23 133 25 133 28 L133 43"/>
            <line x1="5" y1="43" x2="133" y2="43"/>
            <circle cx="32" cy="46" r="7"/>
            <circle cx="32" cy="46" r="2.5" fill="#94a3b8" stroke="none"/>
            <circle cx="106" cy="46" r="7"/>
            <circle cx="106" cy="46" r="2.5" fill="#94a3b8" stroke="none"/>
            <line x1="48" y1="9" x2="62" y2="23"/>
            <line x1="78" y1="9" x2="90" y2="23"/>
            <rect x="127" y="28" width="6" height="8" rx="1" fill="rgba(255,240,150,0.6)" stroke="none"/>
          </svg>
          <div class="plate-chip">BRA·3E99</div>
        </div>
      </div>
    </div>

    <!-- Pipeline layer — visible in phase: pipeline -->
    <div class="pipeline-layer">
      <svg id="pipelineSvg" viewBox="0 0 1100 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowGray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 2 L9 5 L0 8 Z" fill="#1e2d45"/>
          </marker>
          <marker id="arrowAccent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 2 L9 5 L0 8 Z" fill="#07EF5C"/>
          </marker>
        </defs>

        <!-- Node: Camera -->
        <g id="n-camera">
          <rect class="p-node-bg" id="nb-camera" x="20" y="70" width="130" height="60" rx="10"/>
          <g transform="translate(50,88)" class="p-node-icon" style="color:#2A616E">
            <rect x="0" y="3" width="11" height="9" rx="1" stroke="#2A616E"/>
            <path d="M11 5 L16 3 V12 L11 10" stroke="#2A616E"/>
            <circle cx="5.5" cy="7.5" r="1.5" fill="#2A616E" stroke="none"/>
          </g>
          <text class="p-node-label" x="85" y="107" text-anchor="middle">vc-camera-mock</text>
          <text class="p-node-sub"   x="85" y="120" text-anchor="middle">BORDA · MOCK</text>
        </g>

        <!-- Node: MinIO -->
        <g id="n-minio">
          <rect class="p-node-bg" id="nb-minio" x="235" y="20" width="120" height="56" rx="10"/>
          <g transform="translate(255,32)" class="p-node-icon" style="color:#f59e0b">
            <path d="M0 5 L7 1 L14 5 L14 11 L7 15 L0 11 Z" stroke="#f59e0b"/>
            <path d="M0 5 L7 9 L14 5 M7 9 V15" stroke="#f59e0b"/>
          </g>
          <text class="p-node-label" x="295" y="56" text-anchor="middle">MinIO</text>
          <text class="p-node-sub"   x="295" y="67" text-anchor="middle">S3 · OBJECT STORAGE</text>
        </g>

        <!-- Node: Redis -->
        <g id="n-redis">
          <rect class="p-node-bg" id="nb-redis" x="235" y="124" width="120" height="56" rx="10"/>
          <g transform="translate(255,136)" class="p-node-icon" style="color:#f43f5e">
            <rect x="0" y="0" width="14" height="3" rx="1" stroke="#f43f5e"/>
            <rect x="0" y="5" width="14" height="3" rx="1" stroke="#f43f5e"/>
            <rect x="0" y="10" width="14" height="3" rx="1" stroke="#f43f5e"/>
          </g>
          <text class="p-node-label" x="295" y="160" text-anchor="middle">Redis Queue</text>
          <text class="p-node-sub"   x="295" y="172" text-anchor="middle">EVENT BROKER · BLPOP</text>
        </g>

        <!-- Node: Worker -->
        <g id="n-worker">
          <rect class="p-node-bg" id="nb-worker" x="460" y="70" width="160" height="60" rx="10"/>
          <g transform="translate(480,88)" class="p-node-icon" style="color:#13B37E">
            <circle cx="7" cy="7" r="5.5" stroke="#13B37E"/>
            <path d="M3 7 L11 7 M7 3 L7 11" stroke="#13B37E"/>
          </g>
          <text class="p-node-label" x="540" y="107" text-anchor="middle">vc-worker-portaria</text>
          <text class="p-node-sub"   x="540" y="120" text-anchor="middle">YOLOv8 · EasyOCR</text>
        </g>

        <!-- Node: API -->
        <g id="n-api">
          <rect class="p-node-bg" id="nb-api" x="740" y="70" width="130" height="60" rx="10"/>
          <g transform="translate(760,88)" class="p-node-icon" style="color:#2A616E">
            <path d="M0 6 L4 2 L10 8 L14 4" stroke="#2A616E"/>
            <circle cx="4" cy="2" r="1.2" fill="#2A616E" stroke="none"/>
            <circle cx="10" cy="8" r="1.2" fill="#2A616E" stroke="none"/>
          </g>
          <text class="p-node-label" x="805" y="107" text-anchor="middle">vc-api-core</text>
          <text class="p-node-sub"   x="805" y="120" text-anchor="middle">FastAPI · MySQL</text>
        </g>

        <!-- Node: Frontend -->
        <g id="n-frontend">
          <rect class="p-node-bg" id="nb-frontend" x="960" y="70" width="120" height="60" rx="10"/>
          <g transform="translate(978,88)" class="p-node-icon" style="color:#a78bfa">
            <rect x="0" y="0" width="14" height="11" rx="1" stroke="#a78bfa"/>
            <path d="M0 3 L14 3" stroke="#a78bfa"/>
            <line x1="7" y1="11" x2="7" y2="15" stroke="#a78bfa"/>
            <line x1="4" y1="15" x2="10" y2="15" stroke="#a78bfa"/>
          </g>
          <text class="p-node-label" x="1020" y="107" text-anchor="middle">Dashboard</text>
          <text class="p-node-sub"   x="1020" y="120" text-anchor="middle">React · Polling 5s</text>
        </g>

        <!-- Edges -->
        <path id="e-cam-minio"    class="p-edge" d="M150 90 C190 90 200 48 235 48"/>
        <text class="p-edge-label" x="187" y="62">S3 PUT</text>

        <path id="e-cam-redis"    class="p-edge" d="M150 110 C190 110 200 152 235 152"/>
        <text class="p-edge-label" x="183" y="148">LPUSH</text>

        <path id="e-redis-worker" class="p-edge" d="M355 152 C400 152 420 118 460 110"/>
        <text class="p-edge-label" x="390" y="148">BLPOP</text>

        <path id="e-worker-minio" class="p-edge" d="M490 70 C460 50 400 40 355 40"/>
        <text class="p-edge-label" x="420" y="36">S3 GET</text>

        <path id="e-worker-api"   class="p-edge" d="M620 100 L740 100"/>
        <text class="p-edge-label" x="660" y="94">HTTP POST</text>

        <path id="e-api-frontend" class="p-edge" d="M870 100 L960 100"/>
        <text class="p-edge-label" x="890" y="93">HTTP GET</text>

        <!-- Animated particle -->
        <circle id="particle" r="5" fill="#07EF5C" opacity="0"
          style="filter:drop-shadow(0 0 6px #07EF5C)"/>
      </svg>
    </div>

  </div><!-- /.pipeline-layers -->

  <!-- Step indicator -->
  <div id="step-indicator" class="anim-in" style="--anim-order:2">
    <div class="step-dots">
      <div class="step-dot" data-step="0"></div>
      <div class="step-dot" data-step="1"></div>
      <div class="step-phase-sep"></div>
      <div class="step-dot" data-step="2"></div>
      <div class="step-dot" data-step="3"></div>
      <div class="step-dot" data-step="4"></div>
      <div class="step-dot" data-step="5"></div>
      <div class="step-dot" data-step="6"></div>
      <div class="step-phase-sep"></div>
      <div class="step-dot" data-step="7"></div>
    </div>
    <div id="step-label">pressione ↓ ou Enter para iniciar</div>
  </div>

</section>
```

- [ ] **Step 3.2 — Update the nav dots count in the HTML**

The nav dots in `<div id="dots">` stay at 5 (unchanged) — no action needed.

- [ ] **Step 3.3 — Verify structure in browser**

Open the HTML. Navigate to slide 2. Expect:
- Header "Simulador do Pipeline de Dados" visible
- Dark area below with a small car scene strip at the bottom (car off-screen left)
- Step dots visible at the very bottom with label "pressione ↓ ou Enter para iniciar"
- No buttons visible

- [ ] **Step 3.4 — Commit**

```bash
git add apresenta_o_interativa_visioncore.html
git commit -m "feat: restructure slide 2 with car/pipeline layers and step indicator"
```

---

## Task 4: Rewrite script.js — state machine, actions, keyboard

**Files:**
- Modify: `script.js`

This task replaces the pipeline simulator section (lines ~76–305) and updates the keyboard handler.

- [ ] **Step 4.1 — Delete the pipeline simulator section from `script.js`**

Find the comment block:
```js
/* ═══════════════════════════════════════════════════════════
   PIPELINE SIMULATOR (Slide 2)
══════════════════════════════════════════════════════════════ */
```
Delete from that comment to the end of `window.triggerSim = triggerSim;` and `window.toggleFailover = toggleFailover;` lines. Keep `window.triggerTerminal = triggerTerminal;` and `window.goTo = goTo;`.

Also delete the `getEdgeEl` and `getNodeBg` helper functions if they appear before the deleted block — they will be re-added below.

- [ ] **Step 4.2 — Replace the `keydown` handler**

Find the existing `window.addEventListener('keydown', ...)` block and replace it entirely with:

```js
window.addEventListener('keydown', e => {
  // Step navigation — Enter or ↓, only on slide 2 (index 2 = Pipeline)
  if ((e.key === 'Enter' || e.key === 'ArrowDown') && current === 2) {
    e.preventDefault();
    nextStep();
    return;
  }
  // Reset animation — Escape on slide 2
  if (e.key === 'Escape' && current === 2) {
    e.preventDefault();
    resetAnimation();
    return;
  }
  // Slide navigation — Space or →
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    // Block mid-animation on slide 2 (index 2)
    if (current === 2 && stepIndex > 0 && stepIndex < STEPS.length) return;
    goTo(current + 1);
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    goTo(current - 1);
  }
});
```

- [ ] **Step 4.3 — Add the complete pipeline section at end of `script.js`**

Append after the touch/swipe section:

```js
/* ═══════════════════════════════════════════════════════════
   PIPELINE STEP-BY-STEP (Slide 2)
══════════════════════════════════════════════════════════════ */

/* ─── Declarative step list ─────────────────────────────── */
const STEPS = [
  { phase: 'external',   action: 'car-arrives'  },
  { phase: 'external',   action: 'camera-flash' },
  { phase: 'pipeline',   action: 'node', edge: 'cam-minio',    node: 'minio'    },
  { phase: 'pipeline',   action: 'node', edge: 'cam-redis',    node: 'redis'    },
  { phase: 'pipeline',   action: 'node', edge: 'redis-worker', node: 'worker'   },
  { phase: 'pipeline',   action: 'node', edge: 'worker-api',   node: 'api'      },
  { phase: 'pipeline',   action: 'node', edge: 'api-frontend', node: 'frontend' },
  { phase: 'conclusion', action: 'gate-opens'   },
];

/* ─── State ─────────────────────────────────────────────── */
let stepIndex    = 0;
let currentPhase = 'idle';
let animLocked   = false;
const CROSSFADE_MS = 400;

/* ─── Helpers ───────────────────────────────────────────── */
function getEdgeEl(id) { return document.getElementById(`e-${id}`); }
function getNodeBg(id)  { return document.getElementById(`nb-${id}`); }
const particle = document.getElementById('particle');

function setPhase(phase) {
  document.getElementById('slide-pipeline').dataset.phase = phase;
  currentPhase = phase;
}

function activateNode(id) {
  const bg = getNodeBg(id);
  if (bg) bg.classList.add('active-node');
}

function activateEdge(id) {
  const e = getEdgeEl(id);
  if (e) e.classList.add('active-edge');
}

/* ─── Particle animation ────────────────────────────────── */
function moveParticleOnPath(pathId, durationMs, color, onDone) {
  const path = document.getElementById(pathId);
  if (!path) { onDone?.(); return; }
  const len = path.getTotalLength();
  particle.setAttribute('fill', color);
  particle.setAttribute('opacity', 1);
  particle.style.filter = `drop-shadow(0 0 6px ${color})`;
  const start = performance.now();
  function frame(now) {
    const t = Math.min((now - start) / durationMs, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const pt = path.getPointAtLength(ease * len);
    particle.setAttribute('cx', pt.x);
    particle.setAttribute('cy', pt.y);
    if (t < 1) requestAnimationFrame(frame);
    else { particle.setAttribute('opacity', 0); onDone?.(); }
  }
  requestAnimationFrame(frame);
}

/* ─── State machine ─────────────────────────────────────── */
function nextStep() {
  if (animLocked || stepIndex >= STEPS.length) return;
  animLocked = true;

  const step = STEPS[stepIndex];
  const phaseChanged = step.phase !== currentPhase;

  const run = () => {
    executeStep(step);
    updateStepIndicator(stepIndex);
    stepIndex++;
    animLocked = false;
  };

  if (phaseChanged) {
    setPhase(step.phase);
    setTimeout(run, CROSSFADE_MS);
  } else {
    run();
  }
}

function executeStep(step) {
  switch (step.action) {
    case 'car-arrives':   executeCarArrives();            break;
    case 'camera-flash':  executeCameraFlash();           break;
    case 'node':          executeNode(step.edge, step.node); break;
    case 'gate-opens':    executeGateOpens();             break;
  }
}

/* ─── Step actions ──────────────────────────────────────── */
function executeCarArrives() {
  const car = document.getElementById('sim-car');
  car.style.transition = 'transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)';
  car.style.transform  = 'translateX(170px)';
}

function executeCameraFlash() {
  activateNode('camera');
  const cone = document.getElementById('cam-cone');
  cone.classList.add('flash');
  const badge = document.getElementById('detect-badge');
  badge.className = 'ok show';
  badge.textContent = 'PLACA DETECTADA · BRA·3E99';
  setTimeout(() => cone.classList.remove('flash'), 800);
}

function executeNode(edgeId, nodeId) {
  activateEdge(edgeId);
  moveParticleOnPath(`e-${edgeId}`, 700, '#07EF5C', () => activateNode(nodeId));
}

function executeGateOpens() {
  const gate  = document.getElementById('gate-bar');
  const badge = document.getElementById('detect-badge');
  const car   = document.getElementById('sim-car');

  gate.classList.add('open');
  badge.className   = 'ok show';
  badge.textContent = 'ACESSO LIBERADO ✓';

  setTimeout(() => {
    car.style.transition = 'transform 1.4s ease-in';
    car.style.transform  = 'translateX(calc(100vw + 300px))';
  }, 600);
}

/* ─── Step indicator ────────────────────────────────────── */
function updateStepIndicator(completedIndex) {
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i < completedIndex)      dot.classList.add('done');
    else if (i === completedIndex) dot.classList.add('active');
  });

  const label = document.getElementById('step-label');
  if (completedIndex < 0) {
    label.textContent = 'pressione ↓ ou Enter para iniciar';
  } else if (completedIndex >= STEPS.length - 1) {
    label.textContent = 'concluído — pressione → para continuar';
  } else {
    label.textContent = `passo ${completedIndex + 1} de ${STEPS.length}`;
  }
}

/* ─── Reset (Escape) ────────────────────────────────────── */
function resetAnimation() {
  stepIndex    = 0;
  animLocked   = false;
  setPhase('idle');

  // Reset SVG nodes and edges
  ['camera','minio','redis','worker','api','frontend'].forEach(id => {
    const bg = getNodeBg(id);
    if (bg) bg.classList.remove('active-node');
  });
  ['cam-minio','cam-redis','redis-worker','worker-minio','worker-api','api-frontend'].forEach(id => {
    const e = getEdgeEl(id);
    if (e) e.classList.remove('active-edge');
  });
  particle.setAttribute('opacity', 0);

  // Reset car
  const car = document.getElementById('sim-car');
  car.style.transition = 'none';
  car.style.transform  = 'translateX(-600px)';

  // Reset gate and badge
  document.getElementById('gate-bar').classList.remove('open');
  document.getElementById('cam-cone').classList.remove('flash');
  const badge = document.getElementById('detect-badge');
  badge.className   = '';
  badge.textContent = 'PLACA DETECTADA · BRA·3E99';

  updateStepIndicator(-1);
}
```

- [ ] **Step 4.4 — Verify the file has no references to removed functions**

Run in terminal:
```bash
grep -n "triggerSim\|toggleFailover\|isFailover\|simRunning\|continueWorker\|finishSim\|animateCar\|resetDiagram" script.js
```
Expected: no output. If any appear, delete those lines.

- [ ] **Step 4.5 — Verify `window.goTo` and `window.triggerTerminal` are still exposed**

Run:
```bash
grep -n "window\." script.js
```
Expected output contains:
```
window.goTo = goTo;
window.triggerTerminal = triggerTerminal;
```
Should NOT contain: `window.triggerSim`, `window.toggleFailover`.

- [ ] **Step 4.6 — Verify in browser**

Open the HTML. Go to slide 2. Press `↓` or `Enter`:
- First press: car animates in from left, stops in front of gate
- Second press: cone flashes green, badge "PLACA DETECTADA" appears
- Third press: slide crossfades to pipeline diagram, then cam→minio edge + node light up lime green
- Fourth through seventh press: each pipeline node lights up in sequence with particle animation
- Eighth press: slide crossfades back to car scene, gate rotates open (green), badge "ACESSO LIBERADO ✓", car exits right
- Press `Escape`: everything resets to initial state

Check step indicator dots: correct dot is active (glowing green) at each step; past dots are dim green.

Check `Space`/`→`: during steps 1–7, pressing Space does nothing (slide stays on 2). After step 8, pressing `→` moves to slide 3.

- [ ] **Step 4.7 — Commit**

```bash
git add script.js
git commit -m "feat: add step-by-step animation state machine with keyboard control"
```

---

## Task 5: Visual fine-tuning and final verification

**Files:**
- Modify: `style.css` (minor adjustments if needed after seeing in browser)

- [ ] **Step 5.1 — Check car arrival position**

On step ① (car arrives), the car should stop clearly before the gate post. If it overlaps or is too far away, adjust `translateX(170px)` in `executeCarArrives()` in `script.js`. The gate post is at CSS `left: 380px` within `.car-scene-inner` which itself has `left: -64px` relative to the slide. Aim for the car's front to be ~20–30px before the gate post visually.

- [ ] **Step 5.2 — Check step indicator alignment**

The step dots should be centered horizontally. If they look off, open browser DevTools and inspect `#step-indicator`. Ensure `align-items: center` is applied. No code change needed if already centered.

- [ ] **Step 5.3 — Verify slide entry animation on slide 2**

Navigate away from slide 2 and back. The header and step indicator should fade-slide in via `.anim-in` / `.slide-entered`. If they don't, check that `goTo()` adds `slide-entered` class for `current === 1` (it already does this via `slides[current]?.classList.add('slide-entered')`).

- [ ] **Step 5.4 — Run through the full presentation once**

Press through all 5 slides in order:
1. Slide 0 (Cover): brand dot pulses, stack chips visible ✓
2. Slide 1 (Problem): stat counters animate to 60%, 92%, 100% ✓
3. Slide 2 (Pipeline): step through all 8 steps ✓
4. Slide 3 (Demo): terminal lines appear, CTA button visible ✓
5. Slide 4 (Roadmap): kanban and timeline visible ✓

Navigate backwards: `←` works at all points, including slide 2 (with animation locked or complete).

- [ ] **Step 5.5 — Final commit**

```bash
git add style.css script.js apresenta_o_interativa_visioncore.html
git commit -m "feat: complete interactive step-by-step pipeline presentation"
```

---

## Verification Checklist

Before declaring done, confirm all items from the design spec:

- [ ] Presenter advances each step with `Enter`/`↓` without slide changing
- [ ] Crossfade between car scene and pipeline diagram is smooth (no flash, no jump)
- [ ] `Escape` resets fully: car off-screen, gate closed, all nodes dark, badge hidden, step dots clear
- [ ] VisionCore brand palette visible: lime green particle and glow, dark `#1D2938` backgrounds
- [ ] Link to `vc-frontend` in slide 3 still works (points to `http://localhost:80`)
- [ ] No JavaScript console errors during the full run
