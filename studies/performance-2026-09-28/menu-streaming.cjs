const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={errors:[],requests:0};
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:800}});
  let release;const gate=new Promise(resolve=>release=resolve);
  await ctx.route('**/models/wafer_demo.glb',async route=>{report.requests++;await gate;await route.continue();});
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://localhost:8000/Iskra.html');await page.locator('.lp-menuToggle').waitFor();
  await page.locator('.lp-menuToggle').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('dialog').dataset.liveObjects==='true');
  report.whileBlocked=await page.evaluate(()=>({open:document.querySelector('dialog').open,
   workReady:document.querySelector('[data-menu-object="work"]').dataset.modelReady,
   aboutReady:document.querySelector('[data-menu-object="about"]').dataset.modelReady,
   contactReady:document.querySelector('[data-menu-object="contact"]').dataset.modelReady,
   previewOpacity:getComputedStyle(document.querySelector('[data-menu-object="work"] img')).opacity,
   links:document.querySelectorAll('dialog nav a').length}));
  assert.ok(report.requests>0);assert.equal(report.whileBlocked.workReady,'false');
  assert.equal(report.whileBlocked.previewOpacity,'1');assert.equal(report.whileBlocked.links,4);
  assert.equal(report.whileBlocked.aboutReady,'true');assert.equal(report.whileBlocked.contactReady,'true');
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
  release();await page.waitForTimeout(1000);assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
  await page.locator('.lp-menuToggle').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-menu-object="work"]').dataset.modelReady==='true');
  await page.waitForTimeout(250);
  report.after=await page.evaluate(()=>({live:document.querySelector('dialog').dataset.liveObjects,
   workReady:document.querySelector('[data-menu-object="work"]').dataset.modelReady,
   previewOpacity:getComputedStyle(document.querySelector('[data-menu-object="work"] img')).opacity,
   canvasCount:document.querySelectorAll('dialog canvas').length}));
  assert.equal(report.after.live,'true');assert.equal(report.after.previewOpacity,'0');
  assert.equal(report.after.canvasCount,1);assert.deepEqual(report.errors,[]);
  await ctx.close();
 }catch(error){report.failure=error.stack;throw error;}
 finally{fs.writeFileSync(path.join(__dirname,'menu-streaming.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
