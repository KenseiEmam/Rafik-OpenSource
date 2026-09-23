import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shellIdentity, shellWorker } from './build/offline-shell'
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'rafik-offline-shell',
      apply: 'build',
      enforce: 'post',
      writeBundle: {
        order: 'post',
        handler(options, bundle) {
          // Hash final files: Vite can still transform HTML/chunks during generateBundle.
          const outDir = resolve(options.dir || 'dist')
          const paths = [
            ...new Set([
              'index.html',
              'brand/rafik.png',
              ...Object.values(bundle).map((output) => output.fileName),
            ]),
          ]
          const contents = Object.fromEntries(
            paths.map((path) => [path, readFileSync(resolve(outDir, path))]),
          )
          writeFileSync(
            resolve(outDir, 'sw.js'),
            shellWorker(shellIdentity(contents), ['/', ...paths.map((path) => '/' + path)]),
          )
        },
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { target: 'es2022' },
})
