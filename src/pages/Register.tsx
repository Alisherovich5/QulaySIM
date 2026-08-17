import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tooManyAttemptsMessage, validationMessage } from '../lib/api'
import GoogleSignIn from '../components/GoogleSignIn'
import Seo from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
import { Button, Card } from '../components/ui'

// The API publishes the rule it enforces (`/auth/providers`), and this reads it.
// It used to be a copy with a comment asking whoever changed the server to
// remember this file — an arrangement that holds right up until the day it
// matters, and then turns a clear message into an opaque 422.
//
// The fallback is only for the moment before the request lands; the server
// remains the one that decides.
const FALLBACK_MIN_PASSWORD = 8

export default function Register() {
  const [minPassword, setMinPassword] = useState(FALLBACK_MIN_PASSWORD)
  const { register, customer } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref') || ''
  const from = (location.state as { from?: string })?.from || '/account'

  useEffect(() => {
    api
      .get<{ min_password_length?: number }>('/auth/providers')
      .then((r) => {
        if (r.data.min_password_length) setMinPassword(r.data.min_password_length)
      })
      .catch(() => {
        // The fallback stands; the server still refuses anything shorter.
      })
  }, [])

  useEffect(() => {
    if (customer) navigate('/account', { replace: true })
  }, [customer, navigate])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < minPassword) {
      setError(t('auth.shortPassword'))
      return
    }
    setLoading(true)
    try {
      await register(email, fullName, password, referralCode)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      // Match on the machine-readable code, not the message text: the API
      // deliberately keeps that wording vague so it cannot confirm which
      // e-mails are registered.
      const response = (err as { response?: { status?: number; data?: { code?: string } } })
        ?.response
      if (response?.status === 409 || response?.data?.code === 'conflict') {
        setError(t('auth.emailTaken'))
      } else if (response?.status === 429) {
        setError(tooManyAttemptsMessage(err, t))
      } else {
        // A 422 says exactly which rule the password broke; showing the generic
        // message instead is what made a working form look broken.
        setError(validationMessage(err, t) ?? t('auth.createFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <Seo title={t('seo.registerTitle')} description={t('seo.homeDescription')} noindex />
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <Card className="mt-6 p-8">
          <h1 className="text-2xl font-700">{t('auth.registerTitle')}</h1>
          <p className="mt-1.5 text-sm text-slate-soft">{t('auth.registerSubtitle')}</p>
          {referralCode && (
            <p className="mt-3 rounded-lg bg-accent-500/10 px-3 py-2 text-center text-xs font-600 text-accent-600">
              {t('referral.referredBy', { code: referralCode })}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-600 text-slate-soft">{t('auth.fullName')}</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="input mt-1.5"
                placeholder={t('auth.fullNamePlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs font-600 text-slate-soft">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
                className="input mt-1.5"
                required
              />
            </div>
            <div>
              <label className="text-xs font-600 text-slate-soft">{t('auth.password')}</label>
              {/* autoComplete is "new-password", not "current-password": it tells a
                  password manager to offer a generated one rather than autofilling
                  the password the customer already uses somewhere else. */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="input mt-1.5"
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" loading={loading} fullWidth className="py-3">
              {!loading && <UserPlus size={18} />} {loading ? t('auth.creating') : t('auth.create')}
            </Button>
          </form>

          <GoogleSignIn
            onSuccess={() => navigate(from, { replace: true })}
            onError={setError}
          />

          <p className="mt-5 text-center text-sm text-slate-soft">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-600 text-brand-600">
              {t('auth.signIn')}
            </Link>
          </p>
        </Card>
        <Link
          to="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-sm font-600 text-slate-soft transition hover:text-brand-600"
        >
          <ArrowLeft size={15} /> {t('auth.backHome')}
        </Link>
      </div>
    </div>
  )
}
