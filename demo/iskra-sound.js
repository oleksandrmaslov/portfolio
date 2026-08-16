/* ============================================================
   M.O. SYSTEM — ISKRA DEMO SOUND  ·  node 0x09 shade (5/3)
   ------------------------------------------------------------
   Palette character: SPARK + RELAY. A workbench tool — dry hard
   relay clicks for every operator action, a thin tick-stream as
   gdb scan lines arrive, a rising charge whine during load, one
   clean bright STRIKE on PASS (the spark), a dull double-thud on
   FAIL, and a firm two-tone latch when a batch locks. All on the
   5/3 sideband of the 0x00 Carrier Field (demo/field-core.js).
   ============================================================ */
(function () {
  window.makeIskraDemoSound = function () {
    const core = window.makeFieldCore({ ratio: 5 / 3 });
    const FIB = core.FIB, ROOT = core.ROOT;
    const ctx = () => core.ctx();

    /* hard relay click — energise/de-energise snap */
    function click(kind) {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      const sum = c.createGain(); sum.gain.value = 1;
      const snap = c.createBufferSource(); snap.buffer = core.noise();
      const bp = c.createBiquadFilter(); bp.type = "bandpass";
      bp.frequency.value = kind === "soft" ? 2200 : 3400; bp.Q.value = 1.5;
      const g = c.createGain();
      core.env(g, t, kind === "soft" ? 0.03 : 0.06, 0.0006, 0.012);
      snap.connect(bp); bp.connect(g); g.connect(sum);
      snap.start(t); snap.stop(t + 0.05);
      if (kind !== "soft") {
        const body = c.createOscillator(); body.type = "square";
        body.frequency.setValueAtTime(150, t);
        body.frequency.exponentialRampToValueAtTime(70, t + 0.035);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400;
        const bg = c.createGain();
        core.env(bg, t, 0.045, 0.001, 0.05);
        body.connect(lp); lp.connect(bg); bg.connect(sum);
        body.start(t); body.stop(t + 0.2);
      }
      core.route(sum, 0.3);
      core.duck(0.16, FIB.t2);
    }

    /* gdb scan line tick — quiet, dry, slightly random */
    function scanTick() {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = "square";
      o.frequency.value = 2400 + Math.random() * 900;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3000;
      const g = c.createGain();
      core.env(g, t, 0.01, 0.0008, 0.02);
      o.connect(lp); lp.connect(g);
      core.route(g, 0.18);
      o.start(t); o.stop(t + 0.06);
    }

    /* rising charge whine during load/verify */
    let charge = null;
    function chargeStart() {
      const c = ctx();
      if (!c || charge) return;
      const o = c.createOscillator(); o.type = "sawtooth";
      o.frequency.value = ROOT * 2;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600; lp.Q.value = 3;
      const g = c.createGain(); g.gain.value = 0.0001;
      o.connect(lp); lp.connect(g); g.connect(core.out());
      o.start();
      g.gain.setTargetAtTime(core.muted ? 0.0001 : 0.012, c.currentTime, 0.2);
      charge = { o, lp, g };
    }
    function chargeProgress(p) {
      const c = ctx();
      if (!charge || !c) return;
      charge.o.frequency.setTargetAtTime(ROOT * 2 * (1 + p * (5 / 3 - 1) * 2), c.currentTime, 0.1);
      charge.lp.frequency.setTargetAtTime(600 + p * 2600, c.currentTime, 0.1);
    }
    function chargeStop() {
      const c = ctx();
      if (!charge || !c) return;
      const ch = charge; charge = null;
      ch.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.12);
      setTimeout(() => { try { ch.o.stop(); } catch (_) {} }, 500);
    }

    /* the spark — bright clean strike on PASS */
    function strikePass() {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      chargeStop();
      /* zap transient */
      const z = c.createBufferSource(); z.buffer = core.noise();
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
      const zg = c.createGain();
      core.env(zg, t, 0.05, 0.001, 0.09);
      z.connect(hp); hp.connect(zg);
      core.route(zg, 0.6);
      z.start(t); z.stop(t + 0.14);
      /* ascending JI triad — the resolve */
      [1, 5 / 4, 5 / 3].forEach((r, i) =>
        setTimeout(() => core.ping(r, { peak: 0.03, octave: 2, decay: FIB.t4, duck: i === 0 }), i * 70));
      setTimeout(() => core.ping(2, { peak: 0.024, octave: 2, decay: FIB.t6, duck: false }), 240);
    }

    /* dull double thud on FAIL */
    function thudFail() {
      const c = ctx();
      if (!c || core.muted) return;
      chargeStop();
      const thud = (delay) => {
        const t = c.currentTime + delay;
        const o = c.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(58, t + 0.16);
        const g = c.createGain();
        core.env(g, t, 0.05, 0.004, 0.22);
        o.connect(g);
        core.route(g, 0.4);
        o.start(t); o.stop(t + 0.5);
      };
      thud(0); thud(0.19);
      core.duck(0.22, FIB.t3);
    }

    /* firm two-tone latch when a batch locks */
    function lock() {
      core.ping(5 / 3, { peak: 0.022, decay: FIB.t2, duck: false });
      setTimeout(() => core.ping(5 / 4, { peak: 0.02, octave: 0.5, decay: FIB.t3 }), 110);
    }

    function hashTick() {
      const c = ctx();
      if (!c || core.muted) return;
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.value = ROOT * 4 * (5 / 3) * (0.92 + Math.random() * 0.16);
      const g = c.createGain();
      core.env(g, t, 0.006, 0.001, 0.03);
      o.connect(g); core.route(g, 0.2);
      o.start(t); o.stop(t + 0.08);
    }

    function bootChime() {
      core.ping(5 / 3, { peak: 0.02, decay: FIB.t5 });
      setTimeout(() => core.ping(2, { peak: 0.014, octave: 2, decay: FIB.t6, duck: false }), FIB.t2 * 1000);
    }

    return {
      start: core.start,
      stop() { chargeStop(); core.stop(); },
      setLevel: core.setLevel,
      setMuted(m) { core.setMuted(m); if (m) chargeStop(); },
      get muted() { return core.muted; },
      uiTick: core.uiTick,
      bootTick: core.bootTick,
      click, scanTick, chargeStart, chargeProgress, chargeStop,
      strikePass, thudFail, lock, hashTick, bootChime,
    };
  };
})();
