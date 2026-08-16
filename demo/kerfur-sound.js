/* ============================================================
   M.O. SYSTEM — KERFUR DEMO SOUND  ·  node 0x02 shade (5/4)
   ------------------------------------------------------------
   Palette character: SOFT CHIRPS. A living thing, not a tool —
   tiny sine chirps with portamento for reactions, a real purr
   (filtered noise + 28Hz amplitude motor) while petting, a
   two-note friend duet on the 5/4–3/2 sidebands, drowsy
   detuned drones for sleep. Substrate from demo/field-core.js.
   ============================================================ */
(function () {
  window.makeKerfurDemoSound = function () {
    const core = window.makeFieldCore({ ratio: 5 / 4 });
    const FIB = core.FIB, ROOT = core.ROOT;
    const ctx = () => core.ctx();

    /* chirp: short sine glide, optionally two-segment (frequencies
       in JI ratios above ROOT*4 so kerfur talks in the field's key) */
    function chirp(ratios, opts = {}) {
      const c = ctx();
      if (!c || core.muted) return;
      const t0 = c.currentTime;
      const dur = opts.dur || 0.16;
      const o = c.createOscillator(); o.type = "sine";
      const base = ROOT * 4 * (opts.octave || 1);
      o.frequency.setValueAtTime(base * ratios[0], t0);
      for (let i = 1; i < ratios.length; i++) {
        o.frequency.exponentialRampToValueAtTime(base * ratios[i], t0 + dur * (i / (ratios.length - 1)));
      }
      const g = c.createGain();
      core.env(g, t0, opts.peak || 0.028, 0.012, dur + (opts.tail || 0.12));
      /* slight vibrato = alive */
      const vib = c.createOscillator(); vib.frequency.value = 9;
      const vibG = c.createGain(); vibG.gain.value = base * 0.006;
      vib.connect(vibG); vibG.connect(o.frequency);
      o.connect(g);
      core.route(g, opts.wet != null ? opts.wet : 0.45);
      o.start(t0); vib.start(t0);
      o.stop(t0 + dur + 0.5); vib.stop(t0 + dur + 0.5);
      if (opts.duck !== false) core.duck(0.1, FIB.t2);
    }

    /* ---- purr: noise through a resonant LP, gated at ~28 Hz ---- */
    let purr = null;
    function purrStart() {
      const c = ctx();
      if (!c || purr) return;
      const src = c.createBufferSource(); src.buffer = core.noise(); src.loop = true;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 240; lp.Q.value = 1.4;
      const motor = c.createOscillator(); motor.frequency.value = 27;
      const motorG = c.createGain(); motorG.gain.value = 0.5;
      const gate = c.createGain(); gate.gain.value = 0.5;
      motor.connect(motorG); motorG.connect(gate.gain);
      const out = c.createGain(); out.gain.value = 0.0001;
      const sub = c.createOscillator(); sub.type = "sine"; sub.frequency.value = ROOT / 2 * (5 / 4);
      const subG = c.createGain(); subG.gain.value = 0.012;
      src.connect(lp); lp.connect(gate); gate.connect(out);
      sub.connect(subG); subG.connect(out);
      out.connect(core.out());
      src.start(); motor.start(); sub.start();
      out.gain.setTargetAtTime(core.muted ? 0.0001 : 0.034, c.currentTime, 0.18);
      purr = { src, motor, sub, out };
    }
    function purrStop() {
      const c = ctx();
      if (!purr || !c) return;
      const p = purr; purr = null;
      p.out.gain.setTargetAtTime(0.0001, c.currentTime, 0.22);
      setTimeout(() => { try { p.src.stop(); p.motor.stop(); p.sub.stop(); } catch (_) {} }, 900);
    }

    /* ---- vocabulary ---- */
    const fx = {
      blink()        { chirp([2, 2], { peak: 0.006, dur: 0.04, tail: 0.04, duck: false, wet: 0.2 }); },
      tap()          { chirp([5 / 4, 3 / 2], { peak: 0.02, dur: 0.09 }); },
      happy()        { chirp([5 / 4, 3 / 2, 2], { peak: 0.03, dur: 0.2 }); setTimeout(() => chirp([2, 5 / 2], { peak: 0.022, dur: 0.12, duck: false }), 180); },
      petBow()       { chirp([3 / 2, 5 / 4, 3 / 2], { peak: 0.024, dur: 0.26, tail: 0.2 }); },
      startle()      { chirp([1, 5 / 2], { peak: 0.045, dur: 0.07, tail: 0.05 }); },
      annoyed()      { chirp([5 / 4, 9 / 8, 1], { peak: 0.028, dur: 0.18, octave: 0.5 }); },
      pickup()       { chirp([1, 5 / 4], { peak: 0.02, dur: 0.13 }); },
      putdown()      { chirp([5 / 4, 1], { peak: 0.016, dur: 0.13 }); },
      notif()        { core.ping(2, { peak: 0.018, decay: FIB.t2, duck: false }); setTimeout(() => chirp([2, 9 / 4], { peak: 0.014, dur: 0.07, duck: false }), 140); },
      notifBig()     { core.ping(2, { peak: 0.024, decay: FIB.t3 }); setTimeout(() => chirp([5 / 4, 3 / 2, 2], { peak: 0.026, dur: 0.16 }), 160); },
      overload()     { chirp([2, 15 / 8, 5 / 4, 9 / 8], { peak: 0.03, dur: 0.34, octave: 0.5 }); },
      charge()       { chirp([1, 5 / 4, 3 / 2], { peak: 0.018, dur: 0.3, tail: 0.3, wet: 0.7 }); },
      drained()      { chirp([5 / 4, 1, 3 / 4], { peak: 0.02, dur: 0.4, octave: 0.5, tail: 0.3 }); },
      sleep()        { chirp([5 / 4, 1], { peak: 0.012, dur: 0.5, octave: 0.5, tail: 0.5, wet: 0.85 }); },
      wake()         { chirp([1, 5 / 4, 3 / 2], { peak: 0.02, dur: 0.18 }); },
      peerSeen()     { core.ping(5 / 3, { peak: 0.016, decay: FIB.t3, duck: false }); },
      /* the duet: main kerfur (5/4) calls, the peer (3/2 voice) answers,
         then both land on the octave together */
      friendDuet() {
        chirp([5 / 4, 3 / 2], { peak: 0.028, dur: 0.16 });
        setTimeout(() => chirp([3 / 2, 5 / 3], { peak: 0.026, dur: 0.16, octave: 1.5, duck: false }), 340);
        setTimeout(() => { chirp([5 / 4, 2], { peak: 0.03, dur: 0.22 }); chirp([3 / 2, 2], { peak: 0.024, dur: 0.22, octave: 1.5, duck: false }); }, 760);
        setTimeout(() => core.ping(2, { peak: 0.02, decay: FIB.t5, duck: false }), 1100);
      },
      bootChirp()    { chirp([1, 5 / 4], { peak: 0.018, dur: 0.3, tail: 0.4, wet: 0.8 }); },
    };

    return Object.assign({
      start: core.start,
      stop() { purrStop(); core.stop(); },
      setLevel: core.setLevel,
      setMuted(m) { core.setMuted(m); if (m) purrStop(); },
      get muted() { return core.muted; },
      uiTick: core.uiTick,
      bootTick: core.bootTick,
      purrStart, purrStop,
      get purring() { return !!purr; },
    }, fx);
  };
})();
