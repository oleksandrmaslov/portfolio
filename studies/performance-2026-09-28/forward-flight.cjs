const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:process.env.HEADLESS!=='0',ignoreDefaultArgs:['--disable-back-forward-cache']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),result={errors:[]};
 page.on('pageerror',e=>result.errors.push(e.message));
 try{
  await page.goto('http://localhost:8000/');await page.waitForFunction(()=>!document.getElementById('mo-pl'));
  await page.evaluate(()=>__mo_universe.setExplore(true));await page.waitForTimeout(500);
  const box=await page.evaluate(()=>__mo_universe.tileBounds('0x01'));
  let hit=null;
  for(const offset of [0,70,120,-50]){
   const x=box.x+box.w/2,y=box.y+box.h/2+offset;
   await page.mouse.move(x,y);await page.waitForTimeout(350);
   if(await page.locator('.uhud').isVisible()){hit={x,y,offset};break;}
  }
  assert.ok(hit,'Wafer tile presents its HUD on pointer hover');result.hit=hit;
  await page.mouse.click(hit.x,hit.y);await page.waitForURL('**/Wafer.html');
  await page.waitForFunction(()=>window.__waferRig?.ready);await page.waitForTimeout(1600);
  result.arrived=true;await page.screenshot({path:path.join(__dirname,'output/playwright/after-forward-flight.png')});
  await page.getByRole('link',{name:/UNIVERSE/}).click();await page.waitForURL(url=>url.pathname==='/');
  await page.waitForFunction(()=>!document.getElementById('mo-pl'));await page.waitForTimeout(1600);
  result.returned=true;assert.equal(await page.locator('#mo-fallback').isVisible(),false);
  await page.goBack({waitUntil:'commit'});await page.waitForFunction(()=>location.pathname==='/Wafer.html');
  await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>!!window.__hv_exitSpin),false);
  result.restored=true;assert.equal(result.errors.length,0);
 }catch(e){result.failure=e.stack;throw e;}
 finally{fs.writeFileSync(path.join(__dirname,'forward-flight.json'),JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
