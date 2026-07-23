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

/** Customer testimonials — admin-managed (CMS) with i18n fallback. */
export default function Testimonials({ items }: { items?: TestimonialItem[] }) {
  const { t } = useTranslation()

  const reviews: Review[] =
    items && items.length > 0
      ? items
      : (t('home.testimonials', { returnObjects: true }) as Review[])
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
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-soft" aria-label={t('home.testimonialsRating')}>
        <span className="flex gap-0.5 text-gold-500" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} className="fill-gold-500" />)}
        </span>
        <strong className="text-ink">{averageRating}/5</strong>
        <span>{t('home.testimonialsRating')}</span>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={`${r.name}-${i}`} delay={i * 70}>
            <Testimonial name={r.name} location={r.location} text={r.text} rating={r.rating} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
