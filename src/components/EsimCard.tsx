import { CalendarClock, CheckCircle2, CircleDot, Plus, Power } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ESIM } from '../lib/types'
import { formatDate, usedLabel } from '../lib/format'
import { Button, Card } from './ui'

interface Props {
  esim: ESIM
  onActivate: (id: number) => void
  onTopup?: (id: number) => void
  activating?: boolean
  toppingUp?: boolean
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

export default function EsimCard({ esim, onActivate, onTopup, activating, toppingUp }: Props) {
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
        <div className="grid shrink-0 place-items-center rounded-xl bg-white p-3 ring-1 ring-line">
          <img src={esim.qr_image} alt="eSIM QR code" className="h-28 w-28" />
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
              <p className="text-slate-soft">{t('account.dataUsed')}</p>
              <p className="font-600 text-ink">
                {unlimited
                  ? t('account.unlimited')
                  : `${usedLabel(esim.data_used_mb)} / ${usedLabel(total)}`}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-soft">
                <CalendarClock size={13} />
                {daysLeft !== null && esim.status !== 'expired'
                  ? t('account.daysLeft', { days: daysLeft })
                  : t('account.expires', { date: formatDate(esim.expires_at, i18n.language) })}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {esim.status === 'pending' && (
              <Button
                onClick={() => onActivate(esim.id)}
                loading={activating}
                sheen
                className="px-4 py-2 text-sm"
              >
                {!activating && <Power size={15} />}{' '}
                {activating ? t('account.activating') : t('account.activate')}
              </Button>
            )}
            {esim.status === 'active' && !unlimited && onTopup && (
              <Button
                onClick={() => onTopup(esim.id)}
                loading={toppingUp}
                variant="ghost"
                className="px-4 py-2 text-sm"
              >
                {!toppingUp && <Plus size={15} />}{' '}
                {toppingUp ? t('account.toppingUp') : t('account.topUp')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
