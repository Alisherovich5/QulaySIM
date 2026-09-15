import { useState } from 'react'
import { flagUrl, flagSrcSet } from '../lib/format'

interface Props {
  iso2: string
  /** flagcdn width bucket: 80, 160, 320 … */
  w?: number
  className?: string
  alt?: string
}

/**
 * Robust flag image. If the CDN image fails to load (network / unknown code),
 * it falls back to a styled ISO-2 badge instead of an empty "sleeping" box.
 */
export default function Flag({ iso2, w = 80, className = '', alt }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed || !iso2) {
    return (
      <span
        className={`grid place-items-center bg-brand-50 font-mono text-[10px] font-700 uppercase text-brand-600 ${className}`}
      >
        {iso2 || '—'}
      </span>
    )
  }

  return (
    <img
      // A destination list carries dozens of these below the fold; the browser
      // fetched every one before the visitor had scrolled to any of them.
      loading="lazy"
      src={flagUrl(iso2, w)}
      srcSet={flagSrcSet(iso2, w)}
      // Decorative by default. Every flag in this app sits beside the country
      // name, so a reader that announced the image too would say the country
      // twice — and the old fallback said it in English ("TR flag") on all
      // three editions. A call site that needs a name still passes one.
      alt={alt ?? ''}
      width={w}
      decoding="async"
      onError={() => setFailed(true)}
      className={`bg-line/40 ${className}`}
    />
  )
}
