import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import { useDesignCopy } from '../lib/design-copy'

/**
 * Telegram and Instagram marks, drawn here rather than taken from the icon
 * set: the set has no Instagram glyph and the camera it offers instead is not
 * the logo people look for.
 */
function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-5 9-8.1c.4-.3-.1-.5-.6-.2L6.6 12.5 1.8 11c-1-.3-1-1 .2-1.5l18.5-7.1c.9-.3 1.6.2 1.4 1.9Z" />
    </svg>
  )
}

function InstagramMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * A paper plane and the line it has flown, behind the columns.
 *
 * Inline rather than a file: it is two paths and a dotted stroke, which costs
 * less here than a request, and the colour has to follow the theme. Decorative
 * only — `aria-hidden`, and it sits on the layer below the content so it can
 * never intercept a click meant for a link.
 */
function FlightTrail() {
  return (
    <svg
      className="footer-trail"
      viewBox="0 0 1536 420"
      preserveAspectRatio="xMaxYMin meet"
      aria-hidden="true"
      focusable="false"
    >
      {/* Coordinates are the design's own, in a 1536-wide space measured from
          the hairline at the top: the line enters the left edge at y≈146, sags
          to y≈230 behind the middle columns and rises to the plane at x≈1330.
          Shallow on purpose — a steeper diagonal cuts across the columns
          instead of passing behind them. */}
      <path
        d="M0 146C250 198 520 232 900 188 1090 165 1240 134 1326 114"
        fill="none"
        stroke="#d7e9e6"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M1400 92c42-12 86-22 136-28"
        fill="none"
        stroke="#d7e9e6"
        strokeWidth="1.6"
        strokeDasharray="4 8"
        strokeLinecap="round"
      />
      <path d="M1330 94l44 18-44 18 10-18-10-18z" fill="#cfe6e2" />
    </svg>
  )
}

/**
 * The footer carries the brand and the whole site map.
 *
 * Four columns to the approved design: the brand with its two lines and the two
 * social marks, then travel, help and the legal texts. It sits on the page
 * surface rather than a dark slab — the shop is light everywhere else and the
 * dark block read as a different site.
 *
 * The wordmark behind it is set as type rather than shipped as an image, and
 * carries `aria-hidden`: it is the brand at the size of a watermark, not a
 * second heading for a screen reader to read out.
 */
export default function Footer() {
  const { t } = useTranslation()
  const c = useDesignCopy()

  const groups = [
    {
      title: c.explore,
      links: [
        ['/destinations', t('nav.destinations')],
        ['/global', t('nav.global')],
        ['/account', t('nav.account')],
      ] as const,
    },
    {
      title: t('nav.support'),
      links: [
        ['/device-check', t('nav.deviceCheck')],
        ['/esim-nima', t('guides.what.title')],
        ['/esim-ornatish', c.howLink],
        ['/support', c.help],
      ] as const,
    },
    {
      title: c.legal,
      links: [
        ['/oferta', t('legal.oferta.title')],
        ['/maxfiylik', t('legal.privacy.title')],
        ['/qaytarish', t('legal.refund.title')],
      ] as const,
    },
  ]

  return (
    <footer className="site-footer">
      <span className="footer-wordmark" aria-hidden="true">
        Qulaysim
      </span>
      <FlightTrail />

      <div className="footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo />
            <p>{t('footer.tagline')}</p>
            {/* Round chips, the same shape the live site uses, so the two
                marks read as buttons and not as another link in the list. */}
            <div className="footer-chips">
              <a
                href="https://t.me/qulaysimuz"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
              >
                <TelegramMark />
              </a>
              <a
                href="https://www.instagram.com/qulaysim"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <InstagramMark />
              </a>
            </div>
          </div>

          {groups.map((group) => (
            <nav key={group.title} className="footer-group" aria-label={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([to, label]) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Qulaysim</span>
          <div className="footer-bottom-right">
            <span>O‘zbekcha · Русский · English</span>
            {/* Scrolls rather than navigates: an anchor to "#" adds a history
                entry and leaves a stray hash in the address bar. */}
            <button
              type="button"
              className="footer-top-link"
              aria-label={t('footer.toTop')}
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'auto'
                    : 'smooth',
                })
              }
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
