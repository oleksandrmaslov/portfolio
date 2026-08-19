/* ============================================================
   M.O. SYSTEM — Sound · subtle ambient drone + UI ticks
   ------------------------------------------------------------
   window.MOSound:
     .ensure()   create/resume AudioContext (needs a user gesture)
     .setOn(b)   master on/off (persisted)
     .isOn()     current state
     .tick()     short navigational blip
     .hover()    faint tick (throttled)
     .open()     rising sweep on project open
   Default: ON, but silent until the first gesture (autoplay policy).
   ============================================================ */
(function () {
  let ctx = null, master = null, droneGain = null, started = false;
  let on = (localStorage.getItem("mo_sound") ?? "1") === "1";
  let lastHover = 0;
  const subs = new Set();

  function build() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = on ? 1 : 0;
    master.connect(ctx.destination);

    // ----- ambient drone bed -----
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = 0.7;
    droneGain.connect(lp); lp.connect(master);

    // two detuned low oscillators → slow beating pad
    [55, 82.4, 110].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "sine" : "triangle";
      o.frequency.value = f * (1 + (i - 1) * 0.004);
      const g = ctx.createGain(); g.gain.value = i === 2 ? 0.05 : 0.12;
      o.connect(g); g.connect(droneGain); o.start();
    });
    // slow LFO breathing the pad
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.04;
    lfo.connect(lfoG); lfoG.connect(droneGain.gain); lfo.start();
    // fade the drone in
    droneGain.gain.setTargetAtTime(0.09, ctx.currentTime, 4);
  }

  function blip(freq, dur, type, vol, sweepTo) {
    if (!ctx || !on) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq * 1.5; bp.Q.value = 1.2;
    o.connect(bp); bp.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const MOSound = {
    ensure() {
      build();
      if (ctx && ctx.state === "suspended") ctx.resume();
      started = true;
    },
    setOn(b) {
      on = !!b; localStorage.setItem("mo_sound", on ? "1" : "0");
      if (master && ctx) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.08);
      if (on) MOSound.ensure();
      subs.forEach(fn => fn(on));
    },
    toggle() { MOSound.setOn(!on); },
    isOn() { return on; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    tick() { MOSound.ensure(); blip(660, 0.10, "square", 0.035, 880); },
    hover() {
      const now = performance.now(); if (now - lastHover < 110) return; lastHover = now;
      if (!ctx || !on) return; blip(1320, 0.05, "sine", 0.012);
    },
    open() { MOSound.ensure(); blip(330, 0.5, "sawtooth", 0.05, 1320); },
  };

  // first gesture anywhere unlocks audio
  const unlock = () => { MOSound.ensure(); window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);

  window.MOSound = MOSound;

  /* ----- React header toggle ----- */
  function SoundToggle() {
    const [isOn, setIsOn] = React.useState(MOSound.isOn());
    React.useEffect(() => MOSound.subscribe(setIsOn), []);
    return (
      <button
        className={"soundToggle " + (isOn ? "is-on" : "")}
        onClick={() => MOSound.toggle()}
        aria-label={isOn ? "Mute sound" : "Unmute sound"}
        title={isOn ? "Sound on — click to mute" : "Sound off — click to unmute"}
      >
        <span className="soundToggle__bars" aria-hidden="true">
          <span /><span /><span /><span />
        </span>
        <span className="soundToggle__label">{isOn ? "SOUND ON" : "MUTED"}</span>
      </button>
    );
  }
  window.SoundToggle = SoundToggle;
})();
