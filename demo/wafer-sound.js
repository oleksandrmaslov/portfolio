/* Soft circuit: open harmony and the original dry keyboard contacts. */
(function () {
  window.makeWaferDemoSound = function (onState) {
    const s = window.makeDemoSound('wafer', onState, {
      file: new URL('./public/audio/wafer-keys.wav', document.baseURI),
      entries: [
        { kind: 'key-down', note: 62, offset: 0, duration: .42 },
        { kind: 'key-down', note: 50, offset: .42, duration: .42 },
        { kind: 'key-up', note: 62, offset: .84, duration: .08 },
        { kind: 'key-up', note: 50, offset: .92, duration: .08 },
      ],
    });
    const thock = (o = {}) => {
      const pitch = window.__waferDemoTweaks?.thockPitch ?? 1;
      s.note((o.deep ? -12 : 0) + 12*Math.log2(Math.max(.25,pitch)), {
        kind: 'key-down', attack: .0005, gain: .20*(o.intensity ?? 1), duration: .32,
      });
    };
    return { ...s, thock,
      keyRelease(deep) { s.note(deep ? -12 : 0, { kind: 'key-up', attack: .0005, gain: .18, duration: .065 }); },
      ping(ratio, o = {}) { s.note(12*Math.log2(ratio), { gain: (o.peak ?? .022)*4, duration: .55 }); },
      sweepFx(ms = 900) { s.phrase([0,7], { spacing: ms/2000, gain: .06 }); },
      handover(quiet) { s.phrase([4,9], { spacing: .3, gain: quiet ? .035 : .065 }); },
      scrub(speed, openness) { s.motion(speed, openness, 'scrub', .65); },
    };
  };
})();
