import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import CurrencySwitcher from './CurrencySwitcher'

// lucide-react dropped its brand glyphs, so the Instagram mark is inlined with
// lucide's own geometry (24 grid, 2px round stroke) instead of pulling in a
// second icon package for a single icon.
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

// One shared class list so both social buttons keep the same 44px touch target
// and focus ring; the row is icon-only, so each link carries its own aria-label.
const socialLinkClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-soft transition hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:hover:bg-white/5 dark:hover:text-accent-400 dark:focus-visible:ring-accent-400'

export default function Footer() {
  const { t } = useTranslation()

  // No mt-24: on top of the last section's own py-16 it read as an unfinished
  // page. The border and this footer's own padding are the separation.
  return (
    <footer className="border-t border-line bg-surface pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-7 text-center sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:text-left">
          <div>
            <Logo />
            <p className="mx-auto mt-4 max-w-xs text-sm text-slate-soft sm:mx-0">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-sm font-700 text-ink">{t('footer.contacts')}</h4>
            <a
              href="https://t.me/qulaysim_support"
              target="_blank"
              rel="noreferrer"
              className="mx-auto mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-600 text-slate-soft transition hover:text-brand-600 sm:mx-0"
            >
              <Send size={16} className="text-brand-500" />
              {t('support.adminUsername')}
            </a>
            <h4 className="mt-6 text-sm font-700 text-ink">{t('footer.social')}</h4>
            {/* The 44px buttons carry their own padding, so the row is pulled
                back by that padding to keep the icons on the column's text edge. */}
            <div className="mt-1 flex items-center justify-center gap-1 sm:-ml-3 sm:justify-start">
              <a
                href="https://t.me/qulaysimuz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.telegramChannelAria')}
                className={socialLinkClass}
              >
                <Send size={18} aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/qulaysim"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.instagramAria')}
                className={socialLinkClass}
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-end">
            <CurrencySwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
