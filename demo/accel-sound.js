/* Vector drift: staggered plucks and short, speed-sensitive grains. */
(function () {
  window.makeAccelDemoSound = function (onState) {
    const s = window.makeDemoSound('accel', onState);
    return { ...s,
      setMotion(speed, factor) { s.motion(speed, factor); },
      maxPing() { s.motion(.8, 1, 'limit', 1.6); },
      presetTick() { s.phrase([2,9], { gain: .09 }); },
      emitFx() { s.phrase([7,2,9,12], { spacing: .11, gain: .11 }); },
    };
  };
})();
