// Project hero after Wafer/Iskra → ← UNIVERSE → browser Back (bfcache), plus
// the Wafer page's idle callbacks deep in its case file.
// Usage: node back-restore.cjs <label> [base-url]   (base defaults to :8000)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path');
const label=process.argv[2]||'after',base=process.argv[3]||'http://localhost:8000/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:!!process.env.HEADLESS,ignoreDefaultArgs:['--disable-back-forward-cache']});
 const result={label,base,routes:[]};
 try{
  for(const route of ['Wafer.html','Iskra.html']){
   const ctx=await browser.newContext({viewport:{width:1280,height:800}});
   await ctx.addInitScript(()=>{
    addEventListener('pageshow',e=>window.__qaPersisted=e.persisted);
    const raf=window.requestAnimationFrame.bind(window);window.__rafTally={};
    window.requestAnimationFrame=fn=>raf(t=>{const k=fn.name||'anon';window.__rafTally[k]=(window.__rafTally[k]||0)+1;fn(t);});
   });
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const rig=route==='Wafer.html'?'__waferRig':'__pageRig';
   const deepTally=async()=>{await page.evaluate(()=>scrollTo(0,document.body.scrollHeight*0.5));await page.waitForTimeout(1500);
    await page.evaluate(()=>{window.__rafTally={};});await page.waitForTimeout(2000);return page.evaluate(()=>window.__rafTally);};
   await page.goto(base+encodeURI(route));await page.locator('.lp-menuToggle').waitFor();await page.waitForTimeout(2500);
   const fresh=await deepTally();
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(800);
   await page.getByRole('link',{name:/UNIVERSE/}).click();await page.waitForURL(u=>u.pathname==='/');await page.waitForTimeout(2500);
   await page.goBack({waitUntil:'commit'});await page.waitForFunction(r=>location.pathname==='/'+encodeURI(r),route);await page.waitForTimeout(1500);
   const restored=await page.evaluate(n=>({persisted:window.__qaPersisted,exitSpin:!!window.__hv_exitSpin,hvExit:document.body.classList.contains('hv-exit'),yaw:window[n]?.yaw}),rig);
   const y0=restored.yaw;await page.waitForTimeout(1000);restored.yawPerSecond=+((await page.evaluate(n=>window[n]?.yaw,rig))-y0).toFixed(3);
   await page.screenshot({path:path.join(__dirname,'output/playwright',`${label}-${route.replace(/\W/g,'')}-back-restore.png`)});
   const restoredDeep=await deepTally();
   result.routes.push({route,freshDeepRafPer2s:fresh,restored,restoredDeepRafPer2s:restoredDeep,errors});
   await ctx.close();
  }
 }catch(e){result.failure=e.stack;process.exitCode=1;}
 finally{fs.writeFileSync(path.join(__dirname,`back-restore-${label}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();}
})();
