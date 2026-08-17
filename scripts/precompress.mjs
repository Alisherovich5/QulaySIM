#!/usr/bin/env node
/**
 * Compress the built assets once, at build time, instead of on every request.
 *
 * nginx re-compresses each response by default: the same bytes, gzipped again
 * for every visitor, at the lowest useful setting because it has to be fast.
 * Compressing here instead means maximum effort spent once and a smaller file
 * served — nginx's `gzip_static` picks up the .gz beside the original.
 *
 * Brotli files are written too. The image's nginx has no brotli module today, so
 * they cost a few seconds of build time and nothing else; the day it does — or
 * the day a CDN sits in front — they are already there.
 */

import { createReadStream, createWriteStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createBrotliCompress, createGzip, constants } from 'node:zlib'

const DIST = resolve(import.meta.dirname, '..', 'dist')
const COMPRESSIBLE = /\.(js|css|html|json|svg|xml|txt|webmanifest)$/
/** Below this, the header overhead outweighs the saving. */
const MIN_BYTES = 1024

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

let files = 0
let saved = 0
for await (const file of walk(DIST)) {
  if (!COMPRESSIBLE.test(file) || /\.(gz|br)$/.test(file)) continue
  const { size } = await stat(file)
  if (size < MIN_BYTES) continue

  await pipeline(createReadStream(file), createGzip({ level: 9 }), createWriteStream(file + '.gz'))
  await pipeline(
    createReadStream(file),
    createBrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: size,
      },
    }),
    createWriteStream(file + '.br'),
  )
  files += 1
  saved += size - (await stat(file + '.gz')).size
}

console.log(`precompress: ${files} fayl, gzip bilan ${(saved / 1024).toFixed(0)} KB tejaldi`)
