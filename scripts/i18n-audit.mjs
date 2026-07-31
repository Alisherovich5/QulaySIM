/**
 * Checks the three locale files against each other and against the code.
 *
 * Written because a real bug hid here: three Google sign-in strings were
 * inserted next to `signIn`, which exists in both `nav` and `auth`, so they
 * landed under `nav`. The component asked for `auth.or` and the page rendered
 * the literal text "auth.or". Nothing failed to build, and nothing failed a
 * test — i18next returns the key when it cannot resolve it.
 *
 * Run with `npm run i18n:check`. Exits non-zero on a finding.
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const LANGS = ['uz', 'en', 'ru']
const BASE = 'en'

/**
 * Identical text across languages is usually an untranslated string, but not
 * always. These are the cases where sameness is correct, so they are excluded
 * rather than "fixed" into something wrong.
 */
const SAME_IS_FINE = [
  /^device\.(ios|android)Label$/, // "iPhone:", "Android:" — product names
  /^auth\.fullNamePlaceholder$/, // a person's name, deliberately one sample
  /^support\.adminUsername$/, // a Telegram handle
  /^common\.(usd|uzs)$/, // currency codes
  /^account\.(stamps|esimCount)$/, // "{{count}} eSIM" — eSIM does not decline
  /^plan\.mostPopular$/,
  /^auth\.emailPlaceholder$/, // an e-mail address, identical by design
  /^auth\.email$/, // "Email" is used as-is in Uzbek; Russian does differ
]

function loadLocale(lang) {
  const raw = readFileSync(`src/i18n/locales/${lang}.ts`, 'utf8')
  // The file is `const x: Translation = { … }` plus an import and an export.
  // Slice out the object literal and evaluate it; parsing TS here would be a
  // dependency for no gain.
  const start = raw.indexOf('= {') + 2
  const end = raw.lastIndexOf('}') + 1
  if (start < 2 || end <= start) throw new Error(`${lang}: could not find the object literal`)
  return eval(`(${raw.slice(start, end)})`)
}

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]],
  )

const locales = Object.fromEntries(LANGS.map((l) => [l, new Map(flatten(loadLocale(l)))]))
const everyKey = new Set(LANGS.flatMap((l) => [...locales[l].keys()]))
const findings = []

console.log(`keys: ${LANGS.map((l) => `${l}=${locales[l].size}`).join('  ')}`)

// 1. Parity — a key missing in one language renders as the key itself there.
for (const lang of LANGS) {
  const missing = [...everyKey].filter((k) => !locales[lang].has(k))
  if (missing.length) findings.push(`${lang} is missing ${missing.length}: ${missing.join(', ')}`)
}

// 2. Untranslated copy.
for (const lang of LANGS.filter((l) => l !== BASE)) {
  const untranslated = [...locales[lang]]
    .filter(([key, value]) => {
      if (typeof value !== 'string' || value.length < 4) return false
      if (SAME_IS_FINE.some((re) => re.test(key))) return false
      // Only flag text that actually contains prose.
      return value === locales[BASE].get(key) && /[a-z]{4}/.test(value)
    })
    .map(([key]) => key)
  if (untranslated.length) {
    findings.push(`${lang} still shows English for ${untranslated.length}: ${untranslated.join(', ')}`)
  }
}

// 3. Interpolation parity — a placeholder present in one language and not
//    another renders literal "{{name}}" to that language's users.
for (const key of everyKey) {
  const shapes = LANGS.map((lang) => {
    const value = locales[lang].get(key)
    if (typeof value !== 'string') return null
    return [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(',')
  }).filter((s) => s !== null)
  if (new Set(shapes).size > 1) {
    findings.push(`${key}: placeholders differ across languages (${shapes.join(' | ')})`)
  }
}

// 4. Keys the code asks for that no locale defines. The boundary before `t(`
//    matters: without it, getContext('webgl') and createElement('script') match.
const referenced = new Set(
  execSync(
    String.raw`grep -rhoE "[^A-Za-z0-9_]t\('[a-zA-Z0-9_.]+'" src/ | grep -oE "'[^']+'" | tr -d "'" || true`,
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean),
)
const undefinedKeys = [...referenced].filter((k) => k.includes('.') && !everyKey.has(k))
if (undefinedKeys.length) {
  findings.push(`used in code but defined nowhere: ${undefinedKeys.join(', ')}`)
}

if (findings.length === 0) {
  console.log('✅ no findings')
  process.exit(0)
}
for (const finding of findings) console.error(`❗ ${finding}`)
process.exit(1)
