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
import { runInNewContext } from 'node:vm'

const LANGS = ['uz', 'en', 'ru']
const BASE = 'en'

/**
 * CLDR plural categories, and which ones each language actually uses.
 *
 * i18next resolves `t('a.b', { count })` to `a.b_one`, `a.b_other` and so on,
 * so a bare reference in the code is satisfied by the suffixed keys — and the
 * suffix SET differs per language: Russian needs four forms, English two,
 * Uzbek one. Comparing the raw key lists across languages would report both as
 * errors, which is how a correct plural first showed up as a bug here.
 */
const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other']
const PLURAL_RE = new RegExp(`_(${PLURAL_SUFFIXES.join('|')})$`)
const stem = (key) => key.replace(PLURAL_RE, '')
const isPlural = (key) => PLURAL_RE.test(key)

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

/**
 * Qo'shimcha modullar: kalitlarning bir qismi asosiy fayldan tashqarida
 * yashaydi. Audit ularni ham hisobga olishi kerak -- aks holda ishlab
 * turgan kalitni "aniqlanmagan" deb ko'rsatadi.
 *
 * Har biri `{ uz: {...}, ru: {...}, en: {...} }` shaklida eksport qiladi,
 * shuning uchun til bo'yicha kesib olinadi.
 */
const EXTRA_MODULES = [
  { path: 'src/i18n/locales/esim-status.ts', perLanguage: true },
]

function sliceObjectLiteral(raw, label) {
  const start = raw.indexOf('= {') + 2
  if (start < 2) throw new Error(`${label}: could not find the object literal`)
  let depth = 0
  let end = -1
  let inString = null
  let inComment = null
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    // Izohlar o'tkazib yuboriladi. Ularsiz "ko'rinadi" ichidagi apostrof
    // satr boshi deb o'qilib, qavs sanog'i chalkashadi va butun fayl
    // "unbalanced braces" bo'lib chiqadi.
    if (inComment) {
      if (inComment === 'line' && ch === '\n') inComment = null
      else if (inComment === 'block' && ch === '*' && raw[i + 1] === '/') {
        inComment = null
        i++
      }
      continue
    }
    if (inString) {
      if (ch === '\\') i++
      else if (ch === inString) inString = null
      continue
    }
    if (ch === '/' && raw[i + 1] === '/') {
      inComment = 'line'
      i++
    } else if (ch === '/' && raw[i + 1] === '*') {
      inComment = 'block'
      i++
    } else if (ch === "'" || ch === '"' || ch === '`') inString = ch
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) {
      end = i + 1
      break
    }
  }
  if (end < 0) throw new Error(`${label}: unbalanced braces in the object literal`)
  return runInNewContext(`(${raw.slice(start, end)})`, Object.create(null))
}

function loadExtras(lang) {
  let merged = {}
  for (const mod of EXTRA_MODULES) {
    const parsed = sliceObjectLiteral(readFileSync(mod.path, 'utf8'), mod.path)
    const forLang = mod.perLanguage ? parsed[lang] : parsed
    if (forLang) merged = { ...merged, ...forLang }
  }
  return merged
}

function loadLocale(lang) {
  const raw = readFileSync(`src/i18n/locales/${lang}.ts`, 'utf8')
  // The file is `const x: Translation = { … }` plus an import and, in en.ts,
  // type declarations after it. Slice the literal by matching braces from the
  // assignment — `lastIndexOf('}')` used to work and then quietly stopped when
  // a mapped type was added below the object, taking the audit down with it.
  const start = raw.indexOf('= {') + 2
  if (start < 2) throw new Error(`${lang}: could not find the object literal`)
  let depth = 0
  let end = -1
  let inString = null
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === inString) inString = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') inString = ch
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) {
      end = i + 1
      break
    }
  }
  if (end < 0) throw new Error(`${lang}: unbalanced braces in the object literal`)
  // `node:vm` rather than eval: the locale files are ours, but this still
  // runs a source file as code, and an empty context means the snippet
  // cannot reach this script's scope or Node's globals if one ever grows
  // something other than a plain data literal.
  return {
    ...runInNewContext(`(${raw.slice(start, end)})`, Object.create(null)),
    ...loadExtras(lang),
  }
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
//    Plural forms are compared by stem: every language must translate the same
//    *concept*, but each supplies the categories its own grammar uses.
const stemsOf = (lang) => new Set([...locales[lang].keys()].map(stem))
const everyStem = new Set(LANGS.flatMap((l) => [...stemsOf(l)]))
for (const lang of LANGS) {
  const have = stemsOf(lang)
  const missing = [...everyStem].filter((k) => !have.has(k))
  if (missing.length) findings.push(`${lang} is missing ${missing.length}: ${missing.join(', ')}`)
  // A plural key with no `_other` has no fallback when the count lands on a
  // category this language did not declare.
  const pluralStems = new Set([...locales[lang].keys()].filter(isPlural).map(stem))
  const noOther = [...pluralStems].filter((k) => !locales[lang].has(`${k}_other`))
  if (noOther.length) findings.push(`${lang} has plurals with no _other: ${noOther.join(', ')}`)
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
const undefinedKeys = [...referenced].filter(
  // A bare `t('a.b', { count })` is satisfied by a.b_one / a.b_other etc.
  (k) => k.includes('.') && !everyKey.has(k) && !everyStem.has(k),
)
if (undefinedKeys.length) {
  findings.push(`used in code but defined nowhere: ${undefinedKeys.join(', ')}`)
}

if (findings.length === 0) {
  console.log('✅ no findings')
  process.exit(0)
}
for (const finding of findings) console.error(`❗ ${finding}`)
process.exit(1)
