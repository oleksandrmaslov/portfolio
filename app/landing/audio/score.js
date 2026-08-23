/* ============================================================
   M.O. — LANDING SOUND SCORE
   ------------------------------------------------------------
   The Carrier Field engine is the instrument; this file is the score.
   One living field, crossfaded per section:

     title    VOID        sparse, crystalline — silence is a material
     intro    ASSEMBLING  the 0x00 glyph forming = a rising harmonic series
     work     REEL        the active node's sideband tunes in and resolves
                          to zero-beat when a card locks under the lens
     about    DEEP FIELD  heavy, cinematic, heartbeat while the dive arms
     contact  RESOLVE     calm — everything settles back onto the carrier

   Nothing here *plays sounds over* the field — every call disturbs the
   same engine the ambient lives in (CF setters + excitation API only).
   Character/space offsets come via window.__mo_score (optional override).
   ============================================================ */
(function () {
  "use strict";
  var CF = window.CarrierField;
  if (!CF) return;

  function on() {
    return window.MOSound && !window.MOSound.isMuted() && CF.isWoken() &&
           CF.ctx() && CF.ctx().state === "running";
  }

  // tweakable state — the panel writes here then dispatches "mo:scoreTweak"
  var S = (window.__mo_score = Object.assign(
    { character: "blend", space: 60 }, window.__mo_score || {}));

  // per-section field profiles
  var PROFILES = {
    title:   { temp: 0.38, idle: 0.50, cursor: 0.50 },
    intro:   { temp: 0.52, idle: 0.26, cursor: 0.42 },
    work:    { temp: 0.55, idle: 0.16, cursor: 0.45 },
    about:   { temp: 0.80, idle: 0.10, cursor: 0.38 },
    contact: { temp: 0.46, idle: 0.40, cursor: 0.42 },
  };
  // character offsets: VOID = colder + sparser · DEEP = warmer + denser
  var CHARACTER = {
    void:   { temp: -0.18, idle: 0.55 },
    breath: { temp:  0.00, idle: 1.00 },
    deep:   { temp:  0.22, idle: 1.25 },
    blend:  { temp:  0.00, idle: 1.00 },   // per-section blend — profiles as written
  };

  var cur = "title";
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function apply() {
    if (!CF.isWoken()) return;
    var p = PROFILES[cur] || PROFILES.title;
    var c = CHARACTER[S.character] || CHARACTER.blend;
    var spaceBias = (S.space - 60) / 100 * 0.5;
    CF.setTemperature(clamp01(p.temp + c.temp + spaceBias));
    CF.setIdleLife(clamp01(p.idle * c.idle));
    CF.setCursorAmount(p.cursor);
  }

  window.addEventListener("mo:section", function (e) {
    var s = e.detail && e.detail.section;
    if (s && s !== cur) {
      cur = s;
      apply();
      // crossing a section boundary is itself a disturbance —
      // sonically (carrier swell) and visually (a soft centre ripple)
      if (on()) CF.carrierAccent(s === "contact" ? 0.5 : 0.22);
    }
    if (window.__mo_disturb) {
      window.__mo_disturb(window.innerWidth / 2, window.innerHeight * 0.5, 0.45);
    }
  });
  window.addEventListener("mo:scoreTweak", apply);
  // re-apply the active profile whenever sound is switched on
  if (window.MOSound && window.MOSound.onState) {
    window.MOSound.onState(function (st) { if (!st.muted) setTimeout(apply, 90); });
  }

  /* ── ORIGIN BEAT — the glyph assembling = a rising harmonic series ──
     formP thresholds fire ascending just-intonation steps (9:8 → 5:4 →
     3:2 → 2:1); melting back re-arms them. */
  var ASCENT = ["0x01", "0x02", "0x04", "0x07"];
  var lastStep = -1;
  setInterval(function () {
    var d = window.__mo_debug || {};
    var f = d.formP || 0;
    if (f < 0.12) { lastStep = -1; return; }
    if (!on() || d.mode !== "origin") return;
    var step = f < 0.22 ? -1 : f < 0.45 ? 0 : f < 0.68 ? 1 : f < 0.9 ? 2 : 3;
    if (step > lastStep) { lastStep = step; if (step >= 0) CF.pingNode(ASCENT[step], 0.10); }
  }, 240);

  /* ── WORK REEL — tune in the active node, resolve to zero-beat ──
     When a card stops under the lens its sideband starts beating against
     the carrier (hover voice); a moment later it locks — the beat resolves
     to zero. The audible meaning of "this node is selected". */
  var reelAddr = null, lockTimer = null, gatherFired = false;
  window.addEventListener("mo:reelStop", function (e) {
    var addr = e.detail && e.detail.addr;
    var stop = e.detail && e.detail.stop;
    // final stop — the universe GATHERS into the passage door: the field
    // aligns around the visitor (rare payoff) + a slow centre ripple.
    // Final stop is (featured count + 1) — the "Open the universe" gate. It
    // was the literal 5, which silently points at the wrong card the moment
    // MO_FEATURED_ADDRS changes length.
    var lastStop = (window.MO_FEATURED_ADDRS || []).length + 1;
    if (stop >= lastStop && !gatherFired) {
      gatherFired = true;
      if (on()) CF.reward();
      if (window.__mo_disturb) window.__mo_disturb(window.innerWidth / 2, window.innerHeight * 0.45, 1.15);
    }
    if (stop < lastStop) gatherFired = false;
    if (addr === reelAddr) return;
    if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
    if (reelAddr) { try { CF.unhoverNode(reelAddr); } catch (_) {} }
    reelAddr = addr;
    if (!addr || !on()) return;
    CF.hoverNode(addr);
    lockTimer = setTimeout(function () {
      if (on() && reelAddr === addr) CF.lockNode(addr);
    }, 560);
  });

  /* ── ABOUT / DIVE — a slow heartbeat while the lock is armed ── */
  var hb = null;
  setInterval(function () {
    var dv = window.__mo_dive || {};
    var armed = cur === "about" && (dv.p || 0) > 0.62;
    if (armed && !hb) hb = setInterval(function () { if (on()) CF.carrierAccent(0.22); }, 1700);
    if (!armed && hb) { clearInterval(hb); hb = null; }
  }, 420);

})();
