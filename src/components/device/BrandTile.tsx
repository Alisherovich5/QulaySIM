import { useState } from 'react'

import { brandMark } from './brandMarks'

/**
 * One brand in the picker.
 *
 * Selected state is a ring and a tint rather than a fill: the mark inside
 * carries the brand's own colour, and a filled tile would either fight it or
 * force it to white and stop being the brand's mark.
 *
 * The name sits under the mark only while selected — it is the confirmation of
 * what was pressed. Printing it on all fifteen would put a second wordmark
 * under nine that already are one.
 */
export default function BrandTile({
  brand,
  selected,
  supported,
  total,
  onToggle,
}: {
  brand: string
  selected: boolean
  supported: number
  total: number
  onToggle: () => void
}) {
  const mark = brandMark(brand)
  const [logoFailed, setLogoFailed] = useState(false)
  const showLogo = Boolean(mark.logo) && !logoFailed

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      /* The accessible name says the brand and what it gets you. The tile's own
         contents are a logo, and "Apple" alone does not tell a screen-reader
         user that eleven of its fourteen models take an eSIM. */
      aria-label={`${brand} — ${total} / ${supported}`}
      className={`focus-ring group grid h-[104px] place-items-center rounded-2xl px-3 transition duration-200 ${
        selected
          ? 'bg-brand-50/70 ring-2 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-400/60'
          : 'bg-surface ring-1 ring-line hover:-translate-y-0.5 hover:ring-brand-200 dark:hover:ring-brand-400/40'
      }`}
    >
      <span className="grid place-items-center gap-1.5">
        {showLogo ? (
          <img src={mark.logo} alt="" className="h-7 w-auto" onError={() => setLogoFailed(true)} />
        ) : (
          <span aria-hidden className={mark.className}>
            {mark.wordmark}
          </span>
        )}
        {selected && (
          <span className="text-[12px] font-600 leading-none text-slate-soft">{brand}</span>
        )}
      </span>
    </button>
  )
}
