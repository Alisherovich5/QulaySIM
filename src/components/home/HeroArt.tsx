import { useThemeMode } from '../../lib/theme'
import Photo from '../media/Photo'

/** The photograph behind the home page headline.
 *
 * This replaces the WebGL globe that used to sit in a card on the right of the
 * hero. That globe was 1.84 MB of JavaScript — `react-globe.gl` plus three.js —
 * downloaded on every first visit to draw one decorative sphere, and on phones
 * it was drawn at 15% opacity as a background texture, where nobody could see
 * it turning at all. The artwork here says the same thing (travel, a planet,
 * somewhere to go) in 65 KB on a phone and 144 KB on a desktop, and it says it
 * before the JavaScript has finished parsing rather than seconds after.
 *
 * The globe itself is not gone: it is still the map in the signed-in profile,
 * where it shows the visitor's own connected countries and is worth its weight.
 *
 * Two images, one per theme, and only one is fetched — which is why this is a
 * React component reading the theme rather than a CSS background with a `.dark`
 * override. A stylesheet cannot choose between two files without the browser
 * having already decided to load both.
 */
export default function HeroArt() {
  const mode = useThemeMode()

  return (
    <div aria-hidden className="hero-art" data-theme-mode={mode}>
      <Photo
        name={mode === 'dark' ? 'hero-dark' : 'hero-light'}
        alt=""
        priority
        // Full-bleed: the artwork is as wide as the viewport at every size.
        sizes="100vw"
        className="hero-art-image"
      />
      {/* The scrim, not a wash over the whole photograph.
       *
       * The headline sits on the left and the artwork's subject — the traveller,
       * the skyline — is on the right. A flat overlay dims both equally: it
       * costs the photograph its contrast to buy the text some. This gradient
       * is opaque where the words are and clear where the picture is, so the
       * text gets its full contrast ratio and the photograph is untouched in
       * the two thirds of the frame that carry it. */}
      <div className="hero-art-scrim" />
    </div>
  )
}
