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

/**
 * Traffik miqdorini odam o'qiydigan ko'rinishda.
 *
 * Ikki tomonlama muammoni yechadi. Bir tomondan "3071 MB" -- to'g'ri, lekin
 * bir qarashda 3 GB ekani ko'rinmaydi. Ikkinchi tomondan "0.0 GB" -- 1 MB
 * sarflanganda chiqadigan yozuv, va u SOTIB OLGAN mijozga "hisob ishlamayapti"
 * deb ko'rinadi: aynan shu yozuv tufayli shikoyat keldi.
 *
 * Shuning uchun chegara 1 GB: pastda -- megabaytda, yuqorida -- gigabaytda,
 * bitta kasr bilan. Va yaxlitlash HAR DOIM pastga: mijozga 0,96 ni 1 GB deb
 * aytish -- chet eldan keladigan shikoyatning eng qisqa yo'li.
 *
 * Nolga qisish ham kerak: ta'minotchi tugagan tarifda sarfni jamidan bitta
 * ko'p qaytaradi (3073 / 3072), ya'ni qoldiq "-1 MB" bo'lib chiqadi.
 */
export const usedLabel = (mb: number) => {
  if (mb < 1024) return `${Math.max(0, mb)} MB`
  const gb = Math.floor((mb / 1024) * 10) / 10
  return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`
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
