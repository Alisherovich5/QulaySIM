import { Check, Zap } from 'lucide-react'
import PriceTag from './PriceTag'
import { useTranslation } from 'react-i18next'
import type { Plan } from '../lib/types'
import { Badge, Button, Card } from './ui'

interface Props {
  plan: Plan
  onAdd: (plan: Plan) => void
  added?: boolean
}

/**
 * A tariff, drawn as a ticket rather than a card.
 *
 * Two things were wrong with the card version, and the owner spotted both
 * without naming them. Every block on the site was the same rounded rectangle
 * with the same ring, so nothing looked like it belonged to this shop in
 * particular; and each line of the spec carried its own little icon — a clock
 * beside "7 days", a wifi glyph beside "hotspot" — which is decoration, not
 * information. Nobody misreads "7 kun" without a clock next to it.
 *
 * The ticket is the signature: a stub separated by a perforation, with two
 * notches punched out of the sides. It is the right metaphor rather than a
 * decoration — this is a travel product, and the notches say so before a word
 * is read. The same device is meant to repeat wherever a plan or an eSIM
 * appears, so the site is recognisable from a thumbnail.
 */
export default function PlanCard({ plan, onAdd, added }: Props) {
  const { t } = useTranslation()

  // The spec, as one line of plain text. A separator between facts reads
  // faster than a stack of icon rows and takes a third of the height.
  const spec = [
    t('plan.validFor', { days: plan.validity_days }),
    plan.network_type,
    plan.supports_hotspot ? t('plan.hotspot') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card
      hover
      className={`ticket relative flex flex-col p-5 sm:p-6 ${
        plan.is_popular ? 'ring-2 ring-gold-500' : ''
      }`}
    >
      {plan.is_popular && (
        <Badge tone="gold" className="absolute -top-3 left-6 shadow-sm">
          <Zap size={12} /> {t('plan.mostPopular')}
        </Badge>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-3xl font-700 leading-none text-ink">
            {plan.is_unlimited ? t('plan.unlimited') : plan.data_label}
          </p>
          <p className="mt-2 text-sm text-slate-soft">{t('plan.dataAllowance')}</p>
        </div>
        {/* The one icon that survives, because 5G is a claim worth flagging. */}
        <Badge tone={plan.network_type === '5G' ? 'accent' : 'muted'}>{plan.network_type}</Badge>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-soft">{spec}</p>

      {/* The perforation. A dashed rule with a notch punched through each edge —
          the notches are drawn in the page background colour, so the card looks
          torn rather than painted. */}
      <div className="ticket-perforation relative mt-5" aria-hidden />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PriceTag usd={plan.price_usd} size="lg" className="text-ink" />
          {/* The note replaces the generic "one-time" line rather than sitting
              under it: two captions below one price read as a contradiction. */}
          <p className="text-xs text-slate-soft">{plan.price_note || t('plan.oneTime')}</p>
        </div>
        <Button
          onClick={() => onAdd(plan)}
          variant={added ? 'accent' : 'primary'}
          sheen={!added}
          className="w-full px-4 py-2.5 text-sm sm:w-auto"
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
