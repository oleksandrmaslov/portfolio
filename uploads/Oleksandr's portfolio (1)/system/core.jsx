/* ============================================================
   M.O. SYSTEM — Core (boot, fib-grid, cursor, shell)
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
    { t: "ok",   text: "all systems nominal",                  time: "0.055s" },
  ], []);

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
      <div className="boot__skip" onClick={skip}>skip ↵</div>
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
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState("idle"); // idle | hot | probe | grab

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor");
    const onMove = e => {
      setCoords({ x: e.clientX, y: e.clientY });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) { setMode("idle"); return; }
      if (el.closest(".bus3d"))     { setMode("grab");  return; }
      if (el.closest(".photoTile")) { setMode("probe"); return; }
      if (el.closest("button, a, .node, .swatch, .curve, .family, .compBlock, .t-link, [data-hot]")) { setMode("hot"); return; }
      setMode("idle");
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); document.documentElement.classList.remove("custom-cursor"); };
  }, []);

  return (
    <div ref={ref} className={"cursor cursor--" + mode} style={{ transform: `translate(${coords.x}px, ${coords.y}px) translate(-50%, -50%)` }}>
      <div className="cursor__ring" />
      <div className="cursor__center" />
      <div className="cursor__hLine" />
      <div className="cursor__vLine" />
      <div className="cursor__coords">
        {mode === "grab"  && <span>drag to rotate</span>}
        {mode === "probe" && <span>inspect ⌖</span>}
        {mode === "hot"   && <span>open →</span>}
        {mode === "idle"  && <span>{String(coords.x).padStart(4, "0")} / {String(coords.y).padStart(4, "0")}</span>}
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
