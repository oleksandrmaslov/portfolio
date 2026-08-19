/* ============================================================
   M.O. SYSTEM — Story app · "Trace the net"
   ============================================================ */
const { useState: useSA, useEffect: useEA, useCallback: useCA } = React;

function StoryApp() {
  const [booted, setBooted] = useSA(() => sessionStorage.getItem("mo_booted") === "1");
  const [mode, setMode] = useSA("intro");          // intro | tour | free
  const [tourProgress, setTourProgress] = useSA(0);
  const [activeWP, setActiveWP] = useSA(0);
  const [direction, setDirection] = useSA(() => localStorage.getItem("mo_dir") || "trace");

  useEA(() => { if (booted) sessionStorage.setItem("mo_booted", "1"); }, [booted]);
  useEA(() => { localStorage.setItem("mo_dir", direction); }, [direction]);

  const onProgress = useCA((p) => setTourProgress(p), []);
  const onWaypoint = useCA((idx) => setActiveWP(idx), []);

  return (
    <>
      {!booted && <Boot onDone={() => setBooted(true)} />}
      <FibGrid />
      <Cursor />

      <div className={"universeBg universeBg--" + mode}>
        <Universe2
          mode={mode}
          tourProgress={tourProgress}
          direction={direction}
          onWaypoint={onWaypoint}
          onActive={() => {}}
        />
      </div>

      <header className="shell st-shell">
        <div className="shell__brand">M.O.</div>
        <nav className="shell__nav st-shell__nav">
          <a href="#origin"  className={mode === "intro" ? "is-active" : ""}>ORIGIN</a>
          <a href="#flight"  className={mode === "tour"  ? "is-active" : ""}>FLIGHT</a>
          <a href="#explore">EXPLORE</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <div className="st-shell__right">
          <DirectionSwitch value={direction} onChange={setDirection} />
          <SoundToggle />
        </div>
      </header>

      <main className="lp st-main">
        <OriginIntro  onEnter={() => setMode("intro")} />
        <StoryFlight  onEnter={() => setMode("tour")} onProgress={onProgress} activeWP={activeWP} />
        <ExploreGate  onEnter={() => setMode("free")} />
        <StoryContact onEnter={() => setMode("free")} />
      </main>
    </>
  );
}

const _root = ReactDOM.createRoot(document.getElementById("root"));
_root.render(<StoryApp />);
