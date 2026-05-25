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

  // Universe mode derived from active section
  const mode =
    section === "work"    ? "grid"
  : section === "about"   ? "ambient"
  : section === "contact" ? "ambient"
  :                         "drift";   // title + intro both drift

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
        <TitleScreen onEnter={() => setSection("title")} activeProject={activeProject} />
        <IntroHero   onEnter={() => setSection("intro")} />
        <Work
          onEnter={() => setSection("work")}
          onHoverWork={setHoverAddr}
        />
        <About onEnter={() => setSection("about")} />
        <FooterLanding onEnter={() => setSection("contact")} />
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
