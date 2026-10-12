/* Small companion: rounded marimba calls, electric-key answers. */
(function () {
  window.makeKerfurDemoSound = function (onState) {
    const s = window.makeDemoSound('kerfur', onState);
    const calls = {
      tap: [4,7], happy: [4,9,7,12], petBow: [7,4,9], startle: [0,14],
      pickup: [0,4], putdown: [4,0], notif: [12,14], notifBig: [7,12,16],
      overload: [12,11,7,2], charge: [0,4,9], drained: [4,0,-5],
      peerSeen: [9,7], bootChirp: [0,9,4],
    };
    const fx = Object.fromEntries(Object.entries(calls).map(([name, notes]) =>
      [name, () => s.phrase(notes, { gain: name === 'startle' ? .15 : .10, duration: .4 })]));
    return { ...s, ...fx,
      purrStart() { s.texture(true); },
      purrStop() { s.texture(false); },
      sleep() { s.phrase([4,0,-12], { kind: 'ep', gain: .07 }); s.sleep(true); },
      wake() { s.sleep(false); s.phrase([0,4,9], { gain: .11 }); },
      friendDuet() { s.phrase([4,7], { pan: -.3 }); s.phrase([9,12], { kind: 'ep', pan: .3, delay: .38 }); },
    };
  };
})();
