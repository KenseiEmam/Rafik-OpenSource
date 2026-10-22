import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import media from './src/content/exercise-media.json'
import { shellIdentity, shellWorker } from './build/offline-shell.ts'
export default defineConfig({
  envDir: resolve(import.meta.dirname, '../..'),
  plugins: [
    vue(),
    tailwindcss(),
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
              'exercise-media/CREDITS.txt',
              ...media.items.flatMap((item) =>
                item.frames.map((frame) => frame.path.replace('/v1/catalog/', '')),
              ),
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
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/artifacts/**', '**/test-results/**', '**/playwright-report/**'] },
  },
  build: { target: 'es2022' },
})
