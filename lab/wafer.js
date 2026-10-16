/* ============================================================
   WAFER — OBJECT STUDY (lab surface, excluded from deploy)
   ------------------------------------------------------------
   One keyboard on a studio stage, rendered as close to a
   product photograph as WebGL2 allows. Drag to turn, scroll /
   pinch to zoom (toward the cursor), double-click to re-frame,
   type on your own keyboard to press its keys — and move it
   between eight places (lab/places.js) with the line under the
   stage, the arrow keys, or a hand on the halves.

   Pipeline — runs only while something changes, then stops:
     scene (HDR, MSAA; height-field occlusion in every material)
     → PBR Neutral tone map → progressive accumulation (sub-pixel
     + area-light jitter while the view holds still) → sRGB + dither.

   Geometry comes from models/wafer_parts/*.glb. Their exported
   normals are averaged across hard edges (the "pyramid" shading
   on every cap top), so every part is baked to world space and
   re-normalled: area-weighted and creased, so flat faces stay
   flat, fillets stay round and CNC edges stay crisp.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { loadScreens, makeScreen, drawConnected, drawPeripheral, marquee, ditherPhoto } from "./mip.js";
import { makeStand, makeWall, makeFridge } from "./props.js";
import { Spring, Track, project, rubberband } from "./motion.js";
import { PLACES, FOLD_PLACES, makePath, TENT } from "./places.js";
import { STAGES, DARK_PAGE, TONE, NEUTRAL_GLSL, neutral, inverseNeutral, studioEnvironment } from "./studio.js";   // the studio, the stages and the tone curve are shared with every other model

/* Embedded by another page (lab/wafer-story.html sets window.WAFER_EMBED before
   importing this file). Undefined here, so every EMBED branch below is dead in
   lab/wafer.html and the study behaves exactly as it always did. */
const EMBED = window.WAFER_EMBED || null;   // { inset?: { top, right, bottom, left } }

/* ---------------- stage + calibration ---------------- */

// the stages (light, dark, void) live in lab/studio.js, with the room they light
const STAGE_BASE = STAGES[document.documentElement.dataset.stage] || STAGES.light;
// embedded on the dark page, the black case reads against #0a0b0d only if the room's walls, floor and fill have some light in them; the study keeps its moodier variant
// a soft panel at the left gives the folded halves' backs something to reflect (black nylon on a black stage)
const STAGE = EMBED && STAGE_BASE === STAGES.dark ? { ...STAGE_BASE, env: { ...STAGE_BASE.env, ...DARK_PAGE } } : STAGE_BASE;

const UNIT = 100;        // scene unit = 1 cm; the GLBs are in metres
const TRAVEL = 0.15;     // key travel, cm — PG1316S class laptop switch, tune against the real board
const CREASE = 40;       // degrees; edges sharper than this stay hard
const SAMPLES = 48;      // accumulated frames once the view holds still
const { exposure: EXPOSURE, toe: TOE } = TONE;   // PBR Neutral: toe 1 = spec, 0 = keep every bit of shadow detail
const SUN_SOFT = 0.22;   // key-light disk radius as a fraction of its distance

const PARTS_DIR = "models/wafer_parts/";   // the page sets <base href="../">
const STRUCT = [
  "case_L", "case_R", "plate_L", "plate_R", "pcb_L", "pcb_R", "usbc_L", "usbc_R",
  "switches_L", "switches_R", "mcu", "display_L", "display_R",
  "antenna_L", "antenna_R", "softoff_L", "softoff_R",
];
const KEY_FILES = [];
for (const s of ["L", "R"]) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) KEY_FILES.push(`key_${s}_r${r}c${c}`);
  for (let t = 0; t < 3; t++) KEY_FILES.push(`key_${s}_t${t}`);
}

/* Same matrix wiring as demo/wafer-board.js. Left col 0 is the outer
   column; the right half's columns run mirrored. */
const ROWS = [
  ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP"],
  ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon"],
  ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"],
];
const CHARS = ["qwertyuiop", "asdfghjkl;", "zxcvbnm,./"];
const THUMBS = { L: ["MetaLeft", "AltLeft", "Space"], R: ["Enter", "AltRight", "Backspace"] };
const THUMB_CHARS = { L: [null, null, " "], R: ["\n", null, "\b"] };
const LAYER_KEYS = { key_L_t1: 1, key_R_t1: 2 };       // NAV · SYM, held
const LAYER_NAMES = EMBED ? ["Base", "Base", "Base"] : ["Base", "Nav", "Sym"];   // embedded: only "Base" is photographed
// homing bars on the physical caps: F, J and the middle thumbs. offset = along the cap toward the user
const HOMING = { key_L_r1c3: 0.2, key_R_r1c3: 0.2, key_L_t1: -0.3, key_R_t1: -0.3 };

/* ---------------- renderer ---------------- */

const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: "high-performance" });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;   // PCF honours shadow.radius; PCFSoft does not
renderer.shadowMap.autoUpdate = false;          // only the beauty pass refreshes it, not the height pass

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(22, 1, 1, 4000);   // long lens: product-photo perspective

/* ---------------- the studio ---------------- */

/* The procedural photo studio (a PMREM of a soft room and its softboxes) and
   the PBR Neutral curve, with its inverse, are lab/studio.js. The camera only
   orbits in pitch: the object turns under fixed lights, like a turntable shoot. */
scene.environment = studioEnvironment(THREE, renderer, STAGE.env);

scene.background = inverseNeutral(THREE, STAGE.bg);
console.assert(   // the stage colour must survive the tone curve exactly
  neutral(scene.background.toArray().map((v) => v * EXPOSURE)).every((v, i) => Math.abs(v - new THREE.Color(STAGE.bg).toArray()[i]) < 1e-3),
  "[wafer] background does not round-trip the tone curve");

/* ---------------- height-field occlusion ---------------- */

/* A keyboard is very nearly a height field, and that is exactly the occlusion
   image-based light lacks: the room pouring into 0.5 mm gaps under the caps.
   One orthographic depth render from above (redone only when a key moves)
   gives every surface its true horizon — a cosine-weighted sky visibility
   measured from its own tangent plane, so convex rounds never self-shadow.
   Full resolution, no screen-space noise, stable while the board turns; the
   floor reads the same map for its contact shadow. */
const HF = {
  halves: [],                                  // per half: { rt, cam, dirty }
  u: {
    uHMap0: { value: null },
    uHMap1: { value: null },
    uHBox: { value: [new THREE.Vector4(), new THREE.Vector4()] },     // minX, maxZ, 1/sizeX, 1/sizeZ
    uHCam: { value: [new THREE.Vector2(), new THREE.Vector2()] },     // camera height, far plane
    uHalfInv: { value: [new THREE.Matrix4(), new THREE.Matrix4()] },  // world → half-local
    uHSpin: { value: 0 },                                             // tap pattern turns per accumulated frame
  },
};
const HF_LAYER = [3, 4];
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });   // height and live depth passes   // each half's height pass sees only that half (switches excluded: they fold under the caps)

/* PG1316S switches are one merged mesh per half. Each vertex is tagged with
   the key above it, so a press can fold that switch's scissor down by the
   cap's travel instead of letting the steel frame poke through the cap. */
const SWITCH = { u: { uPress: { value: new Float32Array(36) }, uSwitchSpan: { value: new THREE.Vector2() } } };

/* A height field per half, rendered by an orthographic camera that rides on
   the half itself, looking down its own up axis. The map lives in half-local
   space, so it stays true however the half is turned, flipped or stood up —
   it only needs redrawing when one of its keys moves. */
function setupHeight(h, half, bb) {
  const m = 2, minX = bb.min.x - m, maxX = bb.max.x + m, minZ = bb.min.z - m, maxZ = bb.max.z + m;
  const top = bb.max.y + 1, far = top + 1, res = 0.015;   // 0.15 mm per texel
  const w = Math.min(4096, Math.ceil((maxX - minX) / res)), hgt = Math.min(4096, Math.ceil((maxZ - minZ) / res));
  const rt = new THREE.WebGLRenderTarget(w, hgt);
  rt.depthTexture = new THREE.DepthTexture(w, hgt, THREE.FloatType);
  const cam = new THREE.OrthographicCamera(minX, maxX, -minZ, -maxZ, 0, far);
  cam.position.set(0, top, 0);
  cam.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);   // looks down -y, camera up = -z
  cam.layers.set(HF_LAYER[h]);
  half.add(cam);
  HF.halves[h] = { rt, cam, dirty: true };
  HF.u[`uHMap${h}`].value = rt.depthTexture;
  HF.u.uHBox.value[h].set(minX, maxZ, 1 / (maxX - minX), 1 / (maxZ - minZ));
  HF.u.uHCam.value[h].set(top, far);
}

function renderHeight(h) {
  const bg = scene.background;
  scene.background = null;
  scene.overrideMaterial = depthOnly;
  renderer.setRenderTarget(HF.halves[h].rt);
  renderer.clear();
  renderer.render(scene, HF.halves[h].cam);
  scene.overrideMaterial = null;
  scene.background = bg;
  HF.halves[h].dirty = false;
}

const HF_GLSL = /* glsl */ `
uniform sampler2D uHMap0, uHMap1;
uniform vec4 uHBox[2];
uniform vec2 uHCam[2];
uniform mat4 uHalfInv[2];
uniform float uHSpin;
float hfAt(int h, vec2 xz) {
  vec4 b = uHBox[h];
  vec2 uv = vec2((xz.x - b.x) * b.z, (b.y - xz.y) * b.w);
  float d = h == 0 ? textureLod(uHMap0, uv, 0.0).r : textureLod(uHMap1, uv, 0.0).r;
  return uHCam[h].x - d * uHCam[h].y;
}
float hfSky(int h, vec3 p, vec3 n, float radius) {
  vec4 b = uHBox[h];   // nothing of this half within reach: open sky, skip the taps
  if (p.x < b.x - radius || p.x > b.x + 1.0 / b.z + radius || p.z > b.y + radius || p.z < b.y - 1.0 / b.w - radius) return 1.0;
  // 8 directions, 3 steps each, keeping the highest horizon per direction
  float occ = 0.0, wsum = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7853982 + uHSpin;
    vec2 d = vec2(cos(a), sin(a));
    float w = clamp(dot(d, n.xz) + n.y, 0.0, 1.0);           // only the half-space the surface faces
    float horizon = 0.0;
    for (int k = 0; k < 3; k++) {
      float r = radius * (k == 0 ? 0.12 : k == 1 ? 0.38 : 1.0);
      vec2 o = n.xz * 0.02 + d * r;                            // step off a wall before looking out
      float plane = n.y > 0.2 ? p.y - dot(n.xz, o) / n.y : p.y;// horizon from the tangent plane
      float dh = hfAt(h, p.xz + o) - plane - 0.012;
      horizon = max(horizon, dh > 0.0 ? dh * dh / (dh * dh + r * r) : 0.0);   // sin^2: cosine-weighted
    }
    occ += w * horizon;
    wsum += w;
  }
  // The horizon only describes points ON the height field. A point under an
  // overhang (switch housing beneath a cap's edge) has a roof, and only sees
  // the room sideways through the gap: mostly dark.
  float roof = n.y < -0.5 ? 0.0 : smoothstep(0.02, 0.08, hfAt(h, p.xz + n.xz * 0.03) - p.y);   // a half's back faces away from its own roof
  float v = (1.0 - occ / max(wsum, 1e-3)) * (1.0 - 0.88 * roof);
  // a half stood on its edge puts the floor behind its plane inside this box too: the darkening ends well inside the box, never on its straight edge
  vec2 lo = vec2(p.x - (b.x - radius), (b.y + radius) - p.z), hi = vec2(b.x + 1.0 / b.z + radius - p.x, p.z - (b.y - 1.0 / b.w - radius));
  return mix(1.0, v, smoothstep(0.0, 3.0, min(min(lo.x, lo.y), min(hi.x, hi.y))));
}
// any surface the halves rest on (floor, stand, wall): contact from both. The
// height field only knows the half from above, so a receiver further below the
// half's back (the floor under a tented half) fades out of it: light walks in
// from the sides of a tent.
float contactSky(vec3 wp, vec3 wn, float radius) {
  float sky = 1.0;
  for (int h = 0; h < 2; h++) {
    vec3 p = (uHalfInv[h] * vec4(wp, 1.0)).xyz;
    float near = exp(-${EMBED ? "abs(p.y)" : "max(0.0, -p.y)"} / 0.9);   // embedded: also falls off on the key side, where a standing half's plane runs on across the floor in front of it
    if (near > 0.02) sky *= mix(1.0, hfSky(h, p, normalize(mat3(uHalfInv[h]) * wn), radius), near);
  }
  return sky;
}
`;

/* Shadow catcher: an endless floor that is only ever shadow — the key
   light's, plus the height field's contact occlusion around the board. */
const floorMat = new THREE.ShadowMaterial({ opacity: STAGE.shadow });
floorMat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, HF.u, { uContact: { value: STAGE.contact } });
  sh.vertexShader = sh.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
    .replace("#include <fog_vertex>", "#include <fog_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  sh.fragmentShader = sh.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nuniform float uContact;\n" + HF_GLSL)
    .replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );", `
      ${EMBED ? `// the shadow map is a ±22 cm window: a tall pose throws a shadow past it, and the cut would be a hard line across the floor
      vec3 sc = vDirectionalShadowCoord[0].xyz / vDirectionalShadowCoord[0].w;
      float feather = smoothstep(0.0, 0.3, min(min(sc.x, 1.0 - sc.x), min(sc.y, 1.0 - sc.y)));` : ""}
      float lit = 1.0 - opacity * ${EMBED ? "feather * " : ""}(1.0 - getShadowMask());
      float sky = mix(1.0, contactSky(vWPos, vec3(0.0, 1.0, 0.0), 1.6), uContact);
      gl_FragColor = vec4(color, 1.0 - lit * sky);`);
};
const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), floorMat);
floor.position.y = -0.004;
floor.receiveShadow = true;
scene.add(floor);

/* Key light: casts the soft shadow. Its position is jittered across a disk
   while frames accumulate, which turns it into an area light. */
const SUN_DIR = new THREE.Vector3(-0.32, 1, 0.42).normalize();
const SUN_DIST = 90;
const sun = new THREE.DirectionalLight(0xffffff, STAGE.sun);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 20, far: 170 });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.012;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
sun.layers.enable(2);   // LIVE: the screens' own pass is lit by it too
const SUN_T1 = new THREE.Vector3().crossVectors(SUN_DIR, new THREE.Vector3(0, 0, 1)).normalize();
const SUN_T2 = new THREE.Vector3().crossVectors(SUN_DIR, SUN_T1).normalize();

/* ---------------- surface detail ---------------- */

/* One tileable 256² field. RG: slopes of a fine height field (bead-blast
   grain), A: that height (roughness grain), B: a broad low-frequency field
   (the finish mottling every real anodized part has). Sampled triplanar in
   world space — none of the CAD parts carry UVs. */
function makeDetail(size = 256) {
  let seed = 0x9e3779b9;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const fbm = (octaves) => {
    const out = new Float32Array(size * size);
    for (const [period, amp] of octaves) {
      const g = new Float32Array(period * period).map(rand);
      const at = (x, y) => g[((y + period) % period) * period + ((x + period) % period)];
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const fx = (x / size) * period, fy = (y / size) * period;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        let tx = fx - x0, ty = fy - y0;
        tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
        out[y * size + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      }
    }
    return out;
  };
  const hi = fbm([[32, 0.45], [64, 0.35], [128, 0.2]]);
  const lo = fbm([[4, 0.55], [8, 0.3], [16, 0.15]]);
  const data = new Uint8Array(size * size * 4);
  const at = (x, y) => hi[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const sx = (at(x + 1, y) - at(x - 1, y)) * 6;
    const sy = (at(x, y + 1) - at(x, y - 1)) * 6;
    data[i] = Math.max(0, Math.min(255, 128 + sx * 127));
    data[i + 1] = Math.max(0, Math.min(255, 128 + sy * 127));
    data[i + 2] = Math.max(0, Math.min(255, lo[y * size + x] * 255));
    data[i + 3] = Math.max(0, Math.min(255, hi[y * size + x] * 255));
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}
const DETAIL = makeDetail();

const DETAIL_GLSL = /* glsl */ `
uniform sampler2D uDetail;
uniform float uDetailScale, uDetailNormal, uDetailRough, uDetailMottle;
vec3 detailW(vec3 n) { vec3 w = pow(abs(n), vec3(6.0)); return w / (w.x + w.y + w.z); }
vec4 detailTri(vec3 p, vec3 w) {
  return texture2D(uDetail, p.zy) * w.x + texture2D(uDetail, p.xz) * w.y + texture2D(uDetail, p.xy) * w.z;
}
vec3 detailSlope(vec3 p, vec3 w) {
  vec2 sx = texture2D(uDetail, p.zy).rg * 2.0 - 1.0;
  vec2 sy = texture2D(uDetail, p.xz).rg * 2.0 - 1.0;
  vec2 sz = texture2D(uDetail, p.xy).rg * 2.0 - 1.0;
  return vec3(0.0, sx.y, sx.x) * w.x + vec3(sy.x, 0.0, sy.y) * w.y + vec3(sz.x, sz.y, 0.0) * w.z;
}
`;

/* The board is black soldermask with white silkscreen (it shows through the
   reset cut-out); the export's baked texture is a green KiCad render. Re-ink
   it: anything green-dominant becomes mask, silkscreen and pads stay. */
const PCB_GLSL = /* glsl */ `
#ifdef USE_MAP
  vec3 pcbT = texture2D(map, vMapUv).rgb;
  float pcbHi = max(pcbT.r, max(pcbT.g, pcbT.b)), pcbLo = min(pcbT.r, min(pcbT.g, pcbT.b));
  float pcbMask = smoothstep(0.12, 0.3, (pcbHi - pcbLo) / max(pcbHi, 1e-3)) * step(pcbT.r, pcbT.g);   // saturated, green/teal side: mask
  diffuseColor.rgb *= mix(min(pcbT, vec3(0.32)), vec3(0.010, 0.011, 0.012), pcbMask);   // ink capped: it lives 4 mm down a slot
#endif
`;

/* Every material on the board goes through here: height-field sky occlusion
   on its image-based light, plus optional triplanar micro-detail or the PCB
   re-ink. The hook's source is shared, so the cache key carries the variant. */
function upgrade(mat, { detail = null, pcb = false, collapse = false, prop = false, reach = 0.3, edge = null } = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, HF.u, { uHReach: { value: reach } });
    if (collapse) {
      Object.assign(sh.uniforms, SWITCH.u);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aKey;\nuniform float uPress[36];\nuniform vec2 uSwitchSpan;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          // the scissor folds flat under its cap: squash the switch toward its base by the cap's travel
          if (aKey >= 0.0) transformed.y = uSwitchSpan.x + (transformed.y - uSwitchSpan.x) * (1.0 - uPress[int(aKey + 0.5)] * uSwitchSpan.y);`);
    }
    if (detail) {
      Object.assign(sh.uniforms, {
        uDetail: { value: DETAIL },
        uDetailScale: { value: detail.scale },
        uDetailNormal: { value: detail.normal },
        uDetailRough: { value: detail.rough },
        uDetailMottle: { value: detail.mottle },
      });
    }
    if (edge) Object.assign(sh.uniforms, { uEdge: { value: new THREE.Vector4(...edge.fade, edge.vig, edge.r0) }, uEdgeS: { value: new THREE.Vector2(edge.sx, edge.sy) } });
    mat.userData.shader = sh;   // live tuning from the console
    const vary = "varying vec3 vWPos;\nvarying vec3 vWNrm;\nvarying float vHalf;\n" + (edge ? "varying vec3 vOP;\n" : "");
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aHalf;\n" + vary)
      .replace("#include <fog_vertex>", `#include <fog_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWNrm = normalize(mat3(modelMatrix) * objectNormal);
        vHalf = aHalf;${edge ? "\n        vOP = position;" : ""}`);
    let f = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + vary + "uniform float uHReach;\n" + (edge ? "uniform vec4 uEdge;\nuniform vec2 uEdgeS;\n" : "") + HF_GLSL + (detail ? DETAIL_GLSL : ""))
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>
        #ifdef PROP
          float hSky = contactSky(vWPos, normalize(vWNrm), uHReach);   // a surface the halves rest on
        #else
          int hH = vHalf < 0.5 ? 0 : 1;
          float hSky = hfSky(hH, (uHalfInv[hH] * vec4(vWPos, 1.0)).xyz, normalize(mat3(uHalfInv[hH]) * vWNrm), uHReach);
        #endif
        reflectedLight.indirectDiffuse *= hSky;
        reflectedLight.indirectSpecular *= hSky;
        #ifdef USE_CLEARCOAT
          clearcoatSpecularIndirect *= hSky;
        #endif
        #ifdef USE_SHEEN
          sheenSpecularIndirect *= hSky;
        #endif
${edge ? `        // light falls off from the halves outward; the left edge hands over to the stage (alpha), so no hard line meets the copy
        float eV = 1.0 - uEdge.z * smoothstep(uEdge.w, 1.25, length(vOP.xy / uEdgeS));
        reflectedLight.directDiffuse *= eV; reflectedLight.indirectDiffuse *= eV;
        reflectedLight.directSpecular *= eV; reflectedLight.indirectSpecular *= eV;
        diffuseColor.a *= smoothstep(uEdge.x, uEdge.y, vOP.x);
` : ""}`);
    if (pcb) f = f.replace("#include <map_fragment>", PCB_GLSL);
    if (detail) {
      f = f
        .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
          vec3 dW = detailW(vWNrm);
          float dGrain = detailTri(vWPos * uDetailScale, dW).a;
          float dMottle = detailTri(vWPos * uDetailScale * 0.035, dW).b;
          roughnessFactor = clamp(roughnessFactor * (1.0 + (dGrain - 0.5) * uDetailRough + (dMottle - 0.5) * uDetailMottle), 0.03, 1.0);`)
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
          normal = normalize(normal + (viewMatrix * vec4(detailSlope(vWPos * uDetailScale, dW), 0.0)).xyz * uDetailNormal);`);
    }
    sh.fragmentShader = f;
  };
  if (prop) mat.defines = { ...mat.defines, PROP: "" };
  mat.customProgramCacheKey = () => `wafer${detail ? "+detail" : ""}${pcb ? "+pcb" : ""}${collapse ? "+collapse" : ""}${prop ? "+prop" : ""}${edge ? "+edge" : ""}`;
  return mat;
}

/* ---------------- materials ---------------- */

const phys = (o) => new THREE.MeshPhysicalMaterial(o);
const srgb = (hex) => new THREE.Color(hex);

/* Palette parts (switches, display module) index a 4-texel-per-entry strip
   gltfpack built from the CAD appearances. Swap the strip for one that says
   what each part is actually made of. entries: [sRGB hex, roughness, metalness] */
function paletteMaterial(entries, extra = {}, look = {}) {
  const n = entries.length;
  const col = new Uint8Array(n * 4), rm = new Uint8Array(n * 4);
  entries.forEach(([hex, rough, metal], i) => {
    const v = parseInt(hex.slice(1), 16);
    col.set([(v >> 16) & 255, (v >> 8) & 255, v & 255, 255], i * 4);
    rm.set([0, Math.round(rough * 255), Math.round(metal * 255), 255], i * 4);
  });
  const map = new THREE.DataTexture(col, n, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  const rmMap = new THREE.DataTexture(rm, n, 1);
  rmMap.needsUpdate = true;
  return upgrade(phys({ map, roughnessMap: rmMap, metalnessMap: rmMap, roughness: 1, metalness: 1, ...extra }), look);
}

/* Each palette part has its own entry order (display_L keeps its active area
   at entry 3, display_R at 4), so read the exported strip back off the GPU
   and match every entry by its CAD colour. rows: [CAD colour, sRGB, roughness, metalness, tag] */
const SWAP = {
  display: [
    ["#faf2d1", "#b8742a", 0.35, 0],             // flex cable → amber polyimide
    ["#737373", "#0d0e10", 0.15, 0],             // panel mask
    ["#fafafa", "#18191c", 0.08, 0],             // panel glass
    ["#c1c1c1", "#babdb8", 0.40, 0, "active"],   // active area — the live screen lies over it
    ["#8cd68c", "#111213", 0.50, 0],             // module PCB, black like the real one
  ],
  switches: [                                    // Kailh PG1316S
    ["#e2e2d9", "#e6dcc4", 0.50, 0],             // housing: milky, translucent POM
    ["#ffdebd", "#e8cba4", 0.45, 0],
    ["#ffffff", "#efe8d8", 0.45, 0],
    ["#e9e9f9", "#d2d4d8", 0.20, 1],             // stainless rods
    ["#e0e0e0", "#c9cbce", 0.30, 1],             // stainless scissor frame
    ["#ededed", "#c9cbce", 0.30, 1],
    ["#828282", "#a6a8ac", 0.35, 1],
    ["#898989", "#a6a8ac", 0.35, 1],
  ],
};

function readPalette(tex) {
  const n = Math.max(1, Math.round(tex.image.width / 4));   // gltfpack: 4 texels per entry
  const rt = new THREE.WebGLRenderTarget(n, 1);
  const quad = new FullScreenQuad(new THREE.MeshBasicMaterial({ map: tex }));
  renderer.setRenderTarget(rt);
  quad.render(renderer);
  const px = new Uint8Array(n * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, n, 1, px);
  renderer.setRenderTarget(null);
  rt.dispose(); quad.material.dispose(); quad.dispose();
  return Array.from({ length: n }, (_, i) => new THREE.Color().setRGB(px[i * 4] / 255, px[i * 4 + 1] / 255, px[i * 4 + 2] / 255));
}

function swapPalette(src, table, extra, look) {
  const refs = table.map(([cad]) => new THREE.Color(cad));
  const entries = readPalette(src.map).map((c) => {
    let best = 0, bd = Infinity;
    refs.forEach((r, i) => {
      const d = (r.r - c.r) ** 2 + (r.g - c.g) ** 2 + (r.b - c.b) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    return table[best].slice(1);
  });
  const mat = paletteMaterial(entries, extra, look);
  mat.userData.active = entries.findIndex((e) => e[3] === "active");
  mat.userData.entries = entries.length;
  return mat;
}

const MAT = {
  // black anodized 6061, bead blasted: the oxide is a dyed dielectric (n ≈ 1.65), not bare metal
  alu: upgrade(phys({ color: srgb("#1d1e21"), roughness: 0.5, metalness: 0, ior: 1.65 }),
    { detail: { scale: 4.5, normal: 0.07, rough: 0.12, mottle: 0.12 } }),
  // blank satin caps
  cap: upgrade(phys({ color: srgb("#141517"), roughness: 0.4, metalness: 0, ior: 1.5 }),
    { detail: { scale: 6.0, normal: 0.04, rough: 0.1, mottle: 0.06 } }),
  // SLS nylon 12, dyed black — the bottom plate and the soft-off pods
  nylon: upgrade(phys({ color: srgb("#111112"), roughness: 0.74, metalness: 0, ior: 1.53 }),
    { detail: { scale: 2.5, normal: 0.2, rough: 0.2, mottle: 0.05 } }),
  plastic: upgrade(phys({ color: srgb("#141416"), roughness: 0.45, ior: 1.5 })),
  steel: upgrade(phys({ color: srgb("#c9cbce"), roughness: 0.22, metalness: 1 })),
  gold: upgrade(phys({ color: new THREE.Color(1.0, 0.76, 0.33), roughness: 0.25, metalness: 1 })),
};

/* Props: surfaces the halves rest on take contact occlusion from both halves. */
const PROP_MAT = {
  alu: upgrade(phys({ color: srgb("#c9cbce"), metalness: 1, roughness: 0.36 }),
    { prop: true, detail: { scale: 4.5, normal: 0.05, rough: 0.1, mottle: 0.08 } }),   // bead-blasted silver: a magnet-ring puck
  pad: upgrade(phys({ color: srgb("#2b2c2f"), roughness: 0.86, ior: 1.4 }), { prop: true }),   // soft-touch silicone face
  steel: upgrade(phys({ color: srgb("#c4c6c9"), metalness: 1, roughness: 0.3, anisotropy: 0.75 }),   // brushed stainless
    EMBED ? { prop: true, reach: 2.4, detail: { scale: 0.7, normal: 0.05, rough: 0.35, mottle: 0.5 }, edge: { fade: [-1e4, -9e3], vig: 0.55, r0: 0.25, sx: 23, sy: 15 } } : { prop: true, reach: 1.2 }),
  enamel: upgrade(phys({ color: srgb("#f0f0ec"), roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.18, ...(EMBED ? { transparent: true } : {}) }),
    EMBED ? { prop: true, reach: 1.6, edge: { fade: [-24, -12], vig: 0.3, r0: 0.45, sx: 30, sy: 48 } } : { prop: true, reach: 1.2 }),
  handleMetal: upgrade(phys({ color: srgb("#b9bcc0"), metalness: 1, roughness: 0.34, anisotropy: 0.6 }), { prop: true }),
  handlePlastic: upgrade(phys({ color: srgb("#ecebe6"), roughness: 0.45 }), { prop: true }),
  gap: upgrade(phys({ color: srgb("#18191b"), roughness: 0.6 }), { prop: true }),
};

// embedded on the dark page the white enamel would be the brightest thing in the room: a quieter door
if (EMBED && STAGE_BASE === STAGES.dark) {
  PROP_MAT.enamel.color.multiplyScalar(0.15); PROP_MAT.handlePlastic.color.multiplyScalar(0.6);   // a door that is lit, not the brightest thing in the room: the copy beside it stays readable
  MAT.nylon.envMapIntensity = 3;   // the folded halves' black backs are plate nylon on a black page: lifted until the pockets read (about 0.17 luma)
}

const pcbMaterial = (map) => upgrade(phys({ map, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 }), { pcb: true });

/* USB-C and the ISP1807 ship CAD appearances named by colour. */
function byColour(src) {
  const c = src.color;
  if (c.r > 0.4 && c.r >= c.g && c.b < 0.1) return MAT.gold;
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.2 ? MAT.steel : MAT.plastic;
}

function materialFor(kind, src) {
  switch (kind) {
    case "case": return MAT.alu;
    case "key": return MAT.cap;
    case "plate": case "softoff": return MAT.nylon;
    case "antenna": return MAT.plastic;
    case "pcb": return pcbMaterial(src.map);
    case "switches": return swapPalette(src, SWAP.switches, {}, { collapse: true });
    case "display": return swapPalette(src, SWAP.display, { clearcoat: 1, clearcoatRoughness: 0.05 });
    default: return byColour(src);
  }
}

/* ---------------- geometry ---------------- */

/* Area-weighted, creased vertex normals over a flat triangle soup. A corner
   averages only the faces around it within CREASE of its own face, weighted
   by area, so fillets shade round and hard edges stay hard.

   `wide` (cm) is for the case. Its top is not flat: it is a gentle sculpted
   surface, sloping 1–2°, that Fusion cut into long irregular slivers, so
   any per-vertex average carries the triangulation into the reflections as
   faint wedges. There, a corner takes the area-weighted normal of all
   near-coplanar faces within a disk instead — the true surface normal,
   independent of how the CAD happened to triangulate it. Thin fillet
   strips cover too little of that disk and keep the crease rule. */
function hardNormals(P, creaseDeg, wide = 0) {
  const tris = P.length / 9, cos = Math.cos((creaseDeg * Math.PI) / 180);
  const FA = new Float32Array(tris * 3), FU = new Float32Array(tris * 3), FC = new Float32Array(tris * 3);
  for (let t = 0; t < tris; t++) {
    const o = t * 9;
    const ax = P[o + 3] - P[o], ay = P[o + 4] - P[o + 1], az = P[o + 5] - P[o + 2];
    const bx = P[o + 6] - P[o], by = P[o + 7] - P[o + 1], bz = P[o + 8] - P[o + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const l = Math.hypot(nx, ny, nz);
    FA.set([nx, ny, nz], t * 3);
    if (l > 0) FU.set([nx / l, ny / l, nz / l], t * 3);
    FC.set([(P[o] + P[o + 3] + P[o + 6]) / 3, (P[o + 1] + P[o + 4] + P[o + 7]) / 3, (P[o + 2] + P[o + 5] + P[o + 8]) / 3], t * 3);
  }
  const n = tris * 3, id = new Int32Array(n), weld = new Map();
  let span = 1e-9;
  for (let i = 0; i < P.length; i++) span = Math.max(span, Math.abs(P[i]));
  const q = 1e5 / span;
  for (let i = 0; i < n; i++) {
    const k = Math.round(P[i * 3] * q) + "," + Math.round(P[i * 3 + 1] * q) + "," + Math.round(P[i * 3 + 2] * q);
    let v = weld.get(k);
    if (v === undefined) weld.set(k, (v = weld.size));
    id[i] = v;
  }
  const start = new Int32Array(weld.size + 1);
  for (let i = 0; i < n; i++) start[id[i] + 1]++;
  for (let v = 0; v < weld.size; v++) start[v + 1] += start[v];
  const fill = start.slice(), list = new Int32Array(n);
  for (let i = 0; i < n; i++) list[fill[id[i]]++] = i;

  // face centroids bucketed on a grid one disk wide
  const cell = (x) => Math.floor(x / wide);
  const grid = new Map();
  if (wide) for (let t = 0; t < tris; t++) {
    const k = cell(FC[t * 3]) + "," + cell(FC[t * 3 + 1]) + "," + cell(FC[t * 3 + 2]);
    const c = grid.get(k);
    if (c) c.push(t); else grid.set(k, [t]);
  }
  const cosNear = Math.cos((6 * Math.PI) / 180), minArea = 0.25 * Math.PI * wide * wide;

  const N = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / 3) | 0, v = id[i];
    const ux = FU[t * 3], uy = FU[t * 3 + 1], uz = FU[t * 3 + 2];
    let sx = 0, sy = 0, sz = 0;
    if (wide) {
      const px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2];
      const cx = cell(px), cy = cell(py), cz = cell(pz);
      let area = 0;
      for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) for (let gz = cz - 1; gz <= cz + 1; gz++) {
        for (const f of grid.get(gx + "," + gy + "," + gz) || []) {
          const s = f * 3;
          if (ux * FU[s] + uy * FU[s + 1] + uz * FU[s + 2] < cosNear) continue;
          const d = Math.hypot(FC[s] - px, FC[s + 1] - py, FC[s + 2] - pz);
          if (d > wide) continue;
          const k = (1 - d / wide) ** 2;
          sx += FA[s] * k; sy += FA[s + 1] * k; sz += FA[s + 2] * k;
          area += Math.hypot(FA[s], FA[s + 1], FA[s + 2]) / 2;
        }
      }
      if (area > minArea) {
        const l = Math.hypot(sx, sy, sz) || 1;
        N.set([sx / l, sy / l, sz / l], i * 3);
        continue;
      }
      sx = sy = sz = 0;
    }
    for (let k = start[v]; k < start[v + 1]; k++) {
      const s = ((list[k] / 3) | 0) * 3;
      if (ux * FU[s] + uy * FU[s + 1] + uz * FU[s + 2] < cos) continue;
      sx += FA[s]; sy += FA[s + 1]; sz += FA[s + 2];
    }
    const l = Math.hypot(sx, sy, sz) || 1;
    N.set([sx / l, sy / l, sz / l], i * 3);
  }
  return N;
}

/* Bake a (meshopt-quantized) mesh into float world-space geometry. */
function bake(geometry, M, wide = 0) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.attributes.position, uv = g.attributes.uv, n = pos.count;
  const flip = M.determinant() < 0;
  const P = new Float32Array(n * 3), U = uv ? new Float32Array(n * 2) : null;
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const j = flip && i % 3 ? (i % 3 === 1 ? i + 1 : i - 1) : i;   // keep winding if mirrored
    v.fromBufferAttribute(pos, i).applyMatrix4(M).toArray(P, j * 3);
    if (U) { U[j * 2] = uv.getX(i); U[j * 2 + 1] = uv.getY(i); }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(P, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(hardNormals(P, CREASE, wide), 3));
  if (U) out.setAttribute("uv", new THREE.BufferAttribute(U, 2));
  return mergeVertices(out, 1e-5);
}

/* ---------------- the Memory-in-Pixel screens ---------------- */

/* nice!view class panels, 68 × 160, 1-bit, reflective: drawn live by
   ./mip.js with the designer's SVGs as the pixel-exact reference. They are
   only ever as bright as the room — there is no backlight. */

/* Find the panel's active area on the baked module (the palette entry the
   CAD painted it with, facing up) and lay a screen exactly over it. */
function mountScreen(module, screen) {
  const geo = module.geometry, { active, entries } = module.material.userData;
  const pos = geo.attributes.position, uv = geo.attributes.uv, nrm = geo.attributes.normal;
  const box = new THREE.Box3(), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    if (Math.floor(uv.getX(i) * entries) !== active || nrm.getY(i) < 0.9) continue;
    box.expandByPoint(v.fromBufferAttribute(pos, i));
  }
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const plane = new THREE.PlaneGeometry(size.x, size.z).rotateX(-Math.PI / 2);   // canvas top → far edge
  const mat = upgrade(phys({ map: screen.tex, roughness: 0.55, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 }));
  const mesh = new THREE.Mesh(plane, mat);
  mesh.position.set(mid.x, box.max.y + 0.002, mid.z);
  mesh.receiveShadow = true;
  mesh.layers.enable(LIVE);
  mesh.userData.screen = screen;
  screenMeshes.push(mesh);
  return mesh;
}

/* ---------------- assembly ---------------- */

const board = new THREE.Group();
scene.add(board);
/* The two halves move on their own. Each pivots on the centre of its magnet
   ring (measured off the recess in the bottom plate), so snapping the rings
   together is just making two pivots meet. */
const RING = { x: 7.593, z: -0.121, inner: 2.265, outer: 2.741 };   // cm, board-local
const halves = [new THREE.Group(), new THREE.Group()];               // 0 = left (central), 1 = right
halves[0].position.set(-RING.x, 0, RING.z);
halves[1].position.set(RING.x, 0, RING.z);
board.add(...halves);
const halfOf = (name, geo) => /_L$|^key_L_/.test(name) ? 0 : /_R$|^key_R_/.test(name) ? 1
  : (geo.boundingBox.min.x + geo.boundingBox.max.x < 0 ? 0 : 1);
function tagHalf(geo, h) { geo.setAttribute("aHalf", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(h), 1)); }
const keys = [];            // { id, meshes, p, v, src:Set, ch, layer }
const keyMeshes = [];       // raycast targets
const pickables = [];       // everything on the board, for zoom-to-cursor
const codeMap = {};
const screens = { status: makeScreen(THREE, renderer), media: makeScreen(THREE, renderer) };
const screenMeshes = [];

function kindOf(name) { return name.startsWith("key_") ? "key" : name.replace(/_[LR]$/, ""); }

async function load() {
  const ktx2 = new KTX2Loader()
    .setTranscoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/")
    .detectSupport(renderer);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx2);
  const names = STRUCT.concat(KEY_FILES);
  const settled = await Promise.allSettled(names.map((n) => loader.loadAsync(PARTS_DIR + n + ".glb")));
  const parts = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") parts.push({ name: names[i], root: r.value.scene });
    else console.warn("[wafer] part failed", names[i], r.reason);
  });

  // 1 · orientation, read off the parts themselves: the thin axis is up (signed
  //     so the caps sit on top), and the thumb clusters face the camera.
  const all = new THREE.Box3();
  for (const p of parts) {
    p.root.updateMatrixWorld(true);
    p.box = new THREE.Box3().setFromObject(p.root);
    p.mid = p.box.getCenter(new THREE.Vector3());
    all.union(p.box);
  }
  const size = all.getSize(new THREE.Vector3()), centre = all.getCenter(new THREE.Vector3());
  const dims = [size.x, size.y, size.z], upI = dims.indexOf(Math.min(...dims));
  const up = new THREE.Vector3().setComponent(upI, 1);
  const caps = parts.filter((p) => p.name.startsWith("key_"));
  const capLift = caps.reduce((s, p) => s + p.mid.clone().sub(centre).dot(up), 0);
  if (capLift < 0) up.negate();
  const rot = new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(0, 1, 0));
  const avg = (list) => list.reduce((s, p) => s.add(p.mid.clone().applyQuaternion(rot)), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, list.length));
  const south = avg(caps.filter((p) => /_t\d$/.test(p.name))).sub(avg(caps.filter((p) => /_r0c\d$/.test(p.name))));
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-south.x, south.z));
  rot.premultiply(yaw);
  const M0 = new THREE.Matrix4().compose(new THREE.Vector3(), rot, new THREE.Vector3(UNIT, UNIT, UNIT));

  // 2 · bake every mesh into world-space centimetres with rebuilt normals
  const built = [];
  for (const p of parts) {
    const kind = kindOf(p.name);
    p.root.traverse((o) => {
      if (!o.isMesh) return;
      const M = new THREE.Matrix4().multiplyMatrices(M0, o.matrixWorld);
      const geo = bake(o.geometry, M, kind === "case" ? 2 : 0);
      const mesh = new THREE.Mesh(geo, materialFor(kind, o.material));
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.part = p.name;
      if (kind === "key") {
        const ex = new THREE.Vector3(), ey = new THREE.Vector3(), ez = new THREE.Vector3();
        M.extractBasis(ex, ey, ez);
        mesh.userData.axes = [ex, ey, ez].map((a) => a.normalize());
      }
      built.push({ name: p.name, kind, mesh });
    });
  }

  // 3 · sit it on the floor, centred
  const bb = new THREE.Box3();
  for (const b of built) { b.mesh.geometry.computeBoundingBox(); bb.union(b.mesh.geometry.boundingBox); }
  const shift = new THREE.Vector3(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  for (const b of built) {
    const geo = b.mesh.geometry;
    geo.translate(shift.x, shift.y, shift.z);
    geo.computeBoundingBox();
    b.half = halfOf(b.name, geo);
    const pivot = halves[b.half].position;
    geo.translate(-pivot.x, -pivot.y, -pivot.z);   // half-local: origin at the ring centre
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    tagHalf(geo, b.half);
    halves[b.half].add(b.mesh);
    pickables.push(b.mesh);
  }

  // 4 · keys: press travel, homing bars, wiring
  for (const b of built.filter((x) => x.kind === "key")) {
    const m = b.name.match(/^key_([LR])_(?:r(\d)c(\d)|t(\d))$/);
    const side = m[1], thumb = m[4] != null;
    const row = +m[2], col = thumb ? +m[4] : +m[3];
    const key = {
      id: b.name, meshes: [b.mesh], p: 0, v: 0, src: new Set(),
      ch: thumb ? THUMB_CHARS[side][col] : CHARS[row][side === "L" ? col : 9 - col],
      layer: LAYER_KEYS[b.name] || 0, index: keys.length, half: b.half,
    };
    const code = thumb ? THUMBS[side][col] : ROWS[row][side === "L" ? col : 9 - col];
    codeMap[code] = key;
    if (code === "MetaLeft") codeMap.ControlLeft = key;
    if (HOMING[b.name] != null) key.meshes.push(homingBar(b.mesh, HOMING[b.name]));
    for (const mesh of key.meshes) { mesh.userData.key = key; keyMeshes.push(mesh); }
    keys.push(key);
  }
  tagSwitches(built.filter((x) => x.kind === "switches"));

  // 5 · the two live screens
  for (const b of built.filter((x) => x.kind === "display")) {
    const screen = b.half === 0 ? screens.status : screens.media;
    const mesh = mountScreen(b.mesh, screen);
    if (!mesh) { console.warn("[wafer] no active area found on", b.name); continue; }
    tagHalf(mesh.geometry, b.half);
    halves[b.half].add(mesh);
  }

  halves.forEach((half, h) => {
    const bb = new THREE.Box3();
    half.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.computeBoundingBox();
      bb.union(o.geometry.boundingBox);
      if (!/^switches/.test(o.userData.part || "")) o.layers.enable(HF_LAYER[h]);
    });
    setupHeight(h, half, bb);
    outer[h] = h === 0 ? bb.min.x : bb.max.x;
    thick = Math.max(thick, bb.max.y);
    halfBox[h] = [bb.min.x, 0, bb.min.z, bb.max.x, bb.max.y, bb.max.z];
  });
  path = makePath({ RX: RING.x, RZ: RING.z, outer: [-outer[0], outer[1]], box: halfBox });
  track.magnets = path.MAGNETS;
  buildProps();
  buildRingViz();
  measureMarks();
}

function tagSwitches(parts) {
  const centres = keys.map((k) => k.meshes[0].geometry.boundingBox.getCenter(new THREE.Vector3()));
  const span = new THREE.Box3();
  for (const { mesh, half } of parts) {
    const pos = mesh.geometry.attributes.position, tag = new Float32Array(pos.count).fill(-1);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      let best = -1, bd = 1.0;   // within 1 cm of a cap centre on the same half
      centres.forEach((c, k) => {
        if (keys[k].half !== half) return;
        const d = Math.hypot(c.x - x, c.z - z);
        if (d < bd) { bd = d; best = k; }
      });
      tag[i] = best;
    }
    mesh.geometry.setAttribute("aKey", new THREE.BufferAttribute(tag, 1));
    mesh.castShadow = false;   // its shadow map pass would not fold
    span.union(mesh.geometry.boundingBox);
  }
  SWITCH.u.uSwitchSpan.value.set(span.min.y, TRAVEL / Math.max(1e-3, span.max.y - span.min.y));
}

/* A homing bar is a small raised ridge in the cap's own frame, offset along
   whichever of the cap's in-plane axes points toward the user. */
function homingBar(cap, offset) {
  const bb = cap.geometry.boundingBox, mid = bb.getCenter(new THREE.Vector3());
  const plane = cap.userData.axes.filter((a) => Math.abs(a.y) < 0.5);
  const south = plane.reduce((a, b) => (Math.abs(b.z) > Math.abs(a.z) ? b : a)).clone();
  if (south.z < 0) south.negate();
  const along = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), south).normalize();
  const capSize = Math.min(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.04, 0.07, 3, 0.018), cap.material);
  bar.geometry.applyMatrix4(new THREE.Matrix4().makeBasis(along, new THREE.Vector3(0, 1, 0), south));
  bar.geometry.translate(mid.x + south.x * offset * capSize, bb.max.y + 0.012, mid.z + south.z * offset * capSize);
  bar.geometry.computeBoundingBox();
  bar.castShadow = bar.receiveShadow = true;
  bar.userData.part = cap.userData.part;
  tagHalf(bar.geometry, cap.geometry.attributes.aHalf.getX(0));
  cap.parent.add(bar);
  return bar;
}

/* ---------------- props + the magnets, X-rayed ---------------- */

const props = {};
let thick = 0.811, outer = [0, 0];        // measured after load: half height, ring centre → pinky edge per half
const halfBox = [null, null];             // half-local bounds, for the path's clearance and checks

/* The things the halves stick to. Each sits at its place and comes in along a
   path, leaving the same way (spatial consistency): the pucks slide in from
   behind, the steel panel from far behind, the fridge from the right. */
const PROP_PATH = { stands: [new THREE.Vector3(0, 0, -20)], wall: [new THREE.Vector3(0, 0, -60)], fridge: [new THREE.Vector3(150, 0, 0)] };
function buildProps() {
  const seat = path.fold(TENT);   // where the tent pose carries each ring: one source of truth
  props.stands = [0, 1].map((h) => {
    const g = makeStand(THREE, { deg: h === 0 ? TENT_DEG : -TENT_DEG, rise: seat[h].p[1], alu: PROP_MAT.alu, pad: PROP_MAT.pad });
    g.position.fromArray(seat[h].p);
    return g;
  });
  props.wall = makeWall(THREE, { w: 46, h: 30, steel: PROP_MAT.steel });
  props.wall.position.set(0, 15, path.WALL.z);   // a steel board standing on the desk
  props.wall.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  props.fridge = makeFridge(THREE, PROP_MAT);
  props.fridge.position.set(0, 106.5, path.FRIDGE.z);   // on its feet, upper door at the halves
  for (const g of [...props.stands, props.wall, props.fridge]) { g.userData.home = g.position.clone(); g.visible = false; board.add(g); }
}

/* The magnets, X-rayed: hairlines at the ring's pole radii and round the
   stabilising bar beside it (measured off the pockets in the bottom plate),
   drawn through the case. Their opacity follows the force curve — near
   nothing until the last few millimetres — and a catch fires one bloom ring
   outward. Basic additive material: pure light. */
const ringViz = [];
const BAR = { x: 3.855, w: 1.55, d: 0.55 };   // cm, half-local, on the pinky side of the ring
function buildRingViz() {
  const lineMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const frame = (w, d, t) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 - t, -d / 2 - t); s.lineTo(w / 2 + t, -d / 2 - t); s.lineTo(w / 2 + t, d / 2 + t); s.lineTo(-w / 2 - t, d / 2 + t);
    const hole = new THREE.Path();
    hole.moveTo(-w / 2 + t, -d / 2 + t); hole.lineTo(-w / 2 + t, d / 2 - t); hole.lineTo(w / 2 - t, d / 2 - t); hole.lineTo(w / 2 - t, -d / 2 + t);
    s.holes.push(hole);
    return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
  };
  halves.forEach((half, h) => {
    const g = new THREE.Group();
    g.position.y = 0.09;   // in the recess, under 0.5 mm of nylon
    const a = new THREE.Mesh(new THREE.RingGeometry(2.36 - 0.012, 2.36 + 0.012, 160).rotateX(-Math.PI / 2), lineMat());
    const b = new THREE.Mesh(new THREE.RingGeometry(2.65 - 0.012, 2.65 + 0.012, 160).rotateX(-Math.PI / 2), lineMat());
    const bar = new THREE.Mesh(frame(BAR.w, BAR.d, 0.012), lineMat());
    bar.position.x = h === 0 ? -BAR.x : BAR.x;
    const bloom = new THREE.Mesh(new THREE.RingGeometry(2.62, 2.74, 160).rotateX(-Math.PI / 2), lineMat());
    for (const m of [a, b, bar, bloom]) { m.renderOrder = 10; g.add(m); }
    half.add(g);
    ringViz[h] = { g, a, b, bar, bloom, level: 0, bloomT: -1 };
  });
}
/* 0..1 field strength on both halves */
let ringV = 0, ringK = 1;
const ringHold = EMBED ? new Spring(1, { damping: 1, response: 0.9 }) : null;   // embedded: the X-ray explains the catch at Magnets, and on the brick steps back once it has held
function ringLevel(v) {
  ringV = v;
  const k = v * ringK;
  for (const r of ringViz) {
    r.level = k;
    r.a.material.opacity = 0.55 * k; r.b.material.opacity = 0.75 * k; r.bar.material.opacity = 0.75 * k;
    r.g.visible = k > 0.002 || r.bloomT >= 0;
  }
}
function ringBloom() { if (reduced) return; for (const r of ringViz) { r.bloomT = 0; r.g.visible = true; } kick(); }
/* advance the bloom: 0.42 s, expanding 27 → 45 mm and fading — returns true while it runs */
function stepRingViz(dt) {
  let busy = false;
  for (const r of ringViz) {
    if (r.bloomT < 0) continue;
    r.bloomT += dt / 0.42;
    const t = Math.min(1, r.bloomT), e = 1 - Math.pow(1 - t, 3);
    r.bloom.scale.setScalar(1 + e * 0.65);
    r.bloom.material.opacity = 0.9 * (1 - t) * (1 - t);
    if (t >= 1) { r.bloomT = -1; r.bloom.material.opacity = 0; r.g.visible = r.level > 0.002; }
    busy = true;
  }
  return busy;
}

/* ---------------- places ---------------- */

/* One body carries the object through every place (lab/places.js for the
   path, lab/motion.js for the body). Keys, the line, a hand on the halves:
   all of them only move the track, and the pose is a function of where it
   is — so every input shares one physics, anything can be interrupted, and
   going back replays the same path. */
const TENT_DEG = THREE.MathUtils.radToDeg(TENT);
let path = null;
const N = PLACES.length;
const track = new Track(N, {}, { onCatch: (k, v) => caught(k, v), onBreak: (k) => broke(k), onPass: () => sound && sound.uiTick("off") });
const rock = new Spring(0, { damping: 0.78, response: 0.22 });   // the joined brick's ring-down: it carried momentum
const ROCK_PIVOT = new THREE.Vector3(0, 0, RING.z), Z = new THREE.Vector3(0, 0, 1), rockQ = new THREE.Quaternion();
let place = 0;            // where the track is going (or is): what the line, the caption and the camera follow
let narrated = -1;        // the place the right panel narrates
let arrived = -1;         // the place the caption last announced

function applyHalves(P) {
  P.h.forEach((h, i) => { halves[i].position.fromArray(h.p); halves[i].quaternion.fromArray(h.q); });
}
function applyPose(P) {
  applyHalves(P);
  if (rock.value) {   // the joined brick rocks about its base
    rockQ.setFromAxisAngle(Z, rock.value);
    for (const half of halves) { half.position.sub(ROCK_PIVOT).applyQuaternion(rockQ).add(ROCK_PIVOT); half.quaternion.premultiply(rockQ); }
  }
  for (const k of Object.keys(PROP_PATH)) {
    const t = P[k];
    [].concat(props[k]).forEach((g, i) => {
      g.position.copy(g.userData.home).addScaledVector(PROP_PATH[k][i] || PROP_PATH[k][0], 1 - t);
      g.visible = t > 0.002;
    });
  }
  ringLevel(Math.max(P.ring, track.pull()));
}

/* Each place's framing, measured with the halves in that place's pose. */
const views = [];
const CAM_STATE = { damping: 1, response: 0.62 };   // the camera moves a beat slower than the object it frames
const CAM_LOOK = { damping: 1, response: 0.5 };     // between the flat places only the camera moves
function measureViews() {
  for (let k = 0; k < N; k++) {
    applyHalves(path.poseAt(k));
    const v = PLACES[k].view, target = new THREE.Vector3(...v.target);
    if (v.box === "left") target.x = frameBox(v).getCenter(new THREE.Vector3()).x;   // aimed at the half it frames
    views[k] = { target, dist: frameDistance(frameBox(v), v.yaw, v.pitch, target, v.fill) };
  }
  applyPose(path.poseAt(track.value));
}
const view = () => views[place] || { target: HOME.target, dist: HOME.dist };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function frame(k, snap = false) {
  const v = PLACES[k].view, V = views[k], opts = k <= 2 && framed <= 2 ? CAM_LOOK : CAM_STATE;
  cam.yaw.to(cam.yaw.value + wrap(v.yaw - cam.yaw.value), opts);
  cam.pitch.to(v.pitch, opts);
  cam.dist.to(V.dist, opts);
  aim(V.target, opts);
  if (snap) for (const s of Object.values(cam)) s.snap(s.target);
  framed = k;
  kick();
}
let framed = 0;

/* Go to a place. Interruptible from anywhere: it re-targets the live track. */
function go(k) {
  k = THREE.MathUtils.clamp(Math.round(k), 0, N - 1);
  if (reduced) { jump(k); return; }
  setPlace(k);
  track.go(k);
  frame(k);
}
/* Reduced motion: no flight. The pose and camera jump, and the image
   dissolves into the new place inside the accumulation buffer. */
function jump(k, cut = false) {   // cut: nothing to dissolve from (a hidden canvas, a first show), so no cross-fade
  setPlace(k);
  track.snap(k);
  rock.snap(0);
  applyPose(path.poseAt(k));
  frame(k, true);
  step(0);      // board and camera take the new view now, not on the next frame
  drawHead();   // the playhead jumps with it: nothing steps the track to move it
  setHeld();
  dissolve = cut || !shown ? 0 : 30;
  invalidate();
}
let dissolve = 0;   // frames left of a reduced-motion cross-fade

/* The catch: bloom, sound, a tap of haptics and — for the brick, which
   carried momentum into a free body — a rock, all on the frame of contact. */
function caught(k, speed) {
  ringBloom();
  if (navigator.vibrate && !reduced) navigator.vibrate(10);
  const kind = path.MAGNETS[k].kind, hit = Math.min(1, 0.35 + speed / 40);
  if (kind === "rings") {
    if (!reduced) { rock.velocity = THREE.MathUtils.clamp(speed, 0, 60) * 0.004; rock.to(0); }
    if (sound) { sound.thock({ deep: true, intensity: hit }); sound.ping(2, { peak: 0.02 }); }
  } else if (sound) sound.thock({ deep: kind === "steel", intensity: hit * (kind === "steel" ? 0.6 : 0.8) });
  if (k === 7) drawMedia();   // the fridge's receipt lands with the catch
  setHeld();
}
function broke() {
  if (sound) sound.keyRelease(true);   // the pop of letting go
  setHeld();
}

function stepStates(dt) {
  let moving = track.step(dt);
  if (rock.step(dt)) moving = true;
  if (moving) applyPose(path.poseAt(track.value));
  // the panel narrates the nearest place, swapping at an edge's midpoint the way a MIP refreshes
  const near = Math.round(track.value), flip = flipped();
  if (near !== narrated || flip !== shownFlip) { narrated = near; shownFlip = flip; drawMedia(); }
  // a hand on the line frames whichever place it is nearest
  if (scrub.on && near !== framed) frame(near);
  if (moving) drawHead();
  if (track.resting && (rock.resting || (EMBED && track.locked === place)) && arrived !== place && track.s === place) arrive(place);   // embedded: at the catch, not at the end of the rock
  return moving;
}
let shownFlip = false;

/* the right panel's letters point along its half's +x: upside down when that half stands on its pinky edge */
const RX_AXIS = new THREE.Vector3(1, 0, 0), tv = new THREE.Vector3();
const flipped = () => tv.copy(RX_AXIS).applyQuaternion(halves[1].quaternion).y < -0.5;

/* ---------------- the line, the caption ---------------- */

// an embedding page supplies only #stage, #marks and #sound; stand-ins keep every handler below inert
const mk = (tag, html = "") => Object.assign(document.createElement(tag), { innerHTML: html });
const lineEl = document.getElementById("line") || mk("nav", "<ol></ol><i class='head'></i>"), headEl = lineEl.querySelector(".head");
const captionEl = document.getElementById("caption") || mk("p");
// embedded, the page's own #stage-help describes the keys (aria-describedby), so the label names only the pose
const HELP = EMBED ? "" : "Drag to turn it, scroll or pinch to zoom, type on your own keyboard to press its keys. Arrow keys or the numbers 1 to 8 move between places.";
let ticks = [];   // x of each tick, in the line's own pixels
function buildLine() {
  lineEl.querySelector("ol").innerHTML = PLACES.map((p, k) =>
    `<li${k === N - 1 ? ' class="more"' : ""}><button type="button" data-k="${k}" aria-label="${k === N - 1 ? "One more thing: " : ""}${p.label}"><span>${p.label}</span></button></li>`).join("");
  measureLine();
}
function measureLine() {
  const r = lineEl.getBoundingClientRect();
  ticks = [...lineEl.querySelectorAll("button")].map((b) => { const q = b.getBoundingClientRect(); return q.left + q.width / 2 - r.left; });
}
function xAt(s) {
  const i = THREE.MathUtils.clamp(Math.floor(s), 0, N - 2), u = THREE.MathUtils.clamp(s - i, 0, 1);
  return ticks.length ? ticks[i] + (ticks[i + 1] - ticks[i]) * u : 0;
}
function sAt(x) {
  if (x <= ticks[0]) return 0;
  for (let i = 0; i < N - 1; i++) if (x <= ticks[i + 1]) return i + (x - ticks[i]) / (ticks[i + 1] - ticks[i]);
  return N - 1;
}
function drawHead() {
  headEl.style.setProperty("--x", `${xAt(track.value).toFixed(1)}px`);
  headEl.style.setProperty("--stretch", (1 + Math.min(0.6, Math.abs(track.strain) * 4)).toFixed(3));
}
function setHeld() { headEl.classList.toggle("held", track.locked >= 0); }
function setPlace(k) {
  place = k;
  if (ringHold) ringHold.to(1);
  lineEl.querySelectorAll("button").forEach((b, i) => { if (i === k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  if (arrived !== k) { captionEl.classList.remove("on"); arrived = -1; }
}
/* Arrived and still: the caption and the label say where, once. */
function arrive(k) {
  arrived = k;
  if (ringHold && k === 5) ringHold.to(0.1);   // the brick's back faces away: the X-ray drawn through its keys is only noise once it has caught
  const p = PLACES[k];
  captionEl.innerHTML = `<b>${p.title}</b> ${p.line}${k === N - 1 && !EMBED ? ' <a href="public/media/wafer/magnets-steel.webp" target="_blank" rel="noopener">The real photo.</a>' : ""}`;
  captionEl.classList.add("on");
  canvas.setAttribute("aria-label", `Wafer, a 36-key split keyboard, ${p.say}.${HELP && " " + HELP}`);
  setHeld();
  window.dispatchEvent(new CustomEvent("wafer:arrive", { detail: { place: k, id: p.id } }));
}

/* the line: a tap goes, a drag scrubs the same body with the same magnets */
const scrub = { on: false, id: -1, x0: 0, lastT: 0, lastS: 0, v: 0, quiet: 0 };
lineEl.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || performance.now() < scrub.quiet) return;   // the click a scrub's own release may fire
  wakeSound();
  go(+b.dataset.k);
});
lineEl.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  scrub.id = e.pointerId; scrub.x0 = e.clientX; scrub.on = false;
  measureLine();
});
lineEl.addEventListener("pointermove", (e) => {
  if (e.pointerId !== scrub.id) return;
  if (!scrub.on) {
    if (Math.abs(e.clientX - scrub.x0) < 5) return;
    scrub.on = true;
    lineEl.setPointerCapture(e.pointerId);
    lineEl.classList.add("scrub");
    scrub.lastT = performance.now(); scrub.lastS = track.value; scrub.v = 0;
  }
  const s = sAt(e.clientX - lineEl.getBoundingClientRect().left), now = performance.now(), dts = Math.max(0.008, (now - scrub.lastT) / 1000);
  scrub.v = scrub.v * 0.5 + ((s - scrub.lastS) / dts) * 0.5;
  scrub.lastT = now; scrub.lastS = s;
  track.hold(s);
  setPlace(Math.round(s));
  kick();
});
function endScrub(e) {
  if (e.pointerId !== scrub.id) return;
  scrub.id = -1;
  if (!scrub.on) return;
  scrub.on = false;
  scrub.quiet = performance.now() + 300;
  lineEl.classList.remove("scrub");
  track.release(performance.now() - scrub.lastT > 90 ? 0 : scrub.v);
  if (reduced) { jump(track.target); return; }
  setPlace(track.target);
  frame(track.target);
}
lineEl.addEventListener("pointerup", endScrub);
lineEl.addEventListener("pointercancel", endScrub);

/* ---------------- dimension marks ---------------- */

/* The numbers, measured off the real case and drawn the way Apple dimensions a
   device: a line just off the edge, ticks across both ends, a terse caption.
   Anchors are board-local in their place's pose. */
const marksEl = document.getElementById("marks") || mk("div");
const marks = {};   // place index → [{ a, b, label }]
const mm = (cm) => `${Math.round(cm * 10)} mm`;
function measureMarks() {
  const rc = new THREE.Raycaster(), cases = [];
  applyHalves(path.poseAt(0));
  board.updateMatrixWorld(true);
  halves[0].traverse((o) => { if (o.isMesh && o.userData.part === "case_L") cases.push(o); });
  const bb = new THREE.Box3().setFromObject(halves[0]);
  const top = (x) => {   // the case top at x, as seen edge-on: the frontmost section that has one
    for (let z = bb.max.z - 0.35; z > bb.min.z; z -= 0.5) {
      rc.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
      const hit = rc.intersectObjects(cases, false)[0];
      if (hit) return hit.point.y;
    }
    return 0;
  };
  // Profile — thinnest: the lowest case top along the front edge; tallest: the display pod
  const podX = bb.max.x - 1.2, at = (x, y) => new THREE.Vector3(x, y, bb.max.z + 0.9);
  let thin = { x: 0, y: 9 };
  for (let x = bb.min.x + 1.5; x < podX - 4; x += 0.25) { const y = top(x); if (y > 0.3 && y < thin.y) thin = { x, y }; }   // clear of the edge fillets
  // the label stands clear of the keycaps beside the thin line, not on top of the nearest one
  let keyTop = thin.y;
  halves[0].traverse((o) => {
    if (!o.isMesh || !/^key_/.test(o.userData.part || "")) return;
    const kb = new THREE.Box3().setFromObject(o);
    if (kb.min.x < thin.x + 1.8 && kb.max.x > thin.x - 1.8) keyTop = Math.max(keyTop, kb.max.y);
  });
  marks[1] = [
    { a: at(thin.x, 0), b: at(thin.x, thin.y), label: mm(thin.y), over: at(thin.x, keyTop) },
    { a: at(podX, 0), b: at(podX, bb.max.y), label: mm(bb.max.y) },
  ];
  // Pocket — the brick's thickness, across its top edge
  applyHalves(path.poseAt(5));
  board.updateMatrixWorld(true);
  const slab = halvesBox(), y = slab.max.y + 0.6, z = slab.max.z - 0.3;
  marks[5] = [{ a: new THREE.Vector3(slab.min.x, y, z), b: new THREE.Vector3(slab.max.x, y, z), label: mm(slab.max.x - slab.min.x) }];
  applyPose(path.poseAt(track.value));
  const all = Object.values(marks).flat();
  marksEl.innerHTML = all.map(() => `<g class="mark"><line class="dim"/><line class="tick"/><line class="tick"/><text/></g>`).join("")
    + `<g class="compass"><line class="in"/><text class="in"/><line class="out"/><text class="out"/></g>`;
  all.forEach((m, i) => {
    m.el = marksEl.children[i]; m.place = +Object.keys(marks).find((k) => marks[k].includes(m));
    m.el.lastElementChild.textContent = m.label;   // the numbers exist from load (hidden until their place), so a page can quote them
  });
}
let marksOn = false;
const calm = (sp, tol) => Math.abs(sp.value - sp.target) < tol && Math.abs(sp.velocity) < tol * 4;   // visually still
function to2d(v) {
  const r = canvas.getBoundingClientRect(), p = v.clone().applyAxisAngle(Y, board.rotation.y).project(camera);
  return [r.left + (p.x * 0.5 + 0.5) * r.width, r.top + (-p.y * 0.5 + 0.5) * r.height];
}
function drawMarks() {
  const still = track.resting && rock.resting && calm(cam.dist, 0.05) && calm(cam.pitch, 0.002) && calm(cam.yaw, 0.002);
  camera.updateProjectionMatrix();
  let any = false;
  for (const m of Object.values(marks).flat()) {
    const want = still && m.place === place && track.s === place;
    any = any || want;
    const [ax, ay] = to2d(m.a), [bx, by] = to2d(m.b), [dim, t1, t2, text] = m.el.children;
    const len = Math.hypot(bx - ax, by - ay) || 1, nx = (-(by - ay) / len) * 5, ny = ((bx - ax) / len) * 5;   // ticks run across the line
    m.el.style.setProperty("--len", len.toFixed(1));
    dim.setAttribute("x1", ax); dim.setAttribute("y1", ay); dim.setAttribute("x2", bx); dim.setAttribute("y2", by);
    t1.setAttribute("x1", ax - nx); t1.setAttribute("y1", ay - ny); t1.setAttribute("x2", ax + nx); t1.setAttribute("y2", ay + ny);
    t2.setAttribute("x1", bx - nx); t2.setAttribute("y1", by - ny); t2.setAttribute("x2", bx + nx); t2.setAttribute("y2", by + ny);
    // the caption sits above the line, on the stage rather than over the object
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("x", Math.abs(by - ay) > Math.abs(bx - ax) ? (ay < by ? ax : bx) : (ax + bx) / 2);
    text.setAttribute("y", Math.min(ay, by, m.over ? to2d(m.over)[1] : Infinity) - 10);
    text.textContent = m.label;
    m.el.classList.toggle("on", want);
  }
  marksOn = any;
}

/* The compass: hovering a half where a hand can fold it draws, before any
   drag, which way the fold goes and where it leads. DOM only — no frame. */
function drawCompass(h) {
  const c = marksEl.querySelector(".compass");
  if (!c) return;
  if (h < 0) { c.classList.remove("on"); return; }
  const s = track.value, ring = (t) => {
    const P = path.poseAt(t).h[h].p;
    return to2d(new THREE.Vector3(...P));
  };
  const [x, y] = ring(s), [x2, y2] = ring(Math.min(FOLD_PLACES[1], s + 0.05)), [x0, y0] = ring(Math.max(FOLD_PLACES[0], s - 0.05));
  const dir = (ax, ay) => { const l = Math.hypot(ax, ay) || 1; return [ax / l, ay / l]; };
  const set = (cls, d, k) => {
    const [line, text] = c.querySelectorAll("." + cls), on = k >= FOLD_PLACES[0] && k <= FOLD_PLACES[1] && k !== place;
    line.style.display = text.style.display = on ? "" : "none";
    if (!on) return;
    line.setAttribute("x1", x + d[0] * 14); line.setAttribute("y1", y + d[1] * 14);
    line.setAttribute("x2", x + d[0] * 64); line.setAttribute("y2", y + d[1] * 64);
    text.setAttribute("x", x + d[0] * 72); text.setAttribute("y", y + d[1] * 72 + 4);
    text.setAttribute("text-anchor", d[0] < -0.3 ? "end" : d[0] > 0.3 ? "start" : "middle");
    text.textContent = PLACES[k].label;
  };
  set("in", dir(x2 - x, y2 - y), place + 1);
  set("out", dir(x0 - x, y0 - y), place - 1);
  c.classList.add("on");
}

/* ---------------- frame pipeline ---------------- */

const FS_VERT = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";

const accQuad = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tCur: { value: null }, tPrev: { value: null }, uW: { value: 1 }, uExposure: { value: EXPOSURE }, uToe: { value: TOE } },
  vertexShader: FS_VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tCur, tPrev; uniform float uW; varying vec2 vUv;
    ${NEUTRAL_GLSL}
    void main() {
      vec3 c = max(neutral(texture2D(tCur, vUv).rgb * uExposure), 0.0);
      gl_FragColor = vec4(mix(texture2D(tPrev, vUv).rgb, c, uW), 1.0);
    }`,
  depthTest: false, depthWrite: false,
}));


const outQuad = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tAcc: { value: null }, tLive: { value: null }, uExposure: { value: EXPOSURE }, uToe: { value: TOE } },
  vertexShader: FS_VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tAcc, tLive; varying vec2 vUv;
    ${NEUTRAL_GLSL}
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec4 live = texture2D(tLive, vUv);   // the screens, drawn this frame over the converged studio
      vec3 c = mix(texture2D(tAcc, vUv).rgb, max(neutral(live.rgb * uExposure), 0.0), live.a);
      c = srgb(clamp(c, 0.0, 1.0));
      float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0);   // dither: the studio gradients never band
    }`,
  depthTest: false, depthWrite: false,
}));

const hdr = { type: THREE.HalfFloatType };
let sceneRT = null;

/* The live layer: the two screens re-drawn on their own every time their
   content changes (marquee, clock, taps, typing), over a depth pre-pass of
   the whole scene so the pods still hide them, then composited over the
   converged accumulation. A scrolling title costs two quads, not a studio. */
const LIVE = 2;
const liveRT = new THREE.WebGLRenderTarget(1, 1, hdr);
let liveDepth = false, liveDirty = false;
function renderLive() {
  camera.updateProjectionMatrix();   // un-jittered, the same every frame, so the depth test holds
  const bg = scene.background, auto = renderer.autoClear;
  scene.background = null;
  renderer.autoClear = false;
  renderer.setRenderTarget(liveRT);
  renderer.setClearColor(0x000000, 0);
  renderer.clear(true, !liveDepth, false);
  if (!liveDepth) {
    scene.overrideMaterial = depthOnly;
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    liveDepth = true;
  }
  camera.layers.set(LIVE);
  renderer.render(scene, camera);
  camera.layers.set(0);
  renderer.autoClear = auto;
  scene.background = bg;
}
function present(next, moving = false) {
  if (moving) {   // this frame's beauty pass already has the screens in it: skip the live layer
    renderer.setRenderTarget(liveRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, false, false);
  } else renderLive();
  outQuad.material.uniforms.tAcc.value = next.texture;
  outQuad.material.uniforms.tLive.value = liveRT.texture;
  renderer.setRenderTarget(null);
  outQuad.render(renderer);
  liveDirty = false;
}
const acc = [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, { ...hdr, depthBuffer: false }));
let accI = 0;

let W = 1, H = 1;
// the box the picture is drawn into: the window, or (embedded) the page's own canvas, which is
// sized by CSS — 100lvh on a desktop, 46svh on a phone — so a URL bar sliding never re-measures
const vw = () => (EMBED ? canvas.clientWidth : window.innerWidth);
const vh = () => (EMBED ? canvas.clientHeight : window.innerHeight);
let lastBox = "";
function resize() {
  const w = vw(), h = vh();
  if (EMBED) {
    if (!path || !w || !h || lastBox === `${w}x${h}`) return;   // before the model is built the boot-time resize() does it all
    lastBox = `${w}x${h}`;
    measured.clear();   // inset px do not survive a resize: the page re-sends them
    for (const k of ["l", "t", "r", "b"]) { INSET[k].snap(INSET[k].target); SAFE[k] = INSET[k].target; }
  }
  // retina up to ~6 MP (a MacBook Air at 2× fits); a 4K wall stops there
  const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(6e6 / (w * h)));
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  W = Math.round(w * dpr); H = Math.round(h * dpr);
  // ponytail: MSAA only while it fits a sane memory budget; at retina sizes
  // the accumulated jitter does the antialiasing once the view settles.
  const samples = W * H <= 2.6e6 ? 4 : 2;
  if (!sceneRT || sceneRT.samples !== samples) {
    if (sceneRT) sceneRT.dispose();
    sceneRT = new THREE.WebGLRenderTarget(W, H, { ...hdr, samples });
  } else sceneRT.setSize(W, H);
  acc.forEach((rt) => rt.setSize(W, H));
  liveRT.setSize(W, H);
  liveDepth = false;
  // the study: the caption and the line own a band along the bottom, so the picture sits higher
  if (!EMBED) SAFE.b = Math.min(h * 0.3, w <= 900 ? 170 : 150);
  applyView();
  if (path) {
    const was = view().dist;
    measureViews();
    if (Math.abs(cam.dist.target - was) < 1e-3) cam.dist.snap(view().dist);   // still framed: stay framed
    measureLine();
    drawHead();
  }
  invalidate();
}

const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

function renderSample(i) {
  camera.updateProjectionMatrix();
  if (i > 0) {
    const e = camera.projectionMatrix.elements;
    e[8] += ((halton(i, 2) - 0.5) * 2) / W;
    e[9] += ((halton(i, 3) - 0.5) * 2) / H;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  // the key light and its ±22 cm shadow frustum follow the subject, from the desk to the fridge door
  const a = halton(i, 5) * Math.PI * 2, r = i > 0 ? Math.sqrt(halton(i, 7)) * SUN_SOFT * SUN_DIST : 0;
  const subject = camTarget().applyAxisAngle(Y, cam.yaw.value);
  sun.position.copy(SUN_DIR).multiplyScalar(SUN_DIST).add(subject)
    .addScaledVector(SUN_T1, Math.cos(a) * r).addScaledVector(SUN_T2, Math.sin(a) * r);
  sun.target.position.copy(subject);
  sun.updateMatrixWorld(); sun.target.updateMatrixWorld();
  HF.halves.forEach((hf, h) => { if (hf.dirty) renderHeight(h); });
  renderer.shadowMap.needsUpdate = true;
  board.updateMatrixWorld();
  halves.forEach((half, h) => HF.u.uHalfInv.value[h].copy(half.matrixWorld).invert());
  HF.u.uHSpin.value = halton(i, 3) * Math.PI * 2;

  renderer.setRenderTarget(sceneRT);
  renderer.render(scene, camera);

  const prev = acc[accI], next = acc[accI ^ 1];
  accI ^= 1;
  accQuad.material.uniforms.tCur.value = sceneRT.texture;
  accQuad.material.uniforms.tPrev.value = prev.texture;
  // a reduced-motion dissolve is an exponential fade; afterwards the average resumes as if 8 frames in
  accQuad.material.uniforms.uW.value = dissolve > 0 ? 0.12 : 1 / (i + 1);
  if (dissolve > 0 && --dissolve === 0) sample = 8;
  renderer.setRenderTarget(next);
  accQuad.render(renderer);

  present(next, i === 0);
}

/* ---------------- view ---------------- */

const P_MIN = THREE.MathUtils.degToRad(4), P_MAX = THREE.MathUtils.degToRad(84);
const pitchRange = () => [PLACES[place].view.pitchMin ?? P_MIN, PLACES[place].view.pitchMax ?? P_MAX];
// a rubber band never travels further than its dimension: the headroom to the floor and to straight overhead
const P_GIVE = { lo: THREE.MathUtils.degToRad(3.4), hi: THREE.MathUtils.degToRad(5.7) };
const HOME = { yaw: -0.2, pitch: THREE.MathUtils.degToRad(30), dist: 90, target: new THREE.Vector3(0, 0.4, 0) };   // before the model has been measured
/* The camera rides on springs (damping ratio + response, per the apple-design
   skill): a long move starts gently, anything can be grabbed mid-flight, and
   a flick hands its velocity straight to the spring. Target is board-local,
   so it turns with the board. */
const CAM = { damping: 1, response: 0.42 };
const cam = {
  yaw: new Spring(HOME.yaw, CAM), pitch: new Spring(HOME.pitch, CAM), dist: new Spring(HOME.dist, CAM),
  tx: new Spring(HOME.target.x, CAM), ty: new Spring(HOME.target.y, CAM), tz: new Spring(HOME.target.z, CAM),
};
const camTarget = () => new THREE.Vector3(cam.tx.value, cam.ty.value, cam.tz.value);
function aim(t, opts) { cam.tx.to(t.x, opts); cam.ty.to(t.y, opts); cam.tz.to(t.z, opts); }
/* jump straight to a view (tuning, reduced motion) */
function look(yaw, pitch, dist, t) {
  cam.yaw.snap(yaw); cam.pitch.snap(pitch); cam.dist.snap(dist);
  cam.tx.snap(t.x); cam.ty.snap(t.y); cam.tz.snap(t.z);
  invalidate();
}
const Y = new THREE.Vector3(0, 1, 0);

function placeCamera(yaw, pitch, dist, target) {
  const t = target.clone().applyAxisAngle(Y, yaw);
  camera.position.set(t.x, t.y + Math.sin(pitch) * dist, t.z + Math.cos(pitch) * dist);
  camera.lookAt(t);
  camera.updateMatrixWorld();
}

/* Board-local box of the two halves (or of the two screens) as they stand right now. */
function boardBox(list) {
  const yaw = board.rotation.y;
  board.rotation.y = 0;
  board.updateMatrixWorld(true);
  const bb = new THREE.Box3();
  for (const o of list) bb.union(new THREE.Box3().setFromObject(o));
  board.rotation.y = yaw;
  board.updateMatrixWorld(true);
  return bb;
}
const halvesBox = () => boardBox(halves);
const screensBox = () => boardBox(screenMeshes);
/* What a view fits into the frame: both halves, the two screens, or (an embedding page's close-up) the screens
   stretched back to the halves' far edge, so the pods above them stay inside the frame too. */
function frameBox(v) {
  if (v.box === "screens+top") {
    const b = screensBox(), h = halvesBox();
    b.min.z = Math.min(b.min.z, h.min.z);
    b.max.y = Math.max(b.max.y, h.max.y);
    return b;
  }
  return v.box === "screens" ? screensBox() : v.box === "left" ? boardBox([halves[0]]) : halvesBox();
}

/* Camera distance at which `box` (board-local) fills `fill` of the frame above
   the chrome's band, seen at (yaw, pitch) around `target`. */
const SAFE = {   // px of the box that chrome or copy owns, as drawn right now; the picture lives in what is left
  l: EMBED?.inset?.left ?? 0, t: EMBED?.inset?.top ?? 0, r: EMBED?.inset?.right ?? 0, b: EMBED?.inset?.bottom ?? 0,
};
const INSET_SPRING = { damping: 1, response: 0.62 };   // the camera's own: layout and pose are one motion
const INSET = Object.fromEntries(Object.entries(SAFE).map(([k, v]) => [k, new Spring(v, INSET_SPRING)]));
/* The picture is the usable rectangle of a larger virtual frame: centre the frame on that
   rectangle and make it big enough to hold the whole window, then show the window as a sub-view. */
function applyView() {
  const w = vw(), h = vh(), cx = (w + SAFE.l - SAFE.r) / 2, cy = (h + SAFE.t - SAFE.b) / 2;
  const FW = 2 * Math.max(cx, w - cx), FH = 2 * Math.max(cy, h - cy);
  camera.aspect = FW / FH;
  camera.setViewOffset(FW, FH, FW / 2 - cx, FH / 2 - cy, w, h);
  camera.updateProjectionMatrix();
}
const measured = new Map();   // inset key → the views measured with it: a layout is measured once

/* Move the usable rectangle (px, missing keys unchanged). The caller then calls go(k). */
function setInset(next = {}, { snap = false, to = place } = {}) {   // to: the place the caller goes to next, so layout and camera share one timing
  const T = { l: INSET.l.target, t: INSET.t.target, r: INSET.r.target, b: INSET.b.target };
  if (next.left != null) T.l = next.left;
  if (next.top != null) T.t = next.top;
  if (next.right != null) T.r = next.right;
  if (next.bottom != null) T.b = next.bottom;
  for (const k in T) T[k] = Math.round(T[k]);
  const key = `${T.l},${T.t},${T.r},${T.b}`;
  let hit = measured.get(key);
  if (!hit && path) {
    const keep = { ...SAFE };
    Object.assign(SAFE, T);
    applyView();
    measureViews();
    hit = views.map((v) => ({ target: v.target.clone(), dist: v.dist }));
    measured.set(key, hit);
    Object.assign(SAFE, keep);
    applyView();
  }
  if (hit) hit.forEach((v, i) => { views[i] = { target: v.target.clone(), dist: v.dist }; });
  if (snap || reduced) {
    for (const k in T) INSET[k].snap(T[k]);
    Object.assign(SAFE, T);
    applyView();
  } else {
    const opts = to <= 2 && place <= 2 ? CAM_LOOK : CAM_STATE;   // frame()'s own rule
    for (const k in T) INSET[k].to(T[k], opts);
  }
  frame(place, snap || reduced);
  kick();
}
function frameDistance(box, yaw, pitch, target, fill = 0.84) {
  if (box.isEmpty()) return HOME.dist;
  const corners = [];
  for (let k = 0; k < 8; k++) corners.push(new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).applyAxisAngle(Y, yaw));
  let d = 80;
  for (let it = 0; it < 5; it++) {
    placeCamera(yaw, pitch, d, target);
    camera.updateProjectionMatrix();
    let m = 0;
    const w = vw(), h = vh();   // the usable rectangle in the window's NDC: centre and half-size
    const xc = (SAFE.l - SAFE.r) / w, hx = 1 - (SAFE.l + SAFE.r) / w, yc = (SAFE.b - SAFE.t) / h, hy = 1 - (SAFE.b + SAFE.t) / h;
    for (const c of corners) { const p = c.clone().project(camera); m = Math.max(m, Math.abs(p.x - xc) / hx, Math.abs(p.y - yc) / hy); }
    d *= m / fill;
  }
  return d;
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function step(dt) {
  let moved = drag.dirty;
  drag.dirty = false;
  for (const s of Object.values(cam)) if (s.step(dt)) moved = true;
  let inset = false;
  for (const k in INSET) if (INSET[k].step(dt)) inset = true;
  if (inset) {   // layout glides with the pose: same spring as the camera
    for (const k in INSET) SAFE[k] = INSET[k].value;
    applyView();
    moved = true;
  }

  for (const k of keys) {
    const target = k.src.size ? 1 : 0;
    if (k.p === target && k.v === 0) continue;
    // stiff scissor spring with a hard bottom-out, integrated in 2 ms steps
    for (let t = 0; t < dt; t += 0.002) {
      const h = Math.min(0.002, dt - t);
      k.v += ((target - k.p) * 5200 - k.v * (target ? 120 : 95)) * h;
      k.p += k.v * h;
      if (k.p > 1) { k.p = 1; k.v = 0; }
    }
    if (Math.abs(k.p - target) < 1e-4 && Math.abs(k.v) < 1e-3) { k.p = target; k.v = 0; }
    for (const m of k.meshes) m.position.y = -k.p * TRAVEL;
    SWITCH.u.uPress.value[k.index] = k.p;
    if (HF.halves[k.half]) HF.halves[k.half].dirty = true;
    moved = true;
  }
  if (stepStates(dt)) moved = true;
  if (stepRingViz(dt)) moved = true;
  if (ringHold && ringHold.step(dt)) { ringK = ringHold.value; ringLevel(ringV); moved = true; }
  board.rotation.y = cam.yaw.value;
  placeCamera(cam.yaw.value, cam.pitch.value, cam.dist.value, camTarget());
  return moved;
}

/* ---------------- loop ---------------- */

let raf = 0, sample = 0, last = performance.now(), shown = false;
function kick() { if (!raf && sceneRT) raf = requestAnimationFrame(tick); }   // nothing to draw into before the first resize
function invalidate() { sample = 0; kick(); }
function tick(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (step(dt)) sample = 0;
  if (marksOn || marks[place]) drawMarks();
  if (dissolve > 0 && sample >= SAMPLES) sample = 1;   // keep drawing until the fade is through
  if (sample < SAMPLES) {
    if (sample === 0) liveDepth = false;
    renderSample(sample++);
    if (!shown && sample >= 6) { shown = true; canvas.classList.add("is-ready"); canvas.dispatchEvent(new Event("wafer:shown")); }
    kick();
  } else if (liveDirty) present(acc[accI]);
}

/* ---------------- input ---------------- */

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function ray(x, y) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  camera.updateProjectionMatrix();
  board.updateMatrixWorld();   // pick against the pose as it is now, not as the last frame drew it
  raycaster.setFromCamera(ndc, camera);
  return raycaster;
}
const pickScreen = (x, y) => (ray(x, y).intersectObjects(screenMeshes, false)[0] || {}).object?.userData.screen || null;
const pickKey = (x, y) => (ray(x, y).intersectObjects(keyMeshes, false)[0] || {}).object?.userData.key || null;
function pickPoint(x, y) {
  const hit = ray(x, y).intersectObjects(pickables, false)[0];
  if (hit) return hit.point;
  const p = new THREE.Vector3();
  return raycaster.ray.intersectPlane(new THREE.Plane(Y, -view().target.y), p) ? p : null;
}

function zoomAt(x, y, f) {
  if (EMBED) return;   // the wheel scrolls the page and a pinch is the browser's own
  const V = view(), d = cam.dist.target, nd = THREE.MathUtils.clamp(d * f, V.dist * 0.24, V.dist * 1.7);
  const t = new THREE.Vector3(cam.tx.target, cam.ty.target, cam.tz.target);
  if (nd < d) {
    const p = pickPoint(x, y);
    if (p) t.lerp(p.applyAxisAngle(Y, -cam.yaw.value), 1 - nd / d);   // board-local, so it turns with the board
  } else if (d < V.dist) {
    t.lerp(V.target, Math.min(1, (nd - d) / (V.dist - d)));
  }
  const zoom = { damping: 1, response: 0.22 };   // a wheel notch should feel immediate
  cam.dist.to(nd, zoom);
  aim(t, zoom);
  kick();
}

const drag = { on: false, dirty: false, lastT: 0, yawV: 0, pitch: 0, yaw: 0 };
const pointers = new Map();
let pinch = 0;

/* A hand on a half, where the fold is: the drag moves the track itself, 1:1
   along the grabbed half's own path on screen, and the magnets act on it as
   on anything else — they can take it out of the hand. */
const grip = { on: false, h: -1, hand: 0, lastT: 0, v: 0 };
const canFold = () => place >= FOLD_PLACES[0] && place <= FOLD_PLACES[1] && !scrub.on;
function pickHalf(x, y) {
  let o = (ray(x, y).intersectObjects(pickables, false)[0] || {}).object;
  while (o && !halves.includes(o)) o = o.parent;
  return o ? halves.indexOf(o) : -1;
}
const ringOnScreen = (h, s) => to2d(new THREE.Vector3(...path.poseAt(s).h[h].p));
function startGrip(h) {
  Object.assign(grip, { on: true, h, hand: track.value, lastT: performance.now(), v: 0 });
  canvas.classList.add("is-gripping");
  if (ringHold) ringHold.to(1);   // a hand on a half: the field is the thing it feels
  track.hold(grip.hand);
}
function moveGrip(dx, dy) {
  const [lo, hi] = FOLD_PLACES, s = THREE.MathUtils.clamp(track.value, lo + 0.025, hi - 0.025);
  const a = ringOnScreen(grip.h, s - 0.025), b = ringOnScreen(grip.h, s + 0.025);
  const vx = (b[0] - a[0]) / 0.05, vy = (b[1] - a[1]) / 0.05, l2 = vx * vx + vy * vy;   // px per place, along the fold
  const ds = l2 > 400 ? (dx * vx + dy * vy) / l2 : 0;                                 // edge-on: the fold can't be read, so it can't be pulled
  const now = performance.now(), dts = Math.max(0.008, (now - grip.lastT) / 1000);
  grip.lastT = now;
  grip.hand = THREE.MathUtils.clamp(grip.hand + ds, lo - 0.3, hi + 0.3);
  grip.v = grip.v * 0.5 + (ds / dts) * 0.5;
  track.hold(THREE.MathUtils.clamp(grip.hand, lo, hi));   // past either end of the fold the hand just slips
  setPlace(Math.round(track.value));
  drawCompass(grip.h);
  kick();
}
function endGrip(v) {
  grip.on = false;
  canvas.classList.remove("is-gripping");
  drawCompass(-1);
  track.release(v ?? (performance.now() - grip.lastT > 90 ? 0 : grip.v), FOLD_PLACES[0], FOLD_PLACES[1]);
  if (reduced) { jump(track.target); return; }
  setPlace(track.target);
  frame(track.target);
}

function hover(e) {
  const h = canFold() ? pickHalf(e.clientX, e.clientY) : -1;
  canvas.classList.toggle("is-grip", h >= 0);
  canvas.classList.toggle("is-key", h < 0 && !!(pickScreen(e.clientX, e.clientY) || pickKey(e.clientX, e.clientY)));
  drawCompass(h);
}

canvas.addEventListener("pointerdown", (e) => {
  wakeSound();
  canvas.setPointerCapture(e.pointerId);
  // embedded, a finger on a key only types on lift: the page scrolls under vertical swipes, so a swipe must not press
  const p = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, key: null, half: -1, late: !!EMBED && e.pointerType === "touch" };
  pointers.set(e.pointerId, p);
  if (!p.late) { cam.yaw.snap(cam.yaw.value); cam.pitch.snap(cam.pitch.value); }   // grab: the motion stops under the finger (a touch grabs once it turns the view)
  drag.yawV = 0; drag.pitch = cam.pitch.value; drag.yaw = cam.yaw.value;
  if (pointers.size === 1) {
    p.screen = pickScreen(e.clientX, e.clientY);
    p.key = p.screen ? null : pickKey(e.clientX, e.clientY);
    if (canFold()) p.half = pickHalf(e.clientX, e.clientY);
    if (p.key && !p.late) press(p.key, "pointer:" + e.pointerId, true);
    drag.on = !p.late && !p.key && !p.screen && p.half < 0;
  } else {
    for (const [id, q] of pointers) if (q.key) { if (!q.late) release(q.key, "pointer:" + id); q.key = null; }
    if (grip.on) endGrip(0);   // a second finger is a pinch, never a fold
    const [a, b] = [...pointers.values()];
    pinch = Math.hypot(a.x - b.x, a.y - b.y);
    drag.on = false;
  }
  canvas.classList.toggle("is-dragging", drag.on);
});

canvas.addEventListener("pointermove", (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) { hover(e); return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch > 0 && d > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch / d);
    pinch = d;
    return;
  }
  if (!drag.on && !grip.on && Math.hypot(p.x - p.x0, p.y - p.y0) > 6) {   // a press that turns into a drag is a drag
    if (p.late && Math.abs(p.y - p.y0) >= Math.abs(p.x - p.x0)) return;   // embedded touch, vertical: the page scrolls, nothing is grabbed
    if (p.key && !p.late) release(p.key, "pointer:" + e.pointerId);
    // sideways on a half where the fold is: the hand takes the half; anything else turns the view
    if (p.half >= 0 && Math.abs(p.x - p.x0) > Math.abs(p.y - p.y0)) startGrip(p.half);
    else {
      if (p.late) { cam.yaw.snap(cam.yaw.value); cam.pitch.snap(cam.pitch.value); drag.yaw = cam.yaw.value; drag.pitch = cam.pitch.value; drag.yawV = 0; }
      drag.on = true; canvas.classList.add("is-dragging"); drawCompass(-1);
    }
    p.key = p.screen = null;
  }
  if (grip.on) { moveGrip(dx, dy); return; }
  if (!drag.on) return;
  const now = performance.now(), dts = Math.max(0.008, (now - drag.lastT) / 1000);
  drag.lastT = now;
  // yaw tracks 1:1; where a place has a back that is not worth seeing (a wall), it rubber-bands
  drag.yaw += dx * 0.0065;
  let yaw = drag.yaw;
  const v = PLACES[place].view;
  if (v.yawLimit != null) {
    const rel = wrap(drag.yaw - v.yaw), c = THREE.MathUtils.clamp(rel, -v.yawLimit, v.yawLimit);
    yaw = v.yaw + c + rubberband(rel - c, 0.35);
  }
  drag.yawV = drag.yawV * 0.5 + ((yaw - cam.yaw.value) / dts) * 0.5;
  cam.yaw.snap(yaw);
  // pitch tracks 1:1 and rubber-bands past its limits instead of stopping dead
  drag.pitch += dy * 0.0042;
  const [lo, hi] = pitchRange(), lim = THREE.MathUtils.clamp(drag.pitch, lo, hi);
  cam.pitch.snap(lim + rubberband(drag.pitch - lim, drag.pitch > lim ? P_GIVE.hi : P_GIVE.lo));
  drag.dirty = true;
  kick();
});

function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  if (p.key && !p.late) release(p.key, "pointer:" + e.pointerId);
  else if (p.key && e.type === "pointerup" && Math.hypot(p.x - p.x0, p.y - p.y0) < 8) {   // a tap: down and up in one beat
    const k = p.key, src = "tap:" + e.pointerId;
    press(k, src, true);
    setTimeout(() => release(k, src), 90);
  }
  if (p.screen && e.type === "pointerup") tapScreen(p.screen);
  pointers.delete(e.pointerId);
  if (grip.on) endGrip(e.type === "pointercancel" ? 0 : undefined);
  if (drag.on) {
    // hand the flick to the spring: rest where the momentum projects, at the finger's velocity
    const v = reduced || performance.now() - drag.lastT > 90 ? 0 : drag.yawV;   // held still before letting go: no flick
    const view = PLACES[place].view;
    let to = cam.yaw.value + project(v, 0.996);
    if (view.yawLimit != null) to = view.yaw + THREE.MathUtils.clamp(wrap(to - view.yaw), -view.yawLimit, view.yawLimit);
    cam.yaw.velocity = v;
    cam.yaw.to(to, { damping: 1, response: 0.6 });
    cam.pitch.to(THREE.MathUtils.clamp(cam.pitch.value, ...pitchRange()), CAM);   // a rubber-banded pitch springs home
  }
  drag.on = false;
  pinch = 0;
  canvas.classList.remove("is-dragging");
  kick();
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", () => { if (!grip.on) drawCompass(-1); });
if (!EMBED) canvas.addEventListener("wheel", (e) => {   // embedded, the wheel belongs to the page
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016)));
}, { passive: false });
canvas.addEventListener("dblclick", () => frame(place));   // re-frame where you are; Esc goes home

/* ---------------- keys + screens ---------------- */

let layer = 0, typed = null, typedTimer = 0;

/* Sound: the portfolio's Wafer engine (demo/wafer-sound.js). Browsers only
   allow audio after a gesture, so it starts on the first real press; the
   mute choice is remembered under the same key the Wafer page uses. */
let sound = EMBED ? null : window.makeWaferDemoSound ? window.makeWaferDemoSound() : null;   // embedded: the page loads the audio scripts on the first toggle
// embedded, sound is opt-in and never remembered: it starts off, and the page's own toggle is the first gesture
let soundOn = EMBED ? false : (() => { try { return localStorage.getItem("mo_demo_sound") !== "0"; } catch (_) { return true; } })();
let soundStarted = false;
function wakeSound() {
  if (EMBED && !sound && window.makeWaferDemoSound) sound = window.makeWaferDemoSound();
  if (!sound || soundStarted) return;
  soundStarted = true;
  sound.setMuted(!soundOn);
  sound.start();
}
function setSound(on) {
  soundOn = on;
  if (!EMBED) try { localStorage.setItem("mo_demo_sound", on ? "1" : "0"); } catch (_) {}
  if (sound && soundStarted) sound.setMuted(!on);
  soundEl.setAttribute("aria-pressed", String(on));
  drawStatus();   // the left panel's volume is the page's own
}
const soundEl = document.getElementById("sound") || mk("button");
soundEl.hidden = !sound && !EMBED;
soundEl.setAttribute("aria-pressed", String(soundOn));
soundEl.addEventListener("click", () => { wakeSound(); setSound(!soundOn); });
const isThumb = (k) => /_t\d$/.test(k.id);
let designs = null;   // the SVG panels, once loaded

/* What the two panels show. Everything here lands on the live layer only —
   the studio render never restarts for a screen. */
const panel = {
  profile: 0,                                   // active Bluetooth slot (three paired, as designed)
  playing: true, title: EMBED ? "Patience" : "Bohemian Rhapsody", artist: EMBED ? "LOW ROAR" : "Queen", since: performance.now(), scroll: -1,   // embedded: the photographed track
};
const clock = () => { const t = new Date(); return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`; };
function liveKick() { liveDirty = true; kick(); }
function drawStatus() {
  if (!designs) return;
  drawConnected(screens.status, designs.connected, { time: clock(), layer: LAYER_NAMES[layer], profile: panel.profile, volume: soundOn ? "99%" : "0%" });
  liveKick();
}
/* The right panel plays music as designed, or narrates the place in the same
   slots; on the fridge it shows the real photograph, dithered to its own 1 bit. */
let photo = null;
const narration = () => (typed == null && narrated >= 0 ? PLACES[narrated].screen : null);
function drawMedia() {
  if (!designs) return;
  const flip = flipped(), say = narration();
  if (say && photo && narrated === N - 1 && track.locked === N - 1) drawPeripheral(screens.media, designs.peripheral, { photo, flip });
  else drawPeripheral(screens.media, designs.peripheral, { ...panel, typed, flip, ...(say ? { ...say, scroll: 0 } : {}) });
  liveKick();
}

/* The marquee advances in whole panel pixels, like the real one: a redraw
   only when the integer offset moves, and only while the title is playing,
   nobody is typing, the panel faces the camera and the tab is in view —
   otherwise nothing wakes the renderer. */
const faceN = new THREE.Vector3(), faceQ = new THREE.Quaternion(), faceP = new THREE.Vector3();
function facing() {
  const m = screenMeshes.find((o) => o.userData.screen === screens.media);
  if (!m) return false;
  m.getWorldQuaternion(faceQ); m.getWorldPosition(faceP);
  return faceN.set(0, 1, 0).applyQuaternion(faceQ).dot(camera.position.clone().sub(faceP).normalize()) > 0.25;
}
setInterval(() => {
  if (!designs || typed != null || !panel.playing || document.hidden || narration() || !facing()) return;
  const x = marquee(panel.title, (performance.now() - panel.since) / 1000);
  if (x !== panel.scroll) { panel.scroll = x; drawMedia(); }
}, 1000 / 30);

/* Tapping a screen does what it would on the device: the left one steps
   through the paired profiles, the right one plays and pauses. */
function tapScreen(screen) {
  if (screen === screens.status) { panel.profile = (panel.profile + 1) % 3; drawStatus(); }
  else {
    panel.playing = !panel.playing;
    panel.since = performance.now();
    panel.scroll = 0;
    drawMedia();
  }
}

function press(k, src, typeIt) {
  const was = k.src.size;
  k.src.add(src);
  if (was) return;
  wakeSound();
  if (sound) sound.thock({ deep: isThumb(k), intensity: 1 });
  if (k.layer) setLayer(k.layer);
  else if (typeIt && k.ch) type(k.ch);
  kick();
}
function release(k, src) {
  k.src.delete(src);
  if (k.src.size) return;
  if (sound) sound.keyRelease(isThumb(k));
  if (k.layer && layer === k.layer) setLayer(0);
  kick();
}
function setLayer(l) {
  layer = l;
  drawStatus();
}
function type(ch) {
  typed = typed || "";
  if (ch === "\b") typed = typed.slice(0, -1);
  else typed = (typed + ch).slice(-240);
  drawMedia();
  clearTimeout(typedTimer);
  typedTimer = setTimeout(() => { typed = null; panel.since = performance.now(); drawMedia(); }, 8000);
}

const ownKeys = (e) => !(e.target instanceof Element && e.target.closest("button, a, input, select, textarea, [role=slider], [data-ui]"))
  && (!EMBED || document.activeElement === canvas);   // embedded, typing is armed by focus: Space and PageDown still scroll the page
/* Places from the keyboard: arrows step, 1–8 jump, Home/End, Esc goes home.
   Wafer has no arrows or number row, so none of these is one of its keys. */
function navKey(e) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.repeat && /^Digit|^Home|^End|^Escape/.test(e.code)) return false;
  const k = e.code === "ArrowRight" ? track.target + 1 : e.code === "ArrowLeft" ? track.target - 1
    : e.code === "Home" ? 0 : e.code === "End" ? N - 1 : e.code === "Escape" ? 0
    : /^Digit[1-8]$/.test(e.code) ? +e.code.slice(5) - 1 : null;
  if (k == null || !path) return false;
  e.preventDefault();
  go(k);
  if (lineEl.contains(document.activeElement)) lineEl.querySelectorAll("button")[place].focus();
  return true;
}
/* Embedded: only a focused canvas takes keys. Esc lets go, the arrows turn the object; Home, End,
   the digits and everything else belong to the page. */
function embedKey(e) {
  if (document.activeElement !== canvas || e.altKey || e.ctrlKey || e.metaKey) return false;
  if (e.code === "Escape") { canvas.blur(); return true; }
  if (e.code === "Home") { e.preventDefault(); frame(place); return true; }   // back to the place's own view
  const dir = e.code === "ArrowRight" ? 1 : e.code === "ArrowLeft" ? -1 : 0;
  if (!dir) return false;
  e.preventDefault();
  turn(dir);
  return true;
}
/* Turn the object 12° either way: the arrow keys' step and the page's own buttons'. */
function turn(dir) {
  const v = PLACES[place].view;
  let to = cam.yaw.target + dir * THREE.MathUtils.degToRad(12);
  if (v.yawLimit != null) to = v.yaw + THREE.MathUtils.clamp(wrap(to - v.yaw), -v.yawLimit, v.yawLimit);   // as the drag path does
  cam.yaw.to(to, CAM);
  kick();
}
window.addEventListener("keydown", (e) => {
  if (EMBED ? embedKey(e) : navKey(e)) return;
  if (!ownKeys(e)) return;   // page controls keep Space and Enter
  if (e.code === "MediaPlayPause" && designs) { tapScreen(screens.media); return; }
  const k = codeMap[e.code];
  if (!k || ((e.metaKey || e.ctrlKey) && !/^(Meta|Control)/.test(e.code))) return;   // leave browser shortcuts alone
  e.preventDefault();
  if (e.repeat) return;
  press(k, "kb:" + e.code, false);
  if (k.layer) return;
  if (e.key.length === 1) type(e.key);
  else if (e.code === "Backspace") type("\b");
  else if (e.code === "Enter") type("\n");
});
window.addEventListener("keyup", (e) => { const k = codeMap[e.code]; if (k) release(k, "kb:" + e.code); });   // releasing is always safe
window.addEventListener("blur", () => { for (const k of keys) { k.src.clear(); } setLayer(0); });

/* the clock on the status panel turns over with the real minute */
function tickClock() {
  drawStatus();
  setTimeout(tickClock, 60000 - (Date.now() % 60000) + 50);
}

/* ---------------- boot ---------------- */

window.addEventListener("resize", resize);
await Promise.all([load(), loadScreens().then((d) => { designs = d; })].map((p) => p.catch((e) => console.warn("[wafer]", e))));
buildLine();
track.snap(0);
setPlace(0);
resize();
frame(0, true);
step(0);
drawHead();
arrive(0);
drawMedia();
tickClock();
// the fridge's receipt: the real photograph, as the panel would show it (a full-height strip with both halves)
// embedded: only the door above the sign (y 0–900), cut to the panel's own aspect around the halves; the study shows the full strip
ditherPhoto("public/media/wafer/magnets-steel.webp", EMBED ? [372, 0, 382, 900] : [244, 0, 637, 1500]).then((bits) => {
  photo = bits;
  drawMedia();   // a deep link or a reload lands on the fridge before the photograph is in
  window.dispatchEvent(new CustomEvent("wafer:photo", { detail: { bits } }));
}, (e) => console.warn("[wafer] photo", e));
// the props' programs compile while nobody is looking, so the first trip does not hitch
if (renderer.compileAsync) {
  const all = [...props.stands, props.wall, props.fridge];
  all.forEach((g) => { g.visible = true; });
  renderer.compileAsync(scene, camera).catch(() => {}).finally(() => { applyPose(path.poseAt(track.value)); invalidate(); });
}

// console handle for tuning materials and light live: wafer.MAT.alu.roughness = 0.45; wafer.invalidate()
window.wafer = { go, jump, setInset, turn, Spring, tapScreen, drawMedia, drawStatus, SAFE, INSET, PLACES, screens, get place() { return place; }, track, get path() { return path; }, views, get sound() { return sound; }, setSound, THREE, renderer, scene, camera, board, halves, RING, MAT, PROP_MAT, props, look, cam, ringLevel, ringBloom, STAGE, sun, HF, panel, invalidate };
window.dispatchEvent(new Event("wafer:ready"));
