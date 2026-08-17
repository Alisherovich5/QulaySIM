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
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
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
