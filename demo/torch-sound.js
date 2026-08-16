/* ============================================================
   M.O. SYSTEM — TORCH DEMO SOUND  ·  node 0x04 shade (3/2)
   ------------------------------------------------------------
   Palette character: HARD CLICKS. A tool, not an instrument —
   rubber-boot tail clicks with a metal-dome snap, dry electronic
   side-switch ticks, a barely-there driver hum that follows the
   beam, morse beeps keyed at the node's 3/2 sideband, and a
   green→red ping ladder for the battery readout. Substrate /
   carrier / shared-space come from demo/field-core.js.
   ============================================================ */
(function () {
  window.makeTorchDemoSound = function () {
    const core = window.makeFieldCore({ ratio: 3 / 2 });
    const FIB = core.FIB, ROOT = core.ROOT;
    let humOsc, humGain, humFilt, humLevel = 0;

    function ctx() { return core.ctx(); }

    function ensureHum() {
      const c = ctx();
      if (!c || humOsc) return;
      /* driver whine + filtered air — the beam's electrical body */
      humOsc = c.createOscillator(); humOsc.type = "sawtooth";
      humOsc.frequency.value = ROOT * 3;                 // dim driver harmonic
      humFilt = c.createBiquadFilter(); humFilt.type = "lowpass";
      humFilt.frequency.value = 480; humFilt.Q.value = 0.8;
      humGain = c.createGain(); humGain.gain.value = 0;
      humOsc.connect(humFilt); humFilt.connect(humGain);
      humGain.connect(core.out());
      humOsc.start();
    }
    function setHum(level) {
      const c = ctx();
      if (!c) return;
      ensureHum();
      humLevel = level;
      humGain.gain.setTargetAtTime(0.006 * level, c.currentTime, 0.12);
      humFilt.frequency.setTargetAtTime(320 + 900 * level, c.currentTime, 0.15);
    }

    /* hard tactile click — the palette's signature voice */
    function click(sw, dir) {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      const tw = window.__demoTweaks || {};
      const pitchK = (tw.clickPitch || 1) * (sw === 1 ? 1 : 1.5) * (0.97 + Math.random() * 0.06);
      const sum = c.createGain(); sum.gain.value = 1;

      /* metal dome snap */
      const snap = c.createBufferSource(); snap.buffer = core.noise();
      const snapBP = c.createBiquadFilter(); snapBP.type = "bandpass";
      snapBP.frequency.value = (dir === "down" ? 3100 : 3900) * Math.sqrt(pitchK);
      snapBP.Q.value = 1.6;
      const snapG = c.createGain();
      core.env(snapG, t, dir === "down" ? 0.075 : 0.04, 0.0006, 0.014);
      snap.connect(snapBP); snapBP.connect(snapG); snapG.connect(sum);
      snap.start(t); snap.stop(t + 0.06);

      /* body knock — tube resonance (SW1 only; SW2 is a dry tick) */
      if (sw === 1) {
        const body = c.createOscillator(); body.type = "triangle";
        body.frequency.setValueAtTime(210 * pitchK, t);
        body.frequency.exponentialRampToValueAtTime(95 * pitchK, t + 0.04);
        const bodyG = c.createGain();
        core.env(bodyG, t, dir === "down" ? 0.06 : 0.03, 0.001, 0.055);
        body.connect(bodyG); bodyG.connect(sum);
        body.start(t); body.stop(t + 0.2);
      }
      core.route(sum, 0.35);
      core.duck(0.2, FIB.t2);
    }

    function powerFx(on) {
      setHum(on ? 0.7 : 0);
      if (on) core.ping(3 / 2, { peak: 0.024, decay: FIB.t4 });
      else core.ping(3 / 4, { peak: 0.014, decay: FIB.t3 });
    }

    function colorSwap(color) {
      /* two-step blip: white = up the sideband, red = down into it */
      const a = color === "red" ? [3 / 2, 5 / 4] : [5 / 4, 3 / 2];
      core.ping(a[0], { peak: 0.018, decay: FIB.t2, duck: false });
      setTimeout(() => core.ping(a[1], { peak: 0.022, decay: FIB.t3 }), 90);
    }

    /* brightness ramp — a quiet servo glide that tracks the level */
    let rampOsc = null, rampGain = null;
    function rampStart() {
      const c = ctx();
      if (!c || core.muted) return;
      rampEnd();
      rampOsc = c.createOscillator(); rampOsc.type = "sine";
      rampOsc.frequency.value = ROOT * 2;
      rampGain = c.createGain(); rampGain.gain.value = 0.0001;
      rampOsc.connect(rampGain); rampGain.connect(core.out());
      rampOsc.start();
      rampGain.gain.setTargetAtTime(0.012, c.currentTime, 0.08);
    }
    function rampLevel(level) {
      const c = ctx();
      if (!c || !rampOsc) { setHum(level * 0.7); return; }
      rampOsc.frequency.setTargetAtTime(ROOT * 2 * (1 + level * 0.5), c.currentTime, 0.05);
      setHum(level * 0.7);
    }
    function rampEnd() {
      const c = ctx();
      if (rampOsc && c) {
        rampGain.gain.setTargetAtTime(0.0001, c.currentTime, 0.06);
        const o = rampOsc;
        setTimeout(() => { try { o.stop(); } catch (_) {} }, 300);
        rampOsc = null;
      }
    }

    /* morse beep — node sideband, keyed hard like a real firmware beeper */
    function sosBeep(units, unitMs) {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      const dur = (units * unitMs) / 1000;
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.value = ROOT * 4 * (3 / 2);          // 660 Hz — distress register
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.008);
      g.gain.setValueAtTime(0.03, t + dur - 0.015);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      core.route(g, 0.5);
      o.start(t); o.stop(t + dur + 0.05);
      core.duck(0.12, FIB.t2);
    }

    /* battery readout — ping ladder, green high / red low */
    function battCheck(level) {
      const n = Math.max(1, Math.ceil(level * 4));
      const ladder = [1, 9 / 8, 5 / 4, 3 / 2];
      for (let i = 0; i < n; i++) {
        setTimeout(() => core.ping(ladder[i], {
          peak: 0.02, decay: FIB.t2, duck: false,
          octave: level > 0.4 ? 2 : 1,               // low cell reads darker
        }), i * 130);
      }
    }

    function partLand(kind) {
      /* metallic seat — heavier for tail/body/head, dry for small parts */
      const heavy = kind === "body" || kind === "head" || kind === "tail";
      click(heavy ? 1 : 2, "down");
      if (kind === "head") core.ping(3 / 2, { peak: 0.018, decay: FIB.t4, duck: false });
      if (kind === "cell") core.ping(1, { peak: 0.014, octave: 0.5, decay: FIB.t3, duck: false });
    }

    function igniteFx() {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      const sw = c.createBufferSource(); sw.buffer = core.noise();
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 5;
      bp.frequency.setValueAtTime(420, t);
      bp.frequency.exponentialRampToValueAtTime(4800, t + 0.5);
      const g = c.createGain();
      core.env(g, t, 0.03, 0.04, 0.5);
      sw.connect(bp); bp.connect(g);
      core.route(g, 0.8);
      sw.start(t); sw.stop(t + 0.7);
      core.ping(3 / 2, { peak: 0.026, decay: FIB.t5 });
      setHum(1);
      setTimeout(() => setHum(0), 480);
    }

    function dieFx() {
      core.ping(3 / 4, { peak: 0.02, decay: FIB.t4, duck: false });
      setTimeout(() => core.ping(1 / 2, { peak: 0.016, decay: FIB.t5 }), FIB.t1 * 1000);
      setHum(0);
    }
    function rechargeFx() {
      core.ping(1, { peak: 0.016, decay: FIB.t2, duck: false });
      setTimeout(() => core.ping(5 / 4, { peak: 0.018, decay: FIB.t2, duck: false }), 110);
      setTimeout(() => core.ping(3 / 2, { peak: 0.022, decay: FIB.t4 }), 230);
    }

    function handover(quiet) {
      core.ping(3 / 2, { peak: quiet ? 0.018 : 0.03, decay: FIB.t5 });
      setTimeout(() => core.ping(2, { peak: quiet ? 0.01 : 0.02, decay: FIB.t6 }), FIB.t1 * 1000);
    }

    return {
      start: core.start,
      stop() { rampEnd(); setHum(0); core.stop(); },
      setLevel: core.setLevel,
      setMuted: core.setMuted,
      get muted() { return core.muted; },
      uiTick: core.uiTick,
      bootTick: core.bootTick,
      click, powerFx, colorSwap,
      rampStart, rampLevel, rampEnd,
      sosBeep, battCheck, partLand,
      igniteFx, dieFx, rechargeFx, handover,
    };
  };
})();
