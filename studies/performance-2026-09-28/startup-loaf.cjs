// Long-animation-frame attribution for a cold landing load (no fix claimed).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('node:fs');const {execFileSync}=require('node:child_process');
(async()=>{const headless=process.argv.includes('--headless');const b=await chromium.launch({channel:'chrome',headless});const p=await b.newPage({viewport:{width:1280,height:800}});try{
 const base=process.env.BASE||'http://localhost:8000/';
 const cdp=process.env.CPU_PROFILE?await p.context().newCDPSession(p):null;
 if(cdp){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 // Experiment only: precompile the hidden handoff rig before its two warm paints.
 if(process.env.COMPILE_HANDOFF)await p.route('**/app/landing/runtime.js*',async route=>{
  const r=await route.fetch();let body=await r.text();
  const api='render:render,update:update,setSize:setSize,setModel:setModel';
  const prep='var promise=load.then(function(){return new Promise(';
  if(!body.includes(api)||!body.includes(prep))throw new Error('Handoff experiment no longer matches generated runtime');
  body=body.replace(api,api+',warmShaders:function(){return renderer.compileAsync(scene,camera)}');
  body=body.replace(prep,'var promise=load.then(function(){return rig.warmShaders()}).then(function(){return new Promise(');
  await route.fulfill({response:r,body});
 });
 if(process.env.GL_TIMING)await p.addInitScript(()=>{
  const contexts=new WeakMap();let id=0;window.__glTiming=[];
  for(const api of [WebGLRenderingContext,WebGL2RenderingContext])for(const name of ['getProgramParameter','getShaderParameter','getUniformLocation','texImage2D','texSubImage2D','bufferData','drawElements','drawArrays','compileShader','linkProgram']){
   const original=api.prototype[name];if(!original)continue;
   api.prototype[name]=function(...args){if(!contexts.has(this))contexts.set(this,++id);const start=performance.now();const result=original.apply(this,args),duration=performance.now()-start;if(duration>5)__glTiming.push({ctx:contexts.get(this),name,at:Math.round(start),ms:Math.round(duration)});return result;};
  }
 });
 await p.route('**/app/landing/preloader.js',async route=>{const r=await route.fetch();let source=process.env.PRELOADER_REF?execFileSync('git',['show',process.env.PRELOADER_REF+':app/landing/preloader.js'],{encoding:'utf8'}):await r.text();
  // Controlled scheduler test: stop only the loader's frames once core is ready.
  if(process.env.STOP_READY_RAF)source=source.replaceAll('raf = requestAnimationFrame(draw);','if (!hasCore()) raf = requestAnimationFrame(draw);');
  await route.fulfill({response:r,body:source.replace('function draw(now) {','function draw(now) { (window.__auditDraws ||= []).push({at:performance.now(),progress,target,core:hasCore()});').replace('function startHandoff() {','function startHandoff() { (window.__auditHandoffs ||= []).push(performance.now());').replace('hit[name] = true;','hit[name] = true; (window.__auditMarks ||= []).push({name,at:Math.round(performance.now())});')});});
 await p.addInitScript(()=>{window.__loaf=[];new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.duration<80)continue;window.__loaf.push({start:Math.round(e.startTime),dur:Math.round(e.duration),block:Math.round(e.blockingDuration),render:Math.round(e.renderStart?e.startTime+e.duration-e.renderStart:0),scripts:e.scripts.filter(s=>s.duration>20).map(s=>({dur:Math.round(s.duration),inv:s.invoker,type:s.invokerType,fn:s.sourceFunctionName,src:(s.sourceURL||'').split('/').pop().split('?')[0],pos:s.sourceCharPosition}))});}}).observe({type:'long-animation-frame',buffered:true});
  addEventListener('mo:preloader-done',()=>window.__auditReady=performance.now());});
 await p.goto(base);await p.waitForFunction(()=>window.__auditReady,null,{timeout:30000});await p.waitForTimeout(1500);
 if(cdp){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(__dirname+'/startup-cpu-'+(process.argv[2]||'run')+'.json',JSON.stringify(profile));}
 const r=await p.evaluate(()=>({marks:__auditMarks,ready:Math.round(__auditReady),firstFrameAt:Math.round(__mo_firstFrameAt||0),handoffs:(window.__auditHandoffs||[]).map(Math.round),draws:(window.__auditDraws||[]).map(d=>({at:Math.round(d.at),p:+d.progress.toFixed(3),core:d.core})),loaf:__loaf}));
 r.gl=await p.evaluate(()=>window.__glTiming||[]);r.conditions={preloaderRef:process.env.PRELOADER_REF||'working tree',stopReadyRAF:!!process.env.STOP_READY_RAF,glTiming:!!process.env.GL_TIMING,compileHandoff:!!process.env.COMPILE_HANDOFF};
 fs.writeFileSync(__dirname+'/startup-loaf-'+(process.argv[2]||'run')+'.json',JSON.stringify(r,null,1));
 console.log('marks',r.marks.map(m=>m.name+'@'+m.at).join(' '),'| ready',r.ready,'| handoffs',r.handoffs);
 console.log('draws after core:',r.draws.filter(d=>d.core).map(d=>d.at+':'+d.p).join(' '));
 for(const l of r.loaf) console.log(l.start,'+'+l.dur,'block',l.block,'render',l.render,JSON.stringify(l.scripts));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
