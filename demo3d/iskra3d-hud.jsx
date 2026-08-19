/* ============================================================
   M.O. SYSTEM — ISKRA 3D · LINE SHIFT  (React game UI) · 0x09
   ------------------------------------------------------------
   <Iskra3DDemoLayer active onClose tweaks /> — the 3D flashing
   line. Boots, sets up the operator, then runs the shift:

     · score HUD       — score · streak · board progress
     · OPTICAL BENCH    — the 3D PCB you rotate + zoom to identify
     · GDB console      — live two-phase flash output (under bench)
     · IDENTIFY rail    — firmware pickers + SCAN / REJECT / FLASH,
                          verdict + NEXT, shift log
   → REPORT — shift summary + rank + NEW SHIFT
   ============================================================ */
const { useState: u3S, useEffect: u3E, useRef: u3R } = React;
const ST3 = () => window.IskraStation3D;

function I3Console({ lines, progress }) {
  const ref = u3R(null);
  u3E(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight; }, [lines]);
  return (
    <div className="i3-con">
      <header className="i3-con__head">
        <span className="i3-con__dot" />
        <span>GDB · arm-none-eabi · COM7</span>
        <span className="i3-con__spacer" />
        {progress > 0 && progress < 1 && <span className="i3-con__pct">{Math.round(progress * 100)}%</span>}
      </header>
      <div className="i3-con__body" ref={ref}>
        {lines.length === 0 && <div className="i3-con__line i3-con__line--dim">awaiting operator action …</div>}
        {lines.map((l, i) => (<div key={i} className={"i3-con__line i3-con__line--" + (l.cls || "out")}>{l.text}</div>))}
      </div>
      {progress > 0 && <div className="i3-con__bar"><div className="i3-con__fill" style={{ width: Math.round(progress * 100) + "%" }} /></div>}
    </div>
  );
}

function I3Setup({ S }) {
  const ops = ST3().operators;
  const [op, setOp] = u3S(S.operator || ops[0]);
  const [batch, setBatch] = u3S(S.batch || "B-2607");
  const begin = () => { ST3().setOperator(op); ST3().setBatch(batch); ST3().startShift(); };
  return (
    <div className="i3-setup">
      <div className="i3-setup__card">
        <header className="i3-setup__head">
          <span className="isk-spark" aria-hidden="true"><i /></span>
          <div>
            <div className="i3-setup__title">ИСКРA · LINE SHIFT · 3D BENCH</div>
            <div className="i3-setup__sub">Energy for Ukraine · clock on, run the flashing line</div>
          </div>
        </header>
        <div className="i3-brief">
          <div className="i3-brief__row"><b>INSPECT</b> each board in 3D — drag to orbit, scroll to zoom into the worn silkscreen.</div>
          <div className="i3-brief__row"><b>MATCH</b> the right firmware from the signed catalog, then FLASH — a correct flash assembles the unit.</div>
          <div className="i3-brief__row"><b>REJECT</b> anything that isn't a PY32 board — it doesn't belong on this line.</div>
          <div className="i3-brief__note">the two-phase scan means you can never brick a board. reading it fast + right is the game.</div>
        </div>
        <label className="i3-field">
          <span className="i3-field__k">OPERATOR</span>
          <div className="i3-chips">{ops.map((o) => (<button key={o} className={"i3-chip " + (op === o ? "is-on" : "")} onClick={() => setOp(o)}>{o}</button>))}</div>
        </label>
        <label className="i3-field">
          <span className="i3-field__k">BATCH ID</span>
          <input className="i3-input" value={batch} onChange={(e) => setBatch(e.target.value.toUpperCase())} spellCheck="false" />
        </label>
        <button className="i3-start" onClick={begin}><span className="i3-start__k">▸</span> START SHIFT</button>
        <div className="i3-setup__foot">10 BOARDS · 2 PRODUCTS · 4 DECOYS · 2-PHASE SAFE · 0 BRICKED, EVER</div>
      </div>
    </div>
  );
}

/* the firmware identify + action rail */
function I3Rail({ S, verdict, history }) {
  const cat = ST3().catalog;
  const prod = cat.products.find((p) => p.id === S.product);
  const board = S.board;
  const done = S.phase === "done";
  const busy = S.busy;
  const needsRetry = board && board.busy && S.retried === false && !busy && !done;
  const fam = board && board.scanned ? board.family : null;

  return (
    <div className="i3-rail">
      {/* identified readout (after SCAN) */}
      <div className="i3-ident">
        <div className="i3-ident__k">TARGET</div>
        {fam ? (
          <div className={"i3-ident__v i3-ident__v--" + (fam === "PY32" ? "ok" : "bad")}>
            <b>{board.silk}</b><span>{fam === "PY32" ? "PY32 family ✓" : fam + " · not a PY32 ✕"}</span>
          </div>
        ) : (
          <div className="i3-ident__v i3-ident__v--q"><b>— READ THE BOARD —</b><span>rotate · zoom · or SCAN to identify</span></div>
        )}
      </div>

      {/* firmware picker */}
      <div className="i3-pick">
        <div className="i3-k i3-k--head">FIRMWARE · SIGNED CATALOG</div>
        <div className="i3-chips i3-chips--prod">
          {cat.products.map((p) => (
            <button key={p.id} className={"i3-chip i3-chip--prod " + (S.product === p.id ? "is-on" : "")} disabled={busy || done}
                    onClick={() => ST3().selectProduct(p.id)}>
              <b>{p.name}</b><span>{p.part}</span>
            </button>
          ))}
        </div>
        <div className="i3-chips">
          {prod && prod.releases.map((r) => (
            <button key={r.version} className={"i3-chip " + (S.version === r.version ? "is-on" : "")} disabled={busy || done}
                    onClick={() => ST3().selectVersion(r.version)}>{r.version}</button>
          ))}
        </div>
      </div>

      {/* actions / verdict */}
      {!done ? (
        needsRetry ? (
          <button className="i3-flash i3-flash--retry" onClick={() => ST3().retry()}>
            <span className="i3-flash__legend">PROBE BUSY</span><span className="i3-flash__label">RETRY</span>
          </button>
        ) : (
          <div className="i3-actions">
            <button className="i3-act i3-act--scan" disabled={busy} onClick={() => ST3().scan()}>
              <span className="i3-act__lg">⊙</span>SCAN<small>identify · safe</small>
            </button>
            <button className="i3-act i3-act--reject" disabled={busy} onClick={() => ST3().reject()}>
              <span className="i3-act__lg">✕</span>REJECT<small>not a PY32</small>
            </button>
            <button className={"i3-act i3-act--flash " + (busy ? "is-busy" : "")} disabled={busy} onClick={() => ST3().flash()}>
              <span className="i3-act__lg">▸</span>{busy ? i3PhaseLabel(S.phase) : "FLASH"}<small>{busy ? "working" : "commit"}</small>
            </button>
          </div>
        )
      ) : (
        <button className={"i3-verdict i3-verdict--" + i3VClass(verdict)} onClick={() => ST3().next()}>
          <span className="i3-verdict__big">{verdict && i3VBig(verdict)}</span>
          <span className="i3-verdict__sub">{verdict && verdict.label}</span>
          <span className="i3-verdict__next">▸ NEXT BOARD</span>
        </button>
      )}

      {/* shift log */}
      <div className="i3-railSec">
        <div className="i3-railHead">SHIFT LOG · {history.length}</div>
        <div className="i3-hist">
          {history.length === 0 && <div className="i3-hist__empty">no calls yet — handle the board</div>}
          {history.map((r) => (
            <div key={r.n} className={"i3-hist__row i3-hist__row--" + i3LogClass(r.action)}>
              <span className="i3-hist__res">{i3LogGlyph(r.action)}</span>
              <span className="i3-hist__unit">#{String(r.idx).padStart(2, "0")}</span>
              <span className="i3-hist__prod">{r.board}</span>
              <span className={"i3-hist__delta " + (r.delta >= 0 ? "is-pos" : "is-neg")}>{r.delta >= 0 ? "+" : ""}{r.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function I3Shift({ S, lines, progress, verdict, history, scorePulse, tweaks, active }) {
  return (
    <div className="i3-game">
      <div className="i3-hud">
        <div className="i3-hud__cell"><span className="i3-hud__k">SCORE</span><span className={"i3-hud__v i3-hud__v--score " + (scorePulse ? "is-pulse" : "")}>{S.score}</span></div>
        <div className="i3-hud__cell"><span className="i3-hud__k">STREAK</span><span className="i3-hud__v">{S.streak > 0 ? "×" + S.streak : "—"}</span></div>
        <div className="i3-hud__cell"><span className="i3-hud__k">BOARD</span><span className="i3-hud__v">{Math.min(S.idx + 1, S.deck.length)} / {S.deck.length}</span></div>
        <div className="i3-hud__prog"><div className="i3-hud__progFill" style={{ width: (S.idx / S.deck.length * 100) + "%" }} /></div>
      </div>

      <div className="i3-main">
        <section className="i3-benchCol">
          <IskraStage3D active={active !== false} tweaks={tweaks} />
          <I3Console lines={lines} progress={progress} />
        </section>
        <I3Rail S={S} verdict={verdict} history={history} />
      </div>
    </div>
  );
}

function I3Report({ R, S }) {
  if (!R) return null;
  return (
    <div className="i3-report">
      <div className="i3-report__card">
        <header className="i3-report__head">
          <span className="isk-spark" aria-hidden="true"><i /></span>
          <div>
            <div className="i3-report__title">SHIFT REPORT</div>
            <div className="i3-report__sub">{S.operator} · batch {S.batch}</div>
          </div>
          <div className="i3-report__rank">{R.rank}</div>
        </header>
        <div className="i3-report__score">{R.score}<span>pts</span></div>
        <div className="i3-report__grid">
          <div className="i3-report__stat"><span className="i3-report__sk">FLASHED</span><span className="i3-report__sv c-ok">{R.flashed}</span></div>
          <div className="i3-report__stat"><span className="i3-report__sk">DECOYS CAUGHT</span><span className="i3-report__sv c-ok">{R.saved}</span></div>
          <div className="i3-report__stat"><span className="i3-report__sk">WRONG FW</span><span className="i3-report__sv c-bad">{R.mistakes}</span></div>
          <div className="i3-report__stat"><span className="i3-report__sk">FALSE REJECTS</span><span className="i3-report__sv c-bad">{R.falseRejects}</span></div>
          <div className="i3-report__stat"><span className="i3-report__sk">BEST STREAK</span><span className="i3-report__sv">×{R.best}</span></div>
          <div className="i3-report__stat"><span className="i3-report__sk">ACCURACY</span><span className="i3-report__sv">{R.accuracy}%</span></div>
        </div>
        <div className="i3-report__bricked">⬢ BOARDS BRICKED: 0 — the two-phase scan made it impossible.</div>
        <button className="i3-start" onClick={() => ST3().startShift()}><span className="i3-start__k">↻</span> NEW SHIFT</button>
      </div>
    </div>
  );
}

function i3PhaseLabel(p) { return { scanning: "SCAN", preflight: "SHA-256", flashing: "FLASH" }[p] || "…"; }
function i3VClass(v) { if (!v) return ""; return (v.result === "PASS" || v.result === "REJECT") ? "pass" : "fail"; }
function i3VBig(v) { return { PASS: "FLASHED", REJECT: "REJECTED", WRONGFW: "WRONG FW", FALSEREJECT: "FALSE REJECT", FAIL: v.code === "E_TARGET_MISMATCH" ? "SCAN SAVED" : "FAIL" }[v.result] || v.result; }
function i3LogClass(a) { return (a === "PASS" || a === "REJECT") ? "pass" : "fail"; }
function i3LogGlyph(a) { return (a === "PASS" || a === "REJECT") ? "✓" : "✕"; }

function Iskra3DDemoLayer({ active, onClose, tweaks }) {
  const [screen, setScreen] = u3S("boot");
  const [bootLines, setBootLines] = u3S([]);
  const [S, setS] = u3S({ ...ST3().state });
  const [lines, setLines] = u3S([]);
  const [progress, setProgress] = u3S(0);
  const [verdict, setVerdict] = u3S(null);
  const [history, setHistory] = u3S([]);
  const [soundOn, setSoundOn] = u3S(true);
  const [scorePulse, setScorePulse] = u3S(false);
  const soundRef = u3R(null);
  const pulseT = u3R(null);

  u3E(() => {
    const St = ST3();
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

  u3E(() => {
    const St = ST3();
    if (active) {
      setBootLines([]); setLines([]); setProgress(0); setVerdict(null);
      if (!soundRef.current && window.makeIskraDemoSound) soundRef.current = window.makeIskraDemoSound();
      if (soundRef.current) {
        St.setSound(soundRef.current);
        const saved = localStorage.getItem("mo_demo_sound");
        const on = saved == null ? true : saved === "1";
        setSoundOn(on); soundRef.current.setMuted(!on);
        soundRef.current.setLevel((window.__demoTweaks || {}).soundLevel || 0.8);
        soundRef.current.start();
      }
      St.setWearScale((tweaks && tweaks.wear) || 1);
      St.start();
    } else {
      St.stop();
      if (soundRef.current) soundRef.current.stop();
    }
  }, [active]);

  u3E(() => {
    if (tweaks) {
      window.__demoTweaks = Object.assign(window.__demoTweaks || {}, tweaks);
      if (active && soundRef.current && tweaks.soundLevel != null) soundRef.current.setLevel(tweaks.soundLevel);
      if (tweaks.wear != null) ST3().setWearScale(tweaks.wear);
    }
  }, [tweaks, active]);

  u3E(() => {
    const onKey = (e) => {
      if (!active) return;
      if (e.key === "Escape") return;
      if (screen === "boot" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); ST3().skip(); }
      if (screen === "shift" && S.phase === "done" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); ST3().next(); }
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
    <div className={"hvd hvd--iskra hvd--iskra3d " + (active ? "hvd--active " : "") + ("hvd--" + screen)} aria-hidden={!active} data-screen-label="06 Demo · 3D">
      <div className="hvd__stage hvd__stage--flat" />
      <span className="hvd__corner hvd__corner--tl" />
      <span className="hvd__corner hvd__corner--tr" />
      <span className="hvd__corner hvd__corner--bl" />
      <span className="hvd__corner hvd__corner--br" />

      <div className="hvd__title"><b>ИСКРA</b> · LINE SHIFT · 3D BENCH · IDENTIFY · FLASH</div>

      <div className="hvd__topRight">
        <button className={"hvd-btn hvd-btn--snd " + (soundOn ? "is-on" : "")} onClick={toggleSound}>
          <span className="hvd-eq" aria-hidden="true"><i /><i /><i /></span>
          <span>{soundOn ? "FIELD · ON" : "MUTED"}</span>
        </button>
        <button className="hvd__close" onClick={onClose}><span>STOP</span><span className="hvd__closeSep" /><span>[ESC]</span></button>
      </div>

      {screen === "boot" && (
        <div className="hvd__boot">
          {bootLines.map((l, i) => (<div key={i} className="hvd__bootLine"><span className="hvd__bootCaret">▸</span>{l}</div>))}
          <button className="hvd-btn hvd__skip" onClick={() => ST3().skip()}>SKIP · [␣]</button>
        </div>
      )}
      {screen === "setup" && <I3Setup S={S} />}
      {screen === "shift" && <I3Shift S={S} lines={lines} progress={progress} verdict={verdict} history={history} scorePulse={scorePulse} tweaks={tweaks} active={active} />}
      {screen === "report" && <I3Report R={S.report} S={S} />}

      {S.lastAction && screen === "shift" && <div className="i3-toast" key={S.lastAction}>{S.lastAction}</div>}
    </div>
  );
}

window.Iskra3DDemoLayer = Iskra3DDemoLayer;
