/* ============================================================
   M.O. shared cursor distortion
   ------------------------------------------------------------
   A WebGL canvas cannot sample DOM pixels behind it. This module mirrors a
   deliberately bounded set of text nodes into WebGL, then applies the same
   cursor wake, screen-paint flow and ripple displacement everywhere.

   - createComposerEffect() plugs into Landing Final 5's existing composer.
   - mountStandalone() gives canonical project pages a transparent overlay.

   Textures are cached and used only as displacement silhouettes. Native DOM
   text remains visible at all times; project pages stop rendering the overlay
   when the trail is cold, so they do no idle draw work.
   ============================================================ */
(function cursorDistortionModule(global) {
  "use strict";

  const DEFAULT_SELECTOR = "[data-mo-cursor-mirror]";
  const RIPPLE_COUNT = 4;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function px(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  function canvasFont(style) {
    return [style.fontStyle, style.fontVariant, style.fontWeight, style.fontSize, style.fontFamily]
      .filter(Boolean).join(" ");
  }

  function transformedText(text, transform) {
    if (transform === "uppercase") return text.toUpperCase();
    if (transform === "lowercase") return text.toLowerCase();
    if (transform === "capitalize") return text.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
    return text;
  }

  function drawTrackedText(ctx, text, x, y, tracking, nativeTracking) {
    if (!tracking || nativeTracking) {
      ctx.fillText(text, x, y);
      return;
    }
    let pen = x;
    for (const glyph of Array.from(text)) {
      ctx.fillText(glyph, pen, y);
      pen += ctx.measureText(glyph).width + tracking;
    }
  }

  function createTextMirror(options) {
    const opts = options || {};
    const THREE = opts.THREE;
    if (!THREE || !THREE.Scene || !THREE.OrthographicCamera) return null;

    const selector = opts.selector || DEFAULT_SELECTOR;
    const alphaTag = opts.alphaTag !== false;
    let active = opts.active !== false;
    let viewportW = Math.max(1, opts.width || global.innerWidth || 1);
    let viewportH = Math.max(1, opts.height || global.innerHeight || 1);
    const pixelRatio = clamp(opts.pixelRatio || global.devicePixelRatio || 1, 1, 2);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, viewportW, 0, viewportH, 0, 2);
    camera.position.z = 1;

    const pass = THREE.RenderPass ? new THREE.RenderPass(scene, camera) : null;
    if (pass) {
      pass.clear = false;
      pass.clearDepth = false;
      pass.enabled = false;
    }

    let entries = [];
    let destroyed = false;
    let refreshRaf = 0;
    let hiddenFrames = 0;
    let needsSync = true;
    const styleCache = new Map();
    const observer = global.IntersectionObserver
      ? new global.IntersectionObserver((changes) => {
          changes.forEach((change) => {
            const entry = entries.find((candidate) => candidate.element === change.target);
            if (entry) entry.near = change.isIntersecting;
          });
        }, { root: null, rootMargin: "240px 0px", threshold: 0 })
      : null;
    // Observe only opted-in elements. A document-wide observer would also see
    // the animated ASCII field and turn its frequent DOM updates into needless
    // mirror work.
    const contentObserver = global.MutationObserver
      ? new global.MutationObserver(scheduleRefresh)
      : null;

    function disposeEntry(entry) {
      if (observer) observer.unobserve(entry.element);
      scene.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      entry.material.dispose();
      entry.texture.dispose();
    }

    function drawRun(ctx, text, rect, targetRect, style) {
      if (!text || !rect.width || !rect.height) return;
      const output = transformedText(text, style.textTransform);
      ctx.font = canvasFont(style);
      ctx.fillStyle = style.color;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const tracking = style.letterSpacing === "normal" ? 0 : px(style.letterSpacing);
      let nativeTracking = false;
      if ("letterSpacing" in ctx) {
        try {
          ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
          nativeTracking = true;
        } catch (_) {}
      }
      if ("fontKerning" in ctx) {
        try {
          const kerning = style.fontKerning;
          if (kerning === "auto" || kerning === "normal" || kerning === "none") {
            ctx.fontKerning = kerning;
          }
        } catch (_) {}
      }
      if ("fontStretch" in ctx && style.fontStretch) {
        // Chromium exposes computed stretch as percentages (usually "100%"),
        // while CanvasFontStretch accepts keywords only. Invalid assignments
        // emit one console warning per painted word and are ignored anyway.
        const stretch = style.fontStretch;
        if (/^(ultra-condensed|extra-condensed|condensed|semi-condensed|normal|semi-expanded|expanded|extra-expanded|ultra-expanded)$/.test(stretch)) {
          try { ctx.fontStretch = stretch; } catch (_) {}
        }
      }
      const metrics = ctx.measureText(output);
      const glyphCount = Array.from(output).length;
      const naturalWidth = metrics.width
        + (nativeTracking ? 0 : tracking * Math.max(0, glyphCount - 1));
      // Range rects include ancestor transforms while computed font sizes do
      // not. Matching the browser run width keeps scaled Board Flight copy and
      // ordinary text on the same baseline without rasterizing whole sections.
      const runScaleX = naturalWidth > 0.01 ? clamp(rect.width / naturalWidth, 0.75, 1.25) : 1;
      const fontSize = px(style.fontSize);
      // Unlike glyph bounds, font bounds do not shift between words such as
      // "AY" and "gg", so every run on a line shares a stable baseline.
      const ascent = metrics.fontBoundingBoxAscent || fontSize * 0.78;
      const descent = metrics.fontBoundingBoxDescent || fontSize * 0.22;
      const x = rect.left - targetRect.left;
      const y = rect.top - targetRect.top
        + (rect.height - (ascent + descent)) * 0.5
        + ascent;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(runScaleX, 1);
      drawTrackedText(ctx, output, 0, 0, tracking, nativeTracking);
      ctx.restore();
    }

    // Paint each word at its live Range rect. This keeps wrapped project copy
    // aligned without capturing the page or uploading a full-page texture.
    function paintTextNode(ctx, node, targetRect) {
      const raw = node.nodeValue || "";
      if (!raw.trim()) return;
      const owner = node.parentElement;
      if (!owner) return;
      const style = global.getComputedStyle(owner);
      if (style.display === "none" || style.visibility === "hidden") return;

      const range = document.createRange();
      const words = /\S+/g;
      let match;
      while ((match = words.exec(raw))) {
        const start = match.index;
        const end = start + match[0].length;
        range.setStart(node, start);
        range.setEnd(node, end);
        const rects = Array.from(range.getClientRects()).filter((rect) => rect.width && rect.height);
        if (rects.length === 1) {
          drawRun(ctx, match[0], rects[0], targetRect, style);
          continue;
        }
        let offset = start;
        for (const glyph of Array.from(match[0])) {
          const next = offset + glyph.length;
          range.setStart(node, offset);
          range.setEnd(node, next);
          drawRun(ctx, glyph, range.getBoundingClientRect(), targetRect, style);
          offset = next;
        }
      }
      if (range.detach) range.detach();
    }

    function makeEntry(element) {
      const rect = element.getBoundingClientRect();
      const style = global.getComputedStyle(element);
      if (!rect.width || !rect.height || style.display === "none") return null;

      // Leave room for italic overhangs, antialiasing and a displaced fringe.
      // The plane remains centred on the DOM box, so this does not move text.
      const padding = clamp(Math.ceil(Math.max(12, px(style.fontSize) * 0.35)), 12, 48);
      const paddedWidth = rect.width + padding * 2;
      const paddedHeight = rect.height + padding * 2;
      const paintRect = { left: rect.left - padding, top: rect.top - padding };
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(paddedWidth * pixelRatio));
      canvas.height = Math.max(1, Math.ceil(paddedHeight * pixelRatio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.scale(pixelRatio, pixelRatio);

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        paintTextNode(ctx, node, paintRect);
        node = walker.nextNode();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const materialOptions = {
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      };
      if (alphaTag) {
        Object.assign(materialOptions, {
          blending: THREE.CustomBlending,
          blendEquation: THREE.AddEquation,
          // Preserve the composer's destination RGB. Only destination alpha is
          // tagged: opaque text coverage turns alpha from 1 toward 0.
          blendSrc: THREE.ZeroFactor,
          blendDst: THREE.OneFactor,
          blendEquationAlpha: THREE.AddEquation,
          blendSrcAlpha: THREE.ZeroFactor,
          blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        });
      }
      const material = new THREE.MeshBasicMaterial(materialOptions);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      mesh.visible = false;
      scene.add(mesh);

      const opacityElements = [];
      const opacitySelectors = (element.getAttribute("data-mo-cursor-opacity") || "")
        .split(",").map((value) => value.trim()).filter(Boolean);
      opacitySelectors.forEach((opacitySelector) => {
        const owner = element.closest(opacitySelector);
        if (owner && owner !== element && !opacityElements.includes(owner)) opacityElements.push(owner);
      });

      const baseOpacity = parseFloat(style.opacity);
      const entry = {
        element,
        mesh,
        material,
        texture,
        opacityElements,
        baseOpacity: Number.isFinite(baseOpacity) ? baseOpacity : 1,
        captureWidth: rect.width,
        captureHeight: rect.height,
        padding,
        near: rect.bottom >= -240 && rect.top <= viewportH + 240,
      };
      if (observer) observer.observe(element);
      if (contentObserver) {
        contentObserver.observe(element, { subtree: true, childList: true, characterData: true });
      }
      return entry;
    }

    function refreshNow() {
      refreshRaf = 0;
      if (destroyed) return;
      if (contentObserver) contentObserver.disconnect();
      entries.forEach(disposeEntry);
      entries = [];
      document.querySelectorAll(selector).forEach((element) => {
        const entry = makeEntry(element);
        if (entry) entries.push(entry);
      });
      needsSync = true;
      if (!active) update(true);
      else if (pass) pass.enabled = false;
    }

    function scheduleRefresh() {
      if (destroyed || refreshRaf) return;
      refreshRaf = global.requestAnimationFrame(refreshNow);
    }

    function resize(width, height) {
      viewportW = Math.max(1, width || 1);
      viewportH = Math.max(1, height || 1);
      camera.right = viewportW;
      camera.bottom = viewportH;
      camera.updateProjectionMatrix();
      scheduleRefresh();
    }

    function update(force) {
      if (destroyed || !entries.length) {
        if (pass) pass.enabled = false;
        return false;
      }
      if (!active) {
        entries.forEach((entry) => {
          entry.mesh.visible = false;
        });
        if (pass) pass.enabled = false;
        return false;
      }
      if (!force && !needsSync && pass && !pass.enabled && ++hiddenFrames < 6) return false;
      hiddenFrames = 0;
      styleCache.clear();
      const readStyle = (element) => {
        if (!styleCache.has(element)) styleCache.set(element, global.getComputedStyle(element));
        return styleCache.get(element);
      };

      let anyVisible = false;
      entries.forEach((entry) => {
        if (!entry.near) {
          entry.mesh.visible = false;
          return;
        }
        const rect = entry.element.getBoundingClientRect();
        const ownStyle = readStyle(entry.element);
        const ownOpacity = parseFloat(ownStyle.opacity);
        let opacity = Number.isFinite(ownOpacity) ? ownOpacity : entry.baseOpacity;
        let filtered = false;
        entry.opacityElements.forEach((element) => {
          const style = readStyle(element);
          const value = parseFloat(style.opacity);
          if (Number.isFinite(value)) opacity *= value;
          const blur = /blur\(([-\d.]+)px\)/.exec(style.filter || "");
          if (blur && Math.abs(parseFloat(blur[1])) > 0.05) filtered = true;
        });
        const inViewport = rect.right > 0 && rect.left < viewportW
          && rect.bottom > 0 && rect.top < viewportH;
        const visible = inViewport && rect.width > 0 && rect.height > 0
          && ownStyle.display !== "none" && ownStyle.visibility !== "hidden"
          && opacity > 0.002;
        entry.mesh.visible = visible && !filtered;
        if (!entry.mesh.visible) return;
        anyVisible = true;
        entry.mesh.position.set(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 0);
        const scaleX = rect.width / entry.captureWidth;
        const scaleY = rect.height / entry.captureHeight;
        entry.mesh.scale.set(
          rect.width + entry.padding * 2 * scaleX,
          rect.height + entry.padding * 2 * scaleY,
          1
        );
        entry.material.opacity = clamp(opacity, 0, 1);
      });
      if (pass) pass.enabled = anyVisible;
      needsSync = false;
      return anyVisible;
    }

    function setActive(next) {
      active = !!next;
      hiddenFrames = 0;
      update(true);
    }

    function onContentReady() { scheduleRefresh(); }
    global.addEventListener("mo:title-ready", onContentReady);
    global.addEventListener("mo:cursor-mirror-refresh", onContentReady);
    scheduleRefresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRefresh).catch(() => {});

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (refreshRaf) global.cancelAnimationFrame(refreshRaf);
      global.removeEventListener("mo:title-ready", onContentReady);
      global.removeEventListener("mo:cursor-mirror-refresh", onContentReady);
      if (observer) observer.disconnect();
      if (contentObserver) contentObserver.disconnect();
      entries.forEach(disposeEntry);
      entries = [];
      styleCache.clear();
      if (pass) pass.enabled = false;
    }

    return { pass, scene, camera, update, resize, refresh: scheduleRefresh, setActive, destroy };
  }

  function effectUniforms(THREE, width, height, grade) {
    const values = grade || {};
    return {
      tDiffuse:  { value: null },
      uAberr:    { value: values.aberration || 0 },
      uVignette: { value: values.vignette || 0 },
      uGrain:    { value: values.grain || 0 },
      uTime:     { value: 0 },
      uAspect:   { value: Math.max(1, width || 1) / Math.max(1, height || 1) },
      uR0:       { value: new THREE.Vector4(0.5, 0.5, 2, 0) },
      uR1:       { value: new THREE.Vector4(0.5, 0.5, 2, 0) },
      uR2:       { value: new THREE.Vector4(0.5, 0.5, 2, 0) },
      uR3:       { value: new THREE.Vector4(0.5, 0.5, 2, 0) },
      uWake:     { value: new THREE.Vector4(0.5, 0.5, 0, 30) },
      uPaint:    { value: null },
      uPaintK:   { value: 1 },
    };
  }

  const EFFECT_VERTEX = `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `;

  const COMBINED_FRAGMENT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uAberr, uVignette, uGrain, uTime, uAspect;
    uniform vec4 uR0, uR1, uR2, uR3;
    uniform vec4 uWake;
    uniform sampler2D uPaint;
    uniform float uPaintK;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    vec2 rippleDisp(vec2 uv, vec4 R){
      if (R.w <= 0.001 || R.z >= 1.0) return vec2(0.0);
      vec2 d = (uv - R.xy) * vec2(uAspect, 1.0);
      float r = length(d);
      float wave = r - R.z * 0.62;
      float band = exp(-wave * wave * 240.0);
      float fade = (1.0 - R.z) * (1.0 - R.z);
      vec2 dir = r > 0.0001 ? d / r : vec2(0.0);
      return (dir * band * R.w * fade * 0.016) / vec2(uAspect, 1.0);
    }
    void main(){
      vec2 uv = vUv;
      vec2 wd = (uv - uWake.xy) * vec2(uAspect, 1.0);
      float wk = exp(-dot(wd, wd) * uWake.w) * uWake.z;
      uv -= (wd / vec2(uAspect, 1.0)) * wk * 0.05;
      vec4 pnt = texture2D(uPaint, uv);
      vec2 pVel = (pnt.xy - 0.5) * 2.0;
      float pAmt = min(1.0, pnt.z) * uPaintK;
      uv -= pVel * pAmt * 0.085;
      vec2 disp = rippleDisp(uv, uR0) + rippleDisp(uv, uR1)
                + rippleDisp(uv, uR2) + rippleDisp(uv, uR3);
      uv += disp;
      float dAmt = length(disp);
      vec2 d = uv - 0.5;
      float r2 = dot(d, d);
      vec2 dir = d * (uAberr * (0.35 + r2 * 2.0)) + disp * 0.55 + pVel * pAmt * 0.012;
      vec4 pxR = texture2D(tDiffuse, uv + dir);
      vec4 pxC = texture2D(tDiffuse, uv);
      vec4 pxB = texture2D(tDiffuse, uv - dir);
      vec3 col = vec3(pxR.r, pxC.g, pxB.b);
      vec3 cursorLift = vec3(0.0, 0.94, 0.78) * (dAmt * 7.5 + wk * 0.10 + pAmt * 0.045);
      col += cursorLift;
      vec2 vd = d * vec2(uAspect, 1.0);
      float vig = smoothstep(0.85, 0.30, length(vd));
      col *= mix(1.0, vig, uVignette);
      float g = hash(uv * vec2(uAspect,1.0) * 900.0 + uTime) - 0.5;
      col += g * uGrain;
      // The mirror leaves RGB untouched and stores inverse text coverage in
      // alpha. Add only coverage newly revealed by displacement; native DOM
      // remains the undisturbed body of every glyph above this canvas.
      float baseCoverage = clamp(1.0 - texture2D(tDiffuse, vUv).a, 0.0, 1.0);
      float warpedCoverage = clamp(1.0 - pxC.a, 0.0, 1.0);
      float fringe = min(max(warpedCoverage - baseCoverage, 0.0) * 0.72, 0.42);
      col += vec3(0.0, 0.94, 0.78) * fringe;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const STANDALONE_FRAGMENT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform vec4 uR0, uR1, uR2, uR3;
    uniform vec4 uWake;
    uniform sampler2D uPaint;
    uniform float uPaintK;
    vec2 rippleDisp(vec2 uv, vec4 R){
      if (R.w <= 0.001 || R.z >= 1.0) return vec2(0.0);
      vec2 d = (uv - R.xy) * vec2(uAspect, 1.0);
      float r = length(d);
      float wave = r - R.z * 0.62;
      float band = exp(-wave * wave * 240.0);
      float fade = (1.0 - R.z) * (1.0 - R.z);
      vec2 dir = r > 0.0001 ? d / r : vec2(0.0);
      return (dir * band * R.w * fade * 0.016) / vec2(uAspect, 1.0);
    }
    void main(){
      vec2 uv = vUv;
      vec2 wd = (uv - uWake.xy) * vec2(uAspect, 1.0);
      float wk = exp(-dot(wd, wd) * uWake.w) * uWake.z;
      uv -= (wd / vec2(uAspect, 1.0)) * wk * 0.05;
      vec4 pnt = texture2D(uPaint, uv);
      vec2 pVel = (pnt.xy - 0.5) * 2.0;
      float pAmt = min(1.0, pnt.z) * uPaintK;
      uv -= pVel * pAmt * 0.085;
      vec2 disp = rippleDisp(uv, uR0) + rippleDisp(uv, uR1)
                + rippleDisp(uv, uR2) + rippleDisp(uv, uR3);
      uv += disp;
      float baseCoverage = clamp(texture2D(tDiffuse, vUv).a, 0.0, 1.0);
      float warpedCoverage = clamp(texture2D(tDiffuse, uv).a, 0.0, 1.0);
      float fringe = min(max(warpedCoverage - baseCoverage, 0.0) * 0.72, 0.42);
      gl_FragColor = vec4(vec3(0.0, 0.94, 0.78), fringe);
      #include <colorspace_fragment>
    }
  `;

  const PAINT_VERTEX = `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `;

  const PAINT_FRAGMENT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPrev;
    uniform vec2 uTexel, uVel, uDiss, uCurl;
    uniform vec3 uFrom, uTo;
    uniform float uPush, uAdd;
    vec2 sdSegment(vec2 p, vec2 a, vec2 b){
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
      return vec2(length(pa - ba * h), h);
    }
    vec2 hash(vec2 p){
      vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
    }
    vec3 noised(in vec2 p){
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
      vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);
      vec2 ga = hash(i); vec2 gb = hash(i+vec2(1,0));
      vec2 gc = hash(i+vec2(0,1)); vec2 gd = hash(i+vec2(1,1));
      float va = dot(ga,f), vb = dot(gb,f-vec2(1,0));
      float vc = dot(gc,f-vec2(0,1)), vd = dot(gd,f-vec2(1,1));
      return vec3(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*(va-vb-vc+vd),
                  ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)
                  +du*(u.yx*(va-vb-vc+vd)+vec2(vb,vc)-va));
    }
    void main(){
      vec2 px = vUv / uTexel;
      vec2 seg = sdSegment(px, uFrom.xy, uTo.xy);
      float rad = mix(uFrom.z, uTo.z, seg.y);
      float d = 1.0 - smoothstep(0.0, max(rad, 1.0), seg.x);
      vec4 low = texture2D(uPrev, vUv);
      vec2 velInv = (0.5 - low.xy) * uPush;
      vec3 n3 = noised(px * uCurl.x);
      velInv += n3.yz * low.z * uCurl.y;
      vec4 data = texture2D(uPrev, vUv + velInv * uTexel);
      data.xy -= 0.5;
      data.xy *= uDiss.x;
      data.z  *= uDiss.y;
      data.xy += uVel * d;
      data.z = min(1.0, data.z + d * uAdd);
      if (data.z < 0.004) { data.z = 0.0; data.xy *= 0.5; }
      data.xy = clamp(data.xy, -0.5, 0.5);
      gl_FragColor = vec4(data.xy + 0.5, data.z, 1.0);
    }
  `;

  function createCursorCore(options) {
    const THREE = options.THREE;
    const renderer = options.renderer;
    const uniforms = options.uniforms;
    const onEnergy = typeof options.onEnergy === "function" ? options.onEnergy : null;
    const chainPrevious = options.chainPrevious === true;
    const paintCfg = (global.__mo_paintCfg = Object.assign({
      push: 18, dissV: 0.984, dissA: 0.945, curlScale: 0.16, curlStrength: 1.6, radius: 0.085,
    }, global.__mo_paintCfg || {}));
    global.__mo_fx = Object.assign({ ripple: 1, topology: 1 }, global.__mo_fx || {});

    const ripples = Array.from({ length: RIPPLE_COUNT }, () => ({
      x: 0.5, y: 0.5, t0: -1, dur: 900, str: 0,
    }));
    let rippleNext = 0;
    const wake = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5, v: 0, sv: 0, lx: 0, ly: 0, lt: 0 };
    const pointerPaint = { x: -1, y: -1, has: false };
    let paintA = null, paintB = null, paintScene = null, paintCamera = null;
    let paintMaterial = null, paintMesh = null, paintEnergy = 0, paintOK = false, destroyed = false;

    const neutralTexture = new THREE.DataTexture(new Uint8Array([128, 128, 0, 255]), 1, 1, THREE.RGBAFormat);
    neutralTexture.needsUpdate = true;
    uniforms.uPaint.value = neutralTexture;
    const paintWidth = () => Math.max(64, Math.floor((global.innerWidth || 1) / 8));
    const paintHeight = () => Math.max(36, Math.floor((global.innerHeight || 1) / 8));

    try {
      const width = paintWidth();
      const height = paintHeight();
      const targetOptions = {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
        depthBuffer: false, stencilBuffer: false,
        type: renderer.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType,
      };
      paintA = new THREE.WebGLRenderTarget(width, height, targetOptions);
      paintB = new THREE.WebGLRenderTarget(width, height, targetOptions);
      paintMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uPrev:  { value: paintA.texture },
          uTexel: { value: new THREE.Vector2(1 / width, 1 / height) },
          uFrom:  { value: new THREE.Vector3(0, 0, 0) },
          uTo:    { value: new THREE.Vector3(0, 0, 0) },
          uVel:   { value: new THREE.Vector2(0, 0) },
          uAdd:   { value: 0 },
          uDiss:  { value: new THREE.Vector2(paintCfg.dissV, paintCfg.dissA) },
          uPush:  { value: paintCfg.push },
          uCurl:  { value: new THREE.Vector2(paintCfg.curlScale, paintCfg.curlStrength) },
        },
        vertexShader: PAINT_VERTEX, fragmentShader: PAINT_FRAGMENT,
        depthTest: false, depthWrite: false,
      });
      paintScene = new THREE.Scene();
      paintCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      paintMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paintMaterial);
      paintScene.add(paintMesh);
      uniforms.uPaint.value = paintA.texture;
      paintOK = true;
      clearPaintTargets();
    } catch (error) {
      console.warn("[cursor-distortion] screen paint unavailable", error);
    }

    const previousDisturb = global.__mo_disturb;
    function disturb(clientX, clientY, strength) {
      if (destroyed) return;
      const scale = global.__mo_fx.ripple != null ? global.__mo_fx.ripple : 1;
      const amount = (strength == null ? 0.5 : strength) * scale;
      if (amount <= 0.001) return;
      const ripple = ripples[rippleNext++ % ripples.length];
      ripple.x = clientX / Math.max(1, global.innerWidth || 1);
      ripple.y = 1 - clientY / Math.max(1, global.innerHeight || 1);
      ripple.t0 = performance.now();
      ripple.dur = 800 + 700 * Math.min(1.5, amount);
      ripple.str = Math.min(1.6, amount);
      const previousAlive = typeof previousDisturb === "function"
        && (!previousDisturb.__moCursorAlive || previousDisturb.__moCursorAlive());
      if (chainPrevious && previousAlive && previousDisturb !== disturb) {
        previousDisturb(clientX, clientY, strength);
      }
      if (onEnergy) onEnergy();
    }
    disturb.__moCursorAlive = () => !destroyed;
    global.__mo_disturb = disturb;

    function onWakeMove(event) {
      const now = performance.now();
      const elapsed = Math.max(16, now - wake.lt);
      const vx = (event.clientX - wake.lx) / elapsed;
      const vy = (event.clientY - wake.ly) / elapsed;
      wake.lx = event.clientX;
      wake.ly = event.clientY;
      wake.lt = now;
      wake.x = event.clientX / Math.max(1, global.innerWidth || 1);
      wake.y = event.clientY / Math.max(1, global.innerHeight || 1);
      wake.v = Math.min(1, Math.hypot(vx, vy) * 0.9);
      if (onEnergy) onEnergy();
    }
    global.addEventListener("pointermove", onWakeMove, { passive: true });

    function clearPaintTargets() {
      if (!paintA || !paintB) return;
      const previousTarget = renderer.getRenderTarget();
      const previousColor = new THREE.Color();
      renderer.getClearColor(previousColor);
      const previousAlpha = renderer.getClearAlpha();
      // Velocity is stored 0.5-centred in RG; amount is zero in B.
      renderer.setClearColor(new THREE.Color(0.5, 0.5, 0), 1);
      renderer.setRenderTarget(paintA);
      renderer.clear(true, false, false);
      renderer.setRenderTarget(paintB);
      renderer.clear(true, false, false);
      renderer.setRenderTarget(previousTarget);
      renderer.setClearColor(previousColor, previousAlpha);
      uniforms.uPaint.value = paintA.texture;
    }

    function resize() {
      if (!paintOK) return;
      const width = paintWidth(), height = paintHeight();
      paintA.setSize(width, height);
      paintB.setSize(width, height);
      paintMaterial.uniforms.uTexel.value.set(1 / width, 1 / height);
      pointerPaint.has = false;
      paintEnergy = 0;
      clearPaintTargets();
    }

    function updatePaint() {
      if (!paintOK) return;
      const width = paintA.width, height = paintA.height;
      const cx = (wake.lx / Math.max(1, global.innerWidth || 1)) * width;
      const cy = (1 - wake.ly / Math.max(1, global.innerHeight || 1)) * height;
      if (!pointerPaint.has) {
        pointerPaint.x = cx; pointerPaint.y = cy; pointerPaint.has = true;
      }
      const dx = cx - pointerPaint.x, dy = cy - pointerPaint.y;
      const moved = Math.hypot(dx, dy);
      if (moved > 0.3) paintEnergy = 1;
      else paintEnergy *= paintCfg.dissA;
      if (paintEnergy < 0.002) {
        pointerPaint.x = cx; pointerPaint.y = cy;
        return;
      }
      const paintUniforms = paintMaterial.uniforms;
      const minDimension = Math.min(width, height);
      const radius = minDimension * (paintCfg.radius * (
        0.55 + Math.min(1, moved / (minDimension * 0.5)) * 0.85
      ));
      paintUniforms.uFrom.value.set(pointerPaint.x, pointerPaint.y, radius);
      paintUniforms.uTo.value.set(cx, cy, radius);
      paintUniforms.uAdd.value = Math.min(1, moved / (minDimension * 0.10));
      paintUniforms.uVel.value.set(clamp(dx * 0.035, -0.45, 0.45), clamp(dy * 0.035, -0.45, 0.45));
      paintUniforms.uPrev.value = paintA.texture;
      const previousTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(paintB);
      renderer.render(paintScene, paintCamera);
      renderer.setRenderTarget(previousTarget);
      const swap = paintA; paintA = paintB; paintB = swap;
      uniforms.uPaint.value = paintA.texture;
      pointerPaint.x = cx; pointerPaint.y = cy;
    }

    function update(now, dt, grade) {
      const values = grade || {};
      uniforms.uTime.value = (now % 100000) * 0.001;
      if (Number.isFinite(values.aberration)) uniforms.uAberr.value = values.aberration;
      if (Number.isFinite(values.vignette)) uniforms.uVignette.value = values.vignette;
      if (Number.isFinite(values.grain)) uniforms.uGrain.value = values.grain;
      for (let index = 0; index < RIPPLE_COUNT; index++) {
        const ripple = ripples[index];
        const progress = ripple.t0 > 0 ? (now - ripple.t0) / ripple.dur : 2;
        uniforms["uR" + index].value.set(ripple.x, ripple.y, Math.min(1, progress), progress >= 1 ? 0 : ripple.str);
      }
      const wakePositionK = 1 - Math.pow(0.80, dt / 16);
      wake.sx += (wake.x - wake.sx) * wakePositionK;
      wake.sy += (wake.y - wake.sy) * wakePositionK;
      wake.sv += (wake.v - wake.sv) * (1 - Math.pow(0.86, dt / 16));
      wake.v *= Math.pow(0.92, dt / 16);
      const effectScale = global.__mo_fx.ripple != null ? global.__mo_fx.ripple : 1;
      uniforms.uWake.value.set(wake.sx, 1 - wake.sy, wake.sv * 0.42 * effectScale, 30);
      uniforms.uPaintK.value = effectScale;
      updatePaint();
    }

    function isHot(now) {
      if (wake.v > 0.001 || wake.sv > 0.0015 || paintEnergy >= 0.002) return true;
      return ripples.some((ripple) => ripple.t0 > 0 && (now - ripple.t0) < ripple.dur);
    }

    function reset() {
      wake.v = 0; wake.sv = 0; paintEnergy = 0; pointerPaint.has = false;
      ripples.forEach((ripple) => { ripple.t0 = -1; ripple.str = 0; });
      if (!paintOK) return;
      clearPaintTargets();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      global.removeEventListener("pointermove", onWakeMove);
      if (global.__mo_disturb === disturb) {
        const previousAlive = typeof previousDisturb === "function"
          && (!previousDisturb.__moCursorAlive || previousDisturb.__moCursorAlive());
        if (previousAlive) global.__mo_disturb = previousDisturb;
        else delete global.__mo_disturb;
      }
      if (paintA) paintA.dispose();
      if (paintB) paintB.dispose();
      if (paintMaterial) paintMaterial.dispose();
      if (paintMesh) paintMesh.geometry.dispose();
      neutralTexture.dispose();
    }

    return { update, resize, disturb, isHot, reset, destroy };
  }

  function createComposerEffect(options) {
    const opts = options || {};
    const THREE = opts.THREE;
    if (!THREE || !THREE.ShaderPass || !opts.renderer) return null;
    const width = Math.max(1, opts.width || global.innerWidth || 1);
    const height = Math.max(1, opts.height || global.innerHeight || 1);
    const shader = {
      uniforms: effectUniforms(THREE, width, height, opts.grade),
      vertexShader: EFFECT_VERTEX,
      fragmentShader: COMBINED_FRAGMENT,
    };
    const effectPass = new THREE.ShaderPass(shader);
    const mirror = createTextMirror({
      THREE, selector: opts.selector || DEFAULT_SELECTOR, width, height,
      pixelRatio: opts.pixelRatio, alphaTag: true, active: false,
    });
    const core = createCursorCore({ THREE, renderer: opts.renderer, uniforms: effectPass.uniforms });
    let destroyed = false, mirrorLive = false;
    function update(now, dt, grade) {
      if (destroyed) return;
      core.update(now, dt, grade);
      if (!mirror) return;
      if (core.isHot(now)) {
        if (!mirrorLive) {
          mirror.setActive(true);
          mirrorLive = true;
        } else {
          mirror.update();
        }
      } else if (mirrorLive) {
        mirror.setActive(false);
        mirrorLive = false;
      }
    }
    function resize(nextWidth, nextHeight) {
      if (destroyed) return;
      const safeWidth = Math.max(1, nextWidth || 1), safeHeight = Math.max(1, nextHeight || 1);
      effectPass.uniforms.uAspect.value = safeWidth / safeHeight;
      core.resize();
      if (mirror) mirror.resize(safeWidth, safeHeight);
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      core.destroy();
      if (mirror) mirror.destroy();
      if (effectPass.dispose) effectPass.dispose();
    }
    return {
      mirrorPass: mirror && mirror.pass, effectPass, update, resize,
      disturb: core.disturb,
      refresh: mirror ? mirror.refresh : function noop() {},
      destroy,
    };
  }

  function mountStandalone(options) {
    const opts = options || {};
    const THREE = opts.THREE;
    if (!THREE || !document.body) return null;

    let renderer = null, mirror = null, sourceTarget = null, material = null;
    let screenScene = null, screenCamera = null, screenMesh = null, core = null;
    let destroyed = false, contextLost = false, active = false, mirrorLive = false, raf = 0;
    let last = performance.now();
    const disabledClasses = Array.isArray(opts.disabledClasses) ? opts.disabledClasses : [];
    const disabledWhen = typeof opts.disabledWhen === "function" ? opts.disabledWhen : null;
    const useScreenBlend = !!(global.CSS && global.CSS.supports
      && global.CSS.supports("mix-blend-mode", "screen"));
    // Screen blending is the fail-safe that guarantees the overlay can only
    // brighten native pixels. If it is unavailable, leave the page untouched.
    if (!useScreenBlend) return null;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true, premultipliedAlpha: false,
        antialias: false, depth: false, stencil: false, powerPreference: "low-power",
      });
      const dpr = Math.max(0.5, Math.min(global.devicePixelRatio || 1, opts.dprCap || 1));
      renderer.setPixelRatio(dpr);
      renderer.setSize(global.innerWidth || 1, global.innerHeight || 1, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      canvas.setAttribute("data-mo-cursor-surface", "project");
      Object.assign(canvas.style, {
        position: "fixed", inset: "0", width: "100%", height: "100%",
        pointerEvents: "none", mixBlendMode: useScreenBlend ? "screen" : "normal",
        zIndex: String(opts.zIndex == null ? 20 : opts.zIndex), display: "none",
      });
      document.body.appendChild(canvas);

      const width = Math.max(1, global.innerWidth || 1), height = Math.max(1, global.innerHeight || 1);
      sourceTarget = new THREE.WebGLRenderTarget(
        Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)), {
          minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
          depthBuffer: false, stencilBuffer: false,
        }
      );
      mirror = createTextMirror({
        THREE, selector: opts.selector || DEFAULT_SELECTOR, width, height,
        pixelRatio: dpr, alphaTag: false, active: false,
      });
      if (!mirror) throw new Error("text mirror unavailable");
      const uniforms = effectUniforms(THREE, width, height, {});
      uniforms.tDiffuse.value = sourceTarget.texture;
      material = new THREE.ShaderMaterial({
        uniforms, vertexShader: EFFECT_VERTEX, fragmentShader: STANDALONE_FRAGMENT,
        transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
      });
      screenScene = new THREE.Scene();
      screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      screenCamera.position.z = 1;
      screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      screenScene.add(screenMesh);
      core = createCursorCore({
        THREE,
        renderer,
        uniforms,
        onEnergy: schedule,
        chainPrevious: opts.chainPrevious === true,
      });
    } catch (error) {
      console.warn("[cursor-distortion] standalone surface unavailable", error);
      if (mirror) mirror.destroy();
      if (sourceTarget) sourceTarget.dispose();
      if (material) material.dispose();
      if (screenMesh) screenMesh.geometry.dispose();
      if (renderer) {
        try { renderer.domElement.remove(); } catch (_) {}
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      }
      return null;
    }

    const canvas = renderer.domElement;
    function isDisabled() {
      if (document.hidden || disabledClasses.some((className) => document.body.classList.contains(className))) {
        return true;
      }
      if (!disabledWhen) return false;
      try { return !!disabledWhen(); } catch (_) { return false; }
    }
    function deactivate(reset) {
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0; active = false;
      mirror.setActive(false);
      mirrorLive = false;
      canvas.style.display = "none";
      if (reset && core) core.reset();
    }
    function schedule() {
      if (destroyed || contextLost || isDisabled()) return;
      if (!active) {
        active = true;
        last = performance.now();
      }
      if (!raf) raf = global.requestAnimationFrame(renderFrame);
    }
    function renderFrame(now) {
      raf = 0;
      if (destroyed || contextLost) return;
      if (isDisabled()) { deactivate(true); return; }
      const dt = Math.min(80, Math.max(1, now - last));
      last = now;
      if (!mirrorLive) {
        mirror.setActive(true);
        mirrorLive = true;
      }
      const anyVisible = mirror.update();
      if (!anyVisible) { deactivate(false); return; }
      core.update(now, dt, {});
      canvas.style.display = "block";
      renderer.setRenderTarget(sourceTarget);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, false, false);
      renderer.render(mirror.scene, mirror.camera);
      renderer.setRenderTarget(null);
      // The visible overlay is an opaque black additive plate. CSS screen
      // blending makes black a visual no-op and lets only the teal fringe
      // brighten the native page, avoiding transparent-canvas alpha holes.
      renderer.setClearColor(0x000000, useScreenBlend ? 1 : 0);
      renderer.clear(true, false, false);
      renderer.render(screenScene, screenCamera);
      renderer.setClearColor(0x000000, 0);
      if (core.isHot(now)) raf = global.requestAnimationFrame(renderFrame);
      else deactivate(false);
    }
    function onResize() {
      if (destroyed || contextLost) return;
      const width = Math.max(1, global.innerWidth || 1), height = Math.max(1, global.innerHeight || 1);
      const dpr = Math.max(0.5, Math.min(global.devicePixelRatio || 1, opts.dprCap || 1));
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      sourceTarget.setSize(Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)));
      material.uniforms.uAspect.value = width / height;
      mirror.resize(width, height);
      core.resize();
      if (active) schedule();
    }
    function onContextLost(event) {
      event.preventDefault();
      contextLost = true;
      deactivate(false);
    }
    function onContextRestored() {
      contextLost = false;
      core.reset();
      mirror.refresh();
    }
    function onVisibility() { if (document.hidden) deactivate(true); }
    function onPageHide() { deactivate(true); }

    const classObserver = global.MutationObserver
      ? new global.MutationObserver(() => { if (isDisabled()) deactivate(true); })
      : null;
    if (classObserver) classObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    global.addEventListener("resize", onResize, { passive: true });
    global.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      deactivate(false);
      if (classObserver) classObserver.disconnect();
      global.removeEventListener("resize", onResize);
      global.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      core.destroy();
      mirror.destroy();
      sourceTarget.dispose();
      material.dispose();
      screenMesh.geometry.dispose();
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      try { canvas.remove(); } catch (_) {}
    }
    return { disturb: core.disturb, refresh: mirror.refresh, destroy };
  }

  global.MOCursorDistortion = Object.freeze({ createTextMirror, createComposerEffect, mountStandalone });
})(window);
