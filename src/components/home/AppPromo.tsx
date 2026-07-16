import { Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Reveal from '../Reveal'
import { AppBadges } from '../ui'

/** App download promo (Android & iOS). */
export default function AppPromo() {
  const { t } = useTranslation()
  return (
    <section className="border-y border-line bg-surface py-16">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div>
            <h2 className="text-2xl font-700 sm:text-3xl">{t('home.appTitle')}</h2>
            <p className="mt-3 max-w-md text-slate-soft">{t('home.appText')}</p>
            <AppBadges
              className="mt-7"
              androidLabel={t('home.appAndroid')}
              iosLabel={t('home.appIos')}
            />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="relative mx-auto grid h-64 w-full max-w-md place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 ring-1 ring-white/10">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-accent-400/20 blur-2xl"
            />
            <span className="relative grid h-24 w-24 place-items-center rounded-3xl bg-white/10 text-white ring-1 ring-white/15">
              <Smartphone size={48} strokeWidth={1.5} />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
