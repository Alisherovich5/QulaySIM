import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AccountSummary } from '../../lib/types'
import { formatDate } from '../../lib/format'
import AvatarPicker from './AvatarPicker'

interface Props {
  summary: AccountSummary
  onLogout: () => void
  onSummaryChange: (summary: AccountSummary) => void
}

/**
 * Who is signed in: the photo, the name, the address and the way out.
 *
 * One card, laid flat. The member-since date sits top right on a wide screen,
 * where the eye does not need it, and under the address on a phone, where
 * there is no top right to spare.
 */
export default function ProfileHeader({ summary, onLogout, onSummaryChange }: Props) {
  const { t, i18n } = useTranslation()
  const name = summary.full_name || summary.email.split('@')[0]
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
  const since = t('account.memberSince', { date: formatDate(summary.member_since, i18n.language) })

  return (
    <header className="ah-hero">
      <div className="ah-avatar">
        <AvatarPicker summary={summary} initials={initials} onUpdated={onSummaryChange} />
      </div>
      <div className="ah-who">
        <p className="ah-label">{t('nav.account')}</p>
        <h1 className="ah-name">{name}</h1>
        <p className="ah-mail">{summary.email}</p>
        <p className="ah-since ah-since-narrow">{since}</p>
      </div>
      <div className="ah-side">
        <p className="ah-since ah-since-wide">{since}</p>
        <button type="button" onClick={onLogout} className="ah-logout focus-ring">
          <LogOut size={17} aria-hidden />
          <span>{t('account.logout')}</span>
        </button>
      </div>
    </header>
  )
}
