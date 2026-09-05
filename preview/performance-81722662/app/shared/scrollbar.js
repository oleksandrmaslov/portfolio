/* ============================================================
   M.O. SYSTEM — Shared RAMP scrollbar
   ------------------------------------------------------------
   A fixed ASCII rail on the right edge that tracks WINDOW scroll.
   Lifted from the ASCII Scrollbar Lab's "RAMP" style (density-glyph
   thumb glow over an empty void track) and fused with the GAUGE
   readout — but the readout is STACKED: the live percentage sits
   directly on top of the hex "node code" (0x00–0xFF), both right-
   aligned, so it reads like the universe's node addresses.

   Native scrollbar is hidden in app/shared/styles/scrollbar.css; this rail is the
   only scroll indicator. Draggable + click-to-scroll.
   ============================================================ */
(function () {
  "use strict";

  // bright -> faint, same as the lab's RAMP thumb
  var RAMP_DENSE = "@%#*+=:-\u00b7";
  var LINE_H = 13;          // px per cell (matches .asb__cell)
  var MIN_THUMB = 9;        // keep the thumb a substantial ramp run (lab-length)
  var HOT_ZONE = 96;        // px from the right edge that counts as "near"
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  function scrollMetrics() {
    var se = document.scrollingElement || document.documentElement;
    var max = se.scrollHeight - se.clientHeight;
    return {
      se: se,
      max: max,
      frac: max > 0 ? clamp(se.scrollTop / max, 0, 1) : 0,
      view: se.clientHeight / se.scrollHeight,
    };
  }

  function ScrollRail() {
    var rail = document.createElement("div");
    rail.className = "asb asb--ramp asb--rail";
    rail.setAttribute("aria-hidden", "true");

    var col = document.createElement("div");
    col.className = "asb__col";
    rail.appendChild(col);

    var tag = document.createElement("div");
    tag.className = "asb__tag";
    rail.appendChild(tag);

    document.body.appendChild(rail);

    this.rail = rail;
    this.col = col;
    this.tag = tag;
    this.cells = [];
    this.n = 0;
    this.railHeight = 0;
    this.scrollEl = document.scrollingElement || document.documentElement;
    this.scrollTop = this.scrollEl.scrollTop;
    this.scrollMax = 0;
    this.scrollView = 1;

    this._refreshLayout();
    this._bind();
    this.update();
  }

  ScrollRail.prototype._build = function (railHeight) {
    var n = Math.max(8, Math.floor(railHeight / LINE_H));
    if (n === this.n) return;
    this.n = n;
    this.col.innerHTML = "";
    this.cells = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement("span");
      c.className = "asb__cell";
      this.col.appendChild(c);
      this.cells.push(c);
    }
  };

  ScrollRail.prototype._refreshLayout = function () {
    // Read every geometry value before _build/update write text, attributes or
    // inline styles. The old update path read rail.clientHeight after those
    // writes, forcing a full synchronous layout on nearly every scroll frame.
    var railHeight = this.rail.clientHeight;
    var m = scrollMetrics();
    this.railHeight = railHeight;
    this.scrollEl = m.se;
    this.scrollTop = m.se.scrollTop;
    this.scrollMax = m.max;
    this.scrollView = m.view;
    this._build(railHeight);
  };

  ScrollRail.prototype._bind = function () {
    var self = this;
    var raf = 0;
    var onScroll = function () {
      // Capture the compositor-owned scroll position in the scroll event.
      // Reading it later, after this rail and the flight controller have
      // written styles, can synchronously flush that pending style work.
      self.scrollTop = self.scrollEl.scrollTop;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; self.update(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    var layoutRaf = 0;
    var refreshLayout = function () {
      if (layoutRaf) return;
      layoutRaf = requestAnimationFrame(function () {
        layoutRaf = 0;
        self._refreshLayout();
        self.update();
      });
    };
    window.addEventListener("resize", refreshLayout);

    // React can commit after this classic script. Use bounded lifecycle
    // refreshes rather than observing <body> forever: the fixed rail's own
    // text updates made the body observer re-read document geometry during
    // long scroll transitions on some engines.
    window.addEventListener("load", refreshLayout, { once: true });
    window.addEventListener("mo:title-ready", refreshLayout, { once: true });
    window.addEventListener("pageshow", refreshLayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshLayout, function () {});
    setTimeout(refreshLayout, 0);
    setTimeout(refreshLayout, 750);

    // drag / click-to-scroll
    var dragging = false;
    var toScroll = function (clientY) {
      var r = self.rail.getBoundingClientRect();
      var f = clamp((clientY - r.top) / r.height, 0, 1);
      window.scrollTo(0, f * self.scrollMax);
    };
    this.rail.addEventListener("pointerdown", function (e) {
      dragging = true;
      try { self.rail.setPointerCapture(e.pointerId); } catch (_) {}
      self.rail.classList.add("is-drag", "is-hot");
      toScroll(e.clientY); e.preventDefault();
    });
    this.rail.addEventListener("pointermove", function (e) { if (dragging) toScroll(e.clientY); });
    var end = function (e) {
      dragging = false;
      self.rail.classList.remove("is-drag");
      // keep lit only if the pointer is still near the right edge
      if (e && e.clientX < window.innerWidth - HOT_ZONE)
        self.rail.classList.remove("is-hot");
    };
    this.rail.addEventListener("pointerup", end);
    this.rail.addEventListener("pointercancel", end);

    // PROXIMITY: the rail (and its readout) only lights up when the cursor is
    // near or on the right edge — quiet grey otherwise. Cheap edge-distance
    // check on a passive listener; never interferes with universe drag.
    window.addEventListener("pointermove", function (e) {
      if (dragging) return;
      var near = e.clientX >= window.innerWidth - HOT_ZONE;
      if (near !== self.rail.classList.contains("is-hot"))
        self.rail.classList.toggle("is-hot", near);
    }, { passive: true });
  };

  ScrollRail.prototype.update = function () {
    var max = this.scrollMax;
    var frac = max > 0 ? clamp(this.scrollTop / max, 0, 1) : 0;
    var view = this.scrollView;
    var n = this.n;

    // nothing to scroll → keep the rail out of the way
    this.rail.classList.toggle("is-void", max <= 1);

    var thumb = clamp(Math.round(view * n), MIN_THUMB, n);
    var start = Math.round(frac * (n - thumb));
    var end = start + thumb - 1;

    for (var i = 0; i < n; i++) {
      var inThumb = i >= start && i <= end;
      // t: -1..1 within the thumb (0 = centre)
      var t = thumb > 1 ? ((i - start) / (thumb - 1)) * 2 - 1 : 0;
      var cell = this.cells[i];
      var ch, st;
      if (!inThumb) {
        ch = "\u00b7"; st = "faint";
      } else {
        var idx = Math.round(Math.pow(Math.abs(t), 2.2) * (RAMP_DENSE.length - 1));
        ch = RAMP_DENSE.charAt(clamp(idx, 0, RAMP_DENSE.length - 1));
        st = Math.abs(t) < 0.7 ? "thumb" : "thumb-dim";
      }
      if (cell._ch !== ch) { cell.textContent = ch; cell._ch = ch; }
      if (cell._st !== st) { cell.dataset.state = st; cell._st = st; }
    }

    // STACKED readout: percentage on top of the hex node code, right-aligned
    var pct = Math.round(frac * 100);
    var hx = Math.round(frac * 255).toString(16).toUpperCase();
    if (hx.length < 2) hx = "0" + hx;
    var html = "<b>" + (pct < 10 ? "0" + pct : pct) + "%</b><span>0x" + hx + "</span>";
    if (this.tag._html !== html) { this.tag.innerHTML = html; this.tag._html = html; }
    var mid = (start + end) / 2;
    var y = (mid + 0.5) * (this.railHeight / n);
    this.tag.style.top = y + "px";
  };

  function boot() {
    if (document.querySelector(".asb--rail")) return;
    // skip on coarse pointers — native scroll feel is restored via CSS
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    new ScrollRail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
