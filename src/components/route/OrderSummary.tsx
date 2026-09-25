import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useCurrency } from '../../context/CurrencyContext'
import { useDialog } from '../../lib/useDialog'
import type { Country, Plan } from '../../lib/types'
import { PlaneIcon } from '../ui'

/**
 * What is about to be bought, before anything is bought.
 *
 * Deliberately not a confirmation: nothing here has been paid for, so the
 * primary action says "go to checkout" and hands over to the page that takes
 * money. Claiming a successful purchase in a dialog that never spoke to a
 * payment provider is the one thing this screen must not do.
 *
 * The destinations are listed because the plan itself does not name them — a
 * worldwide bundle covers 167 countries, and the three the customer typed are
 * the reason they are looking at it.
 */

interface Props {
  plan: Plan
  stops: Country[]
  onConfirm: () => void
  onClose: () => void
}

export default function OrderSummary({ plan, stops, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const panel = useDialog(onClose)

  return (
    <>
      <div className="rp-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className="rp-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rp-sum-title"
        tabIndex={-1}
      >
        <div className="rp-sheet-head">
          <h2 className="rp-sheet-title" id="rp-sum-title">
            {t('rp.summaryTitle')}
          </h2>
          <button type="button" className="rp-sheet-close" onClick={onClose} aria-label={t('rp.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="rp-sum-body">
          <div className="rp-sum-row">
            <span className="rp-sum-key">{t('rp.summaryPlan')}</span>
            <span className="rp-sum-val">
              {plan.data_label} · {t('rp.days', { count: plan.validity_days })}
            </span>
          </div>
          {stops.length > 0 && (
            <div className="rp-sum-row">
              <span className="rp-sum-key">{t('rp.summaryStops')}</span>
              <span className="rp-sum-val">{stops.map((c) => c.name).join(', ')}</span>
            </div>
          )}
          <div className="rp-sum-row rp-sum-total">
            <span className="rp-sum-key">{t('rp.summaryTotal')}</span>
            <span className="rp-sum-val">{formatPrice(plan.price_usd)}</span>
          </div>
          <p className="rp-sum-note">{t('rp.summaryNote')}</p>
        </div>

        <div className="rp-sum-actions">
          <button type="button" className="rp-cta" data-dialog-focus onClick={onConfirm}>
            {t('rp.summaryGo')}
            <PlaneIcon size={18} aria-hidden="true" />
          </button>
          <button type="button" className="rp-ghost" onClick={onClose}>
            {t('rp.summaryCancel')}
          </button>
        </div>
      </div>
    </>
  )
}
