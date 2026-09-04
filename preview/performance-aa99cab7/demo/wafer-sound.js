/* ============================================================
   M.O. SYSTEM — WAFER DEMO SOUND  ·  node 0x01 shade of the
   0x00 Carrier Field (production Wafer palette)
   ------------------------------------------------------------
   Implements the carrier-field brief, scoped to the demo:

     · graphite substrate — near-silent filtered air, matte
     · 0x00 carrier — quasi-tonal root (A 110) + just-intonation
       harmonics; subtle, never a melody
     · mechanical DNA — synthesized thocks (body + switch
       transient + case resonance, humanized). Wafer is the
       keyboard node, so this layer leads. Real recordings can
       replace `thock()` internals later without touching callers.
     · signal-cyan accents — RARE: part-landing pings (intro),
       layer remaps, the handover alignment. Nothing else.
     · shared space — one convolution tail; every event sends
       into it and ducks the substrate (visitor as disturbance)
     · Fibonacci hidden order — decay/event times from
       0.21 / 0.34 / 0.55 / 0.89 / 1.44 / 2.33 s
     · conservative levels, mono-safe, no sub dependence
   ============================================================ */
(function () {
  const FIB = { t1: 0.21, t2: 0.34, t3: 0.55, t4: 0.89, t5: 1.44, t6: 2.33 };
  const ROOT = 110;                            // 0x00 carrier root (A2)
  const JI = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 5 / 2, 3];   // just-intonation ladder

  window.makeWaferDemoSound = function () {
    let ctx = null, master, comp, convolver, wetBus, dryBus;
    let bedGain, subOsc, airSrc, airFilt, carrierOscs = [];
    let scrubSrc, scrubFilt, scrubGain;
    let level = 0.8, muted = false, running = false;
    let sparseTimer = null;
    let lastThockAt = 0;

    /* ---------- helpers ---------- */
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
      // shared space: 2.33s decorrelated exponential tail (Fib t6)
      const len = Math.floor(ctx.sampleRate * FIB.t6);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const e = Math.pow(1 - i / len, 2.6);
          lp += 0.18 * ((Math.random() * 2 - 1) - lp);   // darken the tail
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

    /* route a one-shot through dry + shared space, with substrate duck */
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

    /* ---------- init (must be inside a user gesture) ---------- */
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
      wetBus = convolver;
      dryBus = ctx.createGain(); dryBus.gain.value = 1;
      dryBus.connect(master);

      /* -------- graphite substrate + 0x00 carrier (duckable) -------- */
      bedGain = ctx.createGain(); bedGain.gain.value = 1;
      const bedSum = ctx.createGain(); bedSum.gain.value = 1;
      bedSum.connect(bedGain); bedGain.connect(dryBus);
      const bedWet = ctx.createGain(); bedWet.gain.value = 0.35;
      bedGain.connect(bedWet); bedWet.connect(convolver);

      // low root — felt as foundation, but carried by 110 not sub-bass
      subOsc = ctx.createOscillator(); subOsc.type = "sine"; subOsc.frequency.value = ROOT / 2;
      const subG = ctx.createGain(); subG.gain.value = 0.022;
      subOsc.connect(subG); subG.connect(bedSum); subOsc.start();

      // carrier: two quiet detuned partials at root + fifth, slow drift
      [[ROOT, 0.011], [ROOT * 1.5, 0.006]].forEach(([f, g0], i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = g0;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.021 * (i + 1);
        const lfoG = ctx.createGain(); lfoG.gain.value = f * 0.0015;
        lfo.connect(lfoG); lfoG.connect(o.frequency);
        o.connect(g); g.connect(bedSum); o.start(); lfo.start();
        carrierOscs.push(o, lfo);
      });

      // matte air — filtered noise, barely there
      airSrc = ctx.createBufferSource(); airSrc.buffer = noise(); airSrc.loop = true;
      airFilt = ctx.createBiquadFilter(); airFilt.type = "bandpass";
      airFilt.frequency.value = 620; airFilt.Q.value = 0.5;
      const airG = ctx.createGain(); airG.gain.value = 0.006;
      const airLfo = ctx.createOscillator(); airLfo.frequency.value = 0.034;
      const airLfoG = ctx.createGain(); airLfoG.gain.value = 190;
      airLfo.connect(airLfoG); airLfoG.connect(airFilt.frequency);
      airSrc.connect(airFilt); airFilt.connect(airG); airG.connect(bedSum);
      airSrc.start(); airLfo.start();

      /* -------- explode scrub: diagnostic trace, motion-coupled -------- */
      scrubSrc = ctx.createBufferSource(); scrubSrc.buffer = noise(); scrubSrc.loop = true;
      scrubFilt = ctx.createBiquadFilter(); scrubFilt.type = "bandpass";
      scrubFilt.frequency.value = 420; scrubFilt.Q.value = 2.2;
      scrubGain = ctx.createGain(); scrubGain.gain.value = 0;
      scrubSrc.connect(scrubFilt); scrubFilt.connect(scrubGain);
      scrubGain.connect(dryBus);
      const scrubWet = ctx.createGain(); scrubWet.gain.value = 0.5;
      scrubGain.connect(scrubWet); scrubWet.connect(convolver);
      scrubSrc.start();
    }

    /* ---------- substrate sparse life ---------- */
    function scheduleSparse() {
      if (!running) return;
      const wait = (5 + Math.random() * 9) * 1000;     // long gaps — silence is material
      sparseTimer = setTimeout(() => {
        if (running && !muted) ping(JI[Math.floor(Math.random() * 4) + 2], { peak: 0.012, wet: 0.9, decay: FIB.t5 });
        scheduleSparse();
      }, wait);
    }

    /* ---------- public voices ---------- */

    /* signal-cyan accent: clean JI ping. RARE by convention. */
    function ping(ratio, opts = {}) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const f = ROOT * 2 * ratio * (opts.octave || 1);
      const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.003;
      const g1 = ctx.createGain(), g2 = ctx.createGain();
      const peak = opts.peak != null ? opts.peak : 0.03;
      env(g1, t, peak, 0.008, opts.decay || FIB.t4);
      env(g2, t, peak * 0.22, 0.006, (opts.decay || FIB.t4) * 0.6);
      const sum = ctx.createGain(); sum.gain.value = 1;
      o1.connect(g1); g1.connect(sum);
      o2.connect(g2); g2.connect(sum);
      route(sum, opts.wet != null ? opts.wet : 0.7);
      o1.start(t); o2.start(t);
      o1.stop(t + 3); o2.stop(t + 3);
      if (opts.duck !== false) duck(0.18, FIB.t3);
    }

    /* mechanical DNA: synthesized thock.
       deep=true for thumbs/space. intensity 0..1. 
       REPLACE-LATER: real keyboard recordings slot in here. */
    function thock(opts = {}) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const tw = (window.__waferDemoTweaks || {});
      const pitchK = (tw.thockPitch || 1) * (opts.deep ? 0.74 : 1) * (0.96 + Math.random() * 0.08);
      const vel = (opts.intensity != null ? opts.intensity : 1) * (0.85 + Math.random() * 0.3);

      // anti machine-gun: thin out if hammering
      const since = t - lastThockAt; lastThockAt = t;
      const thin = since < 0.05 ? 0.55 : 1;

      const sum = ctx.createGain(); sum.gain.value = 1;

      // body knock — pitched drop
      const body = ctx.createOscillator(); body.type = "triangle";
      body.frequency.setValueAtTime(165 * pitchK, t);
      body.frequency.exponentialRampToValueAtTime(68 * pitchK, t + 0.055);
      const bodyLP = ctx.createBiquadFilter(); bodyLP.type = "lowpass"; bodyLP.frequency.value = 850;
      const bodyG = ctx.createGain();
      env(bodyG, t, 0.085 * vel * thin, 0.0015, (opts.deep ? 0.13 : 0.085));
      body.connect(bodyLP); bodyLP.connect(bodyG); bodyG.connect(sum);
      body.start(t); body.stop(t + 0.4);

      // switch transient — tight filtered tick
      const tick = ctx.createBufferSource(); tick.buffer = noise();
      tick.playbackRate.value = 1 + Math.random() * 0.2;
      const tickBP = ctx.createBiquadFilter(); tickBP.type = "bandpass";
      tickBP.frequency.value = (2400 + Math.random() * 700) * Math.sqrt(pitchK);
      tickBP.Q.value = 1.1;
      const tickG = ctx.createGain();
      env(tickG, t, 0.05 * vel * thin, 0.0008, 0.018);
      tick.connect(tickBP); tickBP.connect(tickG); tickG.connect(sum);
      tick.start(t); tick.stop(t + 0.08);

      // case resonance — short bandpass ring (the aluminium slab)
      const res = ctx.createBufferSource(); res.buffer = noise();
      const resBP = ctx.createBiquadFilter(); resBP.type = "bandpass";
      resBP.frequency.value = (300 + Math.random() * 70) * pitchK;
      resBP.Q.value = 9;
      const resG = ctx.createGain();
      env(resG, t, 0.035 * vel * thin, 0.004, opts.deep ? FIB.t1 : 0.11);
      res.connect(resBP); resBP.connect(resG); resG.connect(sum);
      res.start(t); res.stop(t + 0.35);

      route(sum, 0.4);                       // the impulse excites the shared field
      duck(0.22, FIB.t2);                    // the field reacts — the disturbance
    }

    function keyRelease(deep) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const up = ctx.createBufferSource(); up.buffer = noise();
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
      bp.frequency.value = (3200 + Math.random() * 900) * (deep ? 0.8 : 1);
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      env(g, t, 0.016, 0.0008, 0.012);
      up.connect(bp); bp.connect(g);
      route(g, 0.25);
      up.start(t); up.stop(t + 0.05);
    }

    /* precise telemetry tick — HUD interactions (mode/turntable/etc.) */
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

    /* part lands during assembly — mechanical seat + (big parts) cyan trace */
    function partLand(kind) {
      if (!ctx || muted) return;
      if (kind === "cap") {
        thock({ intensity: 0.28 });
      } else if (kind === "half") {
        thock({ deep: true, intensity: 0.9 });
        ping(1, { peak: 0.022, octave: 0.5, decay: FIB.t5 });
      } else {
        thock({ deep: kind === "case", intensity: 0.55 });
        if (kind === "plate" || kind === "case") ping(kind === "case" ? 1 : 1.5, { peak: 0.016, decay: FIB.t4 });
      }
    }

    /* signal sweep across the caps — one diagnostic trace + JI ladder */
    function sweepFx(dur) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const d = (dur || 900) / 1000;
      const sw = ctx.createBufferSource(); sw.buffer = noise();
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 6;
      bp.frequency.setValueAtTime(500, t);
      bp.frequency.exponentialRampToValueAtTime(5200, t + d);
      const g = ctx.createGain();
      env(g, t, 0.028, 0.05, d);
      sw.connect(bp); bp.connect(g);
      route(g, 0.8);
      sw.start(t); sw.stop(t + d + 0.2);
      // JI ladder pings riding the sweep
      [0, 1, 2, 3, 5].forEach((ji, i) => {
        setTimeout(() => ping(JI[ji], { peak: 0.02, decay: FIB.t3, duck: false }), (d * 1000 * i) / 5);
      });
    }

    /* the handover — system aligns around the visitor (rare payoff) */
    function handover(quiet) {
      if (!ctx || muted) return;
      ping(2, { peak: quiet ? 0.018 : 0.034, decay: FIB.t5 });
      setTimeout(() => ping(3, { peak: quiet ? 0.012 : 0.024, decay: FIB.t6 }), FIB.t1 * 1000);
    }

    /* explode scrub — call per frame with |dE/dt| and current E */
    function scrub(speed, openness) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const target = Math.min(0.05, speed * 1.4);
      scrubGain.gain.setTargetAtTime(target, t, 0.06);
      scrubFilt.frequency.setTargetAtTime(380 + openness * 2200, t, 0.09);
    }

    /* threshold crossing: carrier rises, distant cyan harmonic aligns */
    function enterField() {
      if (!ctx) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(effLevel(), t + FIB.t5);
      // soft mechanical contact
      setTimeout(() => thock({ deep: true, intensity: 0.4 }), 90);
      // distant harmonic aligns into focus
      setTimeout(() => ping(1.5, { peak: 0.016, wet: 0.95, decay: FIB.t6, duck: false }), FIB.t2 * 1000);
    }

    function effLevel() { return muted ? 0.0001 : 0.9 * level; }

    /* ---------- lifecycle ---------- */
    return {
      start() {
        init();
        if (ctx.state === "suspended") ctx.resume();
        running = true;
        enterField();
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
      thock, keyRelease, uiTick, ping, partLand, sweepFx, handover, scrub, duck,
      bootTick() { uiTick("on"); },
    };
  };
})();
