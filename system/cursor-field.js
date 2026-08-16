/* ============================================================
   M.O. SYSTEM | CURSOR FIELD

   A single foreground probe with a restrained, speed-gated wake.
   The wake borrows the Universe's screen-paint idea without copying
   its WebGL fluid pass: one continuous filament, one energy lens,
   no particles. Pointer input and rendering are decoupled so the
   probe keeps continuity under fast changes of direction.
   ============================================================ */
(function () {
  "use strict";

  if (window.MOCursorField) return;
  window.__mo_cursor_field = true;

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var html = document.documentElement;
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var lastFrame = 0;
  var enabled = false;
  var inside = false;
  var pressed = false;
  var mode = "idle";

  var pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastX: 0,
    lastY: 0,
    lastAt: 0,
    ready: false,
  };

  var head = { x: 0, y: 0 };
  var flow = { vx: 0, vy: 0, energy: 0 };
  var trail = [];
  var TRAIL_POINTS = 7;

  var publicState = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    energy: 0,
    active: false,
  };

  function onMediaChange(query, handler) {
    if (query.addEventListener) query.addEventListener("change", handler);
    else if (query.addListener) query.addListener(handler);
  }

  function isSuppressed() {
    return document.hidden || html.classList.contains("mo-origin-on");
  }

  function setCanvasVisible(value) {
    if (!canvas) return;
    var show = !!(value && enabled && inside && !isSuppressed());
    var next = show ? "true" : "false";
    if (canvas.dataset.visible !== next) canvas.dataset.visible = next;
    publicState.active = show;
  }

  function clear() {
    if (ctx) ctx.clearRect(0, 0, width, height);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;
  }

  function resetAt(x, y) {
    pointer.x = pointer.lastX = head.x = x;
    pointer.y = pointer.lastY = head.y = y;
    pointer.vx = pointer.vy = pointer.speed = 0;
    flow.vx = flow.vy = flow.energy = 0;
    pointer.lastAt = performance.now();
    pointer.ready = true;
    trail = [];
    for (var i = 0; i < TRAIL_POINTS; i++) trail.push({ x: x, y: y });
  }

  function resize() {
    if (!canvas || !ctx) return;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (pointer.ready) resetAt(
      Math.max(0, Math.min(width, pointer.x)),
      Math.max(0, Math.min(height, pointer.y))
    );
  }

  function resolveMode(target) {
    if (!target || target.nodeType !== 1 || !target.closest) return "idle";
    if (target.closest("[data-cursor='grab'], .universeBg, .bus3d")) return "grab";
    if (target.closest(
      "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), " +
      "select:not([disabled]), summary, [role='button'], [data-hot], [tabindex]:not([tabindex='-1'])"
    )) return "hot";
    return "idle";
  }

  function drawReticle(x, y, energy) {
    var hot = mode !== "idle";
    var radius = (hot ? 9 : 7) + energy * 2.2 - (pressed ? 1.5 : 0);
    var arm = hot ? 3.5 : 3;
    var color = hot ? "rgba(0, 229, 181, .96)" : "rgba(223, 229, 236, .88)";

    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(-radius, -radius + arm); ctx.lineTo(-radius, -radius); ctx.lineTo(-radius + arm, -radius);
    ctx.moveTo(radius - arm, -radius); ctx.lineTo(radius, -radius); ctx.lineTo(radius, -radius + arm);
    ctx.moveTo(radius, radius - arm); ctx.lineTo(radius, radius); ctx.lineTo(radius - arm, radius);
    ctx.moveTo(-radius + arm, radius); ctx.lineTo(-radius, radius); ctx.lineTo(-radius, radius - arm);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, hot ? 1.25 : 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFlow(energy) {
    if (energy < 0.012) return;

    var speed = Math.hypot(flow.vx, flow.vy);
    var angle = speed > 0.001 ? Math.atan2(flow.vy, flow.vx) : 0;
    var radius = 13 + energy * 23;

    /* One self-contained energy lens. It stretches with acceleration but
       never sheds dots or particles into the interface. */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);
    ctx.scale(1 + energy * 1.45, 0.78);
    var glow = ctx.createRadialGradient(-radius * 0.12, 0, 0, 0, 0, radius);
    glow.addColorStop(0, "rgba(104, 255, 151, " + (0.10 + energy * 0.13).toFixed(3) + ")");
    glow.addColorStop(0.34, "rgba(0, 216, 181, " + (0.055 + energy * 0.08).toFixed(3) + ")");
    glow.addColorStop(1, "rgba(0, 216, 181, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* The Lusion-like memory is a single advected filament. */
    var tail = trail[trail.length - 1];
    var gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    gradient.addColorStop(0, "rgba(91, 255, 157, " + (0.12 + energy * 0.28).toFixed(3) + ")");
    gradient.addColorStop(0.45, "rgba(0, 216, 181, " + (energy * 0.12).toFixed(3) + ")");
    gradient.addColorStop(1, "rgba(0, 216, 181, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.7 + energy * 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (var i = 1; i < trail.length - 1; i++) {
      var next = trail[i + 1];
      var mx = (trail[i].x + next.x) * 0.5;
      var my = (trail[i].y + next.y) * 0.5;
      ctx.quadraticCurveTo(trail[i].x, trail[i].y, mx, my);
    }
    ctx.lineTo(tail.x, tail.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawStatic() {
    if (!pointer.ready || !enabled || !inside || isSuppressed()) {
      clear();
      setCanvasVisible(false);
      return;
    }
    clear();
    drawReticle(pointer.x, pointer.y, 0);
    setCanvasVisible(true);
    publicState.x = pointer.x;
    publicState.y = pointer.y;
    publicState.vx = publicState.vy = publicState.speed = publicState.energy = 0;
  }

  function frame(now) {
    raf = 0;
    if (!enabled || !inside || !pointer.ready || isSuppressed()) {
      clear();
      setCanvasVisible(false);
      return;
    }

    var dt = lastFrame ? Math.min(34, Math.max(8, now - lastFrame)) : 16.667;
    lastFrame = now;
    var step = dt / 16.667;
    var followK = 1 - Math.pow(0.34, step);
    var velocityK = 1 - Math.pow(0.55, step);

    head.x += (pointer.x - head.x) * followK;
    head.y += (pointer.y - head.y) * followK;
    flow.vx += (pointer.vx - flow.vx) * velocityK;
    flow.vy += (pointer.vy - flow.vy) * velocityK;

    if (now - pointer.lastAt > 36) {
      var decay = Math.pow(0.52, step);
      pointer.vx *= decay;
      pointer.vy *= decay;
      pointer.speed *= decay;
    }

    var targetEnergy = Math.min(1, pointer.speed / 1.35);
    var energyK = targetEnergy > flow.energy
      ? 1 - Math.pow(0.48, step)
      : 1 - Math.pow(0.82, step);
    flow.energy += (targetEnergy - flow.energy) * energyK;

    trail[0].x = head.x;
    trail[0].y = head.y;
    for (var i = 1; i < trail.length; i++) {
      var trailK = (1 - Math.pow(0.62, step)) * (1 - i * 0.055);
      trail[i].x += (trail[i - 1].x - trail[i].x) * Math.max(0.09, trailK);
      trail[i].y += (trail[i - 1].y - trail[i].y) * Math.max(0.09, trailK);
    }

    clear();
    drawFlow(flow.energy);
    drawReticle(head.x, head.y, flow.energy);
    setCanvasVisible(true);

    publicState.x = head.x;
    publicState.y = head.y;
    publicState.vx = flow.vx;
    publicState.vy = flow.vy;
    publicState.speed = pointer.speed;
    publicState.energy = flow.energy;

    var distance = Math.hypot(pointer.x - head.x, pointer.y - head.y);
    if (flow.energy > 0.003 || distance > 0.08 || pointer.speed > 0.003) requestFrame();
  }

  function requestFrame() {
    if (!raf && enabled && !reduceMotion.matches && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onPointerMove(event) {
    if (!enabled || event.pointerType === "touch") return;
    var now = performance.now();
    var x = event.clientX;
    var y = event.clientY;
    var elapsed = now - pointer.lastAt;
    var distance = pointer.ready ? Math.hypot(x - pointer.lastX, y - pointer.lastY) : 0;
    var discontinuity = !pointer.ready || elapsed > 180 || distance > Math.max(180, Math.min(width, height) * 0.34);

    if (discontinuity) {
      resetAt(x, y);
    } else {
      var sampleTime = Math.max(4, elapsed);
      pointer.vx = (x - pointer.lastX) / sampleTime;
      pointer.vy = (y - pointer.lastY) / sampleTime;
      pointer.speed = Math.min(2.2, Math.hypot(pointer.vx, pointer.vy));
      pointer.x = x;
      pointer.y = y;
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.lastAt = now;
    }

    inside = true;
    var nextMode = resolveMode(event.target);
    if (nextMode !== mode) {
      mode = nextMode;
      canvas.dataset.mode = mode;
    }
    setCanvasVisible(true);

    if (reduceMotion.matches) drawStatic();
    else requestFrame();
  }

  function onPointerDown(event) {
    if (!enabled || event.pointerType === "touch") return;
    pressed = true;
    pointer.speed = Math.max(pointer.speed, 0.18);
    requestFrame();
  }

  function onPointerUp() {
    pressed = false;
    requestFrame();
  }

  function onWindowLeave(event) {
    if (event.relatedTarget) return;
    inside = false;
    pointer.ready = false;
    stop();
    clear();
    setCanvasVisible(false);
  }

  function onVisibilityChange() {
    stop();
    lastFrame = 0;
    pointer.ready = false;
    clear();
    setCanvasVisible(false);
  }

  function updateAvailability() {
    // Never suppress the native pointer unless the replacement canvas has a
    // live 2D context. This keeps navigation usable in restricted browsers.
    enabled = !!(finePointer.matches && ctx);
    html.classList.toggle("mo-cursor-enabled", enabled);
    if (canvas) canvas.hidden = !enabled;
    if (!enabled) {
      inside = false;
      pointer.ready = false;
      stop();
      clear();
      setCanvasVisible(false);
    }
  }

  function mount() {
    if (canvas || !document.body) return;
    canvas = document.createElement("canvas");
    canvas.className = "mo-cursor-field";
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.visible = "false";
    canvas.dataset.mode = "idle";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    resize();
    updateAvailability();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("mouseout", onWindowLeave, { passive: true });
    window.addEventListener("blur", onVisibilityChange);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("mo:preloader-done", function () {
      if (pointer.ready && inside) {
        setCanvasVisible(true);
        if (reduceMotion.matches) drawStatic();
        else requestFrame();
      }
    });
    onMediaChange(finePointer, updateAvailability);
    onMediaChange(reduceMotion, function () {
      stop();
      flow.energy = 0;
      if (reduceMotion.matches) drawStatic();
      else requestFrame();
    });
  }

  window.MOCursorField = {
    state: publicState,
    refresh: updateAvailability,
  };

  updateAvailability();
  if (document.body) {
    mount();
  } else {
    var bodyPoll = window.setInterval(function () {
      if (!document.body) return;
      window.clearInterval(bodyPoll);
      mount();
    }, 16);
    document.addEventListener("DOMContentLoaded", function () {
      window.clearInterval(bodyPoll);
      mount();
    }, { once: true });
  }
})();
