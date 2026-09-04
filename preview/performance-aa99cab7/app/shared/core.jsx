/* ============================================================
   M.O. SYSTEM — Shared site core (boot, grid, cursor, shell)
   ============================================================ */

const { useState, useEffect, useRef } = React;

/* A page restored from the back/forward cache keeps the exact DOM and global
   flags it had at navigation time. Clear one-way exit state before the saved
   frame is shown again; otherwise Back can restore a fully transparent page. */
(function restorePersistedPage() {
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    window.__hv_leaving = false;
    window.__mo_universe_pause = false;
    document.body.classList.remove("hv-exit", "landing-exit", "wf-flying");
    const universe = document.querySelector(".universeBg");
    if (universe) {
      if (universe.__moFadeT) clearTimeout(universe.__moFadeT);
      universe.__moFadeT = 0;
      universe.style.opacity = "";
      universe.style.transform = "";
      universe.style.transition = "";
    }
    window.dispatchEvent(new CustomEvent("mo:page-restored"));
  });
})();

/* ============================================================
   MODEL WARM-UP
   ------------------------------------------------------------
   This used to hang off the boot overlay's mount effect. The
   overlay is gone — it could only ever render after React, Babel
   and the in-browser JSX compile had finished, so it masked
   nothing and just held a ready page behind ~3s of synthetic log.
   Landing and All Projects still benefit from warming their field
   registry. Project routes deliberately warm only their current
   model in projects/data.jsx; sweeping PROJECT_DATA here defeated
   that memory/GPU boundary and parsed every case-study mark.
   ============================================================ */
(function warmModels() {
  let done = false;
  setTimeout(() => {
    if (done) return;
    done = true;
    if (typeof window.preloadModels !== "function") return;
    const urls = new Set();
    (window.UNIVERSE_PROJECTS || []).forEach(p => p.model && urls.add(p.model));
    if (urls.size) window.preloadModels(Array.from(urls));
  }, 0);
})();

/* ============================================================
   CURSOR — adaptive probe
   ============================================================ */
function Cursor() {
  const ref = useRef(null);
  const coordRef = useRef(null);
  const [mode, setMode] = useState("idle"); // idle | hot | probe | grab

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor");
    const node = ref.current;

    // Two decoupled jobs on pointer movement:
    //   1. position + live pixel readout  → written DIRECTLY to the DOM once
    //      per display frame, so high-rate mice cannot flood style/text writes.
    //   2. hover-target detection (elementFromPoint + .closest tree-walks) →
    //      this is the genuinely expensive part, so it's time-throttled and the
    //      mode state only updates when it actually changes.
    let px = 0, py = 0, lastMode = "idle", lastProbe = 0, raf = 0, live = false;
    const root = document.documentElement;

    // Anything that opens, submits or toggles reads as OPEN. This is tested
    // FIRST so a link laid over a draggable surface still reports itself as a
    // link instead of inheriting that surface's affordance — the board-flight
    // footer and the event bus both sit inside one. Things that are clickable
    // without being an anchor or a button carry `data-hot`.
    const HOT = "a[href], button, summary, [role='link'], [role='button'], [role='tab'], "
      + "[data-hot], .key, .node, .swatch, .curve, .family, .compBlock, .t-link";
    const PROBE = ".photoTile, .ascii-fig__cv";   // surfaces you inspect
    const GRAB  = ".bus3d, .universeBg";          // surfaces you drag

    // Pointer events report sub-pixel coordinates (fractional DPR, high-res
    // mice), where the old mousemove path handed back whole numbers. The
    // readout is a PIXEL readout, so it rounds; px/py stay fractional for the
    // transform, which is what keeps the reticle smooth on a HiDPI screen.
    const writeCoords = () => {
      const c = coordRef.current;
      if (c) c.textContent =
        String(Math.round(px)).padStart(4, "0") + " / " +
        String(Math.round(py)).padStart(4, "0");
    };

    const probe = (now) => {
      if (now - lastProbe < 60) return;   // ~16 hit-tests/sec is plenty for mode
      lastProbe = now;
      const el = document.elementFromPoint(px, py);
      let next = "idle";
      if (el) {
        if      (el.closest(HOT))   next = "hot";
        else if (el.closest(PROBE)) next = "probe";
        else if (el.closest(GRAB))  next = "grab";
      }
      if (next !== lastMode) { lastMode = next; setMode(next); }
    };

    const setLive = (on) => {
      if (live === on) return;
      live = on;
      root.classList.toggle("mo-cursor-live", on);
      // Coming back from off-window with a stale "open" ring would announce a
      // link the pointer may no longer be over.
      if (!on && lastMode !== "idle") { lastMode = "idle"; setMode("idle"); }
    };

    const flushMove = now => {
      raf = 0;
      if (node) node.style.transform =
        `translate(${px}px, ${py}px) translate(-50%, -50%)`;
      writeCoords();
      probe(now);
    };

    // Every event that carries a real coordinate reveals the reticle: moving,
    // pressing and scrolling all prove where the pointer is. Touch never does —
    // the coarse-pointer query hides the reticle anyway, and a synthetic move
    // would otherwise strand it mid-screen after a tap.
    const track = e => {
      if (e.pointerType === "touch") return;
      px = e.clientX; py = e.clientY;
      setLive(true);
      if (!raf) raf = requestAnimationFrame(flushMove);
    };
    // relatedTarget === null on a bubbled mouseout is the pointer leaving the
    // window entirely, as opposed to crossing between two elements inside it.
    const onOut  = e => { if (!e.relatedTarget) setLive(false); };
    const onBlur = () => setLive(false);

    window.addEventListener("pointermove", track, { passive: true });
    window.addEventListener("pointerdown", track, { passive: true });
    window.addEventListener("wheel", track, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", track);
      window.removeEventListener("pointerdown", track);
      window.removeEventListener("wheel", track);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", onBlur);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("custom-cursor");
      root.classList.remove("mo-cursor-live");
    };
  }, []);

  // The coord span is ALWAYS mounted (just hidden when not idle) so its ref
  // stays stable and the per-move textContent writes never hit a detached node.
  return (
    <div ref={ref} className={"cursor cursor--" + mode}>
      <div className="cursor__ring" />
      <div className="cursor__center" />
      <div className="cursor__hLine" />
      <div className="cursor__vLine" />
      <div className="cursor__coords">
        <span ref={coordRef} style={{ display: mode === "idle" ? "" : "none" }}>0000 / 0000</span>
        {mode === "grab"  && <span>drag to rotate</span>}
        {mode === "probe" && <span>inspect ⌖</span>}
        {mode === "hot"   && <span>open →</span>}
      </div>
    </div>
  );
}

/* ============================================================
   SHELL — fixed top nav
   ============================================================ */
function Shell() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="shell">
      <a className="shell__brand" href="./" aria-label="Back to the title">M.O. ∥ SYSTEM v0.1.0</a>
      <nav className="shell__nav">
        <a href="#brief">BRIEF</a>
        <a href="#color">COLOR</a>
        <a href="#type">TYPE</a>
        <a href="#grid">GRID</a>
        <a href="#motion">MOTION</a>
        <a href="#components">COMPONENTS</a>
        <a href="#voice">VOICE</a>
      </nav>
      <div className="shell__status">
        <span className="shell__dot" />
        <span>ONLINE · MUC · {time}</span>
      </div>
    </header>
  );
}

window.Cursor = Cursor;
window.Shell = Shell;
