const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='app/projects/rendering/model-viewer.jsx';
const source=process.env.MODEL_VIEWER_REF?execFileSync('git',['show',process.env.MODEL_VIEWER_REF+':'+file],{encoding:'utf8'}):fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function fixture(){
 const jobs=[],window=new EventTarget();
 const THREE={GLTFLoader:class{
  setKTX2Loader(ktx){this.ktx=ktx;return this;}
  load(url,resolve,progress,reject){jobs.push({url,resolve,reject,ktx:this.ktx});}
 },WebGLRenderer:class{dispose(){}forceContextLoss(){}}};window.THREE=THREE;
 vm.runInNewContext(source,{window,Event,console,Promise,Map,WeakSet,navigator:{userAgent:'',hardwareConcurrency:8}});
 const install=()=>THREE.KTX2Loader=class{setTranscoderPath(){return this;}setWorkerLimit(){return this;}detectSupport(){}};
 const succeed=i=>jobs[i].resolve({scene:{clone:()=>({ok:true})}});
 return {jobs,install,succeed,load:()=>window.loadProjectModel('texture.glb',THREE)};
}
test('an in-flight prewarm without KTX2 retries with a late decoder, without caching failure',async()=>{
 const f=fixture(),first=f.load();first.catch(()=>{});await flush();assert.equal(f.jobs.length,1);
 f.install();const second=f.load();second.catch(()=>{});f.jobs[0].reject(new Error('texture decoder missing'));await flush();
 assert.equal(f.jobs.length,2);assert.ok(f.jobs[1].ktx);f.succeed(1);assert.equal((await second).ok,true);
});
test('late texture support keeps already successful GLB cache entries',async()=>{
 const f=fixture(),first=f.load();await flush();f.succeed(0);await first;f.install();await f.load();assert.equal(f.jobs.length,1);
});
