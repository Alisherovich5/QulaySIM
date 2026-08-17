import { QrCode, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Order } from '../../lib/types'
import { formatDate } from '../../lib/format'
import PriceTag from '../PriceTag'

/* Status is carried by a dot plus a word rather than a filled pill. Five
   saturated pills down a list turn the page into a traffic light; a dot reads
   just as fast and lets the amount stay the loudest thing in the row. */
const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  paid: { dot: 'bg-accent-500', text: 'text-status-good-ink' },
  pending: { dot: 'bg-amber-signal', text: 'text-status-warn-ink' },
  cancelled: { dot: 'bg-slate-soft', text: 'text-slate-soft' },
  refunded: { dot: 'bg-red-500', text: 'text-status-bad-ink' },
}

interface Props {
  order: Order
  /** Position in the list — drives the staggered entrance only. */
  index?: number
}

/**
 * One line of the order history.
 *
 * This was a Card per order laid out as a wrapping row, which on a phone broke
 * into a header line and a detached, right-aligned price line — a table
 * pretending to be a list. It is now a list item inside one divided card:
 * identity on the left, amount on the right, on a single baseline grid at
 * every width.
 */
export default function OrderRow({ order, index = 0 }: Props) {
  const { t, i18n } = useTranslation()
  const tone = STATUS_TONE[order.status] || STATUS_TONE.pending

  return (
    <li
      className="rise flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60 sm:gap-4 sm:px-5 sm:py-4"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/15 dark:text-brand-300 sm:h-11 sm:w-11"
      >
        <Receipt size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-600 leading-tight text-ink">
          {t('account.orderNo', { id: order.id })}
        </p>
        {/* A pill rather than a bullet separator: with a seven-figure sum in
            the right column this line wraps on a 390px screen, and a dangling
            "•" at the end of the first line is the tell that it did. */}
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs leading-tight text-slate-soft">
          <span className="whitespace-nowrap">{formatDate(order.created_at, i18n.language)}</span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-surface-2 px-1.5 py-0.5 ring-1 ring-line">
            <QrCode size={11} aria-hidden /> {t('account.esimCount', { count: order.esims.length })}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <PriceTag usd={order.total} size="sm" className="items-end text-ink" />
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-600 uppercase tracking-[0.06em] ${tone.text}`}
        >
          <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
          {t(`account.status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`, {
            defaultValue: order.status,
          })}
        </span>
      </div>
    </li>
  )
}
