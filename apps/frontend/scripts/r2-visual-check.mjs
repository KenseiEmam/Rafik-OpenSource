import {chromium} from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import {writeFileSync} from 'node:fs'
const browser=await chromium.launch(), results=[], errors=[]
const rel='40000000-0000-4000-8000-000000000001',response='73000000-0000-4000-8000-000000000001',assessment='73000000-0000-4000-8000-000000000003'
for(const width of [320,390,768,1440])for(const coach of [true,false]){
 const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage()
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/local-preview');await page.getByRole('button',{name:coach?/Laila Khoury/:/Amir Hassan/}).click();await page.waitForURL(coach?'**/coach':'**/today')
 const routes=coach?['/coach/checkins','/coach/forms/new','/coach/checkins/'+response,'/coach/checkins/'+assessment,'/coach/messages/'+rel,'/coach/clients/'+rel+'/progress']:['/checkins','/checkins/'+response,'/checkins/'+assessment,'/messages/'+rel,'/progress']
 for(const lang of ['en','ar'])for(const theme of ['light','dark']){
  await page.evaluate(({lang,theme})=>{localStorage.setItem('rafik.locale',lang);localStorage.setItem('rafik.theme',theme)},{lang,theme})
  for(const route of routes){
   await page.goto('http://127.0.0.1:5173'+route);await page.locator('h1').waitFor();
   // Wait for the actual data surface; headings can render before the requests finish.
   if(route.includes('/messages/'))await page.locator('.message-compose').waitFor()
   else if(route.endsWith('/progress'))await page.locator('.progress-summary').waitFor()
   else if(route.endsWith('/checkins'))await page.locator('.roster-tools').waitFor()
   else if(route.endsWith('/new'))await page.locator('.question-editor').first().waitFor()
   else await page.locator('fieldset, .notice').first().waitFor()
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))})
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
   const check={width,coach,lang,theme,route,overflow}
   if(width===390){check.accessibility=(await new AxeBuilder({page}).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))}
   if((width===390&&lang==='ar'&&theme==='dark')||(width===1440&&lang==='en'&&theme==='light'))await page.screenshot({path:`artifacts/r2-matrix-${coach?'coach':'client'}-${route.replaceAll('/','-')}-${width}-${lang}.png`,fullPage:true,animations:'disabled'})
   results.push(check)
  }
 }
 await context.close()
}
await browser.close();writeFileSync('artifacts/r2-visual-matrix.json',JSON.stringify({results,errors},null,2))
console.log(JSON.stringify({screens:results.length,overflows:results.filter(r=>r.overflow),accessibility:results.filter(r=>r.accessibility?.length),errors},null,2))
if(errors.length||results.some(r=>r.overflow||r.accessibility?.length))process.exitCode=1
