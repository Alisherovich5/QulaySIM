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
  /* Measured against the grid these sit in, not guessed.
   *
   * DestinationsExplorer is three columns from 360px upward and two below it,
   * which works out at very close to 31vw for a card at every width above
   * 360px — measured in the browser at 435px in a 1440px viewport, not derived
   * from the container's max-width, which the gaps and padding make wrong.
   *
   * The first version of this said 92vw for phones, which is the width of the
   * whole screen: every phone fetched the 900px variant for a picture drawn
   * 103px wide, four times the bytes for no pixels anyone can see. */
  sizes = '(min-width: 360px) 31vw, 46vw',
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
