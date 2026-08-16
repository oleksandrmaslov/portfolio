/* ============================================================
   0x00 CARRIER FIELD v10 — heterodyne sound engine (Landing v10)
   ------------------------------------------------------------
   ONE LAW: 0x00 is a carrier signal. Every project is a sideband
   offset from it by a just-intonation ratio. Touching a node
   demodulates its sideband into audibility; it BEATS against the
   carrier and RESOLVES to zero beat when locked. Every interaction
   ducks the carrier — you are a disturbance in the field.

   v10 REINVENTION (per the three research briefs):
   · The bed NEVER leaves the fundamental — the old I–V–vi–IV pop
     progression is gone; the pad only re-voices 0x00's own harmonic
     series (4:5:6:7…8 — 7-limit just intonation, "machined" color).
   · The melody random-walk is gone — replaced by an Eno ensemble:
     five single-partial voices on FIXED incommensurable periods
     (Music for Airports method) that drift in and out of phase and
     never repeat within a session. Texture, not melody.
   · Decay lengths and event spacing step by Fibonacci proportions.
   · Waking is a ritual, not a toggle: soft mechanical contact → the
     carrier breathes in → a distant cyan harmonic starts 1.8% sharp
     and ALIGNS to true (detune → zero-beat). "Enter the field."
   · The thock varies ±5% per strike — no two key hits identical.

   Standalone. Depends on nothing. Memory-safe.
   ============================================================ */
(function () {
  "use strict";

  // ---- canonical tuning -------------------------------------------------
  const F0 = 98.0;            // carrier fundamental — G2, low-mid, audible
  const SUB = F0 / 2;         // 49 Hz felt sub-octave (headphones)
  const MAX_VOICES = 16;      // hard transient polyphony cap

  // 12 just-intonation sidebands, one per node 0x01..0x0C.
  // All consonant w/ the carrier → any chord of them rings clean.
  const RATIOS = {
    "0x01": 9 / 8,  "0x02": 5 / 4,  "0x03": 4 / 3,  "0x04": 3 / 2,
    "0x05": 5 / 3,  "0x06": 15 / 8, "0x07": 2 / 1,  "0x08": 9 / 4,
    "0x09": 5 / 2,  "0x0A": 8 / 3,  "0x0B": 3 / 1,  "0x0C": 10 / 3,
  };
  const ADDRS = Object.keys(RATIOS);

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const now = (ctx) => ctx.currentTime;

  // perceptual equal-loudness compensation. Higher partials sit where the ear
  // is most sensitive (Fletcher–Munson), so at equal amplitude they READ
  // louder — which is exactly why node 0x0C was hotter than 0x01. Attenuate
  // toward a common perceived loudness anchored at the carrier.
  const loudnessGain = (freq) => clamp(Math.pow(F0 / freq, 0.82), 0.3, 1.3);

  // a pleasant pentatonic subset of the lattice for cursor-trickle grains
  const MELODY = ["0x01", "0x02", "0x04", "0x05", "0x07"]; // 9:8 5:4 3:2 5:3 2:1

  // THE BED NEVER LEAVES THE FUNDAMENTAL. Each voicing is a stack of true
  // harmonic-series partials of F0 — no functional progression, no key
  // changes; only the emphasis inside 0x00's own overtone ladder shifts,
  // glacially. The 7th partial (3.5) is the rare "machined" color.
  const CHORDS = [
    [2, 3, 4, 4],            // 2:3:4 — open fifth+octave · the resting state
    [2, 2.5, 3, 4],          // 4:5:6:8 — the full bloom
    [2, 2.5, 3, 3.5],        // 4:5:6:7 — harmonic-seventh · rare, machined
    [1.5, 2, 3, 4],          // 3:4:6:8 — deep, hollow, wide
  ];

  function CarrierField() {
    let ctx = null, started = false;
    let master, limiter, analyser, wetIn, convolver, wetGain, fbDelay, fbGain;
    let carrierBus, carrierLP, carrierBreath;      // duckable carrier path
    let probeOsc, probeGain, probeBP, probePan;     // cursor probe (persistent)
    let proxOsc, proxOsc2, proxGain, proxPan, proxLP; // proximity "gravity" voice (persistent)
    let proxTargetF = F0 * 2, proxTargetG = 0, proxTargetPan = 0;
    let airSrc, airBP, airGain;                     // air layer (persistent)
    let padGain, padFilter, pulseLFOGain;           // warm harmonic pad + musical pulse
    let padVoices = null, chordIdx = 0, chordTimer = null;
    let melodyTimer = null, melodyStep = 0, melIdx = 2, lastTrickle = 0;
    let trickleMode = 2;   // 0=Droplets  1=Glass chimes  2=Dust (quiet) — Dust default
    let noiseBuf = null;                            // single shared noise buffer
    let masterTarget = 0.85, temperature = 0.6, cursorAmount = 0.7, idleLife = 0.3;
    let idleTimer = null;
    const hoverVoices = new Map();                  // addr -> voice
    const samples = {};                             // injected AudioBuffers (e.g. "lock")
    let transient = 0;                              // live transient voice count

    // smoothed cursor state
    const cur = { x: 0.5, y: 0.5, vx: 0, vy: 0, sx: 0.5, sy: 0.5, sv: 0 };
    // tuning-dial accumulator for scroll sweep
    let dial = 0, lastStation = 0;

    const state = {
      f0: F0, woken: false, active: [], beat: 0, level: 0, dial: 0,
    };

    // ---- one-time noise buffer (air + click transients) -----------------
    function ensureNoise() {
      if (noiseBuf) return noiseBuf;
      const len = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }

    // ---- generated reverb impulse (smooth space, ~1.8s) -----------------
    function makeImpulse() {
      const dur = 1.8, len = (ctx.sampleRate * dur) | 0;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          // early-ish onset, long exponential tail, gentle
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * (1 - Math.exp(-i / 400));
        }
      }
      return buf;
    }

    function build() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      // master → brickwall-ish limiter → out
      master = ctx.createGain();   master.gain.value = 0.0001;
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3; limiter.knee.value = 6;
      limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.2;
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.82;
      master.connect(limiter); limiter.connect(analyser); analyser.connect(ctx.destination);

      // space: convolver + a gentle feedback delay for depth.
      // Warm it: low-pass the whole wet path so the tail is soft, not glassy,
      // and damp the delay HARD so it diffuses instead of ringing metallic.
      wetIn = ctx.createGain(); wetIn.gain.value = 1;
      convolver = ctx.createConvolver(); convolver.buffer = makeImpulse();
      const wetLP = ctx.createBiquadFilter(); wetLP.type = "lowpass"; wetLP.frequency.value = 2200; wetLP.Q.value = 0.5;
      wetGain = ctx.createGain(); wetGain.gain.value = 0.5;
      fbDelay = ctx.createDelay(1.5); fbDelay.delayTime.value = 0.45;
      fbGain = ctx.createGain(); fbGain.gain.value = 0.18;
      const fbLP = ctx.createBiquadFilter(); fbLP.type = "lowpass"; fbLP.frequency.value = 1300;
      const fbHP = ctx.createBiquadFilter(); fbHP.type = "highpass"; fbHP.frequency.value = 120;
      wetIn.connect(convolver); convolver.connect(wetLP); wetLP.connect(wetGain); wetGain.connect(master);
      wetIn.connect(fbDelay); fbDelay.connect(fbLP); fbLP.connect(fbHP); fbHP.connect(fbGain);
      fbGain.connect(fbDelay); fbGain.connect(master);

      // ---- CARRIER (always-on, duckable) --------------------------------
      carrierBus = ctx.createGain(); carrierBus.gain.value = 1;
      carrierLP = ctx.createBiquadFilter(); carrierLP.type = "lowpass";
      carrierLP.frequency.value = 520; carrierLP.Q.value = 0.6;
      carrierBreath = ctx.createGain(); carrierBreath.gain.value = 0.5;
      carrierBus.connect(carrierLP); carrierLP.connect(carrierBreath);
      carrierBreath.connect(master); carrierBreath.connect(wetIn);

      const t = now(ctx);
      const mk = (freq, type, g, panv) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
        const og = ctx.createGain(); og.gain.value = g;
        const p = ctx.createStereoPanner(); p.pan.value = panv || 0;
        o.connect(og); og.connect(p); p.connect(carrierBus); o.start(t);
        return { o, og, p };
      };
      // felt sub, main, gently-detuned body (warm chorus), soft octave + a low
      // fifth for body. ALL SINES — triangles read as "metallic", sines are warm.
      mk(SUB, "sine", 0.55, 0);
      mk(F0, "sine", 0.42, 0);
      mk(F0 * 1.0007, "sine", 0.16, -0.22);   // slow chorus detune L (~0.07Hz beat)
      mk(F0 * 0.9994, "sine", 0.16, 0.22);    // R
      mk(F0 * 2, "sine", 0.07, 0);            // soft octave — adds warmth, not edge
      mk(F0 * 1.5, "sine", 0.06, 0);          // quiet low fifth (body)

      // breathing LFO on carrier amplitude (slow, deep-field)
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.18;
      lfo.connect(lfoG); lfoG.connect(carrierBreath.gain); lfo.start(t);

      // ---- SHEEN layer (musical air — NO noise) -------------------------
      ensureNoise();                                                  // for strikes + transients
      // Replaces the old grey-noise hiss with two high HARMONICS of the
      // carrier (3rd + 5th partials), heavily low-passed and tremolo'd so
      // they read as a soft, in-tune halo rather than static.
      airGain = ctx.createGain(); airGain.gain.value = 0.0001;       // (kept name; set by temperature)
      airBP = ctx.createBiquadFilter(); airBP.type = "lowpass";       // gentle roll-off, not bandpass
      airBP.frequency.value = 2600; airBP.Q.value = 0.4;
      airBP.connect(airGain); airGain.connect(master); airGain.connect(wetIn);
      const sheenA = ctx.createOscillator(); sheenA.type = "sine"; sheenA.frequency.value = F0 * 3;
      const sheenB = ctx.createOscillator(); sheenB.type = "sine"; sheenB.frequency.value = F0 * 5;
      const shA = ctx.createGain(); shA.gain.value = 0.5; const shB = ctx.createGain(); shB.gain.value = 0.32;
      const shPanA = ctx.createStereoPanner(); shPanA.pan.value = -0.35;
      const shPanB = ctx.createStereoPanner(); shPanB.pan.value = 0.35;
      sheenA.connect(shA); shA.connect(shPanA); shPanA.connect(airBP);
      sheenB.connect(shB); shB.connect(shPanB); shPanB.connect(airBP);
      sheenA.start(t); sheenB.start(t);
      // slow tremolo so the halo breathes (different rate from carrier)
      const airLfo = ctx.createOscillator(); airLfo.frequency.value = 0.07;
      const airLfoG = ctx.createGain(); airLfoG.gain.value = 0.22;
      airLfo.connect(airLfoG); airLfoG.connect(shA.gain); airLfoG.connect(shB.gain); airLfo.start(t);

      // ---- WARM PAD (evolving harmonic chord bed — warmth + interest) ----
      // Four voices we retune over time so the harmony slowly MOVES through a
      // I–V–vi–IV progression. Filter cutoff tracks the cursor; a slow stereo
      // drift + a gentle musical pulse keep it alive without a tappable beat.
      padGain = ctx.createGain(); padGain.gain.value = 0.0001;
      padFilter = ctx.createBiquadFilter(); padFilter.type = "lowpass";
      padFilter.frequency.value = 640; padFilter.Q.value = 0.4;
      const padPan = ctx.createStereoPanner(); padPan.pan.value = 0;
      padGain.connect(padFilter); padFilter.connect(padPan);
      padPan.connect(master); padPan.connect(wetIn);
      const padVoicing = [[-0.30, 0.30], [0.26, 0.15], [0.34, 0.20], [-0.20, 0.09]];
      padVoices = padVoicing.map(function (m) {
        const o = ctx.createOscillator(); o.type = "sine";
        const od = ctx.createOscillator(); od.type = "sine";        // chorus partner
        const og = ctx.createGain(); og.gain.value = m[1] * 0.5;
        const pp = ctx.createStereoPanner(); pp.pan.value = m[0];
        o.connect(og); od.connect(og); og.connect(pp); pp.connect(padGain);
        o.start(t); od.start(t);
        return { o, od };
      });
      setChord(CHORDS[0], t, 0.01);                                  // initial voicing
      padGain.gain.exponentialRampToValueAtTime(0.055, t + 7);       // very slow swell-in
      const padDrift = ctx.createOscillator(); padDrift.type = "sine"; padDrift.frequency.value = 0.045;
      const padDriftG = ctx.createGain(); padDriftG.gain.value = 0.5;
      padDrift.connect(padDriftG); padDriftG.connect(padPan.pan); padDrift.start(t);
      const pulse = ctx.createOscillator(); pulse.type = "sine"; pulse.frequency.value = 0.86; // ~52bpm feel
      pulseLFOGain = ctx.createGain(); pulseLFOGain.gain.value = 0.016;
      pulse.connect(pulseLFOGain); pulseLFOGain.connect(padGain.gain); pulse.start(t);

      // ---- CURSOR PROBE (persistent, tonal not noisy) -------------------
      probeOsc = ctx.createOscillator(); probeOsc.type = "sine"; probeOsc.frequency.value = F0 * 2;
      probeBP = ctx.createBiquadFilter(); probeBP.type = "bandpass"; probeBP.Q.value = 3;
      probeBP.frequency.value = F0 * 3;
      probePan = ctx.createStereoPanner(); probePan.pan.value = 0;
      probeGain = ctx.createGain(); probeGain.gain.value = 0.0001;
      probeOsc.connect(probeBP); probeBP.connect(probePan); probePan.connect(probeGain);
      probeGain.connect(master); probeGain.connect(wetIn); probeOsc.start(t);

      // ---- PROXIMITY "GRAVITY" voice (persistent, single, cheap) --------
      // A warm two-sine voice that glides to whatever node you're NEAREST and
      // swells with closeness — so the field sings faintly before you hover,
      // sensing your presence. One voice retuned per frame = no allocation.
      proxOsc = ctx.createOscillator(); proxOsc.type = "sine"; proxOsc.frequency.value = proxTargetF;
      proxOsc2 = ctx.createOscillator(); proxOsc2.type = "sine"; proxOsc2.frequency.value = proxTargetF * 2;
      const proxOsc2G = ctx.createGain(); proxOsc2G.gain.value = 0.3;
      proxLP = ctx.createBiquadFilter(); proxLP.type = "lowpass"; proxLP.frequency.value = 1200; proxLP.Q.value = 0.5;
      proxPan = ctx.createStereoPanner(); proxPan.pan.value = 0;
      proxGain = ctx.createGain(); proxGain.gain.value = 0.0001;
      proxOsc.connect(proxLP); proxOsc2.connect(proxOsc2G); proxOsc2G.connect(proxLP);
      proxLP.connect(proxPan); proxPan.connect(proxGain);
      proxGain.connect(master); proxGain.connect(wetIn);
      proxOsc.start(t); proxOsc2.start(t);

      applyTemperature();
    }

    function applyTemperature() {
      if (!ctx) return;
      const t = now(ctx);
      // temperature scales space + low-end weight + sheen (all gentle)
      wetGain.gain.setTargetAtTime(0.30 + temperature * 0.34, t, 0.4);
      fbGain.gain.setTargetAtTime(0.10 + temperature * 0.16, t, 0.4);
      carrierLP.frequency.setTargetAtTime(420 + temperature * 320, t, 0.4);
      airGain.gain.setTargetAtTime(0.010 + temperature * 0.010, t, 0.4);
    }

    // ---- duck the carrier: "you disturb the field" ----------------------
    function duck(amount, t) {
      const tt = t || now(ctx);
      carrierBus.gain.cancelScheduledValues(tt);
      carrierBus.gain.setValueAtTime(carrierBus.gain.value, tt);
      carrierBus.gain.linearRampToValueAtTime(clamp(1 - amount, 0.25, 1), tt + 0.02);
      carrierBus.gain.setTargetAtTime(1, tt + 0.05, 0.45);
    }

    // ---- KARPLUS–STRONG strike: excite a RESONANT BODY tuned to a partial.
    // This is the metaphor in DSP — a node is not played, it is *struck* and
    // rings. A short noise burst enters a feedback delay line whose length =
    // 1/freq; a low-pass in the loop damps it like a real string/plate. The
    // low carrier (98Hz) keeps every partial under ~375Hz, so the delay lines
    // clear Web Audio's feedback render-quantum floor and the pitch is true.
    function ksStrike(freq, amp, ring, pan, wetAmt) {
      if (!ctx || transient >= MAX_VOICES) return;
      freq = clamp(freq, 45, 370); amp = amp == null ? 0.2 : amp;
      ring = ring || 1.3; pan = pan || 0; wetAmt = wetAmt == null ? 0.6 : wetAmt;
      const t = now(ctx);
      // excitation
      const burst = ctx.createBufferSource(); burst.buffer = noiseBuf; burst.playbackRate.value = 1.5;
      const exHP = ctx.createBiquadFilter(); exHP.type = "highpass"; exHP.frequency.value = freq * 0.5;
      const exG = ctx.createGain(); exG.gain.value = 0.0001;
      // feedback string
      const delay = ctx.createDelay(0.05); delay.delayTime.value = 1 / freq;
      const damp = ctx.createBiquadFilter(); damp.type = "lowpass"; damp.frequency.value = Math.min(7000, freq * 7);
      damp.Q.value = 0.0001;   // NO resonant bump — a Q peak pushes loop gain > 1 → runaway howl
      const fb = ctx.createGain();
      fb.gain.value = Math.min(0.93, Math.pow(0.001, 1 / (freq * ring))); // hard safety cap
      const out = ctx.createGain(); out.gain.value = amp;
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      const dry = ctx.createGain(); dry.gain.value = 1 - wetAmt * 0.4;
      const wet = ctx.createGain(); wet.gain.value = wetAmt;
      burst.connect(exHP); exHP.connect(exG); exG.connect(delay);
      delay.connect(damp); damp.connect(fb); fb.connect(delay);   // the loop
      delay.connect(out); out.connect(p); p.connect(dry); p.connect(wet);
      dry.connect(master); wet.connect(wetIn);
      exG.gain.setValueAtTime(0.0001, t);
      exG.gain.exponentialRampToValueAtTime(1, t + 0.0012);
      exG.gain.exponentialRampToValueAtTime(0.0006, t + 0.009);
      burst.start(t); burst.stop(t + 0.04);
      transient++;
      const life = ring + 0.5;
      fb.gain.setTargetAtTime(0, t + life * 0.65, life * 0.18);    // collapse the string
      setTimeout(() => {
        [burst, exHP, exG, delay, damp, fb, out, p, dry, wet].forEach((n) => { try { n.disconnect(); } catch (e) {} });
        transient--;
      }, (life + 0.35) * 1000);
    }

    // ---- BELL: a soft glassy sine + octave with a smooth exponential decay.
    // Warm, consonant, pleasant — the "signal-cyan" accent and the voice of the
    // idle field and reward. (Replaces the darker Karplus–Strong pluck, which
    // read as eerie at these low pitches.)
    function bell(freq, amp, decay, pan, wetAmt) {
      if (!ctx || transient >= MAX_VOICES) return;
      amp = amp == null ? 0.12 : amp; decay = decay || 1.2; pan = pan || 0; wetAmt = wetAmt == null ? 0.5 : wetAmt;
      const t = now(ctx);
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = freq * 2;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      const g2 = ctx.createGain(); g2.gain.value = 0.0001;
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      const dry = ctx.createGain(); dry.gain.value = 1 - wetAmt * 0.4;
      const wet = ctx.createGain(); wet.gain.value = wetAmt;
      o.connect(g); o2.connect(g2); g.connect(p); g2.connect(p);
      p.connect(dry); p.connect(wet); dry.connect(master); wet.connect(wetIn);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0004, t + decay);
      g2.gain.exponentialRampToValueAtTime(amp * 0.32, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0004, t + decay * 0.6);
      transient++;
      o.start(t); o2.start(t); o.stop(t + decay + 0.1); o2.stop(t + decay + 0.1);
      o.onended = function () { [o, o2, g, g2, p, dry, wet].forEach(function (n) { try { n.disconnect(); } catch (e) {} }); transient--; };
      duck(0.16, t);
    }

    // ---- GENERATIVE idle field (Eno's incommensurable method).
    // The graphite substrate stays near-silent; at irrational intervals a
    // single distant partial is struck — wide, deep in the room, very quiet.
    // Never loops, never demands attention. Density scales with idleLife.
    function scheduleIdle() {
      if (!started) return;
      const base = 7 + (1 - idleLife) * 24;                 // 7..31s between pings
      const wait = (base + base * 0.6 * Math.random()) * 1000;
      idleTimer = setTimeout(() => {
        if (idleLife > 0.02 && transient < MAX_VOICES - 3 && hoverVoices.size === 0) {
          const addr = ADDRS[(Math.random() * ADDRS.length) | 0];
          const oct = Math.random() < 0.4 ? 0.5 : 1;          // some pings deeper
          bell(F0 * RATIOS[addr] * oct, 0.05 * idleLife, 2.4 + Math.random() * 2.2,
               (Math.random() * 2 - 1) * 0.8, 0.9);
        }
        scheduleIdle();
      }, wait);
    }

    // ---- HARMONY ENGINE: glide the pad voices to a chord; cycle slowly -----
    function setChord(chord, t, glide) {
      if (!padVoices) return;
      padVoices.forEach(function (v, i) {
        const f = F0 * chord[i % chord.length];
        v.o.frequency.setTargetAtTime(f, t, glide || 1.2);
        v.od.frequency.setTargetAtTime(f * 1.004, t, glide || 1.2);
      });
    }
    function scheduleChord() {
      if (!started) return;
      chordTimer = setTimeout(function () {
        if (ctx && ctx.state === "running") {
          chordIdx = (chordIdx + 1) % CHORDS.length;
          setChord(CHORDS[chordIdx], now(ctx), 5.5);    // glacial glide (Fib)
        }
        scheduleChord();
      }, (21 + Math.random() * 13) * 1000);             // 21–34s — audible evolution
    }

    // ---- GENERATIVE MELODY (melodic + rhythmic ambient).
    // A stepwise random-WALK along the pentatonic scale (so it sings, not
    // stumbles), with occasional leaps, grace notes and rests. Register +
    // density follow the cursor. Phrases never quite repeat (Eno).
    // ---- MOTIF ENGINE — rhythmic, melodic, evolving ----------------------
    // The field gets a heartbeat and a voice: a quiet 16-step sequencer on
    // the JI pentatonic at ~54 BPM (8ths). Soft sub thumps mark the downbeats
    // (felt more than heard); bells speak the motif with rests for air. One
    // step mutates per bar — the motif stays itself but never loops (Eno
    // discipline kept, musicality restored). Density follows idleLife.
    const MOTIF_SCALE = ["0x01", "0x02", "0x04", "0x05", "0x07"];  // 9:8 5:4 3:2 5:3 2:1
    const motif = [0, 2, -1, 4, 1, -1, 3, -1, 2, -1, 4, 2, 0, -1, 3, -1];  // -1 = rest
    let motifPos = 0;
    function thump(amp) {
      // felt sub pulse — dry, duck-free, speaker-safe (98→49Hz drop)
      if (!ctx || transient >= MAX_VOICES) return;
      const t = now(ctx);
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(SUB * 2, t);
      o.frequency.exponentialRampToValueAtTime(SUB, t + 0.09);
      const g = ctx.createGain(); g.gain.value = 0.0001;
      o.connect(g); g.connect(master);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 0.30);
      transient++; o.start(t); o.stop(t + 0.36);
      o.onended = function () { try { g.disconnect(); } catch (e) {} transient--; };
    }
    function scheduleMelody() {
      if (!started) return;
      const stepS = 60 / 54 / 2;                       // 8ths at 54 BPM — slow machine groove
      melodyTimer = setTimeout(function () {
        if (ctx && ctx.state === "running" && idleLife > 0.02) {
          const i16 = motifPos % motif.length;
          const breath = 0.4 + idleLife * 0.6;
          // heartbeat — downbeat + a softer ghost on the 6th eighth
          if (i16 % 8 === 0) thump(0.085 * breath);
          else if (i16 % 8 === 5) thump(0.042 * breath);
          const s = motif[i16];
          if (s >= 0 && transient < MAX_VOICES - 5 && hoverVoices.size === 0 &&
              Math.random() < 0.55 + idleLife * 0.45) {
            const oct = (i16 % 8 >= 4 && Math.random() < 0.3) ? 2 : 1;
            const f = F0 * RATIOS[MOTIF_SCALE[s]] * oct;
            const pan = Math.sin(i16 * 0.8) * 0.5;
            bell(f, (0.055 + idleLife * 0.05) * loudnessGain(f),
                 1.4 + (i16 % 4 === 0 ? 1.2 : 0), pan, 0.7);
          }
          // evolve — one slot mutates per bar; identity survives, looping doesn't
          if (i16 === motif.length - 1) {
            const k = (Math.random() * motif.length) | 0;
            motif[k] = Math.random() < 0.3 ? -1 : (Math.random() * MOTIF_SCALE.length) | 0;
          }
          motifPos++;
        }
        scheduleMelody();
      }, stepS * 1000);
    }

    // ---- TRICKLE: bright water-droplet grains in the 2–5kHz PRESENCE band.
    // Three selectable characters (trickleMode). All sit high enough to read
    // on laptop speakers, are mostly DRY so reverb can't swallow them, and are
    // pitched to the lattice so they stay musical.
    //   0 Droplets    — triangle+bandpass, bright & percussive (default)
    //   1 Glass chimes — pure sines, longer ring, shimmering & sweet
    //   2 Dust         — sparse soft sines, deliberately quiet & airy
    function trickle(intensity, pan) {
      if (!ctx || transient >= MAX_VOICES - 2) return;
      const t = now(ctx);
      // per-mode grain count, level, length, timbre
      const M = trickleMode;
      let grains = 2 + (Math.random() < intensity ? 1 : 0) + (Math.random() < intensity * 0.6 ? 1 : 0);
      if (M === 2) grains = 1 + (Math.random() < intensity * 0.5 ? 1 : 0);   // Dust = sparse
      for (let k = 0; k < grains; k++) {
        const addr = MELODY[(Math.random() * MELODY.length) | 0];
        const oct = [4, 5, 6][(Math.random() * 3) | 0];
        let f = F0 * RATIOS[addr] * oct;
        while (f > 5200) f /= 2;
        const p = ctx.createStereoPanner();
        p.pan.value = clamp((pan || 0) + (Math.random() * 0.8 - 0.4), -1, 1);
        const g = ctx.createGain(); g.gain.value = 0.0001;
        const dry = ctx.createGain(); const wet = ctx.createGain();
        const o = ctx.createOscillator();
        let amp, len, atk, chain = [o, g, p, dry, wet];
        if (M === 0) {                  // Droplets — bright, percussive
          o.type = "triangle"; o.frequency.value = f;
          const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 6;
          o.connect(bp); bp.connect(g); chain.push(bp);
          dry.gain.value = 1.0; wet.gain.value = 0.3;
          amp = 0.10 + intensity * 0.13; len = 0.16; atk = 0.006;
        } else if (M === 1) {           // Glass chimes — sweet, ringing
          o.type = "sine"; o.frequency.value = f;
          const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.005;
          const g2 = ctx.createGain(); g2.gain.value = 0.35;
          o2.connect(g2); g2.connect(g); o.connect(g); chain.push(o2, g2);
          dry.gain.value = 0.8; wet.gain.value = 0.55;
          amp = 0.085 + intensity * 0.1; len = 0.5; atk = 0.004;
          o2.start(t + k * 0.05); o2.stop(t + k * 0.05 + len + 0.1);
        } else {                        // Dust — quiet, airy, sparse
          o.type = "sine"; o.frequency.value = f;
          o.connect(g);
          dry.gain.value = 0.7; wet.gain.value = 0.5;
          amp = 0.035 + intensity * 0.04; len = 0.26; atk = 0.012;   // notably softer
        }
        g.connect(p); p.connect(dry); p.connect(wet); dry.connect(master); wet.connect(wetIn);
        const st = t + k * 0.05;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(amp, st + atk);
        g.gain.exponentialRampToValueAtTime(0.0004, st + len);
        transient++;
        o.start(st); o.stop(st + len + 0.08);
        o.onended = function () { chain.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); transient--; };
      }
    }

    // ---- REWARD: the field briefly aligns around the visitor (rare payoff).
    // An ascending just-intonation arpeggio of struck bodies, Fibonacci-timed,
    // blooming into the shared room as the carrier swells then settles.
    function reward() {
      if (!started) return;
      const t = now(ctx);
      const seq = ["0x04", "0x07", "0x0B", "0x0C"];          // 3/2 · 2/1 · 3/1 · 10/3 — open + bright
      const steps = [0, 130, 210, 340];                      // ~Fibonacci spacing (ms)
      seq.forEach((a, i) => setTimeout(() => bell(F0 * RATIOS[a], 0.14, 2.6, (i - 1.5) * 0.4, 0.75), steps[i]));
      carrierBus.gain.cancelScheduledValues(t);
      carrierBus.gain.setValueAtTime(carrierBus.gain.value, t);
      carrierBus.gain.linearRampToValueAtTime(1.22, t + 0.3);
      carrierBus.gain.setTargetAtTime(1, t + 0.7, 0.9);
    }

    // ---- mechanical lock click (synth, or injected sample) --------------
    function clickVoice(ratio, pan) {
      if (transient >= MAX_VOICES) return;
      const t = now(ctx);
      const out = ctx.createStereoPanner(); out.pan.value = pan || 0;
      const dry = ctx.createGain(); dry.gain.value = 0.9;
      const wet = ctx.createGain(); wet.gain.value = 0.5;
      out.connect(dry); out.connect(wet); dry.connect(master); wet.connect(wetIn);

      transient++;
      let ended = 0, parts = [];
      const done = () => { if (++ended >= parts.length) { try { out.disconnect(); } catch (e) {} transient--; } };

      if (samples.lock) {
        // USER-RECORDED keyboard/relay sample wins if present
        const s = ctx.createBufferSource(); s.buffer = samples.lock;
        s.playbackRate.value = 0.92 + ratio * 0.05;
        const g = ctx.createGain(); g.gain.value = 0.9;
        s.connect(g); g.connect(out); s.start(t); s.stop(t + samples.lock.duration + 0.05);
        parts.push(s); s.onended = done;
      } else {
        // synth relay: a click transient + a short pitched body.
        // ±5% per-strike variation — "if you hit a brick twice with the same
        // speed on the same spot, the sound will never be exactly the same."
        const vary = 0.95 + Math.random() * 0.10;
        const nb = ctx.createBufferSource(); nb.buffer = noiseBuf;
        nb.playbackRate.value = 1.6 * vary;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600 * (0.92 + Math.random() * 0.16); bp.Q.value = 0.9;
        const ng = ctx.createGain(); ng.gain.value = 0;
        nb.connect(hp); hp.connect(bp); bp.connect(ng); ng.connect(out);
        ng.gain.setValueAtTime(0.0001, t);
        ng.gain.exponentialRampToValueAtTime(0.30, t + 0.006);   // softer attack, lower peak
        ng.gain.exponentialRampToValueAtTime(0.0006, t + 0.07);
        nb.start(t); nb.stop(t + 0.1); parts.push(nb); nb.onended = done;

        const body = ctx.createOscillator(); body.type = "sine";
        body.frequency.setValueAtTime(F0 * ratio * 2 * (0.985 + Math.random() * 0.03), t);
        body.frequency.exponentialRampToValueAtTime(F0 * ratio, t + 0.09);
        const bg = ctx.createGain(); bg.gain.value = 0.0001;
        body.connect(bg); bg.connect(out);
        bg.gain.exponentialRampToValueAtTime(0.28 * loudnessGain(F0 * ratio), t + 0.012);
        bg.gain.exponentialRampToValueAtTime(0.0004, t + 0.16);
        body.start(t); body.stop(t + 0.2); parts.push(body); body.onended = done;
      }
      duck(0.34, t);
    }

    // ---- a soft "passed a station" blip (scroll sweep) ------------------
    function blip(ratio, pan) {
      if (transient >= MAX_VOICES) return;
      const t = now(ctx);
      const f = F0 * ratio;
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 4;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      const p = ctx.createStereoPanner(); p.pan.value = pan || 0;
      o.connect(bp); bp.connect(g); g.connect(p);
      p.connect(master); p.connect(wetIn);
      g.gain.exponentialRampToValueAtTime(0.07 * loudnessGain(f), t + 0.025);  // softer, no ping
      g.gain.exponentialRampToValueAtTime(0.0004, t + 0.4);
      transient++;
      o.start(t); o.stop(t + 0.46);
      o.onended = () => { try { p.disconnect(); } catch (e) {} transient--; };
      duck(0.14, t);
    }

    // ---- hover voice: sideband that BEATS, then RESOLVES on lock --------
    function panFor(addr) {
      const i = ADDRS.indexOf(addr);
      return Math.sin((i / ADDRS.length) * Math.PI * 2) * 0.6;
    }

    // A node is a clean, warm tone tuned to its just-intonation partial of the
    // carrier. Two sines a few Hz apart BEAT gently (alive shimmer); locking
    // RESOLVES the beat to zero ("tuned in") + a soft cyan confirm. Consonant,
    // pleasant, never eerie.
    function startHover(addr) {
      if (!ctx || hoverVoices.has(addr)) return;
      const ratio = RATIOS[addr]; if (!ratio) return;
      const t = now(ctx);
      const f = F0 * ratio, beat = 2.6, lg = loudnessGain(f);
      const oA = ctx.createOscillator(); oA.type = "sine"; oA.frequency.value = f;
      const oB = ctx.createOscillator(); oB.type = "sine"; oB.frequency.value = f + beat; // gentle beat
      const oct = ctx.createOscillator(); oct.type = "sine"; oct.frequency.value = f * 2; // soft consonant shimmer
      const g = ctx.createGain(); g.gain.value = 0.0001;
      const gOct = ctx.createGain(); gOct.gain.value = 0.0001;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = f * 3; lp.Q.value = 0.5;
      const p = ctx.createStereoPanner(); p.pan.value = panFor(addr);
      oA.connect(g); oB.connect(g); oct.connect(gOct); g.connect(lp); gOct.connect(lp); lp.connect(p);
      p.connect(master); p.connect(wetIn);
      g.gain.exponentialRampToValueAtTime(0.17 * lg, t + 0.6);     // loudness-aligned, soft attack
      gOct.gain.exponentialRampToValueAtTime(0.03 * lg, t + 0.7);  // quiet octave halo
      oA.start(t); oB.start(t); oct.start(t);
      duck(0.26, t);
      hoverVoices.set(addr, { oA, oB, oct, g, gOct, lp, p, ratio, lg, locked: false });
    }

    function lockHover(addr) {
      const v = hoverVoices.get(addr);
      const t = ctx ? now(ctx) : 0;
      if (v && ctx) {
        v.locked = true;
        const f = F0 * v.ratio;
        v.oB.frequency.cancelScheduledValues(t);
        v.oB.frequency.setValueAtTime(v.oB.frequency.value, t);
        v.oB.frequency.setTargetAtTime(f, t, 0.1);             // beat → 0 ("tuned in")
        v.g.gain.setTargetAtTime(0.21 * v.lg, t, 0.06);        // settle, loudness-aligned
        v.lp.frequency.setTargetAtTime(f * 4, t, 0.12);
      }
      clickVoice(v ? v.ratio : 1, v ? v.p.pan.value : 0);     // mechanical confirm
      if (v) { const af = F0 * v.ratio * 2; bell(af, 0.07 * loudnessGain(af), 0.6, v.p.pan.value, 0.5); }
    }

    function stopHover(addr) {
      const v = hoverVoices.get(addr); if (!v || !ctx) return;
      const t = now(ctx);
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setValueAtTime(v.g.gain.value, t);
      v.g.gain.exponentialRampToValueAtTime(0.0004, t + 0.55);
      v.gOct.gain.setTargetAtTime(0.0004, t, 0.18);
      v.oA.stop(t + 0.7); v.oB.stop(t + 0.7); v.oct.stop(t + 0.7);
      v.oB.onended = function () { [v.oA, v.oB, v.oct, v.g, v.gOct, v.lp, v.p].forEach(function (n) { try { n.disconnect(); } catch (e) {} }); };
      hoverVoices.delete(addr);
    }

    // ---- per-frame param update (NO allocation) -------------------------
    let _wdLast = 0;   // output-level watchdog timestamp
    function frame() {
      if (!ctx) return;
      const t = now(ctx);
      // WATCHDOG — if anything ever runs away (feedback, stuck voice), the
      // analyser sees it first: hard-duck the master and let it recover.
      if (state.level > 0.55 && t - _wdLast > 1.0) {
        _wdLast = t;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.exponentialRampToValueAtTime(Math.max(0.0001, masterTarget * 0.2), t + 0.06);
        master.gain.setTargetAtTime(masterTarget, t + 0.4, 0.8);
      }
      // smooth cursor
      cur.sx += (cur.x - cur.sx) * 0.12;
      cur.sy += (cur.y - cur.sy) * 0.12;
      const speed = Math.min(1, Math.hypot(cur.vx, cur.vy) * 40);
      cur.sv += (speed - cur.sv) * 0.1;
      cur.vx *= 0.86; cur.vy *= 0.86;

      // probe: pitch glides through lattice w/ cursor Y, gain follows speed
      const pf = F0 * (1.5 + (1 - cur.sy) * 2.2);
      probeOsc.frequency.setTargetAtTime(pf, t, 0.08);
      probeBP.frequency.setTargetAtTime(900 + cur.sx * 2600, t, 0.08);
      probePan.pan.setTargetAtTime((cur.sx - 0.5) * 1.4, t, 0.1);
      probeGain.gain.setTargetAtTime(cur.sv * 0.05 * cursorAmount, t, 0.06);

      // proximity gravity: glide the single prox voice to the nearest node
      proxOsc.frequency.setTargetAtTime(proxTargetF, t, 0.12);
      proxOsc2.frequency.setTargetAtTime(proxTargetF * 2, t, 0.12);
      proxLP.frequency.setTargetAtTime(700 + proxTargetG * 2600, t, 0.12);
      proxPan.pan.setTargetAtTime(proxTargetPan, t, 0.12);
      proxGain.gain.setTargetAtTime(proxTargetG * 0.08 * cursorAmount, t, 0.1);
      proxTargetG *= 0.92;   // decays unless refreshed each move

      // the field changes with where you are: pad brightness tracks cursor Y
      // (up = brighter) blended with temperature.
      if (padFilter) {
        const bright = 420 + (1 - cur.sy) * 880 + temperature * 360;
        padFilter.frequency.setTargetAtTime(bright, t, 0.25);
      }

      // readouts
      let beatSum = 0;
      hoverVoices.forEach((v) => { if (!v.locked) beatSum += 1; });
      state.beat = beatSum;
      state.active = Array.from(hoverVoices.keys());
      state.dial = dial;
      if (analyser) {
        const n = analyser.fftSize, b = frame._buf || (frame._buf = new Uint8Array(n));
        analyser.getByteTimeDomainData(b);
        let sum = 0; for (let i = 0; i < n; i += 8) { const d = (b[i] - 128) / 128; sum += d * d; }
        state.level = Math.sqrt(sum / (n / 8));
      }
    }

    // ============================ PUBLIC API ============================
    return {
      RATIOS, ADDRS, F0,
      state,

      wake() {
        if (started) {
          if (ctx && ctx.state === "suspended") ctx.resume();
          return;
        }
        started = true;
        build();
        if (ctx.state === "suspended") ctx.resume();
        const t = now(ctx);
        // ENTER THE FIELD — a ritual, not a toggle:
        //  (1) a soft mechanical contact — a single quiet keycap tick;
        //  (2) the carrier breathes in over ~1.3s (no boom, no jingle);
        //  (3) a distant cyan harmonic starts 1.8% sharp and ALIGNS to true
        //      over ~2s — the field tunes itself to you (detune → zero-beat).
        // NOTE: no ksStrike here — its feedback string can run away (loop
        // gain > 1 near the damp filter's resonant bump) and howl. Retired.
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(0.0001, t);
        master.gain.exponentialRampToValueAtTime(masterTarget, t + 1.3);
        try {
          const tk = ctx.createBufferSource(); tk.buffer = noiseBuf; tk.playbackRate.value = 1.4;
          const tb = ctx.createBiquadFilter(); tb.type = "bandpass"; tb.frequency.value = 1900; tb.Q.value = 1.2;
          const tg = ctx.createGain(); tg.gain.value = 0.0001;
          tk.connect(tb); tb.connect(tg); tg.connect(master); tg.connect(wetIn);
          tg.gain.setValueAtTime(0.0001, t + 0.08);
          tg.gain.exponentialRampToValueAtTime(0.16, t + 0.092);
          tg.gain.exponentialRampToValueAtTime(0.0004, t + 0.17);
          tk.start(t + 0.08); tk.stop(t + 0.2);
          tk.onended = function () { [tk, tb, tg].forEach(function (n) { try { n.disconnect(); } catch (e) {} }); };
        } catch (e) {}
        try {
          const c1 = ctx.createOscillator(), cg = ctx.createGain(), cp = ctx.createStereoPanner();
          c1.type = "sine";
          c1.frequency.setValueAtTime(F0 * 4 * 1.018, t);
          c1.frequency.exponentialRampToValueAtTime(F0 * 4, t + 2.4);
          cp.pan.value = 0.25; cg.gain.value = 0.0001;
          c1.connect(cg); cg.connect(cp); cp.connect(wetIn); cp.connect(master);
          cg.gain.setValueAtTime(0.0001, t + 0.55);
          cg.gain.exponentialRampToValueAtTime(0.05, t + 1.5);
          cg.gain.exponentialRampToValueAtTime(0.0004, t + 3.4);
          c1.start(t + 0.55); c1.stop(t + 3.5);
          c1.onended = function () { [c1, cg, cp].forEach(function (n) { try { n.disconnect(); } catch (e) {} }); };
        } catch (e) {}
        state.woken = true;
        const loop = () => { frame(); this._raf = requestAnimationFrame(loop); };
        loop();
        scheduleMelody();                                     // melodic + rhythmic field comes alive
        scheduleChord();                                      // harmony slowly evolves
      },

      getAnalyser() { return analyser; },
      isWoken() { return state.woken; },

      // suspend / resume the whole audio context — the honest on/off. When
      // suspended the browser produces NO sound at all (zero leak) and the
      // generative schedulers skip (guarded on ctx.state) so nothing piles up.
      suspend() { if (ctx && ctx.state === "running") return ctx.suspend(); },
      resume() { if (ctx && ctx.state === "suspended") return ctx.resume(); },

      setMaster(v) {
        masterTarget = clamp(v, 0, 1);
        if (ctx && started) master.gain.setTargetAtTime(Math.max(0.0001, masterTarget), now(ctx), 0.05);
      },
      getMaster() { return masterTarget; },

      setTemperature(v) { temperature = clamp(v, 0, 1); applyTemperature(); },
      setCursorAmount(v) { cursorAmount = clamp(v, 0, 1); },
      setIdleLife(v) { idleLife = clamp(v, 0, 1); },
      setTrickleMode(m) { trickleMode = m | 0; },
      trickleTest(mode) { if (mode != null) trickleMode = mode | 0; trickle(0.8, (Math.random() * 2 - 1) * 0.5); },
      reward() { reward(); },

      hoverNode(addr) { if (started) startHover(addr); },
      unhoverNode(addr) { stopHover(addr); },
      lockNode(addr) { if (started) lockHover(addr); },

      // proximity gravity — lab calls this with the nearest node + closeness 0..1
      proximity(addr, closeness) {
        if (!started || !RATIOS[addr]) return;
        proxTargetF = F0 * RATIOS[addr];
        proxTargetG = clamp(closeness, 0, 1);
        proxTargetPan = panFor(addr);
      },

      // soft pulse of a single node — used by ripple wavefront + keyboard play
      pingNode(addr, amp) {
        if (!started || !RATIOS[addr]) return;
        const f = F0 * RATIOS[addr];
        bell(f, (amp == null ? 0.1 : amp) * loudnessGain(f), 1.6, panFor(addr), 0.6);
      },
      // strike a node like a keypress: tone blooms briefly + mechanical confirm
      strikeNode(addr) {
        if (!started || !RATIOS[addr]) return;
        const f = F0 * RATIOS[addr];
        clickVoice(RATIOS[addr], panFor(addr));
        bell(f, 0.13 * loudnessGain(f), 1.8, panFor(addr), 0.55);
        bell(f * 2, 0.05 * loudnessGain(f * 2), 0.7, panFor(addr), 0.5);
      },

      // ---- shell-facing helpers (used by the MOSound adapter) -----------
      // mechanical keycap press (the click body). Uses the lock-click path so
      // a user-recorded keyboard sample (injectSample 'lock') plays if present.
      thock(vel) { if (started) clickVoice(1, (Math.random() * 2 - 1) * 0.15); },
      // keycap release — short, soft, higher: a quiet top-out tick
      thockUp() {
        if (!started || transient >= MAX_VOICES) return;
        const t = now(ctx);
        const nb = ctx.createBufferSource(); nb.buffer = noiseBuf; nb.playbackRate.value = 1.9;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2200;
        const g = ctx.createGain(); g.gain.value = 0.0001;
        const p = ctx.createStereoPanner(); p.pan.value = (Math.random() * 2 - 1) * 0.15;
        nb.connect(hp); hp.connect(g); g.connect(p); p.connect(master);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0004, t + 0.03);
        transient++; nb.start(t); nb.stop(t + 0.05);
        nb.onended = () => { try { p.disconnect(); } catch (e) {} transient--; };
      },
      // soft UI tick — a single bell, mid register
      tick() { if (started) { const f = F0 * RATIOS["0x04"]; bell(f, 0.07 * loudnessGain(f), 0.5, 0, 0.4); } },
      // a 0x00 CARRIER accent — the root makes itself heard (card click, etc.)
      carrierAccent(strength) {
        if (!started) return;
        const s = strength == null ? 1 : strength;
        const t = now(ctx);
        // low root bell + soft octave, and a brief swell of the carrier bus
        bell(F0, 0.18 * s, 2.6, 0, 0.7);
        bell(F0 * 2, 0.07 * s, 2.0, 0, 0.6);
        bell(SUB, 0.12 * s, 2.8, 0, 0.5);
        carrierBus.gain.cancelScheduledValues(t);
        carrierBus.gain.setValueAtTime(carrierBus.gain.value, t);
        carrierBus.gain.linearRampToValueAtTime(1.18, t + 0.25);
        carrierBus.gain.setTargetAtTime(1, t + 0.6, 0.8);
      },
      // scroll-only trickle (no dial/blip) — for site-wide page scrolling
      scrollTrickle(delta) {
        if (!started) return;
        const intensity = clamp(Math.abs(delta) / 110, 0.08, 1);
        const ms = performance.now();
        if (ms - lastTrickle > 55) { trickle(intensity, (cur.sx - 0.5) * 1.0); lastTrickle = ms; }
      },

      // normalized cursor in [0..1]; vx/vy are per-event deltas
      cursorMove(x, y, vx, vy) {
        cur.x = clamp(x, 0, 1); cur.y = clamp(y, 0, 1);
        cur.vx = vx || 0; cur.vy = vy || 0;
      },

      // scroll sweeps the tuning dial; passing a station marks softly, and a
      // granular trickle shimmers under the motion (satisfying, not friction).
      scrollBy(delta) {
        if (!started) return;
        dial += delta * 0.0016;
        const intensity = clamp(Math.abs(delta) / 110, 0.1, 1);
        const ms = performance.now();
        if (ms - lastTrickle > 45) { trickle(intensity, (cur.sx - 0.5) * 1.2); lastTrickle = ms; }
        const station = Math.round(dial);
        if (station !== lastStation) {
          const idx = ((station % ADDRS.length) + ADDRS.length) % ADDRS.length;
          blip(RATIOS[ADDRS[idx]], panFor(ADDRS[idx]));
          lastStation = station;
        }
      },

      // inject a recorded sample, e.g. injectSample('lock', audioBuffer)
      async injectSampleFromBlob(name, blob) {
        if (!ctx) build();
        const ab = await blob.arrayBuffer();
        const buf = await ctx.decodeAudioData(ab);
        samples[name] = buf;
        return buf.duration;
      },
      injectSample(name, buffer) { samples[name] = buffer; },
      hasSample(name) { return !!samples[name]; },
      clearSample(name) { delete samples[name]; },

      ctx() { return ctx; },
    };
  }

  window.CarrierField = CarrierField();
})();
