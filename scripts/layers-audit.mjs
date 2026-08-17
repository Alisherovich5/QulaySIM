#!/usr/bin/env node
/**
 * The layering rule, enforced by a machine instead of by memory.
 *
 * The rule has been written down for a while — "ui/ knows nobody, pages/ knows
 * everybody" — and it has held because two people have been careful. Care does
 * not scale: the first time someone imports a page from inside a button, nothing
 * complains, and a month later the button cannot be moved without moving the
 * checkout with it.
 *
 * Dependencies point one way only:
 *
 *   lib        →  nothing of ours except lib
 *   ui         →  lib
 *   components →  ui, lib, context
 *   context    →  lib
 *   pages      →  anything
 *
 * Written as a script rather than an ESLint plugin because this project lints
 * with oxlint, and adding a second linter to hold one rule is a worse trade than
 * forty lines that say exactly what they check.
 *
 * Run: node scripts/layers-audit.mjs   (exit 1 on a violation)
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const SRC = resolve(import.meta.dirname, '..', 'src')

/** What each layer is allowed to reach for. */
const ALLOWED = {
  lib: new Set(['lib']),
  ui: new Set(['lib', 'ui']),
  context: new Set(['lib', 'context']),
  // i18n sits with lib rather than above: it depends only on lib, and the
  // language list is configuration a switcher has to read from somewhere.
  components: new Set(['lib', 'ui', 'context', 'components', 'data', 'i18n']),
  pages: new Set(['lib', 'ui', 'context', 'components', 'pages', 'data', 'i18n']),
  i18n: new Set(['lib', 'i18n']),
  data: new Set(['lib', 'data']),
}

function layerOf(path) {
  const [first, second] = relative(SRC, path).split('/')
  // `components/ui/Button.tsx` is the ui layer, not the components layer.
  if (first === 'components' && second === 'ui') return 'ui'
  return first
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) yield full
  }
}

const IMPORT = /(?:^|\n)\s*import\s[^'"]*['"](\.[^'"]+)['"]/g

const problems = []
for await (const file of walk(SRC)) {
  const layer = layerOf(file)
  const allowed = ALLOWED[layer]
  // Files directly in src/ (App.tsx, main.tsx) are the composition root and may
  // reach anywhere — that is what a root is for.
  if (!allowed) continue

  const source = await readFile(file, 'utf8')
  for (const [, spec] of source.matchAll(IMPORT)) {
    const target = resolve(file, '..', spec)
    if (!target.startsWith(SRC)) continue
    const targetLayer = layerOf(target)
    if (targetLayer === layer || allowed.has(targetLayer)) continue
    problems.push(`${relative(SRC, file)}  →  ${targetLayer}/  (${spec})`)
  }
}

if (problems.length) {
  console.error(`Qatlam qoidasi buzilgan — ${problems.length} joyda:\n`)
  for (const p of problems) console.error('  ' + p)
  console.error('\nBog\'liqlik faqat pastga qarashi kerak: lib → ui → components → pages.')
  process.exit(1)
}

console.log('Qatlamlar joyida: bog\'liqliklar faqat pastga qaraydi.')
