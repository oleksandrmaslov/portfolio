const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../app/landing/preloader.js'), 'utf8');

function loader(reduced = false) {
  let now = 0, id = 0;
  const timers = new Map(), frames = new Map(), events = [];
  const classes = () => ({ add() {}, remove() {} });
  const app = { inert: true, removeAttribute() {} };
  const root = { style: { setProperty() {} }, classList: classes(), setAttribute() {}, querySelector: () => null };
  const window = new EventTarget();
  const later = (fn, ms, interval = 0) => { timers.set(++id, { fn, at: now + ms, interval }); return id; };
  Object.assign(window, {
    scrollY: 0, THREE: { GLTFLoader: true }, React: {}, ReactDOM: {},
    matchMedia: () => ({ matches: reduced }),
    setTimeout: later, clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => later(fn, ms, ms), clearInterval: id => timers.delete(id),
    __mo_show_fallback: () => events.push({ name: 'fallback', at: now }),
    __mo_arrival_start: () => events.push({ name: 'arrival', at: now }),
  });
  window.addEventListener('mo:preloader-done', () => events.push({ name: 'done', at: now }));
  vm.runInNewContext(source, { window, performance: { now: () => now },
    document: { documentElement: { classList: classes() }, querySelectorAll: () => [], getElementById: id => id === 'mo-pl' ? root : app },
    sessionStorage: { getItem: () => null }, CustomEvent: Event,
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
  });
  function advance(to) {
    for (;;) {
      const next = [...timers].filter(([, t]) => t.at <= to).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [key, t] = next; now = t.at;
      if (t.interval) t.at += t.interval; else timers.delete(key);
      t.fn();
    }
    now = to;
  }
  function frame(to) { advance(to); const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); }
  function ready() { for (const name of ['universe-ready', 'first-frame', 'handoff-warm', 'title-ready']) window.dispatchEvent(new Event('mo:' + name)); }
  return { advance, frame, ready, events, frames, app };
}

test('ready loader completes in elapsed time even when animation callbacks stop', () => {
  const l = loader(); l.frame(100); l.ready();
  l.advance(1600);
  assert.ok(l.events.some(e => e.name === 'done'), 'all milestones arrived: do not wait for the 9s bailout');
  assert.equal(l.events.filter(e => e.name === 'done').length, 1);
  assert.equal(l.events.some(e => e.name === 'fallback'), false);
  assert.equal(l.app.inert, false);
  assert.equal(l.frames.size, 0);
});

test('loader preserves the visible easing, reveal and once-only completion', () => {
  const l = loader(); l.frame(100); l.ready();
  for (let at = 116; at < 1800; at += 16) l.frame(at);
  assert.equal(l.events.filter(e => e.name === 'done').length, 1);
  assert.ok(l.events.find(e => e.name === 'arrival').at >= 440);
  assert.ok(l.events.find(e => e.name === 'done').at < 1600);
  l.advance(12000);
  assert.equal(l.events.filter(e => e.name === 'done').length, 1);
});

test('missing scene milestones still wait for the failure deadline', () => {
  const l = loader(); l.advance(8500);
  assert.equal(l.events.length, 0);
  l.advance(10000);
  assert.equal(l.events.filter(e => e.name === 'fallback').length, 1);
  assert.equal(l.events.filter(e => e.name === 'done').length, 1);
});

test('reduced-motion completion needs no RAF and does not start the arrival motion', () => {
  const l = loader(true); l.advance(50); l.ready(); l.advance(600);
  assert.equal(l.events.filter(e => e.name === 'done').length, 1);
  assert.equal(l.events.some(e => e.name === 'arrival'), false);
  assert.ok(l.events.find(e => e.name === 'done').at >= 200);
});
