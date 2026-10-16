/* ============================================================
   WAFER — MEMORY-IN-PIXEL SCREENS
   ------------------------------------------------------------
   The two nice!view-class panels (68 × 160, 1-bit, reflective),
   live, with assets/Connected.svg (left, central half) and
   assets/Peripheral.svg (right, peripheral) as the pixel-exact
   reference.

   · Static art (battery, Bluetooth, globe, speaker, labels) is
     the designer's own SVG, rasterised.
   · Every value that changes is set live in Montserrat — LVGL's
     built-in face — at a weight, size and sub-pixel offset fitted
     against the SVG's outlined paths by a brute-force search
     (residual: 2–20 px per element, hinting noise).
   · Pixel widgets — the profile squares, the play glyph — are
     cut out of the designer's own bitmap and blitted, so they
     are exact by construction.
   · The title is a circular marquee clipped to its column, like
     an LVGL LONG_SCROLL_CIRCULAR label.
   Everything lands on true 1-bit in the designs' own polarity:
   #0C0C0C pixels off, #A3A3A3 pixels on.
   ============================================================ */

export const MIP_W = 68, MIP_H = 160;
const OFF = [12, 12, 12], ON = [163, 163, 163];
const SS = 4;          // vectors are rasterised at 4× before the 1-bit decision
const COVER = 0.3;     // share of a panel pixel that must be lit: thin strokes survive, like hinted LVGL glyphs
const FONT = "Montserrat, ui-sans-serif, system-ui, sans-serif";

/* Fitted against the SVGs (calibration harness, Oct 2026). x/y are panel px;
   rotated fields are in the right panel's quarter-turned frame: x runs down
   the column, y across it from the right-hand edge. */
const FIT = {
  time:    { weight: 500, size: 20,    x: 3.9,   y: 48.95 },
  layer:   { weight: 500, size: 14,    x: 3.9,   y: 155 },
  lang:    { weight: 500, size: 14,    x: 20,    y: 70 },
  volume:  { weight: 500, size: 14.25, x: 19.75, y: 88.25 },
  playing: { weight: 500, size: 10,    x: 38,    y: 12.25 },
  title:   { weight: 500, size: 16,    x: 28,    y: 47 },
  artist:  { weight: 400, size: 10,    x: 28.05, y: 63.1 },
};
const TITLE_CLIP = { x0: 27.5, x1: MIP_H, y0: 33, y1: 52 };   // the title's own column
const MARQUEE = { speed: 22, gap: 26, hold: 1.4 };            // px/s · px between loops · s at rest
const PROFILE = { x: 4, y: 113, pitch: 12, size: 10 };        // five 10 px squares on a 12 px pitch

/* ---------------- loading ---------------- */

async function svgImage(node) {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(node)], { type: "image/svg+xml" }));
  await img.decode();
  return img;
}

/* The design, rasterised whole and with its live elements removed. Elements
   are classified by bounding-box centre measured in a hidden live <svg>, so
   the slots survive edits to the artwork. */
async function loadDesign(url, isLive) {
  const svg = new DOMParser().parseFromString(await (await fetch(url)).text(), "image/svg+xml").documentElement;
  const host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none";
  const live = document.importNode(svg, true);
  host.appendChild(live);
  document.body.appendChild(host);
  const SHAPES = "path, rect, circle, ellipse, polygon, line";
  const doomed = [...live.querySelectorAll(SHAPES)].filter((el) => !el.closest("defs")).map((el) => {
    const b = el.getBBox();
    if (b.width * b.height > MIP_W * MIP_H * 0.5) return false;   // the panel background stays
    return isLive({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
  });
  host.remove();
  const stripped = svg.cloneNode(true);
  [...stripped.querySelectorAll(SHAPES)].filter((el) => !el.closest("defs")).forEach((el, i) => { if (doomed[i]) el.remove(); });
  const [full, art] = await Promise.all([svgImage(svg), svgImage(stripped)]);
  return { full: rasterise(full), art };
}

/* ---------------- raster core ---------------- */

const work = document.createElement("canvas");
work.width = MIP_W * SS; work.height = MIP_H * SS;
const wctx = work.getContext("2d", { willReadFrequently: true });

function begin(image) {
  wctx.setTransform(SS, 0, 0, SS, 0, 0);   // draw in panel pixels
  wctx.fillStyle = "#0C0C0C";
  wctx.fillRect(0, 0, MIP_W, MIP_H);
  if (image) wctx.drawImage(image, 0, 0, MIP_W, MIP_H);
  wctx.fillStyle = "#A3A3A3";
  wctx.textBaseline = "alphabetic";
}

/* Box-filter the 4× drawing to panel pixels; a pixel is on when its coverage
   clears COVER. Returns one byte per panel pixel. */
function bits() {
  const src = wctx.getImageData(0, 0, MIP_W * SS, MIP_H * SS).data, out = new Uint8Array(MIP_W * MIP_H);
  for (let y = 0; y < MIP_H; y++) for (let x = 0; x < MIP_W; x++) {
    let lit = 0;
    for (let v = 0; v < SS; v++) for (let u = 0; u < SS; u++) lit += src[((y * SS + v) * MIP_W * SS + x * SS + u) * 4 + 1];
    out[y * MIP_W + x] = (lit / (SS * SS) - OFF[1]) / (ON[1] - OFF[1]) > COVER ? 1 : 0;
  }
  return out;
}

function rasterise(image) { begin(image); return bits(); }

function text(field, value, rotated = false) {
  const f = FIT[field];
  wctx.save();
  if (rotated) { wctx.translate(MIP_W, 0); wctx.rotate(Math.PI / 2); }
  wctx.font = `${f.weight} ${f.size}px ${FONT}`;
  wctx.fillText(value, f.x, f.y);
  wctx.restore();
}

/* copy a w × h block of the designer's bitmap (sx, sy) into the panel at (dx, dy) */
function blit(dst, src, sx, sy, w, h, dx, dy) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) dst[(dy + y) * MIP_W + dx + x] = src[(sy + y) * MIP_W + sx + x];
}

/* ---------------- panels ---------------- */

/* One panel: a 68 × 160 canvas wrapped as a nearest-filtered texture. */
export function makeScreen(THREE, renderer) {
  const c = document.createElement("canvas");
  c.width = MIP_W; c.height = MIP_H;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;   // pixels stay pixels under a macro zoom
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { c, ctx: c.getContext("2d"), tex };
}

function present(s, px) {
  const img = s.ctx.createImageData(MIP_W, MIP_H), d = img.data;
  for (let i = 0; i < px.length; i++) {
    const p = px[i] ? ON : OFF;
    d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  s.ctx.putImageData(img, 0, 0);
  s.tex.needsUpdate = true;
}

export async function loadScreens() {
  await Promise.all([400, 500].map((w) => document.fonts.load(`${w} 16px Montserrat`)));
  const [connected, peripheral] = await Promise.all([
    // live: clock, language, volume, the five profile squares, layer
    loadDesign(new URL("../assets/Connected.svg", import.meta.url),
      (b) => (b.y > 30 && b.y < 52) || (b.x > 18 && b.y > 59 && b.y < 89) || (b.y > 112 && b.y < 124) || (b.y > 142 && b.y < 158)),
    // live: everything below the status row — play glyph, Playing, title, artist
    loadDesign(new URL("../assets/Peripheral.svg", import.meta.url), (b) => b.y > 22),
  ]);
  return { connected, peripheral };
}

/* Left panel. profile: the active slot; bonded: how many slots are paired
   (the rest draw dotted, as in the design). */
export function drawConnected(s, design, { time, layer, lang = "EN", volume = "99%", profile = 0, bonded = 3 }) {
  begin(design.art);
  text("time", time);
  text("lang", lang);
  text("volume", volume);
  text("layer", layer);
  const px = bits(), src = design.full, P = PROFILE;
  // the design's squares: 0 = active (filled), 1 = paired (outline), 3 = empty (dotted)
  for (let i = 0; i < 5; i++) {
    const from = i === profile ? 0 : i < bonded ? 1 : 3;
    blit(px, src, P.x + from * P.pitch, P.y, P.size, P.size, P.x + i * P.pitch, P.y);
  }
  present(s, px);
}

/* Right panel: now playing, a circular marquee title — or, while the visitor
   types, their words in the same rotated column. `status` replaces
   Playing/Paused (the study's narration uses the same slots), `photo` is a
   ready 1-bit frame, and `flip` turns the content 180° for a half that
   stands with the panel upside down. */
export function drawPeripheral(s, design, { playing = true, title, artist, scroll = 0, typed = null, status = null, photo = null, flip = false }) {
  if (photo) { present(s, flip ? photo.slice().reverse() : photo); return; }
  begin(design.art);
  wctx.save();
  wctx.translate(MIP_W, 0);
  wctx.rotate(Math.PI / 2);
  if (typed != null) {
    wctx.font = `500 14px ${FONT}`;
    const lines = wrap(typed, MIP_H - 30).slice(-3);
    lines.forEach((l, i) => wctx.fillText(l, 26, 20 + i * 19));
    const last = lines[lines.length - 1] || "";
    wctx.fillRect(27 + wctx.measureText(last).width, 9 + (lines.length - 1) * 19, 7, 13);   // block caret
  } else {
    const f = FIT.title, c = TITLE_CLIP;
    wctx.font = `${FIT.playing.weight} ${FIT.playing.size}px ${FONT}`;
    wctx.fillText(status ?? (playing ? "Playing" : "Paused"), FIT.playing.x, FIT.playing.y);
    wctx.font = `${FIT.artist.weight} ${FIT.artist.size}px ${FONT}`;
    wctx.fillText(artist, FIT.artist.x, FIT.artist.y);
    wctx.font = `${f.weight} ${f.size}px ${FONT}`;
    wctx.beginPath();
    wctx.rect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
    wctx.clip();
    const loop = wctx.measureText(title).width + MARQUEE.gap;
    wctx.fillText(title, f.x - scroll, f.y);
    if (scroll > 0) wctx.fillText(title, f.x - scroll + loop, f.y);
  }
  wctx.restore();
  const px = bits();
  if (typed == null && status == null) {
    if (playing) blit(px, design.full, 55, 29, 8, 8, 55, 29);            // the designer's ▶, pointing down the column
    else for (const y of [30, 34]) for (let x = 56; x < 63; x++) { px[y * MIP_W + x] = 1; px[(y + 1) * MIP_W + x] = 1; }   // ❚❚
  }
  present(s, flip ? px.reverse() : px);
}

/* A photograph as the panel would show it: cropped to the panel's aspect,
   grey-scaled and Floyd–Steinberg dithered to 1 bit, light pixels on. */
export async function ditherPhoto(url, crop) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = MIP_W; c.height = MIP_H;
  const x = c.getContext("2d", { willReadFrequently: true });
  const [sx, sy, sw, sh] = crop || [0, 0, img.naturalWidth, img.naturalHeight];
  // a crop wider than the panel's own aspect fills its width and letterboxes: the rows below stay light (on)
  const dh = Math.min(MIP_H, (MIP_W * sh) / sw);
  x.fillStyle = "#fff";
  x.fillRect(0, 0, MIP_W, MIP_H);
  x.drawImage(img, sx, sy, sw, sh, 0, 0, MIP_W, dh);
  const d = x.getImageData(0, 0, MIP_W, MIP_H).data, g = new Float32Array(MIP_W * MIP_H), out = new Uint8Array(MIP_W * MIP_H);
  for (let i = 0; i < g.length; i++) g[i] = Math.pow((0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255, 1.6);
  for (let y = 0; y < MIP_H; y++) for (let xx = 0; xx < MIP_W; xx++) {
    const i = y * MIP_W + xx, v = g[i], on = v > 0.5 ? 1 : 0, e = v - on;
    out[i] = on;
    if (xx + 1 < MIP_W) g[i + 1] += (e * 7) / 16;
    if (y + 1 < MIP_H) {
      if (xx > 0) g[i + MIP_W - 1] += (e * 3) / 16;
      g[i + MIP_W] += (e * 5) / 16;
      if (xx + 1 < MIP_W) g[i + MIP_W + 1] += e / 16;
    }
  }
  return out;
}

function wrap(str, width) {
  const lines = [];
  for (const para of str.split("\n")) {
    let line = "";
    for (const word of para.split(/(?<= )/)) {   // wrap on words; split one only if it alone is too wide
      if (line && wctx.measureText(line + word).width > width) { lines.push(line); line = ""; }
      for (const ch of word) {
        if (wctx.measureText(line + ch).width > width) { lines.push(line); line = ""; }
        line += ch;
      }
    }
    lines.push(line);
  }
  return lines;
}

/* Marquee position (whole panel pixels, as a MIP moves) t seconds after the
   title started: rest, scroll one full loop, rest again. 0 when it fits. */
export function marquee(title, t) {
  wctx.font = `${FIT.title.weight} ${FIT.title.size}px ${FONT}`;
  const w = wctx.measureText(title).width;
  if (FIT.title.x + w <= TITLE_CLIP.x1) return 0;
  const loop = w + MARQUEE.gap, period = MARQUEE.hold + loop / MARQUEE.speed;
  const k = (t % period) - MARQUEE.hold;
  return k <= 0 ? 0 : Math.floor(k * MARQUEE.speed);
}
