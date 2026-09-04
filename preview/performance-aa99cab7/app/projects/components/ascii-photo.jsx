/* ============================================================
   M.O. SYSTEM — ASCII PHOTO FIGURE
   ------------------------------------------------------------
   Drops the reveal-lens ASCII engine onto any real photo
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

   Usage: <AsciiPhotoFigure src="…jpg" caption="…" id="03 / —" />
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

/* Ratio is declared per block because the archive is mixed: 27 of the 40 stills
   and 15 of the 19 clips are portrait, and the rest run 4:3, 16:9, 2:1 and
   near-square. A single 3:2 stage cropped most of them. When a block omits the
   ratio we fall back to the media's own intrinsic aspect once it loads. */
function AsciiMediaFigure({ src, caption, kind = "photo", ratio, tone, poster, label, id, idx = 0 }) {
  const isVideo = kind === "video";
  label = label || (isVideo ? "ASCII · VIDEO" : "ASCII · PHOTO");
  const wrapRef = useRAF(null);
  const canvasRef = useRAF(null);
  const fxRef = useRAF(null);
  const videoRef = useRAF(null);
  const [playing, setPlaying] = useAF(false);
  const [natural, setNatural] = useAF(null);   // intrinsic ratio, once known
  const [failed, setFailed] = useAF(false);
  const [gen, setGen] = useAF(0);      // remount counter for context recycling
  const touch = useRAF(typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches);
  const [ready, setReady] = useAF(false);
  const [converted, setConverted] = useAF(false);
  const [grid, setGrid] = useAF("— × —");
  const [probing, setProbing] = useAF(false);

  useEAF(() => {
    if (!window.AsciiPhoto || !canvasRef.current) return;
    let fx = null, io = null, far = null, started = false;
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
      setReady(false); setConverted(false);
      /* invert maps luminance onto glyph density. The default suits a dark
         subject: bright areas thin out. On a light-background schematic that
         punches a hole where the lens lands, because the page ground shows
         through the empty cells. tone: "light" flips it so the paper fills in
         with glyphs and the traces read as the gaps. */
      fx = new window.AsciiPhoto(canvas, Object.assign(
        {}, ASCII_FIG_BASE,
        tone === "light" ? { invert: 0, contrast: 1.28 } : null,
        isVideo ? {} : { src }));
      // onReady has to be armed before the source is bound: a clip whose data is
      // already buffered signals ready synchronously inside loadVideo.
      fx.onReady = () => { setReady(true); updateGrid(); };
      if (isVideo && videoRef.current) {
        const v = videoRef.current;
        fx.loadVideo(v);
        const onMeta = () => { if (v.videoWidth) setNatural(v.videoWidth + " / " + v.videoHeight); };
        if (v.readyState >= 1) onMeta(); else v.addEventListener("loadedmetadata", onMeta, { once: true });
      } else {
        const probe = new Image();
        probe.onload = () => setNatural(probe.naturalWidth + " / " + probe.naturalHeight);
        // Without this the figure sits on RESOLVING SENSOR forever when a file
        // is missing or the format is unsupported, which looks like a hang
        // rather than a broken path.
        probe.onerror = () => setFailed(true);
        probe.src = src;
      }
      fxRef.current = fx;
      canvas.__fx = fx;
      (window.__asciiFigs = window.__asciiFigs || []).push(fx);
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
    /* Contexts are a bounded resource, so an engine is only kept alive within a
       wide band around the viewport. Past that it is disposed and rebuilt on
       the way back; the band is generous enough that a reader never sees the
       rebuild. Without this a twenty-figure case file evicts its own earliest
       figures, and the page's 3D hero along with them. */
    far = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting || !started || !fx) return;
        setReady(false);
        // Bumping the generation remounts the canvas and re-runs this effect,
        // whose cleanup disposes the engine. Reusing the element is not an
        // option: once a context is explicitly lost that canvas can never
        // hand out another one.
        setGen((g) => g + 1);
      });
    }, { rootMargin: "1400px 0px" });
    far.observe(wrap);

    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          start();
          // Only a clip that is actually on screen decodes. Off screen it is
          // paused, so several figures on one page stay cheap.
          if (isVideo && videoRef.current && en.intersectionRatio > 0.35) {
            const pr = videoRef.current.play();
            if (pr && pr.catch) pr.catch(() => {});
          }
          if (touch.current && fx && en.intersectionRatio > 0.5 && !fx.converted) {
            setConverted(fx.setConvert(true) || true);
          }
        } else {
          if (isVideo && videoRef.current) videoRef.current.pause();
          if (touch.current && fx && en.intersectionRatio < 0.05 && fx.converted) {
            fx.setConvert(false); setConverted(false);     // re-arm for next scroll-in
          }
        }
      });
    }, { threshold: [0, 0.05, 0.35, 0.5, 0.85], rootMargin: "240px 0px" });
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
      far && far.disconnect();
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
      if (fx) {
        try { fx.destroy(); } catch (_) {}
        const list = window.__asciiFigs;
        if (list) { const i = list.indexOf(fx); if (i >= 0) list.splice(i, 1); }
      }
    };
  }, [src, isVideo, tone, gen]);

  const source = isVideo ? "VIDEO" : "PHOTO";
  const hint = touch.current
    ? (converted ? "TAP · " + source : "TAP · ASCII   DRAG · LENS")
    : (converted ? "CLICK · RESTORE" : "HOVER · SWEEP   CLICK · CONVERT");

  // declared ratio wins; intrinsic ratio is the fallback; 3/2 is the floor
  const aspect = ratio || natural || "3 / 2";
  const orient = (() => {
    const m = String(aspect).split("/");
    const w = parseFloat(m[0]), h = parseFloat(m[1]);
    if (!(w > 0 && h > 0)) return "landscape";
    if (h / w > 1.06) return "portrait";
    if (Math.abs(h - w) / w < 0.06) return "square";
    return "landscape";
  })();

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
    else v.pause();
  };

  return (
    <figure
      className={"ph ascii-fig ascii-fig--" + orient + " " + (isVideo ? "ascii-fig--video " : "") +
        (ready ? "is-ready " : "") + (converted ? "is-converted " : "") + (probing ? "is-probing" : "")}
      style={{ "--fig-ratio": aspect }}
      ref={wrapRef}
    >
      <div className="ph__chrome">
        <span className="ph__chromeDot" />
        <span>{label}</span>
        <span className="ph__chromeSep" />
        <span className="ascii-fig__mode">{converted ? "ASCII · FULL" : source + " · LENS"}</span>
        <span className="ascii-fig__grid">{grid}</span>
      </div>

      <div className="ph__photo ascii-fig__stage">
        {isVideo && (
          <video
            ref={videoRef}
            className="ascii-fig__src"
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            aria-hidden="true"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          />
        )}
        <canvas className="ascii-fig__cv" ref={canvasRef} key={gen} />
        <div className="ph__phCorner ph__phCorner--tl" />
        <div className="ph__phCorner ph__phCorner--tr" />
        <div className="ph__phCorner ph__phCorner--bl" />
        <div className="ph__phCorner ph__phCorner--br" />
        <div className="ascii-fig__hint">{hint}</div>
        {isVideo && (
          <button
            type="button"
            className="ascii-fig__play"
            onClick={togglePlay}
            aria-label={playing ? "Pause clip" : "Play clip"}
          >
            <span aria-hidden="true">{playing ? "❙❙" : "▸"}</span>
            <span>{playing ? "PAUSE" : "PLAY"}</span>
          </button>
        )}
        {!ready && !failed && <div className="ascii-fig__load">RESOLVING SENSOR…</div>}
        {failed && <div className="ascii-fig__load ascii-fig__load--err">NO SIGNAL · {String(src).split("/").pop()}</div>}
      </div>

      {caption && (
        <figcaption className="ph__cap">
          <span className="ph__capK">CAP</span>
          <span className="ph__capV">{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

window.AsciiMediaFigure = AsciiMediaFigure;
/* Back-compat: the project pages have always called this AsciiPhotoFigure. */
window.AsciiPhotoFigure = AsciiMediaFigure;
