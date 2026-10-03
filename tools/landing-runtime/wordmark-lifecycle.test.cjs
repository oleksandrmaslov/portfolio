const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Babel=require('@babel/standalone');
function fixture(){
 const effects=[],pending=new Map(),classes=new Set();let id=0,writes=0;
 const window=new EventTarget(),document=new EventTarget();
 Object.assign(window,{innerHeight:800});Object.assign(document,{hidden:false,body:{classList:{contains:k=>classes.has(k)}}});
 const el={getBoundingClientRect:()=>({top:500,bottom:780,left:0,right:700,width:700,height:280}),set innerHTML(v){writes++;},textContent:''};
 const React={useRef:()=>({current:el}),useEffect:fn=>effects.push(fn),createElement:()=>null};
 const code=Babel.transform(fs.readFileSync(path.join(__dirname,'../../app/landing/components/ascii-wordmark.jsx'),'utf8'),{presets:['react']}).code;
 const observer=class{observe(){}disconnect(){}};
 vm.runInNewContext(code,{React,window,document,Float32Array,IntersectionObserver:observer,ResizeObserver:observer,requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id)});
 window.AsciiHero({});const cleanup=effects[0]();
 const tick=t=>{const fs=[...pending.values()];pending.clear();fs.forEach(fn=>fn(t));};
 return {window,classes,tick,cleanup,get writes(){return writes;},get callbacks(){return pending.size;}};
}
test('opaque menu stops hidden wordmark mutations and RAF, closing wakes it once',()=>{
 const f=fixture();f.tick(100);assert.equal(f.writes,1);
 f.classes.add('mo-menu-settled');f.window.dispatchEvent(new Event('mo:menu-settled'));
 f.tick(200);assert.equal(f.writes,1,'covered wordmark must not rewrite its glyph DOM');assert.equal(f.callbacks,0);
 f.classes.delete('mo-menu-settled');f.window.dispatchEvent(new Event('mo:menu'));f.window.dispatchEvent(new Event('mo:menu'));
 assert.equal(f.callbacks,1);f.tick(300);assert.equal(f.writes,2);f.cleanup();assert.equal(f.callbacks,0);
});
