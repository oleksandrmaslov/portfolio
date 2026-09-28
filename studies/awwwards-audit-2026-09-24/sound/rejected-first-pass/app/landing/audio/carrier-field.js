/* 0x00 — material sound field.
   One quiet, pre-rendered room and bounded, deliberate one-shots. No live
   oscillators, convolution, pointer sonification or independent audio RAF.
   Assets are an authored synthetic study; see tools/audio/README.md. */
(function () {
  "use strict";
  const ADDRS = (window.MO_PROJECTS || []).filter(p => p.universe !== false).map(p => p.addr);
  const FILES = { room: "room-v1.mp3", focus: "focus-v1.wav", open: "open-v1.wav", settle: "settle-v1.wav" };
  const buffers = {}, voices = new Set();
  let ctx = null, master = null, roomGain = null, room = null, bank = null;
  let wanted = false, generation = 0, suspendTimer = null;
  let volume = .5, section = "title", hoverAddr = null, hoverTimer = null;
  let lastFocus = -Infinity, lastOpen = -Infinity, originStep = -1;
  let cueAt = -Infinity, cueEnergy = 0;
  const state = { woken: false };
  const clamp = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

  function ramp(param, value, duration) {
    const t = ctx.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
    else { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); }
    param.linearRampToValueAtTime(value, t + duration);
  }
  function build() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
    master = ctx.createGain(); master.gain.value = 0;
    roomGain = ctx.createGain(); roomGain.gain.value = 1;
    roomGain.connect(master); master.connect(ctx.destination);
    state.woken = true;
  }
  function load() {
    if (!bank) bank = Promise.all(Object.entries(FILES).map(async ([name, file]) => {
      if (buffers[name]) return;
      const response = await fetch("public/audio/" + file);
      if (!response.ok) throw new Error("Sound asset unavailable: " + file);
      buffers[name] = await ctx.decodeAudioData(await response.arrayBuffer());
    })).catch(error => { bank = null; throw error; });
    return bank;
  }
  function active() { return wanted && ctx && ctx.state === "running" && !!buffers.room; }
  function setSection(next) {
    section = next;
    if (ctx) ramp(roomGain.gain, next === "work" || next === "about" || next === "contact" ? .65 : 1, .65);
  }
  function startRoom() {
    if (room) return;
    const source = ctx.createBufferSource();
    source.buffer = buffers.room; source.loop = true;
    source.connect(roomGain);
    source.onended = () => source.disconnect();
    room = source;
    source.start();
    setSection(section);
  }
  async function wake() {
    build();
    wanted = true;
    const revision = ++generation;
    clearTimeout(suspendTimer); suspendTimer = null;
    // resume starts in the user's gesture, before awaiting asset IO.
    await Promise.all([ctx.resume(), load()]);
    if (!wanted || revision !== generation) return;
    startRoom();
    ramp(master.gain, volume, .3);
  }
  function clearHover() {
    clearTimeout(hoverTimer); hoverTimer = null; hoverAddr = null;
  }
  function stopVoice(voice) {
    voice.source.onended = null;
    try { voice.source.stop(); } catch (_) {}
    voice.source.disconnect(); voice.gain.disconnect();
    if (voice.pan) voice.pan.disconnect();
    voices.delete(voice);
  }
  function clearVoices(kind) {
    for (const voice of voices) if (!kind || voice.kind === kind) stopVoice(voice);
  }
  function suspend(immediate) {
    wanted = false; ++generation; clearHover();
    clearTimeout(suspendTimer); suspendTimer = null;
    if (!ctx) return;
    const revision = generation;
    const finish = () => {
      suspendTimer = null;
      if (wanted || revision !== generation) return;
      clearVoices();
      if (room) { room.stop(); room.disconnect(); room = null; }
      cueAt = -Infinity;
      ctx.suspend().catch(() => {});
    };
    ramp(master.gain, 0, immediate ? 0 : .08);
    if (immediate) finish();
    else suspendTimer = setTimeout(finish, 100);
  }
  function play(name, gain = 1, pan = 0, kind = name) {
    if (!active() || !buffers[name] || voices.size >= 4) return;
    const source = ctx.createBufferSource(), level = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    source.buffer = buffers[name]; level.gain.value = gain;
    source.connect(level);
    if (panner) { panner.pan.value = pan; level.connect(panner); panner.connect(master); }
    else level.connect(master);
    const voice = { source, gain: level, pan: panner, kind };
    voices.add(voice);
    source.onended = () => {
      source.disconnect(); level.disconnect(); if (panner) panner.disconnect(); voices.delete(voice);
    };
    cueAt = ctx.currentTime; cueEnergy = name === "focus" ? .08 : .24;
    source.start();
  }
  function hoverNode(addr) {
    if (addr === hoverAddr) return;
    clearHover();
    if (!active() || !ADDRS.includes(addr)) return;
    hoverAddr = addr;
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      if (hoverAddr !== addr || !active() || ctx.currentTime - lastFocus < .9) return;
      lastFocus = ctx.currentTime;
      play("focus", .65, 0, "focus");
    }, 450);
  }
  function strikeNode(addr) {
    clearHover();
    if (!active() || !ADDRS.includes(addr) || ctx.currentTime - lastOpen < .24) return;
    lastOpen = ctx.currentTime;
    clearVoices("focus"); clearVoices("key");
    play("open");
  }
  function originProgress(form, mode) {
    if (mode !== "origin" || form < .12) {
      if (originStep !== -1) clearVoices("origin");
      originStep = -1;
      return;
    }
    const step = form < .25 ? -1 : form < .5 ? 0 : form < .72 ? 1 : form < .92 ? 2 : 3;
    if (step <= originStep) return;
    originStep = step; // advance even while muted/loading; never replay missed cues
    if (!active()) return;
    // A fast scroll plays only the furthest threshold, never a catch-up burst.
    if (step === 0) play("focus", .42, -.55, "origin");
    if (step === 1) play("focus", .48, .45, "origin");
    if (step === 2) play("open", .42, -.15, "origin");
    if (step === 3) play("settle", 1, 0, "origin");
  }
  window.CarrierField = {
    ADDRS, state, wake, resume: wake, suspend, stopAll: () => suspend(true),
    ctx: () => ctx, isWoken: () => state.woken,
    setMaster(v) { volume = clamp(v); if (active()) ramp(master.gain, volume, .12); },
    setSection, hoverNode, unhoverNode: clearHover, strikeNode, originProgress,
    thock() { if (active() && ctx.currentTime - lastOpen >= .24) { lastOpen = ctx.currentTime; play("open", .65, 0, "key"); } },
    // The universe reads this authored cue envelope in its existing frame loop.
    // It is not a microphone/analyser meter and schedules no work itself.
    getLevel() { return active() ? cueEnergy * Math.exp(-(ctx.currentTime - cueAt) * 8) : 0; },
  };
})();
