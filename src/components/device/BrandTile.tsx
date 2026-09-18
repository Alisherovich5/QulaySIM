import { useState } from 'react'

import { brandMark } from './brandMarks'

/**
 * One brand in the picker.
 *
 * Selected state is a ring and a tint rather than a fill: the mark inside
 * carries the brand's own colour, and a filled tile would either fight it or
 * force it to white and stop being the brand's mark.
 *
 * The mark is sized per brand from `brandMarks`, not to a shared box — see the
 * note there. The width is the cap; the height follows from the file's own
 * aspect, so a logo is never stretched. `object-contain` keeps that true even
 * when a replacement file arrives at a different aspect.
 *
 * A logo that 404s falls back to the wordmark rather than leaving an empty
 * square, which is what makes a half-finished asset set safe to ship.
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
      onClick={onToggle}
      aria-pressed={selected}
      /* The count belongs in the accessible name, not on the face of the tile:
         printed fifteen times it is noise, and a screen reader still needs it. */
      aria-label={`${brand} — ${supported}/${total}`}
      /* Both states' colours are sampled off the design rather than taken from
         the palette: the unselected border is #E7EDF2 where the site's --color-line
         is a touch more cyan, and the selected pair is #279C82 on #F0FEFA. On a
         grid of fifteen the difference is the difference between the page
         matching the design and nearly matching it. Dark mode keeps the tokens,
         which the design does not cover. */
      className={`focus-ring group flex h-[72px] flex-col items-center justify-center gap-1 rounded-[12px] border px-3 transition-[border-color,background-color,box-shadow] duration-200 sm:h-[88px] lg:h-[107px] ${
        selected
          ? 'border-[#279C82] bg-[#F0FEFA] dark:border-brand-500 dark:bg-brand-500/10'
          : 'border-[#E7EDF2] bg-white hover:border-brand-200 hover:bg-mist/40 dark:border-line dark:bg-surface'
      }`}
    >
      {showLogo ? (
        <img
          src={mark.logo}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
          data-dark={mark.dark}
          /* Width drives the size and the height follows the file's own aspect:
             every logo here has a viewBox cropped to its artwork, so a set width
             renders the mark at exactly that width.
             `min-h-0 flex-1` is what lets it give way. With `h-auto max-h-full`
             the image measured itself against the whole tile rather than the
             space left over, so adding a name under the four square marks —
             Xiaomi, Huawei, Motorola, OnePlus — pushed them past the 72px tile
             on a phone. Now it takes the room that is left and `object-contain`
             keeps the artwork's proportions inside it. */
          className="min-h-0 w-full flex-1 object-contain"
          style={{ maxWidth: mark.width ? `${mark.width}px` : undefined }}
        />
      ) : (
        <span className={mark.className}>{mark.wordmark}</span>
      )}

      {/* Only the two whose lockup carries the name in the design. */}
      {mark.label && (
        <span className="text-[13px] font-500 leading-none text-ink/80">{brand}</span>
      )}
    </button>
  )
}
