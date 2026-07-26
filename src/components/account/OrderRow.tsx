import { QrCode, Receipt } from 'lucide-react'
import { PriceTag } from '../ui'
import { useTranslation } from 'react-i18next'
import type { Order } from '../../lib/types'
import { formatDate } from '../../lib/format'
import Card from '../ui/Card'
import IconBadge from '../ui/IconBadge'

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-accent-500/10 text-accent-600',
  pending: 'bg-amber-signal/10 text-amber-signal',
  cancelled: 'bg-slate-soft/10 text-slate-soft',
  refunded: 'bg-red-500/10 text-red-500',
}

export default function OrderRow({ order }: { order: Order }) {
  const { t } = useTranslation()
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
      <IconBadge icon={Receipt} tone="brand" size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-600 text-ink">
          {t('account.orderNo', { id: order.id })}
        </p>
        <p className="flex items-center gap-2 text-xs text-slate-soft">
          {formatDate(order.created_at)}
          <span className="inline-flex items-center gap-1">
            <QrCode size={12} /> {t('account.esimCount', { count: order.esims.length })}
          </span>
        </p>
      </div>
      <span className={`chip ml-auto ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
        {t(`account.status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`, {
          defaultValue: order.status,
        })}
      </span>
      <div className="basis-full text-right sm:ml-2 sm:basis-auto">
        <PriceTag usd={order.total} size="sm" className="items-end text-ink" />
      </div>
    </Card>
  )
}
