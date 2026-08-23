/* ============================================================
   M.O. SYSTEM — Landing ASCII wordmark
   ------------------------------------------------------------
   "M.O." built the way the universe is built: junction NODES
   joined by straight link strokes, fleshed out with live ASCII
   texture. The periods are pure nodes. No font sampling — the
   letterforms are geometry, so nothing ever clips.
   ============================================================ */

function AsciiHero({ cols = 108, rows = 20, ramp = " ·:-=+*#%@", className = "" }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* ---------- letterform geometry (visual units: x = col, y = row·2) ---------- */
    const A = 2;                        // cell aspect — a row is ~2 cols tall
    const W = cols, H = rows * A;
    // letter widths as fractions of the letter height
    const K = { m: 0.94, o: 0.84, dot: 0.12, gap: 0.24 };
    const SUM = K.m + K.gap + K.dot + K.gap + K.o + K.gap + K.dot;
    const Hv = Math.min(H * 0.70, (W * 0.94) / SUM);   // fits BOTH axes — no clipping
    const x0 = (W - Hv * SUM) / 2;
    const y0 = (H - Hv) / 2;

    const nodes = [];   // { x, y, phase, dot? }
    const segs  = [];   // { ax, ay, bx, by }
    const addLetter = (relNodes, relSegs, ox, w) => {
      const base = nodes.length;
      for (const [rx, ry] of relNodes) {
        nodes.push({ x: ox + rx * w, y: y0 + ry * Hv, phase: nodes.length * 1.7 });
      }
      for (const [i, j] of relSegs) {
        const a = nodes[base + i], b = nodes[base + j];
        segs.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
      }
    };

    let cx = x0;
    // M — two posts and the valley: 5 junctions, 4 links
    addLetter(
      [[0, 1], [0, 0], [0.5, 0.62], [1, 0], [1, 1]],
      [[0, 1], [1, 2], [2, 3], [3, 4]],
      cx, K.m * Hv
    );
    cx += (K.m + K.gap) * Hv;
    // . — a bare node resting on the baseline
    const dotR = Hv * 0.115;
    nodes.push({ x: cx + K.dot * Hv * 0.5, y: y0 + Hv - dotR * 0.6, phase: nodes.length * 1.7, dot: true });
    cx += (K.dot + K.gap) * Hv;
    // O — an octagonal ring of 8 junctions
    addLetter(
      [[0.32, 0], [0.68, 0], [1, 0.26], [1, 0.74], [0.68, 1], [0.32, 1], [0, 0.74], [0, 0.26]],
      [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]],
      cx, K.o * Hv
    );
    cx += (K.o + K.gap) * Hv;
    // . — the closing node
    nodes.push({ x: cx + K.dot * Hv * 0.5, y: y0 + Hv - dotR * 0.6, phase: nodes.length * 1.7, dot: true });

    /* ---------- distance fields — sampled ONCE per mount ---------- */
    const rad   = Hv * 0.085;          // stroke half-width
    const nodeR = rad * 2.3;           // junction glow radius
    const N = cols * rows;
    const mask   = new Float32Array(N);   // 0..1 — inside a stroke
    const nDist  = new Float32Array(N);   // distance to nearest junction
    const nPhase = new Float32Array(N);
    const segDist = (px, py, s) => {
      const dx = s.bx - s.ax, dy = s.by - s.ay;
      const L2 = dx * dx + dy * dy || 1;
      let t = ((px - s.ax) * dx + (py - s.ay) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      const qx = s.ax + dx * t - px, qy = s.ay + dy * t - py;
      return Math.sqrt(qx * qx + qy * qy);
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const px = c + 0.5, py = (r + 0.5) * A;
        let sd = 1e9;
        for (const s of segs) { const d = segDist(px, py, s); if (d < sd) sd = d; }
        let m = Math.max(0, 1 - sd / (rad * 1.6));
        let nd = 1e9, ph = 0;
        for (const nn of nodes) {
          const dx = px - nn.x, dy = py - nn.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (nn.dot) m = Math.max(m, Math.max(0, 1 - d / (dotR * 1.5)));
          if (d < nd) { nd = d; ph = nn.phase; }
        }
        mask[i]   = Math.min(1, m);
        nDist[i]  = nd;
        nPhase[i] = ph;
      }
    }

    // per-cell dissolve hash — flight.js writes window.__mo_titleExit 0..1 and
    // the wordmark blows apart cell by cell into the particle field behind it.
    const hashCell = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453;
      hashCell[i] = s - Math.floor(s);
    }

    /* ---------- cursor tracking ----------
       The <pre> is pointer-transparent: it sits over the universe and must not
       take a drag meant for the field behind it. So the bubble is driven from
       a window listener and mapped through the element's own rect — which,
       now that the box hugs the glyph grid (base.css), is a 1:1 match with the
       columns this loop draws.

       The rect is read once per frame rather than per event: at high mouse
       rates a getBoundingClientRect() inside the move handler is a forced
       layout on every sample, and this loop only repaints at ~30fps anyway. */
    const cursor = { x: -1000, y: -1000, active: false };
    let ptrX = 0, ptrY = 0, ptrSeen = false;
    const onMove = (e) => {
      if (e.pointerType === "touch") return;
      ptrX = e.clientX; ptrY = e.clientY; ptrSeen = true;
    };
    // A pointer that has not moved yet, or has left the window, is nowhere —
    // no bubble, rather than one stuck at the last place it was seen.
    const onOut = (e) => { if (!e.relatedTarget) ptrSeen = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);

    const syncCursor = () => {
      if (!ptrSeen) { cursor.active = false; return; }
      const r = el.getBoundingClientRect();
      const inside = r.width > 0 && r.height > 0
        && ptrX >= r.left && ptrX <= r.right
        && ptrY >= r.top  && ptrY <= r.bottom;
      cursor.active = inside;
      if (inside) {
        cursor.x = ((ptrX - r.left) / r.width)  * cols;
        cursor.y = ((ptrY - r.top)  / r.height) * rows;
      }
    };

    /* ---------- demand-driven render gate ---------- */
    const initialRect = el.getBoundingClientRect();
    let onScreen = initialRect.bottom > 0 && initialRect.top < window.innerHeight;
    let disposed = false;
    let raf = 0;
    let last = 0;

    const cancelLoop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const requestLoop = () => {
      if (disposed || raf || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    const syncLoop = () => {
      if (!onScreen || document.hidden) cancelLoop();
      else requestLoop();
    };

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        syncLoop();
      },
      { threshold: 0 }
    );
    const onScroll = () => requestLoop();
    const onVisibility = () => syncLoop();
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- render loop — one string per frame ---------- */
    function frame(now) {
      raf = 0;
      if (disposed || !onScreen || document.hidden) return;

      const ex = Math.max(0, Math.min(1, window.__mo_titleExit || 0));
      if (ex >= 0.999) {
        if (!el.__exCleared) { el.textContent = ""; el.__exCleared = true; }
        return;
      }
      if (now - last < 33) { requestLoop(); return; }   // ~30 fps
      last = now;

      el.__exCleared = false;
      syncCursor();

      const t = now * 0.0009;
      const buf = [];
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const m = mask[i];
          // breathing field noise — wide swing so cells cross several ramp steps
          const n =
            (Math.sin(c * 0.18 + t * 1.4) * 0.5 + 0.5) * 0.45 +
            (Math.sin(r * 0.31 - t * 1.0) * 0.5 + 0.5) * 0.30 +
            (Math.sin((c + r) * 0.09 + t * 0.6) * 0.5 + 0.5) * 0.25;
          // slow luminance sweep travelling left→right across the word
          const sweep = Math.sin(c * 0.055 - t * 2.1) * 0.5 + 0.5;

          // cursor influence — bright bubble
          let cInf = 0;
          if (cursor.active) {
            const dx = c - cursor.x;
            const dy = (r - cursor.y) * A;
            const d = Math.sqrt(dx * dx + dy * dy);
            cInf = Math.max(0, 1 - d / 14);
            cInf = cInf * cInf;
          }

          // junction proximity — 0..1 inside the glow radius
          const k = Math.max(0, 1 - nDist[i] / nodeR);

          let v, isNode = false;
          if (m > 0.04 || k > 0) {
            // stroke body — ASCII texture breathing between mid and full density
            v = 0.24 + m * 0.30 + n * 0.32 + sweep * 0.16 + cInf * 0.85;
            if (k > 0) {
              // glowing junction node — each pulses on its own phase
              const pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + nPhase[i]);
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
            const hz = hashCell[i];
            const th = ex * 1.12;
            if (hz < th - 0.05) { line += " "; continue; }
            if (hz < th) { line += "·"; continue; }
            v *= 1 - ex * 0.35;
          }

          const ch = ramp[Math.floor(v * (ramp.length - 1))];
          if (isNode) {
            line += "<b>" + ch + "</b>";                      // hot junction core
          } else if (cInf > 0.35 || (m > 0.5 && v > 0.88)) {
            line += "<i>" + ch + "</i>";                      // signal crest
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

    return () => {
      disposed = true;
      cancelLoop();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
    };
  }, [cols, rows, ramp]);

  return <pre className={"asciiHero " + className} ref={ref} aria-hidden="true" />;
}

window.AsciiHero = AsciiHero;
