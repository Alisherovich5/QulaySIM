import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const KEY = 'fastsim_theme'

function getInitial(): 'light' | 'dark' {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  return 'light'
}

export default function ThemeToggle({ embedded = false }: { embedded?: boolean }) {
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
        embedded ? 'h-9 w-9' : 'h-10 w-10 ring-1 ring-line hover:ring-brand-300'
      }`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Sun size={18} className="theme-icon" />
      ) : (
        <Moon size={18} className="theme-icon" />
      )}
    </button>
  )
}
