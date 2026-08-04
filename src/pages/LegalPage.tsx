import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo'

/**
 * One renderer for the three legal documents — offer, refunds, privacy.
 *
 * They exist because a payment provider's production review looks for them
 * before switching a store live, and because customers deserve to know the
 * rules before paying. The content lives in the locale files like everything
 * else, so the three language editions cannot drift structurally; bracketed
 * placeholders mark the company details that only the business can supply.
 *
 * Deliberately plain typography: a legal text pretending to be a landing page
 * reads as evasive. Headings, paragraphs, nothing else.
 */
export default function LegalPage({ doc }: { doc: 'oferta' | 'refund' | 'privacy' }) {
  const { t } = useTranslation()
  const sections = t(`legal.${doc}.sections`, { returnObjects: true }) as {
    h: string
    ps: string[]
  }[]

  const seoKey = { oferta: 'ofertaTitle', refund: 'refundTitle', privacy: 'privacyTitle' }[doc]

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo title={t(`seo.${seoKey}`)} description={t('seo.legalDescription')} />
      <article className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-700 sm:text-3xl">{t(`legal.${doc}.title`)}</h1>
        <p className="mt-2 text-sm text-slate-soft">{t('legal.updated')}</p>

        {sections.map((section) => (
          <section key={section.h} className="mt-8">
            <h2 className="text-lg font-700">{section.h}</h2>
            {section.ps.map((paragraph, i) => (
              <p key={i} className="mt-2.5 leading-7 text-ink">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-10 rounded-xl bg-mist px-4 py-3 text-sm text-slate-soft">
          {t('legal.fillNote')}
        </p>
      </article>
    </div>
  )
}
