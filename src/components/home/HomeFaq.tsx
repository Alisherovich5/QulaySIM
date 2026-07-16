import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Faq } from '../../lib/types'
import Reveal from '../Reveal'
import { FaqItem, SectionHeading } from '../ui'

/** FAQ accordion on the landing page. Admin-managed (CMS) with i18n fallback. */
export default function HomeFaq({ faqs }: { faqs?: Faq[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(0)

  const items: { question: string; answer: string }[] =
    faqs && faqs.length > 0
      ? faqs.map((f) => ({ question: f.question, answer: f.answer }))
      : (t('support.faqs', { returnObjects: true }) as { q: string; a: string }[]).map((f) => ({
          question: f.q,
          answer: f.a,
        }))

  return (
    <section className="border-t border-line bg-surface py-16">
      <div className="container-page">
        <SectionHeading align="center" title={t('home.faqTitle')} subtitle={t('home.faqSubtitle')} />
        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {items.map((faq, i) => (
            <Reveal key={i} delay={i * 40}>
              <FaqItem
                question={faq.question}
                answer={faq.answer}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
