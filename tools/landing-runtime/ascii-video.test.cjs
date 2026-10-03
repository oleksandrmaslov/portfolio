const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real engine with independently controlled display/video clocks.
// GPU calls are counted here; the shader and actual decoding are checked in-browser.
function fixture({ frameCallbacks = true, buffered = true } = {}) {
  const display = new Map(), frames = new Map();
  const uploads = [];
  let nextId = 0, now = 0, draws = 0;
  const gl = new Proxy({
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    createTexture: () => ({}),
    texImage2D: (...args) => uploads.push(args.at(-1)),
    drawArrays: () => draws++,
    getExtension: () => ({ loseContext() {} }),
  }, { get: (obj, key) => key in obj ? obj[key] : () => {} });
  const context = {
    performance: { now: () => now },
    requestAnimationFrame(fn) { const id = ++nextId; display.set(id, fn); return id; },
    cancelAnimationFrame(id) { display.delete(id); },
    document: { createElement: () => ({ getContext: () => ({ clearRect() {}, fillText() {} }) }) },
  };
  context.window = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../app/projects/components/ascii-photo.js'), 'utf8'), context);
  const canvas = { width: 640, height: 360, getContext: () => gl,
    getBoundingClientRect: () => ({ width: 640, height: 360 }) };
  const fx = new context.window.AsciiPhoto(canvas);
  const video = new EventTarget();
  Object.assign(video, { videoWidth: 640, videoHeight: 360, readyState: buffered ? 2 : 0, paused: false, ended: false });
  if (frameCallbacks) {
    video.requestVideoFrameCallback = fn => { const id = ++nextId; frames.set(id, fn); return id; };
    video.cancelVideoFrameCallback = id => frames.delete(id);
  }
  fx.loadVideo(video);
  const ticks = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const callbacks = [...display.values()]; display.clear();
      callbacks.forEach(fn => fn(now));
    }
  };
  const frame = () => {
    const callbacks = [...frames.values()]; frames.clear();
    callbacks.forEach(fn => fn(now, {}));
  };
  return { fx, video, frames, ticks, frame,
    get uploads() { return uploads.filter(source => source === video).length; },
    get draws() { return draws; }, get callbacks() { return display.size; } };
}

test('video uploads follow 24 new frames across 60 display ticks', () => {
  const f = fixture(); f.ticks();
  const start = f.uploads;
  for (let i = 0; i < 60; i++) {
    if (Math.floor((i + 1) * 24 / 60) > Math.floor(i * 24 / 60)) f.frame();
    f.ticks();
  }
  assert.equal(f.uploads - start, 24);
});

test('lens animation remains at display rate between video frames', () => {
  const f = fixture(); f.ticks();
  const uploads = f.uploads, draws = f.draws;
  f.fx.setHover(true); f.ticks(12);
  assert.equal(f.uploads, uploads);
  assert.equal(f.draws - draws, 12);
});

test('paused seeking updates the frame once without restarting playback', () => {
  const f = fixture(); f.video.paused = true; f.ticks();
  const start = f.uploads;
  f.video.dispatchEvent(new Event('seeked')); f.ticks(5);
  assert.equal(f.uploads - start, 1);
  assert.equal(f.video.paused, true);
});

test('legacy browsers retain playing updates and paused seeking', () => {
  const f = fixture({ frameCallbacks: false });
  const start = f.uploads; f.ticks(3);
  assert.equal(f.uploads - start, 3);
  f.video.paused = true; f.ticks(3);
  assert.equal(f.uploads - start, 3);
  f.video.dispatchEvent(new Event('seeked')); f.ticks();
  assert.equal(f.uploads - start, 4);
});

test('disposal cancels video callbacks and ignores late media events', () => {
  const f = fixture({ buffered: false });
  f.fx.destroy();
  assert.equal(f.frames.size, 0);
  f.video.readyState = 2;
  f.video.dispatchEvent(new Event('loadeddata'));
  f.video.dispatchEvent(new Event('seeked'));
  f.frame(); f.ticks();
  assert.equal(f.uploads, 0);
});

test('rebinding a video leaves one callback and one upload path', () => {
  const f = fixture();
  f.fx.loadVideo(f.video);
  assert.equal(f.frames.size, 1);
  const start = f.uploads;
  f.frame(); f.ticks(3);
  assert.equal(f.uploads - start, 1);
});


test('plain paused media sleeps until an interaction or decoded frame wakes it', () => {
  const f = fixture(); f.video.paused = true; f.ticks(5);
  assert.equal(f.callbacks, 0, 'an idle figure must own no display callback');
  const draws = f.draws;
  f.fx.setHover(true); f.ticks(2);
  assert.ok(f.draws > draws);
  f.fx.setHover(false); f.ticks(120);
  assert.equal(f.callbacks, 0);
  const uploads = f.uploads;
  f.video.dispatchEvent(new Event('seeked')); f.ticks();
  assert.equal(f.uploads, uploads + 1);
});

test('an offscreen converted figure stops rendering and resumes without another context', () => {
  const f = fixture(); f.fx.setConvert(true); f.ticks(5);
  const gl = f.fx.gl, draws = f.draws;
  f.fx.setVisible(false); f.ticks(60);
  assert.equal(f.callbacks, 0); assert.equal(f.draws, draws);
  f.fx.setPointer(.2,.4); f.frame(); f.ticks();
  assert.equal(f.callbacks, 0, 'hidden invalidation must not restart the loop');
  f.fx.setVisible(true); f.ticks();
  assert.equal(f.fx.gl, gl); assert.ok(f.draws > draws);
});
