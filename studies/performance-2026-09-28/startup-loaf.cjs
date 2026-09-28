// Long-animation-frame attribution for a cold landing load (no fix claimed).
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('node:fs');
(async()=>{const headless=process.argv.includes('--headless');const b=await chromium.launch({channel:'chrome',headless});const p=await b.newPage({viewport:{width:1280,height:800}});try{
 const base=process.env.BASE||'http://localhost:8000/';
 await p.route('**/app/landing/preloader.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('function draw(now) {','function draw(now) { (window.__auditDraws ||= []).push({at:performance.now(),progress,target,core:hasCore()});').replace('function startHandoff() {','function startHandoff() { (window.__auditHandoffs ||= []).push(performance.now());').replace('hit[name] = true;','hit[name] = true; (window.__auditMarks ||= []).push({name,at:Math.round(performance.now())});')});});
 await p.addInitScript(()=>{window.__loaf=[];new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.duration<80)continue;window.__loaf.push({start:Math.round(e.startTime),dur:Math.round(e.duration),block:Math.round(e.blockingDuration),render:Math.round(e.renderStart?e.startTime+e.duration-e.renderStart:0),scripts:e.scripts.filter(s=>s.duration>20).map(s=>({dur:Math.round(s.duration),inv:s.invoker,type:s.invokerType,fn:s.sourceFunctionName,src:(s.sourceURL||'').split('/').pop().split('?')[0],pos:s.sourceCharPosition}))});}}).observe({type:'long-animation-frame',buffered:true});
  addEventListener('mo:preloader-done',()=>window.__auditReady=performance.now());});
 await p.goto(base);await p.waitForFunction(()=>window.__auditReady,null,{timeout:30000});await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({marks:__auditMarks,ready:Math.round(__auditReady),firstFrameAt:Math.round(__mo_firstFrameAt||0),handoffs:(window.__auditHandoffs||[]).map(Math.round),draws:(window.__auditDraws||[]).map(d=>({at:Math.round(d.at),p:+d.progress.toFixed(3),core:d.core})),loaf:__loaf}));
 fs.writeFileSync(__dirname+'/startup-loaf-'+(process.argv[2]||'run')+'.json',JSON.stringify(r,null,1));
 console.log('marks',r.marks.map(m=>m.name+'@'+m.at).join(' '),'| ready',r.ready,'| handoffs',r.handoffs);
 console.log('draws after core:',r.draws.filter(d=>d.core).map(d=>d.at+':'+d.p).join(' '));
 for(const l of r.loaf) console.log(l.start,'+'+l.dur,'block',l.block,'render',l.render,JSON.stringify(l.scripts));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
