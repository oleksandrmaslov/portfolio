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
const { useState: useO, useEffect: useOE, useRef: useOR } = React;

/* FINAL 2 retiming — the statement finishes resolving by p≈0.60, then HOLDS
   fully sharp for a third of the section (0.60 → 0.90) before the lift-off.
   Previously the last line completed at 0.86 and the exit began at 0.87 —
   the text started dying the moment it finished being born. */
const ORIGIN_LINES = [
  { t: "I build",          at: 0.20 },
  { t: "small, careful",   at: 0.34, em: true },
  { t: "objects —",        at: 0.34 },
  { t: "and the firmware", at: 0.48, ghost: true },
  { t: "that runs them",   at: 0.60, em: true, dot: true },
];

const _oEase  = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const _oClamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* shared bridge object the universe render loop reads every frame */
window.__mo_origin = window.__mo_origin || { p: 0, active: false, concept: "assembly" };

function OriginBeat({ onEnter }) {
  const secRef = useOR(null);
  const [p, setP] = useO(0);
  // Landing ships ONE concept: assembly. The HUB concept lives in its own
  // exploration file, which sets window.__mo_origin_lock = "hub" before boot.
  const concept = (typeof window !== "undefined" && window.__mo_origin_lock) || "assembly";

  /* publish concept to the bridge */
  useOE(() => { window.__mo_origin.concept = concept; }, [concept]);

  /* in-view → set section (drives universe mode = "origin") */
  useOE(() => {
    const el = secRef.current;
    if (!el || !onEnter) return;
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) onEnter();
    }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [onEnter]);

  /* scroll → progress p, published to the bridge */
  useOE(() => {
    const el = secRef.current;
    if (!el) return;
    let raf;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const top = -el.getBoundingClientRect().top;
      const np = total > 0 ? _oClamp(top / total, 0, 1) : 0;
      const active = el.getBoundingClientRect().top < window.innerHeight * 0.6 &&
                     el.getBoundingClientRect().bottom > window.innerHeight * 0.4;
      window.__mo_origin.p = np;
      window.__mo_origin.active = active;
      setP(np);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handoff = _oClamp((p - 0.76) / 0.14, 0, 1);
  // FINAL 2 — the lift-off now begins at 0.90, exactly where the toWork
  // transit engages (flight.js: pO ≥ 0.9), so the statement holds sharp
  // through the whole dwell and leaves only when the camera does.
  const exitK = _oClamp((p - 0.90) / 0.10, 0, 1);

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
              away as the camera leaves for the reel (exitK). v14: the block
              is bottom-anchored in CSS, so the exit lift is a plain
              translateY — no centering offset to carry. ── */}
        <div className="origin__type" style={{
          opacity: (1 - exitK).toFixed(3),
          transform: `translateY(${(exitK * -46).toFixed(1)}px)`,
          filter: exitK > 0.004 ? `blur(${(exitK * 7).toFixed(2)}px)` : "none",
        }}>
          <div className="origin__kicker">
            <span className="origin__kickerDot" />
            <span className="origin__kickerAddr">0x00</span>
            <span className="origin__kickerSep" />
            <span className="origin__kickerName">MASLOV / OLEKSANDR</span>
            <span className="origin__kickerSep" />
            <span className="origin__kickerRoute">KYIV → MÜNCHEN</span>
          </div>
          <h2 className="origin__head2">
            {ORIGIN_LINES.map((ln, i) => {
              const local = _oClamp((p - (ln.at - 0.24)) / 0.24, 0, 1);
              const e = _oEase(local);
              const style = {
                filter: `blur(${((1 - e) * 16).toFixed(2)}px)`,
                opacity: (0.08 + e * 0.92).toFixed(3),
                transform: `translateY(${((1 - e) * 18).toFixed(1)}px)`,
              };
              const cls = "origin__line" +
                (ln.em ? " origin__line--em" : "") +
                (ln.ghost ? " origin__line--ghost" : "");
              return (
                <span key={i} className={cls} style={style}>
                  {ln.t}{ln.dot ? <em className="origin__period">.</em> : null}
                </span>
              );
            })}
          </h2>

          <div className="origin__sig" style={{ opacity: _oClamp((p - 0.56) / 0.16, 0, 1).toFixed(3) }}>
            <div className="origin__sigCol">
              <span className="origin__sigK">▙ NOW</span>
              <span className="origin__sigV">Wafer R3 · Kerfur v0.4 · ZMK upstream</span>
            </div>
            <div className="origin__sigCol">
              <span className="origin__sigK">▙ OPEN TO</span>
              <span className="origin__sigV">Ausbildung · junior embedded · DE / EN</span>
            </div>
          </div>
        </div>

        {/* ── handoff cue → Selected Work ── */}
        <div className="origin__handoff" style={{ opacity: handoff.toFixed(3), transform: `translate(-50%, ${(1 - handoff) * 10}px)` }}>
          <span className="origin__handoffLine" />
          <span>03 · SELECTED WORK</span>
          <span className="origin__handoffArr">↓</span>
        </div>
      </div>
    </section>
  );
}

window.OriginBeat = OriginBeat;
