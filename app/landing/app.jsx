/* ============================================================
   M.O. SYSTEM — Landing app
   Single source of truth for the active section (resolved every scroll
   frame). Children take no enter callback — their own in-view
   observers are intentionally centralized here.
   ============================================================ */
const { useState: useLA, useEffect: useEA } = React;

function LandingApp() {
  const [section, setSection] = useLA("title");      // title | intro | work | about | contact
  const [hoverAddr, setHoverAddr] = useLA(null);      // address of the currently-hovered work
  const [activeProject, setActiveProject] = useLA(null);

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
    section === "work"    ? "reel"     // project tiles parade past the lens
  : section === "intro"   ? "origin"   // origin beat: field assembles into 0x00
  : section === "about"   ? "drift"     // About: card floats in the drifting universe, board grows out of it
  : section === "contact" ? "drift"     // (board covers + universe pauses once the board is full)
  :                         "drift";   // title drifts

  // Announce section changes so the sound score and effects layers can follow.
  useEA(() => {
    try { window.dispatchEvent(new CustomEvent("mo:section", { detail: { section } })); } catch (_) {}
  }, [section]);

  // The one-line entry horizon owns the arrival overture. It waits for the
  // first real universe frame, then lets WebGL take over the field.

  return (
    <>
      <a className="mo-skip-link" href="#work">Skip to selected work</a>
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

      {window.NodeHandoff ? <NodeHandoff /> : null}

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
        <a href="#work" className={section === "work" ? "is-active" : ""} aria-current={section === "work" ? "location" : undefined}>WORK</a>
        <a href="#about" className={section === "about" ? "is-active" : ""} aria-current={section === "about" ? "location" : undefined}>ABOUT</a>
        <a href="#contact" className={section === "contact" ? "is-active" : ""} aria-current={section === "contact" ? "location" : undefined}>CONTACT</a>
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
    const W = 38, H = 16, MID = H / 2, N = 40;
    let raf = 0, phase = 0, amp = 0;
    const tick = () => {
      raf = 0;
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
      if (on || amp > 0.02) raf = requestAnimationFrame(tick);
      else {
        amp = 0;
        path.setAttribute("d", "M0 8 L38 8");
      }
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.MOSound.onState(s => { setMuted(s.muted); wake(); });
    wake();
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

let landingMounted = false;
function mountLanding() {
  if (landingMounted || !window.THREE) return;
  landingMounted = true;
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<LandingApp />);
}

if (window.THREE) mountLanding();
else window.addEventListener("mo:three-ready", mountLanding, { once: true });
