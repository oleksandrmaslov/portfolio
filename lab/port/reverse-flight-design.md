# Reverse flight: project page → its card in the Universe (build spec)

Status: build spec, read-only pass, 2026-10-16. Nothing in the repo was edited.
Measured on the current tree at `http://127.0.0.1:8765/`: GPU=1, headless Chrome on Iris Xe/ANGLE, 1440×900 unless stated, warm cache.
Probes are in `lab/port/tmp/reverse/`:
- `measure.cjs`: timeline, scroll, card-on-screen and scroll-call stacks per scenario (`SCEN=reel,field,direct,ring,back,backbf`);
- `seam.cjs`: the page → landing pose seam;
- `greet.cjs`: greeting-card placement per viewport and the cost of `tileBounds`;
- `spin.check.mjs`: the yaw split and whole-turn maths in this spec (passes: closed form = brute force within 0.0000°, 2000 random poses; 10 000 turn cases).

Line numbers are approximate. Another agent is editing the forward flight in `project-handoff.jsx`, so this spec is written against the **protocol** (session keys, events, rig API), not against line numbers.

---

## 0. Summary

The owner's wish: from a project page back to the Universe, the hero model flies back, **turns about 268° the opposite way to the forward flight**, lands **on its card** and becomes the card's model. It is the forward flight played in reverse.

Today none of that happens. The landing boots, the model spins on the spot in the centre of a black veil, and then everything dissolves while the scroll jumps. The model never goes near a card.

The approved design holds. Measurement changed six things about it:

1. **The reverse also has a broken start.** Re-measured today: there is a 309 ms gap between the page's last hero frame and the landing's first rig frame. Across that gap the scale jumps ×1.163, the yaw jumps −72°, and for 100–190 ms the veil shows with no model. The page must hand over an exact pose, plus a seam image, just as the forward flight does. (§1.3, §3.1)
2. **The page hands over a screen pose (`cx, cy, span, quat`), not a yaw.** That is the same shape as the forward flight's `originRect`. It makes the start exact even where the page hero's holder pose and the landing rig's `rigPose` differ, which is the case for Kerfur. (§3.1)
3. **The spin is a closed-form split plus a locked turn count.** The turn's endpoint is `yawFor(card quat)`. A brute-force check confirms that closed form is exact. The match slerp carries only the residual tilt. The number of whole turns is fixed once, at the start of the travel, and the endpoint is tracked live with unwrapping, so a creeping card cannot flip the spin by 2π mid-flight. (§2)
4. **A drifting tile doesn't need pinning, but the camera needs calming.** In drift mode the tiles hold still and the camera moves (`cam.vel`, Lissajous parallax, yaw creep). The existing `stopDrift()` and its 3.2 s idle timer already give a smooth release. The card model also creeps on its own at 0.15 rad/s (`wire.rotation.y`), about 10° per flight. Live tracking absorbs that. (§3.3)
5. **The 800–1300 px scroll error is not the stop formula.** The formula is exact; the earlier runs reached `y == expected` every time. The error is a one-line bug: `scroll-flight.js` `measureLayout` reads a stale `cachedScrollY` and caches `#work.top = 0`, and the auto-dock then drags the scroll to 4536 instead of 4883 (Wafer, 5 of 11 runs). (§1.4)
6. **`modelViewportBounds()` cannot see a lifted card.** It filters on `o.visible`, and the wire loop sets `visible = false` for `liftedAddr`. So the live target has to be read with the lift ignored. (§3.4)

---

## 1. The current reverse path, end to end (measured)

### 1.1 Session keys

| key | written by | value | read by |
|---|---|---|---|
| `mo_node_return_origin` | landing forward flight (`onFly`) | `work` for a reel card, or a tile clicked while the Universe is in reel mode; `universe` for a field tile | page leave, which removes it. **Nothing else clears it**, so it survives ring navigation, All Projects and the menu, and goes stale |
| `mo_node_yaw` | page leave, **at click time** | `rig.yaw` = `cur.yaw`, which **excludes `idleSpin`** | landing reverse, `rig.setYaw` |
| `mo_node_return` = `1` | page leave | flag | `preloader.js` (skips the horizon); `NodeHandoff` (`returningRef`) |
| `mo_node_return_addr` / `_target` | page leave | page addr; origin or `work` | landing reverse |
| `mo_node_seam` | forward only | WebP with alpha | the project page's `#mo-seam` bridge. **The reverse has no seam** |

The page navigates 720 ms after the click: to `./` when the origin is `universe`, otherwise to `./#work`. That is a full load; the landing is not reused.

### 1.2 What the landing does today

1. `preloader.js` sees `mo_node_return` and calls `finish()` at script time. There is no horizon, `mo:preloader-done` fires immediately, and `#mo-pl` (z 120) is removed within 200 ms. The `handoff` readiness mark plays no part in a return.
2. `app.jsx` replays the `#work` fragment two rAFs after commit (`scrollIntoView`, y = 3600).
3. `NodeHandoff` mounts in `return` mode:
   1. `fadeUniverse(0, 0)` and `wf-flying`;
   2. after a rAF, `buildRig` builds a cold context (`prepareRig` refuses while returning);
   3. `snapHandoff()`, then `setYaw(seamYaw)`. **`setYaw` is `snapToLayout(0, 1, 0, y)`, which forces scale 1** where the page was at `handoffScale` 0.86.
4. Each frame runs `rig.nudgeYaw(min(50, dt) · hp.spinSpeed)`: a constant +0.0039 rad/ms spin in the centre.
5. The dissolve starts when `painted ≥ 2 && elapsed ≥ 620 ms` (capped at +900 ms, with a timer failsafe). It does three things:
   - `fadeUniverse(1, 700)`;
   - `.wf--dissolve`;
   - the scroll **jumps** to the reel stop (the formula is duplicated from `work.jsx` `jumpToStop`), to the top of `#work`, or to 0.
6. 760 ms later the rig is **disposed**, so the next forward flight starts cold.

### 1.3 Timeline and seam (re-measured today, 0x04)

Times are ms after the ← UNIVERSE click.

| | reel | field | direct link |
|---|---|---|---|
| landing navigation | 738 | 743 | 742 |
| React mounted, `.wf--on` (veil, no model) | 771 | 776 | 781 |
| first rig frame | 901 | 924 | 942 |
| dissolve | 1558 | 1580 | 1617 |
| overlay gone | 2308 | 2330 | 2367 |
| final scroll | 6532 = the stop ✓ | 0 | 6532 ✓ (the stale origin defaults to `work`) |
| card on screen at the end | ✓ model | **✗ (`tileBounds` null)** | ✓ |

From the earlier pass, which still holds:
- reel 0x01: 6/11 ✓, 5/11 end at 4536 ✗;
- ring 0x04→0x06: the stop ✓, while a non-featured final addr lands on the top of `#work` with no card;
- phone 390×844 reel: ✓;
- reduced motion: the dissolve at 1170 ms.

**The seam** (`seam.cjs`, 4 s dwell):

| | page, last frame | landing, first frame | jump |
|---|---|---|---|
| time | | | 309 ms later |
| scale | 0.86 | 1.00 | ×1.163 |
| yaw | 7.316 | 6.062 | −71.9° |
| model drawn | | | the veil shows with no model for 100–190 ms of the gap |

The yaw error has two causes:
- `idleSpin`, which `rig.yaw` excludes;
- the page's own exit spin of 0.0019 rad/ms during the 720 ms after it wrote the yaw, about 78°.

### 1.4 The scroll-restore error

1. `app.jsx` scrolls to 3600 inside a rAF.
2. `measureLayout` (`scroll-flight.js`, around line 131: `var y = cachedScrollY;`) runs later in the same frame, before a `scroll` event has refreshed the cache.
3. It stores `#work.top = rect.top(0) + 0`.
4. The timeline then reads y = 4883 as 95% of the reel.
5. When `wf-flying` clears, the toAbout back-dock "finishes the leg" to 4536.

**Fix:** `var y = window.scrollY; cachedScrollY = y;`. The read phase already forces layout, so this costs nothing.

### 1.5 Browser Back

- **Without bfcache** (Playwright's default): a fresh load with no `mo_node_return`, so the **full entry horizon replays** (`preloader-done` about 1430 ms). The landing ends at y = 0 with the card off screen. Native scroll restoration fails because the document has no height until React mounts.
- **With bfcache** (`persisted: true`, no NotRestoredReasons): the landing comes back exactly as it left:
  - `.wf--on` in forward mode;
  - the rig at the forward end pose;
  - the Universe at opacity 0;
  - `liftedAddr = addr`;
  - the scroll on the origin.

  Then `core.jsx` `__mo_restorePage` and `NodeHandoff`'s `mo:page-restored` handler cut everything within one handler (the overlay is off 7 ms after `pageshow`), and `onUniversePageWake` clears `liftedAddr`. Everything a perfect reverse needs is in memory, and it is thrown away.

---

## 2. The spin, exactly

`NH_DEFAULTS.spinSpeed` is 0.0039 rad/ms and `duration` is 1200 ms, so **nominal = spinSpeed · duration ≈ 4.68 rad ≈ 268°**. Both are per-project through `model.handoffPose`.

At HEAD the forward flight turned **+** (`nudgeYaw(+…)`). The current tree has dropped that spin: the forward is now a short-path slerp. The owner rule says it must come back, and the other agent is restoring it. The reverse turns **−**.

### 2.1 Two shared helpers: one definition, used by both directions

In `solid-hero-rig.jsx`:

```js
// rig.yawFor(quat): the rig yaw whose drawn pose is nearest a camera-relative
// world quat. Spin is Euler XYZ = Rx(pitch)·Ry(yaw); H = holder·modelRoot.
// A = Rx(-arrivePitch) · Q · H⁻¹  →  yaw = 2·atan2(A.y, A.w)   (exact; spin.check.mjs)
// residualFor(quat, yaw) = Q · (Rx(p)·Ry(yaw)·H)⁻¹  → pivot carries only this
window.moTurn = (from, to, nominal, dir) => {           // dir +1 forward, -1 reverse
  const TAU = 2 * Math.PI, d = (to - from) - TAU * Math.round((to - from) / TAU);
  return d + TAU * Math.round((dir * nominal - d) / TAU);
};
```

`moTurn` lands exactly on `to` (mod 2π), keeps `dir`, and stays within ±180° of nominal. That gives a range of **88°–448°**, and about 268° on average.

If the forward agent has already landed equivalents, the reverse uses those. It does not make a second copy.

### 2.2 Reverse yaw on one progress

```
travel start:  yEnd0  = yawFor(T.quat)                     // T = live card target
               total  = moTurn(from.yaw, yEnd0, nominal, -1)   // locked: whole turns fixed here
each frame:    yEnd   = unwrapNear(yawFor(T.quat), yEndPrev)    // follows the card's 0.15 rad/s creep
               to.yaw = from.yaw + total + (yEnd - yEnd0)
               cur.yaw = lerp(from.yaw, to.yaw, e(k))
```

At k = 1, `cur.yaw ≡ yawFor(T.quat)` (mod 2π), and `matchQ = residualFor(T.quat, cur.yaw)`, so the drawn world pose **equals `T.quat`** with zero residual. Whatever the turn did, the final frame is the card's live pose.

Locking `total` stops a crossing of the ±π boundary from flipping the turn count mid-flight.

**Reduced motion:** no travel and no spin (rung 3).

---

## 3. Protocol

### 3.1 On the project page (`project-page-lifecycle.jsx` `leaveToUniverse`, `wafer-page.jsx` `leaveToUniverse`)

1. **On click**, as today: `__hv_leaving`, `hv-exit`, `--hv-stage-op: 1`, `rig.setIdle(false)`.
   - **Change:** stop calling `toHandoff()` and stop setting `__hv_exitSpin`. The hero **holds still** where the reader sees it while the page's chrome fades, which mirrors the page's arrival hold. The whole turn happens in the flight. (Decision D2.)
   - `idleSpin` is folded into `cur.yaw` and zeroed, so the drawn pose and the state agree.
2. **Navigate on a frame, not a timer.** At 720 ms, request one rAF. Inside it:
   1. `rig.update(dt)` and `rig.render()`;
   2. `rec = rig.screenPose(vw, vh)` = `{cx, cy, span, quat, fov: 38, vw, vh, t: Date.now(), addr}`. This is the inverse of `startFromScreen`:
      - `span = cur.scale · modelFit / (2·camZ·tan(fov/2))`;
      - `quat` is `modelRoot`'s world quat (the rig camera has no rotation);
   3. capture the seam: `drawImage` of the canvas in the **same task** as the render (the page rig has no `preserveDrawingBuffer`), then `toDataURL("image/webp", 0.9)` at 1100 px wide, which is the forward's own encoder;
   4. write `mo_node_back = JSON(rec)` and `mo_node_seam_back`;
   5. navigate.

   The 4 s "stuck" restore stays.
3. **`pagehide`, always:** write `mo_node_back` (pose only, no JPEG) if it is not already set. That covers browser Back.
4. **Origin hygiene.**
   - The ring's `goTo` (`standard-page.jsx` `PCProjectFooterNav`, Wafer's copy) sets `mo_node_ring = 1`.
   - On boot, a page that has neither `mo_node_arrive` nor `mo_node_ring` removes `mo_node_return_origin`. That covers direct links, All Projects and the menu.
   - The ring keeps the origin it inherited.
5. **The hero is not drawn** (`hv-demoing`, menu open, `!rig.ready`): write no record. The landing then starts from the forward end pose (§3.3, step 2).

### 3.2 On the landing before React (inline in the head of `index.html`, next to the existing inline scripts)

1. **Detect a return:**
   - `mo_node_return === "1"` means ← UNIVERSE;
   - otherwise, `navigation.type === "back_forward"` with a `mo_node_back` less than 5 s old means a **Back return**. Write `mo_node_return`, `_addr` and `_target` from it, so `preloader.js` skips the horizon unchanged.
2. On a return only: `history.scrollRestoration = "manual"`. A refresh mid-page still uses native restore.
3. **The reverse seam bridge**, a mirror of the pages' `#mo-seam`: a fixed full-viewport `div#mo-seam-back` at z 901, with `background: var(--void)` under the alpha WebP, painted from first paint. It covers the black frame and the boot. `#mo-pl` (z 120) is gone in 200 ms anyway.
4. Expose `window.__mo_return = {addr, target, rec}`. It is parsed once, here. `universe.jsx`, `project-handoff.jsx` and `app.jsx` read it; there are no further `sessionStorage` reads.

### 3.3 On the landing at React commit (`project-handoff.jsx`, the reverse effect)

**Destination.** It is computed, never restored.
- `reel`: when `addr ∈ MO_FEATURED_ADDRS` and the origin is `work`.
- `field`: when the node has a tile (`universe !== false`).
- `none`: otherwise.

**Scroll at commit**, under the seam:
- reel: `scrollTo(window.moReelStopY(addr))`;
- field: `scrollTo(0)`.

`moReelStopY` is a new single-definition export from `work.jsx`. `jumpToStop`, the handoff and the shoot harness all call it, which removes the duplicate formula.

`app.jsx`'s hash replay yields when `__mo_return` owns the scroll.

**Phases.** One rAF loop with a `setTimeout` failsafe, as the forward flight has.

1. **SEAM HOLD.**
   1. `buildRig(project)`, then `rig.startFromScreen(rec.cx, rec.cy, vw, vh, rec.span·frustumH(38)/rigFit, rec.quat, 38)`. This is exactly the forward's entry path, fed the page's record, with yaw and residual split through `yawFor`/`residualFor`.
   2. **No spin.** The page held still.
   3. After `rig.ready` and **2 painted frames**, remove `#mo-seam-back` at once. It is the same frame, so a fade would only ghost it, which is the forward's own rule.
2. **No record** (a Back without `pagehide`, or the hero was not drawn): `rig.snapToLayout(hp.restX, hp.scale, hp.offsetY, RIG.arriveYaw)`, the forward's end pose. The rig appears from the veil.
3. **ACQUIRE.** Poll `__mo_universe.cardTarget(addr)` each frame. When it is `resolvable` (projected on screen; the model does not need to be loaded), start the travel. If 1500 ms pass after SEAM HOLD, go to rung 4.
4. **TRAVEL**, the mirror of the forward, `hp.duration` (1200 ms):
   - the clock is drawn time, `flown += min(50, dt)`, `k = flown / dur`. That is the forward's own clock, so a stalled frame cannot teleport the model;
   - `from = rig.state()` is captured once;
   - each frame: `to = rig.screenState(T.cx, T.cy, vw, vh, T.span·frustumH(T.fov)/rigFit, T.fov)`, plus the yaw from §2.2, `match → 1` and `pitch → arrivePitch`;
   - `rig.landTo(from, to, residual, e(k))` puts `cur` on the line from `from` to `to` for `offX, offY, scale, fov, yaw, pitch, match`, and sets `matchQ = residual`;
   - `fov` runs 38 → the card's live fov (58 plus warp);
   - the dress runs rig → field through the existing `dress.set(look, cur.match)`;
   - `e` is easeInOutCubic (decision D1);
   - fades: from k = 0.6, `fadeUniverse(1, 420)` and the veil fades out over 460 ms, so the card is up before the model lands. This mirrors the forward's 420 ms dim at release;
   - the card's own model is **lifted from mount on** (`liftedAddr = addr`), so it is never drawn twice.
5. **PARK.** At k = 1, keep calling `landTo(…, 1)` against the live target, so the model sits on the card exactly. Wait for `T.ready`:
   - the card model is loaded;
   - its 600 ms `mFade` is complete;
   - `modelOp ≥ 0.98`;
   - the target has been stable for 2 frames (< 0.5 px and < 0.2° per frame).

   The budget is 2500 ms, then rung 2.
6. **HAND-OVER.** The mirror of the forward lift.
   1. Dispatch `mo:handoff-lift {addr: null}`. The existing listener clears `liftedAddr`.
   2. When `T.drawn ≥ 2` (Universe frames drawn with the card model visible and unlifted), set the mount to `opacity: 0; transition: none` in the same callback as the rig's last render.
   3. Clear `wf-flying`, set the mode to `idle` and `nhClearStale()`.
   4. **Keep the rig** for the next forward flight. Today it is disposed, which makes the next flight cold.
   5. `stopDrift()` re-arms the existing 3.2 s idle timer, which releases the calmed camera smoothly.

**Universe at mount on a return** (`universe.jsx`; `__mo_return` is known before the first frame):
- `ensureProjectModel(addr)` (it already exists) starts the returning card's job first. Change the `startModelJob(modelJobs[0])` line to prefer the returning addr. `core.jsx`'s warm-up warms the returning model instead of the greeting. Card and rig share the `loadProjectModel` cache, so it is one parse.
- `liftedAddr = addr` before the first frame.
- `field`: give the node the greeting slot (§3.5).
- `reel`: snap arranged tiles to their targets on the first frame instead of lerping in from `driftHome`.
- **Calm the camera** while `body.wf-flying` is set: `driftActive = false`, `cam.vel = 0`. The parallax gain already eases to `focusDamp` when drift is off.
- **Gate the DOF probe on `!wf-flying`.** Its 30 + 90 frame window overlaps the whole reverse, and the flight must not cost a capable device its Bokeh.
- `onUniversePageWake` clears `liftedAddr` only on `event.persisted`, or when the reverse did not claim the restore. Today it clears it on every `pageshow`, and on a slow load `pageshow` can land after mount and unhide the card mid-flight.

### 3.4 `__mo_universe.cardTarget(addr)`

```
{ cx, cy, span, quat, fov, x, y, w, h, isModel, resolvable, ready, drawn, stable }
```

- **Geometry:** the same body as `modelViewportBounds(addr)`, so the two directions cannot disagree. The one change is that the holder is found with `loaded && modelOp > 0.02` **instead of `visible`**, because the lift hides it.
  - Refactor this as `modelViewportBounds(addr, {ignoreLift: true})` rather than copying it.
  - With no loaded model, it falls back to `tileViewportBounds` with `isModel: false` (Kerfur, or a model still loading).
- **Bookkeeping** in the wire loop, on `holder.userData` for this one addr only: `ready`, `drawn` (frames drawn visible and unlifted) and `stable`.
- **Cost:** 0.010–0.014 ms per call (`greet.cjs`), once per frame.
- **One-frame lag.** It is read in the handoff's rAF, which may run before the Universe's frame. With the camera calmed, the lag is ≤ 0.5 px. `stable` covers the hand-over.

### 3.5 The greeting slot (field target and no-origin target)

`driftHome(i, out, jitter)` stays the one definition. Add a mount-scoped `greetIdx` (default 0) and map the slot:

```js
const slot = i === greetIdx ? 0 : (i === 0 ? greetIdx : i);
```

The rest of the body uses `slot`: the returning node takes `GREET_POS`, and Wafer takes the returner's spiral slot.

Why this does not break AGENTS.md:
- the clear-cone walk still runs for every non-greeting slot;
- `scatterTiles()` calls the same function, so origin → title stays consistent;
- a fresh mount resets to registry order;
- `GREET_POS` (|z| 13.2) sits inside `TILE_BOX` (18.2), so it never wraps.

The one rule it bends is "registry order decides who greets you". That now holds for a first visit only. Write it into AGENTS.md.

**Phone portrait:** at 390×844 the greeting card's model centre sits at x = 406–433 px, past the right edge (`greet.cjs`); the first visit has the same bug. Inside the greeting branch, clamp `GREET_POS.x` to 0.45 × the half-width of the view at that depth for the current aspect (D4). Landscape 844×390 is fine at 519–533 of 844.

### 3.6 Browser Back with bfcache (`pageshow.persisted`)

1. `core.jsx`: `__mo_restorePage` first dispatches a cancelable `mo:bf-reverse`. If it is claimed, `wf-flying`, `.wf` and the Universe opacity stay as they are. Only the stuck-navigation path calls `__mo_restorePage` without the offer.
2. `NodeHandoff` claims the restore only if all of these hold:
   - the rig exists and `rig.ready`;
   - `!gl.isContextLost()`;
   - `rig.getProjectAddr() === mo_node_back.addr`, and the record is less than 5 s old;
   - reduced motion is off.
3. It then plays from the frozen forward-end state, **skipping SEAM HOLD**: `from = rig.state()` (the hero pose), then ACQUIRE → TRAVEL → PARK → HAND-OVER. The origin card is already in place, loaded and lifted, and the scroll is already on it.
4. The page → landing cut is the browser's own Back, which is expected.
5. **Unclaimed:** today's cut.

### 3.7 Browser Back without bfcache

This is the ← UNIVERSE path, entered through §3.2's `back_forward` detection. The `pagehide` record gives an exact start. There is no seam (D6), so the rig appears from the veil.

---

## 4. Situation matrix

| situation | deterministic | tracked live | rung |
|---|---|---|---|
| came from a reel card (origin `work`, featured) | `moReelStopY(addr)` at commit; arranged tiles snapped | the card's cx, cy, span, quat and fov while the reel focus-pop (0.85 → 1.10) and the model creep play | 0 |
| came from a field tile (origin `universe`) | y = 0; node in the greeting slot; camera calmed | camera residue, model creep 0.15 rad/s, fov | 0 |
| field tile clicked from About (drift mode) | the title greeting (D3) | same | 0 |
| All Projects, menu or direct link (no origin after hygiene) | the title greeting (D3; today the reel) | same | 0 |
| ring ×n, then ← UNIVERSE | the inherited origin applied to the **final** addr: reel if that addr is featured and the origin is `work`, else the greeting | as above | 0 |
| "← UNIVERSE" | as above, with the seam and an exact record | as above | 0 |
| browser Back, bfcache | the forward's own destination, already composed | the card | 0, no seam hold |
| browser Back, no bfcache | as ← UNIVERSE; record from `pagehide`, no seam | as above | 0 |
| reduced motion | same scroll target | — | 3 |
| phone viewport | reel: the card is on screen (cx 194 of 390, measured). Field: needs the D4 clamp | as above | 0 |
| DOF off / weak device | same geometry (Bokeh moves nothing). The drawn-time clock keeps the travel whole | as above | 0; the DOF probe gated |
| card model not loaded at k = 1 | — | the rig parks on the live target (quad-derived until the model loads, then model-exact) | 1, then 2 after 2.5 s |
| slow network | the seam covers script and React load. The GLB is HTTP-cached from the page | — | seam hold. No rig draw within 4 s → rung 4 |
| menu opened during the reverse (the landing shell is clickable) | — | — | 5: jump to the end state. `openMenu` re-hosts the Universe canvas, so the target is meaningless |
| wheel, touch or key during the reverse | — | — | 5: jump to the end state |
| hidden tab | — | — | 5: the failsafe timer finishes |
| `universe: false` (Silent Depth) | y = 0 | — | 4 |
| Kerfur (proxy rig, no card model) | its card (reel or greeting) | the card quad | 2 |
| the landing previously scrolled elsewhere | irrelevant: the destination is computed | — | — |

## 5. Fallback ladder

| rung | when | what plays |
|---|---|---|
| 0 | the target resolves and the card model is ready by k = 1 | the full mirror: seam → travel with a −268° turn → land → hand-over |
| 1 | the card model is not ready at k = 1 | PARK on the live target, then the hand-over, ≤ 2.5 s |
| 2 | the park budget is exceeded, the card's model load failed, or the card has no model (Kerfur) | land on the card quad (height 0.8 × the quad), then a 250 ms rig fade while unlifting. The card's own `mFade` brings its model in |
| 3 | reduced motion | crossfade at the hero pose: rig out over 420 ms, Universe in. The scroll is set at commit. No travel, no spin, no lift |
| 4 | no tile (`universe: false`), no resolvable target 1.5 s after the seam hold, or no rig draw within 4 s | today's `.wf--dissolve` (700 ms), at the computed scroll |
| 5 | hidden tab, rAF starved, the failsafe `setTimeout(4000 + dur + 2500)` fires, menu open, or user input | jump to the end state: unlift, mount off, `wf-flying` cleared, keys cleared. No animation |

## 6. API and files

| file | change | size |
|---|---|---|
| `app/projects/rendering/solid-hero-rig.jsx` | Add `yawFor(quat)`, `residualFor(quat, yaw)`, `window.moTurn` (§2.1); `state()`; `screenState(cx, cy, vw, vh, scale, fov)` (the pure half of `startFromScreen`, which becomes `screenState` + apply plus the yaw split); `landTo(from, to, residual, e)`; `screenPose(vw, vh)`. Keep the `idleSpin` fold in `setIdle(false)`. | ~80 |
| `app/projects/rendering/project-handoff-rig.jsx` | `setYaw` keeps the current scale (fixes the ×1.163) | 2 |
| `app/landing/transitions/project-handoff.jsx` | Rewrite the reverse effect as §3.3's phases; bfcache claim (§3.6); scroll at commit; keep the rig; mount lift at start | ~180, replacing ~110 |
| `app/landing/scenes/universe.jsx` | `cardTarget()` (via `modelViewportBounds(addr, {ignoreLift})`); bookkeeping for one addr; `greetIdx` swap and phone clamp in `driftHome`; returning job first; initial `liftedAddr`; calm camera while `wf-flying`; first-frame snap of arranged targets; DOF probe gate; persisted-only wake unlift | ~70 |
| `app/landing/sections/work.jsx` | `window.moReelStopY(addr)`, used by `jumpToStop` | ~12 |
| `app/landing/controllers/scroll-flight.js` | `measureLayout` reads a live `scrollY`. Bump its hand-written `?v=` | 2 |
| `app/landing/app.jsx` | the hash replay yields to `__mo_return` | 2 |
| `app/shared/core.jsx` | claimable persisted restore; warm the returning model | ~10 |
| `app/projects/pages/project-page-lifecycle.jsx`, `wafer-page.jsx` | hold the hero (no `toHandoff`, no exit spin); frame-synchronous record, seam and navigation; `pagehide` record; origin hygiene | ~35 each |
| `app/projects/pages/standard-page.jsx` | the ring's `goTo` sets `mo_node_ring` | 2 |
| `index.html` head | return and `back_forward` detection; conditional `scrollRestoration`; `#mo-seam-back`; `__mo_return` | ~35 |
| `AGENTS.md` | the reverse protocol, the new keys, the greeting exception, the spin rule | ~30 |

New session keys: `mo_node_back` (the JSON screen pose), `mo_node_seam_back` (WebP with alpha) and `mo_node_ring`. The existing keys keep their meaning. Rebuild with `npm run build --prefix tools/landing-runtime`, then run `check` and `test`.

**Preloader:** no interaction on a return. `finish()` runs at script time, the `handoff` readiness mark and `mo:handoff-warm` are not involved, and `.wf` (z 900) and `#mo-seam-back` (z 901) sit above `#mo-pl` (z 120) for the 200 ms it survives.

## 7. Acceptance criteria

Probe: `lab/port/tmp/reverse/reverse-land.cjs`, built on `flight-origin.cjs`'s `__measure` hook (patch `WebGLRenderer.render` on both the rig and the Universe), plus extensions to `measure.cjs`.

Matrix: 12 nodes × {reel where featured, field} × {1440×900, 390×844}, GPU=1.

1. **Hand-over frame** (the rig's last drawn frame vs the Universe's first frame with the card model unlifted):
   - box width and height 0.95–1.05× the card's;
   - centre within 1% of the viewport;
   - camera-relative pose within 1°.
2. **Spin:**
   - the accumulated rig yaw over TRAVEL equals `moTurn(from, yEnd0, nominal, −1)` plus the card creep;
   - it is negative and within ±180° of −nominal, ≈ −268° on average;
   - **the forward is checked in the same run**: positive, ≈ +268°, and its seam frame equals the hero rest pose.
3. **Page → landing seam** (← UNIVERSE):
   - scale ratio 0.98–1.02 (today 1.163);
   - yaw within 1° (today −72°);
   - centre within 1%.
4. **No black frame.** On every landing frame from first paint to the hand-over, at least one of these is true:
   - `#mo-seam-back` is visible;
   - the rig drew with its model;
   - the card drew its model.

   Zero frames with none (today 6–10).
5. **No camera jump.** The Universe camera's per-frame step during the reverse is < 0.05 u and < 1° (`reverse-probe.cjs`'s metric). The rig fov is monotone 38 → the card fov.
6. **Every card keeps its model.** After the hand-over:
   - `liftedAddr === null`;
   - every loaded holder `visible` where `modelOp > 0.02`;
   - the returning card's `tileBounds(addr).isModel` is on screen.
7. **Scroll:**
   - a reel return ends at `moReelStopY(addr)` ± 1 px and holds it for 5 s after the overlay clears, 10/10 runs for 0x01 (today 6/11);
   - a field return ends at y = 0.
8. **Timing** (GPU=1, warm):
   - click → hand-over ≤ 2.8 s;
   - bfcache Back → hand-over ≤ 1.6 s.
9. **No regressions:**
   - `flight-origin.cjs` and `verify/flight-cont.cjs` pass;
   - `reverse-probe.cjs` passes with "dissolve" replaced by "hand-over";
   - no page errors;
   - `__mo_dofFps` is measured outside the flight;
   - the next forward flight after a return starts warm (no `makeNodeRig` call).
10. **Each rung forced and observed once:**
    - Silent Depth (4);
    - reduced motion (3);
    - Kerfur (2);
    - a GLB route delay of 3 s through `page.route` (1 → 2);
    - a hidden tab via CDP `Emulation.setFocusEmulationEnabled` and a visibility override (5);
    - a wheel mid-flight (5);
    - bfcache on and off.

## 8. Risks

- **R1. Boot contention.** The reverse plays while the landing boots: GLB parses, shader compiles, two WebGL contexts. The drawn-time clock prevents teleports. Starting the returning card's job first is mandatory, or PARK becomes the common case.
- **R2. Scroll racers:**
  - the hash replay;
  - native `back_forward` restore;
  - the scroll-flight dock (§1.4);
  - React-late `#work` height. Read `moReelStopY` after commit, not at script time.

  Each needs its guard, or the computed stop is overwritten afterwards.
- **R3. The forward is in flux.** The current tree has no forward spin. The other agent is restoring it. The reverse depends only on the shared helpers (§2.1) and the `startFromScreen` contract. Whoever lands second reuses the first one's helpers, and nobody copies them.
- **R4. `pageshow` ordering** (see §3.3): unlift only on `persisted`.
- **R5. bfcache WebGL context loss** under memory pressure: check `isContextLost()` and cut.
- **R6. A look change at the hand-over.** The card draws through the composer (DPR ≤ 1.5/1.25, aberration, vignette, DOF) with fade materials; the rig draws at DPR ≤ 2 with no post. The forward lift has the same seam and passed review.
- **R7. Kerfur.** The landing rig draws the node-shell proxy, while the page draws the procedural body. The page record's quat makes the *pose* exact, but the object changes at the seam. That is today's behaviour too. The long-term fix is to give `makeNodeRig` Kerfur's `buildModel`.
- **R8. The holder-pose convention.** `projects.js` `rigPose` "matches this project's page hero" by comment only. The quat record makes the reverse independent of it, but the forward seam still relies on it.
- **R9. The origin semantics change** (D3): visitors arriving by direct link no longer land on the reel.

## 9. Owner decisions (the build takes the default)

- **D1. The arrival curve.** A literal time-reverse of the forward's ease-out is an ease-in, which hits the card at 3× the average speed: about 670°/s of spin and about 20 px per frame, then stops dead into a two-frame hand-over. **Default: easeInOutCubic.** Same path, same turn, a soft lift off the hero and a soft landing. `REVERSE_EASE = "mirror"` switches to the literal reverse.
- **D2. The page's exit behaviour.** Today the hero re-centres to `handoffScale` and spins 0.0019 rad/ms (about 78°) before the landing even loads. **Default: the hero holds still while the chrome fades.** The whole turn is the flight's −268°, a true mirror of the page's arrival hold.
- **D3. Where "no origin" lands** (direct link, All Projects, menu-arrived, or a field tile clicked from About). **Default: the title, with the node greeting you.** Today it is the reel stop for featured nodes.
- **D4. The phone greeting clamp.** It also moves the first-visit greeting card on portrait phones, which is off screen today. **Default: yes.**
- **D5. Browser Back with bfcache plays the reverse** instead of today's instant cut. **Default: yes,** and any input skips to the end state.
- **D6. Seam capture on ← UNIVERSE only, not in `pagehide`.** A synchronous WebP encode on every leave would tax every navigation. **Default: yes.** A Back without bfcache appears from the veil, with an exact pose.
- **D7. The menu's "Selected work" from a project page stays a plain navigation** with no flight. **Default: yes.** The menu covers the hero, so there is nothing to fly.
