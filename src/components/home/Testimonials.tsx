import { useTranslation } from 'react-i18next'
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

  return (
    <section className="container-page py-16">
      <SectionHeading
        align="center"
        title={t('home.testimonialsTitle')}
        subtitle={t('home.testimonialsSubtitle')}
      />
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
