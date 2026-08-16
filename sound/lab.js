/* ============================================================
   M.O. — Sound Lab v0.2 interactions (tuned constellation)
   ============================================================ */
(function () {
  var S = window.MOSound;

  // ---- gate / unlock ----------------------------------------
  var gate = document.getElementById("gate");
  function start() {
    S.unlock();
    gate.style.transition = "opacity .4s"; gate.style.opacity = "0";
    setTimeout(function () { gate.remove(); }, 420);
    // boot: nodes enumerate online, then 0x00 assembles
    var total = 8;
    for (var i = 0; i < total; i++) (function (i) { setTimeout(function () { S.bootEnumerate(i, total); }, i * 110); })(i);
    // bring the self online a moment later
    setTimeout(function () { S.carrier(true); syncFB(); }, total * 110 + 400);
  }
  gate.addEventListener("click", start);

  // ---- master scope -----------------------------------------
  var scope = document.getElementById("scope"), sctx = scope.getContext("2d");
  var busDot = document.getElementById("busDot");
  var wave = new Float32Array(1024);
  var barWraps = document.querySelectorAll(".vbtn-bars");
  function sizeScope() { var r = scope.getBoundingClientRect(); scope.width = r.width * devicePixelRatio; scope.height = r.height * devicePixelRatio; }
  window.addEventListener("resize", sizeScope);
  function draw() {
    requestAnimationFrame(draw);
    if (!scope.width) sizeScope();
    var w = scope.width, h = scope.height;
    sctx.clearRect(0, 0, w, h);
    sctx.strokeStyle = "rgba(35,42,58,0.8)"; sctx.lineWidth = devicePixelRatio;
    sctx.beginPath(); sctx.moveTo(0, h / 2); sctx.lineTo(w, h / 2); sctx.stroke();
    var lvl = 0;
    S.getWave(wave);
    sctx.strokeStyle = "#00f0c8"; sctx.lineWidth = 1.4 * devicePixelRatio;
    sctx.shadowColor = "#00f0c8"; sctx.shadowBlur = 8 * devicePixelRatio;
    sctx.beginPath();
    for (var i = 0; i < wave.length; i++) {
      var x = (i / wave.length) * w, y = h / 2 + wave[i] * h * 0.46;
      i === 0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
      var a = Math.abs(wave[i]); if (a > lvl) lvl = a;
    }
    sctx.stroke(); sctx.shadowBlur = 0;
    busDot.classList.toggle("live", lvl > 0.02);
    animBars(lvl);
  }
  draw();

  // ---- master controls --------------------------------------
  var vol = document.getElementById("vol"), muteBtn = document.getElementById("muteBtn");
  vol.addEventListener("input", function () { S.setVolume(vol.value / 100); });
  function renderMute(st) {
    vol.value = Math.round(st.volume * 100);
    muteBtn.innerHTML = st.muted
      ? '<span class="vbtn-bars" style="opacity:.4"><i></i><i></i><i></i><i></i></span> muted'
      : '<span class="vbtn-bars"><i></i><i></i><i></i><i></i></span> sound on';
  }
  S.onState(renderMute);
  muteBtn.addEventListener("click", function () { S.unlock(); S.toggleMute(); });

  // ---- CONCEPT SELECTOR -------------------------------------
  var conceptsEl = document.getElementById("concepts");
  S.getVoicings().forEach(function (vc) {
    var el = document.createElement("div");
    el.className = "concept" + (vc.name === S.currentVoicing() ? " on" : "");
    el.setAttribute("data-v", vc.name);
    el.innerHTML = '<div class="concept__led"></div><div class="concept__name">' + vc.label + '</div><div class="concept__blurb">' + vc.blurb + '</div>';
    el.addEventListener("click", function () {
      S.unlock(); S.setVoicing(vc.name);
      conceptsEl.querySelectorAll(".concept").forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-v") === vc.name); });
      refreshLabels();
      // quick preview: a node ping + a soft gather tail
      S.nodePing(4, { x: 0.3 }); setTimeout(function () { S.nodePing(2, { x: -0.4, depth: 0.3 }); }, 140);
    });
    conceptsEl.appendChild(el);
  });

  function refreshLabels() {
    NODES.forEach(function (n) { var m = n.el && n.el.querySelector(".node__meta"); if (m) m.innerHTML = '<b>' + hex(n.a) + '</b>' + note(n.a); });
    var sm = SELF.el && SELF.el.querySelector(".node__meta"); if (sm) sm.innerHTML = '<b>' + hex(0) + '</b>' + note(0);
    var cells = document.querySelectorAll("#tune .tune__cell");
    cells.forEach(function (c, i) { var hz = c.querySelector(".tune__hz"); if (hz && TUNE[i]) hz.textContent = note(TUNE[i].a) + " · " + TUNE[i].lab; });
  }

  // ---- THE NODE FIELD ---------------------------------------
  var field = document.getElementById("field");
  var links = document.getElementById("links");
  // scattered project nodes — addr, x%, y%, depth(0 near..1 far)
  var NODES = [
    { a: 1, x: 22, y: 30, d: 0.1 }, { a: 2, x: 74, y: 22, d: 0.2 },
    { a: 3, x: 16, y: 66, d: 0.35 }, { a: 4, x: 84, y: 58, d: 0.15 },
    { a: 5, x: 38, y: 18, d: 0.5 }, { a: 6, x: 62, y: 76, d: 0.4 },
    { a: 7, x: 30, y: 82, d: 0.6 }, { a: 8, x: 88, y: 36, d: 0.55 },
    { a: 9, x: 12, y: 44, d: 0.7 }, { a: 10, x: 68, y: 44, d: 0.3 },
    { a: 11, x: 46, y: 60, d: 0.45 }
  ];
  var SELF = { a: 0, x: 50, y: 50 };
  var hex = function (n) { return "0x" + n.toString(16).toUpperCase().padStart(2, "0"); };
  var note = function (a) { return Math.round(S.nodeFreq(a)) + "Hz"; };

  function placeNode(n, isSelf) {
    var el = document.createElement("div");
    el.className = "node" + (isSelf ? " self" : "");
    el.style.left = n.x + "%"; el.style.top = n.y + "%";
    var size = isSelf ? 34 : Math.round(16 - n.d * 8);   // far = smaller
    var dim = isSelf ? "" : 'style="width:' + size + 'px;height:' + size + 'px;opacity:' + (1 - n.d * 0.5).toFixed(2) + '"';
    el.innerHTML = '<div class="node__dot" ' + dim + '></div>' +
      '<div class="node__meta"><b>' + hex(n.a) + '</b>' + note(n.a) + '</div>';
    field.appendChild(el);
    n.el = el;
    var px = function () { return (n.x - 50) / 50; };
    var fire = function (lock) {
      S.unlock();
      if (lock) S.nodeLock(n.a, { x: px() }); else S.nodePing(n.a, { x: px(), depth: n.d });
      el.classList.remove("ping"); void el.offsetWidth; el.classList.add("ping");
      drawLink(n);
    };
    var lastHover = 0;
    el.addEventListener("mouseenter", function () { var t = Date.now(); if (t - lastHover > 90) { lastHover = t; fire(false); } });
    el.addEventListener("click", function (e) { e.stopPropagation(); fire(true); });
    return n;
  }
  NODES.forEach(function (n) { placeNode(n, false); });
  placeNode(SELF, true);

  // connection line from a node to 0x00, fading out
  function drawLink(n) {
    var ns = "http://www.w3.org/2000/svg";
    var ln = document.createElementNS(ns, "line");
    ln.setAttribute("x1", n.x); ln.setAttribute("y1", n.y);
    ln.setAttribute("x2", SELF.x); ln.setAttribute("y2", SELF.y);
    ln.setAttribute("stroke", "#00f0c8"); ln.setAttribute("stroke-width", "0.25");
    ln.setAttribute("opacity", "0.7");
    links.appendChild(ln);
    var op = 0.7;
    var fade = setInterval(function () {
      op -= 0.04; ln.setAttribute("opacity", String(Math.max(0, op)));
      if (op <= 0) { clearInterval(fade); ln.remove(); }
    }, 40);
  }

  // field control bar
  var fbGather = document.getElementById("fbGather"), fbScatter = document.getElementById("fbScatter");
  var fbCarrier = document.getElementById("fbCarrier"), fbConst = document.getElementById("fbConst");
  function flash(el) { el.classList.add("on"); setTimeout(function () { el.classList.remove("on"); }, 400); }
  fbGather.addEventListener("click", function () { S.unlock(); S.gather(); flash(fbGather); NODES.forEach(function (n, i) { setTimeout(function () { drawLink(n); }, i * 60); }); });
  fbScatter.addEventListener("click", function () { S.unlock(); S.scatter(); flash(fbScatter); });
  fbCarrier.addEventListener("click", function () { S.unlock(); S.carrier(!S.carrierOn()); syncFB(); });
  fbConst.addEventListener("click", function () { S.unlock(); S.constellation(!S.constellationOn()); syncFB(); });
  function syncFB() {
    fbCarrier.classList.toggle("on", S.carrierOn());
    fbConst.classList.toggle("on", S.constellationOn());
  }
  // reflect constellation pings on the field visually
  setInterval(function () {
    if (!S.constellationOn()) return;
    // pick a random node, flash it (approximate visual sync)
    if (Math.random() < 0.5) { var n = NODES[Math.floor(Math.random() * NODES.length)]; n.el.classList.remove("ping"); void n.el.offsetWidth; n.el.classList.add("ping"); }
  }, 1100);

  // ---- TUNING explainer -------------------------------------
  var tune = document.getElementById("tune");
  var TUNE = [
    { a: 0, r: "1", lab: "root · self" }, { a: 1, r: "1", lab: "unison" },
    { a: 2, r: "9⁄8", lab: "major 2nd" }, { a: 3, r: "5⁄4", lab: "major 3rd" },
    { a: 4, r: "3⁄2", lab: "fifth" }, { a: 5, r: "5⁄3", lab: "major 6th" }
  ];
  TUNE.forEach(function (c) {
    var el = document.createElement("div");
    el.className = "tune__cell" + (c.a === 0 ? " root" : "");
    el.innerHTML = '<div class="tune__addr">' + hex(c.a) + '</div>' +
      '<div class="tune__ratio">' + c.r + '</div>' +
      '<div class="tune__hz">' + note(c.a) + ' · ' + c.lab + '</div>';
    el.addEventListener("click", function () { S.unlock(); S.nodePing(c.a, { x: 0 }); });
    tune.appendChild(el);
  });

  // ---- SYSTEM VOICES ----------------------------------------
  var voices = [
    { no: "V-01", name: "node ping", desc: "Hover a project tile. A modal resonator pitched to that node, panned to its place in space.", fn: function () { S.nodePing(2, { x: -0.4, depth: 0.2 }); } },
    { no: "V-02", name: "node lock", desc: "Open a project — a handshake: ping out, then an octave-up ACK from the other side.", fn: function () { S.nodeLock(4, { x: 0.4 }); } },
    { no: "V-03", name: "gather → 0x00", desc: "Scattered pings converge into the root chord. The hero field assembling into you.", fn: function () { S.gather(); } },
    { no: "V-04", name: "scatter", desc: "Dispersal — nodes fly outward into the universe as you return to drift.", fn: function () { S.scatter(); } },
    { no: "V-05", name: "0x00 beacon", desc: "A single pulse of the omnipresent self — stereo-spread, because you're everywhere.", fn: function () { S.nodePing(0, { x: -0.85, depth: 0.4 }); S.nodePing(0, { x: 0.85, depth: 0.5, mult: 2 }); } },
    { no: "V-06", name: "boot enumerate", desc: "Nodes coming online one by one through your terminal sequence, ending in 0x00.", fn: function () { for (var i = 0; i < 8; i++) (function (i) { setTimeout(function () { S.bootEnumerate(i, 8); }, i * 110); })(i); } }
  ];
  var grid = document.getElementById("voiceGrid");
  voices.forEach(function (v) {
    var c = document.createElement("div"); c.className = "card";
    c.innerHTML = '<div class="card__play">▶ play</div><div class="card__no">' + v.no + '</div><div class="card__name">' + v.name + '</div><div class="card__desc">' + v.desc + '</div>';
    c.addEventListener("click", function () { S.unlock(); v.fn(); c.classList.add("hit"); setTimeout(function () { c.classList.remove("hit"); }, 320); });
    grid.appendChild(c);
  });

  // ---- KEYCAP -----------------------------------------------
  var keycap = document.getElementById("keycap");
  function pressKey() { S.unlock(); keycap.classList.add("down"); S.thock({ vel: 0.85 }); }
  function releaseKey() { if (!keycap.classList.contains("down")) return; keycap.classList.remove("down"); S.thockUp(); }
  keycap.addEventListener("mousedown", pressKey);
  keycap.addEventListener("mouseup", releaseKey);
  keycap.addEventListener("mouseleave", releaseKey);
  keycap.addEventListener("touchstart", function (e) { e.preventDefault(); pressKey(); }, { passive: false });
  keycap.addEventListener("touchend", releaseKey);
  window.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !e.repeat && gate.parentNode == null) pressKey(); });
  window.addEventListener("keyup", function (e) { if (e.key === "Enter" || e.key === " ") releaseKey(); });

  // ---- SCROLL demo ------------------------------------------
  var pane = document.getElementById("scrollpane"), inner = document.getElementById("scrollinner"), velReadout = document.getElementById("velReadout");
  var rows = ["boot", "token", "fib-grid", "cursor", "universe", "three.js", "wafer.glb", "kerfur", "zmk", "matrix", "render", "signal", "shell", "origin", "drift", "ready"];
  for (var r = 0; r < 4; r++) rows.forEach(function (t, i) {
    var d = document.createElement("div"); d.className = "scrollpane__row";
    d.textContent = "› node " + (r * 16 + i).toString(16).padStart(2, "0") + "  —  " + t; inner.appendChild(d);
  });
  var lastTop = 0, lastT = performance.now();
  pane.addEventListener("scroll", function () {
    var now = performance.now(), dt = Math.max(1, now - lastT);
    var v = (pane.scrollTop - lastTop) / dt * 16; lastTop = pane.scrollTop; lastT = now;
    S.unlock(); S.scroll(v); velReadout.textContent = Math.abs(Math.round(v));
  }, { passive: true });
  setInterval(function () { var n = parseInt(velReadout.textContent, 10) || 0; if (n > 0) velReadout.textContent = Math.max(0, n - 4); S.scroll(0); }, 120);

  // ---- TOGGLE BUTTON OPTIONS --------------------------------
  document.querySelectorAll(".optBtn").forEach(function (b) {
    b.addEventListener("click", function () {
      S.unlock();
      if (b.getAttribute("data-opt") === "c") {
        var v = S.getVolume(), next = S.isMuted() || v === 0 ? 0.5 : (v < 0.99 ? 1 : 0);
        if (next === 0) S.setMuted(true); else S.setVolume(next);
      } else S.toggleMute();
      syncOpts();
    });
  });
  var spk = document.getElementById("spk"), spkLabel = document.getElementById("spkLabel"), faderFill = document.getElementById("faderFill");
  function svgSpeaker(on) {
    var waves = on ? '<path d="M9 5 Q12 7 12 7 Q12 7 9 9" stroke="currentColor" fill="none" stroke-width="1.2"/><path d="M10.5 3.5 Q14 7 10.5 10.5" stroke="currentColor" fill="none" stroke-width="1.2"/>'
                   : '<line x1="9.5" y1="4.5" x2="13.5" y2="9.5" stroke="currentColor" stroke-width="1.2"/><line x1="13.5" y1="4.5" x2="9.5" y2="9.5" stroke="currentColor" stroke-width="1.2"/>';
    return '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M2 5.2 H4 L6.5 3 V11 L4 8.8 H2 Z" fill="currentColor"/>' + waves + '</svg>';
  }
  function syncOpts() {
    var on = !S.isMuted() && S.getVolume() > 0;
    spk.innerHTML = svgSpeaker(on); spkLabel.textContent = on ? "sound on" : "muted";
    faderFill.style.width = (S.isMuted() ? 0 : S.getVolume() * 100) + "%";
  }
  function animBars(lvl) {
    if (!barWraps || !barWraps.length) return;
    var on = !S.isMuted();
    barWraps.forEach(function (w) {
      var bars = w.children;
      for (var i = 0; i < bars.length; i++) {
        if (!on) { bars[i].style.height = "2px"; bars[i].style.opacity = ".4"; continue; }
        var base = [4, 8, 12, 7][i];
        bars[i].style.height = Math.min(13, base * (0.5 + lvl * 3 * Math.random())) + "px";
        bars[i].style.opacity = "1";
      }
    });
  }
  S.onState(syncOpts); syncOpts(); sizeScope();
})();
