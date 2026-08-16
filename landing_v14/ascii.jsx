/* ============================================================
   M.O. SYSTEM — Ascii hero field
   Aino-style interactive ASCII grid that resolves into "M.O."
   ============================================================ */

function AsciiHero({
  text   = "M.O.",
  cols   = 96,
  rows   = 18,
  ramp   = " ·:-=+*#%@",   // density ramp
  className = "",
}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ----- offscreen mask: render text big, sample at grid resolution -----
    // monospace cell aspect (~0.6 wide × 1 tall)
    const CELL_W = 6, CELL_H = 10;     // visual scale per cell in mask canvas
    const mc = document.createElement("canvas");
    mc.width = cols * CELL_W;
    mc.height = rows * CELL_H;
    const mx = mc.getContext("2d");
    mx.fillStyle = "black";
    mx.fillRect(0, 0, mc.width, mc.height);

    // find a font size that makes the word span ~80% of width
    mx.fillStyle = "white";
    mx.textBaseline = "middle";
    mx.textAlign = "center";
    let fontSize = mc.height * 1.4;
    do {
      mx.font = `700 ${fontSize}px Geist, sans-serif`;
      if (mx.measureText(text).width < mc.width * 0.92) break;
      fontSize -= 1;
    } while (fontSize > 4);
    mx.fillText(text, mc.width / 2, mc.height / 2 + fontSize * 0.02);

    // sample alpha into a mask
    const px = mx.getImageData(0, 0, mc.width, mc.height).data;
    const mask = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0, cnt = 0;
        for (let dy = 0; dy < CELL_H; dy++) {
          for (let dx = 0; dx < CELL_W; dx++) {
            const idx = ((r * CELL_H + dy) * mc.width + (c * CELL_W + dx)) * 4 + 0;
            sum += px[idx]; cnt++;
          }
        }
        mask[r * cols + c] = (sum / cnt) / 255;
      }
    }

    // v13 — per-cell dissolve hash: the title-exit choreography (flight.js
    // writes window.__mo_titleExit 0..1) blows the wordmark apart cell by
    // cell, so the sign dissolves INTO the particle field behind it.
    const hashCell = new Float32Array(cols * rows);
    for (let i = 0; i < hashCell.length; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453;
      hashCell[i] = s - Math.floor(s);
    }
    // v14 — slipstream: remember which cells already launched a glyph so each
    // fires exactly once per exit; re-armed when the exit rewinds.
    const dropped = new Uint8Array(cols * rows);

    // ----- cursor tracking -----
    const cursor = { x: -1000, y: -1000, active: false };
    const rect = () => el.getBoundingClientRect();

    const onMove = (e) => {
      const r = rect();
      cursor.x = ((e.clientX - r.left) / r.width)  * cols;
      cursor.y = ((e.clientY - r.top)  / r.height) * rows;
      cursor.active = true;
    };
    const onLeave = () => { cursor.active = false; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    // ----- visibility gate: only burn cycles while the field is on-screen -----
    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => { onScreen = entries[0].isIntersecting; },
      { threshold: 0 }
    );
    io.observe(el);

    // ----- render loop — produce a single string per frame -----
    let raf;
    let last = 0;

    function frame(now) {
      // Idle (but keep the rAF alive) when scrolled away or tab hidden —
      // the 1728-cell innerHTML rebuild is the cost, so skip it entirely.
      if (!onScreen || document.hidden) { raf = requestAnimationFrame(frame); return; }
      // throttle to ~30 fps — text re-layout is the cost
      if (now - last < 33) { raf = requestAnimationFrame(frame); return; }
      last = now;

      // v13 — title-exit dissolve amount (flight.js drives it with scroll)
      const ex = Math.max(0, Math.min(1, window.__mo_titleExit || 0));
      if (ex >= 0.999) {
        if (!el.__exCleared) { el.textContent = ""; el.__exCleared = true; }
        raf = requestAnimationFrame(frame);
        return;
      }
      el.__exCleared = false;

      // v14 — slipstream drop queue (flight.js consumes): active mid-exit only
      if (ex < 0.02 && el.__exDropped) { dropped.fill(0); el.__exDropped = false; }
      let dropRect = null, dropPushed = 0;
      const dropQ = ex > 0.01 && ex < 0.99
        ? (window.__mo_glyphDrops = window.__mo_glyphDrops || [])
        : null;

      const t = now * 0.0009;
      const buf = [];
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          const m = mask[r * cols + c];
          // field noise, normalized ~0..1 — wide swing so cells cross
          // several ramp steps as they breathe. (Old amplitudes summed to
          // ~0.40·0.55 ≈ 0.22, which clamped letter cells at '@' every
          // frame — the whole sign read as static.)
          const n =
            (Math.sin(c * 0.18 + t * 1.4) * 0.5 + 0.5) * 0.45 +
            (Math.sin(r * 0.31 - t * 1.0) * 0.5 + 0.5) * 0.30 +
            (Math.sin((c + r) * 0.09 + t * 0.6) * 0.5 + 0.5) * 0.25;
          // slow luminance sweep travelling left→right across the word
          const sweep = Math.sin(c * 0.055 - t * 2.1) * 0.5 + 0.5;

          // cursor influence: bright bubble within 12 cells
          let cInf = 0;
          if (cursor.active) {
            const dx = c - cursor.x;
            const dy = (r - cursor.y) * 2.0;  // adjust for cell aspect
            const d = Math.sqrt(dx * dx + dy * dy);
            cInf = Math.max(0, 1 - d / 14);
            cInf = cInf * cInf;
          }

          // composite — letter cells breathe between mid and full density
          // (idx ~4..9 of the ramp); background stays sparse but alive.
          let v;
          if (m > 0.1) {
            v = 0.30 + m * 0.18 + n * 0.40 + sweep * 0.20 + cInf * 0.85;
          } else {
            v = n * n * 0.20 + sweep * 0.04 + cInf * 0.85;
          }
          v = Math.max(0, Math.min(1, v));

          // v13 — dissolve: cells drop out in hash order as the exit rises;
          // a thin '·' rim rides the threshold so the tear-edge sparkles.
          // v14 — the first frame a cell drops, it may LAUNCH into the
          // slipstream (flight.js sucks it toward the vanishing point).
          if (ex > 0.001) {
            const hz = hashCell[r * cols + c];
            const th = ex * 1.12;
            if (hz < th) {
              const ci = r * cols + c;
              if (!dropped[ci]) {
                dropped[ci] = 1;
                el.__exDropped = true;
                if (dropQ && dropPushed < 22 && m > 0.10 && (hz * 7) % 1 < 0.5) {
                  if (!dropRect) dropRect = el.getBoundingClientRect();
                  dropQ.push({
                    x: dropRect.left + ((c + 0.5) / cols) * dropRect.width,
                    y: dropRect.top + ((r + 0.5) / rows) * dropRect.height,
                    ch: ramp[Math.max(4, Math.floor(v * (ramp.length - 1)))],
                  });
                  dropPushed++;
                  if (dropQ.length > 400) dropQ.splice(0, dropQ.length - 400);
                }
              }
              if (hz < th - 0.05) { line += " "; continue; }
              line += "·"; continue;
            }
            v *= 1 - ex * 0.35;
          }

          const idx = Math.floor(v * (ramp.length - 1));
          const ch = ramp[idx];
          // hot cells = signal cyan; rest = ash
          // cyan crest rides the sweep across the letters
          if (cInf > 0.35 || (m > 0.5 && v > 0.85)) {
            line += "<i>" + ch + "</i>";
          } else {
            line += ch;
          }
        }
        buf.push(line);
      }
      el.innerHTML = buf.join("\n");
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [text, cols, rows, ramp]);

  return <pre className={"asciiHero " + className} ref={ref} aria-hidden="true" />;
}

window.AsciiHero = AsciiHero;
