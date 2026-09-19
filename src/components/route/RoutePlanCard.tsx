import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowUpRight, Signal, Wifi } from 'lucide-react'
import { charmUzs } from '../../lib/charm'
import { useCurrency } from '../../context/CurrencyContext'
import type { Plan } from '../../lib/types'

/**
 * One tariff, drawn as the design draws it: shape, price, what it includes,
 * and the button.
 *
 * The price is split into a number and a unit on two lines. That is a design
 * decision with a practical edge — "200 999 so'm" on one line is the first
 * thing to wrap on a 320px screen, and a price that wraps mid-number is a
 * price nobody can read.
 *
 * Nothing here computes a price. The amount and the rounding come from the
 * shop's own currency context, the same two functions every other price on the
 * site goes through; this component only decides where the pieces sit.
 */

interface Props {
  plan: Plan
  featured: boolean
  onChoose: (plan: Plan) => void
}

export default function RoutePlanCard({ plan, featured, onChoose }: Props) {
  const { t } = useTranslation()
  const { currency, usdToUzs, formatUsd } = useCurrency()

  const amount =
    currency === 'USD'
      ? formatUsd(plan.price_usd)
      : new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(
          charmUzs(plan.price_usd * usdToUzs),
        )
  const unit = currency === 'USD' ? '' : t('common.som')

  const coverage = plan.coverage?.length ?? 0

  return (
    <article className="rp-card" data-featured={featured ? 'true' : 'false'}>
      {featured && (
        <svg className="rp-signal" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round">
            <path d="M24 96a52 52 0 0 1 72-72" />
            <path d="M44 96a32 32 0 0 1 44-44" />
            <path d="M64 96a12 12 0 0 1 16-16" />
          </g>
        </svg>
      )}

      <h3 className="rp-card-title">
        {plan.data_label} · {t('rp.days', { count: plan.validity_days })}
      </h3>

      <p className="rp-price">{amount}</p>
      {unit && <p className="rp-unit">{unit}</p>}

      <div className="rp-divider" />

      <ul className="rp-features">
        {coverage > 0 && (
          <li className="rp-feature">
            <span className="rp-feature-icon">
              <ArrowUpRight size={18} aria-hidden="true" />
            </span>
            {t('rp.countries', { count: coverage })}
          </li>
        )}
        {plan.network_type && (
          <li className="rp-feature">
            <span className="rp-feature-icon">
              <Signal size={18} aria-hidden="true" />
            </span>
            {plan.network_type}
          </li>
        )}
        {plan.supports_hotspot && (
          <li className="rp-feature">
            <span className="rp-feature-icon">
              <Wifi size={18} aria-hidden="true" />
            </span>
            {t('rp.hotspot')}
          </li>
        )}
      </ul>

      <button type="button" className="rp-cta" onClick={() => onChoose(plan)}>
        {t('rp.choose')}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </article>
  )
}
