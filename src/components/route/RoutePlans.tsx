import { useTranslation } from 'react-i18next'
import RoutePlanCard from './RoutePlanCard'
import { featuredIndex } from '../../lib/route-plan'
import type { Plan } from '../../lib/types'

/**
 * The grey tray the three tariffs sit in.
 *
 * It keeps its own empty state rather than leaving a blank rectangle: an
 * itinerary no plan covers is a real answer, and the useful half of it is the
 * suggestion — drop one stop and the rest are coverable.
 */

interface Props {
  plans: Plan[]
  loading: boolean
  onChoose: (plan: Plan) => void
}

export default function RoutePlans({ plans, loading, onChoose }: Props) {
  const { t } = useTranslation()
  const featured = featuredIndex(plans.length)

  return (
    <section className="rp-plans" aria-busy={loading}>
      {plans.length === 0 ? (
        <div className="rp-plans-empty">
          <h2>{loading ? t('rp.plansLoading') : t('rp.plansEmpty')}</h2>
          {!loading && <p>{t('rp.plansEmptyHint')}</p>}
        </div>
      ) : (
        <div className="rp-grid">
          {plans.map((plan, index) => (
            <RoutePlanCard
              key={plan.id}
              plan={plan}
              featured={index === featured}
              onChoose={onChoose}
            />
          ))}
        </div>
      )}
    </section>
  )
}
