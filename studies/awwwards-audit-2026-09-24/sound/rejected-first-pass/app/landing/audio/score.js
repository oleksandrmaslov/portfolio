/* Section changes adjust the room's level. Selection has one cue, after dwell.
   Origin scoring comes from actual particle progress in the existing scene
   loop, so this file needs no poll, melody timer or secondary animation loop. */
(function () {
  "use strict";
  window.addEventListener("mo:section", e => {
    window.CarrierField.setSection(e.detail.section);
    window.MOSound.unhover();
  });
  window.addEventListener("mo:reelStop", e => {
    const addr = e.detail && e.detail.addr;
    if (addr) window.MOSound.hover(addr);
    else window.MOSound.unhover();
  });
  window.addEventListener("mo:nodeFlight", e => {
    const project = e.detail && e.detail.project;
    if (project) window.MOSound.open(project.addr);
  });
})();
