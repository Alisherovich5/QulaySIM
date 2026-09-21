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
        {/* Chips, not a dropdown. A <select> draws the operating system's own
            popup — a white sheet with a system-blue row, in neither the site's
            colours nor its dark mode — and hides four options behind three
            interactions: open, read, choose. There are never more than a
            handful of durations, so they all fit on one line and cost one tap.
            The same swap was made for the region filter on /destinations. */}
        <div className="dst-filter">
          <span className="dst-filter__label" id={id}>
            {c.duration}
          </span>
          <div className="dst-chips" role="group" aria-labelledby={id}>
            <button
              type="button"
              aria-pressed={validity === 'all'}
              onClick={() => setValidity('all')}
            >
              {t('destinations.all')}
            </button>
            {durations.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={validity === String(days)}
                onClick={() => setValidity(String(days))}
              >
                {days} {c.days}
              </button>
            ))}
          </div>
        </div>
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
              {/* The row is the button — the radio circle is kept for the
                  keyboard and the screen reader, and drawn as a tick on the
                  chosen card instead. A dial beside a row that already buys
                  promised a second step that does not exist. */}
              <span className="plan-option-mark" aria-hidden="true">
                <Check size={15} strokeWidth={3} />
              </span>
              <div className="plan-option-top">
                <strong>{plan.is_unlimited ? t('plan.unlimited') : plan.data_label}</strong>
                {plan.is_popular && <span>{t('plan.mostPopular')}</span>}
              </div>
              {/* The supplier's own title used to sit here: "Afghanistan 1 GB
                  · 7 days", in English, under a card already printing 1 GB and
                  7 kun in Uzbek. Three facts, each said twice, one of them in a
                  language the page is not written in. */}
              <p className="plan-option-meta">
                {plan.validity_days} {c.days} · {plan.network_type}
                {plan.supports_hotspot ? ` · ${c.hotspot}` : ''}
              </p>
              <div className="plan-option-spec">
                <strong>{formatPrice(plan.price_usd)}</strong>
              </div>
              {plan.price_note && <p className="plan-option-note">{plan.price_note}</p>}
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
