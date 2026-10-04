/* ============================================================
   M.O. SYSTEM — Design-system entry
   ============================================================ */

const { useState: useStateA, useEffect: useEffectA } = React;

/* ============================================================
   SHELL — fixed top nav + section index
   ============================================================ */
function Shell() {
  return <>
    <PortfolioHeader context="Design system" />
    <nav className="site-sections" aria-label="Design system sections">
      {["brief", "color", "type", "grid", "motion", "components", "voice"].map(id =>
        <a key={id} href={"#" + id}>{id}</a>)}
    </nav>
  </>;
}

function App() {
  return (
    <>
      <Cursor />
      <Shell />
      <main className="page">
        <div className="canvas">
          <Hero />
          <ColorSection />
          <TypeSection />
          <GridSection />
          <MotionSection />
          <ComponentsSection />
          <PhotoSection />
          <VoiceSection />
          <PrinciplesSection />
          <Footer />
        </div>
      </main>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
