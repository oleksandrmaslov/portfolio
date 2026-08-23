/* ============================================================
   M.O. SYSTEM — ASCII PHOTO ENGINE (WebGL, dependency-free)
   ------------------------------------------------------------
   A reveal-lens that converts a photo into monospace glyphs in
   real time. Fragment-shader + glyph-atlas approach for 60fps.

   - luminance -> density ramp  " ·:-=+*#%@"  (sampled per cell)
   - circular lens follows the pointer; optional whole-image toggle
   - two conversion "feels":  scan-in (radial/diagonal sweep)  |  dissolve
   - per-glyph chromatic aberration + scanlines + vignette
     (matches the Maslov universe grade: CA + vignette, no bloom)
   - color modes: mono(bone) | teal(signal) | full(sampled color)

   Usage:
     const fx = new AsciiPhoto(canvas, { src: "wafer-sample.webp" });
     fx.set({ cell: 16, feel: "scan", color: "full" });
     fx.setPointer(u, v);  fx.setHover(true);  fx.toggleConvert();

   Coords: all UV are y-DOWN (top-left origin) to match the DOM.
   ============================================================ */

(function (global) {
  "use strict";

  const VOID = [0x04 / 255, 0x06 / 255, 0x0d / 255];     // --void
  const SIGNAL = [0x00 / 255, 0xf0 / 255, 0xc8 / 255];   // --signal
  const SIGNAL_DIM = [0x00 / 255, 0xa8 / 255, 0x8c / 255]; // --signal-dim
  const BONE = [0xe6 / 255, 0xe8 / 255, 0xee / 255];     // --bone
  const BONE_DIM = [0.18, 0.20, 0.24];

  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main(){
      vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); // y-down
      gl_Position = vec4(aPos, 0.0, 1.0);
    }`;

  const FRAG = `
    precision highp float;
    uniform sampler2D uTex;
    uniform sampler2D uAtlas;
    uniform vec2  uRes;
    uniform float uCanvasAspect;
    uniform float uImgAspect;
    uniform float uCellW;
    uniform float uCellAspect;
    uniform float uRampN;
    uniform vec2  uPointer;
    uniform float uLensR;
    uniform float uLensSoft;
    uniform float uHover;
    uniform float uConvertProg;
    uniform float uFeel;        // 0 dissolve, 1 scan
    uniform float uCA;
    uniform int   uCAMode;     // 0 center, 1 cursor, 2 velocity, 3 pulse
    uniform vec2  uCADir;      // eased motion direction * move-amount
    uniform float uPulse;      // node-pulse ring radius (<0 = inactive)
    uniform float uScan;
    uniform float uVig;
    uniform float uFeather;
    uniform float uGamma;
    uniform float uContrast;
    uniform float uInvert;
    uniform int   uColor;       // 0 mono, 1 teal, 2 full
    uniform float uTime;
    uniform vec3  uVoid;
    uniform vec3  uSignal;
    varying vec2 vUv;

    vec2 coverUV(vec2 uv){
      vec2 t = uv;
      if (uCanvasAspect > uImgAspect){
        float s = uImgAspect / uCanvasAspect;
        t.y = (uv.y - 0.5) * s + 0.5;
      } else {
        float s = uCanvasAspect / uImgAspect;
        t.x = (uv.x - 0.5) * s + 0.5;
      }
      return t;
    }

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float glyphAlpha(float gi, vec2 local){
      local = clamp(local, 0.0, 1.0);
      float ax = (gi + local.x) / uRampN;
      return texture2D(uAtlas, vec2(ax, local.y)).a;
    }

    void main(){
      vec2 uv = vUv;
      vec3 base = texture2D(uTex, coverUV(uv)).rgb;

      // ---- cell grid (in device px) ----
      vec2 cellPx = vec2(uCellW, uCellW * uCellAspect);
      vec2 grid   = uRes / cellPx;
      vec2 cellId = floor(uv * grid);
      vec2 cCenter = (cellId + 0.5) / grid;
      vec2 local  = fract(uv * grid);

      vec3 samp = texture2D(uTex, coverUV(cCenter)).rgb;
      float lum = dot(samp, vec3(0.299, 0.587, 0.114));
      lum = mix(lum, 1.0 - lum, uInvert);
      lum = clamp((lum - 0.5) * uContrast + 0.5, 0.0, 1.0);
      lum = pow(lum, uGamma);
      float gi = floor(lum * (uRampN - 1.0) + 0.5);

      // glyph color by mode
      vec3 gcol;
      if (uColor == 0)      gcol = mix(vec3(0.18,0.20,0.24), vec3(0.902,0.910,0.933), lum);
      else if (uColor == 1) gcol = mix(vec3(0.0,0.659,0.549), uSignal, lum);
      else                  gcol = samp * (0.82 + 0.45 * lum);

      // ---- chromatic aberration: per-glyph RGB split, origin selectable ----
      // dd = aspect-corrected vector from the probed node (cursor) to this pixel.
      vec2 dd = uv - uPointer; dd.x *= uCanvasAspect;
      float pdist = length(dd);
      vec2 cao;
      if (uCAMode == 0) {
        // CENTER — global camera CA (Maslov), radial from screen centre
        vec2 o = uv - 0.5;
        cao = o * length(o) * uCA * 0.6;
      } else if (uCAMode == 3) {
        // RIPPLE — continuous concentric chromatic waves radiating from the node.
        // Time-driven (not flick-triggered): crests march outward and the RGB
        // split rides them, fading with distance. Stronger as you move (uCA boost).
        float wave = sin(pdist * 58.0 - uTime * 5.0);
        float env = 1.0 - smoothstep(0.0, uLensR * 3.2, pdist);
        cao = normalize(dd + 1e-5) * wave * env * uCA * 0.7;
      } else {
        // CURSOR (1) / VELOCITY (2) — concentrated at the node, fades with distance,
        // so the split travels WITH the pointer instead of ghosting at the edges.
        float fall = 1.0 - smoothstep(0.0, uLensR * 2.6, pdist);
        if (uCAMode == 2) cao = uCADir * uCA * 0.75 * fall;   // smear along motion, local
        else              cao = dd * uCA * 1.0 * fall;          // radial from node, local
      }
      float gR = glyphAlpha(gi, local + cao);
      float gG = glyphAlpha(gi, local);
      float gB = glyphAlpha(gi, local - cao);

      vec3 ascii;
      ascii.r = mix(uVoid.r, gcol.r, gR);
      ascii.g = mix(uVoid.g, gcol.g, gG);
      ascii.b = mix(uVoid.b, gcol.b, gB);

      // ---- reveal field ----
      vec2 d2 = uv - uPointer; d2.x *= uCanvasAspect;
      float dist = length(d2);
      float lensInner = uLensR * (1.0 - uLensSoft);
      float lensCore = 1.0 - smoothstep(lensInner, uLensR, dist);

      float reveal = 0.0;
      float lensRing = 0.0;   // decorative scope ring at the lens edge
      float convRing = 0.0;   // bright leading edge of the whole-frame wipe
      if (uFeel > 0.5){
        // SCAN-IN — crisp radial edge + bright leading ring
        float edge = smoothstep(0.46 - uFeather * 0.25, 0.54 + uFeather * 0.15, lensCore);
        reveal = edge * uHover;
        lensRing = smoothstep(0.42, 0.55, lensCore) * (1.0 - smoothstep(0.55, 0.72, lensCore)) * uHover;
      } else {
        // DISSOLVE — per-cell hash threshold, feathered
        float h = hash(cellId);
        float fw = 0.06 + uFeather * 0.55;
        reveal = smoothstep(h - fw, h + fw, lensCore * 1.18) * uHover;
      }

      // ---- whole-image convert (click toggle) ----
      if (uConvertProg > 0.0001){
        float g;
        if (uFeel > 0.5){
          float sweep = uv.x * 0.32 + uv.y * 0.68;     // diagonal wipe
          float p = uConvertProg * 1.32 - 0.16;
          g = smoothstep(p + 0.07, p - 0.07, sweep);
          float lead = smoothstep(p - 0.05, p, sweep) * (1.0 - smoothstep(p, p + 0.04, sweep));
          convRing = lead * (1.0 - smoothstep(0.985, 1.0, uConvertProg)) * 1.4;
        } else {
          float h = hash(cellId);
          g = smoothstep(h - 0.12, h + 0.12, uConvertProg * 1.24);
        }
        reveal = max(reveal, g);
      }

      reveal = clamp(reveal, 0.0, 1.0);

      // combine the bright rings: lens scope fades once the frame is fully
      // converted; the scan wipe lead stays.
      float ring = lensRing * (1.0 - uConvertProg);
      ring = max(ring, convRing);

      // ---- composite ----
      vec3 col = mix(base, ascii, reveal);
      col += uSignal * ring * 0.55;

      // scanlines (ascii region only)
      float sl = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159265);
      col *= mix(1.0, mix(1.0 - uScan * 0.55, 1.0, sl), reveal);

      // vignette (ascii region only)
      float vig = smoothstep(0.98, 0.28, length(uv - 0.5));
      col *= mix(1.0, mix(1.0, vig, uVig), reveal);

      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
    }
    return s;
  }

  const DEFAULTS = {
    src: null,
    ramp: " ·:-=+*#%@",
    cell: 18,            // device px per glyph cell width
    cellAspect: 1.8,     // height / width (monospace-ish)
    lensR: 0.22,         // fraction of min canvas dimension (aspect-corrected)
    lensSoft: 0.55,      // 0..1
    feel: "scan",        // "scan" | "dissolve"
    color: "full",       // "mono" | "teal" | "full"
    feather: 0.45,       // edge feathering
    scanlines: 0.28,
    vignette: 0.45,
    gamma: 1.0,
    contrast: 1.15,
    invert: 1,           // 1 = dark subject becomes dense glyphs (good for light-bg photos)
    ca: 0.14,            // BASE chromatic aberration (at rest)
    caMode: "cursor",    // center | cursor | velocity | pulse  (origin of the RGB split)
    caVelocity: 1.0,     // how much cursor SPEED adds to CA (the interactive split)
    caMax: 1.7,          // ceiling for velocity-driven CA
    caHoverGate: false,  // when true, CA fades with pointer presence (dissolves on leave)
    speed: 1.0,          // conversion / hover animation speed
    renderScale: 1.0,    // <1 renders shader at lower res (perf lever for weak GPUs)
    dprCap: 2,           // max device-pixel-ratio honored
  };

  class AsciiPhoto {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.o = Object.assign({}, DEFAULTS, opts || {});
      const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error("WebGL unavailable");
      this.gl = gl;

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      this.prog = prog;
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.u = {};
      ["uTex", "uAtlas", "uRes", "uCanvasAspect", "uImgAspect", "uCellW", "uCellAspect",
       "uRampN", "uPointer", "uLensR", "uLensSoft", "uHover", "uConvertProg", "uFeel",
       "uCA", "uCAMode", "uCADir", "uPulse", "uScan", "uVig", "uFeather", "uGamma", "uContrast", "uInvert", "uColor", "uTime",
       "uVoid", "uSignal"].forEach(n => this.u[n] = gl.getUniformLocation(prog, n));

      gl.uniform1i(this.u.uTex, 0);
      gl.uniform1i(this.u.uAtlas, 1);
      gl.uniform3fv(this.u.uVoid, VOID);
      gl.uniform3fv(this.u.uSignal, SIGNAL);

      // animation state
      this.pointer = { x: 0.5, y: 0.5 };
      this._prevPointer = { x: 0.5, y: 0.5 };
      this._caBoost = 0;       // velocity-driven CA, eased
      this._caDir = { x: 0, y: 0 };   // eased motion direction * move-amount
      this._pulse = -1;        // node-pulse ring radius (<0 = inactive)
      this._pulseT = 0;        // last pulse trigger time
      this.hover = 0; this.hoverTarget = 0;
      this.convert = 0; this.convertTarget = 0;
      this.imgAspect = 1; this.ready = false;
      this._raf = null; this._last = 0; this._t0 = performance.now();
      this.fps = 0; this._fpsAcc = 0; this._fpsN = 0; this._fpsT = 0;
      this.onFps = null;

      this._buildAtlas();
      if (this.o.src) this.load(this.o.src);
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);

      this._onResize = () => this.resize();
      window.addEventListener("resize", this._onResize);
      this.resize();
    }

    _buildAtlas() {
      const gl = this.gl;
      const ramp = this.o.ramp;
      const n = ramp.length;
      const cw = 36, ch = Math.round(36 * this.o.cellAspect);
      const c = document.createElement("canvas");
      c.width = cw * n; c.height = ch;
      const x = c.getContext("2d");
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = "#fff";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.font = `500 ${Math.round(ch * 0.82)}px "Geist Mono", ui-monospace, monospace`;
      for (let i = 0; i < n; i++) {
        x.fillText(ramp[i], i * cw + cw / 2, ch / 2 + ch * 0.04);
      }
      if (!this.atlasTex) this.atlasTex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.rampN = n;
    }

    /* Bind a <video> as the sampled texture. Every other part of the engine
       stays identical: the lens, the convert ramp and the CA all read from
       TEXTURE0, so a moving frame resolves into glyphs exactly like a still.
       The frame is re-uploaded only while the element is actually playing,
       which keeps the idle-skip path below intact for a paused clip. */
    loadVideo(el) {
      this._video = el;
      const bind = () => {
        const gl = this.gl;
        if (!el.videoWidth || !el.videoHeight) return;
        this.imgAspect = el.videoWidth / el.videoHeight;
        if (!this.photoTex) this.photoTex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.photoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (!this.ready) { this.ready = true; if (this.onReady) this.onReady(); }
        this._dirty = true;
      };
      this._bindVideoFrame = bind;
      if (el.readyState >= 2) bind();
      else el.addEventListener("loadeddata", bind, { once: true });
    }

    load(src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const gl = this.gl;
        this.imgAspect = img.naturalWidth / img.naturalHeight;
        if (!this.photoTex) this.photoTex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.photoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.ready = true;
        this._dirty = true;
        if (this.onReady) this.onReady();
      };
      img.src = src;
    }

    resize() {
      // effective pixel ratio = device dpr (capped) × render-scale.
      // render-scale < 1 renders the shader at lower res and lets CSS upscale —
      // the single biggest perf lever on weak / integrated GPUs.
      const cap = this.o.dprCap || 2;
      const dpr = Math.min(window.devicePixelRatio || 1, cap) * (this.o.renderScale || 1);
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
      }
      this.dpr = dpr;
      this.gl.viewport(0, 0, w, h);
      this._dirty = true;
    }

    set(patch) {
      Object.assign(this.o, patch);
      if (patch.ramp || patch.cellAspect) this._buildAtlas();
      if (patch.renderScale !== undefined || patch.dprCap !== undefined) this.resize();
      this._dirty = true;
    }

    setPointer(u, v) { this.pointer.x = u; this.pointer.y = v; this._dirty = true; }
    pulse(now) { this._pulse = 0; this._pulseT = now || performance.now(); this._dirty = true; }
    setHover(on) { this.hoverTarget = on ? 1 : 0; if (on) this._skipVel = true; this._dirty = true; }
    toggleConvert() { this.convertTarget = this.convertTarget > 0.5 ? 0 : 1; this._dirty = true; return this.convertTarget > 0.5; }
    setConvert(on) { this.convertTarget = on ? 1 : 0; this._dirty = true; }
    get converted() { return this.convertTarget > 0.5; }

    _loop(now) {
      this._raf = requestAnimationFrame(this._loop);
      const dt = Math.min(0.05, (now - this._last) / 1000 || 0.016);
      this._last = now;

      // fps
      this._fpsAcc += 1 / Math.max(dt, 1e-4); this._fpsN++; this._fpsT += dt;
      if (this._fpsT >= 0.5) {
        this.fps = Math.round(this._fpsAcc / this._fpsN);
        this._fpsAcc = 0; this._fpsN = 0; this._fpsT = 0;
        if (this.onFps) this.onFps(this.fps);
      }

      const sp = this.o.speed;
      const kH = 1 - Math.pow(0.001, dt * sp * 1.6);   // hover ease
      const kC = 1 - Math.pow(0.001, dt * sp * 1.1);   // convert ease
      this.hover += (this.hoverTarget - this.hover) * kH;
      this.convert += (this.convertTarget - this.convert) * kC;

      // ---- velocity-reactive chromatic aberration ----
      // cursor SPEED (uv/sec) drives an RGB-split spike that trails off when still.
      // Only meaningful while the lens or the converted frame is present.
      const dpx = this.pointer.x - this._prevPointer.x;
      const dpy = this.pointer.y - this._prevPointer.y;
      const mag = Math.sqrt(dpx * dpx + dpy * dpy);
      this._prevPointer.x = this.pointer.x; this._prevPointer.y = this.pointer.y;
      // first active frame after a gap: adopt the position without counting it
      // as motion (prevents an enter/teleport from spiking velocity + auto-pulse).
      if (this._skipVel) { this._skipVel = false; this._caBoost *= 0.4; }
      const speed = Math.min(10, mag / Math.max(dt, 1e-3));
      const present = (this.hover > 0.04 || this.convert > 0.04) ? 1 : 0;
      const target = Math.min(this.o.caMax, speed * this.o.caVelocity * 0.16) * present;
      // fast attack, slow release — a punchy spike that lingers
      const kCA = target > this._caBoost ? (1 - Math.pow(0.001, dt * 22)) : (1 - Math.pow(0.001, dt * 4));
      this._caBoost += (target - this._caBoost) * kCA;

      // eased motion direction (for velocity-smear CA mode), scaled by move amount
      if (mag > 1e-5) {
        this._caDir.x += (dpx / mag - this._caDir.x) * 0.4;
        this._caDir.y += (dpy / mag - this._caDir.y) * 0.4;
      }
      const dirAmt = Math.min(1, this._caBoost);
      this._dirX = this._caDir.x * dirAmt;
      this._dirY = this._caDir.y * dirAmt;

      // (no discrete pulses — the ripple CA mode below is a continuous,
      //  time-driven shader effect instead of a flick-triggered event.)
      if (this._pulse >= 0) {
        this._pulse += dt * 2.1 * this.o.speed;   // expand the ring
        if (this._pulse > 1.7) this._pulse = -1;  // done
      }

      // ---- idle skip: when nothing is animating and the lens is gone,
      // stop issuing GPU work. The canvas holds the last (plain-photo) frame.
      // Scanline shimmer needs continuous redraw only while ascii is visible. ----
      // a running clip is always "animating": pull the current frame first so
      // the shader samples it, then fall through to the normal draw.
      const v = this._video;
      const videoLive = !!(v && !v.paused && !v.ended && v.readyState >= 2);
      if (videoLive && this._bindVideoFrame) this._bindVideoFrame();

      const animating = videoLive ||
        Math.abs(this.hoverTarget - this.hover) > 0.002 ||
        Math.abs(this.convertTarget - this.convert) > 0.002 ||
        this.hover > 0.002 || this.convert > 0.002 || this._caBoost > 0.01 || this._pulse >= 0;
      if (!this.ready) return;
      if (!animating && !this._dirty) return;   // <-- the free-idle path
      this._dirty = false;
      this._draw(now);
    }

    _draw(now) {
      const gl = this.gl, u = this.u, o = this.o;
      const w = this.canvas.width, h = this.canvas.height;
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uCanvasAspect, w / h);
      gl.uniform1f(u.uImgAspect, this.imgAspect);
      gl.uniform1f(u.uCellW, o.cell * this.dpr);
      gl.uniform1f(u.uCellAspect, o.cellAspect);
      gl.uniform1f(u.uRampN, this.rampN);
      gl.uniform2f(u.uPointer, this.pointer.x, this.pointer.y);
      gl.uniform1f(u.uLensR, o.lensR);
      gl.uniform1f(u.uLensSoft, o.lensSoft);
      gl.uniform1f(u.uHover, this.hover);
      gl.uniform1f(u.uConvertProg, this.convert);
      gl.uniform1f(u.uFeel, o.feel === "scan" ? 1 : 0);
      // caHoverGate: fade the whole RGB split with pointer presence so it
      // dissolves away when the cursor/finger leaves instead of lingering at
      // the last (edge) node position. uses the eased hover envelope.
      const caEnv = o.caHoverGate ? this.hover : 1;
      gl.uniform1f(u.uCA, (o.ca + this._caBoost) * caEnv);
      gl.uniform1i(u.uCAMode, { center: 0, cursor: 1, velocity: 2, pulse: 3 }[o.caMode] ?? 1);
      gl.uniform2f(u.uCADir, this._dirX || 0, this._dirY || 0);
      gl.uniform1f(u.uPulse, this._pulse);
      gl.uniform1f(u.uScan, o.scanlines);
      gl.uniform1f(u.uVig, o.vignette);
      gl.uniform1f(u.uFeather, o.feather);
      gl.uniform1f(u.uGamma, o.gamma);
      gl.uniform1f(u.uContrast, o.contrast);
      gl.uniform1f(u.uInvert, o.invert ? 1 : 0);
      gl.uniform1i(u.uColor, o.color === "mono" ? 0 : o.color === "teal" ? 1 : 2);
      gl.uniform1f(u.uTime, (now - this._t0) / 1000);

      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.photoTex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    destroy() {
      this._video = null;
      this._bindVideoFrame = null;
      cancelAnimationFrame(this._raf);
      window.removeEventListener("resize", this._onResize);
      // Browsers cap concurrent WebGL contexts (Chrome around 16) and silently
      // kill the oldest past that. A long case file can hold twenty figures
      // plus the page's own 3D rig, so a disposed figure has to hand its
      // context back rather than just stop drawing.
      try {
        const ext = this.gl && this.gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      } catch (_) {}
      this.ready = false;
    }
  }

  const RAMP_SYS = " ·:-=+*#%@";
  const RAMP_FINE = " .'`^\",:;Il!i~+_-?][}{1)(|tfjrxnuvczXYUJCQ0OZmwqpdbkhao#MW&8%B@$";
  const RAMP_BLOCK = " ░▒▓█";

  AsciiPhoto.PRESETS = {
    // The metaphor: an instrument lens that resolves a photo into the
    // signal-teal terminal universe. Each variant is a different "scope".
    subtle: { name: "Subtle lens", ramp: RAMP_SYS, cell: 16, lensR: 0.18, lensSoft: 0.64, ca: 0.1,  caVelocity: 0.7, caMode: "cursor",   feel: "dissolve", color: "full", feather: 0.55, scanlines: 0.16, vignette: 0.32, contrast: 1.12, invert: 1, speed: 1.0 },
    full:   { name: "Full ASCII",  ramp: RAMP_SYS, cell: 14, lensR: 0.24, lensSoft: 0.4,  ca: 0.16, caVelocity: 1.0, caMode: "cursor",   feel: "scan",     color: "full", feather: 0.3,  scanlines: 0.3,  vignette: 0.5,  contrast: 1.2,  invert: 1, speed: 1.0 },
    glitch: { name: "Glitch / CA", ramp: RAMP_SYS, cell: 20, lensR: 0.27, lensSoft: 0.45, ca: 0.2,  caVelocity: 2.2, caMode: "velocity", feel: "scan",     color: "teal", feather: 0.35, scanlines: 0.55, vignette: 0.62, contrast: 1.35, invert: 1, speed: 1.4 },
    recon:  { name: "Recon scope", ramp: RAMP_SYS, cell: 12, lensR: 0.15, lensSoft: 0.28, ca: 0.12, caVelocity: 0.9, caMode: "pulse",    feel: "scan",     color: "teal", feather: 0.18, scanlines: 0.62, vignette: 0.7,  contrast: 1.45, invert: 1, speed: 1.6 },
    stream: { name: "Datastream",  ramp: RAMP_FINE, cell: 9, lensR: 0.3,  lensSoft: 0.5,  ca: 0.18, caVelocity: 1.3, caMode: "velocity", feel: "scan",     color: "full", feather: 0.4,  scanlines: 0.22, vignette: 0.4,  contrast: 1.25, invert: 1, speed: 1.2 },
    xray:   { name: "X-ray",       ramp: RAMP_BLOCK, cell: 16, lensR: 0.22, lensSoft: 0.55, ca: 0.1, caVelocity: 0.6, caMode: "center",   feel: "dissolve", color: "mono", feather: 0.5,  scanlines: 0.3,  vignette: 0.55, contrast: 1.6,  invert: 1, speed: 1.0 },
  };

  global.AsciiPhoto = AsciiPhoto;
})(window);
