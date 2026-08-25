/* GENERATED FILE - do not edit directly.
   Run: npm run build --prefix tools/landing-runtime
   Sources and order: tools/landing-runtime/build.cjs */

/* ---- app/shared/core.jsx ---- */
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
(function restorePersistedPage() {
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    window.__hv_leaving = false;
    window.__mo_universe_pause = false;
    document.body.classList.remove("hv-exit", "landing-exit", "wf-flying");
    var universe = document.querySelector(".universeBg");
    if (universe) {
      if (universe.__moFadeT) clearTimeout(universe.__moFadeT);
      universe.__moFadeT = 0;
      universe.style.opacity = "";
      universe.style.transform = "";
      universe.style.transition = "";
    }
    window.dispatchEvent(new CustomEvent("mo:page-restored"));
  });
})();
(function warmModels() {
  var done = false;
  setTimeout(function () {
    if (done) return;
    done = true;
    if (typeof window.preloadModels !== "function") return;
    var urls = new Set();
    (window.UNIVERSE_PROJECTS || []).forEach(function (p) {
      return p.model && urls.add(p.model);
    });
    if (urls.size) window.preloadModels(Array.from(urls));
  }, 0);
})();
function Cursor() {
  var ref = useRef(null);
  var coordRef = useRef(null);
  var _useState = useState("idle"),
    _useState2 = _slicedToArray(_useState, 2),
    mode = _useState2[0],
    setMode = _useState2[1];
  useEffect(function () {
    document.documentElement.classList.add("custom-cursor");
    var node = ref.current;
    var px = 0,
      py = 0,
      lastMode = "idle",
      lastProbe = 0,
      raf = 0,
      live = false;
    var root = document.documentElement;
    var HOT = "a[href], button, summary, [role='link'], [role='button'], [role='tab'], " + "[data-hot], .key, .node, .swatch, .curve, .family, .compBlock, .t-link";
    var PROBE = ".photoTile, .ascii-fig__cv";
    var GRAB = ".bus3d, .universeBg";
    var writeCoords = function writeCoords() {
      var c = coordRef.current;
      if (c) c.textContent = String(Math.round(px)).padStart(4, "0") + " / " + String(Math.round(py)).padStart(4, "0");
    };
    var probe = function probe(now) {
      if (now - lastProbe < 60) return;
      lastProbe = now;
      var el = document.elementFromPoint(px, py);
      var next = "idle";
      if (el) {
        if (el.closest(HOT)) next = "hot";else if (el.closest(PROBE)) next = "probe";else if (el.closest(GRAB)) next = "grab";
      }
      if (next !== lastMode) {
        lastMode = next;
        setMode(next);
      }
    };
    var setLive = function setLive(on) {
      if (live === on) return;
      live = on;
      root.classList.toggle("mo-cursor-live", on);
      if (!on && lastMode !== "idle") {
        lastMode = "idle";
        setMode("idle");
      }
    };
    var flushMove = function flushMove(now) {
      raf = 0;
      if (node) node.style.transform = "translate(".concat(px, "px, ").concat(py, "px) translate(-50%, -50%)");
      writeCoords();
      probe(now);
    };
    var track = function track(e) {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      setLive(true);
      if (!raf) raf = requestAnimationFrame(flushMove);
    };
    var onOut = function onOut(e) {
      if (!e.relatedTarget) setLive(false);
    };
    var onBlur = function onBlur() {
      return setLive(false);
    };
    window.addEventListener("pointermove", track, {
      passive: true
    });
    window.addEventListener("pointerdown", track, {
      passive: true
    });
    window.addEventListener("wheel", track, {
      passive: true
    });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("blur", onBlur);
    return function () {
      window.removeEventListener("pointermove", track);
      window.removeEventListener("pointerdown", track);
      window.removeEventListener("wheel", track);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", onBlur);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("custom-cursor");
      root.classList.remove("mo-cursor-live");
    };
  }, []);
  return React.createElement("div", {
    ref: ref,
    className: "cursor cursor--" + mode
  }, React.createElement("div", {
    className: "cursor__ring"
  }), React.createElement("div", {
    className: "cursor__center"
  }), React.createElement("div", {
    className: "cursor__hLine"
  }), React.createElement("div", {
    className: "cursor__vLine"
  }), React.createElement("div", {
    className: "cursor__coords"
  }, React.createElement("span", {
    ref: coordRef,
    style: {
      display: mode === "idle" ? "" : "none"
    }
  }, "0000 / 0000"), mode === "grab" && React.createElement("span", null, "drag to rotate"), mode === "probe" && React.createElement("span", null, "inspect \u2316"), mode === "hot" && React.createElement("span", null, "open \u2192")));
}
function Shell() {
  var _useState3 = useState("--:--"),
    _useState4 = _slicedToArray(_useState3, 2),
    time = _useState4[0],
    setTime = _useState4[1];
  useEffect(function () {
    var tick = function tick() {
      return setTime(new Date().toTimeString().slice(0, 5));
    };
    tick();
    var id = setInterval(tick, 30000);
    return function () {
      return clearInterval(id);
    };
  }, []);
  return React.createElement("header", {
    className: "shell"
  }, React.createElement("a", {
    className: "shell__brand",
    href: "./",
    "aria-label": "Back to the title"
  }, "M.O. \u2225 SYSTEM v0.1.0"), React.createElement("nav", {
    className: "shell__nav"
  }, React.createElement("a", {
    href: "#brief"
  }, "BRIEF"), React.createElement("a", {
    href: "#color"
  }, "COLOR"), React.createElement("a", {
    href: "#type"
  }, "TYPE"), React.createElement("a", {
    href: "#grid"
  }, "GRID"), React.createElement("a", {
    href: "#motion"
  }, "MOTION"), React.createElement("a", {
    href: "#components"
  }, "COMPONENTS"), React.createElement("a", {
    href: "#voice"
  }, "VOICE")), React.createElement("div", {
    className: "shell__status"
  }, React.createElement("span", {
    className: "shell__dot"
  }), React.createElement("span", null, "ONLINE \xB7 MUC \xB7 ", time)));
}
window.Cursor = Cursor;
window.Shell = Shell;

/* ---- app/shared/key-button.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
    onPress && onPress();
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
      fire();
    }
  };
  return React.createElement("button", {
    className: "key " + (pressed ? "key--down " : "") + (lit ? "key--lit " : "") + (primary ? "key--primary" : ""),
    onClick: fire,
    onKeyDown: onKey
  }, React.createElement("span", {
    className: "key__cap"
  }, React.createElement("span", {
    className: "key__legendTop"
  }, legend), React.createElement("span", {
    className: "key__label"
  }, children)), React.createElement("span", {
    className: "key__shadow",
    "aria-hidden": "true"
  }));
}
window.KeyButton = KeyButton;

/* ---- app/landing/components/ascii-wordmark.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
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
    var A = 2;
    var W = cols,
      H = rows * A;
    var K = {
      m: 0.94,
      o: 0.84,
      dot: 0.12,
      gap: 0.24
    };
    var SUM = K.m + K.gap + K.dot + K.gap + K.o + K.gap + K.dot;
    var Hv = Math.min(H * 0.70, W * 0.94 / SUM);
    var x0 = (W - Hv * SUM) / 2;
    var y0 = (H - Hv) / 2;
    var nodes = [];
    var segs = [];
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
    addLetter([[0, 1], [0, 0], [0.5, 0.62], [1, 0], [1, 1]], [[0, 1], [1, 2], [2, 3], [3, 4]], cx, K.m * Hv);
    cx += (K.m + K.gap) * Hv;
    var dotR = Hv * 0.115;
    nodes.push({
      x: cx + K.dot * Hv * 0.5,
      y: y0 + Hv - dotR * 0.6,
      phase: nodes.length * 1.7,
      dot: true
    });
    cx += (K.dot + K.gap) * Hv;
    addLetter([[0.32, 0], [0.68, 0], [1, 0.26], [1, 0.74], [0.68, 1], [0.32, 1], [0, 0.74], [0, 0.26]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]], cx, K.o * Hv);
    cx += (K.o + K.gap) * Hv;
    nodes.push({
      x: cx + K.dot * Hv * 0.5,
      y: y0 + Hv - dotR * 0.6,
      phase: nodes.length * 1.7,
      dot: true
    });
    var rad = Hv * 0.085;
    var nodeR = rad * 2.3;
    var N = cols * rows;
    var mask = new Float32Array(N);
    var nDist = new Float32Array(N);
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
    var hashCell = new Float32Array(N);
    for (var _i = 0; _i < N; _i++) {
      var _s = Math.sin(_i * 12.9898) * 43758.5453;
      hashCell[_i] = _s - Math.floor(_s);
    }
    var cursor = {
      x: -1000,
      y: -1000,
      active: false
    };
    var ptrX = 0,
      ptrY = 0,
      ptrSeen = false;
    var onMove = function onMove(e) {
      if (e.pointerType === "touch") return;
      ptrX = e.clientX;
      ptrY = e.clientY;
      ptrSeen = true;
    };
    var onOut = function onOut(e) {
      if (!e.relatedTarget) ptrSeen = false;
    };
    window.addEventListener("pointermove", onMove, {
      passive: true
    });
    document.addEventListener("mouseout", onOut);
    var syncCursor = function syncCursor() {
      if (!ptrSeen) {
        cursor.active = false;
        return;
      }
      var r = el.getBoundingClientRect();
      var inside = r.width > 0 && r.height > 0 && ptrX >= r.left && ptrX <= r.right && ptrY >= r.top && ptrY <= r.bottom;
      cursor.active = inside;
      if (inside) {
        cursor.x = (ptrX - r.left) / r.width * cols;
        cursor.y = (ptrY - r.top) / r.height * rows;
      }
    };
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
      }
      last = now;
      el.__exCleared = false;
      syncCursor();
      var t = now * 0.0009;
      var buf = [];
      for (var _r = 0; _r < rows; _r++) {
        var line = "";
        for (var _c = 0; _c < cols; _c++) {
          var _i2 = _r * cols + _c;
          var _m = mask[_i2];
          var n = (Math.sin(_c * 0.18 + t * 1.4) * 0.5 + 0.5) * 0.45 + (Math.sin(_r * 0.31 - t * 1.0) * 0.5 + 0.5) * 0.30 + (Math.sin((_c + _r) * 0.09 + t * 0.6) * 0.5 + 0.5) * 0.25;
          var sweep = Math.sin(_c * 0.055 - t * 2.1) * 0.5 + 0.5;
          var cInf = 0;
          if (cursor.active) {
            var _dx = _c - cursor.x;
            var _dy = (_r - cursor.y) * A;
            var _d2 = Math.sqrt(_dx * _dx + _dy * _dy);
            cInf = Math.max(0, 1 - _d2 / 14);
            cInf = cInf * cInf;
          }
          var k = Math.max(0, 1 - nDist[_i2] / nodeR);
          var v = void 0,
            isNode = false;
          if (_m > 0.04 || k > 0) {
            v = 0.24 + _m * 0.30 + n * 0.32 + sweep * 0.16 + cInf * 0.85;
            if (k > 0) {
              var pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + nPhase[_i2]);
              v += k * (0.35 + pulse * 0.45);
              isNode = k > 0.55;
            }
          } else {
            v = n * n * 0.20 + sweep * 0.04 + cInf * 0.85;
          }
          v = Math.max(0, Math.min(1, v));
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
            line += "<b>" + ch + "</b>";
          } else if (cInf > 0.35 || _m > 0.5 && v > 0.88) {
            line += "<i>" + ch + "</i>";
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
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
    };
  }, [cols, rows, ramp]);
  return React.createElement("pre", {
    className: "asciiHero " + className,
    ref: ref,
    "aria-hidden": "true"
  });
}
window.AsciiHero = AsciiHero;

/* ---- app/projects/rendering/model-viewer.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
(function () {
  var SIGNAL = 0x00f0c8;
  var SIGNAL_DIM = 0x00a88c;
  var HAIRLINE = 0x232a3a;
  var BONE = 0xe6e8ee;
  var _gltfCache = new Map();
  var _constrainedDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.deviceMemory && navigator.deviceMemory <= 4 || navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  var _modelJobLimit = _constrainedDevice ? 2 : 4;
  var _modelJobs = [];
  var _activeModelJobs = 0;
  function drainModelJobs() {
    while (_activeModelJobs < _modelJobLimit && _modelJobs.length) {
      var job = _modelJobs.shift();
      _activeModelJobs += 1;
      Promise.resolve().then(job.run).then(job.resolve, job.reject)["finally"](function () {
        _activeModelJobs -= 1;
        drainModelJobs();
      });
    }
  }
  function scheduleModelJob(run) {
    return new Promise(function (resolve, reject) {
      _modelJobs.push({
        run: run,
        resolve: resolve,
        reject: reject
      });
      drainModelJobs();
    });
  }
  var _ktx2 = null;
  function getKTX2Loader(THREE) {
    if (_ktx2 !== null) return _ktx2 || null;
    if (!THREE.KTX2Loader) {
      _ktx2 = false;
      return null;
    }
    var k = new THREE.KTX2Loader().setTranscoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/").setWorkerLimit(_constrainedDevice ? 1 : 2);
    var r = null;
    try {
      r = new THREE.WebGLRenderer({
        antialias: false,
        depth: false,
        stencil: false
      });
      k.detectSupport(r);
    } catch (e) {
      console.warn("[model-viewer] KTX2 detectSupport failed", e);
    } finally {
      if (r) {
        r.dispose();
        if (r.forceContextLoss) r.forceContextLoss();
      }
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
    var p = scheduleModelJob(function () {
      return new Promise(function (resolve, reject) {
        var loader = new LoaderCtor();
        var Meshopt = THREE.MeshoptDecoder || window.MeshoptDecoder;
        if (Meshopt && loader.setMeshoptDecoder) loader.setMeshoptDecoder(Meshopt);
        var ktx2 = getKTX2Loader(THREE);
        if (ktx2 && loader.setKTX2Loader) loader.setKTX2Loader(ktx2);
        loader.load(url, function (gltf) {
          return resolve(gltf.scene);
        }, undefined, function (err) {
          return reject(err);
        });
      });
    });
    _gltfCache.set(url, p);
    p["catch"](function () {
      if (_gltfCache.get(url) === p) _gltfCache["delete"](url);
    });
    return p.then(function (root) {
      return root.clone(true);
    });
  };
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
  window.dispatchEvent(new Event("mo:model-loader-ready"));
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
  function makePrimitiveGeometry(kind, THREE) {
    switch (kind) {
      case "slab":
        {
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
  window.makePrimitiveMesh = function (kind, THREE) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var wire = !!opts.wireframe;
    var geo = makePrimitiveGeometry(kind, THREE);
    if (wire) {
      var _opts$color, _opts$opacity;
      var wireGeo = new THREE.EdgesGeometry(geo, 25);
      var mat = new THREE.LineBasicMaterial({
        color: (_opts$color = opts.color) !== null && _opts$color !== void 0 ? _opts$color : SIGNAL,
        transparent: true,
        opacity: (_opts$opacity = opts.opacity) !== null && _opts$opacity !== void 0 ? _opts$opacity : 0.9,
        depthWrite: false
      });
      var line = new THREE.LineSegments(wireGeo, mat);
      line.userData.kind = kind;
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
  function orientForKind(kind, mesh) {
    if (kind === "cone") mesh.rotation.set(0, 0, Math.PI / 2);
    if (kind === "torus") mesh.rotation.set(Math.PI * 0.32, 0.4, 0);
    if (kind === "slab") mesh.rotation.set(0.22, 0.6, 0);
  }
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
      var grid = new THREE.GridHelper(8, 16, HAIRLINE, HAIRLINE);
      grid.position.y = -1.4;
      grid.material.transparent = true;
      grid.material.opacity = 0.35;
      scene.add(grid);
      var mesh = window.makePrimitiveMesh(primitive, THREE, {
        wireframe: false
      });
      orientForKind(primitive, mesh);
      if (model) {
        mesh.visible = false;
      }
      scene.add(mesh);
      stageRef.current.mesh = mesh;
      var loadedModel = null;
      if (model && window.loadProjectModel) {
        window.loadProjectModel(model, THREE).then(function (root) {
          var _mesh$geometry, _mesh$material;
          window.fitModelToSize(root, THREE, (modelFit || 2) * 1.2);
          if (modelPose) {
            root.rotation.x += modelPose.x || 0;
            root.rotation.y += modelPose.y || 0;
            root.rotation.z += modelPose.z || 0;
          }
          scene.add(root);
          loadedModel = root;
          stageRef.current.mesh = root;
          (_mesh$geometry = mesh.geometry) === null || _mesh$geometry === void 0 || _mesh$geometry.dispose();
          (_mesh$material = mesh.material) === null || _mesh$material === void 0 || _mesh$material.dispose();
          scene.remove(mesh);
        })["catch"](function (err) {
          console.warn("[model-viewer] model load failed", err);
          mesh.visible = true;
        });
      }
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
      function applyCamera() {
        var r = orbit.dist;
        camera.position.set(Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * r, Math.sin(orbit.pitch) * r, Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * r);
        camera.lookAt(0, 0, 0);
      }
      applyCamera();
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
      var raf,
        last = performance.now();
      function frame(now) {
        var dt = Math.min(50, now - last);
        last = now;
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
    return React.createElement("div", {
      className: "pv"
    }, React.createElement("div", {
      className: "pv__chrome"
    }, React.createElement("span", {
      className: "pv__chromeDot"
    }), React.createElement("span", null, "DEMO \xB7 MODEL"), React.createElement("span", {
      className: "pv__chromeSep"
    }), React.createElement("span", null, primitive.toUpperCase()), React.createElement("span", {
      className: "pv__chromeSep"
    }), React.createElement("span", {
      className: "pv__chromeMode " + (active ? "is-on" : "")
    }, active ? "● ORBIT" : "○ IDLE")), React.createElement("div", {
      className: "pv__stage"
    }, React.createElement("div", {
      className: "pv__mount",
      ref: mountRef
    }), React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--tl"
    }), React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--tr"
    }), React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--bl"
    }), React.createElement("div", {
      className: "pv__cornerL pv__corner pv__corner--br"
    }), React.createElement("div", {
      className: "pv__measure pv__measure--top"
    }, React.createElement("span", {
      className: "pv__measureTick"
    }), React.createElement("span", {
      className: "pv__measureLabel"
    }, "D \xB7 ", d.d, " mm"), React.createElement("span", {
      className: "pv__measureTick"
    })), React.createElement("div", {
      className: "pv__measure pv__measure--right"
    }, React.createElement("span", {
      className: "pv__measureTick"
    }), React.createElement("span", {
      className: "pv__measureLabel"
    }, "H \xB7 ", d.h, " mm"), React.createElement("span", {
      className: "pv__measureTick"
    })), React.createElement("div", {
      className: "pv__measure pv__measure--bot"
    }, React.createElement("span", {
      className: "pv__measureTick"
    }), React.createElement("span", {
      className: "pv__measureLabel"
    }, "W \xB7 ", d.w, " mm"), React.createElement("span", {
      className: "pv__measureTick"
    })), !model && React.createElement("div", {
      className: "pv__hint"
    }, React.createElement("span", {
      className: "pv__hintDot"
    }), React.createElement("span", null, "placeholder \xB7 drop real model later")), !active && React.createElement("div", {
      className: "pv__startWrap"
    }, React.createElement("div", {
      className: "pv__startInner"
    }, React.createElement("span", {
      className: "pv__startK"
    }, "DRAG \xB7 ORBIT"), React.createElement("span", {
      className: "pv__startSep"
    }, "\xB7"), React.createElement("span", {
      className: "pv__startK"
    }, "SCROLL \xB7 ZOOM")), React.createElement(KeyButton, {
      legend: "\u21B5",
      primary: true,
      onPress: function onPress() {
        return setActive(true);
      }
    }, "START DEMO")), active && React.createElement("button", {
      className: "pv__stop",
      onClick: function onClick() {
        return setActive(false);
      }
    }, React.createElement("span", null, "\u25CF LIVE"), React.createElement("span", {
      className: "pv__stopSep"
    }), React.createElement("span", null, "STOP DEMO"))), React.createElement("div", {
      className: "pv__foot"
    }, React.createElement("span", {
      className: "pv__footK"
    }, "FILE"), React.createElement("span", {
      className: "pv__footV"
    }, model ? model.split("/").pop() : primitive + ".placeholder.glb"), React.createElement("span", {
      className: "pv__footSep"
    }), React.createElement("span", {
      className: "pv__footK"
    }, "SCALE"), React.createElement("span", {
      className: "pv__footV"
    }, "1 : 1"), React.createElement("span", {
      className: "pv__footSep"
    }), React.createElement("span", {
      className: "pv__footK"
    }, "MODE"), React.createElement("span", {
      className: "pv__footV"
    }, active ? "interactive" : "auto-rotate")));
  }
  window.ProjectViewer3D = ProjectViewer3D;
})();

/* ---- app/projects/rendering/solid-hero-rig.jsx ---- */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
(function () {
  var SIGNAL = 0x00f0c8;
  var RIG = {
    fov: 38,
    camZ: 5.4,
    modelFit: 4.0,
    pose: {
      x: -0.92,
      y: 0.0,
      z: 0.0
    },
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
      preserveDrawingBuffer: opts.preserveDrawingBuffer === true
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
    var pmrem = null,
      envTarget = null,
      roomEnvironment = null;
    if (THREE.RoomEnvironment) {
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        roomEnvironment = new THREE.RoomEnvironment();
        envTarget = pmrem.fromScene(roomEnvironment, 0.08);
        scene.environment = envTarget.texture;
      } catch (_) {} finally {
        if (roomEnvironment) {
          if (roomEnvironment.dispose) roomEnvironment.dispose();else roomEnvironment.traverse(function (object) {
            if (object.geometry && object.geometry.dispose) object.geometry.dispose();
            var mats = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
            mats.forEach(function (material) {
              return material && material.dispose && material.dispose();
            });
          });
        }
        if (pmrem) pmrem.dispose();
        pmrem = null;
      }
    }
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
    var pivot = new THREE.Group();
    var spin = new THREE.Group();
    var holder = new THREE.Group();
    holder.rotation.set(POSE.x, POSE.y, POSE.z);
    spin.add(holder);
    pivot.add(spin);
    scene.add(pivot);
    var parts = [];
    var modelReady = false;
    var modelUpdate = null;
    function ingest(root) {
      window.fitModelToSize(root, THREE, opts.modelFit || RIG.modelFit);
      if (opts.assignMaterial && window.applySolidMaterials) {
        window.applySolidMaterials(root, THREE, opts.assignMaterial);
      } else if (opts.keepMaterials !== true && window.tuneRealMaterials) {
        window.tuneRealMaterials(root, THREE, {
          envMapIntensity: 1.9
        });
      }
      holder.add(root);
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
        var built = opts.buildModel(THREE);
        if (built && built.group && built.group.isObject3D) {
          modelUpdate = typeof built.update === "function" ? built.update : null;
          ingest(built.group);
        } else ingest(built);
      } catch (e) {
        console.warn("[wafer-rig] buildModel failed", e);
      }
    } else if (window.loadProjectModel) {
      window.loadProjectModel(modelUrl, THREE).then(ingest)["catch"](function (e) {
        console.warn("[wafer-rig] model load failed", e);
      });
    }
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
      if (modelUpdate) {
        try {
          modelUpdate(performance.now(), dt);
        } catch (error) {
          console.warn("[wafer-rig] procedural model update failed", error);
          modelUpdate = null;
        }
      }
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
        modelUpdate = null;
        if (envTarget) envTarget.dispose();
        if (renderer.renderLists) renderer.renderLists.dispose();
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
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

/* ---- app/projects/rendering/project-handoff-rig.jsx ---- */
(function () {
  var SIGNAL = 0x00f0c8;
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
    var axGeo = new THREE.BufferGeometry();
    axGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1.15, 0, 0, 1.15, 0, 0, 0, -0.78, 0, 0, 0.78, 0, 0, 0, -0.78, 0, 0, 0.78]), 3));
    g.add(new THREE.LineSegments(axGeo, new THREE.LineBasicMaterial({
      color: 0x2a3a4a,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    })));
    var core = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({
      color: 0x073b33,
      emissive: SIGNAL,
      emissiveIntensity: 1.4,
      metalness: 0,
      roughness: 0.4,
      transparent: true
    }));
    g.add(core);
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
      onReady: opts.onReady,
      preserveDrawingBuffer: true
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

/* ---- app/landing/components/project-preview.jsx ---- */
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
    var setBracket = function setBracket(poly, C, P, N, cx, cy) {
      if (!poly) return;
      var ox = C.x - cx,
        oy = C.y - cy;
      var ol = Math.hypot(ox, oy) || 1;
      var OFF = 7;
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
      setBracket(b[0], TL, BL, TR, cx, cy);
      setBracket(b[1], TR, TL, BR, cx, cy);
      setBracket(b[2], BR, TR, BL, cx, cy);
      setBracket(b[3], BL, BR, TL, cx, cy);
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
  return React.createElement("div", {
    className: "uhud",
    ref: panelRef
  }, React.createElement("svg", {
    className: "uhud__svg",
    ref: svgRef,
    "aria-hidden": "true"
  }, React.createElement("g", {
    className: "uhud__lock",
    key: project.addr
  }, React.createElement("polygon", {
    className: "uhud__outline",
    ref: outlineRef,
    points: "0,0 0,0 0,0 0,0"
  }), React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[0] = n;
    },
    points: ""
  }), React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[1] = n;
    },
    points: ""
  }), React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[2] = n;
    },
    points: ""
  }), React.createElement("polyline", {
    className: "uhud__bk",
    ref: function ref(n) {
      return bkRef.current[3] = n;
    },
    points: ""
  }))), React.createElement("div", {
    className: "uhud__tab",
    ref: tabRef,
    key: "tab-" + project.addr
  }, React.createElement("span", {
    className: "uhud__tabDot"
  }), React.createElement("span", null, "LOCK")));
}
window.UniverseHoverCard = UniverseHoverCard;

/* ---- app/landing/scenes/universe.jsx ---- */
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
window.__mo_fx = Object.assign({
  legRoll: 0.4,
  wheelYield: 420
}, window.__mo_fx || {});
var PROJECTS = (window.MO_PROJECTS || []).filter(function (p) {
  return p.universe !== false;
}).map(function (p) {
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
if (!PROJECTS.length) console.warn("[universe] MO_PROJECTS missing — load app/data/projects.js first");
var MO_FEATURED = window.MO_FEATURED_ADDRS || ["0x01", "0x03", "0x04", "0x06"];
window.UNIVERSE_PROJECTS = PROJECTS;
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
function makeAmbientAtlas(labels, THREE) {
  var atlasW = 2048;
  var atlasH = 512;
  var sourceW = 128;
  var cropY = 48;
  var cropH = 32;
  var cols = 15;
  var strideX = 136;
  var strideY = 42;
  var cc = document.createElement("canvas");
  cc.width = atlasW;
  cc.height = atlasH;
  var xc = cc.getContext("2d");
  var cells = [];
  labels.forEach(function (label, i) {
    var col = i % cols;
    var row = Math.floor(i / cols);
    var x0 = col * strideX + 4;
    var y0 = row * strideY + 5;
    var sourceTop = y0 - cropY;
    xc.save();
    xc.beginPath();
    xc.rect(x0, y0, sourceW, cropH);
    xc.clip();
    xc.strokeStyle = "#00f0c8";
    xc.lineWidth = 2;
    xc.beginPath();
    xc.arc(x0 + 64, sourceTop + 64, 4, 0, Math.PI * 2);
    xc.stroke();
    xc.fillStyle = "#5b6478";
    xc.font = "500 16px 'Geist Mono', monospace";
    xc.textAlign = "left";
    xc.textBaseline = "middle";
    xc.fillText(label, x0 + 76, sourceTop + 64);
    xc.restore();
    cells.push({
      u0: x0 / atlasW,
      v0: 1 - (y0 + cropH) / atlasH,
      u1: (x0 + sourceW) / atlasW,
      v1: 1 - y0 / atlasH
    });
  });
  var texture = new THREE.CanvasTexture(cc);
  texture.colorSpace = THREE.SRGBColorSpace;
  return {
    texture: texture,
    cells: cells,
    cropRatio: cropH / 128
  };
}
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
      tile: "—"
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
  var activeAddrRef = React.useRef(activeAddr);
  React.useEffect(function () {
    modeRef.current = mode;
  }, [mode]);
  React.useEffect(function () {
    focusRef.current = focusAddr;
  }, [focusAddr]);
  React.useEffect(function () {
    activeAddrRef.current = activeAddr;
  }, [activeAddr]);
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
    var _composerAvailable = !!(THREE.EffectComposer && THREE.RenderPass && THREE.OutputPass && window.MOCursorDistortion && window.MOCursorDistortion.createComposerEffect);
    var renderer = new THREE.WebGLRenderer({
      antialias: !_composerAvailable,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    var uniOnScreen = true;
    var uniIO = new IntersectionObserver(function (entries) {
      uniOnScreen = entries[0].isIntersecting;
    }, {
      threshold: 0
    });
    uniIO.observe(mount);
    var scene = new THREE.Scene();
    (function makeBackdrop() {
      var bg = document.createElement("canvas");
      var BG = 512;
      bg.width = bg.height = BG;
      var bx = bg.getContext("2d");
      bx.fillStyle = "#04060d";
      bx.fillRect(0, 0, BG, BG);
      var grad = bx.createRadialGradient(BG / 2, BG / 2, 0, BG / 2, BG / 2, BG / 2 * 0.58);
      grad.addColorStop(0, "rgba(0,240,200,0.06)");
      grad.addColorStop(1, "rgba(0,240,200,0)");
      bx.fillStyle = grad;
      bx.fillRect(0, 0, BG, BG);
      var tex = new THREE.CanvasTexture(bg);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
    })();
    scene.fog = new THREE.Fog(0x04060d, 22, 38);
    var camera = new THREE.PerspectiveCamera(58, w / h, 0.3, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    var _pmrem = null,
      _roomEnvironment = null,
      _environmentTarget = null;
    try {
      _pmrem = new THREE.PMREMGenerator(renderer);
      _roomEnvironment = new THREE.RoomEnvironment();
      _environmentTarget = _pmrem.fromScene(_roomEnvironment, 0.06);
      scene.environment = _environmentTarget.texture;
    } catch (_) {} finally {
      if (_roomEnvironment) {
        if (_roomEnvironment.dispose) _roomEnvironment.dispose();else _roomEnvironment.traverse(function (object) {
          if (object.geometry && object.geometry.dispose) object.geometry.dispose();
          var mats = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
          mats.forEach(function (material) {
            return material && material.dispose && material.dispose();
          });
        });
      }
      if (_pmrem) _pmrem.dispose();
    }
    {
      var _k = new THREE.DirectionalLight(0xffffff, 1.6);
      _k.position.set(2.4, 3.2, 2.6);
      scene.add(_k);
      var _r = new THREE.PointLight(0x00f0c8, 1.6, 36);
      _r.position.set(-3, 1.6, -2);
      scene.add(_r);
    }
    var GRADE = window.__mo_grade = Object.assign({
      aberration: 0.01,
      vignette: 0.34,
      grain: 0.0,
      dof: true,
      focus: 13.4,
      aperture: 0.00025,
      maxblur: 0.0045,
      dofDepthScale: 0.5,
      dofDepthEvery: 2
    }, window.__mo_grade || {});
    var _veryWeak = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2 || navigator.deviceMemory && navigator.deviceMemory <= 2;
    var _isSmall = matchMedia("(max-width: 760px)").matches;
    var _composerDpr = Math.min(window.devicePixelRatio, _isSmall ? 1.25 : 1.5);
    function makeFastBokehPass(BokehPassCtor, dofScene, dofCamera, params) {
      var pass = new BokehPassCtor(dofScene, dofCamera, params);
      pass.renderTargetDepth.dispose();
      pass.renderTargetDepth = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.UnsignedByteType,
        stencilBuffer: false
      });
      pass.renderTargetDepth.texture.name = "FastBokehPass.depth";
      pass.uniforms.tDepth.value = pass.renderTargetDepth.texture;
      pass.uniforms.texel = {
        value: new THREE.Vector2(1 / 1024, 1 / 1024)
      };
      pass.materialBokeh.fragmentShader = ["#include <common>", "varying vec2 vUv;", "uniform sampler2D tColor;", "uniform sampler2D tDepth;", "uniform float maxblur;", "uniform float aperture;", "uniform float nearClip;", "uniform float farClip;", "uniform float focus;", "uniform float aspect;", "uniform vec2 texel;", "#include <packing>", "void main() {", "  float depth = unpackRGBAToDepth( texture2D( tDepth, vUv ) );", "  float viewZ = perspectiveDepthToViewZ( depth, nearClip, farClip );", "  float factor = ( focus + viewZ );", "  float coc = clamp( factor * aperture, -maxblur, maxblur );", "  vec2 rad = vec2( coc * 0.4, coc * 0.4 * aspect );", "  vec4 centre = texture2D( tColor, vUv );", "  if ( abs( rad.x ) < texel.x * 0.75 && abs( rad.y ) < texel.y * 0.75 ) {", "    gl_FragColor = vec4( centre.rgb, 1.0 );", "    return;", "  }", "  vec4 col = centre;", "  col += texture2D( tColor, vUv + vec2(  1.0000,  0.0000 ) * rad );", "  col += texture2D( tColor, vUv + vec2(  0.7071,  0.7071 ) * rad );", "  col += texture2D( tColor, vUv + vec2(  0.0000,  1.0000 ) * rad );", "  col += texture2D( tColor, vUv + vec2( -0.7071,  0.7071 ) * rad );", "  col += texture2D( tColor, vUv + vec2( -1.0000,  0.0000 ) * rad );", "  col += texture2D( tColor, vUv + vec2( -0.7071, -0.7071 ) * rad );", "  col += texture2D( tColor, vUv + vec2(  0.0000, -1.0000 ) * rad );", "  col += texture2D( tColor, vUv + vec2(  0.7071, -0.7071 ) * rad );", "  col += texture2D( tColor, vUv + vec2(  0.5081,  0.2105 ) * rad );", "  col += texture2D( tColor, vUv + vec2( -0.2105,  0.5081 ) * rad );", "  col += texture2D( tColor, vUv + vec2( -0.5081, -0.2105 ) * rad );", "  col += texture2D( tColor, vUv + vec2(  0.2105, -0.5081 ) * rad );", "  gl_FragColor = vec4( ( col / 13.0 ).rgb, 1.0 );", "}"].join("\n");
      pass.materialBokeh.needsUpdate = true;
      pass.depthScale = 0.5;
      pass.depthEvery = 1;
      pass._depthTick = 0;
      pass.setSize = function (width, height) {
        this.uniforms.aspect.value = width / height;
        var dw = Math.max(1, Math.round(width * this.depthScale));
        var dh = Math.max(1, Math.round(height * this.depthScale));
        this.renderTargetDepth.setSize(dw, dh);
        this.uniforms.texel.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
        this._depthTick = 0;
      };
      pass.render = function (renderer, writeBuffer, readBuffer) {
        var every = Math.max(1, this.depthEvery | 0);
        if (this._depthTick % every === 0) {
          this.scene.overrideMaterial = this.materialDepth;
          renderer.getClearColor(this._oldClearColor);
          var oldClearAlpha = renderer.getClearAlpha();
          var oldAutoClear = renderer.autoClear;
          renderer.autoClear = false;
          renderer.setClearColor(0xffffff);
          renderer.setClearAlpha(1.0);
          renderer.setRenderTarget(this.renderTargetDepth);
          renderer.clear();
          renderer.render(this.scene, this.camera);
          this.scene.overrideMaterial = null;
          renderer.setClearColor(this._oldClearColor);
          renderer.setClearAlpha(oldClearAlpha);
          renderer.autoClear = oldAutoClear;
        }
        this._depthTick++;
        this.uniforms.tColor.value = readBuffer.texture;
        this.uniforms.nearClip.value = this.camera.near;
        this.uniforms.farClip.value = this.camera.far;
        if (this.renderToScreen) {
          renderer.setRenderTarget(null);
        } else {
          renderer.setRenderTarget(writeBuffer);
          renderer.clear();
        }
        this.fsQuad.render(renderer);
      };
      return pass;
    }
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
          bokehPass = makeFastBokehPass(BokehPass, scene, camera, {
            focus: GRADE.focus,
            aperture: GRADE.aperture,
            maxblur: GRADE.maxblur
          });
          bokehPass.depthScale = Math.min(1, Math.max(0.25, GRADE.dofDepthScale || 0.5));
          bokehPass.depthEvery = Math.max(1, Math.round(GRADE.dofDepthEvery || 1));
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
    var _lvlS = 0;
    var _lastFov = 58;
    var _focusS = GRADE.focus;
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
    var DOF_MIN_FPS = 30;
    var DOF_WARMUP = 30;
    var DOF_WINDOW = 90;
    var _probeWarm = 0,
      _probeFrames = 0,
      _probeAccum = 0,
      _probeDone = false;
    function probeDoF(dt) {
      if (_probeDone || !bokehPass) return;
      if (!(dt > 0 && dt < 200)) return;
      if (_probeWarm < DOF_WARMUP) {
        _probeWarm++;
        return;
      }
      _probeAccum += dt;
      _probeFrames++;
      if (_probeFrames >= DOF_WINDOW) {
        var avgFps = 1000 / (_probeAccum / _probeFrames);
        window.__mo_dofFps = Math.round(avgFps * 10) / 10;
        if (avgFps < DOF_MIN_FPS) {
          bokehPass.enabled = false;
          window.__mo_dofOn = false;
        }
        _probeDone = true;
      }
    }
    var BOX = new THREE.Vector3(26, 18, 26);
    var TILE_BOX = BOX.clone().multiplyScalar(1.4);
    var TILE_W = 3.0;
    var TILE_H = 4.0;
    var cam = {
      pos: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      vel: 0
    };
    var camTarget = {
      yaw: 0,
      pitch: 0
    };
    var exploreOn = false;
    var exploreAnchor = new THREE.Vector3();
    var exploreViewQ = new THREE.Quaternion();
    var exploreTargetQ = new THREE.Quaternion();
    var exploreEuler = new THREE.Euler(0, 0, 0, "YXZ");
    var PDRIFT = {
      amp: 0.42,
      px: 47,
      py: 31,
      focusDamp: 0.12,
      ease: 0.9
    };
    var pdriftGain = 1;
    var _pdR = new THREE.Vector3(),
      _pdU = new THREE.Vector3();
    var camRollFX = 0;
    var _qCam = new THREE.Quaternion();
    var _qYaw = new THREE.Quaternion();
    var _qPitch = new THREE.Quaternion();
    var _qr = new THREE.Quaternion();
    var _AXIS_X = new THREE.Vector3(1, 0, 0);
    var _AXIS_Y = new THREE.Vector3(0, 1, 0);
    var _AXIS_Z = new THREE.Vector3(0, 0, 1);
    function updateCameraTransform() {
      if (exploreOn) {
        camera.quaternion.copy(exploreViewQ);
        camera.position.copy(exploreAnchor);
        return;
      }
      _qYaw.setFromAxisAngle(_AXIS_Y, cam.yaw);
      _qPitch.setFromAxisAngle(_AXIS_X, cam.pitch);
      _qCam.multiplyQuaternions(_qYaw, _qPitch);
      if (Math.abs(camRollFX) > 0.0004) {
        _qr.setFromAxisAngle(_AXIS_Z, camRollFX);
        _qCam.multiply(_qr);
      }
      camera.quaternion.copy(_qCam);
      camera.position.copy(cam.pos);
    }
    updateCameraTransform();
    var starGeo = new THREE.BufferGeometry();
    var SC = 1400;
    var sPos = new Float32Array(SC * 3);
    for (var i = 0; i < SC; i++) {
      sPos[i * 3 + 0] = (Math.random() - 0.5) * BOX.x * 2;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * BOX.y * 2;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * BOX.z * 2;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478,
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7
    }));
    scene.add(stars);
    stars.frustumCulled = false;
    stars.userData = {
      wrapScale: 2.0
    };
    var tilesGroup = new THREE.Group();
    scene.add(tilesGroup);
    var tiles = [];
    var tileWires = [];
    var goldenAngle = Math.PI * (3 - Math.sqrt(5));
    var FIELD_LAT = 0.55;
    var GREET_POS = new THREE.Vector3(3.3, 1.9, -13.2);
    var GREET_DIR = GREET_POS.clone().normalize();
    var GREET_COS = Math.cos(26 * Math.PI / 180);
    var GREET_CLEAR_R = 21;
    var _placeV = new THREE.Vector3();
    var _placeN = new THREE.Vector3();
    function driftHome(i, out, jitter) {
      if (i === 0) {
        out.copy(GREET_POS);
        return jitter ? out.applyAxisAngle(_AXIS_Y, cam.yaw) : out;
      }
      var n = Math.max(1, projects.length);
      var yN = FIELD_LAT * (1 - (i + 0.5) / n * 2);
      var radial = Math.sqrt(1 - yN * yN);
      var r = jitter ? 0.55 + 0.30 * Math.random() : 0.55 + 0.30 * (i * 13 % 100 / 100);
      var th = i * goldenAngle + (jitter ? (Math.random() - 0.5) * 1.5 : 0);
      for (var guard = 0; guard < 12; guard++) {
        out.set(Math.cos(th) * radial * TILE_BOX.x * r * 0.55, yN * TILE_BOX.y * r * 0.6, Math.sin(th) * radial * TILE_BOX.z * r * 0.55);
        _placeN.copy(out).normalize();
        if (out.length() > GREET_CLEAR_R || _placeN.dot(GREET_DIR) < GREET_COS) break;
        th += 0.62;
      }
      return out;
    }
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
      mesh.position.copy(driftHome(i, _placeV, false));
      mesh.userData = {
        project: p,
        texture: tex,
        kind: "tile",
        index: i,
        offsetYaw: (i * 37 % 100 / 100 - 0.5) * 0.5,
        offsetPitch: (i * 53 % 100 / 100 - 0.5) * 0.3,
        offsetRoll: (i * 29 % 100 / 100 - 0.5) * 0.18,
        wobble: {
          p: i * 17 % 100 / 100,
          a: i * 23 % 100 / 100
        }
      };
      tilesGroup.add(mesh);
      tiles.push(mesh);
      if (p.pcbBoard && window.makeAboutPCBMesh) {
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
          window.fitModelToSize(root, THREE, p.modelFit || 2);
          if (p.assignMaterial && window.applySolidMaterials) window.applySolidMaterials(root, THREE, p.assignMaterial);else if (window.tuneRealMaterials) window.tuneRealMaterials(root, THREE, {
            envMapIntensity: 2.2
          });
          var fadeMaterials = [];
          var seenFadeMaterials = new Set();
          root.traverse(function (o) {
            if (!o.isMesh || !o.material) return;
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
              m.transparent = true;
              if (!seenFadeMaterials.has(m)) {
                seenFadeMaterials.add(m);
                fadeMaterials.push(m);
              }
            });
          });
          var poseGroup = new THREE.Group();
          if (p.modelPose) poseGroup.rotation.set(p.modelPose.x || 0, p.modelPose.y || 0, p.modelPose.z || 0);
          poseGroup.add(root);
          holder.add(poseGroup);
          holder.visible = true;
          holder.userData.loaded = true;
          holder.userData.fadeMaterials = fadeMaterials;
          holder.userData.lastModelOpacity = NaN;
          holder.userData.loadedAt = performance.now();
        })["catch"](function (err) {
          console.warn("[universe] model load failed for " + p.addr, err);
        });
      } else if (p.prim && window.makePrimitiveMesh) {
        var wire = window.makePrimitiveMesh(p.prim, THREE, {
          wireframe: true,
          color: 0x00f0c8,
          opacity: 0.85
        });
        wire.scale.setScalar(0.28);
        wire.userData.parentTile = mesh;
        wire.userData.prim = p.prim;
        wire.userData.addr = p.addr;
        if (p.prim === "cone") wire.rotation.set(0, 0, Math.PI / 2);
        tilesGroup.add(wire);
        tileWires.push(wire);
      }
    });
    var GRID_COLS = 4;
    var GRID_ROWS = 3;
    var GRID_SPACING_X = 5.4;
    var GRID_SPACING_Y = 4.3;
    var GRID_Z = -16;
    var tileTargets = projects.map(function () {
      return new THREE.Vector3();
    });
    var carouselTarget = new THREE.Vector3();
    function scatter(i, R, Y, Z, D) {
      var ang = i / Math.max(1, projects.length) * Math.PI * 2;
      return tileTargets[i].set(Math.cos(ang) * R, Math.sin(ang) * Y, Z + Math.sin(ang * 2) * D);
    }
    function targetForTile(mode, i, t) {
      var target = tileTargets[i];
      if (mode === "dive") {
        return scatter(i, 22, 13, -26, 6);
      }
      if (mode === "origin") {
        var concept = window.__mo_origin && window.__mo_origin.concept || "assembly";
        var m = tiles[i];
        var addr = m && m.userData.project.addr;
        var fIdx = MO_FEATURED.indexOf(addr || "");
        if (concept === "assembly") return scatter(i, 19, 11, -22, 5);
        if (fIdx >= 0) {
          var ang = fIdx / Math.max(1, MO_FEATURED.length) * Math.PI * 2 - Math.PI / 2 + t * 0.00004;
          return target.set(ORIGIN_CENTER.x + Math.cos(ang) * ORIGIN_RING_R, ORIGIN_CENTER.y + Math.sin(ang) * ORIGIN_RING_R * 0.62, ORIGIN_CENTER.z + Math.sin(ang * 1.3) * 1.4);
        }
        return scatter(i, 16, 9, -18, 4);
      }
      if (mode === "reel") {
        var rb = window.__mo_reel || {
          pos: 1
        };
        var pos = rb.pos || 0;
        var g = Math.max(0, Math.min(1, pos - MO_FEATURED.length));
        var m3 = tiles[i];
        var addr3 = m3 && m3.userData.project.addr;
        var rIdx = MO_FEATURED.indexOf(addr3 || "");
        var REEL_DX = 12.5;
        if (rIdx >= 0) {
          target.set((rIdx + 1 - pos) * REEL_DX, 0.62, -10.6);
        } else {
          scatter(i, 20, 11, -25, 5);
        }
        if (g > 0.001) {
          var ang0 = i / Math.max(1, projects.length) * Math.PI * 2;
          var spin = t * 0.00026;
          var entry = (1 - g) * 2.6;
          var _ang = ang0 + spin + entry;
          var R = 7.4;
          carouselTarget.set(Math.sin(_ang) * R, 0.55 - Math.cos(_ang) * 0.95, -12.4 + Math.cos(_ang) * R * 0.82);
          target.lerp(carouselTarget, g * g * (3 - 2 * g));
        }
        return target;
      }
      if (mode === "grid") {
        var col = i % GRID_COLS;
        var row = Math.floor(i / GRID_COLS);
        return target.set((col - (GRID_COLS - 1) / 2) * GRID_SPACING_X, ((GRID_ROWS - 1) / 2 - row) * GRID_SPACING_Y, GRID_Z);
      }
      if (mode === "ambient") {
        return scatter(i, 13, 8, -4, 3);
      }
      return null;
    }
    var ambient = [];
    var AMB_N = 180;
    var AMB_BATCH_N = 12;
    var AMB_SCALE = 1.3;
    var ambientLabels = Array.from({
      length: AMB_N
    }, function (_, i) {
      return "0x" + (0x10 + i).toString(16).toUpperCase().padStart(2, "0");
    });
    var ambientAtlas = makeAmbientAtlas(ambientLabels, THREE);
    var ambientMat = new THREE.MeshBasicMaterial({
      map: ambientAtlas.texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      fog: true
    });
    ambientMat.onBeforeCompile = function (shader) {
      shader.vertexShader = "attribute float aAmbientOpacity; varying float vAmbientOpacity;\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvAmbientOpacity = aAmbientOpacity;");
      shader.fragmentShader = "varying float vAmbientOpacity;\n" + shader.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.a *= vAmbientOpacity;");
    };
    ambientMat.customProgramCacheKey = function () {
      return "mo-ambient-atlas-v1";
    };
    var ambientBatches = [];
    for (var b = 0; b < AMB_BATCH_N; b++) {
      var maxVerts = AMB_N * 4;
      var positions = new Float32Array(maxVerts * 3);
      var uvs = new Float32Array(maxVerts * 2);
      var opacity = new Float32Array(maxVerts);
      var indices = new Uint16Array(AMB_N * 6);
      for (var _i6 = 0; _i6 < AMB_N; _i6++) {
        var v = _i6 * 4;
        var q = _i6 * 6;
        indices[q] = v;
        indices[q + 1] = v + 2;
        indices[q + 2] = v + 1;
        indices[q + 3] = v + 2;
        indices[q + 4] = v + 3;
        indices[q + 5] = v + 1;
      }
      var geo = new THREE.BufferGeometry();
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute("aAmbientOpacity", new THREE.BufferAttribute(opacity, 1).setUsage(THREE.DynamicDrawUsage));
      geo.setDrawRange(0, 0);
      var mesh = new THREE.Mesh(geo, ambientMat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);
      ambientBatches.push({
        mesh: mesh,
        geo: geo,
        positions: positions,
        uvs: uvs,
        opacity: opacity,
        nodes: [],
        depthSum: 0
      });
    }
    for (var _i7 = 0; _i7 < AMB_N; _i7++) {
      ambient.push({
        position: new THREE.Vector3((Math.random() - 0.5) * BOX.x, (Math.random() - 0.5) * BOX.y, (Math.random() - 0.5) * BOX.z),
        userData: {
          phase: Math.random() * Math.PI * 2,
          kind: "ambient",
          atlas: ambientAtlas.cells[_i7],
          opacity: 0.55,
          depth: 0
        }
      });
    }
    var AMB_DEPTH_SPAN = Math.hypot(BOX.x, BOX.y, BOX.z) * 0.5 + AMB_SCALE;
    var ambientRight = new THREE.Vector3();
    var ambientUp = new THREE.Vector3();
    var ORIGIN_CENTER = new THREE.Vector3(0, 0, -9);
    var ORIGIN_RING_R = 6.2;
    function makeOriginTexture() {
      var oc = document.createElement("canvas");
      oc.width = 256;
      oc.height = 256;
      var g = oc.getContext("2d");
      g.clearRect(0, 0, 256, 256);
      var cx = 128,
        cy = 128;
      g.strokeStyle = "#00f0c8";
      for (var _i8 = 0; _i8 < 3; _i8++) {
        g.globalAlpha = 0.9 - _i8 * 0.28;
        g.lineWidth = 2 - _i8 * 0.4;
        g.beginPath();
        g.arc(cx, cy, 30 + _i8 * 26, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
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
      var hits = [];
      for (var y = 0; y < ch; y += 2) {
        for (var x = 0; x < cw; x += 2) {
          if (data[(y * cw + x) * 4] > 128) hits.push([x, y]);
        }
      }
      for (var _i9 = hits.length - 1; _i9 > 0; _i9--) {
        var k = Math.floor(Math.random() * (_i9 + 1));
        var t = hits[_i9];
        hits[_i9] = hits[k];
        hits[k] = t;
      }
      var SCALE = 0.024;
      var out = new Float32Array(count * 3);
      for (var _i0 = 0; _i0 < count; _i0++) {
        var _h = hits.length ? hits[_i0 % hits.length] : [cw / 2, ch / 2];
        var jx = (Math.random() - 0.5) * 1.6;
        var jy = (Math.random() - 0.5) * 1.6;
        out[_i0 * 3 + 0] = ORIGIN_CENTER.x + (_h[0] + jx - cw / 2) * SCALE;
        out[_i0 * 3 + 1] = ORIGIN_CENTER.y - (_h[1] + jy - ch / 2) * SCALE;
        out[_i0 * 3 + 2] = ORIGIN_CENTER.z + Math.sin(_i0 * 12.9898) * 0.22;
      }
      return out;
    }
    var ASM_N = 820;
    var asmTargets = sampleGlyphTargets("0x00", ASM_N);
    var asmLocal = new Float32Array(ASM_N * 3);
    for (var _i1 = 0; _i1 < ASM_N; _i1++) {
      asmLocal[_i1 * 3 + 0] = asmTargets[_i1 * 3 + 0] - ORIGIN_CENTER.x;
      asmLocal[_i1 * 3 + 1] = asmTargets[_i1 * 3 + 1] - ORIGIN_CENTER.y;
      asmLocal[_i1 * 3 + 2] = asmTargets[_i1 * 3 + 2] - ORIGIN_CENTER.z;
    }
    var glyphHalfW = 0;
    for (var _i10 = 0; _i10 < ASM_N; _i10++) glyphHalfW = Math.max(glyphHalfW, Math.abs(asmLocal[_i10 * 3]));
    var glyphFit = 1;
    function fitGlyphToView() {
      var halfW = Math.tan(camera.fov * Math.PI / 360) * Math.abs(ORIGIN_CENTER.z) * camera.aspect;
      glyphFit = Math.min(1, halfW * 0.84 / glyphHalfW);
    }
    fitGlyphToView();
    var asmGeo = new THREE.BufferGeometry();
    var asmPos = new Float32Array(ASM_N * 3);
    var asmHome = new Float32Array(ASM_N * 3);
    for (var _i11 = 0; _i11 < ASM_N; _i11++) {
      var x = (Math.random() - 0.5) * BOX.x;
      var y = (Math.random() - 0.5) * BOX.y;
      var z = (Math.random() - 0.5) * BOX.z;
      asmHome[_i11 * 3 + 0] = asmPos[_i11 * 3 + 0] = x;
      asmHome[_i11 * 3 + 1] = asmPos[_i11 * 3 + 1] = y;
      asmHome[_i11 * 3 + 2] = asmPos[_i11 * 3 + 2] = z;
    }
    asmGeo.setAttribute("position", new THREE.BufferAttribute(asmPos, 3).setUsage(THREE.DynamicDrawUsage));
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
    assemblyPts.frustumCulled = false;
    scene.add(assemblyGroup);
    var TOPO_MAX_E = 26;
    var TOPO_CUT = TILE_BOX.x * 0.5;
    var TOPO_SEG = 24;
    var TOPO_CAMERA_GUARD = Math.max(camera.near * 4, 1.2);
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
    var topoPos = new Float32Array(TOPO_MAX_E * TOPO_SEG * 3);
    var topoT = new Float32Array(TOPO_MAX_E * TOPO_SEG);
    var topoA = new Float32Array(TOPO_MAX_E * TOPO_SEG);
    var topoIndex = new Uint16Array(TOPO_MAX_E * (TOPO_SEG - 1) * 2);
    var topoIndexI = 0;
    for (var e = 0; e < TOPO_MAX_E; e++) {
      var base = e * TOPO_SEG;
      for (var s = 0; s < TOPO_SEG; s++) topoT[base + s] = s / (TOPO_SEG - 1);
      for (var _s = 0; _s < TOPO_SEG - 1; _s++) {
        topoIndex[topoIndexI++] = base + _s;
        topoIndex[topoIndexI++] = base + _s + 1;
      }
    }
    var constGeo = new THREE.BufferGeometry();
    constGeo.setIndex(new THREE.BufferAttribute(topoIndex, 1));
    constGeo.setAttribute("position", new THREE.BufferAttribute(topoPos, 3).setUsage(THREE.DynamicDrawUsage));
    constGeo.setAttribute("aT", new THREE.BufferAttribute(topoT, 1));
    constGeo.setAttribute("aA", new THREE.BufferAttribute(topoA, 1).setUsage(THREE.DynamicDrawUsage));
    var constGroup = new THREE.LineSegments(constGeo, constMat);
    constGroup.frustumCulled = false;
    constGroup.renderOrder = -2;
    constGroup.visible = false;
    scene.add(constGroup);
    var _topoEdges = [];
    var _topoFrame = 0;
    function updateTopology(dt, mode, focusAddrNow, formP, arrFade) {
      var fx = window.__mo_fx.topology != null ? window.__mo_fx.topology : 1;
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
              if (nj < 0 || dd > TOPO_CUT) return 0;
              var a = Math.min(_i12, nj),
                b = Math.max(_i12, nj);
              if (_topoEdges.some(function (e) {
                return e.ai === a && e.bi === b;
              })) return 0;
              _topoEdges.push({
                A: live[a],
                B: live[b],
                ai: a,
                bi: b,
                len: dd
              });
              if (_topoEdges.length >= TOPO_MAX_E) return 1;
            },
            _ret;
          for (var _i13 = 0, _arr = [[n1, d1], [n2, d2]]; _i13 < _arr.length; _i13++) {
            _ret = _loop();
            if (_ret === 0) continue;
            if (_ret === 1) break;
          }
        }
      }
      var breathe = 1 + _lvlS * 1.2;
      for (var _e = 0; _e < TOPO_MAX_E; _e++) {
        var E = _topoEdges[_e];
        var _base = _e * TOPO_SEG;
        if (!E) {
          topoA.fill(0, _base, _base + TOPO_SEG);
          continue;
        }
        var A = E.A.position,
          B = E.B.position;
        var depthA = (A.x - camera.position.x) * FORWARD.x + (A.y - camera.position.y) * FORWARD.y + (A.z - camera.position.z) * FORWARD.z;
        var depthB = (B.x - camera.position.x) * FORWARD.x + (B.y - camera.position.y) * FORWARD.y + (B.z - camera.position.z) * FORWARD.z;
        if (depthA <= TOPO_CAMERA_GUARD || depthB <= TOPO_CAMERA_GUARD) {
          topoA.fill(0, _base, _base + TOPO_SEG);
          continue;
        }
        for (var _s2 = 0; _s2 < TOPO_SEG; _s2++) {
          var t = _s2 / (TOPO_SEG - 1);
          var p = (_base + _s2) * 3;
          topoPos[p] = A.x + (B.x - A.x) * t;
          topoPos[p + 1] = A.y + (B.y - A.y) * t;
          topoPos[p + 2] = A.z + (B.z - A.z) * t;
        }
        var closeness = Math.pow(Math.max(0, 1 - E.len / TOPO_CUT), 1.4);
        var alpha = closeness * breathe;
        var touches = hovAddr && (E.A.userData.project.addr === hovAddr || E.B.userData.project.addr === hovAddr);
        if (touches) alpha = alpha * 2.4 + 0.5;
        alpha *= Math.min(1, Math.min(E.A.material.opacity, E.B.material.opacity) * 1.4);
        topoA.fill(alpha, _base, _base + TOPO_SEG);
      }
      constGeo.attributes.position.needsUpdate = true;
      constGeo.attributes.aA.needsUpdate = true;
    }
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
    var pointerInZone = false;
    var stopDrift = function stopDrift() {
      driftActive = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!exploreOn) driftActive = true;
      }, 3200);
    };
    mount.addEventListener("pointerenter", function () {
      pointerInZone = true;
    });
    mount.addEventListener("pointerleave", function () {
      pointerInZone = false;
    });
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
        if (_pts.size < 2) {
          pinching = false;
          if (gyroOn && exploreOn) rebaseGyroToExploreTarget();
          if (exploreOn && _pts.size === 1) {
            var remaining = _pts.values().next().value;
            dragging = true;
            dragMoved = true;
            lastX = downX = remaining.x;
            lastY = downY = remaining.y;
          }
        }
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
      if (gyroOn && exploreOn) rebaseGyroToExploreTarget();
      if (!dragMoved) handleClick(e.clientX, e.clientY);
    });
    mount.addEventListener("pointercancel", function (e) {
      _pts["delete"](e.pointerId);
      if (_pts.size < 2) {
        pinching = false;
        if (gyroOn && exploreOn) rebaseGyroToExploreTarget();
      }
      dragging = false;
      mount.style.cursor = "grab";
    });
    mount.addEventListener("pointerleave", function () {
      hoverObjRef.current = null;
      setHover(null);
      if (window.MOSound && MOSound.unhover) MOSound.unhover();
    });
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
        if (exploreOn) {
          applyExploreDrag(dx, dy);
        } else {
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
            return;
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
    var gyroOn = false,
      gyroReady = false,
      gyroAnnounced = false;
    var GYRO_NOISE = THREE.MathUtils.degToRad(0.12);
    var gyroEuler = new THREE.Euler(0, 0, 0, "YXZ");
    var gyroOutEuler = new THREE.Euler(0, 0, 0, "YXZ");
    var gyroSensorQ = new THREE.Quaternion();
    var gyroAcceptedQ = new THREE.Quaternion();
    var gyroIncomingQ = new THREE.Quaternion();
    var gyroOffsetQ = new THREE.Quaternion();
    var gyroWorldQ = new THREE.Quaternion();
    var gyroInverseQ = new THREE.Quaternion();
    var gyroScreenQ = new THREE.Quaternion();
    var gyroScreenFixQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    var gyroZ = new THREE.Vector3(0, 0, 1);
    function setExploreTargetFromAngles(yaw, pitch) {
      exploreEuler.set(Math.max(-1.45, Math.min(1.45, pitch)), yaw, 0, "YXZ");
      exploreTargetQ.setFromEuler(exploreEuler).normalize();
    }
    function syncAnglesFromExploreView() {
      exploreEuler.setFromQuaternion(exploreViewQ, "YXZ");
      cam.yaw = nearestAngle(cam.yaw, exploreEuler.y);
      cam.pitch = Math.max(-1.45, Math.min(1.45, exploreEuler.x));
      camTarget.yaw = cam.yaw;
      camTarget.pitch = cam.pitch;
    }
    function screenOrientationRadians() {
      var angle = window.screen && window.screen.orientation && Number.isFinite(window.screen.orientation.angle) ? window.screen.orientation.angle : Number(window.orientation) || 0;
      return THREE.MathUtils.degToRad(angle);
    }
    function sensorQuaternion(e, out) {
      if (!Number.isFinite(e.alpha) || !Number.isFinite(e.beta) || !Number.isFinite(e.gamma)) return false;
      gyroEuler.set(THREE.MathUtils.degToRad(e.beta), THREE.MathUtils.degToRad(e.alpha), -THREE.MathUtils.degToRad(e.gamma), "YXZ");
      out.setFromEuler(gyroEuler);
      out.multiply(gyroScreenFixQ);
      gyroScreenQ.setFromAxisAngle(gyroZ, -screenOrientationRadians());
      out.multiply(gyroScreenQ).normalize();
      return true;
    }
    function levelExploreTargetFromGyro() {
      gyroWorldQ.multiplyQuaternions(gyroOffsetQ, gyroSensorQ).normalize();
      gyroOutEuler.setFromQuaternion(gyroWorldQ, "YXZ");
      var yaw = nearestAngle(camTarget.yaw, gyroOutEuler.y);
      var pitch = Math.max(-1.45, Math.min(1.45, gyroOutEuler.x));
      setExploreTargetFromAngles(yaw, pitch);
    }
    function rebaseGyroToExploreTarget() {
      if (!gyroOn || !gyroReady) return;
      gyroInverseQ.copy(gyroSensorQ).invert();
      gyroOffsetQ.multiplyQuaternions(exploreTargetQ, gyroInverseQ).normalize();
      gyroAcceptedQ.copy(gyroSensorQ);
    }
    function resetGyroCalibration() {
      if (exploreOn) {
        exploreTargetQ.copy(exploreViewQ);
        syncAnglesFromExploreView();
      }
      gyroReady = false;
      gyroAcceptedQ.identity();
    }
    function applyExploreDrag(dx, dy) {
      exploreEuler.setFromQuaternion(exploreTargetQ, "YXZ");
      var yaw = nearestAngle(camTarget.yaw, exploreEuler.y) - dx * 0.0035;
      var pitch = Math.max(-1.45, Math.min(1.45, exploreEuler.x - dy * 0.0035));
      setExploreTargetFromAngles(yaw, pitch);
      camTarget.yaw = yaw;
      camTarget.pitch = pitch;
      if (gyroOn && gyroReady) rebaseGyroToExploreTarget();
    }
    var onGyro = function onGyro(e) {
      if (!gyroOn || !exploreOn || !sensorQuaternion(e, gyroIncomingQ)) return;
      gyroSensorQ.copy(gyroIncomingQ);
      if (!gyroReady) {
        gyroReady = true;
        gyroAcceptedQ.copy(gyroSensorQ);
        gyroInverseQ.copy(gyroSensorQ).invert();
        gyroOffsetQ.multiplyQuaternions(exploreTargetQ, gyroInverseQ).normalize();
        if (!gyroAnnounced) {
          gyroAnnounced = true;
          try {
            window.dispatchEvent(new CustomEvent("mo:gyroOn"));
          } catch (_) {}
        }
        return;
      }
      if (dragging || pinching) return;
      if (gyroAcceptedQ.angleTo(gyroSensorQ) < GYRO_NOISE) return;
      gyroAcceptedQ.copy(gyroSensorQ);
      levelExploreTargetFromGyro();
    };
    var onGyroFrameChange = function onGyroFrameChange() {
      if (gyroOn) resetGyroCalibration();
    };
    var onGyroVisibility = function onGyroVisibility() {
      if (!document.hidden && gyroOn) resetGyroCalibration();
    };
    window.addEventListener("deviceorientation", onGyro, true);
    window.addEventListener("orientationchange", onGyroFrameChange, {
      passive: true
    });
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener("change", onGyroFrameChange);
    }
    document.addEventListener("visibilitychange", onGyroVisibility);
    window.__mo_universe = {
      tileBounds: function tileBounds(addr) {
        if (!addr) return null;
        var mb = modelViewportBounds(addr);
        if (onScreenBox(mb)) return mb;
        var m = tiles.find(function (t) {
          return t.userData && t.userData.project && t.userData.project.addr === addr;
        });
        if (!m || !m.visible) return null;
        var b = tileViewportBounds(m);
        return onScreenBox(b) ? b : null;
      },
      fly: function fly(v) {
        cam.vel = Math.max(-22, Math.min(22, cam.vel + v));
        stopDrift();
        fireInteract();
      },
      setExplore: function setExplore(on) {
        var next = !!on;
        mount.style.touchAction = next ? "none" : "pan-y pinch-zoom";
        if (next === exploreOn) return;
        if (next) {
          exploreOn = true;
          clearTimeout(idleTimer);
          driftActive = false;
          cam.vel = 0;
          camRollFX = 0;
          pdriftGain = PDRIFT.focusDamp;
          exploreAnchor.copy(cam.pos);
          exploreEuler.set(cam.pitch, cam.yaw, 0, "YXZ");
          exploreViewQ.setFromEuler(exploreEuler).normalize();
          exploreTargetQ.copy(exploreViewQ);
          resetGyroCalibration();
          fireInteract();
        } else {
          var _iterator4 = _createForOfIteratorHelper(_pts.keys()),
            _step4;
          try {
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
              var pointerId = _step4.value;
              try {
                if (!mount.hasPointerCapture || mount.hasPointerCapture(pointerId)) {
                  mount.releasePointerCapture(pointerId);
                }
              } catch (_) {}
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }
          _pts.clear();
          dragging = false;
          dragMoved = false;
          pinching = false;
          mount.style.cursor = "grab";
          syncAnglesFromExploreView();
          exploreOn = false;
          cam.vel = 0;
          stopDrift();
          updateCameraTransform();
        }
      },
      setGyro: function setGyro(on) {
        gyroOn = !!on;
        gyroAnnounced = false;
        resetGyroCalibration();
      },
      isGyro: function isGyro() {
        return gyroOn;
      },
      isGyroActive: function isGyroActive() {
        return gyroOn && gyroReady;
      },
      recenterGyro: function recenterGyro() {
        if (gyroOn && gyroReady) rebaseGyroToExploreTarget();
      }
    };
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    function pickAt(clientX, clientY) {
      var rect = mount.getBoundingClientRect();
      ndc.x = (clientX - rect.left) / rect.width * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      var hits = raycaster.intersectObjects(tiles, false);
      var _iterator5 = _createForOfIteratorHelper(hits),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var _h2 = _step5.value;
          var op = _h2.object && _h2.object.material && _h2.object.material.opacity;
          if (op == null || op > 0.12) return _h2;
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      return null;
    }
    var v3 = new THREE.Vector3();
    var camDirTmp = new THREE.Vector3();
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
      var _iterator6 = _createForOfIteratorHelper(_tsbCorners),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var c = _step6.value;
          v3.copy(c);
          mesh.localToWorld(v3);
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
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
      };
    }
    function tileViewportBounds(mesh) {
      var b = tileScreenBounds(mesh);
      if (!b) return null;
      var rect = mount.getBoundingClientRect();
      return {
        x: b.x + rect.left,
        y: b.y + rect.top,
        w: b.w,
        h: b.h
      };
    }
    function onScreenBox(b) {
      return !!b && b.w >= 8 && b.h >= 8 && b.x + b.w > 0 && b.y + b.h > 0 && b.x < window.innerWidth && b.y < window.innerHeight;
    }
    var _mvbBox = new THREE.Box3();
    function modelViewportBounds(addr) {
      var holder = tileWires.find(function (o) {
        return o.userData && o.userData.isModel && o.userData.addr === addr && o.userData.loaded && o.visible;
      });
      if (!holder) return null;
      _mvbBox.setFromObject(holder);
      if (_mvbBox.isEmpty()) return null;
      var rect = mount.getBoundingClientRect();
      camera.getWorldDirection(camDirTmp);
      var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (var _i14 = 0; _i14 < 8; _i14++) {
        v3.set(_i14 & 1 ? _mvbBox.max.x : _mvbBox.min.x, _i14 & 2 ? _mvbBox.max.y : _mvbBox.min.y, _i14 & 4 ? _mvbBox.max.z : _mvbBox.min.z);
        _tsbCamRel.copy(v3).sub(camera.position);
        if (_tsbCamRel.dot(camDirTmp) <= 0) return null;
        v3.project(camera);
        var sx = (v3.x * 0.5 + 0.5) * rect.width + rect.left;
        var sy = (-v3.y * 0.5 + 0.5) * rect.height + rect.top;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
      return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        isModel: true
      };
    }
    var _tscCorners = [new THREE.Vector3(-_tsbHW, _tsbHH, 0), new THREE.Vector3(_tsbHW, _tsbHH, 0), new THREE.Vector3(_tsbHW, -_tsbHH, 0), new THREE.Vector3(-_tsbHW, -_tsbHH, 0)];
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
      for (var _i15 = 0; _i15 < 4; _i15++) {
        v3.copy(_tscCorners[_i15]);
        mesh.localToWorld(v3);
        _tsbCamRel.copy(v3).sub(camera.position);
        if (_tsbCamRel.dot(camDirTmp) <= 0) return null;
        v3.project(camera);
        _tscOut[_i15].x = (v3.x * 0.5 + 0.5) * rect.width;
        _tscOut[_i15].y = (-v3.y * 0.5 + 0.5) * rect.height;
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
      if (hoverObjRef.current === m) return;
      var screen = tileScreenBounds(m);
      if (!screen) return;
      hoverObjRef.current = m;
      setHover({
        project: m.userData.project,
        screen: screen
      });
      if (window.__mo_disturb) window.__mo_disturb(cx, cy, 0.3);
      if (window.MOSound && MOSound.hover) {
        MOSound.unhover();
        MOSound.hover(m.userData.project.addr);
      }
    }
    function handleClick(cx, cy) {
      var hit = pickAt(cx, cy);
      if (!hit) return;
      fireInteract();
      if (window.__mo_disturb) window.__mo_disturb(cx, cy, 1.0);
      var m = hit.object;
      var p = m.userData.project;
      if (window.MOSound && MOSound.open) MOSound.open(p.addr);
      var rel = m.position.clone().sub(cam.pos);
      var yaw = Math.atan2(rel.x, -rel.z);
      var flat = Math.sqrt(rel.x * rel.x + rel.z * rel.z);
      var pitch = Math.atan2(rel.y, flat);
      camTarget.yaw = nearestAngle(camTarget.yaw, yaw);
      camTarget.pitch = Math.max(-1.45, Math.min(1.45, pitch));
      if (p.file) {
        cam.vel = Math.max(cam.vel, 6);
        var _mb = modelViewportBounds(p.addr);
        var originRect = onScreenBox(_mb) ? _mb : tileViewportBounds(m);
        navigateToProject(p, originRect);
        return;
      }
      cam.vel = Math.max(cam.vel, 0);
      setActiveAddr(p.addr);
      if (onActive) onActive(p);
      stopDrift();
    }
    function navigateToProject(p, originRect) {
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
    var onResize = function onResize() {
      var s = sz();
      w = s.w;
      h = s.h;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      fitGlyphToView();
      if (cursorFx) cursorFx.resize(w, h);
      if (composer) composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    var ro = new ResizeObserver(onResize);
    ro.observe(mount);
    var raf;
    var last = performance.now();
    var frameI = 0;
    var FORWARD = new THREE.Vector3();
    var frameLerp = function frameLerp(rate, dt) {
      return 1 - Math.pow(1 - rate, dt / 16);
    };
    var _camDir = new THREE.Vector3();
    var _off = new THREE.Vector3();
    var _localOff = new THREE.Vector3();
    var _lookM = new THREE.Matrix4();
    var _baseQ = new THREE.Quaternion();
    var _offQ = new THREE.Quaternion();
    var _euler = new THREE.Euler();
    var _vScale = new THREE.Vector3();
    var SBOX = BOX.clone().multiplyScalar(stars.userData.wrapScale);
    var REBASE_DIST2 = 600 * 600;
    function shiftBufferAttr(attr, sx, sy, sz) {
      var a = attr.array;
      for (var _i16 = 0; _i16 < a.length; _i16 += 3) {
        a[_i16] -= sx;
        a[_i16 + 1] -= sy;
        a[_i16 + 2] -= sz;
      }
      attr.needsUpdate = true;
    }
    function rebaseWorld() {
      var sx = cam.pos.x,
        sy = cam.pos.y,
        sz = cam.pos.z;
      cam.pos.set(0, 0, 0);
      camera.position.copy(cam.pos);
      var _iterator7 = _createForOfIteratorHelper(tiles),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var m = _step7.value;
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
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      var _iterator8 = _createForOfIteratorHelper(ambient),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var sp = _step8.value;
          sp.position.x -= sx;
          sp.position.y -= sy;
          sp.position.z -= sz;
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      shiftBufferAttr(stars.geometry.attributes.position, sx, sy, sz);
      var aArr = assemblyPts.geometry.attributes.position.array;
      for (var _i17 = 0; _i17 < aArr.length; _i17 += 3) {
        aArr[_i17] -= sx;
        aArr[_i17 + 1] -= sy;
        aArr[_i17 + 2] -= sz;
        asmHome[_i17] -= sx;
        asmHome[_i17 + 1] -= sy;
        asmHome[_i17 + 2] -= sz;
      }
      _fieldCam.set(0, 0, 0);
      assemblyPts.geometry.attributes.position.needsUpdate = true;
    }
    function wrapAssemblyField(arr, home, box) {
      for (var _i18 = 0; _i18 < home.length; _i18 += 3) {
        var dx = home[_i18] - cam.pos.x;
        var dy = home[_i18 + 1] - cam.pos.y;
        var dz = home[_i18 + 2] - cam.pos.z;
        if (dx > box.x / 2) {
          home[_i18] -= box.x;
          arr[_i18] -= box.x;
        } else if (dx < -box.x / 2) {
          home[_i18] += box.x;
          arr[_i18] += box.x;
        }
        if (dy > box.y / 2) {
          home[_i18 + 1] -= box.y;
          arr[_i18 + 1] -= box.y;
        } else if (dy < -box.y / 2) {
          home[_i18 + 1] += box.y;
          arr[_i18 + 1] += box.y;
        }
        if (dz > box.z / 2) {
          home[_i18 + 2] -= box.z;
          arr[_i18 + 2] -= box.z;
        } else if (dz < -box.z / 2) {
          home[_i18 + 2] += box.z;
          arr[_i18 + 2] += box.z;
        }
      }
    }
    var prevMode = mode;
    var flowSm = 0;
    var FLOW_RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var formActual = 0;
    var _glyphC = new THREE.Vector3();
    var _fieldCam = new THREE.Vector3();
    function scatterTiles() {
      var _iterator9 = _createForOfIteratorHelper(tiles),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var m = _step9.value;
          var _v = driftHome(m.userData.index, new THREE.Vector3(), true);
          m.userData.driftTarget = _v.add(cam.pos);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
    }
    function frame(now) {
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
      var lvlT = window.MOSound && window.MOSound.getLevel && !window.MOSound.isMuted() ? window.MOSound.getLevel() : 0;
      _lvlS += (lvlT - _lvlS) * (1 - Math.pow(0.86, dt / 16));
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
      if (!exploreOn && mode === "drift" && !_idleFired && now - _lastAct > 30000 && !ARR.t0) {
        _idleFired = true;
        var nearTile = null,
          nd = Infinity;
        var _iterator0 = _createForOfIteratorHelper(tiles),
          _step0;
        try {
          for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
            var m = _step0.value;
            var d = m.position.distanceToSquared(camera.position);
            if (d > 9 && d < nd) {
              nd = d;
              nearTile = m;
            }
          }
        } catch (err) {
          _iterator0.e(err);
        } finally {
          _iterator0.f();
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
      if (mode !== prevMode) {
        if (mode === "drift" && (prevMode === "grid" || prevMode === "reel" || prevMode === "ambient" || prevMode === "origin" || prevMode === "dive")) {
          scatterTiles();
        }
        prevMode = mode;
      }
      if (!exploreOn && !FLOW_RM && driftActive && mode === "drift") {
        cam.vel += dt * 0.0008;
        camTarget.yaw += dt * 0.000035;
        camTarget.pitch += Math.sin(now * 0.00022) * dt * 0.00003;
      }
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
        if (!exploreOn && _flTransit && !FLOW_RM) {
          var tt = Math.max(0, Math.min(1, _fl.t || 0));
          var bell = Math.sin(Math.PI * tt);
          flowTarget = (3.4 + Math.min(24, _fl.speed || 0) * 0.6) * bell * styleMul * warpMul;
          var legRoll = _fl.seg === "toWork" ? 1 : _fl.seg === "toAbout" ? -0.7 : -0.45;
          var legRollMul = window.__mo_fx && window.__mo_fx.legRoll != null ? window.__mo_fx.legRoll : 1;
          rollTarget = legRoll * 0.055 * bell * styleMul * Math.min(1.3, warpMul) * legRollMul;
        }
        flowSm += (flowTarget - flowSm) * (1 - Math.pow(0.90, dt / 16));
        camRollFX += (rollTarget - camRollFX) * (1 - Math.pow(0.93, dt / 16));
        if (!exploreOn && flowSm > 0.02) {
          var _d = flowSm * dt / 1000;
          _flowDX = -Math.sin(cam.yaw) * _d;
          _flowDZ = -Math.cos(cam.yaw) * _d;
          _flowDY = 0;
          shiftBufferAttr(stars.geometry.attributes.position, _flowDX, _flowDY, _flowDZ);
          stars.geometry.attributes.position.needsUpdate = true;
          var _iterator1 = _createForOfIteratorHelper(ambient),
            _step1;
          try {
            for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
              var sp = _step1.value;
              sp.position.x -= _flowDX;
              sp.position.z -= _flowDZ;
            }
          } catch (err) {
            _iterator1.e(err);
          } finally {
            _iterator1.f();
          }
          if (mode === "drift") {
            var _iterator10 = _createForOfIteratorHelper(tiles),
              _step10;
            try {
              for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                var _m = _step10.value;
                if (_m.userData.driftTarget) continue;
                _m.position.x -= _flowDX;
                _m.position.z -= _flowDZ;
              }
            } catch (err) {
              _iterator10.e(err);
            } finally {
              _iterator10.f();
            }
          }
        } else if (exploreOn || !_flTransit) {
          _flowDX = _flowDY = _flowDZ = 0;
          if (exploreOn) {
            flowSm = 0;
            camRollFX = 0;
          }
        }
      }
      if (!exploreOn && isArranged) {
        cam.vel *= Math.pow(0.86, dt / 16);
        camTarget.yaw *= Math.pow(0.92, dt / 16);
        camTarget.pitch *= Math.pow(0.92, dt / 16);
        cam.pos.multiplyScalar(Math.pow(0.94, dt / 16));
      }
      if (exploreOn) {
        cam.vel *= Math.pow(0.92, dt / 16);
        if (Math.abs(cam.vel) < 0.04) cam.vel = 0;
        camRollFX = 0;
        cam.pos.copy(exploreAnchor);
        var orbitAngle = exploreViewQ.angleTo(exploreTargetQ);
        if (orbitAngle > 0.00001) {
          var response = THREE.MathUtils.clamp((orbitAngle - THREE.MathUtils.degToRad(1)) / THREE.MathUtils.degToRad(14), 0, 1);
          var tau = THREE.MathUtils.lerp(0.11, 0.045, response);
          exploreViewQ.slerp(exploreTargetQ, 1 - Math.exp(-(dt / 1000) / tau)).normalize();
        } else {
          exploreViewQ.copy(exploreTargetQ);
        }
        syncAnglesFromExploreView();
        updateCameraTransform();
        camera.getWorldDirection(FORWARD);
        exploreAnchor.addScaledVector(FORWARD, cam.vel * dt / 1000);
        cam.pos.copy(exploreAnchor);
        camera.position.copy(exploreAnchor);
      } else {
        cam.vel *= Math.pow(0.92, dt / 16);
        if (Math.abs(cam.vel) < 0.04) cam.vel = 0;
        var k = 1 - Math.pow(0.001, dt / 1000);
        cam.yaw += (camTarget.yaw - cam.yaw) * k;
        cam.pitch += (camTarget.pitch - cam.pitch) * k;
        cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch));
        updateCameraTransform();
        camera.getWorldDirection(FORWARD);
        cam.pos.addScaledVector(FORWARD, cam.vel * dt / 1000);
        if (PDRIFT.amp > 0 && !FLOW_RM) {
          var wantGain = mode === "drift" && driftActive && !dragging && !activeAddrRef.current && !hoverObjRef.current ? 1 : PDRIFT.focusDamp;
          var gainRate = wantGain < pdriftGain ? 8 : PDRIFT.ease;
          pdriftGain += (wantGain - pdriftGain) * (1 - Math.exp(-gainRate * dt / 1000));
          var _s3 = dt / 1000;
          var wx = Math.PI * 2 / PDRIFT.px,
            wy = Math.PI * 2 / PDRIFT.py;
          var vx = Math.cos(now / 1000 * wx) * PDRIFT.amp * pdriftGain;
          var vy = Math.cos(now / 1000 * wy + 1.7) * PDRIFT.amp * 0.55 * pdriftGain;
          _pdR.set(1, 0, 0).applyQuaternion(camera.quaternion);
          _pdU.set(0, 1, 0).applyQuaternion(camera.quaternion);
          cam.pos.addScaledVector(_pdR, vx * _s3);
          cam.pos.addScaledVector(_pdU, vy * _s3);
        }
        camera.position.copy(cam.pos);
        if (cam.pos.lengthSq() > REBASE_DIST2) rebaseWorld();
      }
      if (mode === "drift") {
        var _iterator11 = _createForOfIteratorHelper(tiles),
          _step11;
        try {
          for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
            var _m2 = _step11.value;
            var dt2 = _m2.userData.driftTarget;
            if (dt2) {
              var rate = 0.025;
              _m2.position.lerp(dt2, 1 - Math.pow(1 - rate, dt / 16));
              if (_m2.position.distanceToSquared(dt2) < 0.09) {
                _m2.userData.driftTarget = null;
              }
            } else {
              wrapAroundCamera(_m2, TILE_BOX);
            }
          }
        } catch (err) {
          _iterator11.e(err);
        } finally {
          _iterator11.f();
        }
      }
      var _iterator12 = _createForOfIteratorHelper(ambient),
        _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var _sp2 = _step12.value;
          wrapAroundCamera(_sp2, BOX);
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      wrapPointsAroundCamera(stars, SBOX);
      camera.getWorldDirection(_camDir);
      var _iterator13 = _createForOfIteratorHelper(tileWires),
        _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
          var wire = _step13.value;
          var parent = wire.userData.parentTile;
          if (!parent) continue;
          var isModel = !!wire.userData.isModel;
          var forwardDist = isModel ? 1.4 : 0.6;
          _off.copy(_camDir).multiplyScalar(-forwardDist);
          var modelOffset = isModel ? parent.userData.project.modelOffset : null;
          _localOff.set(modelOffset ? modelOffset.x || 0 : 0, isModel ? modelOffset ? modelOffset.y || 0 : 0 : parent.scale.y * 1.05, modelOffset ? modelOffset.z || 0 : 0).applyQuaternion(parent.quaternion);
          wire.position.set(parent.position.x + _off.x + _localOff.x, parent.position.y + _off.y + _localOff.y, parent.position.z + _off.z + _localOff.z);
          if (!FLOW_RM && isModel) {
            wire.rotation.y += dt * 0.00015;
          } else if (!FLOW_RM && wire.userData.prim === "cone") {
            wire.rotation.y += dt * 0.00072;
          } else if (!FLOW_RM) {
            wire.rotation.y += dt * 0.0006;
            wire.rotation.x += dt * 0.00024;
          }
          var tileOp = parent.material.opacity;
          var overlayOp = Math.min(0.95, tileOp * 1.15);
          if (isModel) {
            if (wire.userData.loaded) {
              var mFade = THREE.MathUtils.smoothstep(now - (wire.userData.loadedAt || now), 0, 600);
              var modelTileOp = parent.userData.modelOpacityBase != null ? parent.userData.modelOpacityBase : tileOp;
              var modelOp = Math.min(1, modelTileOp * 1.15) * mFade;
              wire.visible = modelOp > 0.02;
              if (modelOp !== wire.userData.lastModelOpacity) {
                var fadeMaterials = wire.userData.fadeMaterials || [];
                var _iterator19 = _createForOfIteratorHelper(fadeMaterials),
                  _step19;
                try {
                  for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                    var material = _step19.value;
                    material.opacity = modelOp;
                  }
                } catch (err) {
                  _iterator19.e(err);
                } finally {
                  _iterator19.f();
                }
                wire.userData.lastModelOpacity = modelOp;
              }
            }
          } else {
            wire.material.opacity = overlayOp;
          }
          var isFocused = focusAddrNow && wire.userData.addr === focusAddrNow;
          var baseScale = isModel ? 0.85 : 0.28;
          var focusScale = isModel ? 1.10 : 0.42;
          var targetScale = isFocused ? focusScale : baseScale;
          wire.scale.lerp(_vScale.set(targetScale, targetScale, targetScale), frameLerp(0.10, dt));
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      var _iterator14 = _createForOfIteratorHelper(tiles),
        _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var _m3 = _step14.value;
          var target = targetForTile(mode, _m3.userData.index, now);
          if (target) {
            var _rate = mode === "reel" ? 0.18 : mode === "grid" ? 0.055 : 0.025;
            _m3.position.lerp(target, 1 - Math.pow(1 - _rate, dt / 16));
          }
          _lookM.lookAt(camera.position, _m3.position, camera.up);
          _baseQ.setFromRotationMatrix(_lookM);
          var offFactor = mode === "grid" || mode === "reel" ? 0.15 : 1.0;
          _euler.set(_m3.userData.offsetPitch * offFactor, _m3.userData.offsetYaw * offFactor, (_m3.userData.offsetRoll + Math.sin(now * 0.0006 + _m3.userData.wobble.p * 6) * 0.04) * offFactor, "YXZ");
          _offQ.setFromEuler(_euler);
          _baseQ.multiply(_offQ);
          _m3.quaternion.slerp(_baseQ, frameLerp(mode === "grid" || mode === "reel" ? 0.12 : 0.06, dt));
          var dist = _m3.position.distanceTo(camera.position);
          var nearIn = void 0,
            farOut = void 0;
          if (mode === "grid") {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.0, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 26, 40);
          } else if (mode === "reel") {
            var rg = Math.max(0, Math.min(1, ((window.__mo_reel || {}).pos || 0) - MO_FEATURED.length));
            nearIn = THREE.MathUtils.smoothstep(dist, 2.0, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 13 + rg * 4, 16.5 + rg * 9.5);
          } else if (mode === "ambient") {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 18, 28);
          } else if (mode === "drift") {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            var ex = Math.abs(_m3.position.x - camera.position.x) / (TILE_BOX.x / 2);
            var ey = Math.abs(_m3.position.y - camera.position.y) / (TILE_BOX.y / 2);
            var ez = Math.abs(_m3.position.z - camera.position.z) / (TILE_BOX.z / 2);
            var edge = Math.max(ex, ey, ez);
            farOut = THREE.MathUtils.smoothstep(edge, 0.95, 1.0);
          } else if (mode === "dive") {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 20, 32);
          } else {
            nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
            farOut = THREE.MathUtils.smoothstep(dist, 34, 48);
          }
          var _opacity = nearIn * (1 - farOut);
          var modelOpacityBase = _opacity;
          if (mode === "ambient") _opacity *= 0.38;
          if (mode === "grid") _opacity *= 0.92;
          if (mode === "reel") _opacity *= 0.96;
          var _isFocused = focusAddrNow && _m3.userData.project.addr === focusAddrNow;
          if (_isFocused) {
            _opacity = Math.min(1, _opacity * 1.6 + 0.25);
            modelOpacityBase = Math.min(1, modelOpacityBase * 1.6 + 0.25);
            _m3.scale.lerp(_vScale.set(1.18, 1.18, 1), frameLerp(0.14, dt));
          } else {
            _m3.scale.lerp(_vScale.set(1, 1, 1), frameLerp(0.10, dt));
          }
          var uD = _m3.userData;
          var opK = frameLerp(0.10, dt);
          uD.opSm = uD.opSm == null ? _opacity : uD.opSm + (_opacity - uD.opSm) * opK;
          uD.mobSm = uD.mobSm == null ? modelOpacityBase : uD.mobSm + (modelOpacityBase - uD.mobSm) * opK;
          _m3.material.opacity = uD.opSm * arrFade;
          uD.modelOpacityBase = uD.mobSm * arrFade;
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
      var _iterator15 = _createForOfIteratorHelper(ambientBatches),
        _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
          var batch = _step15.value;
          batch.nodes.length = 0;
          batch.depthSum = 0;
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      ambientRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      ambientUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      var _iterator16 = _createForOfIteratorHelper(ambient),
        _step16;
      try {
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
          var _sp3 = _step16.value;
          var phase = _sp3.userData.phase + now * 0.0008;
          var _dist = _sp3.position.distanceTo(camera.position);
          var _nearIn = THREE.MathUtils.smoothstep(_dist, 1.5, 5.0);
          var _ex = Math.abs(_sp3.position.x - camera.position.x) / (BOX.x / 2);
          var _ey = Math.abs(_sp3.position.y - camera.position.y) / (BOX.y / 2);
          var _ez = Math.abs(_sp3.position.z - camera.position.z) / (BOX.z / 2);
          var _farOut = THREE.MathUtils.smoothstep(Math.max(_ex, _ey, _ez), 0.95, 1.0);
          var _pulse = 0.65 + Math.sin(phase) * 0.20;
          var aOp = _pulse * _nearIn * (1 - _farOut);
          if (mode !== "drift") aOp *= 0.35;
          aOp *= arrFade;
          _sp3.userData.opacity = aOp;
          var depth = (_sp3.position.x - camera.position.x) * FORWARD.x + (_sp3.position.y - camera.position.y) * FORWARD.y + (_sp3.position.z - camera.position.z) * FORWARD.z;
          _sp3.userData.depth = depth;
          if (aOp <= 0.001 || depth <= camera.near) continue;
          var depthT = Math.max(0, Math.min(0.999999, (depth - camera.near) / AMB_DEPTH_SPAN));
          var _batch = ambientBatches[Math.floor(depthT * AMB_BATCH_N)];
          _batch.nodes.push(_sp3);
          _batch.depthSum += depth;
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }
      var halfW = AMB_SCALE * 0.5;
      var halfH = AMB_SCALE * ambientAtlas.cropRatio * 0.5;
      var rx = ambientRight.x * halfW,
        ry = ambientRight.y * halfW,
        rz = ambientRight.z * halfW;
      var ux = ambientUp.x * halfH,
        uy = ambientUp.y * halfH,
        uz = ambientUp.z * halfH;
      var _iterator17 = _createForOfIteratorHelper(ambientBatches),
        _step17;
      try {
        for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
          var _batch2 = _step17.value;
          var count = _batch2.nodes.length;
          _batch2.mesh.visible = count > 0;
          _batch2.geo.setDrawRange(0, count * 6);
          if (!count) continue;
          _batch2.nodes.sort(function (a, b) {
            return b.userData.depth - a.userData.depth;
          });
          var meanDepth = _batch2.depthSum / count;
          _batch2.mesh.position.copy(camera.position).addScaledVector(FORWARD, meanDepth);
          var ox = _batch2.mesh.position.x,
            oy = _batch2.mesh.position.y,
            oz = _batch2.mesh.position.z;
          for (var _i24 = 0; _i24 < count; _i24++) {
            var _sp4 = _batch2.nodes[_i24];
            var c = _sp4.userData.atlas;
            var _x = _sp4.position.x - ox,
              _y = _sp4.position.y - oy,
              _z = _sp4.position.z - oz;
            var p = _i24 * 12;
            _batch2.positions[p] = _x - rx + ux;
            _batch2.positions[p + 1] = _y - ry + uy;
            _batch2.positions[p + 2] = _z - rz + uz;
            _batch2.positions[p + 3] = _x + rx + ux;
            _batch2.positions[p + 4] = _y + ry + uy;
            _batch2.positions[p + 5] = _z + rz + uz;
            _batch2.positions[p + 6] = _x - rx - ux;
            _batch2.positions[p + 7] = _y - ry - uy;
            _batch2.positions[p + 8] = _z - rz - uz;
            _batch2.positions[p + 9] = _x + rx - ux;
            _batch2.positions[p + 10] = _y + ry - uy;
            _batch2.positions[p + 11] = _z + rz - uz;
            var u = _i24 * 8;
            _batch2.uvs[u] = c.u0;
            _batch2.uvs[u + 1] = c.v1;
            _batch2.uvs[u + 2] = c.u1;
            _batch2.uvs[u + 3] = c.v1;
            _batch2.uvs[u + 4] = c.u0;
            _batch2.uvs[u + 5] = c.v0;
            _batch2.uvs[u + 6] = c.u1;
            _batch2.uvs[u + 7] = c.v0;
            var a = _i24 * 4;
            _batch2.opacity[a] = _sp4.userData.opacity;
            _batch2.opacity[a + 1] = _sp4.userData.opacity;
            _batch2.opacity[a + 2] = _sp4.userData.opacity;
            _batch2.opacity[a + 3] = _sp4.userData.opacity;
          }
          var positionAttr = _batch2.geo.attributes.position;
          var uvAttr = _batch2.geo.attributes.uv;
          var opacityAttr = _batch2.geo.attributes.aAmbientOpacity;
          if (positionAttr.clearUpdateRanges) {
            positionAttr.clearUpdateRanges();
            uvAttr.clearUpdateRanges();
            opacityAttr.clearUpdateRanges();
            positionAttr.addUpdateRange(0, count * 4 * 3);
            uvAttr.addUpdateRange(0, count * 4 * 2);
            opacityAttr.addUpdateRange(0, count * 4);
          }
          positionAttr.needsUpdate = true;
          uvAttr.needsUpdate = true;
          opacityAttr.needsUpdate = true;
        }
      } catch (err) {
        _iterator17.e(err);
      } finally {
        _iterator17.f();
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
      {
        var ob = window.__mo_origin || {
          p: 0,
          active: false,
          concept: "assembly"
        };
        var concept = ob.concept || "assembly";
        var op = Math.max(0, Math.min(1, ob.p || 0));
        var eP = op < 0.5 ? 2 * op * op : 1 - Math.pow(-2 * op + 2, 2) / 2;
        var showHub = mode === "origin" && concept === "hub";
        originGroup.visible = showHub;
        if (showHub) {
          originHub.material.opacity = 0.25 + eP * 0.75;
          var pulse = 1 + Math.sin(now * 0.0025) * 0.04;
          originHub.scale.set(4.2 * pulse, 4.2 * pulse, 1);
          var _iterator18 = _createForOfIteratorHelper(originLinks),
            _step18;
          try {
            for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
              var link = _step18.value;
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
            _iterator18.e(err);
          } finally {
            _iterator18.f();
          }
        }
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
          igE = igT * igT;
        } else if (window.__mo_dive && window.__mo_dive._t0) {
          window.__mo_dive._t0 = 0;
          window.__mo_dive.igniting = false;
        }
        var formTarget = 0;
        if (inDive) formTarget = 0.35 + eD * 0.65;else if (ob.active && concept !== "hub") formTarget = eP;
        formActual += (formTarget - formActual) * frameLerp(0.09, dt);
        if (formActual < 0.0015 && formTarget === 0) formActual = 0;
        var formP = formActual;
        var arr = assemblyPts.geometry.attributes.position.array;
        var _fdx = cam.pos.x - _fieldCam.x;
        var _fdy = cam.pos.y - _fieldCam.y;
        var _fdz = cam.pos.z - _fieldCam.z;
        _fieldCam.copy(cam.pos);
        if ((formP >= 0.0015 || isArranged) && (_fdx || _fdy || _fdz)) {
          for (var _i19 = 0; _i19 < ASM_N * 3; _i19 += 3) {
            asmHome[_i19] += _fdx;
            arr[_i19] += _fdx;
            asmHome[_i19 + 1] += _fdy;
            arr[_i19 + 1] += _fdy;
            asmHome[_i19 + 2] += _fdz;
            arr[_i19 + 2] += _fdz;
          }
        }
        if (_flowDX || _flowDZ) {
          var fw = Math.max(0, 1 - formP * 2.5);
          if (fw > 0.01) {
            var fx = _flowDX * fw,
              fz = _flowDZ * fw;
            for (var _i20 = 0; _i20 < ASM_N * 3; _i20 += 3) {
              asmHome[_i20] -= fx;
              arr[_i20] -= fx;
              asmHome[_i20 + 2] -= fz;
              arr[_i20 + 2] -= fz;
            }
          }
        }
        if (formP < 0.0015) {
          wrapAssemblyField(arr, asmHome, BOX);
          if (arrCollapse > 0.01) {
            var kA = frameLerp(0.05 + arrCollapse * 0.16, dt);
            _arrR.crossVectors(FORWARD, _arrUP).normalize();
            _arrU.crossVectors(_arrR, FORWARD).normalize();
            var kx = cam.pos.x + FORWARD.x * 9;
            var ky = cam.pos.y + FORWARD.y * 9;
            var kz = cam.pos.z + FORWARD.z * 9;
            var wobT = now * 0.0022;
            for (var _i21 = 0; _i21 < ASM_N; _i21++) {
              var j = _i21 * 3;
              var lx = asmLocal[j] * glyphFit;
              var ly = asmLocal[j + 1] * glyphFit;
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
            var kField = frameLerp(0.12, dt);
            for (var _i22 = 0; _i22 < ASM_N * 3; _i22++) arr[_i22] += (asmHome[_i22] - arr[_i22]) * kField;
          }
        } else {
          _glyphC.copy(cam.pos).add(ORIGIN_CENTER);
          var wob = Math.max(0, 1 - formP * 1.2);
          var assemblyYaw = inDive ? now * 0.00024 : Math.sin(now * 0.00045) * 0.5 * wob;
          var restYaw = inDive ? 0 : Math.sin(now * 0.00038) * 0.20 * formP;
          var restPitch = inDive ? 0 : Math.sin(now * 0.00029 + 1.0) * 0.10 * formP;
          var ang = assemblyYaw + restYaw;
          var ca = Math.cos(ang),
            sa = Math.sin(ang);
          var cp = Math.cos(restPitch),
            _sp = Math.sin(restPitch);
          var rAmp = 0.15 * formP;
          var rPhase = now * 0.0019;
          var kForm = frameLerp(0.16 + formP * 0.12, dt);
          for (var _i23 = 0; _i23 < ASM_N; _i23++) {
            var _j = _i23 * 3;
            var _lx = asmLocal[_j] * glyphFit;
            var _ly = asmLocal[_j + 1] * glyphFit;
            var _lz = asmLocal[_j + 2] * glyphFit + rAmp * glyphFit * Math.sin(rPhase - _lx * 1.5);
            var ly2 = _ly * cp - _lz * _sp;
            var lz2 = _ly * _sp + _lz * cp;
            var _rx = _lx * ca - lz2 * sa;
            var _rz = _lx * sa + lz2 * ca;
            var tX = _glyphC.x + _rx,
              tY = _glyphC.y + ly2,
              tZ = _glyphC.z + _rz;
            var _desX = asmHome[_j] + (tX - asmHome[_j]) * formP;
            var _desY = asmHome[_j + 1] + (tY - asmHome[_j + 1]) * formP;
            var _desZ = asmHome[_j + 2] + (tZ - asmHome[_j + 2]) * formP;
            arr[_j] += (_desX - arr[_j]) * kForm;
            arr[_j + 1] += (_desY - arr[_j + 1]) * kForm;
            arr[_j + 2] += (_desZ - arr[_j + 2]) * kForm;
          }
        }
        assemblyPts.geometry.attributes.position.needsUpdate = true;
        var fieldOp = mode === "ambient" || mode === "grid" || mode === "reel" ? 0.34 : 0.55;
        assemblyPts.material.opacity = Math.min(1, Math.max(fieldOp, 0.2 + formP * 0.8) + igE * 0.4 + arrCollapse * 0.45 + _lvlS * 0.16);
        assemblyPts.material.size = 0.1 + formP * 0.015 + igE * 0.5 + arrCollapse * 0.07 + _lvlS * 0.04;
        if (inDive) {
          assemblyGroup.position.set(0, 1.5, igE * (Math.abs(ORIGIN_CENTER.z) + 6));
          var gs = 1 + igE * 4.5;
          assemblyGroup.scale.set(gs, gs, gs);
        } else {
          assemblyGroup.position.set(0, 0, 0);
          assemblyGroup.scale.set(1, 1, 1);
        }
        var debugState = window.__mo_debug || (window.__mo_debug = {});
        debugState.mode = mode;
        debugState.active = !!ob.active;
        debugState.formP = +formP.toFixed(2);
        debugState.camZ = +cam.pos.z.toFixed(1);
      }
      updateTopology(dt, mode, focusAddrNow, window.__mo_debug && window.__mo_debug.formP || 0, arrFade);
      var FLbr = window.__mo_flight || {};
      var warpNow = Math.max(0, Math.min(1.4, FLbr.warp || 0));
      var MC = window.__mo_cam = window.__mo_cam || {};
      MC.x = cam.pos.x;
      MC.y = cam.pos.y;
      MC.z = cam.pos.z;
      MC.yaw = cam.yaw;
      MC.pitch = cam.pitch;
      MC.vel = cam.vel;
      frameI++;
      if (frameI % 18 === 0) {
        var _hoverObjRef$current;
        var yawDeg = (cam.yaw * 180 / Math.PI % 360 + 360) % 360;
        var next = {
          yaw: yawDeg.toFixed(0).padStart(3, "0"),
          pit: (cam.pitch * 180 / Math.PI).toFixed(0),
          vel: cam.vel.toFixed(1),
          tile: ((_hoverObjRef$current = hoverObjRef.current) === null || _hoverObjRef$current === void 0 || (_hoverObjRef$current = _hoverObjRef$current.userData) === null || _hoverObjRef$current === void 0 || (_hoverObjRef$current = _hoverObjRef$current.project) === null || _hoverObjRef$current === void 0 ? void 0 : _hoverObjRef$current.addr) || activeAddrRef.current || "—"
        };
        setStatus(function (prev) {
          return prev && prev.yaw === next.yaw && prev.pit === next.pit && prev.vel === next.vel && prev.tile === next.tile ? prev : next;
        });
      }
      var vW = Math.max(0, Math.min(1.4, window.__mo_vel || 0));
      if (cursorFx) {
        cursorFx.update(now, dt, {
          aberration: GRADE.aberration + vW * 0.0035 + arrCollapse * 0.002 + warpNow * 0.0022,
          vignette: GRADE.vignette,
          grain: GRADE.grain
        });
      }
      var fovT = 58 + vW * 4 + warpNow * 4.5;
      camera.fov += (fovT - camera.fov) * frameLerp(0.08, dt);
      if (Math.abs(camera.fov - _lastFov) > 0.02) {
        camera.updateProjectionMatrix();
        _lastFov = camera.fov;
      }
      if (bokehPass && bokehPass.uniforms) {
        var focusT = GRADE.focus;
        if (mode === "reel") focusT = 10.6;
        var formPNow = window.__mo_debug && window.__mo_debug.formP || 0;
        if (formPNow > 0.25) focusT = ORIGIN_CENTER.length();
        _focusS += (focusT - _focusS) * frameLerp(0.07, dt);
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
    function wrapPointsAroundCamera(points, box) {
      var attr = points.geometry.attributes.position;
      var arr = attr.array;
      var dirty = false;
      for (var _i25 = 0; _i25 < arr.length; _i25 += 3) {
        var dx = arr[_i25 + 0] - cam.pos.x;
        var dy = arr[_i25 + 1] - cam.pos.y;
        var dz = arr[_i25 + 2] - cam.pos.z;
        if (dx > box.x / 2) {
          arr[_i25 + 0] -= box.x;
          dirty = true;
        } else if (dx < -box.x / 2) {
          arr[_i25 + 0] += box.x;
          dirty = true;
        }
        if (dy > box.y / 2) {
          arr[_i25 + 1] -= box.y;
          dirty = true;
        } else if (dy < -box.y / 2) {
          arr[_i25 + 1] += box.y;
          dirty = true;
        }
        if (dz > box.z / 2) {
          arr[_i25 + 2] -= box.z;
          dirty = true;
        } else if (dz < -box.z / 2) {
          arr[_i25 + 2] += box.z;
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
      if (_environmentTarget) _environmentTarget.dispose();else if (scene.environment && scene.environment.dispose) scene.environment.dispose();
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
      ambientBatches.forEach(function (batch) {
        return batch.geo.dispose();
      });
      ambientMat.dispose();
      ambientAtlas.texture.dispose();
      starGeo.dispose();
      asmGeo.dispose();
      assemblyPts.material.dispose();
      (_originHub$material$m = originHub.material.map) === null || _originHub$material$m === void 0 || _originHub$material$m.dispose();
      originHub.material.dispose();
      originLinks.forEach(function (l) {
        l.geometry.dispose();
        l.material.dispose();
      });
      constGeo.dispose();
      constMat.dispose();
      if (renderer.renderLists) renderer.renderLists.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      window.removeEventListener("pointermove", onAnyAct);
      window.removeEventListener("pointerdown", onActSkipArrival);
      window.removeEventListener("wheel", onAnyAct);
      window.removeEventListener("keydown", onAnyAct);
      window.removeEventListener("scroll", onAnyAct);
      window.removeEventListener("deviceorientation", onGyro, true);
      window.removeEventListener("orientationchange", onGyroFrameChange);
      if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener) {
        window.screen.orientation.removeEventListener("change", onGyroFrameChange);
      }
      document.removeEventListener("visibilitychange", onGyroVisibility);
      delete window.__mo_universe;
      delete window.__mo_arrival_start;
      delete window.__mo_cam;
    };
  }, []);
  return React.createElement("div", {
    className: "universe",
    "data-screen-label": "01 Universe"
  }, React.createElement("div", {
    className: "universe__mount",
    ref: mountRef
  }), hover && window.UniverseHoverCard && React.createElement(window.UniverseHoverCard, {
    project: hover.project,
    panelRef: overlayRef
  }), React.createElement("div", {
    className: "universe__reticle",
    "aria-hidden": "true"
  }, React.createElement("span", null), React.createElement("span", null), React.createElement("span", null), React.createElement("span", null)), React.createElement("div", {
    className: "universe__whisper " + (idleNote ? "is-on" : ""),
    "aria-hidden": "true"
  }, React.createElement("span", {
    className: "universe__whisperDot"
  }), "the field notices you"), React.createElement("div", {
    className: "universe__hud universe__hud--bl"
  }, React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "YAW"), React.createElement("span", {
    className: "universe__hudVal"
  }, status.yaw, "\xB0")), React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "PITCH"), React.createElement("span", {
    className: "universe__hudVal"
  }, status.pit, "\xB0")), React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "VEL"), React.createElement("span", {
    className: "universe__hudVal"
  }, status.vel)), React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "FOCUS"), React.createElement("span", {
    className: "universe__hudVal"
  }, status.tile))), React.createElement("div", {
    className: "universe__hud universe__hud--br"
  }, React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "DRAG"), React.createElement("span", {
    className: "universe__hudVal"
  }, "ROTATE")), React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "WHEEL"), React.createElement("span", {
    className: "universe__hudVal"
  }, "FLY")), React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "CLICK"), React.createElement("span", {
    className: "universe__hudVal"
  }, "AIM")), React.createElement("div", {
    className: "universe__hudRow"
  }, React.createElement("span", {
    className: "universe__hudKey"
  }, "SPACE"), React.createElement("span", {
    className: "universe__hudVal"
  }, "\u221E"))));
}
window.Universe = Universe;

/* ---- app/landing/transitions/project-handoff.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
var NH_HOLD_MAX = 900;
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
    setMode = _useNH2[1];
  var _useNH3 = useNH({
      addr: "",
      name: ""
    }),
    _useNH4 = _slicedToArray(_useNH3, 2),
    hud = _useNH4[0],
    setHud = _useNH4[1];
  var _useNH5 = useNH(false),
    _useNH6 = _slicedToArray(_useNH5, 2),
    holding = _useNH6[0],
    setHolding = _useNH6[1];
  var rigRef = useNHR(null);
  var rafRef = useNHR(0);
  useNHE(function () {
    var onRestore = function onRestore() {
      cancelAnimationFrame(rafRef.current);
      if (rigRef.current) {
        try {
          rigRef.current.dispose();
        } catch (_) {}
        rigRef.current = null;
      }
      var mount = mountRef.current;
      if (mount) while (mount.firstChild) mount.removeChild(mount.firstChild);
      var wf = document.querySelector(".wf");
      if (wf) wf.classList.remove("wf--dissolve");
      returningRef.current = false;
      setHolding(false);
      setHud({
        addr: "",
        name: ""
      });
      setMode("idle");
    };
    window.addEventListener("mo:page-restored", onRestore);
    return function () {
      return window.removeEventListener("mo:page-restored", onRestore);
    };
  }, []);
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
    if (!uni) return;
    if (uni.__moFadeT) clearTimeout(uni.__moFadeT);
    uni.style.transition = "opacity ".concat(ms, "ms cubic-bezier(0.16,1,0.3,1)");
    uni.style.opacity = String(toOpacity);
    uni.__moFadeT = setTimeout(function () {
      uni.style.transition = "";
      uni.__moFadeT = 0;
    }, ms + 60);
  };
  useNHE(function () {
    var onFly = function onFly(e) {
      if (returningRef.current || mode !== "idle") return;
      var project = e && e.detail && e.detail.project;
      if (!project || !project.file) return;
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
      setHolding(true);
      setMode("forward");
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
          setHolding(false);
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
        var usableOrigin = !!originRect && originRect.w > 1 && originRect.h > 1 && originRect.x + originRect.w > 0 && originRect.y + originRect.h > 0 && originRect.x < vw && originRect.y < vh;
        var travels = !NH_REDUCED && usableOrigin;
        if (travels) {
          var cx = Math.max(0, Math.min(vw, originRect.x + originRect.w / 2));
          var cy = Math.max(0, Math.min(vh, originRect.y + originRect.h / 2));
          var R = window.WAFER_RIG || {
            fov: 38,
            camZ: 5.4,
            modelFit: 4.0
          };
          var frustumH = 2 * R.camZ * Math.tan(R.fov * Math.PI / 180 / 2);
          var rigFit = project.model && project.model.rigFit || R.modelFit || 4.0;
          var startScale = Math.max(0.06, Math.min(REST.scale, originRect.h / vh * frustumH / rigFit));
          rig.startFromScreen(cx, cy, vw, vh, startScale);
          rig.setEaseRate(0.052);
        } else {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY);
        }
        var t0 = performance.now();
        var last = t0;
        var navigated = false;
        var released = false;
        var releasedAt = 0;
        var dur = NH_REDUCED ? 420 : hp.duration;
        var fire = function fire() {
          if (navigated) return;
          navigated = true;
          clearTimeout(failsafe);
          go();
        };
        var release = function release(now) {
          if (released) return;
          released = true;
          releasedAt = now;
          setHolding(false);
          fadeUniverse(0, 420);
          if (travels) rig.setLayout(REST.fracX, REST.scale, REST.offY);
        };
        var failsafe = setTimeout(fire, NH_HOLD_MAX + dur + 1200);
        var paintedFrames = 0;
        var travelFrames = 0;
        var _loop = function loop(now) {
          var dt = now - last;
          last = now;
          if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
          rig.update(dt);
          rig.render();
          if (rig.ready) paintedFrames++;else if (released) paintedFrames++;
          if (!released && (paintedFrames >= 2 || now - t0 >= NH_HOLD_MAX)) release(now);
          if (released) travelFrames++;
          if (released && now - releasedAt >= dur && travelFrames >= 10) {
            fire();
            return;
          }
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
    setHolding(false);
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
        var featIdx = (window.MO_FEATURED_ADDRS || []).indexOf(project.addr);
        if (returnTarget === "work" && featIdx >= 0) {
          var work = document.getElementById("work");
          if (work) {
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
          });
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
  return React.createElement("div", {
    className: "wf " + (mode !== "idle" ? "wf--on " : "") + (holding ? "wf--hold" : ""),
    "aria-hidden": "true"
  }, React.createElement("div", {
    className: "wf__veil"
  }), React.createElement("div", {
    className: "wf__mount",
    ref: mountRef
  }), React.createElement("div", {
    className: "wf__tag"
  }, React.createElement("span", {
    className: "wf__tagDot"
  }), React.createElement("span", null, mode === "return" ? "RETURNING TO FIELD" : "ENTERING NODE " + hud.addr), React.createElement("span", {
    className: "wf__tagSep"
  }), React.createElement("span", {
    className: "wf__tagName"
  }, mode === "return" ? "NODE " + hud.addr + " · " + hud.name : hud.name)));
}
window.NodeHandoff = NodeHandoff;

/* ---- app/landing/scenes/about-board.jsx ---- */
function _regenerator() { var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
  function drawNetLines(x, S, W, H, style) {
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
      x.save();
      x.translate(iu, iv);
      x.rotate(-0.35);
      x.fillStyle = "#04050a";
      x.fillRect(-0.5 * S, -1.1 * S, 1.0 * S, 2.2 * S);
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
  function scatterParts(group) {
    var capBody = mat(0xb08d5a, 0.1, 0.5);
    var capEnd = mat(0xb7c0cf, 1.0, 0.3);
    var resBody = mat(0x11141a, 0.05, 0.5);
    var passiveBatches = new Map();
    var groupMatrix = new THREE.Matrix4();
    var localMatrix = new THREE.Matrix4();
    var worldMatrix = new THREE.Matrix4();
    var queuePassive = function queuePassive(role, w, h, d, material, localX) {
      var key = "".concat(role, ":").concat(w.toFixed(6), ":").concat(h.toFixed(6), ":").concat(d.toFixed(6));
      var batch = passiveBatches.get(key);
      if (!batch) {
        batch = {
          geometry: new THREE.BoxGeometry(w, h, d),
          material: material,
          matrices: []
        };
        passiveBatches.set(key, batch);
      }
      localMatrix.makeTranslation(localX, h / 2, 0);
      worldMatrix.multiplyMatrices(groupMatrix, localMatrix);
      batch.matrices.push(worldMatrix.clone());
    };
    var _iterator22 = _createForOfIteratorHelper(LAYOUT.foot),
      _step22;
    try {
      for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
        var f = _step22.value;
        var bl = f.l * 0.92,
          bw = f.w * 0.95,
          bh = f.cap ? f.w * 0.75 : 0.42;
        groupMatrix.makeRotationY(f.rot ? Math.PI / 2 : 0);
        groupMatrix.setPosition(f.x, TOP, f.z);
        queuePassive(f.cap ? "cap-body" : "res-body", bl * 0.72, bh, bw, f.cap ? capBody : resBody, 0);
        queuePassive("end", bl * 0.16, bh, bw, capEnd, -bl * 0.43);
        queuePassive("end", bl * 0.16, bh, bw, capEnd, bl * 0.43);
      }
    } catch (err) {
      _iterator22.e(err);
    } finally {
      _iterator22.f();
    }
    var _iterator23 = _createForOfIteratorHelper(passiveBatches),
      _step23;
    try {
      var _loop2 = function _loop2() {
        var _step23$value = _slicedToArray(_step23.value, 2),
          key = _step23$value[0],
          batch = _step23$value[1];
        var instances = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
        batch.matrices.forEach(function (matrix, index) {
          return instances.setMatrixAt(index, matrix);
        });
        instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        instances.instanceMatrix.needsUpdate = true;
        instances.name = "pcb-passives:".concat(key);
        if (instances.computeBoundingSphere) instances.computeBoundingSphere();
        group.add(instances);
      };
      for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
        _loop2();
      }
    } catch (err) {
      _iterator23.e(err);
    } finally {
      _iterator23.f();
    }
    var partTemplates = new Map();
    var _iterator24 = _createForOfIteratorHelper(CPARTS),
      _step24;
    try {
      for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
        var p = _step24.value;
        var template = partTemplates.get(p.k);
        var g = template ? template.clone(true) : buildPart(p.k);
        if (!template) partTemplates.set(p.k, g);
        g.position.set(p.x, TOP, p.z);
        if (p.rot) g.rotation.y = Math.PI / 2;
        group.add(g);
      }
    } catch (err) {
      _iterator24.e(err);
    } finally {
      _iterator24.f();
    }
  }
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
  var WAFER_EXPLODE = 0.30;
  function buildWaferReal(group, state) {
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
      if (state.disposed) return;
      ok = ok.filter(Boolean);
      if (!ok.length) return;
      var holder = new THREE.Group();
      var _iterator25 = _createForOfIteratorHelper(ok),
        _step25;
      try {
        for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
          var root = _step25.value.root;
          holder.add(root);
        }
      } catch (err) {
        _iterator25.e(err);
      } finally {
        _iterator25.f();
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
      var _iterator26 = _createForOfIteratorHelper(ok),
        _step26;
      try {
        for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
          var _step26$value = _step26.value,
            f = _step26$value.f,
            _root = _step26$value.root;
          if (!f.startsWith("key_")) continue;
          var b = new THREE.Box3().setFromObject(_root),
            _c = new THREE.Vector3();
          b.getCenter(_c);
          capMean += _c.sub(centre).dot(UPm);
          capN++;
        }
      } catch (err) {
        _iterator26.e(err);
      } finally {
        _iterator26.f();
      }
      if (capN && capMean < 0) UPm.multiplyScalar(-1);
      var base = dims[longI];
      var _iterator27 = _createForOfIteratorHelper(ok),
        _step27;
      try {
        for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
          var _step27$value = _step27.value,
            _f = _step27$value.f,
            _root2 = _step27$value.root;
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
          state.parts.push(wrap);
          _root2.traverse(function (o) {
            if (o.isMesh && o.material) {
              var m = o.material = o.material.clone();
              m.transparent = true;
              if ("envMapIntensity" in m) m.envMapIntensity = 1.2;
              state.materials.push(m);
            }
          });
        }
      } catch (err) {
        _iterator27.e(err);
      } finally {
        _iterator27.f();
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
  function yieldBuildPhase() {
    var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 180;
    return new Promise(function (resolve) {
      var afterIdle = function afterIdle() {
        return requestAnimationFrame(function () {
          return setTimeout(resolve, 0);
        });
      };
      if (window.requestIdleCallback) window.requestIdleCallback(afterIdle, {
        timeout: timeout
      });else afterIdle();
    });
  }
  function buildScene(_x5, _x6, _x7) {
    return _buildScene.apply(this, arguments);
  }
  function _buildScene() {
    _buildScene = _asyncToGenerator(_regenerator().m(function _callee(mount, opts, lifecycle) {
      var LITE, THREE, W, H, renderer, scene, envTarget, pmrem, envScene, camera, key, fill, rim, colorW, detailW, colorTex, specTex, bumpTex, boardMat, edgeMat, board, curvePts, curve, STAR_N, starGeo2, starPos2, i, r, th, ph, starField2, ASM_N, asmGeo2, asmPos2, asmTar2, asmSca2, _tp, _i1, st, _TRACE_PTS$st$p5, px, pz, a, rr2, assembly2, waferState, deviceGroup, formMats, formMatsTransparent, composer, bokeh, tmpPos, tmpLook, tmpTan, tmpSide, UP, camPos, camLook, curLook, stopTForIndex, HERO_POS, HERO_LOOK, NODE_POS, NODE_LOOK, tmpFinalPos, tmpFinalLook, update, render, setSize, dispose, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            dispose = function _dispose() {
              waferState.disposed = true;
              if (bokeh && bokeh.dispose) bokeh.dispose();
              if (composer && composer.dispose) composer.dispose();
              var geometries = new Set();
              var materials = new Set();
              var textures = new Set([colorTex, specTex, bumpTex]);
              scene.traverse(function (object) {
                if (object.geometry && object.geometry.dispose) geometries.add(object.geometry);
                var objectMaterials = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
                objectMaterials.forEach(function (material) {
                  if (!material || !material.dispose) return;
                  materials.add(material);
                  Object.keys(material).forEach(function (key) {
                    var value = material[key];
                    if (value && value.isTexture && value.dispose) textures.add(value);
                  });
                });
              });
              geometries.forEach(function (geometry) {
                return geometry.dispose();
              });
              materials.forEach(function (material) {
                return material.dispose();
              });
              textures.forEach(function (texture) {
                return texture && texture.dispose();
              });
              if (envTarget) envTarget.dispose();
              if (renderer.renderLists) renderer.renderLists.dispose();
              renderer.dispose();
              if (renderer.forceContextLoss) renderer.forceContextLoss();
              try {
                mount.removeChild(renderer.domElement);
              } catch (_) {}
              waferState.parts.length = 0;
              waferState.materials.length = 0;
            };
            setSize = function _setSize(w, h) {
              renderer.setSize(w, h);
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              if (composer) composer.setSize(w, h);
            };
            render = function _render() {
              if (composer) composer.render();else renderer.render(scene, camera);
            };
            update = function _update(t, mode, dt, footerMix, introMix, nodeMix) {
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
                deviceGroup.visible = ex > 0.02 && waferState.parts.length > 0;
                if (deviceGroup.visible) {
                  var exs = ex < 0.5 ? 2 * ex * ex : 1 - Math.pow(-2 * ex + 2, 2) / 2;
                  var _iterator28 = _createForOfIteratorHelper(waferState.parts),
                    _step28;
                  try {
                    for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
                      var w = _step28.value;
                      w.position.copy(w.userData.vec).multiplyScalar(exs * WAFER_EXPLODE);
                    }
                  } catch (err) {
                    _iterator28.e(err);
                  } finally {
                    _iterator28.f();
                  }
                  var op = Math.min(1, ex * 2.5);
                  var _iterator29 = _createForOfIteratorHelper(waferState.materials),
                    _step29;
                  try {
                    for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
                      var m = _step29.value;
                      m.opacity = op;
                    }
                  } catch (err) {
                    _iterator29.e(err);
                  } finally {
                    _iterator29.f();
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
            };
            stopTForIndex = function _stopTForIndex(i) {
              return STOPS[i].p / (TRACE_PTS.length - 1);
            };
            LITE = !!(opts && opts.lite);
            THREE = window.THREE;
            if (THREE) {
              _context.n = 1;
              break;
            }
            console.warn("THREE missing");
            return _context.a(2, null);
          case 1:
            W = mount.clientWidth, H = mount.clientHeight;
            renderer = new THREE.WebGLRenderer({
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
            _context.n = 2;
            return yieldBuildPhase();
          case 2:
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x04060d, 55, 150);
            envTarget = null, pmrem = null, envScene = null;
            try {
              pmrem = new THREE.PMREMGenerator(renderer);
              envScene = new THREE.RoomEnvironment();
              envTarget = pmrem.fromScene(envScene, 0.04);
              scene.environment = envTarget.texture;
            } catch (e) {
              console.warn("env failed", e);
            } finally {
              if (envScene) {
                if (envScene.dispose) envScene.dispose();else envScene.traverse(function (object) {
                  if (object.geometry && object.geometry.dispose) object.geometry.dispose();
                  var mats = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
                  mats.forEach(function (material) {
                    return material && material.dispose && material.dispose();
                  });
                });
              }
              if (pmrem) pmrem.dispose();
            }
            _context.n = 3;
            return yieldBuildPhase();
          case 3:
            camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 400);
            camera.position.set(0, 30, 40);
            camera.lookAt(0, 0, 0);
            key = new THREE.DirectionalLight(0xffffff, 2.2);
            key.position.set(-30, 50, 25);
            scene.add(key);
            fill = new THREE.DirectionalLight(0x9ab4ff, 0.5);
            fill.position.set(30, 20, -20);
            scene.add(fill);
            rim = new THREE.PointLight(0x00f0c8, 60, 120, 2);
            rim.position.set(0, 14, -10);
            scene.add(rim);
            scene.add(new THREE.AmbientLight(0xffffff, 0.25));
            colorW = LITE ? 2048 : 4096;
            detailW = LITE ? 1024 : 4096;
            colorTex = drawColor(colorW, Math.round(colorW * BOARD_D / BOARD_W));
            specTex = drawSpec(detailW, Math.round(detailW * BOARD_D / BOARD_W));
            bumpTex = drawBump(detailW, Math.round(detailW * BOARD_D / BOARD_W));
            _context.n = 4;
            return yieldBuildPhase();
          case 4:
            boardMat = new THREE.MeshStandardMaterial({
              map: colorTex,
              metalnessMap: specTex,
              roughnessMap: specTex,
              bumpMap: bumpTex,
              bumpScale: 0.4,
              metalness: 1.0,
              roughness: 1.0,
              envMapIntensity: 1.0
            });
            edgeMat = mat(0x151009, 0.0, 0.85);
            board = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_T, BOARD_D), [edgeMat, edgeMat, boardMat, edgeMat, edgeMat, edgeMat]);
            scene.add(board);
            scatterParts(scene);
            _context.n = 5;
            return yieldBuildPhase();
          case 5:
            curvePts = TRACE_PTS.map(function (p) {
              return new THREE.Vector3(p[0], TOP + 0.05, p[1]);
            });
            curve = new THREE.CatmullRomCurve3(curvePts, false, "catmullrom", 0.5);
            STAR_N = 380;
            starGeo2 = new THREE.BufferGeometry();
            starPos2 = new Float32Array(STAR_N * 3);
            for (i = 0; i < STAR_N; i++) {
              r = 80 + Math.random() * 260;
              th = Math.random() * Math.PI * 2;
              ph = Math.acos(2 * Math.random() - 1);
              starPos2[i * 3 + 0] = Math.sin(ph) * Math.cos(th) * r;
              starPos2[i * 3 + 1] = Math.abs(Math.cos(ph) * r) * 0.5 + 8;
              starPos2[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
            }
            starGeo2.setAttribute("position", new THREE.BufferAttribute(starPos2, 3));
            starField2 = new THREE.Points(starGeo2, new THREE.PointsMaterial({
              color: 0x00f0c8,
              size: 0.9,
              sizeAttenuation: true,
              transparent: true,
              opacity: 0.5,
              depthWrite: false
            }));
            scene.add(starField2);
            ASM_N = 620;
            asmGeo2 = new THREE.BufferGeometry();
            asmPos2 = new Float32Array(ASM_N * 3);
            asmTar2 = new Float32Array(ASM_N * 3);
            asmSca2 = new Float32Array(ASM_N * 3);
            _tp = new THREE.Vector3();
            for (_i1 = 0; _i1 < ASM_N; _i1++) {
              if (Math.random() < 0.7) {
                curve.getPointAt(Math.random(), _tp);
                asmTar2[_i1 * 3 + 0] = _tp.x + (Math.random() - 0.5) * 5;
                asmTar2[_i1 * 3 + 1] = TOP + 0.4 + Math.random() * 2.2;
                asmTar2[_i1 * 3 + 2] = _tp.z + (Math.random() - 0.5) * 5;
              } else {
                st = STOPS[Math.random() * STOPS.length | 0];
                _TRACE_PTS$st$p5 = _slicedToArray(TRACE_PTS[st.p], 2), px = _TRACE_PTS$st$p5[0], pz = _TRACE_PTS$st$p5[1];
                a = Math.random() * Math.PI * 2, rr2 = Math.random() * 7;
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
            asmGeo2.setAttribute("position", new THREE.BufferAttribute(asmPos2, 3).setUsage(THREE.DynamicDrawUsage));
            assembly2 = new THREE.Points(asmGeo2, new THREE.PointsMaterial({
              color: 0x00f0c8,
              size: 1.1,
              sizeAttenuation: true,
              transparent: true,
              opacity: 0,
              depthWrite: false
            }));
            scene.add(assembly2);
            _context.n = 6;
            return yieldBuildPhase();
          case 6:
            waferState = lifecycle.waferState;
            deviceGroup = null;
            STOPS.forEach(function (st) {
              var _TRACE_PTS$st$p6 = _slicedToArray(TRACE_PTS[st.p], 2),
                px = _TRACE_PTS$st$p6[0],
                pz = _TRACE_PTS$st$p6[1];
              var grp = buildComponent(st.kind);
              grp.scale.setScalar(0.85);
              grp.position.set(px, 0, pz);
              scene.add(grp);
              if (st.explode) {
                deviceGroup = new THREE.Group();
                deviceGroup.position.set(px, TOP + 4.6, pz);
                deviceGroup.visible = false;
                scene.add(deviceGroup);
                buildWaferReal(deviceGroup, waferState);
              }
            });
            _context.n = 7;
            return yieldBuildPhase();
          case 7:
            formMats = [];
            scene.traverse(function (o) {
              if (o.isMesh && o.material) {
                var mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function (m) {
                  if (!formMats.includes(m)) formMats.push(m);
                });
              }
            });
            formMatsTransparent = false;
            composer = null, bokeh = null;
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
            tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3(), tmpTan = new THREE.Vector3(), tmpSide = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
            camPos = new THREE.Vector3().copy(camera.position);
            camLook = new THREE.Vector3(0, 0, 0);
            curLook = new THREE.Vector3(0, 0, 0);
            HERO_POS = new THREE.Vector3(), HERO_LOOK = new THREE.Vector3();
            NODE_POS = new THREE.Vector3(), NODE_LOOK = new THREE.Vector3();
            tmpFinalPos = new THREE.Vector3(), tmpFinalLook = new THREE.Vector3();
            _context.p = 8;
            update(0, "probe", 16, 0, 0, 1);
            if (!renderer.compileAsync) {
              _context.n = 10;
              break;
            }
            _context.n = 9;
            return renderer.compileAsync(scene, camera);
          case 9:
            _context.n = 11;
            break;
          case 10:
            if (renderer.compile) renderer.compile(scene, camera);
          case 11:
            _context.n = 12;
            return yieldBuildPhase(250);
          case 12:
            render();
            _context.n = 14;
            break;
          case 13:
            _context.p = 13;
            _t = _context.v;
            console.warn("[board] hidden preflight render failed", _t);
          case 14:
            return _context.a(2, {
              update: update,
              render: render,
              setSize: setSize,
              dispose: dispose,
              stops: STOPS,
              domElement: renderer.domElement
            });
        }
      }, _callee, null, [[8, 13]]);
    }));
    return _buildScene.apply(this, arguments);
  }
  function build(_x8, _x9) {
    return _build.apply(this, arguments);
  }
  function _build() {
    _build = _asyncToGenerator(_regenerator().m(function _callee2(mount, opts) {
      var lifecycle, existingCanvases, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            lifecycle = {
              waferState: {
                parts: [],
                materials: [],
                disposed: false
              }
            };
            existingCanvases = new Set(mount.querySelectorAll("canvas"));
            _context2.p = 1;
            _context2.n = 2;
            return buildScene(mount, opts, lifecycle);
          case 2:
            return _context2.a(2, _context2.v);
          case 3:
            _context2.p = 3;
            _t2 = _context2.v;
            lifecycle.waferState.disposed = true;
            lifecycle.waferState.parts.length = 0;
            lifecycle.waferState.materials.length = 0;
            mount.querySelectorAll("canvas").forEach(function (canvas) {
              if (existingCanvases.has(canvas)) return;
              try {
                var gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
                var lose = gl && gl.getExtension("WEBGL_lose_context");
                if (lose) lose.loseContext();
              } catch (_) {}
              try {
                canvas.remove();
              } catch (_) {}
            });
            throw _t2;
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 3]]);
    }));
    return _build.apply(this, arguments);
  }
  window.MOBoard = {
    build: build,
    STOPS: STOPS
  };
})();

/* ---- app/landing/scenes/board-flight.jsx ---- */
function _regenerator() { var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
var _bfRenderEps = 0.004;
function BoardFlight(_ref) {
  var onEnter = _ref.onEnter,
    onContact = _ref.onContact;
  var secRef = useBFR(null);
  var layerRef = useBFR(null);
  var mountRef = useBFR(null);
  var ctrlRef = useBFR(null);
  var readyRef = useBFR(false);
  var tRef = useBFR(0);
  var footRef = useBFR(0);
  var presRef = useBFR(0);
  var nodeRef = useBFR(1);
  var uniRef = useBFR(null);
  var enteredRef = useBFR(false);
  var contactRef = useBFR(false);
  var wakeRenderRef = useBFR(null);
  var onEnterRef = useBFR(onEnter);
  var onContactRef = useBFR(onContact);
  useBFE(function () {
    onEnterRef.current = onEnter;
    onContactRef.current = onContact;
  });
  var introRef = useBFR(1);
  var MODE = typeof window !== "undefined" && window.__mo_bf_transition || "takeover";
  var STOPS = window.MOBoard && window.MOBoard.STOPS || [];
  var N = STOPS.length;
  var LEAD_V = 2.4;
  var FLIGHT_V = N + 1;
  var FOOT_V = 1.4;
  var TOTAL_V = LEAD_V + FLIGHT_V + FOOT_V;
  var LEAD_PORTION = LEAD_V / TOTAL_V;
  var FLIGHT_PORTION = FLIGHT_V / TOTAL_V;
  var FOOT_PORTION = FOOT_V / TOTAL_V;
  var _useBF = useBF(0),
    _useBF2 = _slicedToArray(_useBF, 2),
    active = _useBF2[0],
    setActive = _useBF2[1];
  useBFE(function () {
    var mount = mountRef.current;
    if (!mount) return;
    var bootRaf = 0,
      bootIdle = 0,
      renderRaf = 0,
      retryTimer = 0,
      cursorFx = null,
      last = performance.now();
    var disposed = false,
      started = false,
      near = false,
      bootObserver = null;
    var fallbackListening = false,
      attempts = 0;
    uniRef.current = document.querySelector(".universeBg");
    var boot = function () {
      var _ref2 = _asyncToGenerator(_regenerator().m(function _callee() {
        var ctrl, sharedCursor, finePointer, _loop, wakeRender, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!disposed) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              ctrl = null;
              _context.p = 2;
              _context.n = 3;
              return window.MOBoard.build(mount, {
                lite: true
              });
            case 3:
              ctrl = _context.v;
              _context.n = 5;
              break;
            case 4:
              _context.p = 4;
              _t = _context.v;
              console.warn("[board] preflight failed", _t);
            case 5:
              if (ctrl) {
                _context.n = 6;
                break;
              }
              if (!disposed && attempts < 2) {
                started = false;
                retryTimer = window.setTimeout(function () {
                  retryTimer = 0;
                  if (!disposed) scheduleBoot();
                }, 900);
              }
              return _context.a(2);
            case 6:
              if (!disposed) {
                _context.n = 7;
                break;
              }
              ctrl.dispose();
              return _context.a(2);
            case 7:
              ctrlRef.current = ctrl;
              sharedCursor = window.MOCursorDistortion;
              finePointer = !window.matchMedia || window.matchMedia("(pointer: fine)").matches;
              if (finePointer && sharedCursor && typeof sharedCursor.mountStandalone === "function") {
                cursorFx = sharedCursor.mountStandalone({
                  THREE: window.THREE,
                  selector: "[data-mo-board-cursor-mirror]",
                  zIndex: 20,
                  dprCap: 1,
                  disabledClasses: ["landing-exit", "mo-explore", "nx-page"],
                  disabledWhen: function disabledWhen() {
                    return presRef.current <= _bfRenderEps;
                  },
                  chainPrevious: true
                });
              }
              _loop = function loop(now) {
                renderRaf = 0;
                if (disposed) return;
                if (presRef.current <= _bfRenderEps) return;
                var dt = Math.min(50, now - last);
                last = now;
                var a = ctrl.update(tRef.current, "probe", dt, footRef.current, introRef.current, nodeRef.current);
                ctrl.render();
                if (a !== undefined) setActive(function (prev) {
                  return prev === a ? prev : a;
                });
                renderRaf = requestAnimationFrame(_loop);
              };
              wakeRender = function wakeRender() {
                if (disposed || renderRaf || presRef.current <= _bfRenderEps) return;
                last = performance.now();
                renderRaf = requestAnimationFrame(_loop);
              };
              wakeRenderRef.current = wakeRender;
              readyRef.current = true;
              window.dispatchEvent(new CustomEvent("mo:board-ready"));
              wakeRender();
            case 8:
              return _context.a(2);
          }
        }, _callee, null, [[2, 4]]);
      }));
      return function boot() {
        return _ref2.apply(this, arguments);
      };
    }();
    var removeFallbackListeners = function removeFallbackListeners() {
      if (!fallbackListening) return;
      fallbackListening = false;
      window.removeEventListener("scroll", fallbackProbe);
      window.removeEventListener("resize", fallbackProbe);
    };
    var stopBootWatch = function stopBootWatch() {
      if (bootRaf) cancelAnimationFrame(bootRaf);
      bootRaf = 0;
      if (bootIdle && window.cancelIdleCallback) window.cancelIdleCallback(bootIdle);
      bootIdle = 0;
      if (bootObserver) bootObserver.disconnect();
      bootObserver = null;
      removeFallbackListeners();
    };
    var _tryBoot = function tryBoot() {
      bootRaf = 0;
      bootIdle = 0;
      if (disposed || started || !near) return;
      if (window.THREE && window.MOBoard) {
        started = true;
        attempts += 1;
        stopBootWatch();
        void boot();
        return;
      }
      bootRaf = requestAnimationFrame(_tryBoot);
    };
    var scheduleBoot = function scheduleBoot() {
      if (disposed || started || !near || bootRaf || bootIdle) return;
      if (window.requestIdleCallback) {
        bootIdle = window.requestIdleCallback(_tryBoot, {
          timeout: 600
        });
      } else {
        bootRaf = requestAnimationFrame(_tryBoot);
      }
    };
    var setNear = function setNear(next) {
      near = !!next;
      if (near) {
        scheduleBoot();
      } else {
        if (bootRaf) cancelAnimationFrame(bootRaf);
        bootRaf = 0;
        if (bootIdle && window.cancelIdleCallback) window.cancelIdleCallback(bootIdle);
        bootIdle = 0;
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
    var forcePreflight = window.location.hash === "#about" || window.location.hash === "#contact";
    if (section && window.IntersectionObserver) {
      bootObserver = new window.IntersectionObserver(function (entries) {
        var entry = entries.find(function (candidate) {
          return candidate.target === section;
        });
        if (entry) setNear(entry.isIntersecting || forcePreflight);
      }, {
        root: null,
        rootMargin: "".concat(Math.round(window.innerHeight * 4), "px 0px"),
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
    if (forcePreflight) setNear(true);
    var onResize = function onResize() {
      var c = ctrlRef.current;
      if (c) c.setSize(mount.clientWidth, mount.clientHeight);
      if (wakeRenderRef.current) wakeRenderRef.current();
    };
    window.addEventListener("resize", onResize);
    return function () {
      disposed = true;
      readyRef.current = false;
      stopBootWatch();
      if (retryTimer) clearTimeout(retryTimer);
      if (renderRaf) cancelAnimationFrame(renderRaf);
      wakeRenderRef.current = null;
      window.removeEventListener("resize", onResize);
      window.__mo_universe_pause = false;
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
  useBFE(function () {
    var el = secRef.current;
    if (!el) return;
    var layer = layerRef.current;
    var uni = uniRef.current || document.querySelector(".universeBg");
    var aboutLayer = el.querySelector(".aboutNode-layer");
    var aboutNode = el.querySelector(".uNode");
    var grain = layer && layer.querySelector(".bf-grain");
    var mark = layer && layer.querySelector(".bf-mark");
    var chapters = layer ? Array.from(layer.querySelectorAll(".bf-ch")) : [];
    var rail = layer && layer.querySelector(".bf-rail");
    var progress = layer && layer.querySelector(".bf-prog");
    var progressFill = layer && layer.querySelector(".bf-prog__fill");
    var cue = layer && layer.querySelector(".bf-cue");
    var footer = layer && layer.querySelector(".bf-foot");
    var footerInner = footer && footer.querySelector(".bf-foot__inner");
    var raf = 0,
      measureRaf = 0,
      dead = false;
    var trackTop = 0,
      trackHeight = 1,
      viewportH = window.innerHeight;
    var ENTRY_VH = MODE === "takeover" ? 0.36 : MODE === "wipe" ? 0.58 : 0.7;
    var update = function update() {
      raf = 0;
      var vh = viewportH;
      var total = trackHeight - vh;
      var pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      var top = pageY - trackTop;
      var rectTop = -top;
      var rectBottom = rectTop + trackHeight;
      var raw = total > 0 ? _bfClamp(top / total, 0, 1) : 0;
      var lead = _bfClamp(raw / LEAD_PORTION, 0, 1);
      var cardP = _bfClamp(lead / 0.26, 0, 1);
      var openP = _bfClamp((lead - 0.28) / 0.60, 0, 1);
      var padStart = 0.5 / FLIGHT_V;
      var fr = _bfClamp((raw - LEAD_PORTION) / FLIGHT_PORTION, 0, 1);
      var t = _bfClamp((fr - padStart) / (1 - padStart), 0, 1);
      tRef.current = t;
      var footerMix = _bfClamp((raw - LEAD_PORTION - FLIGHT_PORTION) / (FOOT_PORTION * 0.82), 0, 1);
      footRef.current = footerMix;
      var boardReady = readyRef.current;
      var visualOpenP = boardReady ? openP : 0;
      var visualCardP = boardReady ? cardP : 0;
      var contactOn = boardReady && footerMix > 0.5;
      window.__mo_bf = window.__mo_bf || {};
      window.__mo_bf.footer = contactOn;
      window.__mo_bf.lead = lead;
      window.__mo_bf.openP = visualOpenP;
      window.__mo_bf.t = t;
      window.__mo_bf.foot = boardReady ? footerMix : 0;
      if (contactOn !== contactRef.current) {
        contactRef.current = contactOn;
        onContactRef.current && onContactRef.current(contactOn);
      }
      if (MODE === "takeover") {
        var oe = _bfEaseInOut(visualOpenP);
        introRef.current = 0;
        nodeRef.current = 1 - oe;
        presRef.current = visualCardP;
        if (wakeRenderRef.current) wakeRenderRef.current();
        if (layer) {
          layer.style.opacity = _bfClamp(visualCardP * 1.4, 0, 1).toFixed(3);
          layer.style.clipPath = "none";
          layer.style.transform = "none";
          var layerActive = boardReady && visualOpenP > 0.6;
          layer.style.pointerEvents = layerActive ? "auto" : "none";
          layer.inert = !layerActive;
          layer.setAttribute("aria-hidden", layerActive ? "false" : "true");
          var voidMix = _bfClamp((visualOpenP - 0.55) / 0.35, 0, 1);
          layer.style.backgroundColor = "rgba(4, 6, 13, ".concat(voidMix.toFixed(3), ")");
          if (grain) grain.style.opacity = voidMix.toFixed(3);
        }
        if (uni) {
          uni.style.transition = boardReady && raw > 0 ? "none" : "";
          var uniFade = _bfEaseInOut(visualOpenP);
          uni.style.opacity = (1 - uniFade).toFixed(3);
          uni.style.transform = "scale(".concat((1 + 0.05 * oe).toFixed(4), ")");
        }
        window.__mo_universe_pause = boardReady && visualOpenP > 0.92;
        var engaged = boardReady && visualOpenP > 0.5;
        if (engaged !== enteredRef.current) {
          enteredRef.current = engaged;
          if (engaged) onEnterRef.current && onEnterRef.current();
        }
        var cVis = cardP * (1 - _bfClamp(visualOpenP / 0.55, 0, 1));
        if (aboutLayer) {
          aboutLayer.style.opacity = cVis.toFixed(3);
          aboutLayer.setAttribute("aria-hidden", cVis < 0.02 ? "true" : "false");
        }
        if (aboutNode) {
          aboutNode.style.transform = "scale(".concat((1 + visualOpenP * 0.06).toFixed(3), ") translateY(").concat(((1 - cardP) * 26).toFixed(1), "px)");
          aboutNode.style.filter = cardP < 0.996 ? "blur(".concat(((1 - cardP) * 9).toFixed(2), "px)") : "none";
        }
      } else {
        var entry = rectTop > 0 ? _bfClamp((vh - rectTop) / (ENTRY_VH * vh), 0, 1) : 1;
        var exit = rectBottom < vh ? _bfClamp(rectBottom / (0.6 * vh), 0, 1) : 1;
        var presence = boardReady ? Math.min(entry, exit) : 0;
        presRef.current = presence;
        if (wakeRenderRef.current) wakeRenderRef.current();
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
            layer.style.opacity = presence.toFixed(3);
            layer.style.transform = "";
            layer.style.clipPath = "";
            if (uni) {
              uni.style.opacity = (1 - presence).toFixed(3);
              uni.style.transform = "";
            }
            window.__mo_universe_pause = presence > 0.92;
          }
          var _layerActive = presence > 0.5;
          layer.style.pointerEvents = _layerActive ? "auto" : "none";
          layer.inert = !_layerActive;
          layer.setAttribute("aria-hidden", _layerActive ? "false" : "true");
        }
      }
      var openGate = _bfClamp((visualOpenP - 0.55) / 0.4, 0, 1);
      var chromeFade = (1 - _bfClamp(footerMix * 1.4, 0, 1)) * openGate;
      if (mark) mark.style.opacity = chromeFade.toFixed(3);
      if (rail) {
        rail.style.opacity = chromeFade.toFixed(3);
        rail.style.pointerEvents = chromeFade > 0.02 && footerMix <= 0.4 ? "auto" : "none";
        rail.inert = !(chromeFade > 0.02 && footerMix <= 0.4);
        rail.setAttribute("aria-hidden", rail.inert ? "true" : "false");
      }
      if (progress) progress.style.opacity = chromeFade.toFixed(3);
      if (progressFill) progressFill.style.transform = "scaleX(".concat(t.toFixed(4), ")");
      if (cue) cue.style.opacity = openGate > 0.99 && t < 0.05 && footerMix < 0.02 ? "1" : "0";
      chapters.forEach(function (chapter, i) {
        var center = STOPS[i].p / 10;
        var d = Math.abs(t - center) * N;
        var held = i === 0 && t <= center || i === N - 1 && t >= center;
        var ramp = held ? 1 : _bfClamp((0.5 - d) / 0.17, 0, 1);
        var vis = ramp * ramp * (3 - 2 * ramp);
        var cardOp = vis * (1 - _bfClamp(footerMix * 1.6, 0, 1)) * openGate;
        var isOn = cardOp > 0.02 && (held || d < 0.5) && footerMix < 0.4;
        chapter.classList.toggle("is-on", isOn);
        chapter.style.opacity = cardOp.toFixed(3);
        chapter.style.transform = "translateY(".concat(((t - center) * N * 24).toFixed(1), "px)");
        chapter.style.pointerEvents = isOn ? "auto" : "none";
        chapter.inert = !isOn;
        chapter.setAttribute("aria-hidden", isOn ? "false" : "true");
      });
      var footE = boardReady ? _bfEaseOut(footerMix) : 0;
      if (footer) {
        footer.style.opacity = footE.toFixed(3);
        footer.style.pointerEvents = boardReady && footerMix > 0.35 ? "auto" : "none";
        footer.setAttribute("aria-hidden", boardReady && footerMix >= 0.1 ? "false" : "true");
        footer.inert = !boardReady || footerMix <= 0.35;
      }
      if (footerInner) footerInner.style.transform = "translateY(".concat(((1 - footE) * 40).toFixed(1), "px)");
    };
    var measure = function measure() {
      measureRaf = 0;
      if (dead) return;
      var rect = el.getBoundingClientRect();
      trackTop = rect.top + window.scrollY;
      trackHeight = rect.height;
      viewportH = window.innerHeight;
      update();
    };
    var scheduleMeasure = function scheduleMeasure() {
      if (!dead && !measureRaf) measureRaf = requestAnimationFrame(measure);
    };
    var onScroll = function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    };
    var forceUpdate = function forceUpdate() {
      if (dead) return;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.__mo_scrollY = window.scrollY;
      update();
    };
    var ro = window.ResizeObserver ? new ResizeObserver(scheduleMeasure) : null;
    if (ro) ro.observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure, function () {});
    measure();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("mo:board-ready", forceUpdate);
    window.addEventListener("mo:page-restored", forceUpdate);
    return function () {
      dead = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("mo:board-ready", forceUpdate);
      window.removeEventListener("mo:page-restored", forceUpdate);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (measureRaf) cancelAnimationFrame(measureRaf);
    };
  }, [MODE, FLIGHT_PORTION, FLIGHT_V]);
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
  return React.createElement("section", {
    ref: secRef,
    className: "bf",
    id: "about",
    "data-screen-label": "04 About \u2014 trace the net",
    style: {
      height: "calc(".concat(TOTAL_V, " * 100vh)")
    }
  }, React.createElement("div", {
    className: "aboutNode-layer",
    style: {
      opacity: 0
    },
    "aria-hidden": "true"
  }, React.createElement("div", {
    className: "uNode",
    "data-screen-label": "04 About \u2014 node 0x00",
    style: {
      transform: "scale(1) translateY(26px)",
      filter: "blur(9px)"
    }
  }, React.createElement("span", {
    className: "uNode__cnr uNode__cnr--tl",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "uNode__cnr uNode__cnr--tr",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "uNode__cnr uNode__cnr--bl",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "uNode__cnr uNode__cnr--br",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "uNode__head"
  }, React.createElement("div", {
    className: "uNode__headL"
  }, React.createElement("span", {
    className: "uNode__id",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, React.createElement("span", {
    className: "uNode__sq"
  }), "NODE 0x00"), React.createElement("span", {
    className: "uNode__year",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, "ABOUT")), React.createElement("div", {
    className: "uNode__headR",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, React.createElement("span", null, "MASLOV / OLEKSANDR"), React.createElement("span", null, "48.137\xB0 N \xB7 11.575\xB0 E"))), React.createElement("div", {
    className: "uNode__field",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "uNode__foot"
  }, React.createElement("h3", {
    className: "uNode__name",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, "Source node", React.createElement("em", null, ".")), React.createElement("div", {
    className: "uNode__sub",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, "0x00 has no fixed coordinate. This board is one readable projection of how the source node was formed."), React.createElement("div", {
    className: "uNode__cue",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".aboutNode-layer,.uNode,.lp"
  }, React.createElement("span", {
    className: "uNode__cueLine"
  }), "KEEP SCROLLING \u2014 INSPECT THE SOURCE \u2193")))), React.createElement("div", {
    className: "bf-layer bf-layer--" + MODE,
    ref: layerRef,
    style: {
      opacity: 0,
      pointerEvents: "none"
    },
    inert: "",
    "aria-hidden": "true"
  }, React.createElement("div", {
    className: "bf-mount",
    ref: mountRef
  }), React.createElement("div", {
    className: "bf-grain",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "bf-mark",
    style: {
      opacity: 0
    }
  }, React.createElement("span", {
    className: "bf-mark__dot"
  }), React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-mark,.bf-layer,.lp"
  }, "0x00 \xB7 INTERNAL ARCHITECTURE")), React.createElement("div", {
    className: "bf-stage",
    "aria-hidden": "false"
  }, STOPS.map(function (st, i) {
    var center = st.p / 10;
    return React.createElement("article", {
      key: i,
      className: "bf-ch",
      style: {
        opacity: 0,
        transform: "translateY(".concat((-center * N * 24).toFixed(1), "px)"),
        pointerEvents: "none"
      },
      inert: "",
      "aria-hidden": "true",
      "data-screen-label": st.chapter.n + " " + st.chapter.kicker
    }, React.createElement("div", {
      className: "bf-ch__num",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.chapter.n), React.createElement("div", {
      className: "bf-ch__card"
    }, React.createElement("div", {
      className: "bf-ch__kicker",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.live ? React.createElement("span", {
      className: "bf-ch__live"
    }) : React.createElement("span", {
      className: "bf-ch__dot"
    }), st.chapter.kicker), React.createElement("h2", {
      className: "bf-ch__title",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.chapter.title[0], React.createElement("em", null, st.chapter.title[1]), st.chapter.title[2]), React.createElement("p", {
      className: "bf-ch__body",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.chapter.body), React.createElement("div", {
      className: "bf-ch__ref"
    }, React.createElement("span", {
      className: "bf-ch__refK",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, "COMPONENT"), React.createElement("span", {
      className: "bf-ch__refV",
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-ch,.bf-layer,.lp"
    }, st.ref))));
  })), React.createElement("div", {
    className: "bf-rail",
    style: {
      opacity: 0,
      pointerEvents: "none"
    },
    inert: "",
    "aria-hidden": "true"
  }, STOPS.map(function (st, i) {
    return React.createElement("button", {
      key: i,
      className: "bf-rail__stop " + (active === i ? "is-active" : ""),
      onClick: function onClick() {
        return jump(i);
      }
    }, React.createElement("span", {
      className: "bf-rail__dot"
    }), React.createElement("span", {
      "data-mo-board-cursor-mirror": true,
      "data-mo-cursor-opacity": ".bf-rail,.bf-layer,.lp"
    }, st.chapter.n, " \xB7 ", st.ref.split(" · ")[0]));
  })), React.createElement("div", {
    className: "bf-prog",
    style: {
      opacity: 0
    }
  }, React.createElement("div", {
    className: "bf-prog__fill",
    style: {
      transform: "scaleX(0)"
    }
  })), React.createElement("div", {
    className: "bf-cue",
    style: {
      opacity: 0
    }
  }, React.createElement("span", {
    className: "bf-cue__line"
  }), React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-cue,.bf-layer,.lp"
  }, "KEEP SCROLLING \u2014 FOLLOW THE TRACE \u2193")), React.createElement("div", {
    className: "bf-foot",
    style: {
      opacity: 0,
      pointerEvents: "none"
    },
    inert: "",
    "aria-hidden": "true",
    "data-screen-label": "05 Contact"
  }, React.createElement("div", {
    className: "bf-foot__scrim",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "bf-foot__inner",
    style: {
      transform: "translateY(40px)"
    }
  }, React.createElement("div", {
    className: "bf-foot__kicker",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, React.createElement("span", {
    className: "bf-foot__live"
  }), "SW1 \xB7 OUTPUT \u2014 OPEN CHANNEL"), React.createElement("div", {
    className: "bf-foot__line",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "For products that cross hardware, software and interaction."), React.createElement("a", {
    className: "bf-foot__big t-link",
    href: "mailto:oleksandrmaslov08@gmail.com",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "oleksandrmaslov08", React.createElement("wbr", null), "@gmail.com"), React.createElement("div", {
    className: "bf-foot__links"
  }, React.createElement("a", {
    className: "bf-foot__link",
    href: "https://github.com/oleksandrmaslov",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "GITHUB"), React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "@oleksandrmaslov"), React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2197")), React.createElement("a", {
    className: "bf-foot__link",
    href: "https://t.me/maslov_oleksandr08",
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "TELEGRAM"), React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "@maslov_oleksandr08"), React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2197")), React.createElement("a", {
    className: "bf-foot__link",
    href: "assets/Oleksandr-Maslov-CV.pdf",
    download: true,
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, React.createElement("span", {
    className: "bf-foot__linkKey"
  }, "CV \xB7 PDF"), React.createElement("span", {
    className: "bf-foot__linkVal"
  }, "download \xB7 2 pages"), React.createElement("span", {
    className: "bf-foot__arr"
  }, "\u2193"))), React.createElement("div", {
    className: "bf-foot__meta"
  }, React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "\xA9 2026 \xB7 MASLOV OLEKSANDR"), React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "BUILT IN MUNICH \xB7 v0.1.0"), React.createElement("span", {
    "data-mo-board-cursor-mirror": true,
    "data-mo-cursor-opacity": ".bf-foot,.bf-layer,.lp"
  }, "NO COOKIES \xB7 NO TRACKERS \xB7 STATIC HTML"))))), React.createElement("i", {
    id: "contact",
    className: "bf-anchor",
    "aria-hidden": "true"
  }));
}
window.BoardFlight = BoardFlight;

/* ---- app/landing/sections/title.jsx ---- */
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useT2 = _React.useState,
  useT2E = _React.useEffect,
  useT2R = _React.useRef;
function useCompactTitle() {
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
var gyroRequestT2 = 0;
function FieldGuide(_ref) {
  var dismissed = _ref.dismissed,
    touch = _ref.touch;
  return React.createElement("div", {
    className: "fieldHint " + (dismissed ? "is-dismissed" : ""),
    "aria-hidden": "true"
  }, React.createElement("div", {
    className: "fieldHint__inner"
  }, React.createElement("div", {
    className: "fieldHint__ring"
  }, React.createElement("span", {
    className: "cross"
  }), React.createElement("span", {
    className: "dot"
  })), React.createElement("div", {
    className: "fieldHint__lede",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, "This field is live"), React.createElement("div", {
    className: "fieldHint__cues"
  }, touch ? React.createElement(React.Fragment, null, React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, React.createElement("b", null, "Tap"), " explore"), React.createElement("span", {
    className: "fieldHint__sep"
  }), React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, React.createElement("b", null, "Pinch"), " to fly"), React.createElement("span", {
    className: "fieldHint__sep"
  }), React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, React.createElement("b", null, "Tap"), " a node")) : React.createElement(React.Fragment, null, React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, React.createElement("b", null, "Drag"), " to look"), React.createElement("span", {
    className: "fieldHint__sep"
  }), React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, React.createElement("b", null, "Scroll"), " to fly through"), React.createElement("span", {
    className: "fieldHint__sep"
  }), React.createElement("span", {
    className: "fieldHint__cue",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".fieldHint,.fieldHint__inner,.title__stage,.lp"
  }, React.createElement("b", null, "Click"), " a node")))));
}
function ExploreOverlay(_ref2) {
  var onClose = _ref2.onClose;
  var _useT3 = useT2(function () {
      return !!(window.__mo_universe && window.__mo_universe.isGyroActive && window.__mo_universe.isGyroActive());
    }),
    _useT4 = _slicedToArray(_useT3, 2),
    gyro = _useT4[0],
    setGyro = _useT4[1];
  useT2E(function () {
    document.body.classList.add("mo-explore");
    if (window.__mo_universe) window.__mo_universe.setExplore(true);
    var prevOv = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return function () {
      gyroRequestT2 += 1;
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
  return React.createElement("div", {
    className: "xpl",
    "data-screen-label": "01b Explore mode"
  }, React.createElement("div", {
    className: "xpl__top"
  }, React.createElement("span", {
    className: "xpl__tag"
  }, React.createElement("span", {
    className: "xpl__dot"
  }), "FIELD \xB7 LIVE"), React.createElement("button", {
    type: "button",
    className: "xpl__close",
    onClick: onClose
  }, "EXIT \u2715")), React.createElement("div", {
    className: "xpl__hint"
  }, gyro ? "move phone — look · drag — adjust · pinch — fly · tap — open" : "drag — look · pinch — fly · tap — open"));
}
function requestGyroPermission() {
  var requestId = ++gyroRequestT2;
  try {
    var enable = function enable() {
      if (requestId !== gyroRequestT2) return;
      if (window.__mo_universe) window.__mo_universe.setGyro(true);
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
function TitleScreen() {
  var compact = useCompactTitle(700);
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
  return React.createElement("section", {
    className: "lp-title " + (touched ? "is-touched" : ""),
    id: "title",
    "data-screen-label": "01 Title"
  }, React.createElement("h1", {
    className: "title__sr"
  }, "Oleksandr Maslov \u2014 product systems, embedded systems and interaction"), React.createElement("div", {
    className: "title__stage"
  }, React.createElement("div", {
    className: "title__shield title__shield--top"
  }), React.createElement("div", {
    className: "title__shield title__shield--bot"
  }), React.createElement("div", {
    className: "title__shield title__shield--left"
  }), React.createElement("div", {
    className: "title__shield title__shield--right"
  }), React.createElement("div", {
    className: "title__frame",
    "aria-hidden": "true"
  }, React.createElement("span", {
    className: "title__corner title__corner--tl"
  }), React.createElement("span", {
    className: "title__corner title__corner--tr"
  }), React.createElement("span", {
    className: "title__corner title__corner--bl"
  }), React.createElement("span", {
    className: "title__corner title__corner--br"
  })), React.createElement("div", {
    className: "title__idTop"
  }, React.createElement("span", {
    className: "title__idName",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__idTop,.title__stage,.lp"
  }, React.createElement("span", {
    className: "title__idBullet"
  }, "\u25A0"), "MASLOV / OLEKSANDR"), React.createElement("span", {
    className: "title__idRole",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__idTop,.title__stage,.lp"
  }, "PRODUCT SYSTEMS \xB7 EMBEDDED \xB7 INTERACTION")), React.createElement(FieldGuide, {
    dismissed: touched,
    touch: showExplore
  }), explore && React.createElement(ExploreOverlay, {
    onClose: function onClose() {
      return setExplore(false);
    }
  }), React.createElement("div", {
    className: "title__wordmark"
  }, React.createElement(AsciiHero, {
    text: "M.O.",
    cols: compact ? 64 : 108,
    rows: compact ? 16 : 20
  })), React.createElement("div", {
    className: "title__ctl"
  }, React.createElement("div", {
    className: "title__proceedRow"
  }, showExplore && React.createElement(KeyButton, {
    legend: React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
    }, "\u271B"),
    onPress: function onPress() {
      requestGyroPermission();
      setExplore(true);
    }
  }, React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
  }, "EXPLORE")), React.createElement("span", {
    className: "scrollcue scrollcue--stack"
  }, React.createElement("span", {
    className: "scrollcue__txt",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
  }, "Continue"), React.createElement("span", {
    className: "scrollcue__chev"
  }, React.createElement("span", null), React.createElement("span", null))), React.createElement(KeyButton, {
    legend: React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
    }, "\u21B5"),
    primary: true,
    onPress: proceed
  }, React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__ctl,.title__stage,.lp"
  }, "PROCEED")))), React.createElement("div", {
    className: "title__baseline",
    "aria-hidden": "false"
  }, React.createElement("span", {
    className: "title__wordmarkSub"
  }, React.createElement("span", {
    className: "title__wordmarkSubBullet",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "\u25A0"), React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "KYIV \u2192 MUNICH"), React.createElement("span", {
    className: "title__wordmarkSubSep",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "\xB7"), React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__wordmarkSub,.title__baseline,.title__stage,.lp"
  }, "2026")), React.createElement("span", {
    className: "title__proceedCap",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".title__baseline,.title__stage,.lp"
  }, showExplore ? "tap · or swipe up to continue" : "press \u21B5 \xA0\xB7\xA0 or scroll at the edges"))), React.createElement(TitleKeyboardShortcut, {
    onProceed: proceed
  }));
}
function TitleKeyboardShortcut(_ref3) {
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
window.TitleScreen = TitleScreen;

/* ---- app/landing/sections/origin.jsx ---- */
var _React = React,
  useOE = _React.useEffect,
  useOR = _React.useRef;
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
var _oLineEase = function _oLineEase(p, at) {
  return _oEase(_oClamp((p - (at - 0.24)) / 0.24, 0, 1));
};
window.__mo_origin = window.__mo_origin || {
  p: 0,
  active: false,
  concept: "assembly"
};
function OriginBeat() {
  var secRef = useOR(null);
  var concept = typeof window !== "undefined" && window.__mo_origin_lock || "assembly";
  useOE(function () {
    window.__mo_origin.concept = concept;
  }, [concept]);
  useOE(function () {
    var _window$visualViewpor, _document$fonts;
    var el = secRef.current;
    if (!el) return;
    var typeEl = el.querySelector(".origin__type");
    var lineEls = Array.from(el.querySelectorAll(".origin__line"));
    var sigEl = el.querySelector(".origin__sig");
    var handoffEl = el.querySelector(".origin__handoff");
    if (!typeEl || lineEls.length !== ORIGIN_LINES.length || !sigEl || !handoffEl) return;
    var raf = 0;
    var needsMeasure = true;
    var disposed = false;
    var geometry = {
      top: 0,
      height: 0,
      scrollHeight: 0,
      viewportH: window.innerHeight
    };
    var measure = function measure() {
      var rect = el.getBoundingClientRect();
      geometry.top = rect.top + window.scrollY;
      geometry.height = rect.height;
      geometry.scrollHeight = el.offsetHeight;
      geometry.viewportH = window.innerHeight;
      needsMeasure = false;
    };
    var update = function update() {
      raf = 0;
      if (needsMeasure) measure();
      var pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      var rectTop = geometry.top - pageY;
      var rectBottom = rectTop + geometry.height;
      var total = geometry.scrollHeight - geometry.viewportH;
      var top = -rectTop;
      var np = total > 0 ? _oClamp(top / total, 0, 1) : 0;
      var active = rectTop < geometry.viewportH * 0.6 && rectBottom > geometry.viewportH * 0.4;
      window.__mo_origin.p = np;
      window.__mo_origin.active = active;
      var handoff = _oClamp((np - 0.76) / 0.14, 0, 1);
      var exitK = _oClamp((np - 0.90) / 0.10, 0, 1);
      typeEl.style.opacity = (1 - exitK).toFixed(3);
      typeEl.style.transform = "translateY(".concat((exitK * -46).toFixed(1), "px)");
      typeEl.style.filter = exitK > 0.004 ? "blur(".concat((exitK * 7).toFixed(2), "px)") : "none";
      lineEls.forEach(function (lineEl, i) {
        var e = _oLineEase(np, ORIGIN_LINES[i].at);
        lineEl.style.filter = "blur(".concat(((1 - e) * 16).toFixed(2), "px)");
        lineEl.style.opacity = (0.08 + e * 0.92).toFixed(3);
        lineEl.style.transform = "translateY(".concat(((1 - e) * 18).toFixed(1), "px)");
      });
      sigEl.style.opacity = _oClamp((np - 0.56) / 0.16, 0, 1).toFixed(3);
      handoffEl.style.opacity = handoff.toFixed(3);
      handoffEl.style.transform = "translateY(".concat((1 - handoff) * 10, "px)");
    };
    var schedule = function schedule() {
      var remeasure = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      needsMeasure = needsMeasure || remeasure;
      if (!raf) raf = requestAnimationFrame(update);
    };
    var onScroll = function onScroll() {
      return schedule(false);
    };
    var onResize = function onResize() {
      return schedule(true);
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", onResize);
    (_window$visualViewpor = window.visualViewport) === null || _window$visualViewpor === void 0 || _window$visualViewpor.addEventListener("resize", onResize);
    var resizeObserver = window.ResizeObserver ? new ResizeObserver(function () {
      return schedule(true);
    }) : null;
    resizeObserver === null || resizeObserver === void 0 || resizeObserver.observe(el);
    if ((_document$fonts = document.fonts) !== null && _document$fonts !== void 0 && _document$fonts.ready) {
      document.fonts.ready.then(function () {
        if (!disposed) schedule(true);
      });
    }
    return function () {
      var _window$visualViewpor2;
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      (_window$visualViewpor2 = window.visualViewport) === null || _window$visualViewpor2 === void 0 || _window$visualViewpor2.removeEventListener("resize", onResize);
      resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return React.createElement("section", {
    ref: secRef,
    className: "origin",
    id: "intro",
    "data-screen-label": "02 Origin",
    style: {
      height: "300vh"
    }
  }, React.createElement("div", {
    className: "origin__stage"
  }, React.createElement("div", {
    className: "origin__scrim",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "origin__type",
    style: {
      opacity: "1.000",
      transform: "translateY(0.0px)",
      filter: "none"
    }
  }, React.createElement("div", {
    className: "origin__kicker"
  }, React.createElement("span", {
    className: "origin__kickerDot"
  }), React.createElement("span", {
    className: "origin__kickerAddr",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__type,.origin__stage,.lp"
  }, "0x00"), React.createElement("span", {
    className: "origin__kickerSep"
  }), React.createElement("span", {
    className: "origin__kickerName",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__type,.origin__stage,.lp"
  }, "MASLOV / OLEKSANDR"), React.createElement("span", {
    className: "origin__kickerSep"
  }), React.createElement("span", {
    className: "origin__kickerRoute",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__type,.origin__stage,.lp"
  }, "KYIV \u2192 M\xDCNCHEN")), React.createElement("h2", {
    className: "origin__head2"
  }, ORIGIN_LINES.map(function (ln, i) {
    var e = _oLineEase(0, ln.at);
    var style = {
      filter: "blur(".concat(((1 - e) * 16).toFixed(2), "px)"),
      opacity: (0.08 + e * 0.92).toFixed(3),
      transform: "translateY(".concat(((1 - e) * 18).toFixed(1), "px)"),
      color: "var(--bone)"
    };
    var cls = "origin__line" + (ln.em ? " origin__line--em" : "") + (ln.ghost ? " origin__line--ghost" : "");
    return React.createElement("span", {
      key: i,
      className: cls,
      style: style
    }, React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".origin__line,.origin__type,.origin__stage,.lp"
    }, ln.t, ln.dot ? React.createElement("em", {
      className: "origin__period"
    }, ".") : null));
  })), React.createElement("div", {
    className: "origin__sig",
    style: {
      opacity: "0.000"
    }
  }, React.createElement("div", {
    className: "origin__sigCol",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__sig,.origin__type,.origin__stage,.lp"
  }, React.createElement("span", {
    className: "origin__sigK"
  }, "\u2599 NOW"), React.createElement("span", {
    className: "origin__sigV"
  }, "ZMK \xB7 Kerfur \xB7 Iskra")), React.createElement("div", {
    className: "origin__sigCol",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".origin__sig,.origin__type,.origin__stage,.lp"
  }, React.createElement("span", {
    className: "origin__sigK"
  }, "\u2599 NEXT"), React.createElement("span", {
    className: "origin__sigV"
  }, "University / technical Ausbildung \xB7 Wafer company")))), React.createElement("div", {
    className: "origin__handoff",
    style: {
      opacity: "0.000",
      transform: "translateY(10px)"
    }
  }, React.createElement("span", {
    className: "origin__handoffLine"
  }), React.createElement("span", null, "03 \xB7 SELECTED WORK"), React.createElement("span", {
    className: "origin__handoffArr"
  }, "\u2193"))));
}
window.OriginBeat = OriginBeat;

/* ---- app/landing/sections/work.jsx ---- */
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useL = _React.useState,
  useE = _React.useEffect,
  useLE = _React.useLayoutEffect,
  useR = _React.useRef;
var FEATURED_ADDRS = window.MO_FEATURED_ADDRS || ["0x01", "0x03", "0x04", "0x06"];
var WORKS = FEATURED_ADDRS.map(function (addr) {
  return (window.MO_PROJECTS || []).find(function (p) {
    return p.addr === addr;
  });
}).filter(Boolean);
function workReelGeometry(viewportWidth, count) {
  var compact = viewportWidth <= 700;
  var mid = viewportWidth <= 1100;
  var titleSlot = compact ? 100 : mid ? 80 : 56;
  var cardSlot = compact ? 78 : mid ? 70 : 52;
  var showAllSlot = compact ? 96 : mid ? 70 : 52;
  var titleGutter = compact ? "var(--s-5)" : "var(--gutter)";
  var centers = [titleSlot / 2];
  var cursor = titleSlot;
  for (var i = 0; i < count; i++) {
    centers.push(cursor + cardSlot / 2);
    cursor += cardSlot;
  }
  centers.push(cursor + showAllSlot / 2);
  return {
    titleSlot: titleSlot,
    cardSlot: cardSlot,
    showAllSlot: showAllSlot,
    titleLeft: "calc(".concat(titleGutter, " - ").concat((50 - titleSlot / 2).toFixed(2), "vw)"),
    centers: centers
  };
}
function Work(_ref) {
  var onHoverWork = _ref.onHoverWork;
  var sectionRef = useR(null);
  var bgRef = useR(null);
  var railRef = useR(null);
  var fillRef = useR(null);
  var cardsRef = useR([]);
  var showAllRef = useR(null);
  var layoutRef = useR({
    top: 0,
    total: 0
  });
  var geometryRef = useR(null);
  var progressRef = useR(0);
  var applyProgressRef = useR(null);
  var activeStopRef = useR(0);
  var _useL = useL(0),
    _useL2 = _slicedToArray(_useL, 2),
    activeStop = _useL2[0],
    setActiveStop = _useL2[1];
  var _useL3 = useL(null),
    _useL4 = _slicedToArray(_useL3, 2),
    focused = _useL4[0],
    setFocused = _useL4[1];
  var N = WORKS.length;
  var STOPS = N + 2;
  var PADS = 0.6;
  var TOTAL_V = STOPS + PADS;
  var activeCardIdx = Math.max(0, activeStop - 1);
  var activeWork = activeStop === 0 || activeStop > N ? null : WORKS[activeCardIdx];
  useE(function () {
    onHoverWork && onHoverWork(focused || (activeWork === null || activeWork === void 0 ? void 0 : activeWork.addr) || null);
  }, [focused, activeWork, onHoverWork]);
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
  var renderGeometry = workReelGeometry(window.innerWidth, N);
  geometryRef.current = renderGeometry;
  useE(function () {
    var el = sectionRef.current;
    if (!el) return;
    var raf = 0;
    var resizeObserver = null;
    var disposed = false;
    var intervals = STOPS - 1;
    var padN = PADS / TOTAL_V;
    var easeInOut = function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
    var applyProgress = function applyProgress(snapped) {
      var centers = geometryRef.current.centers;
      var pp = snapped * intervals;
      var idx0 = Math.max(0, Math.min(STOPS - 2, Math.floor(pp)));
      var tt = pp - idx0;
      var centerVW = centers[idx0] * (1 - tt) + centers[idx0 + 1] * tt;
      var railShiftVW = 50 - centerVW;
      if (railRef.current) railRef.current.style.transform = "translateX(".concat(railShiftVW, "vw)");
      if (bgRef.current) bgRef.current.style.transform = "translateX(".concat(railShiftVW * 0.35, "vw)");
      if (fillRef.current) fillRef.current.style.transform = "scaleX(".concat(snapped.toFixed(4), ")");
      cardsRef.current.forEach(function (card, i) {
        if (!card) return;
        var stopIdx = i + 1;
        var delta = snapped - stopIdx / intervals;
        var absD = Math.min(1, Math.abs(delta) * intervals);
        var locked = activeStopRef.current === stopIdx && Math.abs(delta) < 0.5 / intervals;
        card.style.transform = "scale(".concat((locked ? 1.025 : 1 - absD * 0.06).toFixed(3), ")");
        card.style.opacity = (1 - absD * 0.4).toFixed(3);
        card.classList.toggle("rcard--locked", locked);
      });
      var gate = showAllRef.current;
      if (gate) {
        var stopIdx = N + 1;
        var delta = snapped - stopIdx / intervals;
        var absD = Math.min(1, Math.abs(delta) * intervals);
        var locked = activeStopRef.current === stopIdx && Math.abs(delta) < 0.5 / intervals;
        gate.style.transform = "scale(".concat((locked ? 1.02 : 1 - absD * 0.06).toFixed(3), ")");
        gate.style.opacity = (1 - absD * 0.4).toFixed(3);
        gate.classList.toggle("showAllGate--locked", locked);
      }
    };
    applyProgressRef.current = applyProgress;
    var update = function update() {
      raf = 0;
      if (disposed) return;
      var _layoutRef$current = layoutRef.current,
        top = _layoutRef$current.top,
        total = _layoutRef$current.total;
      var pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      var pRaw = total > 0 ? Math.max(0, Math.min(1, (pageY - top) / total)) : 0;
      var p = Math.max(0, Math.min(1, (pRaw - padN) / (1 - 2 * padN)));
      var local = p * intervals;
      var idx = Math.floor(local);
      var frac = local - idx;
      var snapped = (idx + easeInOut(frac)) / intervals;
      var nextStop = Math.round(snapped * intervals);
      progressRef.current = snapped;
      window.__mo_reel = window.__mo_reel || {};
      window.__mo_reel.pos = snapped * intervals;
      if (activeStopRef.current !== nextStop) {
        activeStopRef.current = nextStop;
        setActiveStop(nextStop);
      }
      applyProgress(snapped);
    };
    var scheduleUpdate = function scheduleUpdate() {
      if (!raf) raf = requestAnimationFrame(update);
    };
    var measure = function measure() {
      if (disposed) return;
      var geometry = workReelGeometry(window.innerWidth, N);
      var rect = el.getBoundingClientRect();
      geometryRef.current = geometry;
      layoutRef.current.top = rect.top + window.scrollY;
      layoutRef.current.total = Math.max(0, el.offsetHeight - window.innerHeight);
      el.style.setProperty("--work-title-slot", "".concat(geometry.titleSlot, "vw"));
      el.style.setProperty("--work-card-slot", "".concat(geometry.cardSlot, "vw"));
      el.style.setProperty("--work-showall-slot", "".concat(geometry.showAllSlot, "vw"));
      el.style.setProperty("--work-title-left", geometry.titleLeft);
      scheduleUpdate();
    };
    measure();
    window.addEventListener("scroll", scheduleUpdate, {
      passive: true
    });
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(el);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure)["catch"](function () {});
    return function () {
      disposed = true;
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", measure);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(raf);
      if (applyProgressRef.current === applyProgress) applyProgressRef.current = null;
    };
  }, [N, STOPS, PADS, TOTAL_V]);
  useLE(function () {
    if (applyProgressRef.current) applyProgressRef.current(progressRef.current);
  }, [activeStop, focused]);
  var initialCenterVW = renderGeometry.centers[0];
  var initialRailShiftVW = 50 - initialCenterVW;
  var jumpToStop = function jumpToStop(stopIdx) {
    var el = sectionRef.current;
    if (!el) return;
    var _layoutRef$current2 = layoutRef.current,
      top = _layoutRef$current2.top,
      total = _layoutRef$current2.total;
    if (total <= 0) {
      var rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      total = Math.max(0, el.offsetHeight - window.innerHeight);
      layoutRef.current = {
        top: top,
        total: total
      };
    }
    if (total <= 0) return;
    var padN = PADS / TOTAL_V;
    var target = padN + stopIdx / (STOPS - 1) * (1 - 2 * padN);
    window.scrollTo({
      top: top + target * total,
      behavior: "smooth"
    });
  };
  return React.createElement("section", {
    ref: sectionRef,
    className: "lp-section lp-workReel",
    id: "work",
    "data-screen-label": "02 Work",
    style: {
      height: "calc(".concat(TOTAL_V, " * 100vh)"),
      "--work-title-slot": "".concat(renderGeometry.titleSlot, "vw"),
      "--work-card-slot": "".concat(renderGeometry.cardSlot, "vw"),
      "--work-showall-slot": "".concat(renderGeometry.showAllSlot, "vw"),
      "--work-title-left": renderGeometry.titleLeft
    }
  }, React.createElement("div", {
    className: "lp-workReel__sticky"
  }, React.createElement("div", {
    ref: bgRef,
    className: "lp-workReel__bg",
    style: {
      transform: "translateX(".concat(initialRailShiftVW * 0.35, "vw)")
    }
  }), React.createElement("div", {
    ref: railRef,
    className: "lp-workReel__rail",
    style: {
      transform: "translateX(".concat(initialRailShiftVW, "vw)")
    }
  }, React.createElement("div", {
    className: "lp-workReel__slot lp-workReel__slot--title"
  }, React.createElement("div", {
    className: "lp-workReel__titleInner"
  }, React.createElement("div", {
    className: "lp-workReel__titleNum"
  }, React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__sticky,.lp"
  }, "02")), React.createElement("h2", {
    className: "lp-workReel__title",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__sticky,.lp"
  }, "Selected nodes", React.createElement("em", null, ".")), React.createElement("div", {
    className: "lp-workReel__titleSub"
  }, React.createElement("span", {
    className: "lp-workReel__titleSubDot"
  }), React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__sticky,.lp"
  }, "Scroll \u2014 each node resolves at the lens.")))), WORKS.map(function (w, i) {
    return React.createElement("div", {
      className: "lp-workReel__slot",
      key: w.addr
    }, React.createElement(NodeCard, {
      work: w,
      i: i,
      total: N,
      nodeRef: function nodeRef(node) {
        cardsRef.current[i] = node;
      },
      focused: focused === w.addr,
      onFocus: setFocused
    }));
  }), React.createElement("div", {
    className: "lp-workReel__slot lp-workReel__slot--showAll"
  }, React.createElement("div", {
    ref: showAllRef,
    className: "showAllGate",
    "data-screen-label": "06 All projects gate",
    style: {
      transform: "scale(0.940)",
      opacity: "0.600"
    }
  }, React.createElement("span", {
    className: "showAllGate__spine",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "showAllGate__body"
  }, React.createElement("div", {
    className: "showAllGate__overline",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
  }, "04 / END \xB7 PASSAGE"), React.createElement("h3", {
    className: "showAllGate__name",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
  }, "Open the universe", React.createElement("em", null, ".")), React.createElement("div", {
    className: "showAllGate__sub",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
  }, (window.MO_PROJECTS || []).length, " nodes \u2014 products, systems, modules and studies. Enter the full field. ESC returns here.")), React.createElement("div", {
    className: "showAllGate__key"
  }, React.createElement(KeyButton, {
    legend: React.createElement("span", {
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
  }, React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".showAllGate,.lp-workReel__sticky,.lp"
  }, "SHOW ALL")))))), React.createElement("div", {
    className: "lp-workReel__vignette"
  }), React.createElement("div", {
    className: "lp-workReel__stops"
  }, React.createElement("button", {
    type: "button",
    className: "lp-workReel__stopBtn " + (activeStop === 0 ? "is-active" : ""),
    onClick: function onClick() {
      return jumpToStop(0);
    }
  }, React.createElement("span", {
    className: "lp-workReel__stopDot"
  }), React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__stops,.lp-workReel__sticky,.lp"
  }, "00 \xB7 TITLE")), WORKS.map(function (w, i) {
    return React.createElement("button", {
      type: "button",
      key: w.addr,
      className: "lp-workReel__stopBtn " + (activeStop === i + 1 ? "is-active" : ""),
      onClick: function onClick() {
        return jumpToStop(i + 1);
      }
    }, React.createElement("span", {
      className: "lp-workReel__stopDot"
    }), React.createElement("span", {
      "data-mo-cursor-mirror": true,
      "data-mo-cursor-opacity": ".lp-workReel__stops,.lp-workReel__sticky,.lp"
    }, (i + 1).toString().padStart(2, "0"), " \xB7 ", w.name.toUpperCase()));
  }), React.createElement("button", {
    type: "button",
    className: "lp-workReel__stopBtn lp-workReel__stopBtn--showAll " + (activeStop === N + 1 ? "is-active" : ""),
    onClick: function onClick() {
      return jumpToStop(N + 1);
    }
  }, React.createElement("span", {
    className: "lp-workReel__stopDot"
  }), React.createElement("span", {
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".lp-workReel__stops,.lp-workReel__sticky,.lp"
  }, (N + 1).toString().padStart(2, "0"), " \xB7 ALL \u2197"))), React.createElement("div", {
    className: "lp-workReel__progressRail"
  }, React.createElement("div", {
    ref: fillRef,
    className: "lp-workReel__progressFill",
    style: {
      transform: "scaleX(0)"
    }
  }))));
}
function NodeCard(_ref2) {
  var work = _ref2.work,
    i = _ref2.i,
    total = _ref2.total,
    nodeRef = _ref2.nodeRef,
    focused = _ref2.focused,
    _onFocus = _ref2.onFocus;
  var cardRef = useR(null);
  var hasPage = !!work.file;
  var openNode = function openNode() {
    if (!hasPage) return;
    var project = work;
    var originRect = null;
    var uni = window.__mo_universe;
    if (uni && typeof uni.tileBounds === "function") {
      try {
        originRect = uni.tileBounds(work.addr);
      } catch (_) {
        originRect = null;
      }
    }
    if (!originRect) {
      var rect = cardRef.current ? cardRef.current.getBoundingClientRect() : null;
      originRect = rect ? {
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height
      } : null;
    }
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
  return React.createElement("article", _extends({
    ref: function ref(node) {
      cardRef.current = node;
      if (nodeRef) nodeRef(node);
    },
    className: "rcard " + (focused ? "rcard--focused" : ""),
    "data-addr": work.addr
  }, hasPage ? {
    "data-hot": ""
  } : {}, {
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
      transform: "scale(0.940)",
      opacity: "0.600"
    }
  }), React.createElement("span", {
    className: "rcard__spine",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "rcard__body"
  }, React.createElement("div", {
    className: "rcard__top",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, React.createElement("span", {
    className: "rcard__topAddr"
  }, "NODE ", work.addr), React.createElement("span", {
    className: "rcard__topSep"
  }), React.createElement("span", {
    className: "rcard__topIdx"
  }, (i + 1).toString().padStart(2, "0"), " / ", total.toString().padStart(2, "0"))), React.createElement("h3", {
    className: "rcard__name",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, work.name, React.createElement("em", null, ".")), React.createElement("div", {
    className: "rcard__sub",
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, work["short"] || work.statement)), React.createElement("div", {
    className: "rcard__open " + (hasPage ? "" : "rcard__open--forming"),
    "data-mo-cursor-mirror": true,
    "data-mo-cursor-opacity": ".rcard,.lp-workReel__sticky,.lp"
  }, React.createElement("span", null, hasPage ? "OPEN" : "RECORD FORMING"), hasPage && React.createElement("span", {
    className: "rcard__arr"
  }, "\u2192")));
}
window.Work = Work;
window.WORKS = WORKS;
window.FEATURED_ADDRS = FEATURED_ADDRS;

/* ---- app/landing/app.jsx ---- */
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useLA = _React.useState,
  useEA = _React.useEffect;
function LandingApp() {
  var _useLA = useLA("title"),
    _useLA2 = _slicedToArray(_useLA, 2),
    section = _useLA2[0],
    setSection = _useLA2[1];
  var _useLA3 = useLA(null),
    _useLA4 = _slicedToArray(_useLA3, 2),
    hoverAddr = _useLA4[0],
    setHoverAddr = _useLA4[1];
  useEA(function () {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    var secondRaf = 0;
    var firstRaf = requestAnimationFrame(function () {
      secondRaf = requestAnimationFrame(function () {
        var target = document.getElementById(id);
        if (target) target.scrollIntoView({
          block: "start",
          behavior: "auto"
        });
      });
    });
    return function () {
      cancelAnimationFrame(firstRaf);
      cancelAnimationFrame(secondRaf);
    };
  }, []);
  useEA(function () {
    var ORDER = ["title", "intro", "work", "about"];
    var raf = 0,
      measureRaf = 0,
      dead = false;
    var bounds = [];
    var resolve = function resolve() {
      raf = 0;
      var pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      var mid = pageY + window.innerHeight / 2;
      var pick = null,
        nearest = Infinity;
      var _iterator = _createForOfIteratorHelper(bounds),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var bound = _step.value;
          if (bound.top <= mid && bound.bottom >= mid) {
            pick = bound.id;
            break;
          }
          var d = bound.top > mid ? bound.top - mid : mid - bound.bottom;
          if (d < nearest) {
            nearest = d;
            pick = bound.id;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (!pick) return;
      if (pick === "about" && window.__mo_bf && window.__mo_bf.footer) pick = "contact";
      setSection(function (prev) {
        return prev === pick ? prev : pick;
      });
    };
    var measure = function measure() {
      measureRaf = 0;
      if (dead) return;
      var pageY = window.scrollY;
      bounds = ORDER.map(function (id) {
        var el = document.getElementById(id);
        if (!el) return null;
        var rect = el.getBoundingClientRect();
        return {
          id: id,
          top: rect.top + pageY,
          bottom: rect.bottom + pageY
        };
      }).filter(Boolean);
      resolve();
    };
    var scheduleMeasure = function scheduleMeasure() {
      if (!measureRaf) measureRaf = requestAnimationFrame(measure);
    };
    var onScroll = function onScroll() {
      if (!raf) raf = requestAnimationFrame(resolve);
    };
    var ro = window.ResizeObserver ? new ResizeObserver(scheduleMeasure) : null;
    if (ro) ORDER.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) ro.observe(el);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure, function () {});
    measure();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    window.addEventListener("resize", scheduleMeasure);
    return function () {
      dead = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleMeasure);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (measureRaf) cancelAnimationFrame(measureRaf);
    };
  }, []);
  var mode = section === "work" ? "reel" : section === "intro" ? "origin" : section === "about" ? "drift" : section === "contact" ? "drift" : "drift";
  useEA(function () {
    try {
      window.dispatchEvent(new CustomEvent("mo:section", {
        detail: {
          section: section
        }
      }));
    } catch (_) {}
  }, [section]);
  return React.createElement(React.Fragment, null, React.createElement("a", {
    className: "mo-skip-link",
    href: "#work"
  }, "Skip to selected work"), React.createElement(Cursor, null), React.createElement("div", {
    className: "universeBg universeBg--" + mode
  }, React.createElement(Universe, {
    projects: window.UNIVERSE_PROJECTS,
    mode: mode,
    focusAddr: hoverAddr
  })), React.createElement(ShellLanding, {
    section: section
  }), window.NodeHandoff ? React.createElement(NodeHandoff, null) : null, React.createElement("main", {
    className: "lp"
  }, React.createElement(TitleScreen, null), React.createElement(OriginBeat, null), React.createElement(Work, {
    onHoverWork: setHoverAddr
  }), React.createElement(BoardFlight, null)));
}
function ShellLanding(_ref) {
  var section = _ref.section;
  var _useLA5 = useLA("--:--"),
    _useLA6 = _slicedToArray(_useLA5, 2),
    time = _useLA6[0],
    setTime = _useLA6[1];
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
  return React.createElement("header", {
    className: "shell lp-shell"
  }, React.createElement("div", {
    className: "lp-shell__blur",
    "aria-hidden": "true"
  }, React.createElement("div", null), React.createElement("div", null), React.createElement("div", null), React.createElement("div", null), React.createElement("div", null), React.createElement("div", null), React.createElement("div", null)), React.createElement("a", {
    className: "shell__brand",
    href: "#title",
    "aria-label": "Back to the title"
  }, "M.O."), React.createElement("nav", {
    className: "shell__nav"
  }, React.createElement("a", {
    href: "#work",
    className: section === "work" ? "is-active" : "",
    "aria-current": section === "work" ? "location" : undefined
  }, "WORK"), React.createElement("a", {
    href: "#about",
    className: section === "about" ? "is-active" : "",
    "aria-current": section === "about" ? "location" : undefined
  }, "ABOUT"), React.createElement("a", {
    href: "#contact",
    className: section === "contact" ? "is-active" : "",
    "aria-current": section === "contact" ? "location" : undefined
  }, "CONTACT"), React.createElement("a", {
    href: "All Projects.html"
  }, "INDEX \u2197")), React.createElement("div", {
    className: "shell__status"
  }, React.createElement("span", {
    className: "shell__dot"
  }), React.createElement("span", null, "MUC \xB7 ", time, " GMT+1"), React.createElement(VolumeToggle, null)));
}
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
      var target = on ? 1.6 + lvl * 9 : 0;
      amp += (target - amp) * 0.15;
      if (on) phase += 0.22;
      var d = "";
      for (var i = 0; i <= N; i++) {
        var x = i / N * W;
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
  return React.createElement("button", {
    className: "volBtn " + (muted ? "is-off" : "is-on"),
    onClick: click,
    "aria-label": muted ? "Enable sound" : "Mute sound",
    title: muted ? "Enable sound — 0x00 carrier field" : "Mute sound"
  }, React.createElement("svg", {
    className: "volBtn__wave",
    viewBox: "0 0 38 16",
    width: "38",
    height: "16",
    "aria-hidden": "true"
  }, React.createElement("path", {
    ref: pathRef,
    d: "M0 8 L38 8",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), React.createElement("span", null, muted ? "sound off" : "sound on"));
}
var landingMounted = false;
function mountLanding() {
  if (landingMounted || !window.THREE) return;
  landingMounted = true;
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(LandingApp, null));
}
if (window.THREE) mountLanding();else window.addEventListener("mo:three-ready", mountLanding, {
  once: true
});
