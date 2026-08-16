/* ============================================================
   M.O. SYSTEM — FINAL 3 · Landing app
   Single source of truth for the active section (resolved every scroll
   frame). Children take no enter callback — their own in-view
   observers were removed in FINAL 3.
   ============================================================ */
const { useState: useLA, useEffect: useEA } = React;

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
    section === "work"    ? "reel"     // v10: the tiles themselves parade past the lens
  : section === "intro"   ? "origin"   // origin beat: field assembles into 0x00
  : section === "about"   ? "drift"     // About: card floats in the drifting universe, board grows out of it
  : section === "contact" ? "drift"     // (board covers + universe pauses once the board is full)
  :                         "drift";   // title drifts

  // v10: announce section changes — the sound score + FX layers listen.
  useEA(() => {
    try { window.dispatchEvent(new CustomEvent("mo:section", { detail: { section } })); } catch (_) {}
  }, [section]);

  // v10: ARRIVAL overture — void → knot of light → pulse → the field scatters
  // in. Runs once per page load after boot clears (skipped for reduced motion
  // and auto-cancelled by any pointer/wheel interaction).
  useEA(() => {
    if (!booted) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.scrollY > 80) return;          // mid-page reload — no overture
    const id = setTimeout(() => { if (window.__mo_arrival_start) window.__mo_arrival_start(); }, 140);
    return () => clearTimeout(id);
  }, [booted]);

  return (
    <>
      {!booted && <Boot onDone={() => setBooted(true)} />}
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

      <ShellLanding section={section} />

      <WaferFlight />

      <main className="lp">
        {/* Section tracking is centralized in LandingApp's scroll resolver
            above — children no longer set section on enter (that was the
            source of the stuck/never-engaged mode). They keep their own
            internal scroll-driven animation. */}
        <TitleScreen />
        <OriginBeat />
        <Work onHoverWork={setHoverAddr} />
        <BoardFlight />
      </main>
    </>
  );
}

/* shell — section-aware status */
function ShellLanding({ section }) {
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
        <a href="All Projects.html">INDEX ↗</a>
      </nav>
      <div className="shell__status">
        <span className="shell__dot" />
        <span>MUC · {time} GMT+1</span>
        <VolumeToggle />
      </div>
    </header>
  );
}

/* volume toggle — an animated SINEWAVE (replaces [G] grid).
   The wave's amplitude rides the real master-output level and its
   phase scrolls while sound is on; it flattens to a line when off.
   Click toggles the whole field + the omnipresent 0x00 carrier. */
function VolumeToggle() {
  const { useState, useEffect, useRef } = React;
  const [muted, setMuted] = useState(() => (window.MOSound ? window.MOSound.isMuted() : true));
  const pathRef = useRef(null);

  useEffect(() => {
    if (!window.MOSound) return;
    window.MOSound.init();
    window.MOSound.onState(s => setMuted(s.muted));
    const W = 38, H = 16, MID = H / 2, N = 40;
    let raf, phase = 0, amp = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const path = pathRef.current; if (!path) return;
      const on = !window.MOSound.isMuted();
      const lvl = on ? window.MOSound.getLevel() : 0;
      // target amplitude: a calm idle wave + a kick from real output level
      const target = on ? (1.6 + lvl * 9) : 0;
      amp += (target - amp) * 0.15;
      if (on) phase += 0.22;
      let d = "";
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * W;
        // two-frequency wave so it reads richer than a pure sine
        const y = MID + Math.sin(i / N * Math.PI * 4 + phase) * amp
                      + Math.sin(i / N * Math.PI * 7 - phase * 0.6) * amp * 0.25;
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(2) + " ";
      }
      path.setAttribute("d", d);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const click = () => {
    if (!window.MOSound) return;
    window.MOSound.unlock();
    window.MOSound.toggleMute();
    window.MOSound.carrier(!window.MOSound.isMuted());
  };
  return (
    <button
      className={"volBtn " + (muted ? "is-off" : "is-on")}
      onClick={click}
      aria-label={muted ? "Enable sound" : "Mute sound"}
      title={muted ? "Enable sound — 0x00 carrier field" : "Mute sound"}
    >
      <svg className="volBtn__wave" viewBox="0 0 38 16" width="38" height="16" aria-hidden="true">
        <path ref={pathRef} d="M0 8 L38 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{muted ? "sound off" : "sound on"}</span>
    </button>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<LandingApp />);
