/* ============================================================
   M.O. SOUND LAB v0.4 — wiring for "The Disturbance Field"
   Drives sound-engine-v4.js (window.MOSound).
   ============================================================ */
(function () {
  "use strict";
  var S = window.MOSound;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- ENABLE GATE — entering the field is a moment ---- */
  var gate = $("#gate"), entered = false;
  function enter() {
    if (entered) return; entered = true;
    S.init(); S.unlock();
    S.setVolume($("#vol").value / 100);
    gate.classList.add("gone");
    setTimeout(function () { gate.style.display = "none"; }, 850);
    // a soft swell as the field comes online (Apple-style consent payoff)
    armField(true);
    setTimeout(function () { S.arrive(0); }, 300);
    syncMute();
  }
  gate.addEventListener("click", enter);
  window.addEventListener("keydown", function (e) { if (!entered) { enter(); } });

  /* ---------- MASTER BUS — scope + vol + mute ---------------- */
  var scope = $("#scope"), sctx = scope.getContext("2d"), busDot = $("#busDot");
  function sizeScope() { var r = scope.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); scope.width = r.width * dpr; scope.height = r.height * dpr; sctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  window.addEventListener("resize", sizeScope); sizeScope();
  var wave = new Float32Array(2048);
  function drawScope() {
    requestAnimationFrame(drawScope);
    var w = scope.clientWidth, h = scope.clientHeight;
    sctx.clearRect(0, 0, w, h);
    var on = S.ctx && !S.isMuted();
    busDot.classList.toggle("live", !!on);
    // baseline
    sctx.strokeStyle = "rgba(35,42,58,0.8)"; sctx.lineWidth = 1;
    sctx.beginPath(); sctx.moveTo(0, h / 2); sctx.lineTo(w, h / 2); sctx.stroke();
    if (!on) return;
    S.getWave(wave);
    sctx.strokeStyle = "#00f0c8"; sctx.lineWidth = 1.5; sctx.shadowColor = "#00f0c8"; sctx.shadowBlur = 6;
    sctx.beginPath();
    for (var i = 0; i < wave.length; i += 2) {
      var x = (i / wave.length) * w, y = h / 2 + wave[i] * h * 0.46;
      i === 0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
    }
    sctx.stroke(); sctx.shadowBlur = 0;
  }
  drawScope();

  var vol = $("#vol");
  vol.addEventListener("input", function () { S.setVolume(vol.value / 100); });
  var muteBtn = $("#muteBtn");
  function syncMute() {
    var m = S.isMuted();
    muteBtn.innerHTML = (m ? "○ muted" : "● live");
    muteBtn.style.color = m ? "var(--ghost)" : "var(--signal)";
  }
  muteBtn.addEventListener("click", function () { S.unlock(); S.toggleMute(); armField(!S.isMuted()); });
  S.onState(function () { syncMute(); });

  /* ---------- FIELD DIRECTIONS — A/B/C side by side --------- */
  var fieldsEl = $("#fields"), fields = S.getFields();
  function drawFieldVis(canvas, idx) {
    // little static "signature" waveform per field, distinct shapes
    var c = canvas.getContext("2d"), w = canvas.width, h = canvas.height, dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = canvas.clientWidth; h = canvas.clientHeight;
    c.clearRect(0, 0, w, h);
    var active = canvas.dataset.on === "1";
    c.strokeStyle = active ? "#00f0c8" : "#3a4256"; c.lineWidth = 1.4;
    if (active) { c.shadowColor = "#00f0c8"; c.shadowBlur = 6; }
    c.beginPath();
    for (var x = 0; x <= w; x++) {
      var t = x / w, y;
      if (idx === 0) y = h / 2 + Math.sin(t * 22) * Math.exp(-t * 2.2) * h * 0.4;          // VOID — crystalline ring
      else if (idx === 1) y = h / 2 + (Math.sin(t * 7) * 0.5 + Math.sin(t * 31) * 0.16) * h * 0.34; // BREATH — warm + air
      else y = h / 2 + Math.sin(t * 3.4) * Math.exp(-t * 0.5) * h * 0.42;                   // DEEP FIELD — slow swell
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke(); c.shadowBlur = 0;
  }
  var fieldVisCanvases = [];
  fields.forEach(function (f, i) {
    var el = document.createElement("div");
    el.className = "fcard" + (f.name === S.currentField() ? " on" : "");
    el.dataset.name = f.name;
    el.innerHTML =
      '<div class="fcard__row"><span class="fcard__tag">FIELD ' + String.fromCharCode(65 + i) + '</span><span class="fcard__led"></span></div>' +
      '<div class="fcard__name">' + f.label + '</div>' +
      '<div class="fcard__blurb">' + f.blurb + '</div>' +
      '<canvas class="fcard__vis" data-on="' + (f.name === S.currentField() ? "1" : "0") + '"></canvas>' +
      '<div class="fcard__cta"><span>' + (f.name === S.currentField() ? "● active field" : "○ make active") + '</span></div>';
    el.addEventListener("click", function () {
      S.unlock();
      S.setField(f.name);
      refreshFields();
      if (S.ready()) { S.arrive(0); }
    });
    fieldsEl.appendChild(el);
    var cv = $(".fcard__vis", el); fieldVisCanvases.push(cv);
  });
  function refreshFields() {
    $$(".fcard", fieldsEl).forEach(function (el, i) {
      var on = el.dataset.name === S.currentField();
      el.classList.toggle("on", on);
      $(".fcard__cta span", el).textContent = on ? "● active field" : "○ make active";
      fieldVisCanvases[i].dataset.on = on ? "1" : "0";
      drawFieldVis(fieldVisCanvases[i], i);
    });
  }
  setTimeout(function () { fieldVisCanvases.forEach(function (cv, i) { drawFieldVis(cv, i); }); }, 60);
  window.addEventListener("resize", function () { fieldVisCanvases.forEach(function (cv, i) { drawFieldVis(cv, i); }); });

  /* ---------- THE FIELD PROBE — node constellation ---------- */
  var fieldEl = $("#field"), linksEl = $("#links");
  // addr, x%, y%, size — 0x00 at center
  var NODES = [
    { addr: 0, x: 50, y: 50, r: 0, self: true, label: "0x00", sub: "self · root" },
    { addr: 1, x: 22, y: 26, r: 7, label: "0x01", sub: "node" },
    { addr: 2, x: 73, y: 20, r: 6, label: "0x02", sub: "node" },
    { addr: 3, x: 84, y: 44, r: 5, label: "0x03", sub: "node" },
    { addr: 4, x: 68, y: 72, r: 6, label: "0x04", sub: "node" },
    { addr: 5, x: 40, y: 80, r: 5, label: "0x05", sub: "node" },
    { addr: 6, x: 16, y: 64, r: 6, label: "0x06", sub: "node" },
    { addr: 7, x: 30, y: 44, r: 5, label: "0x07", sub: "node" },
    { addr: 8, x: 60, y: 36, r: 5, label: "0x08", sub: "node" },
    { addr: 9, x: 88, y: 68, r: 4, label: "0x09", sub: "far" },
    { addr: 10, x: 11, y: 38, r: 4, label: "0x0a", sub: "far" },
    { addr: 11, x: 52, y: 14, r: 4, label: "0x0b", sub: "far" }
  ];
  var nodeEls = {};
  function px(n) { return n.x; } // % units in svg viewBox 0..100
  NODES.forEach(function (n) {
    if (!n.self) {
      var l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", 50); l.setAttribute("y1", 50); l.setAttribute("x2", n.x); l.setAttribute("y2", n.y);
      l.setAttribute("stroke", "rgba(0,240,200,0.13)"); l.setAttribute("stroke-width", "0.25");
      linksEl.appendChild(l);
    }
    var el = document.createElement("div");
    el.className = "node" + (n.self ? " self" : "");
    el.style.left = n.x + "%"; el.style.top = n.y + "%";
    var size = n.self ? 34 : Math.max(7, n.r * 2);
    el.innerHTML = '<div class="node__dot" style="width:' + size + 'px;height:' + size + 'px"></div>' +
      '<div class="node__meta"><b>' + n.label + '</b>' + n.sub + '</div>';
    var xpan = (n.x - 50) / 50; // -1..1
    var depth = n.self ? 0 : Math.min(1, (Math.abs(n.x - 50) + Math.abs(n.y - 50)) / 80) * (1 - n.r / 8);
    el.addEventListener("mouseenter", function () { if (!S.ready()) return; S.hover(n.addr); flash(el); });
    el.addEventListener("click", function (e) {
      e.stopPropagation(); if (!S.ready()) { S.unlock(); }
      if (n.self) { S.gather(); } else { S.nodeLock(n.addr, { x: xpan }); }
      flash(el);
    });
    fieldEl.appendChild(el);
    nodeEls[n.addr] = el;
  });
  function flash(el) { el.classList.remove("ping"); void el.offsetWidth; el.classList.add("ping"); }
  // clicking empty field space = ring a random node where you clicked
  fieldEl.addEventListener("click", function (e) {
    if (e.target !== fieldEl && e.target !== linksEl) return;
    if (!S.ready()) { S.unlock(); return; }
    var rect = fieldEl.getBoundingClientRect();
    var xpan = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    S.nodePing(1 + Math.floor(Math.random() * 11), { vel: 0.7, x: xpan, depth: 0.3 });
  });

  /* ---------- FIELD-LEVEL METER — the disturbance, visible --- */
  var duckFill = $("#duckFill"), duckPct = $("#duckPct"), duckState = $("#duckState");
  (function tickMeter() {
    requestAnimationFrame(tickMeter);
    var d = S.ctx ? S.getDuck() : 1;
    duckFill.style.transform = "scaleX(" + Math.max(0.02, d) + ")";
    duckPct.textContent = Math.round(d * 100) + "%";
    if (d < 0.92) { duckState.textContent = "— disturbed"; duckState.style.color = "var(--signal)"; }
    else { duckState.textContent = "— at rest"; duckState.style.color = "var(--ghost)"; }
  })();

  /* ---------- FIELD BAR — arm / gather / scatter / arrive ---- */
  var fbField = $("#fbField");
  function armField(on) {
    S.field(on);
    fbField.classList.toggle("on", on);
    var lab = $(".fb__lab", fbField); if (lab) lab.textContent = on ? "field armed" : "arm the field";
  }
  fbField.addEventListener("click", function () { S.unlock(); armField(!S.fieldOn()); });
  $("#fbGather").addEventListener("click", function () { S.unlock(); pulse(this); S.gather(); });
  $("#fbScatter").addEventListener("click", function () { S.unlock(); pulse(this); S.scatter(); });
  $("#fbArrive").addEventListener("click", function () { S.unlock(); pulse(this); S.arrive(0); });
  function pulse(el) { el.classList.add("on"); setTimeout(function () { el.classList.remove("on"); }, 240); }

  /* ---------- KNOBS — presence / wetness -------------------- */
  var presence = $("#presence"), wetness = $("#wetness"), presVal = $("#presVal"), wetVal = $("#wetVal");
  presence.addEventListener("input", function () { var v = presence.value / 100; presVal.textContent = v.toFixed(2); S.setPresence(v); });
  wetness.addEventListener("input", function () { var v = wetness.value / 100; wetVal.textContent = v.toFixed(2); S.setWetness(v); });
  // init displays from engine state
  presence.value = Math.round(S.getPresence() * 100); presVal.textContent = S.getPresence().toFixed(2);
  wetness.value = Math.round(S.getWetness() * 100); wetVal.textContent = S.getWetness().toFixed(2);

  /* ---------- KEYCAP — press & release ---------------------- */
  var keycap = $("#keycap"), keyDown = false;
  function down() { if (keyDown) return; keyDown = true; S.unlock(); keycap.classList.add("down"); S.thock({ vel: 0.85 }); }
  function up() { if (!keyDown) return; keyDown = false; keycap.classList.remove("down"); S.thockUp(); }
  keycap.addEventListener("mousedown", down); keycap.addEventListener("mouseup", up); keycap.addEventListener("mouseleave", up);
  keycap.addEventListener("touchstart", function (e) { e.preventDefault(); down(); }, { passive: false });
  keycap.addEventListener("touchend", function (e) { e.preventDefault(); up(); }, { passive: false });
  window.addEventListener("keydown", function (e) { if (e.repeat) return; if (e.key === "Enter" || e.code === "Space") { down(); } });
  window.addEventListener("keyup", function (e) { if (e.key === "Enter" || e.code === "Space") { up(); } });

  /* ---------- SCROLL — motion through the field ------------- */
  var pane = $("#scrollpane"), inner = $("#scrollinner"), vel = $("#velReadout");
  var rows = ["entering the field", "drifting past 0x07", "a distant node passes left", "deeper — the sub bends", "0x03 sweeps by, right", "the space opens", "layers of resonance", "nodes thinning out", "0x0a, very far", "near the edge now", "atonal shimmer", "the field recovers", "almost still", "you are alone again", "0x00 hums beneath", "the void holds", "one more layer", "depth increases", "a ping, far off", "the bottom of the field"];
  var html = "";
  rows.forEach(function (r, i) { html += '<div class="scrollpane__row"><span>' + String(i).padStart(2, "0") + ' · ' + r + '</span><em>0x' + (i).toString(16).padStart(2, "0") + '</em></div>'; });
  inner.innerHTML = html + html;
  var lastTop = 0, lastT = performance.now(), curVel = 0;
  pane.addEventListener("scroll", function () {
    var now = performance.now(), dt = Math.max(16, now - lastT);
    var dy = pane.scrollTop - lastTop;
    curVel = dy / dt * 16; lastTop = pane.scrollTop; lastT = now;
    if (S.ready()) S.scroll(curVel);
    vel.textContent = Math.round(Math.abs(curVel));
  });

  /* ---------- VOLUME TOGGLE — three live forms -------------- */
  // EQ bars (option A) — driven by real output bands
  var eqA = $$("#eqA i");
  (function eqTick() {
    requestAnimationFrame(eqTick);
    var on = S.ctx && !S.isMuted();
    var bands = on ? S.getBands(eqA.length) : null;
    for (var i = 0; i < eqA.length; i++) {
      var hpx = on ? (3 + bands[i] * 11) : 3;
      eqA[i].style.height = hpx.toFixed(1) + "px";
    }
  })();
  // speaker glyph (option B)
  var spk = $("#spk"), spkLabel = $("#spkLabel");
  function drawSpeaker() {
    var on = S.ctx && !S.isMuted();
    spk.innerHTML = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">' +
      '<path d="M2 6 L2 10 L5 10 L9 13 L9 3 L5 6 Z" fill="currentColor" stroke="none"/>' +
      (on ? '<path d="M11.5 5.5 Q13.2 8 11.5 10.5"/><path d="M13 4 Q15.5 8 13 12"/>'
          : '<path d="M11.5 5.5 L14.5 10.5 M14.5 5.5 L11.5 10.5"/>') +
      '</svg>';
    spkLabel.textContent = on ? "sound on" : "sound off";
  }
  // fader (option C)
  var faderFill = $("#faderFill"), faderThumb = $("#faderThumb");
  function drawFader() {
    var on = S.ctx && !S.isMuted();
    var v = on ? S.getVolume() : 0;
    var pct = (v * 100).toFixed(0) + "%";
    faderFill.style.width = pct; faderThumb.style.left = pct;
    faderFill.style.opacity = on ? "1" : "0.25";
  }
  function refreshToggles() { drawSpeaker(); drawFader(); }
  refreshToggles();
  S.onState(function () { refreshToggles(); });

  // clicking any of the three toggles audio (and arms/disarms the field)
  $$(".optBtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      S.unlock(); S.toggleMute(); armField(!S.isMuted()); refreshToggles();
    });
  });
  // "use this one" pick buttons — persist the choice
  var LS_PICK = "mo_snd_toggle_pick";
  function markPick(opt) {
    try { localStorage.setItem(LS_PICK, opt); } catch (e) {}
    $$(".opt").forEach(function (o) {
      var on = o.dataset.opt === opt;
      o.classList.toggle("pick", on);
      $(".optPickTag", o).textContent = on ? "✓ picked" : "";
    });
  }
  $$("[data-pick]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); markPick(b.dataset.pick); }); });
  try { var saved = localStorage.getItem(LS_PICK); if (saved) markPick(saved); } catch (e) {}

})();
