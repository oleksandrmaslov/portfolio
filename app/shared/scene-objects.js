/* Shared source geometry for the Universe, board and navigation. */
window.makeMoOutputSwitch = function (THREE, top = 0.7) {
  const group = new THREE.Group();
  const mat = (color, metalness, roughness) => new THREE.MeshStandardMaterial({ color, metalness, roughness, envMapIntensity: 1.1 });
  const metal = mat(0xb9c0cc, 1, 0.28);
  const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  const housing = box(4.2, 1.7, 4.2, mat(0x14171f, .2, .5));
  housing.position.y = .85 + top; group.add(housing);
  const plate = box(4.2, .16, 4.2, metal);
  plate.position.y = 1.78 + top; group.add(plate);
  const button = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, .75, 24), mat(0xff5b3b, .1, .45));
  button.name = "SW1.actuator"; button.position.y = 2.2 + top; group.add(button);
  for (const [x, z] of [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]]) {
    const leg = box(.6, .25, .9, metal); leg.position.set(x, .13 + top, z); group.add(leg);
  }
  return group;
};
window.sampleMoGlyphTargets = function (text, count, origin = { x: 0, y: 0, z: 0 }) {
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
  // map sampled pixels into world-space targets centred on origin
  const SCALE = 0.024;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const h = hits.length ? hits[i % hits.length] : [cw / 2, ch / 2];
    // sub-cell jitter softens the sampling grid without blurring strokes
    const jx = (Math.random() - 0.5) * 1.6;
    const jy = (Math.random() - 0.5) * 1.6;
    out[i*3+0] = origin.x + (h[0] + jx - cw / 2) * SCALE;
    out[i*3+1] = origin.y - (h[1] + jy - ch / 2) * SCALE;
    // SHALLOW depth — keeps the glyph close to a readable plane instead of
    // puffing into a 3D cloud that never resolves into text.
    out[i*3+2] = origin.z + Math.sin(i * 12.9898) * 0.22;
  }
  return out;
};
