/* Night filament: low silk, pulse accents and dry sampled switches. */
(function () {
  window.makeTorchDemoSound = function (onState) {
    const s = window.makeDemoSound('torch', onState);
    const click = (sw, dir) => s.note(sw === 1 ? 1 : 3, { kind: 'wood', gain: dir === 'down' ? .14 : .06, duration: .045 });
    return { ...s, click,
      powerFx(on) { s.phrase(on ? [0,7] : [7,0], { kind: 'ep', gain: .11 }); s.texture(on); },
      colorSwap(color) { s.phrase(color === 'red' ? [7,3] : [3,7], { kind: 'pluck', gain: .10 }); },
      rampStart() { s.texture(true); },
      rampLevel(level) { s.motion(.12, level); },
      rampEnd() { s.texture(false); },
      sosBeep(units, unitMs) { s.note(7, { kind: 'ep', gain: .15, duration: units*unitMs/1000 }); },
      battCheck(level) { s.phrase([0,3,7,12].slice(0,Math.max(1,Math.ceil(level*4))), { kind: 'pluck', gain: .11 }); },
      partLand(kind) { click(['body','head','tail'].includes(kind) ? 1 : 2, 'down'); },
      igniteFx() { s.phrase([-12,0,7,14], { gain: .13 }); },
      dieFx() { s.phrase([3,0,-12], { kind: 'ep', gain: .085 }); s.texture(false); },
      rechargeFx() { s.phrase([0,3,7,12], { kind: 'ep', gain: .10 }); },
      handover(quiet) { s.phrase([7,2], { gain: quiet ? .06 : .10, spacing: .24 }); },
    };
  };
})();
