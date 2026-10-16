// The flight engine's maths (window.moFlight in solid-hero-rig.jsx), which both directions share.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Babel=require('@babel/standalone');
const src=fs.readFileSync(path.join(__dirname,'../../app/projects/rendering/solid-hero-rig.jsx'),'utf8');
const window={};
vm.runInNewContext(Babel.transform(src,{presets:['react']}).code,{window,sessionStorage:{getItem:()=>null,removeItem(){}}});
const F=window.moFlight,TAU=2*Math.PI,DEG=Math.PI/180;
const wrap=(a)=>a-TAU*Math.round(a/TAU);

test('turn: lands exactly, the long way unless the short way already turns min',()=>{
 for(let i=0;i<5000;i++){
  const from=(Math.random()-.5)*20,to=(Math.random()-.5)*20,min=Math.random()<.5?180:150;
  const t=F.turn(from,to,min);
  assert.ok(Math.abs(wrap(from+t-to))<1e-9,'lands on the target yaw');
  const a=Math.abs(t)/DEG;
  assert.ok(a>=min-1e-6&&a<=360+1e-6,'in ['+min+', 360]: '+a);
  const d=Math.abs(wrap(to-from))/DEG;
  assert.ok(Math.abs(a-(d>=min-1e-6?d:360-d))<1e-6,'the short way only when it turns min');
 }
 assert.ok(Math.abs(F.turn(0,30*DEG)/DEG+330)<1e-9,'30 short -> 330 the other way');
 assert.ok(Math.abs(F.turn(0,-100*DEG)/DEG-260)<1e-9);
 assert.ok(Math.abs(F.turn(0,160*DEG,150)/DEG-160)<1e-9,'the dock keeps a short way of 150+');
 assert.ok(Math.abs(Math.abs(F.turn(1,1))/DEG-360)<1e-9,'no delta: a whole turn');
});

test('ease: 0 to 1, monotonic, end slope m',()=>{
 for(const m of [0,.4,1.2]){
  assert.equal(F.ease(0,m),0);assert.equal(F.ease(1,m),1);
  let prev=0;for(let i=1;i<=1000;i++){const v=F.ease(i/1000,m);assert.ok(v>=prev-1e-12);prev=v;}
  const h=1e-6;assert.ok(Math.abs((F.ease(1,m)-F.ease(1-h,m))/h-m)<1e-4,'end slope');
  assert.ok(Math.abs(F.ease(h,m)/h)<1e-4,'start slope 0');
 }
});

test('settle: from rest, peak 1, back by BACK, gone by END',()=>{
 const S=F.SETTLE;
 assert.equal(F.settle(0),0);
 assert.ok(Math.abs(F.settle(S.PEAK)-1)<1e-9);
 assert.ok(Math.abs(F.settle(S.BACK))<1e-9);
 assert.equal(F.settle(S.END),0);
 assert.ok(Math.abs(Math.min(...Array.from({length:300},(_,i)=>F.settle(S.BACK+i))))<0.1,'the second lobe stays under 10%');
 const h=1e-4;assert.ok(Math.abs(F.settle(h)/h-S.SLOPE)/S.SLOPE<1e-3,'SLOPE is its start velocity');
 assert.ok(S.PEAK>70&&S.PEAK<110&&S.BACK<=300);
});

test('clock: drawn time, at most 50 ms a frame',()=>{
 const c=F.clock(1000);c.tick(16);c.tick(400);
 assert.equal(c.ms,66);assert.ok(Math.abs(c.p-.066)<1e-12);
 for(let i=0;i<100;i++)c.tick(16);assert.equal(c.p,1);
});

test('ease: a strong in-out, its fastest at mid-travel',()=>{
 const h=1e-4,sl=(t)=>(F.ease(t+h)-F.ease(t-h))/(2*h);
 assert.ok(sl(.5)>3,'peak speed over 3x the mean');
 for(const t of [.1,.3,.45,.55,.7,.9]) assert.ok(sl(t)<sl(.5));
 assert.ok(F.ease(.1)<.01&&F.ease(.9)>.99,'long soft ends');
});
