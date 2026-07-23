import { useTranslation } from 'react-i18next'
import { useCurrency, type Currency } from '../context/CurrencyContext'

export default function CurrencySwitcher({ embedded = false }: { embedded?: boolean }) {
  const { currency, setCurrency } = useCurrency()
  const { t } = useTranslation()

  return (
    <div
      className={`inline-flex items-center rounded-xl p-1 ${
        embedded ? 'h-9 bg-transparent' : 'h-10 ring-1 ring-line'
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
          className={`rounded-lg px-2 py-1 text-xs font-700 transition sm:px-2.5 ${
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
