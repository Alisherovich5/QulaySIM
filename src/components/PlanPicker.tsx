import { useId, useMemo, useState } from 'react'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { useDesignCopy } from '../lib/design-copy'
import type { Plan } from '../lib/types'
import { Button } from './ui'

export default function PlanPicker({
  plans,
  onAdd,
  added,
}: {
  plans: Plan[]
  onAdd: (plan: Plan) => void
  added: number | null
}) {
  const c = useDesignCopy()
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const id = useId()
  const [validity, setValidity] = useState('all')
  const [selected, setSelected] = useState<number | null>(null)
  const sorted = useMemo(() => [...plans].sort((a, b) => a.price_usd - b.price_usd), [plans])
  const durations = [...new Set(plans.map((plan) => plan.validity_days))].sort((a, b) => a - b)
  const visible = sorted.filter(
    (plan) => validity === 'all' || plan.validity_days === Number(validity),
  )
  const picked =
    visible.find((plan) => plan.id === selected) ??
    visible.find((plan) => plan.is_popular) ??
    visible[0]
  if (!picked) return <div className="card p-6">{t('global.plansEmpty')}</div>
  return (
    <section className="plan-picker">
      <div className="plan-picker-toolbar">
        <p>{c.planNote}</p>
        <label htmlFor={id}>
          {c.duration}
          <select
            id={id}
            name="validity"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
          >
            <option value="all">{t('destinations.all')}</option>
            {durations.map((days) => (
              <option key={days} value={days}>
                {days} {c.days}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="plan-layout">
        <fieldset className="plan-options">
          <legend className="sr-only">{c.planTitle}</legend>
          {visible.map((plan) => (
            <label className="plan-option" key={plan.id}>
              <input
                type="radio"
                name={id + '-plan'}
                checked={picked.id === plan.id}
                /* The tap both picks and buys. The summary beside it repeats
                   what the row already prints, so waiting for a second tap on
                   a button below the fold was a step that told nobody
                   anything. */
                onChange={() => {
                  setSelected(plan.id)
                  onAdd(plan)
                }}
                value={plan.id}
              />
              <div className="plan-option-top">
                <strong>{plan.is_unlimited ? t('plan.unlimited') : plan.data_label}</strong>
                {plan.is_popular && <span>{t('plan.mostPopular')}</span>}
              </div>
              <p>{plan.title}</p>
              <div className="plan-option-spec">
                <span>
                  {plan.validity_days} {c.days} · {plan.network_type}
                </span>
                <strong>{formatPrice(plan.price_usd)}</strong>
              </div>
              {plan.price_note && <p>{plan.price_note}</p>}
            </label>
          ))}
        </fieldset>
        <aside className="plan-summary" aria-live="polite">
          <h3>{picked.is_unlimited ? t('plan.unlimited') : picked.data_label}</h3>
          <p>{picked.title}</p>
          <dl>
            <div>
              <dt>{c.duration}</dt>
              <dd>
                {picked.validity_days} {c.days}
              </dd>
            </div>
            <div>
              <dt>{c.network}</dt>
              <dd>{picked.network_type}</dd>
            </div>
            {picked.supports_hotspot && (
              <div>
                <dt>{c.hotspot}</dt>
                <dd>{c.included}</dd>
              </div>
            )}
          </dl>
          <div className="plan-total">
            <span>{c.total}</span>
            <strong>{formatPrice(picked.price_usd)}</strong>
            {picked.price_note && <p>{picked.price_note}</p>}
          </div>
          <Button type="button" onClick={() => onAdd(picked)} disabled={added === picked.id}>
            {added === picked.id ? (
              <>
                <Check size={18} />
                {t('plan.added')}
              </>
            ) : (
              <>
                {c.choose}
                <ArrowRight size={18} />
              </>
            )}
          </Button>
          <Link to="/device-check" className="text-link">
            <ShieldCheck size={16} />
            {c.deviceCta}
          </Link>
        </aside>
      </div>
    </section>
  )
}
