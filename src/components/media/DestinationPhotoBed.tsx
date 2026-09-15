import { destinationPhoto } from '../../lib/destination-media'
import Photo from './Photo'

/** The photograph behind a destination card, and its scrim.
 *
 * Positioned rather than inlined so the card's own children keep their exact
 * places: this drops in behind them and changes no geometry. The card needs
 * `relative isolate overflow-hidden`, which every call site already has, and
 * the photograph inherits its corner radius.
 *
 * Lazy by default. Six of these are on the home page and thirty-two on the
 * destinations page; loading the ones below the fold on arrival would undo the
 * point of encoding them small.
 */
export default function DestinationPhotoBed({
  slug,
  sizes = '(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw',
}: {
  slug: string | undefined
  sizes?: string
}) {
  const photo = destinationPhoto(slug)
  if (!photo) return null

  return (
    <span aria-hidden className="photo-bed">
      {/* alt is empty on purpose: the card's own heading names the
          destination, and a second announcement of it is noise. `place` is
          used where the photograph is the subject of the page instead. */}
      <Photo name={photo.name} alt="" sizes={sizes} />
    </span>
  )
}
