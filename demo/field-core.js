/* ============================================================
   M.O. SYSTEM — FIELD CORE  ·  shared 0x00 Carrier Field scaffold
   ------------------------------------------------------------
   The common substrate every per-project demo sound palette sits
   on (brief: SOUND-DESIGN-RESEARCH.md + the 0x00 Carrier Field
   doc). Extracted from demo/demo-sound.js (Wafer's palette keeps
   its own copy — canonical, untouched).

     window.makeFieldCore({ ratio })  →  core

   ratio = the node's just-intonation sideband (carrier-field-v10):
   0x02 = 5/4 · 0x03 = 4/3 · 0x04 = 3/2 … Accent pings default to
   the node's shade so every demo rings consonant with the field.

   core:
     .init() (gesture)  .start() .stop()
     .setLevel(v) .setMuted(m) .muted
     .ctx()  .out()  — dryBus for custom voices
     .route(node, wet)  .duck(amount, recover)
     .env(gain, t0, peak, attack, decay)
     .noise() — shared 1.5s noise buffer
     .ping(ratio, opts)  .uiTick(kind)  .bootTick()
     .FIB  .ROOT  .RATIO
   ============================================================ */
(function () {
  const FIB = { t1: 0.21, t2: 0.34, t3: 0.55, t4: 0.89, t5: 1.44, t6: 2.33 };
  const ROOT = 110;                            // 0x00 carrier root (A2)
  const JI = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 5 / 2, 3];

  window.makeFieldCore = function (opts = {}) {
    const RATIO = opts.ratio || 1;
    let ctx = null, master, comp, convolver, dryBus;
    let bedGain, carrierNodes = [];
    let level = 0.8, muted = false, running = false;
    let sparseTimer = null;

    function noiseBuffer(seconds) {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      return buf;
    }
    let _noise = null;
    const noise = () => (_noise || (_noise = noiseBuffer(1.5)));

    function makeIR() {
      const len = Math.floor(ctx.sampleRate * FIB.t6);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const e = Math.pow(1 - i / len, 2.6);
          lp += 0.18 * ((Math.random() * 2 - 1) - lp);
          d[i] = lp * e;
        }
      }
      return buf;
    }

    function env(g, t0, peak, attack, decay) {
      g.gain.cancelScheduledValues(t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0002, t0 + attack + decay);
    }

    function route(node, wet) {
      const w = ctx.createGain(); w.gain.value = wet;
      node.connect(dryBus);
      node.connect(w); w.connect(convolver);
    }

    function duck(amount, recover) {
      if (!bedGain) return;
      const t = ctx.currentTime;
      const g = bedGain.gain;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(1 - amount, t, 0.012);
      g.setTargetAtTime(1, t + 0.05, recover || FIB.t3);
    }

    function init() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      master = ctx.createGain(); master.gain.value = 0;
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -22; comp.knee.value = 18;
      comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.24;
      master.connect(comp); comp.connect(ctx.destination);

      convolver = ctx.createConvolver();
      convolver.buffer = makeIR();
      const wetOut = ctx.createGain(); wetOut.gain.value = 0.5;
      convolver.connect(wetOut); wetOut.connect(master);
      dryBus = ctx.createGain(); dryBus.gain.value = 1;
      dryBus.connect(master);

      /* graphite substrate + 0x00 carrier (duckable) */
      bedGain = ctx.createGain(); bedGain.gain.value = 1;
      const bedSum = ctx.createGain(); bedSum.gain.value = 1;
      bedSum.connect(bedGain); bedGain.connect(dryBus);
      const bedWet = ctx.createGain(); bedWet.gain.value = 0.35;
      bedGain.connect(bedWet); bedWet.connect(convolver);

      const subOsc = ctx.createOscillator(); subOsc.type = "sine"; subOsc.frequency.value = ROOT / 2;
      const subG = ctx.createGain(); subG.gain.value = 0.022;
      subOsc.connect(subG); subG.connect(bedSum); subOsc.start();
      carrierNodes.push(subOsc);

      /* carrier root + the NODE's own sideband, very quiet — each demo
         literally hums its address */
      [[ROOT, 0.011], [ROOT * RATIO, 0.005]].forEach(([f, g0], i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = g0;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.021 * (i + 1);
        const lfoG = ctx.createGain(); lfoG.gain.value = f * 0.0015;
        lfo.connect(lfoG); lfoG.connect(o.frequency);
        o.connect(g); g.connect(bedSum); o.start(); lfo.start();
        carrierNodes.push(o, lfo);
      });

      const airSrc = ctx.createBufferSource(); airSrc.buffer = noise(); airSrc.loop = true;
      const airFilt = ctx.createBiquadFilter(); airFilt.type = "bandpass";
      airFilt.frequency.value = 620; airFilt.Q.value = 0.5;
      const airG = ctx.createGain(); airG.gain.value = 0.006;
      const airLfo = ctx.createOscillator(); airLfo.frequency.value = 0.034;
      const airLfoG = ctx.createGain(); airLfoG.gain.value = 190;
      airLfo.connect(airLfoG); airLfoG.connect(airFilt.frequency);
      airSrc.connect(airFilt); airFilt.connect(airG); airG.connect(bedSum);
      airSrc.start(); airLfo.start();
      carrierNodes.push(airSrc, airLfo);
    }

    function ping(ratio, o = {}) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const f = ROOT * 2 * (ratio || RATIO) * (o.octave || 1);
      const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.003;
      const g1 = ctx.createGain(), g2 = ctx.createGain();
      const peak = o.peak != null ? o.peak : 0.03;
      env(g1, t, peak, 0.008, o.decay || FIB.t4);
      env(g2, t, peak * 0.22, 0.006, (o.decay || FIB.t4) * 0.6);
      const sum = ctx.createGain(); sum.gain.value = 1;
      o1.connect(g1); g1.connect(sum);
      o2.connect(g2); g2.connect(sum);
      route(sum, o.wet != null ? o.wet : 0.7);
      o1.start(t); o2.start(t);
      o1.stop(t + 3); o2.stop(t + 3);
      if (o.duck !== false) duck(0.18, FIB.t3);
    }

    function uiTick(kind) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "square";
      o.frequency.value = kind === "off" ? 880 : 1320;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
      const g = ctx.createGain();
      env(g, t, 0.018, 0.001, 0.035);
      o.connect(lp); lp.connect(g);
      route(g, 0.3);
      o.start(t); o.stop(t + 0.1);
    }

    function scheduleSparse() {
      if (!running) return;
      const wait = (5 + Math.random() * 9) * 1000;
      sparseTimer = setTimeout(() => {
        if (running && !muted) ping(JI[Math.floor(Math.random() * 4) + 2], { peak: 0.012, wet: 0.9, decay: FIB.t5 });
        scheduleSparse();
      }, wait);
    }

    function effLevel() { return muted ? 0.0001 : 0.9 * level; }

    return {
      FIB, ROOT, RATIO, JI,
      ctx: () => ctx,
      out: () => dryBus,
      noise, env, route, duck, ping, uiTick,
      bootTick() { uiTick("on"); },
      init,
      start() {
        init();
        if (ctx.state === "suspended") ctx.resume();
        running = true;
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(0.0001, t);
        master.gain.exponentialRampToValueAtTime(effLevel(), t + FIB.t5);
        setTimeout(() => ping(RATIO, { peak: 0.016, wet: 0.95, decay: FIB.t6, duck: false }), FIB.t2 * 1000);
        scheduleSparse();
      },
      stop() {
        if (!ctx) return;
        running = false;
        clearTimeout(sparseTimer);
        const t = ctx.currentTime;
        master.gain.setTargetAtTime(0.0001, t, FIB.t2);
        setTimeout(() => { if (!running && ctx && ctx.state === "running") ctx.suspend(); }, FIB.t5 * 1000);
      },
      setLevel(v) {
        level = v;
        if (ctx && running) master.gain.setTargetAtTime(effLevel(), ctx.currentTime, 0.08);
      },
      setMuted(m) {
        muted = m;
        if (ctx && running) master.gain.setTargetAtTime(effLevel(), ctx.currentTime, 0.06);
      },
      get muted() { return muted; },
      get running() { return running; },
    };
  };
})();
