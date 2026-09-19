import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'
import { flagUrl, flagSrcSet } from '../lib/format'
import { pathForLang, type SeoLang } from '../lib/seo'
import CurrencySwitcher from './CurrencySwitcher'

export default function LanguageSwitcher({
  embedded = false,
  compact = false,
  appearance = 'default',
}: {
  embedded?: boolean
  compact?: boolean
  appearance?: 'default' | 'navigation'
}) {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const navigation = appearance === 'navigation'

  const switchTo = (code: string) => {
    setOpen(false)
    const target = pathForLang(window.location.pathname, code as SeoLang)
    i18n.changeLanguage(code)
    if (target === window.location.pathname) {
      trigger.current?.focus()
      return
    }
    window.location.assign(`${target}${window.location.search}${window.location.hash}`)
  }
  const current =
    LANGUAGES.find((lang) => lang.code === i18n.resolvedLanguage?.split('-')[0]) || LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    const outside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])

  return (
    <div
      ref={ref}
      className={navigation ? 'navigation-language' : 'relative'}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={t('common.language')}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={
          navigation
            ? 'navigation-language__trigger'
            : `tap-44 inline-flex items-center gap-1.5 rounded-xl px-2.5 text-sm font-600 text-slate-soft transition hover:bg-surface hover:text-brand-600 ${compact ? 'h-10 w-10 justify-center p-0 ring-1 ring-line hover:ring-brand-300' : embedded ? 'h-9' : 'h-10 ring-1 ring-line hover:ring-brand-300'}`
        }
      >
        {navigation ? (
          <Globe2 size={20} aria-hidden />
        ) : (
          <img
            src={flagUrl(current.flag)}
            srcSet={flagSrcSet(current.flag)}
            alt=""
            className="h-4 w-6 rounded-[3px] object-cover ring-1 ring-line"
          />
        )}
        {!compact && <span>{current.short}</span>}
        {!compact && <ChevronDown size={14} aria-hidden className={open ? 'rotate-180' : ''} />}
      </button>
      {open && (
        <div
          id={id}
          className={
            navigation
              ? 'navigation-language__popover'
              : 'lang-pop absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl bg-surface p-1 shadow-xl shadow-brand-900/10 ring-1 ring-line'
          }
        >
          <div className={navigation ? 'navigation-language__choices' : ''}>
            {LANGUAGES.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => switchTo(lang.code)}
                aria-pressed={lang.code === current.code}
                className={
                  navigation
                    ? 'navigation-language__option'
                    : `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-mist ${lang.code === current.code ? 'font-600 text-brand-600' : 'text-ink'}`
                }
              >
                <img
                  src={flagUrl(lang.flag)}
                  srcSet={flagSrcSet(lang.flag)}
                  alt=""
                  className="h-4 w-6 rounded-[3px] object-cover ring-1 ring-line"
                />
                <span className="flex-1 text-left">{lang.label}</span>
                {lang.code === current.code && <Check size={16} aria-hidden />}
              </button>
            ))}
          </div>
          {navigation && (
            <div className="navigation-language__currency">
              <span>{t('common.currency')}</span>
              <CurrencySwitcher embedded />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
