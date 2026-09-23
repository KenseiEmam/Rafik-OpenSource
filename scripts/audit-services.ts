import { chromium, webkit } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { layoutIssues } from '../tests/layout-contract.ts'
const org='/organization/12000000-0000-4000-8000-000000000001'
const results:object[]=[], errors:object[]=[]
mkdirSync('artifacts/services-audit',{recursive:true})
for(const engine of [chromium,webkit]){
 const browser=await engine.launch()
 try{
  for(const [name,view,routes] of [
   ['Rania','admin',['/calendar','/calendar/new','/calendar/17000000-0000-4000-8000-000000000002','/analytics','/assessment-templates','/groups','/assessments/13000000-0000-4000-8000-000000000003']],
   ['Kareem','trainer',['/calendar','/analytics','/calendar/17000000-0000-4000-8000-000000000002']],
   ['Sara','trainee',['/calendar','/calendar/17000000-0000-4000-8000-000000000002','/assessments/13000000-0000-4000-8000-000000000003']],
  ] as const){
   const context=await browser.newContext({baseURL:'http://127.0.0.1:5173'}),page=await context.newPage()
   page.on('pageerror',e=>errors.push({engine:engine.name(),view,url:page.url(),message:e.message}));await page.goto('/local-preview');await page.getByRole('button',{name:new RegExp(name)}).click();await page.waitForURL(/organization/);await page.locator('h1').waitFor();await page.waitForLoadState('networkidle')
   for(const state of [{width:320,height:568,lang:'en',theme:'light'},{width:390,height:664,lang:'ar',theme:'dark'},{width:768,height:850,lang:'ar',theme:'light'},{width:1440,height:1000,lang:'en',theme:'dark'}]){
    await page.setViewportSize(state);await page.evaluate(s=>{localStorage.setItem('rafik.locale',s.lang);localStorage.setItem('rafik.theme',s.theme)},state)
    for(const path of routes){
     await page.goto(org+'/'+view+path);await page.locator('h1').waitFor();await page.locator('.loading-state').waitFor({state:'hidden'});await page.waitForLoadState('networkidle');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))})
     const issues=await layoutIssues(page),alerts=await page.locator('main [role=alert]').allTextContents(),axe=state.width===390?(await new AxeBuilder({page}).analyze()).violations.map(v=>v.id):[]
     const capture=`${engine.name()}-${view}-${path.replaceAll('/','-')}-${state.width}.png`
     if(state.width===320||state.width===390)await page.screenshot({path:'artifacts/services-audit/'+capture,fullPage:true,animations:'disabled'})
     results.push({engine:engine.name(),view,path,...state,issues,alerts,axe});if(issues.length||alerts.length||axe.length)console.log(results.at(-1))
    }
   }await page.waitForLoadState('networkidle');await context.close()
  }
 }finally{await browser.close()}
}
writeFileSync('artifacts/services-audit/results.json',JSON.stringify({results,errors},null,2));console.log(`${results.length} states; ${errors.length} page errors`)
if(errors.length||results.some((r:any)=>r.issues.length||r.alerts.length||r.axe.length))process.exitCode=1
