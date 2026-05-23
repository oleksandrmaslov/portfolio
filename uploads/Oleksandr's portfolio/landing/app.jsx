/* ============================================================
   M.O. SYSTEM — Landing app
   ============================================================ */
const { useState: useLA, useEffect: useEA } = React;

function LandingApp() {
  const [booted, setBooted] = useLA(() => sessionStorage.getItem("mo_booted") === "1");

  useEA(() => {
    if (booted) sessionStorage.setItem("mo_booted", "1");
  }, [booted]);

  return (
    <>
      {!booted && <Boot onDone={() => setBooted(true)} />}
      <FibGrid />
      <Cursor />
      <ShellLanding />
      <main className="lp">
        <HeroLanding />
        <Work />
        <About />
        <FooterLanding />
      </main>
    </>
  );
}

/* a slightly different shell for the landing — main nav targets sections */
function ShellLanding() {
  const [time, setTime] = useLA("--:--");
  useEA(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="shell lp-shell">
      <div className="shell__brand">M.O.</div>
      <nav className="shell__nav">
        <a href="#work">WORK</a>
        <a href="#about">ABOUT</a>
        <a href="#contact">CONTACT</a>
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
