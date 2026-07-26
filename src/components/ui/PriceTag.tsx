import { useTranslation } from 'react-i18next'

import { useCurrency } from '../../context/CurrencyContext'

type Size = 'sm' | 'md' | 'lg'

const PRIMARY: Record<Size, string> = {
  sm: 'text-sm font-700',
  md: 'font-display text-xl font-700',
  lg: 'font-display text-2xl font-700 sm:text-3xl',
}

const SECONDARY: Record<Size, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
}

interface Props {
  usd: number | null | undefined
  size?: Size
  /** Render on one line instead of stacked — for tight rows like the cart. */
  inline?: boolean
  className?: string
}

/**
 * Shows a price in both currencies. The selected currency leads and the other
 * follows as an approximation, so nobody has to convert in their head.
 */
export default function PriceTag({ usd, size = 'md', inline = false, className = '' }: Props) {
  const { t } = useTranslation()
  const { formatDual, isRateFallback, currency } = useCurrency()
  const { primary, secondary } = formatDual(usd)

  // When the central bank rate is unreachable we fall back to a fixed rate, so
  // the converted figure is an estimate rather than today's number. Say so on
  // hover instead of presenting a stale conversion as fact.
  const converted = currency === 'USD' ? secondary : primary
  const staleHint = isRateFallback && converted ? t('common.rateUnavailable') : undefined

  if (inline) {
    return (
      <span className={`inline-flex items-baseline gap-1.5 ${className}`} title={staleHint}>
        <span className={PRIMARY[size]}>{primary}</span>
        {secondary && (
          <span className={`${SECONDARY[size]} text-slate-soft`}>
            {secondary}
            {isRateFallback && <span aria-hidden> *</span>}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={`inline-flex flex-col leading-tight ${className}`} title={staleHint}>
      <span className={PRIMARY[size]}>{primary}</span>
      {secondary && (
        <span className={`${SECONDARY[size]} font-500 text-slate-soft`}>
          {secondary}
          {isRateFallback && <span aria-hidden> *</span>}
        </span>
      )}
    </span>
  )
}
