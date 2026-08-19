/* ============================================================
   M.O. SYSTEM — Landing app
   ============================================================ */
const { useState: useLA, useEffect: useEA, useRef: useRA, useCallback: useCBA } = React;

function LandingApp() {
  const [booted, setBooted] = useLA(() => sessionStorage.getItem("mo_booted") === "1");
  const [section, setSection] = useLA("title");      // title | intro | work | about | contact
  const [hoverAddr, setHoverAddr] = useLA(null);      // address of the currently-hovered work
  const [activeProject, setActiveProject] = useLA(null);

  useEA(() => {
    if (booted) sessionStorage.setItem("mo_booted", "1");
  }, [booted]);

  /* ── SINGLE source of truth for the active section ───────────────
     The old design let each section fire its OWN IntersectionObserver
     on enter (and never on exit). With a 300vh origin beat sitting
     between shorter neighbours, whichever observer fired last won — so
     the first scroll could fail to engage origin, and scrolling back
     left it stuck because nothing re-fired for the section you returned
     to. Instead we resolve the section deterministically every scroll
     frame: the section whose element straddles the viewport centre line
     IS the active one. This always replays going up or down. */
  useEA(() => {
    const ORDER = ["title", "intro", "work", "about"];
    let raf = 0;
    const resolve = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      let pick = null, nearest = Infinity;
      for (const id of ORDER) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { pick = id; break; }   // straddles centre
        const d = r.top > mid ? r.top - mid : mid - r.bottom;         // gap fallback
        if (d < nearest) { nearest = d; pick = id; }
      }
      if (!pick) return;
      // Within the board section, the footer beat reads as "contact"
      // (same universe mode, drives nav highlight).
      if (pick === "about" && window.__mo_bf && window.__mo_bf.footer) pick = "contact";
      setSection(prev => (prev === pick ? prev : pick));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(resolve); };
    resolve();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Universe mode derived from active section
  const mode =
    section === "work"    ? "grid"
  : section === "intro"   ? "origin"   // origin beat: field assembles into 0x00
  : section === "about"   ? "ambient"  // board flight covers the universe (paused + faded)
  : section === "contact" ? "ambient"
  :                         "drift";   // title drifts

  // Right-side detail panel shows the hovered work (lookup in WORKS, which has full fields)
  const hovered = window.WORKS?.find(p => p.addr === hoverAddr) || null;

  return (
    <>
      {!booted && <Boot onDone={() => setBooted(true)} />}
      <FibGrid />
      <Cursor />

      {/* Universe — single, persistent, fixed-position background */}
      <div className={"universeBg universeBg--" + mode}>
        <Universe
          projects={window.UNIVERSE_PROJECTS}
          mode={mode}
          focusAddr={hoverAddr}
          onActive={setActiveProject}
        />
      </div>

      <ShellLanding section={section} activeProject={activeProject} />

      <main className="lp">
        {/* Section tracking is centralized in LandingApp's scroll resolver
            above — children no longer set section on enter (that was the
            source of the stuck/never-engaged mode). They keep their own
            internal scroll-driven animation. */}
        <TitleScreen activeProject={activeProject} />
        <OriginBeat />
        <Work onHoverWork={setHoverAddr} />
        <BoardFlight />
      </main>
    </>
  );
}

/* shell — section-aware status */
function ShellLanding({ section, activeProject }) {
  const [time, setTime] = useLA("--:--");
  useEA(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="shell lp-shell">
      <div className="lp-shell__blur" aria-hidden="true">
        <div /><div /><div /><div /><div /><div /><div />
      </div>
      <div className="shell__brand">M.O.</div>
      <nav className="shell__nav">
        <a href="#work"  className={section === "work"    ? "is-active" : ""}>WORK</a>
        <a href="#about" className={section === "about"   ? "is-active" : ""}>ABOUT</a>
        <a href="#contact" className={section === "contact" ? "is-active" : ""}>CONTACT</a>
        <a href="Design System.html">SYSTEM ↗</a>
      </nav>
      <div className="shell__status">
        <span className="shell__dot" />
        <span>MUC · {time} GMT+1</span>
        <span className="shell__hint">[G] grid</span>
      </div>
    </header>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<LandingApp />);
