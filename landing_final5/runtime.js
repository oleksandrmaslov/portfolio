/* GENERATED FILE — do not edit directly.
   Sources and order are declared in tools/build-final5-runtime.cjs. */

/* ---- system/core.jsx#Cursor ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useRef = _React.useRef;
/* ============================================================
   CURSOR — adaptive probe
   ============================================================ */
function Cursor() {
  var ref = useRef(null);
  var coordRef = useRef(null);
  var _useState = useState("idle"),
    _useState2 = _slicedToArray(_useState, 2),
    mode = _useState2[0],
    setMode = _useState2[1]; // idle | hot | probe | grab

  useEffect(function () {
    document.documentElement.classList.add("custom-cursor");
    var node = ref.current;

    // Two decoupled jobs on mousemove:
    //   1. position + live pixel readout  → written DIRECTLY to the DOM once
    //      per display frame, so high-rate mice cannot flood style/text writes.
    //   2. hover-target detection (elementFromPoint + .closest tree-walks) →
    //      this is the genuinely expensive part, so it's time-throttled and the
    //      mode state only updates when it actually changes.
    var px = 0,
      py = 0,
      lastMode = "idle",
      lastProbe = 0,
      raf = 0;
    var HOT = "button, a, .node, .swatch, .curve, .family, .compBlock, .t-link, [data-hot]";
    var writeCoords = function writeCoords() {
      var c = coordRef.current;
      if (c) c.textContent = String(px).padStart(4, "0") + " / " + String(py).padStart(4, "0");
    };
    var probe = function probe(now) {
      if (now - lastProbe < 60) return; // ~16 hit-tests/sec is plenty for mode
      lastProbe = now;
      var el = document.elementFromPoint(px, py);
      var next = "idle";
      if (el) {
        if (el.closest(".bus3d") || el.closest(".universeBg")) next = "grab";else if (el.closest(".photoTile")) next = "probe";else if (el.closest(HOT)) next = "hot";
      }
      if (next !== lastMode) {
        lastMode = next;
        setMode(next);
      }
    };
    var flushMove = function flushMove(now) {
      raf = 0;
      if (node) node.style.transform = "translate(".concat(px, "px, ").concat(py, "px) translate(-50%, -50%)");
      writeCoords();
      probe(now);
    };
    var onMove = function onMove(e) {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(flushMove);
    };
    window.addEventListener("mousemove", onMove, {
      passive: true
    });
    return function () {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, []);

  // The coord span is ALWAYS mounted (just hidden when not idle) so its ref
  // stays stable and the per-move textContent writes never hit a detached node.
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: "cursor cursor--" + mode
  }, /*#__PURE__*/React.createElement("div", {
    className: "cursor__ring"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cursor__center"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cursor__hLine"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cursor__vLine"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cursor__coords"
  }, /*#__PURE__*/React.createElement("span", {
    ref: coordRef,
    style: {
      display: mode === "idle" ? "" : "none"
    }
  }, "0000 / 0000"), mode === "grab" && /*#__PURE__*/React.createElement("span", null, "drag to rotate"), mode === "probe" && /*#__PURE__*/React.createElement("span", null, "inspect \u2316"), mode === "hot" && /*#__PURE__*/React.createElement("span", null, "open \u2192")));
}
window.Cursor = Cursor;

/* ---- landing_final5/key-button.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* Shared landing keycap used by title, reel, and handoff controls. */
function KeyButton(_ref) {
  var children = _ref.children,
    _ref$legend = _ref.legend,
    legend = _ref$legend === void 0 ? "↵" : _ref$legend,
    primary = _ref.primary,
    onPress = _ref.onPress;
  var _React = React,
    useState = _React.useState;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    pressed = _useState2[0],
    setPressed = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    lit = _useState4[0],
    setLit = _useState4[1];
  var fire = function fire(e) {
    setPressed(true);
    setLit(true);
    if (window.MOSound) {
      window.MOSound.unlock();
      window.MOSound.thock({
        vel: 0.85
      });
    }
    if (window.__mo_disturb && e && e.currentTarget && e.currentTarget.getBoundingClientRect) {
      var r = e.currentTarget.getBoundingClientRect();
      window.__mo_disturb(r.left + r.width / 2, r.top + r.height / 2, 0.8);
    }
    if (onPress) onPress();
    setTimeout(function () {
      setPressed(false);
      if (window.MOSound) window.MOSound.thockUp();
    }, 140);
    setTimeout(function () {
      return setLit(false);
    }, 520);
  };
  var onKey = function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fire(e);
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    className: "key " + (pressed ? "key--down " : "") + (lit ? "key--lit " : "") + (primary ? "key--primary" : ""),
    onClick: fire,
    onKeyDown: onKey
  }, /*#__PURE__*/React.createElement("span", {
    className: "key__cap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "key__legendTop"
  }, legend), /*#__PURE__*/React.createElement("span", {
    className: "key__label"
  }, children)), /*#__PURE__*/React.createElement("span", {
    className: "key__shadow",
    "aria-hidden": "true"
  }));
}
window.KeyButton = KeyButton;

/* ---- landing_final/ascii.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/* ============================================================
   M.O. SYSTEM — Node-grid wordmark
   ------------------------------------------------------------
   "M.O." built the way the universe is built: junction NODES
   joined by straight link strokes, fleshed out with live ASCII
   texture. The periods are pure nodes. No font sampling — the
   letterforms are geometry, so nothing ever clips.
   ============================================================ */

function AsciiHero(_ref) {
  var _ref$cols = _ref.cols,
    cols = _ref$cols === void 0 ? 108 : _ref$cols,
    _ref$rows = _ref.rows,
    rows = _ref$rows === void 0 ? 20 : _ref$rows,
    _ref$ramp = _ref.ramp,
    ramp = _ref$ramp === void 0 ? " ·:-=+*#%@" : _ref$ramp,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? "" : _ref$className;
  var ref = React.useRef(null);
  React.useEffect(function () {
    var el = ref.current;
    if (!el) return;

    /* ---------- letterform geometry (visual units: x = col, y = row·2) ---------- */
    var A = 2; // cell aspect — a row is ~2 cols tall
    var W = cols,
      H = rows * A;
    // letter widths as fractions of the letter height
    var K = {
      m: 0.94,
      o: 0.84,
      dot: 0.12,
      gap: 0.24
    };
    var SUM = K.m + K.gap + K.dot + K.gap + K.o + K.gap + K.dot;
    var Hv = Math.min(H * 0.70, W * 0.94 / SUM); // fits BOTH axes — no clipping
    var x0 = (W - Hv * SUM) / 2;
    var y0 = (H - Hv) / 2;
    var nodes = []; // { x, y, phase, dot? }
    var segs = []; // { ax, ay, bx, by }
    var addLetter = function addLetter(relNodes, relSegs, ox, w) {
      var base = nodes.length;
      var _iterator = _createForOfIteratorHelper(relNodes),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _slicedToArray(_step.value, 2),
            rx = _step$value[0],
            ry = _step$value[1];
          nodes.push({
            x: ox + rx * w,
            y: y0 + ry * Hv,
            phase: nodes.length * 1.7
          });
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = _createForOfIteratorHelper(relSegs),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _step2$value = _slicedToArray(_step2.value, 2),
            i = _step2$value[0],
            j = _step2$value[1];
          var a = nodes[base + i],
            b = nodes[base + j];
          segs.push({
            ax: a.x,
            ay: a.y,
            bx: b.x,
            by: b.y
          });
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    };
    var cx = x0;
    // M — two posts and the valley: 5 junctions, 4 links
    addLetter([[0, 1], [0, 0], [0.5, 0.62], [1, 0], [1, 1]], [[0, 1], [1, 2], [2, 3], [3, 4]], cx, K.m * Hv);
    cx += (K.m + K.gap) * Hv;
    // . — a bare node resting on the baseline
    var dotR = Hv * 0.115;
    nodes.push({
      x: cx + K.dot * Hv * 0.5,
      y: y0 + Hv - dotR * 0.6,
      phase: nodes.length * 1.7,
      dot: true
    });
    cx += (K.dot + K.gap) * Hv;
    // O — an octagonal ring of 8 junctions
    addLetter([[0.32, 0], [0.68, 0], [1, 0.26], [1, 0.74], [0.68, 1], [0.32, 1], [0, 0.74], [0, 0.26]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]], cx, K.o * Hv);
    cx += (K.o + K.gap) * Hv;
    // . — the closing node
    nodes.push({
      x: cx + K.dot * Hv * 0.5,
      y: y0 + Hv - dotR * 0.6,
      phase: nodes.length * 1.7,
      dot: true
    });

    /* ---------- distance fields — sampled ONCE per mount ---------- */
    var rad = Hv * 0.085; // stroke half-width
    var nodeR = rad * 2.3; // junction glow radius
    var N = cols * rows;
    var mask = new Float32Array(N); // 0..1 — inside a stroke
    var nDist = new Float32Array(N); // distance to nearest junction
    var nPhase = new Float32Array(N);
    var segDist = function segDist(px, py, s) {
      var dx = s.bx - s.ax,
        dy = s.by - s.ay;
      var L2 = dx * dx + dy * dy || 1;
      var t = ((px - s.ax) * dx + (py - s.ay) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      var qx = s.ax + dx * t - px,
        qy = s.ay + dy * t - py;
      return Math.sqrt(qx * qx + qy * qy);
    };
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        var px = c + 0.5,
          py = (r + 0.5) * A;
        var sd = 1e9;
        var _iterator3 = _createForOfIteratorHelper(segs),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var s = _step3.value;
            var d = segDist(px, py, s);
            if (d < sd) sd = d;
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        var m = Math.max(0, 1 - sd / (rad * 1.6));
        var nd = 1e9,
          ph = 0;
        var _iterator4 = _createForOfIteratorHelper(nodes),
          _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var nn = _step4.value;
            var dx = px - nn.x,
              dy = py - nn.y;
            var _d = Math.sqrt(dx * dx + dy * dy);
            if (nn.dot) m = Math.max(m, Math.max(0, 1 - _d / (dotR * 1.5)));
            if (_d < nd) {
              nd = _d;
              ph = nn.phase;
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
        mask[i] = Math.min(1, m);
        nDist[i] = nd;
        nPhase[i] = ph;
      }
    }

    // per-cell dissolve hash — flight.js writes window.__mo_titleExit 0..1 and
    // the wordmark blows apart cell by cell into the particle field behind it.
    var hashCell = new Float32Array(N);
    for (var _i = 0; _i < N; _i++) {
      var _s = Math.sin(_i * 12.9898) * 43758.5453;
      hashCell[_i] = _s - Math.floor(_s);
    }

    /* ---------- cursor tracking ---------- */
    var cursor = {
      x: -1000,
      y: -1000,
      active: false
    };
    var onMove = function onMove(e) {
      var r = el.getBoundingClientRect();
      cursor.x = (e.clientX - r.left) / r.width * cols;
      cursor.y = (e.clientY - r.top) / r.height * rows;
      cursor.active = true;
    };
    var onLeave = function onLeave() {
      cursor.active = false;
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    /* ---------- demand-driven render gate ---------- */
    var initialRect = el.getBoundingClientRect();
    var onScreen = initialRect.bottom > 0 && initialRect.top < window.innerHeight;
    var disposed = false;
    var raf = 0;
    var last = 0;
    var cancelLoop = function cancelLoop() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    var requestLoop = function requestLoop() {
      if (disposed || raf || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    var syncLoop = function syncLoop() {
      if (!onScreen || document.hidden) cancelLoop();else requestLoop();
    };
    var io = new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      syncLoop();
    }, {
      threshold: 0
    });
    var onScroll = function onScroll() {
      return requestLoop();
    };
    var onVisibility = function onVisibility() {
      return syncLoop();
    };
    io.observe(el);
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- render loop — one string per frame ---------- */
    function frame(now) {
      raf = 0;
      if (disposed || !onScreen || document.hidden) return;
      var ex = Math.max(0, Math.min(1, window.__mo_titleExit || 0));
      if (ex >= 0.999) {
        if (!el.__exCleared) {
          el.textContent = "";
          el.__exCleared = true;
        }
        return;
      }
      if (now - last < 33) {
        requestLoop();
        return;
      } // ~30 fps
      last = now;
      el.__exCleared = false;
      var t = now * 0.0009;
      var buf = [];
      for (var _r = 0; _r < rows; _r++) {
        var line = "";
        for (var _c = 0; _c < cols; _c++) {
          var _i2 = _r * cols + _c;
          var _m = mask[_i2];
          // breathing field noise — wide swing so cells cross several ramp steps
          var n = (Math.sin(_c * 0.18 + t * 1.4) * 0.5 + 0.5) * 0.45 + (Math.sin(_r * 0.31 - t * 1.0) * 0.5 + 0.5) * 0.30 + (Math.sin((_c + _r) * 0.09 + t * 0.6) * 0.5 + 0.5) * 0.25;
          // slow luminance sweep travelling left→right across the word
          var sweep = Math.sin(_c * 0.055 - t * 2.1) * 0.5 + 0.5;

          // cursor influence — bright bubble
          var cInf = 0;
          if (cursor.active) {
            var _dx = _c - cursor.x;
            var _dy = (_r - cursor.y) * A;
            var _d2 = Math.sqrt(_dx * _dx + _dy * _dy);
            cInf = Math.max(0, 1 - _d2 / 14);
            cInf = cInf * cInf;
          }

          // junction proximity — 0..1 inside the glow radius
          var k = Math.max(0, 1 - nDist[_i2] / nodeR);
          var v = void 0,
            isNode = false;
          if (_m > 0.04 || k > 0) {
            // stroke body — ASCII texture breathing between mid and full density
            v = 0.24 + _m * 0.30 + n * 0.32 + sweep * 0.16 + cInf * 0.85;
            if (k > 0) {
              // glowing junction node — each pulses on its own phase
              var pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + nPhase[_i2]);
              v += k * (0.35 + pulse * 0.45);
              isNode = k > 0.55;
            }
          } else {
            // sparse live background
            v = n * n * 0.20 + sweep * 0.04 + cInf * 0.85;
          }
          v = Math.max(0, Math.min(1, v));

          // dissolve — cells drop out in hash order; a '·' rim rides the edge
          if (ex > 0.001) {
            var hz = hashCell[_i2];
            var th = ex * 1.12;
            if (hz < th - 0.05) {
              line += " ";
              continue;
            }
            if (hz < th) {
              line += "·";
              continue;
            }
            v *= 1 - ex * 0.35;
          }
          var ch = ramp[Math.floor(v * (ramp.length - 1))];
          if (isNode) {
            line += "<b>" + ch + "</b>"; // hot junction core
          } else if (cInf > 0.35 || _m > 0.5 && v > 0.88) {
            line += "<i>" + ch + "</i>"; // signal crest
          } else {
            line += ch;
          }
        }
        buf.push(line);
      }
      el.innerHTML = buf.join("\n");
      requestLoop();
    }
    requestLoop();
    return function () {
      disposed = true;
      cancelLoop();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [cols, rows, ramp]);
  return /*#__PURE__*/React.createElement("pre", {
    className: "asciiHero " + className,
    ref: ref,
    "aria-hidden": "true"
  });
}
window.AsciiHero = AsciiHero;

/* ---- project/viewer3d.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — Project 3D viewer
   Solid-shaded primitive with corner reticles + measurement labels.
   START DEMO unlocks drag-to-orbit + scroll-to-zoom.

   Also exposes:
     window.makePrimitiveMesh(kind, THREE, { wireframe })
   so universe.jsx can drop tiny wireframe twins onto each tile.
   ============================================================ */

(function () {
  var SIGNAL = 0x00f0c8;
  var SIGNAL_DIM = 0x00a88c;
  var HAIRLINE = 0x232a3a;
  var BONE = 0xe6e8ee;

  /* ============================================================
     GLB model loader · shared cache · cloned per consumer
     ============================================================
     Both the universe tiles and this project-page viewer pull
     models through here. The first request kicks off a fetch +
     parse; every subsequent caller awaits the same promise and
     gets a fresh THREE.Group clone — so we never re-download or
     re-parse the same .glb. */
  var _gltfCache = new Map(); // url -> Promise<THREE.Group>

  /* KTX2 / Basis transcoder — the v3 wafer exports carry KTX2-compressed
     textures (gltfpack -tc). GLTFLoader needs a KTX2Loader wired before it
     will parse them, and the KTX2Loader needs detectSupport(renderer) once so
     it knows which GPU formats to transcode to. Build a single shared instance
     lazily (throwaway renderer just for capability detection). */
  var _ktx2 = null;
  function getKTX2Loader(THREE) {
    if (_ktx2 !== null) return _ktx2 || null;
    if (!THREE.KTX2Loader) {
      _ktx2 = false;
      return null;
    }
    var k = new THREE.KTX2Loader().setTranscoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/");
    try {
      var r = new THREE.WebGLRenderer();
      k.detectSupport(r);
      r.dispose();
    } catch (e) {
      console.warn("[viewer3d] KTX2 detectSupport failed", e);
    }
    _ktx2 = k;
    return k;
  }
  window.loadProjectModel = function (url, THREE) {
    if (!url) return Promise.reject(new Error("no model url"));
    if (_gltfCache.has(url)) {
      return _gltfCache.get(url).then(function (root) {
        return root.clone(true);
      });
    }
    var LoaderCtor = THREE.GLTFLoader || window.THREE && window.THREE.GLTFLoader;
    if (!LoaderCtor) {
      return Promise.reject(new Error("GLTFLoader not loaded — add it after three.min.js"));
    }
    var p = new Promise(function (resolve, reject) {
      var loader = new LoaderCtor();
      // Meshopt-compressed GLBs (e.g. wafer.glb, optimized from 16 MB → 2 MB)
      // need the decoder wired in before .load(); uncompressed GLBs ignore it.
      var Meshopt = THREE.MeshoptDecoder || window.MeshoptDecoder;
      if (Meshopt && loader.setMeshoptDecoder) loader.setMeshoptDecoder(Meshopt);
      // KTX2/Basis textures (v3 wafer exports) — wire the transcoding loader.
      var ktx2 = getKTX2Loader(THREE);
      if (ktx2 && loader.setKTX2Loader) loader.setKTX2Loader(ktx2);
      loader.load(url, function (gltf) {
        return resolve(gltf.scene);
      }, undefined, function (err) {
        return reject(err);
      });
    });
    _gltfCache.set(url, p);
    return p.then(function (root) {
      return root.clone(true);
    });
  };

  /* Preload a list of GLB URLs — kicks off the same cached fetch+parse used
     by loadProjectModel, so by the time any tile/viewer asks for a model the
     promise is already resolved (or at least in-flight). Safe to call from
     the Boot preloader: it waits until THREE.GLTFLoader is available, and
     swallows individual failures so one bad URL doesn't block the rest. */
  window.preloadModels = function (urls) {
    if (!urls || !urls.length) return Promise.resolve();
    var ready = function ready() {
      return window.THREE && window.THREE.GLTFLoader;
    };
    var wait = ready() ? Promise.resolve() : new Promise(function (res) {
      var id = setInterval(function () {
        if (ready()) {
          clearInterval(id);
          res();
        }
      }, 30);
    });
    return wait.then(function () {
      return Promise.all(urls.map(function (u) {
        return window.loadProjectModel(u, window.THREE)["catch"](function () {
          return null;
        });
      }));
    });
  };

  /* Fit-and-centre helper — recentres a loaded model on its bounding-box
     centre and scales it so its longest edge equals `targetSize` world units.
     Returns the bounding box for any further measurement work. */
  window.fitModelToSize = function (root, THREE, targetSize) {
    var box = new THREE.Box3().setFromObject(root);
    var size = new THREE.Vector3();
    box.getSize(size);
    var centre = new THREE.Vector3();
    box.getCenter(centre);
    var longest = Math.max(size.x, size.y, size.z) || 1;
    var s = targetSize / longest;
    root.position.sub(centre.multiplyScalar(s));
    root.scale.multiplyScalar(s);
    return box;
  };

  /* ============================================================
     Procedural matcap — dark-chrome with a subtle signal-teal rim
     ============================================================
     Generated as a canvas texture so we don't have to ship a PNG.
     Returns the same THREE.CanvasTexture on every call (cached).
     Swap for a real .png later by replacing the canvas data. */
  var _matcapTexture = null;
  window.makeMatcapTexture = function (THREE) {
    if (_matcapTexture) return _matcapTexture;
    var SZ = 256;
    var c = document.createElement("canvas");
    c.width = c.height = SZ;
    var x = c.getContext("2d");

    // Base sphere lighting — bright top-left, dark bottom-right
    var grad = x.createRadialGradient(SZ * 0.34, SZ * 0.30, SZ * 0.04, SZ * 0.50, SZ * 0.50, SZ * 0.62);
    grad.addColorStop(0.00, "#f4f6fa");
    grad.addColorStop(0.18, "#9aa3b3");
    grad.addColorStop(0.45, "#3a4250");
    grad.addColorStop(0.78, "#161a22");
    grad.addColorStop(1.00, "#05070b");
    x.fillStyle = grad;
    x.beginPath();
    x.arc(SZ / 2, SZ / 2, SZ / 2, 0, Math.PI * 2);
    x.fill();

    // Signal-teal rim — picks up the silhouette edge
    var rim = x.createRadialGradient(SZ / 2, SZ / 2, SZ * 0.42, SZ / 2, SZ / 2, SZ / 2);
    rim.addColorStop(0.00, "rgba(0, 240, 200, 0)");
    rim.addColorStop(0.82, "rgba(0, 240, 200, 0)");
    rim.addColorStop(0.97, "rgba(0, 240, 200, 0.55)");
    rim.addColorStop(1.00, "rgba(0, 240, 200, 0)");
    x.fillStyle = rim;
    x.beginPath();
    x.arc(SZ / 2, SZ / 2, SZ / 2, 0, Math.PI * 2);
    x.fill();

    // Specular hot-spot
    var spec = x.createRadialGradient(SZ * 0.32, SZ * 0.26, 0, SZ * 0.32, SZ * 0.26, SZ * 0.18);
    spec.addColorStop(0.0, "rgba(255,255,255,0.85)");
    spec.addColorStop(1.0, "rgba(255,255,255,0)");
    x.fillStyle = spec;
    x.beginPath();
    x.arc(SZ / 2, SZ / 2, SZ / 2, 0, Math.PI * 2);
    x.fill();
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    _matcapTexture = tex;
    return tex;
  };

  /* Walk a loaded GLB scene and replace every mesh with LineSegments built
     from its EdgesGeometry. Preserves the local transforms (position /
     rotation / scale) so the line-converted model occupies the exact same
     space as the original mesh. Used by the page-entry FlyInOverlay to keep
     the existing line-style intro while showing the real model shape. */
  window.applyWireframeToModel = function (root, THREE) {
    var _opts$color, _opts$opacity, _opts$threshold;
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var color = (_opts$color = opts.color) !== null && _opts$color !== void 0 ? _opts$color : SIGNAL;
    var opacity = (_opts$opacity = opts.opacity) !== null && _opts$opacity !== void 0 ? _opts$opacity : 0.9;
    var threshold = (_opts$threshold = opts.threshold) !== null && _opts$threshold !== void 0 ? _opts$threshold : 25; // hard-edge angle threshold

    // Collect first, mutate after — modifying a tree while traversing it is bad.
    var meshes = [];
    root.traverse(function (obj) {
      if (obj.isMesh) meshes.push(obj);
    });
    for (var _i = 0, _meshes = meshes; _i < _meshes.length; _i++) {
      var m = _meshes[_i];
      if (!m.geometry) continue;
      var edges = new THREE.EdgesGeometry(m.geometry, threshold);
      var mat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        depthWrite: false
      });
      var line = new THREE.LineSegments(edges, mat);
      line.position.copy(m.position);
      line.quaternion.copy(m.quaternion);
      line.scale.copy(m.scale);
      var parent = m.parent;
      if (parent) {
        parent.add(line);
        parent.remove(m);
      }
      // dispose the original mesh's GPU resources — we're replacing them
      m.geometry.dispose();
      if (m.material && m.material.dispose) m.material.dispose();
    }
  };

  /* Walk a loaded GLB scene and replace every mesh's material with a
     shared MeshMatcapMaterial. Used for the small universe-card overlays
     where we want a consistent, performance-friendly look across all 12
     cards regardless of how the model was textured in Spline. */
  window.applyMatcapToModel = function (root, THREE) {
    var matcap = window.makeMatcapTexture(THREE);
    root.traverse(function (obj) {
      if (!obj.isMesh) return;
      // dispose previous material (Spline export) to avoid GPU leaks
      var prev = obj.material;
      obj.material = new THREE.MeshMatcapMaterial({
        matcap: matcap,
        transparent: true,
        opacity: 1,
        depthWrite: true
      });
      if (prev && prev.dispose) prev.dispose();
    });
  };

  /* ---------- geometry per primitive kind ---------- */
  function makePrimitiveGeometry(kind, THREE) {
    switch (kind) {
      case "slab":
        {
          // rounded-box approximation via beveled box (ExtrudeGeometry from a rect shape)
          // fall back to BoxGeometry — simpler + reads as a "wafer"
          var g = new THREE.BoxGeometry(2.6, 0.18, 1.7, 1, 1, 1);
          return g;
        }
      case "sphere":
        return new THREE.SphereGeometry(0.9, 36, 24);
      case "torus":
        return new THREE.TorusGeometry(0.85, 0.22, 18, 48);
      case "cone":
        return new THREE.ConeGeometry(0.6, 2.2, 32, 1, false);
      default:
        return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    }
  }

  /* ---------- shared mesh factory ---------- */
  // For tile-overlay: wireframe = true → returns a LineSegments
  // For demo page:   wireframe = false → returns a Mesh (solid)
  window.makePrimitiveMesh = function (kind, THREE) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var wire = !!opts.wireframe;
    var geo = makePrimitiveGeometry(kind, THREE);
    if (wire) {
      var _opts$color2, _opts$opacity2;
      var wireGeo = new THREE.EdgesGeometry(geo, 25);
      var mat = new THREE.LineBasicMaterial({
        color: (_opts$color2 = opts.color) !== null && _opts$color2 !== void 0 ? _opts$color2 : SIGNAL,
        transparent: true,
        opacity: (_opts$opacity2 = opts.opacity) !== null && _opts$opacity2 !== void 0 ? _opts$opacity2 : 0.9,
        depthWrite: false
      });
      var line = new THREE.LineSegments(wireGeo, mat);
      line.userData.kind = kind;
      // dispose original geo — we only need edges
      geo.dispose();
      return line;
    } else {
      var _mat = new THREE.MeshStandardMaterial({
        color: 0x0e1218,
        roughness: 0.42,
        metalness: 0.55,
        emissive: 0x06121b,
        emissiveIntensity: 0.35
      });
      var mesh = new THREE.Mesh(geo, _mat);
      // signal-edge wireframe overlay
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({
        color: SIGNAL,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      }));
      mesh.add(edges);
      mesh.userData.kind = kind;
      return mesh;
    }
  };

  /* ---------- canonical orientation per kind ---------- */
  function orientForKind(kind, mesh) {
    if (kind === "cone") mesh.rotation.set(0, 0, Math.PI / 2); // flashlight: lay horizontal
    if (kind === "torus") mesh.rotation.set(Math.PI * 0.32, 0.4, 0);
    if (kind === "slab") mesh.rotation.set(0.22, 0.6, 0);
  }
  window.orientPrimitive = orientForKind;

  /* ============================================================
     React component — <ProjectViewer3D primitive=... dims=... />
     ============================================================ */
  function ProjectViewer3D(_ref) {
    var primitive = _ref.primitive,
      dims = _ref.dims,
      model = _ref.model,
      modelFit = _ref.modelFit,
      modelPose = _ref.modelPose,
      _ref$scheme = _ref.scheme,
      scheme = _ref$scheme === void 0 ? "demo" : _ref$scheme;
    var mountRef = React.useRef(null);
    var stageRef = React.useRef({});
    var _React$useState = React.useState(false),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      active = _React$useState2[0],
      setActive = _React$useState2[1];
    React.useEffect(function () {
      var THREE = window.THREE;
      var mount = mountRef.current;
      if (!THREE || !mount) return;
      var sz = function sz() {
        return {
          w: mount.clientWidth,
          h: mount.clientHeight
        };
      };
      var _sz = sz(),
        w = _sz.w,
        h = _sz.h;
      var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
      camera.position.set(0, 0.8, 5.2);
      camera.lookAt(0, 0, 0);

      // lights — deep + signal rim
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      var key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2.4, 3.2, 2.0);
      scene.add(key);
      var rim = new THREE.PointLight(SIGNAL, 1.6, 12);
      rim.position.set(-2.2, 1.6, -2.2);
      scene.add(rim);
      var fill = new THREE.PointLight(0x4a6b9c, 0.6, 14);
      fill.position.set(2.8, -2.2, 1.2);
      scene.add(fill);

      // floor grid — light, hairline
      var grid = new THREE.GridHelper(8, 16, HAIRLINE, HAIRLINE);
      grid.position.y = -1.4;
      grid.material.transparent = true;
      grid.material.opacity = 0.35;
      scene.add(grid);

      // Primitive (or placeholder until the real GLB resolves).
      // When `model` is provided, we still create the procedural mesh as an
      // invisible stand-in so the orbit / animation loop has a stable object,
      // then swap-in the loaded GLB once available — keeping its Spline PBR
      // materials and letting this scene's lighting do the rest.
      var mesh = window.makePrimitiveMesh(primitive, THREE, {
        wireframe: false
      });
      orientForKind(primitive, mesh);
      if (model) {
        mesh.visible = false; // hide placeholder; GLB takes over
      }
      scene.add(mesh);
      stageRef.current.mesh = mesh;
      var loadedModel = null;
      if (model && window.loadProjectModel) {
        window.loadProjectModel(model, THREE).then(function (root) {
          var _mesh$geometry, _mesh$material;
          window.fitModelToSize(root, THREE, (modelFit || 2) * 1.2);
          // Optional per-project rest pose — applied as a delta, so the model
          // keeps the centring offset from fitModelToSize on root.position.
          if (modelPose) {
            root.rotation.x += modelPose.x || 0;
            root.rotation.y += modelPose.y || 0;
            root.rotation.z += modelPose.z || 0;
          }
          scene.add(root);
          loadedModel = root;
          stageRef.current.mesh = root;
          // dispose the placeholder we never showed
          (_mesh$geometry = mesh.geometry) === null || _mesh$geometry === void 0 || _mesh$geometry.dispose();
          (_mesh$material = mesh.material) === null || _mesh$material === void 0 || _mesh$material.dispose();
          scene.remove(mesh);
        })["catch"](function (err) {
          // Loader failed — fall back to the placeholder so the page still works.
          console.warn("[viewer3d] model load failed", err);
          mesh.visible = true;
        });
      }

      /* ---------- orbit state ---------- */
      var orbit = {
        yaw: mesh.rotation.y,
        pitch: mesh.rotation.x,
        dist: 5.2
      };
      var orbitT = {
        yaw: mesh.rotation.y,
        pitch: mesh.rotation.x,
        dist: 5.2
      };

      // damping helper
      function applyCamera() {
        var r = orbit.dist;
        camera.position.set(Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * r, Math.sin(orbit.pitch) * r, Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * r);
        camera.lookAt(0, 0, 0);
      }
      applyCamera();

      /* ---------- input — only when active ---------- */
      var dragging = false,
        lx = 0,
        ly = 0;
      var dom = renderer.domElement;
      dom.style.touchAction = "none";
      function onDown(e) {
        var _dom$setPointerCaptur;
        if (!stageRef.current.active) return;
        dragging = true;
        lx = e.clientX;
        ly = e.clientY;
        (_dom$setPointerCaptur = dom.setPointerCapture) === null || _dom$setPointerCaptur === void 0 || _dom$setPointerCaptur.call(dom, e.pointerId);
      }
      function onMove(e) {
        if (!dragging) return;
        var dx = e.clientX - lx,
          dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
        orbitT.yaw -= dx * 0.006;
        orbitT.pitch -= dy * 0.006;
        orbitT.pitch = Math.max(-1.2, Math.min(1.2, orbitT.pitch));
      }
      function onUp(e) {
        dragging = false;
        try {
          var _dom$releasePointerCa;
          (_dom$releasePointerCa = dom.releasePointerCapture) === null || _dom$releasePointerCa === void 0 || _dom$releasePointerCa.call(dom, e.pointerId);
        } catch (_) {}
      }
      function onWheel(e) {
        if (!stageRef.current.active) return;
        e.preventDefault();
        orbitT.dist += e.deltaY * 0.004;
        orbitT.dist = Math.max(2.4, Math.min(9.5, orbitT.dist));
      }
      dom.addEventListener("pointerdown", onDown);
      dom.addEventListener("pointermove", onMove);
      dom.addEventListener("pointerup", onUp);
      dom.addEventListener("pointercancel", onUp);
      dom.addEventListener("wheel", onWheel, {
        passive: false
      });

      /* ---------- resize ---------- */
      var ro = new ResizeObserver(function () {
        var s = sz();
        w = s.w;
        h = s.h;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(mount);

      /* ---------- loop ---------- */
      var raf,
        last = performance.now();
      function frame(now) {
        var dt = Math.min(50, now - last);
        last = now;

        // ambient auto-rotate when idle
        if (!stageRef.current.active) {
          orbitT.yaw += dt * 0.0006;
          orbitT.pitch += Math.sin(now * 0.0004) * dt * 0.00003;
        }
        var k = 1 - Math.pow(0.001, dt / 1000);
        orbit.yaw += (orbitT.yaw - orbit.yaw) * k;
        orbit.pitch += (orbitT.pitch - orbit.pitch) * k;
        orbit.dist += (orbitT.dist - orbit.dist) * k;
        applyCamera();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return function () {
        cancelAnimationFrame(raf);
        ro.disconnect();
        dom.removeEventListener("pointerdown", onDown);
        dom.removeEventListener("pointermove", onMove);
        dom.removeEventListener("pointerup", onUp);
        dom.removeEventListener("pointercancel", onUp);
        dom.removeEventListener("wheel", onWheel);
        try {
          mount.removeChild(dom);
        } catch (_) {}
        renderer.dispose();
      };
    }, [primitive, model]);
    React.useEffect(function () {
      stageRef.current.active = active;
    }, [active]);
    var d = dims || {
      d: "—",
      w: "—",
      h: "—"
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "pv"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pv__chrome"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__chromeDot"
    }), /*#__PURE__*/React.createElement("span", null, "DEMO \xB7 MODEL"), /*#__PURE__*/React.createElement("span", {
      className: "pv__chromeSep"
    }), /*#__PURE__*/React.createElement("span", null, primitive.toUpperCase()), /*#__PURE__*/React.createElement("span", {
      className: "pv__chromeSep"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pv__chromeMode " + (active ? "is-on" : "")
    }, active ? "● ORBIT" : "○ IDLE")), /*#__PURE__*/React.createElement("div", {
      className: "pv__stage"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pv__mount",
      ref: mountRef
    }), /*#__PURE__*/React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--tl"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--tr"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--bl"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--br"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pv__measure pv__measure--top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__measureTick"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pv__measureLabel"
    }, "D \xB7 ", d.d, " mm"), /*#__PURE__*/React.createElement("span", {
      className: "pv__measureTick"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pv__measure pv__measure--right"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__measureTick"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pv__measureLabel"
    }, "H \xB7 ", d.h, " mm"), /*#__PURE__*/React.createElement("span", {
      className: "pv__measureTick"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pv__measure pv__measure--bot"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__measureTick"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pv__measureLabel"
    }, "W \xB7 ", d.w, " mm"), /*#__PURE__*/React.createElement("span", {
      className: "pv__measureTick"
    })), !model && /*#__PURE__*/React.createElement("div", {
      className: "pv__hint"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__hintDot"
    }), /*#__PURE__*/React.createElement("span", null, "placeholder \xB7 drop real model later")), !active && /*#__PURE__*/React.createElement("div", {
      className: "pv__startWrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pv__startInner"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__startK"
    }, "DRAG \xB7 ORBIT"), /*#__PURE__*/React.createElement("span", {
      className: "pv__startSep"
    }, "\xB7"), /*#__PURE__*/React.createElement("span", {
      className: "pv__startK"
    }, "SCROLL \xB7 ZOOM")), /*#__PURE__*/React.createElement(KeyButton, {
      legend: "\u21B5",
      primary: true,
      onPress: function onPress() {
        return setActive(true);
      }
    }, "START DEMO")), active && /*#__PURE__*/React.createElement("button", {
      className: "pv__stop",
      onClick: function onClick() {
        return setActive(false);
      }
    }, /*#__PURE__*/React.createElement("span", null, "\u25CF LIVE"), /*#__PURE__*/React.createElement("span", {
      className: "pv__stopSep"
    }), /*#__PURE__*/React.createElement("span", null, "STOP DEMO"))), /*#__PURE__*/React.createElement("div", {
      className: "pv__foot"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pv__footK"
    }, "FILE"), /*#__PURE__*/React.createElement("span", {
      className: "pv__footV"
    }, model ? model.split("/").pop() : primitive + ".placeholder.glb"), /*#__PURE__*/React.createElement("span", {
      className: "pv__footSep"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pv__footK"
    }, "SCALE"), /*#__PURE__*/React.createElement("span", {
      className: "pv__footV"
    }, "1 : 1"), /*#__PURE__*/React.createElement("span", {
      className: "pv__footSep"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pv__footK"
    }, "MODE"), /*#__PURE__*/React.createElement("span", {
      className: "pv__footV"
    }, active ? "interactive" : "auto-rotate")));
  }
  window.ProjectViewer3D = ProjectViewer3D;
})();

/* ---- project_v3/hero-rig.jsx ---- */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* ============================================================
   M.O. SYSTEM — Wafer HERO RIG  (v3 — REAL GLB, no matcap)
   ------------------------------------------------------------
   Fork of project_v2/hero-rig.jsx for Landing v12 + Wafer v3.
   Same renderer/scene/camera + the canonical arrival pose so the
   landing→page seam stays one continuous shot — but:

     · loads the REAL wafer model (models/wafer_demo.glb), which
       ships its own PBR materials (anodized case/plate, nylon
       caps, green PCB, grey LCD, dark switches);
     · NO matcap — materials are kept (window.tuneRealMaterials)
       and only nudged to read on the void; material-less models
       (flashlight) get window.applySolidMaterials instead;
     · lighting is pushed a little harder so the near-black
       anodized metal is defined by the key + signal rim.

   v11 / Wafer v2 keep project_v2/hero-rig.jsx untouched.
   ============================================================ */
(function () {
  var SIGNAL = 0x00f0c8;

  /* ---- CANONICAL ARRIVAL POSE — the cross-page contract ----
     Identical on Landing v12 (wafer-flight) and Wafer v3 (page2),
     so the seam lines up. Tuned for the NEW Z-up model. */
  var RIG = {
    fov: 38,
    camZ: 5.4,
    modelFit: 4.0,
    // longest model edge in world units
    pose: {
      x: -0.92,
      y: 0.0,
      z: 0.0
    },
    // tilt the Z-up deck to a 3/4 hero
    arriveYaw: -0.52,
    arrivePitch: 0.16,
    handoffScale: 0.86,
    bg: 0x04060d
  };
  window.WAFER_RIG = RIG;
  var lerp = function lerp(a, b, t) {
    return a + (b - a) * t;
  };
  var damp = function damp(cur, tgt, rate, dt) {
    return lerp(cur, tgt, 1 - Math.pow(1 - rate, dt / 16));
  };
  window.makeWaferRig = function (mount) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var THREE = window.THREE;
    if (!THREE || !mount) return null;
    var modelUrl = opts.model || "models/wafer_demo.glb";
    var POSE = opts.pose || RIG.pose;
    var sz = function sz() {
      return {
        w: mount.clientWidth || 1,
        h: mount.clientHeight || 1
      };
    };
    var _sz = sz(),
      w = _sz.w,
      h = _sz.h;
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(RIG.fov, w / h, 0.1, 100);
    camera.position.set(0, 0, RIG.camZ);
    camera.lookAt(0, 0, 0);

    /* environment for PBR reflections — the anodized metal lives off this */
    var pmrem = null;
    if (THREE.RoomEnvironment) {
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.08).texture;
      } catch (_) {}
    }

    /* lights — pushed harder than v2 so the dark real materials read */
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    var key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(2.6, 3.6, 2.6);
    scene.add(key);
    var rim = new THREE.PointLight(SIGNAL, 3.0, 18);
    rim.position.set(-2.8, 1.6, -2.4);
    scene.add(rim);
    var fill = new THREE.PointLight(0x6f8fc4, 1.0, 18);
    fill.position.set(3.2, -2.4, 1.6);
    scene.add(fill);
    var top = new THREE.DirectionalLight(0xbfd3ff, 0.9);
    top.position.set(-0.4, 4.0, -1.2);
    scene.add(top);

    /* hierarchy: pivot (offset+scale) → spin (orbit) → holder (base pose) → GLB */
    var pivot = new THREE.Group();
    var spin = new THREE.Group();
    var holder = new THREE.Group();
    holder.rotation.set(POSE.x, POSE.y, POSE.z);
    spin.add(holder);
    pivot.add(spin);
    scene.add(pivot);

    /* explode bookkeeping — per-mesh base local position + out vector */
    var parts = [];
    var modelReady = false;
    function ingest(root) {
      window.fitModelToSize(root, THREE, opts.modelFit || RIG.modelFit);
      // NO matcap. Keep the model's real materials (just make them read on the
      // void); material-less models get a solid house material instead.
      if (opts.assignMaterial && window.applySolidMaterials) {
        window.applySolidMaterials(root, THREE, opts.assignMaterial);
      } else if (window.tuneRealMaterials) {
        window.tuneRealMaterials(root, THREE, {
          envMapIntensity: 1.9
        });
      }
      holder.add(root);
      // collect meshes for the exploded view (radial out-vectors)
      var centre = new THREE.Vector3();
      var box = new THREE.Box3().setFromObject(root);
      box.getCenter(centre);
      root.traverse(function (o) {
        if (!o.isMesh) return;
        var wp = new THREE.Vector3();
        o.getWorldPosition(wp);
        var dir = wp.clone().sub(centre);
        if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
        dir.normalize();
        parts.push({
          mesh: o,
          base: o.position.clone(),
          out: dir
        });
      });
      modelReady = true;
      if (opts.onReady) opts.onReady();
    }
    if (typeof opts.buildModel === "function") {
      try {
        ingest(opts.buildModel(THREE));
      } catch (e) {
        console.warn("[wafer-rig] buildModel failed", e);
      }
    } else if (window.loadProjectModel) {
      window.loadProjectModel(modelUrl, THREE).then(ingest)["catch"](function (e) {
        console.warn("[wafer-rig] model load failed", e);
      });
    }

    /* ---- eased state (cur) toward targets (tgt) ---- */
    var cur = {
      entry: 1,
      offX: 0,
      offY: 0,
      scale: 1,
      yaw: RIG.arriveYaw,
      pitch: RIG.arrivePitch,
      explode: 0,
      dist: RIG.camZ
    };
    var tgt = _objectSpread({}, cur);
    var offFracX = 0;
    var idleSpin = 0;
    var idleEnabled = false;
    var easeRate = 0.16;
    var yawRate = 0.22;
    function halfWidthAt(dist) {
      var vh = 2 * dist * Math.tan(RIG.fov * Math.PI / 180 / 2);
      return vh * 0.5 * (camera.aspect || w / h);
    }
    function recomputeOffX() {
      tgt.offX = offFracX * halfWidthAt(tgt.dist);
    }
    function arrivalState() {
      return {
        entry: 1,
        offX: 0,
        offY: 0,
        scale: 1,
        yaw: RIG.arriveYaw,
        pitch: RIG.arrivePitch,
        explode: 0,
        dist: RIG.camZ
      };
    }
    var HANDOFF = {
      entry: 1,
      offX: 0,
      offY: 0,
      scale: RIG.handoffScale,
      pitch: RIG.arrivePitch,
      explode: 0,
      dist: RIG.camZ
    };
    function applyToScene() {
      var e = cur.entry;
      var entryScale = 0.12 + 0.88 * e;
      pivot.scale.setScalar(cur.scale * entryScale);
      pivot.position.set(cur.offX, cur.offY, (1 - e) * -7.0);
      spin.rotation.y = cur.yaw + (1 - e) * 1.25 + idleSpin;
      spin.rotation.x = cur.pitch;
      camera.position.z = cur.dist;
      if (parts.length) {
        var amt = cur.explode * (RIG.modelFit * 0.42);
        var _iterator = _createForOfIteratorHelper(parts),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var p = _step.value;
            p.mesh.position.set(p.base.x + p.out.x * amt, p.base.y + p.out.y * amt, p.base.z + p.out.z * amt);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }
    applyToScene();
    function update(dt) {
      dt = Math.min(50, dt);
      var R = easeRate;
      cur.entry = damp(cur.entry, tgt.entry, R, dt);
      cur.offX = damp(cur.offX, tgt.offX, R, dt);
      cur.offY = damp(cur.offY, tgt.offY, R, dt);
      cur.scale = damp(cur.scale, tgt.scale, R, dt);
      cur.yaw = damp(cur.yaw, tgt.yaw, yawRate, dt);
      cur.pitch = damp(cur.pitch, tgt.pitch, yawRate, dt);
      cur.explode = damp(cur.explode, tgt.explode, 0.12, dt);
      cur.dist = damp(cur.dist, tgt.dist, R, dt);
      if (idleEnabled) idleSpin += dt * 0.00004;
      applyToScene();
    }
    function render() {
      renderer.render(scene, camera);
    }
    function setSize(nw, nh) {
      w = nw;
      h = nh;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      recomputeOffX();
    }

    /* ---- public controls (identical API to v2) ---- */
    var api = {
      el: renderer.domElement,
      get ready() {
        return modelReady;
      },
      render: render,
      update: update,
      setSize: setSize,
      setEaseRate: function setEaseRate(r) {
        easeRate = r;
      },
      setYawRate: function setYawRate(r) {
        yawRate = r;
      },
      isAt: function isAt() {
        return false;
      },
      snapArrival: function snapArrival() {
        Object.assign(cur, arrivalState());
        Object.assign(tgt, arrivalState());
        offFracX = 0;
        applyToScene();
      },
      startFromScreen: function startFromScreen(cx, cy, vw, vh, scale) {
        var halfH = RIG.camZ * Math.tan(RIG.fov * Math.PI / 180 / 2);
        var aspect = vw / vh;
        var halfW = halfH * aspect;
        var fracX = (cx - vw / 2) / (vw / 2);
        var fracY = -(cy - vh / 2) / (vh / 2);
        offFracX = fracX * (halfW / halfWidthAt(RIG.camZ));
        cur.entry = 1;
        cur.scale = scale;
        cur.explode = 0;
        cur.dist = RIG.camZ;
        cur.offX = fracX * halfW;
        cur.offY = fracY * halfH;
        cur.yaw = RIG.arriveYaw;
        cur.pitch = RIG.arrivePitch;
        Object.assign(tgt, cur);
        applyToScene();
      },
      easeToHandoff: function easeToHandoff() {
        offFracX = 0;
        tgt.entry = 1;
        tgt.offX = 0;
        tgt.offY = 0;
        tgt.scale = RIG.handoffScale;
        tgt.pitch = RIG.arrivePitch;
        tgt.explode = 0;
        tgt.dist = RIG.camZ;
      },
      snapToLayout: function snapToLayout(fracX) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
        var offY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var yaw = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : RIG.arriveYaw;
        offFracX = fracX;
        tgt.entry = 1;
        tgt.scale = scale;
        tgt.offY = offY;
        tgt.pitch = RIG.arrivePitch;
        tgt.explode = 0;
        tgt.dist = RIG.camZ;
        tgt.yaw = yaw;
        recomputeOffX();
        cur.entry = 1;
        cur.scale = scale;
        cur.offY = offY;
        cur.pitch = RIG.arrivePitch;
        cur.explode = 0;
        cur.dist = RIG.camZ;
        cur.yaw = yaw;
        cur.offX = tgt.offX;
        applyToScene();
      },
      beginHandoff: function beginHandoff() {
        Object.assign(cur, HANDOFF, {
          yaw: RIG.arriveYaw
        });
        Object.assign(tgt, HANDOFF, {
          yaw: RIG.arriveYaw
        });
        offFracX = 0;
        applyToScene();
      },
      snapHandoff: function snapHandoff() {
        Object.assign(cur, HANDOFF, {
          yaw: RIG.arriveYaw - 0.85
        });
        Object.assign(tgt, HANDOFF, {
          yaw: RIG.arriveYaw - 0.85
        });
        offFracX = 0;
        applyToScene();
      },
      toHandoff: function toHandoff() {
        offFracX = 0;
        tgt.entry = 1;
        tgt.offX = 0;
        tgt.offY = 0;
        tgt.scale = RIG.handoffScale;
        tgt.pitch = RIG.arrivePitch;
        tgt.explode = 0;
        recomputeOffX();
      },
      nudgeYaw: function nudgeYaw(d) {
        cur.yaw += d;
        tgt.yaw += d;
      },
      get yaw() {
        return cur.yaw;
      },
      setYawTarget: function setYawTarget(y) {
        tgt.yaw = y;
      },
      get entry() {
        return cur.entry;
      },
      setEntry: function setEntry(v) {
        tgt.entry = v;
      },
      setIdle: function setIdle(on) {
        idleEnabled = on;
      },
      setLayout: function setLayout(fracX) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
        var offY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        offFracX = fracX;
        tgt.scale = scale;
        tgt.offY = offY;
        recomputeOffX();
      },
      setInspect: function setInspect(on) {
        if (on) {
          offFracX = 0;
          recomputeOffX();
          tgt.offY = 0;
          tgt.scale = 1.12;
          tgt.dist = RIG.camZ * 0.94;
          idleEnabled = false;
        }
      },
      orbit: function orbit(dx, dy) {
        tgt.yaw += dx * 0.006;
        tgt.pitch += dy * 0.006;
        tgt.pitch = Math.max(-1.2, Math.min(1.2, tgt.pitch));
      },
      resetOrbit: function resetOrbit() {
        tgt.yaw = RIG.arriveYaw;
        tgt.pitch = RIG.arrivePitch;
      },
      setExplode: function setExplode(v) {
        tgt.explode = Math.max(0, Math.min(1, v));
      },
      get explode() {
        return tgt.explode;
      },
      dispose: function dispose() {
        try {
          mount.removeChild(renderer.domElement);
        } catch (_) {}
        if (pmrem) pmrem.dispose();
        renderer.dispose();
      },
      _debug: function _debug() {
        var box = new THREE.Box3().setFromObject(pivot);
        return {
          parts: parts.length,
          ready: modelReady,
          envOk: !!scene.environment,
          box: [box.min.toArray().map(function (n) {
            return +n.toFixed(2);
          }), box.max.toArray().map(function (n) {
            return +n.toFixed(2);
          })]
        };
      }
    };
    return api;
  };
})();

/* ---- project_v3/node-rig.jsx ---- */
/* ============================================================
   M.O. SYSTEM — GENERIC NODE RIG (project_v3/node-rig.jsx)
   ------------------------------------------------------------
   window.makeNodeRig(mount, { project, model, mode }) — one rig
   for EVERY node. Wraps the proven Wafer hero rig (identical
   camera/pose contract, so the Wafer seam is unchanged) and adds:
     · per-project model config from projects-data.js (no
       orientation/scale hardcoded in components);
     · a procedural "node-shell" PROXY for nodes whose GLB isn't
       ready (model.ready === false) — honest, wireframe, address
       + carrier particle, no fake product shape;
     · getYaw / setYaw / captureFrame on top of the classic API
       (startFromScreen, setLayout, snapToLayout, setEaseRate,
        nudgeYaw, update, render, dispose).
   Wafer v3's own hero-rig.jsx is untouched.
   ============================================================ */
(function () {
  var SIGNAL = 0x00f0c8;

  /* ---- procedural proxy: the "node-shell" ----
     A thin line construction: wireframe bounding volume, inner
     axis cross, a small carrier particle, the node address. */
  window.makeNodeProxy = function (THREE, project) {
    var g = new THREE.Group();
    var line = function line(geo, op) {
      return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({
        color: SIGNAL,
        transparent: true,
        opacity: op,
        depthWrite: false
      }));
    };
    var outer = line(new THREE.BoxGeometry(2.3, 1.55, 1.55), 0.6);
    g.add(outer);
    var inner = line(new THREE.OctahedronGeometry(0.62, 0), 0.4);
    g.add(inner);
    // axis cross
    var axGeo = new THREE.BufferGeometry();
    axGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1.15, 0, 0, 1.15, 0, 0, 0, -0.78, 0, 0, 0.78, 0, 0, 0, -0.78, 0, 0, 0.78]), 3));
    g.add(new THREE.LineSegments(axGeo, new THREE.LineBasicMaterial({
      color: 0x2a3a4a,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    })));
    // carrier particle — a small lit core
    var core = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({
      color: 0x073b33,
      emissive: SIGNAL,
      emissiveIntensity: 1.4,
      metalness: 0,
      roughness: 0.4,
      transparent: true
    }));
    g.add(core);
    // orbit motes
    var mote = new THREE.BufferGeometry();
    var mp = new Float32Array(8 * 3);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      mp[i * 3] = Math.cos(a) * 0.92;
      mp[i * 3 + 1] = Math.sin(a * 2) * 0.18;
      mp[i * 3 + 2] = Math.sin(a) * 0.62;
    }
    mote.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    g.add(new THREE.Points(mote, new THREE.PointsMaterial({
      color: SIGNAL,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    })));
    // address label
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 96;
    var x = c.getContext("2d");
    x.clearRect(0, 0, 256, 96);
    x.fillStyle = "#7ef5df";
    x.font = "600 34px 'Geist Mono', monospace";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("NODE " + (project && project.addr || "0x??"), 128, 30);
    x.fillStyle = "#5b6478";
    x.font = "500 17px 'Geist Mono', monospace";
    x.fillText("MODEL SIGNAL PENDING", 128, 68);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    var tag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    tag.position.set(0, -1.06, 0);
    g.add(tag);
    g.userData.isProxy = true;
    return g;
  };

  /* ---- generic rig ---- */
  window.makeNodeRig = function (mount) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!window.makeWaferRig) {
      console.warn("[node-rig] makeWaferRig missing");
      return null;
    }
    var project = opts.project || {};
    var model = opts.model || project.model || {};
    var base = {
      modelFit: model.rigFit || 4.0,
      pose: model.rigPose || {
        x: -0.35,
        y: 0,
        z: 0
      },
      onReady: opts.onReady
    };
    if (model.ready && model.src) {
      base.model = model.src;
      if (model.assignMaterial) base.assignMaterial = model.assignMaterial;
    } else {
      base.buildModel = function (THREE) {
        return window.makeNodeProxy(THREE, project);
      };
    }
    var rig = window.makeWaferRig(mount, base);
    if (!rig) return null;
    rig.getYaw = function () {
      return rig.yaw;
    };
    rig.setYaw = function (y) {
      rig.snapToLayout(0, 1, 0, y);
    };
    rig.captureFrame = function () {
      var tw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1100;
      try {
        var cnv = rig.el;
        if (!cnv || !cnv.width) return null;
        var th = Math.round(tw * cnv.height / cnv.width);
        var tc = document.createElement("canvas");
        tc.width = tw;
        tc.height = th;
        tc.getContext("2d").drawImage(cnv, 0, 0, tw, th);
        return tc.toDataURL("image/jpeg", 0.82);
      } catch (_) {
        return null;
      }
    };
    return rig;
  };
})();

/* ---- landing_final/hover-card.jsx ---- */
/* ============================================================
   M.O. SYSTEM — Universe hover inspector · "lock-on" targeting frame
   ------------------------------------------------------------
   The card face already renders everything (NODE addr, year, name,
   sub, stack, OPEN →), so the hover does NOT repeat any of it.
   Instead it's a pure targeting reticle that LOCKS onto the card:

     · four corner brackets drawn at the card's 4 PROJECTED corners,
       so they hug the card's true (rotated) shape — not an upright
       bounding box. Fixes the "broken border while spinning" bug.
     · a faint full outline of the quad
     · a small upright LOCK tab pinned to the top-left corner

   Geometry is updated imperatively every frame by the universe loop
   via panelRef.current.__updateHUD(corners) — corners are 4 {x,y}
   in mount px, clockwise from top-left. No viewport clamping, so the
   frame tracks the card exactly and clips at the edge instead of
   detaching to the screen corner.
   ============================================================ */

function UniverseHoverCard(_ref) {
  var project = _ref.project,
    panelRef = _ref.panelRef;
  var svgRef = React.useRef(null);
  var outlineRef = React.useRef(null);
  var bkRef = React.useRef([]);
  var tabRef = React.useRef(null);
  React.useLayoutEffect(function () {
    var el = panelRef.current;
    if (!el) return;

    // place one corner bracket: arms run from the (outward-nudged) corner C
    // toward its two neighbours P and N, so each bracket aligns with the two
    // card edges meeting at that corner.
    var setBracket = function setBracket(poly, C, P, N, cx, cy) {
      if (!poly) return;
      var ox = C.x - cx,
        oy = C.y - cy;
      var ol = Math.hypot(ox, oy) || 1;
      var OFF = 7; // nudge outward so brackets frame, not cover
      var Cx = C.x + ox / ol * OFF;
      var Cy = C.y + oy / ol * OFF;
      var dpx = P.x - C.x,
        dpy = P.y - C.y;
      var dpl = Math.hypot(dpx, dpy) || 1;
      var dnx = N.x - C.x,
        dny = N.y - C.y;
      var dnl = Math.hypot(dnx, dny) || 1;
      var arm = Math.min(28, 0.20 * Math.min(dpl, dnl));
      var p1x = Cx + dpx / dpl * arm,
        p1y = Cy + dpy / dpl * arm;
      var p2x = Cx + dnx / dnl * arm,
        p2y = Cy + dny / dnl * arm;
      poly.setAttribute("points", p1x.toFixed(1) + "," + p1y.toFixed(1) + " " + Cx.toFixed(1) + "," + Cy.toFixed(1) + " " + p2x.toFixed(1) + "," + p2y.toFixed(1));
    };

    // corners: [TL, TR, BR, BL] clockwise
    el.__updateHUD = function (corners) {
      var TL = corners[0],
        TR = corners[1],
        BR = corners[2],
        BL = corners[3];
      var cx = (TL.x + TR.x + BR.x + BL.x) / 4;
      var cy = (TL.y + TR.y + BR.y + BL.y) / 4;
      var outline = outlineRef.current;
      if (outline) outline.setAttribute("points", TL.x.toFixed(1) + "," + TL.y.toFixed(1) + " " + TR.x.toFixed(1) + "," + TR.y.toFixed(1) + " " + BR.x.toFixed(1) + "," + BR.y.toFixed(1) + " " + BL.x.toFixed(1) + "," + BL.y.toFixed(1));
      var b = bkRef.current;
      setBracket(b[0], TL, BL, TR, cx, cy); // TL: arms → BL & TR
      setBracket(b[1], TR, TL, BR, cx, cy); // TR: arms → TL & BR
      setBracket(b[2], BR, TR, BL, cx, cy); // BR: arms → TR & BL
      setBracket(b[3], BL, BR, TL, cx, cy); // BL: arms → BR & TL

      // upright LOCK tab pinned just above the top-left corner
      var tab = tabRef.current;
      if (tab) {
        tab.style.left = TL.x + "px";
        tab.style.top = TL.y + "px";
      }
    };
    return function () {
      if (el) delete el.__updateHUD;
    };
  }, [panelRef]);
  return /*#__PURE__*/React.createElement("div", {
    className: "uhud",
    ref: panelRef
  }, /*#__PURE__*/React.createElement("svg", {
    className: "uhud__svg",
    ref: svgRef,
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("g", {
    className: "uhud__lock",
    key: project.addr
  }, /*#__PURE__*/React.createElement("polygon", {
    className: "uhud__outline",
    ref: outlineRef,
    points: "0,0 0,0 0,0 0,0"
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[0] = n;
    },
    points: ""
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[1] = n;
    },
    points: ""
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[2] = n;
    },
    points: ""
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[3] = n;
    },
    points: ""
  }))), /*#__PURE__*/React.createElement("div", {
    className: "uhud__tab",
    ref: tabRef,
    key: "tab-" + project.addr
  }, /*#__PURE__*/React.createElement("span", {
    className: "uhud__tabDot"
  }), /*#__PURE__*/React.createElement("span", null, "LOCK")));
}
window.UniverseHoverCard = UniverseHoverCard;

/* ---- landing_final5/universe.jsx ---- */
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/* ============================================================
   M.O. SYSTEM — Universe v3
   Wrapping infinite space.
     · Drag to rotate the view (yaw + pitch).
     · Wheel to fly forward / backward along the look axis.
     · Tiles live in a torus-wrapped box around the camera —
       anything that drifts out of view wraps back in from the
       opposite side. The space feels infinite in every axis.

   v1 (sparse free-pan)   → landing/_unused/universe-v1-sparse.jsx
   v2 (Fibonacci sphere)  → landing/_unused/universe-v2-sphere.jsx
   ============================================================ */

/* v15 — SINGLE SOURCE: landing_final5/projects-data.js (window.MO_PROJECTS)
   is adapted into the tile shape this file has always used. The old inline
   12-project array is gone. Falls back to an empty field if the data file
   failed to load (console warning below). */
// Final 5 owns these tuning defaults. Keeping them beside their consumers
// avoids a page-level override racing the shared cursor module during boot.
window.__mo_fx = Object.assign({
  legRoll: 0.4,
  wheelYield: 420
}, window.__mo_fx || {});
var PROJECTS = (window.MO_PROJECTS || []).map(function (p) {
  var m = p.model || {};
  var cp = m.cardPose || {};
  return {
    addr: p.addr,
    kind: p.slug,
    file: p.file,
    name: p.name,
    sub: p["short"] || p.statement,
    year: p.state || "",
    stack: (p.tags || []).join(" · ").toUpperCase(),
    color: "#0d1018",
    model: m.ready ? m.src : null,
    modelFit: cp.fit ? cp.fit * 1.9 : 5.0,
    modelPose: cp.pose || null,
    assignMaterial: m.assignMaterial || null,
    mo: p
  };
});
if (!PROJECTS.length) console.warn("[universe] MO_PROJECTS missing — load landing_final5/projects-data.js first");
var MO_FEATURED = window.MO_FEATURED_ADDRS || ["0x01", "0x02", "0x03", "0x04"];
window.UNIVERSE_PROJECTS = PROJECTS;

/* ============================================================
   Per-tile canvas texture
   ============================================================ */
function makeTileTexture(p, THREE) {
  var c = document.createElement("canvas");
  c.width = 540;
  c.height = 720;
  var x = c.getContext("2d");
  x.fillStyle = p.color || "#0d1018";
  x.fillRect(0, 0, 540, 720);
  x.strokeStyle = "#232a3a";
  x.lineWidth = 1.5;
  x.strokeRect(12, 12, 516, 696);
  x.strokeStyle = "#00f0c8";
  x.lineWidth = 1.5;
  var drawCorner = function drawCorner(cx, cy, fx, fy) {
    var len = 16;
    x.beginPath();
    x.moveTo(cx, cy + fy * len);
    x.lineTo(cx, cy);
    x.lineTo(cx + fx * len, cy);
    x.stroke();
  };
  drawCorner(24, 24, 1, 1);
  drawCorner(516, 24, -1, 1);
  drawCorner(24, 696, 1, -1);
  drawCorner(516, 696, -1, -1);
  x.fillStyle = "#5b6478";
  x.font = "500 11px 'Geist Mono', monospace";
  x.textBaseline = "top";
  x.textAlign = "left";
  x.fillText("■  NODE " + p.addr, 44, 30);
  x.fillStyle = "#9aa3b3";
  x.fillText(p.year.toUpperCase(), 44, 46);
  x.fillStyle = "#5b6478";
  x.textAlign = "right";
  x.fillText("MASLOV / OLEKSANDR", 496, 30);
  x.fillText("48.137° N  ·  11.575° E", 496, 46);
  x.textAlign = "left";
  x.fillStyle = "#1a2030";
  for (var yy = 90; yy < 540; yy += 21) {
    for (var xx = 44; xx < 510; xx += 21) {
      x.fillRect(xx, yy, 1, 1);
    }
  }

  // Skip the canvas wireframe graphic when a real 3D model (or the v3 mini-PCB)
  // overlays the card — otherwise the green primitive shows through behind it.
  if (!p.model && !p.pcbBoard) {
    x.save();
    x.translate(270, 320);
    x.strokeStyle = "#00f0c8";
    x.fillStyle = "#00f0c8";
    x.lineWidth = 1.4;
    drawGraphic(x, p);
    x.restore();
  }
  x.fillStyle = "#e6e8ee";
  x.font = "400 56px 'Geist', sans-serif";
  x.textAlign = "left";
  x.textBaseline = "top";
  var lines = wrapText(x, p.name, 460);
  var ty = 550 - (lines.length - 1) * 56;
  var _iterator = _createForOfIteratorHelper(lines),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var line = _step.value;
      x.fillText(line, 44, ty);
      ty += 58;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  x.fillStyle = "#9aa3b3";
  x.font = "400 18px 'Geist', sans-serif";
  x.fillText(p.sub, 44, 640);
  x.fillStyle = "#5b6478";
  x.font = "500 11px 'Geist Mono', monospace";
  x.fillText(p.stack, 44, 678);
  x.fillStyle = "#00f0c8";
  x.textAlign = "right";
  x.fillText("OPEN  →", 496, 678);
  var tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
function wrapText(ctx, text, maxW) {
  var words = text.split(" ");
  var out = [];
  var cur = "";
  var _iterator2 = _createForOfIteratorHelper(words),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var w = _step2.value;
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        out.push(cur);
        cur = w;
      } else cur = test;
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  if (cur) out.push(cur);
  return out;
}
function drawGraphic(x, p) {
  switch (p.kind) {
    case "wafer":
      {
        var w = 280,
          h = 180,
          r = 22;
        x.beginPath();
        x.moveTo(-w / 2 + r, -h / 2);
        x.lineTo(w / 2 - r, -h / 2);
        x.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
        x.lineTo(w / 2, h / 2 - r);
        x.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
        x.lineTo(-w / 2 + r, h / 2);
        x.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
        x.lineTo(-w / 2, -h / 2 + r);
        x.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
        x.stroke();
        for (var row = 0; row < 3; row++) for (var col = 0; col < 5; col++) {
          var dx = (col - 2) * 26 - 32;
          var dy = (row - 1) * 26;
          x.fillRect(dx - 2, dy - 2, 4, 4);
          x.fillRect(-dx + 32 - 2, dy - 2, 4, 4);
        }
        for (var i = 0; i < 3; i++) {
          x.fillRect(-12 + i * 26 - 2, 50, 4, 4);
          x.fillRect(12 - i * 26 - 2 + 24, 50, 4, 4);
        }
        break;
      }
    case "kerfur":
      {
        x.beginPath();
        x.arc(0, 0, 100, 0, Math.PI * 2);
        x.stroke();
        x.beginPath();
        x.arc(-30, -8, 11, 0, Math.PI * 2);
        x.fill();
        x.beginPath();
        x.arc(30, -8, 11, 0, Math.PI * 2);
        x.fill();
        x.beginPath();
        x.arc(0, 22, 14, 0, Math.PI, false);
        x.stroke();
        for (var _i = 1; _i <= 3; _i++) {
          x.beginPath();
          x.arc(0, 0, 100 + _i * 14, -0.4 - _i * 0.05, 0.4 + _i * 0.05);
          x.globalAlpha = 0.4 - _i * 0.1;
          x.stroke();
        }
        x.globalAlpha = 1;
        break;
      }
    case "accel":
      {
        x.beginPath();
        for (var _i2 = 0; _i2 <= 80; _i2++) {
          var t = _i2 / 80;
          var xx = (t - 0.5) * 240;
          var yy = -Math.pow(t, 2.6) * 170 + 70;
          if (_i2 === 0) x.moveTo(xx, yy);else x.lineTo(xx, yy);
        }
        x.stroke();
        x.strokeStyle = "#1a2030";
        x.beginPath();
        x.moveTo(-120, 70);
        x.lineTo(120, -80);
        x.stroke();
        x.beginPath();
        x.moveTo(-120, 70);
        x.lineTo(120, 70);
        x.stroke();
        x.beginPath();
        x.moveTo(-120, 70);
        x.lineTo(-120, -100);
        x.stroke();
        x.fillStyle = "#5b6478";
        for (var _i3 = 1; _i3 <= 4; _i3++) {
          x.fillRect(-120 + _i3 * 48 - 0.5, 70 - 3, 1, 6);
          x.fillRect(-120 - 3, 70 - _i3 * 38 - 0.5, 6, 1);
        }
        x.strokeStyle = "#00f0c8";
        x.fillStyle = "#00f0c8";
        break;
      }
    case "torch":
      {
        x.beginPath();
        x.moveTo(-50, 60);
        x.lineTo(50, 60);
        x.lineTo(110, -90);
        x.lineTo(-110, -90);
        x.closePath();
        x.stroke();
        x.beginPath();
        x.rect(-50, 60, 100, 70);
        x.stroke();
        x.beginPath();
        x.arc(0, -10, 16, 0, Math.PI * 2);
        x.fill();
        for (var _i4 = -2; _i4 <= 2; _i4++) {
          x.globalAlpha = 0.3;
          x.beginPath();
          x.moveTo(_i4 * 16, -90);
          x.lineTo(_i4 * 24, -150);
          x.stroke();
        }
        x.globalAlpha = 1;
        break;
      }
    default:
      {
        for (var _i5 = 0; _i5 < 4; _i5++) {
          var s = 30 + _i5 * 30;
          x.globalAlpha = 1 - _i5 * 0.22;
          x.strokeRect(-s, -s, s * 2, s * 2);
        }
        x.globalAlpha = 1;
        x.beginPath();
        x.moveTo(-80, 0);
        x.lineTo(80, 0);
        x.stroke();
        x.beginPath();
        x.moveTo(0, -80);
        x.lineTo(0, 80);
        x.stroke();
        x.fillRect(-3, -3, 6, 6);
      }
  }
}

/* ============================================================
   Ambient node — small canvas sprite
   ============================================================ */
function makeAmbientTexture(label, THREE) {
  var cc = document.createElement("canvas");
  cc.width = 128;
  cc.height = 128;
  var xc = cc.getContext("2d");
  xc.clearRect(0, 0, 128, 128);
  xc.strokeStyle = "#00f0c8";
  xc.lineWidth = 2;
  xc.beginPath();
  xc.arc(64, 64, 4, 0, Math.PI * 2);
  xc.stroke();
  xc.fillStyle = "#5b6478";
  xc.font = "500 16px 'Geist Mono', monospace";
  xc.textAlign = "left";
  xc.textBaseline = "middle";
  xc.fillText(label, 76, 64);
  var t = new THREE.CanvasTexture(cc);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================
   Hover ASCII helpers
   ============================================================ */
var ASCII_CHAR_W = 5.4;
var ASCII_CHAR_H = 9.5;
var ASCII_RAMP = " .·:-=+*#%@";
function asciiBody(project, screen) {
  var cols = Math.max(14, Math.floor(screen.w / ASCII_CHAR_W));
  var rows = Math.max(10, Math.floor(screen.h / ASCII_CHAR_H));
  var out = [];
  var t1 = "■ " + project.addr;
  var t2 = project.year.toUpperCase();
  var headerSpace = Math.max(1, cols - t1.length - t2.length);
  out.push((t1 + " ".repeat(headerSpace) + t2).slice(0, cols));
  out.push("─".repeat(cols));
  var innerR = Math.max(2, rows - 6);
  var seed = project.addr.charCodeAt(2) + project.addr.charCodeAt(3);
  for (var r = 0; r < innerR; r++) {
    var line = "";
    for (var c = 0; c < cols; c++) {
      var cx = (cols - 1) / 2;
      var cy = (innerR - 1) / 2;
      var dx = (c - cx) / (cx || 1);
      var dy = (r - cy) / (cy || 1);
      var d = Math.sqrt(dx * dx * 0.5 + dy * dy);
      var n = Math.sin(c * 0.5 + r * 0.7 + seed) * 0.15;
      var v = Math.max(0, Math.min(1, 1 - d * 1.1 + n));
      var idx = Math.floor(v * (ASCII_RAMP.length - 1));
      line += ASCII_RAMP[idx];
    }
    out.push(line);
  }
  out.push("─".repeat(cols));
  out.push(project.name.toUpperCase().slice(0, cols).padEnd(cols, " "));
  out.push(project.sub.slice(0, cols).padEnd(cols, " "));
  out.push("OPEN →".padEnd(cols, " "));
  return out.slice(0, rows).join("\n");
}

/* ============================================================
   Universe v3 — wrapping infinite torus space
   ============================================================ */
function Universe(_ref) {
  var _ref$projects = _ref.projects,
    projects = _ref$projects === void 0 ? PROJECTS : _ref$projects,
    onActive = _ref.onActive,
    _ref$mode = _ref.mode,
    mode = _ref$mode === void 0 ? "drift" : _ref$mode,
    _ref$focusAddr = _ref.focusAddr,
    focusAddr = _ref$focusAddr === void 0 ? null : _ref$focusAddr;
  var mountRef = React.useRef(null);
  var overlayRef = React.useRef(null);
  var _React$useState = React.useState(null),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    hover = _React$useState2[0],
    setHover = _React$useState2[1];
  var _React$useState3 = React.useState(null),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    activeAddr = _React$useState4[0],
    setActiveAddr = _React$useState4[1];
  var _React$useState5 = React.useState({
      yaw: "0",
      pit: "0",
      vel: "0",
      tile: "—",
      trace: 0
    }),
    _React$useState6 = _slicedToArray(_React$useState5, 2),
    status = _React$useState6[0],
    setStatus = _React$useState6[1];
  var _React$useState7 = React.useState(false),
    _React$useState8 = _slicedToArray(_React$useState7, 2),
    idleNote = _React$useState8[0],
    setIdleNote = _React$useState8[1];
  var hoverObjRef = React.useRef(null);
  var modeRef = React.useRef(mode);
  var focusRef = React.useRef(focusAddr);
  React.useEffect(function () {
    modeRef.current = mode;
  }, [mode]);
  React.useEffect(function () {
    focusRef.current = focusAddr;
  }, [focusAddr]);
  React.useEffect(function () {
    var THREE = window.THREE;
    if (!THREE) {
      console.warn("THREE not loaded");
      return;
    }
    var mount = mountRef.current;
    if (!mount) return;
    var sz = function sz() {
      return {
        w: mount.clientWidth,
        h: mount.clientHeight
      };
    };
    var _sz = sz(),
      w = _sz.w,
      h = _sz.h;

    /* ---------- renderer / scene / camera ---------- */
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    // Cap at 1.5 — on a soft drifting field the extra retina pixels are
    // imperceptible but cost ~1.8× the fragment work at DPR 2.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Visibility gate — the universe is a full-screen hero background, so once
    // the user scrolls past it there's no reason to keep driving the GPU. We
    // pause the render (animation state still advances via dt on resume).
    var uniOnScreen = true;
    var uniIO = new IntersectionObserver(function (entries) {
      uniOnScreen = entries[0].isIntersecting;
    }, {
      threshold: 0
    });
    uniIO.observe(mount);
    var scene = new THREE.Scene();
    // Constant background glow — restored from v6. In v6 the canvas rendered
    // directly (alpha:true) so the CSS `.universeBg` navy/teal radial glow showed
    // through the empty field. The v9 post-processing composer outputs an OPAQUE
    // frame (grade shader writes alpha 1.0), so the CSS glow can no longer bleed
    // through — the canvas painted pure black. We rebuild that same glow as a
    // scene.background texture so it lives INSIDE the render and survives the
    // composer: void navy (#04060d) + faint teal centre (rgba(0,240,200,0.06)),
    // matching the CSS gradient. (scene.background is unaffected by fog.)
    (function makeBackdrop() {
      var bg = document.createElement("canvas");
      bg.width = bg.height = 1024;
      var bx = bg.getContext("2d");
      bx.fillStyle = "#04060d";
      bx.fillRect(0, 0, 1024, 1024);
      var grad = bx.createRadialGradient(512, 512, 0, 512, 512, 512 * 0.58);
      grad.addColorStop(0, "rgba(0,240,200,0.06)");
      grad.addColorStop(1, "rgba(0,240,200,0)");
      bx.fillStyle = grad;
      bx.fillRect(0, 0, 1024, 1024);
      var tex = new THREE.CanvasTexture(bg);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
    })();
    // Fog gives the field its atmospheric depth (the "cool" haze). 22→38 is the
    // original near fog; the drift wrap is hidden by the per-tile box-edge fade
    // now, and the ORIGIN ring stays readable because its tiles use a spherical
    // fade pushed out past the fog — so we can keep this near, atmospheric fog.
    scene.fog = new THREE.Fog(0x04060d, 22, 38);
    var camera = new THREE.PerspectiveCamera(58, w / h, 0.3, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    // v12: the card models now use REAL PBR materials (no matcap). Matcap was
    // lighting-independent; real metal renders pure BLACK without an env map +
    // key light — which is why the wafer/flashlight models went "missing". Add
    // a cheap one-time PMREM environment + a key/rim light so they read.
    var _pmrem = null,
      _roomEnvironment = null;
    try {
      _pmrem = new THREE.PMREMGenerator(renderer);
      _roomEnvironment = new THREE.RoomEnvironment();
      scene.environment = _pmrem.fromScene(_roomEnvironment, 0.06).texture;
    } catch (_) {} finally {
      if (_roomEnvironment && _roomEnvironment.dispose) _roomEnvironment.dispose();
      if (_pmrem) _pmrem.dispose();
    }
    {
      var _k = new THREE.DirectionalLight(0xffffff, 1.6);
      _k.position.set(2.4, 3.2, 2.6);
      scene.add(_k);
      var _r = new THREE.PointLight(0x00f0c8, 1.6, 26);
      _r.position.set(-3, 1.6, -2);
      scene.add(_r);
    }

    /* ============================================================
       MASLOV RENDERING PATH — post-processing composer
       Chosen in the look-dev lab: matcap · subtle chromatic aberration
       (~0.02) · gentle depth-of-field · small vignette · faint film
       grain · NO node glow (bloom intentionally omitted).
         Pipeline:  RenderPass → BokehPass(DoF) → MaslovGrade(CA+vig+grain) → OutputPass
         • All values live in window.__mo_grade so they're tunable live and
         match the lab "Maslov" preset.
       • Guarded + tiered: on low-power devices the (expensive) Bokeh depth
         pass is dropped while the near-free grade pass stays — so the lens
         character survives even when DoF can't.
       • Falls back to direct renderer.render() if anything is unavailable.
       ============================================================ */
    var GRADE = window.__mo_grade = Object.assign({
      aberration: 0.01,
      // CA — radial RGB split (v11.3: halved per request)
      vignette: 0.34,
      // "small vignette"
      grain: 0.0,
      // film grain removed per request
      dof: true,
      // gentle depth-of-field
      focus: 10.0,
      // pinned to the card plane — mids stay readable
      aperture: 0.00025,
      // v11.3: smaller — mid-distance stays crisper
      maxblur: 0.0045 // low ceiling — only the deep field melts
    }, window.__mo_grade || {});

    // Device tier. We enable DoF OPTIMISTICALLY everywhere (modern phones like
    // the iPhone 16 Pro Max render it fine) and let a runtime FPS probe drop it
    // only on devices that actually struggle. The near-free grade pass
    // (CA + vignette) always stays. `pointer: coarse` is deliberately NOT used
    // as a gate — touchscreen laptops report coarse yet render DoF fine.
    var _veryWeak = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2 || navigator.deviceMemory && navigator.deviceMemory <= 2;
    var _isSmall = matchMedia("(max-width: 760px)").matches;
    // Cap the composer's internal resolution lower on small screens so the
    // fill-rate-heavy DoF pass stays affordable on phones.
    var _composerDpr = Math.min(window.devicePixelRatio, _isSmall ? 1.25 : 1.5);

    // The shared controller owns the exact combined cursor shader, its four
    // ripple slots, the Lusion-style paint buffers and pointer wake. Universe
    // still owns its scene, DoF and live grade values.
    var composer = null,
      bokehPass = null,
      cursorFx = null,
      useComposer = false;
    try {
      var EffectComposer = THREE.EffectComposer,
        RenderPass = THREE.RenderPass,
        BokehPass = THREE.BokehPass,
        OutputPass = THREE.OutputPass;
      var createCursorEffect = window.MOCursorDistortion && window.MOCursorDistortion.createComposerEffect;
      if (EffectComposer && RenderPass && OutputPass && createCursorEffect) {
        composer = new EffectComposer(renderer);
        composer.setPixelRatio(_composerDpr);
        composer.setSize(w, h);
        composer.addPass(new RenderPass(scene, camera));
        if (GRADE.dof && !_veryWeak && BokehPass) {
          bokehPass = new BokehPass(scene, camera, {
            focus: GRADE.focus,
            aperture: GRADE.aperture,
            maxblur: GRADE.maxblur
          });
          composer.addPass(bokehPass);
        }
        cursorFx = createCursorEffect({
          THREE: THREE,
          renderer: renderer,
          width: w,
          height: h,
          pixelRatio: _composerDpr,
          grade: GRADE
        });
        if (!cursorFx || !cursorFx.effectPass) {
          throw new Error("shared cursor effect unavailable");
        }
        // Keep mirrored DOM crisp after DoF, then bend it in the same combined
        // cursor pass as the universe. The inverse-alpha marker prevents the
        // universe-only aberration/vignette/grain from leaking onto the type.
        if (cursorFx.mirrorPass) composer.addPass(cursorFx.mirrorPass);
        composer.addPass(cursorFx.effectPass);
        composer.addPass(new OutputPass());
        useComposer = true;
        window.__mo_useComposer = true;
        window.__mo_dofOn = !!bokehPass;
      }
    } catch (error) {
      console.warn("[universe] composer unavailable, falling back to direct render", error);
      if (cursorFx) cursorFx.destroy();
      cursorFx = null;
      composer = null;
      useComposer = false;
      window.__mo_useComposer = false;
      window.__mo_dofOn = false;
    }
    // audio-reactive level (smoothed) — the field breathes with the sound
    var _lvlS = 0;
    // velocity weight (written by cinematic.js) → FOV + aberration kick
    var _lastFov = 58;
    // v10 rack-focus state (smoothed focal distance)
    var _focusS = 13.0;
    // ARRIVAL overture — void → the field condenses into "0x00" → pulse → scatter
    var ARR = {
      t0: 0,
      dur: 2600,
      burst: false
    };
    var _arrR = new THREE.Vector3(),
      _arrU = new THREE.Vector3(),
      _arrUP = new THREE.Vector3(0, 1, 0);
    window.__mo_arrival_start = function () {
      ARR.t0 = performance.now();
      ARR.burst = false;
    };
    // idle attention — after 30s of stillness the field notices you
    var _lastAct = performance.now(),
      _idleFired = false;
    var onAnyAct = function onAnyAct() {
      _lastAct = performance.now();
      _idleFired = false;
    };
    var onActSkipArrival = function onActSkipArrival() {
      onAnyAct();
      ARR.t0 = 0;
    };
    window.addEventListener("pointermove", onAnyAct, {
      passive: true
    });
    window.addEventListener("pointerdown", onActSkipArrival, {
      passive: true
    });
    window.addEventListener("wheel", onAnyAct, {
      passive: true
    });
    window.addEventListener("keydown", onAnyAct, {
      passive: true
    });
    window.addEventListener("scroll", onAnyAct, {
      passive: true
    });

    // Adaptive DoF probe: sample FPS over the first ~2s of real rendering. If the
    // device can't sustain it, disable the (expensive) bokeh pass automatically —
    // the CA + vignette grade stays. This protects weak phones without punishing
    // capable ones (iPhone 16 Pro Max keeps its DoF).
    var _probeFrames = 0,
      _probeAccum = 0,
      _probeDone = false;
    function probeDoF(dt) {
      if (_probeDone || !bokehPass) return;
      // ignore absurd dt (tab was backgrounded / first frame)
      if (dt > 0 && dt < 200) {
        _probeAccum += dt;
        _probeFrames++;
      }
      if (_probeFrames >= 90) {
        // ~1.5s of frames
        var avgFps = 1000 / (_probeAccum / _probeFrames);
        if (avgFps < 42) {
          bokehPass.enabled = false;
          window.__mo_dofOn = false;
        }
        _probeDone = true;
      }
    }

    /* ---------- world configuration ---------- */
    // Smaller box → denser cluster around the camera. Fog hides the wrap.
    var BOX = new THREE.Vector3(26, 18, 26);
    var TILE_W = 3.0;
    var TILE_H = 4.0;

    /* ---------- camera state ---------- */
    // camera sits at origin (-ish) and rotates via yaw/pitch
    var cam = {
      pos: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      // exposed velocity (units/sec along look axis)
      vel: 0
    };
    var camTarget = {
      yaw: 0,
      pitch: 0
    };
    /* ============================================================
       PARALLAX DRIFT (v14)
       ------------------------------------------------------------
       The field used to only TURN in place, which reads as a
       turntable. This translates the camera sideways/vertically on a
       slow Lissajous so near tiles slide past faster than far ones —
       depth becomes legible without any input.
         It is a per-frame POSITION DELTA (never an absolute target), so
       it composes with wheel-fly, the transit treadmill and
       rebaseWorld() without any of them needing to know it exists.
         Amplitude is a *speed* in world-units/sec, not a radius: we
       integrate the derivative of the Lissajous, so the camera never
       gets pulled back to a home point.
         To retune: PDRIFT.amp = how far it wanders per second; .px/.py
       = seconds per cycle on each axis (keep them non-integer
       multiples so the path never repeats visibly). amp: 0 = off.
       ============================================================ */
    var PDRIFT = {
      amp: 0.42,
      px: 47,
      py: 31,
      focusDamp: 0.12,
      ease: 0.9
    };
    var pdriftGain = 1; // eased 0..1 — killed while a card is focused
    var _pdR = new THREE.Vector3(),
      _pdU = new THREE.Vector3();
    // v13 — transit bank: a soft roll the flight treadmill leans into.
    var camRollFX = 0;
    var _qr = new THREE.Quaternion();
    var _AXIS_Z = new THREE.Vector3(0, 0, 1);
    function updateCameraTransform() {
      // Compose orientation
      var q = new THREE.Quaternion();
      var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cam.yaw);
      var qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cam.pitch);
      q.multiplyQuaternions(qy, qp);
      if (Math.abs(camRollFX) > 0.0004) {
        _qr.setFromAxisAngle(_AXIS_Z, camRollFX);
        q.multiply(_qr);
      }
      camera.quaternion.copy(q);
      camera.position.copy(cam.pos);
    }
    updateCameraTransform();

    /* ---------- starfield (parallax — also wraps) ---------- */
    var starGeo = new THREE.BufferGeometry();
    var SC = 1400;
    var sPos = new Float32Array(SC * 3);
    for (var i = 0; i < SC; i++) {
      sPos[i * 3 + 0] = (Math.random() - 0.5) * BOX.x * 2;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * BOX.y * 2;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * BOX.z * 2;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478,
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7
    }));
    scene.add(stars);
    // These points are wrapped around the camera every frame by rewriting the
    // position buffer, but the object itself stays at the origin — so its bounding
    // sphere goes stale and Three.js frustum-culls the whole cloud once we fly far
    // ("discover far away"). Disable culling: it always surrounds the camera.
    stars.frustumCulled = false;
    stars.userData = {
      wrapScale: 2.0
    }; // larger box for stars

    // The teal SIGNAL field is now one and the same as the particles that
    // assemble into "0x00" — see the assembly cloud set up below. There is no
    // longer a separate hidden glyph layer.

    /* ---------- tiles (project cards) — placed via Fibonacci to start, then drift on wrap ---------- */
    var tilesGroup = new THREE.Group();
    scene.add(tilesGroup);
    var tiles = [];
    var tileWires = [];
    var goldenAngle = Math.PI * (3 - Math.sqrt(5));
    var N = projects.length;
    projects.forEach(function (p, i) {
      var tex = makeTileTexture(p, THREE);
      var mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      var geo = new THREE.PlaneGeometry(TILE_W, TILE_H);
      var mesh = new THREE.Mesh(geo, mat);

      // initial Fibonacci-spread positions inside BOX — closer in for density
      var yN = 1 - i / Math.max(1, N - 1) * 2;
      var radial = Math.sqrt(1 - yN * yN);
      var theta = i * goldenAngle;
      var r = 0.55 + 0.30 * (i * 13 % 100 / 100);
      mesh.position.set(Math.cos(theta) * radial * BOX.x * r * 0.55, yN * BOX.y * r * 0.6, Math.sin(theta) * radial * BOX.z * r * 0.55);
      mesh.userData = {
        project: p,
        texture: tex,
        kind: "tile",
        index: i,
        // each card gets a small persistent rotational offset for personality
        offsetYaw: (i * 37 % 100 / 100 - 0.5) * 0.5,
        // ±15°
        offsetPitch: (i * 53 % 100 / 100 - 0.5) * 0.3,
        // ±9°
        offsetRoll: (i * 29 % 100 / 100 - 0.5) * 0.18,
        // ±5°
        wobble: {
          p: i * 17 % 100 / 100,
          a: i * 23 % 100 / 100
        }
      };
      tilesGroup.add(mesh);
      tiles.push(mesh);

      // ---- per-tile 3D overlay
      // Two paths:
      //   (a) project has a `model` URL → load the GLB, apply matcap, drop it in
      //   (b) otherwise → procedural wireframe primitive as before
      // Both paths register a single "wire" entry in tileWires so the existing
      // follow/rotate/visibility logic in the frame loop works unchanged.
      if (p.pcbBoard && window.makeAboutPCBMesh) {
        // v3 ABOUT node: float the actual About PCB (same look as window.MOBoard)
        // on the card, and let the GLB-overlay frame logic below drive it
        // (scale/yaw/opacity) by tagging it as a loaded model.
        var board = window.makeAboutPCBMesh(THREE);
        board.userData.parentTile = mesh;
        board.userData.prim = "pcb";
        board.userData.addr = p.addr;
        board.userData.isModel = true;
        board.userData.loaded = true;
        board.userData.loadedAt = performance.now();
        tilesGroup.add(board);
        tileWires.push(board);
      } else if (p.model && window.loadProjectModel) {
        // Reserve a placeholder Group right away so frame ordering doesn't blink.
        var holder = new THREE.Group();
        holder.userData = {
          parentTile: mesh,
          prim: p.prim || "model",
          addr: p.addr,
          isModel: true,
          loaded: false
        };
        holder.visible = false;
        tilesGroup.add(holder);
        tileWires.push(holder);
        window.loadProjectModel(p.model, THREE).then(function (root) {
          // Centre + scale so longest edge ~2 world units; outer scale.setScalar
          // then matches what the wireframe used to do (0.28 of that).
          // Fit so longest edge = 2 world units; the frame loop then sets the
          // outer holder scale (≈0.85 idle, 1.10 on focus) so the model reads
          // as the card's hero, not a small inset.
          window.fitModelToSize(root, THREE, p.modelFit || 2);
          // v12: keep the model's REAL materials (no matcap); material-less
          // models (e.g. the flashlight) get a solid house material instead.
          if (p.assignMaterial && window.applySolidMaterials) window.applySolidMaterials(root, THREE, p.assignMaterial);else if (window.tuneRealMaterials) window.tuneRealMaterials(root, THREE, {
            envMapIntensity: 2.2
          });
          // card overlays fade with distance / wrap → materials must be transparent
          root.traverse(function (o) {
            if (!o.isMesh || !o.material) return;
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
              m.transparent = true;
            });
          });
          // Per-project rest pose. Apply it to a WRAPPER, never to root:
          // fitModelToSize leaves root.position = -centre·s (and CAD origins sit
          // far from the geometry), so rotating root would swing the model around
          // that off-centre origin — displacing it on the card and making it spin
          // around an outer point. The wrapper rotates around the holder origin,
          // where fitModelToSize parked the geometry centre, so the pose AND the
          // idle turntable both pivot on the true model centre.
          var poseGroup = new THREE.Group();
          if (p.modelPose) poseGroup.rotation.set(p.modelPose.x || 0, p.modelPose.y || 0, p.modelPose.z || 0);
          poseGroup.add(root);
          holder.add(poseGroup);
          holder.visible = true;
          holder.userData.loaded = true;
          holder.userData.loadedAt = performance.now(); // drives a soft fade-in
        })["catch"](function (err) {
          console.warn("[universe] model load failed for " + p.addr, err);
        });
      } else if (p.prim && window.makePrimitiveMesh) {
        var wire = window.makePrimitiveMesh(p.prim, THREE, {
          wireframe: true,
          color: 0x00f0c8,
          opacity: 0.85
        });
        wire.scale.setScalar(0.28); // tiny — fits in the upper area of the card
        wire.userData.parentTile = mesh;
        wire.userData.prim = p.prim;
        wire.userData.addr = p.addr;
        // Cone sits horizontally — same as on the project page
        if (p.prim === "cone") wire.rotation.set(0, 0, Math.PI / 2);
        tilesGroup.add(wire);
        tileWires.push(wire);
      }
    });

    /* ---------- Arranged-mode target positions ----------
       grid     : 4×3 wall in front of camera (z=-16)
       ambient  : 12 tiles on a Fibonacci sphere shell — slow ambient rotation
       drift    : null (free) */
    var GRID_COLS = 4;
    var GRID_ROWS = 3;
    var GRID_SPACING_X = 5.4;
    var GRID_SPACING_Y = 4.3;
    var GRID_Z = -16;
    function targetForTile(mode, i, t) {
      if (mode === "dive") {
        // Everything clears far out — only node 0x00 (the hub) remains, centered.
        var yN = 1 - i / Math.max(1, projects.length - 1) * 2;
        var theta = i * goldenAngle;
        return new THREE.Vector3(Math.cos(theta) * 22, yN * 13, -26 + Math.sin(theta) * 6);
      }
      if (mode === "origin") {
        var concept = window.__mo_origin && window.__mo_origin.concept || "assembly";
        var m = tiles[i];
        var addr = m && m.userData.project.addr;
        var fIdx = MO_FEATURED.indexOf(addr || "");
        // ASSEMBLY: clear ALL nodes far out so the particle glyph reads clean.
        if (concept === "assembly") {
          var _yN = 1 - i / Math.max(1, projects.length - 1) * 2;
          var _theta = i * goldenAngle;
          return new THREE.Vector3(Math.cos(_theta) * 19, _yN * 11, -22 + Math.sin(_theta) * 5);
        }
        // HUB: featured nodes ring the hub, the rest drift back.
        if (fIdx >= 0) {
          var ang = fIdx / Math.max(1, MO_FEATURED.length) * Math.PI * 2 - Math.PI / 2 + t * 0.00004;
          return new THREE.Vector3(ORIGIN_CENTER.x + Math.cos(ang) * ORIGIN_RING_R, ORIGIN_CENTER.y + Math.sin(ang) * ORIGIN_RING_R * 0.62, ORIGIN_CENTER.z + Math.sin(ang * 1.3) * 1.4);
        }
        var _yN2 = 1 - i / Math.max(1, projects.length - 1) * 2;
        var _theta2 = i * goldenAngle;
        return new THREE.Vector3(Math.cos(_theta2) * 16, _yN2 * 9, -18 + Math.sin(_theta2) * 4);
      }
      if (mode === "reel") {
        // v10 WORK REEL — the featured tiles parade past the lens (pos 1..4).
        // At the FINAL stop ("Open the universe") every node — all 12 —
        // spirals in and gathers into one slowly-turning galaxy disc in
        // front of the lens: the whole universe collapsing to the passage
        // door. The swirl unwinds as it settles (comets docking into orbit).
        var rb = window.__mo_reel || {
          pos: 1
        };
        var pos = rb.pos || 0;
        var g = Math.max(0, Math.min(1, pos - MO_FEATURED.length)); // 0→1 across the last beat
        var m3 = tiles[i];
        var addr3 = m3 && m3.userData.project.addr;
        var rIdx = MO_FEATURED.indexOf(addr3 || "");
        // v11.1 — was 7.6: close enough that the NEXT card loitered half-visible
        // behind the locked one (the "impostor"). 12.5 puts neighbours fully
        // past the frustum edge at z−10.6 while the parade speed still tracks
        // the scroll scrub 1:1.
        var REEL_DX = 12.5;
        var base;
        if (rIdx >= 0) {
          base = new THREE.Vector3((rIdx + 1 - pos) * REEL_DX, 0.62, -10.6);
        } else {
          var th = i * goldenAngle;
          var _yN3 = 1 - i / Math.max(1, projects.length - 1) * 2;
          base = new THREE.Vector3(Math.cos(th) * 20, _yN3 * 11, -25 + Math.sin(th) * 5);
        }
        if (g > 0.001) {
          // CAROUSEL — the 12 nodes dock into a slow cylindrical carousel
          // around the passage: the front cards sweep close past the lens
          // (big, crisp), the far side recedes into the blurred deep field.
          // Entry is a spiral — the swirl unwinds as each comet docks into
          // its orbit slot. The ring is gently tilted so it reads in 3D.
          var ang0 = i / Math.max(1, projects.length) * Math.PI * 2;
          var spin = t * 0.00026; // full revolution ≈ 24s
          var entry = (1 - g) * 2.6; // swirl unwinds on dock
          var _ang = ang0 + spin + entry;
          var R = 7.4;
          var carousel = new THREE.Vector3(Math.sin(_ang) * R, 0.55 - Math.cos(_ang) * 0.95,
          // tilted ring — front dips low
          -12.4 + Math.cos(_ang) * R * 0.82);
          base.lerp(carousel, g * g * (3 - 2 * g)); // smooth gather
        }
        return base;
      }
      if (mode === "grid") {
        var col = i % GRID_COLS;
        var row = Math.floor(i / GRID_COLS);
        return new THREE.Vector3((col - (GRID_COLS - 1) / 2) * GRID_SPACING_X, ((GRID_ROWS - 1) / 2 - row) * GRID_SPACING_Y, GRID_Z);
      }
      if (mode === "ambient") {
        // slow Fibonacci sphere shell ~12u radius — drift around it
        var _yN4 = 1 - i / Math.max(1, projects.length - 1) * 2;
        var radial = Math.sqrt(1 - _yN4 * _yN4);
        var _theta3 = i * goldenAngle + t * 0.00006;
        var _R = 13;
        return new THREE.Vector3(Math.cos(_theta3) * radial * _R, _yN4 * _R * 0.6, Math.sin(_theta3) * radial * _R - 4);
      }
      return null; // drift
    }

    /* ---------- ambient nodes — small "0x__" sprites scattered for density ---------- */
    var ambient = [];
    var ambientGroup = new THREE.Group();
    scene.add(ambientGroup);
    var AMB_N = 180;
    for (var _i6 = 0; _i6 < AMB_N; _i6++) {
      var id = "0x" + (0x10 + _i6).toString(16).toUpperCase().padStart(2, "0");
      var tex = makeAmbientTexture(id, THREE);
      var mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      var sp = new THREE.Sprite(mat);
      sp.position.set((Math.random() - 0.5) * BOX.x, (Math.random() - 0.5) * BOX.y, (Math.random() - 0.5) * BOX.z);
      // small square-ish icon — matches v2 feel
      sp.scale.set(1.3, 1.3, 1);
      sp.userData = {
        phase: Math.random() * Math.PI * 2,
        kind: "ambient"
      };
      sp.frustumCulled = false; // wraps around the camera — never cull it out
      ambientGroup.add(sp);
      ambient.push(sp);
    }

    /* ---------- ORIGIN hub — node 0x00 (the self) ----------
       A special, larger node that only matters in `origin` mode. Every
       project node radiates from it. This is the literal target of the
       later "dive into node 0x00" → About · Board transition. */
    var ORIGIN_CENTER = new THREE.Vector3(0, 0, -9); // in front of a levelled camera
    var ORIGIN_RING_R = 6.2; // project nodes ring radius

    function makeOriginTexture() {
      var oc = document.createElement("canvas");
      oc.width = 256;
      oc.height = 256;
      var g = oc.getContext("2d");
      g.clearRect(0, 0, 256, 256);
      var cx = 128,
        cy = 128;
      // concentric rings
      g.strokeStyle = "#00f0c8";
      for (var _i7 = 0; _i7 < 3; _i7++) {
        g.globalAlpha = 0.9 - _i7 * 0.28;
        g.lineWidth = 2 - _i7 * 0.4;
        g.beginPath();
        g.arc(cx, cy, 30 + _i7 * 26, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
      // crosshair ticks
      g.strokeStyle = "#00f0c8";
      g.lineWidth = 1.5;
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
          dx = _ref3[0],
          dy = _ref3[1];
        g.beginPath();
        g.moveTo(cx + dx * 84, cy + dy * 84);
        g.lineTo(cx + dx * 98, cy + dy * 98);
        g.stroke();
      });
      // core
      g.fillStyle = "#00f0c8";
      g.beginPath();
      g.arc(cx, cy, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#04060d";
      g.beginPath();
      g.arc(cx, cy, 3, 0, Math.PI * 2);
      g.fill();
      var t = new THREE.CanvasTexture(oc);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    var originGroup = new THREE.Group();
    scene.add(originGroup);
    originGroup.visible = false;
    var originHub = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeOriginTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false
    }));
    originHub.position.copy(ORIGIN_CENTER);
    originHub.scale.set(4.2, 4.2, 1);
    originGroup.add(originHub);

    // radiating links hub → each featured project node
    var featuredTiles = tiles.filter(function (m) {
      return MO_FEATURED.includes(m.userData.project.addr);
    });
    var originLinks = featuredTiles.map(function (tile) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      var line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x00f0c8,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false
      }));
      line.userData = {
        tile: tile
      };
      originGroup.add(line);
      return line;
    });

    /* ---------- ASSEMBLY cloud — particles that swarm to FORM "0x00" ----------
       Concept 01. A dedicated point cloud whose rest state is scattered through
       the box; in origin/assembly mode each point flies to a target sampled from
       a canvas-rendered "0x00" glyph, giving a 3D constellation of the self. */
    function sampleGlyphTargets(text, count) {
      var cw = 720,
        ch = 260;
      var gc = document.createElement("canvas");
      gc.width = cw;
      gc.height = ch;
      var gx = gc.getContext("2d");
      gx.fillStyle = "#000";
      gx.fillRect(0, 0, cw, ch);
      gx.fillStyle = "#fff";
      gx.textAlign = "center";
      gx.textBaseline = "middle";
      gx.font = "700 210px 'Geist Mono', monospace";
      gx.fillText(text, cw / 2, ch / 2 + 6);
      var data = gx.getImageData(0, 0, cw, ch).data;
      // Finer sampling (every 2px) → crisper letterforms.
      var hits = [];
      for (var y = 0; y < ch; y += 2) {
        for (var x = 0; x < cw; x += 2) {
          if (data[(y * cw + x) * 4] > 128) hits.push([x, y]);
        }
      }
      // Shuffle so any subset we draw is an even sample of the whole glyph
      // (a strided index would band along scan-rows and leave gaps).
      for (var _i8 = hits.length - 1; _i8 > 0; _i8--) {
        var k = Math.floor(Math.random() * (_i8 + 1));
        var t = hits[_i8];
        hits[_i8] = hits[k];
        hits[k] = t;
      }
      // map sampled pixels into world-space targets centred on ORIGIN_CENTER
      var SCALE = 0.024;
      var out = new Float32Array(count * 3);
      for (var _i9 = 0; _i9 < count; _i9++) {
        var _h = hits.length ? hits[_i9 % hits.length] : [cw / 2, ch / 2];
        // sub-cell jitter softens the sampling grid without blurring strokes
        var jx = (Math.random() - 0.5) * 1.6;
        var jy = (Math.random() - 0.5) * 1.6;
        out[_i9 * 3 + 0] = ORIGIN_CENTER.x + (_h[0] + jx - cw / 2) * SCALE;
        out[_i9 * 3 + 1] = ORIGIN_CENTER.y - (_h[1] + jy - ch / 2) * SCALE;
        // SHALLOW depth — keeps the glyph close to a readable plane instead of
        // puffing into a 3D cloud that never resolves into text.
        out[_i9 * 3 + 2] = ORIGIN_CENTER.z + Math.sin(_i9 * 12.9898) * 0.22;
      }
      return out;
    }

    // Denser than the original 560 so the strokes read, but kept modest. This
    // is a single THREE.Points (one draw call); the only per-frame cost is the
    // position loop below — trivial next to the GLB models + bokeh pass.
    var ASM_N = 820;
    var asmTargets = sampleGlyphTargets("0x00", ASM_N);
    // Glyph offsets relative to ORIGIN_CENTER — lets us re-anchor the formed
    // glyph in front of the *camera* each frame instead of at a fixed world
    // point (so it's always in view no matter how far the camera has drifted).
    var asmLocal = new Float32Array(ASM_N * 3);
    for (var _i0 = 0; _i0 < ASM_N; _i0++) {
      asmLocal[_i0 * 3 + 0] = asmTargets[_i0 * 3 + 0] - ORIGIN_CENTER.x;
      asmLocal[_i0 * 3 + 1] = asmTargets[_i0 * 3 + 1] - ORIGIN_CENTER.y;
      asmLocal[_i0 * 3 + 2] = asmTargets[_i0 * 3 + 2] - ORIGIN_CENTER.z;
    }
    // v11 — PORTRAIT FIT. The glyph's world width was tuned for landscape
    // aspect; on a phone the visible width at the anchor distance is narrower
    // than "0x00", so the word ran off both screen edges and read as noise.
    // Scale the local offsets to fit the horizontal FOV, refreshed on resize.
    var glyphHalfW = 0;
    for (var _i1 = 0; _i1 < ASM_N; _i1++) glyphHalfW = Math.max(glyphHalfW, Math.abs(asmLocal[_i1 * 3]));
    var glyphFit = 1;
    function fitGlyphToView() {
      var halfW = Math.tan(camera.fov * Math.PI / 360) * Math.abs(ORIGIN_CENTER.z) * camera.aspect;
      glyphFit = Math.min(1, halfW * 0.84 / glyphHalfW);
    }
    fitGlyphToView();
    var asmGeo = new THREE.BufferGeometry();
    var asmPos = new Float32Array(ASM_N * 3); // rendered positions (what you see)
    var asmHome = new Float32Array(ASM_N * 3); // live field positions (drift + wrap)
    for (var _i10 = 0; _i10 < ASM_N; _i10++) {
      var x = (Math.random() - 0.5) * BOX.x;
      var y = (Math.random() - 0.5) * BOX.y;
      var z = (Math.random() - 0.5) * BOX.z;
      asmHome[_i10 * 3 + 0] = asmPos[_i10 * 3 + 0] = x;
      asmHome[_i10 * 3 + 1] = asmPos[_i10 * 3 + 1] = y;
      asmHome[_i10 * 3 + 2] = asmPos[_i10 * 3 + 2] = z;
    }
    asmGeo.setAttribute("position", new THREE.BufferAttribute(asmPos, 3));
    // The teal signal field. Drifts/wraps around the camera like any star; on
    // the ORIGIN beat it peels out of the field to FORM "0x00", then melts back.
    var assemblyPts = new THREE.Points(asmGeo, new THREE.PointsMaterial({
      color: 0x00f0c8,
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    }));
    var assemblyGroup = new THREE.Group();
    assemblyGroup.add(assemblyPts);
    // Same stale-bounding-sphere fix as the stars: the teal field wraps around the
    // camera via the position buffer, so without this it culls out (green vanishes
    // first) when flying far from origin.
    assemblyPts.frustumCulled = false;
    scene.add(assemblyGroup);

    /* ============================================================
       v10 — SIGNAL CONSTELLATION  (ported from Universe Lab)
       Each project links to its 2 nearest neighbours; a shader runs a
       travelling bright pulse along every segment over a faint base glow.
       Rendered strictly BEHIND the card planes (renderOrder -2) so the
       links can never sit over a card face — they only show in the void
       between cards. Brightens on hover/focus; breathes with audio level.
       ============================================================ */
    var TOPO_MAX_E = 26;
    var TOPO_CUT = 13; // max link length (world units)
    var TOPO_SEG = 24; // segments per edge (smooth pulse gradient)
    var constUniforms = {
      uTime: {
        value: 0
      },
      uFlow: {
        value: 1.0
      },
      uInt: {
        value: 0.85
      },
      uColor: {
        value: new THREE.Color(0x00f0c8)
      },
      uVis: {
        value: 1.0
      }
    };
    var constMat = new THREE.ShaderMaterial({
      uniforms: constUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: "attribute float aT; attribute float aA; varying float vT; varying float vA;\n" + "void main(){ vT = aT; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float uTime; uniform float uFlow; uniform float uInt; uniform vec3 uColor; uniform float uVis;\n" + "varying float vT; varying float vA;\n" + "void main(){\n" + "  float base = 0.10;\n" + "  float pulse = pow(max(0.0, sin((vT*6.2831 - uTime*uFlow*2.0))), 8.0);\n" + "  float a = (base + pulse) * uInt * vA * uVis;\n" + "  gl_FragColor = vec4(uColor, a);\n" + "}"
    });
    var constGroup = new THREE.Group();
    constGroup.renderOrder = -2;
    scene.add(constGroup);
    // Reusable pool of line objects — the graph rebuilds into these in place.
    var constLines = [];
    for (var _i11 = 0; _i11 < TOPO_MAX_E; _i11++) {
      var g = new THREE.BufferGeometry();
      var pos = new Float32Array(TOPO_SEG * 3);
      var tt = new Float32Array(TOPO_SEG);
      var aa = new Float32Array(TOPO_SEG);
      for (var s = 0; s < TOPO_SEG; s++) tt[s] = s / (TOPO_SEG - 1);
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aT", new THREE.BufferAttribute(tt, 1));
      g.setAttribute("aA", new THREE.BufferAttribute(aa, 1));
      var line = new THREE.Line(g, constMat);
      line.frustumCulled = false;
      line.renderOrder = -2;
      line.visible = false;
      constGroup.add(line);
      constLines.push(line);
    }
    var _topoEdges = []; // rebuilt periodically: { A, B, ai, bi, len }
    var _topoFrame = 0;
    function updateTopology(dt, mode, focusAddrNow, formP, arrFade) {
      var fx = window.__mo_fx.topology != null ? window.__mo_fx.topology : 1;
      // v10: during the reel's final "Open the universe" gather, the network
      // IGNITES — 12 nodes in one disc, every edge alive.
      var gatherG = mode === "reel" ? Math.max(0, Math.min(1, ((window.__mo_reel || {}).pos || 0) - MO_FEATURED.length)) : 0;
      var modeVis = mode === "drift" ? 1 : mode === "reel" ? 0.6 + gatherG * 0.9 : mode === "grid" ? 0.5 : 0;
      var vis = fx * modeVis * (1 - formP) * arrFade;
      constUniforms.uTime.value = performance.now() % 100000 * 0.001;
      constUniforms.uVis.value = vis;
      if (vis <= 0.012) {
        constGroup.visible = false;
        return;
      }
      constGroup.visible = true;
      var hovAddr = hoverObjRef.current && hoverObjRef.current.userData.project.addr || focusAddrNow;

      // rebuild the nearest-neighbour graph every 3rd frame (12 nodes — cheap)
      if (_topoFrame++ % 3 === 0) {
        _topoEdges.length = 0;
        var live = [];
        var _iterator3 = _createForOfIteratorHelper(tiles),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var m = _step3.value;
            if (m.material.opacity > 0.12) live.push(m);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        for (var _i12 = 0; _i12 < live.length && _topoEdges.length < TOPO_MAX_E; _i12++) {
          var n1 = -1,
            n2 = -1,
            d1 = Infinity,
            d2 = Infinity;
          for (var j = 0; j < live.length; j++) {
            if (j === _i12) continue;
            var d = live[_i12].position.distanceTo(live[j].position);
            if (d < d1) {
              d2 = d1;
              n2 = n1;
              d1 = d;
              n1 = j;
            } else if (d < d2) {
              d2 = d;
              n2 = j;
            }
          }
          var _loop = function _loop() {
              var _arr$_i = _slicedToArray(_arr[_i13], 2),
                nj = _arr$_i[0],
                dd = _arr$_i[1];
              if (nj < 0 || dd > TOPO_CUT) return 0; // continue
              var a = Math.min(_i12, nj),
                b = Math.max(_i12, nj);
              if (_topoEdges.some(function (e) {
                return e.ai === a && e.bi === b;
              })) return 0; // continue
              _topoEdges.push({
                A: live[a],
                B: live[b],
                ai: a,
                bi: b,
                len: dd
              });
              if (_topoEdges.length >= TOPO_MAX_E) return 1; // break
            },
            _ret;
          for (var _i13 = 0, _arr = [[n1, d1], [n2, d2]]; _i13 < _arr.length; _i13++) {
            _ret = _loop();
            if (_ret === 0) continue;
            if (_ret === 1) break;
          }
        }
      }

      // write each edge into its line: segment positions + a constant per-edge
      // alpha (closeness · hover-boost · endpoint opacity). The shader adds the
      // travelling pulse over a faint base glow.
      var breathe = 1 + _lvlS * 1.2;
      for (var e = 0; e < TOPO_MAX_E; e++) {
        var _line = constLines[e];
        var E = _topoEdges[e];
        if (!E) {
          _line.visible = false;
          continue;
        }
        _line.visible = true;
        var posArr = _line.geometry.attributes.position.array;
        var aArr = _line.geometry.attributes.aA.array;
        var A = E.A.position,
          B = E.B.position;
        for (var _s = 0; _s < TOPO_SEG; _s++) {
          var t = _s / (TOPO_SEG - 1);
          posArr[_s * 3] = A.x + (B.x - A.x) * t;
          posArr[_s * 3 + 1] = A.y + (B.y - A.y) * t;
          posArr[_s * 3 + 2] = A.z + (B.z - A.z) * t;
        }
        var closeness = Math.pow(Math.max(0, 1 - E.len / TOPO_CUT), 1.4);
        var alpha = closeness * breathe;
        var touches = hovAddr && (E.A.userData.project.addr === hovAddr || E.B.userData.project.addr === hovAddr);
        if (touches) alpha = alpha * 2.4 + 0.5;
        alpha *= Math.min(1, Math.min(E.A.material.opacity, E.B.material.opacity) * 1.4);
        for (var _s2 = 0; _s2 < TOPO_SEG; _s2++) aArr[_s2] = alpha;
        _line.geometry.attributes.position.needsUpdate = true;
        _line.geometry.attributes.aA.needsUpdate = true;
      }
    }

    /* ============================================================
       v10 — ANAMORPHIC 0x00
       "I am 0x00, scattered everywhere." A cloud of shards hangs in
       camera-local space at random depths along rays toward a hidden view
       direction. From almost every angle it reads as stray dust — but turn
       to face the secret bearing and the shards collapse into a crisp
       "0x00". The TRACE readout in the HUD is the hot/cold radar; holding
       the alignment fires a lock event (sound + ripple).
       ============================================================ */
    function sampleGlyphLocal(text, count) {
      var cw = 720,
        ch = 260;
      var gc = document.createElement("canvas");
      gc.width = cw;
      gc.height = ch;
      var gx = gc.getContext("2d");
      gx.fillStyle = "#000";
      gx.fillRect(0, 0, cw, ch);
      gx.fillStyle = "#fff";
      gx.textAlign = "center";
      gx.textBaseline = "middle";
      gx.font = "700 210px 'Geist Mono', monospace";
      gx.fillText(text, cw / 2, ch / 2 + 6);
      var data = gx.getImageData(0, 0, cw, ch).data;
      var hits = [];
      for (var _y = 0; _y < ch; _y += 3) for (var _x = 0; _x < cw; _x += 3) {
        if (data[(_y * cw + _x) * 4] > 128) hits.push([_x, _y]);
      }
      for (var _i14 = hits.length - 1; _i14 > 0; _i14--) {
        var k = Math.random() * (_i14 + 1) | 0;
        var t = hits[_i14];
        hits[_i14] = hits[k];
        hits[k] = t;
      }
      var SC = 0.013;
      var out = new Float32Array(count * 2);
      for (var _i15 = 0; _i15 < count; _i15++) {
        var hpt = hits.length ? hits[_i15 % hits.length] : [cw / 2, ch / 2];
        out[_i15 * 2] = (hpt[0] + (Math.random() - 0.5) * 2 - cw / 2) * SC;
        out[_i15 * 2 + 1] = -(hpt[1] + (Math.random() - 0.5) * 2 - ch / 2) * SC;
      }
      return out;
    }
    var ANAM_N = 440;
    var ANAM_YAW = 2.35,
      ANAM_PITCH = 0.14,
      ANAM_D = 13;
    var anamDirV = function () {
      var q = new THREE.Quaternion().multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ANAM_YAW), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ANAM_PITCH));
      return new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize();
    }();
    var anamGeo = new THREE.BufferGeometry();
    var anamPos = new Float32Array(ANAM_N * 3);
    {
      var g2 = sampleGlyphLocal("0x00", ANAM_N);
      var up = new THREE.Vector3(0, 1, 0);
      var right = new THREE.Vector3().crossVectors(anamDirV, up).normalize();
      var up2 = new THREE.Vector3().crossVectors(right, anamDirV).normalize();
      var ray = new THREE.Vector3();
      for (var _i16 = 0; _i16 < ANAM_N; _i16++) {
        ray.copy(anamDirV).multiplyScalar(ANAM_D).addScaledVector(right, g2[_i16 * 2]).addScaledVector(up2, g2[_i16 * 2 + 1]).normalize();
        var depth = 6.5 + Math.random() * 15;
        anamPos[_i16 * 3] = ray.x * depth;
        anamPos[_i16 * 3 + 1] = ray.y * depth;
        anamPos[_i16 * 3 + 2] = ray.z * depth;
      }
    }
    anamGeo.setAttribute("position", new THREE.BufferAttribute(anamPos, 3));
    var anamPts = new THREE.Points(anamGeo, new THREE.PointsMaterial({
      color: 0x00f0c8,
      size: 0.085,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    anamPts.frustumCulled = false;
    var anamGroup = new THREE.Group();
    anamGroup.add(anamPts);
    // v10.1 — RETIRED per design review: the camera-locked shard glyph read as
    // "floating on top" rather than living in the universe. The layer stays
    // built (cheap, invisible) so the bearing hunt can return later in a
    // world-anchored form.
    anamGroup.visible = false;
    scene.add(anamGroup);
    var _anamA = 0,
      _anamHold = 0,
      _anamLockT = -30000,
      _anamTrace = 0;
    function updateAnamorph(now, dt, mode) {
      anamGroup.position.copy(cam.pos);
      var align = _camDir.dot(anamDirV);
      // radar value for the HUD (gradient as you turn toward the bearing)
      _anamTrace = Math.max(0, Math.min(1, (align - 0.1) / 0.88));
      // shards only resolve near-perfect alignment, and only in free drift
      var aT = (mode === "drift" ? 1 : 0) * THREE.MathUtils.smoothstep(align, 0.86, 0.995);
      _anamA += (aT - _anamA) * (1 - Math.pow(0.88, dt / 16));
      anamPts.material.opacity = (mode === "drift" ? 0.05 : 0.0) + _anamA * 0.85;
      anamPts.material.size = 0.085 + _anamA * 0.055;
      window.__mo_anam = {
        align: _anamTrace,
        locked: _anamA > 0.9
      };
      // LOCK — hold the bearing ~0.5s, 20s cooldown
      if (_anamA > 0.88) _anamHold += dt;else _anamHold = 0;
      if (_anamHold > 480 && now - _anamLockT > 20000) {
        _anamLockT = now;
        if (window.__mo_disturb) window.__mo_disturb(window.innerWidth / 2, window.innerHeight / 2, 1.3);
        try {
          window.dispatchEvent(new CustomEvent("mo:anamLock"));
        } catch (_) {}
      }
    }

    /* ---------- wrap helper — keep object within [-half, +half] BOX around camera ---------- */
    function wrapAroundCamera(obj, box) {
      var dx = obj.position.x - cam.pos.x;
      var dy = obj.position.y - cam.pos.y;
      var dz = obj.position.z - cam.pos.z;
      if (dx > box.x / 2) obj.position.x -= box.x;
      if (dx < -box.x / 2) obj.position.x += box.x;
      if (dy > box.y / 2) obj.position.y -= box.y;
      if (dy < -box.y / 2) obj.position.y += box.y;
      if (dz > box.z / 2) obj.position.z -= box.z;
      if (dz < -box.z / 2) obj.position.z += box.z;
    }

    /* ---------- input ---------- */
    // Announce the FIRST genuine engagement with the field (drag / wheel-fly /
    // node click) so the title's coachmark can dismiss itself. Cheap to fire
    // repeatedly — the title listener self-removes after the first event.
    var fireInteract = function fireInteract() {
      try {
        window.dispatchEvent(new CustomEvent("mo:universeInteract"));
      } catch (_) {}
    };
    var dragging = false,
      dragMoved = false;
    var lastX = 0,
      lastY = 0,
      downX = 0,
      downY = 0;
    var idleTimer = 0;
    var driftActive = true;
    // Pointer-in-zone tracking — wheel only flies the camera when the cursor
    // is over the universe mount (not over UI). Updated by pointer enter/leave.
    var pointerInZone = false;
    var stopDrift = function stopDrift() {
      driftActive = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        driftActive = true;
      }, 3200);
    };
    mount.addEventListener("pointerenter", function () {
      pointerInZone = true;
    });
    mount.addEventListener("pointerleave", function () {
      pointerInZone = false;
    });

    // v11 — multi-pointer tracking: one finger = look, two fingers = pinch-fly.
    var _pts = new Map();
    var pinching = false,
      _pinchD = 0;
    var _pinchDist = function _pinchDist() {
      var p = _toConsumableArray(_pts.values());
      return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    };
    mount.addEventListener("pointerdown", function (e) {
      _pts.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
      });
      if (_pts.size === 2) {
        pinching = true;
        _pinchD = _pinchDist();
        dragging = false;
        stopDrift();
        fireInteract();
        try {
          mount.setPointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }
      dragging = true;
      dragMoved = false;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      mount.style.cursor = "grabbing";
      stopDrift();
      mount.setPointerCapture(e.pointerId);
    });
    mount.addEventListener("pointerup", function (e) {
      _pts["delete"](e.pointerId);
      if (pinching) {
        if (_pts.size < 2) pinching = false;
        try {
          mount.releasePointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }
      if (!dragging) return;
      dragging = false;
      mount.style.cursor = "grab";
      try {
        mount.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (!dragMoved) handleClick(e.clientX, e.clientY);
    });
    mount.addEventListener("pointercancel", function (e) {
      _pts["delete"](e.pointerId);
      if (_pts.size < 2) pinching = false;
      dragging = false;
      mount.style.cursor = "grab";
    });
    mount.addEventListener("pointerleave", function () {
      hoverObjRef.current = null;
      setHover(null);
      if (window.MOSound && MOSound.unhover) MOSound.unhover();
    });
    // hover hit-test is throttled to one raycast per frame — high-frequency
    // mice fire several pointermove events per frame and the raycast is the cost.
    var hoverRaf = 0,
      hoverX = 0,
      hoverY = 0;
    var runHover = function runHover() {
      hoverRaf = 0;
      if (!dragging) handleHover(hoverX, hoverY);
    };
    mount.addEventListener("pointermove", function (e) {
      if (_pts.has(e.pointerId)) _pts.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
      });
      // v11 — pinch = fly: spread to dolly forward, squeeze to pull back.
      if (pinching) {
        if (_pts.size === 2) {
          var d = _pinchDist();
          cam.vel += (d - _pinchD) * 0.05;
          cam.vel = Math.max(-22, Math.min(22, cam.vel));
          _pinchD = d;
        }
        return;
      }
      if (dragging) {
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) {
          if (!dragMoved) fireInteract();
          dragMoved = true;
        }
        if (!gyroOn) {
          camTarget.yaw -= dx * 0.0035;
          camTarget.pitch -= dy * 0.0035;
          camTarget.pitch = Math.max(-1.45, Math.min(1.45, camTarget.pitch));
        }
        hoverObjRef.current = null;
        setHover(null);
      } else {
        hoverX = e.clientX;
        hoverY = e.clientY;
        if (!hoverRaf) hoverRaf = requestAnimationFrame(runHover);
      }
    });

    // Wheel: fly the camera only when the pointer is inside the universe zone
    // AND we're in drift mode (title/intro). Otherwise pass-through to page scroll.
    //
    // INTENT YIELD (opt-in via window.__mo_fx.wheelYield = px budget):
    // a visitor who only wants to move on keeps wheeling one way and never
    // looks around. Once that one-directional budget is spent the field hands
    // the wheel back to the page mid-gesture — nothing to press or aim at.
    // Reversing the wheel or any real look (drag / pinch / tap) re-arms flight.
    var _wAcc = 0,
      _wCeded = false;
    var rearmWheel = function rearmWheel() {
      _wAcc = 0;
      _wCeded = false;
    };
    mount.addEventListener("wheel", function (e) {
      if (!pointerInZone) return;
      if (modeRef.current !== "drift") return;
      var budget = window.__mo_fx && window.__mo_fx.wheelYield;
      if (budget) {
        if (e.deltaY > 0) {
          _wAcc += e.deltaY;
          if (_wCeded || _wAcc > budget) {
            if (!_wCeded) {
              _wCeded = true;
              document.body.classList.add("mo-yield");
              setTimeout(function () {
                return document.body.classList.remove("mo-yield");
              }, 1400);
            }
            return; // let the page take the scroll
          }
        } else {
          rearmWheel();
        }
      }
      e.preventDefault();
      fireInteract();
      cam.vel += -e.deltaY * 0.025;
      cam.vel = Math.max(-22, Math.min(22, cam.vel));
      stopDrift();
    }, {
      passive: false
    });
    mount.addEventListener("pointerdown", rearmWheel);

    /* ---------- v11 — MOBILE API: explore mode · fly · gyro look ----------
       Tiny surface for the touch EXPLORE overlay: fly(v) nudges camera
       velocity (FLY± hold buttons), setExplore toggles touch-action so a
       one-finger drag rotates the camera instead of scrolling the page,
       and setGyro maps device-orientation deltas onto the look target —
       calibrated to the pose at enable time, so "forward" stays wherever
       you were looking when you switched it on. */
    var gyroOn = false,
      _gyroBase = null;
    var onGyro = function onGyro(e) {
      if (!gyroOn || e.alpha == null || e.beta == null) return;
      if (!_gyroBase) _gyroBase = {
        a: e.alpha,
        b: e.beta,
        yaw: camTarget.yaw,
        pitch: camTarget.pitch
      };
      var da = e.alpha - _gyroBase.a;
      if (da > 180) da -= 360;else if (da < -180) da += 360;
      var db = e.beta - _gyroBase.b;
      camTarget.yaw = _gyroBase.yaw + da * (Math.PI / 180);
      camTarget.pitch = Math.max(-1.45, Math.min(1.45, _gyroBase.pitch + db * (Math.PI / 180) * 0.9));
    };
    window.addEventListener("deviceorientation", onGyro, true);
    window.__mo_universe = {
      fly: function fly(v) {
        cam.vel = Math.max(-22, Math.min(22, cam.vel + v));
        stopDrift();
        fireInteract();
      },
      setExplore: function setExplore(on) {
        mount.style.touchAction = on ? "none" : "";
        if (on) {
          stopDrift();
          fireInteract();
        }
      },
      setGyro: function setGyro(on) {
        gyroOn = !!on;
        _gyroBase = null;
      },
      isGyro: function isGyro() {
        return gyroOn;
      }
    };

    /* ---------- raycasting ---------- */
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    function pickAt(clientX, clientY) {
      var rect = mount.getBoundingClientRect();
      ndc.x = (clientX - rect.left) / rect.width * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      var hits = raycaster.intersectObjects(tiles, false);
      return hits[0] || null;
    }

    /* ---------- screen-space tile bounds (tight) ---------- */
    var v3 = new THREE.Vector3();
    var camDirTmp = new THREE.Vector3();
    // Hoisted scratch — reused every call (this runs per-move AND every frame
    // for HUD tracking, so per-call allocation showed up in the profile).
    var _tsbHW = TILE_W / 2,
      _tsbHH = TILE_H / 2;
    var _tsbCorners = [new THREE.Vector3(-_tsbHW, -_tsbHH, 0), new THREE.Vector3(_tsbHW, -_tsbHH, 0), new THREE.Vector3(-_tsbHW, _tsbHH, 0), new THREE.Vector3(_tsbHW, _tsbHH, 0)];
    var _tsbCamRel = new THREE.Vector3();
    function tileScreenBounds(mesh) {
      var rect = mount.getBoundingClientRect();
      var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      camera.getWorldDirection(camDirTmp);
      var _iterator4 = _createForOfIteratorHelper(_tsbCorners),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var c = _step4.value;
          v3.copy(c);
          mesh.localToWorld(v3);
          // skip overlay if any corner is behind the camera
          _tsbCamRel.copy(v3).sub(camera.position);
          if (_tsbCamRel.dot(camDirTmp) <= 0) return null;
          v3.project(camera);
          var sx = (v3.x * 0.5 + 0.5) * rect.width;
          var sy = (-v3.y * 0.5 + 0.5) * rect.height;
          if (sx < minX) minX = sx;
          if (sx > maxX) maxX = sx;
          if (sy < minY) minY = sy;
          if (sy > maxY) maxY = sy;
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
      };
    }

    /* ---------- screen-space tile CORNERS (perimeter order) ----------
       Returns the 4 projected corners of the tilted card quad in mount-local
       px — TL, TR, BR, BL clockwise — so the HUD can hug the card's true
       (rotated) shape instead of an axis-aligned box. null = behind camera. */
    var _tscCorners = [new THREE.Vector3(-_tsbHW, _tsbHH, 0),
    // TL (local y up)
    new THREE.Vector3(_tsbHW, _tsbHH, 0),
    // TR
    new THREE.Vector3(_tsbHW, -_tsbHH, 0),
    // BR
    new THREE.Vector3(-_tsbHW, -_tsbHH, 0) // BL
    ];
    var _tscOut = [{
      x: 0,
      y: 0
    }, {
      x: 0,
      y: 0
    }, {
      x: 0,
      y: 0
    }, {
      x: 0,
      y: 0
    }];
    function tileScreenCorners(mesh) {
      var rect = mount.getBoundingClientRect();
      camera.getWorldDirection(camDirTmp);
      for (var _i17 = 0; _i17 < 4; _i17++) {
        v3.copy(_tscCorners[_i17]);
        mesh.localToWorld(v3);
        _tsbCamRel.copy(v3).sub(camera.position);
        if (_tsbCamRel.dot(camDirTmp) <= 0) return null; // any corner behind cam → bail
        v3.project(camera);
        _tscOut[_i17].x = (v3.x * 0.5 + 0.5) * rect.width;
        _tscOut[_i17].y = (-v3.y * 0.5 + 0.5) * rect.height;
      }
      return _tscOut;
    }
    function handleHover(cx, cy) {
      var hit = pickAt(cx, cy);
      if (!hit) {
        if (hoverObjRef.current) {
          hoverObjRef.current = null;
          setHover(null);
          if (window.MOSound && MOSound.unhover) MOSound.unhover();
        }
        return;
      }
      var m = hit.object;
      // The frame loop repositions the HUD every frame from hoverObjRef, so we
      // only pay for a React re-render when the hovered PROJECT actually
      // changes — moving within the same card is free.
      if (hoverObjRef.current === m) return;
      var screen = tileScreenBounds(m);
      if (!screen) return;
      hoverObjRef.current = m;
      setHover({
        project: m.userData.project,
        screen: screen
      });
      // the touch disturbs the field — a soft ripple spreads from the node
      if (window.__mo_disturb) window.__mo_disturb(cx, cy, 0.3);
      // sonify: the hovered node sings its sideband against the 0x00 carrier
      if (window.MOSound && MOSound.hover) {
        MOSound.unhover();
        MOSound.hover(m.userData.project.addr);
      }
    }
    function handleClick(cx, cy) {
      var hit = pickAt(cx, cy);
      if (!hit) return;
      fireInteract();
      // a click is a strong disturbance — the wavefront blooms from the node
      if (window.__mo_disturb) window.__mo_disturb(cx, cy, 1.0);
      var m = hit.object;
      var p = m.userData.project;
      // sonify the click: strike this node + let the 0x00 carrier bloom
      if (window.MOSound && MOSound.open) MOSound.open(p.addr);

      // Aim the camera at the tile first so the screen composes around it.
      var rel = m.position.clone().sub(cam.pos);
      var yaw = Math.atan2(rel.x, -rel.z);
      var flat = Math.sqrt(rel.x * rel.x + rel.z * rel.z);
      var pitch = Math.atan2(rel.y, flat);
      camTarget.yaw = nearestAngle(camTarget.yaw, yaw);
      camTarget.pitch = Math.max(-1.45, Math.min(1.45, pitch));

      // If this project has its own page, fly to it.
      if (p.file) {
        cam.vel = Math.max(cam.vel, 6); // small forward dolly = "clicking into"
        var originRect = tileScreenBounds(m); // where the card sits on screen NOW
        navigateToProject(p, originRect);
        return;
      }
      cam.vel = Math.max(cam.vel, 0);
      setActiveAddr(p.addr);
      if (onActive) onActive(p);
      stopDrift();
    }
    function navigateToProject(p, originRect) {
      // v3 hook: when a host (Landing v3) wants to open projects in-place as
      // cards (no page load), it installs window.__mo_open_project. v2 never
      // sets it, so the classic fly-out navigation below is unchanged there.
      if (typeof window.__mo_open_project === "function") {
        window.__mo_open_project(p, originRect);
        return;
      }
      sessionStorage.setItem("mo_navigate_from_addr", p.addr);
      document.body.classList.add("landing-exit");
      setTimeout(function () {
        window.location.href = p.file;
      }, 380);
    }
    function nearestAngle(cur, t) {
      while (t - cur > Math.PI) t -= Math.PI * 2;
      while (t - cur < -Math.PI) t += Math.PI * 2;
      return t;
    }

    /* ---------- resize ---------- */
    var onResize = function onResize() {
      var s = sz();
      w = s.w;
      h = s.h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fitGlyphToView();
      if (cursorFx) cursorFx.resize(w, h);
      if (composer) composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    var ro = new ResizeObserver(onResize);
    ro.observe(mount);

    /* ---------- loop ---------- */
    var raf;
    var last = performance.now();
    var frameI = 0;
    var FORWARD = new THREE.Vector3();

    // Hoisted scratch — reused every frame so the hot loops allocate nothing.
    var _camDir = new THREE.Vector3();
    var _off = new THREE.Vector3();
    var _localOff = new THREE.Vector3();
    var _lookM = new THREE.Matrix4();
    var _baseQ = new THREE.Quaternion();
    var _offQ = new THREE.Quaternion();
    var _euler = new THREE.Euler();
    var _vScale = new THREE.Vector3();
    // Star wrap box never changes — compute once instead of cloning per frame.
    var SBOX = BOX.clone().multiplyScalar(stars.userData.wrapScale);
    // Keep absolute coordinates small over very long sessions: when the camera
    // has flown far from the origin, shift the whole world back so floats stay
    // precise (everything wraps around the camera, so this is invisible).
    var REBASE_DIST2 = 600 * 600;
    function shiftBufferAttr(attr, sx, sy, sz) {
      var a = attr.array;
      for (var _i18 = 0; _i18 < a.length; _i18 += 3) {
        a[_i18] -= sx;
        a[_i18 + 1] -= sy;
        a[_i18 + 2] -= sz;
      }
      attr.needsUpdate = true;
    }
    function rebaseWorld() {
      var sx = cam.pos.x,
        sy = cam.pos.y,
        sz = cam.pos.z;
      cam.pos.set(0, 0, 0);
      camera.position.copy(cam.pos);
      var _iterator5 = _createForOfIteratorHelper(tiles),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var m = _step5.value;
          m.position.x -= sx;
          m.position.y -= sy;
          m.position.z -= sz;
          var d = m.userData.driftTarget;
          if (d) {
            d.x -= sx;
            d.y -= sy;
            d.z -= sz;
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      var _iterator6 = _createForOfIteratorHelper(ambient),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var _sp = _step6.value;
          _sp.position.x -= sx;
          _sp.position.y -= sy;
          _sp.position.z -= sz;
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      shiftBufferAttr(stars.geometry.attributes.position, sx, sy, sz);
      var aArr = assemblyPts.geometry.attributes.position.array;
      for (var _i19 = 0; _i19 < aArr.length; _i19 += 3) {
        aArr[_i19] -= sx;
        aArr[_i19 + 1] -= sy;
        aArr[_i19 + 2] -= sz;
        asmHome[_i19] -= sx;
        asmHome[_i19 + 1] -= sy;
        asmHome[_i19 + 2] -= sz;
      }
      // The field-follow tracker is in absolute world space too — after a rebase
      // the camera sits at the origin, so the tracker must reset with it (else
      // the next frame computes a gigantic camera delta and flings the field).
      _fieldCam.set(0, 0, 0);
      assemblyPts.geometry.attributes.position.needsUpdate = true;
    }

    // Wrap the assembly field around the camera, mirroring each ±BOX shift onto
    // the rendered buffer so eased points never streak across the box on wrap.
    function wrapAssemblyField(arr, home, box) {
      for (var _i20 = 0; _i20 < home.length; _i20 += 3) {
        var dx = home[_i20] - cam.pos.x;
        var dy = home[_i20 + 1] - cam.pos.y;
        var dz = home[_i20 + 2] - cam.pos.z;
        if (dx > box.x / 2) {
          home[_i20] -= box.x;
          arr[_i20] -= box.x;
        } else if (dx < -box.x / 2) {
          home[_i20] += box.x;
          arr[_i20] += box.x;
        }
        if (dy > box.y / 2) {
          home[_i20 + 1] -= box.y;
          arr[_i20 + 1] -= box.y;
        } else if (dy < -box.y / 2) {
          home[_i20 + 1] += box.y;
          arr[_i20 + 1] += box.y;
        }
        if (dz > box.z / 2) {
          home[_i20 + 2] -= box.z;
          arr[_i20 + 2] -= box.z;
        } else if (dz < -box.z / 2) {
          home[_i20 + 2] += box.z;
          arr[_i20 + 2] += box.z;
        }
      }
    }
    var prevMode = mode;
    // v13 — flight treadmill state (persists across frames)
    var flowSm = 0;
    var FLOW_RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // Persistent assembly state — eased every frame so the "0x00" glyph forms and
    // melts smoothly, fully decoupled from the discrete React `mode` (which flips
    // on a coarse IntersectionObserver and can lag / stick). Formation is driven
    // purely by the origin section's continuous scroll progress.
    var formActual = 0;
    var _glyphC = new THREE.Vector3();
    // Camera position the assembly field was last anchored to. While the glyph
    // is formed we translate the field by the per-frame camera delta so the
    // un-formed scatter stays in NEAR space around the viewer (see frame loop).
    var _fieldCam = new THREE.Vector3();
    function scatterTiles() {
      // Pick a fresh random spot per tile (centred on camera) and store it as a
      // drift target. The tile keeps its current position; the drift-mode loop
      // lerps toward this target so leaving grid/ambient looks smooth either
      // direction, instead of snapping + fading in.
      var _iterator7 = _createForOfIteratorHelper(tiles),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var m = _step7.value;
          var yN = 1 - m.userData.index / Math.max(1, projects.length - 1) * 2;
          var radial = Math.sqrt(1 - yN * yN);
          // jitter the theta each scatter so it doesn't always come back the same way
          var theta = m.userData.index * goldenAngle + (Math.random() - 0.5) * 1.5;
          var r = 0.55 + 0.30 * Math.random();
          m.userData.driftTarget = new THREE.Vector3(cam.pos.x + Math.cos(theta) * radial * BOX.x * r * 0.55, cam.pos.y + yN * BOX.y * r * 0.6 + (Math.random() - 0.5) * 4, cam.pos.z + Math.sin(theta) * radial * BOX.z * r * 0.55);
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
    }
    function frame(now) {
      // Paused while the inline board flight covers the viewport — saves the GPU
      // from rendering two WebGL scenes at once. dt is reset so resume won't jump.
      // Also pause when the tab/preview is hidden (no point rendering offscreen).
      if (window.__mo_universe_pause || document.hidden || !uniOnScreen) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      var dt = Math.max(0, Math.min(50, now - last));
      last = now;
      var mode = modeRef.current;
      var focusAddrNow = focusRef.current;
      var isArranged = mode === "grid" || mode === "reel" || mode === "ambient" || mode === "origin" || mode === "dive";

      /* ── v10 per-frame FX state ── */
      // real audio output level → the field visibly breathes with the sound
      var lvlT = window.MOSound && window.MOSound.getLevel && !window.MOSound.isMuted() ? window.MOSound.getLevel() : 0;
      _lvlS += (lvlT - _lvlS) * (1 - Math.pow(0.86, dt / 16));
      // arrival overture — collapse → burst → the field fades up
      var arrFade = 1,
        arrCollapse = 0;
      if (ARR.t0) {
        var ap = (now - ARR.t0) / ARR.dur;
        if (ap >= 1) ARR.t0 = 0;else {
          arrCollapse = 1 - THREE.MathUtils.smoothstep(ap, 0.40, 0.62);
          arrFade = THREE.MathUtils.smoothstep(ap, 0.50, 0.92);
          if (!ARR.burst && ap >= 0.42) {
            ARR.burst = true;
            if (window.__mo_disturb) window.__mo_disturb(window.innerWidth / 2, window.innerHeight * 0.52, 1.35);
            try {
              if (window.CarrierField && window.CarrierField.isWoken() && window.MOSound && !window.MOSound.isMuted()) window.CarrierField.carrierAccent(1);
            } catch (_) {}
          }
        }
      }
      stars.material.opacity = (0.7 + _lvlS * 0.45) * (0.35 + 0.65 * arrFade);
      // idle attention — after ~30s of stillness the field notices you:
      // the camera turns softly toward the nearest node, a slow ripple
      // crosses the screen, and the field murmurs.
      if (mode === "drift" && !_idleFired && now - _lastAct > 30000 && !ARR.t0) {
        _idleFired = true;
        var nearTile = null,
          nd = Infinity;
        var _iterator8 = _createForOfIteratorHelper(tiles),
          _step8;
        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var m = _step8.value;
            var d = m.position.distanceToSquared(camera.position);
            if (d > 9 && d < nd) {
              nd = d;
              nearTile = m;
            }
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
        if (nearTile) {
          var rel = nearTile.position.clone().sub(cam.pos);
          camTarget.yaw = nearestAngle(camTarget.yaw, Math.atan2(rel.x, -rel.z));
          camTarget.pitch = Math.max(-1.2, Math.min(1.2, Math.atan2(rel.y, Math.sqrt(rel.x * rel.x + rel.z * rel.z))));
        }
        if (window.__mo_disturb) window.__mo_disturb(window.innerWidth / 2, window.innerHeight / 2, 0.9);
        try {
          if (window.MOSound && !window.MOSound.isMuted() && window.MOSound.gather) window.MOSound.gather();
        } catch (_) {}
        setIdleNote(true);
        setTimeout(function () {
          return setIdleNote(false);
        }, 6000);
      }

      // Detect mode change. Going from an arranged mode back to drift needs
      // a fresh scatter — otherwise the cards stay locked forever.
      if (mode !== prevMode) {
        if (mode === "drift" && (prevMode === "grid" || prevMode === "reel" || prevMode === "ambient" || prevMode === "origin" || prevMode === "dive")) {
          scatterTiles();
        }
        prevMode = mode;
      }

      /* idle drift — only in drift mode */
      if (!FLOW_RM && driftActive && mode === "drift") {
        cam.vel += dt * 0.0008; // tiny accel toward forward drift
        camTarget.yaw += dt * 0.000035; // v14: halved — the parallax drift now carries the motion
        camTarget.pitch += Math.sin(now * 0.00022) * dt * 0.00003;
      }

      /* v13 — TRANSIT TREADMILL: the camera stays PARKED (the v12 framing
         guarantee — formations always assemble dead ahead of a settled,
         centered camera) and the WORLD streams past it instead. Every
         wrapped layer — free tiles, ambient motes, stars, the teal signal
         field — flows backward along the look axis while the flight
         timeline is in a transit leg; the torus wrap recycles everything,
         so the field is an infinite treadmill. It reads as real travel
         from any camera pose and can never strand content off-screen,
         because nothing FORMED ever moves. A soft roll banks into each
         leg; FOV + aberration surge ride on top (further down). */
      var _fl = window.__mo_flight || {};
      var _flTransit = _fl.seg === "toOrigin" || _fl.seg === "toWork" || _fl.seg === "toAbout";
      var _flowDX = 0,
        _flowDY = 0,
        _flowDZ = 0;
      {
        var cfgF = window.__mo_flightCfg || {};
        var styleMul = cfgF.style === "calm" ? 0.45 : 1;
        var warpMul = (cfgF.warp != null ? cfgF.warp : 65) / 65;
        var flowTarget = 0,
          rollTarget = 0;
        if (_flTransit && !FLOW_RM) {
          var _tt = Math.max(0, Math.min(1, _fl.t || 0));
          var bell = Math.sin(Math.PI * _tt); // ease in and out of the leg
          flowTarget = (3.4 + Math.min(24, _fl.speed || 0) * 0.6) * bell * styleMul * warpMul;
          var legRoll = _fl.seg === "toWork" ? 1 : _fl.seg === "toAbout" ? -0.7 : -0.45;
          // optional page-level scaler (window.__mo_fx.legRoll) — Landing Final 2
          // tempers the toWork bank; defaults to 1 so other pages are unchanged.
          var legRollMul = window.__mo_fx && window.__mo_fx.legRoll != null ? window.__mo_fx.legRoll : 1;
          rollTarget = legRoll * 0.055 * bell * styleMul * Math.min(1.3, warpMul) * legRollMul;
        }
        flowSm += (flowTarget - flowSm) * (1 - Math.pow(0.90, dt / 16));
        camRollFX += (rollTarget - camRollFX) * (1 - Math.pow(0.93, dt / 16));
        if (flowSm > 0.02) {
          // level flow along the look heading — vertical framing never shifts
          var _d = flowSm * dt / 1000;
          _flowDX = -Math.sin(cam.yaw) * _d;
          _flowDZ = -Math.cos(cam.yaw) * _d;
          _flowDY = 0;
          // stars + ambient motes stream every transit; free tiles only while
          // drifting (arranged tiles are formation members — they hold).
          shiftBufferAttr(stars.geometry.attributes.position, _flowDX, _flowDY, _flowDZ);
          stars.geometry.attributes.position.needsUpdate = true;
          var _iterator9 = _createForOfIteratorHelper(ambient),
            _step9;
          try {
            for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
              var _sp2 = _step9.value;
              _sp2.position.x -= _flowDX;
              _sp2.position.z -= _flowDZ;
            }
          } catch (err) {
            _iterator9.e(err);
          } finally {
            _iterator9.f();
          }
          if (mode === "drift") {
            var _iterator0 = _createForOfIteratorHelper(tiles),
              _step0;
            try {
              for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
                var _m = _step0.value;
                if (_m.userData.driftTarget) continue;
                _m.position.x -= _flowDX;
                _m.position.z -= _flowDZ;
              }
            } catch (err) {
              _iterator0.e(err);
            } finally {
              _iterator0.f();
            }
          }
        } else if (!_flTransit) {
          _flowDX = _flowDY = _flowDZ = 0;
        }
      }
      if (isArranged) {
        cam.vel *= Math.pow(0.86, dt / 16);
        camTarget.yaw *= Math.pow(0.92, dt / 16);
        camTarget.pitch *= Math.pow(0.92, dt / 16);
        cam.pos.multiplyScalar(Math.pow(0.94, dt / 16));
      }

      /* damping on velocity */
      cam.vel *= Math.pow(0.92, dt / 16);
      // clamp tiny
      if (Math.abs(cam.vel) < 0.04) cam.vel = 0;

      /* ease camera angles */
      var k = 1 - Math.pow(0.001, dt / 1000);
      cam.yaw += (camTarget.yaw - cam.yaw) * k;
      cam.pitch += (camTarget.pitch - cam.pitch) * k;
      cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch));

      /* advance position along current look direction */
      updateCameraTransform();
      camera.getWorldDirection(FORWARD);
      cam.pos.addScaledVector(FORWARD, cam.vel * dt / 1000);

      /* v14 — parallax drift: slow lateral wander in camera-local space.
         Damped to PDRIFT.focusDamp whenever a card is focused/hovered or the
         user is actively driving, so reading a label never feels seasick. */
      if (PDRIFT.amp > 0 && !FLOW_RM) {
        var wantGain = mode === "drift" && driftActive && !dragging && !activeAddr && !hoverObjRef.current ? 1 : PDRIFT.focusDamp;
        var gainRate = wantGain < pdriftGain ? 8 : PDRIFT.ease;
        pdriftGain += (wantGain - pdriftGain) * (1 - Math.exp(-gainRate * dt / 1000));
        var _s3 = dt / 1000;
        var wx = Math.PI * 2 / PDRIFT.px,
          wy = Math.PI * 2 / PDRIFT.py;
        // derivative of sin() → drift velocity, not a spring back to home
        var vx = Math.cos(now / 1000 * wx) * PDRIFT.amp * pdriftGain;
        var vy = Math.cos(now / 1000 * wy + 1.7) * PDRIFT.amp * 0.55 * pdriftGain;
        _pdR.set(1, 0, 0).applyQuaternion(camera.quaternion);
        _pdU.set(0, 1, 0).applyQuaternion(camera.quaternion);
        cam.pos.addScaledVector(_pdR, vx * _s3);
        cam.pos.addScaledVector(_pdU, vy * _s3);
      }

      // Re-apply position
      camera.position.copy(cam.pos);

      // Long-session safety: recentre the world when we've flown far out.
      if (cam.pos.lengthSq() > REBASE_DIST2) rebaseWorld();

      // dt-corrected easing factor — keeps motion identical at 30/60/120Hz so
      // re-orientation and scaling feel the same (native) regardless of refresh.
      var lerpK = function lerpK(rate) {
        return 1 - Math.pow(1 - rate, dt / 16);
      };

      /* wrap drifting objects — only in free drift mode */
      if (mode === "drift") {
        var _iterator1 = _createForOfIteratorHelper(tiles),
          _step1;
        try {
          for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
            var _m2 = _step1.value;
            // If a fresh drift target was queued on mode-change, ease toward it
            // and DO NOT wrap — grid/ambient positions sit outside the wrap box
            // (z = ±16 vs box half-depth 13), so wrapping here would teleport the
            // tile across the camera before the lerp could play. Skip the wrap
            // until we've landed inside the box, then resume normal wrapping.
            var dt2 = _m2.userData.driftTarget;
            if (dt2) {
              var rate = 0.025; // matches forward grid → ambient feel
              _m2.position.lerp(dt2, 1 - Math.pow(1 - rate, dt / 16));
              if (_m2.position.distanceToSquared(dt2) < 0.09) {
                _m2.userData.driftTarget = null;
              }
            } else {
              wrapAroundCamera(_m2, BOX);
            }
          }
        } catch (err) {
          _iterator1.e(err);
        } finally {
          _iterator1.f();
        }
      }
      var _iterator10 = _createForOfIteratorHelper(ambient),
        _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var _sp4 = _step10.value;
          wrapAroundCamera(_sp4, BOX);
        }
        // stars wrap in a larger box for parallax illusion
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      wrapPointsAroundCamera(stars, SBOX);

      /* small per-tile overlays — wireframe primitives OR loaded GLBs.
         Both branches follow their parent tile, rotate, and fade with it.
         Models are centred on the card face and pushed further toward camera
         so they read as the hero element; wireframes sit small above the art. */
      // World-direction is constant for all overlays this frame — fetch once.
      camera.getWorldDirection(_camDir);
      var _iterator11 = _createForOfIteratorHelper(tileWires),
        _step11;
      try {
        var _loop2 = function _loop2() {
          var wire = _step11.value;
          var parent = wire.userData.parentTile;
          if (!parent) return 1; // continue
          var isModel = !!wire.userData.isModel;
          // Offset toward viewer — bigger for full models so they clear the card.
          var forwardDist = isModel ? 1.4 : 0.6;
          _off.copy(_camDir).multiplyScalar(-forwardDist);
          // Card-local offset: models can be nudged to their visual centre;
          // wireframes stay just above the card art.
          var modelOffset = isModel ? parent.userData.project.modelOffset || {} : {};
          _localOff.set(modelOffset.x || 0, isModel ? modelOffset.y || 0 : parent.scale.y * 1.05, modelOffset.z || 0).applyQuaternion(parent.quaternion);
          wire.position.set(parent.position.x + _off.x + _localOff.x, parent.position.y + _off.y + _localOff.y, parent.position.z + _off.z + _localOff.z);
          // Continuous slow rotation. Loaded GLBs are the "hero" presentation —
          // they get a gentle yaw-only drift so the form stays readable and
          // mostly faces the camera. Wireframe primitives still tumble as
          // before (cheap, abstract, more decorative).
          if (!FLOW_RM && isModel) {
            wire.rotation.y += dt * 0.00015;
          } else if (!FLOW_RM && wire.userData.prim === "cone") {
            wire.rotation.y += dt * 0.00072;
          } else if (!FLOW_RM) {
            wire.rotation.y += dt * 0.0006;
            wire.rotation.x += dt * 0.00024;
          }
          // Match parent visibility
          var tileOp = parent.material.opacity;
          var overlayOp = Math.min(0.95, tileOp * 1.15);
          if (isModel) {
            // Loaded GLB — fade every matcap material in the subtree, and hide
            // the whole group below a threshold so we don't pay for invisible draws.
            if (wire.userData.loaded) {
              // Soft fade-in from the moment the GLB lands, so the model eases up
              // instead of popping (the parent tile may already be fully visible).
              var mFade = THREE.MathUtils.smoothstep(now - (wire.userData.loadedAt || now), 0, 600);
              // Per request: loaded matcap models render FULLY SOLID at rest —
              //  (1) no 0.95 cap (use the full distance opacity, clamped to 1), and
              //  (2) no mode dimming (use the tile's pre-dim base opacity).
              // Distance fade and the load fade-in are preserved.
              var modelTileOp = parent.userData.modelOpacityBase != null ? parent.userData.modelOpacityBase : tileOp;
              var modelOp = Math.min(1, modelTileOp * 1.15) * mFade;
              wire.visible = modelOp > 0.02;
              wire.traverse(function (obj) {
                if (obj.isMesh && obj.material) obj.material.opacity = modelOp;
              });
            }
          } else {
            // Procedural wireframe primitive — single material
            wire.material.opacity = overlayOp;
          }
          // Pop with focus — models start much larger than wireframes.
          var isFocused = focusAddrNow && wire.userData.addr === focusAddrNow;
          var baseScale = isModel ? 0.85 : 0.28;
          var focusScale = isModel ? 1.10 : 0.42;
          var targetScale = isFocused ? focusScale : baseScale;
          wire.scale.lerp(_vScale.set(targetScale, targetScale, targetScale), lerpK(0.10));
        };
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          if (_loop2()) continue;
        }

        /* tiles: position-lerp to arranged targets, then orient */
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      var _iterator12 = _createForOfIteratorHelper(tiles),
        _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var _m3 = _step12.value;
          var target = targetForTile(mode, _m3.userData.index, now);
          if (target) {
            // ease toward target; rate depends on distance for snappy arrange
            // reel must track the scrubbed scroll position tightly — a slow lerp
            // would let the parade lag the captions.
            var _rate = mode === "reel" ? 0.18 : mode === "grid" ? 0.055 : 0.025;
            _m3.position.lerp(target, 1 - Math.pow(1 - _rate, dt / 16));
          }

          // For meshes (not cameras), Object3D.lookAt aligns local +Z to target.
          // PlaneGeometry's visible face IS the +Z face — so look AT the camera.
          _lookM.lookAt(camera.position, _m3.position, camera.up);
          _baseQ.setFromRotationMatrix(_lookM);

          // Per-card constant offset so each tile floats at its own angle (suppressed in grid)
          var offFactor = mode === "grid" || mode === "reel" ? 0.15 : 1.0;
          _euler.set(_m3.userData.offsetPitch * offFactor, _m3.userData.offsetYaw * offFactor, (_m3.userData.offsetRoll + Math.sin(now * 0.0006 + _m3.userData.wobble.p * 6) * 0.04) * offFactor, "YXZ");
          _offQ.setFromEuler(_euler);
          _baseQ.multiply(_offQ);

          // SOFT slerp — cards re-orient slowly so they feel like floating objects
          _m3.quaternion.slerp(_baseQ, lerpK(mode === "grid" || mode === "reel" ? 0.12 : 0.06));

          // Band-pass visibility per mode
          var dist = _m3.position.distanceTo(camera.position);
          var nearIn = void 0,
            farOut = void 0;
          if (mode === "grid") {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.0, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 26, 40);
          } else if (mode === "reel") {
            // v11.2 — the "Catloading impostor" fix. The real culprit was THIS
            // band, not the parade spacing: non-featured tiles park on a scatter
            // ring 20–24u out, dead centre of the old 17→26 far-fade — so they
            // hung around at ~50% opacity as blurred ghosts behind the captions.
            // Tight band while the reel plays (active card at 10.6u stays hot,
            // everything past ~16.5u is gone); the band relaxes toward the old
            // range during the final gather so the carousel's far side can
            // recede into the deep field instead of vanishing.
            var rg = Math.max(0, Math.min(1, ((window.__mo_reel || {}).pos || 0) - MO_FEATURED.length));
            nearIn = THREE.MathUtils.smoothstep(dist, 2.0, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 13 + rg * 4, 16.5 + rg * 9.5);
          } else if (mode === "ambient") {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 18, 28);
          } else if (mode === "drift") {
            // DRIFT is the ONLY mode where the tile pool wraps around the camera
            // inside BOX. A spherical far-fade sat almost entirely OUTSIDE the box
            // (corner ≈ 20.5), so tiles teleported across the wrap boundary while
            // still ~95% opaque → the "sudden appearance". Fade by proximity to the
            // wrap surface instead: edge = 0 at box centre, 1 at the face a tile is
            // about to cross. Full opacity until 95% of the way out, then a quick
            // fade across the final 5% shell so the wrap happens invisibly.
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            var ex = Math.abs(_m3.position.x - camera.position.x) / (BOX.x / 2);
            var ey = Math.abs(_m3.position.y - camera.position.y) / (BOX.y / 2);
            var ez = Math.abs(_m3.position.z - camera.position.z) / (BOX.z / 2);
            var edge = Math.max(ex, ey, ez);
            farOut = THREE.MathUtils.smoothstep(edge, 0.95, 1.0);
          } else if (mode === "dive") {
            // DIVE deliberately clears the field far out so only the hub remains —
            // keep the original aggressive far-fade so distant tiles dissolve.
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 20, 32);
          } else {
            // origin — tiles arrange on a ring (~16–26u) that sits OUTSIDE the wrap
            // box, so a box-edge fade would wrongly treat them as past the boundary
            // and hide them. Push the spherical far-fade out past the ring so the
            // cards stay solid and readable; fog still lends gentle depth.
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 34, 48);
          }
          var opacity = nearIn * (1 - farOut);
          // Loaded matcap models intentionally ignore mode dimming (per request):
          // capture the distance-only opacity BEFORE the ambient/grid multipliers so
          // models read equally solid in every mode. Focus is applied below to both.
          var modelOpacityBase = opacity;
          if (mode === "ambient") opacity *= 0.38; // recede behind content
          if (mode === "grid") opacity *= 0.92; // slightly tame so HUD reads
          if (mode === "reel") opacity *= 0.96; // the tiles ARE the reel — keep them hot

          // Focus highlight — pop the matching tile
          var isFocused = focusAddrNow && _m3.userData.project.addr === focusAddrNow;
          if (isFocused) {
            opacity = Math.min(1, opacity * 1.6 + 0.25);
            modelOpacityBase = Math.min(1, modelOpacityBase * 1.6 + 0.25);
            _m3.scale.lerp(_vScale.set(1.18, 1.18, 1), lerpK(0.14));
          } else {
            _m3.scale.lerp(_vScale.set(1, 1, 1), lerpK(0.10));
          }
          // Temporal smoothing — the distance-band definitions switch INSTANTLY
          // when the mode flips (drift box-edge → origin sphere → reel tight
          // band), which used to blink whole cards out in a single frame around
          // the origin transits. Ease the rendered opacity toward its target so
          // every band hand-off reads as a fade, never a pop.
          var uD = _m3.userData;
          var opK = lerpK(0.10);
          uD.opSm = uD.opSm == null ? opacity : uD.opSm + (opacity - uD.opSm) * opK;
          uD.mobSm = uD.mobSm == null ? modelOpacityBase : uD.mobSm + (modelOpacityBase - uD.mobSm) * opK;
          _m3.material.opacity = uD.opSm * arrFade;
          uD.modelOpacityBase = uD.mobSm * arrFade;
        }

        /* ambient pulse */
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      var _iterator13 = _createForOfIteratorHelper(ambient),
        _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
          var _sp5 = _step13.value;
          var phase = _sp5.userData.phase + now * 0.0008;
          var _dist = _sp5.position.distanceTo(camera.position);
          var _nearIn = THREE.MathUtils.smoothstep(_dist, 1.5, 5.0);
          // Wrap-surface fade (same reasoning as tiles) so ambient motes dissolve
          // before they teleport across the box rather than blinking in.
          var _ex = Math.abs(_sp5.position.x - camera.position.x) / (BOX.x / 2);
          var _ey = Math.abs(_sp5.position.y - camera.position.y) / (BOX.y / 2);
          var _ez = Math.abs(_sp5.position.z - camera.position.z) / (BOX.z / 2);
          var _farOut = THREE.MathUtils.smoothstep(Math.max(_ex, _ey, _ez), 0.95, 1.0);
          var _pulse = 0.65 + Math.sin(phase) * 0.20;
          var aOp = _pulse * _nearIn * (1 - _farOut);
          if (mode !== "drift") aOp *= 0.35;
          _sp5.material.opacity = aOp * arrFade;
        }

        /* HUD frame tracking — the overlay is sized to the hovered card's
           projected bounds so its corner brackets lock onto the card like a
           targeting reticle. Clamped (incl. tab/readout margins) to stay on
           screen. */
        /* HUD lock-on tracking — feed the card's 4 projected corners to the
           targeting frame so its brackets hug the card's true (rotated) shape.
           No viewport clamp: the frame tracks the card exactly and clips
           naturally at the screen edge, instead of detaching to the corner. */
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      if (hoverObjRef.current && overlayRef.current) {
        var corners = tileScreenCorners(hoverObjRef.current);
        var el = overlayRef.current;
        if (corners && el.__updateHUD) {
          el.style.display = "";
          el.__updateHUD(corners);
        } else {
          el.style.display = "none";
        }
      }

      /* ---------- Signal field ⇄ "0x00" glyph ----------
         The teal particles are permanent residents of the field: they drift and
         wrap around the camera like stars. As the ORIGIN section scrolls into
         view they peel out of the field to FORM node 0x00 in front of the
         camera, then melt back. One layer — the glyph IS universe particles.
           Formation is driven by the section's continuous scroll progress and an
         eased `formActual`, NOT by the discrete React mode. That means it can
         begin assembling the instant the section enters view and always melts
         cleanly when you scroll away — no "stuck formed" or "never appeared". */
      {
        var ob = window.__mo_origin || {
          p: 0,
          active: false,
          concept: "assembly"
        };
        var concept = ob.concept || "assembly";
        var op = Math.max(0, Math.min(1, ob.p || 0));
        var eP = op < 0.5 ? 2 * op * op : 1 - Math.pow(-2 * op + 2, 2) / 2; // easeInOut

        // ---- HUB concept (exploration only) ----
        var showHub = mode === "origin" && concept === "hub";
        originGroup.visible = showHub;
        if (showHub) {
          originHub.material.opacity = 0.25 + eP * 0.75;
          var pulse = 1 + Math.sin(now * 0.0025) * 0.04;
          originHub.scale.set(4.2 * pulse, 4.2 * pulse, 1);
          var _iterator14 = _createForOfIteratorHelper(originLinks),
            _step14;
          try {
            for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
              var link = _step14.value;
              var tile = link.userData.tile;
              var la = link.geometry.attributes.position.array;
              la[0] = ORIGIN_CENTER.x;
              la[1] = ORIGIN_CENTER.y;
              la[2] = ORIGIN_CENTER.z;
              la[3] = tile.position.x;
              la[4] = tile.position.y;
              la[5] = tile.position.z;
              link.geometry.attributes.position.needsUpdate = true;
              link.material.opacity = eP * 0.45;
            }
          } catch (err) {
            _iterator14.e(err);
          } finally {
            _iterator14.f();
          }
        }

        // ---- DIVE ignition (about gateway → board) ----
        var inDive = mode === "dive";
        var igE = 0,
          eD = 0;
        if (inDive) {
          var db = window.__mo_dive || {
            p: 0,
            igniting: false
          };
          var dp = Math.max(0, Math.min(1, db.p || 0));
          eD = dp < 0.5 ? 2 * dp * dp : 1 - Math.pow(-2 * dp + 2, 2) / 2;
          if (db.igniting && !db._t0) db._t0 = now;
          var igT = db._t0 ? Math.max(0, Math.min(1, (now - db._t0) / 720)) : 0;
          igE = igT * igT; // easeIn — accelerates into the board
        } else if (window.__mo_dive && window.__mo_dive._t0) {
          window.__mo_dive._t0 = 0;
          window.__mo_dive.igniting = false;
        }

        // ---- target formedness (0 = pure field, 1 = full glyph) ----
        // Continuous: rises with origin-section scroll whenever the section is in
        // its active band; the dive holds a partial form. Never keyed to `mode`.
        var formTarget = 0;
        if (inDive) formTarget = 0.35 + eD * 0.65;else if (ob.active && concept !== "hub") formTarget = eP;
        // Ease toward the target so entry/exit is always gradual (no pop when the
        // section's active flag toggles mid-scroll).
        formActual += (formTarget - formActual) * lerpK(0.09);
        if (formActual < 0.0015 && formTarget === 0) formActual = 0;
        var formP = formActual;
        var arr = assemblyPts.geometry.attributes.position.array;

        // ── Field-follow — keeps the scatter source in NEAR space ──
        // While the glyph is even slightly formed we STOP wrapping the field and
        // instead slide every home (and its rendered point) by the camera's
        // per-frame delta. Origin/dive ease the camera toward world-0, and free
        // flight can start far out; without this the home cloud stays frozen in
        // world space, gets left behind, and partially-formed particles streak
        // in from that one distant point instead of scattering from up close.
        var _fdx = cam.pos.x - _fieldCam.x;
        var _fdy = cam.pos.y - _fieldCam.y;
        var _fdz = cam.pos.z - _fieldCam.z;
        _fieldCam.copy(cam.pos);
        // Engage the rigid carry the instant the section is ARRANGED — which is
        // exactly when the camera begins easing back toward world-0 — not only
        // once formP has measurably ramped. After a far drift the pull-home moves
        // the camera ~6%/frame of its distance, so the first few "still a pure
        // field" frames would let the rendered points fall behind; formation would
        // then reel them in from that distant trail instead of scattering them
        // from near space. Gluing from frame one keeps the field pinned to the
        // viewer through the whole approach-and-form.
        if ((formP >= 0.0015 || isArranged) && (_fdx || _fdy || _fdz)) {
          for (var _i21 = 0; _i21 < ASM_N * 3; _i21 += 3) {
            asmHome[_i21] += _fdx;
            arr[_i21] += _fdx;
            asmHome[_i21 + 1] += _fdy;
            arr[_i21 + 1] += _fdy;
            asmHome[_i21 + 2] += _fdz;
            arr[_i21 + 2] += _fdz;
          }
        }

        // v13 — treadmill: the signal field streams through transits with the
        // rest of the universe — scaled down as the glyph forms so a forming /
        // melting "0x00" is never dragged past the camera and yanked back.
        if (_flowDX || _flowDZ) {
          var fw = Math.max(0, 1 - formP * 2.5);
          if (fw > 0.01) {
            var fx = _flowDX * fw,
              fz = _flowDZ * fw;
            for (var _i22 = 0; _i22 < ASM_N * 3; _i22 += 3) {
              asmHome[_i22] -= fx;
              arr[_i22] -= fx;
              asmHome[_i22 + 2] -= fz;
              arr[_i22 + 2] -= fz;
            }
          }
        }
        if (formP < 0.0015) {
          // PURE FIELD — wrap home positions around the camera (mirroring the
          // shift onto the render buffer), then ease the render toward home.
          wrapAssemblyField(arr, asmHome, BOX);
          if (arrCollapse > 0.01) {
            // ARRIVAL — v11.1: the field condenses into "0x00" ITSELF — every
            // particle is pulled to its own glyph slot in front of the camera
            // (each already has one: asmLocal), holds the word for a beat,
            // then the burst releases it into the field. The metaphor lands
            // in the first second: you arrive THROUGH the origin node.
            var kA = lerpK(0.05 + arrCollapse * 0.16);
            // glyph basis facing the camera at the origin-anchor distance
            _arrR.crossVectors(FORWARD, _arrUP).normalize();
            _arrU.crossVectors(_arrR, FORWARD).normalize();
            var kx = cam.pos.x + FORWARD.x * 9;
            var ky = cam.pos.y + FORWARD.y * 9;
            var kz = cam.pos.z + FORWARD.z * 9;
            var wobT = now * 0.0022;
            for (var _i23 = 0; _i23 < ASM_N; _i23++) {
              var j = _i23 * 3;
              var lx = asmLocal[j] * glyphFit;
              var ly = asmLocal[j + 1] * glyphFit;
              // shallow depth shimmer so the held word breathes, not freezes
              var lz = asmLocal[j + 2] * glyphFit + 0.10 * Math.sin(wobT - lx * 1.5);
              var tx = kx + _arrR.x * lx + _arrU.x * ly + FORWARD.x * lz;
              var ty = ky + _arrR.y * lx + _arrU.y * ly + FORWARD.y * lz;
              var tz = kz + _arrR.z * lx + _arrU.z * ly + FORWARD.z * lz;
              var desX = asmHome[j] * (1 - arrCollapse) + tx * arrCollapse;
              var desY = asmHome[j + 1] * (1 - arrCollapse) + ty * arrCollapse;
              var desZ = asmHome[j + 2] * (1 - arrCollapse) + tz * arrCollapse;
              arr[j] += (desX - arr[j]) * kA;
              arr[j + 1] += (desY - arr[j + 1]) * kA;
              arr[j + 2] += (desZ - arr[j + 2]) * kA;
            }
          } else {
            var kField = lerpK(0.12);
            for (var _i24 = 0; _i24 < ASM_N * 3; _i24++) arr[_i24] += (asmHome[_i24] - arr[_i24]) * kField;
          }
        } else {
          // ASSEMBLING — anchor the glyph in front of the CURRENT camera so it's
          // always in view, then blend each particle from its field home toward
          // its glyph slot (rotating + breathing) by the form amount.
          _glyphC.copy(cam.pos).add(ORIGIN_CENTER); // camera-relative centre
          // RESTING MOTION — a bounded "holographic rock" plus a depth ripple.
          // Instead of a uniform scale pulse (too generic) or a full Y-spin (which
          // goes edge-on and unreadable), the formed glyph gently tilts within a
          // small angle on two axes while a sine wave travels across it in X,
          // displacing only Z. XY barely moves, so "0x00" stays crisp at every
          // instant, yet the surface genuinely undulates in depth — parallax +
          // perspective make it shimmer in 3D. All resting motion scales with
          // formP, so during assembly the looser swing below still dominates.
          var wob = Math.max(0, 1 - formP * 1.2);
          var assemblyYaw = inDive ? now * 0.00024 : Math.sin(now * 0.00045) * 0.5 * wob;
          // Bounded rock — yaw ≤ ~11°, pitch ≤ ~6°, on different periods so it
          // drifts in a slow Lissajous instead of an obvious back-and-forth.
          var restYaw = inDive ? 0 : Math.sin(now * 0.00038) * 0.20 * formP;
          var restPitch = inDive ? 0 : Math.sin(now * 0.00029 + 1.0) * 0.10 * formP;
          var ang = assemblyYaw + restYaw;
          var ca = Math.cos(ang),
            sa = Math.sin(ang);
          var cp = Math.cos(restPitch),
            _sp3 = Math.sin(restPitch);
          // Depth ripple — wave travels across the glyph's width, displacing Z.
          var rAmp = 0.15 * formP;
          var rPhase = now * 0.0019;
          // Snap tighter the more it's formed so the letterforms crisp up.
          var kForm = lerpK(0.16 + formP * 0.12);
          for (var _i25 = 0; _i25 < ASM_N; _i25++) {
            var _j = _i25 * 3;
            var _lx = asmLocal[_j] * glyphFit;
            var _ly = asmLocal[_j + 1] * glyphFit;
            // ripple keyed to the particle's X → a travelling depth wave
            var _lz = asmLocal[_j + 2] * glyphFit + rAmp * glyphFit * Math.sin(rPhase - _lx * 1.5);
            // pitch about X, then yaw about Y
            var ly2 = _ly * cp - _lz * _sp3;
            var lz2 = _ly * _sp3 + _lz * cp;
            var rx = _lx * ca - lz2 * sa;
            var rz = _lx * sa + lz2 * ca;
            var tX = _glyphC.x + rx,
              tY = _glyphC.y + ly2,
              tZ = _glyphC.z + rz;
            var _desX = asmHome[_j] + (tX - asmHome[_j]) * formP;
            var _desY = asmHome[_j + 1] + (tY - asmHome[_j + 1]) * formP;
            var _desZ = asmHome[_j + 2] + (tZ - asmHome[_j + 2]) * formP;
            arr[_j] += (_desX - arr[_j]) * kForm;
            arr[_j + 1] += (_desY - arr[_j + 1]) * kForm;
            arr[_j + 2] += (_desZ - arr[_j + 2]) * kForm;
          }
        }
        assemblyPts.geometry.attributes.position.needsUpdate = true;

        // Always visible as field; brighter + larger as it forms / ignites.
        var fieldOp = mode === "ambient" || mode === "grid" || mode === "reel" ? 0.34 : 0.55;
        assemblyPts.material.opacity = Math.min(1, Math.max(fieldOp, 0.2 + formP * 0.8) + igE * 0.4 + arrCollapse * 0.45 + _lvlS * 0.16);
        // v10: the formed glyph keeps near-field particle size — the old
        // +0.055 growth made "0x00" read as soft blobs up close.
        assemblyPts.material.size = 0.1 + formP * 0.015 + igE * 0.5 + arrCollapse * 0.07 + _lvlS * 0.04;

        // Dive ignition rushes the formed node toward the camera.
        if (inDive) {
          assemblyGroup.position.set(0, 1.5, igE * (Math.abs(ORIGIN_CENTER.z) + 6));
          var gs = 1 + igE * 4.5;
          assemblyGroup.scale.set(gs, gs, gs);
        } else {
          assemblyGroup.position.set(0, 0, 0);
          assemblyGroup.scale.set(1, 1, 1);
        }
        window.__mo_debug = {
          mode: mode,
          active: !!ob.active,
          formP: +formP.toFixed(2),
          camZ: +cam.pos.z.toFixed(1)
        };
      }

      /* ── v10 layers: constellation (anamorph retired — see its setup) ── */
      updateTopology(dt, mode, focusAddrNow, window.__mo_debug && window.__mo_debug.formP || 0, arrFade);

      /* ── v13 flight layers: velocity FX ride the existing grade — the
             transit is felt through FOV + aberration, not extra geometry ── */
      var FLbr = window.__mo_flight || {};
      var warpNow = Math.max(0, Math.min(1.4, FLbr.warp || 0));
      var MC = window.__mo_cam = window.__mo_cam || {};
      MC.x = cam.pos.x;
      MC.y = cam.pos.y;
      MC.z = cam.pos.z;
      MC.yaw = cam.yaw;
      MC.pitch = cam.pitch;
      MC.vel = cam.vel;

      /* status ~ 3hz */
      frameI++;
      if (frameI % 18 === 0) {
        var _hoverObjRef$current;
        var yawDeg = (cam.yaw * 180 / Math.PI % 360 + 360) % 360;
        setStatus({
          yaw: yawDeg.toFixed(0).padStart(3, "0"),
          pit: (cam.pitch * 180 / Math.PI).toFixed(0),
          vel: cam.vel.toFixed(1),
          tile: ((_hoverObjRef$current = hoverObjRef.current) === null || _hoverObjRef$current === void 0 || (_hoverObjRef$current = _hoverObjRef$current.userData) === null || _hoverObjRef$current === void 0 || (_hoverObjRef$current = _hoverObjRef$current.project) === null || _hoverObjRef$current === void 0 ? void 0 : _hoverObjRef$current.addr) || activeAddr || "—",
          trace: Math.round(_anamTrace * 100)
        });
      }

      // Maslov grade — advance grain + keep live-tunable uniforms in sync.
      // v10: velocity weight (written by cinematic.js) leans on the aberration
      // and the FOV so speed is something you FEEL; ripple + wake uniforms
      // carry the disturbance layer.
      var vW = Math.max(0, Math.min(1.4, window.__mo_vel || 0));
      if (cursorFx) {
        cursorFx.update(now, dt, {
          aberration: GRADE.aberration + vW * 0.0035 + arrCollapse * 0.002 + warpNow * 0.0022,
          vignette: GRADE.vignette,
          grain: GRADE.grain
        });
      }
      var fovT = 58 + vW * 4 + warpNow * 4.5;
      camera.fov += (fovT - camera.fov) * lerpK(0.08);
      if (Math.abs(camera.fov - _lastFov) > 0.02) {
        camera.updateProjectionMatrix();
        _lastFov = camera.fov;
      }
      if (bokehPass && bokehPass.uniforms) {
        // v10.1 — DoF reads as FAR-ONLY: a tiny aperture with focus pinned to
        // the card plane keeps everything within ~20u readable; only the deep
        // field melts (capped by maxblur). No hover rack — it kept whatever
        // you were NOT pointing at unreadable.
        var focusT = GRADE.focus;
        if (mode === "reel") focusT = 10.6;
        var formPNow = window.__mo_debug && window.__mo_debug.formP || 0;
        if (formPNow > 0.25) focusT = ORIGIN_CENTER.length();
        _focusS += (focusT - _focusS) * lerpK(0.07);
        bokehPass.uniforms.focus.value = _focusS;
        bokehPass.uniforms.aperture.value = GRADE.aperture;
        bokehPass.uniforms.maxblur.value = GRADE.maxblur;
      }
      if (useComposer && composer) {
        composer.render();
      } else renderer.render(scene, camera);
      if (frameI === 1) {
        try {
          window.dispatchEvent(new CustomEvent("mo:first-frame"));
        } catch (_) {}
      }
      probeDoF(dt);
      raf = requestAnimationFrame(frame);
    }

    /* Wrap Points buffer attribute around camera (only modify entries that wrap) */
    function wrapPointsAroundCamera(points, box) {
      var attr = points.geometry.attributes.position;
      var arr = attr.array;
      var dirty = false;
      for (var _i26 = 0; _i26 < arr.length; _i26 += 3) {
        var dx = arr[_i26 + 0] - cam.pos.x;
        var dy = arr[_i26 + 1] - cam.pos.y;
        var dz = arr[_i26 + 2] - cam.pos.z;
        if (dx > box.x / 2) {
          arr[_i26 + 0] -= box.x;
          dirty = true;
        } else if (dx < -box.x / 2) {
          arr[_i26 + 0] += box.x;
          dirty = true;
        }
        if (dy > box.y / 2) {
          arr[_i26 + 1] -= box.y;
          dirty = true;
        } else if (dy < -box.y / 2) {
          arr[_i26 + 1] += box.y;
          dirty = true;
        }
        if (dz > box.z / 2) {
          arr[_i26 + 2] -= box.z;
          dirty = true;
        } else if (dz < -box.z / 2) {
          arr[_i26 + 2] += box.z;
          dirty = true;
        }
      }
      if (dirty) attr.needsUpdate = true;
    }
    raf = requestAnimationFrame(frame);
    mount.style.cursor = "grab";
    try {
      window.dispatchEvent(new CustomEvent("mo:universe-ready"));
    } catch (_) {}
    return function () {
      var _originHub$material$m;
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      if (cursorFx) cursorFx.destroy();
      if (bokehPass && bokehPass.dispose) bokehPass.dispose();
      if (composer && composer.dispose) composer.dispose();
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      uniIO.disconnect();
      try {
        mount.removeChild(renderer.domElement);
      } catch (_) {}
      renderer.dispose();
      if (scene.background && scene.background.dispose) scene.background.dispose();
      if (scene.environment && scene.environment.dispose) scene.environment.dispose();
      tiles.forEach(function (m) {
        var _m$material$map;
        m.geometry.dispose();
        (_m$material$map = m.material.map) === null || _m$material$map === void 0 || _m$material$map.dispose();
        m.material.dispose();
      });
      tileWires.forEach(function (w) {
        if (w.userData && w.userData.isModel) {
          w.traverse(function (obj) {
            if (obj.isMesh) {
              var _obj$geometry, _obj$material;
              (_obj$geometry = obj.geometry) === null || _obj$geometry === void 0 || _obj$geometry.dispose();
              (_obj$material = obj.material) === null || _obj$material === void 0 || _obj$material.dispose();
            }
          });
        } else {
          var _w$geometry, _w$material;
          (_w$geometry = w.geometry) === null || _w$geometry === void 0 || _w$geometry.dispose();
          (_w$material = w.material) === null || _w$material === void 0 || _w$material.dispose();
        }
      });
      ambient.forEach(function (s) {
        var _s$material$map;
        (_s$material$map = s.material.map) === null || _s$material$map === void 0 || _s$material$map.dispose();
        s.material.dispose();
      });
      starGeo.dispose();
      asmGeo.dispose();
      assemblyPts.material.dispose();
      (_originHub$material$m = originHub.material.map) === null || _originHub$material$m === void 0 || _originHub$material$m.dispose();
      originHub.material.dispose();
      originLinks.forEach(function (l) {
        l.geometry.dispose();
        l.material.dispose();
      });
      constLines.forEach(function (l) {
        return l.geometry.dispose();
      });
      constMat.dispose();
      anamGeo.dispose();
      anamPts.material.dispose();
      window.removeEventListener("pointermove", onAnyAct);
      window.removeEventListener("pointerdown", onActSkipArrival);
      window.removeEventListener("wheel", onAnyAct);
      window.removeEventListener("keydown", onAnyAct);
      window.removeEventListener("scroll", onAnyAct);
      window.removeEventListener("deviceorientation", onGyro, true);
      delete window.__mo_universe;
      delete window.__mo_arrival_start;
      delete window.__mo_cam;
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "universe",
    "data-screen-label": "01 Universe"
  }, /*#__PURE__*/React.createElement("div", {
    className: "universe__mount",
    ref: mountRef
  }), hover && window.UniverseHoverCard && /*#__PURE__*/React.createElement(window.UniverseHoverCard, {
    project: hover.project,
    panelRef: overlayRef
  }), /*#__PURE__*/React.createElement("div", {
    className: "universe__reticle",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)), /*#__PURE__*/React.createElement("div", {
    className: "universe__whisper " + (idleNote ? "is-on" : ""),
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__whisperDot"
  }), "the field notices you"), /*#__PURE__*/React.createElement("div", {
    className: "universe__hud universe__hud--bl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "YAW"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, status.yaw, "\xB0")), /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "PITCH"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, status.pit, "\xB0")), /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "VEL"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, status.vel)), /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "FOCUS"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, status.tile))), /*#__PURE__*/React.createElement("div", {
    className: "universe__hud universe__hud--br"
  }, /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "DRAG"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, "ROTATE")), /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "WHEEL"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, "FLY")), /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "CLICK"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, "AIM")), /*#__PURE__*/React.createElement("div", {
    className: "universe__hudRow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "universe__hudKey"
  }, "SPACE"), /*#__PURE__*/React.createElement("span", {
    className: "universe__hudVal"
  }, "\u221E"))));
}
window.Universe = Universe;

/* ---- landing_final5/node-handoff.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — GENERIC NODE HANDOFF (landing_final5/node-handoff.jsx)
   ------------------------------------------------------------
   Replaces the Wafer-only wafer-flight.jsx. Serves ANY node in
   window.MO_PROJECTS via one event:

     window.dispatchEvent(new CustomEvent("mo:nodeFlight", {
       detail: { project, originRect, origin }   // origin: work|universe|all-projects
     }));

   Choreography = the Wafer reference: model lifts out of the card,
   universe dims, model travels to the hero rest while turning
   ~270°, the last frame is stashed as a seam, the project page
   continues the same yaw. Per-project overrides come from
   projects-data.js (handoffPose). Nodes without a ready GLB fly
   the same trajectory as their node-shell proxy. Reduced motion →
   soft crossfade, no travel, no spin.

   Session protocol (generic — the old mo_wafer_* keys are gone):
     mo_node_handoff  JSON { addr, slug, yaw, arrive, returnTarget, timestamp }
     mo_node_addr / mo_node_arrive / mo_node_yaw   (flat mirrors)
     mo_node_seam     JPEG dataURL (stored separately — large)
     mo_node_return / mo_node_return_addr / mo_node_return_target
     mo_node_return_origin
   ============================================================ */
var _React = React,
  useNH = _React.useState,
  useNHE = _React.useEffect,
  useNHR = _React.useRef;
var NH_DEFAULTS = {
  duration: 1200,
  spinSpeed: 0.0039,
  scale: 0.92,
  restX: 0.46,
  offsetY: 0
};
var NH_REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
function nhClearStale() {
  for (var _i = 0, _arr = ["mo_node_arrive", "mo_node_yaw", "mo_node_return", "mo_node_return_addr", "mo_node_return_target"]; _i < _arr.length; _i++) {
    var k = _arr[_i];
    sessionStorage.removeItem(k);
  }
}
function nhHasPendingReturn() {
  try {
    return sessionStorage.getItem("mo_node_return") === "1";
  } catch (_) {
    return false;
  }
}
function NodeHandoff() {
  var returningRef = useNHR(nhHasPendingReturn());
  var mountRef = useNHR(null);
  var _useNH = useNH(returningRef.current ? "return" : "idle"),
    _useNH2 = _slicedToArray(_useNH, 2),
    mode = _useNH2[0],
    setMode = _useNH2[1]; // idle | forward | return
  var _useNH3 = useNH({
      addr: "",
      name: ""
    }),
    _useNH4 = _slicedToArray(_useNH3, 2),
    hud = _useNH4[0],
    setHud = _useNH4[1];
  var rigRef = useNHR(null);
  var rafRef = useNHR(0);

  /* Universe tiles route through the SAME event — no per-address checks. */
  useNHE(function () {
    window.__mo_open_project = function (p, originRect) {
      var project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[p.addr] || p.mo || p;
      window.dispatchEvent(new CustomEvent("mo:nodeFlight", {
        detail: {
          project: project,
          originRect: originRect,
          origin: "universe"
        }
      }));
    };
    return function () {
      if (window.__mo_open_project) delete window.__mo_open_project;
    };
  }, []);
  var buildRig = function buildRig(project) {
    var mount = mountRef.current;
    if (!mount || !window.makeNodeRig) return null;
    cancelAnimationFrame(rafRef.current);
    if (rigRef.current) {
      try {
        rigRef.current.dispose();
      } catch (_) {}
      rigRef.current = null;
    }
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    var rig = window.makeNodeRig(mount, {
      project: project,
      model: project.model,
      mode: "handoff"
    });
    rigRef.current = rig;
    return rig;
  };
  var fadeUniverse = function fadeUniverse(toOpacity, ms) {
    var uni = document.querySelector(".universeBg");
    if (uni) {
      uni.style.transition = "opacity ".concat(ms, "ms cubic-bezier(0.16,1,0.3,1)");
      uni.style.opacity = String(toOpacity);
    }
  };

  /* ---------- FORWARD: any card / tile → its project page ---------- */
  useNHE(function () {
    var onFly = function onFly(e) {
      if (returningRef.current || mode !== "idle") return;
      var project = e && e.detail && e.detail.project;
      if (!project || !project.file) return; // RECORD FORMING — cards handle it
      var originRect = e.detail.originRect;
      var origin = e.detail.origin || "work";
      var hp = Object.assign({}, NH_DEFAULTS, project.model && project.model.handoffPose || {});
      sessionStorage.setItem("mo_node_return_origin", origin);
      var wfEl = document.querySelector(".wf");
      if (wfEl) wfEl.classList.remove("wf--dissolve");
      setHud({
        addr: project.addr,
        name: project.name.toUpperCase()
      });
      setMode("forward");
      fadeUniverse(0, 620);
      document.body.classList.add("wf-flying");
      requestAnimationFrame(function () {
        var rig = buildRig(project);
        var go = function go() {
          try {
            var seam = rig && rig.captureFrame && rig.captureFrame();
            if (seam) sessionStorage.setItem("mo_node_seam", seam);
          } catch (_) {}
          var yaw = rig && rig.getYaw ? rig.getYaw() : 0;
          sessionStorage.setItem("mo_node_handoff", JSON.stringify({
            addr: project.addr,
            slug: project.slug,
            yaw: yaw,
            arrive: true,
            returnTarget: origin,
            timestamp: Date.now()
          }));
          sessionStorage.setItem("mo_node_addr", project.addr);
          sessionStorage.setItem("mo_node_yaw", String(yaw));
          sessionStorage.setItem("mo_node_arrive", "1");
          window.location.href = project.file;
        };
        if (!rig) {
          setTimeout(go, 200);
          return;
        }
        var vw = window.innerWidth,
          vh = window.innerHeight;
        var REST = {
          fracX: hp.restX,
          scale: hp.scale,
          offY: hp.offsetY
        };
        if (NH_REDUCED) {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY); // no travel, no spin
        } else if (originRect && originRect.w) {
          var cx = originRect.x + originRect.w / 2;
          var cy = originRect.y + originRect.h / 2;
          var startScale = Math.max(0.12, Math.min(0.6, originRect.h / (0.54 * vh)));
          rig.startFromScreen(cx, cy, vw, vh, startScale);
          rig.setEaseRate(0.052);
          requestAnimationFrame(function () {
            return rig.setLayout(REST.fracX, REST.scale, REST.offY);
          });
        } else {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY);
        }
        var last = performance.now();
        var navigated = false;
        var dur = NH_REDUCED ? 420 : hp.duration;
        var fire = function fire() {
          if (navigated) return;
          navigated = true;
          clearTimeout(navTimer);
          go();
        };
        var navTimer = setTimeout(fire, dur);
        var _loop = function loop(now) {
          var dt = now - last;
          last = now;
          if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
          rig.update(dt);
          rig.render();
          if (!navigated) rafRef.current = requestAnimationFrame(_loop);
        };
        rafRef.current = requestAnimationFrame(_loop);
      });
    };
    window.addEventListener("mo:nodeFlight", onFly);
    return function () {
      window.removeEventListener("mo:nodeFlight", onFly);
    };
  }, [mode]);

  /* ---------- REVERSE: returning from a project page ---------- */
  useNHE(function () {
    if (!returningRef.current) return;
    sessionStorage.removeItem("mo_node_return");
    var addr = sessionStorage.getItem("mo_node_return_addr") || "";
    var returnTarget = sessionStorage.getItem("mo_node_return_target") || "work";
    sessionStorage.removeItem("mo_node_return_target");
    sessionStorage.removeItem("mo_node_return_addr");
    var project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
    if (!project) {
      returningRef.current = false;
      nhClearStale();
      setMode("idle");
      return;
    }
    var hp = Object.assign({}, NH_DEFAULTS, project.model && project.model.handoffPose || {});
    setHud({
      addr: project.addr,
      name: project.name.toUpperCase()
    });
    setMode("return");
    fadeUniverse(0, 0);
    document.body.classList.add("wf-flying");
    requestAnimationFrame(function () {
      var rig = buildRig(project);
      if (!rig) {
        returningRef.current = false;
        fadeUniverse(1, 600);
        document.body.classList.remove("wf-flying");
        nhClearStale();
        setMode("idle");
        return;
      }
      var seamYaw = parseFloat(sessionStorage.getItem("mo_node_yaw"));
      rig.snapHandoff();
      if (isFinite(seamYaw)) rig.setYaw(seamYaw);
      var last = performance.now();
      var HOLD = NH_REDUCED ? 240 : 620;
      var dissolved = false;
      var dissolve = function dissolve() {
        if (dissolved) return;
        dissolved = true;
        fadeUniverse(1, 700);
        var el = document.querySelector(".wf");
        if (el) el.classList.add("wf--dissolve");
        // land back where the user left from
        var featIdx = (window.MO_FEATURED_ADDRS || []).indexOf(project.addr);
        if (returnTarget === "work" && featIdx >= 0) {
          var work = document.getElementById("work");
          if (work) {
            // scroll to the exact reel stop of this card (mirror of work.jsx jumpToStop)
            var N = (window.MO_FEATURED_ADDRS || []).length;
            var STOPS = N + 2,
              PADS = 0.6,
              TOTAL_V = STOPS + PADS;
            var total = work.offsetHeight - window.innerHeight;
            var padN = PADS / TOTAL_V;
            var target = padN + (featIdx + 1) / (STOPS - 1) * (1 - 2 * padN);
            window.scrollTo({
              top: work.offsetTop + target * total,
              behavior: "auto"
            });
          }
        } else if (returnTarget === "work") {
          var _work = document.getElementById("work");
          if (_work) window.scrollTo({
            top: _work.getBoundingClientRect().top + window.scrollY,
            behavior: "auto"
          });
        } else {
          window.scrollTo({
            top: 0,
            behavior: "auto"
          }); // universe / field
        }
        setTimeout(function () {
          document.body.classList.remove("wf-flying");
          cancelAnimationFrame(rafRef.current);
          if (rigRef.current) {
            try {
              rigRef.current.dispose();
            } catch (_) {}
            rigRef.current = null;
          }
          var m = mountRef.current;
          if (m) {
            while (m.firstChild) m.removeChild(m.firstChild);
          }
          if (el) el.classList.remove("wf--dissolve");
          returningRef.current = false;
          nhClearStale();
          sessionStorage.removeItem("mo_node_seam");
          setMode("idle");
        }, 760);
      };
      var dissolveTimer = setTimeout(dissolve, HOLD);
      var _loop2 = function loop(now) {
        var dt = now - last;
        last = now;
        if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
        rig.update(dt);
        rig.render();
        if (!dissolved) rafRef.current = requestAnimationFrame(_loop2);else rig.render();
      };
      rafRef.current = requestAnimationFrame(_loop2);
      void dissolveTimer;
    });
  }, []);
  useNHE(function () {
    return function () {
      cancelAnimationFrame(rafRef.current);
      if (rigRef.current) rigRef.current.dispose();
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "wf " + (mode !== "idle" ? "wf--on" : ""),
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wf__veil"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wf__mount",
    ref: mountRef
  }), /*#__PURE__*/React.createElement("div", {
    className: "wf__tag"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wf__tagDot"
  }), /*#__PURE__*/React.createElement("span", null, mode === "return" ? "RETURNING TO FIELD" : "ENTERING NODE " + hud.addr), /*#__PURE__*/React.createElement("span", {
    className: "wf__tagSep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wf__tagName"
  }, mode === "return" ? "NODE " + hud.addr + " · " + hud.name : hud.name)));
}
window.NodeHandoff = NodeHandoff;

/* ---- about_v2/board-scene3.jsx ---- */
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — About · PCB board scene · v3
   ------------------------------------------------------------
   Fork of board-scene2. New in v3:
     · U1 is the ONLY chip — every other stop is now a realistic
       schematic-derived CLUSTER of small parts (LDO front-end,
       crystal + load caps, decoupling bank + RF pi-filter with a
       meandered 2.4 GHz antenna, LED driver, debounce)
     · richer part library: MLCC, chip R, tantalum, inductor,
       ferrite, SOT-23, SOT-223, LEDs, SMA diode, test points
     · escape routing off every MCU pin, per-cluster nets, edge
       bus lines, mounting holes, barcode, denser silkscreen
   window.MOBoard.build(mount) -> controller (same API as v2)
   ============================================================ */
(function () {
  var BOARD_W = 120,
    BOARD_D = 40,
    BOARD_T = 1.4;
  var TOP = BOARD_T / 2;
  var TRACE_PTS = [[-64, -6], [-50, -6], [-38, 3], [-26, 8], [-12, 2], [2, -5], [14, 1], [28, 9], [40, 2], [52, -3], [64, -3]];
  var STOPS = [{
    p: 1,
    kind: "usbc",
    ref: "J1 · POWER IN",
    chapter: {
      n: "00",
      kicker: "SOURCE · EARLY MAKING",
      title: ["Building came ", "first", "."],
      body: "I learned to solder at nine, spent years experimenting with Arduino, and assembled slot-car systems. Long before I knew the names of any profession, I already treated computers and electronics as materials for making."
    }
  }, {
    p: 3,
    kind: "irq",
    ref: "IRQ · INTERRUPT",
    chapter: {
      n: "01",
      kicker: "INTERRUPT · KYIV → GERMANY",
      title: ["The environment ", "changed", "."],
      body: "In February 2022, Russia's full-scale invasion forced my mother and me to leave Ukraine and rebuild our lives more than 1,500 kilometres from home. I arrived in Germany without German and learned to navigate a new language, institutions and environment for both of us."
    }
  }, {
    p: 5,
    kind: "boot",
    ref: "BL1 · ACCESS POINT",
    chapter: {
      n: "02",
      kicker: "ACCESS · DESIGN",
      title: ["Design became the ", "access point", "."],
      body: "In a new environment, design was the most accessible way to keep creating. It taught me to turn ideas into structure, hierarchy and interaction — and to begin with the person using the product."
    }
  }, {
    p: 7,
    kind: "mcu",
    ref: "U1 · DEEPER LAYER",
    explode: true,
    chapter: {
      n: "03",
      kicker: "DEPTH · WAFER",
      title: ["One keyboard opened the ", "whole stack", "."],
      body: "After moving to Germany, I became fascinated by split keyboards. Building Wafer pushed me below the visible layer into mechanics, PCB design, component selection, Zephyr and ARM — until the idea became a working prototype and a complete product system."
    }
  }, {
    p: 9,
    kind: "switch",
    ref: "SW1 · OUTPUT",
    live: true,
    chapter: {
      n: "04",
      kicker: "OUTPUT · NEXT",
      title: ["Every project starts with a ", "problem", "."],
      body: "Today I work across ZMK, Kerfur and Iskra, learning whatever each challenge requires. My direction is to deepen both engineering and business, continue my education, and turn Wafer from a working prototype into a real company."
    }
  }];

  /* ---- canvas helpers ---- */
  function uv(x, z, W, H) {
    return [(x + BOARD_W / 2) / BOARD_W * W, (z + BOARD_D / 2) / BOARD_D * H];
  }
  function smoothPath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length - 1; i++) {
      var xc = (pts[i][0] + pts[i + 1][0]) / 2,
        yc = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
  function poly(x, p) {
    x.beginPath();
    x.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]);
  }

  /* ---- part library (board units ≈ mm) ---- */
  var P = {
    r: {
      l: 2.0,
      w: 1.25,
      h: 0.55
    },
    c: {
      l: 2.0,
      w: 1.25,
      h: 0.95
    },
    ctant: {
      l: 3.5,
      w: 2.8,
      h: 1.9
    },
    ind: {
      l: 4.0,
      w: 4.0,
      h: 2.0
    },
    fb: {
      l: 2.0,
      w: 1.25,
      h: 0.95
    },
    led: {
      l: 2.0,
      w: 1.25,
      h: 0.75
    },
    diode: {
      l: 4.3,
      w: 2.6,
      h: 1.1
    },
    sot23: {
      l: 2.9,
      w: 1.5,
      h: 1.05
    },
    sot223: {
      l: 6.4,
      w: 3.4,
      h: 1.6
    },
    tp: {
      l: 1.2,
      w: 1.2,
      h: 0
    },
    xtal: {
      l: 5.0,
      w: 3.2,
      h: 1.0
    }
  };
  var TWO_PAD = {
    r: 1,
    c: 1,
    fb: 1,
    led: 1,
    diode: 1,
    ctant: 1,
    ind: 1
  };
  function rr(cx, cz, dx, dz, w, d, rot) {
    return rot ? [cx + dz, cz + dx, d, w] : [cx + dx, cz + dz, w, d];
  }
  function padsFor(k, cx, cz, rot) {
    var s = P[k],
      out = [];
    if (TWO_PAD[k]) {
      out.push(rr(cx, cz, -s.l * 0.42, 0, s.l * 0.28, s.w * 1.12, rot), rr(cx, cz, s.l * 0.42, 0, s.l * 0.28, s.w * 1.12, rot));
    } else if (k === "sot23") {
      out.push(rr(cx, cz, -0.95, 1.15, 0.6, 0.8, rot), rr(cx, cz, 0.95, 1.15, 0.6, 0.8, rot), rr(cx, cz, 0, -1.15, 0.6, 0.8, rot));
    } else if (k === "sot223") {
      for (var i = -1; i <= 1; i++) out.push(rr(cx, cz, i * 2.1, 2.2, 1.0, 1.5, rot));
      out.push(rr(cx, cz, 0, -2.1, 3.4, 1.7, rot));
    } else if (k === "tp") {
      out.push([cx, cz, 1.15, 1.15]);
    } else if (k === "xtal") {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (m) {
        return out.push(rr(cx, cz, m[0] * 1.9, m[1] * 1.05, 1.15, 0.95, rot));
      });
    }
    return out;
  }

  /* ---- schematic clusters per stop (offsets from stop center) ---- */
  var CLUSTERS = {
    usbc: [{
      k: "sot23",
      dx: -4.9,
      dz: 2.2,
      ref: "D2"
    }, {
      k: "r",
      dx: -4.7,
      dz: -1.2,
      rot: 1,
      ref: "R1"
    }, {
      k: "r",
      dx: -3.2,
      dz: -1.2,
      rot: 1,
      ref: "R2"
    }, {
      k: "fb",
      dx: 4.3,
      dz: -2.4,
      ref: "FB1"
    }, {
      k: "sot223",
      dx: 8.4,
      dz: -0.8,
      ref: "U3"
    }, {
      k: "c",
      dx: 4.4,
      dz: 0.8,
      ref: "C1"
    }, {
      k: "ctant",
      dx: 8.6,
      dz: 3.6,
      ref: "C2"
    }, {
      k: "tp",
      dx: -4.8,
      dz: 4.4,
      ref: "TP1"
    }],
    irq: [{
      k: "sot23",
      dx: -4.6,
      dz: 2.4,
      ref: "D4"
    }, {
      k: "diode",
      dx: 4.5,
      dz: -2.8,
      ref: "D5"
    }, {
      k: "r",
      dx: -4.4,
      dz: -2.6,
      rot: 1,
      ref: "R10"
    }, {
      k: "r",
      dx: -3.0,
      dz: -2.6,
      rot: 1,
      ref: "R11"
    }, {
      k: "r",
      dx: -1.6,
      dz: -2.6,
      rot: 1,
      ref: "R12"
    }, {
      k: "tp",
      dx: 0.4,
      dz: 4.4,
      ref: "TP6"
    }, {
      k: "tp",
      dx: 2.4,
      dz: 4.4,
      ref: "TP7"
    }],
    mcu: [{
      k: "c",
      dx: -3.0,
      dz: 7.0,
      ref: "C5"
    }, {
      k: "c",
      dx: 0,
      dz: 7.0,
      ref: "C6"
    }, {
      k: "c",
      dx: 3.0,
      dz: 7.0,
      ref: "C7"
    }, {
      k: "c",
      dx: -3.0,
      dz: -7.0,
      ref: "C8"
    }, {
      k: "c",
      dx: 0,
      dz: -7.0,
      ref: "C9"
    }, {
      k: "ind",
      dx: 6.9,
      dz: -3.0,
      ref: "L1"
    }, {
      k: "c",
      dx: 6.7,
      dz: -0.2,
      rot: 1,
      ref: "C10"
    }, {
      k: "c",
      dx: 6.7,
      dz: 1.6,
      rot: 1,
      ref: "C11"
    }, {
      k: "tp",
      dx: -6.6,
      dz: -3.4,
      ref: "TP3"
    }, {
      k: "tp",
      dx: -6.6,
      dz: -1.4,
      ref: "TP4"
    }],
    boot: [{
      k: "sot23",
      dx: 4.8,
      dz: 2.6,
      ref: "U4"
    }, {
      k: "c",
      dx: 4.6,
      dz: -1.8,
      rot: 1,
      ref: "C13"
    }, {
      k: "r",
      dx: -4.5,
      dz: -3.2,
      ref: "R14"
    }, {
      k: "r",
      dx: -4.5,
      dz: -1.7,
      ref: "R15"
    }, {
      k: "tp",
      dx: -4.6,
      dz: 3.4,
      ref: "TP8"
    }, {
      k: "tp",
      dx: -2.7,
      dz: 3.4,
      ref: "TP9"
    }],
    "switch": [{
      k: "r",
      dx: -3.7,
      dz: 0.6,
      rot: 1,
      ref: "R8"
    }, {
      k: "c",
      dx: 3.7,
      dz: 0.6,
      rot: 1,
      ref: "C12"
    }, {
      k: "diode",
      dx: 0,
      dz: 4.4,
      ref: "D3"
    }, {
      k: "tp",
      dx: -3.7,
      dz: -3.2,
      ref: "TP5"
    }]
  };
  var CPARTS = [];
  STOPS.forEach(function (st) {
    return (CLUSTERS[st.kind] || []).forEach(function (c) {
      var _TRACE_PTS$st$p = _slicedToArray(TRACE_PTS[st.p], 2),
        sx = _TRACE_PTS$st$p[0],
        sz = _TRACE_PTS$st$p[1];
      CPARTS.push({
        k: c.k,
        x: sx + c.dx,
        z: sz + c.dz,
        rot: c.rot || 0,
        ref: c.ref
      });
    });
  });

  // antenna region (right of U1): meandered inverted-F on a mask keepout
  var MCU_XY = TRACE_PTS[STOPS.find(function (s) {
    return s.kind === "mcu";
  }).p];
  var ANT = {
    x0: MCU_XY[0] + 7.5,
    x1: MCU_XY[0] + 13.5,
    z0: MCU_XY[1] - 4.5,
    z1: MCU_XY[1] - 1.5
  };
  var ANT_PTS = function () {
    var zm = (ANT.z0 + ANT.z1) / 2,
      pts = [[MCU_XY[0] + 6.9, MCU_XY[1] - 3], [ANT.x0 + 0.5, zm]];
    var top = true;
    for (var x = ANT.x0 + 1.1; x <= ANT.x1 - 0.5; x += 0.95) {
      pts.push([x, top ? ANT.z1 - 0.4 : ANT.z0 + 0.4]);
      pts.push([x + 0.95, top ? ANT.z1 - 0.4 : ANT.z0 + 0.4]);
      top = !top;
    }
    return pts;
  }();

  /* ---- deterministic layout: passives, vias, nets, buses ---- */
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = s * 1103515245 + 12345 >>> 0;
      return s / 4294967296;
    };
  }
  var LAYOUT = function () {
    var R = makeRng(20260719);
    var clampB = function clampB(p) {
      p[0] = Math.max(-BOARD_W / 2 + 3, Math.min(BOARD_W / 2 - 3, p[0]));
      p[1] = Math.max(-BOARD_D / 2 + 2.5, Math.min(BOARD_D / 2 - 2.5, p[1]));
      return p;
    };
    var stopPts = STOPS.map(function (s) {
      return TRACE_PTS[s.p];
    });
    var inAnt = function inAnt(x, z) {
      return x > ANT.x0 - 2 && x < ANT.x1 + 1.5 && z > ANT.z0 - 1.5 && z < ANT.z1 + 1.5;
    };
    var foot = [];
    var rN = 30,
      cN = 30,
      guard = 0;
    while (foot.length < 78 && guard++ < 5000) {
      var x = -BOARD_W / 2 + 6 + R() * (BOARD_W - 12),
        z = -BOARD_D / 2 + 4.5 + R() * (BOARD_D - 9);
      var ok = !inAnt(x, z);
      if (ok) for (var _i = 0, _TRACE_PTS = TRACE_PTS; _i < _TRACE_PTS.length; _i++) {
        var p = _TRACE_PTS[_i];
        var dx = x - p[0],
          dz = z - p[1];
        if (dx * dx + dz * dz < 30) {
          ok = false;
          break;
        }
      }
      if (ok) {
        var _iterator = _createForOfIteratorHelper(stopPts),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var _p = _step.value;
            var _dx = x - _p[0],
              _dz = z - _p[1];
            if (_dx * _dx + _dz * _dz < 135) {
              ok = false;
              break;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      if (ok) {
        var _iterator2 = _createForOfIteratorHelper(foot),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var f = _step2.value;
            var _dx2 = x - f.x,
              _dz2 = z - f.z;
            if (_dx2 * _dx2 + _dz2 * _dz2 < 8) {
              ok = false;
              break;
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
      if (!ok) continue;
      var k = R(),
        cap = k < 0.45;
      foot.push({
        x: x,
        z: z,
        rot: R() < 0.5 ? 0 : 1,
        l: k < 0.8 ? 1.55 : 2.1,
        w: k < 0.8 ? 0.8 : 1.1,
        cap: cap,
        ref: cap ? "C" + cN++ : "R" + rN++
      });
    }
    var vias = [];
    for (var i = 0; i < 52; i++) {
      var _x = -BOARD_W / 2 + 4 + R() * (BOARD_W - 8),
        _z = -BOARD_D / 2 + 3 + R() * (BOARD_D - 6);
      if (inAnt(_x, _z)) continue;
      vias.push({
        x: _x,
        z: _z,
        tent: R() < 0.5
      });
    }
    var stitch = [];
    for (var _x2 = -BOARD_W / 2 + 2.6; _x2 < BOARD_W / 2 - 2.4; _x2 += 3.4) {
      stitch.push([_x2, -BOARD_D / 2 + 1.9]);
      stitch.push([_x2, BOARD_D / 2 - 1.9]);
    }
    for (var _z2 = -BOARD_D / 2 + 1.9; _z2 < BOARD_D / 2 - 1.9; _z2 += 3.4) {
      stitch.push([-BOARD_W / 2 + 2.2, _z2]);
      stitch.push([BOARD_W / 2 - 2.2, _z2]);
    }
    var tribs = [];
    STOPS.forEach(function (st) {
      var _TRACE_PTS$st$p2 = _slicedToArray(TRACE_PTS[st.p], 2),
        sx = _TRACE_PTS$st$p2[0],
        sz = _TRACE_PTS$st$p2[1];
      var n = 5 + (R() * 3 | 0);
      for (var _k = 0; _k < n; _k++) {
        var a = Math.round((_k / n * Math.PI * 2 + R()) / (Math.PI / 4)) * (Math.PI / 4);
        var _x3 = sx + Math.cos(a) * 3.2,
          _z3 = sz + Math.sin(a) * 3.2;
        var pts = [clampB([_x3, _z3])];
        var segs = 2 + (R() < 0.6 ? 1 : 0);
        for (var s = 0; s < segs; s++) {
          var len = 2.5 + R() * 7;
          _x3 += Math.cos(a) * len;
          _z3 += Math.sin(a) * len;
          pts.push(clampB([_x3, _z3]));
          a += (R() < 0.5 ? -1 : 1) * Math.PI / 4;
        }
        tribs.push(pts);
      }
    });
    // cluster nets — short 45°-routed escapes off each 2-pad part, via-terminated
    var R2 = makeRng(777);
    var nets = [];
    for (var _i2 = 0, _CPARTS = CPARTS; _i2 < _CPARTS.length; _i2++) {
      var _p2 = _CPARTS[_i2];
      var s = P[_p2.k];
      if (_p2.k === "tp") {
        var sg = R2() < 0.5 ? -1 : 1;
        nets.push({
          pts: [[_p2.x, _p2.z], [_p2.x + sg * (1.3 + R2() * 1.4), _p2.z]],
          via: true
        });
        continue;
      }
      if (!TWO_PAD[_p2.k]) continue;
      var ax = _p2.rot ? [0, 1] : [1, 0];
      for (var _i3 = 0, _arr = [-1, 1]; _i3 < _arr.length; _i3++) {
        var _sg = _arr[_i3];
        if (R2() < 0.35) continue;
        var _dx3 = ax[0] * _sg,
          _dz3 = ax[1] * _sg;
        var _x4 = _p2.x + _dx3 * (s.l * 0.42 + 0.35),
          _z4 = _p2.z + _dz3 * (s.l * 0.42 + 0.35);
        var pts = [[_x4, _z4]];
        var l1 = 0.8 + R2() * 1.5;
        _x4 += _dx3 * l1;
        _z4 += _dz3 * l1;
        pts.push([_x4, _z4]);
        if (R2() < 0.55) {
          var d = R2() < 0.5 ? -1 : 1;
          var bx = (_dx3 - _dz3 * d) * 0.7071,
            bz = (_dz3 + _dx3 * d) * 0.7071;
          var l2 = 0.8 + R2() * 1.3;
          _x4 += bx * l2;
          _z4 += bz * l2;
          pts.push([_x4, _z4]);
        }
        nets.push({
          pts: pts,
          via: R2() < 0.8
        });
      }
    }
    // MCU pin escape routing — every pin fans out, alternate pins via down
    var escapes = [];
    var _MCU_XY = _slicedToArray(MCU_XY, 2),
      mx = _MCU_XY[0],
      mz = _MCU_XY[1];
    var _loop = function _loop(_i4) {
      var o = (_i4 - 3.5) * 0.89;
      [[mx + o, mz + 5.15, 0, 1], [mx + o, mz - 5.15, 0, -1], [mx + 5.15, mz + o, 1, 0], [mx - 5.15, mz + o, -1, 0]].forEach(function (_ref, si) {
        var _ref2 = _slicedToArray(_ref, 4),
          px = _ref2[0],
          pz = _ref2[1],
          dx = _ref2[2],
          dz = _ref2[3];
        var len = 0.55 + (_i4 * 7 + si * 3) % 3 * 0.28;
        escapes.push({
          pts: [[px, pz], [px + dx * len, pz + dz * len]],
          via: (_i4 + si) % 2 === 0
        });
      });
    };
    for (var _i4 = 0; _i4 < 8; _i4++) {
      _loop(_i4);
    }
    // edge buses — parallel routed groups along both long edges
    var buses = [];
    for (var b = 0; b < 4; b++) {
      var _z5 = -16.1 - b * 0.55;
      buses.push([[-54, _z5], [54, _z5]]);
    }
    for (var _b = 0; _b < 3; _b++) {
      var _z6 = 15.9 + _b * 0.55;
      buses.push([[-22, _z6], [50, _z6]]);
    }
    return {
      foot: foot,
      vias: vias,
      stitch: stitch,
      tribs: tribs,
      nets: nets,
      escapes: escapes,
      buses: buses
    };
  }();

  // pads for the stop's MAIN part
  function mainPads(st) {
    var _TRACE_PTS$st$p3 = _slicedToArray(TRACE_PTS[st.p], 2),
      sx = _TRACE_PTS$st$p3[0],
      sz = _TRACE_PTS$st$p3[1],
      pads = [];
    if (st.kind === "mcu") {
      for (var i = 0; i < 8; i++) {
        var o = (i - 3.5) * 0.89;
        pads.push([sx + o, sz + 4.5, 0.5, 1.3]);
        pads.push([sx + o, sz - 4.5, 0.5, 1.3]);
        pads.push([sx + 4.5, sz + o, 1.3, 0.5]);
        pads.push([sx - 4.5, sz + o, 1.3, 0.5]);
      }
      pads.push([sx, sz, 4.2, 4.2]);
    } else if (st.kind === "irq") {
      padsFor("diode", sx, sz, 0).forEach(function (p) {
        return pads.push(p);
      });
    } else if (st.kind === "boot") {
      for (var _i5 = 0; _i5 < 5; _i5++) {
        pads.push([sx - 3.2 + _i5 * 1.6, sz - 0.85, 0.9, 0.9]);
        pads.push([sx - 3.2 + _i5 * 1.6, sz + 0.85, 0.9, 0.9]);
      }
    } else if (st.kind === "usbc") {
      for (var _i6 = 0; _i6 < 8; _i6++) pads.push([sx - 2.1 + _i6 * 0.6, sz - 3.2, 0.34, 1.1]);
      [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.2], [2.6, 2.2]].forEach(function (m) {
        return pads.push([sx + m[0], sz + m[1], 0.9, 1.9]);
      });
    } else if (st.kind === "switch") {
      [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]].forEach(function (m) {
        return pads.push([sx + m[0], sz + m[1], 1.5, 1.5]);
      });
    }
    return pads;
  }
  var COURT = {
    mcu: [14.6, 15.6],
    irq: [10.2, 7.6],
    usbc: [12.4, 8.4],
    boot: [10.4, 6.6],
    "switch": [9.4, 7.4]
  };

  /* ---- shared 2D geometry pass (color / spec / bump agree) ---- */
  function drawNetLines(x, S, W, H, style) {
    // style: {keep, copper, lwK, lwC, via, drill}
    var all = LAYOUT.nets.concat(LAYOUT.escapes);
    var _iterator3 = _createForOfIteratorHelper(all),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var n = _step3.value;
        var p = n.pts.map(function (q) {
          return uv(q[0], q[1], W, H);
        });
        if (style.keep) {
          poly(x, p);
          x.strokeStyle = style.keep;
          x.lineWidth = style.lwK * S;
          x.stroke();
        }
        poly(x, p);
        x.strokeStyle = style.copper;
        x.lineWidth = style.lwC * S;
        x.stroke();
        if (n.via && style.via) {
          var e = p[p.length - 1];
          x.fillStyle = style.via;
          x.beginPath();
          x.arc(e[0], e[1], 0.13 * S, 0, Math.PI * 2);
          x.fill();
          if (style.drill) {
            x.fillStyle = style.drill;
            x.beginPath();
            x.arc(e[0], e[1], 0.055 * S, 0, Math.PI * 2);
            x.fill();
          }
        }
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
    var _iterator4 = _createForOfIteratorHelper(LAYOUT.buses),
      _step4;
    try {
      for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
        var b = _step4.value;
        var _p3 = b.map(function (q) {
          return uv(q[0], q[1], W, H);
        });
        if (style.keep) {
          poly(x, _p3);
          x.strokeStyle = style.keep;
          x.lineWidth = style.lwK * 0.9 * S;
          x.stroke();
        }
        poly(x, _p3);
        x.strokeStyle = style.copper;
        x.lineWidth = style.lwC * 0.9 * S;
        x.stroke();
        if (style.via) for (var _i7 = 0, _arr2 = [_p3[0], _p3[_p3.length - 1]]; _i7 < _arr2.length; _i7++) {
          var _e = _arr2[_i7];
          x.fillStyle = style.via;
          x.beginPath();
          x.arc(_e[0], _e[1], 0.13 * S, 0, Math.PI * 2);
          x.fill();
          if (style.drill) {
            x.fillStyle = style.drill;
            x.beginPath();
            x.arc(_e[0], _e[1], 0.055 * S, 0, Math.PI * 2);
            x.fill();
          }
        }
      }
    } catch (err) {
      _iterator4.e(err);
    } finally {
      _iterator4.f();
    }
  }
  function allPads(W, H) {
    var out = [];
    STOPS.forEach(function (st) {
      var _iterator5 = _createForOfIteratorHelper(mainPads(st)),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var p = _step5.value;
          out.push(p);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    });
    var _iterator6 = _createForOfIteratorHelper(CPARTS),
      _step6;
    try {
      for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
        var p = _step6.value;
        var _iterator7 = _createForOfIteratorHelper(padsFor(p.k, p.x, p.z, p.rot)),
          _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var q = _step7.value;
            out.push(q);
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      }
    } catch (err) {
      _iterator6.e(err);
    } finally {
      _iterator6.f();
    }
    return out;
  }
  var HOLES = [[-BOARD_W / 2 + 3.2, -BOARD_D / 2 + 3.2], [BOARD_W / 2 - 3.2, -BOARD_D / 2 + 3.2], [-BOARD_W / 2 + 3.2, BOARD_D / 2 - 3.2], [BOARD_W / 2 - 3.2, BOARD_D / 2 - 3.2]];
  function drawColor(W, H) {
    var S = W / BOARD_W;
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var x = c.getContext("2d");
    x.fillStyle = "#0a0d12";
    x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W * 0.42, H * 0.4, 0, W * 0.5, H * 0.5, W * 0.62);
    g.addColorStop(0, "rgba(24,30,42,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(56,72,96,0.09)";
    x.lineWidth = 2;
    for (var i = -H; i < W; i += 10) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i + H, H);
      x.stroke();
      x.beginPath();
      x.moveTo(i + H, 0);
      x.lineTo(i, H);
      x.stroke();
    }
    x.strokeStyle = "rgba(110,140,180,0.12)";
    x.lineWidth = 0.16 * S;
    x.strokeRect(0.55 * S, 0.55 * S, W - 1.1 * S, H - 1.1 * S);
    x.lineCap = "round";
    x.lineJoin = "round";
    // tributary nets
    var _iterator8 = _createForOfIteratorHelper(LAYOUT.tribs),
      _step8;
    try {
      for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
        var pts = _step8.value;
        var p = pts.map(function (q) {
          return uv(q[0], q[1], W, H);
        });
        poly(x, p);
        x.strokeStyle = "rgba(3,4,7,0.9)";
        x.lineWidth = 0.34 * S;
        x.stroke();
        poly(x, p);
        x.strokeStyle = "rgba(150,172,205,0.16)";
        x.lineWidth = 0.2 * S;
        x.stroke();
        var e = p[p.length - 1];
        x.fillStyle = "#a88a46";
        x.beginPath();
        x.arc(e[0], e[1], 0.16 * S, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = "#06070b";
        x.beginPath();
        x.arc(e[0], e[1], 0.07 * S, 0, Math.PI * 2);
        x.fill();
      }
      // cluster nets + MCU escapes + edge buses
    } catch (err) {
      _iterator8.e(err);
    } finally {
      _iterator8.f();
    }
    drawNetLines(x, S, W, H, {
      keep: "rgba(3,4,7,0.9)",
      copper: "rgba(150,172,205,0.2)",
      lwK: 0.26,
      lwC: 0.14,
      via: "#a88a46",
      drill: "#06070b"
    });
    var traceUV = TRACE_PTS.map(function (p) {
      return uv(p[0], p[1], W, H);
    });
    smoothPath(x, traceUV);
    x.strokeStyle = "#04050a";
    x.lineWidth = 0.9 * S;
    x.stroke();
    var cop = x.createLinearGradient(0, 0, W, 0);
    cop.addColorStop(0, "#7a4a24");
    cop.addColorStop(0.5, "#c98a4e");
    cop.addColorStop(1, "#9a6232");
    smoothPath(x, traceUV);
    x.strokeStyle = cop;
    x.lineWidth = 0.58 * S;
    x.stroke();
    smoothPath(x, traceUV);
    x.strokeStyle = "rgba(255,224,184,0.5)";
    x.lineWidth = 0.14 * S;
    x.stroke();

    // IRQ — the external interrupt marks the main trace: a hard jog + pulse
    // marker at the interrupt stop. The trace visibly deviates but CONTINUES.
    {
      var _TRACE_PTS$STOPS$find = _slicedToArray(TRACE_PTS[STOPS.find(function (s) {
          return s.kind === "irq";
        }).p], 2),
        ix = _TRACE_PTS$STOPS$find[0],
        iz = _TRACE_PTS$STOPS$find[1];
      var _uv = uv(ix, iz, W, H),
        _uv2 = _slicedToArray(_uv, 2),
        iu = _uv2[0],
        iv = _uv2[1];
      // dark slash across the smooth trace — the break
      x.save();
      x.translate(iu, iv);
      x.rotate(-0.35);
      x.fillStyle = "#04050a";
      x.fillRect(-0.5 * S, -1.1 * S, 1.0 * S, 2.2 * S);
      // zigzag copper jog bridging the break — the system keeps running
      x.strokeStyle = "#c98a4e";
      x.lineWidth = 0.22 * S;
      x.lineJoin = "miter";
      x.beginPath();
      x.moveTo(-1.4 * S, 0);
      x.lineTo(-0.7 * S, -0.75 * S);
      x.lineTo(0, 0.75 * S);
      x.lineTo(0.7 * S, -0.75 * S);
      x.lineTo(1.4 * S, 0);
      x.stroke();
      x.strokeStyle = "rgba(255,224,184,0.55)";
      x.lineWidth = 0.08 * S;
      x.stroke();
      x.restore();
      // dashed pulse ring — the interrupt event marker
      x.setLineDash([0.4 * S, 0.32 * S]);
      x.strokeStyle = "rgba(220,226,238,0.6)";
      x.lineWidth = 0.09 * S;
      x.beginPath();
      x.arc(iu, iv, 2.4 * S, 0, Math.PI * 2);
      x.stroke();
      x.setLineDash([]);
      x.fillStyle = "#dfe3ec";
      x.font = "600 ".concat(0.5 * S, "px 'Geist Mono', monospace");
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("⚡ IRQ", iu + 3.3 * S, iv - 2.2 * S);
    }

    // ANTENNA — mask keepout + exposed-copper meander
    {
      var _uv3 = uv(ANT.x0 - 0.6, ANT.z0 - 0.6, W, H),
        _uv4 = _slicedToArray(_uv3, 2),
        au0 = _uv4[0],
        av0 = _uv4[1],
        _uv5 = uv(ANT.x1 + 0.6, ANT.z1 + 0.6, W, H),
        _uv6 = _slicedToArray(_uv5, 2),
        au1 = _uv6[0],
        av1 = _uv6[1];
      x.fillStyle = "#04050a";
      x.fillRect(au0, av0, au1 - au0, av1 - av0);
      var ap = ANT_PTS.map(function (q) {
        return uv(q[0], q[1], W, H);
      });
      poly(x, ap);
      x.strokeStyle = "#c98a4e";
      x.lineWidth = 0.24 * S;
      x.stroke();
      poly(x, ap);
      x.strokeStyle = "rgba(255,224,184,0.45)";
      x.lineWidth = 0.08 * S;
      x.stroke();
      x.setLineDash([0.35 * S, 0.28 * S]);
      x.strokeStyle = "rgba(220,226,238,0.7)";
      x.lineWidth = 0.09 * S;
      x.strokeRect(au0 - 0.25 * S, av0 - 0.25 * S, au1 - au0 + 0.5 * S, av1 - av0 + 0.5 * S);
      x.setLineDash([]);
      x.fillStyle = "#dfe3ec";
      x.font = "600 ".concat(0.55 * S, "px 'Geist Mono', monospace");
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("ANT1 · 2.4 GHz · KEEPOUT", (au0 + au1) / 2, av0 - 0.75 * S);
    }

    // ---- ENIG pads (stops + cluster parts) ----
    x.textBaseline = "middle";
    var _iterator9 = _createForOfIteratorHelper(allPads(W, H)),
      _step9;
    try {
      for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
        var _step9$value = _slicedToArray(_step9.value, 4),
          px = _step9$value[0],
          pz = _step9$value[1],
          w = _step9$value[2],
          d = _step9$value[3];
        var _uv11 = uv(px, pz, W, H),
          _uv12 = _slicedToArray(_uv11, 2),
          pu = _uv12[0],
          pv = _uv12[1];
        var grd = x.createLinearGradient(pu, pv - d * S / 2, pu, pv + d * S / 2);
        grd.addColorStop(0, "#e8c477");
        grd.addColorStop(0.5, "#cfa557");
        grd.addColorStop(1, "#a97f38");
        x.fillStyle = grd;
        x.fillRect(pu - w * S / 2, pv - d * S / 2, w * S, d * S);
      }
      // stop courtyards + refs
    } catch (err) {
      _iterator9.e(err);
    } finally {
      _iterator9.f();
    }
    STOPS.forEach(function (st) {
      var _TRACE_PTS$st$p4 = _slicedToArray(TRACE_PTS[st.p], 2),
        sx = _TRACE_PTS$st$p4[0],
        sz = _TRACE_PTS$st$p4[1];
      var _uv7 = uv(sx, sz, W, H),
        _uv8 = _slicedToArray(_uv7, 2),
        u = _uv8[0],
        v = _uv8[1];
      var ct = COURT[st.kind] || [5, 5];
      x.setLineDash([0.4 * S, 0.3 * S]);
      x.strokeStyle = "rgba(220,226,238,0.55)";
      x.lineWidth = 0.09 * S;
      x.strokeRect(u - ct[0] * S / 2, v - ct[1] * S / 2, ct[0] * S, ct[1] * S);
      x.setLineDash([]);
      x.fillStyle = "#dfe3ec";
      x.beginPath();
      x.arc(u - ct[0] * S / 2 - 0.35 * S, v - ct[1] * S / 2 - 0.35 * S, 0.14 * S, 0, Math.PI * 2);
      x.fill();
      x.font = "700 ".concat(0.72 * S, "px 'Geist Mono', monospace");
      x.textAlign = "center";
      x.fillText(st.ref.split(" · ")[0], u, v - ct[1] * S / 2 - 1.0 * S);
      x.fillStyle = "#98a1b3";
      x.font = "500 ".concat(0.5 * S, "px 'Geist Mono', monospace");
      x.fillText(st.ref.split(" · ")[1] || "", u, v + ct[1] * S / 2 + 0.9 * S);
      // zone silkscreen — one quiet line of story per stop
      var ZSILK = {
        usbc: ["SOLDER · ARDUINO · SLOT CARS"],
        irq: ["KYIV → GERMANY", "02 / 2022"],
        boot: ["DESIGN · UX · INTERACTION"],
        mcu: ["WAFER", "PCB · ZEPHYR · ARM", "WORKING PROTOTYPE"],
        "switch": ["ZMK · KERFUR · ISKRA", "NEXT: WAFER COMPANY"]
      };
      (ZSILK[st.kind] || []).forEach(function (line, li) {
        x.fillStyle = li === 0 ? "#8d96a8" : "#6b7488";
        x.font = "500 ".concat(0.46 * S, "px 'Geist Mono', monospace");
        x.fillText(line, u, v + ct[1] * S / 2 + (1.75 + li * 0.72) * S);
      });
    });
    // cluster part silkscreen — outline, ref, polarity marks
    var _iterator0 = _createForOfIteratorHelper(CPARTS),
      _step0;
    try {
      for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
        var _p4 = _step0.value;
        var s = P[_p4.k];
        var _uv13 = uv(_p4.x, _p4.z, W, H),
          _uv14 = _slicedToArray(_uv13, 2),
          _u = _uv14[0],
          _v = _uv14[1];
        var L = _p4.rot ? s.w : s.l,
          D = _p4.rot ? s.l : s.w;
        x.strokeStyle = "rgba(190,198,214,0.55)";
        x.lineWidth = 0.07 * S;
        if (_p4.k === "tp") {
          x.beginPath();
          x.arc(_u, _v, 0.85 * S, 0, Math.PI * 2);
          x.stroke();
        } else x.strokeRect(_u - (L / 2 + 0.28) * S, _v - (D / 2 + 0.24) * S, (L + 0.56) * S, (D + 0.48) * S);
        x.fillStyle = "#9aa3b5";
        x.font = "500 ".concat(0.44 * S, "px 'Geist Mono', monospace");
        x.textAlign = "center";
        x.fillText(_p4.ref, _u, _v - (D / 2 + 0.72) * S);
        if (_p4.k === "ctant") {
          x.fillStyle = "#dfe3ec";
          x.font = "700 ".concat(0.6 * S, "px 'Geist Mono', monospace");
          x.fillText("+", _u - (s.l / 2 + 0.75) * S, _v);
        }
        if (_p4.k === "diode" || _p4.k === "led") {
          x.strokeStyle = "rgba(220,226,238,0.8)";
          x.lineWidth = 0.1 * S;
          var _bx = _u - (L / 2 + 0.42) * S;
          x.beginPath();
          x.moveTo(_bx, _v - D * S / 2);
          x.lineTo(_bx, _v + D * S / 2);
          x.stroke();
        }
      }
      // passives
    } catch (err) {
      _iterator0.e(err);
    } finally {
      _iterator0.f();
    }
    var _iterator1 = _createForOfIteratorHelper(LAYOUT.foot),
      _step1;
    try {
      for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
        var f = _step1.value;
        var _uv15 = uv(f.x, f.z, W, H),
          _uv16 = _slicedToArray(_uv15, 2),
          _u2 = _uv16[0],
          _v2 = _uv16[1];
        var l = f.l * S,
          _w = f.w * S,
          half = l / 2;
        x.save();
        x.translate(_u2, _v2);
        if (f.rot) x.rotate(Math.PI / 2);
        x.fillStyle = "#c9a052";
        x.fillRect(-half - 0.18 * S, -_w / 2, 0.36 * S, _w);
        x.fillRect(half - 0.18 * S, -_w / 2, 0.36 * S, _w);
        x.fillStyle = "#b7c0cf";
        x.fillRect(-half - 0.18 * S, -_w / 2, 0.14 * S, _w);
        x.fillRect(half + 0.04 * S, -_w / 2, 0.14 * S, _w);
        x.strokeStyle = "rgba(190,198,214,0.5)";
        x.lineWidth = 0.06 * S;
        x.strokeRect(-half - 0.3 * S, -_w / 2 - 0.22 * S, l + 0.6 * S, _w + 0.44 * S);
        x.restore();
        x.fillStyle = "#8d96a8";
        x.font = "500 ".concat(0.42 * S, "px 'Geist Mono', monospace");
        x.textAlign = "center";
        x.fillText(f.ref, _u2, _v2 - (f.rot ? l / 2 : _w / 2) - 0.4 * S);
      }
      // vias + stitching
    } catch (err) {
      _iterator1.e(err);
    } finally {
      _iterator1.f();
    }
    var _iterator10 = _createForOfIteratorHelper(LAYOUT.vias.concat(LAYOUT.stitch.map(function (s) {
        return {
          x: s[0],
          z: s[1],
          tent: true
        };
      }))),
      _step10;
    try {
      for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
        var vd = _step10.value;
        var _uv17 = uv(vd.x, vd.z, W, H),
          _uv18 = _slicedToArray(_uv17, 2),
          _u3 = _uv18[0],
          _v3 = _uv18[1];
        if (vd.tent) {
          x.fillStyle = "rgba(46,58,78,0.85)";
          x.beginPath();
          x.arc(_u3, _v3, 0.14 * S, 0, Math.PI * 2);
          x.fill();
          x.fillStyle = "rgba(8,10,15,0.9)";
          x.beginPath();
          x.arc(_u3, _v3, 0.05 * S, 0, Math.PI * 2);
          x.fill();
        } else {
          x.fillStyle = "#b08c46";
          x.beginPath();
          x.arc(_u3, _v3, 0.15 * S, 0, Math.PI * 2);
          x.fill();
          x.fillStyle = "#05060a";
          x.beginPath();
          x.arc(_u3, _v3, 0.065 * S, 0, Math.PI * 2);
          x.fill();
        }
      }
      // mounting holes — plated ring + silkscreen keepout
    } catch (err) {
      _iterator10.e(err);
    } finally {
      _iterator10.f();
    }
    var _iterator11 = _createForOfIteratorHelper(HOLES),
      _step11;
    try {
      for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
        var h = _step11.value;
        var _uv19 = uv(h[0], h[1], W, H),
          _uv20 = _slicedToArray(_uv19, 2),
          _u4 = _uv20[0],
          _v4 = _uv20[1];
        x.fillStyle = "#b08c46";
        x.beginPath();
        x.arc(_u4, _v4, 0.52 * S, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = "#020308";
        x.beginPath();
        x.arc(_u4, _v4, 0.34 * S, 0, Math.PI * 2);
        x.fill();
        x.strokeStyle = "rgba(220,226,238,0.5)";
        x.lineWidth = 0.08 * S;
        x.beginPath();
        x.arc(_u4, _v4, 0.72 * S, 0, Math.PI * 2);
        x.stroke();
      }
      // fiducials
    } catch (err) {
      _iterator11.e(err);
    } finally {
      _iterator11.f();
    }
    [[-44, -15.6], [44, 15.6], [44, -15.6]].forEach(function (fd) {
      var _uv9 = uv(fd[0], fd[1], W, H),
        _uv0 = _slicedToArray(_uv9, 2),
        u = _uv0[0],
        v = _uv0[1];
      x.fillStyle = "#05060a";
      x.beginPath();
      x.arc(u, v, 0.32 * S, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = "#cfa557";
      x.beginPath();
      x.arc(u, v, 0.16 * S, 0, Math.PI * 2);
      x.fill();
    });
    // system marking — the board declares what it is (quiet, mono, small)
    {
      var _uv1 = uv(-14, -14.6, W, H),
        _uv10 = _slicedToArray(_uv1, 2),
        u = _uv10[0],
        v = _uv10[1];
      x.fillStyle = "#6b7488";
      x.font = "600 ".concat(0.52 * S, "px 'Geist Mono', monospace");
      x.textAlign = "left";
      x.textBaseline = "middle";
      x.fillText("M.O. SYSTEM · NODE 0x00", u, v);
      x.fillStyle = "#565f72";
      x.font = "500 ".concat(0.46 * S, "px 'Geist Mono', monospace");
      x.fillText("INTERNAL ARCHITECTURE · PROJECTION 01", u, v + 0.75 * S);
      x.fillText("DISTRIBUTED SOURCE", u, v + 1.5 * S);
    }
    // board silkscreen identity + fab block
    x.fillStyle = "#5b6478";
    x.font = "600 ".concat(0.88 * S, "px 'Geist Mono', monospace");
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.fillText("M.O. SYSTEM · NODE 0x00", 1.3 * S, 1.55 * S);
    x.font = "500 ".concat(0.58 * S, "px 'Geist Mono', monospace");
    x.fillText("INTERNAL ARCHITECTURE · PROJECTION 01 · MÜNCHEN 2026", 1.3 * S, H - 1.3 * S);
    x.textAlign = "right";
    x.fillText("// follow the trace", W - 1.3 * S, H - 1.3 * S);
    x.fillText("E355094 94V-0", W - 1.3 * S, 1.55 * S);
    x.textAlign = "center";
    x.fillText("DISTRIBUTED SOURCE · RoHS · ⏚", W / 2, H - 1.15 * S);
    // barcode (fab lot)
    {
      var R = makeRng(99);
      var bx = W - 12.5 * S;
      var by = 2.3 * S;
      x.fillStyle = "#8d96a8";
      while (bx < W - 6.5 * S) {
        var bw = (0.06 + R() * 0.16) * S;
        x.fillRect(bx, by, bw, 1.1 * S);
        bx += bw + (0.08 + R() * 0.14) * S;
      }
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }
  function drawSpec(W, H) {
    // R unused · G = roughness · B = metalness
    var S = W / BOARD_W;
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var x = c.getContext("2d");
    x.fillStyle = "rgb(0,165,0)";
    x.fillRect(0, 0, W, H);
    x.lineCap = "round";
    x.lineJoin = "round";
    x.strokeStyle = "rgb(0,140,25)";
    x.lineWidth = 0.2 * S;
    var _iterator12 = _createForOfIteratorHelper(LAYOUT.tribs),
      _step12;
    try {
      for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
        var pts = _step12.value;
        poly(x, pts.map(function (q) {
          return uv(q[0], q[1], W, H);
        }));
        x.stroke();
      }
    } catch (err) {
      _iterator12.e(err);
    } finally {
      _iterator12.f();
    }
    drawNetLines(x, S, W, H, {
      keep: null,
      copper: "rgb(0,140,25)",
      lwK: 0,
      lwC: 0.14,
      via: "rgb(0,60,255)"
    });
    var traceUV = TRACE_PTS.map(function (p) {
      return uv(p[0], p[1], W, H);
    });
    smoothPath(x, traceUV);
    x.strokeStyle = "rgb(0,70,255)";
    x.lineWidth = 0.58 * S;
    x.stroke();
    var ap = ANT_PTS.map(function (q) {
      return uv(q[0], q[1], W, H);
    });
    poly(x, ap);
    x.strokeStyle = "rgb(0,70,255)";
    x.lineWidth = 0.24 * S;
    x.stroke();
    var _iterator13 = _createForOfIteratorHelper(allPads(W, H)),
      _step13;
    try {
      for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
        var _step13$value = _slicedToArray(_step13.value, 4),
          px = _step13$value[0],
          pz = _step13$value[1],
          w = _step13$value[2],
          d = _step13$value[3];
        var _uv21 = uv(px, pz, W, H),
          _uv22 = _slicedToArray(_uv21, 2),
          u = _uv22[0],
          v = _uv22[1];
        x.fillStyle = "rgb(0,60,255)";
        x.fillRect(u - w * S / 2, v - d * S / 2, w * S, d * S);
      }
    } catch (err) {
      _iterator13.e(err);
    } finally {
      _iterator13.f();
    }
    var _iterator14 = _createForOfIteratorHelper(LAYOUT.foot),
      _step14;
    try {
      for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
        var f = _step14.value;
        var _uv23 = uv(f.x, f.z, W, H),
          _uv24 = _slicedToArray(_uv23, 2),
          _u5 = _uv24[0],
          _v5 = _uv24[1];
        var l = f.l * S,
          _w2 = f.w * S;
        x.save();
        x.translate(_u5, _v5);
        if (f.rot) x.rotate(Math.PI / 2);
        x.fillStyle = "rgb(0,55,245)";
        x.fillRect(-l / 2 - 0.18 * S, -_w2 / 2, 0.36 * S, _w2);
        x.fillRect(l / 2 - 0.18 * S, -_w2 / 2, 0.36 * S, _w2);
        x.restore();
      }
    } catch (err) {
      _iterator14.e(err);
    } finally {
      _iterator14.f();
    }
    var _iterator15 = _createForOfIteratorHelper(LAYOUT.vias),
      _step15;
    try {
      for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
        var vd = _step15.value;
        if (vd.tent) continue;
        var _uv25 = uv(vd.x, vd.z, W, H),
          _uv26 = _slicedToArray(_uv25, 2),
          _u6 = _uv26[0],
          _v6 = _uv26[1];
        x.fillStyle = "rgb(0,60,255)";
        x.beginPath();
        x.arc(_u6, _v6, 0.15 * S, 0, Math.PI * 2);
        x.fill();
      }
    } catch (err) {
      _iterator15.e(err);
    } finally {
      _iterator15.f();
    }
    var _iterator16 = _createForOfIteratorHelper(HOLES),
      _step16;
    try {
      for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
        var h = _step16.value;
        var _uv27 = uv(h[0], h[1], W, H),
          _uv28 = _slicedToArray(_uv27, 2),
          _u7 = _uv28[0],
          _v7 = _uv28[1];
        x.fillStyle = "rgb(0,60,255)";
        x.beginPath();
        x.arc(_u7, _v7, 0.52 * S, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = "rgb(0,200,0)";
        x.beginPath();
        x.arc(_u7, _v7, 0.34 * S, 0, Math.PI * 2);
        x.fill();
      }
    } catch (err) {
      _iterator16.e(err);
    } finally {
      _iterator16.f();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
  function drawBump(W, H) {
    var S = W / BOARD_W;
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var x = c.getContext("2d");
    x.fillStyle = "#808080";
    x.fillRect(0, 0, W, H);
    x.lineCap = "round";
    x.lineJoin = "round";
    x.strokeStyle = "#8e8e8e";
    x.lineWidth = 0.2 * S;
    var _iterator17 = _createForOfIteratorHelper(LAYOUT.tribs),
      _step17;
    try {
      for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
        var pts = _step17.value;
        poly(x, pts.map(function (q) {
          return uv(q[0], q[1], W, H);
        }));
        x.stroke();
      }
    } catch (err) {
      _iterator17.e(err);
    } finally {
      _iterator17.f();
    }
    drawNetLines(x, S, W, H, {
      keep: null,
      copper: "#8c8c8c",
      lwK: 0,
      lwC: 0.14,
      via: "#9a9a9a",
      drill: "#3a3a3a"
    });
    var traceUV = TRACE_PTS.map(function (p) {
      return uv(p[0], p[1], W, H);
    });
    smoothPath(x, traceUV);
    x.strokeStyle = "#6a6a6a";
    x.lineWidth = 0.9 * S;
    x.stroke();
    smoothPath(x, traceUV);
    x.strokeStyle = "#b4b4b4";
    x.lineWidth = 0.58 * S;
    x.stroke();
    var ap = ANT_PTS.map(function (q) {
      return uv(q[0], q[1], W, H);
    });
    poly(x, ap);
    x.strokeStyle = "#b0b0b0";
    x.lineWidth = 0.24 * S;
    x.stroke();
    var _iterator18 = _createForOfIteratorHelper(allPads(W, H)),
      _step18;
    try {
      for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
        var _step18$value = _slicedToArray(_step18.value, 4),
          px = _step18$value[0],
          pz = _step18$value[1],
          w = _step18$value[2],
          d = _step18$value[3];
        var _uv29 = uv(px, pz, W, H),
          _uv30 = _slicedToArray(_uv29, 2),
          u = _uv30[0],
          v = _uv30[1];
        x.fillStyle = "#a8a8a8";
        x.fillRect(u - w * S / 2, v - d * S / 2, w * S, d * S);
      }
    } catch (err) {
      _iterator18.e(err);
    } finally {
      _iterator18.f();
    }
    var _iterator19 = _createForOfIteratorHelper(LAYOUT.foot),
      _step19;
    try {
      for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
        var f = _step19.value;
        var _uv31 = uv(f.x, f.z, W, H),
          _uv32 = _slicedToArray(_uv31, 2),
          _u8 = _uv32[0],
          _v8 = _uv32[1];
        var l = f.l * S,
          _w3 = f.w * S;
        x.save();
        x.translate(_u8, _v8);
        if (f.rot) x.rotate(Math.PI / 2);
        x.fillStyle = "#a8a8a8";
        x.fillRect(-l / 2 - 0.18 * S, -_w3 / 2, 0.36 * S, _w3);
        x.fillRect(l / 2 - 0.18 * S, -_w3 / 2, 0.36 * S, _w3);
        x.restore();
      }
    } catch (err) {
      _iterator19.e(err);
    } finally {
      _iterator19.f();
    }
    var _iterator20 = _createForOfIteratorHelper(LAYOUT.vias),
      _step20;
    try {
      for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
        var vd = _step20.value;
        var _uv33 = uv(vd.x, vd.z, W, H),
          _uv34 = _slicedToArray(_uv33, 2),
          _u9 = _uv34[0],
          _v9 = _uv34[1];
        x.fillStyle = "#9a9a9a";
        x.beginPath();
        x.arc(_u9, _v9, 0.15 * S, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = "#3a3a3a";
        x.beginPath();
        x.arc(_u9, _v9, 0.06 * S, 0, Math.PI * 2);
        x.fill();
      }
    } catch (err) {
      _iterator20.e(err);
    } finally {
      _iterator20.f();
    }
    var _iterator21 = _createForOfIteratorHelper(HOLES),
      _step21;
    try {
      for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
        var h = _step21.value;
        var _uv35 = uv(h[0], h[1], W, H),
          _uv36 = _slicedToArray(_uv35, 2),
          _u0 = _uv36[0],
          _v0 = _uv36[1];
        x.fillStyle = "#9e9e9e";
        x.beginPath();
        x.arc(_u0, _v0, 0.52 * S, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = "#101010";
        x.beginPath();
        x.arc(_u0, _v0, 0.34 * S, 0, Math.PI * 2);
        x.fill();
      }
    } catch (err) {
      _iterator21.e(err);
    } finally {
      _iterator21.f();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  /* ---- procedural components ---- */
  function mat(color, metalness, roughness) {
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness,
      roughness: roughness,
      envMapIntensity: 1.1
    });
  }
  function roundedBox(w, h, d, r, m) {
    var g = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(g, m);
  }
  function markingTex(lines) {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var x = c.getContext("2d");
    x.fillStyle = "#141821";
    x.fillRect(0, 0, 256, 256);
    x.strokeStyle = "#2a3140";
    x.lineWidth = 3;
    x.strokeRect(10, 10, 236, 236);
    x.fillStyle = "#9aa2b2";
    x.font = "600 30px 'Geist Mono', monospace";
    x.textAlign = "left";
    x.textBaseline = "middle";
    lines.forEach(function (L, i) {
      return x.fillText(L, 44, 104 + i * 40);
    });
    x.fillStyle = "#aab2c2";
    x.beginPath();
    x.arc(40, 46, 12, 0, Math.PI * 2);
    x.fill();
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  function buildComponent(kind) {
    var grp = new THREE.Group();
    var epoxy = mat(0x161b22, 0.25, 0.5);
    var metal = mat(0xb9c0cc, 1.0, 0.28);
    var gold = mat(0xd9b35e, 1.0, 0.32);
    if (kind === "usbc") {
      var shell = mat(0xc4ccd6, 1.0, 0.22);
      var body = roundedBox(5.5, 3.2, 7, 0.4, shell);
      body.position.y = 1.6 + TOP;
      grp.add(body);
      var slot = roundedBox(4.2, 1.6, 1, 0.2, mat(0x05060a, 0.4, 0.5));
      slot.position.set(0, 1.6 + TOP, 3.6);
      grp.add(slot);
      var tongue = roundedBox(3.4, 0.3, 0.8, 0.1, mat(0x0e1116, 0.1, 0.6));
      tongue.position.set(0, 1.6 + TOP, 3.25);
      grp.add(tongue);
      var lip = roundedBox(5.2, 0.5, 0.6, 0.1, gold);
      lip.position.set(0, 1.6 + TOP, -3.4);
      grp.add(lip);
      [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.2], [2.6, 2.2]].forEach(function (m2) {
        var leg = roundedBox(0.7, 0.3, 1.6, 0.1, metal);
        leg.position.set(m2[0], 0.15 + TOP, m2[1]);
        grp.add(leg);
      });
    } else if (kind === "irq") {
      // interrupt zone — a prominent SMA protection diode carries the stop
      var _body = roundedBox(4.3, 1.1, 2.6, 0.2, mat(0x0c0e13, 0.1, 0.5));
      _body.position.y = 0.55 + TOP;
      grp.add(_body);
      var band = roundedBox(0.5, 1.14, 2.4, 0.05, mat(0xd8dbe2, 0.05, 0.55));
      band.position.set(-1.1, 0.55 + TOP, 0);
      grp.add(band);
      [-1, 1].forEach(function (sg) {
        var e = roundedBox(0.6, 0.5, 2.2, 0.1, metal);
        e.position.set(sg * 2.35, 0.25 + TOP, 0);
        grp.add(e);
      });
    } else if (kind === "boot") {
      // access point — 2×5 SWD/boot header, gold pins in a black shroud base
      var base = roundedBox(8.6, 1.3, 3.2, 0.15, mat(0x14171f, 0.2, 0.5));
      base.position.y = 0.65 + TOP;
      grp.add(base);
      for (var i = 0; i < 5; i++) for (var _i8 = 0, _arr3 = [-1, 1]; _i8 < _arr3.length; _i8++) {
        var sg = _arr3[_i8];
        var pin = roundedBox(0.42, 2.2, 0.42, 0.05, gold);
        pin.position.set(-3.2 + i * 1.6, 1.35 + TOP, sg * 0.85);
        grp.add(pin);
      }
      var key = roundedBox(0.7, 0.35, 0.7, 0.05, mat(0x2a3140, 0.2, 0.5));
      key.position.set(-3.2, 1.35 + TOP, -1.85);
      grp.add(key);
    } else if (kind === "mcu") {
      var _body2 = roundedBox(9, 1.6, 9, 0.3, epoxy);
      _body2.position.y = 0.8 + TOP;
      grp.add(_body2);
      var mark = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.4), new THREE.MeshStandardMaterial({
        map: markingTex(["nRF52840", "QIAA-E0", "2426AB"]),
        metalness: 0.05,
        roughness: 0.5
      }));
      mark.rotation.x = -Math.PI / 2;
      mark.position.y = 1.62 + TOP;
      grp.add(mark);
      for (var s = 0; s < 4; s++) for (var _i9 = 0; _i9 < 8; _i9++) {
        var _pin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 1.1), gold);
        var o = (_i9 - 3.5) * 1.05;
        if (s === 0) _pin.position.set(o, 0.3 + TOP, 5);
        if (s === 1) _pin.position.set(o, 0.3 + TOP, -5);
        if (s === 2) _pin.position.set(5, 0.3 + TOP, o), _pin.rotation.y = Math.PI / 2;
        if (s === 3) _pin.position.set(-5, 0.3 + TOP, o), _pin.rotation.y = Math.PI / 2;
        grp.add(_pin);
      }
      var dot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), mat(0x9aa3b3, 0.2, 0.5));
      dot.position.set(-3, 1.62 + TOP, -3);
      grp.add(dot);
    } else if (kind === "switch") {
      var housing = roundedBox(4.2, 1.7, 4.2, 0.2, mat(0x14171f, 0.2, 0.5));
      housing.position.y = 0.85 + TOP;
      grp.add(housing);
      var plate = roundedBox(4.2, 0.16, 4.2, 0.1, metal);
      plate.position.y = 1.78 + TOP;
      grp.add(plate);
      var btn = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.75, 24), mat(0xff5b3b, 0.1, 0.45));
      btn.position.y = 2.2 + TOP;
      grp.add(btn);
      [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]].forEach(function (m2) {
        var leg = roundedBox(0.6, 0.25, 0.9, 0.1, metal);
        leg.position.set(m2[0], 0.13 + TOP, m2[1]);
        grp.add(leg);
      });
    }
    return grp;
  }

  /* ---- cluster part 3D builders ---- */
  function buildPart(k) {
    var g = new THREE.Group();
    var s = P[k];
    var endMat = mat(0xb7c0cf, 1.0, 0.3);
    var box = function box(w, h, d, m) {
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    };
    var twoEnd = function twoEnd(bodyMat, bodyL) {
      var body = box(bodyL || s.l * 0.7, s.h, s.w, bodyMat);
      body.position.y = s.h / 2;
      g.add(body);
      [-1, 1].forEach(function (sg) {
        var e = box(s.l * 0.16, s.h, s.w, endMat);
        e.position.set(sg * s.l * 0.42, s.h / 2, 0);
        g.add(e);
      });
      return body;
    };
    if (k === "r") twoEnd(mat(0x11141a, 0.05, 0.5));else if (k === "c") twoEnd(mat(0xb08d5a, 0.1, 0.5));else if (k === "fb") twoEnd(mat(0x3a3f47, 0.2, 0.5));else if (k === "led") {
      twoEnd(mat(0xe8eaec, 0.05, 0.4));
      var dome = box(s.l * 0.42, 0.28, s.w * 0.7, new THREE.MeshStandardMaterial({
        color: 0x073b33,
        emissive: 0x00f0c8,
        emissiveIntensity: 1.6,
        metalness: 0,
        roughness: 0.3
      }));
      dome.position.y = s.h + 0.14;
      g.add(dome);
    } else if (k === "diode") {
      twoEnd(mat(0x0c0e13, 0.1, 0.5));
      var band = box(0.42, 0.03, s.w * 0.9, mat(0xd8dbe2, 0, 0.6));
      band.position.set(-s.l * 0.22, s.h + 0.015, 0);
      g.add(band);
    } else if (k === "ctant") {
      var body = box(s.l * 0.78, s.h, s.w * 0.92, mat(0xc0913c, 0.1, 0.5));
      body.position.y = s.h / 2;
      g.add(body);
      var stripe = box(0.5, 0.03, s.w * 0.8, mat(0x3a2c14, 0, 0.6));
      stripe.position.set(-s.l * 0.26, s.h + 0.015, 0);
      g.add(stripe);
      [-1, 1].forEach(function (sg) {
        var e = box(s.l * 0.14, 0.5, s.w * 0.7, endMat);
        e.position.set(sg * s.l * 0.44, 0.25, 0);
        g.add(e);
      });
    } else if (k === "ind") {
      var _body3 = box(s.l * 0.92, s.h, s.w * 0.92, mat(0x23262c, 0.45, 0.42));
      _body3.position.y = s.h / 2;
      g.add(_body3);
      var top = box(s.l * 0.6, 0.04, s.w * 0.6, mat(0x30343c, 0.4, 0.4));
      top.position.y = s.h + 0.02;
      g.add(top);
    } else if (k === "sot23") {
      var _body4 = box(2.0, s.h, 1.4, mat(0x161b22, 0.25, 0.5));
      _body4.position.y = 0.35 + s.h / 2;
      g.add(_body4);
      [[-0.95, 1.0], [0.95, 1.0], [0, -1.0]].forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
          px = _ref4[0],
          pz = _ref4[1];
        var pin = box(0.45, 0.18, 0.75, endMat);
        pin.position.set(px, 0.09, pz);
        g.add(pin);
      });
    } else if (k === "sot223") {
      var _body5 = box(4.4, s.h, 3.0, mat(0x161b22, 0.25, 0.5));
      _body5.position.y = 0.3 + s.h / 2;
      g.add(_body5);
      var tab = box(3.2, 0.22, 1.6, endMat);
      tab.position.set(0, 0.11, -2.0);
      g.add(tab);
      for (var i = -1; i <= 1; i++) {
        var pin = box(0.8, 0.18, 1.1, endMat);
        pin.position.set(i * 2.1, 0.09, 2.0);
        g.add(pin);
      }
    } else if (k === "tp") {
      var pad = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), mat(0xd9b35e, 1.0, 0.3));
      pad.position.y = 0.04;
      g.add(pad);
    } else if (k === "xtal") {
      var can = box(4.4, s.h, 2.7, mat(0xb9c0cc, 1.0, 0.28));
      can.position.y = s.h / 2;
      g.add(can);
    }
    return g;
  }

  // passives + all cluster parts seated on their texture footprints
  function scatterParts(group) {
    var capBody = mat(0xb08d5a, 0.1, 0.5);
    var capEnd = mat(0xb7c0cf, 1.0, 0.3);
    var resBody = mat(0x11141a, 0.05, 0.5);
    var _iterator22 = _createForOfIteratorHelper(LAYOUT.foot),
      _step22;
    try {
      var _loop2 = function _loop2() {
        var f = _step22.value;
        var g = new THREE.Group();
        var bl = f.l * 0.92,
          bw = f.w * 0.95,
          bh = f.cap ? f.w * 0.75 : 0.42;
        var body = new THREE.Mesh(new THREE.BoxGeometry(bl * 0.72, bh, bw), f.cap ? capBody : resBody);
        body.position.y = bh / 2;
        g.add(body);
        [-1, 1].forEach(function (s) {
          var end = new THREE.Mesh(new THREE.BoxGeometry(bl * 0.16, bh, bw), capEnd);
          end.position.set(s * bl * 0.43, bh / 2, 0);
          g.add(end);
        });
        g.position.set(f.x, TOP, f.z);
        if (f.rot) g.rotation.y = Math.PI / 2;
        group.add(g);
      };
      for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
        _loop2();
      }
    } catch (err) {
      _iterator22.e(err);
    } finally {
      _iterator22.f();
    }
    var _iterator23 = _createForOfIteratorHelper(CPARTS),
      _step23;
    try {
      for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
        var p = _step23.value;
        var g = buildPart(p.k);
        g.position.set(p.x, TOP, p.z);
        if (p.rot) g.rotation.y = Math.PI / 2;
        group.add(g);
      }
    } catch (err) {
      _iterator23.e(err);
    } finally {
      _iterator23.f();
    }
  }

  /* ---- REAL Wafer exploded view (actual part GLBs, world-aligned) ---- */
  var WAFER_H = {
    key: 1.06,
    "case": 0.60,
    display: 0.40,
    switches: 0.18,
    usbc: -0.36,
    plate: -0.82,
    antenna: -0.62,
    softoff: -0.54,
    pcb: -0.52,
    mcu: -0.42
  };
  var waferParts = [],
    waferMats = [];
  function buildWaferReal(group) {
    var load = window.loadProjectModel;
    if (!load) {
      console.warn("[board3] loadProjectModel missing");
      return;
    }
    var files = ["case_L", "case_R", "plate_L", "plate_R", "pcb_L", "pcb_R", "usbc_L", "usbc_R", "switches_L", "switches_R", "mcu", "display_L", "display_R", "antenna_L", "antenna_R", "softoff_L", "softoff_R"];
    for (var _i0 = 0, _arr4 = ["L", "R"]; _i0 < _arr4.length; _i0++) {
      var s = _arr4[_i0];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 5; c++) files.push("key_".concat(s, "_r").concat(r, "c").concat(c));
      for (var t = 0; t < 3; t++) files.push("key_".concat(s, "_t").concat(t));
    }
    Promise.all(files.map(function (f) {
      return load("models/wafer_parts/" + f + ".glb", THREE).then(function (root) {
        return {
          f: f,
          root: root
        };
      })["catch"](function () {
        return null;
      });
    })).then(function (ok) {
      ok = ok.filter(Boolean);
      if (!ok.length) return;
      var holder = new THREE.Group();
      var _iterator24 = _createForOfIteratorHelper(ok),
        _step24;
      try {
        for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
          var root = _step24.value.root;
          holder.add(root);
        }
      } catch (err) {
        _iterator24.e(err);
      } finally {
        _iterator24.f();
      }
      var box = new THREE.Box3().setFromObject(holder);
      var size = new THREE.Vector3();
      box.getSize(size);
      var centre = new THREE.Vector3();
      box.getCenter(centre);
      var dims = [size.x, size.y, size.z];
      var upI = dims.indexOf(Math.min.apply(Math, dims));
      var longI = dims.indexOf(Math.max.apply(Math, dims));
      if (longI === upI) longI = (upI + 1) % 3;
      var ax = function ax(i) {
        return new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
      };
      var UPm = ax(upI),
        LONGm = ax(longI);
      var capMean = 0,
        capN = 0;
      var _iterator25 = _createForOfIteratorHelper(ok),
        _step25;
      try {
        for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
          var _step25$value = _step25.value,
            f = _step25$value.f,
            _root = _step25$value.root;
          if (!f.startsWith("key_")) continue;
          var b = new THREE.Box3().setFromObject(_root),
            _c = new THREE.Vector3();
          b.getCenter(_c);
          capMean += _c.sub(centre).dot(UPm);
          capN++;
        }
      } catch (err) {
        _iterator25.e(err);
      } finally {
        _iterator25.f();
      }
      if (capN && capMean < 0) UPm.multiplyScalar(-1);
      var base = dims[longI];
      var _iterator26 = _createForOfIteratorHelper(ok),
        _step26;
      try {
        for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
          var _step26$value = _step26.value,
            _f = _step26$value.f,
            _root2 = _step26$value.root;
          var kind = _f.startsWith("key_") ? "key" : _f.replace(/_[LR]$/, "");
          var _b2 = new THREE.Box3().setFromObject(_root2),
            _c2 = new THREE.Vector3();
          _b2.getCenter(_c2);
          var rel = _c2.sub(centre);
          var horiz = rel.clone().addScaledVector(UPm, -rel.dot(UPm));
          var vec = new THREE.Vector3().addScaledVector(UPm, (WAFER_H[kind] || 0) * base * 0.35).addScaledVector(horiz, 0.4);
          var wrap = new THREE.Group();
          wrap.add(_root2);
          wrap.userData.vec = vec;
          holder.add(wrap);
          waferParts.push(wrap);
          _root2.traverse(function (o) {
            if (o.isMesh && o.material) {
              var m = o.material = o.material.clone();
              m.transparent = true;
              if ("envMapIntensity" in m) m.envMapIntensity = 1.2;
              waferMats.push(m);
            }
          });
        }
      } catch (err) {
        _iterator26.e(err);
      } finally {
        _iterator26.f();
      }
      holder.position.copy(centre).multiplyScalar(-1);
      var align = new THREE.Group();
      align.add(holder);
      var q = new THREE.Quaternion().setFromUnitVectors(UPm.clone(), new THREE.Vector3(0, 1, 0));
      align.quaternion.copy(q);
      var lw = LONGm.clone().applyQuaternion(q);
      align.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.atan2(lw.z, lw.x));
      align.scale.setScalar(13 / Math.max(1e-3, base));
      group.add(align);
    });
  }
  function build(mount, opts) {
    var LITE = !!(opts && opts.lite);
    var THREE = window.THREE;
    if (!THREE) {
      console.warn("THREE missing");
      return null;
    }
    var W = mount.clientWidth,
      H = mount.clientHeight;
    var renderer = new THREE.WebGLRenderer({
      antialias: !LITE,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.25 : 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x04060d, 55, 150);
    try {
      var pmrem = new THREE.PMREMGenerator(renderer);
      var envScene = new THREE.RoomEnvironment();
      scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    } catch (e) {
      console.warn("env failed", e);
    }
    var camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 400);
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);
    var key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-30, 50, 25);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9ab4ff, 0.5);
    fill.position.set(30, 20, -20);
    scene.add(fill);
    var rim = new THREE.PointLight(0x00f0c8, 60, 120, 2);
    rim.position.set(0, 14, -10);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    var TW = LITE ? 2048 : 4096,
      TH = Math.round(TW * BOARD_D / BOARD_W);
    var colorTex = drawColor(TW, TH);
    var specTex = drawSpec(TW, TH);
    var bumpTex = drawBump(TW, TH);
    var boardMat = new THREE.MeshStandardMaterial({
      map: colorTex,
      metalnessMap: specTex,
      roughnessMap: specTex,
      bumpMap: bumpTex,
      bumpScale: 0.4,
      metalness: 1.0,
      roughness: 1.0,
      envMapIntensity: 1.0
    });
    var edgeMat = mat(0x151009, 0.0, 0.85);
    var board = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_T, BOARD_D), [edgeMat, edgeMat, boardMat, edgeMat, edgeMat, edgeMat]);
    scene.add(board);
    scatterParts(scene);
    var curvePts = TRACE_PTS.map(function (p) {
      return new THREE.Vector3(p[0], TOP + 0.05, p[1]);
    });
    var curve = new THREE.CatmullRomCurve3(curvePts, false, "catmullrom", 0.5);

    /* shared void + emergence (see v2 notes) */
    var STAR_N = 380;
    var starGeo2 = new THREE.BufferGeometry();
    var starPos2 = new Float32Array(STAR_N * 3);
    for (var i = 0; i < STAR_N; i++) {
      var r = 80 + Math.random() * 260;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      starPos2[i * 3 + 0] = Math.sin(ph) * Math.cos(th) * r;
      starPos2[i * 3 + 1] = Math.abs(Math.cos(ph) * r) * 0.5 + 8;
      starPos2[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    }
    starGeo2.setAttribute("position", new THREE.BufferAttribute(starPos2, 3));
    var starField2 = new THREE.Points(starGeo2, new THREE.PointsMaterial({
      color: 0x00f0c8,
      size: 0.9,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    }));
    scene.add(starField2);
    var ASM_N = 620;
    var asmGeo2 = new THREE.BufferGeometry();
    var asmPos2 = new Float32Array(ASM_N * 3);
    var asmTar2 = new Float32Array(ASM_N * 3);
    var asmSca2 = new Float32Array(ASM_N * 3);
    var _tp = new THREE.Vector3();
    for (var _i1 = 0; _i1 < ASM_N; _i1++) {
      if (Math.random() < 0.7) {
        curve.getPointAt(Math.random(), _tp);
        asmTar2[_i1 * 3 + 0] = _tp.x + (Math.random() - 0.5) * 5;
        asmTar2[_i1 * 3 + 1] = TOP + 0.4 + Math.random() * 2.2;
        asmTar2[_i1 * 3 + 2] = _tp.z + (Math.random() - 0.5) * 5;
      } else {
        var st = STOPS[Math.random() * STOPS.length | 0];
        var _TRACE_PTS$st$p5 = _slicedToArray(TRACE_PTS[st.p], 2),
          px = _TRACE_PTS$st$p5[0],
          pz = _TRACE_PTS$st$p5[1];
        var a = Math.random() * Math.PI * 2,
          rr2 = Math.random() * 7;
        asmTar2[_i1 * 3 + 0] = px + Math.cos(a) * rr2;
        asmTar2[_i1 * 3 + 1] = TOP + 0.5 + Math.random() * 2.5;
        asmTar2[_i1 * 3 + 2] = pz + Math.sin(a) * rr2;
      }
      asmSca2[_i1 * 3 + 0] = asmTar2[_i1 * 3 + 0] + (Math.random() - 0.5) * 180;
      asmSca2[_i1 * 3 + 1] = asmTar2[_i1 * 3 + 1] + 40 + Math.random() * 120;
      asmSca2[_i1 * 3 + 2] = asmTar2[_i1 * 3 + 2] + 30 + Math.random() * 160;
      asmPos2[_i1 * 3 + 0] = asmSca2[_i1 * 3 + 0];
      asmPos2[_i1 * 3 + 1] = asmSca2[_i1 * 3 + 1];
      asmPos2[_i1 * 3 + 2] = asmSca2[_i1 * 3 + 2];
    }
    asmGeo2.setAttribute("position", new THREE.BufferAttribute(asmPos2, 3));
    var assembly2 = new THREE.Points(asmGeo2, new THREE.PointsMaterial({
      color: 0x00f0c8,
      size: 1.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }));
    scene.add(assembly2);

    // components at stops
    var stopObjs = [];
    var deviceGroup = null;
    STOPS.forEach(function (st) {
      var _TRACE_PTS$st$p6 = _slicedToArray(TRACE_PTS[st.p], 2),
        px = _TRACE_PTS$st$p6[0],
        pz = _TRACE_PTS$st$p6[1];
      var grp = buildComponent(st.kind);
      grp.scale.setScalar(0.85);
      grp.position.set(px, 0, pz);
      scene.add(grp);
      stopObjs.push({
        st: st,
        grp: grp,
        pos: new THREE.Vector3(px, TOP + 2, pz)
      });
      if (st.explode) {
        deviceGroup = new THREE.Group();
        deviceGroup.position.set(px, TOP + 4.6, pz);
        deviceGroup.visible = false;
        scene.add(deviceGroup);
        buildWaferReal(deviceGroup);
      }
    });
    var formMats = [];
    scene.traverse(function (o) {
      if (o.isMesh && o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          if (!formMats.includes(m)) formMats.push(m);
        });
      }
    });
    var formMatsTransparent = false;
    var composer = null,
      bokeh = null;
    try {
      if (!LITE && THREE.EffectComposer && THREE.BokehPass && THREE.RenderPass) {
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bokeh = new THREE.BokehPass(scene, camera, {
          focus: 30,
          aperture: 0.0009,
          maxblur: 0.006
        });
        composer.addPass(bokeh);
        if (THREE.OutputPass) composer.addPass(new THREE.OutputPass());
      }
    } catch (e) {
      console.warn("composer failed", e);
      composer = null;
    }

    /* ---- controller ---- */
    var tmpPos = new THREE.Vector3(),
      tmpLook = new THREE.Vector3(),
      tmpTan = new THREE.Vector3(),
      tmpSide = new THREE.Vector3(),
      UP = new THREE.Vector3(0, 1, 0);
    var camPos = new THREE.Vector3().copy(camera.position);
    var camLook = new THREE.Vector3(0, 0, 0);
    var curLook = new THREE.Vector3(0, 0, 0);
    function stopTForIndex(i) {
      return STOPS[i].p / (TRACE_PTS.length - 1);
    }
    var HERO_POS = new THREE.Vector3(),
      HERO_LOOK = new THREE.Vector3();
    var NODE_POS = new THREE.Vector3(),
      NODE_LOOK = new THREE.Vector3();
    var tmpFinalPos = new THREE.Vector3(),
      tmpFinalLook = new THREE.Vector3();
    function update(t, mode, dt, footerMix, introMix, nodeMix) {
      t = Math.max(0, Math.min(1, t));
      footerMix = Math.max(0, Math.min(1, footerMix || 0));
      introMix = Math.max(0, Math.min(1, introMix || 0));
      nodeMix = Math.max(0, Math.min(1, nodeMix || 0));
      var ease = 1 - Math.pow(0.0015, dt / 1000);
      var nowMs = performance.now();
      var active = 0,
        best = 1e9;
      STOPS.forEach(function (s, i) {
        var d = Math.abs(t - stopTForIndex(i));
        if (d < best) {
          best = d;
          active = i;
        }
      });
      if (mode === "bench") {
        curve.getPointAt(t, tmpLook);
        tmpPos.set(tmpLook.x + 6, 26, tmpLook.z + 26);
        camLook.copy(tmpLook);
      } else {
        curve.getPointAt(t, tmpPos);
        curve.getTangentAt(t, tmpTan);
        tmpSide.copy(tmpTan).cross(UP).normalize();
        tmpPos.addScaledVector(tmpTan, -8).addScaledVector(tmpSide, 7);
        tmpPos.y += 12;
        curve.getPointAt(Math.min(1, t + 0.05), tmpLook);
        tmpLook.y += 0.2;
        camLook.copy(tmpLook);
      }
      camPos.lerp(tmpPos, ease);
      curLook.lerp(camLook, ease);
      tmpFinalPos.copy(camPos);
      tmpFinalLook.copy(curLook);
      if (footerMix > 0) {
        var fe = footerMix < 0.5 ? 2 * footerMix * footerMix : 1 - Math.pow(-2 * footerMix + 2, 2) / 2;
        HERO_POS.set(-6 + Math.sin(nowMs * 0.00018) * 2, 50, 96);
        HERO_LOOK.set(0, -2, 2);
        tmpFinalPos.lerp(HERO_POS, fe);
        tmpFinalLook.lerp(HERO_LOOK, fe);
      }
      if (introMix > 0) {
        var ie = introMix < 0.5 ? 2 * introMix * introMix : 1 - Math.pow(-2 * introMix + 2, 2) / 2;
        tmpFinalPos.x -= 9 * ie;
        tmpFinalPos.y += 30 * ie;
        tmpFinalPos.z += 24 * ie;
      }
      camera.position.copy(tmpFinalPos);
      camera.lookAt(tmpFinalLook);
      if (nodeMix > 0) {
        var ne = nodeMix < 0.5 ? 2 * nodeMix * nodeMix : 1 - Math.pow(-2 * nodeMix + 2, 2) / 2;
        var bob = Math.sin(nowMs * 0.0004) * 3;
        NODE_POS.set(38, 104 + bob, 150);
        NODE_LOOK.set(0, -4, 0);
        camera.position.lerpVectors(tmpFinalPos, NODE_POS, ne);
        tmpFinalLook.lerpVectors(curLook, NODE_LOOK, ne);
        camera.lookAt(tmpFinalLook);
      }
      starField2.material.opacity = 0.5 * (1 - nodeMix);
      scene.fog.far = 150 + 260 * nodeMix;
      if (deviceGroup) {
        var dt2 = Math.abs(t - stopTForIndex(STOPS.findIndex(function (s) {
          return s.explode;
        })));
        var ex = Math.max(0, 1 - dt2 * 9);
        deviceGroup.visible = ex > 0.02 && waferParts.length > 0;
        if (deviceGroup.visible) {
          var exs = ex < 0.5 ? 2 * ex * ex : 1 - Math.pow(-2 * ex + 2, 2) / 2;
          var _iterator27 = _createForOfIteratorHelper(waferParts),
            _step27;
          try {
            for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
              var w = _step27.value;
              w.position.copy(w.userData.vec).multiplyScalar(exs * 0.15);
            }
          } catch (err) {
            _iterator27.e(err);
          } finally {
            _iterator27.f();
          }
          var op = Math.min(1, ex * 2.5);
          var _iterator28 = _createForOfIteratorHelper(waferMats),
            _step28;
          try {
            for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
              var m = _step28.value;
              m.opacity = op;
            }
          } catch (err) {
            _iterator28.e(err);
          } finally {
            _iterator28.f();
          }
          deviceGroup.rotation.y += dt * 0.0004;
        }
      }
      starField2.rotation.y += dt * 0.00002;
      var conv = 1 - introMix;
      if (introMix > 0.001) {
        var ce = conv < 0.5 ? 2 * conv * conv : 1 - Math.pow(-2 * conv + 2, 2) / 2;
        var ap = assembly2.geometry.attributes.position.array;
        for (var _i10 = 0; _i10 < ASM_N * 3; _i10++) ap[_i10] = asmSca2[_i10] + (asmTar2[_i10] - asmSca2[_i10]) * ce;
        assembly2.geometry.attributes.position.needsUpdate = true;
        assembly2.material.opacity = Math.sin(Math.min(1, conv) * Math.PI) * 0.85;
        assembly2.material.size = 1.4 - conv * 0.5;
        var fo = Math.min(1, conv / 0.55);
        var foe = fo < 0.5 ? 2 * fo * fo : 1 - Math.pow(-2 * fo + 2, 2) / 2;
        if (!formMatsTransparent) {
          formMats.forEach(function (m) {
            m.transparent = true;
          });
          formMatsTransparent = true;
        }
        formMats.forEach(function (m) {
          m.opacity = foe;
        });
        starField2.material.opacity = 0.18 + conv * 0.32;
      } else if (formMatsTransparent) {
        formMats.forEach(function (m) {
          m.opacity = 1;
          m.transparent = false;
        });
        assembly2.material.opacity = 0;
        starField2.material.opacity = 0.5;
        formMatsTransparent = false;
      }
      if (bokeh) {
        var focusDist = camera.position.distanceTo(curLook);
        bokeh.uniforms.focus.value += (focusDist - bokeh.uniforms.focus.value) * 0.1;
      }
      rim.position.copy(curLook);
      rim.position.y += 8;
      return active;
    }
    function render() {
      if (composer) composer.render();else renderer.render(scene, camera);
    }
    function setSize(w, h) {
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
    }
    function dispose() {
      renderer.dispose();
      colorTex.dispose();
      specTex.dispose();
      bumpTex.dispose();
      starGeo2.dispose();
      starField2.material.dispose();
      asmGeo2.dispose();
      assembly2.material.dispose();
      try {
        mount.removeChild(renderer.domElement);
      } catch (_) {}
    }
    return {
      update: update,
      render: render,
      setSize: setSize,
      dispose: dispose,
      stops: STOPS,
      domElement: renderer.domElement
    };
  }
  window.MOBoard = {
    build: build,
    STOPS: STOPS
  };
})();

/* ---- landing_final/board-flight.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — Landing · inline Board flight (the "About")
   ------------------------------------------------------------
   The PCB board flight, folded into the landing as a scroll
   section in a FIXED full-viewport layer (no sliding panel edge).

   TAKEOVER timing (the chosen concept), split in two:
     · the board's APPEAR/punch is SCROLL-DRIVEN and fast — you
       drive the takeover by scrolling.
     · the previous UI (the universe) DISAPPEARS on a quick TIMED
       fade the instant the board engages — not scroll-driven, so
       it clears decisively instead of lingering through the board.

   FOOTER beat: after the last stop the camera pulls back to a hero
   framing of the whole board (scene.update's 4th arg `footerMix`)
   and the contact/footer resolves IN the scene and persists — so
   there's no separate footer section and no second seam.

   Other modes ("crossfade","wipe") remain for the comparison files.
   Perf: board builds lazily on approach; LITE render; universe
   pauses once hidden. Camera = PROBE.
   ============================================================ */
var _React = React,
  useBF = _React.useState,
  useBFE = _React.useEffect,
  useBFR = _React.useRef;
var _bfEaseInOut = function _bfEaseInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
var _bfEaseOut = function _bfEaseOut(t) {
  return 1 - Math.pow(1 - t, 3);
};
var _bfClamp = function _bfClamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
};
function BoardFlight(_ref) {
  var _STOPS$active;
  var onEnter = _ref.onEnter,
    onContact = _ref.onContact;
  var secRef = useBFR(null);
  var layerRef = useBFR(null);
  var mountRef = useBFR(null);
  var artRef = useBFR(null);
  var ctrlRef = useBFR(null);
  var tRef = useBFR(0);
  var footRef = useBFR(0);
  var presRef = useBFR(0);
  var nodeRef = useBFR(1); // 1 = whole-board "model" framing in the card → 0 = flight pose
  var uniRef = useBFR(null);
  var enteredRef = useBFR(false);
  var contactRef = useBFR(false);
  var onEnterRef = useBFR(onEnter);
  var onContactRef = useBFR(onContact);
  useBFE(function () {
    onEnterRef.current = onEnter;
    onContactRef.current = onContact;
  });

  // takeover is SCROLL-DRIVEN (deterministic function of scroll position) so it
  // always replays when you scroll back up and down. introRef (1→0) is passed to
  // the scene to drive the establishing camera swoop in lock-step.
  var introRef = useBFR(1);
  var MODE = typeof window !== "undefined" && window.__mo_bf_transition || "takeover";
  var STOPS = window.MOBoard && window.MOBoard.STOPS || [];
  var N = STOPS.length;
  var LEAD_V = 2.4; // viewports of the About-node → board MORPH lead-in
  var FLIGHT_V = N + 1; // viewports of flight
  var FOOT_V = 1.4; // viewports of footer beat
  var TOTAL_V = LEAD_V + FLIGHT_V + FOOT_V;
  var LEAD_PORTION = LEAD_V / TOTAL_V;
  var FLIGHT_PORTION = FLIGHT_V / TOTAL_V;
  var FOOT_PORTION = FOOT_V / TOTAL_V;
  var _useBF = useBF(0),
    _useBF2 = _slicedToArray(_useBF, 2),
    active = _useBF2[0],
    setActive = _useBF2[1];
  var _useBF3 = useBF(0),
    _useBF4 = _slicedToArray(_useBF3, 2),
    prog = _useBF4[0],
    setProg = _useBF4[1];
  var _useBF5 = useBF(0),
    _useBF6 = _slicedToArray(_useBF5, 2),
    foot = _useBF6[0],
    setFoot = _useBF6[1];
  // lead-in UI state: c = card chrome presence, o = window-open progress
  var _useBF7 = useBF({
      c: 0,
      o: 0,
      e: 0
    }),
    _useBF8 = _slicedToArray(_useBF7, 2),
    leadUi = _useBF8[0],
    setLeadUi = _useBF8[1];

  /* ── build the board scene lazily, only when you scroll near it ── */
  useBFE(function () {
    var mount = mountRef.current;
    if (!mount) return;
    var bootRaf = 0,
      renderRaf = 0,
      cursorFx = null,
      last = performance.now();
    var disposed = false,
      started = false,
      near = false,
      bootObserver = null;
    var fallbackListening = false;
    uniRef.current = document.querySelector(".universeBg");
    if (uniRef.current) uniRef.current.style.transition = "none";
    var boot = function boot() {
      if (disposed) return;
      var ctrl = window.MOBoard.build(mount, {
        lite: true
      });
      if (!ctrl) return;
      ctrlRef.current = ctrl;
      var sharedCursor = window.MOCursorDistortion;
      if (sharedCursor && typeof sharedCursor.mountStandalone === "function") {
        cursorFx = sharedCursor.mountStandalone({
          THREE: window.THREE,
          selector: "[data-mo-board-cursor-mirror]",
          zIndex: 20,
          dprCap: 1,
          disabledClasses: ["landing-exit", "mo-explore", "nx-page"],
          disabledWhen: function disabledWhen() {
            return presRef.current <= 0.004;
          },
          chainPrevious: true
        });
      }
      var _loop = function loop(now) {
        if (disposed) return;
        var dt = Math.min(50, now - last);
        last = now;
        if (presRef.current > 0.004) {
          var a = ctrl.update(tRef.current, "probe", dt, footRef.current, introRef.current, nodeRef.current);
          ctrl.render();
          if (a !== undefined) setActive(function (prev) {
            return prev === a ? prev : a;
          });
        }
        renderRaf = requestAnimationFrame(_loop);
      };
      renderRaf = requestAnimationFrame(_loop);
    };
    var removeFallbackListeners = function removeFallbackListeners() {
      if (!fallbackListening) return;
      fallbackListening = false;
      window.removeEventListener("scroll", fallbackProbe);
      window.removeEventListener("resize", fallbackProbe);
    };
    var stopBootWatch = function stopBootWatch() {
      if (bootRaf) cancelAnimationFrame(bootRaf);
      bootRaf = 0;
      if (bootObserver) bootObserver.disconnect();
      bootObserver = null;
      removeFallbackListeners();
    };
    var _tryBoot = function tryBoot() {
      bootRaf = 0;
      if (disposed || started || !near) return;
      if (window.THREE && window.MOBoard) {
        started = true;
        stopBootWatch();
        boot();
        return;
      }
      bootRaf = requestAnimationFrame(_tryBoot);
    };
    var setNear = function setNear(next) {
      near = !!next;
      if (near) {
        if (!bootRaf && !started) bootRaf = requestAnimationFrame(_tryBoot);
      } else if (bootRaf) {
        cancelAnimationFrame(bootRaf);
        bootRaf = 0;
      }
    };
    function fallbackProbe() {
      if (disposed || started) return;
      var el = secRef.current;
      if (!el) {
        setNear(false);
        return;
      }
      var rect = el.getBoundingClientRect();
      setNear(rect.bottom > 0 && rect.top < window.innerHeight);
    }
    var section = secRef.current;
    if (section && window.IntersectionObserver) {
      bootObserver = new window.IntersectionObserver(function (entries) {
        var entry = entries.find(function (candidate) {
          return candidate.target === section;
        });
        if (entry) setNear(entry.isIntersecting);
      }, {
        root: null,
        threshold: 0
      });
      bootObserver.observe(section);
    } else if (section) {
      fallbackListening = true;
      window.addEventListener("scroll", fallbackProbe, {
        passive: true
      });
      window.addEventListener("resize", fallbackProbe, {
        passive: true
      });
      fallbackProbe();
    }
    var onResize = function onResize() {
      var c = ctrlRef.current;
      if (c) c.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);
    return function () {
      disposed = true;
      stopBootWatch();
      if (renderRaf) cancelAnimationFrame(renderRaf);
      window.removeEventListener("resize", onResize);
      window.__mo_universe_pause = false;
      window.__mo_morph = null;
      if (cursorFx) cursorFx.destroy();
      if (uniRef.current) {
        uniRef.current.style.opacity = "";
        uniRef.current.style.transition = "";
        uniRef.current.style.transform = "";
      }
      var c = ctrlRef.current;
      if (c) c.dispose();
    };
  }, []);

  /* ── scroll → flight t + footer beat + transition styling ── */
  useBFE(function () {
    var el = secRef.current;
    if (!el) return;
    var raf;
    var ENTRY_VH = MODE === "takeover" ? 0.36 : MODE === "wipe" ? 0.58 : 0.7;
    var update = function update() {
      var vh = window.innerHeight;
      var rect = el.getBoundingClientRect();
      var total = el.offsetHeight - vh;
      var top = -rect.top;
      var raw = total > 0 ? _bfClamp(top / total, 0, 1) : 0;

      // ── lead-in (About node-card → board grows OUT of the card) ──
      // The real board is windowed into the card's art rect (small, pulled-back
      // establishing shot), then the card frame OPENS: the clip-path expands
      // from the card rectangle to the full viewport while the chrome fades and
      // the board camera dollies into the flight start. The PCB literally morphs
      // out of the card — one object, no separate stand-in, no context seam.
      var lead = _bfClamp(raw / LEAD_PORTION, 0, 1);
      var cardP = _bfClamp(lead / 0.26, 0, 1); // card resolves in the lens
      var openP = _bfClamp((lead - 0.28) / 0.60, 0, 1); // card window opens → full board
      window.__mo_morph = null; // particle-trace morph retired

      // flight parameter — runs over FLIGHT_PORTION, AFTER the lead-in
      var padStart = 0.5 / FLIGHT_V;
      var fr = _bfClamp((raw - LEAD_PORTION) / FLIGHT_PORTION, 0, 1);
      var t = _bfClamp((fr - padStart) / (1 - padStart), 0, 1);
      tRef.current = t;

      // footer beat — last portion of the section
      var footerMix = _bfClamp((raw - LEAD_PORTION - FLIGHT_PORTION) / (FOOT_PORTION * 0.82), 0, 1);
      footRef.current = footerMix;

      // contact (footer) active → drives nav highlight. Published to a window
      // bridge so LandingApp's central section resolver can read it (and still
      // calls onContact if a parent passed one, for back-compat).
      var contactOn = footerMix > 0.5;
      window.__mo_bf = window.__mo_bf || {};
      window.__mo_bf.footer = contactOn;
      // v13 — flight bridge: the unified HUD reads the board leg state here.
      window.__mo_bf.lead = lead;
      window.__mo_bf.openP = openP;
      window.__mo_bf.t = t;
      window.__mo_bf.foot = footerMix;
      if (contactOn !== contactRef.current) {
        contactRef.current = contactOn;
        onContactRef.current && onContactRef.current(contactOn);
      }
      var layer = layerRef.current;
      var uni = uniRef.current;
      if (MODE === "takeover") {
        // ── The PCB morphs OUT of the card. The board canvas is windowed into
        //    the card's art rectangle (clip-path), small + pulled back; as the
        //    card OPENS (openP) the clip expands to the full viewport, the board
        //    camera dollies into the flight, and the card chrome fades. ──
        var oe = _bfEaseInOut(openP);
        // At rest (window closed) the REAL board sits fully formed and framed as
        // a clean whole-board 3/4 "model" (nodeMix=1) inside the card's window.
        // As the window OPENS, the camera dollies out of that node framing into
        // the flight start (nodeMix 1→0) while the clip expands to fullscreen —
        // one board, one canvas, a true grow-out morph (no crossfade, no separate
        // mini-PCB). introMix stays 0 so the board is solid the whole time.
        introRef.current = 0;
        nodeRef.current = 1 - oe;
        presRef.current = cardP; // render the board as soon as the card is up

        // The board renders fullscreen + TRANSPARENT (LITE path = no opaque
        // composer), so it floats over the node-card as a real 3D model. No
        // rectangular clip / window — it simply DOLLIES CLOSER (nodeMix) and
        // grows to fill the screen = the About scene. The solid void backdrop +
        // grain must stay OFF while it's the small floating model (so the card +
        // universe show behind it), then fade in only as it takes over.
        if (layer) {
          layer.style.opacity = _bfClamp(cardP * 1.4, 0, 1).toFixed(3);
          layer.style.clipPath = "none";
          layer.style.transform = "none";
          layer.style.pointerEvents = openP > 0.6 ? "auto" : "none";
          // void backdrop: 0 until the board is ~60% closed-in, then ramps to 1
          var voidMix = _bfClamp((openP - 0.55) / 0.35, 0, 1);
          layer.style.setProperty("--bf-void", voidMix.toFixed(3));
          var grain = layer.querySelector(".bf-grain");
          if (grain) grain.style.opacity = voidMix.toFixed(3);
        }
        // universe stays lit behind the floating card, fades as the board opens
        if (uni) {
          var uniFade = _bfEaseInOut(openP);
          uni.style.opacity = (1 - uniFade).toFixed(3);
          uni.style.transform = "scale(".concat((1 + 0.05 * oe).toFixed(4), ")");
        }
        // keep the universe ALIVE while the card floats; pause once board is full
        window.__mo_universe_pause = openP > 0.985;
        var engaged = openP > 0.5;
        if (engaged !== enteredRef.current) {
          enteredRef.current = engaged;
          if (engaged) onEnterRef.current && onEnterRef.current();
        }
        // card chrome: resolves in (cardP), then fades as the window opens
        var cVis = cardP * (1 - _bfClamp(openP / 0.55, 0, 1));
        setLeadUi(function (prev) {
          var c = +cVis.toFixed(2),
            o = +openP.toFixed(2),
            e = +cardP.toFixed(2);
          return prev.c === c && prev.o === o && prev.e === e ? prev : {
            c: c,
            o: o,
            e: e
          };
        });
      } else {
        // ── scroll-driven crossfade / wipe (comparison files) ──
        var entry = rect.top > 0 ? _bfClamp((vh - rect.top) / (ENTRY_VH * vh), 0, 1) : 1;
        var exit = rect.bottom < vh ? _bfClamp(rect.bottom / (0.6 * vh), 0, 1) : 1;
        var presence = Math.min(entry, exit);
        presRef.current = presence;
        if (presence > 0.45 && !enteredRef.current) {
          enteredRef.current = true;
          onEnterRef.current && onEnterRef.current();
        } else if (presence < 0.1 && enteredRef.current) {
          enteredRef.current = false;
        }
        if (layer) {
          if (MODE === "wipe") {
            var r = (_bfEaseInOut(entry) * 152).toFixed(1);
            layer.style.opacity = exit.toFixed(3);
            layer.style.clipPath = "circle(".concat(r, "% at 50% 45%)");
            layer.style.transform = "";
            if (uni) {
              uni.style.opacity = (1 - entry).toFixed(3);
              uni.style.transform = "";
            }
            window.__mo_universe_pause = entry > 0.92;
          } else {
            // crossfade
            layer.style.opacity = presence.toFixed(3);
            layer.style.transform = "";
            layer.style.clipPath = "";
            if (uni) {
              uni.style.opacity = (1 - presence).toFixed(3);
              uni.style.transform = "";
            }
            window.__mo_universe_pause = presence > 0.92;
          }
          layer.style.pointerEvents = presence > 0.5 ? "auto" : "none";
        }
      }
      setProg(t);
      setFoot(footerMix);
    };
    var onScroll = function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", onScroll);
    return function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [MODE, FLIGHT_PORTION, FLIGHT_V]);

  /* ── jump to a stop ── */
  var jump = function jump(i) {
    var el = secRef.current;
    if (!el) return;
    var vh = window.innerHeight;
    var total = el.offsetHeight - vh;
    var padStart = 0.5 / FLIGHT_V;
    var tt = STOPS[i].p / 10;
    var fr = padStart + tt * (1 - padStart);
    var raw = LEAD_PORTION + fr * FLIGHT_PORTION;
    window.scrollTo({
      top: el.offsetTop + raw * total,
      behavior: "smooth"
    });
  };
  var refShort = ((_STOPS$active = STOPS[active]) === null || _STOPS$active === void 0 ? void 0 : _STOPS$active.ref.split(" · ")[0]) || "—";
  var footE = _bfEaseOut(foot);
  // Board chrome (mark / HUD / rail / progress / chapters) must NOT show while
  // the board is still windowed inside the card — gate it on the window opening.
  var openGate = _bfClamp(((leadUi.o || 0) - 0.55) / 0.4, 0, 1);
  var chromeFade = ((1 - _bfClamp(foot * 1.4, 0, 1)) * openGate).toFixed(3);
  return /*#__PURE__*/React.createElement("section", {
    ref: secRef,
    className: "bf",
    id: "about",
    "data-screen-label": "04 About \u2014 trace the net",
    style: {
      height: "calc(".concat(TOTAL_V, " * 100vh)")
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aboutNode-layer",
    style: {
      opacity: leadUi.c.toFixed(3)
    },
    "aria-hidden": leadUi.c < 0.02
  }, /*#__PURE__*/React.createElement("div", {
    className: "uNode",
    "data-screen-label": "04 About \u2014 node 0x00",
    style: {
      // v13 — DOCK: the node card resolves out of the transit (rises +
      // sharpens) instead of a flat fade — the arrival at station 0x00.
      transform: "scale(".concat((1 + (leadUi.o || 0) * 0.06).toFixed(3), ") translateY(").concat(((1 - (leadUi.e || 0)) * 26).toFixed(1), "px)"),
      filter: (leadUi.e || 0) < 0.996 ? "blur(".concat(((1 - (leadUi.e || 0)) * 9).toFixed(2), "px)") : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "uNode__cnr uNode__cnr--tl",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "uNode__cnr uNode__cnr--tr",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "uNode__cnr uNode__cnr--bl",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "uNode__cnr uNode__cnr--br",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "uNode__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "uNode__headL"
  }, /*#__PURE__*/React.createElement("span", {
    className: "uNode__id",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "uNode__sq"
  }), "NODE 0x00"), /*#__PURE__*/React.createElement("span", {
    className: "uNode__year",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, "ABOUT")), /*#__PURE__*/React.createElement("div", {
    className: "uNode__headR",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, /*#__PURE__*/React.createElement("span", null, "MASLOV / OLEKSANDR"), /*#__PURE__*/React.createElement("span", null, "48.137\xB0 N \xB7 11.575\xB0 E"))), /*#__PURE__*/React.createElement("div", {
    className: "uNode__field",
    ref: artRef,
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "uNode__foot"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "uNode__name",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, "Source node", /*#__PURE__*/React.createElement("em", null, ".")), /*#__PURE__*/React.createElement("div", {
    className: "uNode__sub",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, "0x00 has no fixed coordinate. This board is one readable projection of how the source node was formed."), /*#__PURE__*/React.createElement("div", {
    className: "uNode__cue",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "uNode__cueLine"
  }), "KEEP SCROLLING \u2014 INSPECT THE SOURCE \u2193")))), /*#__PURE__*/React.createElement("div", {
    className: "bf-layer bf-layer--" + MODE,
    ref: layerRef,
    style: {
      opacity: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bf-mount",
    ref: mountRef
  }), /*#__PURE__*/React.createElement("div", {
    className: "bf-grain",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bf-mark",
    style: {
      opacity: chromeFade
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-mark__dot"
  }), /*#__PURE__*/React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-mark,.bf-layer,.lp"
  }, "0x00 \xB7 INTERNAL ARCHITECTURE")), /*#__PURE__*/React.createElement("div", {
    className: "bf-stage",
    "aria-hidden": "false"
  }, STOPS.map(function (st, i) {
    var center = st.p / 10;
    var d = Math.abs(prog - center) * N;
    var vis = Math.max(0, 1 - d * 1.6);
    var isOn = d < 0.45 && foot < 0.4;
    return /*#__PURE__*/React.createElement("article", {
      key: i,
      className: "bf-ch " + (isOn ? "is-on" : ""),
      style: {
        opacity: (vis * (1 - _bfClamp(foot * 1.6, 0, 1)) * openGate).toFixed(3),
        transform: "translateY(".concat(((prog - center) * N * 24).toFixed(1), "px)"),
        pointerEvents: isOn ? "auto" : "none"
      },
      "data-screen-label": st.chapter.n + " " + st.chapter.kicker
    }, /*#__PURE__*/React.createElement("div", {
      className: "bf-ch__num",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.chapter.n), /*#__PURE__*/React.createElement("div", {
      className: "bf-ch__card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bf-ch__kicker",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.live ? /*#__PURE__*/React.createElement("span", {
      className: "bf-ch__live"
    }) : /*#__PURE__*/React.createElement("span", {
      className: "bf-ch__dot"
    }), st.chapter.kicker), /*#__PURE__*/React.createElement("h2", {
      className: "bf-ch__title",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.chapter.title[0], /*#__PURE__*/React.createElement("em", null, st.chapter.title[1]), st.chapter.title[2]), /*#__PURE__*/React.createElement("p", {
      className: "bf-ch__body",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.chapter.body), /*#__PURE__*/React.createElement("div", {
      className: "bf-ch__ref"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bf-ch__refK",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, "COMPONENT"), /*#__PURE__*/React.createElement("span", {
      className: "bf-ch__refV",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.ref))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "bf-hud",
    style: {
      opacity: chromeFade
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bf-hudRow",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-hud,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", null, "REF"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, refShort)), /*#__PURE__*/React.createElement("div", {
    className: "bf-hudRow",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-hud,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", null, "STOP"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, (active + 1).toString().padStart(2, "0"), " / ", N.toString().padStart(2, "0"))), /*#__PURE__*/React.createElement("div", {
    className: "bf-hudRow",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-hud,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", null, "CAM"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, foot > 0.5 ? "HERO" : "PROBE"))), /*#__PURE__*/React.createElement("div", {
    className: "bf-rail",
    style: {
      opacity: chromeFade,
      pointerEvents: foot > 0.4 ? "none" : "auto"
    }
  }, STOPS.map(function (st, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "bf-rail__stop " + (active === i ? "is-active" : ""),
      onClick: function onClick() {
        return jump(i);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "bf-rail__dot"
    }), /*#__PURE__*/React.createElement("span", {
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-rail,.bf-layer,.lp"
    }, st.chapter.n, " \xB7 ", st.ref.split(" · ")[0]));
  })), /*#__PURE__*/React.createElement("div", {
    className: "bf-prog",
    style: {
      opacity: chromeFade
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bf-prog__fill",
    style: {
      width: (prog * 100).toFixed(2) + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bf-cue",
    style: {
      opacity: openGate > 0.99 && prog < 0.05 && foot < 0.02 ? 1 : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-cue__line"
  }), /*#__PURE__*/React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-cue,.bf-layer,.lp"
  }, "KEEP SCROLLING \u2014 FOLLOW THE TRACE \u2193")), /*#__PURE__*/React.createElement("div", {
    className: "bf-foot",
    style: {
      opacity: footE.toFixed(3),
      pointerEvents: foot > 0.35 ? "auto" : "none"
    },
    "aria-hidden": foot < 0.1,
    "data-screen-label": "05 Contact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bf-foot__scrim",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bf-foot__inner",
    style: {
      transform: "translateY(".concat(((1 - footE) * 40).toFixed(1), "px)")
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bf-foot__kicker",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__live"
  }), "SW1 \xB7 OUTPUT \u2014 OPEN CHANNEL"), /*#__PURE__*/React.createElement("div", {
    className: "bf-foot__line",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "For products that cross hardware, software and interaction."), /*#__PURE__*/React.createElement("a", {
    className: "bf-foot__big t-link",
    href: "mailto:oleksandrmaslov08@gmail.com",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "oleksandrmaslov08", /*#__PURE__*/React.createElement("wbr", null), "@gmail.com"), /*#__PURE__*/React.createElement("div", {
    className: "bf-foot__links"
  }, /*#__PURE__*/React.createElement("a", {
    className: "bf-foot__link",
    href: "https://github.com/oleksandrmaslov",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "GITHUB"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "@oleksandrmaslov"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2197")), /*#__PURE__*/React.createElement("a", {
    className: "bf-foot__link",
    href: "https://t.me/maslov_oleksandr08",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "TELEGRAM"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "@maslov_oleksandr08"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2197")), /*#__PURE__*/React.createElement("a", {
    className: "bf-foot__link",
    href: "assets/Oleksandr-Maslov-CV.pdf",
    download: true,
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "CV \xB7 PDF"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "download \xB7 2 pages"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2193")), /*#__PURE__*/React.createElement("a", {
    className: "bf-foot__link",
    href: "Design System.html",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "SYSTEM"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "design foundation \xB7 v0.1"), /*#__PURE__*/React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2192"))), /*#__PURE__*/React.createElement("div", {
    className: "bf-foot__meta"
  }, /*#__PURE__*/React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "\xA9 2026 \xB7 MASLOV OLEKSANDR"), /*#__PURE__*/React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "BUILT IN MUNICH \xB7 v0.1.0"), /*#__PURE__*/React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "NO COOKIES \xB7 NO TRACKERS \xB7 STATIC HTML"))))), /*#__PURE__*/React.createElement("i", {
    id: "contact",
    className: "bf-anchor",
    "aria-hidden": "true"
  }));
}
window.BoardFlight = BoardFlight;

/* ---- landing_final5/title.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — FINAL 5 · TITLE SCREEN
   The only title screen now (the v1 one lived in landing.jsx and was
   overwritten at load time; FINAL 3 deleted it). Its unused in-view
   observer is gone too — app.jsx owns section tracking.
   Layout:
   · frame corners align with the content column (header 34px gutter)
   · KYIV → MUNICH + press-↵ caption moved BELOW the bottom corners,
     sharing one baseline; hairline under the M.O. removed
   · M.O. wordmark + control cluster keep their scroll-dissolve
   ============================================================ */
var _React = React,
  useT2 = _React.useState,
  useT2E = _React.useEffect,
  useT2R = _React.useRef;
function useCompactT2() {
  var bp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 700;
  var _useT = useT2(function () {
      return window.innerWidth <= bp;
    }),
    _useT2 = _slicedToArray(_useT, 2),
    c = _useT2[0],
    setC = _useT2[1];
  useT2E(function () {
    var on = function on() {
      return setC(window.innerWidth <= bp);
    };
    window.addEventListener("resize", on);
    return function () {
      return window.removeEventListener("resize", on);
    };
  }, [bp]);
  return c;
}
var IS_TOUCH_T2 = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
function FieldGuideT2(_ref) {
  var dismissed = _ref.dismissed,
    touch = _ref.touch;
  return /*#__PURE__*/React.createElement("div", {
    className: "fieldHint " + (dismissed ? "is-dismissed" : ""),
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fieldHint__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fieldHint__ring"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cross"
  }), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fieldHint__lede",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, "This field is live"), /*#__PURE__*/React.createElement("div", {
    className: "fieldHint__cues"
  }, touch ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("b", null, "Tap"), " explore"), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__sep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("b", null, "Pinch"), " to fly"), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__sep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("b", null, "Tap"), " a node")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("b", null, "Drag"), " to look"), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__sep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("b", null, "Scroll"), " to fly through"), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__sep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("b", null, "Click"), " a node")))));
}
function ExploreOverlayT2(_ref2) {
  var onClose = _ref2.onClose;
  var _useT3 = useT2(false),
    _useT4 = _slicedToArray(_useT3, 2),
    gyro = _useT4[0],
    setGyro = _useT4[1];
  useT2E(function () {
    document.body.classList.add("mo-explore");
    if (window.__mo_universe) window.__mo_universe.setExplore(true);
    var prevOv = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return function () {
      document.body.classList.remove("mo-explore");
      if (window.__mo_universe) {
        window.__mo_universe.setExplore(false);
        window.__mo_universe.setGyro(false);
      }
      document.documentElement.style.overflow = prevOv;
    };
  }, []);
  useT2E(function () {
    var onGranted = function onGranted() {
      return setGyro(true);
    };
    window.addEventListener("mo:gyroOn", onGranted);
    return function () {
      return window.removeEventListener("mo:gyroOn", onGranted);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "xpl",
    "data-screen-label": "01b Explore mode"
  }, /*#__PURE__*/React.createElement("div", {
    className: "xpl__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "xpl__tag"
  }, /*#__PURE__*/React.createElement("span", {
    className: "xpl__dot"
  }), "FIELD \xB7 LIVE"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "xpl__close",
    onClick: onClose
  }, "EXIT \u2715")), /*#__PURE__*/React.createElement("div", {
    className: "xpl__hint"
  }, gyro ? "move your phone — look · pinch — fly · tap a node" : "drag — look · pinch — fly · tap a node"));
}
function requestGyroInGestureT2() {
  try {
    var enable = function enable() {
      if (window.__mo_universe) window.__mo_universe.setGyro(true);
      try {
        window.dispatchEvent(new CustomEvent("mo:gyroOn"));
      } catch (_) {}
    };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(function (res) {
        if (res === "granted") enable();
      })["catch"](function () {});
    } else if (window.DeviceOrientationEvent) {
      enable();
    }
  } catch (_) {}
}
function TitleScreenV2() {
  var compact = useCompactT2(700);
  var showExplore = compact || IS_TOUCH_T2;
  var _useT5 = useT2(false),
    _useT6 = _slicedToArray(_useT5, 2),
    explore = _useT6[0],
    setExplore = _useT6[1];
  var _useT7 = useT2(function () {
      return sessionStorage.getItem("mo_field_touched") === "1";
    }),
    _useT8 = _slicedToArray(_useT7, 2),
    touched = _useT8[0],
    setTouched = _useT8[1];
  useT2E(function () {
    if (touched) return;
    var onInteract = function onInteract() {
      setTouched(true);
      sessionStorage.setItem("mo_field_touched", "1");
    };
    window.addEventListener("mo:universeInteract", onInteract);
    return function () {
      return window.removeEventListener("mo:universeInteract", onInteract);
    };
  }, [touched]);

  // Real readiness milestone for the origin-map handoff.
  useT2E(function () {
    try {
      window.dispatchEvent(new CustomEvent("mo:title-ready"));
    } catch (_) {}
  }, []);
  var proceed = function proceed() {
    var el = document.getElementById("intro");
    if (el) window.scrollTo({
      top: el.offsetTop + 2,
      behavior: "smooth"
    });
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-title lp-title--v1 lp-title--v2 " + (touched ? "is-touched" : ""),
    id: "title",
    "data-screen-label": "01 Title"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "title__sr"
  }, "Oleksandr Maslov \u2014 product systems, embedded systems and interaction"), /*#__PURE__*/React.createElement("div", {
    className: "title__stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title__shield title__shield--top"
  }), /*#__PURE__*/React.createElement("div", {
    className: "title__shield title__shield--bot"
  }), /*#__PURE__*/React.createElement("div", {
    className: "title__shield title__shield--left"
  }), /*#__PURE__*/React.createElement("div", {
    className: "title__shield title__shield--right"
  }), /*#__PURE__*/React.createElement("div", {
    className: "title__frame",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title__corner title__corner--tl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "title__corner title__corner--tr"
  }), /*#__PURE__*/React.createElement("span", {
    className: "title__corner title__corner--bl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "title__corner title__corner--br"
  })), /*#__PURE__*/React.createElement("div", {
    className: "title__idTop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title__idName",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__idTop,.title__stage,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title__idBullet"
  }, "\u25A0"), "MASLOV / OLEKSANDR"), /*#__PURE__*/React.createElement("span", {
    className: "title__idRole",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__idTop,.title__stage,.lp"
  }, "PRODUCT SYSTEMS \xB7 EMBEDDED \xB7 INTERACTION")), /*#__PURE__*/React.createElement(FieldGuideT2, {
    dismissed: touched,
    touch: showExplore
  }), explore && /*#__PURE__*/React.createElement(ExploreOverlayT2, {
    onClose: function onClose() {
      return setExplore(false);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "title__wordmark"
  }, /*#__PURE__*/React.createElement(AsciiHero, {
    text: "M.O.",
    cols: compact ? 64 : 108,
    rows: compact ? 16 : 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "title__ctl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title__proceedRow"
  }, showExplore && /*#__PURE__*/React.createElement(KeyButton, {
    legend: /*#__PURE__*/React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
    }, "\u271B"),
    onPress: function onPress() {
      requestGyroInGestureT2();
      setExplore(true);
    }
  }, /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
  }, "EXPLORE")), /*#__PURE__*/React.createElement("span", {
    className: "scrollcue scrollcue--stack"
  }, /*#__PURE__*/React.createElement("span", {
    className: "scrollcue__txt",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
  }, "Continue"), /*#__PURE__*/React.createElement("span", {
    className: "scrollcue__chev"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null))), /*#__PURE__*/React.createElement(KeyButton, {
    legend: /*#__PURE__*/React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
    }, "\u21B5"),
    primary: true,
    onPress: proceed
  }, /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
  }, "PROCEED")))), /*#__PURE__*/React.createElement("div", {
    className: "title__baseline",
    "aria-hidden": "false"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title__wordmarkSub"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title__wordmarkSubBullet",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "\u25A0"), /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "KYIV \u2192 MUNICH"), /*#__PURE__*/React.createElement("span", {
    className: "title__wordmarkSubSep",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "2026")), /*#__PURE__*/React.createElement("span", {
    className: "title__proceedCap",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__baseline,.title__stage,.lp"
  }, showExplore ? "tap · or swipe up to continue" : "press \u21B5 \xA0\xB7\xA0 or scroll at the edges"))), /*#__PURE__*/React.createElement(TitleKeyboardShortcutV2, {
    onProceed: proceed
  }));
}
function TitleKeyboardShortcutV2(_ref3) {
  var onProceed = _ref3.onProceed;
  useT2E(function () {
    var onKey = function onKey(e) {
      if (e.key !== "Enter") return;
      if (e.target && /input|textarea|button/i.test(e.target.tagName || "")) return;
      if (window.scrollY > 80) return;
      e.preventDefault();
      onProceed();
    };
    window.addEventListener("keydown", onKey);
    return function () {
      return window.removeEventListener("keydown", onKey);
    };
  }, [onProceed]);
  return null;
}
window.TitleScreen = TitleScreenV2;

/* ---- landing_final5/origin.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — Landing · 0x00 ORIGIN beat (universe-native)
   ------------------------------------------------------------
   No copper trace — that belongs to the Board. This beat speaks
   the landing's own language: NODES in infinite space.

   The section is a tall scroll track; its progress is published
   to `window.__mo_origin = { p, active, concept }` and READ by
   landing/universe.jsx inside its render loop, which drives one
   of two concepts behind this DOM type:

     01 ASSEMBLY — the particle field swarms to FORM "0x00"
     02 HUB      — node 0x00 as a hub, project nodes ringing it

   Over either, the identity statement resolves FROSTED → SHARP
   (same progressive-blur language as the header). This is the
   literal setup for the later "dive into node 0x00" → Board.
   ============================================================ */
var _React = React,
  useO = _React.useState,
  useOE = _React.useEffect,
  useOR = _React.useRef;

/* FINAL 2 retiming — the statement finishes resolving by p≈0.60, then HOLDS
   fully sharp for a third of the section (0.60 → 0.90) before the lift-off.
   Previously the last line completed at 0.86 and the exit began at 0.87 —
   the text started dying the moment it finished being born. */
var ORIGIN_LINES = [{
  t: "I build",
  at: 0.20
}, {
  t: "complete products,",
  at: 0.34,
  em: true
}, {
  t: "starting with",
  at: 0.34,
  ghost: true
}, {
  t: "a real problem—",
  at: 0.48
}, {
  t: "not a technology.",
  at: 0.60,
  em: true
}];
var _oEase = function _oEase(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
var _oClamp = function _oClamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
};

/* shared bridge object the universe render loop reads every frame */
window.__mo_origin = window.__mo_origin || {
  p: 0,
  active: false,
  concept: "assembly"
};
function OriginBeat() {
  var secRef = useOR(null);
  var _useO = useO(0),
    _useO2 = _slicedToArray(_useO, 2),
    p = _useO2[0],
    setP = _useO2[1];
  // Landing ships ONE concept: assembly. The HUB concept lives in its own
  // exploration file, which sets window.__mo_origin_lock = "hub" before boot.
  var concept = typeof window !== "undefined" && window.__mo_origin_lock || "assembly";

  /* publish concept to the bridge */
  useOE(function () {
    window.__mo_origin.concept = concept;
  }, [concept]);

  /* scroll → progress p, published to the bridge */
  useOE(function () {
    var el = secRef.current;
    if (!el) return;
    var raf;
    var update = function update() {
      var total = el.offsetHeight - window.innerHeight;
      var rect = el.getBoundingClientRect();
      var top = -rect.top;
      var np = total > 0 ? _oClamp(top / total, 0, 1) : 0;
      var active = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
      window.__mo_origin.p = np;
      window.__mo_origin.active = active;
      setP(np);
    };
    var onScroll = function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", onScroll);
    return function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  var handoff = _oClamp((p - 0.76) / 0.14, 0, 1);
  // FINAL 2 — the lift-off now begins at 0.90, exactly where the toWork
  // transit engages (flight.js: pO ≥ 0.9), so the statement holds sharp
  // through the whole dwell and leaves only when the camera does.
  var exitK = _oClamp((p - 0.90) / 0.10, 0, 1);
  return /*#__PURE__*/React.createElement("section", {
    ref: secRef,
    className: "origin",
    id: "intro",
    "data-screen-label": "02 Origin",
    style: {
      height: "300vh"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin__stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin__scrim",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "origin__type",
    style: {
      opacity: (1 - exitK).toFixed(3),
      transform: "translateY(".concat((exitK * -46).toFixed(1), "px)"),
      filter: exitK > 0.004 ? "blur(".concat((exitK * 7).toFixed(2), "px)") : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin__kickerDot"
  }), /*#__PURE__*/React.createElement("span", {
    className: "origin__kickerAddr",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__type,.origin__stage,.lp"
  }, "0x00"), /*#__PURE__*/React.createElement("span", {
    className: "origin__kickerSep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "origin__kickerName",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__type,.origin__stage,.lp"
  }, "MASLOV / OLEKSANDR"), /*#__PURE__*/React.createElement("span", {
    className: "origin__kickerSep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "origin__kickerRoute",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__type,.origin__stage,.lp"
  }, "KYIV \u2192 M\xDCNCHEN")), /*#__PURE__*/React.createElement("h2", {
    className: "origin__head2"
  }, ORIGIN_LINES.map(function (ln, i) {
    var local = _oClamp((p - (ln.at - 0.24)) / 0.24, 0, 1);
    var e = _oEase(local);
    var style = {
      filter: "blur(".concat(((1 - e) * 16).toFixed(2), "px)"),
      opacity: (0.08 + e * 0.92).toFixed(3),
      transform: "translateY(".concat(((1 - e) * 18).toFixed(1), "px)"),
      color: "var(--bone)"
    };
    var cls = "origin__line" + (ln.em ? " origin__line--em" : "") + (ln.ghost ? " origin__line--ghost" : "");
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      className: cls,
      style: style
    }, /*#__PURE__*/React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".origin__line,.origin__type,.origin__stage,.lp"
    }, ln.t, ln.dot ? /*#__PURE__*/React.createElement("em", {
      className: "origin__period"
    }, ".") : null));
  })), /*#__PURE__*/React.createElement("div", {
    className: "origin__sig",
    style: {
      opacity: _oClamp((p - 0.56) / 0.16, 0, 1).toFixed(3)
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin__sigCol",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__sig,.origin__type,.origin__stage,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin__sigK"
  }, "\u2599 NOW"), /*#__PURE__*/React.createElement("span", {
    className: "origin__sigV"
  }, "ZMK \xB7 Kerfur \xB7 Iskra")), /*#__PURE__*/React.createElement("div", {
    className: "origin__sigCol",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__sig,.origin__type,.origin__stage,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin__sigK"
  }, "\u2599 NEXT"), /*#__PURE__*/React.createElement("span", {
    className: "origin__sigV"
  }, "University / technical Ausbildung \xB7 Wafer company")))), /*#__PURE__*/React.createElement("div", {
    className: "origin__handoff",
    style: {
      opacity: handoff.toFixed(3),
      transform: "translate(-50%, ".concat((1 - handoff) * 10, "px)")
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin__handoffLine"
  }), /*#__PURE__*/React.createElement("span", null, "03 \xB7 SELECTED WORK"), /*#__PURE__*/React.createElement("span", {
    className: "origin__handoffArr"
  }, "\u2193"))));
}
window.OriginBeat = OriginBeat;

/* ---- landing_final5/work.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — FINAL 3 · WORK REEL — "SELECTED NODES"
   ------------------------------------------------------------
   2026-08 node-system pass:
   · data comes from window.MO_PROJECTS via MO_FEATURED_ADDRS —
     no duplicated project copy in this file;
   · cards keep their original caption-bar form (no 3D on the card);
   · every card opens through the generic mo:nodeFlight handoff
     (no addr-specific branches); file:null nodes stay visual
     and read RECORD FORMING instead of navigating.
   Exports: WORKS, Work.
   ============================================================ */

var _React = React,
  useL = _React.useState,
  useE = _React.useEffect,
  useR = _React.useRef;
function useCompact() {
  var bp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 700;
  var _useL = useL(function () {
      return window.innerWidth <= bp;
    }),
    _useL2 = _slicedToArray(_useL, 2),
    c = _useL2[0],
    setC = _useL2[1];
  useE(function () {
    var on = function on() {
      return setC(window.innerWidth <= bp);
    };
    window.addEventListener("resize", on);
    return function () {
      return window.removeEventListener("resize", on);
    };
  }, [bp]);
  return c;
}

/* ── featured nodes — one source of truth ─────────────────── */
var FEATURED_ADDRS = window.MO_FEATURED_ADDRS || ["0x01", "0x03", "0x04", "0x06"];
var WORKS = FEATURED_ADDRS.map(function (addr) {
  return (window.MO_PROJECTS || []).find(function (p) {
    return p.addr === addr;
  });
}).filter(Boolean);
function Work(_ref) {
  var onHoverWork = _ref.onHoverWork;
  var sectionRef = useR(null);
  var _useL3 = useL(0),
    _useL4 = _slicedToArray(_useL3, 2),
    progress = _useL4[0],
    setProgress = _useL4[1];
  var _useL5 = useL(null),
    _useL6 = _slicedToArray(_useL5, 2),
    focused = _useL6[0],
    setFocused = _useL6[1];
  var N = WORKS.length;
  var STOPS = N + 2;
  var PADS = 0.6;
  var TOTAL_V = STOPS + PADS;

  /* ── scroll progress + snap-by-easing (unchanged mechanics) ── */
  useE(function () {
    var el = sectionRef.current;
    if (!el) return;
    var raf;
    var easeInOut = function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
    var update = function update() {
      var r = el.getBoundingClientRect();
      var total = el.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      var pRaw = Math.max(0, Math.min(1, -r.top / total));
      var padN = PADS / TOTAL_V;
      var p = Math.max(0, Math.min(1, (pRaw - padN) / (1 - 2 * padN)));
      var intervals = STOPS - 1;
      var local = p * intervals;
      var idx = Math.floor(local);
      var frac = local - idx;
      var eased = easeInOut(frac);
      var snapped = (idx + eased) / intervals;
      window.__mo_reel = window.__mo_reel || {};
      window.__mo_reel.pos = snapped * intervals;
      setProgress(snapped);
    };
    var onScroll = function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", onScroll);
    return function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [STOPS, PADS, TOTAL_V]);
  var activeStop = Math.round(progress * (STOPS - 1));
  var activeCardIdx = Math.max(0, activeStop - 1);
  var activeWork = activeStop === 0 || activeStop > N ? null : WORKS[activeCardIdx];
  useE(function () {
    onHoverWork && onHoverWork(focused || (activeWork === null || activeWork === void 0 ? void 0 : activeWork.addr) || null);
  }, [focused, activeWork, onHoverWork]);

  /* announce reel stop changes — sound score AND the shared model stage listen */
  useE(function () {
    try {
      window.dispatchEvent(new CustomEvent("mo:reelStop", {
        detail: {
          stop: activeStop,
          addr: activeWork ? activeWork.addr : null
        }
      }));
    } catch (_) {}
  }, [activeStop]);

  /* ── geometry (see FINAL 3 notes — JSX is the single truth) ── */
  var compactReel = useCompact(700);
  var midReel = useCompact(1100);
  var TITLE_SLOT_VW = compactReel ? 100 : midReel ? 80 : 56;
  var CARD_SLOT_VW = compactReel ? 78 : midReel ? 70 : 52;
  var SHOWALL_SLOT_VW = compactReel ? 96 : midReel ? 70 : 52;
  var TITLE_GUTTER_PX = compactReel ? 20 : 56;
  var titleInnerLeft = "calc(".concat(TITLE_GUTTER_PX, "px - ").concat((50 - TITLE_SLOT_VW / 2).toFixed(2), "vw)");
  var slotCentersVW = function () {
    var out = [TITLE_SLOT_VW / 2];
    var cursor = TITLE_SLOT_VW;
    for (var i = 0; i < N; i++) {
      out.push(cursor + CARD_SLOT_VW / 2);
      cursor += CARD_SLOT_VW;
    }
    out.push(cursor + SHOWALL_SLOT_VW / 2);
    return out;
  }();
  var pp = progress * (STOPS - 1);
  var idx0 = Math.max(0, Math.min(STOPS - 2, Math.floor(pp)));
  var tt = pp - idx0;
  var centerVW = slotCentersVW[idx0] * (1 - tt) + slotCentersVW[idx0 + 1] * tt;
  var railShiftVW = 50 - centerVW;
  var bgShiftVW = railShiftVW * 0.35;
  var jumpToStop = function jumpToStop(stopIdx) {
    var el = sectionRef.current;
    if (!el) return;
    var total = el.offsetHeight - window.innerHeight;
    var padN = PADS / TOTAL_V;
    var target = padN + stopIdx / (STOPS - 1) * (1 - 2 * padN);
    window.scrollTo({
      top: el.offsetTop + target * total,
      behavior: "smooth"
    });
  };
  return /*#__PURE__*/React.createElement("section", {
    ref: sectionRef,
    className: "lp-section lp-workReel",
    id: "work",
    "data-screen-label": "02 Work",
    style: {
      height: "calc(".concat(TOTAL_V, " * 100vh)")
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__sticky"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__bg",
    style: {
      transform: "translateX(".concat(bgShiftVW, "vw)")
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__rail",
    style: {
      transform: "translateX(".concat(railShiftVW, "vw)")
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__slot lp-workReel__slot--title",
    style: {
      flex: "0 0 ".concat(TITLE_SLOT_VW, "vw")
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__titleInner",
    style: {
      left: titleInnerLeft
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__titleNum"
  }, /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__sticky,.lp"
  }, "02")), /*#__PURE__*/React.createElement("h2", {
    className: "lp-workReel__title",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__sticky,.lp"
  }, "Selected nodes", /*#__PURE__*/React.createElement("em", null, ".")), /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__titleSub"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-workReel__titleSubDot"
  }), /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__sticky,.lp"
  }, "Scroll \u2014 each node resolves at the lens.")))), WORKS.map(function (w, i) {
    var stopIdx = i + 1;
    var slotCenter = stopIdx / (STOPS - 1);
    var delta = progress - slotCenter;
    var absD = Math.min(1, Math.abs(delta) * (STOPS - 1));
    var isLocked = activeStop === stopIdx && Math.abs(delta) < 0.5 / (STOPS - 1);
    return /*#__PURE__*/React.createElement("div", {
      className: "lp-workReel__slot",
      key: w.addr,
      style: {
        flex: "0 0 ".concat(CARD_SLOT_VW, "vw")
      }
    }, /*#__PURE__*/React.createElement(NodeCard, {
      work: w,
      i: i,
      total: N,
      absD: absD,
      locked: isLocked,
      focused: focused === w.addr,
      onFocus: setFocused
    }));
  }), function () {
    var stopIdx = N + 1;
    var slotCenter = stopIdx / (STOPS - 1);
    var delta = progress - slotCenter;
    var absD = Math.min(1, Math.abs(delta) * (STOPS - 1));
    var isLocked = activeStop === stopIdx && Math.abs(delta) < 0.5 / (STOPS - 1);
    var popScale = isLocked ? 1.02 : 1 - absD * 0.06;
    var popOp = 1 - absD * 0.4;
    return /*#__PURE__*/React.createElement("div", {
      className: "lp-workReel__slot lp-workReel__slot--showAll",
      style: {
        flex: "0 0 ".concat(SHOWALL_SLOT_VW, "vw")
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "showAllGate " + (isLocked ? "showAllGate--locked" : ""),
      "data-screen-label": "06 All projects gate",
      style: {
        transform: "scale(".concat(popScale.toFixed(3), ")"),
        opacity: popOp.toFixed(3)
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "showAllGate__spine",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", {
      className: "showAllGate__body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "showAllGate__overline",
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
    }, "04 / END \xB7 PASSAGE"), /*#__PURE__*/React.createElement("h3", {
      className: "showAllGate__name",
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
    }, "Open the universe", /*#__PURE__*/React.createElement("em", null, ".")), /*#__PURE__*/React.createElement("div", {
      className: "showAllGate__sub",
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
    }, "12 nodes \u2014 products, systems, modules and studies. Enter the full field. ESC returns here.")), /*#__PURE__*/React.createElement("div", {
      className: "showAllGate__key"
    }, /*#__PURE__*/React.createElement(KeyButton, {
      legend: /*#__PURE__*/React.createElement("span", {
        "data-mo-cursor-mirror": true,
        "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
      }, "A"),
      primary: true,
      onPress: function onPress() {
        document.body.classList.add("landing-exit");
        setTimeout(function () {
          window.location.href = "All Projects.html";
        }, 380);
      }
    }, /*#__PURE__*/React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
    }, "SHOW ALL")))));
  }()), /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__vignette"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__stops"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp-workReel__stopBtn " + (activeStop === 0 ? "is-active" : ""),
    onClick: function onClick() {
      return jumpToStop(0);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-workReel__stopDot"
  }), /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__stops,.lp-workReel__sticky,.lp"
  }, "00 \xB7 TITLE")), WORKS.map(function (w, i) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: w.addr,
      className: "lp-workReel__stopBtn " + (activeStop === i + 1 ? "is-active" : ""),
      onClick: function onClick() {
        return jumpToStop(i + 1);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "lp-workReel__stopDot"
    }), /*#__PURE__*/React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".lp-workReel__stops,.lp-workReel__sticky,.lp"
    }, (i + 1).toString().padStart(2, "0"), " \xB7 ", w.name.toUpperCase()));
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lp-workReel__stopBtn lp-workReel__stopBtn--showAll " + (activeStop === N + 1 ? "is-active" : ""),
    onClick: function onClick() {
      return jumpToStop(N + 1);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-workReel__stopDot"
  }), /*#__PURE__*/React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__stops,.lp-workReel__sticky,.lp"
  }, (N + 1).toString().padStart(2, "0"), " \xB7 ALL \u2197"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__progressRail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-workReel__progressFill",
    style: {
      width: "".concat((progress * 100).toFixed(2), "%")
    }
  }))));
}

/* ── NODE CARD — the original caption bar; opens through mo:nodeFlight ── */
function NodeCard(_ref2) {
  var work = _ref2.work,
    i = _ref2.i,
    total = _ref2.total,
    absD = _ref2.absD,
    locked = _ref2.locked,
    focused = _ref2.focused,
    _onFocus = _ref2.onFocus;
  var cardRef = useR(null);
  var hasPage = !!work.file;
  var openNode = function openNode() {
    if (!hasPage) return; // RECORD FORMING — stays visual
    var project = work;
    var rect = cardRef.current ? cardRef.current.getBoundingClientRect() : null;
    var originRect = rect ? {
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height
    } : null;
    window.dispatchEvent(new CustomEvent("mo:nodeFlight", {
      detail: {
        project: project,
        originRect: originRect,
        origin: "work"
      }
    }));
  };
  var onKey = function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openNode();
    }
  };
  var popScale = locked ? 1.025 : 1 - absD * 0.06;
  var popOp = 1 - absD * 0.4;
  return /*#__PURE__*/React.createElement("article", {
    ref: cardRef,
    className: "rcard " + (locked ? "rcard--locked " : "") + (focused ? "rcard--focused" : ""),
    "data-addr": work.addr,
    "data-screen-label": (i + 2).toString().padStart(2, "0") + " " + work.name,
    onMouseEnter: function onMouseEnter() {
      return _onFocus && _onFocus(work.addr);
    },
    onMouseLeave: function onMouseLeave() {
      return _onFocus && _onFocus(null);
    },
    onFocus: function onFocus() {
      return _onFocus && _onFocus(work.addr);
    },
    onBlur: function onBlur() {
      return _onFocus && _onFocus(null);
    },
    onClick: openNode,
    onKeyDown: onKey,
    tabIndex: 0,
    style: {
      transform: "scale(".concat(popScale.toFixed(3), ")"),
      opacity: popOp.toFixed(3)
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "rcard__spine",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "rcard__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rcard__top",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rcard__topAddr"
  }, "NODE ", work.addr), /*#__PURE__*/React.createElement("span", {
    className: "rcard__topSep"
  }), /*#__PURE__*/React.createElement("span", {
    className: "rcard__topIdx"
  }, (i + 1).toString().padStart(2, "0"), " / ", total.toString().padStart(2, "0"))), /*#__PURE__*/React.createElement("h3", {
    className: "rcard__name",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, work.name, /*#__PURE__*/React.createElement("em", null, ".")), /*#__PURE__*/React.createElement("div", {
    className: "rcard__sub",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, work["short"] || work.statement)), /*#__PURE__*/React.createElement("div", {
    className: "rcard__open " + (hasPage ? "" : "rcard__open--forming"),
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, /*#__PURE__*/React.createElement("span", null, hasPage ? "OPEN" : "RECORD FORMING"), hasPage && /*#__PURE__*/React.createElement("span", {
    className: "rcard__arr"
  }, "\u2192")));
}
window.Work = Work;
window.WORKS = WORKS;
window.FEATURED_ADDRS = FEATURED_ADDRS;

/* ---- landing_final5/app.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/* ============================================================
   M.O. SYSTEM — FINAL 5 · Landing app
   Single source of truth for the active section (resolved every scroll
   frame). Children take no enter callback — their own in-view
   observers were removed in FINAL 3.
   ============================================================ */
var _React = React,
  useLA = _React.useState,
  useEA = _React.useEffect;
function LandingApp() {
  var _useLA = useLA("title"),
    _useLA2 = _slicedToArray(_useLA, 2),
    section = _useLA2[0],
    setSection = _useLA2[1]; // title | intro | work | about | contact
  var _useLA3 = useLA(null),
    _useLA4 = _slicedToArray(_useLA3, 2),
    hoverAddr = _useLA4[0],
    setHoverAddr = _useLA4[1]; // address of the currently-hovered work
  var _useLA5 = useLA(null),
    _useLA6 = _slicedToArray(_useLA5, 2),
    activeProject = _useLA6[0],
    setActiveProject = _useLA6[1];

  /* ── SINGLE source of truth for the active section ───────────────
     The old design let each section fire its OWN IntersectionObserver
     on enter (and never on exit). With a 300vh origin beat sitting
     between shorter neighbours, whichever observer fired last won — so
     the first scroll could fail to engage origin, and scrolling back
     left it stuck because nothing re-fired for the section you returned
     to. Instead we resolve the section deterministically every scroll
     frame: the section whose element straddles the viewport centre line
     IS the active one. This always replays going up or down. */
  useEA(function () {
    var ORDER = ["title", "intro", "work", "about"];
    var raf = 0;
    var resolve = function resolve() {
      raf = 0;
      var mid = window.innerHeight / 2;
      var pick = null,
        nearest = Infinity;
      for (var _i = 0, _ORDER = ORDER; _i < _ORDER.length; _i++) {
        var id = _ORDER[_i];
        var el = document.getElementById(id);
        if (!el) continue;
        var r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          pick = id;
          break;
        } // straddles centre
        var d = r.top > mid ? r.top - mid : mid - r.bottom; // gap fallback
        if (d < nearest) {
          nearest = d;
          pick = id;
        }
      }
      if (!pick) return;
      // Within the board section, the footer beat reads as "contact"
      // (same universe mode, drives nav highlight).
      if (pick === "about" && window.__mo_bf && window.__mo_bf.footer) pick = "contact";
      setSection(function (prev) {
        return prev === pick ? prev : pick;
      });
    };
    var onScroll = function onScroll() {
      if (!raf) raf = requestAnimationFrame(resolve);
    };
    resolve();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", onScroll);
    return function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Universe mode derived from active section
  var mode = section === "work" ? "reel" // v10: the tiles themselves parade past the lens
  : section === "intro" ? "origin" // origin beat: field assembles into 0x00
  : section === "about" ? "drift" // About: card floats in the drifting universe, board grows out of it
  : section === "contact" ? "drift" // (board covers + universe pauses once the board is full)
  : "drift"; // title drifts

  // v10: announce section changes — the sound score + FX layers listen.
  useEA(function () {
    try {
      window.dispatchEvent(new CustomEvent("mo:section", {
        detail: {
          section: section
        }
      }));
    } catch (_) {}
  }, [section]);

  // The one-line entry horizon owns the arrival overture. It waits for the
  // first real universe frame, then lets WebGL take over the field.

  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
    className: "mo-skip-link",
    href: "#work"
  }, "Skip to selected work"), /*#__PURE__*/React.createElement(Cursor, null), /*#__PURE__*/React.createElement("div", {
    className: "universeBg universeBg--" + mode
  }, /*#__PURE__*/React.createElement(Universe, {
    projects: window.UNIVERSE_PROJECTS,
    mode: mode,
    focusAddr: hoverAddr,
    onActive: setActiveProject
  })), /*#__PURE__*/React.createElement(ShellLanding, {
    section: section
  }), window.NodeHandoff ? /*#__PURE__*/React.createElement(NodeHandoff, null) : null, /*#__PURE__*/React.createElement("main", {
    className: "lp"
  }, /*#__PURE__*/React.createElement(TitleScreen, null), /*#__PURE__*/React.createElement(OriginBeat, null), /*#__PURE__*/React.createElement(Work, {
    onHoverWork: setHoverAddr
  }), /*#__PURE__*/React.createElement(BoardFlight, null)));
}

/* shell — section-aware status */
function ShellLanding(_ref) {
  var section = _ref.section;
  var _useLA7 = useLA("--:--"),
    _useLA8 = _slicedToArray(_useLA7, 2),
    time = _useLA8[0],
    setTime = _useLA8[1];
  useEA(function () {
    var tick = function tick() {
      return setTime(new Date().toTimeString().slice(0, 5));
    };
    tick();
    var id = setInterval(tick, 30000);
    return function () {
      return clearInterval(id);
    };
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    className: "shell lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-shell__blur",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null)), /*#__PURE__*/React.createElement("div", {
    className: "shell__brand"
  }, "M.O."), /*#__PURE__*/React.createElement("nav", {
    className: "shell__nav"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#work",
    className: section === "work" ? "is-active" : "",
    "aria-current": section === "work" ? "location" : undefined
  }, "WORK"), /*#__PURE__*/React.createElement("a", {
    href: "#about",
    className: section === "about" ? "is-active" : "",
    "aria-current": section === "about" ? "location" : undefined
  }, "ABOUT"), /*#__PURE__*/React.createElement("a", {
    href: "#contact",
    className: section === "contact" ? "is-active" : "",
    "aria-current": section === "contact" ? "location" : undefined
  }, "CONTACT"), /*#__PURE__*/React.createElement("a", {
    href: "All Projects.html"
  }, "INDEX \u2197")), /*#__PURE__*/React.createElement("div", {
    className: "shell__status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "shell__dot"
  }), /*#__PURE__*/React.createElement("span", null, "MUC \xB7 ", time, " GMT+1"), /*#__PURE__*/React.createElement(VolumeToggle, null)));
}

/* volume toggle — an animated SINEWAVE (replaces [G] grid).
   The wave's amplitude rides the real master-output level and its
   phase scrolls while sound is on; it flattens to a line when off.
   Click toggles the whole field + the omnipresent 0x00 carrier. */
function VolumeToggle() {
  var _React2 = React,
    useState = _React2.useState,
    useEffect = _React2.useEffect,
    useRef = _React2.useRef;
  var _useState = useState(function () {
      return window.MOSound ? window.MOSound.isMuted() : true;
    }),
    _useState2 = _slicedToArray(_useState, 2),
    muted = _useState2[0],
    setMuted = _useState2[1];
  var pathRef = useRef(null);
  useEffect(function () {
    if (!window.MOSound) return;
    window.MOSound.init();
    var W = 38,
      H = 16,
      MID = H / 2,
      N = 40;
    var raf = 0,
      phase = 0,
      amp = 0;
    var _tick = function tick() {
      raf = 0;
      var path = pathRef.current;
      if (!path) return;
      var on = !window.MOSound.isMuted();
      var lvl = on ? window.MOSound.getLevel() : 0;
      // target amplitude: a calm idle wave + a kick from real output level
      var target = on ? 1.6 + lvl * 9 : 0;
      amp += (target - amp) * 0.15;
      if (on) phase += 0.22;
      var d = "";
      for (var i = 0; i <= N; i++) {
        var x = i / N * W;
        // two-frequency wave so it reads richer than a pure sine
        var y = MID + Math.sin(i / N * Math.PI * 4 + phase) * amp + Math.sin(i / N * Math.PI * 7 - phase * 0.6) * amp * 0.25;
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(2) + " ";
      }
      path.setAttribute("d", d);
      if (on || amp > 0.02) raf = requestAnimationFrame(_tick);else {
        amp = 0;
        path.setAttribute("d", "M0 8 L38 8");
      }
    };
    var wake = function wake() {
      if (!raf) raf = requestAnimationFrame(_tick);
    };
    window.MOSound.onState(function (s) {
      setMuted(s.muted);
      wake();
    });
    wake();
    return function () {
      return cancelAnimationFrame(raf);
    };
  }, []);
  var click = function click() {
    if (!window.MOSound) return;
    window.MOSound.unlock();
    window.MOSound.toggleMute();
    window.MOSound.carrier(!window.MOSound.isMuted());
  };
  return /*#__PURE__*/React.createElement("button", {
    className: "volBtn " + (muted ? "is-off" : "is-on"),
    onClick: click,
    "aria-label": muted ? "Enable sound" : "Mute sound",
    title: muted ? "Enable sound — 0x00 carrier field" : "Mute sound"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "volBtn__wave",
    viewBox: "0 0 38 16",
    width: "38",
    height: "16",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    ref: pathRef,
    d: "M0 8 L38 8",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), /*#__PURE__*/React.createElement("span", null, muted ? "sound off" : "sound on"));
}
var landingFinal5Mounted = false;
function mountLandingFinal5() {
  if (landingFinal5Mounted || !window.THREE) return;
  landingFinal5Mounted = true;
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/*#__PURE__*/React.createElement(LandingApp, null));
}
if (window.THREE) mountLandingFinal5();else window.addEventListener("mo:three-ready", mountLandingFinal5, {
  once: true
});
