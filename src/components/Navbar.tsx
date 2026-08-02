import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Globe, LifeBuoy, LogOut, ShoppingBag, Smartphone, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import CurrencySwitcher from './CurrencySwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import PromoStrip from './PromoStrip'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { count } = useCart()
  const { customer, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center gap-1.5 text-sm font-600 transition-colors ${
      isActive ? 'text-brand-600' : 'text-slate-soft hover:text-ink'
    }`

  return (
    <>
      {/* Inside the sticky header, so the offer stays on screen while someone
          browses. I had moved it out to reclaim ~40px per screen; that was the
          wrong call for a storefront whose main lever is the discount code —
          a promotion nobody can see while choosing a plan is not a promotion. */}
      <header className="sticky inset-x-0 top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <PromoStrip />
      <div className="container-page flex h-14 items-center justify-between max-[359px]:px-3 sm:h-16">
        <Logo />
        <nav className="hidden items-center gap-5 md:flex xl:gap-7">
          <NavLink to="/destinations" className={linkClass}>
            <Globe size={16} /> {t('nav.destinations')}
          </NavLink>
          {/* "Will my phone work?" is the objection that stops the sale, so it
              gets a top-level link rather than living only in a section of the
              landing page that a visitor has to scroll to. */}
          <NavLink to="/device-check" className={linkClass}>
            <Smartphone size={16} /> {t('nav.deviceCheck')}
          </NavLink>
          <NavLink to="/support" className={linkClass}>
            <LifeBuoy size={16} /> {t('nav.support')}
          </NavLink>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {/* One settings group at every desktop width. It used to be the group
              at xl and a loose theme+language pair below it, which meant the
              currency — a setting like the other two — was unreachable between
              md and xl and had to be hunted for in the footer. */}
          <div className="flex items-center gap-1 rounded-2xl bg-surface-2/80 p-1 ring-1 ring-line shadow-sm">
            <CurrencySwitcher embedded />
            <ThemeToggle embedded />
            <LanguageSwitcher embedded />
          </div>
          <div className="ml-1 flex items-center gap-2 border-l border-line pl-3">
            <Link
              to="/checkout"
              className="tap-44 relative grid h-10 w-10 place-items-center rounded-xl text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300"
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
                <Link to="/account" className="btn-ghost min-h-11 px-3 py-2 text-sm">
                  <UserRound size={16} />
                  <span className="hidden xl:inline">{customer.full_name || t('nav.account')}</span>
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
              <Link to="/login" className="btn-primary min-h-11 px-4 py-2 text-sm">
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
        {/* Settings first, then the cart, separated by a hairline — the same
            reading order as the desktop cluster. Four 40px cells plus the
            wordmark come to 316px of the 390px row, so the currency fits here
            without shrinking anything. */}
        <div className="flex items-center gap-1 max-[359px]:gap-0.5 md:hidden">
          <CurrencySwitcher compact />
          <ThemeToggle />
          <LanguageSwitcher compact />
          <span aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-line max-[359px]:mx-0" />
          <Link
            to="/checkout"
            className="tap-44 relative grid h-10 w-10 place-items-center rounded-xl text-slate-soft ring-1 ring-line transition hover:text-brand-600 hover:ring-brand-300"
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-700 text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      </header>
    </>
  )
}
