/* ============================================================
   M.O. SYSTEM — Design-system entry
   ============================================================ */

const { useState: useStateA, useEffect: useEffectA } = React;

function App() {
  const [booted, setBooted] = useStateA(() => sessionStorage.getItem("mo_booted") === "1");

  useEffectA(() => {
    if (booted) sessionStorage.setItem("mo_booted", "1");
  }, [booted]);

  return (
    <>
      {!booted && <Boot onDone={() => setBooted(true)} />}
      <FibGrid />
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
