import { Check, Clock, Signal, Wifi, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Plan } from '../lib/types'
import { formatPrice } from '../lib/format'

interface Props {
  plan: Plan
  onAdd: (plan: Plan) => void
  added?: boolean
}

export default function PlanCard({ plan, onAdd, added }: Props) {
  const { t } = useTranslation()
  return (
    <div
      className={`card relative flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/5 ${
        plan.is_popular ? 'ring-2 ring-brand-500' : ''
      }`}
    >
      {plan.is_popular && (
        <span className="chip absolute -top-3 left-6 bg-brand-500 text-white shadow-sm">
          <Zap size={12} /> {t('plan.mostPopular')}
        </span>
      )}

      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-3xl font-700 text-ink">
            {plan.is_unlimited ? t('plan.unlimited') : plan.data_label}
          </p>
          <p className="mt-1 text-sm text-slate-soft">{t('plan.dataAllowance')}</p>
        </div>
        <span
          className={`chip ${
            plan.network_type === '5G'
              ? 'bg-accent-500/10 text-accent-600'
              : 'bg-brand-50 text-brand-600'
          }`}
        >
          <Signal size={12} /> {plan.network_type}
        </span>
      </div>

      <ul className="mt-5 space-y-2.5 text-sm text-slate-soft">
        <li className="flex items-center gap-2">
          <Clock size={15} className="text-brand-500" /> {t('plan.validFor', { days: plan.validity_days })}
        </li>
        {plan.supports_hotspot && (
          <li className="flex items-center gap-2">
            <Wifi size={15} className="text-brand-500" /> {t('plan.hotspot')}
          </li>
        )}
        <li className="flex items-center gap-2">
          <Check size={15} className="text-brand-500" /> {t('plan.instantQr')}
        </li>
      </ul>

      <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
        <div>
          <p className="font-display text-2xl font-700 text-ink">{formatPrice(plan.price_usd)}</p>
          <p className="text-xs text-slate-soft">{t('plan.oneTime')}</p>
        </div>
        <button
          onClick={() => onAdd(plan)}
          className={added ? 'btn-accent px-4 py-2.5 text-sm' : 'btn-primary sheen px-4 py-2.5 text-sm'}
        >
          {added ? (
            <>
              <Check size={16} /> {t('plan.added')}
            </>
          ) : (
            t('plan.addToCart')
          )}
        </button>
      </div>
    </div>
  )
}
