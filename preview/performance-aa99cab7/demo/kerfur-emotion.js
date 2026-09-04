/* ============================================================
   M.O. SYSTEM — KERFUR EMOTION ENGINE  ·  node 0x02
   ------------------------------------------------------------
   Browser sim of src/behavior/behavior_engine.c: events update
   emotional variables, variables decay over time, an expression
   scorer resolves the face, micro-reactions fire with cooldowns.
   Same shape as the firmware docs:

     energy · mood · affection · social · stress · sleepiness

   window.makeKerfurEmotion() → {
     post(event, payload)         // KERFUS_EVENT_* names, doc set
     update(dt, now) → { expression, reaction|null, changed }
     vars, lastEvent, log         // for the HUD
     state                        // charging, battery, asleep…
   }
   ============================================================ */
(function () {
  const clamp = (v) => Math.max(0, Math.min(100, v));

  /* event → emotion deltas (docs §4.3) */
  const DELTAS = {
    TOUCH_TAP:            { mood: +3, social: +1 },
    TOUCH_DOUBLE_TAP:     { mood: +8, affection: +4 },
    TOUCH_STROKE:         { affection: +9, mood: +5, stress: -8, sleepiness: +2 },
    MOTION_SHAKE:         { stress: +16, mood: -6, energy: +6, sleepiness: -20 },
    MOTION_PICKED_UP:     { energy: +8, social: +3, sleepiness: -30 },
    MOTION_STILL:         { sleepiness: +4 },
    NOTIFICATION_RECEIVED:{ mood: +2, stress: +3, sleepiness: -8 },
    NOTIFICATION_IMPORTANT:{ mood: +6, stress: +6, energy: +6, sleepiness: -16 },
    NOTIFICATION_OVERLOAD:{ stress: +26, mood: -10, energy: -6 },
    BATTERY_LOW:          { energy: -18, sleepiness: +14 },
    BATTERY_CRITICAL:     { energy: -30, sleepiness: +24, stress: +6 },
    CHARGING_STARTED:     { stress: -10, mood: +4 },
    CHARGING_STOPPED:     {},
    PEER_SEEN:            { social: +14, mood: +2 },
    PEER_NEAR:            { social: +22, energy: +6 },
    PEER_FRIEND_SEEN:     { social: +30, mood: +16, affection: +10, stress: -6 },
    SLEEP_ENTER:          {},
    SLEEP_EXIT:           { energy: +4 },
  };

  /* event → immediate micro-reaction (cooldown-gated) */
  const REACTIONS = {
    TOUCH_TAP:             "REACTION_GLANCE_LEFT",
    TOUCH_DOUBLE_TAP:      "REACTION_HAPPY_BOUNCE",
    TOUCH_STROKE:          "REACTION_PET_BOW",
    MOTION_SHAKE:          "REACTION_STARTLE",
    MOTION_PICKED_UP:      "REACTION_WAKE_BLINK",
    NOTIFICATION_RECEIVED: "REACTION_NOTIF_PING",
    NOTIFICATION_IMPORTANT:"REACTION_NOTIF_PING",
    NOTIFICATION_OVERLOAD: "REACTION_NOTIF_BURST",
    BATTERY_LOW:           "REACTION_LOW_BATT_SAG",
    CHARGING_STARTED:      "REACTION_CHARGE_PULSE",
    PEER_SEEN:             "REACTION_GLANCE_RIGHT",
    PEER_FRIEND_SEEN:      "REACTION_CONNECT_SPARK",
    SLEEP_ENTER:           "REACTION_SLEEP_FADE",
    SLEEP_EXIT:            "REACTION_WAKE_BLINK",
  };

  window.makeKerfurEmotion = function () {
    const vars = { energy: 70, mood: 60, affection: 40, social: 30, stress: 15, sleepiness: 10 };
    const BASE = { energy: 65, mood: 55, affection: 40, social: 30, stress: 10, sleepiness: 20 };

    const state = {
      charging: false,
      battery: 0.84,
      asleep: false,
      petting: false,            // continuous stroke in progress
      inHand: false,
      peer: null,                // null | "seen" | "near" | "friend"
      shakeCount: 0,
      lastShakeAt: -1e9,
      lastInteractAt: 0,
      notifTimes: [],
    };

    let lastEvent = null;
    const log = [];              // ring buffer for HUD event feed
    const cooldowns = {};        // reaction id → until ts
    let pendingReaction = null;
    let curExpr = "PET_EXPR_CALM";

    function post(ev, payload) {
      const now = performance.now();
      lastEvent = { ev, t: now, payload };
      log.push({ ev, t: now });
      if (log.length > 24) log.shift();

      const d = DELTAS[ev] || {};
      for (const k of Object.keys(d)) vars[k] = clamp(vars[k] + d[k]);

      /* contextual bookkeeping */
      if (ev.startsWith("TOUCH") || ev.startsWith("MOTION_PICKED") || ev === "MOTION_SHAKE") {
        state.lastInteractAt = now;
        if (state.asleep) { state.asleep = false; post("SLEEP_EXIT"); return; }
      }
      if (ev === "MOTION_SHAKE") {
        state.shakeCount = now - state.lastShakeAt < 4200 ? state.shakeCount + 1 : 1;
        state.lastShakeAt = now;
      }
      if (ev === "NOTIFICATION_RECEIVED" || ev === "NOTIFICATION_IMPORTANT") {
        state.notifTimes.push(now);
        state.notifTimes = state.notifTimes.filter((t) => now - t < 9000);
        if (state.notifTimes.length >= 4) { post("NOTIFICATION_OVERLOAD"); return; }
      }
      if (ev === "CHARGING_STARTED") state.charging = true;
      if (ev === "CHARGING_STOPPED") state.charging = false;
      if (ev === "PEER_SEEN") state.peer = "seen";
      if (ev === "PEER_NEAR") state.peer = "near";
      if (ev === "PEER_FRIEND_SEEN") state.peer = "friend";
      if (ev === "PEER_LOST") state.peer = null;
      if (ev === "SLEEP_ENTER") state.asleep = true;
      if (ev === "SLEEP_EXIT") state.asleep = false;

      /* micro-reaction with per-reaction cooldown (docs: no spam) */
      const r = REACTIONS[ev];
      if (r) {
        const cd = r === "REACTION_PET_BOW" ? 1600 : r === "REACTION_GLANCE_LEFT" ? 700 : 2400;
        if (!cooldowns[r] || now > cooldowns[r]) {
          cooldowns[r] = now + cd;
          pendingReaction = r;
        }
      }
    }

    /* expression scorer — priority rules from behavior docs */
    function scoreExpression(now) {
      const v = vars, s = state;
      if (s.asleep) return "PET_EXPR_ASLEEP";
      if (s.battery < 0.1) return "PET_EXPR_DRAINED";
      if (s.charging) return "PET_EXPR_COZY";
      if (v.stress > 72) return "PET_EXPR_OVERSTIMULATED";
      if (s.shakeCount >= 3 && now - s.lastShakeAt < 5000) return "PET_EXPR_ANNOYED";
      if (v.stress > 48) return "PET_EXPR_ANNOYED";
      if (v.sleepiness > 76) return "PET_EXPR_SLEEPY";
      if (s.peer === "friend") return "PET_EXPR_HAPPY";
      if (s.peer === "seen" || s.peer === "near") return "PET_EXPR_CURIOUS";
      if (s.petting) return "PET_EXPR_COZY";
      if (v.affection > 70 && v.mood > 62) return "PET_EXPR_HAPPY";
      if (v.mood > 70) return "PET_EXPR_PLAYFUL";
      if (v.affection > 56) return "PET_EXPR_CONTENT";
      if (now - s.lastInteractAt > 46000 && v.mood < 45) return "PET_EXPR_LONELY";
      if (v.mood < 30) return "PET_EXPR_NEEDY";
      return "PET_EXPR_CALM";
    }

    return {
      vars, state, log,
      get lastEvent() { return lastEvent; },
      get expression() { return curExpr; },
      post,

      update(dt, now) {
        /* decay toward baselines (slow, firmware-style passive drift) */
        const k = dt / 1000 * 0.55;
        for (const key of Object.keys(vars)) {
          vars[key] = clamp(vars[key] + (BASE[key] - vars[key]) * k * 0.05);
        }
        /* charging slowly restores energy + battery */
        if (state.charging) {
          state.battery = Math.min(1, state.battery + dt / 1000 / 60);
          vars.energy = clamp(vars.energy + k * 1.2);
          vars.sleepiness = clamp(vars.sleepiness + k * 0.8);
        } else {
          state.battery = Math.max(0, state.battery - dt / 1000 / 600);
        }
        /* boredom → sleepiness while untouched */
        if (now - state.lastInteractAt > 18000 && !state.asleep) {
          vars.sleepiness = clamp(vars.sleepiness + k * 2.4);
        }
        /* auto-sleep */
        if (!state.asleep && vars.sleepiness >= 96 && now - state.lastInteractAt > 24000) {
          post("SLEEP_ENTER");
        }
        if (!state.charging && state.battery < 0.1 && curExpr !== "PET_EXPR_DRAINED") {
          post("BATTERY_LOW");
        }

        const next = scoreExpression(now);
        const changed = next !== curExpr;
        curExpr = next;
        const reaction = pendingReaction;
        pendingReaction = null;
        return { expression: curExpr, reaction, changed };
      },
    };
  };
})();
