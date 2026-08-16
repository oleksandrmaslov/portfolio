/* ============================================================
   M.O. SYSTEM — ISKRA · LINE SHIFT  (React game UI)
   ------------------------------------------------------------
   <IskraDemoLayer active onClose tweaks /> — the flashing-line
   game, rendered into the demo overlay.

   BOOT → SETUP (operator/batch → START SHIFT) → SHIFT:
     · score HUD  — score · streak · progress
     · BENCH      — the incoming board (silkscreen tag) + the
                    firmware pickers + SCAN / REJECT / FLASH
     · console    — the live two-phase GDB output
     · shift log  — every decision, scored
   → REPORT — shift summary, rank, PLAY AGAIN
   ============================================================ */
const { useState: useIH, useEffect: useEIH, useRef: useRIH } = React;

function IskraConsole({ lines, progress }) {
  const ref = useRIH(null);
  useEIH(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight; }, [lines]);
  return (
    <div className="isk-con">
      <header className="isk-con__head">
        <span className="isk-con__dot" />
        <span>GDB · arm-none-eabi · COM7</span>
        <span className="isk-con__spacer" />
        {progress > 0 && progress < 1 && <span className="isk-con__pct">{Math.round(progress * 100)}%</span>}
      </header>
      <div className="isk-con__body" ref={ref}>
        {lines.length === 0 && <div className="isk-con__line isk-con__line--dim">awaiting operator action …</div>}
        {lines.map((l, i) => (
          <div key={i} className={"isk-con__line isk-con__line--" + (l.cls || "out")}>{l.text}</div>
        ))}
      </div>
      {progress > 0 && <div className="isk-con__bar"><div className="isk-con__fill" style={{ width: Math.round(progress * 100) + "%" }} /></div>}
    </div>
  );
}

function IskraSetup({ S }) {
  const cat = window.IskraStation.catalog;
  const ops = window.IskraStation.operators;
  const [op, setOp] = useIH(S.operator || ops[0]);
  const [batch, setBatch] = useIH(S.batch || "B-2607");

  const begin = () => {
    window.IskraStation.setOperator(op);
    window.IskraStation.setBatch(batch);
    window.IskraStation.startShift();
  };

  return (
    <div className="isk-setup">
      <div className="isk-setup__card">
        <header className="isk-setup__head">
          <span className="isk-spark" aria-hidden="true"><i /></span>
          <div>
            <div className="isk-setup__title">ИСКРA · LINE SHIFT</div>
            <div className="isk-setup__sub">Energy for Ukraine · clock on, run the flashing line</div>
          </div>
        </header>

        <div className="isk-brief">
          <div className="isk-brief__row"><b>READ</b> each board's silkscreen — or SCAN to identify it safely.</div>
          <div className="isk-brief__row"><b>MATCH</b> the right firmware from the signed catalog, then FLASH.</div>
          <div className="isk-brief__row"><b>REJECT</b> anything that isn't a PY32 board — it doesn't belong.</div>
          <div className="isk-brief__note">the two-phase scan means you can never brick a board. speed + the right call is the game.</div>
        </div>

        <label className="isk-field">
          <span className="isk-field__k">OPERATOR</span>
          <div className="isk-chips">
            {ops.map((o) => (
              <button key={o} className={"isk-chip " + (op === o ? "is-on" : "")} onClick={() => setOp(o)}>{o}</button>
            ))}
          </div>
        </label>

        <label className="isk-field">
          <span className="isk-field__k">BATCH ID</span>
          <input className="isk-input" value={batch} onChange={(e) => setBatch(e.target.value.toUpperCase())} spellCheck="false" />
        </label>

        <button className="isk-start" onClick={begin}><span className="isk-start__k">▸</span> START SHIFT</button>
        <div className="isk-setup__foot">10 BOARDS · 2-PHASE SAFE · Ed25519 · SHA-256 · 0 BRICKED, EVER</div>
      </div>
    </div>
  );
}

/* the physical board on the bench */
function IskraBoard({ board, busy }) {
  if (!board) return <div className="isk-bench__empty">— bench clear —</div>;
  const unknown = board.unknown && !board.revealed;
  const fam = unknown ? "???" : board.family;
  return (
    <div className={"isk-pcb " + (unknown ? "is-unknown " : "") + (busy ? "is-busy" : "")}>
      <div className="isk-pcb__chip">
        <span className="isk-pcb__chipDot" /><span className="isk-pcb__chipDot" />
        <span className="isk-pcb__chipDot" /><span className="isk-pcb__chipDot" />
      </div>
      <div className="isk-pcb__silk">
        <span className="isk-pcb__label">{unknown ? "▓▓▓▓▓▓▓" : board.name}</span>
        <span className="isk-pcb__part">{unknown ? "silkscreen unreadable — SCAN to identify" : board.silk}</span>
      </div>
      <div className="isk-pcb__tags">
        <span className={"isk-pcb__fam isk-pcb__fam--" + (unknown ? "q" : fam === "PY32" ? "ok" : "bad")}>{fam}</span>
        {board.busy && <span className="isk-pcb__busy">PROBE BUSY</span>}
      </div>
      <span className="isk-pcb__swd">SWD</span>
    </div>
  );
}

function IskraShift({ S, lines, progress, verdict, history, scorePulse }) {
  const cat = window.IskraStation.catalog;
  const prod = cat.products.find((p) => p.id === S.product);
  const board = S.board;
  const done = S.phase === "done";
  const busy = S.busy;
  const needsRetry = board && board.busy && S.retried === false && busy === false && board.revealed && !done;

  return (
    <div className="isk-game">
      {/* score HUD */}
      <div className="isk-hud">
        <div className="isk-hud__cell"><span className="isk-hud__k">SCORE</span><span className={"isk-hud__v isk-hud__v--score " + (scorePulse ? "is-pulse" : "")}>{S.score}</span></div>
        <div className="isk-hud__cell"><span className="isk-hud__k">STREAK</span><span className="isk-hud__v">{S.streak > 0 ? "×" + S.streak : "—"}</span></div>
        <div className="isk-hud__cell"><span className="isk-hud__k">BOARD</span><span className="isk-hud__v">{Math.min(S.idx + 1, S.deck.length)} / {S.deck.length}</span></div>
        <div className="isk-hud__prog"><div className="isk-hud__progFill" style={{ width: ((S.idx) / S.deck.length * 100) + "%" }} /></div>
      </div>

      {/* BENCH */}
      <section className="isk-col isk-col--bench">
        <div className="isk-benchHead">BENCH · BOARD #{String(S.idx + 1).padStart(2, "0")}</div>
        <IskraBoard board={board} busy={busy} />

        <div className="isk-pick">
          <div className="isk-k isk-k--head">FIRMWARE · SIGNED CATALOG</div>
          <div className="isk-chips">
            {cat.products.map((p) => (
              <button key={p.id} className={"isk-chip isk-chip--prod " + (S.product === p.id ? "is-on" : "")}
                      disabled={busy || done}
                      onClick={() => window.IskraStation.selectProduct(p.id)}>
                <b>{p.name}</b><span>{p.part}</span>
              </button>
            ))}
          </div>
          <div className="isk-chips">
            {prod && prod.releases.map((r) => (
              <button key={r.version} className={"isk-chip " + (S.version === r.version ? "is-on" : "")}
                      disabled={busy || done}
                      onClick={() => window.IskraStation.selectVersion(r.version)}>{r.version}</button>
            ))}
          </div>
        </div>

        {/* actions */}
        {!done ? (
          needsRetry ? (
            <button className="isk-flash isk-flash--retry" onClick={() => window.IskraStation.retry()}>
              <span className="isk-flash__legend">PROBE BUSY</span><span className="isk-flash__label">RETRY</span>
            </button>
          ) : (
            <div className="isk-actions">
              <button className="isk-act isk-act--scan" disabled={busy} onClick={() => window.IskraStation.scan()}>
                <span className="isk-act__lg">⊙</span>SCAN<small>identify · safe</small>
              </button>
              <button className="isk-act isk-act--reject" disabled={busy} onClick={() => window.IskraStation.reject()}>
                <span className="isk-act__lg">✕</span>REJECT<small>not a PY32</small>
              </button>
              <button className={"isk-act isk-act--flash " + (busy ? "is-busy" : "")} disabled={busy} onClick={() => window.IskraStation.flash()}>
                <span className="isk-act__lg">▸</span>{busy ? phaseLabel(S.phase) : "FLASH"}<small>{busy ? "working" : "commit"}</small>
              </button>
            </div>
          )
        ) : (
          <button className={"isk-verdict isk-verdict--" + verdictClass(verdict)} onClick={() => window.IskraStation.next()}>
            <span className="isk-verdict__big">{verdict && verdictBig(verdict)}</span>
            <span className="isk-verdict__sub">{verdict && verdict.label}</span>
            <span className="isk-verdict__next">▸ NEXT BOARD</span>
          </button>
        )}
      </section>

      {/* console */}
      <section className="isk-col isk-col--con">
        <IskraConsole lines={lines} progress={progress} />
      </section>

      {/* shift log */}
      <aside className="isk-col isk-col--rail">
        <div className="isk-railSec isk-railSec--hist">
          <div className="isk-railHead">SHIFT LOG · {history.length}</div>
          <div className="isk-hist">
            {history.length === 0 && <div className="isk-hist__empty">no calls yet — handle the board</div>}
            {history.map((r) => (
              <div key={r.n} className={"isk-hist__row isk-hist__row--" + logClass(r.action)}>
                <span className="isk-hist__res">{logGlyph(r.action)}</span>
                <span className="isk-hist__unit">#{String(r.idx).padStart(2, "0")}</span>
                <span className="isk-hist__prod">{r.board}</span>
                <span className={"isk-hist__delta " + (r.delta >= 0 ? "is-pos" : "is-neg")}>{r.delta >= 0 ? "+" : ""}{r.delta}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="isk-legend">
          <div><b className="c-ok">FLASH</b> right fw → board flashed</div>
          <div><b className="c-ok">REJECT</b> a non-PY32 decoy</div>
          <div><b className="c-bad">WRONG FW</b> same family, you misread</div>
          <div><b className="c-bad">FALSE REJECT</b> tossed a good board</div>
        </div>
      </aside>
    </div>
  );
}

function IskraReport({ R, S }) {
  if (!R) return null;
  return (
    <div className="isk-report">
      <div className="isk-report__card">
        <header className="isk-report__head">
          <span className="isk-spark" aria-hidden="true"><i /></span>
          <div>
            <div className="isk-report__title">SHIFT REPORT</div>
            <div className="isk-report__sub">{S.operator} · batch {S.batch}</div>
          </div>
          <div className="isk-report__rank">{R.rank}</div>
        </header>
        <div className="isk-report__score">{R.score}<span>pts</span></div>
        <div className="isk-report__grid">
          <div className="isk-report__stat"><span className="isk-report__sk">FLASHED</span><span className="isk-report__sv c-ok">{R.flashed}</span></div>
          <div className="isk-report__stat"><span className="isk-report__sk">DECOYS CAUGHT</span><span className="isk-report__sv c-ok">{R.saved}</span></div>
          <div className="isk-report__stat"><span className="isk-report__sk">WRONG FW</span><span className="isk-report__sv c-bad">{R.mistakes}</span></div>
          <div className="isk-report__stat"><span className="isk-report__sk">FALSE REJECTS</span><span className="isk-report__sv c-bad">{R.falseRejects}</span></div>
          <div className="isk-report__stat"><span className="isk-report__sk">BEST STREAK</span><span className="isk-report__sv">×{R.best}</span></div>
          <div className="isk-report__stat"><span className="isk-report__sk">ACCURACY</span><span className="isk-report__sv">{R.accuracy}%</span></div>
        </div>
        <div className="isk-report__bricked">⬢ BOARDS BRICKED: 0 — the two-phase scan made it impossible.</div>
        <button className="isk-start" onClick={() => window.IskraStation.startShift()}><span className="isk-start__k">↻</span> NEW SHIFT</button>
      </div>
    </div>
  );
}

function phaseLabel(phase) { return { scanning: "SCAN", preflight: "SHA-256", flashing: "FLASH" }[phase] || "…"; }
function verdictClass(v) { if (!v) return ""; return (v.result === "PASS" || v.result === "REJECT") ? "pass" : "fail"; }
function verdictBig(v) { return { PASS: "PASS", REJECT: "REJECTED", WRONGFW: "WRONG FW", FALSEREJECT: "FALSE REJECT", FAIL: v.code === "E_TARGET_MISMATCH" ? "SCAN SAVED" : "FAIL" }[v.result] || v.result; }
function logClass(a) { return (a === "PASS" || a === "REJECT") ? "pass" : "fail"; }
function logGlyph(a) { return (a === "PASS" || a === "REJECT") ? "✓" : "✕"; }

function IskraDemoLayer({ active, onClose, tweaks }) {
  const [screen, setScreen] = useIH("boot");
  const [bootLines, setBootLines] = useIH([]);
  const [S, setS] = useIH({ ...window.IskraStation.state });
  const [lines, setLines] = useIH([]);
  const [progress, setProgress] = useIH(0);
  const [verdict, setVerdict] = useIH(null);
  const [history, setHistory] = useIH([]);
  const [soundOn, setSoundOn] = useIH(true);
  const [scorePulse, setScorePulse] = useIH(false);
  const soundRef = useRIH(null);
  const pulseT = useRIH(null);

  useEIH(() => {
    const St = window.IskraStation;
    const offs = [
      ["boot", (l) => setBootLines((b) => [...b, l])],
      ["screen", (s) => { setScreen(s); if (s === "boot") setBootLines([]); }],
      ["state", (s) => setS({ ...s })],
      ["line", (l) => { if (l.cls === "clear") { setLines([]); setProgress(0); } else setLines((p) => [...p, l]); }],
      ["progress", setProgress],
      ["verdict", setVerdict],
      ["history", setHistory],
      ["score", () => { setScorePulse(true); clearTimeout(pulseT.current); pulseT.current = setTimeout(() => setScorePulse(false), 360); }],
    ].map(([ev, cb]) => [ev, St.on(ev, cb)]);
    return () => offs.forEach(([ev, cb]) => St.off(ev, cb));
  }, []);

  useEIH(() => {
    const St = window.IskraStation;
    if (active) {
      setBootLines([]); setLines([]); setProgress(0); setVerdict(null);
      if (!soundRef.current) soundRef.current = window.makeIskraDemoSound();
      St.setSound(soundRef.current);
      const saved = localStorage.getItem("mo_demo_sound");
      const on = saved == null ? true : saved === "1";
      setSoundOn(on);
      soundRef.current.setMuted(!on);
      soundRef.current.setLevel((window.__demoTweaks || {}).soundLevel || 0.8);
      soundRef.current.start();
      St.start({ direction: (tweaks && tweaks.direction) || "cinematic" });
    } else {
      St.stop();
      if (soundRef.current) soundRef.current.stop();
    }
  }, [active]);

  useEIH(() => {
    if (tweaks) {
      window.__demoTweaks = Object.assign(window.__demoTweaks || {}, tweaks);
      if (active && soundRef.current) soundRef.current.setLevel(tweaks.soundLevel);
    }
  }, [tweaks, active]);

  useEIH(() => {
    const onKey = (e) => {
      if (!active) return;
      if (e.key === "Escape") return;
      if (screen === "boot" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); window.IskraStation.skip(); }
      if (screen === "shift" && S.phase === "done" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); window.IskraStation.next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, screen, S.phase]);

  const toggleSound = () => {
    const on = !soundOn; setSoundOn(on);
    localStorage.setItem("mo_demo_sound", on ? "1" : "0");
    if (soundRef.current) soundRef.current.setMuted(!on);
  };

  return (
    <div className={"hvd hvd--iskra " + (active ? "hvd--active " : "") + ("hvd--" + screen)} aria-hidden={!active} data-screen-label="06 Demo">
      <div className="hvd__stage hvd__stage--flat" />

      <span className="hvd__corner hvd__corner--tl" />
      <span className="hvd__corner hvd__corner--tr" />
      <span className="hvd__corner hvd__corner--bl" />
      <span className="hvd__corner hvd__corner--br" />

      <div className="hvd__title"><b>ИСКРA</b> · LINE SHIFT · RUN THE FLASHING LINE</div>

      <div className="hvd__topRight">
        <button className={"hvd-btn hvd-btn--snd " + (soundOn ? "is-on" : "")} onClick={toggleSound}>
          <span className="hvd-eq" aria-hidden="true"><i /><i /><i /></span>
          <span>{soundOn ? "FIELD · ON" : "MUTED"}</span>
        </button>
        <button className="hvd__close" onClick={onClose}>
          <span>STOP</span><span className="hvd__closeSep" /><span>[ESC]</span>
        </button>
      </div>

      {screen === "boot" && (
        <div className="hvd__boot">
          {bootLines.map((l, i) => (<div key={i} className="hvd__bootLine"><span className="hvd__bootCaret">▸</span>{l}</div>))}
          <button className="hvd-btn hvd__skip" onClick={() => window.IskraStation.skip()}>SKIP · [␣]</button>
        </div>
      )}
      {screen === "setup" && <IskraSetup S={S} />}
      {screen === "shift" && (
        <IskraShift S={S} lines={lines} progress={progress} verdict={verdict} history={history} scorePulse={scorePulse} />
      )}
      {screen === "report" && <IskraReport R={S.report} S={S} />}

      {S.lastAction && screen === "shift" && <div className="isk-toast" key={S.lastAction}>{S.lastAction}</div>}
    </div>
  );
}

window.IskraDemoLayer = IskraDemoLayer;
