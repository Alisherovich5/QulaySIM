import { MEDIA } from './media.generated'

/** Which photograph stands for which destination.
 *
 * A photograph is matched to the actual place, never to the region: a picture
 * of Dubai under "Qatar" is worse than no picture, because it is a claim about
 * somewhere the visitor is about to buy data for. Destinations with no
 * photograph of their own simply have none, and the card keeps its plain
 * surface — there is no generic "travel" stock image standing in for a country.
 *
 * `place` is the alt text: the city, not the country, because that is what the
 * picture shows and a screen reader reading "Turkey" next to a flag already
 * labelled Turkey has been told nothing.
 */
const PLACES: Record<string, { photo: string; place: string }> = {
  turkey: { photo: 'istanbul', place: 'Istanbul' },
  'united-arab-emirates': { photo: 'dubai', place: 'Dubai' },
  uae: { photo: 'dubai', place: 'Dubai' },
  thailand: { photo: 'thailand', place: 'Thailand' },
  indonesia: { photo: 'bali', place: 'Tegallalang, Bali' },
  georgia: { photo: 'georgia', place: 'Gruziya' },
  'saudi-arabia': { photo: 'saudi', place: 'Saudiya Arabistoni' },
  italy: { photo: 'italy', place: 'Italiya' },
  uzbekistan: { photo: 'uzbekistan', place: "O'zbekiston" },
  malaysia: { photo: 'malaysia', place: 'Malayziya' },
  egypt: { photo: 'egypt', place: 'Misr' },
  vietnam: { photo: 'vietnam', place: 'Vyetnam' },
  china: { photo: 'china', place: 'Xitoy' },
  azerbaijan: { photo: 'azerbaijan', place: 'Ozarbayjon' },
  qatar: { photo: 'qatar', place: 'Qatar' },
}

export interface DestinationPhoto {
  /** Key into the generated media manifest, for <Photo name=…>. */
  name: string
  place: string
}

/** The photograph for a destination, or undefined when it has none.
 *
 * Checked against the manifest rather than trusted: the table above is written
 * by hand and the files are produced by scripts/build-media.py, so a typo or a
 * photograph that was never encoded would otherwise ship as a broken image.
 * Here it ships as no image, which is the behaviour every call site already
 * handles.
 */
export function destinationPhoto(slug: string | undefined): DestinationPhoto | undefined {
  if (!slug) return undefined
  const entry = PLACES[slug]
  if (!entry) return undefined
  const name = `photos/${entry.photo}`
  return MEDIA[name] ? { name, place: entry.place } : undefined
}

/** Kept for the call sites that only ask "is there one". */
export const destinationMedia = PLACES
