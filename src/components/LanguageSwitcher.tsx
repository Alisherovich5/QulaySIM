import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'
import { flagUrl, flagSrcSet } from '../lib/format'
import { pathForLang, type SeoLang } from '../lib/seo'

export default function LanguageSwitcher({ embedded = false, compact = false }: { embedded?: boolean; compact?: boolean }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /**
   * Switching language changes the URL, not just the strings.
   *
   * Each language is its own address now, so staying put would leave a Russian
   * page sitting at an Uzbek URL — the one thing the whole prefix scheme exists
   * to prevent. It is a real navigation rather than a router push because the
   * basename is fixed when the app boots; the router cannot be re-based in
   * place, and half-changing it would leave every link on the page pointing at
   * the previous language.
   *
   * The current path is carried across, so someone reading about Turkey in
   * Uzbek lands on the same page in Russian rather than back at the home page.
   */
  const switchTo = (code: string) => {
    setOpen(false)
    const target = pathForLang(window.location.pathname, code as SeoLang)
    if (target === window.location.pathname) return
    // Written before navigating so the destination — which may be an unprefixed
    // Uzbek URL with no language of its own in the address — starts up in the
    // language that was actually chosen.
    i18n.changeLanguage(code)
    window.location.assign(`${target}${window.location.search}${window.location.hash}`)
  }

  const current =
    LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) || LANGUAGES[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`tap-44 inline-flex items-center gap-1.5 rounded-xl px-2.5 text-sm font-600 text-slate-soft transition hover:bg-surface hover:text-brand-600 ${
          compact ? 'h-10 w-10 justify-center p-0 ring-1 ring-line hover:ring-brand-300' : embedded ? 'h-9' : 'h-10 ring-1 ring-line hover:ring-brand-300'
        }`}
        aria-label="Language"
      >
        <img
          src={flagUrl(current.flag)}
          srcSet={flagSrcSet(current.flag)}
          alt=""
          className="h-4 w-6 rounded-[3px] object-cover ring-1 ring-line"
        />
        {!compact && current.short}
        {!compact && <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl bg-surface p-1 shadow-xl shadow-brand-900/10 ring-1 ring-line">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchTo(lang.code)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-mist ${
                lang.code === current.code ? 'font-700 text-brand-600' : 'text-ink'
              }`}
            >
              <img
                src={flagUrl(lang.flag)}
                srcSet={flagSrcSet(lang.flag)}
                alt=""
                className="h-4 w-6 rounded-[3px] object-cover ring-1 ring-line"
              />
              <span className="flex-1 text-left">{lang.label}</span>
              {lang.code === current.code && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
