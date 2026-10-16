/* ============================================================
   WAFER — MOTION
   ------------------------------------------------------------
   The physics every transition runs on, from Apple's "Designing
   Fluid Interfaces" via .agents/skills/apple-design:
   · springs are set by damping ratio + response (seconds), not
     duration; they start from the live value and keep their
     velocity when re-targeted, so anything can be grabbed and
     reversed mid-flight without a seam;
   · momentum projects where a flick is going (Apple's
     exponential-decay form, not v²/2a);
   · boundaries rubber-band instead of stopping hard.
   ============================================================ */

export class Spring {
  constructor(value = 0, { damping = 1, response = 0.4 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.set({ damping, response });
  }

  set({ damping = this.damping, response = this.response } = {}) {
    this.damping = damping;
    this.response = response;
    const w = (2 * Math.PI) / Math.max(1e-3, response);
    this.k = w * w;
    this.c = 2 * damping * w;
    return this;
  }

  /* re-target without touching value or velocity: the motion bends, it never jumps */
  to(target, opts) {
    this.target = target;
    if (opts) this.set(opts);
    return this;
  }

  /* hard set, for reduced motion and first frames */
  snap(value) {
    this.value = this.target = value;
    this.velocity = 0;
    return this;
  }

  /* semi-implicit Euler in ≤ 4 ms steps: stable for every response used here */
  step(dt) {
    if (this.resting) return false;
    for (let t = 0; t < dt; t += 0.004) {
      const h = Math.min(0.004, dt - t);
      this.velocity += (-this.k * (this.value - this.target) - this.c * this.velocity) * h;
      this.value += this.velocity * h;
    }
    if (Math.abs(this.value - this.target) < 1e-5 && Math.abs(this.velocity) < 1e-4) {
      this.value = this.target;
      this.velocity = 0;
    }
    return true;
  }

  get resting() { return this.value === this.target && this.velocity === 0; }
}

/* Where a flick at `velocity` (units/s) comes to rest, given a per-ms
   deceleration rate (0.998 ≈ scroll, 0.99 ≈ snappy). */
export function project(velocity, rate = 0.998) {
  return ((velocity / 1000) * rate) / (1 - rate);
}

/* Progressive resistance past a boundary: the further, the less it follows. */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/* Apple's shipped presets (damping ratio, response in s). */
export const SPRINGS = {
  move: { damping: 1, response: 0.4 },     // reposition, no overshoot
  rotate: { damping: 0.8, response: 0.4 }, // rotation
  sheet: { damping: 0.8, response: 0.3 },  // drawer / sheet
  snap: { damping: 0.62, response: 0.18 }, // a magnetic catch: fast, one visible ring-down
};

/* ---------------- the magnet ---------------- */

/* Two magnet-ring-class rings attract along a very short-range curve (fitted to a
   magnetic-charge model of the ring pair: F(g) ∝ ((c + gc) / (c + g))^5.35,
   c = 2.8 mm, contact gap gc = 1 mm — 10 % strength 2 mm out). Real range is
   too short to see, so space is exaggerated 4×. Scene unit: cm. */
const MAG = { c: 0.28 * 4, gc: 0.1 * 4, n: 5.35 };
export const magnetPull = (gap) => Math.pow((MAG.c + MAG.gc) / (MAG.c + Math.max(0, gap)), MAG.n);   // 1 at contact gap

/* ---------------- the track ---------------- */

/* Every place in the study is a point on one line, 0 … count−1, and the
   object rides one body along it. Keys, the line under the stage and a hand
   on the halves all drive this one body, so they share one physics, and every
   value of it is a real pose (lab/places.js).

   A spring carries the body toward its target place. A place where Wafer
   physically attaches has a magnet: each side of it maps the last stretch of
   the line to a real gap, `{ w: places, cm }`. Inside the capture distance
   the spring lets go and the magnet's own force curve takes over: nothing,
   then a jump, accelerating all the way into a dead stop (Apple's fold
   detents lock, they do not bounce). A hand pulling against a lock strains it
   (tanh) until the pull clears the breakaway, then it lets go. */
export const MAGNET = {
  accel: 500,       // cm/s² at contact: ~165 ms from rest at the capture point, still accelerating
  capture: 1.2,     // cm — the 10 % point of the force curve
  breakaway: 1.4,   // cm of pull before a lock lets go: harder to detach than to attach
  strain: 0.35,     // cm of visible stretch, at most
  flyBy: 2.5,       // places/s: a hand moving faster than this passes a magnet without a catch
};
const HAND = (2 * Math.PI) / 0.06;   // a hand drives the body through a stiff, critically damped spring

export class Track {
  constructor(count, magnets = {}, { onCatch = null, onBreak = null, onPass = null } = {}) {
    Object.assign(this, { count, magnets, onCatch, onBreak, onPass });
    this.s = 0; this.v = 0; this.target = 0;
    this.locked = -1;   // the magnetic place holding the body, if any
    this.hand = null;   // where a hand is pulling it, in places
    this.strain = 0;    // visible stretch against a lock, in places
    this.ignore = -1;   // a magnet just broken away from, until the body clears its reach
    this.owned = -1;    // the magnet that has taken over the approach
    this.tune(0.45);
  }

  tune(response) { const w = (2 * Math.PI) / response; this.k = w * w; this.c = 2 * w; return this; }

  side(k, s) { const m = this.magnets[k]; return m && (s < k ? m.lo : m.hi); }
  /* real gap (cm) between the body at s and magnetic place k; Infinity outside its window */
  gap(k, s = this.s) {
    const sd = this.side(k, s), d = Math.abs(k - s);
    return sd && d < sd.w ? (d / sd.w) * sd.cm : Infinity;
  }
  near(s = this.s) {
    let k = -1, gap = Infinity;
    for (const key of Object.keys(this.magnets)) { const g = this.gap(+key, s); if (g < gap) { gap = g; k = +key; } }
    return { k, gap };
  }
  /* 0..1: how hard the nearest magnet is pulling right now (the X-ray reads it) */
  pull() { return this.locked >= 0 ? 0 : magnetPull(this.near().gap); }

  /* travel to place k; a longer trip gets a slower spring, capped */
  go(k, response) {
    k = Math.max(0, Math.min(this.count - 1, Math.round(k)));
    this.target = k;
    this.tune(response || Math.min(1.1, 0.45 + 0.12 * Math.max(0, Math.abs(k - this.s) - 1)));
    return this;
  }
  /* jump straight there (reduced motion, tuning) */
  snap(k) {
    this.s = this.target = k; this.v = 0; this.hand = null; this.strain = 0;
    this.locked = this.magnets[k] ? k : -1; this.owned = this.ignore = -1;
    return this;
  }
  hold(h) { this.hand = h; return this; }
  /* let go: the velocity's sign decides (Apple), a flick projects further,
     and a release inside a magnet's reach is the magnet's to finish */
  release(v = this.v, lo = 0, hi = this.count - 1) {
    this.hand = null;
    if (this.locked >= 0) { this.target = this.locked; return this; }
    const far = this.s + project(v, 0.998);
    let k = Math.round(far);
    if (Math.abs(v) > 0.3) k = v > 0 ? Math.max(Math.ceil(this.s), k) : Math.min(Math.floor(this.s), k);
    this.v = v;
    return this.go(Math.max(lo, Math.min(hi, k)));
  }

  get value() { return this.s + this.strain; }
  get resting() { return this.hand === null && this.v === 0 && this.strain === 0 && this.s === this.target; }

  unlock() {
    const k = this.locked;
    this.locked = -1; this.ignore = k;
    if (this.onBreak) this.onBreak(k);
  }

  step(dt) {
    if (this.resting) return false;
    const from = this.s, strained = this.strain;
    for (let t = 0; t < dt; t += 0.004) {
      const h = Math.min(0.004, dt - t);
      if (this.locked >= 0) {
        const k = this.locked, sd = this.hand !== null ? this.side(k, this.hand) : null;
        if (sd) {
          const pull = (Math.abs(this.hand - k) / sd.w) * sd.cm;
          if (pull <= MAGNET.breakaway) {
            this.strain = Math.sign(this.hand - k) * Math.tanh(pull / 1.2) * MAGNET.strain * (sd.w / sd.cm);
            continue;
          }
          this.unlock();
        } else if (this.hand === null && this.target !== k) this.unlock();
        else { this.relax(h); continue; }
      }
      this.relax(h);
      if (this.ignore >= 0 && this.gap(this.ignore) > MAGNET.capture) this.ignore = -1;
      const { k, gap } = this.near(), dir = Math.sign(k - this.s);
      // a magnet takes the body once it is in reach and heading in (a slow hand counts);
      // from then on it is the magnet's until contact, whatever the hand does
      if (this.owned !== k || gap >= MAGNET.capture || (this.hand === null && this.target !== k)) this.owned = -1;
      if (this.owned < 0 && k >= 0 && k !== this.ignore && gap < MAGNET.capture && dir
        && (this.hand !== null ? Math.abs(this.v) < MAGNET.flyBy : this.target === k)) this.owned = k;
      if (this.owned >= 0) {
        // the magnet owns it: no spring, only its own force curve
        const sd = this.side(k, this.s);
        this.v += dir * MAGNET.accel * magnetPull(gap) * (sd.w / sd.cm) * h;
        this.s += this.v * h;
        if ((k - this.s) * dir <= 0) {
          const speed = (Math.abs(this.v) / sd.w) * sd.cm;   // closing speed, cm/s
          this.s = this.target = k; this.v = 0; this.locked = k; this.owned = -1;
          if (this.onCatch) this.onCatch(k, speed);
        }
        continue;
      }
      if (this.hand !== null) {
        this.v += (-HAND * HAND * (this.s - this.hand) - 2 * HAND * this.v) * h;
        this.s += this.v * h;
        if (Math.abs(this.s - this.hand) < 1e-4 && Math.abs(this.v) < 1e-3) { this.s = this.hand; this.v = 0; }   // held still: let the frame rest
        continue;
      }
      this.v += (-this.k * (this.s - this.target) - this.c * this.v) * h;
      this.s += this.v * h;
      if (Math.abs(this.s - this.target) < 1e-4 && Math.abs(this.v) < 1e-3) {
        this.s = this.target; this.v = 0;
        if (this.magnets[this.target]) this.locked = this.target;   // arrived without a catch (a snap): it is held all the same
      }
    }
    // a magnet passed without stopping gets a soft tick
    if (this.onPass) for (const key of Object.keys(this.magnets)) {
      const m = +key;
      if (m !== this.locked && (from - m) * (this.s - m) < 0) this.onPass(m);
    }
    return this.s !== from || this.strain !== strained || this.v !== 0;
  }

  relax(h) {
    if (!this.strain) return;
    this.strain *= Math.exp(-h / 0.05);
    if (Math.abs(this.strain) < 1e-6) this.strain = 0;
  }
}
