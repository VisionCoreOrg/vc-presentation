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
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goTo(current + 1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
  // Hidden presenter shortcuts
  if (e.key.toLowerCase() === 's') triggerSim(isFailover);
  if (e.key.toLowerCase() === 'f') toggleFailover();
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

/* ═══════════════════════════════════════════════════════════
   PIPELINE SIMULATOR (Slide 2)
══════════════════════════════════════════════════════════════ */
let isFailover = false;
let simRunning = false;

// Node/edge id maps
const nodeIds = ['camera','minio','redis','worker','api','frontend'];
const edgeIds = ['cam-minio','cam-redis','redis-worker','worker-minio','worker-api','api-frontend'];

function getEdgeEl(id)  { return document.getElementById(`e-${id}`); }
function getNodeBg(id)  { return document.getElementById(`nb-${id}`); }
const particle = document.getElementById('particle');

function resetDiagram() {
  nodeIds.forEach(id => {
    const bg = getNodeBg(id);
    if (!bg) return;
    bg.classList.remove('active-node','active-node-rose');
    if (id === 'minio') {
      bg.classList.toggle('minio-offline', isFailover);
    }
  });
  edgeIds.forEach(id => {
    const e = getEdgeEl(id);
    if (e) e.classList.remove('active-edge','active-edge-rose');
  });
  particle.setAttribute('opacity', 0);
}

function toggleFailover() {
  isFailover = !isFailover;
  const badge = document.getElementById('minio-badge');
  const btn   = document.getElementById('btn-fail');
  badge.className = isFailover ? 'offline' : 'online';
  badge.textContent = isFailover ? 'MinIO OFFLINE' : 'MinIO ONLINE';
  const dot = btn.querySelector('.sim-btn-dot');
  dot.className = `sim-btn-dot ${isFailover ? 'rose pulsing' : 'rose'}`;
  resetDiagram();
}

/* Animate particle along an SVG path */
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
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease in-out
    const pt = path.getPointAtLength(ease * len);
    particle.setAttribute('cx', pt.x);
    particle.setAttribute('cy', pt.y);
    if (t < 1) requestAnimationFrame(frame);
    else { particle.setAttribute('opacity', 0); onDone?.(); }
  }
  requestAnimationFrame(frame);
}

/* Activate a node visually */
function activateNode(id, isRose) {
  const bg = getNodeBg(id);
  if (!bg) return;
  bg.classList.remove('active-node','active-node-rose');
  bg.classList.add(isRose ? 'active-node-rose' : 'active-node');
}
/* Activate an edge */
function activateEdge(id, isRose) {
  const e = getEdgeEl(id);
  if (!e) return;
  e.classList.remove('active-edge','active-edge-rose');
  e.classList.add(isRose ? 'active-edge-rose' : 'active-edge');
}

/* The full simulation sequence */
function triggerSim(failover) {
  if (simRunning) return;
  if (failover !== isFailover) {
    isFailover = failover;
    toggleFailover();
  }
  simRunning = true;
  resetDiagram();

  const color = isFailover ? '#f43f5e' : '#06b6d4';
  const rose  = isFailover;

  // Phase 1: Animate the car
  animateCar(() => {
    // Camera flash
    activateNode('camera', false);
    document.getElementById('cam-cone').classList.add('flash');

    // Show detection badge
    const badge = document.getElementById('detect-badge');
    badge.className = 'ok show';
    badge.textContent = 'PLACA DETECTADA · BRA·3E99';

    setTimeout(() => {
      document.getElementById('cam-cone').classList.remove('flash');

      // Phase 2: Camera → MinIO or skip
      if (!isFailover) {
        activateEdge('cam-minio', false);
        moveParticleOnPath('e-cam-minio', 700, color, () => {
          activateNode('minio', false);
          // Then camera → redis
          setTimeout(() => {
            activateEdge('cam-redis', false);
            moveParticleOnPath('e-cam-redis', 700, color, () => {
              activateNode('redis', false);
              continueWorker(color, rose);
            });
          }, 300);
        });
      } else {
        // Failover: skip minio, go straight to redis
        activateEdge('cam-redis', true);
        moveParticleOnPath('e-cam-redis', 700, color, () => {
          activateNode('redis', true);
          continueWorker(color, rose);
        });
      }
    }, 600);
  });
}

function continueWorker(color, rose) {
  // Redis → Worker
  setTimeout(() => {
    activateEdge('redis-worker', rose);
    moveParticleOnPath('e-redis-worker', 800, color, () => {
      activateNode('worker', rose);

      // Worker → MinIO (GET frame) if not failover
      if (!isFailover) {
        setTimeout(() => {
          activateEdge('worker-minio', false);
          moveParticleOnPath('e-worker-minio', 700, '#06b6d4', () => {
            // Worker → API
            setTimeout(() => {
              activateEdge('worker-api', rose);
              moveParticleOnPath('e-worker-api', 700, color, () => {
                activateNode('api', rose);
                // API → Frontend
                setTimeout(() => {
                  activateEdge('api-frontend', false);
                  moveParticleOnPath('e-api-frontend', 600, '#06b6d4', () => {
                    activateNode('frontend', false);
                    finishSim(true); // success → gate opens
                  });
                }, 200);
              });
            }, 300);
          });
        }, 300);
      } else {
        // Failover: skip minio GET, go worker → api
        setTimeout(() => {
          activateEdge('worker-api', true);
          moveParticleOnPath('e-worker-api', 700, color, () => {
            activateNode('api', true);
            setTimeout(() => {
              activateEdge('api-frontend', false);
              moveParticleOnPath('e-api-frontend', 600, '#06b6d4', () => {
                activateNode('frontend', false);
                finishSim(false); // failover → gate stays closed
              });
            }, 200);
          });
        }, 300);
      }
    });
  }, 300);
}

function finishSim(gateOpens) {
  const badge = document.getElementById('detect-badge');
  const gate  = document.getElementById('gate-bar');
  const car   = document.getElementById('sim-car');

  if (gateOpens) {
    gate.classList.add('open');
    badge.className = 'ok show';
    badge.textContent = 'ACESSO LIBERADO ✓';
    // Car continues through gate to the RIGHT
    setTimeout(() => {
      car.style.transition = 'transform 1.4s ease-in';
      car.style.transform  = 'translateX(calc(100vw + 200px))';
      setTimeout(() => {
        gate.classList.remove('open');
        badge.className = 'ok';
        car.style.transition = 'none';
        car.style.transform  = 'translateX(-400px)'; // reset off-screen left
        simRunning = false;
      }, 1500);
    }, 600);
  } else {
    badge.className = 'fail show';
    badge.textContent = 'FALHA DE MÍDIA — DADOS SALVOS ✓';
    setTimeout(() => {
      badge.className = 'fail';
      // Car reverses back LEFT
      car.style.transition = 'transform 1s ease-in-out';
      car.style.transform  = 'translateX(-400px)';
      setTimeout(() => {
        car.style.transition = 'none';
        simRunning = false;
      }, 1100);
    }, 2000);
  }
}

/* ─── Car animation ───────────────────────────────────── */
function animateCar(onStop) {
  const car = document.getElementById('sim-car');
  // Car enters from LEFT toward gate (left→right, matching pipeline flow)
  car.style.transition = 'transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)';
  car.style.transform  = 'translateX(120px)'; // stop just before gate at left:240px
  setTimeout(onStop, 1900);
}

/* Expose for button clicks */
window.triggerSim    = triggerSim;
window.toggleFailover = toggleFailover;
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
