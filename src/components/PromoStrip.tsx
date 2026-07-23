import { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const PROMO_CODE = 'WELCOME10'

/** Compact announcement bar that stays visible above the site navigation. */
export default function PromoStrip() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="border-b border-white/10 bg-brand-900 text-white">
      <div className="container-page flex min-h-9 items-center justify-between gap-2 py-1 text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-1.5 font-600">
          <Sparkles size={13} className="shrink-0 text-gold-400" />
          <span className="hidden truncate sm:inline">{t('nav.promoMessage')}</span>
          <span className="sm:hidden">{t('nav.promoShort')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] font-700 tracking-wide text-gold-400 sm:text-xs">{PROMO_CODE}</span>
          <button
            type="button"
            onClick={copyCode}
            className="grid h-7 w-7 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-gold-400"
            aria-label={copied ? t('nav.copiedPromo') : t('nav.copyPromo')}
            title={copied ? t('nav.copiedPromo') : t('nav.copyPromo')}
          >
            {copied ? <Check size={15} className="text-gold-400" /> : <Copy size={15} />}
          </button>
          <Link to="/destinations" className="hidden rounded-md bg-accent-500 px-2.5 py-1 font-700 text-brand-950 transition hover:bg-accent-400 sm:inline">
            {t('nav.promoCta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
