import { ArrowUpRight, Camera, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDesignCopy } from '../lib/design-copy'
import Logo from './Logo'

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
      ],
    },
    {
      title: c.learn,
      links: [
        ['/device-check', t('nav.deviceCheck')],
        ['/data-calculator', c.navEnough],
        ['/esim-nima', t('guides.what.title')],
        ['/esim-ornatish', c.howLink],
        ['/support', c.help],
      ],
    },
    {
      title: c.legal,
      links: [
        ['/oferta', t('legal.oferta.title')],
        ['/maxfiylik', t('legal.privacy.title')],
        ['/qaytarish', t('legal.refund.title')],
      ],
    },
  ]
  return (
    <footer className="site-footer">
      <div className="container-page">
        <div className="footer-top">
          <div>
            <Logo light />
            <p className="footer-thesis">{c.footer}</p>
            <p>{c.footerNote}</p>
          </div>
          <a
            className="footer-contact"
            href="https://t.me/qulaysim_support"
            target="_blank"
            rel="noreferrer"
          >
            {c.contact}
            <ArrowUpRight size={22} />
          </a>
        </div>
        <div className="footer-columns">
          {groups.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([to, label]) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h3>{t('footer.social')}</h3>
            <a href="https://t.me/qulaysimuz" target="_blank" rel="noreferrer">
              <Send size={17} />
              Telegram
            </a>
            <a href="https://www.instagram.com/qulaysim" target="_blank" rel="noreferrer">
              <Camera size={17} />
              Instagram
            </a>
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
