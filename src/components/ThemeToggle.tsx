import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const KEY = 'fastsim_theme'

function getInitial(): 'light' | 'dark' {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  return 'light'
}

export default function ThemeToggle({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitial)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem(KEY, theme)
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`grid place-items-center rounded-xl text-slate-soft transition hover:bg-surface hover:text-brand-600 ${
        embedded ? 'tap-44 h-9 w-9' : 'tap-44 h-10 w-10 ring-1 ring-line hover:ring-brand-300'
      }`}
      // The tooltip and the accessible name say the same thing. Two different
      // strings for one control is what makes a screen reader and a hover tip
      // disagree about what the button does.
      aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
      title={isDark ? t('common.switchToLight') : t('common.switchToDark')}
    >
      {isDark ? (
        <Sun size={18} className="theme-icon" />
      ) : (
        <Moon size={18} className="theme-icon" />
      )}
    </button>
  )
}
