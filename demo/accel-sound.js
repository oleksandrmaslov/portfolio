/* ============================================================
   M.O. SYSTEM — POINTACCEL DEMO SOUND  ·  node 0x03 shade (4/3)
   ------------------------------------------------------------
   Palette character: GLIDE GRAINS. The pointer's velocity field
   made audible — a granular shimmer whose rate follows speed
   and whose pitch follows the live acceleration factor, gliding
   along the 4/3 sideband. Crossing into max-factor rings a
   rate-limited ping. Substrate from demo/field-core.js.
   ============================================================ */
(function () {
  window.makeAccelDemoSound = function () {
    const core = window.makeFieldCore({ ratio: 4 / 3 });
    const FIB = core.FIB, ROOT = core.ROOT;
    const ctx = () => core.ctx();

    /* ---- grain voice: speed → grain rate, factor → pitch ---- */
    let motion = { speed: 0, factor: 0 };   // normalized 0..1
    let nextGrain = 0;
    let lastMaxPing = 0;

    function grain(t, pitch, amp) {
      const c = ctx();
      const o = c.createOscillator(); o.type = "sine";
      const f0 = ROOT * 2 * (4 / 3);
      o.frequency.setValueAtTime(f0 * (1 + pitch * 1.5), t);
      o.frequency.exponentialRampToValueAtTime(f0 * (1 + pitch * 1.5) * 1.06, t + 0.05);
      const g = c.createGain();
      core.env(g, t, 0.005 + amp * 0.022, 0.004, 0.07 + amp * 0.1);
      o.connect(g);
      core.route(g, 0.35);
      o.start(t); o.stop(t + 0.3);
    }

    /* called per frame by the controller */
    function setMotion(speedN, factorN) {
      motion.speed = Math.max(0, Math.min(1, speedN));
      motion.factor = Math.max(0, Math.min(1, factorN));
      const c = ctx();
      if (!c || core.muted) return;
      const now = c.currentTime;
      if (motion.speed > 0.02 && now >= nextGrain) {
        grain(now, motion.factor, motion.speed);
        const rate = 3 + motion.speed * 26;           // 3..29 grains/s
        nextGrain = now + 1 / rate * (0.85 + Math.random() * 0.3);
      }
    }

    function maxPing() {
      const c = ctx();
      if (!c || core.muted) return;
      if (c.currentTime - lastMaxPing < 1.6) return;
      lastMaxPing = c.currentTime;
      core.ping(4 / 3, { peak: 0.02, octave: 2, decay: FIB.t3, duck: false });
    }

    function presetTick() {
      core.ping(4 / 3, { peak: 0.016, decay: FIB.t2, duck: false });
      setTimeout(() => core.ping(2, { peak: 0.012, decay: FIB.t2, duck: false }), 110);
    }

    function emitFx() {
      /* the configurator "emit" — a tidy ascending confirmation */
      [1, 4 / 3, 2].forEach((r, i) =>
        setTimeout(() => core.ping(r, { peak: 0.018, decay: FIB.t2, duck: false }), i * 110));
    }

    return {
      start: core.start,
      stop: core.stop,
      setLevel: core.setLevel,
      setMuted: core.setMuted,
      get muted() { return core.muted; },
      uiTick: core.uiTick,
      bootTick: core.bootTick,
      setMotion, maxPing, presetTick, emitFx,
    };
  };
})();
