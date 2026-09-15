import { Globe2, House, LifeBuoy, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function MobileNav() {
  const { customer } = useAuth()
  const { t } = useTranslation()
  const items = [
    { to: '/', label: t('mobileNav.home'), icon: House, end: true },
    { to: '/destinations', label: t('mobileNav.tariffs'), icon: Globe2, end: false },
    { to: '/support', label: t('mobileNav.support'), icon: LifeBuoy, end: false },
    {
      to: customer ? '/account' : '/login',
      label: t('mobileNav.profile'),
      icon: UserRound,
      end: false,
    },
  ]
  return (
    <nav className="mobile-bottom-nav" aria-label={t('nav.destinations')}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end}>
          <item.icon size={21} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
