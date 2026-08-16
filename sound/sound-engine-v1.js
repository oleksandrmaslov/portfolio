/* ============================================================
   M.O. SYSTEM — Sound Engine v0.1
   ------------------------------------------------------------
   A device that makes its own sound. Everything here is
   SYNTHESIZED live (oscillators + noise + filters) — there are
   no audio files. Every voice routes through a master bus with
   bus-glue compression and a brickwall limiter, so stacked
   sounds never clip or get harsh ("intelligent mastering").

   Public API (window.MOSound):
     init()                  — build the graph (lazy; safe to call often)
     unlock()                — resume the AudioContext (call on 1st gesture)
     setMuted(bool) / toggleMute()
     setVolume(0..1)
     isMuted() / getVolume()
     onState(cb)             — subscribe to {muted, volume} changes

     thock({vel})            — keycap press (signature sound)
     tick()                  — UI hover / focus blip
     confirm() / back()      — rising / falling UI cues
     transition()            — section-change whoosh
     bootBeep(i)             — terminal POST blip (pitch climbs with i)
     scroll(velocity)        — feed scroll speed (px/frame) for texture
     ambient(bool)           — generative drone on/off

     getLevel()              — 0..1 master output level (for meters)
     getWave(arr)            — fill Float32Array with current waveform
   ============================================================ */
(function () {
  "use strict";

  var AC = window.AudioContext || window.webkitAudioContext;
  var LS_VOL = "mo_snd_vol";
  var LS_MUTE = "mo_snd_mute";

  var ctx = null;
  var master = null;       // user volume
  var busGlue = null;      // gentle bus compression
  var limiter = null;      // brickwall safety
  var hpf = null;          // remove subsonic rumble
  var shelf = null;        // gentle air
  var analyser = null;
  var reverbReturn = null;
  var convolver = null;
  var waveBuf = null;
  var noiseBuf = null;

  var built = false;
  var muted = readBool(LS_MUTE, false);
  var volume = readFloat(LS_VOL, 0.7);
  var listeners = [];

  // density tracking — recent voice timestamps, used to duck when busy
  var recent = [];

  // ambient drone handles
  var drone = null;

  // scroll texture state
  var scrollNode = null;

  function readBool(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v === "1"; } catch (e) { return d; } }
  function readFloat(k, d) { try { var v = parseFloat(localStorage.getItem(k)); return isNaN(v) ? d : v; } catch (e) { return d; } }
  function save() { try { localStorage.setItem(LS_VOL, String(volume)); localStorage.setItem(LS_MUTE, muted ? "1" : "0"); } catch (e) {} }

  function emit() { var s = { muted: muted, volume: volume }; for (var i = 0; i < listeners.length; i++) try { listeners[i](s); } catch (e) {} }

  // ---- graph -------------------------------------------------
  function init() {
    if (built) return ctx;
    if (!AC) return null;
    ctx = new AC();

    // noise source buffer (reused for all noise voices)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // ---- master chain ----
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;

    // subsonic cleanup
    hpf = ctx.createBiquadFilter();
    hpf.type = "highpass"; hpf.frequency.value = 32; hpf.Q.value = 0.5;

    // a touch of air on top
    shelf = ctx.createBiquadFilter();
    shelf.type = "highshelf"; shelf.frequency.value = 6500; shelf.gain.value = 2.5;

    // bus glue — gentle, slow
    busGlue = ctx.createDynamicsCompressor();
    busGlue.threshold.value = -20; busGlue.ratio.value = 2.5;
    busGlue.attack.value = 0.012; busGlue.release.value = 0.22; busGlue.knee.value = 8;

    // brickwall limiter — the safety net so stacked voices never clip
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5; limiter.ratio.value = 20;
    limiter.attack.value = 0.002; limiter.release.value = 0.06; limiter.knee.value = 0;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.6;
    waveBuf = new Float32Array(analyser.fftSize);

    // generated reverb (short room) on a parallel send
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(1.4, 2.6);
    reverbReturn = ctx.createGain(); reverbReturn.gain.value = 0.18;

    // wiring: [voices] -> hpf -> shelf -> busGlue -> limiter -> master -> analyser -> out
    hpf.connect(shelf); shelf.connect(busGlue); busGlue.connect(limiter);
    convolver.connect(reverbReturn); reverbReturn.connect(busGlue);
    limiter.connect(master); master.connect(analyser); analyser.connect(ctx.destination);

    built = true;
    return ctx;
  }

  function makeImpulse(seconds, decay) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function unlock() { init(); if (ctx && ctx.state === "suspended") ctx.resume(); }

  // entry point for every voice — returns a gain node feeding the master
  // chain, with reverb send, plus density ducking so rapid bursts stay calm.
  function voiceIn(sendReverb) {
    var g = ctx.createGain();
    g.connect(hpf);
    if (sendReverb) { var s = ctx.createGain(); s.gain.value = sendReverb; g.connect(s); s.connect(convolver); }
    return g;
  }

  // density-adaptive gain — count voices in the last 180ms; the more there
  // are, the quieter each new one, so machine-gun events never pile up harsh.
  function densityGain() {
    var now = ctx.currentTime;
    recent.push(now);
    while (recent.length && now - recent[0] > 0.18) recent.shift();
    var n = recent.length;
    return n <= 2 ? 1 : Math.max(0.45, 1 - (n - 2) * 0.12);
  }

  function noiseSource() { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(ctx.currentTime + (Math.random() * 0.4)); return s; }

  // ---- voices ------------------------------------------------

  // Keycap "thock": a fast click transient (bandpassed noise) + a hollow
  // body resonance (pitch-dropping sine). Pitch jitters per press so a
  // run of keys feels organic, never robotic.
  function thock(opts) {
    if (!ready()) return;
    var vel = (opts && opts.vel != null) ? opts.vel : 0.8;          // 0..1
    var t = ctx.currentTime;
    var dg = densityGain();
    var jitter = 1 + (Math.random() * 0.14 - 0.07);

    // --- click transient ---
    var n = noiseSource();
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = (1800 + vel * 1400) * jitter; bp.Q.value = 0.8;
    var ng = voiceIn(0.05);
    var nGain = ng.gain;
    n.connect(bp); bp.connect(ng);
    var clickLvl = 0.16 * vel * dg;
    nGain.setValueAtTime(0.0001, t);
    nGain.exponentialRampToValueAtTime(clickLvl, t + 0.001);
    nGain.exponentialRampToValueAtTime(0.0001, t + 0.014);
    n.stop(t + 0.05);

    // --- hollow body resonance (the "thock") ---
    var o = ctx.createOscillator();
    o.type = "sine";
    var f0 = (172 + (Math.random() * 26 - 13)) * jitter;
    o.frequency.setValueAtTime(f0 * 1.8, t);
    o.frequency.exponentialRampToValueAtTime(f0, t + 0.05);
    var bodyLP = ctx.createBiquadFilter(); bodyLP.type = "lowpass"; bodyLP.frequency.value = 1200;
    var og = voiceIn(0.12);
    o.connect(bodyLP); bodyLP.connect(og);
    var bodyLvl = 0.5 * (0.6 + vel * 0.4) * dg;
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(bodyLvl, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.start(t); o.stop(t + 0.18);
  }

  // tiny high blip for hover / focus
  function tick() {
    if (!ready()) return;
    var t = ctx.currentTime, dg = densityGain();
    var o = ctx.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(2300 + Math.random() * 200, t);
    var g = voiceIn(0.04);
    o.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06 * dg, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.start(t); o.stop(t + 0.06);
  }

  // two-tone cue. dir +1 rising (confirm), -1 falling (back)
  function dyad(dir) {
    if (!ready()) return;
    var t = ctx.currentTime;
    var base = 540;
    var notes = dir > 0 ? [base, base * 1.5] : [base, base * 0.72];
    notes.forEach(function (f, i) {
      var st = t + i * 0.06;
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      var g = voiceIn(0.16);
      o.connect(g);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.16, st + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.14);
      o.start(st); o.stop(st + 0.16);
    });
  }
  function confirm() { dyad(1); }
  function back() { dyad(-1); }

  // section-change whoosh — bandpassed noise sweep, soft
  function transition() {
    if (!ready()) return;
    var t = ctx.currentTime;
    var n = noiseSource();
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(280, t);
    bp.frequency.exponentialRampToValueAtTime(1700, t + 0.28);
    bp.frequency.exponentialRampToValueAtTime(420, t + 0.62);
    var g = voiceIn(0.4);
    n.connect(bp); bp.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.66);
    n.stop(t + 0.7);
  }

  // terminal POST blip — pitch climbs with the line index
  function bootBeep(i) {
    if (!ready()) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(); o.type = "square";
    o.frequency.value = 520 + (i || 0) * 42;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    var g = voiceIn(0.05);
    o.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
    o.start(t); o.stop(t + 0.04);
  }

  // ---- scroll texture ---------------------------------------
  // A continuously-running, near-silent filtered-noise bed whose level and
  // brightness track scroll velocity. Feed it velocity each frame.
  function ensureScroll() {
    if (scrollNode) return;
    var n = noiseSource();
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.6;
    var g = voiceIn(0.25); g.gain.value = 0.0001;
    n.connect(bp); bp.connect(g);
    scrollNode = { gain: g.gain, freq: bp.frequency };
  }
  function scroll(velocity) {
    if (!ready()) return;
    ensureScroll();
    var v = Math.min(1, Math.abs(velocity) / 60);
    var t = ctx.currentTime;
    scrollNode.gain.setTargetAtTime(0.05 * v, t, 0.05);
    scrollNode.freq.setTargetAtTime(500 + v * 1800, t, 0.05);
  }

  // ---- generative ambient drone -----------------------------
  // Detuned low oscillators through a slowly-wandering lowpass, plus sparse
  // random "data" ticks. Evolves continuously — never the same twice.
  function ambient(on) {
    if (!ready()) return;
    if (on && !drone) {
      var t = ctx.currentTime;
      var g = voiceIn(0.5); g.gain.value = 0.0001;
      g.gain.linearRampToValueAtTime(0.06, t + 2.5);
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = 4;
      lp.connect(g);
      var freqs = [55, 55 * 1.5, 110, 220.5];     // root, fifth, octave, slightly-detuned 2-oct
      var oscs = freqs.map(function (f) {
        var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
        var og = ctx.createGain(); og.gain.value = 0.18;
        o.connect(og); og.connect(lp); o.start(); return o;
      });
      // wandering filter (slow LFO)
      var lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.05;
      var lfoG = ctx.createGain(); lfoG.gain.value = 260;
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      // sparse random data ticks
      var tickTimer = setInterval(function () {
        if (Math.random() < 0.5) tick();
      }, 1400);
      drone = { g: g.gain, oscs: oscs, lfo: lfo, lfoG: lfoG, lp: lp, tickTimer: tickTimer };
    } else if (!on && drone) {
      var tt = ctx.currentTime;
      drone.g.cancelScheduledValues(tt);
      drone.g.setValueAtTime(drone.g.value, tt);
      drone.g.linearRampToValueAtTime(0.0001, tt + 1.6);
      clearInterval(drone.tickTimer);
      var d = drone; drone = null;
      setTimeout(function () { try { d.oscs.forEach(function (o) { o.stop(); }); d.lfo.stop(); } catch (e) {} }, 1800);
    }
  }
  function ambientOn() { return !!drone; }

  // ---- master controls --------------------------------------
  function applyGain() { if (master) { var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(muted ? 0 : volume, t, 0.04); } }
  function setMuted(b) { muted = !!b; applyGain(); save(); emit(); }
  function toggleMute() { setMuted(!muted); }
  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (volume > 0 && muted) muted = false; applyGain(); save(); emit(); }
  function isMuted() { return muted; }
  function getVolume() { return volume; }
  function onState(cb) { listeners.push(cb); cb({ muted: muted, volume: volume }); }

  function ready() { return built && ctx && ctx.state === "running" && !muted; }

  // ---- meters ------------------------------------------------
  function getWave(arr) { if (!analyser) return; analyser.getFloatTimeDomainData(arr || waveBuf); return arr || waveBuf; }
  function getLevel() {
    if (!analyser) return 0;
    analyser.getFloatTimeDomainData(waveBuf);
    var sum = 0; for (var i = 0; i < waveBuf.length; i++) sum += waveBuf[i] * waveBuf[i];
    return Math.min(1, Math.sqrt(sum / waveBuf.length) * 3.2);
  }

  window.MOSound = {
    init: init, unlock: unlock,
    setMuted: setMuted, toggleMute: toggleMute, setVolume: setVolume,
    isMuted: isMuted, getVolume: getVolume, onState: onState,
    thock: thock, tick: tick, confirm: confirm, back: back,
    transition: transition, bootBeep: bootBeep, scroll: scroll,
    ambient: ambient, ambientOn: ambientOn,
    getLevel: getLevel, getWave: getWave,
    get ctx() { return ctx; }
  };
})();
