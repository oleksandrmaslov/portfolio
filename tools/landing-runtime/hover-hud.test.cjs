const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Babel=require('@babel/standalone');
function fixture(){
  const effects=[],nodes=[],writes=[];
  const React={useRef:current=>({current}),useLayoutEffect:fn=>effects.push(fn),createElement(type,props,...children){
    const node={type,props:props||{},children,style:new Proxy({},{set(o,k,v){writes.push({property:k,value:v});o[k]=v;return true;}}),setAttribute(k,v){writes.push({attribute:k,value:v});}};
    if(props?.ref){if(typeof props.ref==='function')props.ref(node);else props.ref.current=node;}
    nodes.push(node);return node;
  }};
  const filename=process.env.HUD_SOURCE||path.join(__dirname,'../../app/landing/components/project-preview.jsx');
  const code=Babel.transform(fs.readFileSync(filename,'utf8'),{presets:['react']}).code;
  const window={};vm.runInNewContext(code,{React,window});
  const panelRef={current:null};window.UniverseHoverCard({project:{addr:'0x01'},panelRef});
  effects.forEach(fn=>fn());return {panel:panelRef.current,nodes,writes};
}
test('tracking a moving card only writes transforms, not layout or SVG geometry',()=>{
  const f=fixture();
  for(let i=0;i<60;i++)f.panel.__updateHUD([{x:100+i,y:150},{x:400+i,y:180},{x:380+i,y:510},{x:80+i,y:490}]);
  assert.ok(f.writes.length>60);
  assert.deepEqual([...new Set(f.writes.map(w=>w.property||w.attribute))],['transform']);
});
test('the outline still connects the four projected corners exactly',()=>{
  const f=fixture(),corners=[{x:100,y:150},{x:400,y:180},{x:380,y:510},{x:80,y:490}];
  f.panel.__updateHUD(corners);
  const lines=f.nodes.filter(n=>n.props.className?.includes('uhud__outline'));
  assert.equal(lines.length,4);
  lines.forEach((line,i)=>{
    const m=line.style.transform.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
    assert.equal(m[4],corners[i].x);assert.equal(m[5],corners[i].y);
    assert.ok(Math.abs(m[4]+28*m[0]-corners[(i+1)%4].x)<1e-7);
    assert.ok(Math.abs(m[5]+28*m[1]-corners[(i+1)%4].y)<1e-7);
    assert.ok(Math.abs(Math.hypot(m[2],m[3])-1)<1e-7,'stroke thickness is not scaled');
  });
});
