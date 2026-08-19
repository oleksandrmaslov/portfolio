/* ============================================================
   M.O. SYSTEM — ASCII Scrollbar  (custom monospace overlay)
   ------------------------------------------------------------
   Native ::-webkit-scrollbar can't hold glyphs, so each bar is a
   column of monospace cells tracking the real scroll position.
   One engine, several render "styles" — all driven by scroll +
   draggable. Reuses the system ramp " ·:-=+*#%@" and tokens.

     new AsciiScrollbar(railEl, scrollEl, { style: "ramp" });

   railEl  — the fixed-width column element (gets the cells)
   scrollEl— the element whose scroll it reflects/controls
   ============================================================ */
(function (global) {
  "use strict";

  const RAMP = " ·:-=+*#%@";              // system density ramp
  const RAMP_DENSE = "@%#*+=:-·";          // bright→faint, for the thumb glow

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const STYLES = {
    // 1 — BLOCKS: dashed track, solid slug. The pure terminal scrollbar.
    blocks: {
      label: "BLOCKS",
      cell(inThumb) { return inThumb ? "█" : "┊"; },
      state(inThumb, edge) { return inThumb ? "thumb" : "track"; },
    },
    // 2 — RAMP: the signature density ramp. Thumb is a glyph glow, dense at
    //     its centre and falling off through the ramp; track is empty void.
    ramp: {
      label: "RAMP",
      cell(inThumb, edge, t) {
        if (!inThumb) return "·";
        // dense across most of the thumb, tapering only at the very edges
        const idx = Math.round(Math.pow(Math.abs(t), 2.2) * (RAMP_DENSE.length - 1));
        return RAMP_DENSE[clamp(idx, 0, RAMP_DENSE.length - 1)];
      },
      state(inThumb, edge, t) {
        if (!inThumb) return "faint";
        return Math.abs(t) < 0.7 ? "thumb" : "thumb-dim";
      },
    },
    // 3 — RETICLE: corner-bracket thumb + a "+NN%" readout that rides it.
    //     Mirrors the landing cursor's lock-on reticle.
    reticle: {
      label: "RETICLE",
      readout: true,
      cell(inThumb, edge) {
        if (edge === "top") return "┏";
        if (edge === "bot") return "┗";
        return inThumb ? "┃" : "·";
      },
      state(inThumb, edge) { return inThumb ? (edge ? "edge" : "thumb") : "faint"; },
    },
    // 4 — SEGMENTS: a ruler — ticks every cell, majors every 5 — with a bright
    //     run for the thumb and a "◄" index marker on the gutter.
    segments: {
      label: "SEGMENTS",
      marker: true,
      cell(inThumb, edge, t, i) {
        if (inThumb) return "█";
        return i % 5 === 0 ? "┼" : "─";
      },
      state(inThumb, edge, t, i) {
        if (inThumb) return "thumb";
        return i % 5 === 0 ? "major" : "track";
      },
    },
    // 5 — GAUGE: faint rail, a "▓" slug, and a travelling numeric readout
    //     (percent + hex position) — the data-instrument version.
    gauge: {
      label: "GAUGE",
      readout: true,
      hex: true,
      cell(inThumb, edge) {
        if (edge) return "▆";
        return inThumb ? "▓" : "│";
      },
      state(inThumb, edge) { return inThumb ? (edge ? "edge" : "thumb") : "faint"; },
    },
  };

  class AsciiScrollbar {
    constructor(rail, scrollEl, opts) {
      this.rail = rail;
      this.scrollEl = scrollEl;
      this.style = (opts && opts.style) || "blocks";
      this.minThumb = (opts && opts.minThumb) || 3;
      this.lineH = (opts && opts.lineH) || 13;
      this.cells = [];
      this.frac = 0;

      rail.classList.add("asb", "asb--" + this.style);

      this.col = document.createElement("div");
      this.col.className = "asb__col";
      rail.appendChild(this.col);

      const def = STYLES[this.style];
      if (def.readout || def.marker) {
        this.tag = document.createElement("div");
        this.tag.className = "asb__tag";
        rail.appendChild(this.tag);
      }

      this._build();
      this._bind();
      this.update();
    }

    _build() {
      const n = Math.max(8, Math.floor(this.rail.clientHeight / this.lineH));
      this.n = n;
      this.col.innerHTML = "";
      this.cells = [];
      for (let i = 0; i < n; i++) {
        const c = document.createElement("span");
        c.className = "asb__cell";
        this.col.appendChild(c);
        this.cells.push(c);
      }
    }

    _bind() {
      this._onScroll = () => this.update();
      this.scrollEl.addEventListener("scroll", this._onScroll, { passive: true });

      this._ro = new ResizeObserver(() => { this._build(); this.update(); });
      this._ro.observe(this.rail);

      // drag / click-to-scroll on the rail
      let dragging = false;
      const toScroll = (clientY) => {
        const r = this.rail.getBoundingClientRect();
        const f = clamp((clientY - r.top) / r.height, 0, 1);
        const max = this.scrollEl.scrollHeight - this.scrollEl.clientHeight;
        this.scrollEl.scrollTop = f * max;
      };
      this.rail.addEventListener("pointerdown", (e) => {
        dragging = true; this.rail.setPointerCapture(e.pointerId);
        this.rail.classList.add("is-drag"); toScroll(e.clientY); e.preventDefault();
      });
      this.rail.addEventListener("pointermove", (e) => { if (dragging) toScroll(e.clientY); });
      const end = () => { dragging = false; this.rail.classList.remove("is-drag"); };
      this.rail.addEventListener("pointerup", end);
      this.rail.addEventListener("pointercancel", end);
      this.rail.addEventListener("mouseenter", () => this.rail.classList.add("is-hot"));
      this.rail.addEventListener("mouseleave", () => this.rail.classList.remove("is-hot"));
    }

    update() {
      const s = this.scrollEl;
      const max = s.scrollHeight - s.clientHeight;
      const frac = max > 0 ? clamp(s.scrollTop / max, 0, 1) : 0;
      this.frac = frac;
      const view = s.clientHeight / s.scrollHeight;
      const n = this.n;
      const thumb = clamp(Math.round(view * n), this.minThumb, n);
      const start = Math.round(frac * (n - thumb));
      const end = start + thumb - 1;
      const def = STYLES[this.style];

      for (let i = 0; i < n; i++) {
        const inThumb = i >= start && i <= end;
        const edge = i === start ? "top" : i === end ? "bot" : "";
        // t: -1..1 position within the thumb (0 = centre)
        const t = thumb > 1 ? ((i - start) / (thumb - 1)) * 2 - 1 : 0;
        const cell = this.cells[i];
        const ch = def.cell(inThumb, edge, t, i);
        if (cell._ch !== ch) { cell.textContent = ch; cell._ch = ch; }
        const st = def.state(inThumb, edge, t, i);
        if (cell._st !== st) { cell.dataset.state = st; cell._st = st; }
        const tf = def.transform ? def.transform(ch, edge) : "";
        if (cell._tf !== tf) { cell.style.transform = tf; cell._tf = tf; }
      }

      // travelling readout / marker
      if (this.tag) {
        const pct = Math.round(frac * 100);
        const mid = (start + end) / 2;
        const y = (mid + 0.5) * (this.rail.clientHeight / n);
        this.tag.style.top = y + "px";
        if (def.hex) {
          const hx = Math.round(frac * 255).toString(16).toUpperCase().padStart(2, "0");
          this.tag.innerHTML = `<b>${String(pct).padStart(2, "0")}%</b><span>0x${hx}</span>`;
        } else if (def.marker) {
          this.tag.textContent = "◄ " + String(pct).padStart(2, "0");
        } else {
          this.tag.textContent = "+ " + String(pct).padStart(2, "0") + "%";
        }
      }
    }

    setStyle(style) {
      this.rail.classList.remove("asb--" + this.style);
      this.style = style;
      this.rail.classList.add("asb--" + style);
      if (this.tag) { this.tag.remove(); this.tag = null; }
      const def = STYLES[style];
      if (def.readout || def.marker) {
        this.tag = document.createElement("div");
        this.tag.className = "asb__tag";
        this.rail.appendChild(this.tag);
      }
      this.cells.forEach((c) => { c._ch = c._st = c._tf = null; });
      this.update();
    }

    destroy() {
      this.scrollEl.removeEventListener("scroll", this._onScroll);
      this._ro.disconnect();
    }
  }

  AsciiScrollbar.STYLES = Object.keys(STYLES);
  AsciiScrollbar.styleLabel = (s) => STYLES[s].label;
  global.AsciiScrollbar = AsciiScrollbar;
})(window);
