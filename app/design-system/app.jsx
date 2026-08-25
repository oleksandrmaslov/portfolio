/* ============================================================
   M.O. SYSTEM — Design-system entry
   ============================================================ */

const { useState: useStateA, useEffect: useEffectA } = React;

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
