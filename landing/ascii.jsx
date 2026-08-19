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

    // ----- render loop — produce a single string per frame -----
    let raf;
    let last = 0;

    function frame(now) {
      // throttle to ~30 fps — text re-layout is the cost
      if (now - last < 33) { raf = requestAnimationFrame(frame); return; }
      last = now;

      const t = now * 0.0007;
      const buf = [];
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          const m = mask[r * cols + c];
          // base noise — slow, smooth
          const n =
            (Math.sin(c * 0.18 + t * 1.0) * 0.5 + 0.5) * 0.18 +
            (Math.sin(r * 0.31 - t * 0.7) * 0.5 + 0.5) * 0.12 +
            (Math.sin((c + r) * 0.09 + t * 0.4) * 0.5 + 0.5) * 0.10;

          // cursor influence: bright bubble within 12 cells
          let cInf = 0;
          if (cursor.active) {
            const dx = c - cursor.x;
            const dy = (r - cursor.y) * 2.0;  // adjust for cell aspect
            const d = Math.sqrt(dx * dx + dy * dy);
            cInf = Math.max(0, 1 - d / 14);
            cInf = cInf * cInf;
          }

          // composite
          let v = m * 0.85 + cInf * 0.85 + n * 0.55;
          // slight masking so non-mask cells stay sparse
          if (m < 0.1) v *= 0.55;
          v = Math.max(0, Math.min(1, v));

          const idx = Math.floor(v * (ramp.length - 1));
          const ch = ramp[idx];
          // hot cells = signal cyan; rest = ash
          if (cInf > 0.35 || (m > 0.5 && v > 0.7)) {
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
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [text, cols, rows, ramp]);

  return <pre className={"asciiHero " + className} ref={ref} aria-hidden="true" />;
}

window.AsciiHero = AsciiHero;
