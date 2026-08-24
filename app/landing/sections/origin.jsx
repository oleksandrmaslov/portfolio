/* ============================================================
   M.O. SYSTEM — Landing · 0x00 origin section
   ------------------------------------------------------------
   No copper trace — that belongs to the Board. This beat speaks
   the landing's own language: NODES in infinite space.

   The section is a tall scroll track; its progress is published
   to `window.__mo_origin = { p, active, concept }` and READ by
   scenes/universe.jsx inside its render loop, which drives one
   of two concepts behind this DOM type:

     01 ASSEMBLY — the particle field swarms to FORM "0x00"
     02 HUB      — node 0x00 as a hub, project nodes ringing it

   Over either, the identity statement resolves FROSTED → SHARP
   (same progressive-blur language as the header). This is the
   literal setup for the later "dive into node 0x00" → Board.
   ============================================================ */
const { useEffect: useOE, useRef: useOR } = React;

/* The statement finishes resolving by p≈0.60, then holds
   fully sharp for a third of the section (0.60 → 0.90) before the lift-off.
   Previously the last line completed at 0.86 and the exit began at 0.87 —
   the text started dying the moment it finished being born. */
const ORIGIN_LINES = [
  { t: "I build", at: 0.20 },
  { t: "complete products,", at: 0.34, em: true },
  { t: "starting with", at: 0.34, ghost: true },
  { t: "a real problem—", at: 0.48 },
  { t: "not a technology.", at: 0.60, em: true },
];

const _oEase  = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const _oClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const _oLineEase = (p, at) => _oEase(_oClamp((p - (at - 0.24)) / 0.24, 0, 1));

/* shared bridge object the universe render loop reads every frame */
window.__mo_origin = window.__mo_origin || { p: 0, active: false, concept: "assembly" };

function OriginBeat() {
  const secRef = useOR(null);
  // Landing ships ONE concept: assembly. The HUB concept lives in its own
  // exploration file, which sets window.__mo_origin_lock = "hub" before boot.
  const concept = (typeof window !== "undefined" && window.__mo_origin_lock) || "assembly";

  /* publish concept to the bridge */
  useOE(() => { window.__mo_origin.concept = concept; }, [concept]);

  /* Scroll → progress, published to the bridge and painted directly.
     This track used to put every scroll frame through React reconciliation
     while also re-reading its layout. Its DOM is stable, so continuous motion
     belongs here; React remains responsible for the structure only. */
  useOE(() => {
    const el = secRef.current;
    if (!el) return;

    const typeEl = el.querySelector(".origin__type");
    const lineEls = Array.from(el.querySelectorAll(".origin__line"));
    const sigEl = el.querySelector(".origin__sig");
    const handoffEl = el.querySelector(".origin__handoff");
    if (!typeEl || lineEls.length !== ORIGIN_LINES.length || !sigEl || !handoffEl) return;

    let raf = 0;
    let needsMeasure = true;
    let disposed = false;
    const geometry = { top: 0, height: 0, scrollHeight: 0, viewportH: window.innerHeight };

    const measure = () => {
      const rect = el.getBoundingClientRect();
      geometry.top = rect.top + window.scrollY;
      geometry.height = rect.height;
      /* Keep the original offsetHeight equation, but pay for the layout read
         only during measurement rather than on every scroll frame. */
      geometry.scrollHeight = el.offsetHeight;
      geometry.viewportH = window.innerHeight;
      needsMeasure = false;
    };

    const update = () => {
      raf = 0;
      if (needsMeasure) measure();

      const pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      const rectTop = geometry.top - pageY;
      const rectBottom = rectTop + geometry.height;
      const total = geometry.scrollHeight - geometry.viewportH;
      const top = -rectTop;
      const np = total > 0 ? _oClamp(top / total, 0, 1) : 0;
      const active = rectTop < geometry.viewportH * 0.6 &&
                     rectBottom > geometry.viewportH * 0.4;
      window.__mo_origin.p = np;
      window.__mo_origin.active = active;

      const handoff = _oClamp((np - 0.76) / 0.14, 0, 1);
      // Lift-off begins at 0.90, exactly where the toWork transit engages
      // (flight.js: pO ≥ 0.9), preserving the fully-sharp dwell.
      const exitK = _oClamp((np - 0.90) / 0.10, 0, 1);

      typeEl.style.opacity = (1 - exitK).toFixed(3);
      typeEl.style.transform = `translateY(${(exitK * -46).toFixed(1)}px)`;
      typeEl.style.filter = exitK > 0.004 ? `blur(${(exitK * 7).toFixed(2)}px)` : "none";

      lineEls.forEach((lineEl, i) => {
        const e = _oLineEase(np, ORIGIN_LINES[i].at);
        lineEl.style.filter = `blur(${((1 - e) * 16).toFixed(2)}px)`;
        lineEl.style.opacity = (0.08 + e * 0.92).toFixed(3);
        lineEl.style.transform = `translateY(${((1 - e) * 18).toFixed(1)}px)`;
      });

      sigEl.style.opacity = _oClamp((np - 0.56) / 0.16, 0, 1).toFixed(3);
      handoffEl.style.opacity = handoff.toFixed(3);
      handoffEl.style.transform = `translateY(${(1 - handoff) * 10}px)`;
    };

    const schedule = (remeasure = false) => {
      needsMeasure = needsMeasure || remeasure;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = () => schedule(false);
    const onResize = () => schedule(true);

    /* Prime synchronously so a history restore/deep link does not show the
       p=0 pose for a frame. All subsequent scroll frames use cached geometry. */
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    const resizeObserver = window.ResizeObserver
      ? new ResizeObserver(() => schedule(true))
      : null;
    resizeObserver?.observe(el);

    /* Font settling can move the section without resizing the section itself. */
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!disposed) schedule(true);
      });
    }

    return () => {
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={secRef}
      className="origin"
      id="intro"
      data-screen-label="02 Origin"
      style={{ height: "300vh" }}
    >
      <div className="origin__stage">
        {/* faint legibility scrim over the live universe */}
        <div className="origin__scrim" aria-hidden="true" />

        {/* ── identity statement — resolves frosted → sharp, then lifts
              away as the camera leaves for the reel (exitK). The block
              is bottom-anchored in CSS, so the exit lift is a plain
              translateY — no centering offset to carry. ── */}
        <div className="origin__type" style={{
          opacity: "1.000",
          transform: "translateY(0.0px)",
          filter: "none",
        }}>
          <div className="origin__kicker">
            <span className="origin__kickerDot" />
            <span className="origin__kickerAddr" data-mo-cursor-mirror data-mo-cursor-opacity=".origin__type,.origin__stage,.lp">0x00</span>
            <span className="origin__kickerSep" />
            <span className="origin__kickerName" data-mo-cursor-mirror data-mo-cursor-opacity=".origin__type,.origin__stage,.lp">MASLOV / OLEKSANDR</span>
            <span className="origin__kickerSep" />
            <span className="origin__kickerRoute" data-mo-cursor-mirror data-mo-cursor-opacity=".origin__type,.origin__stage,.lp">KYIV → MÜNCHEN</span>
          </div>
          <h2 className="origin__head2">
            {ORIGIN_LINES.map((ln, i) => {
              const e = _oLineEase(0, ln.at);
              const style = {
                filter: `blur(${((1 - e) * 16).toFixed(2)}px)`,
                opacity: (0.08 + e * 0.92).toFixed(3),
                transform: `translateY(${((1 - e) * 18).toFixed(1)}px)`,
                color: "var(--bone)",
              };
              const cls = "origin__line" +
                (ln.em ? " origin__line--em" : "") +
                (ln.ghost ? " origin__line--ghost" : "");
              return (
                <span key={i} className={cls} style={style}>
                  <span data-mo-cursor-mirror data-mo-cursor-opacity=".origin__line,.origin__type,.origin__stage,.lp">
                    {ln.t}{ln.dot ? <em className="origin__period">.</em> : null}
                  </span>
                </span>
              );
            })}
          </h2>

          <div className="origin__sig" style={{ opacity: "0.000" }}>
            <div className="origin__sigCol" data-mo-cursor-mirror data-mo-cursor-opacity=".origin__sig,.origin__type,.origin__stage,.lp">
              <span className="origin__sigK">▙ NOW</span>
              <span className="origin__sigV">ZMK · Kerfur · Iskra</span>
            </div>
            <div className="origin__sigCol" data-mo-cursor-mirror data-mo-cursor-opacity=".origin__sig,.origin__type,.origin__stage,.lp">
              <span className="origin__sigK">▙ NEXT</span>
              <span className="origin__sigV">University / technical Ausbildung · Wafer company</span>
            </div>
          </div>
        </div>

        {/* ── handoff cue → Selected Work ── */}
        <div className="origin__handoff" style={{ opacity: "0.000", transform: "translateY(10px)" }}>
          <span className="origin__handoffLine" />
          <span>03 · SELECTED WORK</span>
          <span className="origin__handoffArr">↓</span>
        </div>
      </div>
    </section>
  );
}

window.OriginBeat = OriginBeat;
