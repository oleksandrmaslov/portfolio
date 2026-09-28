/* Clear signal — the selected generative score, connected to the existing
   universe events. Instruments load only after the visitor enables sound. */
(function () {
  'use strict';
  const engine = new window.MOGenerativeField({
    direction: 'signal', nodes: (window.MO_PROJECTS || []).filter(p => p.universe !== false).map(p => p.addr),
  });
  window.__mo_audio = engine;
  let lastMove = 0, previous = null, active = false, assemblyTimer = null, focused = null;
  let reel = null, atEnd = false;
  function pointer(e) {
    const now = performance.now();
    if (now - lastMove < 55) return;
    if (previous) engine.motion(Math.min(1, Math.hypot(e.clientX - previous.x, e.clientY - previous.y) / Math.max(20, now - lastMove) / 2), e.clientX / innerWidth * 1.5 - .75);
    previous = { x: e.clientX, y: e.clientY }; lastMove = now;
  }
  function wheel(e) { engine.motion(Math.min(.7, Math.abs(e.deltaY) / 500), 0); }
  engine.onState(s => {
    if (s.running === active) return;
    active = s.running;
    if (active) {
      previous = null;
      addEventListener('pointermove', pointer, { passive: true });
      addEventListener('wheel', wheel, { passive: true });
      if (focused || reel) engine.focus(focused || reel);
      assemblyTimer = setInterval(() => {
        const d = window.__mo_debug || {};
        engine.assembly(d.mode === 'origin' ? d.formP || 0 : 0);
      }, 150);
    } else {
      removeEventListener('pointermove', pointer); removeEventListener('wheel', wheel);
      clearInterval(assemblyTimer); assemblyTimer = null;
    }
  });
  window.MOSound = {
    init: () => null, unlock: () => {},
    isMuted: () => !engine.intent, getVolume: () => engine.volume,
    toggleMute: () => engine.intent ? engine.stop() : engine.start(),
    carrier: on => { if (on && !engine.intent) engine.start(); else if (!on && engine.intent) engine.stop(); },
    onState: fn => engine.onState(s => fn({ muted: !s.intent, loading: s.loading, status: s.status, volume: s.volume })),
    getLevel: () => engine.level,
    hover: addr => { focused = addr; engine.focus(addr); },
    unhover: () => { focused = null; engine.blur(); },
    open: addr => engine.open(addr), gather: () => engine.gather(),
    thock: () => engine.motion(.04), thockUp: () => {},
    // The retired scroll-wind layer must not attach to the sampled score.
    get ctx() { return null; },
  };
  addEventListener('mo:section', e => {
    engine.section(e.detail?.section || 'title');
    window.__mo_disturb?.(innerWidth / 2, innerHeight * .5, .45);
  });
  addEventListener('mo:reelStop', e => {
    const addr = e.detail?.addr;
    if (addr !== reel) { reel = addr; if (addr) engine.focus(addr); else engine.blur(); }
    const end = e.detail?.stop >= (window.MO_FEATURED_ADDRS || []).length + 1;
    if (end && !atEnd) { engine.gather(); window.__mo_disturb?.(innerWidth / 2, innerHeight * .45, 1.15); }
    atEnd = end;
  });
})();
