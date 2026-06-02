/* ==========================================================================
   VisionCore — Engine (scroll-driven, simulator, ops log, tweaks)
   ========================================================================== */
(function () {
  "use strict";

  /* -- queries ---------------------------------------------------------- */
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  const sections = $$(".section");
  const steps = $$(".step");
  const navBtns = $$(".side-nav button");
  const progress = $("#progressBar");
  const topoSvg = $("#topoSvg");
  const topoInner = $("#topoInner");
  const simulator = $("#simulator");
  const opsStream = $("#opsStream");
  const techCards = $$(".tech-card");
  const techDetail = $("#techDetail");

  /* -- node coords for zoom focus (viewBox 700x460) --------------------- */
  const FOCUS = {
    overview: { cx: 350, cy: 230, scale: 1.0 },
    problem:  { cx: 350, cy: 230, scale: 1.0 },
    thesis:   { cx: 350, cy: 230, scale: 1.0 },
    pipeline: { cx: 350, cy: 230, scale: 1.0 },
    metrics:  { cx: 350, cy: 230, scale: 1.0 },
    roadmap:  { cx: 350, cy: 230, scale: 1.0 },

    browser:  { cx: 70,  cy: 64,  scale: 1.5 },
    nginx:    { cx: 206, cy: 64,  scale: 1.4 },
    frontend: { cx: 370, cy: 64,  scale: 1.4 },
    api:      { cx: 370, cy: 189, scale: 1.4 },
    mysql:    { cx: 550, cy: 189, scale: 1.5 },
    minio:    { cx: 210, cy: 189, scale: 1.45 },
    camera:   { cx: 85,  cy: 379, scale: 1.5 },
    redis:    { cx: 270, cy: 379, scale: 1.5 },
    worker:   { cx: 480, cy: 379, scale: 1.4 },
  };

  function setTopoZoom(target) {
    const f = FOCUS[target] || FOCUS.overview;
    // viewBox center is (350,230); we translate so f.cx,f.cy becomes the center, then scale
    const tx = (350 - f.cx) * f.scale;
    const ty = (230 - f.cy) * f.scale;
    topoInner.setAttribute(
      "transform",
      `translate(${tx},${ty}) scale(${f.scale}) translate(${(1-1/f.scale)*0},${(1-1/f.scale)*0})`
    );
    topoInner.style.transformOrigin = `${f.cx}px ${f.cy}px`;
    topoInner.style.transition = "transform 0.9s cubic-bezier(.22,.61,.36,1)";
    topoInner.style.transform = `translate(${(350-f.cx)*(f.scale-1)/f.scale}px, ${(230-f.cy)*(f.scale-1)/f.scale}px) scale(${f.scale})`;
    // simpler approach: use SVG transform attribute
    topoInner.setAttribute(
      "transform",
      `translate(${(1-f.scale)*f.cx}, ${(1-f.scale)*f.cy}) scale(${f.scale})`
    );
  }

  function clearActiveTopo() {
    $$(".topo-group", topoSvg).forEach(g => g.classList.remove("active"));
    $$(".topo-edge", topoSvg).forEach(p => p.classList.remove("active","solid"));
    $("#packet").setAttribute("opacity", "0");
  }
  function setActiveTopo(ids) {
    if (!ids) return;
    (Array.isArray(ids) ? ids : [ids]).forEach(id => {
      const g = $("#g-" + id);
      if (g) g.classList.add("active");
    });
  }
  function activateEdges(edges, solid=false) {
    edges.forEach(id => {
      const p = $("#e-" + id);
      if (p) {
        p.classList.add("active");
        if (solid) p.classList.add("solid");
      }
    });
  }
  function animatePacket(edgeId) {
    const motion = $("#packetMotion");
    const mpath = motion && motion.querySelector("mpath");
    if (!mpath) return;
    mpath.setAttribute("href", "#e-" + edgeId);
    mpath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#e-" + edgeId);
    $("#packet").setAttribute("opacity", "1");
    try { motion.beginElement(); } catch(e){}
  }

  /* ---------------------------------------------------------------------
     Scroll engine — handles activation, progress, simulator percent
     --------------------------------------------------------------------- */
  function handleScroll() {
    const wh = window.innerHeight;
    const total = document.documentElement.scrollHeight - wh;
    const pct = Math.max(0, Math.min(1, window.scrollY / total));
    progress.style.width = (pct * 100) + "%";

    // active section
    let active = sections[0];
    const center = wh * 0.45;
    sections.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= center && r.bottom >= center) active = s;
    });
    sections.forEach(s => s.classList.toggle("is-active", s === active));

    // sheet meta
    const idx = sections.indexOf(active);
    if (idx >= 0) {
      $("#meta-sheet").textContent = String(idx).padStart(2, "0") + "/07";
    }

    // active step (within sec-04)
    let activeStep = null;
    steps.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= center && r.bottom >= center) activeStep = s;
    });
    steps.forEach(s => s.classList.toggle("is-active", s === activeStep));

    // side nav
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.target === active.id));

    // focus
    clearActiveTopo();
    const insideSimulator =
      activeStep ||
      (active.id === "sec-04" && active.getBoundingClientRect().bottom > wh * 0.4);

    if (insideSimulator) {
      simulator.classList.add("visible");
      driveSimulatorByScroll(activeStep);
    } else {
      simulator.classList.remove("visible");
      // when not in simulator, focus topology to section focus
      const focus = active.dataset.focus || "overview";
      setTopoZoom(focus);

      // highlight per section
      if (active.id === "sec-03") {
        // architecture overview - highlight planes lightly
        setActiveTopo(["nginx", "api"]);
        activateEdges(["nginx-api", "nginx-frontend"]);
      } else if (active.id === "sec-02") {
        setActiveTopo(["redis", "worker"]);
        activateEdges(["worker-redis"]);
      }
    }
  }

  /* ---------------------------------------------------------------------
     Simulator scroll-driven animation
     --------------------------------------------------------------------- */
  const simCar = $("#simCar");
  const simGate = $("#simGate");
  const simFlash = $("#simFlash");
  const simCone = $("#simCone");
  const ocrInsp = $("#ocrInsp");
  const ocrText = $("#ocrText");
  const ocrConf = $("#ocrConf");
  const ocrLat = $("#ocrLat");
  const ocrFrame = $("#ocrFrame");
  const pipeStages = $$(".pipe-stage");
  const ocrSpans = $$("#ocrText span");

  let flashFired = false;
  let frameCounter = 234;

  function driveSimulatorByScroll(activeStep) {
    if (!activeStep) {
      // ramp in / out
      setTopoZoom("camera");
      return;
    }
    const stepId = activeStep.id;
    // approximate progress within the step (0..1) based on its bounding rect
    const r = activeStep.getBoundingClientRect();
    const total = window.innerHeight + r.height;
    let p = 1 - (r.bottom / total);
    p = Math.max(0, Math.min(1, p));

    // reset pipe state
    pipeStages.forEach(ps => ps.classList.remove("active", "done"));

    if (stepId === "step-1") {
      setTopoZoom("camera");
      pipeStages[0].classList.add("active");
      // car drives in from left -- 0 to 0.85 → translateX from -160 to ~stop position
      const stopX = simulator.clientWidth * 0.6 - 80;
      const startX = -160;
      const x = startX + (stopX - startX) * Math.min(1, p / 0.85);
      simCar.style.transform = `translateX(${x}px)`;
      simGate.classList.remove("open");
      ocrInsp.classList.remove("visible");
      ocrSpans.forEach(s => s.classList.remove("revealed"));
      simCone.classList.toggle("active", p > 0.6);
      if (p > 0.78 && !flashFired) {
        simFlash.classList.add("fire");
        flashFired = true;
        setTimeout(() => simFlash.classList.remove("fire"), 400);
        // emit camera event
        emitLog("camera", `LPUSH · frame_${String(frameCounter).padStart(4,"0")}.jpg`);
        emitLog("camera", `PUT s3://plate-bucket/frame_${String(frameCounter).padStart(4,"0")}.jpg`);
      }
      // architecture mirror
      setActiveTopo(["camera"]);
      if (p > 0.78) {
        setActiveTopo(["camera", "minio", "redis"]);
        activateEdges(["camera-redis", "camera-minio"]);
        animatePacket("camera-redis");
      }
    } else if (stepId === "step-2") {
      setTopoZoom("worker");
      flashFired = false;
      pipeStages[0].classList.add("done");
      pipeStages[1].classList.add("active");
      const stopX = simulator.clientWidth * 0.6 - 80;
      simCar.style.transform = `translateX(${stopX}px)`;
      simCone.classList.add("active");
      simGate.classList.remove("open");
      // ocr inspector reveals chars progressively
      ocrInsp.classList.add("visible");
      ocrFrame.textContent = String(frameCounter).padStart(4, "0");
      const reveal = Math.floor(p * (ocrSpans.length + 1));
      ocrSpans.forEach((s, i) => s.classList.toggle("revealed", i < reveal));
      if (reveal === ocrSpans.length) {
        ocrConf.textContent = "0.985";
        ocrLat.textContent = "418ms";
      } else {
        ocrConf.textContent = "— —";
        ocrLat.textContent = "scanning";
      }
      setActiveTopo(["redis", "worker", "minio"]);
      activateEdges(["worker-redis", "worker-minio"]);
      animatePacket("worker-redis");
    } else if (stepId === "step-3") {
      setTopoZoom("api");
      pipeStages[0].classList.add("done");
      pipeStages[1].classList.add("done");
      pipeStages[2].classList.add("active");
      const stopX = simulator.clientWidth * 0.6 - 80;
      simCar.style.transform = `translateX(${stopX}px)`;
      simCone.classList.remove("active");
      ocrInsp.classList.add("visible");
      ocrSpans.forEach(s => s.classList.add("revealed"));
      ocrConf.textContent = "0.985";
      ocrLat.textContent = "418ms";
      simGate.classList.remove("open");
      setActiveTopo(["worker", "api", "mysql"]);
      activateEdges(["worker-api", "api-mysql"]);
      animatePacket("worker-api");
    } else if (stepId === "step-4") {
      setTopoZoom("frontend");
      pipeStages[0].classList.add("done");
      pipeStages[1].classList.add("done");
      pipeStages[2].classList.add("done");
      pipeStages[3].classList.add("active");
      simGate.classList.add("open");
      ocrInsp.classList.remove("visible");
      // car exits to the right
      const stopX = simulator.clientWidth * 0.6 - 80;
      const exitX = simulator.clientWidth + 100;
      simCar.style.transform = `translateX(${stopX + (exitX - stopX) * p}px)`;
      simCone.classList.remove("active");
      setActiveTopo(["nginx", "frontend", "api"]);
      activateEdges(["nginx-frontend", "nginx-api"], true);
      animatePacket("nginx-frontend");

      // when complete, increment frame counter for next loop
      if (p > 0.9) {
        // ready for next cycle
      }
    }
  }

  /* ---------------------------------------------------------------------
     Ops log stream — runs continuously
     --------------------------------------------------------------------- */
  function pad(n, w=2) { return String(n).padStart(w, "0"); }
  function nowStamp() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randIp() { return `10.0.${randInt(1,4)}.${randInt(2,250)}`; }
  function randPlate() { return VC_PLATES[randInt(0, VC_PLATES.length - 1)]; }

  function fillMsg(tpl) {
    return tpl
      .replaceAll("{F}", String(randInt(200, 999)).padStart(4, "0"))
      .replaceAll("{T}", randInt(8, 480))
      .replaceAll("{C}", (0.93 + Math.random() * 0.069).toFixed(3))
      .replaceAll("{D}", randInt(0, 12))
      .replaceAll("{B}", randInt(2, 30))
      .replaceAll("{U}", randInt(800, 99999))
      .replaceAll("{P}", randPlate())
      .replaceAll("{R}", randInt(1000, 99999))
      .replaceAll("{IP}", randIp());
  }

  let opsCount = 0;
  function emitLog(svc, msg) {
    const tag = (svc || "system").toLowerCase();
    const line = document.createElement("div");
    line.className = "ops-line";
    line.innerHTML = `
      <span class="ts">${nowStamp()}</span>
      <span class="svc svc-${tag}">[${tag.toUpperCase().padEnd(8," ").slice(0,8)}]</span>
      <span class="msg">${msg}</span>
    `;
    opsStream.insertBefore(line, opsStream.firstChild);
    opsCount++;
    // trim old
    while (opsStream.children.length > 14) opsStream.removeChild(opsStream.lastChild);
  }

  function tickLog() {
    const item = VC_LOG_POOL[randInt(0, VC_LOG_POOL.length - 1)];
    emitLog(item.svc, fillMsg(item.msg));
  }
  // seed
  function seedLog() {
    for (let i = 0; i < 8; i++) tickLog();
  }
  seedLog();
  setInterval(tickLog, 1400);

  /* ---------------------------------------------------------------------
     Tech detail interaction
     --------------------------------------------------------------------- */
  techCards.forEach(card => {
    card.addEventListener("click", () => {
      techCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      const k = card.dataset.tech;
      const info = VC_TECH[k];
      if (!info) return;
      $("#tdTag").textContent = info.tag;
      $("#tdTitle").textContent = info.title;
      $("#tdBody").textContent = info.body;
      $("#tdCode").textContent = info.code;
      techDetail.classList.add("visible");

      // also focus topology
      const mapKey = { fastapi: "api", yolo: "worker", redis: "redis", minio: "minio", mysql: "mysql", nginx: "nginx" }[k];
      if (mapKey) {
        clearActiveTopo();
        setActiveTopo(mapKey);
        setTopoZoom(mapKey);
      }
    });
  });

  /* ---------------------------------------------------------------------
     Architecture exhibit triggers
     --------------------------------------------------------------------- */
  $$("[data-node-trigger]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.nodeTrigger;
      clearActiveTopo();
      setActiveTopo(id);
      setTopoZoom(id);
    });
  });

  /* ---------------------------------------------------------------------
     Side nav clicks
     --------------------------------------------------------------------- */
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const t = document.getElementById(btn.dataset.target);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------------------------------------------------------------------
     Tweaks panel
     --------------------------------------------------------------------- */
  const tweaksPanel = $("#tweaksPanel");
  $("#btnTweaks").addEventListener("click", () => tweaksPanel.classList.toggle("open"));
  $("#tweaksClose").addEventListener("click", () => tweaksPanel.classList.remove("open"));
  $$(".palette-card").forEach(card => {
    card.addEventListener("click", () => {
      $$(".palette-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      document.body.dataset.palette = card.dataset.palette;
    });
  });

  /* ---------------------------------------------------------------------
     Fullscreen
     --------------------------------------------------------------------- */
  $("#btnFs").addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "f" || e.key === "F") {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });

  /* ---------------------------------------------------------------------
     RAF scroll wiring
     --------------------------------------------------------------------- */
  let raf = null;
  window.addEventListener("scroll", () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(handleScroll);
  }, { passive: true });
  window.addEventListener("resize", handleScroll);

  // initial
  handleScroll();
  // preselect first tech card
  if (techCards[0]) techCards[0].click();
})();
