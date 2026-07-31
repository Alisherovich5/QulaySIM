export const flagUrl = (iso2: string, w = 80) =>
  `https://flagcdn.com/w${w}/${iso2.toLowerCase()}.png`

export const flagSrcSet = (iso2: string, w = 80) =>
  `https://flagcdn.com/w${w * 2}/${iso2.toLowerCase()}.png 2x`

export const formatPrice = (value: number | null | undefined) =>
  value == null ? '—' : `$${value.toFixed(2)}`

export const dataLabel = (mb: number, unlimited: boolean) => {
  if (unlimited) return 'Unlimited'
  if (mb % 1024 === 0) return `${mb / 1024} GB`
  return `${mb} MB`
}

export const usedLabel = (mb: number) => {
  if (mb % 1024 === 0) return `${mb / 1024} GB`
  return `${mb} MB`
}

/**
 * Uzbek month names, written out because the platform does not have them.
 *
 * Chrome's ICU has no Uzbek month data at all: `Intl.DateTimeFormat('uz', {
 * month: 'long' })` returns "M01", and so does `short`. A member-since date read
 * "2026 M01 15", which is not a date in any language. Every other locale is left
 * to Intl, which does know them.
 */
const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

/**
 * A date in the language the visitor chose — not the language their browser
 * happens to be set to, which is what `toLocaleDateString(undefined, …)` uses.
 * Someone reading the site in Uzbek on an English phone was getting English
 * dates, and vice versa.
 */
export const formatDate = (iso: string | null, lang = 'en') => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const base = lang.split('-')[0]
  if (base === 'uz') {
    return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
  }
  return date.toLocaleDateString(base, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
