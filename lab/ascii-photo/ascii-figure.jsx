/* ============================================================
   M.O. SYSTEM — ASCII PHOTO FIGURE  (React wrapper over AsciiPhoto)
   ------------------------------------------------------------
   Drops the lab's reveal-lens ASCII engine onto any real photo
   inside the project story. Matches the .ph (photo holder) chrome
   so it reads as part of the case file.

     · DESKTOP (hover):  move the pointer over the frame to sweep
       the reveal lens; CLICK converts the whole frame to glyphs
       and back. Velocity-reactive chromatic aberration.
     · MOBILE (no hover):  the frame auto-resolves into ASCII when
       it scrolls into view (dissolve-in); TAP toggles photo/ascii;
       DRAG a finger to push the reveal lens around.

   Perf: the engine idle-skips when nothing animates, and we only
   instantiate once the figure nears the viewport (IntersectionObserver),
   so several figures on one page stay cheap.

   Usage (page2):  <AsciiPhotoFigure src="…jpg" caption="…" id="03 / —" />
   ============================================================ */
const { useState: useAF, useEffect: useEAF, useRef: useRAF } = React;

const ASCII_FIG_BASE = {
  ramp: " ·:-=+*#%@",
  cell: 8,
  cellAspect: 1.8,
  feel: "dissolve",      // soft per-cell resolve (screenshot default)
  color: "full",         // sampled photo color
  invert: 1,             // dark subject → dense glyphs
  contrast: 1.18,
  gamma: 0.95,
  lensR: 0.22,
  lensSoft: 0.55,
  feather: 0.5,
  caMode: "pulse",       // RIPPLE — concentric chroma waves from the node
  ca: 0.20,
  caVelocity: 0.30,
  caMax: 1.6,
  caHoverGate: true,     // CA dissolves out when the pointer/finger leaves the frame
  scanlines: 0.54,
  vignette: 0.10,
  speed: 1.0,
};

function AsciiPhotoFigure({ src, caption, label = "ASCII · PHOTO", id, idx = 0 }) {
  const wrapRef = useRAF(null);
  const canvasRef = useRAF(null);
  const fxRef = useRAF(null);
  const touch = useRAF(typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches);
  const [ready, setReady] = useAF(false);
  const [converted, setConverted] = useAF(false);
  const [grid, setGrid] = useAF("— × —");
  const [fps, setFps] = useAF(0);
  const [probing, setProbing] = useAF(false);

  useEAF(() => {
    if (!window.AsciiPhoto || !canvasRef.current) return;
    let fx = null, io = null, started = false;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;

    const updateGrid = () => {
      if (!fx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, fx.o.dprCap || 2);
      const cols = Math.round(canvas.width / (fx.o.cell * dpr));
      const rows = Math.round(canvas.height / (fx.o.cell * dpr * fx.o.cellAspect));
      setGrid(cols + " × " + rows);
    };

    const start = () => {
      if (started) return; started = true;
      fx = new window.AsciiPhoto(canvas, Object.assign({ src }, ASCII_FIG_BASE));
      fxRef.current = fx;
      canvas.__fx = fx;
      (window.__asciiFigs = window.__asciiFigs || []).push(fx);
      fx.onReady = () => { setReady(true); updateGrid(); };
      let fpsT = 0;
      fx.onFps = (f) => { fpsT++; if (fpsT % 1 === 0) setFps(f); };
    };

    /* desktop pointer — sweep lens + click convert */
    const onEnter = () => { if (fx) { fx.setHover(true); setProbing(true); } };
    const onLeave = () => { if (fx) { fx.setHover(false); setProbing(false); } };
    const onMove = (e) => {
      if (!fx) return;
      const r = canvas.getBoundingClientRect();
      fx.setPointer(
        Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
        Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
      );
    };
    const onClick = () => { if (fx) setConverted(fx.toggleConvert()); };

    /* mobile touch — drag lens + tap toggle */
    let tStartX = 0, tStartY = 0, tMoved = 0;
    const onTouchStart = (e) => {
      if (!fx || !e.touches[0]) return;
      const t = e.touches[0]; tStartX = t.clientX; tStartY = t.clientY; tMoved = 0;
      fx.setHover(true); setProbing(true);
      const r = canvas.getBoundingClientRect();
      fx.setPointer((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height);
    };
    const onTouchMove = (e) => {
      if (!fx || !e.touches[0]) return;
      const t = e.touches[0];
      tMoved += Math.abs(t.clientX - tStartX) + Math.abs(t.clientY - tStartY);
      const r = canvas.getBoundingClientRect();
      fx.setPointer(
        Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)),
        Math.max(0, Math.min(1, (t.clientY - r.top) / r.height)),
      );
    };
    const onTouchEnd = () => {
      if (!fx) return;
      fx.setHover(false); setProbing(false);
      if (tMoved < 10) setConverted(fx.toggleConvert());   // tap = toggle
    };

    /* IntersectionObserver: lazy-init near view; on mobile, auto-convert
       once centred so the effect plays without a hover. */
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          start();
          if (touch.current && fx && en.intersectionRatio > 0.5 && !fx.converted) {
            setConverted(fx.setConvert(true) || true);
          }
        } else if (touch.current && fx && en.intersectionRatio < 0.05 && fx.converted) {
          fx.setConvert(false); setConverted(false);       // re-arm for next scroll-in
        }
      });
    }, { threshold: [0, 0.05, 0.5, 0.85], rootMargin: "240px 0px" });
    io.observe(wrap);

    if (touch.current) {
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    } else {
      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointerleave", onLeave);
      wrap.addEventListener("pointermove", onMove, { passive: true });
      canvas.addEventListener("click", onClick);
    }
    window.addEventListener("resize", updateGrid);

    return () => {
      io && io.disconnect();
      window.removeEventListener("resize", updateGrid);
      if (touch.current) {
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
      } else {
        wrap.removeEventListener("pointerenter", onEnter);
        wrap.removeEventListener("pointerleave", onLeave);
        wrap.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("click", onClick);
      }
      if (fx) fx.destroy();
    };
  }, [src]);

  const hint = touch.current
    ? (converted ? "TAP · PHOTO" : "TAP · ASCII   DRAG · LENS")
    : (converted ? "CLICK · RESTORE" : "HOVER · SWEEP   CLICK · CONVERT");

  return (
    <figure className={"ph ascii-fig " + (ready ? "is-ready " : "") + (converted ? "is-converted " : "") + (probing ? "is-probing" : "")} ref={wrapRef}>
      <div className="ph__chrome">
        <span className="ph__chromeDot" />
        <span>{label}</span>
        <span className="ph__chromeSep" />
        <span className="ascii-fig__mode">{converted ? "ASCII · FULL" : "PHOTO · LENS"}</span>
        <span className="ascii-fig__grid">{grid}</span>
      </div>

      <div className="ph__photo ascii-fig__stage">
        <canvas className="ascii-fig__cv" ref={canvasRef} />
        <div className="ph__phCorner ph__phCorner--tl" />
        <div className="ph__phCorner ph__phCorner--tr" />
        <div className="ph__phCorner ph__phCorner--bl" />
        <div className="ph__phCorner ph__phCorner--br" />
        <div className="ascii-fig__hint">{hint}</div>
        {!ready && <div className="ascii-fig__load">RESOLVING SENSOR…</div>}
      </div>

      {caption && (
        <figcaption className="ph__cap">
          <span className="ph__capK">CAP</span>
          <span className="ph__capV">{caption}</span>
          <span className="ascii-fig__fps">{fps ? fps + " FPS" : ""}</span>
        </figcaption>
      )}
    </figure>
  );
}

window.AsciiPhotoFigure = AsciiPhotoFigure;
