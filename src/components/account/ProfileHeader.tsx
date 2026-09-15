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
export default function ProfileHeader({ summary, onLogout, onSummaryChange }: Props) {
  const { t, i18n } = useTranslation()
  const name = summary.full_name || summary.email.split('@')[0]
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
  return (
    <header className="profile-header">
      <div className="profile-identity">
        <div className="profile-avatar">
          <AvatarPicker summary={summary} initials={initials} onUpdated={onSummaryChange} />
        </div>
        <div>
          <p className="eyebrow">{t('nav.account')}</p>
          <h1>{name}</h1>
          <p>{summary.email}</p>
        </div>
      </div>
      <div className="profile-actions">
        <p>{t('account.memberSince', { date: formatDate(summary.member_since, i18n.language) })}</p>
        <button type="button" onClick={onLogout}>
          <LogOut size={16} />
          {t('account.logout')}
        </button>
      </div>
    </header>
  )
}
