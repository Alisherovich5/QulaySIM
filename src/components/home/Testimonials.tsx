import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import type { Testimonial as TestimonialItem } from '../../lib/types'
import Reveal from '../Reveal'
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
      <div className="mobile-scroll-gutter mt-10 flex snap-x gap-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:py-0">
        {reviews.map((r, i) => (
          <Reveal key={`${r.name}-${i}`} delay={i * 70} className="min-w-[286px] snap-start md:min-w-0">
            <Testimonial name={r.name} location={r.location} text={r.text} rating={r.rating} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
