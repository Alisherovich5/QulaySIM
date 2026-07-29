import { Link } from 'react-router-dom'
import Wordmark from './Wordmark'

/**
 * The brand link in the navbar and footer.
 *
 * This used to be an invented signal badge plus the word "QulaySIM" set in the
 * display face. It is now the real wordmark, so the badge is gone rather than
 * sitting next to a logo that already carries the name.
 *
 * `light` is kept for dark surfaces: the wordmark takes its colour from the
 * surrounding text, so this only has to set that colour.
 */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="QulaySIM"
      className={`inline-flex items-center transition-opacity hover:opacity-80 ${
        light ? 'text-white' : 'text-ink'
      }`}
    >
      {/* Height is fixed and width follows the 4:1 aspect ratio, so the mark
          never reflows the navbar while the page is loading. */}
      <Wordmark className="h-7 w-[112px] sm:h-8 sm:w-[128px]" />
    </Link>
  )
}
