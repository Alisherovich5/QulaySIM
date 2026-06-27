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

export const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
