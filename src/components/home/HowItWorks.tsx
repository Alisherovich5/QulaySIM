import { QrCode, Search, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Reveal from '../Reveal'
import { FeatureCard, SectionHeading } from '../ui'

/** "How eSIM works" — three simple steps. */
export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    { icon: Search, title: t('home.step1Title'), text: t('home.step1Text') },
    { icon: QrCode, title: t('home.step2Title'), text: t('home.step2Text') },
    { icon: Smartphone, title: t('home.step3Title'), text: t('home.step3Text') },
  ]

  return (
    <section id="how" className="border-y border-line bg-surface py-10 sm:py-16">
      <div className="container-page">
        <Reveal>
          <SectionHeading align="center" title={t('home.howTitle')} />
        </Reveal>
        <div className="mt-6 grid gap-3 sm:mt-10 sm:gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <FeatureCard icon={s.icon} title={s.title} text={s.text} layout="stacked" compact />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
