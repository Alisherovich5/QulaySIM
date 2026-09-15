#!/usr/bin/env node
/**
 * Serve dist/ the way nginx does in production, for the browser tests.
 *
 * `vite preview` answers every unknown path with index.html, which means the
 * prerendered pages and the catalogue baked into them are never served — the two
 * things the smoke tests are there to check. This mirrors the real rule:
 *
 *     try_files $uri $uri/index.html /index.html
 *
 * Small on purpose. It exists so a test failure means the site broke, not that
 * the test harness differs from production.
 */

import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', 'dist')
const PORT = Number(process.argv[2] ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')

  /* /api belongs to the backend, and there isn't one here.
   *
   * Falling through to index.html for it — which the try_files rule below
   * would otherwise do — hands the app an HTML document where it expects a
   * JSON array, and the page white-screens. That is a property of this
   * harness, not of the site: nginx proxies /api to uvicorn and answers 502
   * when it is down, never 200 with a page in it. Answering JSON 404 keeps
   * the difference from being mistaken for a bug in the site. */
  if (url.pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' }).end('{"detail":"no backend"}')
    return
  }

  // normalize() before join() so "../" in a request cannot walk out of dist/.
  const asked = join(ROOT, normalize(url.pathname))
  const candidates = [asked, join(asked, 'index.html'), join(ROOT, 'index.html')]
  const file = candidates.find((p) => p.startsWith(ROOT) && existsSync(p) && statSync(p).isFile())

  if (!file) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    // Same split as production: hashed assets are immutable, HTML never is.
    'Cache-Control': file.endsWith('.html') ? 'no-store' : 'public, max-age=31536000, immutable',
  })
  createReadStream(file).pipe(res)
}).listen(PORT, '127.0.0.1', () => console.log(`dist/ served on http://127.0.0.1:${PORT}`))
