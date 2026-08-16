/* ============================================================
   M.O. SYSTEM — Sound Engine v0.2 · "Tuned Constellation"
   ------------------------------------------------------------
   The metaphor, made audible:

     • 0x00 is the ROOT. A fundamental frequency = the self.
       It is "everywhere": a near-silent sub + a stereo-spread
       beacon pulse runs under everything while audio is on.

     • Every project node is a JUST-INTONATION HARMONIC of 0x00,
       so any combination of nodes is always consonant — they
       are all overtones of you.

     • Each node is a physical object: MODAL SYNTHESIS (inharmonic
       partials, independent decays) → a struck resonator, not a
       toy beep.

     • Nodes are SCATTERED IN SPACE: every ping is panned to the
       node's screen-x and dulled by depth (far = quiet + dark).

     • Two signature gestures: GATHER (scattered pings converge
       into the 0x00 root chord) and SCATTER (they disperse).

   Everything is synthesized live — no audio files. All voices
   pass a master bus: HPF → air → bus-glue comp → brickwall
   limiter → volume → analyser, so stacked pings never clip.

   API (window.MOSound):
     init() unlock()
     setMuted/toggleMute/setVolume/isMuted/getVolume/onState
     carrier(on) carrierOn()          — the omnipresent 0x00
     nodePing(addr,{x,depth,vel,mult})— ping one node
     nodeLock(addr,{x})               — ping + ACK handshake
     gather() scatter()               — assemble / disperse
     constellation(on) constellationOn()
     scroll(velocity)                 — move through the field
     bootEnumerate(i,total)           — nodes coming online
     thock({vel}) tick()              — physical keycap / hover
     nodeFreq(addr) ROOT              — tuning helpers (for UI)
     getLevel() getWave(arr)
   ============================================================ */
(function () {
  "use strict";
  var AC = window.AudioContext || window.webkitAudioContext;
  var LS_VOL = "mo_snd_vol", LS_MUTE = "mo_snd_mute";

  var ctx, master, busGlue, limiter, hpf, shelf, analyser, convolver, reverbReturn;
  var waveBuf, noiseBuf, built = false;
  var muted = rB(LS_MUTE, false), volume = rF(LS_VOL, 0.7), listeners = [];
  var recent = [];
  var carrierNode = null, constTimer = null, scrollNode = null;

  /* ---- tuning: the metaphor as math --------------------------
     0x00 fundamental, lifted PING_OCT octaves so pings sit in a
     bright register. Project nodes climb a just-intonation
     pentatonic — pure overtones of the root. */
  var F0 = 55;                                   // A1 — the self
  var PING_OCT = 3;
  var RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];  // just pentatonic
  function nodeFreq(addr) {
    if (addr <= 0) return F0 * Math.pow(2, PING_OCT);       // 0x00 = pure root
    var i = (addr - 1) % RATIOS.length;
    var oct = Math.floor((addr - 1) / RATIOS.length);
    return F0 * Math.pow(2, PING_OCT + oct) * RATIOS[i];
  }

  function rB(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v === "1"; } catch (e) { return d; } }
  function rF(k, d) { try { var v = parseFloat(localStorage.getItem(k)); return isNaN(v) ? d : v; } catch (e) { return d; } }
  function save() { try { localStorage.setItem(LS_VOL, String(volume)); localStorage.setItem(LS_MUTE, muted ? "1" : "0"); } catch (e) {} }
  function emit() { var s = { muted: muted, volume: volume }; for (var i = 0; i < listeners.length; i++) try { listeners[i](s); } catch (e) {} }

  function init() {
    if (built) return ctx;
    if (!AC) return null;
    ctx = new AC();

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    master = ctx.createGain(); master.gain.value = muted ? 0 : volume;
    hpf = ctx.createBiquadFilter(); hpf.type = "highpass"; hpf.frequency.value = 28; hpf.Q.value = 0.5;
    shelf = ctx.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 6500; shelf.gain.value = 2;
    busGlue = ctx.createDynamicsCompressor();
    busGlue.threshold.value = -20; busGlue.ratio.value = 2.5; busGlue.attack.value = 0.012; busGlue.release.value = 0.24; busGlue.knee.value = 8;
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.06; limiter.knee.value = 0;
    analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.6;
    waveBuf = new Float32Array(analyser.fftSize);

    convolver = ctx.createConvolver(); convolver.buffer = makeImpulse(2.6, 2.8);
    reverbReturn = ctx.createGain(); reverbReturn.gain.value = 0.22;

    hpf.connect(shelf); shelf.connect(busGlue); busGlue.connect(limiter);
    convolver.connect(reverbReturn); reverbReturn.connect(busGlue);
    limiter.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
    built = true; return ctx;
  }
  function makeImpulse(sec, decay) {
    var len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function unlock() { init(); if (ctx && ctx.state === "suspended") ctx.resume(); }
  function ready() { return built && ctx && ctx.state === "running" && !muted; }

  function voiceIn(send) {
    var g = ctx.createGain(); g.connect(hpf);
    if (send) { var s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(convolver); }
    return g;
  }
  function densityGain() {
    var now = ctx.currentTime; recent.push(now);
    while (recent.length && now - recent[0] > 0.18) recent.shift();
    var n = recent.length; return n <= 2 ? 1 : Math.max(0.4, 1 - (n - 2) * 0.1);
  }
  function noiseSource() { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(ctx.currentTime + Math.random() * 0.3); return s; }
  function panner(x) {
    if (ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, x || 0)); return p; }
    return null;
  }

  /* ---- NODE PING — modal, spatial, in-key ------------------- */
  function nodePing(addr, opts) {
    if (!ready()) return;
    opts = opts || {};
    var t = ctx.currentTime, dg = densityGain();
    var f = nodeFreq(addr) * (opts.mult || 1);
    var vel = opts.vel != null ? opts.vel : 0.8;
    var depth = opts.depth != null ? opts.depth : 0;     // 0 near .. 1 far
    var x = opts.x != null ? opts.x : 0;

    var out = voiceIn(0.32 + depth * 0.35);              // far = wetter
    var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 6200 - depth * 4400;
    var p = panner(x);
    if (p) { tone.connect(p); p.connect(out); } else tone.connect(out);

    // contact transient (the probe touching the node)
    var n = noiseSource(), bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = Math.min(9000, f * 4); bp.Q.value = 1.1;
    var ng = ctx.createGain(); n.connect(bp); bp.connect(ng); ng.connect(tone);
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.04 * vel * dg, t + 0.001);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.018); n.stop(t + 0.05);

    // modal partials — inharmonic, each its own decay (struck resonator)
    var partials = [[1, 1.0, 1.0], [2.01, 0.46, 0.66], [3.0, 0.3, 0.46], [5.43, 0.14, 0.3]];
    var base = 0.32 * (0.5 + vel * 0.5) * dg * (1 - depth * 0.45);
    for (var i = 0; i < partials.length; i++) {
      var pr = partials[i];
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * pr[0];
      var g = ctx.createGain(); o.connect(g); g.connect(tone);
      var dec = 1.0 * pr[2] * (1 - depth * 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(base * pr[1], t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + dec);
      o.start(t); o.stop(t + 0.06 + dec);
    }
  }

  // handshake: ping the node, then an octave-up ACK from the opposite side
  function nodeLock(addr, opts) {
    opts = opts || {};
    nodePing(addr, { vel: 0.9, x: opts.x || 0, depth: 0 });
    var x = opts.x || 0;
    setTimeout(function () { nodePing(addr, { vel: 0.5, x: -x * 0.6, depth: 0.4, mult: 2 }); }, 125);
  }

  /* ---- 0x00 CARRIER — the omnipresent self ------------------ */
  function beacon() {
    if (!ready()) return;
    // 0x00 speaks from everywhere — stereo-spread, very soft
    nodePing(0, { vel: 0.3, x: -0.85, depth: 0.4 });
    nodePing(0, { vel: 0.24, x: 0.85, depth: 0.5, mult: 2 });
  }
  function carrier(on) {
    if (!ready() && on) return;
    if (on && !carrierNode) {
      var t = ctx.currentTime;
      var sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = F0;
      var subg = ctx.createGain(); subg.gain.value = 0.0001; sub.connect(subg); subg.connect(hpf);
      subg.gain.linearRampToValueAtTime(0.05, t + 3); sub.start();
      var bt = setInterval(beacon, 4600); setTimeout(beacon, 700);
      carrierNode = { sub: sub, subg: subg, bt: bt };
    } else if (!on && carrierNode) {
      var tt = ctx.currentTime; carrierNode.subg.gain.cancelScheduledValues(tt);
      carrierNode.subg.gain.setValueAtTime(carrierNode.subg.gain.value, tt);
      carrierNode.subg.gain.linearRampToValueAtTime(0.0001, tt + 1.5);
      clearInterval(carrierNode.bt);
      var c = carrierNode; carrierNode = null;
      setTimeout(function () { try { c.sub.stop(); } catch (e) {} }, 1700);
    }
  }
  function carrierOn() { return !!carrierNode; }

  /* ---- GATHER / SCATTER — the signature gestures ------------ */
  function gather() {
    if (!ready()) return;
    var N = 9;
    for (var i = 0; i < N; i++) (function (i) {
      setTimeout(function () {
        nodePing(1 + Math.floor(Math.random() * 10), { vel: 0.42, x: Math.random() * 2 - 1, depth: 0.15 + Math.random() * 0.35 });
      }, i * 68);
    })(i);
    setTimeout(function () {
      nodePing(0, { vel: 0.95, x: 0 });
      nodePing(0, { vel: 0.55, x: 0, mult: 2 });
      nodePing(0, { vel: 0.3, x: 0, mult: 3 });
    }, N * 68 + 130);
  }
  function scatter() {
    if (!ready()) return;
    var t = ctx.currentTime;
    var n = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(1600, t); bp.frequency.exponentialRampToValueAtTime(280, t + 0.5);
    var g = voiceIn(0.45); n.connect(bp); bp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.055, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); n.stop(t + 0.6);
    for (var i = 0; i < 7; i++) (function (i) {
      setTimeout(function () { nodePing(1 + Math.floor(Math.random() * 10), { vel: 0.34, x: Math.random() * 2 - 1, depth: 0.3 + Math.random() * 0.5 }); }, i * 44);
    })(i);
  }

  /* ---- GENERATIVE CONSTELLATION — the universe idle --------- */
  function constellation(on) {
    if (on && !constTimer) {
      var schedule = function () {
        if (!constTimer) return;
        nodePing(1 + Math.floor(Math.random() * 11), {
          vel: 0.26 + Math.random() * 0.16, x: Math.random() * 2 - 1, depth: 0.35 + Math.random() * 0.6
        });
        constTimer = setTimeout(schedule, 700 + Math.random() * 2300);
      };
      constTimer = setTimeout(schedule, 400);
    } else if (!on && constTimer) { clearTimeout(constTimer); constTimer = null; }
  }
  function constellationOn() { return !!constTimer; }

  /* ---- SCROLL — moving through the field -------------------- */
  function ensureScroll() {
    if (scrollNode) return;
    var n = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.6;
    var g = voiceIn(0.3); g.gain.value = 0.0001; n.connect(bp); bp.connect(g);
    scrollNode = { gain: g.gain, freq: bp.frequency };
  }
  function scroll(velocity) {
    if (!ready()) return; ensureScroll();
    var v = Math.min(1, Math.abs(velocity) / 60), t = ctx.currentTime;
    scrollNode.gain.setTargetAtTime(0.04 * v, t, 0.05);
    scrollNode.freq.setTargetAtTime(500 + v * 1900, t, 0.05);
    if (v > 0.4 && Math.random() < v * 0.35)
      nodePing(1 + Math.floor(Math.random() * 11), { vel: 0.22 * v, x: Math.random() * 2 - 1, depth: 0.4 + Math.random() * 0.4 });
  }

  /* ---- BOOT — nodes coming online -------------------------- */
  function bootEnumerate(i, total) {
    if (!ready()) return;
    if (i >= (total - 1)) { gather(); return; }     // last line: 0x00 assembles
    nodePing(1 + (i % 11), { vel: 0.4, x: (i % 2 ? 1 : -1) * (0.3 + (i / total) * 0.5), depth: 0.3 });
  }

  /* ---- physical keycap (still used by key buttons) --------- */
  function thock(opts) {
    if (!ready()) return;
    var vel = opts && opts.vel != null ? opts.vel : 0.8, t = ctx.currentTime, dg = densityGain();
    var j = 1 + (Math.random() * 0.14 - 0.07);
    var n = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = (1800 + vel * 1400) * j; bp.Q.value = 0.8;
    var ng = voiceIn(0.05); n.connect(bp); bp.connect(ng);
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.16 * vel * dg, t + 0.001); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.014); n.stop(t + 0.05);
    var o = ctx.createOscillator(); o.type = "sine";
    var f0 = (172 + (Math.random() * 26 - 13)) * j; o.frequency.setValueAtTime(f0 * 1.8, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.05);
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1200;
    var og = voiceIn(0.12); o.connect(lp); lp.connect(og);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.5 * (0.6 + vel * 0.4) * dg, t + 0.006); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.start(t); o.stop(t + 0.18);
  }
  function tick() { nodePing(3, { vel: 0.3, depth: 0.2 }); }   // hover = a soft node probe

  /* ---- master controls ------------------------------------- */
  function applyGain() { if (master) { var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(muted ? 0 : volume, t, 0.04); } }
  function setMuted(b) { muted = !!b; applyGain(); save(); emit(); }
  function toggleMute() { setMuted(!muted); }
  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (volume > 0 && muted) muted = false; applyGain(); save(); emit(); }

  function getWave(a) { if (analyser) analyser.getFloatTimeDomainData(a || waveBuf); return a || waveBuf; }
  function getLevel() { if (!analyser) return 0; analyser.getFloatTimeDomainData(waveBuf); var s = 0; for (var i = 0; i < waveBuf.length; i++) s += waveBuf[i] * waveBuf[i]; return Math.min(1, Math.sqrt(s / waveBuf.length) * 3.2); }

  window.MOSound = {
    init: init, unlock: unlock,
    setMuted: setMuted, toggleMute: toggleMute, setVolume: setVolume,
    isMuted: function () { return muted; }, getVolume: function () { return volume; },
    onState: function (cb) { listeners.push(cb); cb({ muted: muted, volume: volume }); },
    carrier: carrier, carrierOn: carrierOn,
    nodePing: nodePing, nodeLock: nodeLock,
    gather: gather, scatter: scatter,
    constellation: constellation, constellationOn: constellationOn,
    scroll: scroll, bootEnumerate: bootEnumerate,
    thock: thock, tick: tick,
    nodeFreq: nodeFreq, ROOT: F0,
    getLevel: getLevel, getWave: getWave,
    get ctx() { return ctx; }
  };
})();
