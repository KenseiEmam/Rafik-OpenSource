import {spawn,execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,openSync,closeSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
const web=resolve(import.meta.dirname,'..'),api=resolve(web,'../rafik-api'),stamp=Date.now(),database='rafik_browser_'+stamp,files='.local/browser-'+stamp,out=resolve(web,'artifacts/isolated-browser',String(stamp)),dist=resolve(out,'dist');
if(!readFileSync(resolve(api,'compose.yaml'),'utf8').startsWith('name: rafik-prisma-local'))throw Error('Local project required');
if(process.versions.node.split('.')[0]!=='22')throw Error('Node22 required');
mkdirSync(out,{recursive:true});
const env={...process.env,PORT:'55341',DATABASE_URL:`postgresql://rafik_api:rafik-local-api-only@127.0.0.1:55332/${database}`,MIGRATION_DATABASE_URL:`postgresql://rafik_migrate:rafik-local-migrations-only@127.0.0.1:55332/${database}`,RAFIK_TEST_ORIGINS:'http://127.0.0.1:5183,http://127.0.0.1:5184',RAFIK_TEST_API:'http://127.0.0.1:55341',RAFIK_TEST_WEB:'http://127.0.0.1:5183',RAFIK_TEST_PREVIEW:'http://127.0.0.1:5184',RAFIK_TEST_DATABASE:database,RAFIK_TEST_FILES:files,RAFIK_TEST_DIST:dist,VITE_API_URL:'http://127.0.0.1:55341',VITE_LOCAL_PREVIEW:'true'};
const children=[];let created=false;
const sql=(db,input)=>execFileSync('docker',['compose','exec','-T','db','psql','-U','rafik_migrate','-d',db,'-v','ON_ERROR_STOP=1'],{cwd:api,input,stdio:'pipe'});
const run=(cwd,program,args)=>new Promise((accept,reject)=>{const child=spawn(program,args,{cwd,env,stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?accept():reject(Error(program+' exited '+code)))});
function service(name,cwd,program,args){const fd=openSync(resolve(out,name+'.log'),'w'),child=spawn(program,args,{cwd,env,stdio:['ignore',fd,fd]});closeSync(fd);children.push(child);return child}
async function ready(url,child){for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Local service exited: '+url);try{if((await fetch(url)).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Local service did not start: '+url)}
try{
 for(const port of [55341,5183,5184]){let occupied=false;try{await fetch('http://127.0.0.1:'+port,{signal:AbortSignal.timeout(300)});occupied=true}catch{}if(occupied)throw Error('Test port already occupied: '+port)}
 sql('rafik',`CREATE DATABASE ${database};`);created=true;
 await run(api,resolve(api,'node_modules/.bin/prisma'),['migrate','deploy']);sql(database,readFileSync(resolve(api,'prisma/seed.sql')));
 const backend=service('api',api,resolve(api,'node_modules/.bin/tsx'),['server/index.ts']);await ready(env.RAFIK_TEST_API+'/health',backend);
 await run(web,resolve(web,'node_modules/.bin/vite'),['build','--outDir',dist]);
 const dev=service('web',web,resolve(web,'node_modules/.bin/vite'),['--host','127.0.0.1','--port','5183','--strictPort']);
 const preview=service('preview',web,resolve(web,'node_modules/.bin/vite'),['preview','--outDir',dist,'--host','127.0.0.1','--port','5184','--strictPort']);
 await ready(env.RAFIK_TEST_WEB,dev);await ready(env.RAFIK_TEST_PREVIEW,preview);
 console.log('Browser acceptance uses disposable data; preview ports/database remain untouched.');
 await run(web,resolve(web,'node_modules/.bin/playwright'),['test',...process.argv.slice(2)]);
}finally{
 for(const child of children){if(child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>{child.once('exit',r);setTimeout(r,2000)})}}
 if(created)sql('rafik',`DROP DATABASE ${database} WITH (FORCE);`);
 rmSync(resolve(api,files),{recursive:true,force:true});
 console.log('Isolated browser cleanup complete: '+out);
}
