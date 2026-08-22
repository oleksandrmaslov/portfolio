# Wafer — Fusion 360 to demo GLB export guide

> Production contract for `demo/wafer-board.js`: keep every live demo
> feature (pressable caps, staggered explode, X-ray/wire/matcap, layers) while
> exporting replacement geometry.
> What makes that possible: **separate, named meshes** + **real scale** + **simple PBR materials**.

---

## 1. What I need from the file (the contract)

One `.glb` containing the **assembled** board, with each demo-relevant part as its
own mesh, named exactly like this:

| Mesh name | What | Count |
|---|---|---|
| `case_L`, `case_R` | bottom case slabs | 2 |
| `pcb_L`, `pcb_R` | PCBs | 2 |
| `plate_L`, `plate_R` | switch plates | 2 |
| `mcu` | ISP1807 module | 1 |
| `display` | Sharp memory display module | 1 |
| `battery_L`, `battery_R` | batteries | 2 |
| `magnet_L_0…2`, `magnet_R_0…2` | mating magnets (optional) | 6 |
| `key_L_r0c0` … `key_L_r2c4` | left alpha keycaps (row r, col c) | 15 |
| `key_R_r0c0` … `key_R_r2c4` | right alpha keycaps | 15 |
| `key_L_t0…t2`, `key_R_t0…t2` | thumb keycaps, inner→outer | 6 |

Notes:
- **Keycap = cap mesh only** (the part that visually travels). Switch housings can be
  merged into the plate or exported as `switches_L` / `switches_R` (they'll explode
  as one piece per half).
- Pivots don't matter — I compute centres from bounding boxes. Orientation of the
  whole board doesn't matter either; I normalise on load. **Names matter.**
- Small cosmetics (screws, feet) can be merged into their parent body. Anything
  separately named becomes a separately-exploding part — nice for hero parts
  (display, mcu), noise for 24 screws.

---

## 2. In Fusion 360 — prepare

1. **One component per part** in the table above (or at least one *body* per part).
   Rename them to the contract names right in the browser tree — names survive export.
2. Position everything **assembled** (closed, mated). The demo computes its own
   exploded offsets.
3. Check units: design in **mm** is fine; we'll fix scale in Blender. Wafer's real
   footprint (~200×110 mm per the case file) is what I'll calibrate against.
4. Simplify before export: `Modify → Remove` internal bodies you don't want
   (screw threads, internal ribs). Mesh weight target: **< 150k triangles total**.

## 3. Export from Fusion

Fusion has no native glTF-with-materials export, so go through Blender:

- **Recommended: FBX.** `File → Export → .fbx` (cloud translation). Keeps the
  body/component structure and names.
- Alternative: **STEP** → import to Blender via a CAD add-on (STEPper) or FreeCAD →
  cleaner curvature control (you choose tessellation), but more steps.
- Avoid OBJ/STL here — they flatten the per-body structure or lose names.

Fusion *appearances* don't transfer usefully either way — materials get rebuilt in
Blender (it's only ~5 materials, 10 minutes).

## 4. In Blender — clean, material, name

1. Import the FBX. Fix scale: select all → `S` → factor so the board is ~**0.20 m**
   wide per half (use `N` panel to verify). Then `Ctrl+A → All Transforms`.
2. Verify/repair names in the Outliner (mesh names, not just object names —
   the glTF exporter uses object names; keep both matching to be safe).
3. Materials — **Principled BSDF, keep it simple** (matches the site's lighting rig):
   - `alu_case` — Base #14181f, Metallic 0.9, Roughness 0.35
   - `cap_plastic` — Base #171b26, Metallic 0.1, Roughness 0.5
   - `pcb` — Base #0a0f16, Roughness 0.6 (+ optional baked trace texture)
   - `screen` — dark green-black, Roughness 0.2
   - `magnet_steel` — Metallic 1.0, Roughness 0.25
4. Textures (optional but great): bake **one 2K atlas** (BaseColor + Roughness/
   Metallic + Normal) instead of many maps — GLB embeds textures, so one atlas keeps
   it small. PNG for normal, JPG for the rest. **No keycap legends** — the demo
   draws layer-aware legends procedurally on top.
5. Decimate anything heavy (`Decimate → Planar 5°` works well on CAD tessellation).

## 5. Export glTF

`File → Export → glTF 2.0 (.glb)`:
- Format: **glTF Binary (.glb)**
- Include: Selected Objects (select the board), Apply Modifiers ✓
- Transform: +Y Up ✓ (default)
- Material: Export, images **JPEG quality ~80** where possible

Then compress (the site already ships the Meshopt decoder):

```bash
npx gltfpack -i wafer_demo.glb -o wafer_demo.opt.glb -cc -tc
```

Target: **≤ 4 MB** (the current hero GLB is ~2 MB — same ballpark is perfect).

## 6. Hand-off

Drop the file in `models/wafer_demo.glb` and tell me. I'll:
1. Swap `makeWaferBoard()` to a GLB-backed builder: load once, walk meshes by name,
   register each as an explode part (same stagger choreography) and each `key_*`
   as a pressable key mapped to the matrix.
2. Attach the procedural legend planes to the real cap tops (auto-sized from each
   cap's bounding box) so ZMK layers keep working.
3. Wire view modes (X-ray/wire/matcap swap the imported materials the same way).
4. Calibrate thock pitch per real cap size — and when you record the real
   keyboards, the synthesized thocks swap for your recordings in `demo/wafer-sound.js`.

### Quick checklist
- [ ] every part in the table = own mesh, exact name
- [ ] board assembled, junk bodies removed, <150k tris
- [ ] FBX out of Fusion → Blender → scale applied
- [ ] 5 simple PBR materials (+ optional 1 baked atlas, ≤2K)
- [ ] glTF Binary, +Y up → `gltfpack -cc -tc` → ≤4 MB
