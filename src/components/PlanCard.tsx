import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { useDesignCopy } from '../lib/design-copy'
import type { Plan } from '../lib/types'
import { Button, PlaneIcon } from './ui'
interface Props {
  plan: Plan
  onAdd: (plan: Plan) => void
  added?: boolean
}
export default function PlanCard({ plan, onAdd, added }: Props) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const c = useDesignCopy()
  return (
    <article className="global-plan-card">
      <div>
        <div className="global-plan-top">
          <h3>{plan.is_unlimited ? t('plan.unlimited') : plan.data_label}</h3>
          <span>{plan.network_type}</span>
        </div>
        <p className="global-plan-name">{plan.title}</p>
        {plan.is_popular && <p className="global-plan-popular">{t('plan.mostPopular')}</p>}
        <dl>
          <div>
            <dt>{c.duration}</dt>
            <dd>
              {plan.validity_days} {c.days}
            </dd>
          </div>
          {plan.supports_hotspot && (
            <div>
              <dt>{c.hotspot}</dt>
              <dd>{c.included}</dd>
            </div>
          )}
        </dl>
      </div>
      <div>
        <p className="global-plan-price">{formatPrice(plan.price_usd)}</p>
        {plan.price_note && <p>{plan.price_note}</p>}
        <Button variant="ghost" type="button" onClick={() => onAdd(plan)} disabled={added}>
          {added ? (
            <>
              <Check size={17} />
              {t('plan.added')}
            </>
          ) : (
            <>
              {c.choose}
              <PlaneIcon size={17} />
            </>
          )}
        </Button>
      </div>
    </article>
  )
}
