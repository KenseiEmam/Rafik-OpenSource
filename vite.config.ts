import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHash } from 'node:crypto'
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'rafik-offline-shell',
      apply: 'build',
      generateBundle(_options, bundle) {
        const assets = [
          ...new Set([
            '/',
            '/index.html',
            '/brand/rafik.png',
            ...Object.keys(bundle).map((path) => '/' + path),
          ]),
        ]
        const cache =
          'rafik-shell-' +
          createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0, 12)
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: `const CACHE=${JSON.stringify(cache)};const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rafik-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html',{ignoreVary:true})));return;}if(ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request,{ignoreVary:true}).then(hit=>hit||fetch(event.request)));});`,
        })
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { target: 'es2022' },
})
