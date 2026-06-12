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
    cam:       { name: 'Camera-mock',      desc: 'Captura o frame e dispara o evento.' },
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
  let flightId = 0;   // generation token; bumped on each flight and on reset to invalidate stale callbacks

  const $ = (id) => document.getElementById(id);

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
    flightId++;
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
  function showPanel(key, op) {
    const p = PANELS[key];
    $('sp-op').textContent = op;
    $('sp-name').textContent = p.name;
    $('sp-desc').textContent = p.desc;
    $('side-panel').classList.add('show');
  }

  function centerOf(key) {
    const stage = $('stage').getBoundingClientRect();
    const r = $(NODE_EL[key]).getBoundingClientRect();
    return { x: r.left + r.width/2 - stage.left, y: r.top + r.height/2 - stage.top };
  }

  function moveParticle(from, to, onArrive) {
    const a = centerOf(from), b = centerOf(to);
    const particle = $('particle');
    busy = true;
    const myFlight = ++flightId;
    // place at source instantly
    particle.style.transition = 'none';
    particle.style.left = a.x + 'px'; particle.style.top = a.y + 'px'; particle.style.opacity = '1';
    void particle.offsetWidth; // force reflow
    // travel to destination
    particle.style.transition = 'left .7s ease, top .7s ease';
    particle.style.left = b.x + 'px'; particle.style.top = b.y + 'px';
    let settled = false;
    const done = () => {
      if (settled || myFlight !== flightId) return;   // idempotent + invalidated-by-reset guard
      settled = true;
      clearTimeout(fallback);
      particle.removeEventListener('transitionend', done);
      $(NODE_EL[to]).classList.add('lit');
      busy = false;
      onArrive && onArrive();
    };
    particle.addEventListener('transitionend', done);
    const fallback = setTimeout(done, 850); // guarantees arrival even if no transition occurs
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
      if (idx > 0 && STEPS[idx-1].phase !== 'diagram') {
        clearNodes();
        showPanel(step.from, '');   // on diagram entry, show the source (camera-mock) panel
      }
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

  // Wire into the global hooks (replaces the no-ops from Task 1)
  window.VC.hooks.onEnterSlide5 = () => { if (idx === -1) reset(); };
  window.VC.hooks.advancePipeline = advance;
  window.VC.hooks.resetPipeline = reset;
  window.VC.hooks.isPipelineActive = () => idx > -1 && idx < STEPS.length - 1;

  // expose for the next sub-tasks
  window.VC._pipeline = { STEPS, PANELS, NODE_EL, $, get idx(){return idx;}, set idx(v){idx=v;},
                          get busy(){return busy;}, set busy(v){busy=v;} };
})();
