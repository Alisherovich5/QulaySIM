import { ArrowRight, BadgePercent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Promo } from '../../lib/types'
import { Button } from '../ui'

/** Voucher / welcome-bonus banner. Admin-managed (CMS) with i18n fallback. */
export default function PromoBanner({ promo }: { promo?: Promo }) {
  const { t } = useTranslation()

  const code = promo?.code ?? 'WELCOME10'
  const eyebrow = promo?.eyebrow ?? t('home.promoEyebrow')
  const title = promo?.title ?? t('home.promoTitle')
  const ctaLink = promo?.cta_link ?? '/destinations'
  // Server text may contain {{code}}; i18n interpolates it.
  const text = promo ? promo.text.replace('{{code}}', code) : t('home.promoText', { code })

  return (
    <section className="container-page py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-500/20 text-gold-400">
              <BadgePercent size={24} />
            </span>
            <div>
              <p className="text-xs font-700 uppercase tracking-wide text-gold-400">{eyebrow}</p>
              <h2 className="mt-1 font-display text-xl font-700 text-white sm:text-2xl">{title}</h2>
              <p className="mt-1.5 max-w-xl text-sm text-brand-100">{text}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-lg border border-dashed border-white/30 bg-white/10 px-3 py-2 font-mono text-sm font-700 tracking-wider text-white">
              {code}
            </span>
            <Button to={ctaLink} variant="accent" sheen className="px-5 py-3">
              {t('home.promoCta')} <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
