/* ============================================================
   M.O. SYSTEM — Landing universe
   Wrapping infinite space.
     · Drag to rotate the view (yaw + pitch).
     · Wheel to fly forward / backward along the look axis.
     · Tiles live in a torus-wrapped box around the camera —
       anything that drifts out of view wraps back in from the
       opposite side. The space feels infinite in every axis.

   ============================================================ */

/* app/data/projects.js (window.MO_PROJECTS) is the single project source and
   is adapted into the universe tile shape here. The field stays empty if the
   data file fails to load, with a console warning below.

   `universe: false` on a record keeps it OUT of the field while leaving
   everything else about it intact — its route still serves, All Projects still
   lists it (that page builds its own row list from MO_PROJECTS inline, not
   from this one), and it keeps its slot in the project ring so the page stays
   reachable by prev/next. Use it to retire something from the headline field
   without deleting a public URL. */
// The landing owns these tuning defaults. Keeping them beside their consumers
// avoids a page-level override racing the shared cursor module during boot.
window.__mo_fx = Object.assign({ legRoll: 0.4, wheelYield: 420 }, window.__mo_fx || {});

const PROJECTS = (window.MO_PROJECTS || [])
  .filter((p) => p.universe !== false)
  .map((p) => {
  const m = p.model || {};
  const cp = m.cardPose || {};
  return {
    addr: p.addr, kind: p.slug, file: p.file, name: p.name,
    sub: p.short || p.statement, year: p.state || "",
    stack: (p.tags || []).join(" · ").toUpperCase(), color: "#0d1018",
    model: m.ready ? m.src : null,
    modelFit: cp.fit ? cp.fit * 1.9 : 5.0,
    modelPose: cp.pose || null,
    assignMaterial: m.assignMaterial || null,
    mo: p,
  };
});
if (!PROJECTS.length) console.warn("[universe] MO_PROJECTS missing — load app/data/projects.js first");
// Fallback must match work.jsx's and the registry's — a disagreement here
// would parade one set of cards while the DOM reel listed another.
const MO_FEATURED = window.MO_FEATURED_ADDRS || ["0x01", "0x03", "0x04", "0x06"];

window.UNIVERSE_PROJECTS = PROJECTS;

/* ============================================================
   Per-tile canvas texture
   ============================================================ */
function makeTileTexture(p, THREE) {
  const c = document.createElement("canvas");
  c.width = 540; c.height = 720;
  const x = c.getContext("2d");

  x.fillStyle = p.color || "#0d1018";
  x.fillRect(0, 0, 540, 720);
  x.strokeStyle = "#232a3a";
  x.lineWidth = 1.5;
  x.strokeRect(12, 12, 516, 696);

  x.strokeStyle = "#00f0c8";
  x.lineWidth = 1.5;
  const drawCorner = (cx, cy, fx, fy) => {
    const len = 16;
    x.beginPath();
    x.moveTo(cx, cy + fy * len);
    x.lineTo(cx, cy);
    x.lineTo(cx + fx * len, cy);
    x.stroke();
  };
  drawCorner(24, 24, 1, 1);
  drawCorner(516, 24, -1, 1);
  drawCorner(24, 696, 1, -1);
  drawCorner(516, 696, -1, -1);

  x.fillStyle = "#5b6478";
  x.font = "500 11px 'Geist Mono', monospace";
  x.textBaseline = "top";
  x.textAlign = "left";
  x.fillText("■  NODE " + p.addr, 44, 30);
  x.fillStyle = "#9aa3b3";
  x.fillText(p.year.toUpperCase(), 44, 46);
  x.fillStyle = "#5b6478";
  x.textAlign = "right";
  x.fillText("MASLOV / OLEKSANDR", 496, 30);
  x.fillText("48.137° N  ·  11.575° E", 496, 46);
  x.textAlign = "left";

  x.fillStyle = "#1a2030";
  for (let yy = 90; yy < 540; yy += 21) {
    for (let xx = 44; xx < 510; xx += 21) {
      x.fillRect(xx, yy, 1, 1);
    }
  }

  // Skip the canvas wireframe graphic when a real 3D model or mini-PCB
  // overlays the card — otherwise the green primitive shows through behind it.
  if (!p.model && !p.pcbBoard) {
    x.save();
    x.translate(270, 320);
    x.strokeStyle = "#00f0c8";
    x.fillStyle = "#00f0c8";
    x.lineWidth = 1.4;
    drawGraphic(x, p);
    x.restore();
  }

  x.fillStyle = "#e6e8ee";
  x.font = "400 56px 'Geist', sans-serif";
  x.textAlign = "left";
  x.textBaseline = "top";
  const lines = wrapText(x, p.name, 460);
  let ty = 550 - (lines.length - 1) * 56;
  for (const line of lines) {
    x.fillText(line, 44, ty);
    ty += 58;
  }

  x.fillStyle = "#9aa3b3";
  x.font = "400 18px 'Geist', sans-serif";
  x.fillText(p.sub, 44, 640);

  x.fillStyle = "#5b6478";
  x.font = "500 11px 'Geist Mono', monospace";
  x.fillText(p.stack, 44, 678);
  x.fillStyle = "#00f0c8";
  x.textAlign = "right";
  x.fillText("OPEN  →", 496, 678);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" ");
  const out = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

function drawGraphic(x, p) {
  switch (p.kind) {
    case "wafer": {
      const w = 280, h = 180, r = 22;
      x.beginPath();
      x.moveTo(-w/2 + r, -h/2);
      x.lineTo(w/2 - r, -h/2);
      x.arcTo(w/2, -h/2, w/2, -h/2 + r, r);
      x.lineTo(w/2, h/2 - r);
      x.arcTo(w/2, h/2, w/2 - r, h/2, r);
      x.lineTo(-w/2 + r, h/2);
      x.arcTo(-w/2, h/2, -w/2, h/2 - r, r);
      x.lineTo(-w/2, -h/2 + r);
      x.arcTo(-w/2, -h/2, -w/2 + r, -h/2, r);
      x.stroke();
      for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
        const dx = (col - 2) * 26 - 32;
        const dy = (row - 1) * 26;
        x.fillRect(dx - 2, dy - 2, 4, 4);
        x.fillRect(-dx + 32 - 2, dy - 2, 4, 4);
      }
      for (let i = 0; i < 3; i++) {
        x.fillRect(-12 + i * 26 - 2, 50, 4, 4);
        x.fillRect(12 - i * 26 - 2 + 24, 50, 4, 4);
      }
      break;
    }
    case "kerfur": {
      x.beginPath(); x.arc(0, 0, 100, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(-30, -8, 11, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc( 30, -8, 11, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(0, 22, 14, 0, Math.PI, false); x.stroke();
      for (let i = 1; i <= 3; i++) {
        x.beginPath();
        x.arc(0, 0, 100 + i * 14, -0.4 - i * 0.05, 0.4 + i * 0.05);
        x.globalAlpha = 0.4 - i * 0.1;
        x.stroke();
      }
      x.globalAlpha = 1;
      break;
    }
    case "accel": {
      x.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const xx = (t - 0.5) * 240;
        const yy = -Math.pow(t, 2.6) * 170 + 70;
        if (i === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy);
      }
      x.stroke();
      x.strokeStyle = "#1a2030";
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(120, -80); x.stroke();
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(120, 70); x.stroke();
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(-120, -100); x.stroke();
      x.fillStyle = "#5b6478";
      for (let i = 1; i <= 4; i++) {
        x.fillRect(-120 + i * 48 - 0.5, 70 - 3, 1, 6);
        x.fillRect(-120 - 3, 70 - i * 38 - 0.5, 6, 1);
      }
      x.strokeStyle = "#00f0c8";
      x.fillStyle = "#00f0c8";
      break;
    }
    case "torch": {
      x.beginPath();
      x.moveTo(-50, 60); x.lineTo(50, 60);
      x.lineTo(110, -90); x.lineTo(-110, -90); x.closePath();
      x.stroke();
      x.beginPath(); x.rect(-50, 60, 100, 70); x.stroke();
      x.beginPath(); x.arc(0, -10, 16, 0, Math.PI * 2); x.fill();
      for (let i = -2; i <= 2; i++) {
        x.globalAlpha = 0.3;
        x.beginPath();
        x.moveTo(i * 16, -90); x.lineTo(i * 24, -150);
        x.stroke();
      }
      x.globalAlpha = 1;
      break;
    }
    default: {
      for (let i = 0; i < 4; i++) {
        const s = 30 + i * 30;
        x.globalAlpha = 1 - i * 0.22;
        x.strokeRect(-s, -s, s * 2, s * 2);
      }
      x.globalAlpha = 1;
      x.beginPath(); x.moveTo(-80, 0); x.lineTo(80, 0); x.stroke();
      x.beginPath(); x.moveTo(0, -80); x.lineTo(0, 80); x.stroke();
      x.fillRect(-3, -3, 6, 6);
    }
  }
}

/* ============================================================
   Ambient node atlas — the original 128px sprite artwork, cropped only
   through its transparent top/bottom area and packed into one GPU texture.
   ============================================================ */
function makeAmbientAtlas(labels, THREE) {
  const atlasW = 2048;
  const atlasH = 512;
  const sourceW = 128;
  const cropY = 48;
  const cropH = 32;
  const cols = 15;
  const strideX = 136;
  const strideY = 42;
  const cc = document.createElement("canvas");
  cc.width = atlasW;
  cc.height = atlasH;
  const xc = cc.getContext("2d");
  const cells = [];

  labels.forEach((label, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = col * strideX + 4;
    const y0 = row * strideY + 5;
    const sourceTop = y0 - cropY;

    xc.save();
    xc.beginPath();
    xc.rect(x0, y0, sourceW, cropH);
    xc.clip();
    xc.strokeStyle = "#00f0c8";
    xc.lineWidth = 2;
    xc.beginPath();
    xc.arc(x0 + 64, sourceTop + 64, 4, 0, Math.PI * 2);
    xc.stroke();
    xc.fillStyle = "#5b6478";
    xc.font = "500 16px 'Geist Mono', monospace";
    xc.textAlign = "left";
    xc.textBaseline = "middle";
    xc.fillText(label, x0 + 76, sourceTop + 64);
    xc.restore();

    cells.push({
      u0: x0 / atlasW,
      v0: 1 - (y0 + cropH) / atlasH,
      u1: (x0 + sourceW) / atlasW,
      v1: 1 - y0 / atlasH,
    });
  });

  const texture = new THREE.CanvasTexture(cc);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, cells, cropRatio: cropH / 128 };
}

/* ============================================================
   Universe — wrapping infinite torus space
   ============================================================ */
function Universe({ projects = PROJECTS, onActive, mode = "drift", focusAddr = null }) {
  const mountRef   = React.useRef(null);
  const overlayRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);
  const [activeAddr, setActiveAddr] = React.useState(null);
  const [status, setStatus] = React.useState({ yaw: "0", pit: "0", vel: "0", tile: "—" });
  const [idleNote, setIdleNote] = React.useState(false);

  const hoverObjRef = React.useRef(null);
  const modeRef     = React.useRef(mode);
  const focusRef    = React.useRef(focusAddr);
  // The render loop lives in a mount-only effect, so every cross-render value
  // it reads has to come through a ref. activeAddr was read directly and was
  // therefore pinned to its first-render value of null.
  const activeAddrRef = React.useRef(activeAddr);
  React.useEffect(() => { modeRef.current = mode; }, [mode]);
  React.useEffect(() => { focusRef.current = focusAddr; }, [focusAddr]);
  React.useEffect(() => { activeAddrRef.current = activeAddr; }, [activeAddr]);

  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE) { console.warn("THREE not loaded"); return; }
    const mount = mountRef.current;
    if (!mount) return;

    const sz = () => ({ w: mount.clientWidth, h: mount.clientHeight });
    let { w, h } = sz();

    /* ---------- renderer / scene / camera ---------- */
    // MSAA on the drawing buffer is only worth paying for on the direct-render
    // fallback. When the composer is up, the scene lands in its own
    // (non-multisampled) HalfFloat targets and the canvas only ever receives one
    // full-screen quad — so `antialias: true` buys nothing but a full-canvas
    // multisample resolve every frame, which is real money on integrated GPUs.
    const _composerAvailable = !!(
      THREE.EffectComposer && THREE.RenderPass && THREE.OutputPass
      && window.MOCursorDistortion && window.MOCursorDistortion.createComposerEffect
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: !_composerAvailable, alpha: true, powerPreference: "high-performance",
    });
    // Cap at 1.5 — on a soft drifting field the extra retina pixels are
    // imperceptible but cost ~1.8× the fragment work at DPR 2.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Visibility gate — the universe is a full-screen hero background, so once
    // the user scrolls past it there's no reason to keep driving the GPU. We
    // pause the render (animation state still advances via dt on resume).
    let uniOnScreen = true;
    const uniIO = new IntersectionObserver(
      (entries) => { uniOnScreen = entries[0].isIntersecting; },
      { threshold: 0 }
    );
    uniIO.observe(mount);

    const scene = new THREE.Scene();
    // The canvas renders through an opaque post-processing composer, so the CSS
    // `.universeBg` navy/teal radial glow cannot show through the empty field.
    // Rebuild that glow as a
    // scene.background texture so it lives INSIDE the render and survives the
    // composer: void navy (#04060d) + faint teal centre (rgba(0,240,200,0.06)),
    // matching the CSS gradient. (scene.background is unaffected by fog.)
    (function makeBackdrop() {
      const bg = document.createElement("canvas");
      const BG = 512;
      bg.width = bg.height = BG;
      const bx = bg.getContext("2d");
      bx.fillStyle = "#04060d";
      bx.fillRect(0, 0, BG, BG);
      const grad = bx.createRadialGradient(BG / 2, BG / 2, 0, BG / 2, BG / 2, (BG / 2) * 0.58);
      grad.addColorStop(0, "rgba(0,240,200,0.06)");
      grad.addColorStop(1, "rgba(0,240,200,0)");
      bx.fillStyle = grad;
      bx.fillRect(0, 0, BG, BG);
      const tex = new THREE.CanvasTexture(bg);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
    })();
    // Fog gives the field its atmospheric depth (the "cool" haze). 22→38 is the
    // original near fog; the drift wrap is hidden by the per-tile box-edge fade
    // now, and the ORIGIN ring stays readable because its tiles use a spherical
    // fade pushed out past the fog — so we can keep this near, atmospheric fog.
    scene.fog = new THREE.Fog(0x04060d, 22, 38);

    const camera = new THREE.PerspectiveCamera(58, w / h, 0.3, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    // Card models use real PBR materials. Unlike lighting-independent matcaps,
    // real metal renders pure black without an environment map and key light. Add
    // a cheap one-time PMREM environment + a key/rim light so they read.
    let _pmrem = null, _roomEnvironment = null, _environmentTarget = null;
    try {
      _pmrem = new THREE.PMREMGenerator(renderer);
      _roomEnvironment = new THREE.RoomEnvironment();
      _environmentTarget = _pmrem.fromScene(_roomEnvironment, 0.06);
      scene.environment = _environmentTarget.texture;
    } catch (_) {}
    finally {
      if (_roomEnvironment) {
        if (_roomEnvironment.dispose) _roomEnvironment.dispose();
        else _roomEnvironment.traverse((object) => {
          if (object.geometry && object.geometry.dispose) object.geometry.dispose();
          const mats = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
          mats.forEach((material) => material && material.dispose && material.dispose());
        });
      }
      if (_pmrem) _pmrem.dispose();
    }
    { const _k = new THREE.DirectionalLight(0xffffff, 1.6); _k.position.set(2.4, 3.2, 2.6); scene.add(_k);
      // Range scales with TILE_BOX: at 26 this reached the whole field when the
      // cards sat 7-11u out, and left the far half of a 11-17u spread unlit.
      const _r = new THREE.PointLight(0x00f0c8, 1.6, 36); _r.position.set(-3, 1.6, -2); scene.add(_r); }

    /* ============================================================
       UNIVERSE RENDERING PATH — post-processing composer
       Subtle chromatic aberration · gentle depth-of-field · small vignette.
       Film grain and node bloom are intentionally omitted.

       Pipeline: RenderPass → FastBokehPass(DoF) → PointerGrade(CA+vig+grain) → OutputPass

       • All values live in window.__mo_grade so they remain tunable at runtime.
       • Guarded + tiered: on low-power devices the (expensive) Bokeh depth
         pass is dropped while the near-free grade pass stays — so the lens
         character survives even when DoF can't.
       • Falls back to direct renderer.render() if anything is unavailable.
       ============================================================ */
    const GRADE = (window.__mo_grade = Object.assign({
      aberration: 0.01,     // CA — restrained radial RGB split
      vignette:   0.34,     // "small vignette"
      grain:      0.0,      // film grain removed per request
      dof:        true,     // gentle depth-of-field
      focus:      13.4,     // pinned to the card plane — mids stay readable
                            // (moved out with TILE_BOX; the cards now sit ~11-17u)
      aperture:   0.00025,  // small aperture keeps mid-distance content crisp
      maxblur:    0.0045,   // low ceiling — only the deep field melts
      // --- DoF cost controls, read by FastBokehPass below ---
      dofDepthScale: 0.5,   // depth prepass resolution, as a fraction of the composer's
      dofDepthEvery: 2,     // re-render the depth prepass every Nth frame
    }, window.__mo_grade || {}));

    // Device tier. We enable DoF OPTIMISTICALLY everywhere (modern phones like
    // the iPhone 16 Pro Max render it fine) and let a runtime FPS probe drop it
    // only on devices that actually struggle. The near-free grade pass
    // (CA + vignette) always stays. `pointer: coarse` is deliberately NOT used
    // as a gate — touchscreen laptops report coarse yet render DoF fine.
    const _veryWeak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
      || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    const _isSmall = matchMedia("(max-width: 760px)").matches;
    // Cap the composer's internal resolution lower on small screens so the
    // fill-rate-heavy DoF pass stays affordable on phones.
    const _composerDpr = Math.min(window.devicePixelRatio, _isSmall ? 1.25 : 1.5);


    /* ============================================================
       FastBokehPass — stock BokehPass, a quarter of the bill
       ------------------------------------------------------------
       Stock BokehPass is the most expensive thing in this scene, and almost
       all of it is waste AT OUR SETTINGS. maxblur is 0.0045, so the circle of
       confusion never exceeds 0.4 × 0.0045 × viewport ≈ 3.5 px at 1080p — and
       the stock shader throws 41 texture taps at that disc while a second full
       scene render fills a full-resolution HalfFloat depth target every frame.
       Three changes, none of which the eye can find:

         1. 13 taps instead of 41 (centre + 8 outer + 4 inner). The mean tap
            radius is 0.314 of the CoC against the stock kernel's 0.313, so the
            falloff keeps its shape; on a 3.5 px disc the other 28 samples were
            resolving detail that does not exist.
         2. An early-out for a sub-pixel CoC. Everything near the focus plane —
            the cards, which is what you actually read — now costs one tap.
         3. The depth prepass runs at half resolution into an 8-bit target
            (RGBADepthPacking is 8-bit anyway; the stock HalfFloat target
            doubled the bandwidth for no precision) and only every Nth frame.
            The CoC map is low-frequency and the colour buffer is never stale,
            so a one-frame-old blur RADIUS on a 3.5 px disc is invisible.

       Deliberately NOT done: reading depth from the main pass through a
       DepthTexture, which would delete the prepass outright. The cards, the
       constellation and both point clouds are all `depthWrite: false`, so
       main-pass depth does not know they exist — every one of them would
       inherit the far-field CoC and the card text would go soft. The
       override-material prepass is what keeps them sharp. Do not "optimise" it
       into a depth-texture read.
       ============================================================ */
    function makeFastBokehPass(BokehPassCtor, dofScene, dofCamera, params) {
      const pass = new BokehPassCtor(dofScene, dofCamera, params);

      // 8-bit is the correct pairing for RGBADepthPacking; swap the stock
      // HalfFloat target for one.
      pass.renderTargetDepth.dispose();
      pass.renderTargetDepth = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.UnsignedByteType,
        stencilBuffer: false,
      });
      pass.renderTargetDepth.texture.name = "FastBokehPass.depth";
      pass.uniforms.tDepth.value = pass.renderTargetDepth.texture;

      // Texel of the FULL-resolution colour buffer — the sub-pixel early-out
      // measures against the pixels it would otherwise be gathering.
      pass.uniforms.texel = { value: new THREE.Vector2(1 / 1024, 1 / 1024) };

      pass.materialBokeh.fragmentShader = [
        "#include <common>",
        "varying vec2 vUv;",
        "uniform sampler2D tColor;",
        "uniform sampler2D tDepth;",
        "uniform float maxblur;",
        "uniform float aperture;",
        "uniform float nearClip;",
        "uniform float farClip;",
        "uniform float focus;",
        "uniform float aspect;",
        "uniform vec2 texel;",
        "#include <packing>",
        "void main() {",
        "  float depth = unpackRGBAToDepth( texture2D( tDepth, vUv ) );",
        "  float viewZ = perspectiveDepthToViewZ( depth, nearClip, farClip );",
        "  float factor = ( focus + viewZ );",   // viewZ is <= 0, so this is a difference
        "  float coc = clamp( factor * aperture, -maxblur, maxblur );",
        // Stock's widest ring sits at 0.4 of the CoC; keep exactly that reach.
        "  vec2 rad = vec2( coc * 0.4, coc * 0.4 * aspect );",
        "  vec4 centre = texture2D( tColor, vUv );",
        "  if ( abs( rad.x ) < texel.x * 0.75 && abs( rad.y ) < texel.y * 0.75 ) {",
        "    gl_FragColor = vec4( centre.rgb, 1.0 );",
        "    return;",
        "  }",
        "  vec4 col = centre;",
        "  col += texture2D( tColor, vUv + vec2(  1.0000,  0.0000 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2(  0.7071,  0.7071 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2(  0.0000,  1.0000 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2( -0.7071,  0.7071 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2( -1.0000,  0.0000 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2( -0.7071, -0.7071 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2(  0.0000, -1.0000 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2(  0.7071, -0.7071 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2(  0.5081,  0.2105 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2( -0.2105,  0.5081 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2( -0.5081, -0.2105 ) * rad );",
        "  col += texture2D( tColor, vUv + vec2(  0.2105, -0.5081 ) * rad );",
        "  gl_FragColor = vec4( ( col / 13.0 ).rgb, 1.0 );",
        "}",
      ].join("\n");
      pass.materialBokeh.needsUpdate = true;

      pass.depthScale = 0.5;
      pass.depthEvery = 1;
      pass._depthTick = 0;

      pass.setSize = function (width, height) {
        this.uniforms.aspect.value = width / height;
        const dw = Math.max(1, Math.round(width * this.depthScale));
        const dh = Math.max(1, Math.round(height * this.depthScale));
        this.renderTargetDepth.setSize(dw, dh);
        this.uniforms.texel.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
        // The resize dropped the depth attachment — never let a skipped frame
        // sample it before it has been filled again.
        this._depthTick = 0;
      };

      pass.render = function (renderer, writeBuffer, readBuffer) {
        const every = Math.max(1, this.depthEvery | 0);
        if (this._depthTick % every === 0) {
          this.scene.overrideMaterial = this.materialDepth;
          renderer.getClearColor(this._oldClearColor);
          const oldClearAlpha = renderer.getClearAlpha();
          const oldAutoClear = renderer.autoClear;
          renderer.autoClear = false;
          renderer.setClearColor(0xffffff);
          renderer.setClearAlpha(1.0);
          renderer.setRenderTarget(this.renderTargetDepth);
          renderer.clear();
          renderer.render(this.scene, this.camera);
          this.scene.overrideMaterial = null;
          renderer.setClearColor(this._oldClearColor);
          renderer.setClearAlpha(oldClearAlpha);
          renderer.autoClear = oldAutoClear;
        }
        this._depthTick++;

        this.uniforms.tColor.value = readBuffer.texture;
        this.uniforms.nearClip.value = this.camera.near;
        this.uniforms.farClip.value = this.camera.far;

        if (this.renderToScreen) {
          renderer.setRenderTarget(null);
        } else {
          renderer.setRenderTarget(writeBuffer);
          renderer.clear();
        }
        this.fsQuad.render(renderer);
      };

      return pass;
    }

    // The shared controller owns the exact combined cursor shader, its four
    // ripple slots, paint buffers and pointer wake. Universe
    // still owns its scene, DoF and live grade values.
    let composer = null, bokehPass = null, cursorFx = null, useComposer = false;
    try {
      const { EffectComposer, RenderPass, BokehPass, OutputPass } = THREE;
      const createCursorEffect = window.MOCursorDistortion
        && window.MOCursorDistortion.createComposerEffect;
      if (EffectComposer && RenderPass && OutputPass && createCursorEffect) {
        composer = new EffectComposer(renderer);
        composer.setPixelRatio(_composerDpr);
        composer.setSize(w, h);
        composer.addPass(new RenderPass(scene, camera));
        if (GRADE.dof && !_veryWeak && BokehPass) {
          bokehPass = makeFastBokehPass(BokehPass, scene, camera, {
            focus: GRADE.focus, aperture: GRADE.aperture, maxblur: GRADE.maxblur,
          });
          bokehPass.depthScale = Math.min(1, Math.max(0.25, GRADE.dofDepthScale || 0.5));
          bokehPass.depthEvery = Math.max(1, Math.round(GRADE.dofDepthEvery || 1));
          composer.addPass(bokehPass);
        }
        cursorFx = createCursorEffect({
          THREE,
          renderer,
          width: w,
          height: h,
          pixelRatio: _composerDpr,
          grade: GRADE,
        });
        if (!cursorFx || !cursorFx.effectPass) {
          throw new Error("shared cursor effect unavailable");
        }
        // Keep mirrored DOM crisp after DoF, then bend it in the same combined
        // cursor pass as the universe. The inverse-alpha marker prevents the
        // universe-only aberration/vignette/grain from leaking onto the type.
        if (cursorFx.mirrorPass) composer.addPass(cursorFx.mirrorPass);
        composer.addPass(cursorFx.effectPass);
        composer.addPass(new OutputPass());
        useComposer = true;
        window.__mo_useComposer = true;
        window.__mo_dofOn = !!bokehPass;
      }
    } catch (error) {
      console.warn("[universe] composer unavailable, falling back to direct render", error);
      if (cursorFx) cursorFx.destroy();
      cursorFx = null;
      composer = null;
      useComposer = false;
      window.__mo_useComposer = false;
      window.__mo_dofOn = false;
    }
    // audio-reactive level (smoothed) — the field breathes with the sound
    let _lvlS = 0;
    // velocity weight (written by cinematic.js) → FOV + aberration kick
    let _lastFov = 58;
    // Smoothed rack-focus distance.
    let _focusS = GRADE.focus;   // seed from the grade, not a second literal
    // ARRIVAL overture — void → the field condenses into "0x00" → pulse → scatter
    const ARR = { t0: 0, dur: 2600, burst: false };
    const _arrR = new THREE.Vector3(), _arrU = new THREE.Vector3(), _arrUP = new THREE.Vector3(0, 1, 0);
    window.__mo_arrival_start = () => { ARR.t0 = performance.now(); ARR.burst = false; };
    // idle attention — after 30s of stillness the field notices you
    let _lastAct = performance.now(), _idleFired = false;
    const onAnyAct = () => { _lastAct = performance.now(); _idleFired = false; };
    const onActSkipArrival = () => { onAnyAct(); ARR.t0 = 0; };
    window.addEventListener("pointermove", onAnyAct, { passive: true });
    window.addEventListener("pointerdown", onActSkipArrival, { passive: true });
    window.addEventListener("wheel", onAnyAct, { passive: true });
    window.addEventListener("keydown", onAnyAct, { passive: true });
    window.addEventListener("scroll", onAnyAct, { passive: true });

    // Adaptive DoF probe: sample FPS over ~1.5s of settled rendering. If the
    // device can't sustain it, disable the (expensive) bokeh pass automatically —
    // the CA + vignette grade stays. This protects weak phones without punishing
    // capable ones (iPhone 16 Pro Max keeps its DoF).
    //
    // The gate is 30 FPS, not 60: DoF is a look, and a device holding a steady
    // 30 should keep it rather than be stripped back for missing a number it was
    // never going to hit. The first frames are DISCARDED — mount is when the GLBs
    // upload, the shaders compile and the first tile textures land, and judging
    // the device on that stall was disabling DoF on machines that then ran fine.
    const DOF_MIN_FPS = 30;
    const DOF_WARMUP  = 30;   // frames thrown away before measuring
    const DOF_WINDOW  = 90;   // frames measured (~1.5s at 60)
    let _probeWarm = 0, _probeFrames = 0, _probeAccum = 0, _probeDone = false;
    function probeDoF(dt) {
      if (_probeDone || !bokehPass) return;
      // ignore absurd dt (tab was backgrounded / first frame)
      if (!(dt > 0 && dt < 200)) return;
      if (_probeWarm < DOF_WARMUP) { _probeWarm++; return; }
      _probeAccum += dt; _probeFrames++;
      if (_probeFrames >= DOF_WINDOW) {
        const avgFps = 1000 / (_probeAccum / _probeFrames);
        window.__mo_dofFps = Math.round(avgFps * 10) / 10;   // readable from the console
        if (avgFps < DOF_MIN_FPS) {
          bokehPass.enabled = false;
          window.__mo_dofOn = false;
        }
        _probeDone = true;
      }
    }

    /* ---------- world configuration ---------- */
    // Smaller box → denser cluster around the camera. Fog hides the wrap.
    const BOX = new THREE.Vector3(26, 18, 26);
    /* The CARDS get a bigger box than the dust does. At BOX the nearest tiles
       sat ~7u out, which at 3×4 fills a third of the frame and reads as a
       closet rather than a field — the ambient debris and the star parallax
       are what want the tight box, not the twelve things you are meant to
       look AT. Tiles wrap and edge-fade against this instead, so the opening
       spread reaches ~11–17u without a card ever crossing the wrap surface
       while still opaque. Keep the wrap and the fade on the SAME box: they
       are the two halves of hiding the teleport. */
    const TILE_BOX = BOX.clone().multiplyScalar(1.4);
    const TILE_W = 3.0;
    const TILE_H = 4.0;

    /* ---------- camera state ---------- */
    // camera sits at origin (-ish) and rotates via yaw/pitch
    const cam = {
      pos:   new THREE.Vector3(0, 0, 0),
      yaw:   0,
      pitch: 0,
      // exposed velocity (units/sec along look axis)
      vel:   0,
    };
    const camTarget = { yaw: 0, pitch: 0 };
    // Mobile Explore is a separate panorama camera. Automatic drift is removed,
    // while deliberate pinch-flight can still move its current orbit centre.
    let exploreOn = false;
    const exploreAnchor = new THREE.Vector3();
    const exploreViewQ = new THREE.Quaternion();
    const exploreTargetQ = new THREE.Quaternion();
    const exploreEuler = new THREE.Euler(0, 0, 0, "YXZ");
    /* ============================================================
       PARALLAX DRIFT
       ------------------------------------------------------------
       The field used to only TURN in place, which reads as a
       turntable. This translates the camera sideways/vertically on a
       slow Lissajous so near tiles slide past faster than far ones —
       depth becomes legible without any input.

       It is a per-frame POSITION DELTA (never an absolute target), so
       it composes with wheel-fly, the transit treadmill and
       rebaseWorld() without any of them needing to know it exists.

       Amplitude is a *speed* in world-units/sec, not a radius: we
       integrate the derivative of the Lissajous, so the camera never
       gets pulled back to a home point.

       To retune: PDRIFT.amp = how far it wanders per second; .px/.py
       = seconds per cycle on each axis (keep them non-integer
       multiples so the path never repeats visibly). amp: 0 = off.
       ============================================================ */
    const PDRIFT = { amp: 0.42, px: 47, py: 31, focusDamp: 0.12, ease: 0.9 };
    let pdriftGain = 1;      // eased 0..1 — killed while a card is focused
    const _pdR = new THREE.Vector3(), _pdU = new THREE.Vector3();
    // Transit bank: a soft roll the flight treadmill leans into.
    let camRollFX = 0;
    const _qCam = new THREE.Quaternion();
    const _qYaw = new THREE.Quaternion();
    const _qPitch = new THREE.Quaternion();
    const _qr = new THREE.Quaternion();
    const _AXIS_X = new THREE.Vector3(1, 0, 0);
    const _AXIS_Y = new THREE.Vector3(0, 1, 0);
    const _AXIS_Z = new THREE.Vector3(0, 0, 1);

    function updateCameraTransform() {
      if (exploreOn) {
        camera.quaternion.copy(exploreViewQ);
        camera.position.copy(exploreAnchor);
        return;
      }
      // Compose orientation
      _qYaw.setFromAxisAngle(_AXIS_Y, cam.yaw);
      _qPitch.setFromAxisAngle(_AXIS_X, cam.pitch);
      _qCam.multiplyQuaternions(_qYaw, _qPitch);
      if (Math.abs(camRollFX) > 0.0004) {
        _qr.setFromAxisAngle(_AXIS_Z, camRollFX);
        _qCam.multiply(_qr);
      }
      camera.quaternion.copy(_qCam);
      camera.position.copy(cam.pos);
    }
    updateCameraTransform();

    /* ---------- starfield (parallax — also wraps) ---------- */
    const starGeo = new THREE.BufferGeometry();
    const SC = 1400;
    const sPos = new Float32Array(SC * 3);
    for (let i = 0; i < SC; i++) {
      sPos[i*3+0] = (Math.random() - 0.5) * BOX.x * 2;
      sPos[i*3+1] = (Math.random() - 0.5) * BOX.y * 2;
      sPos[i*3+2] = (Math.random() - 0.5) * BOX.z * 2;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);
    // These points are wrapped around the camera every frame by rewriting the
    // position buffer, but the object itself stays at the origin — so its bounding
    // sphere goes stale and Three.js frustum-culls the whole cloud once we fly far
    // ("discover far away"). Disable culling: it always surrounds the camera.
    stars.frustumCulled = false;
    stars.userData = { wrapScale: 2.0 };  // larger box for stars

    // The teal SIGNAL field is now one and the same as the particles that
    // assemble into "0x00" — see the assembly cloud set up below. There is no
    // longer a separate hidden glyph layer.

    /* ---------- tiles (project cards) — placed via Fibonacci to start, then drift on wrap ---------- */
    const tilesGroup = new THREE.Group();
    scene.add(tilesGroup);

    const tiles = [];
    const tileWires = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    // Latitude band for the opening spread — see the placement note below.
    const FIELD_LAT = 0.55;
    // Where the first node stands, and the cone around it that stays empty.
    const GREET_POS = new THREE.Vector3(3.3, 1.9, -13.2);
    const GREET_DIR = GREET_POS.clone().normalize();
    const GREET_COS = Math.cos(26 * Math.PI / 180);
    const GREET_CLEAR_R = 21;        // past this, a card is too far back to eclipse
    const _placeV = new THREE.Vector3();
    const _placeN = new THREE.Vector3();

    /* ============================================================
       driftHome — the ONE definition of where a card lives in free drift.
       ------------------------------------------------------------
       Used at mount to compose the opening view, and again by scatterTiles()
       every time an arranged beat hands the field back to drift. These were
       two separate formulas until now, which is why scrolling origin → title
       re-assembled the cards into the pre-refactor coordinates: the return
       path still had the pole-collapsing latitude, the small BOX and no
       greeting card, so Wafer went back overhead and the field snapped shut
       to its old radius. If a third caller ever needs a drift position, it
       calls this. It does not get its own copy.

       Returns a CAMERA-RELATIVE offset. At mount the camera is at the origin,
       so the two uses agree by construction.
       ============================================================ */
    function driftHome(i, out, jitter) {
      if (i === 0) {
        // THE FIRST NODE GREETS YOU. Placed in front on purpose rather than
        // left to wherever the spiral drops it: a visitor who arrives to empty
        // space has no reason to believe there is anything to find. Yawed to
        // face wherever the camera is actually looking, so a return to the
        // title greets you the same way the first arrival did. Registry order
        // decides who this is — app/data/projects.js puts Wafer first.
        out.copy(GREET_POS);
        return jitter ? out.applyAxisAngle(_AXIS_Y, cam.yaw) : out;
      }
      /* LATITUDE BAND. `1 - (i / (N-1)) * 2` runs latitude +1 → -1, which
         collapses `radial` to 0 and parks the first and last cards exactly
         overhead and underfoot — the two directions nobody looks. The band is
         compressed to ±FIELD_LAT instead: same even spread, roughly ±24° of
         elevation, minus the two positions that were never findable. */
      const n = Math.max(1, projects.length);
      const yN = FIELD_LAT * (1 - ((i + 0.5) / n) * 2);
      const radial = Math.sqrt(1 - yN * yN);
      // Mount is deterministic so the opening view is composed; a return is
      // jittered so the field does not snap back to an identical arrangement.
      const r = jitter ? 0.55 + 0.30 * Math.random()
                       : 0.55 + 0.30 * ((i * 13 % 100) / 100);
      let th = i * goldenAngle + (jitter ? (Math.random() - 0.5) * 1.5 : 0);
      /* KEEP THE GREETING CONE CLEAR. Placing the first node in front only
         works if nothing stands in front of it, and the spiral drops a card
         near the view axis every time. Anything inside the cone and near
         enough to occlude walks around the ring until it is clear — a rule,
         not a tuned phase offset, so adding a project cannot re-break it. */
      for (let guard = 0; guard < 12; guard++) {
        out.set(
          Math.cos(th) * radial * TILE_BOX.x * r * 0.55,
          yN * TILE_BOX.y * r * 0.6,
          Math.sin(th) * radial * TILE_BOX.z * r * 0.55,
        );
        _placeN.copy(out).normalize();
        if (out.length() > GREET_CLEAR_R || _placeN.dot(GREET_DIR) < GREET_COS) break;
        th += 0.62;
      }
      return out;
    }
    const N = projects.length;
    projects.forEach((p, i) => {
      const tex = makeTileTexture(p, THREE);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 1.0,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const geo = new THREE.PlaneGeometry(TILE_W, TILE_H);
      const mesh = new THREE.Mesh(geo, mat);

      // Opening view — see driftHome, the single definition of a drift position.
      mesh.position.copy(driftHome(i, _placeV, false));

      mesh.userData = { project: p, texture: tex, kind: "tile", index: i,
        // each card gets a small persistent rotational offset for personality
        offsetYaw:   ((i * 37 % 100) / 100 - 0.5) * 0.5,   // ±15°
        offsetPitch: ((i * 53 % 100) / 100 - 0.5) * 0.3,   // ±9°
        offsetRoll:  ((i * 29 % 100) / 100 - 0.5) * 0.18,  // ±5°
        wobble: { p: (i * 17 % 100) / 100, a: (i * 23 % 100) / 100 } };
      tilesGroup.add(mesh);
      tiles.push(mesh);

      // ---- per-tile 3D overlay
      // Two paths:
      //   (a) project has a `model` URL → load the GLB with its real materials
      //   (b) otherwise → procedural wireframe primitive as before
      // Both paths register a single "wire" entry in tileWires so the existing
      // follow/rotate/visibility logic in the frame loop works unchanged.
      if (p.pcbBoard && window.makeAboutPCBMesh) {
        // About node: float the actual PCB used by window.MOBoard.
        // on the card, and let the GLB-overlay frame logic below drive it
        // (scale/yaw/opacity) by tagging it as a loaded model.
        const board = window.makeAboutPCBMesh(THREE);
        board.userData.parentTile = mesh;
        board.userData.prim = "pcb";
        board.userData.addr = p.addr;
        board.userData.isModel = true;
        board.userData.loaded = true;
        board.userData.loadedAt = performance.now();
        tilesGroup.add(board);
        tileWires.push(board);
      } else if (p.model && window.loadProjectModel) {
        // Reserve a placeholder Group right away so frame ordering doesn't blink.
        const holder = new THREE.Group();
        holder.userData = {
          parentTile: mesh,
          prim: p.prim || "model",
          addr: p.addr,
          isModel: true,
          loaded: false,
        };
        holder.visible = false;
        tilesGroup.add(holder);
        tileWires.push(holder);

        window.loadProjectModel(p.model, THREE).then((root) => {
          // Centre + scale so longest edge ~2 world units; outer scale.setScalar
          // then matches what the wireframe used to do (0.28 of that).
          // Fit so longest edge = 2 world units; the frame loop then sets the
          // outer holder scale (≈0.85 idle, 1.10 on focus) so the model reads
          // as the card's hero, not a small inset.
          window.fitModelToSize(root, THREE, p.modelFit || 2);
          // Keep each model's real materials; material-less
          // models (e.g. the flashlight) get a solid house material instead.
          if (p.assignMaterial && window.applySolidMaterials) window.applySolidMaterials(root, THREE, p.assignMaterial);
          else if (window.tuneRealMaterials) window.tuneRealMaterials(root, THREE, { envMapIntensity: 2.2 });
          // card overlays fade with distance / wrap → materials must be transparent
          const fadeMaterials = [];
          const seenFadeMaterials = new Set();
          root.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
              m.transparent = true;
              if (!seenFadeMaterials.has(m)) {
                seenFadeMaterials.add(m);
                fadeMaterials.push(m);
              }
            });
          });
          // Per-project rest pose. Apply it to a WRAPPER, never to root:
          // fitModelToSize leaves root.position = -centre·s (and CAD origins sit
          // far from the geometry), so rotating root would swing the model around
          // that off-centre origin — displacing it on the card and making it spin
          // around an outer point. The wrapper rotates around the holder origin,
          // where fitModelToSize parked the geometry centre, so the pose AND the
          // idle turntable both pivot on the true model centre.
          const poseGroup = new THREE.Group();
          if (p.modelPose) poseGroup.rotation.set(p.modelPose.x || 0, p.modelPose.y || 0, p.modelPose.z || 0);
          poseGroup.add(root);
          holder.add(poseGroup);
          holder.visible = true;
          holder.userData.loaded = true;
          holder.userData.fadeMaterials = fadeMaterials;
          holder.userData.lastModelOpacity = NaN;
          holder.userData.loadedAt = performance.now();   // drives a soft fade-in
        }).catch((err) => {
          console.warn("[universe] model load failed for " + p.addr, err);
        });
      } else if (p.prim && window.makePrimitiveMesh) {
        const wire = window.makePrimitiveMesh(p.prim, THREE, {
          wireframe: true,
          color: 0x00f0c8,
          opacity: 0.85,
        });
        wire.scale.setScalar(0.28);                  // tiny — fits in the upper area of the card
        wire.userData.parentTile = mesh;
        wire.userData.prim = p.prim;
        wire.userData.addr = p.addr;
        // Cone sits horizontally — same as on the project page
        if (p.prim === "cone") wire.rotation.set(0, 0, Math.PI / 2);
        tilesGroup.add(wire);
        tileWires.push(wire);
      }
    });

    /* ---------- Arranged-mode target positions ----------
       reel   : the project parade
       origin : the field assembles into 0x00
       drift  : null (free) */
    const tileTargets = projects.map(() => new THREE.Vector3());
    const carouselTarget = new THREE.Vector3();
    /* CLEARED FIELD — one ring, four scales.
       Every beat that needs the cards out of its way puts them on a ring
       around whatever the beat is about. Both x and y come from the ring
       angle, so two nodes can only share a screen position if they share an
       index. The old form took x from a golden-angle spiral and y from a
       linear index ramp, which let neighbours line up: 0x08 sat behind 0x07
       in the origin beat AND in the work reel, and no amount of nudging one
       node fixes a formula that can pair any two. */
    function scatter(i, R, Y, Z, D) {
      const ang = (i / Math.max(1, projects.length)) * Math.PI * 2;
      return tileTargets[i].set(
        Math.cos(ang) * R,
        Math.sin(ang) * Y,
        Z + Math.sin(ang * 2) * D,
      );
    }

    function targetForTile(mode, i, t) {
      const target = tileTargets[i];
      if (mode === "origin") {
        const concept = (window.__mo_origin && window.__mo_origin.concept) || "assembly";
        const m = tiles[i];
        const addr = m && m.userData.project.addr;
        const fIdx = MO_FEATURED.indexOf(addr || "");
        // ASSEMBLY: clear ALL nodes far out so the particle glyph reads clean.
        if (concept === "assembly") return scatter(i, 19, 11, -22, 5);
        // HUB: featured nodes ring the hub, the rest drift back.
        if (fIdx >= 0) {
          const ang = (fIdx / Math.max(1, MO_FEATURED.length)) * Math.PI * 2 - Math.PI / 2 + t * 0.00004;
          return target.set(
            ORIGIN_CENTER.x + Math.cos(ang) * ORIGIN_RING_R,
            ORIGIN_CENTER.y + Math.sin(ang) * ORIGIN_RING_R * 0.62,
            ORIGIN_CENTER.z + Math.sin(ang * 1.3) * 1.4,
          );
        }
        return scatter(i, 16, 9, -18, 4);
      }
      if (mode === "reel") {
        // WORK REEL — the featured tiles parade past the lens (positions 1–4).
        // At the final stop ("Open the universe") every node — all 12 —
        // spirals in and gathers into one slowly-turning galaxy disc in
        // front of the lens: the whole universe collapsing to the passage
        // door. The swirl unwinds as it settles (comets docking into orbit).
        const rb = window.__mo_reel || { pos: 1 };
        const pos = rb.pos || 0;
        const g = Math.max(0, Math.min(1, pos - MO_FEATURED.length));   // 0→1 across the last beat
        const m3 = tiles[i];
        const addr3 = m3 && m3.userData.project.addr;
        const rIdx = MO_FEATURED.indexOf(addr3 || "");
        // Keep the next card far enough away that it cannot loiter half-visible
        // behind the locked one (the "impostor"). 12.5 puts neighbours fully
        // past the frustum edge at z−10.6 while the parade speed still tracks
        // the scroll scrub 1:1.
        const REEL_DX = 12.5;
        if (rIdx >= 0) {
          target.set((rIdx + 1 - pos) * REEL_DX, 0.62, -10.6);
        } else {
          scatter(i, 20, 11, -25, 5);
        }
        if (g > 0.001) {
          // CAROUSEL — every node docks into a slow cylindrical carousel
          // around the passage: the front cards sweep close past the lens
          // (big, crisp), the far side recedes into the blurred deep field.
          // Entry is a spiral — the swirl unwinds as each comet docks into
          // its orbit slot. The ring is gently tilted so it reads in 3D.
          const ang0 = (i / Math.max(1, projects.length)) * Math.PI * 2;
          const spin = t * 0.00026;                  // full revolution ≈ 24s
          const entry = (1 - g) * 2.6;               // swirl unwinds on dock
          const ang = ang0 + spin + entry;
          const R = 7.4;
          carouselTarget.set(
            Math.sin(ang) * R,
            0.55 - Math.cos(ang) * 0.95,             // tilted ring — front dips low
            -12.4 + Math.cos(ang) * R * 0.82,
          );
          target.lerp(carouselTarget, g * g * (3 - 2 * g));  // smooth gather
        }
        return target;
      }
      return null; // drift
    }

    /* ---------- ambient nodes — one atlas, depth-batched billboards ----------
       Twelve camera-depth bins retain transparent interleaving with the cards
       while replacing 180 sprite draws/textures with at most twelve draws and
       one texture. The atlas crops only pixels that were fully transparent. */
    const ambient = [];
    const AMB_N = 180;
    const AMB_BATCH_N = 12;
    const AMB_SCALE = 1.3;
    const ambientLabels = Array.from({ length: AMB_N }, (_, i) => (
      "0x" + (0x10 + i).toString(16).toUpperCase().padStart(2, "0")
    ));
    const ambientAtlas = makeAmbientAtlas(ambientLabels, THREE);
    const ambientMat = new THREE.MeshBasicMaterial({
      map: ambientAtlas.texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      fog: true,
    });
    ambientMat.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute float aAmbientOpacity; varying float vAmbientOpacity;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvAmbientOpacity = aAmbientOpacity;",
        );
      shader.fragmentShader =
        "varying float vAmbientOpacity;\n" +
        shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\ndiffuseColor.a *= vAmbientOpacity;",
        );
    };
    ambientMat.customProgramCacheKey = () => "mo-ambient-atlas-v1";

    const ambientBatches = [];
    for (let b = 0; b < AMB_BATCH_N; b++) {
      const maxVerts = AMB_N * 4;
      const positions = new Float32Array(maxVerts * 3);
      const uvs = new Float32Array(maxVerts * 2);
      const opacity = new Float32Array(maxVerts);
      const indices = new Uint16Array(AMB_N * 6);
      for (let i = 0; i < AMB_N; i++) {
        const v = i * 4;
        const q = i * 6;
        indices[q] = v;
        indices[q + 1] = v + 2;
        indices[q + 2] = v + 1;
        indices[q + 3] = v + 2;
        indices[q + 4] = v + 3;
        indices[q + 5] = v + 1;
      }
      const geo = new THREE.BufferGeometry();
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute("aAmbientOpacity", new THREE.BufferAttribute(opacity, 1).setUsage(THREE.DynamicDrawUsage));
      geo.setDrawRange(0, 0);
      const mesh = new THREE.Mesh(geo, ambientMat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);
      ambientBatches.push({ mesh, geo, positions, uvs, opacity, nodes: [], depthSum: 0 });
    }

    for (let i = 0; i < AMB_N; i++) {
      ambient.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * BOX.x,
          (Math.random() - 0.5) * BOX.y,
          (Math.random() - 0.5) * BOX.z,
        ),
        userData: {
          phase: Math.random() * Math.PI * 2,
          kind: "ambient",
          atlas: ambientAtlas.cells[i],
          opacity: 0.55,
          depth: 0,
        },
      });
    }
    const AMB_DEPTH_SPAN = Math.hypot(BOX.x, BOX.y, BOX.z) * 0.5 + AMB_SCALE;
    const ambientRight = new THREE.Vector3();
    const ambientUp = new THREE.Vector3();

    /* ---------- ORIGIN hub — node 0x00 (the self) ----------
       A special, larger node that only matters in `origin` mode. Every
       project node radiates from it. This is the literal target of the
       later "dive into node 0x00" → About · Board transition. */
    const ORIGIN_CENTER = new THREE.Vector3(0, 0, -9);   // in front of a levelled camera
    const ORIGIN_RING_R = 6.2;                            // project nodes ring radius

    function makeOriginTexture() {
      const oc = document.createElement("canvas");
      oc.width = 256; oc.height = 256;
      const g = oc.getContext("2d");
      g.clearRect(0, 0, 256, 256);
      const cx = 128, cy = 128;
      // concentric rings
      g.strokeStyle = "#00f0c8";
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.9 - i * 0.28;
        g.lineWidth = 2 - i * 0.4;
        g.beginPath(); g.arc(cx, cy, 30 + i * 26, 0, Math.PI * 2); g.stroke();
      }
      g.globalAlpha = 1;
      // crosshair ticks
      g.strokeStyle = "#00f0c8"; g.lineWidth = 1.5;
      [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy]) => {
        g.beginPath();
        g.moveTo(cx + dx * 84, cy + dy * 84);
        g.lineTo(cx + dx * 98, cy + dy * 98);
        g.stroke();
      });
      // core
      g.fillStyle = "#00f0c8";
      g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#04060d";
      g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
      const t = new THREE.CanvasTexture(oc);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    const originGroup = new THREE.Group();
    scene.add(originGroup);
    originGroup.visible = false;

    const originHub = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeOriginTexture(), transparent: true, opacity: 0, depthWrite: false, depthTest: false,
    }));
    originHub.position.copy(ORIGIN_CENTER);
    originHub.scale.set(4.2, 4.2, 1);
    originGroup.add(originHub);

    // radiating links hub → each featured project node
    const featuredTiles = tiles.filter(m => MO_FEATURED.includes(m.userData.project.addr));
    const originLinks = featuredTiles.map((tile) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x00f0c8, transparent: true, opacity: 0, depthWrite: false, depthTest: false,
      }));
      line.userData = { tile };
      originGroup.add(line);
      return line;
    });

    /* ---------- ASSEMBLY cloud — particles that swarm to FORM "0x00" ----------
       Concept 01. A dedicated point cloud whose rest state is scattered through
       the box; in origin/assembly mode each point flies to a target sampled from
       a canvas-rendered "0x00" glyph, giving a 3D constellation of the self. */
    function sampleGlyphTargets(text, count) {
      const cw = 720, ch = 260;
      const gc = document.createElement("canvas");
      gc.width = cw; gc.height = ch;
      const gx = gc.getContext("2d");
      gx.fillStyle = "#000"; gx.fillRect(0, 0, cw, ch);
      gx.fillStyle = "#fff";
      gx.textAlign = "center"; gx.textBaseline = "middle";
      gx.font = "700 210px 'Geist Mono', monospace";
      gx.fillText(text, cw / 2, ch / 2 + 6);
      const data = gx.getImageData(0, 0, cw, ch).data;
      // Finer sampling (every 2px) → crisper letterforms.
      const hits = [];
      for (let y = 0; y < ch; y += 2) {
        for (let x = 0; x < cw; x += 2) {
          if (data[(y * cw + x) * 4] > 128) hits.push([x, y]);
        }
      }
      // Shuffle so any subset we draw is an even sample of the whole glyph
      // (a strided index would band along scan-rows and leave gaps).
      for (let i = hits.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        const t = hits[i]; hits[i] = hits[k]; hits[k] = t;
      }
      // map sampled pixels into world-space targets centred on ORIGIN_CENTER
      const SCALE = 0.024;
      const out = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const h = hits.length ? hits[i % hits.length] : [cw / 2, ch / 2];
        // sub-cell jitter softens the sampling grid without blurring strokes
        const jx = (Math.random() - 0.5) * 1.6;
        const jy = (Math.random() - 0.5) * 1.6;
        out[i*3+0] = ORIGIN_CENTER.x + (h[0] + jx - cw / 2) * SCALE;
        out[i*3+1] = ORIGIN_CENTER.y - (h[1] + jy - ch / 2) * SCALE;
        // SHALLOW depth — keeps the glyph close to a readable plane instead of
        // puffing into a 3D cloud that never resolves into text.
        out[i*3+2] = ORIGIN_CENTER.z + Math.sin(i * 12.9898) * 0.22;
      }
      return out;
    }

    // Denser than the original 560 so the strokes read, but kept modest. This
    // is a single THREE.Points (one draw call); the only per-frame cost is the
    // position loop below — trivial next to the GLB models + bokeh pass.
    const ASM_N = 820;
    const asmTargets = sampleGlyphTargets("0x00", ASM_N);
    // Glyph offsets relative to ORIGIN_CENTER — lets us re-anchor the formed
    // glyph in front of the *camera* each frame instead of at a fixed world
    // point (so it's always in view no matter how far the camera has drifted).
    const asmLocal = new Float32Array(ASM_N * 3);
    for (let i = 0; i < ASM_N; i++) {
      asmLocal[i*3+0] = asmTargets[i*3+0] - ORIGIN_CENTER.x;
      asmLocal[i*3+1] = asmTargets[i*3+1] - ORIGIN_CENTER.y;
      asmLocal[i*3+2] = asmTargets[i*3+2] - ORIGIN_CENTER.z;
    }
    // PORTRAIT FIT. The glyph's world width is tuned for landscape
    // aspect; on a phone the visible width at the anchor distance is narrower
    // than "0x00", so the word ran off both screen edges and read as noise.
    // Scale the local offsets to fit the horizontal FOV, refreshed on resize.
    let glyphHalfW = 0;
    for (let i = 0; i < ASM_N; i++) glyphHalfW = Math.max(glyphHalfW, Math.abs(asmLocal[i*3]));
    let glyphFit = 1;
    function fitGlyphToView() {
      const halfW = Math.tan((camera.fov * Math.PI) / 360) * Math.abs(ORIGIN_CENTER.z) * camera.aspect;
      glyphFit = Math.min(1, (halfW * 0.84) / glyphHalfW);
    }
    fitGlyphToView();
    const asmGeo = new THREE.BufferGeometry();
    const asmPos  = new Float32Array(ASM_N * 3);   // rendered positions (what you see)
    const asmHome = new Float32Array(ASM_N * 3);   // live field positions (drift + wrap)
    for (let i = 0; i < ASM_N; i++) {
      const x = (Math.random() - 0.5) * BOX.x;
      const y = (Math.random() - 0.5) * BOX.y;
      const z = (Math.random() - 0.5) * BOX.z;
      asmHome[i*3+0] = asmPos[i*3+0] = x;
      asmHome[i*3+1] = asmPos[i*3+1] = y;
      asmHome[i*3+2] = asmPos[i*3+2] = z;
    }
    asmGeo.setAttribute("position", new THREE.BufferAttribute(asmPos, 3).setUsage(THREE.DynamicDrawUsage));
    // The teal signal field. Drifts/wraps around the camera like any star; on
    // the ORIGIN beat it peels out of the field to FORM "0x00", then melts back.
    const assemblyPts = new THREE.Points(asmGeo, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.1, sizeAttenuation: true,
      transparent: true, opacity: 0.55, depthWrite: false,
    }));
    const assemblyGroup = new THREE.Group();
    assemblyGroup.add(assemblyPts);
    // Same stale-bounding-sphere fix as the stars: the teal field wraps around the
    // camera via the position buffer, so without this it culls out (green vanishes
    // first) when flying far from origin.
    assemblyPts.frustumCulled = false;
    scene.add(assemblyGroup);

    /* ============================================================
       SIGNAL CONSTELLATION
       Each project links to its 2 nearest neighbours; a shader runs a
       travelling bright pulse along every segment over a faint base glow.
       Rendered strictly BEHIND the card planes (renderOrder -2) so the
       links can never sit over a card face — they only show in the void
       between cards. Brightens on hover/focus; breathes with audio level.
       ============================================================ */
    const TOPO_MAX_E = 26;
    // Max link length. Tied to the card box: at a flat 13 this was tuned to
    // the pre-TILE_BOX spread, and once the cards moved out to 11-17u the
    // typical nearest-neighbour distance passed it — the graph dropped most
    // of its edges and faded what was left to nothing.
    const TOPO_CUT = TILE_BOX.x * 0.5;                  // max link length (world units)
    const TOPO_SEG = 24;                                // segments per edge (smooth pulse gradient)
    const TOPO_CAMERA_GUARD = Math.max(camera.near * 4, 1.2);
    const constUniforms = {
      uTime:  { value: 0 },
      uFlow:  { value: 1.0 },
      uInt:   { value: 0.85 },
      uColor: { value: new THREE.Color(0x00f0c8) },
      uVis:   { value: 1.0 },
    };
    const constMat = new THREE.ShaderMaterial({
      uniforms: constUniforms, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader:
        "attribute float aT; attribute float aA; varying float vT; varying float vA;\n" +
        "void main(){ vT = aT; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform float uTime; uniform float uFlow; uniform float uInt; uniform vec3 uColor; uniform float uVis;\n" +
        "varying float vT; varying float vA;\n" +
        "void main(){\n" +
        "  float base = 0.10;\n" +
        "  float pulse = pow(max(0.0, sin((vT*6.2831 - uTime*uFlow*2.0))), 8.0);\n" +
        "  float a = (base + pulse) * uInt * vA * uVis;\n" +
        "  gl_FragColor = vec4(uColor, a);\n" +
        "}",
    });
    // All signal edges share one line-segment buffer. Each edge keeps the same
    // 24 pulse samples; the index simply connects adjacent pairs, collapsing
    // up to 26 submissions into one appearance-equivalent draw.
    const topoPos = new Float32Array(TOPO_MAX_E * TOPO_SEG * 3);
    const topoT = new Float32Array(TOPO_MAX_E * TOPO_SEG);
    const topoA = new Float32Array(TOPO_MAX_E * TOPO_SEG);
    const topoIndex = new Uint16Array(TOPO_MAX_E * (TOPO_SEG - 1) * 2);
    let topoIndexI = 0;
    for (let e = 0; e < TOPO_MAX_E; e++) {
      const base = e * TOPO_SEG;
      for (let s = 0; s < TOPO_SEG; s++) topoT[base + s] = s / (TOPO_SEG - 1);
      for (let s = 0; s < TOPO_SEG - 1; s++) {
        topoIndex[topoIndexI++] = base + s;
        topoIndex[topoIndexI++] = base + s + 1;
      }
    }
    const constGeo = new THREE.BufferGeometry();
    constGeo.setIndex(new THREE.BufferAttribute(topoIndex, 1));
    constGeo.setAttribute("position", new THREE.BufferAttribute(topoPos, 3).setUsage(THREE.DynamicDrawUsage));
    constGeo.setAttribute("aT", new THREE.BufferAttribute(topoT, 1));
    constGeo.setAttribute("aA", new THREE.BufferAttribute(topoA, 1).setUsage(THREE.DynamicDrawUsage));
    const constGroup = new THREE.LineSegments(constGeo, constMat);
    constGroup.frustumCulled = false;
    constGroup.renderOrder = -2;
    constGroup.visible = false;
    scene.add(constGroup);
    const _topoEdges = [];          // rebuilt periodically: { A, B, ai, bi, len }
    let _topoFrame = 0;

    function updateTopology(dt, mode, focusAddrNow, formP, arrFade) {
      const fx = window.__mo_fx.topology != null ? window.__mo_fx.topology : 1;
      // During the reel's final "Open the universe" gather, the network
      // IGNITES — every node in one disc, every edge alive.
      const gatherG = mode === "reel" ? Math.max(0, Math.min(1, ((window.__mo_reel || {}).pos || 0) - MO_FEATURED.length)) : 0;
      const modeVis = mode === "drift" ? 1 : mode === "reel" ? 0.6 + gatherG * 0.9 : 0;
      const vis = fx * modeVis * (1 - formP) * arrFade;
      constUniforms.uTime.value = (performance.now() % 100000) * 0.001;
      constUniforms.uVis.value = vis;
      if (vis <= 0.012) { constGroup.visible = false; return; }
      constGroup.visible = true;
      const hovAddr = (hoverObjRef.current && hoverObjRef.current.userData.project.addr) || focusAddrNow;

      // rebuild the nearest-neighbour graph every 3rd frame (a dozen nodes — cheap)
      if (_topoFrame++ % 3 === 0) {
        _topoEdges.length = 0;
        const live = [];
        for (const m of tiles) if (m.material.opacity > 0.12) live.push(m);
        for (let i = 0; i < live.length && _topoEdges.length < TOPO_MAX_E; i++) {
          let n1 = -1, n2 = -1, d1 = Infinity, d2 = Infinity;
          for (let j = 0; j < live.length; j++) {
            if (j === i) continue;
            const d = live[i].position.distanceTo(live[j].position);
            if (d < d1)      { d2 = d1; n2 = n1; d1 = d; n1 = j; }
            else if (d < d2) { d2 = d; n2 = j; }
          }
          for (const [nj, dd] of [[n1, d1], [n2, d2]]) {
            if (nj < 0 || dd > TOPO_CUT) continue;
            const a = Math.min(i, nj), b = Math.max(i, nj);
            if (_topoEdges.some(e => e.ai === a && e.bi === b)) continue;
            _topoEdges.push({ A: live[a], B: live[b], ai: a, bi: b, len: dd });
            if (_topoEdges.length >= TOPO_MAX_E) break;
          }
        }
      }

      // write each edge into its line: segment positions + a constant per-edge
      // alpha (closeness · hover-boost · endpoint opacity). The shader adds the
      // travelling pulse over a faint base glow.
      const breathe = 1 + _lvlS * 1.2;
      for (let e = 0; e < TOPO_MAX_E; e++) {
        const E = _topoEdges[e];
        const base = e * TOPO_SEG;
        if (!E) {
          topoA.fill(0, base, base + TOPO_SEG);
          continue;
        }
        const A = E.A.position, B = E.B.position;
        // A link with endpoints on opposite sides of the camera is clipped at
        // the near plane into a viewport-spanning streak. It is not a readable
        // world-space connection, so keep only links wholly in front of the
        // camera with a small near-plane safety margin.
        const depthA = (A.x - camera.position.x) * FORWARD.x
          + (A.y - camera.position.y) * FORWARD.y
          + (A.z - camera.position.z) * FORWARD.z;
        const depthB = (B.x - camera.position.x) * FORWARD.x
          + (B.y - camera.position.y) * FORWARD.y
          + (B.z - camera.position.z) * FORWARD.z;
        if (depthA <= TOPO_CAMERA_GUARD || depthB <= TOPO_CAMERA_GUARD) {
          topoA.fill(0, base, base + TOPO_SEG);
          continue;
        }
        for (let s = 0; s < TOPO_SEG; s++) {
          const t = s / (TOPO_SEG - 1);
          const p = (base + s) * 3;
          topoPos[p] = A.x + (B.x - A.x) * t;
          topoPos[p + 1] = A.y + (B.y - A.y) * t;
          topoPos[p + 2] = A.z + (B.z - A.z) * t;
        }
        const closeness = Math.pow(Math.max(0, 1 - E.len / TOPO_CUT), 1.4);
        let alpha = closeness * breathe;
        const touches = hovAddr && (E.A.userData.project.addr === hovAddr || E.B.userData.project.addr === hovAddr);
        if (touches) alpha = alpha * 2.4 + 0.5;
        alpha *= Math.min(1, Math.min(E.A.material.opacity, E.B.material.opacity) * 1.4);
        topoA.fill(alpha, base, base + TOPO_SEG);
      }
      constGeo.attributes.position.needsUpdate = true;
      constGeo.attributes.aA.needsUpdate = true;
    }

    /* ---------- wrap helper — keep object within [-half, +half] BOX around camera ---------- */
    function wrapAroundCamera(obj, box) {
      const dx = obj.position.x - cam.pos.x;
      const dy = obj.position.y - cam.pos.y;
      const dz = obj.position.z - cam.pos.z;
      if (dx >  box.x / 2) obj.position.x -= box.x;
      if (dx < -box.x / 2) obj.position.x += box.x;
      if (dy >  box.y / 2) obj.position.y -= box.y;
      if (dy < -box.y / 2) obj.position.y += box.y;
      if (dz >  box.z / 2) obj.position.z -= box.z;
      if (dz < -box.z / 2) obj.position.z += box.z;
    }

    /* ---------- input ---------- */
    // Announce the FIRST genuine engagement with the field (drag / wheel-fly /
    // node click) so the title's coachmark can dismiss itself. Cheap to fire
    // repeatedly — the title listener self-removes after the first event.
    const fireInteract = () => {
      try { window.dispatchEvent(new CustomEvent("mo:universeInteract")); } catch (_) {}
    };
    let dragging = false, dragMoved = false;
    let lastX = 0, lastY = 0, downX = 0, downY = 0;
    let idleTimer = 0;
    let driftActive = true;
    // Pointer-in-zone tracking — wheel only flies the camera when the cursor
    // is over the universe mount (not over UI). Updated by pointer enter/leave.
    let pointerInZone = false;
    const stopDrift = () => {
      driftActive = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!exploreOn) driftActive = true; }, 3200);
    };

    mount.addEventListener("pointerenter", () => { pointerInZone = true;  });
    mount.addEventListener("pointerleave", () => { pointerInZone = false; });

    // Multi-pointer tracking: one finger = look, two fingers = pinch-flight.
    const _pts = new Map();
    let pinching = false, _pinchD = 0;
    const _pinchDist = () => {
      const p = [..._pts.values()];
      return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    };
    mount.addEventListener("pointerdown", (e) => {
      _pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (_pts.size === 2) {
        pinching = true; _pinchD = _pinchDist();
        dragging = false;
        stopDrift(); fireInteract();
        try { mount.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      dragging = true; dragMoved = false;
      lastX = downX = e.clientX; lastY = downY = e.clientY;
      mount.style.cursor = "grabbing";
      stopDrift();
      mount.setPointerCapture(e.pointerId);
    });
    mount.addEventListener("pointerup", (e) => {
      _pts.delete(e.pointerId);
      if (pinching) {
        if (_pts.size < 2) {
          pinching = false;
          if (gyroOn && exploreOn) rebaseGyroToExploreTarget();
          if (exploreOn && _pts.size === 1) {
            const remaining = _pts.values().next().value;
            dragging = true;
            dragMoved = true;
            lastX = downX = remaining.x;
            lastY = downY = remaining.y;
          }
        }
        try { mount.releasePointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      if (!dragging) return;
      dragging = false;
      mount.style.cursor = "grab";
      try { mount.releasePointerCapture(e.pointerId); } catch (_) {}
      if (gyroOn && exploreOn) rebaseGyroToExploreTarget();
      if (!dragMoved) handleClick(e.clientX, e.clientY);
    });
    mount.addEventListener("pointercancel", (e) => {
      _pts.delete(e.pointerId);
      if (_pts.size < 2) {
        pinching = false;
        if (gyroOn && exploreOn) rebaseGyroToExploreTarget();
      }
      dragging = false; mount.style.cursor = "grab";
    });
    mount.addEventListener("pointerleave", () => {
      hoverObjRef.current = null;
      setHover(null);
      if (window.MOSound && MOSound.unhover) MOSound.unhover();
    });
    // hover hit-test is throttled to one raycast per frame — high-frequency
    // mice fire several pointermove events per frame and the raycast is the cost.
    let hoverRaf = 0, hoverX = 0, hoverY = 0;
    const runHover = () => { hoverRaf = 0; if (!dragging) handleHover(hoverX, hoverY); };
    mount.addEventListener("pointermove", (e) => {
      if (_pts.has(e.pointerId)) _pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // Preserve the original pinch-flight: spread to move forward, squeeze
      // to move back. Explore suppresses only automatic camera translation.
      if (pinching) {
        if (_pts.size === 2) {
          const d = _pinchDist();
          cam.vel += (d - _pinchD) * 0.05;
          cam.vel = Math.max(-22, Math.min(22, cam.vel));
          _pinchD = d;
        }
        return;
      }
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) { if (!dragMoved) fireInteract(); dragMoved = true; }
        if (exploreOn) {
          applyExploreDrag(dx, dy);
        } else {
          camTarget.yaw   -= dx * 0.0035;
          camTarget.pitch -= dy * 0.0035;
          camTarget.pitch = Math.max(-1.45, Math.min(1.45, camTarget.pitch));
        }
        hoverObjRef.current = null;
        setHover(null);
      } else {
        hoverX = e.clientX; hoverY = e.clientY;
        if (!hoverRaf) hoverRaf = requestAnimationFrame(runHover);
      }
    });

    // Wheel: fly the camera only when the pointer is inside the universe zone
    // AND we're in drift mode (title/intro). Otherwise pass-through to page scroll.
    //
    // INTENT YIELD (opt-in via window.__mo_fx.wheelYield = px budget):
    // a visitor who only wants to move on keeps wheeling one way and never
    // looks around. Once that one-directional budget is spent the field hands
    // the wheel back to the page mid-gesture — nothing to press or aim at.
    // Reversing the wheel or any real look (drag / pinch / tap) re-arms flight.
    let _wAcc = 0, _wCeded = false;
    const rearmWheel = () => { _wAcc = 0; _wCeded = false; };
    mount.addEventListener("wheel", (e) => {
      if (!pointerInZone) return;
      if (modeRef.current !== "drift") return;
      const budget = window.__mo_fx && window.__mo_fx.wheelYield;
      if (budget) {
        if (e.deltaY > 0) {
          _wAcc += e.deltaY;
          if (_wCeded || _wAcc > budget) {
            if (!_wCeded) {
              _wCeded = true;
              document.body.classList.add("mo-yield");
              setTimeout(() => document.body.classList.remove("mo-yield"), 1400);
            }
            return;                          // let the page take the scroll
          }
        } else {
          rearmWheel();
        }
      }
      e.preventDefault();
      fireInteract();
      cam.vel += -e.deltaY * 0.025;
      cam.vel = Math.max(-22, Math.min(22, cam.vel));
      stopDrift();
    }, { passive: false });
    mount.addEventListener("pointerdown", rearmWheel);

    /* ---------- MOBILE API: fixed-eye panorama + calibrated gyro ----------
       DeviceOrientationControls' YXZ basis converts all three device axes and
       the current screen orientation into a camera quaternion. The first valid
       sample is aligned to the view already on screen, so enabling the sensor
       never jumps. frame() then supplies the sole smoothing stage. */
    let gyroOn = false, gyroReady = false, gyroAnnounced = false;
    const GYRO_NOISE = THREE.MathUtils.degToRad(0.12);
    const gyroEuler = new THREE.Euler(0, 0, 0, "YXZ");
    const gyroOutEuler = new THREE.Euler(0, 0, 0, "YXZ");
    const gyroSensorQ = new THREE.Quaternion();
    const gyroAcceptedQ = new THREE.Quaternion();
    const gyroIncomingQ = new THREE.Quaternion();
    const gyroOffsetQ = new THREE.Quaternion();
    const gyroWorldQ = new THREE.Quaternion();
    const gyroInverseQ = new THREE.Quaternion();
    const gyroScreenQ = new THREE.Quaternion();
    const gyroScreenFixQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0), -Math.PI / 2
    );
    const gyroZ = new THREE.Vector3(0, 0, 1);

    function setExploreTargetFromAngles(yaw, pitch) {
      exploreEuler.set(
        Math.max(-1.45, Math.min(1.45, pitch)),
        yaw,
        0,
        "YXZ"
      );
      exploreTargetQ.setFromEuler(exploreEuler).normalize();
    }

    function syncAnglesFromExploreView() {
      exploreEuler.setFromQuaternion(exploreViewQ, "YXZ");
      cam.yaw = nearestAngle(cam.yaw, exploreEuler.y);
      cam.pitch = Math.max(-1.45, Math.min(1.45, exploreEuler.x));
      camTarget.yaw = cam.yaw;
      camTarget.pitch = cam.pitch;
    }

    function screenOrientationRadians() {
      const angle = window.screen && window.screen.orientation && Number.isFinite(window.screen.orientation.angle)
        ? window.screen.orientation.angle
        : (Number(window.orientation) || 0);
      return THREE.MathUtils.degToRad(angle);
    }

    function sensorQuaternion(e, out) {
      if (!Number.isFinite(e.alpha) || !Number.isFinite(e.beta) || !Number.isFinite(e.gamma)) return false;
      gyroEuler.set(
        THREE.MathUtils.degToRad(e.beta),
        THREE.MathUtils.degToRad(e.alpha),
        -THREE.MathUtils.degToRad(e.gamma),
        "YXZ"
      );
      out.setFromEuler(gyroEuler);
      out.multiply(gyroScreenFixQ);
      gyroScreenQ.setFromAxisAngle(gyroZ, -screenOrientationRadians());
      out.multiply(gyroScreenQ).normalize();
      return true;
    }

    function levelExploreTargetFromGyro() {
      gyroWorldQ.multiplyQuaternions(gyroOffsetQ, gyroSensorQ).normalize();
      gyroOutEuler.setFromQuaternion(gyroWorldQ, "YXZ");
      const yaw = nearestAngle(camTarget.yaw, gyroOutEuler.y);
      const pitch = Math.max(-1.45, Math.min(1.45, gyroOutEuler.x));
      setExploreTargetFromAngles(yaw, pitch);
    }

    function rebaseGyroToExploreTarget() {
      if (!gyroOn || !gyroReady) return;
      gyroInverseQ.copy(gyroSensorQ).invert();
      gyroOffsetQ.multiplyQuaternions(exploreTargetQ, gyroInverseQ).normalize();
      gyroAcceptedQ.copy(gyroSensorQ);
    }

    function resetGyroCalibration() {
      // Reframe against what is actually rendered, not a target that may still
      // be ahead of the eased camera during a fast turn or screen rotation.
      if (exploreOn) {
        exploreTargetQ.copy(exploreViewQ);
        syncAnglesFromExploreView();
      }
      gyroReady = false;
      gyroAcceptedQ.identity();
    }

    function applyExploreDrag(dx, dy) {
      exploreEuler.setFromQuaternion(exploreTargetQ, "YXZ");
      const yaw = nearestAngle(camTarget.yaw, exploreEuler.y) - dx * 0.0035;
      const pitch = Math.max(-1.45, Math.min(1.45, exploreEuler.x - dy * 0.0035));
      setExploreTargetFromAngles(yaw, pitch);
      camTarget.yaw = yaw;
      camTarget.pitch = pitch;
      if (gyroOn && gyroReady) rebaseGyroToExploreTarget();
    }

    const onGyro = (e) => {
      if (!gyroOn || !exploreOn || !sensorQuaternion(e, gyroIncomingQ)) return;
      gyroSensorQ.copy(gyroIncomingQ);
      if (!gyroReady) {
        gyroReady = true;
        gyroAcceptedQ.copy(gyroSensorQ);
        gyroInverseQ.copy(gyroSensorQ).invert();
        gyroOffsetQ.multiplyQuaternions(exploreTargetQ, gyroInverseQ).normalize();
        if (!gyroAnnounced) {
          gyroAnnounced = true;
          try { window.dispatchEvent(new CustomEvent("mo:gyroOn")); } catch (_) {}
        }
        return;
      }
      if (dragging || pinching) return;
      if (gyroAcceptedQ.angleTo(gyroSensorQ) < GYRO_NOISE) return;
      gyroAcceptedQ.copy(gyroSensorQ);
      levelExploreTargetFromGyro();
    };
    const onGyroFrameChange = () => { if (gyroOn) resetGyroCalibration(); };
    const onGyroVisibility = () => { if (!document.hidden && gyroOn) resetGyroCalibration(); };
    window.addEventListener("deviceorientation", onGyro, true);
    window.addEventListener("orientationchange", onGyroFrameChange, { passive: true });
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener("change", onGyroFrameChange);
    }
    document.addEventListener("visibilitychange", onGyroVisibility);
    window.__mo_universe = {
      /* Screen box of the tile carrying this project, in viewport space, or
         null when it is hidden or behind the camera. The work reel uses this
         so the handoff lifts out of the card that is already showing the
         model rather than out of its caption bar. */
      tileBounds(addr) {
        if (!addr) return null;
        // The model itself is the better origin: it is the thing that flies,
        // and its projected height is what the handoff sizes the rig from.
        // Models float above their cards, so a card near the top of the
        // viewport can have its model entirely off screen - fall back to the
        // card quad there rather than handing back coordinates nobody can see.
        const mb = modelViewportBounds(addr);
        if (onScreenBox(mb)) return mb;
        const m = tiles.find(t => t.userData && t.userData.project && t.userData.project.addr === addr);
        if (!m || !m.visible) return null;
        const b = tileViewportBounds(m);
        return onScreenBox(b) ? b : null;
      },
      fly(v) {
        cam.vel = Math.max(-22, Math.min(22, cam.vel + v));
        stopDrift(); fireInteract();
      },
      setExplore(on) {
        const next = !!on;
        mount.style.touchAction = next ? "none" : "pan-y pinch-zoom";
        if (next === exploreOn) return;
        if (next) {
          exploreOn = true;
          clearTimeout(idleTimer);
          driftActive = false;
          cam.vel = 0;
          camRollFX = 0;
          pdriftGain = PDRIFT.focusDamp;
          exploreAnchor.copy(cam.pos);
          exploreEuler.set(cam.pitch, cam.yaw, 0, "YXZ");
          exploreViewQ.setFromEuler(exploreEuler).normalize();
          exploreTargetQ.copy(exploreViewQ);
          resetGyroCalibration();
          fireInteract();
        } else {
          for (const pointerId of _pts.keys()) {
            try {
              if (!mount.hasPointerCapture || mount.hasPointerCapture(pointerId)) {
                mount.releasePointerCapture(pointerId);
              }
            } catch (_) {}
          }
          _pts.clear();
          dragging = false;
          dragMoved = false;
          pinching = false;
          mount.style.cursor = "grab";
          syncAnglesFromExploreView();
          exploreOn = false;
          cam.vel = 0;
          stopDrift();
          updateCameraTransform();
        }
      },
      setGyro(on) {
        gyroOn = !!on;
        gyroAnnounced = false;
        resetGyroCalibration();
      },
      isGyro() { return gyroOn; },
      isGyroActive() { return gyroOn && gyroReady; },
      recenterGyro() { if (gyroOn && gyroReady) rebaseGyroToExploreTarget(); },
    };

    /* ---------- raycasting ---------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function pickAt(clientX, clientY) {
      const rect = mount.getBoundingClientRect();
      ndc.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      ndc.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      /* Raycaster ignores material opacity, and these tiles are never hidden
         with `visible` — only faded. So a card at opacity 0 (mid-wrap, or
         parked on the scatter ring during the reel) stayed hoverable: the LOCK
         reticle would appear over empty space and a click there navigated to a
         project the visitor could not see. Ignore anything the eye cannot. */
      const hits = raycaster.intersectObjects(tiles, false);
      for (const h of hits) {
        const op = h.object && h.object.material && h.object.material.opacity;
        if (op == null || op > 0.12) return h;
      }
      return null;
    }

    /* ---------- screen-space tile bounds (tight) ---------- */
    const v3 = new THREE.Vector3();
    const camDirTmp = new THREE.Vector3();
    // Hoisted scratch — reused every call (this runs per-move AND every frame
    // for HUD tracking, so per-call allocation showed up in the profile).
    const _tsbHW = TILE_W / 2, _tsbHH = TILE_H / 2;
    const _tsbCorners = [
      new THREE.Vector3(-_tsbHW, -_tsbHH, 0),
      new THREE.Vector3( _tsbHW, -_tsbHH, 0),
      new THREE.Vector3(-_tsbHW,  _tsbHH, 0),
      new THREE.Vector3( _tsbHW,  _tsbHH, 0),
    ];
    const _tsbCamRel = new THREE.Vector3();
    function tileScreenBounds(mesh) {
      const rect = mount.getBoundingClientRect();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      camera.getWorldDirection(camDirTmp);
      for (const c of _tsbCorners) {
        v3.copy(c);
        mesh.localToWorld(v3);
        // skip overlay if any corner is behind the camera
        _tsbCamRel.copy(v3).sub(camera.position);
        if (_tsbCamRel.dot(camDirTmp) <= 0) return null;
        v3.project(camera);
        const sx = ( v3.x * 0.5 + 0.5) * rect.width;
        const sy = (-v3.y * 0.5 + 0.5) * rect.height;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    /* Same box in VIEWPORT (client) space. tileScreenBounds stays mount-local
       because the hover HUD is positioned inside the mount, but anything
       outside this component - the node handoff in particular - needs client
       coordinates, so the mount offset has to be added back. */
    function tileViewportBounds(mesh) {
      const b = tileScreenBounds(mesh);
      if (!b) return null;
      const rect = mount.getBoundingClientRect();
      return { x: b.x + rect.left, y: b.y + rect.top, w: b.w, h: b.h };
    }

    /* Projected box of the MODEL on a tile, in viewport space. The handoff
       needs this rather than the card quad: it sizes the flying rig so the
       model keeps the on-screen height it already had, and the card is much
       taller than the object sitting on it. */
    /* A box is only worth handing out as a flight origin if the reader can
       actually see it. */
    function onScreenBox(b) {
      return !!b && b.w >= 8 && b.h >= 8 &&
        b.x + b.w > 0 && b.y + b.h > 0 &&
        b.x < window.innerWidth && b.y < window.innerHeight;
    }

    const _mvbBox = new THREE.Box3();
    function modelViewportBounds(addr) {
      const holder = tileWires.find(o =>
        o.userData && o.userData.isModel && o.userData.addr === addr &&
        o.userData.loaded && o.visible);
      if (!holder) return null;
      _mvbBox.setFromObject(holder);
      if (_mvbBox.isEmpty()) return null;
      const rect = mount.getBoundingClientRect();
      camera.getWorldDirection(camDirTmp);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < 8; i++) {
        v3.set(
          (i & 1) ? _mvbBox.max.x : _mvbBox.min.x,
          (i & 2) ? _mvbBox.max.y : _mvbBox.min.y,
          (i & 4) ? _mvbBox.max.z : _mvbBox.min.z,
        );
        _tsbCamRel.copy(v3).sub(camera.position);
        if (_tsbCamRel.dot(camDirTmp) <= 0) return null;   // corner behind the lens
        v3.project(camera);
        const sx = ( v3.x * 0.5 + 0.5) * rect.width  + rect.left;
        const sy = (-v3.y * 0.5 + 0.5) * rect.height + rect.top;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, isModel: true };
    }

    /* ---------- screen-space tile CORNERS (perimeter order) ----------
       Returns the 4 projected corners of the tilted card quad in mount-local
       px — TL, TR, BR, BL clockwise — so the HUD can hug the card's true
       (rotated) shape instead of an axis-aligned box. null = behind camera. */
    const _tscCorners = [
      new THREE.Vector3(-_tsbHW,  _tsbHH, 0), // TL (local y up)
      new THREE.Vector3( _tsbHW,  _tsbHH, 0), // TR
      new THREE.Vector3( _tsbHW, -_tsbHH, 0), // BR
      new THREE.Vector3(-_tsbHW, -_tsbHH, 0), // BL
    ];
    const _tscOut = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0} ];
    function tileScreenCorners(mesh) {
      const rect = mount.getBoundingClientRect();
      camera.getWorldDirection(camDirTmp);
      for (let i = 0; i < 4; i++) {
        v3.copy(_tscCorners[i]);
        mesh.localToWorld(v3);
        _tsbCamRel.copy(v3).sub(camera.position);
        if (_tsbCamRel.dot(camDirTmp) <= 0) return null;   // any corner behind cam → bail
        v3.project(camera);
        _tscOut[i].x = ( v3.x * 0.5 + 0.5) * rect.width;
        _tscOut[i].y = (-v3.y * 0.5 + 0.5) * rect.height;
      }
      return _tscOut;
    }

    function handleHover(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) {
        if (hoverObjRef.current) { hoverObjRef.current = null; setHover(null); if (window.MOSound && MOSound.unhover) MOSound.unhover(); }
        return;
      }
      const m = hit.object;
      // The frame loop repositions the HUD every frame from hoverObjRef, so we
      // only pay for a React re-render when the hovered PROJECT actually
      // changes — moving within the same card is free.
      if (hoverObjRef.current === m) return;
      const screen = tileScreenBounds(m);
      if (!screen) return;
      hoverObjRef.current = m;
      setHover({ project: m.userData.project, screen });
      // the touch disturbs the field — a soft ripple spreads from the node
      if (window.__mo_disturb) window.__mo_disturb(cx, cy, 0.3);
      // sonify: the hovered node sings its sideband against the 0x00 carrier
      if (window.MOSound && MOSound.hover) { MOSound.unhover(); MOSound.hover(m.userData.project.addr); }
    }

    function handleClick(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) return;
      fireInteract();
      // a click is a strong disturbance — the wavefront blooms from the node
      if (window.__mo_disturb) window.__mo_disturb(cx, cy, 1.0);
      const m = hit.object;
      const p = m.userData.project;
      // sonify the click: strike this node + let the 0x00 carrier bloom
      if (window.MOSound && MOSound.open) MOSound.open(p.addr);

      // Aim the camera at the tile first so the screen composes around it.
      const rel = m.position.clone().sub(cam.pos);
      const yaw = Math.atan2(rel.x, -rel.z);
      const flat = Math.sqrt(rel.x * rel.x + rel.z * rel.z);
      const pitch = Math.atan2(rel.y, flat);
      camTarget.yaw   = nearestAngle(camTarget.yaw, yaw);
      camTarget.pitch = Math.max(-1.45, Math.min(1.45, pitch));

      // If this project has its own page, fly to it.
      if (p.file) {
        cam.vel = Math.max(cam.vel, 6);   // small forward dolly = "clicking into"
        // where the model sits on screen NOW (card quad only as a fallback)
        const _mb = modelViewportBounds(p.addr);
        const originRect = onScreenBox(_mb) ? _mb : tileViewportBounds(m);
        navigateToProject(p, originRect);
        return;
      }

      cam.vel = Math.max(cam.vel, 0);
      setActiveAddr(p.addr);
      if (onActive) onActive(p);
      stopDrift();
    }

    function navigateToProject(p, originRect) {
      // The handoff layer installs window.__mo_open_project. Direct navigation
      // remains the fallback when that transition is unavailable.
      if (typeof window.__mo_open_project === "function") {
        window.__mo_open_project(p, originRect);
        return;
      }
      sessionStorage.setItem("mo_navigate_from_addr", p.addr);
      document.body.classList.add("landing-exit");
      setTimeout(() => { window.location.href = p.file; }, 380);
    }

    function nearestAngle(cur, t) {
      while (t - cur > Math.PI)  t -= Math.PI * 2;
      while (t - cur < -Math.PI) t += Math.PI * 2;
      return t;
    }

    /* ---------- resize ---------- */
    const onResize = () => {
      const s = sz(); w = s.w; h = s.h;
      renderer.setSize(w, h);
      // ResizeObserver fires on any transition to 0x0, and w/0 bakes Infinity
      // (or NaN) into the projection matrix permanently — the scene then draws
      // nothing until a later non-zero resize.
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      fitGlyphToView();
      if (cursorFx) cursorFx.resize(w, h);
      if (composer) composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    /* ---------- loop ---------- */
    let raf;
    let last = performance.now();
    let frameI = 0;
    const FORWARD = new THREE.Vector3();
    const frameLerp = (rate, dt) => 1 - Math.pow(1 - rate, dt / 16);

    // Hoisted scratch — reused every frame so the hot loops allocate nothing.
    const _camDir   = new THREE.Vector3();
    const _off      = new THREE.Vector3();
    const _localOff = new THREE.Vector3();
    const _lookM    = new THREE.Matrix4();
    const _baseQ    = new THREE.Quaternion();
    const _offQ     = new THREE.Quaternion();
    const _euler    = new THREE.Euler();
    const _vScale   = new THREE.Vector3();
    // Star wrap box never changes — compute once instead of cloning per frame.
    const SBOX = BOX.clone().multiplyScalar(stars.userData.wrapScale);
    // Keep absolute coordinates small over very long sessions: when the camera
    // has flown far from the origin, shift the whole world back so floats stay
    // precise (everything wraps around the camera, so this is invisible).
    const REBASE_DIST2 = 600 * 600;
    function shiftBufferAttr(attr, sx, sy, sz) {
      const a = attr.array;
      for (let i = 0; i < a.length; i += 3) { a[i] -= sx; a[i+1] -= sy; a[i+2] -= sz; }
      attr.needsUpdate = true;
    }
    function rebaseWorld() {
      const sx = cam.pos.x, sy = cam.pos.y, sz = cam.pos.z;
      cam.pos.set(0, 0, 0);
      camera.position.copy(cam.pos);
      for (const m of tiles) {
        m.position.x -= sx; m.position.y -= sy; m.position.z -= sz;
        const d = m.userData.driftTarget;
        if (d) { d.x -= sx; d.y -= sy; d.z -= sz; }
      }
      for (const sp of ambient) { sp.position.x -= sx; sp.position.y -= sy; sp.position.z -= sz; }
      shiftBufferAttr(stars.geometry.attributes.position, sx, sy, sz);
      const aArr = assemblyPts.geometry.attributes.position.array;
      for (let i = 0; i < aArr.length; i += 3) {
        aArr[i] -= sx; aArr[i+1] -= sy; aArr[i+2] -= sz;
        asmHome[i] -= sx; asmHome[i+1] -= sy; asmHome[i+2] -= sz;
      }
      // The field-follow tracker is in absolute world space too — after a rebase
      // the camera sits at the origin, so the tracker must reset with it (else
      // the next frame computes a gigantic camera delta and flings the field).
      _fieldCam.set(0, 0, 0);
      assemblyPts.geometry.attributes.position.needsUpdate = true;
    }

    // Wrap the assembly field around the camera, mirroring each ±BOX shift onto
    // the rendered buffer so eased points never streak across the box on wrap.
    function wrapAssemblyField(arr, home, box) {
      for (let i = 0; i < home.length; i += 3) {
        const dx = home[i]   - cam.pos.x;
        const dy = home[i+1] - cam.pos.y;
        const dz = home[i+2] - cam.pos.z;
        if      (dx >  box.x / 2) { home[i]   -= box.x; arr[i]   -= box.x; }
        else if (dx < -box.x / 2) { home[i]   += box.x; arr[i]   += box.x; }
        if      (dy >  box.y / 2) { home[i+1] -= box.y; arr[i+1] -= box.y; }
        else if (dy < -box.y / 2) { home[i+1] += box.y; arr[i+1] += box.y; }
        if      (dz >  box.z / 2) { home[i+2] -= box.z; arr[i+2] -= box.z; }
        else if (dz < -box.z / 2) { home[i+2] += box.z; arr[i+2] += box.z; }
      }
    }

    let prevMode = mode;
    // Flight treadmill state persists across frames.
    let flowSm = 0;
    const FLOW_RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // Persistent assembly state — eased every frame so the "0x00" glyph forms and
    // melts smoothly, fully decoupled from the discrete React `mode` (which flips
    // on a coarse IntersectionObserver and can lag / stick). Formation is driven
    // purely by the origin section's continuous scroll progress.
    let formActual = 0;
    const _glyphC = new THREE.Vector3();
    // Camera position the assembly field was last anchored to. While the glyph
    // is formed we translate the field by the per-frame camera delta so the
    // un-formed scatter stays in NEAR space around the viewer (see frame loop).
    const _fieldCam = new THREE.Vector3();
    function scatterTiles() {
      // Hand the field back to free drift. The tile keeps its current position
      // and the drift loop lerps it to this target, so leaving an arranged beat
      // reads as the cards flying home rather than snapping and fading in.
      // driftHome is the SAME function that composed the opening view — that is
      // the whole point, and it is why returning to the title now rebuilds the
      // arrangement you arrived on instead of the pre-refactor one.
      for (const m of tiles) {
        const v = driftHome(m.userData.index, new THREE.Vector3(), true);
        m.userData.driftTarget = v.add(cam.pos);
      }
    }

    function frame(now) {
      // Paused while the inline board flight covers the viewport — saves the GPU
      // from rendering two WebGL scenes at once. dt is reset so resume won't jump.
      // Also pause when the tab/preview is hidden (no point rendering offscreen).
      if (window.__mo_universe_pause || document.hidden || !uniOnScreen) { last = now; raf = requestAnimationFrame(frame); return; }
      const dt = Math.max(0, Math.min(50, now - last)); last = now;
      const mode = modeRef.current;
      const focusAddrNow = focusRef.current;
      const isArranged = (mode === "reel" || mode === "origin");

      /* ── per-frame effects state ── */
      // real audio output level → the field visibly breathes with the sound
      const lvlT = (window.MOSound && window.MOSound.getLevel && !window.MOSound.isMuted()) ? window.MOSound.getLevel() : 0;
      _lvlS += (lvlT - _lvlS) * (1 - Math.pow(0.86, dt / 16));
      // arrival overture — collapse → burst → the field fades up
      let arrFade = 1, arrCollapse = 0;
      if (ARR.t0) {
        const ap = (now - ARR.t0) / ARR.dur;
        if (ap >= 1) ARR.t0 = 0;
        else {
          arrCollapse = 1 - THREE.MathUtils.smoothstep(ap, 0.40, 0.62);
          arrFade = THREE.MathUtils.smoothstep(ap, 0.50, 0.92);
          if (!ARR.burst && ap >= 0.42) {
            ARR.burst = true;
            if (window.__mo_disturb) window.__mo_disturb(window.innerWidth / 2, window.innerHeight * 0.52, 1.35);
            try { if (window.CarrierField && window.CarrierField.isWoken() && window.MOSound && !window.MOSound.isMuted()) window.CarrierField.carrierAccent(1); } catch (_) {}
          }
        }
      }
      stars.material.opacity = (0.7 + _lvlS * 0.45) * (0.35 + 0.65 * arrFade);
      // idle attention — after ~30s of stillness the field notices you:
      // the camera turns softly toward the nearest node, a slow ripple
      // crosses the screen, and the field murmurs.
      if (!exploreOn && mode === "drift" && !_idleFired && now - _lastAct > 30000 && !ARR.t0) {
        _idleFired = true;
        let nearTile = null, nd = Infinity;
        for (const m of tiles) {
          const d = m.position.distanceToSquared(camera.position);
          if (d > 9 && d < nd) { nd = d; nearTile = m; }
        }
        if (nearTile) {
          const rel = nearTile.position.clone().sub(cam.pos);
          camTarget.yaw = nearestAngle(camTarget.yaw, Math.atan2(rel.x, -rel.z));
          camTarget.pitch = Math.max(-1.2, Math.min(1.2, Math.atan2(rel.y, Math.sqrt(rel.x * rel.x + rel.z * rel.z))));
        }
        if (window.__mo_disturb) window.__mo_disturb(window.innerWidth / 2, window.innerHeight / 2, 0.9);
        try { if (window.MOSound && !window.MOSound.isMuted() && window.MOSound.gather) window.MOSound.gather(); } catch (_) {}
        setIdleNote(true);
        setTimeout(() => setIdleNote(false), 6000);
      }

      // Detect mode change. Going from an arranged mode back to drift needs
      // a fresh scatter — otherwise the cards stay locked forever.
      if (mode !== prevMode) {
        if (mode === "drift" && (prevMode === "reel" || prevMode === "origin")) {
          scatterTiles();
        }
        prevMode = mode;
      }

      /* idle drift — only in drift mode */
      if (!exploreOn && !FLOW_RM && driftActive && mode === "drift") {
        cam.vel += dt * 0.0008;     // tiny accel toward forward drift
        camTarget.yaw += dt * 0.000035;   // parallax drift carries most of the motion
        camTarget.pitch += Math.sin(now * 0.00022) * dt * 0.00003;
      }

      /* TRANSIT TREADMILL: the camera stays parked so formations always
         assemble dead ahead of a settled, centered camera while the world
         streams past it. Every
         wrapped layer — free tiles, ambient motes, stars, the teal signal
         field — flows backward along the look axis while the flight
         timeline is in a transit leg; the torus wrap recycles everything,
         so the field is an infinite treadmill. It reads as real travel
         from any camera pose and can never strand content off-screen,
         because nothing FORMED ever moves. A soft roll banks into each
         leg; FOV + aberration surge ride on top (further down). */
      const _fl = window.__mo_flight || {};
      const _flTransit = _fl.seg === "toOrigin" || _fl.seg === "toWork" || _fl.seg === "toAbout";
      let _flowDX = 0, _flowDY = 0, _flowDZ = 0;
      {
        const cfgF = window.__mo_flightCfg || {};
        const styleMul = cfgF.style === "calm" ? 0.45 : 1;
        const warpMul  = (cfgF.warp != null ? cfgF.warp : 65) / 65;
        let flowTarget = 0, rollTarget = 0;
        if (!exploreOn && _flTransit && !FLOW_RM) {
          const tt = Math.max(0, Math.min(1, _fl.t || 0));
          const bell = Math.sin(Math.PI * tt);          // ease in and out of the leg
          flowTarget = (3.4 + Math.min(24, _fl.speed || 0) * 0.6) * bell * styleMul * warpMul;
          const legRoll = _fl.seg === "toWork" ? 1 : _fl.seg === "toAbout" ? -0.7 : -0.45;
          // Optional page-level scaler (window.__mo_fx.legRoll)
          // tempers the toWork bank; defaults to 1 so other pages are unchanged.
          const legRollMul = window.__mo_fx && window.__mo_fx.legRoll != null ? window.__mo_fx.legRoll : 1;
          rollTarget = legRoll * 0.055 * bell * styleMul * Math.min(1.3, warpMul) * legRollMul;
        }
        flowSm    += (flowTarget - flowSm)    * (1 - Math.pow(0.90, dt / 16));
        camRollFX += (rollTarget - camRollFX) * (1 - Math.pow(0.93, dt / 16));
        if (!exploreOn && flowSm > 0.02) {
          // level flow along the look heading — vertical framing never shifts
          const d = flowSm * dt / 1000;
          _flowDX = -Math.sin(cam.yaw) * d;
          _flowDZ = -Math.cos(cam.yaw) * d;
          _flowDY = 0;
          // stars + ambient motes stream every transit; free tiles only while
          // drifting (arranged tiles are formation members — they hold).
          shiftBufferAttr(stars.geometry.attributes.position, _flowDX, _flowDY, _flowDZ);
          stars.geometry.attributes.position.needsUpdate = true;
          for (const sp of ambient) { sp.position.x -= _flowDX; sp.position.z -= _flowDZ; }
          if (mode === "drift") {
            for (const m of tiles) {
              if (m.userData.driftTarget) continue;
              m.position.x -= _flowDX; m.position.z -= _flowDZ;
            }
          }
        } else if (exploreOn || !_flTransit) {
          _flowDX = _flowDY = _flowDZ = 0;
          if (exploreOn) { flowSm = 0; camRollFX = 0; }
        }
      }
      if (!exploreOn && isArranged) {
        cam.vel *= Math.pow(0.86, dt / 16);
        camTarget.yaw   *= Math.pow(0.92, dt / 16);
        camTarget.pitch *= Math.pow(0.92, dt / 16);
        cam.pos.multiplyScalar(Math.pow(0.94, dt / 16));
      }

      if (exploreOn) {
        // Stable panorama orbit: sensor/touch orientation is calm, while the
        // user's explicit pinch velocity retains the original forward travel.
        cam.vel *= Math.pow(0.92, dt / 16);
        if (Math.abs(cam.vel) < 0.04) cam.vel = 0;
        camRollFX = 0;
        cam.pos.copy(exploreAnchor);
        const orbitAngle = exploreViewQ.angleTo(exploreTargetQ);
        if (orbitAngle > 0.00001) {
          const response = THREE.MathUtils.clamp(
            (orbitAngle - THREE.MathUtils.degToRad(1)) / THREE.MathUtils.degToRad(14), 0, 1
          );
          const tau = THREE.MathUtils.lerp(0.11, 0.045, response);
          exploreViewQ.slerp(exploreTargetQ, 1 - Math.exp(-(dt / 1000) / tau)).normalize();
        } else {
          exploreViewQ.copy(exploreTargetQ);
        }
        syncAnglesFromExploreView();
        updateCameraTransform();
        camera.getWorldDirection(FORWARD);
        exploreAnchor.addScaledVector(FORWARD, cam.vel * dt / 1000);
        cam.pos.copy(exploreAnchor);
        camera.position.copy(exploreAnchor);
      } else {
        /* damping on velocity */
        cam.vel *= Math.pow(0.92, dt / 16);
        // clamp tiny
        if (Math.abs(cam.vel) < 0.04) cam.vel = 0;

        /* ease camera angles */
        const k = 1 - Math.pow(0.001, dt / 1000);
        cam.yaw   += (camTarget.yaw   - cam.yaw)   * k;
        cam.pitch += (camTarget.pitch - cam.pitch) * k;
        cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch));

        /* advance position along current look direction */
        updateCameraTransform();
        camera.getWorldDirection(FORWARD);
        cam.pos.addScaledVector(FORWARD, cam.vel * dt / 1000);

        /* Parallax drift: slow lateral wander in camera-local space.
           Damped to PDRIFT.focusDamp whenever a card is focused/hovered or the
           user is actively driving, so reading a label never feels seasick. */
        if (PDRIFT.amp > 0 && !FLOW_RM) {
          const wantGain = (mode === "drift" && driftActive && !dragging && !activeAddrRef.current && !hoverObjRef.current)
            ? 1 : PDRIFT.focusDamp;
          const gainRate = wantGain < pdriftGain ? 8 : PDRIFT.ease;
          pdriftGain += (wantGain - pdriftGain) * (1 - Math.exp(-gainRate * dt / 1000));
          const s = dt / 1000;
          const wx = (Math.PI * 2) / PDRIFT.px, wy = (Math.PI * 2) / PDRIFT.py;
          // derivative of sin() → drift velocity, not a spring back to home
          const vx = Math.cos(now / 1000 * wx) * PDRIFT.amp * pdriftGain;
          const vy = Math.cos(now / 1000 * wy + 1.7) * PDRIFT.amp * 0.55 * pdriftGain;
          _pdR.set(1, 0, 0).applyQuaternion(camera.quaternion);
          _pdU.set(0, 1, 0).applyQuaternion(camera.quaternion);
          cam.pos.addScaledVector(_pdR, vx * s);
          cam.pos.addScaledVector(_pdU, vy * s);
        }

        // Re-apply position
        camera.position.copy(cam.pos);

        // Long-session safety: recentre the world when we've flown far out.
        if (cam.pos.lengthSq() > REBASE_DIST2) rebaseWorld();
      }

      // dt-corrected easing factor — keeps motion identical at 30/60/120Hz so
      // re-orientation and scaling feel the same (native) regardless of refresh.

      /* wrap drifting objects — only in free drift mode */
      if (mode === "drift") {
        for (const m of tiles) {
          // If a fresh drift target was queued on mode-change, ease toward it
          // and DO NOT wrap — grid/ambient positions sit outside the wrap box
          // (z = ±16 vs box half-depth 13), so wrapping here would teleport the
          // tile across the camera before the lerp could play. Skip the wrap
          // until we've landed inside the box, then resume normal wrapping.
          const dt2 = m.userData.driftTarget;
          if (dt2) {
            const rate = 0.025;          // matches forward grid → ambient feel
            m.position.lerp(dt2, 1 - Math.pow(1 - rate, dt / 16));
            if (m.position.distanceToSquared(dt2) < 0.09) {
              m.userData.driftTarget = null;
            }
          } else {
            wrapAroundCamera(m, TILE_BOX);
          }
        }
      }
      for (const sp of ambient) wrapAroundCamera(sp, BOX);
      // stars wrap in a larger box for parallax illusion
      wrapPointsAroundCamera(stars, SBOX);

      /* small per-tile overlays — wireframe primitives OR loaded GLBs.
         Both branches follow their parent tile, rotate, and fade with it.
         Models are centred on the card face and pushed further toward camera
         so they read as the hero element; wireframes sit small above the art. */
      // World-direction is constant for all overlays this frame — fetch once.
      camera.getWorldDirection(_camDir);
      for (const wire of tileWires) {
        const parent = wire.userData.parentTile;
        if (!parent) continue;
        const isModel = !!wire.userData.isModel;
        // Offset toward viewer — bigger for full models so they clear the card.
        const forwardDist = isModel ? 1.4 : 0.6;
        _off.copy(_camDir).multiplyScalar(-forwardDist);
        // Card-local offset: models can be nudged to their visual centre;
        // wireframes stay just above the card art.
        const modelOffset = isModel ? parent.userData.project.modelOffset : null;
        _localOff.set(
          modelOffset ? (modelOffset.x || 0) : 0,
          isModel ? (modelOffset ? (modelOffset.y || 0) : 0) : parent.scale.y * 1.05,
          modelOffset ? (modelOffset.z || 0) : 0,
        ).applyQuaternion(parent.quaternion);
        wire.position.set(
          parent.position.x + _off.x + _localOff.x,
          parent.position.y + _off.y + _localOff.y,
          parent.position.z + _off.z + _localOff.z,
        );
        // Continuous slow rotation. Loaded GLBs are the "hero" presentation —
        // they get a gentle yaw-only drift so the form stays readable and
        // mostly faces the camera. Wireframe primitives still tumble as
        // before (cheap, abstract, more decorative).
        if (!FLOW_RM && isModel) {
          wire.rotation.y += dt * 0.00015;
        } else if (!FLOW_RM && wire.userData.prim === "cone") {
          wire.rotation.y += dt * 0.00072;
        } else if (!FLOW_RM) {
          wire.rotation.y += dt * 0.0006;
          wire.rotation.x += dt * 0.00024;
        }
        // Match parent visibility
        const tileOp = parent.material.opacity;
        const overlayOp = Math.min(0.95, tileOp * 1.15);
        if (isModel) {
          // Loaded GLB — fade every material in the subtree, and hide
          // the whole group below a threshold so we don't pay for invisible draws.
          if (wire.userData.loaded) {
            // Soft fade-in from the moment the GLB lands, so the model eases up
            // instead of popping (the parent tile may already be fully visible).
            const mFade = THREE.MathUtils.smoothstep(now - (wire.userData.loadedAt || now), 0, 600);
            // Per request: loaded GLB models render FULLY SOLID at rest —
            //  (1) no 0.95 cap (use the full distance opacity, clamped to 1), and
            //  (2) no mode dimming (use the tile's pre-dim base opacity).
            // Distance fade and the load fade-in are preserved.
            const modelTileOp = parent.userData.modelOpacityBase != null
              ? parent.userData.modelOpacityBase
              : tileOp;
            const modelOp = Math.min(1, modelTileOp * 1.15) * mFade;
            wire.visible = modelOp > 0.02;
            if (modelOp !== wire.userData.lastModelOpacity) {
              const fadeMaterials = wire.userData.fadeMaterials || [];
              for (const material of fadeMaterials) material.opacity = modelOp;
              wire.userData.lastModelOpacity = modelOp;
            }
          }
        } else {
          // Procedural wireframe primitive — single material
          wire.material.opacity = overlayOp;
        }
        // Pop with focus — models start much larger than wireframes.
        const isFocused = focusAddrNow && wire.userData.addr === focusAddrNow;
        const baseScale  = isModel ? 0.85 : 0.28;
        const focusScale = isModel ? 1.10 : 0.42;
        const targetScale = isFocused ? focusScale : baseScale;
        wire.scale.lerp(_vScale.set(targetScale, targetScale, targetScale), frameLerp(0.10, dt));
      }

      /* tiles: position-lerp to arranged targets, then orient */
      for (const m of tiles) {
        const target = targetForTile(mode, m.userData.index, now);
        if (target) {
          // ease toward target; rate depends on distance for snappy arrange
          // reel must track the scrubbed scroll position tightly — a slow lerp
          // would let the parade lag the captions.
          const rate = mode === "reel" ? 0.18 : 0.025;
          m.position.lerp(target, 1 - Math.pow(1 - rate, dt / 16));
        }

        // For meshes (not cameras), Object3D.lookAt aligns local +Z to target.
        // PlaneGeometry's visible face IS the +Z face — so look AT the camera.
        _lookM.lookAt(camera.position, m.position, camera.up);
        _baseQ.setFromRotationMatrix(_lookM);

        // Per-card constant offset so each tile floats at its own angle (suppressed in grid)
        const offFactor = mode === "reel" ? 0.15 : 1.0;
        _euler.set(
          m.userData.offsetPitch * offFactor,
          m.userData.offsetYaw   * offFactor,
          (m.userData.offsetRoll + Math.sin(now * 0.0006 + m.userData.wobble.p * 6) * 0.04) * offFactor,
          "YXZ"
        );
        _offQ.setFromEuler(_euler);
        _baseQ.multiply(_offQ);

        // SOFT slerp — cards re-orient slowly so they feel like floating objects
        m.quaternion.slerp(_baseQ, frameLerp(mode === "reel" ? 0.12 : 0.06, dt));

        // Band-pass visibility per mode
        const dist = m.position.distanceTo(camera.position);
        let nearIn, farOut;
        if (mode === "reel") {
          // Keep non-featured scatter tiles outside the reel's visibility
          // band, not the parade spacing: non-featured tiles park on a scatter
          // ring 20–24u out, dead centre of the old 17→26 far-fade — so they
          // hung around at ~50% opacity as blurred ghosts behind the captions.
          // Tight band while the reel plays (active card at 10.6u stays hot,
          // everything past ~16.5u is gone); the band relaxes toward the old
          // range during the final gather so the carousel's far side can
          // recede into the deep field instead of vanishing.
          const rg = Math.max(0, Math.min(1, ((window.__mo_reel || {}).pos || 0) - MO_FEATURED.length));
          nearIn  = THREE.MathUtils.smoothstep(dist, 2.0, 6.0);
          farOut  = THREE.MathUtils.smoothstep(dist, 13 + rg * 4, 16.5 + rg * 9.5);
        } else if (mode === "drift") {
          // DRIFT is the ONLY mode where the tile pool wraps around the camera
          // inside BOX. A spherical far-fade sat almost entirely OUTSIDE the box
          // (corner ≈ 20.5), so tiles teleported across the wrap boundary while
          // still ~95% opaque → the "sudden appearance". Fade by proximity to the
          // wrap surface instead: edge = 0 at box centre, 1 at the face a tile is
          // about to cross. Full opacity until 95% of the way out, then a quick
          // fade across the final 5% shell so the wrap happens invisibly.
          nearIn = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
          const ex = Math.abs(m.position.x - camera.position.x) / (TILE_BOX.x / 2);
          const ey = Math.abs(m.position.y - camera.position.y) / (TILE_BOX.y / 2);
          const ez = Math.abs(m.position.z - camera.position.z) / (TILE_BOX.z / 2);
          const edge = Math.max(ex, ey, ez);
          farOut = THREE.MathUtils.smoothstep(edge, 0.95, 1.0);
        } else {
          // origin — tiles arrange on a ring (~16–26u). Part of that ring is now
          // INSIDE the wrap box (TILE_BOX half-depth 18.2), so a box-edge fade
          // would read arranged tiles as mid-wrap
          // and hide them. Push the spherical far-fade out past the ring so the
          // cards stay solid and readable; fog still lends gentle depth.
          nearIn  = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
          farOut  = THREE.MathUtils.smoothstep(dist, 34, 48);
        }
        let opacity = nearIn * (1 - farOut);
        // Loaded GLB models intentionally ignore mode dimming (per request):
        // capture the distance-only opacity BEFORE the reel multiplier so
        // models read equally solid in every mode. Focus is applied below to both.
        let modelOpacityBase = opacity;
        if (mode === "reel"   ) opacity *= 0.96;   // the tiles ARE the reel — keep them hot

        // Focus highlight — pop the matching tile
        const isFocused = focusAddrNow && m.userData.project.addr === focusAddrNow;
        if (isFocused) {
          opacity = Math.min(1, opacity * 1.6 + 0.25);
          modelOpacityBase = Math.min(1, modelOpacityBase * 1.6 + 0.25);
          m.scale.lerp(_vScale.set(1.18, 1.18, 1), frameLerp(0.14, dt));
        } else {
          m.scale.lerp(_vScale.set(1, 1, 1), frameLerp(0.10, dt));
        }
        // Temporal smoothing — the distance-band definitions switch INSTANTLY
        // when the mode flips (drift box-edge → origin sphere → reel tight
        // band), which used to blink whole cards out in a single frame around
        // the origin transits. Ease the rendered opacity toward its target so
        // every band hand-off reads as a fade, never a pop.
        const uD = m.userData;
        const opK = frameLerp(0.10, dt);
        uD.opSm  = uD.opSm  == null ? opacity          : uD.opSm  + (opacity          - uD.opSm)  * opK;
        uD.mobSm = uD.mobSm == null ? modelOpacityBase : uD.mobSm + (modelOpacityBase - uD.mobSm) * opK;
        m.material.opacity = uD.opSm * arrFade;
        uD.modelOpacityBase = uD.mobSm * arrFade;
      }

      /* ambient pulse + depth-batch rebuild. The nodes keep their original
         world positions, scale, pulse and wrap fade; only submission changes. */
      for (const batch of ambientBatches) {
        batch.nodes.length = 0;
        batch.depthSum = 0;
      }
      ambientRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      ambientUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      for (const sp of ambient) {
        const phase = sp.userData.phase + now * 0.0008;
        const dist  = sp.position.distanceTo(camera.position);
        const nearIn = THREE.MathUtils.smoothstep(dist, 1.5, 5.0);
        // Wrap-surface fade (same reasoning as tiles) so ambient motes dissolve
        // before they teleport across the box rather than blinking in.
        const ex = Math.abs(sp.position.x - camera.position.x) / (BOX.x / 2);
        const ey = Math.abs(sp.position.y - camera.position.y) / (BOX.y / 2);
        const ez = Math.abs(sp.position.z - camera.position.z) / (BOX.z / 2);
        const farOut = THREE.MathUtils.smoothstep(Math.max(ex, ey, ez), 0.95, 1.0);
        const pulse  = 0.65 + Math.sin(phase) * 0.20;
        let aOp = pulse * nearIn * (1 - farOut);
        if (mode !== "drift") aOp *= 0.35;
        aOp *= arrFade;
        sp.userData.opacity = aOp;

        const depth = (sp.position.x - camera.position.x) * FORWARD.x
          + (sp.position.y - camera.position.y) * FORWARD.y
          + (sp.position.z - camera.position.z) * FORWARD.z;
        sp.userData.depth = depth;
        if (aOp <= 0.001 || depth <= camera.near) continue;
        const depthT = Math.max(0, Math.min(0.999999, (depth - camera.near) / AMB_DEPTH_SPAN));
        const batch = ambientBatches[Math.floor(depthT * AMB_BATCH_N)];
        batch.nodes.push(sp);
        batch.depthSum += depth;
      }

      const halfW = AMB_SCALE * 0.5;
      const halfH = AMB_SCALE * ambientAtlas.cropRatio * 0.5;
      const rx = ambientRight.x * halfW, ry = ambientRight.y * halfW, rz = ambientRight.z * halfW;
      const ux = ambientUp.x * halfH, uy = ambientUp.y * halfH, uz = ambientUp.z * halfH;
      for (const batch of ambientBatches) {
        const count = batch.nodes.length;
        batch.mesh.visible = count > 0;
        batch.geo.setDrawRange(0, count * 6);
        if (!count) continue;

        batch.nodes.sort((a, b) => b.userData.depth - a.userData.depth);
        const meanDepth = batch.depthSum / count;
        batch.mesh.position.copy(camera.position).addScaledVector(FORWARD, meanDepth);
        const ox = batch.mesh.position.x, oy = batch.mesh.position.y, oz = batch.mesh.position.z;

        for (let i = 0; i < count; i++) {
          const sp = batch.nodes[i];
          const c = sp.userData.atlas;
          const x = sp.position.x - ox, y = sp.position.y - oy, z = sp.position.z - oz;
          const p = i * 12;
          // top-left, top-right, bottom-left, bottom-right
          batch.positions[p] = x - rx + ux;
          batch.positions[p + 1] = y - ry + uy;
          batch.positions[p + 2] = z - rz + uz;
          batch.positions[p + 3] = x + rx + ux;
          batch.positions[p + 4] = y + ry + uy;
          batch.positions[p + 5] = z + rz + uz;
          batch.positions[p + 6] = x - rx - ux;
          batch.positions[p + 7] = y - ry - uy;
          batch.positions[p + 8] = z - rz - uz;
          batch.positions[p + 9] = x + rx - ux;
          batch.positions[p + 10] = y + ry - uy;
          batch.positions[p + 11] = z + rz - uz;

          const u = i * 8;
          batch.uvs[u] = c.u0;     batch.uvs[u + 1] = c.v1;
          batch.uvs[u + 2] = c.u1; batch.uvs[u + 3] = c.v1;
          batch.uvs[u + 4] = c.u0; batch.uvs[u + 5] = c.v0;
          batch.uvs[u + 6] = c.u1; batch.uvs[u + 7] = c.v0;

          const a = i * 4;
          batch.opacity[a] = sp.userData.opacity;
          batch.opacity[a + 1] = sp.userData.opacity;
          batch.opacity[a + 2] = sp.userData.opacity;
          batch.opacity[a + 3] = sp.userData.opacity;
        }
        const positionAttr = batch.geo.attributes.position;
        const uvAttr = batch.geo.attributes.uv;
        const opacityAttr = batch.geo.attributes.aAmbientOpacity;
        if (positionAttr.clearUpdateRanges) {
          positionAttr.clearUpdateRanges();
          uvAttr.clearUpdateRanges();
          opacityAttr.clearUpdateRanges();
          positionAttr.addUpdateRange(0, count * 4 * 3);
          uvAttr.addUpdateRange(0, count * 4 * 2);
          opacityAttr.addUpdateRange(0, count * 4);
        }
        positionAttr.needsUpdate = true;
        uvAttr.needsUpdate = true;
        opacityAttr.needsUpdate = true;
      }

      /* HUD frame tracking — the overlay is sized to the hovered card's
         projected bounds so its corner brackets lock onto the card like a
         targeting reticle. Clamped (incl. tab/readout margins) to stay on
         screen. */
      /* HUD lock-on tracking — feed the card's 4 projected corners to the
         targeting frame so its brackets hug the card's true (rotated) shape.
         No viewport clamp: the frame tracks the card exactly and clips
         naturally at the screen edge, instead of detaching to the corner. */
      if (hoverObjRef.current && overlayRef.current) {
        const corners = tileScreenCorners(hoverObjRef.current);
        const el = overlayRef.current;
        if (corners && el.__updateHUD) {
          el.style.display = "";
          el.__updateHUD(corners);
        } else {
          el.style.display = "none";
        }
      }

      /* ---------- Signal field ⇄ "0x00" glyph ----------
         The teal particles are permanent residents of the field: they drift and
         wrap around the camera like stars. As the ORIGIN section scrolls into
         view they peel out of the field to FORM node 0x00 in front of the
         camera, then melt back. One layer — the glyph IS universe particles.

         Formation is driven by the section's continuous scroll progress and an
         eased `formActual`, NOT by the discrete React mode. That means it can
         begin assembling the instant the section enters view and always melts
         cleanly when you scroll away — no "stuck formed" or "never appeared". */
      {
        const ob = window.__mo_origin || { p: 0, active: false, concept: "assembly" };
        const concept = ob.concept || "assembly";
        const op = Math.max(0, Math.min(1, ob.p || 0));
        const eP = op < 0.5 ? 2*op*op : 1 - Math.pow(-2*op+2, 2)/2;  // easeInOut

        // ---- HUB concept (exploration only) ----
        const showHub = (mode === "origin") && concept === "hub";
        originGroup.visible = showHub;
        if (showHub) {
          originHub.material.opacity = 0.25 + eP * 0.75;
          const pulse = 1 + Math.sin(now * 0.0025) * 0.04;
          originHub.scale.set(4.2 * pulse, 4.2 * pulse, 1);
          for (const link of originLinks) {
            const tile = link.userData.tile;
            const la = link.geometry.attributes.position.array;
            la[0] = ORIGIN_CENTER.x; la[1] = ORIGIN_CENTER.y; la[2] = ORIGIN_CENTER.z;
            la[3] = tile.position.x; la[4] = tile.position.y; la[5] = tile.position.z;
            link.geometry.attributes.position.needsUpdate = true;
            link.material.opacity = eP * 0.45;
          }
        }

        // ---- DIVE ignition (about gateway → board) ----

        // ---- target formedness (0 = pure field, 1 = full glyph) ----
        // Continuous: rises with origin-section scroll whenever the section is in
        // its active band. Never keyed to `mode`.
        let formTarget = 0;
        if (ob.active && concept !== "hub") formTarget = eP;
        // Ease toward the target so entry/exit is always gradual (no pop when the
        // section's active flag toggles mid-scroll).
        formActual += (formTarget - formActual) * frameLerp(0.09, dt);
        if (formActual < 0.0015 && formTarget === 0) formActual = 0;
        const formP = formActual;

        const arr = assemblyPts.geometry.attributes.position.array;

        // ── Field-follow — keeps the scatter source in NEAR space ──
        // While the glyph is even slightly formed we STOP wrapping the field and
        // instead slide every home (and its rendered point) by the camera's
        // per-frame delta. Origin/dive ease the camera toward world-0, and free
        // flight can start far out; without this the home cloud stays frozen in
        // world space, gets left behind, and partially-formed particles streak
        // in from that one distant point instead of scattering from up close.
        const _fdx = cam.pos.x - _fieldCam.x;
        const _fdy = cam.pos.y - _fieldCam.y;
        const _fdz = cam.pos.z - _fieldCam.z;
        _fieldCam.copy(cam.pos);
        // Engage the rigid carry the instant the section is ARRANGED — which is
        // exactly when the camera begins easing back toward world-0 — not only
        // once formP has measurably ramped. After a far drift the pull-home moves
        // the camera ~6%/frame of its distance, so the first few "still a pure
        // field" frames would let the rendered points fall behind; formation would
        // then reel them in from that distant trail instead of scattering them
        // from near space. Gluing from frame one keeps the field pinned to the
        // viewer through the whole approach-and-form.
        if ((formP >= 0.0015 || isArranged) && (_fdx || _fdy || _fdz)) {
          for (let i = 0; i < ASM_N * 3; i += 3) {
            asmHome[i]   += _fdx; arr[i]   += _fdx;
            asmHome[i+1] += _fdy; arr[i+1] += _fdy;
            asmHome[i+2] += _fdz; arr[i+2] += _fdz;
          }
        }

        // The signal field streams through transits with the
        // rest of the universe — scaled down as the glyph forms so a forming /
        // melting "0x00" is never dragged past the camera and yanked back.
        if (_flowDX || _flowDZ) {
          const fw = Math.max(0, 1 - formP * 2.5);
          if (fw > 0.01) {
            const fx = _flowDX * fw, fz = _flowDZ * fw;
            for (let i = 0; i < ASM_N * 3; i += 3) {
              asmHome[i]   -= fx; arr[i]   -= fx;
              asmHome[i+2] -= fz; arr[i+2] -= fz;
            }
          }
        }

        if (formP < 0.0015) {
          // PURE FIELD — wrap home positions around the camera (mirroring the
          // shift onto the render buffer), then ease the render toward home.
          wrapAssemblyField(arr, asmHome, BOX);
          if (arrCollapse > 0.01) {
            // ARRIVAL — the field condenses into "0x00" itself — every
            // particle is pulled to its own glyph slot in front of the camera
            // (each already has one: asmLocal), holds the word for a beat,
            // then the burst releases it into the field. The metaphor lands
            // in the first second: you arrive THROUGH the origin node.
            const kA = frameLerp(0.05 + arrCollapse * 0.16, dt);
            // glyph basis facing the camera at the origin-anchor distance
            _arrR.crossVectors(FORWARD, _arrUP).normalize();
            _arrU.crossVectors(_arrR, FORWARD).normalize();
            const kx = cam.pos.x + FORWARD.x * 9;
            const ky = cam.pos.y + FORWARD.y * 9;
            const kz = cam.pos.z + FORWARD.z * 9;
            const wobT = now * 0.0022;
            for (let i = 0; i < ASM_N; i++) {
              const j = i * 3;
              const lx = asmLocal[j] * glyphFit;
              const ly = asmLocal[j + 1] * glyphFit;
              // shallow depth shimmer so the held word breathes, not freezes
              const lz = asmLocal[j + 2] * glyphFit + 0.10 * Math.sin(wobT - lx * 1.5);
              const tx = kx + _arrR.x * lx + _arrU.x * ly + FORWARD.x * lz;
              const ty = ky + _arrR.y * lx + _arrU.y * ly + FORWARD.y * lz;
              const tz = kz + _arrR.z * lx + _arrU.z * ly + FORWARD.z * lz;
              const desX = asmHome[j]     * (1 - arrCollapse) + tx * arrCollapse;
              const desY = asmHome[j + 1] * (1 - arrCollapse) + ty * arrCollapse;
              const desZ = asmHome[j + 2] * (1 - arrCollapse) + tz * arrCollapse;
              arr[j]     += (desX - arr[j])     * kA;
              arr[j + 1] += (desY - arr[j + 1]) * kA;
              arr[j + 2] += (desZ - arr[j + 2]) * kA;
            }
          } else {
            const kField = frameLerp(0.12, dt);
            for (let i = 0; i < ASM_N * 3; i++) arr[i] += (asmHome[i] - arr[i]) * kField;
          }
        } else {
          // ASSEMBLING — anchor the glyph in front of the CURRENT camera so it's
          // always in view, then blend each particle from its field home toward
          // its glyph slot (rotating + breathing) by the form amount.
          _glyphC.copy(cam.pos).add(ORIGIN_CENTER);   // camera-relative centre
          // RESTING MOTION — a bounded "holographic rock" plus a depth ripple.
          // Instead of a uniform scale pulse (too generic) or a full Y-spin (which
          // goes edge-on and unreadable), the formed glyph gently tilts within a
          // small angle on two axes while a sine wave travels across it in X,
          // displacing only Z. XY barely moves, so "0x00" stays crisp at every
          // instant, yet the surface genuinely undulates in depth — parallax +
          // perspective make it shimmer in 3D. All resting motion scales with
          // formP, so during assembly the looser swing below still dominates.
          const wob = Math.max(0, 1 - formP * 1.2);
          const assemblyYaw = Math.sin(now * 0.00045) * 0.5 * wob;
          // Bounded rock — yaw ≤ ~11°, pitch ≤ ~6°, on different periods so it
          // drifts in a slow Lissajous instead of an obvious back-and-forth.
          const restYaw   = Math.sin(now * 0.00038) * 0.20 * formP;
          const restPitch = Math.sin(now * 0.00029 + 1.0) * 0.10 * formP;
          const ang = assemblyYaw + restYaw;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const cp = Math.cos(restPitch), sp = Math.sin(restPitch);
          // Depth ripple — wave travels across the glyph's width, displacing Z.
          const rAmp   = 0.15 * formP;
          const rPhase = now * 0.0019;
          // Snap tighter the more it's formed so the letterforms crisp up.
          const kForm = frameLerp(0.16 + formP * 0.12, dt);
          for (let i = 0; i < ASM_N; i++) {
            const j = i * 3;
            const lx = asmLocal[j] * glyphFit;
            const ly = asmLocal[j+1] * glyphFit;
            // ripple keyed to the particle's X → a travelling depth wave
            const lz = asmLocal[j+2] * glyphFit + rAmp * glyphFit * Math.sin(rPhase - lx * 1.5);
            // pitch about X, then yaw about Y
            const ly2 = ly * cp - lz * sp;
            const lz2 = ly * sp + lz * cp;
            const rx = lx * ca - lz2 * sa;
            const rz = lx * sa + lz2 * ca;
            const tX = _glyphC.x + rx, tY = _glyphC.y + ly2, tZ = _glyphC.z + rz;
            const desX = asmHome[j]   + (tX - asmHome[j])   * formP;
            const desY = asmHome[j+1] + (tY - asmHome[j+1]) * formP;
            const desZ = asmHome[j+2] + (tZ - asmHome[j+2]) * formP;
            arr[j]   += (desX - arr[j])   * kForm;
            arr[j+1] += (desY - arr[j+1]) * kForm;
            arr[j+2] += (desZ - arr[j+2]) * kForm;
          }
        }
        assemblyPts.geometry.attributes.position.needsUpdate = true;

        // Always visible as field; brighter + larger as it forms / ignites.
        const fieldOp = mode === "reel" ? 0.34 : 0.55;
        assemblyPts.material.opacity = Math.min(1, Math.max(fieldOp, 0.2 + formP * 0.8) + arrCollapse * 0.45 + _lvlS * 0.16);
        // The formed glyph keeps its near-field particle size; additional
        // +0.055 growth made "0x00" read as soft blobs up close.
        assemblyPts.material.size = 0.1 + formP * 0.015 + arrCollapse * 0.07 + _lvlS * 0.04;

        assemblyGroup.position.set(0, 0, 0);
        assemblyGroup.scale.set(1, 1, 1);

        const debugState = window.__mo_debug || (window.__mo_debug = {});
        debugState.mode = mode;
        debugState.active = !!ob.active;
        debugState.formP = +formP.toFixed(2);
        debugState.camZ = +cam.pos.z.toFixed(1);
      }

      /* ── constellation layer ── */
      updateTopology(dt, mode, focusAddrNow, (window.__mo_debug && window.__mo_debug.formP) || 0, arrFade);

      /* ── flight layers: velocity effects ride the existing grade — the
             transit is felt through FOV + aberration, not extra geometry ── */
      const FLbr = window.__mo_flight || {};
      const warpNow = Math.max(0, Math.min(1.4, FLbr.warp || 0));
      const MC = (window.__mo_cam = window.__mo_cam || {});
      MC.x = cam.pos.x; MC.y = cam.pos.y; MC.z = cam.pos.z;
      MC.yaw = cam.yaw; MC.pitch = cam.pitch; MC.vel = cam.vel;

      /* status ~ 3hz */
      frameI++;
      if (frameI % 18 === 0) {
        const yawDeg = ((cam.yaw * 180 / Math.PI) % 360 + 360) % 360;
        const next = {
          yaw: yawDeg.toFixed(0).padStart(3, "0"),
          pit: (cam.pitch * 180 / Math.PI).toFixed(0),
          vel: cam.vel.toFixed(1),
          tile: hoverObjRef.current?.userData?.project?.addr || activeAddrRef.current || "—",
        };
        // Return the previous object when nothing changed. A fresh object here
        // failed Object.is every time and reconciled the whole Universe subtree
        // 3.3x/second forever, including with the camera completely still.
        setStatus((prev) => (prev
          && prev.yaw === next.yaw && prev.pit === next.pit
          && prev.vel === next.vel && prev.tile === next.tile) ? prev : next);
      }

      // Scene grade — advance grain and keep live-tunable uniforms in sync.
      // Velocity weight (written by cinematic.js) leans on the aberration
      // and the FOV so speed is something you FEEL; ripple + wake uniforms
      // carry the disturbance layer.
      const vW = Math.max(0, Math.min(1.4, window.__mo_vel || 0));
      if (cursorFx) {
        cursorFx.update(now, dt, {
          aberration: GRADE.aberration + vW * 0.0035 + arrCollapse * 0.002 + warpNow * 0.0022,
          vignette: GRADE.vignette,
          grain: GRADE.grain,
        });
      }
      const fovT = 58 + vW * 4 + warpNow * 4.5;
      camera.fov += (fovT - camera.fov) * frameLerp(0.08, dt);
      if (Math.abs(camera.fov - _lastFov) > 0.02) { camera.updateProjectionMatrix(); _lastFov = camera.fov; }
      if (bokehPass && bokehPass.uniforms) {
        // DoF reads as far-only: a tiny aperture with focus pinned to
        // the card plane keeps everything within ~20u readable; only the deep
        // field melts (capped by maxblur). No hover rack — it kept whatever
        // you were NOT pointing at unreadable.
        let focusT = GRADE.focus;
        if (mode === "reel") focusT = 10.6;
        const formPNow = (window.__mo_debug && window.__mo_debug.formP) || 0;
        if (formPNow > 0.25) focusT = ORIGIN_CENTER.length();
        _focusS += (focusT - _focusS) * frameLerp(0.07, dt);
        bokehPass.uniforms.focus.value = _focusS;
        bokehPass.uniforms.aperture.value = GRADE.aperture;
        bokehPass.uniforms.maxblur.value = GRADE.maxblur;
      }

      if (useComposer && composer) {
        composer.render();
      }
      else renderer.render(scene, camera);
      if (frameI === 1) { try { window.dispatchEvent(new CustomEvent("mo:first-frame")); } catch (_) {} }
      probeDoF(dt);
      raf = requestAnimationFrame(frame);
    }

    /* Wrap Points buffer attribute around camera (only modify entries that wrap) */
    function wrapPointsAroundCamera(points, box) {
      const attr = points.geometry.attributes.position;
      const arr  = attr.array;
      let dirty = false;
      for (let i = 0; i < arr.length; i += 3) {
        let dx = arr[i+0] - cam.pos.x;
        let dy = arr[i+1] - cam.pos.y;
        let dz = arr[i+2] - cam.pos.z;
        if (dx >  box.x / 2) { arr[i+0] -= box.x; dirty = true; }
        else if (dx < -box.x / 2) { arr[i+0] += box.x; dirty = true; }
        if (dy >  box.y / 2) { arr[i+1] -= box.y; dirty = true; }
        else if (dy < -box.y / 2) { arr[i+1] += box.y; dirty = true; }
        if (dz >  box.z / 2) { arr[i+2] -= box.z; dirty = true; }
        else if (dz < -box.z / 2) { arr[i+2] += box.z; dirty = true; }
      }
      if (dirty) attr.needsUpdate = true;
    }

    raf = requestAnimationFrame(frame);
    mount.style.cursor = "grab";
    try { window.dispatchEvent(new CustomEvent("mo:universe-ready")); } catch (_) {}

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      if (cursorFx) cursorFx.destroy();
      if (bokehPass && bokehPass.dispose) bokehPass.dispose();
      if (composer && composer.dispose) composer.dispose();
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      uniIO.disconnect();
      try { mount.removeChild(renderer.domElement); } catch (_) {}
      renderer.dispose();
      if (scene.background && scene.background.dispose) scene.background.dispose();
      if (_environmentTarget) _environmentTarget.dispose();
      else if (scene.environment && scene.environment.dispose) scene.environment.dispose();
      tiles.forEach(m => { m.geometry.dispose(); m.material.map?.dispose(); m.material.dispose(); });
      tileWires.forEach(w => {
        if (w.userData && w.userData.isModel) {
          w.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry?.dispose();
              obj.material?.dispose();
            }
          });
        } else {
          w.geometry?.dispose();
          w.material?.dispose();
        }
      });
      ambientBatches.forEach(batch => batch.geo.dispose());
      ambientMat.dispose();
      ambientAtlas.texture.dispose();
      starGeo.dispose();
      asmGeo.dispose(); assemblyPts.material.dispose();
      originHub.material.map?.dispose(); originHub.material.dispose();
      originLinks.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
      constGeo.dispose(); constMat.dispose();
      if (renderer.renderLists) renderer.renderLists.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      window.removeEventListener("pointermove", onAnyAct);
      window.removeEventListener("pointerdown", onActSkipArrival);
      window.removeEventListener("wheel", onAnyAct);
      window.removeEventListener("keydown", onAnyAct);
      window.removeEventListener("scroll", onAnyAct);
      window.removeEventListener("deviceorientation", onGyro, true);
      window.removeEventListener("orientationchange", onGyroFrameChange);
      if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener) {
        window.screen.orientation.removeEventListener("change", onGyroFrameChange);
      }
      document.removeEventListener("visibilitychange", onGyroVisibility);
      delete window.__mo_universe;
      delete window.__mo_arrival_start;
      delete window.__mo_cam;
    };
  }, []);

  return (
    <div className="universe" data-screen-label="01 Universe">
      <div className="universe__mount" ref={mountRef} />

      {hover && window.UniverseHoverCard && (
        <window.UniverseHoverCard
          project={hover.project}
          panelRef={overlayRef}
        />
      )}

      <div className="universe__reticle" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <div className={"universe__whisper " + (idleNote ? "is-on" : "")} aria-hidden="true">
        <span className="universe__whisperDot" />
        the field notices you
      </div>

      {/* center crosshair removed per request */}

      <div className="universe__hud universe__hud--bl">
        <div className="universe__hudRow"><span className="universe__hudKey">YAW</span><span className="universe__hudVal">{status.yaw}°</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">PITCH</span><span className="universe__hudVal">{status.pit}°</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">VEL</span><span className="universe__hudVal">{status.vel}</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">FOCUS</span><span className="universe__hudVal">{status.tile}</span></div>
      </div>
      <div className="universe__hud universe__hud--br">
        <div className="universe__hudRow"><span className="universe__hudKey">DRAG</span><span className="universe__hudVal">ROTATE</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">WHEEL</span><span className="universe__hudVal">FLY</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">CLICK</span><span className="universe__hudVal">AIM</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">SPACE</span><span className="universe__hudVal">∞</span></div>
      </div>
    </div>
  );
}

window.Universe = Universe;
