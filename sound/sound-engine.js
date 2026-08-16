/* ============================================================
   M.O. SYSTEM — Sound Engine v0.3 · "Tuned Constellation"
   ------------------------------------------------------------
   Same metaphor (0x00 = the root; nodes = its harmonics, scattered
   in space), now with:

     • FIVE selectable sound CONCEPTS (voicings) — switch the whole
       sonic identity: setVoicing("constellation" | "mechanical" |
       "signal" | "deepspace" | "organic").
     • A far more natural keycap THOCK — body knock + contact click
       + spring ping, with a separate top-out on release (thockUp).
     • A physical SCROLL SHOVE — velocity drives a warm movement bed
       plus a one-shot low whoomph on each shove, panned by direction.
     • SAMPLE-READY: loadSamples({thock:[urls], thockUp:[urls]}) makes
       recorded keebs round-robin in place of the synth, auto-detuned
       so repeats stay organic. Falls back to synth if none loaded.

   All synthesized live, one master bus (HPF→air→glue→limiter→vol).
   ============================================================ */
(function () {
  "use strict";
  var AC = window.AudioContext || window.webkitAudioContext;
  var LS_VOL = "mo_snd_vol", LS_MUTE = "mo_snd_mute", LS_VOICE = "mo_snd_voice";

  var ctx, master, busGlue, limiter, hpf, shelf, analyser, convolver, reverbReturn;
  var waveBuf, noiseBuf, built = false;
  var muted = rB(LS_MUTE, false), volume = rF(LS_VOL, 0.7), listeners = [];
  var recent = [], carrierNode = null, constTimer = null, scrollNode = null;
  var samples = {}, impulseCache = {}, crushCache = {};
  var scrollState = { lastV: 0, lastShove: 0 };

  /* ---- SOUND CONCEPTS ----------------------------------------
     Each is a full sonic identity. partials: [ratio, amp, decayScale].
     noise: how much filtered noise rides under each ping (switch-y).
     crush: lo-fi bit reduction (0 none .. 1 heavy). */
  var VOICINGS = {
    constellation: {
      label: "Constellation", blurb: "Tuned metal beacons in deep space. Airy, harmonic, cinematic. (current)",
      osc: "sine", partials: [[1, 1, 1], [2.01, 0.46, 0.66], [3.0, 0.3, 0.46], [5.43, 0.14, 0.3]],
      toneBase: 6200, decay: 1.0, noise: 0.0, crush: 0, reverbSend: 0.32, reverbSize: 2.6, root: 55, pingOct: 3
    },
    mechanical: {
      label: "Mechanical", blurb: "Inside the keyboard. Warm, dry, woody — pings sound struck and close-mic'd.",
      osc: "triangle", partials: [[1, 1, 0.42], [2.0, 0.5, 0.26], [3.1, 0.24, 0.18]],
      toneBase: 3200, decay: 0.42, noise: 0.28, crush: 0, reverbSend: 0.12, reverbSize: 1.0, root: 48, pingOct: 3
    },
    signal: {
      label: "Signal", blurb: "Firmware on a bus. Square/FM blips, bitcrushed, retro-digital telemetry.",
      osc: "square", partials: [[1, 1, 0.5], [2.0, 0.4, 0.32], [4.0, 0.2, 0.2]],
      toneBase: 4200, decay: 0.46, noise: 0.05, crush: 0.55, reverbSend: 0.14, reverbSize: 1.0, root: 65, pingOct: 3
    },
    deepspace: {
      label: "Deep Space", blurb: "A vast, quiet observatory. Low, slow, sub-heavy, long tails. Luxurious.",
      osc: "sine", partials: [[1, 1, 1.7], [1.5, 0.4, 1.3], [2.0, 0.3, 1.0]],
      toneBase: 2400, decay: 1.9, noise: 0.0, crush: 0, reverbSend: 0.5, reverbSize: 3.8, root: 41, pingOct: 2
    },
    organic: {
      label: "Organic", blurb: "Wooden, marimba-like, felt. Intimate and warm — less sci-fi.",
      osc: "triangle", partials: [[1, 1, 0.8], [3.0, 0.4, 0.4], [6.0, 0.18, 0.25]],
      toneBase: 3800, decay: 0.7, noise: 0.06, crush: 0, reverbSend: 0.22, reverbSize: 1.8, root: 58, pingOct: 3
    }
  };
  var voicingName = (function () { var v = ""; try { v = localStorage.getItem(LS_VOICE); } catch (e) {} return VOICINGS[v] ? v : "constellation"; })();
  var V = VOICINGS[voicingName];

  /* ---- tuning: the metaphor as math (uses current voicing root) */
  var RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
  function nodeFreq(addr) {
    if (addr <= 0) return V.root * Math.pow(2, V.pingOct);
    var i = (addr - 1) % RATIOS.length, oct = Math.floor((addr - 1) / RATIOS.length);
    return V.root * Math.pow(2, V.pingOct + oct) * RATIOS[i];
  }

  function rB(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v === "1"; } catch (e) { return d; } }
  function rF(k, d) { try { var v = parseFloat(localStorage.getItem(k)); return isNaN(v) ? d : v; } catch (e) { return d; } }
  function save() { try { localStorage.setItem(LS_VOL, String(volume)); localStorage.setItem(LS_MUTE, muted ? "1" : "0"); localStorage.setItem(LS_VOICE, voicingName); } catch (e) {} }
  function emit() { var s = { muted: muted, volume: volume, voicing: voicingName }; for (var i = 0; i < listeners.length; i++) try { listeners[i](s); } catch (e) {} }

  function init() {
    if (built) return ctx;
    if (!AC) return null;
    ctx = new AC();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    master = ctx.createGain(); master.gain.value = muted ? 0 : volume;
    hpf = ctx.createBiquadFilter(); hpf.type = "highpass"; hpf.frequency.value = 26; hpf.Q.value = 0.5;
    shelf = ctx.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 6500; shelf.gain.value = 2;
    busGlue = ctx.createDynamicsCompressor();
    busGlue.threshold.value = -20; busGlue.ratio.value = 2.5; busGlue.attack.value = 0.012; busGlue.release.value = 0.24; busGlue.knee.value = 8;
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.06; limiter.knee.value = 0;
    analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.6;
    waveBuf = new Float32Array(analyser.fftSize);
    convolver = ctx.createConvolver(); convolver.buffer = getImpulse(V.reverbSize);
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
  function getImpulse(size) { var k = size.toFixed(1); return impulseCache[k] || (impulseCache[k] = makeImpulse(size, 2.6)); }
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
  function panner(x) { if (ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, x || 0)); return p; } return null; }
  function crushCurve(a) { var lv = Math.max(3, Math.round(16 - a * 12)), n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.round(x * lv) / lv; } return c; }
  function crushNode(a) { var w = ctx.createWaveShaper(); var k = a.toFixed(2); w.curve = crushCache[k] || (crushCache[k] = crushCurve(a)); return w; }

  /* ---- NODE PING — modal, spatial, in-key, per-voicing ------ */
  function nodePing(addr, opts) {
    if (!ready()) return;
    opts = opts || {};
    var t = ctx.currentTime, dg = densityGain();
    var f = nodeFreq(addr) * (opts.mult || 1);
    var vel = opts.vel != null ? opts.vel : 0.8;
    var depth = opts.depth != null ? opts.depth : 0;
    var x = opts.x != null ? opts.x : 0;

    var out = voiceIn(V.reverbSend + depth * 0.3);
    var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = V.toneBase - depth * (V.toneBase * 0.6);
    var tail = tone, p = panner(x);
    if (V.crush) { var cr = crushNode(V.crush); tone.connect(cr); tail = cr; }
    if (p) { tail.connect(p); p.connect(out); } else tail.connect(out);

    // contact transient
    var n = noiseSource(), bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = Math.min(9000, f * 4); bp.Q.value = 1.1;
    var ng = ctx.createGain(); n.connect(bp); bp.connect(ng); ng.connect(tone);
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.04 * vel * dg, t + 0.001); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.018); n.stop(t + 0.05);

    // switch-y noise body (mechanical/organic)
    if (V.noise > 0) {
      var nn = noiseSource(), nlp = ctx.createBiquadFilter(); nlp.type = "lowpass"; nlp.frequency.value = f * 2;
      var nbg = ctx.createGain(); nn.connect(nlp); nlp.connect(nbg); nbg.connect(tone);
      nbg.gain.setValueAtTime(0.0001, t); nbg.gain.exponentialRampToValueAtTime(0.1 * V.noise * vel * dg, t + 0.003); nbg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + V.decay * 0.1); nn.stop(t + 0.2);
    }

    // modal partials
    var base = 0.32 * (0.5 + vel * 0.5) * dg * (1 - depth * 0.45);
    for (var i = 0; i < V.partials.length; i++) {
      var pr = V.partials[i];
      var o = ctx.createOscillator(); o.type = V.osc; o.frequency.value = f * pr[0];
      var g = ctx.createGain(); o.connect(g); g.connect(tone);
      var dec = V.decay * pr[2] * (1 - depth * 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(base * pr[1], t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + dec);
      o.start(t); o.stop(t + 0.06 + dec);
    }
  }
  function nodeLock(addr, opts) {
    opts = opts || {};
    nodePing(addr, { vel: 0.9, x: opts.x || 0, depth: 0 });
    var x = opts.x || 0;
    setTimeout(function () { nodePing(addr, { vel: 0.5, x: -x * 0.6, depth: 0.4, mult: 2 }); }, 125);
  }

  /* ---- 0x00 carrier, gather, scatter, constellation -------- */
  function beacon() { if (!ready()) return; nodePing(0, { vel: 0.3, x: -0.85, depth: 0.4 }); nodePing(0, { vel: 0.24, x: 0.85, depth: 0.5, mult: 2 }); }
  function carrier(on) {
    if (!ready() && on) return;
    if (on && !carrierNode) {
      var t = ctx.currentTime;
      var sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = V.root;
      var subg = ctx.createGain(); subg.gain.value = 0.0001; sub.connect(subg); subg.connect(hpf);
      subg.gain.linearRampToValueAtTime(0.05, t + 3); sub.start();
      var bt = setInterval(beacon, 4600); setTimeout(beacon, 700);
      carrierNode = { sub: sub, subg: subg, bt: bt };
    } else if (!on && carrierNode) {
      var tt = ctx.currentTime; carrierNode.subg.gain.cancelScheduledValues(tt);
      carrierNode.subg.gain.setValueAtTime(carrierNode.subg.gain.value, tt);
      carrierNode.subg.gain.linearRampToValueAtTime(0.0001, tt + 1.5);
      clearInterval(carrierNode.bt);
      var c = carrierNode; carrierNode = null; setTimeout(function () { try { c.sub.stop(); } catch (e) {} }, 1700);
    }
  }
  function carrierOn() { return !!carrierNode; }
  function gather() {
    if (!ready()) return;
    var N = 9;
    for (var i = 0; i < N; i++) (function (i) { setTimeout(function () { nodePing(1 + Math.floor(Math.random() * 10), { vel: 0.42, x: Math.random() * 2 - 1, depth: 0.15 + Math.random() * 0.35 }); }, i * 68); })(i);
    setTimeout(function () { nodePing(0, { vel: 0.95, x: 0 }); nodePing(0, { vel: 0.55, x: 0, mult: 2 }); nodePing(0, { vel: 0.3, x: 0, mult: 3 }); }, N * 68 + 130);
  }
  function scatter() {
    if (!ready()) return;
    var t = ctx.currentTime;
    var n = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(1600, t); bp.frequency.exponentialRampToValueAtTime(280, t + 0.5);
    var g = voiceIn(0.45); n.connect(bp); bp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.055, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); n.stop(t + 0.6);
    for (var i = 0; i < 7; i++) (function (i) { setTimeout(function () { nodePing(1 + Math.floor(Math.random() * 10), { vel: 0.34, x: Math.random() * 2 - 1, depth: 0.3 + Math.random() * 0.5 }); }, i * 44); })(i);
  }
  function constellation(on) {
    if (on && !constTimer) {
      var sched = function () { if (!constTimer) return; nodePing(1 + Math.floor(Math.random() * 11), { vel: 0.26 + Math.random() * 0.16, x: Math.random() * 2 - 1, depth: 0.35 + Math.random() * 0.6 }); constTimer = setTimeout(sched, 700 + Math.random() * 2300); };
      constTimer = setTimeout(sched, 400);
    } else if (!on && constTimer) { clearTimeout(constTimer); constTimer = null; }
  }
  function constellationOn() { return !!constTimer; }

  /* ---- SCROLL — warm bed + physical shove ------------------- */
  function ensureScroll() {
    if (scrollNode) return;
    var n = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 0.5;
    var g = voiceIn(0.3); g.gain.value = 0.0001; n.connect(bp); bp.connect(g);
    scrollNode = { gain: g.gain, freq: bp.frequency };
  }
  function shove(amount, dir) {
    var t = ctx.currentTime;
    var n = noiseSource();
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 80;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(700 + amount * 900, t + 0.07); lp.frequency.exponentialRampToValueAtTime(170, t + 0.38);
    var p = panner(dir * 0.3 * amount);
    var g = voiceIn(0.18); n.connect(hp); hp.connect(lp); if (p) { lp.connect(p); p.connect(g); } else lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05 * amount + 0.015, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34); n.stop(t + 0.4);
  }
  function scroll(velocity) {
    if (!ready()) return; ensureScroll();
    var av = Math.abs(velocity), v = Math.min(1, av / 60), t = ctx.currentTime;
    scrollNode.gain.setTargetAtTime(0.035 * v, t, 0.08);
    scrollNode.freq.setTargetAtTime(360 + v * 1200, t, 0.08);            // warm, doppler-ish
    var dv = av - scrollState.lastV; scrollState.lastV = av;
    if (dv > 14 && t - scrollState.lastShove > 0.12) { scrollState.lastShove = t; shove(Math.min(1, dv / 40), velocity < 0 ? -1 : 1); }
    if (v > 0.45 && Math.random() < v * 0.3) nodePing(1 + Math.floor(Math.random() * 11), { vel: 0.2 * v, x: Math.random() * 2 - 1, depth: 0.4 + Math.random() * 0.4 });
  }
  function bootEnumerate(i, total) {
    if (!ready()) return;
    if (i >= (total - 1)) { gather(); return; }
    nodePing(1 + (i % 11), { vel: 0.4, x: (i % 2 ? 1 : -1) * (0.3 + (i / total) * 0.5), depth: 0.3 });
  }

  /* ---- KEYCAP — natural, two-stage, sample-ready ----------- */
  function thock(opts) {
    if (!ready()) return;
    if (samples.thock && samples.thock.length) return playSample("thock", opts);
    var vel = opts && opts.vel != null ? opts.vel : 0.8, t = ctx.currentTime, dg = densityGain(), j = 1 + (Math.random() * 0.16 - 0.08);
    // body knock — bottom-out (plastic/wood)
    var f0 = (150 + Math.random() * 30) * j;
    var o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(f0 * 1.6, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.04);
    var blp = ctx.createBiquadFilter(); blp.type = "lowpass"; blp.frequency.value = 900 + vel * 500;
    var og = voiceIn(0.06); o.connect(blp); blp.connect(og);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.42 * (0.6 + vel * 0.4) * dg, t + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1 + Math.random() * 0.04);
    o.start(t); o.stop(t + 0.16);
    // thud noise
    var n = noiseSource(), nhp = ctx.createBiquadFilter(); nhp.type = "highpass"; nhp.frequency.value = 200;
    var nlp = ctx.createBiquadFilter(); nlp.type = "lowpass"; nlp.frequency.value = 1400;
    var ng = voiceIn(0.04); n.connect(nhp); nhp.connect(nlp); nlp.connect(ng);
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.12 * vel * dg, t + 0.002); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); n.stop(t + 0.08);
    // contact click
    var n2 = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = (2600 + vel * 1600) * j; bp.Q.value = 0.9;
    var cg = voiceIn(0.03); n2.connect(bp); bp.connect(cg);
    cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime(0.09 * vel * dg, t + 0.001); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012); n2.stop(t + 0.04);
    // faint spring ping (some presses)
    if (Math.random() < 0.5) {
      var s = ctx.createOscillator(); s.type = "sine"; s.frequency.value = 3200 + Math.random() * 1500;
      var sg = voiceIn(0.1); s.connect(sg); var st = t + 0.004;
      sg.gain.setValueAtTime(0.0001, st); sg.gain.exponentialRampToValueAtTime(0.02 * vel, st + 0.003); sg.gain.exponentialRampToValueAtTime(0.0001, st + 0.08); s.start(st); s.stop(st + 0.1);
    }
  }
  function thockUp() {
    if (!ready()) return;
    if (samples.thockUp && samples.thockUp.length) return playSample("thockUp", {});
    var t = ctx.currentTime, dg = densityGain(), j = 1 + (Math.random() * 0.16 - 0.08);
    var n = noiseSource(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3200 * j; bp.Q.value = 1.1;
    var g = voiceIn(0.03); n.connect(bp); bp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * dg, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02); n.stop(t + 0.05);
    var o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = 260 * j;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500;
    var og = voiceIn(0.04); o.connect(lp); lp.connect(og);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.1 * dg, t + 0.003); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); o.start(t); o.stop(t + 0.08);
  }
  function tick() { nodePing(3, { vel: 0.3, depth: 0.2 }); }

  /* ---- SAMPLES — recorded keebs, round-robin --------------- */
  var rr = {};
  function loadSamples(map) {
    init(); var jobs = [];
    Object.keys(map).forEach(function (k) {
      samples[k] = [];
      (map[k] || []).forEach(function (url, idx) {
        jobs.push(fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (b) {
          return new Promise(function (res) { ctx.decodeAudioData(b, function (buf) { samples[k][idx] = buf; res(); }, function () { res(); }); });
        }).catch(function () {}));
      });
    });
    return Promise.all(jobs);
  }
  function playSample(key, opts) {
    var arr = (samples[key] || []).filter(Boolean); if (!arr.length) return;
    rr[key] = ((rr[key] || 0) + 1) % arr.length;
    var buf = arr[rr[key]]; var t = ctx.currentTime, dg = densityGain();
    var src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = 1 + (Math.random() * 0.06 - 0.03);
    var g = voiceIn(0.05); src.connect(g);
    var vel = opts && opts.vel != null ? opts.vel : 0.85;
    g.gain.value = Math.min(1, 0.5 + vel * 0.6) * dg * (0.9 + Math.random() * 0.2);
    src.start(t);
  }
  function usingSamples() { return !!(samples.thock && samples.thock.filter(Boolean).length); }

  /* ---- VOICING control ------------------------------------- */
  function setVoicing(name) {
    if (!VOICINGS[name]) return;
    voicingName = name; V = VOICINGS[name];
    if (built) { convolver.buffer = getImpulse(V.reverbSize); if (carrierNode) { carrier(false); setTimeout(function () { carrier(true); }, 60); } }
    save(); emit();
  }
  function getVoicings() { return Object.keys(VOICINGS).map(function (k) { return { name: k, label: VOICINGS[k].label, blurb: VOICINGS[k].blurb }; }); }
  function currentVoicing() { return voicingName; }

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
    onState: function (cb) { listeners.push(cb); cb({ muted: muted, volume: volume, voicing: voicingName }); },
    setVoicing: setVoicing, getVoicings: getVoicings, currentVoicing: currentVoicing,
    carrier: carrier, carrierOn: carrierOn,
    nodePing: nodePing, nodeLock: nodeLock, gather: gather, scatter: scatter,
    constellation: constellation, constellationOn: constellationOn,
    scroll: scroll, bootEnumerate: bootEnumerate,
    thock: thock, thockUp: thockUp, tick: tick,
    loadSamples: loadSamples, usingSamples: usingSamples,
    nodeFreq: nodeFreq, get ROOT() { return V.root; },
    getLevel: getLevel, getWave: getWave,
    get ctx() { return ctx; }
  };
})();
