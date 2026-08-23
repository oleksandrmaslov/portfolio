/* ============================================================
   M.O. SYSTEM — Shared site core (boot, grid, cursor, shell)
   ============================================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ============================================================
   BOOT — terminal preloader
   ============================================================ */
function Boot({ onDone }) {
  const lines = useMemo(() => [
    { t: "info", text: "M.O. SYSTEM // bootloader v0.1.0", time: "0.000s" },
    { t: "ok",   text: "cpu core online — nrf52840 @ 64MHz",  time: "0.001s" },
    { t: "ok",   text: "memory mapped — 256kB ram",            time: "0.003s" },
    { t: "ok",   text: "design tokens loaded",                 time: "0.005s" },
    { t: "ok",   text: "geist + geist mono mounted",           time: "0.008s" },
    { t: "ok",   text: "fibonacci scaffold initialised — φ=1.6180339887",  time: "0.013s" },
    { t: "ok",   text: "event bus connected — 7 channels",     time: "0.021s" },
    { t: "ok",   text: "three.js renderer attached",           time: "0.034s" },
    { t: "ok",   text: "3d assets prefetched — models warm",   time: "0.048s" },
    { t: "ok",   text: "all systems nominal",                  time: "0.055s" },
  ], []);

  // Kick off the GLB preload as soon as Boot mounts. Pulls model URLs from
  // every known source on the page (universe tile list + per-project data),
  // so this single hook warms the cache for both Landing and project pages.
  // Fire-and-forget — Boot's own timing is independent.
  useEffect(() => {
    if (typeof window.preloadModels !== "function") return;
    const urls = new Set();
    (window.UNIVERSE_PROJECTS || []).forEach(p => p.model && urls.add(p.model));
    const PD = window.PROJECT_DATA || {};
    Object.values(PD).forEach(p => p && p.model && urls.add(p.model));
    if (urls.size) window.preloadModels(Array.from(urls));
  }, []);

  const [shown, setShown] = useState(0);
  const [done, setDone]   = useState(false);
  const [gone, setGone]   = useState(false);

  useEffect(() => {
    if (shown >= lines.length) {
      const t1 = setTimeout(() => setDone(true), 220);
      const t2 = setTimeout(() => setGone(true), 1200);
      const t3 = setTimeout(() => onDone(), 1700);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    const id = setTimeout(() => setShown(s => s + 1), 90 + Math.random() * 60);
    return () => clearTimeout(id);
  }, [shown, lines.length, onDone]);

  const skip = () => { setGone(true); setTimeout(onDone, 300); };

  return (
    <div className={"boot " + (gone ? "gone" : "")}>
      <div className="boot__inner">
        <div className="boot__title">M.O. ∥ SYSTEM</div>
        {lines.slice(0, shown).map((l, i) => (
          <span key={i} className={"boot__line " + l.t}>
            {l.text}
            <span className="boot__time">{l.time}</span>
          </span>
        ))}
        {done && (
          <span className="boot__ready">
            &gt; READY
            <span className="boot__cursor" />
          </span>
        )}
      </div>
      <div className="boot__skip" data-hot onClick={skip}>skip ↵</div>
    </div>
  );
}

/* ============================================================
   FIB GRID — proportional column overlay (press G to reveal)
   ============================================================ */
function FibGrid() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "g" && e.key !== "G") return;
      if (e.target && /input|textarea/i.test(e.target.tagName || "")) return;
      setOn(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fibonacci column widths — content aligns to cumulative percentages.
  const cols = [1, 1, 2, 3, 5, 8, 13];
  const total = cols.reduce((a, b) => a + b, 0);
  let acc = 0;
  const verticals = cols.slice(0, -1).map(c => { acc += c; return acc / total * 100; });

  const rows = [1, 2, 3, 5, 8, 13];
  const totalR = rows.reduce((a, b) => a + b, 0);
  let accR = 0;
  const horizontals = rows.slice(0, -1).map(r => { accR += r; return accR / totalR * 100; });

  return (
    <div className={"fibGrid " + (on ? "fibGrid--on" : "")} aria-hidden="true">
      <div className="fibGrid__rails">
        {verticals.map((v, i) => (
          <div key={"v" + i} className="fibGrid__v" style={{ left: v + "%" }}>
            <span className="fibGrid__tick">{cols[i]}</span>
          </div>
        ))}
        {horizontals.map((h, i) => (
          <div key={"h" + i} className="fibGrid__h" style={{ top: h + "%" }} />
        ))}
      </div>
      <div className="fibGrid__legend">
        <span className="fibGrid__legendDot" />
        <span>FIB GRID · {on ? "VISIBLE" : "PRESS G"}</span>
      </div>
    </div>
  );
}

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
      <div className="shell__brand">M.O. ∥ SYSTEM v0.1.0</div>
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
        <span className="shell__hint">[G] grid</span>
      </div>
    </header>
  );
}

window.Boot = Boot;
window.FibGrid = FibGrid;
window.Cursor = Cursor;
window.Shell = Shell;
