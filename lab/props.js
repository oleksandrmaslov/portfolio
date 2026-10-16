/* ============================================================
   WAFER — PROPS
   ------------------------------------------------------------
   The things the halves stick to, built procedurally in scene
   units (1 cm): a magnet-ring tenting puck, a steel wall panel and
   a fridge door. Every surface a half rests on is given the
   height-field contact term by the caller (`look.prop`), so the
   halves shadow what they are stuck to.

   Each builder returns a Group whose origin is where the work
   happens: the stand's origin is the centre of its magnet-ring face,
   the wall's and the fridge's is a point on their front surface.
   ============================================================ */

/* A slanted aluminium puck: Ø 6 cm, so the 5.5 cm ring of a half sits fully on
   it, with a soft-touch face. Its top is tilted by `deg` about the z axis and
   centred `rise` cm above the floor — exactly where a half tented about its
   outer edge carries its ring. Origin = centre of the top face. */
export function makeStand(THREE, { deg, rise, radius = 3.0, alu, pad }) {
  const g = new THREE.Group();
  const t = Math.tan((deg * Math.PI) / 180), seg = 128;
  const body = new THREE.CylinderGeometry(radius, radius, 1, seg, 1, false);
  const pos = body.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), top = pos.getY(i) > 0;
    // bottom on the floor (y = -rise), top on the tilted plane through the origin
    pos.setY(i, top ? x * t - 0.06 : -rise);
  }
  body.computeVertexNormals();
  const puck = new THREE.Mesh(body, alu);
  // the face: a 2 mm silicone disc on the slanted top, and a hairline ring that says magnet ring
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.12, radius - 0.12, 0.06, seg), pad);
  disc.position.y = -0.03;
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.265, 2.741, seg).rotateX(-Math.PI / 2), pad);
  ring.position.y = 0.0005;
  const face = new THREE.Group();
  face.add(disc, ring);
  face.rotation.z = Math.atan(t);
  g.add(puck, face);
  for (const m of [puck, disc, ring]) { m.castShadow = m.receiveShadow = true; }
  // where it meets the desk: a soft contact shadow, darkest at the rim, gone 1.2 cm out
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d"), grad = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  const r0 = radius / (radius + 1.2);
  grad.addColorStop(0, "rgba(0,0,0,0.55)"); grad.addColorStop(r0, "rgba(0,0,0,0.5)");
  grad.addColorStop(r0 + (1 - r0) * 0.35, "rgba(0,0,0,0.14)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = grad;
  x.fillRect(0, 0, 128, 128);
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(radius + 1.2, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, color: 0x000000 }),
  );
  contact.material.map.colorSpace = THREE.SRGBColorSpace;   // black, with the gradient in its alpha
  contact.position.y = -rise + 0.003;
  g.add(contact);
  return g;
}

/* A brushed-steel panel, 1.5 mm thick with rounded corners, standing in for any
   magnetic wall. Origin = centre of the front face; front faces +z. */
export function makeWall(THREE, { w = 60, h = 40, steel }) {
  const shape = roundedRect(THREE, w, h, 1.2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 12 });
  geo.translate(0, 0, -0.19);
  const m = new THREE.Mesh(geo, steel);
  m.castShadow = m.receiveShadow = true;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

/* The fridge from the photo: a white enamelled door with a soft radius, the
   long two-tone handle, and the freezer door's gap below. Origin = a point on
   the front face of the upper door; front faces +z. */
export function makeFridge(THREE, { enamel, handleMetal, handlePlastic, gap }) {
  const g = new THREE.Group();
  const door = (w, h, y) => {
    const geo = new THREE.ExtrudeGeometry(roundedRect(THREE, w, h, 3), { depth: 4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 6, curveSegments: 16 });
    geo.translate(0, y, -4.8);
    const m = new THREE.Mesh(geo, enamel);
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  g.add(door(60, 96, 0), door(60, 56, -77.5));
  const shade = new THREE.Mesh(new THREE.BoxGeometry(60, 1.2, 4), gap);   // the dark seam between the doors
  shade.position.set(0, -48.9, -3);
  g.add(shade);
  // handle: brushed bar between white end caps, standing proud of the door
  const handle = (y) => {
    const h = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 30, 8, 24).rotateZ(Math.PI / 2), handleMetal);
    const capGeo = new THREE.CapsuleGeometry(1.25, 5, 8, 24).rotateZ(Math.PI / 2);
    const capL = new THREE.Mesh(capGeo, handlePlastic), capR = new THREE.Mesh(capGeo, handlePlastic);
    capL.position.x = -17.5; capR.position.x = 17.5;
    const standL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.6), handlePlastic), standR = standL.clone();
    standL.position.set(-19, 0, -1.4); standR.position.set(19, 0, -1.4);
    h.add(bar, capL, capR, standL, standR);
    h.position.set(-6, y, 2.8);
    h.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    return h;
  };
  g.add(handle(-38), handle(-62));
  // where it stands: a soft contact shadow under its feet (the key light's own shadow is busy with the halves)
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const x = c.getContext("2d");
  x.filter = "blur(10px)";
  x.fillStyle = "rgba(0,0,0,0.5)";
  x.fillRect(24, 20, 208, 24);
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 18).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, color: 0x000000 }),
  );
  contact.material.map.colorSpace = THREE.SRGBColorSpace;
  contact.position.set(0, -77.5 - 28 - 0.9, -9);   // just under the lower door's bottom edge: stand the fridge so this is the floor
  g.add(contact);
  return g;
}

function roundedRect(THREE, w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
