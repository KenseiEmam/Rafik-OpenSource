import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
// A test-owned server allows real origin loss without WebKit's offline-emulation
// navigation error. It serves only the production build, then is shut down.
export async function staticPreview(transform?: (path: string, body: Buffer) => Buffer) {
  const root = resolve('dist')
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.png': 'image/png',
  }
  const server = createServer((request, response) => {
    let path = resolve(root, '.' + new URL(request.url || '/', 'http://localhost').pathname)
    if (!path.startsWith(root + sep) || !existsSync(path) || !extname(path))
      path = resolve(root, 'index.html')
    response.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream')
    const body = readFileSync(path)
    response.setHeader('Cache-Control', 'no-store')
    response.end(transform ? transform(path, body) : body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw Error('No test port')
  let stopped = false
  return {
    origin: `http://127.0.0.1:${address.port}`,
    async stop() {
      if (stopped) return
      stopped = true
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())))
    },
  }
}
