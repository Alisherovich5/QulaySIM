import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import type { Testimonial as TestimonialItem } from '../../lib/types'
import { SectionHeading, Testimonial } from '../ui'

interface Review {
  name: string
  location: string
  text: string
  rating: number
}

/** Customer testimonials — only admin-approved reviews returned by the API. */
export default function Testimonials({ items }: { items?: TestimonialItem[] }) {
  const { t } = useTranslation()

  const reviews: Review[] = items ?? []

  if (reviews.length === 0) return null

  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <section className="container-page py-16">
      <SectionHeading
        align="center"
        title={t('home.testimonialsTitle')}
        subtitle={t('home.testimonialsSubtitle')}
      />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-slate-soft sm:flex-nowrap sm:text-sm" aria-label={t('home.testimonialsRating')}>
        <span className="flex shrink-0 gap-0.5 text-gold-500" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} className="h-3.5 w-3.5 shrink-0 fill-gold-500 sm:h-4 sm:w-4" />)}
        </span>
        <strong className="shrink-0 text-sm text-ink sm:text-base">{averageRating}/5</strong>
        <span className="basis-full sm:basis-auto">{t('home.testimonialsRating')}</span>
      </div>
      {/* A continuous loop rather than a static row: with three reviews a grid
          reads as "these are all of them", while a moving rail reads as "there
          are more". It pauses on hover and on keyboard focus, because a review
          that slides away mid-sentence cannot be read.

          The track holds the list twice — the second copy is aria-hidden so a
          screen reader does not read every review a second time — and slides
          exactly half its width, which is what makes the loop seamless.

          Duration scales with the number of reviews so each card spends the
          same time on screen whether there are three or thirty. */}
      <div
        className="marquee mt-10 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ ['--marquee-duration' as string]: `${Math.max(reviews.length * 9, 24)}s` }}
      >
        <div className="marquee-track gap-4 py-2">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-4" // Only the duplicate is hidden; aria-hidden="false" on the original
              // is noise in the accessibility tree.
              aria-hidden={copy === 1 || undefined}>
              {reviews.map((r, i) => (
                <div key={`${copy}-${r.name}-${i}`} className="w-[286px] shrink-0 sm:w-[330px]">
                  <Testimonial name={r.name} location={r.location} text={r.text} rating={r.rating} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
