const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Babel=require('@babel/standalone');
function fixture({reduced=false}={}){
 const effects=[],observers=[],elements=[];
 const motion=new EventTarget();motion.matches=reduced;
 const document=new EventTarget();document.hidden=false;document.body={classList:{contains:()=>false}};
 const window=new EventTarget();window.devicePixelRatio=1;
 const React={useRef:current=>({current}),useState:x=>[x,()=>{}],useEffect:fn=>effects.push(fn),createElement(type,props,...children){
  if(typeof type!=='string')return null;
  const el=new EventTarget();Object.assign(el,{type,props:props||{},children,width:640,height:360,style:{},paused:true,readyState:2,videoWidth:640,videoHeight:360,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},getBoundingClientRect:()=>({left:0,top:0,width:640,height:360})});
  if(props?.ref)props.ref.current=el;elements.push(el);return el;
 }};
 class FX{constructor(){this.o={cell:8,cellAspect:1.8};this.converted=false;}loadVideo(){}setVisible(v){this.visible=v;}setHover(){}setConvert(v){this.converted=v;}toggleConvert(){return this.converted=!this.converted;}destroy(){}}
 window.AsciiPhoto=FX;
 class IO{constructor(fn,opts){this.fn=fn;this.opts=opts;observers.push(this);}observe(){}disconnect(){}}
 const code=Babel.transform(fs.readFileSync(path.join(__dirname,'../../app/projects/components/ascii-photo.jsx'),'utf8'),{presets:['react']}).code;
 vm.runInNewContext(code,{React,window,document,matchMedia:q=>q.includes('reduced-motion')?motion:{matches:false},IntersectionObserver:IO,Image:class{},console});
 window.AsciiMediaFigure({src:'clip.mp4',kind:'video'});const cleanup=effects[0]();
 const video=elements.find(e=>e.type==='video'),button=elements.find(e=>e.type==='button'&&e.props.className==='ascii-fig__play');
 function intersect(ratio){for(const o of observers.filter(o=>o.opts.rootMargin!=='1400px 0px'))o.fn([{isIntersecting:ratio>0,intersectionRatio:ratio}]);}
 return {video,button,intersect,cleanup,motion,document,canvas:elements.find(e=>e.type==='canvas'),window};
}
test('explicit video pause survives leaving and re-entering the viewport',()=>{
 const f=fixture();f.intersect(.9);assert.equal(f.video.paused,false);
 f.button.props.onClick();assert.equal(f.video.paused,true);
 f.intersect(0);f.intersect(.9);assert.equal(f.video.paused,true);f.cleanup();
});
test('reduced motion waits for an explicit play and responds to live preference changes',()=>{
 const f=fixture({reduced:true});f.intersect(.9);assert.equal(f.video.paused,true);
 f.button.props.onClick();assert.equal(f.video.paused,false);
 f.motion.dispatchEvent(new Event('change'));assert.equal(f.video.paused,true);f.cleanup();
});
test('hidden pages pause media and do not override explicit pause on return',()=>{
 const f=fixture();f.intersect(.9);f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(f.video.paused,true);f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(f.video.paused,false);f.button.props.onClick();
 f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(f.video.paused,true);f.cleanup();
});


test('ASCII conversion has a named keyboard control and prevents Space scrolling',()=>{
 const f=fixture();f.intersect(.9);
 assert.equal(f.canvas.props.role,'button');assert.equal(f.canvas.props.tabIndex,0);
 assert.match(f.canvas.props['aria-label'],/ASCII/);
 let prevented=0;
 for(const key of ['Enter',' '])f.canvas.props.onKeyDown({key,preventDefault(){prevented++;}});
 assert.equal(prevented,2);assert.equal(f.window.__asciiFigs[0].converted,false);f.cleanup();
});
