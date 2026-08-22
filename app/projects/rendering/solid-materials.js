/* ============================================================
   M.O. SYSTEM — SOLID MODEL MATERIALS
   ------------------------------------------------------------
   The new Wafer GLB ships REAL PBR materials (anodized-alu case +
   plate, matte nylon caps, green soldermask PCB, grey LCD, dark
   switches, matte plastic). So instead of flattening everything
   to a shared matcap, this renderer keeps each model's
   own materials and only make sure they READ on the void bg:

     · window.tuneRealMaterials(root, THREE, opts)
         Walk a GLB that already has materials; bump envMapIntensity
         so the dark anodized metal catches the key + signal rim,
         keep tone, optionally lift near-black bases a hair so the
         silhouette never disappears in shadow.

     · window.applySolidMaterials(root, THREE, spec)
         For GLBs that ship NO materials (the flashlight): assign a
         single solid material in the house language (dark metal,
         signal-aware), so dropping matcap doesn't leave flat white.

   Both are no-ops-safe and idempotent.
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;

  /* Keep a model's real materials, but make them sit right on the void:
     raise envMapIntensity (so PBR reflections define the dark metal),
     guarantee a tiny floor on near-black bases, and unify tone-friendly
     flags. Materials are cloned so two instances (hero + card) can't
     stomp each other's envMapIntensity. */
  window.tuneRealMaterials = function (root, THREE, opts = {}) {
    const envInt   = opts.envMapIntensity != null ? opts.envMapIntensity : 1.35;
    const floor    = opts.minLuma != null ? opts.minLuma : 0.04;    // linear; lifts pure black to a readable anodized grey
    const seen = new Set();
    const clones = new Map();
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const out = mats.map((m) => {
        if (!m) return m;
        if (clones.has(m)) return clones.get(m);
        const mat = m.clone();
        if ("envMapIntensity" in mat) mat.envMapIntensity = envInt;
        // lift a hair off absolute black so the form survives deep shadow
        if (mat.color) {
          const c = mat.color;
          const luma = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
          if (luma < floor) {
            const k = floor / Math.max(luma, 1e-5);
            c.setRGB(Math.min(1, c.r * k || floor), Math.min(1, c.g * k || floor), Math.min(1, c.b * k || floor));
          }
        }
        mat.needsUpdate = true;
        clones.set(m, mat);
        seen.add(mat);
        return mat;
      });
      o.material = Array.isArray(o.material) ? out : out[0];
    });
    return seen.size;
  };

  /* Assign ONE solid material to every mesh of a material-less GLB.
     House language: dark anodized metal that lives on the void via the
     scene's key + signal rim. `accent` (default off) tints it slightly
     toward the signal so e.g. the flashlight reads as "ours". */
  window.applySolidMaterials = function (root, THREE, spec = {}) {
    const color     = spec.color != null ? spec.color : 0x12161f;
    const metalness = spec.metalness != null ? spec.metalness : 0.82;
    const roughness = spec.roughness != null ? spec.roughness : 0.34;
    const envInt    = spec.envMapIntensity != null ? spec.envMapIntensity : 1.25;
    const emissive  = spec.emissive != null ? spec.emissive : 0x000000;
    const base = new THREE.MeshStandardMaterial({
      color, metalness, roughness, emissive,
      emissiveIntensity: spec.emissiveIntensity != null ? spec.emissiveIntensity : 1,
    });
    if ("envMapIntensity" in base) base.envMapIntensity = envInt;
    root.traverse((o) => {
      if (!o.isMesh) return;
      const prev = o.material;
      o.material = base;
      if (prev && prev.dispose && prev !== base) {
        (Array.isArray(prev) ? prev : [prev]).forEach((p) => p && p.dispose && p.dispose());
      }
    });
    return base;
  };

  void SIGNAL;
})();
