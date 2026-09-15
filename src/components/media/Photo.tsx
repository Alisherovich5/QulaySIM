import { MEDIA, type MediaVariant } from '../../lib/media.generated'

/** Every photograph on the site goes through here.
 *
 * Before this component the site had photographs in three different shapes:
 * a raw `<img src="/media/bali.jpg">` on the home page, a CSS
 * `background-image` behind the country cards, and a second CSS background on
 * the country page heading. Three shapes meant three sets of bugs — the CSS
 * ones could not be lazy-loaded at all, none of them offered a smaller file to
 * a phone, and none of them reserved space, so every photograph shifted the
 * layout as it arrived.
 *
 * One `<picture>` fixes all four at once: AVIF first with WebP behind it, a
 * `srcset` the browser picks from using the real encoded widths, native lazy
 * loading below the fold, and an aspect-ratio box so nothing moves. The widths
 * come from `media.generated.ts`, which the encoder writes — see
 * scripts/build-media.py for why they cannot be hardcoded.
 */

export interface PhotoProps {
  /** Key into the generated manifest, e.g. `photos/istanbul`. */
  name: string
  alt: string
  /** CSS `sizes`: how wide the image will be drawn. Wrong here means the
      browser downloads the wrong variant, so it is required, not optional. */
  sizes: string
  className?: string
  /** True only for an image above the fold. It turns off lazy loading and asks
      the browser to fetch it ahead of the rest — the hero, and nothing else. */
  priority?: boolean
  /** Rendered when the key is missing, rather than a broken image. */
  fallback?: React.ReactNode
}

function srcset(variants: MediaVariant[], field: 'avif' | 'webp') {
  return variants.map((v) => `${v[field]} ${v.w}w`).join(', ')
}

function photoVariants(name: string): MediaVariant[] | undefined {
  const found = MEDIA[name]
  return found && found.length ? found : undefined
}

export default function Photo({ name, alt, sizes, className, priority, fallback }: PhotoProps) {
  const variants = photoVariants(name)
  if (!variants) return <>{fallback ?? null}</>

  // The largest variant is the `src`: it is the fallback for a browser that
  // understands neither srcset nor picture, and there is no such browser left
  // that we would want to serve the smallest file to.
  const largest = variants[variants.length - 1]

  return (
    <picture>
      <source type="image/avif" srcSet={srcset(variants, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(variants, 'webp')} sizes={sizes} />
      <img
        src={largest.webp}
        alt={alt}
        width={largest.w}
        height={largest.h}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        // `fetchpriority` is the only way to tell the browser that this one
        // image is the largest contentful paint. Without it the hero queues
        // behind the fonts and the catalogue request.
        fetchPriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
        draggable={false}
        className={className}
      />
    </picture>
  )
}
