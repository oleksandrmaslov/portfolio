/* ============================================================
   M.O. SYSTEM — KERFUR FACE ENGINE  ·  node 0x02
   ------------------------------------------------------------
   A browser port of the firmware's face pipeline. This does NOT
   reinterpret Kerfur's face — it RUNS the production data:

     assets/face/kerfur_faces.json   (recipes, anchors, timing)
     assets/face/[parts]/*.svg       (the real 1-bit part art)

   …the same files tools/face_codegen.py compiles into
   kerfur_face_assets.c for the SSD1306. Pipeline mirrors
   src/ui/face_runtime.c: expression base → reaction rebase →
   blink profile → look solver → micro-animations → effects →
   indicators → 128×64 1-bit compose.

   window.makeKerfurFace(opts?) → {
     ready: Promise, canvas (128×64),
     setExpression(id, {instant}), expression,
     react(id) → durationMs, reaction,
     setLook(x, y)            // -100..100, eased by solver
     setIndicator(id|null), setOverlayText(str|null),
     spawnEffect(id, x, y, {loop}), clearEffects(),
     whiskerWiggle(),
     setBlinkScale(k), forceBlink(),
     update(now) → dirty      // call per frame; true if redrew
   }
   ============================================================ */
(function () {
  const JSON_URL = "assets/face/kerfur_faces.json";
  const ASSET_BASE = "assets/face/";
  const W = 128, H = 64;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  window.makeKerfurFace = function (opts = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    ctx.imageSmoothingEnabled = false;

    let DATA = null;
    const sprites = {};          // id → {c: canvas(white), w, h, ax, ay} | null for pupil_none
    const meta = {};             // id → raw item json
    let anchors = null;

    /* ---------- load: JSON + rasterize every SVG via the codegen's
       deterministic polygon pipeline (port of tools/face_codegen.py
       _bitmap_from_svg_primitives). The SVGs carry fill="none", so
       browser <img> rasterization yields BLANK sprites — the firmware
       pipeline ignores fill and point-samples path polygons instead:
       even-odd inside one element, OR across elements. ---------- */

    function parseTransform(points, transform) {
      if (!transform) return points;
      const m = transform.trim().match(/rotate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+))?\s*\)/);
      if (!m) return points;
      const a = (parseFloat(m[1]) * Math.PI) / 180;
      const ox = m[2] !== undefined ? parseFloat(m[2]) : 0;
      const oy = m[3] !== undefined ? parseFloat(m[3]) : 0;
      const cos = Math.cos(a), sin = Math.sin(a);
      return points.map(([px, py]) => {
        const dx = px - ox, dy = py - oy;
        return [ox + dx * cos - dy * sin, oy + dx * sin + dy * cos];
      });
    }

    function parsePathPolygons(d) {
      const tokens = d.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g) || [];
      const polygons = [];
      let points = [], i = 0, cx = 0, cy = 0, sx = 0, sy = 0;
      while (i < tokens.length) {
        const t = tokens[i++];
        if (t === "M") {
          if (points.length) polygons.push(points);
          cx = +tokens[i]; cy = +tokens[i + 1]; i += 2;
          sx = cx; sy = cy;
          points = [[cx, cy]];
        } else if (t === "L") { cx = +tokens[i]; cy = +tokens[i + 1]; i += 2; points.push([cx, cy]); }
        else if (t === "H") { cx = +tokens[i]; i += 1; points.push([cx, cy]); }
        else if (t === "V") { cy = +tokens[i]; i += 1; points.push([cx, cy]); }
        else if (t === "Z") {
          if (points.length && (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1])) points.push([sx, sy]);
          if (points.length) { polygons.push(points); points = []; }
        }
      }
      if (points.length) {
        if (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1]) points.push(points[0]);
        polygons.push(points);
      }
      return polygons;
    }

    function pointInPolygon(x, y, poly) {
      let inside = false;
      for (let k = 0; k < poly.length - 1; k++) {
        const [x1, y1] = poly[k], [x2, y2] = poly[k + 1];
        if ((y1 > y) !== (y2 > y) && y2 !== y1) {
          const xc = ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
          if (x < xc) inside = !inside;
        }
      }
      return inside;
    }

    async function loadSvgSprite(item) {
      if (!item.file) { sprites[item.id] = null; return; }
      try {
        const txt = await fetch(ASSET_BASE + item.file).then((r) => r.text());
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const root = doc.documentElement;
        const W2 = item.width, H2 = item.height;
        let vminx = 0, vminy = 0, vw = W2, vh = H2;
        const vb = root.getAttribute("viewBox");
        if (vb) {
          const p = vb.replace(/,/g, " ").split(/\s+/).filter(Boolean).map(Number);
          if (p.length === 4) { vminx = p[0]; vminy = p[1]; vw = p[2]; vh = p[3]; }
        }
        const groups = [];
        for (const el of root.children) {
          const tag = el.tagName.replace(/^.*:/, "");
          if (tag === "rect") {
            const x = parseFloat(el.getAttribute("x") || 0), y = parseFloat(el.getAttribute("y") || 0);
            const w = parseFloat(el.getAttribute("width") || 0), h = parseFloat(el.getAttribute("height") || 0);
            groups.push([parseTransform([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], el.getAttribute("transform"))]);
          } else if (tag === "path") {
            groups.push(parsePathPolygons(el.getAttribute("d") || ""));
          }
        }
        const c = document.createElement("canvas");
        c.width = W2; c.height = H2;
        const cc = c.getContext("2d");
        const img = cc.createImageData(W2, H2);
        const d = img.data;
        for (let py = 0; py < H2; py++) {
          const uy = vminy + ((py + 0.5) * vh) / H2;
          for (let px = 0; px < W2; px++) {
            const ux = vminx + ((px + 0.5) * vw) / W2;
            let on = false;
            for (const group of groups) {
              let gi = false;
              for (const poly of group) if (pointInPolygon(ux, uy, poly)) gi = !gi;
              if (gi) { on = true; break; }
            }
            if (on) {
              const idx = (py * W2 + px) * 4;
              d[idx] = d[idx + 1] = d[idx + 2] = 255;
              d[idx + 3] = 255;
            }
          }
        }
        cc.putImageData(img, 0, 0);
        sprites[item.id] = { c, w: W2, h: H2, ax: item.anchor_x, ay: item.anchor_y };
      } catch (e) {
        console.warn("[kerfur-face] sprite failed", item.id, e);
        sprites[item.id] = null;
      }
    }

    const ready = fetch(JSON_URL)
      .then((r) => r.json())
      .then((j) => {
        DATA = j;
        anchors = j.defaults.anchors;
        const jobs = [];
        for (const groupName of Object.keys(j.asset_groups)) {
          const g = j.asset_groups[groupName];
          for (const item of g.items) {
            meta[item.id] = Object.assign({ _group: groupName }, item);
            if (g.type === "bitmap_alpha") jobs.push(loadSvgSprite(item));
            else sprites[item.id] = null;
          }
        }
        return Promise.all(jobs);
      })
      .then(() => { dirty = true; });

    const expr = (id) => DATA.expressions.find((e) => e.id === id);
    const reac = (id) => DATA.reactions.find((r) => r.id === id);
    const micro = (id) => DATA.micro_animations.find((m) => m.id === id);

    /* ---------- state ---------- */
    let curExprId = "PET_EXPR_CALM";
    let curReaction = null;        // { def, t0, dur }
    let look = { x: 0, y: 0 };     // eased, -100..100
    let lookT = { x: 0, y: 0 };
    let microAnim = null;          // { def, t0 }
    let indicator = null;
    let overlayText = null;
    let effects = [];              // { id, x, y, t0, loop, dur }
    let wiggleT0 = -1;
    let blinkScale = 1;
    let dirty = true;
    let lastDraw = 0;

    /* blink scheduler (legacy profiles) */
    let blink = { closing: false, t0: 0, dur: 220, next: 1800 + Math.random() * 2500 };
    function scheduleBlink(now, profile) {
      const sleepy = profile === "blink_legacy_sleepy";
      blink.next = now + (sleepy ? 2200 + Math.random() * 2600 : 2600 + Math.random() * 3800) * blinkScale;
      blink.dur = sleepy ? 420 : 220;
    }

    /* ---------- slot composition (mirrors face_runtime compose) ---------- */
    function activeRecipe() {
      /* returns {slots, lookOffset, openness, special, exprDef, alternate} */
      const base = expr(curExprId) || expr("PET_EXPR_CALM");
      let e = base;
      let r = curReaction ? curReaction.def : null;
      if (r && r.compose_mode === "rebase" && r.base_expression) e = expr(r.base_expression) || base;

      const slots = {
        left_eye_white: e.left_eye_white,
        right_eye_white: e.right_eye_white,
        left_eyeball: e.left_eyeball,
        right_eyeball: e.right_eyeball,
        left_brow: e.left_brow,
        right_brow: e.right_brow,
        mouth: e.mouth,
        whiskers: e.whiskers,
      };
      const over = Object.assign({}, e.slot_overrides || {});
      let lookOff = { x: 0, y: 0 };
      let alternate = false;

      if (r) {
        for (const k of Object.keys(slots)) if (r[k] !== undefined) slots[k] = r[k];
        if (r.whiskers) slots.whiskers = r.whiskers;
        if (r.slot_overrides) for (const k of Object.keys(r.slot_overrides)) over[k] = r.slot_overrides[k];
        if (r.look_offset) lookOff = r.look_offset;
        if (r.id === "REACTION_NOTIF_PING") alternate = true;
      }
      return { slots, over, lookOff, exprDef: e, alternate, reaction: r };
    }

    function drawSprite(id, x, y, mirror) {
      const s = sprites[id];
      if (!s) return;
      if (mirror) {
        ctx.save();
        ctx.translate(x + s.w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(s.c, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(s.c, x, y);
      }
    }
    function cutSprite(id, x, y, mirror) {
      const s = sprites[id];
      if (!s) return;
      ctx.globalCompositeOperation = "destination-out";
      drawSprite(id, x, y, mirror);
      ctx.globalCompositeOperation = "source-over";
    }

    /* tiny 3×5 pixel font for the battery % overlay */
    const FONT = {
      "0": [7,5,5,5,7], "1": [2,6,2,2,7], "2": [7,1,7,4,7], "3": [7,1,7,1,7],
      "4": [5,5,7,1,1], "5": [7,4,7,1,7], "6": [7,4,7,5,7], "7": [7,1,2,2,2],
      "8": [7,5,7,5,7], "9": [7,5,7,1,7], "%": [5,1,2,4,5],
    };
    function drawText(str, x, y) {
      ctx.fillStyle = "#fff";
      let cx = x;
      for (const ch of str) {
        const rows = FONT[ch];
        if (rows) {
          for (let ry = 0; ry < 5; ry++)
            for (let rx = 0; rx < 3; rx++)
              if (rows[ry] & (4 >> rx)) ctx.fillRect(cx + rx, y + ry, 1, 1);
        }
        cx += 4;
      }
    }

    /* ---------- main compose ---------- */
    function compose(now) {
      const { slots, over, lookOff, exprDef, alternate } = activeRecipe();
      const A = anchors;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      /* look easing + solver scale */
      const sol = (meta[slots.left_eye_white] && meta[slots.left_eye_white].eye_solver) || { rx: 6, ry: 6 };
      const idle = exprDef.ambient_motion && exprDef.ambient_motion.includes("pupil_idle_drift")
        ? { x: Math.sin(now * 0.0011) * 1, y: Math.cos(now * 0.0007) * 1 } : { x: 0, y: 0 };
      let mx = 0, my = 0;
      if (microAnim) {
        const m = microAnim.def;
        const p = clamp((now - microAnim.t0) / m.duration_ms, 0, 1);
        const amp = p < 0.5 ? p * 2 : (m.params.return_to_base ? (1 - p) * 2 : 1);
        mx = (m.params.target_x / 100) * sol.rx * amp;
        my = (m.params.target_y / 100) * sol.ry * amp;
        if (p >= 1) microAnim = null;
      }
      const bx = (exprDef.base_look ? exprDef.base_look.x : 0) / 100 * sol.rx;
      const by = (exprDef.base_look ? exprDef.base_look.y : 0) / 100 * sol.ry;
      const px = clamp(bx + look.x / 100 * sol.rx + lookOff.x / 100 * sol.rx + idle.x + mx, -sol.rx - 2, sol.rx + 2);
      const py = clamp(by + look.y / 100 * sol.ry + lookOff.y / 100 * sol.ry + idle.y + my, -sol.ry - 2, sol.ry + 2);

      /* blink swap */
      const blinkProfile = exprDef.blink_profile;
      let blinking = blink.closing;
      if (blinkProfile === "blink_disabled" || exprDef.base_eye_openness === 0) blinking = false;
      /* blink white per codegen _default_blink_eye: NEEDY + LONELY cry */
      const blinkWhite = (curExprId === "PET_EXPR_LONELY" || curExprId === "PET_EXPR_NEEDY") ? "eye_white_blink_crying" : "eye_white_blink";

      /* alternate (NOTIF_PING): left eye flips every 500ms */
      let leftWhite = slots.left_eye_white, leftBall = slots.left_eyeball;
      if (alternate && Math.floor(now / 500) % 2 === 0) {
        leftWhite = (expr("PET_EXPR_CALM")).left_eye_white;
        leftBall = (expr("PET_EXPR_CALM")).left_eyeball;
      }

      const wiggle = wiggleT0 > 0 && now - wiggleT0 < 420 ? Math.round(Math.sin((now - wiggleT0) * 0.04) * 1.5) : 0;
      /* codegen merge_override semantics: x/y replace the base, dx/dy add */
      const o = (k) => over[k] || {};
      const pos = (baseX, baseY, k) => {
        const v = o(k);
        let x = v.x !== undefined ? v.x : baseX;
        let y = v.y !== undefined ? v.y : baseY;
        return [x + (v.dx || 0), y + (v.dy || 0)];
      };

      /* --- eye whites ---
         Asset anchors are ABSOLUTE left-eye draw positions (open_round
         at (17,16), blink at (21,30)…). The right eye is the same asset
         mirrored, shifted by the eye-pitch DX = right_eye_x - left_eye_x. */
      const DX = A.right_eye_x - A.left_eye_x;
      const lw = blinking ? blinkWhite : leftWhite;
      const rw = blinking ? blinkWhite : slots.right_eye_white;
      const lws = meta[lw], rws = meta[rw];
      if (lws) { const [x, y] = pos(lws.anchor_x, lws.anchor_y, "left_eye_white"); drawSprite(lw, x, y, false); }
      if (rws) { const [x, y] = pos(rws.anchor_x + DX, rws.anchor_y, "right_eye_white"); drawSprite(rw, x, y, !!rws.mirrorable); }

      /* --- pupils (cut from whites): eyeWhiteAbs + pupilAnchor + look --- */
      if (!blinking) {
        const lb = meta[leftBall], rb = meta[slots.right_eyeball];
        const lBase = lws || { anchor_x: A.left_eye_x, anchor_y: A.left_eye_y };
        const rBase = rws || { anchor_x: A.left_eye_x, anchor_y: A.left_eye_y };
        if (lb && sprites[leftBall]) {
          const [ox, oy] = pos(lb.anchor_x, lb.anchor_y, "left_eyeball");
          cutSprite(leftBall, Math.round(lBase.anchor_x + ox + px), Math.round(lBase.anchor_y + oy + py), false);
        }
        if (rb && sprites[slots.right_eyeball]) {
          const [ox, oy] = pos(rb.anchor_x, rb.anchor_y, "right_eyeball");
          cutSprite(slots.right_eyeball, Math.round(rBase.anchor_x + DX + ox + px), Math.round(rBase.anchor_y + oy + py), false);
        }
      }

      /* --- brows: direct slot positions (codegen: no anchor subtraction) --- */
      if (meta[slots.left_brow]) { const [x, y] = pos(A.brow_left_x, A.brow_left_y, "left_brow"); drawSprite(slots.left_brow, x, y, true); }
      if (meta[slots.right_brow]) { const [x, y] = pos(A.brow_right_x, A.brow_right_y, "right_brow"); drawSprite(slots.right_brow, x, y, false); }

      /* --- mouth: direct slot position --- */
      if (meta[slots.mouth]) { const [x, y] = pos(A.mouth_x, A.mouth_y, "mouth"); drawSprite(slots.mouth, x, y, false); }

      /* --- whiskers: codegen slot bases, right instance mirrored via
         the asset's mirror_right flag --- */
      const wh = meta[slots.whiskers];
      if (wh && sprites[slots.whiskers]) {
        const v = o("whiskers");
        const dx = (v.dx || 0), dy = (v.dy || 0);
        const wy = 46 + dy;
        drawSprite(slots.whiskers, 0 + dx + wiggle, wy, false);
        drawSprite(slots.whiskers, W - 1 - wh.width + dx - wiggle, wy, !!wh.mirror_right || !!wh.mirrorable);
      }

      /* --- effects --- */
      const keep = [];
      for (const ef of effects) {
        const s = sprites[ef.id];
        const age = now - ef.t0;
        if (!s) continue;
        let ex = ef.x, ey = ef.y, draw = true;
        if (ef.id === "effect_tear") {
          const cyc = age % 1400;
          ey = ef.y + Math.floor(cyc / 1400 * 10);
          draw = cyc < 1100;
        } else if (ef.id === "effect_zzz") {
          ey = ef.y - Math.floor((age % 2600) / 2600 * 4);
          draw = Math.floor(age / 2600) % 2 === 0 || true;
        } else if (ef.id === "effect_spark") {
          draw = Math.floor(age / 180) % 2 === 0;   // sparkle flicker
        }
        if (draw) drawSprite(ef.id, Math.round(ex), Math.round(ey), false);
        if (ef.loop || age < ef.dur) keep.push(ef);
      }
      effects = keep;

      /* --- indicator + overlay --- */
      if (indicator && sprites[indicator]) drawSprite(indicator, A.indicator_x, A.indicator_y, false);
      if (overlayText) drawText(overlayText, indicator ? A.indicator_x + 10 : A.overlay_x, A.overlay_y + 1);
    }

    /* ---------- public API ---------- */
    return {
      ready, canvas,
      get expression() { return curExprId; },
      get reaction() { return curReaction ? curReaction.def.id : null; },

      setExpression(id) {
        if (!DATA || !expr(id) || id === curExprId) return;
        curExprId = id;
        const e = expr(id);
        effects = effects.filter((ef) => ef.loop !== "expr");
        if (e.default_effects) {
          for (const fid of e.default_effects) {
            effects.push({ id: fid, x: anchors.effect_x, y: anchors.effect_y, t0: performance.now(), loop: "expr", dur: 1e9 });
          }
        }
        dirty = true;
      },

      react(id) {
        const r = reac(id);
        if (!DATA || !r) return 0;
        const now = performance.now();
        if (r.micro_animation) {
          microAnim = { def: micro(r.micro_animation), t0: now };
          dirty = true;
          return r.duration_ms;
        }
        curReaction = { def: r, t0: now, dur: r.duration_ms };
        if (r.temporary_effect) effects.push({ id: r.temporary_effect, x: anchors.effect_x, y: anchors.effect_y, t0: now, loop: false, dur: r.duration_ms });
        if (r.temporary_effects) for (const te of r.temporary_effects)
          effects.push({ id: te.effect_id, x: te.x, y: te.y, t0: now, loop: false, dur: r.duration_ms });
        if (r.indicator) indicator = r.indicator;
        if (r.whisker_wiggle) wiggleT0 = now;
        dirty = true;
        return r.duration_ms;
      },

      setLook(x, y) { lookT.x = clamp(x, -100, 100); lookT.y = clamp(y, -100, 100); },
      setIndicator(id) { indicator = id; dirty = true; },
      setOverlayText(s) { overlayText = s; dirty = true; },
      spawnEffect(id, x, y, o = {}) {
        effects.push({ id, x: x != null ? x : anchors.effect_x, y: y != null ? y : anchors.effect_y, t0: performance.now(), loop: !!o.loop, dur: o.dur || 1400 });
        dirty = true;
      },
      clearEffects() { effects = effects.filter((e) => e.loop === "expr"); dirty = true; },
      whiskerWiggle() { wiggleT0 = performance.now(); dirty = true; },
      setBlinkScale(k) { blinkScale = k; },
      forceBlink() { blink.closing = true; blink.t0 = performance.now(); dirty = true; },

      update(now) {
        if (!DATA || !anchors) return false;
        /* look easing */
        const sp = ((expr(curExprId) || {}).transition_speed || 40) / 40;
        look.x += (lookT.x - look.x) * 0.09 * sp;
        look.y += (lookT.y - look.y) * 0.09 * sp;
        const moving = Math.abs(lookT.x - look.x) > 0.5 || Math.abs(lookT.y - look.y) > 0.5;

        /* blink scheduler */
        const profile = (expr(curExprId) || {}).blink_profile;
        if (profile !== "blink_disabled") {
          if (!blink.closing && now > blink.next) { blink.closing = true; blink.t0 = now; dirty = true; }
          if (blink.closing && now - blink.t0 > blink.dur) { blink.closing = false; scheduleBlink(now, profile); dirty = true; }
        }

        /* reaction expiry */
        if (curReaction && now - curReaction.t0 > curReaction.dur) {
          if (curReaction.def.indicator && indicator === curReaction.def.indicator) indicator = null;
          curReaction = null;
          dirty = true;
        }

        const animating = moving || microAnim || effects.length > 0 || blink.closing ||
          (curReaction && curReaction.def.id === "REACTION_NOTIF_PING") ||
          ((expr(curExprId) || {}).ambient_motion || []).length > 0;

        /* redraw at ~30fps while animating, instantly when dirty */
        if (dirty || (animating && now - lastDraw > 33)) {
          compose(now);
          lastDraw = now;
          dirty = false;
          return true;
        }
        return false;
      },
    };
  };
})();
