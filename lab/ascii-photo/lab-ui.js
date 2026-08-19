/* ============================================================
   ASCII Photo Lab — UI controller
   Builds the terminal control panel, wires the AsciiPhoto engine,
   bracket cursor, pointer tracking, presets and image drop.
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("custom-cursor");

  const cv = document.getElementById("cv");
  const stage = document.getElementById("stage");
  const body = document.getElementById("body");
  const fpsEl = document.getElementById("fps");
  const hudMode = document.getElementById("hudMode");
  const hudGrid = document.getElementById("hudGrid");
  const hudSrc = document.getElementById("hudSrc");

  const fx = new AsciiPhoto(cv, { src: "wafer-sample.jpg" });
  window.__fx = fx;
  fx.onFps = (f) => { fpsEl.textContent = f + " FPS"; };
  fx.onReady = updateHud;

  // ---------- control builders ----------
  function section(label) {
    const s = document.createElement("div"); s.className = "sect";
    const l = document.createElement("div"); l.className = "sect__label"; l.textContent = label;
    s.appendChild(l); body.appendChild(s); return s;
  }
  function slider(parent, name, key, min, max, step, fmt) {
    const c = document.createElement("div"); c.className = "ctrl";
    const top = document.createElement("div"); top.className = "ctrl__top";
    const nm = document.createElement("span"); nm.className = "ctrl__name"; nm.textContent = name;
    const vv = document.createElement("span"); vv.className = "ctrl__val";
    const inp = document.createElement("input"); inp.type = "range";
    inp.min = min; inp.max = max; inp.step = step; inp.value = fx.o[key];
    const render = () => { vv.textContent = (fmt || ((v) => v))(parseFloat(inp.value)); };
    inp.addEventListener("input", () => {
      const v = parseFloat(inp.value); fx.set({ [key]: v }); render();
      if (key === "cell" || key === "cellAspect") updateHud();
    });
    top.appendChild(nm); top.appendChild(vv);
    c.appendChild(top); c.appendChild(inp); parent.appendChild(c);
    render();
    return { input: inp, render };
  }
  function seg(parent, name, key, options) {
    const c = document.createElement("div"); c.className = "ctrl";
    if (name) {
      const top = document.createElement("div"); top.className = "ctrl__top";
      const nm = document.createElement("span"); nm.className = "ctrl__name"; nm.textContent = name;
      top.appendChild(nm); c.appendChild(top);
    }
    const g = document.createElement("div"); g.className = "seg";
    const btns = [];
    options.forEach(([val, lab]) => {
      const b = document.createElement("button"); b.textContent = lab; b.dataset.val = val;
      if (fx.o[key] === val) b.classList.add("active");
      b.addEventListener("click", () => {
        fx.set({ [key]: val });
        btns.forEach((x) => x.classList.toggle("active", x.dataset.val === val));
        updateHud();
      });
      g.appendChild(b); btns.push(b);
    });
    c.appendChild(g); parent.appendChild(c);
    return { btns, sync: () => btns.forEach((x) => x.classList.toggle("active", x.dataset.val === fx.o[key])) };
  }

  // ---------- SOURCE / uploads ----------
  const srcWrap = document.createElement("div"); srcWrap.className = "sect";
  const srcLabel = document.createElement("div"); srcLabel.className = "sect__label"; srcLabel.textContent = "Source";
  srcWrap.appendChild(srcLabel);
  const gallery = document.createElement("div"); gallery.className = "gallery";
  srcWrap.appendChild(gallery);
  const fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = "image/*"; fileInput.multiple = true; fileInput.style.display = "none";
  srcWrap.appendChild(fileInput);
  body.appendChild(srcWrap);

  const sources = [{ url: "wafer-sample.jpg", name: "wafer-sample.jpg" }];
  let activeSrc = 0;

  function renderGallery() {
    gallery.innerHTML = "";
    sources.forEach((s, i) => {
      const t = document.createElement("button");
      t.className = "thumb" + (i === activeSrc ? " active" : "");
      t.style.backgroundImage = `url("${s.url}")`;
      t.title = s.name;
      const cap = document.createElement("span"); cap.className = "thumb__tag"; cap.textContent = "0x" + (i + 1).toString(16).padStart(2, "0").toUpperCase();
      t.appendChild(cap);
      t.addEventListener("click", () => selectSource(i));
      gallery.appendChild(t);
    });
    const add = document.createElement("button");
    add.className = "thumb thumb--add"; add.innerHTML = "<span>+</span>";
    add.title = "Upload photo(s)";
    add.addEventListener("click", () => fileInput.click());
    gallery.appendChild(add);
  }
  function selectSource(i) {
    activeSrc = i; fx.load(sources[i].url); fx.onReady = updateHud;
    hudSrc.textContent = sources[i].name; renderGallery();
  }
  function addFiles(files) {
    let firstNew = -1;
    [...files].forEach((f) => {
      if (!/^image\//.test(f.type)) return;
      const url = URL.createObjectURL(f);
      sources.push({ url, name: f.name });
      if (firstNew < 0) firstNew = sources.length - 1;
    });
    if (firstNew >= 0) selectSource(firstNew);
    else renderGallery();
  }
  fileInput.addEventListener("change", () => { if (fileInput.files.length) addFiles(fileInput.files); fileInput.value = ""; });
  renderGallery();

  // ---------- presets ----------
  const presetLabel = document.createElement("div"); presetLabel.className = "sect__label"; presetLabel.style.marginTop = "22px"; presetLabel.textContent = "Variants";
  body.appendChild(presetLabel);
  const presetWrap = document.createElement("div"); presetWrap.className = "presets";
  const presetBtns = {};
  let allControls = [];
  Object.keys(AsciiPhoto.PRESETS).forEach((id) => {
    const p = AsciiPhoto.PRESETS[id];
    const b = document.createElement("button"); b.className = "preset"; b.textContent = p.name;
    b.addEventListener("click", () => applyPreset(id));
    presetWrap.appendChild(b); presetBtns[id] = b;
  });
  body.appendChild(presetWrap);

  function applyPreset(id) {
    const p = Object.assign({}, AsciiPhoto.PRESETS[id]); delete p.name;
    fx.set(p);
    Object.keys(presetBtns).forEach((k) => presetBtns[k].classList.toggle("active", k === id));
    allControls.forEach((c) => c.refresh && c.refresh());
    updateHud();
  }

  // ---------- CONVERSION ----------
  const sConv = section("Conversion");
  const feelSeg = seg(sConv, "Feel", "feel", [["scan", "Scan-in"], ["dissolve", "Dissolve"]]);
  const colorSeg = seg(sConv, "Color", "color", [["mono", "Mono"], ["teal", "Teal"], ["full", "Full"]]);
  const spd = slider(sConv, "Speed", "speed", 0.3, 2.5, 0.1, (v) => v.toFixed(1) + "×");
  // whole-image convert button
  const convRow = document.createElement("div"); convRow.className = "btn-row";
  const convBtn = document.createElement("button"); convBtn.className = "btn primary";
  convBtn.textContent = "Convert all";
  convBtn.addEventListener("click", () => { const on = fx.toggleConvert(); reflectConvert(on); });
  convRow.appendChild(convBtn); sConv.appendChild(convRow);
  function reflectConvert(on) {
    convBtn.classList.toggle("on", on);
    convBtn.textContent = on ? "Restore photo" : "Convert all";
    cur.classList.toggle("is-locked", on);
  }

  // ---------- GLYPHS ----------
  const sG = section("Glyphs");
  const cellS = slider(sG, "Cell size", "cell", 8, 40, 1, (v) => v + "px");
  const ctr = slider(sG, "Contrast", "contrast", 0.6, 2.0, 0.05, (v) => v.toFixed(2));
  const gma = slider(sG, "Gamma", "gamma", 0.4, 2.2, 0.05, (v) => v.toFixed(2));
  // density-map invert (dark subject -> dense glyphs)
  const invC = document.createElement("div"); invC.className = "ctrl";
  const invTop = document.createElement("div"); invTop.className = "ctrl__top";
  const invNm = document.createElement("span"); invNm.className = "ctrl__name"; invNm.textContent = "Density map";
  invTop.appendChild(invNm); invC.appendChild(invTop);
  const invSeg = document.createElement("div"); invSeg.className = "seg";
  const invOpts = [[1, "Dark → dense"], [0, "Light → dense"]];
  const invBtns = [];
  invOpts.forEach(([val, lab]) => {
    const b = document.createElement("button"); b.textContent = lab; b.dataset.val = val;
    if (fx.o.invert === val) b.classList.add("active");
    b.addEventListener("click", () => { fx.set({ invert: val }); invBtns.forEach((x) => x.classList.toggle("active", +x.dataset.val === val)); });
    invSeg.appendChild(b); invBtns.push(b);
  });
  invC.appendChild(invSeg); sG.appendChild(invC);
  // ramp
  const rampC = document.createElement("div"); rampC.className = "ctrl";
  const rampTop = document.createElement("div"); rampTop.className = "ctrl__top";
  const rampNm = document.createElement("span"); rampNm.className = "ctrl__name"; rampNm.textContent = "Density ramp";
  const rampVal = document.createElement("span"); rampVal.className = "ctrl__val"; rampVal.textContent = fx.o.ramp.length + " steps";
  rampTop.appendChild(rampNm); rampTop.appendChild(rampVal);
  const rampInp = document.createElement("input"); rampInp.className = "ramp-input"; rampInp.value = fx.o.ramp; rampInp.spellcheck = false;
  rampInp.addEventListener("input", () => {
    const v = rampInp.value.length >= 2 ? rampInp.value : fx.o.ramp;
    fx.set({ ramp: v }); rampVal.textContent = v.length + " steps";
  });
  rampC.appendChild(rampTop); rampC.appendChild(rampInp); sG.appendChild(rampC);
  // ramp presets
  const rampRow = document.createElement("div"); rampRow.className = "btn-row";
  [[" ·:-=+*#%@", "system"], [" .:-=+*#%@", "classic"], [" .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$", "fine"], [" ░▒▓█", "blocks"]].forEach(([r, lab]) => {
    const b = document.createElement("button"); b.className = "btn"; b.textContent = lab;
    b.addEventListener("click", () => { rampInp.value = r; fx.set({ ramp: r }); rampVal.textContent = r.length + " steps"; });
    rampRow.appendChild(b);
  });
  sG.appendChild(rampRow);

  // ---------- LENS ----------
  const sL = section("Reveal lens");
  const lr = slider(sL, "Radius", "lensR", 0.06, 0.55, 0.01, (v) => Math.round(v * 100) + "%");
  const ls = slider(sL, "Softness", "lensSoft", 0, 0.95, 0.01, (v) => Math.round(v * 100) + "%");
  const lf = slider(sL, "Edge feather", "feather", 0, 1, 0.02, (v) => Math.round(v * 100) + "%");

  // ---------- GRADE ----------
  const sGr = section("Grade · Maslov path");
  const caModeSeg = seg(sGr, "CA origin", "caMode", [["center", "Center"], ["cursor", "Cursor"], ["velocity", "Velocity"], ["pulse", "Ripple"]]);
  const ca = slider(sGr, "Chromatic aberration · base", "ca", 0, 2, 0.02, (v) => v.toFixed(2));
  const caV = slider(sGr, "CA on move · velocity", "caVelocity", 0, 3, 0.05, (v) => v.toFixed(2) + "×");
  const scn = slider(sGr, "Scanlines", "scanlines", 0, 1, 0.02, (v) => Math.round(v * 100) + "%");
  const vig = slider(sGr, "Vignette", "vignette", 0, 1, 0.02, (v) => Math.round(v * 100) + "%");
  const caNote = document.createElement("div"); caNote.className = "note";
  caNote.innerHTML = '<span class="sig">Cursor</span> splits from the probed node · <span class="sig">Velocity</span> smears along motion · <span class="sig">Ripple</span> radiates continuous chromatic waves from the node. Base sits at rest; speed spikes it.';
  sGr.appendChild(caNote);

  // ---------- PERFORMANCE ----------
  const sP = section("Performance");
  const rsc = slider(sP, "Render scale", "renderScale", 0.4, 1, 0.05, (v) => Math.round(v * 100) + "%");
  const dprSeg = seg(sP, "Retina cap", "dprCap", [[1, "1×"], [2, "2× (sharp)"]]);
  // dprCap is numeric; seg compares with ===, patch its buttons to coerce
  dprSeg.btns.forEach((b) => {
    const nv = +b.dataset.val;
    b.classList.toggle("active", fx.o.dprCap === nv);
    b.onclick = () => { fx.set({ dprCap: nv }); dprSeg.btns.forEach((x) => x.classList.toggle("active", +x.dataset.val === nv)); };
  });
  const perfNote = document.createElement("div"); perfNote.className = "note";
  perfNote.innerHTML = 'On a slow laptop drop <span class="sig">render scale</span> to ~70% and retina cap to 1× — the glyph look hides the softness. Idle (no hover) costs nothing.';
  sP.appendChild(perfNote);

  const note = document.createElement("div"); note.className = "note";
  note.innerHTML = 'Hover the stage to sweep the lens. <span class="sig">Click</span> the photo to convert the whole frame. Drag any image onto the stage to test it.';
  body.appendChild(note);

  // refreshers: rebind each visible widget from fx.o after a preset is applied
  function refreshSliders() {
    const map = [[spd, "speed"], [cellS, "cell"], [ctr, "contrast"], [gma, "gamma"],
      [lr, "lensR"], [ls, "lensSoft"], [lf, "feather"], [ca, "ca"], [caV, "caVelocity"],
      [scn, "scanlines"], [vig, "vignette"], [rsc, "renderScale"]];
    map.forEach(([s, k]) => { s.input.value = fx.o[k]; s.render(); });
    rampInp.value = fx.o.ramp; rampVal.textContent = fx.o.ramp.length + " steps";
    feelSeg.sync(); colorSeg.sync();
    caModeSeg.sync();
    invBtns.forEach((x) => x.classList.toggle("active", +x.dataset.val === fx.o.invert));
  }
  allControls = [{ refresh: refreshSliders }];

  // ---------- HUD ----------
  function updateHud() {
    hudMode.textContent = (fx.o.feel === "scan" ? "SCAN-IN" : "DISSOLVE") + " · " + fx.o.color.toUpperCase();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cols = Math.round(cv.width / (fx.o.cell * dpr));
    const rows = Math.round(cv.height / (fx.o.cell * dpr * fx.o.cellAspect));
    hudGrid.textContent = cols + " × " + rows;
  }
  window.addEventListener("resize", () => setTimeout(updateHud, 60));

  // ---------- pointer + cursor ----------
  const cur = document.getElementById("cur");
  const curtag = document.getElementById("curtag");
  let overStage = false;
  function moveCursor(x, y) { cur.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; }
  window.addEventListener("pointermove", (e) => {
    moveCursor(e.clientX, e.clientY);
    const overControl = e.target.closest("input,button,.ramp-input,.seg,.preset,.btn");
    cur.classList.toggle("is-hot", !!overControl && !overStage);
  }, { passive: true });

  function stagePointer(e) {
    const r = cv.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width;
    const v = (e.clientY - r.top) / r.height;
    fx.setPointer(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    if (curtag) curtag.textContent = `x${u.toFixed(2)} y${v.toFixed(2)}`;
  }
  stage.addEventListener("pointerenter", () => { overStage = true; fx.setHover(true); cur.classList.add("is-probe"); });
  stage.addEventListener("pointerleave", () => { overStage = false; fx.setHover(false); cur.classList.remove("is-probe"); });
  stage.addEventListener("pointermove", stagePointer, { passive: true });
  // touch-drag = move lens (mobile behavior)
  stage.addEventListener("touchstart", () => { fx.setHover(true); }, { passive: true });
  stage.addEventListener("touchend", () => { fx.setHover(false); }, { passive: true });

  // click stage = toggle whole-image convert
  cv.addEventListener("click", () => { const on = fx.toggleConvert(); reflectConvert(on); });

  // ---------- image drop ----------
  ["dragenter", "dragover"].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); stage.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); if (ev === "drop" || e.target === stage) stage.classList.remove("dragover"); }));
  stage.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  // keyboard: space converts, number keys = variants
  const presetIds = Object.keys(AsciiPhoto.PRESETS);
  window.addEventListener("keydown", (e) => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.code === "Space") { e.preventDefault(); reflectConvert(fx.toggleConvert()); }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= presetIds.length) applyPreset(presetIds[n - 1]);
  });

  updateHud();
})();
