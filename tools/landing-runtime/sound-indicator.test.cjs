const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Babel=require('@babel/standalone');
test('covered sound indicator sleeps without muting audio and resumes on close',()=>{
 const pending=new Map(),effects=[],classes=new Set();let id=0,writes=0;
 const window=new EventTarget(),document=new EventTarget();document.hidden=false;document.body={classList:{contains:k=>classes.has(k)}};
 window.MOSound={init(){},isMuted:()=>false,getLevel:()=>.1,onState:fn=>{fn({muted:false});return()=>{};}};
 const pathNode={setAttribute(){writes++;}};
 const React={useState:x=>[x,()=>{}],useRef:()=>({current:pathNode}),useEffect:fn=>effects.push(fn),createElement:()=>null};
 const source=fs.readFileSync(path.join(__dirname,'../../app/landing/app.jsx'),'utf8');
 const unit=source.slice(source.indexOf('function VolumeToggle'),source.indexOf('let landingMounted'))+'\nwindow.VolumeToggle=VolumeToggle;';
 vm.runInNewContext(Babel.transform(unit,{presets:['react']}).code,{React,window,document,useSA:React.useState,useEA:React.useEffect,useRA:React.useRef,requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id)});
 window.VolumeToggle();const cleanup=effects[0]();const tick=t=>{const fs=[...pending.values()];pending.clear();fs.forEach(fn=>fn(t));};
 tick(100);assert.equal(writes,1);
 classes.add('mo-menu-settled');window.dispatchEvent(new Event('mo:menu-settled'));tick(200);
 assert.equal(writes,1);assert.equal(pending.size,0);assert.equal(window.MOSound.isMuted(),false);
 classes.clear();window.dispatchEvent(new Event('mo:menu'));tick(300);assert.equal(writes,2);cleanup();assert.equal(pending.size,0);
});
