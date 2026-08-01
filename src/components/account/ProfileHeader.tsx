import type { ReactNode } from 'react'
import { LogOut, MapPin, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AccountSummary } from '../../lib/types'
import { formatDate } from '../../lib/format'
import AvatarPicker from './AvatarPicker'

interface Props {
  summary: AccountSummary
  onLogout: () => void
  /** Receives the summary the avatar endpoints return, so the header refreshes. */
  onSummaryChange: (summary: AccountSummary) => void
}

function initials(name: string, email: string) {
  const base = name.trim() || email
  const parts = base.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

/**
 * A meta fact under the name.
 *
 * These two lines used to be 12px grey text with a bare icon, which read as a
 * footnote rather than as part of the identity. Given a tinted well and a
 * pill they become structure, and they survive being wrapped on a phone.
 */
function Fact({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof MapPin
  tone: string
  children: ReactNode
}) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full bg-surface-2 py-1.5 pl-1.5 pr-3.5 text-xs font-500 text-slate-soft ring-1 ring-line">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${tone}`}>
        <Icon size={13} aria-hidden />
      </span>
      <span className="truncate">{children}</span>
    </span>
  )
}

export default function ProfileHeader({ summary, onLogout, onSummaryChange }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="card elev-2 relative overflow-visible">
      {/* Travel-themed banner. It was an empty 96px slab; sign-out now lives in
          it, which fills it and — more to the point — stops the button
          wrapping onto a line of its own underneath the avatar at 390px. */}
      <div className="relative h-24 overflow-hidden rounded-t-2xl bg-brand-900 sm:h-28">
        <div className="aurora" style={{ opacity: 0.62 }} />
        <div className="hero-grid" />
        {/* Sinks the bottom of the banner so it resolves into the card below
            instead of ending as a hard band. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-brand-900"
        />

        {/* The banner is dark in both themes, so this control is styled against
            white — including its focus outline, which the brand colour would
            lose against brand-900. */}
        <button
          type="button"
          onClick={onLogout}
          className="focus-ring-invert absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-600 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/22 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:right-4 sm:top-4"
        >
          <LogOut size={16} aria-hidden />
          {t('account.logout')}
        </button>
      </div>

      {/* One wrapping row rather than three stacked blocks: on a phone the
          avatar, the name and the facts each take a line; from `sm` up they
          sit on one baseline with the facts pushed to the far end, which uses
          the width instead of leaving half the card empty.
          `items-end` matters — AvatarPicker is `relative` and positions its
          camera badge against its own box, so letting it stretch to the full
          row width throws the badge out to the card's right edge. */}
      <div className="relative flex flex-wrap items-end gap-x-5 gap-y-4 px-5 pb-5 sm:px-7 sm:pb-7">
        <AvatarPicker
          summary={summary}
          initials={initials(summary.full_name, summary.email)}
          onUpdated={onSummaryChange}
        />

        <div className="min-w-0 basis-full sm:basis-0 sm:grow sm:pb-1">
          <h1 className="truncate font-display text-[1.55rem] font-700 leading-tight tracking-[-0.02em] sm:text-3xl">
            {summary.full_name || summary.email.split('@')[0]}
          </h1>
          <p className="mt-1 truncate text-sm text-slate-soft">{summary.email}</p>
        </div>

        <div className="flex min-w-0 basis-full flex-wrap items-center gap-2 sm:basis-auto sm:justify-end sm:pb-1">
          <Fact icon={ShieldCheck} tone="bg-accent-500/12 text-accent-600 dark:text-accent-400">
            {t('account.memberSince', { date: formatDate(summary.member_since, i18n.language) })}
          </Fact>
          <Fact icon={MapPin} tone="bg-brand-500/12 text-brand-600 dark:text-brand-300">
            {t('account.countriesConnected', { count: summary.countries_connected })}
          </Fact>
        </div>
      </div>
    </div>
  )
}
