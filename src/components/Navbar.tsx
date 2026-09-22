import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Globe2, Globe, LifeBuoy, LogOut, ShoppingBag, Smartphone, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import CurrencySwitcher from './CurrencySwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  // The header's real height, published as a CSS variable.
  //
  // Anything else that sticks — the worldwide filter bar today — has to sit
  // directly under it, and a hardcoded offset is wrong the moment the promo
  // banner is dismissed or the viewport narrows. Measured rather than guessed,
  // and re-measured when it changes.
  /* Has the page moved off the top?
   *
   * Through a sentinel and an IntersectionObserver, not a scroll listener. A
   * scroll handler runs on the main thread for every frame of every flick —
   * hundreds of calls to read `window.scrollY` on a page that only needs to
   * know one boolean, on the phones this storefront is opened on. The observer
   * fires twice in a session: once when the top of the page leaves, once when
   * it comes back. It also cannot drift out of step with a page restored
   * mid-scroll by the back button, which a listener seeded at 0 does. */
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [detached, setDetached] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setDetached(!entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    // The gap the header floats on once it detaches counts as header height:
    // anything that sticks under it is pushed down by it. Read from the
    // computed style rather than duplicated here, so the number cannot drift
    // away from the stylesheet that sets it.
    const publish = () => {
      const gap = Number.parseFloat(getComputedStyle(el).top) || 0
      document.documentElement.style.setProperty(
        '--header-h',
        `${Math.round(el.getBoundingClientRect().height + gap)}px`,
      )
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => observer.disconnect()
  }, [detached])


  const { count } = useCart()
  const { customer, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  /* The active page wears a tinted pill rather than only a colour: on a header
     of five same-sized links, colour alone was not enough to find where you
     are. The padding sits on every link, not just the active one, so arriving
     on a page does not shift the row sideways. */
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-600 transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-800/40 dark:text-accent-400'
        : 'text-slate-soft hover:bg-mist hover:text-ink'
    }`

  return (
    <>
      {/* One pixel at the very top of the document, watched rather than
          measured. It is what tells the header it is no longer at rest. */}
      <div ref={sentinelRef} aria-hidden className="absolute left-0 top-0 h-px w-px" />
      <header
        ref={headerRef}
        data-detached={detached ? 'true' : 'false'}
        className="site-header sticky inset-x-0 top-0 z-50 border-b border-line bg-surface"
      >
      {/* The promo strip is off the header, by the owner's instruction.

          It was a dark band across the top of every page, and over the
          photographic hero it cut the artwork off before the visitor had seen
          it. The component and its styles stay; one line brings it back:

            import PromoStrip from './PromoStrip'
            <PromoStrip />   — here, directly inside <header>

          The header also loses ~44px of height on every screen, which the
          --header-h publisher below picks up on its own. */}
      <div className="nav-bar container-page flex items-center justify-between max-[359px]:px-3">
        <div className="shrink-0">
          <Logo />
        </div>
        {/* xl, not lg. Four links plus the settings group and the account button
            fit in 1024px only if none of them is "Butun dunyo": adding a fifth
            item pushed the total past the container, and because the settings
            group has a background it silently covered "Yordam" instead of
            wrapping. Raised to 1280 with the bottom nav extended to match, so
            there is never a width with no navigation at all. */}
        <nav className="hidden min-w-0 flex-nowrap items-center gap-5 xl:flex">
          <NavLink to="/destinations" className={linkClass}>
            <Globe size={16} /> {t('nav.destinations')}
          </NavLink>
          {/* "Will my phone work?" is the objection that stops the sale, so it
              gets a top-level link rather than living only in a section of the
              landing page that a visitor has to scroll to. */}
          <NavLink to="/device-check" className={linkClass}>
            <Smartphone size={16} /> {t('nav.deviceCheck')}
          </NavLink>
          {/* Before support, after the two links a visitor uses first. Placed at
              the head of the row it crowded the logo and wrapped onto a second
              line, which pushed the rest of the bar out of place. */}
          <NavLink to="/global" className={linkClass}>
            <Globe2 size={16} /> {t('nav.global')}
          </NavLink>
          <NavLink to="/support" className={linkClass}>
            <LifeBuoy size={16} /> {t('nav.support')}
          </NavLink>
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
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
                  <span className="hidden 2xl:inline">{customer.full_name || t('nav.account')}</span>
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
        <div className="flex items-center gap-1 max-[359px]:gap-0.5 xl:hidden">
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
