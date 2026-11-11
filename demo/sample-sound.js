/* One sampled player per open demo; all cues use its bounded voice pool. */
(function () {
  'use strict';
  window.makeDemoSound = function (id, onState, extraSamples) {
    const { DemoScore, clamp } = window.MODemoMusic;
    const player = new window.MOGenerativeField({ direction: 'signal', extraSamples });
    const score = player.score = new DemoScore(id);
    let active = false, muted = false;
    const last = new Map();
    player.onState(state => {
      if (!state.intent) score.texture = false;
      if (onState) onState(state);
    });
    function startPlayer() {
      if (!player.intent) player.clearVoices();
      return player.start();
    }
    function note(offset = 0, options = {}) {
      if (!player.running || muted || !active) return;
      const { kind = score.p.lead, gain = .13, duration = .65, delay = 0, pan = 0, attack = .005 } = options;
      player.voice({ kind, note: kind === 'wood' ? offset : score.p.root + 24 + offset,
        gain, duration, pan, attack, tail: 0 }, player.context.currentTime + .008 + delay);
    }
    function phrase(offsets, options = {}) {
      offsets.forEach((n,i) => note(n, { ...options, delay: (options.delay || 0) + i*(options.spacing || .13) }));
    }
    function motion(amount, position = 0, key = 'motion', interval = .16) {
      if (!player.running || muted || !active) return;
      score.motion(amount, position);
      const now = player.context.currentTime;
      if (amount > .015 && now - (last.get(key) ?? -Infinity) > interval) {
        last.set(key, now);
        note([0,2,4,7,9][Math.round(clamp(position)*4)], { gain: .035 + clamp(amount)*.035, duration: .18 });
      }
    }
    const api = {
      note, phrase, motion,
      start() { active = true; last.clear(); if (!muted) return startPlayer(); },
      stop() { active = false; score.texture = false; score.sleeping = false; player.stop(); },
      setLevel(v) { if (Number.isFinite(v)) player.setVolume(clamp(v)*.7); },
      setMuted(value) { muted = !!value; if (muted) { score.texture = false; player.stop(); } else if (active) return startPlayer(); },
      texture(value) { score.texture = !!value; },
      sleep(value) { score.sleeping = !!value; },
      uiTick(kind) { note(kind === 'off' ? 0 : 7, { kind: 'pluck', gain: .065, duration: .08 }); },
      bootTick() { note(2, { kind: 'pluck', gain: .035, duration: .06 }); },
    };
    return api;
  };
})();
