/* The existing MOSound surface. Sound starts OFF and loads only on opt-in.
   Mute/hidden/pagehide cancel pending cues, stop sources and suspend DSP. */
(function () {
  "use strict";
  const CF = window.CarrierField;
  if (!CF) return;
  let volume = .5;
  try { const saved = parseFloat(localStorage.getItem("cf_vol")); if (Number.isFinite(saved)) volume = Math.max(0, Math.min(1, saved)); } catch (_) {}
  let muted = true, loading = false, error = false, request = 0;
  const listeners = new Set();
  function snapshot() { return { muted, loading, error, volume }; }
  function emit() { for (const cb of listeners) cb(snapshot()); }
  function addrOf(addr) {
    if (typeof addr === "string") return CF.ADDRS.includes(addr) ? addr : null;
    if (typeof addr === "number" && addr > 0) return CF.ADDRS[(Math.floor(addr) - 1) % CF.ADDRS.length];
    return null;
  }
  async function enable() {
    if (muted || document.hidden) return;
    const revision = ++request;
    loading = true; error = false; emit();
    CF.setMaster(volume);
    try { await CF.wake(); }
    catch (_) {
      if (revision !== request) return;
      muted = true; error = true; CF.suspend(true);
    }
    if (revision !== request) return;
    loading = false; emit();
  }
  function disable(immediate) { ++request; loading = false; CF.suspend(immediate); }
  function toggleMute() {
    muted = !muted; error = false;
    if (muted) disable(false); else enable();
    emit();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { disable(true); emit(); }
    else if (!muted) enable();
  });
  window.addEventListener("pagehide", () => disable(true));
  window.addEventListener("pageshow", e => { if (e.persisted && !muted) enable(); });
  window.MOSound = {
    init: () => CF.ctx(),
    unlock() { if (!muted && !loading && CF.ctx() && CF.ctx().state !== "running") enable(); },
    isMuted: () => muted, getVolume: () => volume, toggleMute,
    onState(cb) { listeners.add(cb); cb(snapshot()); return () => listeners.delete(cb); },
    getLevel: CF.getLevel,
    carrier(on) { if (on && !muted) enable(); else disable(false); },
    hover(addr) { const a = addrOf(addr); if (!muted && a) CF.hoverNode(a); },
    unhover: CF.unhoverNode,
    open(addr) { const a = addrOf(addr); if (!muted && a) CF.strikeNode(a); },
    thock() { if (!muted) CF.thock(); },
    thockUp() {}, // release is deliberately quiet; retained for KeyButton callers
    originProgress: CF.originProgress,
    get ctx() { return CF.ctx(); },
  };
})();
