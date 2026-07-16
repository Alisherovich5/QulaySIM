import { Check, Clock, Signal, Wifi, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Plan } from '../lib/types'
import { formatPrice } from '../lib/format'
import { Badge, Button, Card } from './ui'

interface Props {
  plan: Plan
  onAdd: (plan: Plan) => void
  added?: boolean
}

export default function PlanCard({ plan, onAdd, added }: Props) {
  const { t } = useTranslation()
  return (
    <Card hover className={`relative flex flex-col p-6 ${plan.is_popular ? 'ring-2 ring-gold-500' : ''}`}>
      {plan.is_popular && (
        <Badge tone="gold" className="absolute -top-3 left-6 shadow-sm">
          <Zap size={12} /> {t('plan.mostPopular')}
        </Badge>
      )}

      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-3xl font-700 text-ink">
            {plan.is_unlimited ? t('plan.unlimited') : plan.data_label}
          </p>
          <p className="mt-1 text-sm text-slate-soft">{t('plan.dataAllowance')}</p>
        </div>
        <Badge tone={plan.network_type === '5G' ? 'accent' : 'muted'}>
          <Signal size={12} /> {plan.network_type}
        </Badge>
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
        <Button
          onClick={() => onAdd(plan)}
          variant={added ? 'accent' : 'primary'}
          sheen={!added}
          className="px-4 py-2.5 text-sm"
        >
          {added ? (
            <>
              <Check size={16} /> {t('plan.added')}
            </>
          ) : (
            t('plan.addToCart')
          )}
        </Button>
      </div>
    </Card>
  )
}
