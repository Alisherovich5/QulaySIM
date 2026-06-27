import { useState } from 'react'
import { Check, KeyRound, LogOut, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface Props {
  initialName: string
  onSaved: () => void
  onLogout: () => void
}

export default function SettingsForm({ initialName, onSaved, onLogout }: Props) {
  const { t } = useTranslation()
  const { refresh } = useAuth()
  const [fullName, setFullName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(false)
    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (fullName !== initialName) body.full_name = fullName
      if (newPassword) {
        body.current_password = currentPassword
        body.new_password = newPassword
      }
      await api.patch('/account/profile', body)
      await refresh()
      onSaved()
      setOk(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setOk(false), 2500)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || t('account.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="flex items-center gap-2">
          <UserRound size={18} className="text-brand-500" />
          <h2 className="font-700">{t('account.profileSettings')}</h2>
        </div>

        <div>
          <label className="text-xs font-600 text-slate-soft">{t('auth.fullName')}</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input mt-1.5"
          />
        </div>

        <div className="border-t border-line pt-4">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound size={16} className="text-slate-soft" />
            <span className="text-sm font-600 text-ink">{t('account.changePassword')}</span>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('account.currentPassword')}
              className="input"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('account.newPassword')}
              className="input"
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary sheen w-full py-3">
          {ok ? <Check size={18} /> : null}
          {saving ? t('account.saving') : ok ? t('account.saved') : t('account.saveChanges')}
        </button>
      </form>

      <div className="card flex flex-col justify-between p-6">
        <div>
          <h2 className="font-700">{t('account.session')}</h2>
          <p className="mt-2 text-sm text-slate-soft">{t('account.sessionHint')}</p>
        </div>
        <button onClick={onLogout} className="btn-ghost mt-5 w-full py-3 text-red-500 ring-red-200 hover:ring-red-300">
          <LogOut size={16} /> {t('account.logout')}
        </button>
      </div>
    </div>
  )
}
