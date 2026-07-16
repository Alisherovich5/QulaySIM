import { LogOut, MapPin, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AccountSummary } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { Button, Card } from '../ui'

interface Props {
  summary: AccountSummary
  onLogout: () => void
}

function initials(name: string, email: string) {
  const base = name.trim() || email
  const parts = base.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

export default function ProfileHeader({ summary, onLogout }: Props) {
  const { t } = useTranslation()

  return (
    <Card className="relative overflow-hidden">
      {/* travel-themed gradient banner */}
      <div className="relative h-28 bg-brand-900">
        <div className="aurora" style={{ opacity: 0.7 }} />
        <div className="hero-grid" />
      </div>

      <div className="relative px-6 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="-mt-10 grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-2xl font-700 uppercase text-white shadow-lg shadow-brand-500/30 ring-4 ring-surface">
              {initials(summary.full_name, summary.email)}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-700 leading-tight">
                {summary.full_name || summary.email.split('@')[0]}
              </h1>
              <p className="text-sm text-slate-soft">{summary.email}</p>
            </div>
          </div>

          <Button onClick={onLogout} variant="ghost" className="px-4 py-2 text-sm">
            <LogOut size={16} /> {t('account.logout')}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-soft">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-accent-500" />
            {t('account.memberSince', { date: formatDate(summary.member_since) })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-brand-500" />
            {t('account.countriesConnected', { count: summary.countries_connected })}
          </span>
        </div>
      </div>
    </Card>
  )
}
