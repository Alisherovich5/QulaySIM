import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Globe, LifeBuoy, LogOut, ShoppingBag, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { count } = useCart()
  const { customer, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 text-sm font-600 transition-colors ${
      isActive ? 'text-brand-600' : 'text-slate-soft hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/destinations" className={linkClass}>
            <Globe size={16} /> {t('nav.destinations')}
          </NavLink>
          <NavLink to="/support" className={linkClass}>
            <LifeBuoy size={16} /> {t('nav.support')}
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            to="/checkout"
            className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300"
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-700 text-white">
                {count}
              </span>
            )}
          </Link>
          {customer ? (
            <div className="flex items-center gap-2">
              <Link to="/account" className="btn-ghost px-3 py-2 text-sm">
                <UserRound size={16} />
                <span className="hidden sm:inline">{customer.full_name || t('nav.account')}</span>
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary px-4 py-2 text-sm">
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
