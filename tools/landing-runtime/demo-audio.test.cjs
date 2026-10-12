const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
function harness() {
  const players = [];
  class Player {
    constructor() { this.context = {currentTime:0}; this.voices=[]; this.intent=false; this.running=false; players.push(this); }
    onState(fn) { this.listener=fn; fn({intent:false}); }
    start() { this.starts=(this.starts||0)+1; this.intent=true; this.running=true; this.listener({intent:true}); }
    stop() { this.intent=false; this.running=false; this.listener({intent:false}); }
    clearVoices() { this.voices=[]; }
    setVolume(v) { this.volume=v; }
    voice(event,at) { this.voices.push({...event,at}); }
  }
  const window={MOGenerativeField:Player};
  const context=vm.createContext({window, URL, document:{baseURI:'http://sound.test/Wafer.html'}});
  for(const file of ['music-score','sample-sound','wafer-sound','kerfur-sound','torch-sound','accel-sound'])
    vm.runInContext(read(`demo/${file}.js`),context);
  return {window,players};
}
test('four distinct compositions emit finite, playable events throughout a full cycle', () => {
  const {window}=harness();
  const kinds=new Set(JSON.parse(read('app/landing/audio/instruments.json')).directions.signal.entries.map(e=>e.kind));
  const fingerprints=new Set();
  for(const id of ['wafer','kerfur','torch','accel']) {
    const score=new window.MODemoMusic.DemoScore(id), events=[];
    score.motion(.8,.7);score.texture=true;
    for(let i=0;i<256;i++) events.push(...score.next());
    assert.ok(events.length>=88);
    for(const e of events) {
      assert.ok(kinds.has(e.kind));
      for(const key of ['note','gain','duration','delay','pan']) assert.ok(Number.isFinite(e[key]),`${id} ${key}`);
      assert.ok(e.gain>0 && e.gain<=.2);assert.ok(e.duration>0);
    }
    fingerprints.add(JSON.stringify(events));
    score.sleeping=true;
    for(let i=0;i<16;i++) assert.ok(score.next().every(e=>e.kind==='silk'||e.kind==='bass'));
  }
  assert.equal(fingerprints.size,4);
});
test('all controller sound calls resolve; no demo cue can run before start or after stop/mute', () => {
  const {window,players}=harness();
  for(const [slug,factory] of [['wafer','Wafer'],['kerfur','Kerfur'],['torch','Torch'],['accel','Accel']]) {
    const s=window[`make${factory}DemoSound`](), p=players.at(-1);
    const methods=[...read(`demo/${slug}-demo.js`).matchAll(/sound\.(\w+)\(/g)].map(m=>m[1]);
    for(const method of methods) assert.equal(typeof s[method],'function',`${slug}.${method}`);
    s.uiTick('on');assert.equal(p.voices.length,0);
    s.setMuted(true);s.start();assert.equal(p.starts,undefined);
    s.setMuted(false);s.uiTick('on');assert.equal(p.voices.length,1);
    s.setLevel(0);assert.equal(p.volume,0);
    s.setLevel(NaN);assert.equal(p.volume,0);
    s.stop();s.uiTick('on');assert.equal(p.voices.length,1);
    s.start();assert.equal(p.voices.length,0,'restart clears pending cues from the old session');
    s.setMuted(true);s.uiTick('on');assert.equal(p.voices.length,0);
  }
});
test('motion cues are bounded and Morse dots/dashes retain their duration', () => {
  const {window,players}=harness();
  const s=window.makeAccelDemoSound(),p=players.at(-1);s.start();
  for(let i=0;i<1000;i++) { s.setMotion(.8,.4);s.maxPing(); }
  assert.equal(p.voices.length,2);
  p.context.currentTime=.2;s.maxPing();assert.equal(p.voices.length,2);
  p.context.currentTime=1.7;s.maxPing();assert.equal(p.voices.length,3);
  const torch=window.makeTorchDemoSound(),t=players.at(-1);torch.start();
  torch.sosBeep(1,150);torch.sosBeep(3,150);
  assert.equal(t.voices[0].duration,.15);assert.equal(t.voices[1].duration,.45);
  assert.equal(t.voices[0].tail,0);
});
test('public demos load the sampler at its own URL and no legacy engine remains', () => {
  for(const page of ['Wafer','Kerfur','Ci-Clop','ZMK-PointAccel']) {
    const html=read(`${page}.html`);
    assert.ok(html.indexOf('audio/sample-engine.js')<html.indexOf('src="app/page-runtimes/'));
    assert.equal((html.match(/audio\/sample-engine.js/g)||[]).length,1);
  }
  for(const file of ['demo/field-core.js','app/landing/audio/carrier-field.js','app/landing/audio/score.js'])
    assert.equal(fs.existsSync(path.join(root,file)),false);
});


test('Wafer holds full chords with only one ornament every two bars', () => {
  const {window}=harness(),score=new window.MODemoMusic.DemoScore('wafer');
  score.motion(1,1);score.texture=true;
  const bars=Array.from({length:32},()=>score.next());
  assert.equal(bars[0].filter(e=>e.kind==='silk').length,4);
  assert.equal(bars.flat().filter(e=>e.kind==='marimba').length,1);
  assert.equal(bars.flat().filter(e=>e.kind==='wood'||e.kind==='ep').length,0);
  const s=window.makeWaferDemoSound();s.start();s.thock();s.keyRelease(false);
});

test('rendered keyboard atlas has four non-silent PCM contacts', () => {
  const wav=fs.readFileSync(path.join(root,'public/audio/wafer-keys.wav'));
  assert.equal(wav.toString('ascii',0,4),'RIFF');
  assert.equal(wav.readUInt32LE(24),32000);
  assert.equal(wav.length,128044);
  for(const [a,b] of [[0,.42],[.42,.84],[.84,.92],[.92,1]]) {
    let peak=0;
    for(let i=Math.round(a*32000);i<Math.round(b*32000);i++) peak=Math.max(peak,Math.abs(wav.readInt16LE(44+i*4)));
    assert.ok(peak>100 && peak<32767);
  }
});
