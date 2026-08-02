import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tooManyAttemptsMessage } from '../lib/api'
import GoogleSignIn from '../components/GoogleSignIn'
import Seo from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
import { Button, Card } from '../components/ui'

export default function Login() {
  const { login, customer } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/account'

  useEffect(() => {
    if (customer) navigate('/account', { replace: true })
  }, [customer, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      // A rate-limited attempt is not a wrong password; saying so sends the
      // customer off resetting a password that was fine.
      setError(status === 429 ? tooManyAttemptsMessage(err, t) : t('auth.invalidLogin'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      {/* noindex: a sign-in form is never the answer to a search, and letting
          it rank pulls clicks away from the page the searcher wanted. */}
      <Seo title={t('seo.signInTitle')} description={t('seo.homeDescription')} noindex />
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <Card className="mt-6 p-8">
          <h1 className="text-2xl font-700">{t('auth.loginTitle')}</h1>
          <p className="mt-1.5 text-sm text-slate-soft">{t('auth.loginSubtitle')}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
                className="input mt-1.5"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" loading={loading} fullWidth className="py-3">
              {!loading && <LogIn size={18} />} {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <GoogleSignIn
            onSuccess={() => navigate(from, { replace: true })}
            onError={setError}
          />

          <p className="mt-5 text-center text-sm text-slate-soft">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-600 text-brand-600">
              {t('auth.createAccount')}
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
