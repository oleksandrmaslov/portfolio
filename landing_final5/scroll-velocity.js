/* Shared motion signal for the universe and scroll-flight physics.
   It has no DOM, grade, reveal, or preloader-facing visual layer. */
(() => {
  "use strict";

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let lastY = window.scrollY || 0;
  let lastEvent = performance.now();
  let lastFrame = lastEvent;
  let velocity = 0;
  let raf = 0;

  window.__mo_vel = 0;
  if (reduced) return;

  const frame = (now) => {
    const dt = Math.min(64, now - lastFrame);
    lastFrame = now;
    velocity *= Math.exp(-5.5 * dt / 1000);
    if (velocity < 0.002) velocity = 0;
    window.__mo_vel = velocity;
    raf = velocity ? requestAnimationFrame(frame) : 0;
  };

  const onScroll = () => {
    const now = performance.now();
    const y = window.scrollY || window.pageYOffset || 0;
    const dt = Math.max(8, now - lastEvent);
    const impulse = Math.min(1.4, Math.abs(y - lastY) / (dt * 5.5));
    velocity = Math.max(velocity, impulse);
    window.__mo_vel = velocity;
    lastY = y;
    lastEvent = now;
    lastFrame = now;
    if (!raf) raf = requestAnimationFrame(frame);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pageshow", () => {
    lastY = window.scrollY || 0;
    velocity = 0;
    window.__mo_vel = 0;
  });
})();
