import { Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'

// lucide-react dropped its brand glyphs, so the Instagram mark is inlined with
// lucide's own geometry (24 grid, 2px round stroke) instead of pulling in a
// second icon package for a single icon.
function InstagramIcon({ size = 20 }: { size?: number }) {
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

// Both social links are the same object: a 48px tinted tile on surface-2 with
// the same ring, radius and icon size. Previously one icon picked up a hover
// tint and the other did not, and the row was pulled off the column edge by a
// negative margin to fake alignment — so the two marks read as different
// components. The tile is the alignment: its left edge is the column's left
// edge, no margin correction needed.
//
// Hover is a fill rather than a tint change, so it is unmistakable on both
// surfaces: brand-600 (5.8:1 with white) in light, accent-700 (4.5:1) in dark,
// where brand-600 sits too close to the dark canvas to register. The lift is
// behind motion-safe, so under prefers-reduced-motion nothing moves at all.
const socialLinkClass = [
  'focus-ring grid h-12 w-12 place-items-center rounded-2xl',
  'bg-surface-2 text-slate-soft ring-1 ring-line',
  'transition duration-200 motion-safe:hover:-translate-y-0.5',
  'hover:bg-brand-600 hover:text-white hover:ring-brand-600',
  'hover:shadow-lg hover:shadow-brand-600/30',
  'dark:hover:bg-accent-700 dark:hover:ring-accent-700 dark:hover:shadow-accent-700/40',
].join(' ')

// Eyebrow labels, not headings-in-name-only: at 13px bold they competed with
// the links underneath them. Small, tracked and in the muted ink, they read as
// column labels and let the links be the largest thing in the column.
const columnLabelClass = 'text-[11px] font-700 uppercase tracking-[0.14em] text-slate-soft'

export default function Footer() {
  const { t } = useTranslation()

  // No mt-24: on top of the last section's own py-16 it read as an unfinished
  // page. The border and this footer's own padding are the separation.
  //
  // The bottom padding clears the fixed mobile nav (4.25rem) plus 0.75rem, so
  // the last row of content keeps a visible gap above the nav instead of
  // stopping flush against its top edge.
  return (
    <footer className="border-t border-line bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="container-page py-12 sm:py-14">
        {/* Left-aligned at every width. Centred text gave the social tiles
            nothing to line up with, which is what made them look dropped in.
            At sm the brand block takes the full row and the two link columns
            share the one below it, the social column pinned to the container's
            right edge rather than floating at the halfway mark; at lg all three
            sit on one line with the link columns packed to the right. */}
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-10 sm:gap-y-12 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-x-16">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-slate-soft">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className={columnLabelClass}>{t('footer.pages')}</h4>
            {/* The guides' only sitewide entry point. A page nothing links to
                is a page crawlers rarely visit and readers never find. */}
            <ul className="mt-3 space-y-1">
              {(
                [
                  ['/destinations', t('nav.destinations')],
                  ['/esim-nima', t('guides.what.title')],
                  ['/esim-ornatish', t('guides.install.title')],
                  ['/device-check', t('nav.deviceCheck')],
                  ['/support', t('nav.support')],
                ] as const
              ).map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="focus-ring -ml-1 inline-flex min-h-11 items-center rounded-xl px-1 text-[15px] font-600 text-ink transition-colors hover:text-brand-600 dark:hover:text-accent-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={columnLabelClass}>{t('footer.contacts')}</h4>
            <a
              href="https://t.me/qulaysim_support"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring group mt-3 -ml-1 inline-flex min-h-11 items-center gap-2.5 rounded-xl px-1 text-[15px] font-600 text-ink transition-colors hover:text-brand-600 dark:hover:text-accent-400"
            >
              <Send
                size={18}
                aria-hidden="true"
                className="text-brand-500 transition-colors group-hover:text-brand-600 dark:text-accent-400"
              />
              {t('support.adminUsername')}
            </a>
          </div>

          <div>
            <h4 className={columnLabelClass}>{t('footer.social')}</h4>
            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://t.me/qulaysimuz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.telegramChannelAria')}
                className={socialLinkClass}
              >
                <Send size={20} aria-hidden="true" />
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
        </div>
      </div>
    </footer>
  )
}
