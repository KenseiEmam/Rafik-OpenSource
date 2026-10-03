import {chromium} from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import{writeFileSync}from'node:fs'
const browser=await chromium.launch();const results=[];const errors=[]
for(const width of (process.argv.includes('--phone-only')?[320,390]:[320,390,768,1440])){
 const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/local-preview?legacy=1');await page.getByRole('button',{name:/Laila Khoury/}).click();await page.waitForURL('**/coach')
 for(const lang of ['en','ar'])for(const theme of ['light','dark']){
  await page.evaluate(({lang,theme})=>{localStorage.setItem('rafik.locale',lang);localStorage.setItem('rafik.theme',theme)},{lang,theme})
  for(const path of ['/','/routine','/today','/history','/coach','/coach/plans','/coach/plans/new','/coach/clients','/coach/clients/40000000-0000-4000-8000-000000000001','/coach/exercises','/settings','/help','/privacy','/missing']){
   await page.goto('http://127.0.0.1:5173'+path);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);results.push({width,lang,theme,path,overflow})
   if(width===390&&lang==='ar'&&theme==='light'&&['/coach','/coach/plans/new','/coach/exercises','/coach/clients/40000000-0000-4000-8000-000000000001','/settings'].includes(path)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/matrix-${path.replaceAll('/','-')}-ar-phone.png`,fullPage:true,animations:'disabled'})}
  }
 }
 if(width===390){await page.goto('http://127.0.0.1:5173/coach/plans/new');await page.locator('.editor-title input').waitFor();const issues=(await new AxeBuilder({page}).analyze()).violations;results.push({accessibility:'Arabic dark editor',violations:issues.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))})}
 await context.close()
}
await browser.close();writeFileSync('artifacts/visual-matrix.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({screens:results.length,overflows:results.filter(r=>r.overflow),accessibility:results.filter(r=>r.violations),errors},null,2));if(errors.length||results.some(r=>r.overflow||r.violations?.length))process.exitCode=1
