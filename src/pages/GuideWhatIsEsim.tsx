import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Cpu, Globe2, PlaneTakeoff, Smartphone, Wallet, Zap } from 'lucide-react'

import Seo from '../components/Seo'
import { Button, Card, FaqItem, IconBadge } from '../components/ui'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd, faqLd } from '../lib/structured-data'

/**
 * The page for the search a customer makes before they know they want us.
 *
 * Somebody typing "eSIM nima" is at the very top of the funnel: they have heard
 * the word and want it explained, and whoever explains it is who they buy from
 * — today that is a competitor's blog, because the catalogue had nothing to
 * rank for the question. The copy therefore answers the question plainly and
 * only then sells; a page that pitches before it explains loses the reader the
 * query was about.
 *
 * All content lives in the locale files, one edition per language URL, and the
 * FAQ block is mirrored into FAQPage structured data — the visible text and the
 * schema are built from the same array, so they cannot disagree.
 */
export default function GuideWhatIsEsim() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState<number | null>(0)
  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang

  const diff = t('guides.what.diff', { returnObjects: true }) as { t: string; x: string }[]
  const why = t('guides.what.why', { returnObjects: true }) as { t: string; x: string }[]
  const faqs = t('guides.what.faqs', { returnObjects: true }) as { q: string; a: string }[]

  const whyIcons = [Wallet, Zap, PlaneTakeoff]

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo
        title={t('seo.guideWhatTitle')}
        description={t('seo.guideWhatDescription')}
        jsonLd={[
          faqLd(faqs.map((f) => ({ question: f.q, answer: f.a })))!,
          breadcrumbLd([{ name: t('guides.what.title'), path: '/esim-nima' }], lang),
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <IconBadge icon={Cpu} tone="brand" size="xl" />
        <h1 className="mt-5 text-3xl font-700 sm:text-4xl">{t('guides.what.title')}</h1>
        <p className="mt-4 text-base leading-7 text-slate-soft sm:text-lg">
          {t('guides.what.lead')}
        </p>

        {/* Difference ---------------------------------------------------- */}
        <h2 className="mt-12 text-xl font-700 sm:text-2xl">{t('guides.what.diffTitle')}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {diff.map((item) => (
            <Card key={item.t} className="p-5">
              <h3 className="font-700">{item.t}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-soft">{item.x}</p>
            </Card>
          ))}
        </div>

        {/* Why for travel ------------------------------------------------- */}
        <h2 className="mt-12 text-xl font-700 sm:text-2xl">{t('guides.what.whyTitle')}</h2>
        <div className="mt-5 space-y-4">
          {why.map((item, i) => {
            const Icon = whyIcons[i] ?? Globe2
            return (
              <Card key={item.t} className="flex items-start gap-4 p-5">
                <IconBadge icon={Icon} tone="brand" />
                <div className="min-w-0">
                  <h3 className="font-700">{item.t}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-soft">{item.x}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Device check bridge -------------------------------------------- */}
        <Card className="mt-12 p-6">
          <div className="flex items-start gap-4">
            <IconBadge icon={Smartphone} tone="brand" />
            <div className="min-w-0">
              <h2 className="text-lg font-700">{t('guides.what.deviceTitle')}</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-soft">
                {t('guides.what.deviceText')}
              </p>
              <Button to="/device-check" variant="ghost" className="mt-4 w-fit px-5 py-2.5">
                {t('guides.what.deviceBtn')} <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Card>

        {/* FAQ ------------------------------------------------------------- */}
        <h2 className="mt-12 text-xl font-700 sm:text-2xl">{t('guides.what.faqTitle')}</h2>
        <div className="mt-5 space-y-3">
          {faqs.map((f, i) => (
            <FaqItem
              key={i}
              question={f.q}
              answer={f.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>

        {/* CTA ------------------------------------------------------------- */}
        <Card className="mt-12 p-8 text-center">
          <h2 className="text-2xl font-700">{t('guides.what.ctaTitle')}</h2>
          <p className="mt-2 text-slate-soft">{t('guides.what.ctaText')}</p>
          <Button to="/destinations" className="mx-auto mt-6 w-fit px-7 py-3">
            {t('guides.what.ctaBtn')} <ArrowRight size={17} />
          </Button>
        </Card>
      </div>
    </div>
  )
}
