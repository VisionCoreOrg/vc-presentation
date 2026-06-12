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
