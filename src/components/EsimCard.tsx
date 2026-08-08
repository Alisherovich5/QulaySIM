import { CalendarClock, CheckCircle2, CircleDot, Power, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ESIM } from '../lib/types'
import { formatDate, usedLabel } from '../lib/format'
import { Button, Card } from './ui'

interface Props {
  esim: ESIM
  onActivate: (id: number) => void
  activating?: boolean
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-signal/10 text-amber-signal',
  active: 'bg-accent-500/10 text-accent-600',
  expired: 'bg-slate-soft/10 text-slate-soft',
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

export default function EsimCard({ esim, onActivate, activating }: Props) {
  const { t, i18n } = useTranslation()
  const total = esim.data_total_mb
  const unlimited = total === 0
  const pct = unlimited ? 0 : Math.min(100, Math.round((esim.data_used_mb / total) * 100))
  const statusLabel = t(
    `account.status${esim.status.charAt(0).toUpperCase()}${esim.status.slice(1)}`,
  )
  const daysLeft = daysUntil(esim.expires_at)

  // Circular ring geometry
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = unlimited ? circ : circ * (1 - pct / 100)

  return (
    <Card className="lift overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        {/* An eSIM that the supplier has not provisioned yet has no QR: the
            column defaults to an empty string and stays that way until
            fulfilment runs. Rendering <img src=""> for it is not merely an
            empty box — the browser resolves the empty URL to the current
            document and downloads the whole page again, then draws a broken
            image where the code should be. */}
        <div className="grid h-[136px] w-[136px] shrink-0 place-items-center rounded-xl bg-white p-3 ring-1 ring-line">
          {esim.qr_image ? (
            <img src={esim.qr_image} alt="eSIM QR code" className="h-28 w-28" />
          ) : (
            <div className="flex flex-col items-center gap-2 px-1 text-center">
              <CircleDot size={22} className="animate-pulse text-slate-400" aria-hidden />
              <span className="text-[11px] leading-tight font-600 text-slate-500">
                {t('account.qrPending')}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-600 text-ink">{esim.plan.title}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-soft">ICCID {esim.iccid}</p>
            </div>
            <span className={`chip ${STATUS_STYLE[esim.status]}`}>
              {esim.status === 'active' ? <CheckCircle2 size={12} /> : <CircleDot size={12} />}
              {statusLabel}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-5">
            {/* Circular usage ring */}
            <div className="relative grid h-16 w-16 shrink-0 place-items-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
                <circle
                  cx="32"
                  cy="32"
                  r={r}
                  fill="none"
                  stroke="var(--color-brand-500)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dash}
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
                />
              </svg>
              <span className="absolute text-xs font-700 text-ink">
                {unlimited ? '∞' : `${pct}%`}
              </span>
            </div>

            <div className="flex-1 text-sm">
              {/* Remaining leads, used follows. "0 GB / 3 GB" asks the reader to
                  subtract before they learn the thing they opened the page for. */}
              <p className="text-slate-soft">{t('account.dataLeft')}</p>
              <p className="font-600 text-ink">
                {unlimited ? t('account.unlimited') : usedLabel(Math.max(0, total - esim.data_used_mb))}
              </p>
              {!unlimited && (
                <p className="text-xs text-slate-soft">
                  {t('account.ofTotalUsed', {
                    used: usedLabel(esim.data_used_mb),
                    total: usedLabel(total),
                  })}
                </p>
              )}
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-soft">
                <CalendarClock size={13} />
                {daysLeft !== null && esim.status !== 'expired'
                  ? t('account.daysLeft', { days: daysLeft })
                  : t('account.expires', { date: formatDate(esim.expires_at, i18n.language) })}
              </p>
            </div>
          </div>

          {/* The receipt line: when it was bought and what it cost. Both come
              from the order, frozen at the sale, so a later repricing does not
              rewrite what the customer remembers paying. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-slate-soft">
            <span className="flex items-center gap-1.5">
              <ShoppingBag size={13} />
              {t('account.purchasedOn', { date: formatDate(esim.created_at, i18n.language) })}
            </span>
            {esim.paid_uzs != null && (
              <span className="font-600 text-ink">
                {new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(esim.paid_uzs)}{' '}
                {t('account.som')}
                {esim.paid_usd != null && (
                  <span className="ml-1 font-400 text-slate-soft">
                    (${esim.paid_usd.toFixed(2)})
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {esim.status === 'pending' && (
              <Button
                onClick={() => onActivate(esim.id)}
                loading={activating}
                sheen
                className="min-h-11 px-4 py-2 text-sm"
              >
                {!activating && <Power size={15} />}{' '}
                {activating ? t('account.activating') : t('account.activate')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
