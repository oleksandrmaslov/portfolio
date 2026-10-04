const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Babel=require('@babel/standalone');
const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8');
const compile=(source,label)=>Babel.transform(source,{presets:['react'],filename:label}).code;
// Only core.jsx's back/forward-cache handler, not the cursor or model warm-up.
const core=read('app/shared/core.jsx');
const restoreSource=core.slice(core.indexOf('(function restorePersistedPage'),core.indexOf('})();',core.indexOf('(function restorePersistedPage'))+5);

function world(){
 const pending=new Map(),effects=[],classes=new Set(),store=new Map(),calls=[];let id=0;
 const window=new EventTarget(),document=new EventTarget();
 Object.assign(window,{scrollY:0,innerHeight:800,innerWidth:1280,location:{href:''}});
 Object.assign(document,{hidden:false,title:'',documentElement:{style:{setProperty(){}}},querySelector:()=>null,getElementById:()=>null,
  body:{classList:{contains:k=>classes.has(k),add:(...k)=>k.forEach(c=>classes.add(c)),remove:(...k)=>k.forEach(c=>classes.delete(c))}}});
 const rig={yaw:0,ready:true,update(){},render(){calls.push('render');},setSize(){},setIdle(on){calls.push('idle:'+on);},
  toHandoff(){calls.push('handoff');},nudgeYaw(){},resetOrbit(){calls.push('rest');},setLayout(){calls.push('layout');},
  beginHandoff(){},snapToLayout(){},setYawTarget(){},setYawRate(){},dispose(){}};
 window.makeWaferRig=()=>rig;
 const React={useState:x=>[x,()=>{}],useRef:x=>({current:x===null?{clientWidth:640,clientHeight:480}:x}),useEffect:fn=>effects.push(fn),createElement:()=>null,Fragment:'f'};
 const context={window,document,React,console,
  sessionStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  CustomEvent:class extends Event{constructor(type,o){super(type);this.detail=o?.detail;}},
  requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:i=>pending.delete(i),
  setTimeout:()=>0,clearTimeout(){},performance:{now:()=>0}};
 vm.createContext(context);
 vm.runInContext(compile(restoreSource,'core.jsx'),context);
 const tick=()=>{const fns=[...pending.values()];pending.clear();fns.forEach(fn=>fn(16));};
 const scrollTo=y=>{window.scrollY=y;window.dispatchEvent(new Event('scroll'));};
 const restore=()=>{const e=new Event('pageshow');e.persisted=true;window.dispatchEvent(e);};
 return {window,document,context,effects,pending,calls,classes,tick,scrollTo,restore};
}

function assertRestores(w,leave){
 w.tick();assert.ok(w.calls.includes('render'),'the stage renders at the top');
 w.scrollTo(5000);assert.equal(w.pending.size,0,'no callback while the stage is scrolled away');
 leave();assert.equal(w.window.__hv_exitSpin,true);assert.equal(w.classes.has('hv-exit'),true);assert.equal(w.pending.size,1,'leaving wakes the exit turn from any scroll depth');
 w.calls.length=0;w.tick();assert.ok(w.calls.includes('render'));
 w.calls.length=0;w.restore();
 assert.equal(w.window.__hv_exitSpin,false,'Back must not restore a spinning exit');
 assert.equal(w.classes.has('hv-exit'),false);
 assert.deepEqual(w.calls.filter(c=>c!=='render'),['rest','layout','idle:true'],'the hero returns to its rest layout');
 assert.equal(w.pending.size,0,'a restored page scrolled into the case file sleeps');
 w.scrollTo(0);assert.equal(w.pending.size,1,'and wakes at the stage');
}

test('shared project lifecycle: exit spin wakes, Back restores the rest pose and sleeps',()=>{
 const w=world();
 vm.runInContext(compile(read('app/projects/pages/project-page-lifecycle.jsx'),'lifecycle.jsx'),w.context);
 const L=w.window.MOProjectPageLifecycle;
 L.useHeroRigEffect({config:{addr:'0x03',hero:{}},project:{name:'Iskra',model:'m.glb'},stageRef:{current:{clientWidth:640,clientHeight:480}},
  rigRef:{current:null},demoRef:{current:false},setReady(){},heroLayoutParams:()=>({fracX:.34,scale:.88,offY:0}),applyHeroLayout:r=>r.setLayout(),idleDrift:true});
 const cleanup=w.effects[0]();
 assertRestores(w,()=>L.leaveToUniverse({addr:'0x03'}));
 cleanup();
});

test('Wafer page: no permanent loop, exit spin wakes, Back restores the rest pose and sleeps',()=>{
 const w=world();const stub=()=>null;
 Object.assign(w.context,{Cursor:stub,KeyButton:stub,WaferDemoLayer:stub,
  ReactDOM:{createRoot:()=>({render(){}})}});
 w.window.PROJECT_DATA={'0x01':{addr:'0x01',name:'Wafer'}};
 vm.runInContext(compile(read('app/projects/pages/wafer-page.jsx'),'wafer-page.jsx'),w.context);
 w.context.WaferProjectApp();
 const cleanups=w.effects.map(fn=>fn());
 assertRestores(w,()=>vm.runInContext('leaveToUniverse()',w.context));
 cleanups.forEach(fn=>typeof fn==='function'&&fn());
 assert.equal(w.pending.size,0);
});
