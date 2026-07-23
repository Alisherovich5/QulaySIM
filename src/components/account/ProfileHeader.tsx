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
    <Card className="relative overflow-visible">
      {/* travel-themed gradient banner */}
      <div className="relative h-24 overflow-hidden rounded-t-2xl bg-brand-900 sm:h-28">
        <div className="aurora" style={{ opacity: 0.7 }} />
        <div className="hero-grid" />
      </div>

      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-end gap-3 sm:gap-4">
            <div className="-mt-9 grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-xl font-700 uppercase text-white shadow-lg shadow-brand-500/30 ring-4 ring-surface sm:-mt-10 sm:h-20 sm:w-20 sm:text-2xl">
              {initials(summary.full_name, summary.email)}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-xl font-700 leading-tight sm:text-2xl">
                {summary.full_name || summary.email.split('@')[0]}
              </h1>
              <p className="truncate text-sm text-slate-soft">{summary.email}</p>
            </div>
          </div>

          <Button onClick={onLogout} variant="ghost" className="px-3 py-2 text-sm sm:px-4">
            <LogOut size={16} /> {t('account.logout')}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-soft sm:gap-x-5">
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
