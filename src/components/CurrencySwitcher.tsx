import { useTranslation } from 'react-i18next'
import { useCurrency, type Currency } from '../context/CurrencyContext'

interface CurrencySwitcherProps {
  /** drops the ring so the control can sit inside the header's settings group */
  embedded?: boolean
  /**
   * Single 40px cell showing the active code, for the mobile header row.
   * Named after LanguageSwitcher's `compact`, which does the same thing there.
   */
  compact?: boolean
}

export default function CurrencySwitcher({ embedded = false, compact = false }: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency()
  const { t } = useTranslation()

  // Two currencies, so on mobile this is a switch rather than a segmented
  // control: one cell the size of the theme toggle next to it, instead of a
  // 96px pair that would crowd the row at 390px. The label names the target so
  // the button says what it does, not only what is selected.
  if (compact) {
    const next: Currency = currency === 'UZS' ? 'USD' : 'UZS'
    const label = t('common.currencySwitchTo', {
      code: next,
      defaultValue: `${t('common.currency')}: ${currency}`,
    })
    return (
      <button
        type="button"
        onClick={() => setCurrency(next)}
        title={label}
        aria-label={label}
        // The visible box matches the 40px controls beside it; the ::after pad
        // takes the hit area to 46px so the target still clears 44.
        className="focus-ring relative grid h-10 w-10 place-items-center rounded-xl text-[11px] font-700 tracking-tight text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300 after:absolute after:-inset-[3px] after:content-['']"
      >
        {currency}
      </button>
    )
  }

  return (
    <div
      className={`inline-flex items-center rounded-xl p-1 ${
        embedded ? 'bg-transparent' : 'ring-1 ring-line'
      }`}
      role="group"
      aria-label={t('common.currency')}
    >
      {(['UZS', 'USD'] as Currency[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setCurrency(option)}
          aria-pressed={currency === option}
          className={`focus-ring grid min-h-11 min-w-11 place-items-center rounded-lg px-2 text-xs font-700 transition sm:px-2.5 ${
            currency === option
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-soft hover:text-brand-600'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
