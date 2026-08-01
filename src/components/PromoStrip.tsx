import { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { usePromo } from '../lib/usePromo'

// Used only until the banner loads, and if no banner is configured at all.
const FALLBACK_CODE = 'WELCOME10'

/**
 * Compact announcement bar that stays pinned above the site navigation.
 *
 * The code and the discount come from the admin — specifically from the promo
 * code the banner is linked to, which is the same code checkout accepts. That
 * matters: a hardcoded "10%" here would keep advertising 10% after someone
 * changed the code to 20% or to a fixed $20, and nobody would notice until a
 * customer complained about the total.
 */
export default function PromoStrip() {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const promo = usePromo()
  const [copied, setCopied] = useState(false)
  const code = promo?.code || FALLBACK_CODE

  // "20% off" or "$20 off", whichever the linked code actually gives.
  const shortLabel = (() => {
    if (promo?.strip_text) return promo.strip_text
    if (promo?.discount_type === 'percent' && promo.discount_value != null) {
      return t('nav.promoShortPercent', { value: promo.discount_value })
    }
    if (promo?.discount_type === 'fixed' && promo.discount_value != null) {
      return t('nav.promoShortFixed', { value: formatPrice(promo.discount_value) })
    }
    return t('nav.promoShort')
  })()

  const longLabel = promo?.title || t('nav.promoMessage')

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="border-b border-white/10 bg-brand-900 text-white">
      <div className="promo-strip-row container-page flex min-h-9 items-center justify-between gap-2 py-1 text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-1.5 font-600">
          <Sparkles size={13} className="shrink-0 text-gold-400" />
          <span className="hidden truncate sm:inline">{longLabel}</span>
          <span className="truncate sm:hidden">{shortLabel}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] font-700 tracking-wide text-gold-400 sm:text-xs">{code}</span>
          <button
            type="button"
            onClick={copyCode}
            className="tap-44 grid h-7 w-7 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-gold-400"
            aria-label={copied ? t('nav.copiedPromo') : t('nav.copyPromo')}
            title={copied ? t('nav.copiedPromo') : t('nav.copyPromo')}
          >
            {copied ? <Check size={15} className="text-gold-400" /> : <Copy size={15} />}
          </button>
          <Link to={promo?.cta_link || '/destinations'} className="tap-44 hidden rounded-md bg-accent-500 px-2.5 py-1 font-700 text-brand-950 transition hover:bg-accent-400 sm:inline-block">
            {t('nav.promoCta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
