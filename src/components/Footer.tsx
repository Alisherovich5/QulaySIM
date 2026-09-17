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
 * The footer carries the brand and the whole site map.
 *
 * It sits on the page surface rather than a dark slab: the shop is light
 * everywhere else and the dark block read as a different site. Links are laid
 * out in two columns instead of four thin ones — four columns left three of
 * them half empty and pushed the social block off to the side.
 */
export default function Footer() {
  const { t } = useTranslation()
  const c = useDesignCopy()
  const columns = [
    [
      {
        title: c.explore,
        links: [
          ['/destinations', t('nav.destinations')],
          ['/global', t('nav.global')],
          ['/account', t('nav.account')],
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
    ],
    [
      {
        title: c.learn,
        links: [
          ['/device-check', t('nav.deviceCheck')],
          ['/data-calculator', c.navEnough],
          ['/esim-nima', t('guides.what.title')],
          ['/esim-ornatish', c.howLink],
          ['/support', c.help],
        ] as const,
      },
    ],
  ]
  return (
    <footer className="site-footer">
      <div className="container-page">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo />
            <p>{t('footer.tagline')}</p>
          </div>

          <nav className="footer-links" aria-label={t('footer.pages')}>
            {columns.map((column, index) => (
              <div key={index}>
                {column.map((group) => (
                  <div key={group.title} className="footer-group">
                    <h3>{group.title}</h3>
                    {group.links.map(([to, label]) => (
                      <Link key={to} to={to}>
                        {label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div className="footer-social">
            <h3>{t('footer.social')}</h3>
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
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} QulaySIM</span>
          <span>O‘zbekcha · Русский · English</span>
        </div>
      </div>

    </footer>
  )
}
