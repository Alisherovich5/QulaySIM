import { useTranslation } from 'react-i18next'

import { useCurrency } from '../context/CurrencyContext'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const PRIMARY: Record<Size, string> = {
  // xs exists for the destination tiles, which are ~110px wide on a phone.
  // A long amount like "118,800 so'm" wrapped there and stretched its card
  // taller than the rest of the row.
  // Grows to the sm step from the sm breakpoint up, so one instance covers
  // both. Two instances toggled with `hidden` cannot work here: the wrapper
  // hardcodes `inline-flex`, and which of the two display utilities wins is
  // decided by stylesheet order, not by the class attribute.
  xs: 'whitespace-nowrap text-[13px] font-700 tracking-tight sm:text-sm sm:tracking-normal',
  sm: 'text-sm font-700',
  // Sans with tabular figures, not the display face. Unbounded is wide by
  // design — good for a headline, wrong for "297 999 so'm", which broke onto a
  // second line and made every card a different height. Tabular figures also
  // line the digits up between cards, so a column of prices can be compared by
  // eye rather than read one by one.
  md: 'text-xl font-700 tabular-nums tracking-tight',
  lg: 'text-2xl font-700 tabular-nums tracking-tight sm:text-3xl',
}

const SECONDARY: Record<Size, string> = {
  xs: 'whitespace-nowrap text-[10px] sm:text-[11px]',
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
