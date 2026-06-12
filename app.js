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

function goTo(i) {
  if (i < 0 || i >= slides.length) return;
  state.current = i;
  render();
  runCounters(slides[i]);
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
