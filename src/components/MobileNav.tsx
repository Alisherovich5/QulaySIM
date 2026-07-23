import { Globe2, House, UserRound } from 'lucide-react'
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
    { to: customer ? '/account' : '/login', label: t('mobileNav.profile'), icon: UserRound, end: false },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface/95 shadow-[0_-10px_28px_rgba(0,40,35,0.10)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <div className="container-page grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-cols-3 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `relative flex flex-col items-center justify-center gap-1 text-[11px] font-700 transition ${
              isActive ? 'text-brand-600' : 'text-slate-soft'
            }`}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-9 rounded-full bg-brand-500" />}
                <item.icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
