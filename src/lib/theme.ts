import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

/** The theme lives in one place: the `dark` class on `<html>`.
 *
 * `public/theme-init.js` puts it there before first paint, and `ThemeToggle`
 * moves it afterwards. Nothing publishes an event when it changes, and adding
 * a context would mean the toggle and the reader had to agree about who owns
 * the value — they do not, because the class is also set by a script that runs
 * before React exists.
 *
 * So read the class, and watch it. A MutationObserver on one attribute of one
 * element costs nothing and cannot disagree with what is actually on screen,
 * which a mirrored piece of state eventually would.
 */
export function readThemeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useThemeMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setMode(readThemeMode())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return mode
}
