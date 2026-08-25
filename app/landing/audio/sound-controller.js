/* ============================================================
   MOSound — landing sound controller over the 0x00 Carrier Field engine.
   ------------------------------------------------------------
   Exposes the window.MOSound surface the site already calls
   (KeyButton thock/thockUp, VolumeToggle init/onState/getLevel/
   toggleMute/carrier, universe hover/open) but backs every call
   with carrier-field.js instead of the retired sound-engine.

   Policy: sound DEFAULT OFF, master DEFAULT 0.5. Nothing is heard
   until the visitor toggles the field on. Turning it on wakes the
   carrier; turning it off fades the master but keeps the graph.
   ============================================================ */
(function () {
  "use strict";
  var CF = window.CarrierField;
  if (!CF) { console.warn("[MOSound] CarrierField engine missing"); return; }

  var LS_VOL = "cf_vol";
  function rF(k, d) { try { var v = parseFloat(localStorage.getItem(k)); return isNaN(v) ? d : v; } catch (e) { return d; } }

  var volume = rF(LS_VOL, 0.5);        // DEFAULT 50%, persisted
  // ALWAYS start OFF: browsers block audio until a gesture, so the toggle
  // itself is that gesture. Never persist "on" — it would show ON on reload
  // while the context is actually blocked (the bug). Reality always matches.
  var muted = true;
  var listeners = [];
  var listening = false;               // global move/scroll hooks attached?
  var suspendTimer = null;

  function save() { try { localStorage.setItem(LS_VOL, String(volume)); } catch (e) {} }
  function emit() { var s = { muted: muted, volume: volume }; for (var i = 0; i < listeners.length; i++) { try { listeners[i](s); } catch (e) {} } }

  // numeric or string addr -> canonical "0x0N" the engine understands
  function addrOf(a) {
    if (a == null) return "0x01";
    if (typeof a === "string") { return CF.RATIOS[a] ? a : null; }
    var n = a | 0;
    if (n <= 0) return "0x00";          // carrier
    n = ((n - 1) % CF.ADDRS.length);
    return CF.ADDRS[n];
  }

  function active() { return !muted && CF.isWoken() && CF.ctx() && CF.ctx().state === "running"; }

  // ---- global presence: cursor breathes the field + scroll trickles ----
  var lastSY = (typeof scrollY === "number") ? scrollY : 0, lastPM = 0, lpx = 0, lpy = 0, lpt = 0;
  function attachListeners() {
    if (listening) return; listening = true;
    addEventListener("wheel", function (e) { if (active()) CF.scrollTrickle(e.deltaY); }, { passive: true });
    addEventListener("scroll", function () {
      var y = scrollY, d = y - lastSY; lastSY = y;
      if (active() && Math.abs(d) > 1) CF.scrollTrickle(d * 1.4);
    }, { passive: true });
    addEventListener("pointermove", function (e) {
      var now = performance.now(); if (now - lastPM < 33) return;   // ~30Hz
      var dt = Math.max(16, now - lpt);
      var vx = (e.clientX - lpx) / dt, vy = (e.clientY - lpy) / dt;
      lpx = e.clientX; lpy = e.clientY; lpt = now; lastPM = now;
      if (active()) CF.cursorMove(e.clientX / innerWidth, e.clientY / innerHeight, vx, vy);
    }, { passive: true });
  }

  // ---- master / mute -----------------------------------------------------
  // ON  = resume the context + ramp master to volume.
  // OFF = fade master to 0, then suspend the context (truly silent, no leak).
  function enable() {
    if (suspendTimer) { clearTimeout(suspendTimer); suspendTimer = null; }
    CF.setMaster(volume);
    CF.wake();              // builds on first call; resumes the ctx thereafter
    CF.resume();            // ensure running (this runs inside the click gesture)
    CF.setCursorAmount(0.4);
    CF.setMaster(volume);
    attachListeners();
  }
  function disable() {
    if (!CF.isWoken()) return;
    CF.setMaster(0);
    if (suspendTimer) clearTimeout(suspendTimer);
    suspendTimer = setTimeout(function () { CF.suspend(); suspendTimer = null; }, 240);
  }
  function applyMaster() { if (muted) disable(); else enable(); }
  function setMuted(b) { muted = !!b; applyMaster(); save(); emit(); }
  function toggleMute() { setMuted(!muted); }

  function init() { return CF.ctx && CF.ctx(); }     // no autostart; toggle unlocks
  function unlock() { if (!muted) enable(); }

  function getLevel() { return Math.min(1, (CF.state.level || 0) * 3.2); }

  // ---- node + carrier events --------------------------------------------
  function hover(addr) { if (!active()) return; var s = addrOf(addr); if (s) CF.hoverNode(s); }
  function unhover(addr) { if (!CF.isWoken()) return; if (addr == null) { CF.ADDRS.forEach(function (a) { CF.unhoverNode(a); }); } else { var s = addrOf(addr); if (s) CF.unhoverNode(s); } }
  // card click → strike the node AND let the 0x00 carrier make itself heard
  function open(addr) {
    if (!active()) return;
    var s = addrOf(addr);
    if (s && s !== "0x00") CF.strikeNode(s);
    CF.carrierAccent(1);
  }

  function gather() { if (!active()) return; var i, A = CF.ADDRS; for (i = 0; i < 6; i++) (function (k) { setTimeout(function () { CF.pingNode(A[(Math.random() * A.length) | 0], 0.06); }, k * 70); })(i); setTimeout(function () { CF.carrierAccent(0.9); }, 480); }

  function thock(opts) { if (active()) CF.thock(opts && opts.vel); }
  function thockUp() { if (active()) CF.thockUp(); }

  window.MOSound = {
    init: init, unlock: unlock,
    isMuted: function () { return muted; }, getVolume: function () { return volume; },
    toggleMute: toggleMute,
    onState: function (cb) { listeners.push(cb); try { cb({ muted: muted, volume: volume }); } catch (e) {} },
    getLevel: getLevel,
    carrier: function (on) { if (on) { enable(); } else { disable(); } },
    hover: hover, unhover: unhover, open: open,
    gather: gather,
    thock: thock, thockUp: thockUp,
    get ctx() { return CF.ctx && CF.ctx(); },
  };
})();
