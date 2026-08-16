/* Instant cross-page model bridge. Load immediately after <body> with
   data-node-addr and data-node-name on the script element. */
(() => {
  try {
    const script = document.currentScript;
    const addr = script && script.dataset.nodeAddr;
    if (!addr || sessionStorage.getItem("mo_node_arrive") !== "1") return;
    if (sessionStorage.getItem("mo_node_addr") !== addr) return;

    const frame = sessionStorage.getItem("mo_node_seam");
    if (!frame) return;

    const seam = document.createElement("div");
    seam.id = "mo-seam";
    seam.setAttribute("aria-hidden", "true");
    seam.style.cssText = "position:fixed;inset:0;z-index:60;background:#04060d center center / cover no-repeat;transition:opacity .55s cubic-bezier(.16,1,.3,1);pointer-events:none";
    seam.style.backgroundImage = `url(${frame})`;

    const tag = document.createElement("div");
    tag.className = "mo-seam__tag";
    tag.textContent = (script.dataset.nodeName || addr).toUpperCase();
    seam.appendChild(tag);
    document.body.appendChild(seam);
  } catch (_) {}
})();
