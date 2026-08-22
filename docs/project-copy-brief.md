# Project case files — what I need to fill the five scaffolds

> Five routes shipped on 2026-08-22 with real chrome and pending copy:
> Venovisor, ZMK Soft Off Plus, Sightseeing.inc, Silent Depth, Brionel Catalogue.
> Everything bracketed `[ ... ]` in `app/projects/data.jsx` is waiting on you.
> Nothing in them is invented — placeholders stay visible on purpose so a
> half-written page can never read as a finished claim.

Fill the blocks below in whatever form is fastest (bullets, voice-note
transcript, a paragraph that trails off). I write them into the house voice and
into `app/projects/data.jsx`. **Do not polish prose before sending it** — raw
facts survive editing better than draft copy does.

---

## 0. How to read the fields

Each field lands somewhere specific. Knowing where stops you writing the wrong
length of thing.

| Field | Where it renders | Shape |
|---|---|---|
| `year` | hero eyebrow, next to the node address | `"05 / 2026"` or `"2025 —"` |
| `place` | hero meta column | `"Munich, DE"` |
| `role` | hero meta column | `"Solo · firmware · architecture"` |
| `metrics` × 3 | big serif numerals under the tagline | value ≤ 6 chars + unit line |
| `intro` | one paragraph under the hero | 60–90 words |
| `sections` | the long-form body | 4 blocks, 40–120 words each |
| `links` | "Files & links" grid | kind + label + href |
| `demoSize` | measurement labels on the primitive viewer | `{ d, w, h }` in mm |

Two rules the rest of the site already follows:

- **Metrics are real or absent.** `"★ 25" / "github stars"` and `"ø38" / "mm body"`
  are the existing ones. Round marketing numbers (`99.9%`, `10x`) read as filler
  and I will push back on them.
- **Em-dash question, unresolved.** Your installed `design-taste-frontend` skill
  bans the em-dash outright and calls it the single most-tested AI tell. This
  site does not currently follow that: there are 29 of them across
  `app/data/projects.js` and `app/projects/data.jsx`, including in shipping
  taglines. Write however you normally write and I will match whichever way you
  decide. Worth deciding before the Awwwards submission rather than during it.

---

## 1. Per project — the block to fill

Copy this five times, once per project. Skip any line you do not have; a gap is
better than a guess.

```
PROJECT: <name>

  year          :
  place         :
  role          :

  metric 1      : <value>  /  <what it counts>
  metric 2      : <value>  /  <what it counts>
  metric 3      : <value>  /  <what it counts>

  intro         : what it is, who it was for, and the single decision
                  that shaped it. One screen, no preamble.

  why           : the problem in one paragraph. What existed before,
                  and why it did not hold.
  how it works  : the mechanism. The one design decision worth explaining
                  to someone who will never open the repo.
  what it cost  : the hard part. What you cut, and why.
  where it stands: current state. What would come next if it continued.

  links         : repo / release / live URL / writeup — kind, label, href
  headline link : if one URL is THE artifact, say which, plus a
                  6-word hint for the keycap ("RUNS IN THE BROWSER · USB")

  photos × 2    : file paths + one factual caption each
  dimensions    : d × w × h in mm, if it is a physical thing
```

The four section headings are my stubs, not a template you owe me. Rename them,
merge two, drop one. If a project only warrants two blocks, say so and I will
cut the other two rather than pad them.

---

## 2. What is already filled, and what to check

These came across from `app/data/projects.js` and are live on the landing card,
the All Projects index and the page hero **right now**. If any line is wrong,
it is wrong in three places at once.

| addr | name | tagline (live) | overline (live) |
|---|---|---|---|
| 0x05 | Venovisor | Wearable eye-level interface | WEARABLE EXPERIMENT · HARDWARE · DISPLAYS |
| 0x09 | ZMK Soft Off Plus | Shutdown and wake firmware module | FIRMWARE MODULE · ZMK · POWER |
| 0x0A | Sightseeing.inc | Adaptive city exploration app | INTERFACE STUDY · DESIGN |
| 0x0B | Silent Depth | Study of gaze and silence | VISUAL STUDY · DESIGN |
| 0x0C | Brionel Product Catalogue | Editorial system · 70+ products | CLIENT WORK · EDITORIAL · DESIGN |

### Venovisor needs a correction before anything else

The registry currently describes 0x05 as *"a compact wearable interface exploring
low-power information at eye level"*, classed `WEARABLE EXPERIMENT`, state
`FORMING`, tagged `Hardware · Volunteer · Displays`.

From what you told me, it is a **vein-finding device for wounded Ukrainian
soldiers**, and you wrote its firmware. Those are not the same project
description. The current wording is shipping on the public landing right now, so
this is the one field I would fix ahead of the rest.

Send me:

- one sentence saying what the device actually does, in your words;
- who it is for and who fielded it (unit, volunteer org, hospital — whatever is
  safe to name);
- your scope: firmware only, or hardware too;
- the `nodeClass` it should carry instead of `WEARABLE EXPERIMENT`. The full
  vocabulary in use is `OBJECT`, `EMBEDDED HARDWARE`, `FIRMWARE SYSTEM`,
  `FIRMWARE MODULE`, `OPEN-SOURCE MODULE`, `PRODUCTION SYSTEM`,
  `PRODUCT SOFTWARE`, `BEHAVIORAL OBJECT`, `CLIENT WORK`, `INTERFACE STUDY`,
  `VISUAL STUDY`, `WEARABLE EXPERIMENT`. For firmware on a fielded medical
  device, `EMBEDDED HARDWARE` or `FIRMWARE SYSTEM` fit better than the current
  one;
- its `state`: currently `FORMING`. `ACTIVE`, `ACTIVE DEVELOPMENT`, `WORKING
  PROTOTYPE` and `ARCHIVED` are the others in use;
- **anything that must not be published.** Deployment locations, unit names,
  casualty detail, anything export-controlled. Tell me what to leave out and I
  will leave it out. Silence is not consent here — if you do not flag it, I will
  ask again before writing.

This is the only page on the site where getting the tone wrong has a cost beyond
craft, so I would rather write it slowly and check it with you than draft it and
hope.

---

## 3. Venovisor model — print mesh to web mesh

You said the model is authored for 3D printing. That mesh will not ship as-is: a
print STL is one watertight high-density shell with no materials, typically
hundreds of thousands of triangles. The site's marks sit between 21 KB and
167 KB; the two heavy hero models are 802 KB and 1.2 MB.

**Target: ≤ 400 KB, ≤ 60k triangles.** That is comfortably above every mark on
the site and well under the Wafer hero.

The route from print file to `models/venovisor.glb`:

1. **Export STL or STEP from CAD.** STEP is better if you have it: Blender
   re-tessellates it at a density you choose, instead of inheriting the fine
   print tessellation.
2. **Decimate in Blender.** `Decimate → Planar`, angle 5°, collapses CAD facets
   hard without touching silhouettes. Check the result from the hero angle, not
   from the top.
3. **Drop print-only geometry.** Support stubs, brims, raft tabs, internal ribs,
   screw threads, anything sealed inside the housing. None of it is visible and
   all of it costs triangles.
4. **Scale to metres, apply transforms.** `Ctrl+A → All Transforms`. The rig
   normalises on load, but a clean transform avoids surprises.
5. **Give it 2–4 Principled BSDF materials.** A print mesh usually arrives with
   none, and an unmaterialed model falls through to the house solid shader. Match
   the existing palette: dark housing (Base `#14181f`, Metallic 0.9, Roughness
   0.35), a plastic (Base `#171b26`, Metallic 0.1, Roughness 0.5), and an emissive
   for anything that lights up.
6. **Export glTF Binary, +Y up**, then compress:

   ```bash
   npx gltfpack -i venovisor.glb -o models/venovisor.glb -cc -tc
   ```

   `-cc` is Meshopt compression; the site already ships the decoder, and every
   other model here uses it.

Hand it over and I will: drop the node-shell proxy from `Venovisor.html`, set
`ready: true` and `src` in `app/data/projects.js`, and tune `cardPose.fit` /
`rigFit` so it reads at the right size on the universe card, in the flight, and
on the page hero. Those three are separate numbers and I calibrate them together.

Until it lands, the page draws the same wireframe node-shell the universe card
shows, labelled `MODEL SIGNAL PENDING`. That is deliberate: it never silently
falls back to another project's model.

---

## 4. Still open from earlier

**Kerfur (0x02).** Its page hero is the procedural cat-pebble running the live
face engine; the universe card shows a wireframe proxy. They do not match, so the
handoff seam breaks on that node. Two ways out: leave it and accept the seam
until there is a Kerfur GLB, or teach the universe card to render the same
procedural body. The universe already supports procedural meshes — that is how
the 0x00 board works — so the second is real work but not exotic.

**Route filenames.** These are permanent public URLs now:
`Venovisor.html`, `ZMK Soft Off Plus.html`, `Sightseeing.html`,
`Silent Depth.html`, `Brionel Catalogue.html`. Say now if you want different
ones; renaming later needs a redirect plan.

---

## 5. Where it all goes

| What | File |
|---|---|
| case-study copy, metrics, sections, links | `app/projects/data.jsx` |
| card copy, tags, nodeClass, state, model config | `app/data/projects.js` |
| hero model, fit, pose, headline link keycap | the project's root `.html` |
| photos | `app/projects/components/` |

Keep the two registries aligned — the landing and the case study read from
different files and drift between them is the failure mode this repo is most
prone to.
