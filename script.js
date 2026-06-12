/* ═══════════════════════════════════════════════════════════
   SLIDE NAVIGATION
══════════════════════════════════════════════════════════════ */
const TOTAL = 5;
let current = 0;
let animating = false;

const deck = document.getElementById('deck');
const bar  = document.getElementById('progress-bar');
const dots = document.querySelectorAll('.dot');

function goTo(n) {
  if (n === current || animating) return;
  current = Math.max(0, Math.min(TOTAL - 1, n));
  deck.style.transform = `translateX(-${current * 100}vw)`;
  bar.style.width = `${((current + 1) / TOTAL) * 100}%`;
  dots.forEach((d, i) => d.classList.toggle('active', i === current));

  // Trigger enter-animations per slide
  if (current === 1) triggerCounters();

  // Trigger slide entry animation
  const slides = document.querySelectorAll('.slide');
  setTimeout(() => {
    slides[current]?.classList.add('slide-entered');
    if (current === 3) triggerTerminal();
  }, 80);

  animating = true;
  setTimeout(() => { animating = false; }, 650);
}

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

/* ═══════════════════════════════════════════════════════════
   STAT COUNTERS (Slide 1)
══════════════════════════════════════════════════════════════ */
const counterDone = { 0: false, 1: false, 2: false };
function animateCounter(id, target, suffix) {
  if (counterDone[id]) return;
  counterDone[id] = true;
  const el = document.getElementById(`stat-${id}`);
  let v = 0;
  const step = Math.max(1, Math.ceil(target / 50));
  const t = setInterval(() => {
    v = Math.min(v + step, target);
    el.textContent = v + suffix;
    if (v >= target) clearInterval(t);
  }, 22);
}
function triggerCounters() {
  animateCounter(0, 60, '%');
  animateCounter(1, 92, '%');
  animateCounter(2, 100, '%');
}

/* ═══════════════════════════════════════════════════════════
   TERMINAL TYPEWRITER (Slide 3)
═══════════════════════════════════════════════════════════ */
let terminalDone = false;
function triggerTerminal() {
  if (terminalDone) return;
  terminalDone = true;
  const lines = document.querySelectorAll('.term-line');
  lines.forEach((line, i) => {
    setTimeout(() => line.classList.add('visible'), i * 260);
  });
}

/* Expose for button clicks */
window.triggerTerminal = triggerTerminal;
window.goTo = goTo;

/* ─── Touch / Swipe ─────────────────────────────────────── */
let touchStartX = 0;
window.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
window.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
});

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
