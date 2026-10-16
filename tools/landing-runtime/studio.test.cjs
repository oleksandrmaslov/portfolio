// app/projects/rendering/studio.js: what makes each preset the thing it is, the tone hook, the name table
// against the shipped models, the Wafer file's contract, the seam between the registries and the pages,
// and the studio's weight in every bundle. No browser, no three: THREE is a stub below.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const {pathToFileURL}=require('node:url');
const Babel=require('@babel/standalone');
const ROOT=path.join(__dirname,'../..');
const STUDIO=path.join(ROOT,'app/projects/rendering/studio.js');
const load=()=>import(pathToFileURL(STUDIO));

/* ---------- the stub: only what studio.js touches ---------- */
const lin=c=>(c<0.04045?c/12.92:((c+0.055)/1.055)**2.4);   // sRGB hex -> linear, as THREE.Color does
class Color{
 constructor(r,g,b){this.r=this.g=this.b=1;if(r!==undefined)this.set(r,g,b);}
 get isColor(){return true;}
 set(r,g,b){if(g!==undefined)return this.setRGB(r,g,b);if(r&&r.isColor)return this.copy(r);const v=typeof r==='string'?parseInt(r.slice(1),16):r;return this.setRGB(lin(((v>>16)&255)/255),lin(((v>>8)&255)/255),lin((v&255)/255));}
 setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}
 copy(c){return this.setRGB(c.r,c.g,c.b);}
 multiplyScalar(s){return this.setRGB(this.r*s,this.g*s,this.b*s);}
 clone(){return new Color().copy(this);}
}
class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}normalize(){const l=Math.hypot(this.x,this.y,this.z);this.x/=l;this.y/=l;this.z/=l;return this;}}
class Material{onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString();}}   // three's defaults
class MeshPhysicalMaterial extends Material{constructor(p){super();Object.assign(this,p);}}
const THREE={Color,Vector3,MeshPhysicalMaterial};
const luma=c=>0.2126*c.r+0.7152*c.g+0.0722*c.b;
const peak=c=>(c?Math.max(c.r,c.g,c.b):0);
const shader=()=>({uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <normal_fragment_maps>\n#include <roughnessmap_fragment>\n#include <tonemapping_fragment>\n#include <colorspace_fragment>'});
const glbJson=f=>{const b=fs.readFileSync(f);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());};

const DEFINING={
 anodisedBlack:m=>m.metalness===0&&m.ior===1.65&&m.roughness>=0.4&&!m.clearcoat,   // dyed oxide, a dielectric: not bare metal, not lacquered
 anodisedGreen:m=>m.metalness===0&&m.ior===1.65&&m.color.g>3*m.color.r&&!m.clearcoat,
 enamel:m=>m.metalness===0&&m.clearcoat>=0.5&&m.clearcoatRoughness<=0.25,            // paint under lacquer
 brushedPearl:m=>m.metalness===1&&m.anisotropy>0,
 chromeThinFilm:m=>m.metalness===1&&m.iridescence>0.2&&m.iridescence<1&&m.roughness<=0.2&&luma(m.color)<0.8&&m.iridescenceThicknessRange[1]>m.iridescenceThicknessRange[0],   // F0 < 1 or the film shows no colour
 pbtCap:m=>m.metalness===0&&!m.clearcoat&&m.roughness>=0.4,                            // dry
 nylonCap:m=>m.metalness===0&&!m.clearcoat&&m.roughness>=0.7,
 soldermask:(m,dark)=>m.clearcoat>0&&dark(m)&&m.metalness===0,
 mipGlass:m=>m.clearcoat===1&&m.clearcoatRoughness<=0.1&&m.metalness===0&&luma(m.color)>0.3&&peak(m.emissive)===0,   // reflective silver under clear glass: never emissive
 matteBlack:(m,dark)=>m.roughness>=0.55&&m.metalness===0&&!m.clearcoat&&dark(m),
 emissiveLegend:m=>peak(m.emissive)===1&&m.emissiveIntensity>0&&m.metalness===0,
 lensClear:m=>m.metalness===0&&m.clearcoat===1&&m.clearcoatRoughness<=0.1&&luma(m.color)>0.6&&peak(m.emissive)===0,   // pale and glassy: no glow of its own, nothing metal
};
const OLIVE='#5a6b2a';
const darkOn=stage=>m=>luma(m.color)<Math.max(0.03,stage.mat.floor+1e-9);   // black, or lifted exactly to the stage's floor

test('(a) every preset keeps its defining property on the hardware and the logo stage',async()=>{
 const S=await load();
 for(const [sn,stage] of Object.entries({HW_STAGE:S.HW_STAGE,LOGO_STAGE:S.LOGO_STAGE})){
  const P=S.presets(THREE,stage);
  for(const name of Object.keys(S.PRESETS)){
   const m=name==='tpuPrinted'?P.tpuPrinted(OLIVE):P[name]();
   assert.ok(m instanceof MeshPhysicalMaterial&&m.envMapIntensity===stage.mat.env,`${sn}/${name}: a physical material at the stage's env intensity`);
   if(name!=='tpuPrinted')assert.ok(DEFINING[name](m,darkOn(stage)),`${sn}/${name} lost its defining property`);
   if(!['emissiveLegend','chromeThinFilm','mipGlass','brushedPearl','enamel','anodisedGreen','tpuPrinted'].includes(name))
    assert.ok(luma(m.color)>=stage.mat.floor-1e-9,`${sn}/${name}: a base colour never sinks under the stage's floor`);
  }
 }
 assert.throws(()=>S.presets(THREE),/explicit stage/);
 assert.throws(()=>S.presets(THREE).tpuPrinted(),/explicit stage/);
 assert.throws(()=>S.presets(THREE,S.HW_STAGE).tpuPrinted(),/needs a colour/);
 const art={isTexture:true},board=S.presets(THREE,S.HW_STAGE).soldermask(art);
 assert.ok(board.map===art&&luma(board.color)===1,'soldermask(map) shows its artwork as authored, not through a dark tint');
 assert.deepEqual(S.METALS.map(m=>m.stage.mat.env),[1,1.8],'the thin-film chrome sees the room at 1, the brushed pearl at 1.8');
});

test('(b) apply() swaps by material name, keeps sealed colours and maps, reports the rest',async()=>{
 const S=await load(),P=S.presets(THREE,S.LOGO_STAGE),map={isTexture:true};
 const mk=(name,extra={})=>({isMesh:true,material:{name,color:new Color('#336699'),...extra}});
 const shared={name:'enamel-blue',color:new Color('#0036ff')};
 const a={isMesh:true,material:shared},b={isMesh:true,material:shared};
 const meshes=[mk('anodised-green'),mk('gradient-plate',{map}),mk('lit-pixels',{emissive:new Color('#777777')}),mk('iridescent-chrome'),mk('mystery'),a,b];
 const {unmapped}=P.apply({traverse:f=>meshes.forEach(f)});
 assert.ok(unmapped.join()==='mystery'&&meshes[4].material.name==='mystery','a material the table does not name is left alone and reported');
 assert.ok(meshes[0].material.color.g===new Color('#336699').g&&meshes[0].material.ior===1.65,'the sealed colour is kept; the surface is the preset\'s');
 assert.ok(meshes[1].material.map===map&&meshes[1].material.clearcoat>=0.5,'a gradient map rides along on its enamel');
 assert.ok(peak(meshes[2].material.emissive)===0&&meshes[2].material.clearcoat===1,'lit-pixels are reflective silver under glass, not a glow');
 assert.ok(meshes[3].material.iridescence===0.4&&meshes[5].material===meshes[6].material&&meshes[5].material!==shared,'a material shared by two meshes stays one material, and the sealed one is never edited');
 const lab=[mk('tpu-olive'),mk('pla-olive'),mk('lens-clear'),mk('led-white',{emissive:new Color('#ffffff')}),mk('led-red',{emissive:new Color('#ff1008')})];
 assert.equal(P.apply({traverse:f=>lab.forEach(f)}).unmapped.length,0,'tpu-olive, pla-olive, lens-clear, led-white and led-red all have rows');
 assert.ok(lab[0].material.customProgramCacheKey()==='studio-printLines'&&lab[1].material.customProgramCacheKey()==='studio-printLines','a printed part takes layer lines');
 assert.ok(Math.abs(lab[1].material.color.b-new Color('#336699').b)<1e-9,'and keeps the colour it was sealed with (tpuPrinted lends it)');
 assert.ok(lab[2].material.clearcoat===1&&peak(lab[2].material.emissive)===0&&luma(lab[2].material.color)>0.6&&lab[2].material.roughness<=0.12,'lens-clear is a pale glassy dome, not the MIP screen glass');
 assert.ok(peak(lab[3].material.emissive)===1&&lab[4].material.emissive.r===1&&lab[4].material.emissive.b<0.1,'an LED glows in the colour its material names');
 const rest=[mk('')];
 P.apply({traverse:f=>rest.forEach(f)},{'*':['anodisedGreen',0x4b5a32]});
 assert.ok(Math.abs(rest[0].material.color.r-lin(0x4b/255))<1e-9,'a material-less GLB takes one preset and an explicit colour');
 const warns=[],warn=console.warn;console.warn=m=>warns.push(m);
 try{for(let i=0;i<2;i++){const o={isMesh:true,material:new MeshPhysicalMaterial({name:'mystery',color:new Color('#336699')})};S.finish(THREE,{traverse:f=>f(o)},'models/unknown.glb');}}finally{console.warn=warn;}
 assert.ok(warns.length===1&&/models\/unknown\.glb.*mystery/.test(warns[0]),'finish() names an unmapped material once per URL');
});

test('(c) printed layer lines: along the part\'s Z, or along _printz when the drawn mesh carries it',async()=>{
 const S=await load(),P=S.presets(THREE,S.HW_STAGE);
 const m=P.tpuPrinted(OLIVE),sh=shader();
 m.onBeforeCompile(sh);
 assert.equal(sh.uniforms.uLayer.value,0.0002,'0.2 mm layers by default (the GLBs are in metres)');
 assert.ok(sh.uniforms.uLayerAxis.value.z===1&&sh.uniforms.uLayerAxis.value.x===0,'the print axis is the part\'s local Z');
 assert.match(sh.fragmentShader,/cos\(6\.2831853 \* vLayerPh\)/);
 assert.match(sh.fragmentShader,/fwidth\(vLayerPh\)/,'the lines fade by fwidth past the pixel grid');
 const sh2=shader();
 P.tpuPrinted(OLIVE,{layer:0.0004,axis:[0,1,0]}).onBeforeCompile(sh2);
 assert.ok(sh2.uniforms.uLayer.value===0.0004&&sh2.uniforms.uLayerAxis.value.y===1,'a printer with other layers, or an exporter that turned the axis, says so');
 // a merged model: each vertex carries its own print height
 const z=P.tpuPrinted(OLIVE),zs=shader(),draw=g=>z.onBeforeRender({},{},{},g);
 const merged={attributes:{_printz:{}}},plain={attributes:{position:{}}};
 draw(merged);   // the first draw of a merged mesh happens BEFORE the program compiles
 z.onBeforeCompile(zs);
 assert.match(zs.vertexShader,/attribute float _printz;/);
 assert.match(zs.vertexShader,/vLayerPh = \(uHasPrintZ > 0\.5 \? _printz : dot\(position, uLayerAxis\)\) \/ uLayer;/);
 assert.equal(zs.uniforms.uHasPrintZ.value,1,'a merged mesh drawn first still compiles with the attribute path on');
 z.uniformsNeedUpdate=false;draw(plain);
 assert.ok(zs.uniforms.uHasPrintZ.value===0&&z.uniformsNeedUpdate===true,'the same material drawing a mesh without _printz switches back and re-uploads');
 z.uniformsNeedUpdate=false;draw(plain);
 assert.equal(z.uniformsNeedUpdate,false,'nothing changed, nothing re-uploaded');
 z.onBeforeRender({},{},{},undefined);   // a draw hook never throws on a geometry-less call
});

test('(d) every grained preset shares one program; { grain: false } leaves none',async()=>{
 const S=await load(),P=S.presets(THREE,S.HW_STAGE);
 const grained=Object.entries(S.PRESETS).filter(([,p])=>p.grain).map(([k])=>k);
 assert.ok(grained.length>=3);
 for(const name of grained){
  const m=P[name](),sh=shader();
  assert.equal(m.customProgramCacheKey(),'studio-grain',name);
  m.onBeforeCompile(sh);
  assert.ok(sh.uniforms.uGrainScale.value===S.PRESETS[name].grain.scale&&sh.uniforms.uGrainRough.value===S.PRESETS[name].grain.rough,`${name}: scale and strength are uniforms`);
  assert.match(sh.vertexShader,/vGrainP = position;/);
  assert.match(sh.fragmentShader,/gn\(vGrainP \* uGrainScale\)/);
  assert.match(sh.fragmentShader,/fwidth\(vGrainP\.x \* uGrainScale\)/);
  const bare=P[name](undefined,{grain:false});
  assert.notEqual(bare.customProgramCacheKey(),'studio-grain',`${name} without grain`);
  assert.ok(!Object.prototype.hasOwnProperty.call(bare,'onBeforeCompile'),`${name} without grain has no hook`);
 }
 const scaled=P.pbtCap(undefined,{grain:{scale:0.5}}),ss=shader();scaled.onBeforeCompile(ss);
 assert.ok(ss.uniforms.uGrainScale.value===0.5&&ss.uniforms.uGrainRough.value===S.PRESETS.pbtCap.grain.rough&&scaled.customProgramCacheKey()==='studio-grain','a quantised mesh gives its own scale and keeps the program');
});

test('(e) tone() puts PBR Neutral inside the material, once, after every other hook',async()=>{
 const S=await load(),P=S.presets(THREE,S.HW_STAGE);
 for(const c of ['0.08','6.25','0.04','0.76','0.24','0.15'])assert.ok(S.NEUTRAL_GLSL.includes(c),`NEUTRAL_GLSL carries ${c}`);
 assert.match(S.NEUTRAL_GLSL,/uniform float uExposure, uToe;/);
 const plain=P.matteBlack(),key=plain.customProgramCacheKey();
 assert.equal(S.tone(plain),plain);
 assert.equal(plain.customProgramCacheKey(),key+'|neutral','the key is the prior key plus |neutral');
 const sh=shader();plain.onBeforeCompile(sh);
 assert.ok(sh.fragmentShader.includes('#include <common>'+S.NEUTRAL_GLSL),'the curve follows <common>');
 assert.ok(sh.fragmentShader.includes('gl_FragColor.rgb = max(neutral(gl_FragColor.rgb * uExposure), 0.0);')&&!sh.fragmentShader.includes('#include <tonemapping_fragment>'),'it replaces the renderer\'s tone mapping');
 assert.ok(sh.uniforms.uExposure.value===1&&sh.uniforms.uToe.value===S.TONE.toe,'spec exposure and toe');
 // chained: the printed part keeps its layer lines and gains the curve; the exposure is the look's
 const printed=P.tpuPrinted(OLIVE),u=S.exposure(0.5);
 S.tone(printed,u);S.tone(printed,S.exposure(2));
 assert.equal(printed.customProgramCacheKey(),'studio-printLines|neutral','idempotent: a second call changes nothing');
 const ps=shader();printed.onBeforeCompile(ps);
 assert.ok(ps.uniforms.uLayer&&/vLayerPh/.test(ps.vertexShader)&&ps.fragmentShader.includes('neutral(gl_FragColor.rgb * uExposure)'),'printLines\' replacements survive');
 assert.ok(ps.uniforms.uExposure===u&&Math.abs(u.value-2**0.5)<1e-12,'one uniform per look: one program serves every exposure');
 const led=P.emissiveLegend('#ff0000');led.toneMapped=false;
 S.tone(led);
 assert.ok(!Object.prototype.hasOwnProperty.call(led,'customProgramCacheKey'),'a toneMapped:false material is left alone');
 const grained=S.tone(P.pbtCap());
 assert.equal(grained.customProgramCacheKey(),'studio-grain|neutral');
 // a per-object copy keeps the grain and the curve (a plain clone() would drop both), and tone() leaves it alone
 MeshPhysicalMaterial.prototype.clone=function(){return Object.assign(new MeshPhysicalMaterial({}),{...this,onBeforeCompile:Material.prototype.onBeforeCompile,customProgramCacheKey:Material.prototype.customProgramCacheKey});};
 const own=S.copy(grained),cs=shader();
 assert.ok(own!==grained&&own.customProgramCacheKey()==='studio-grain|neutral','the copy compiles to the same program');
 own.onBeforeCompile(cs);
 assert.ok(cs.uniforms.uGrainScale&&cs.fragmentShader.includes('neutral(gl_FragColor.rgb * uExposure)'),'and carries the grain and Neutral');
 S.tone(own);assert.equal(own.customProgramCacheKey(),'studio-grain|neutral','a copy of a toned material is toned');
});

test('(f) the name table covers every shipped model, and no model brings a light or KTX2',async()=>{
 const S=await load(),dir=path.join(ROOT,'models'),seen=new Set();
 const files=fs.readdirSync(dir).filter(f=>f.endsWith('.glb')&&'models/'+f!==S.WAFER_URL);   // the Wafer is mapped by part, not by name
 for(const f of files){
  const json=glbJson(path.join(dir,f)),used=json.extensionsUsed||[];
  assert.ok(!used.includes('KHR_lights_punctual'),`${f}: a model never carries a light (the field's dress is the studio's)`);
  assert.ok(!used.includes('KHR_texture_basisu'),`${f}: the site loads no KTX2 transcoder`);
  for(const m of json.materials||[]){seen.add(m.name);assert.ok(m.name in S.BY_NAME,`${f}: material "${m.name}" has no row in BY_NAME`);}
 }
 for(const k of Object.keys(S.BY_NAME))assert.ok(seen.has(k)&&S.BY_NAME[k] in S.PRESETS,`BY_NAME row "${k}" names a material that exists and a preset that exists`);
 for(const url of Object.keys(S.LOOKS))assert.ok(fs.existsSync(path.join(ROOT,url)),`LOOKS key ${url} is a file`);
 assert.equal(S.look(),S.PROCEDURAL,'a hero with no URL is procedural');
 assert.deepEqual(S.look('models/iskra-mark.glb'),{kind:'logo'},'a URL without an entry is a logo');
});

test('(g) models/wafer.glb keeps its contract',async()=>{
 const S=await load(),json=glbJson(path.join(ROOT,S.WAFER_URL)),nodes=json.nodes,byName=new Map(nodes.map(n=>[n.name,n]));
 const keys=[];for(const s of ['L','R']){for(let r=0;r<3;r++)for(let c=0;c<5;c++)keys.push(`key_${s}_r${r}c${c}`);for(let t=0;t<3;t++)keys.push(`key_${s}_t${t}`);}
 const parts=['case_L','case_R','plate_L','plate_R','pcb_L','pcb_R','usbc_L','usbc_R','switches_L','switches_R','mcu','display_L','display_R','antenna_L','antenna_R','softoff_L','softoff_R'].concat(keys);
 for(const n of parts.concat(['screen_L','screen_R']))assert.ok(byName.has(n),`node ${n}`);
 const meshOf=n=>{const node=byName.get(n);return node.mesh!==undefined?node.mesh:(node.children||[]).map(i=>nodes[i].mesh).find(m=>m!==undefined);};
 assert.equal(new Set(keys.map(meshOf)).size,1,'the 36 keys share one mesh');
 for(const [d,s] of [['display_L','screen_L'],['display_R','screen_R']])assert.ok((byName.get(d).children||[]).some(i=>nodes[i].name===s),`${s} is a child of ${d}: it explodes with it`);
 for(const n of ['switches_L','switches_R','display_L','display_R']){
  const p=byName.get(n).extras&&byName.get(n).extras.palette;
  assert.ok(Array.isArray(p)&&p.length&&p.every(e=>/^#[0-9a-f]{6}$/i.test(e[0])&&e[1]>=0&&e[1]<=1&&(e[2]===0||e[2]===1)),`${n}: extras.palette [[hex, roughness, metalness, tag?]]`);
  if(/display/.test(n))assert.equal(p.filter(e=>e[3]==='active').length,1,`${n}: one active entry`);
 }
 assert.ok((json.extensionsRequired||[]).every(e=>['KHR_mesh_quantization','EXT_meshopt_compression'].includes(e)),'extensionsRequired ⊆ {KHR_mesh_quantization, EXT_meshopt_compression}');
 assert.ok((json.images||[]).length===2&&json.images.every(i=>i.mimeType==='image/png'),'the only textures are the two PNG panels');
 for(const side of ['L','R'])assert.ok(fs.statSync(path.join(ROOT,`models/wafer-pcb-${side}.webp`)).size>1000,`the explosions' PCB artwork ${side} ships beside it`);
});

test('(h) the registries name the studio\'s Wafer, and every page hero matches its flight',async()=>{
 const S=await load(),window={};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'app/data/projects.js'),'utf8'),{window});
 const reg=window.MO_PROJECT_BY_ADDR;
 assert.equal(reg['0x01'].model.src,S.WAFER_URL,'app/data/projects.js 0x01 src');
 for(const p of window.MO_PROJECTS)if(p.model&&p.model.ready)assert.ok(fs.existsSync(path.join(ROOT,p.model.src)),`${p.addr}: ${p.model.src} exists`);
 const data={window:{addEventListener(){}},console};
 vm.runInNewContext(Babel.transform(fs.readFileSync(path.join(ROOT,'app/projects/data.jsx'),'utf8'),{presets:['env','react'],sourceType:'script'}).code,data);
 assert.equal(data.window.PROJECT_DATA['0x01'].model,S.WAFER_URL,'app/projects/data.jsx 0x01 model');
 // every GLB page hero: the page boots on the flight's last frame, so fit and pose must be the flight's
 for(const [addr,file] of window.MO_PROJECTS.filter(p=>p.model&&p.model.ready&&p.file!=='Wafer.html').map(p=>[p.addr,p.file])){
  const html=fs.readFileSync(path.join(ROOT,file),'utf8');
  const block=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('window.PAGE_CONFIG'));
  const page={window:{},React:{createElement:()=>null,Fragment:'f'}};
  vm.runInNewContext(Babel.transform(block,{presets:['react'],sourceType:'script'}).code,page);
  const hero=page.window.PAGE_CONFIG.hero,m=reg[addr].model;
  assert.equal(hero.model,m.src,`${file} hero model is the registry's`);
  assert.equal(hero.modelFit,m.rigFit,`${file} modelFit equals ${addr} rigFit: the mark keeps its size through the flight`);
  assert.deepEqual({x:0,y:0,z:0,...hero.pose},{x:0,y:0,z:0,...m.rigPose},`${file} pose equals ${addr} rigPose`);
 }
});

// The build's Babel pass strips whitespace and comments but keeps every name: 9,419 B when the port landed (the
// moved lab code is most of it: presets 2.1 KB, the finishes 2.7 KB, the Wafer 1 KB).
test('(i) the studio costs at most 9.5 KB gzipped in every bundle',()=>{
 const code=Babel.transform(fs.readFileSync(STUDIO,'utf8'),{sourceType:'module',presets:[],plugins:['transform-modules-commonjs'],comments:false,compact:true,minified:true}).code;
 const gz=zlib.gzipSync(code,{level:6}).length;
 assert.ok(gz<=9728,`studio.js is ${gz} B gzipped`);
});
