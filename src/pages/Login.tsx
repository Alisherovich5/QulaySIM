import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

  const [email, setEmail] = useState('demo@fastsim.dev')
  const [password, setPassword] = useState('demo12345')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      setError(t('auth.invalidLogin'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
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
                className="input mt-1.5"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" loading={loading} fullWidth className="py-3">
              {!loading && <LogIn size={18} />} {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-soft">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-600 text-brand-600">
              {t('auth.createAccount')}
            </Link>
          </p>
          <p className="mt-3 rounded-lg bg-mist p-3 text-center text-xs text-slate-soft">
            {t('auth.demoHint')}
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
