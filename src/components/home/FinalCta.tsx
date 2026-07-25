import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Reveal from '../Reveal'
import { Button } from '../ui'

/** Closing call-to-action band (the one deliberately-dark teal section). */
export default function FinalCta() {
  const { t } = useTranslation()
  return (
    <section className="container-page hidden py-16 md:block">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-14 text-center">
          <div className="aurora" style={{ opacity: 0.7 }} />
          <div className="relative">
            <h2 className="font-display text-3xl font-700 text-white">{t('home.ctaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-md text-brand-100">{t('home.ctaSubtitle')}</p>
            <Button to="/destinations" variant="accent" sheen className="mx-auto mt-7 w-fit px-7 py-3">
              {t('common.browseDestinations')} <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
