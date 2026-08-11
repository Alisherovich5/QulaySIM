import { Earth, Globe2, House, LifeBuoy, Smartphone, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

/** Persistent mobile navigation: core routes remain reachable with one thumb. */
export default function MobileNav() {
  const { customer } = useAuth()
  const { t } = useTranslation()
  const items = [
    { to: '/', label: t('mobileNav.home'), icon: House, end: true },
    { to: '/destinations', label: t('mobileNav.tariffs'), icon: Globe2, end: false },
    // The worldwide page had no route to it below 1280px at all: its only link
    // lived in the xl-only header. A product page nobody on a phone can reach is
    // a product page that does not sell. Short label — six cells on a 390px
    // screen leave about 60px each.
    { to: '/global', label: t('mobileNav.global'), icon: Earth, end: false },
    // "Does my phone work?" is the question that stops the sale, and its page
    // had no link at all below 1280px — the only one lived in the xl-only
    // header nav. It belongs where a phone user can reach it.
    { to: '/device-check', label: t('mobileNav.device'), icon: Smartphone, end: false },
    { to: '/support', label: t('mobileNav.support'), icon: LifeBuoy, end: false },
    { to: customer ? '/account' : '/login', label: t('mobileNav.profile'), icon: UserRound, end: false },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface/95 shadow-[0_-10px_28px_rgba(0,40,35,0.10)] backdrop-blur-xl xl:hidden" aria-label="Mobile navigation">
      {/* Six columns, not five. The grid was fixed at five, so adding the
          worldwide entry pushed "Profil" onto a second row and doubled the bar's
          height. Padding is trimmed too: at 390px six cells are about 60px each,
          which fits a 20px icon and a one-word label and nothing more. */}
      <div className="grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-cols-6 px-1 pb-[env(safe-area-inset-bottom)] sm:px-3">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-700 leading-tight transition max-[359px]:text-[9px] sm:text-[11px] ${
              isActive ? 'text-brand-600' : 'text-slate-soft'
            }`}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-9 rounded-full bg-brand-500" />}
                <item.icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                <span className="max-w-full truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
