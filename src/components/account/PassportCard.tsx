import { Stamp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PassportCountry } from '../../lib/types'
import Flag from '../Flag'
import { Badge, Card, IconBadge } from '../ui'

interface Props {
  passport: PassportCountry[]
}

// Deterministic small rotation per index so stamps look hand-placed.
const ROTATIONS = ['-4deg', '3deg', '-2deg', '5deg', '-3deg', '2deg', '-5deg', '4deg']

export default function PassportCard({ passport }: Props) {
  const { t } = useTranslation()

  return (
    <Card className="overflow-visible">
      <div className="flex items-center justify-between gap-3 overflow-hidden rounded-t-2xl border-b border-line px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconBadge icon={Stamp} tone="brand" size="sm" />
          <div className="min-w-0">
            <h2 className="truncate font-700 leading-tight">{t('account.passportTitle')}</h2>
            <p className="truncate text-xs text-slate-soft">{t('account.passportSubtitle')}</p>
          </div>
        </div>
        <Badge tone="muted" className="shrink-0">{passport.length}</Badge>
      </div>

      {passport.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-soft">
          {t('account.passportEmpty')}
        </p>
      ) : (
        <div
          className="grid grid-cols-2 gap-4 rounded-b-2xl px-6 py-7 sm:grid-cols-3 sm:p-6 lg:grid-cols-4"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-line) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          {passport.map((c, i) => (
            <div
              key={c.iso2}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-surface/80 p-4 text-center shadow-sm transition hover:scale-[1.03]"
              style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}
            >
              <Flag
                iso2={c.iso2}
                w={80}
                className="h-8 w-12 rounded object-cover ring-1 ring-line grayscale-[15%]"
              />
              <p className="text-sm font-600 leading-tight text-ink">{c.name}</p>
              <p className="text-[11px] font-600 uppercase tracking-wide text-brand-500">
                {t('account.stamps', { count: c.esims })}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
