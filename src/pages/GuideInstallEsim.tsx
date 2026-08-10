import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle2, LifeBuoy, PlaneLanding, QrCode } from 'lucide-react'

import Seo from '../components/Seo'
import IosWalkthrough from '../components/guide/IosWalkthrough'
import { Button, Card, FaqItem, IconBadge } from '../components/ui'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd, faqLd } from '../lib/structured-data'

/** Apple's own five-ring mark would be wrong here; a plain numbered dot is honest. */
function Step({ n, children }: { n: number; children: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        aria-hidden
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-700 text-brand-600 dark:bg-white/10 dark:text-accent-400"
      >
        {n}
      </span>
      <span className="min-w-0 pt-0.5 text-[15px] leading-6 text-ink">{children}</span>
    </li>
  )
}

/**
 * The page for "eSIM o'rnatish" — the search made twice: once out of curiosity
 * before buying, once in mild panic at a departure gate. Both readers need the
 * same thing: short numbered steps for their exact phone, then a way out when
 * it does not connect. The troubleshooting list exists because the panicked
 * reader is the one whose next stop is a refund request.
 */
export default function GuideInstallEsim() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState<number | null>(0)
  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang

  const before = t('guides.install.before', { returnObjects: true }) as string[]
  const ios = t('guides.install.ios', { returnObjects: true }) as string[]
  const android = t('guides.install.android', { returnObjects: true }) as string[]
  const arrive = t('guides.install.arrive', { returnObjects: true }) as string[]
  const trouble = t('guides.install.trouble', { returnObjects: true }) as string[]
  const faqs = t('guides.install.faqs', { returnObjects: true }) as { q: string; a: string }[]

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo
        title={t('seo.guideInstallTitle')}
        description={t('seo.guideInstallDescription')}
        jsonLd={[
          faqLd(faqs.map((f) => ({ question: f.q, answer: f.a })))!,
          breadcrumbLd([{ name: t('guides.install.title'), path: '/esim-ornatish' }], lang),
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <IconBadge icon={QrCode} tone="brand" size="xl" />
        <h1 className="mt-5 text-3xl font-700 sm:text-4xl">{t('guides.install.title')}</h1>
        <p className="mt-4 text-base leading-7 text-slate-soft sm:text-lg">
          {t('guides.install.lead')}
        </p>

        {/* Pre-flight ------------------------------------------------------ */}
        <Card className="mt-10 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-700">
            <CheckCircle2 size={20} className="shrink-0 text-brand-500 dark:text-accent-400" aria-hidden />
            {t('guides.install.beforeTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {before.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] leading-6">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span className="min-w-0 text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Per-platform steps ---------------------------------------------- */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-700">{t('guides.install.iosTitle')}</h2>
            <ol className="mt-4 space-y-3.5">
              {ios.map((step, i) => (
                <Step key={i} n={i + 1}>
                  {step}
                </Step>
              ))}
            </ol>
            {/* The same four steps as pictures. "Settings → Cellular → Add eSIM"
                is three words for three screens, and someone doing it for the
                first time cannot tell which row of a long settings list is the
                one to tap. The highlighted row says it in the one way prose
                cannot — and it takes the full width because a diagram squeezed
                into half a column is a diagram nobody reads. */}
            <IosWalkthrough />
          </Card>
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-700">{t('guides.install.androidTitle')}</h2>
            <ol className="mt-4 space-y-3.5">
              {android.map((step, i) => (
                <Step key={i} n={i + 1}>
                  {step}
                </Step>
              ))}
            </ol>
          </Card>
        </div>

        {/* On arrival ------------------------------------------------------- */}
        <Card className="mt-8 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-700">
            <PlaneLanding size={20} className="shrink-0 text-brand-500 dark:text-accent-400" aria-hidden />
            {t('guides.install.arriveTitle')}
          </h2>
          <ol className="mt-4 space-y-3.5">
            {arrive.map((step, i) => (
              <Step key={i} n={i + 1}>
                {step}
              </Step>
            ))}
          </ol>
        </Card>

        {/* Troubleshooting --------------------------------------------------- */}
        <Card className="mt-8 p-6">
          <h2 className="flex items-center gap-2.5 text-lg font-700">
            <LifeBuoy size={20} className="shrink-0 text-brand-500 dark:text-accent-400" aria-hidden />
            {t('guides.install.troubleTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {trouble.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] leading-6">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span className="min-w-0 text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* FAQ ---------------------------------------------------------------- */}
        <div className="mt-10 space-y-3">
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

        {/* CTA ------------------------------------------------------------------ */}
        <Card className="mt-12 p-8 text-center">
          <h2 className="text-2xl font-700">{t('guides.install.ctaTitle')}</h2>
          <p className="mt-2 text-slate-soft">{t('guides.install.ctaText')}</p>
          <Button to="/destinations" className="mx-auto mt-6 w-fit px-7 py-3">
            {t('guides.install.ctaBtn')} <ArrowRight size={17} />
          </Button>
        </Card>
      </div>
    </div>
  )
}
