import { Link } from 'react-router-dom'
import { Globe2, Shield, Headphones } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-soft">{t('footer.tagline')}</p>
          </div>
          <FooterCol
            title={t('footer.product')}
            links={[
              [t('nav.destinations'), '/destinations'],
              [t('footer.howItWorks'), '/#how'],
              [t('nav.support'), '/support'],
            ]}
          />
          <FooterCol
            title={t('footer.company')}
            links={[
              [t('footer.about'), '/#'],
              [t('footer.coverage'), '/destinations'],
              [t('footer.partners'), '/#'],
            ]}
          />
          <div>
            <h4 className="text-sm font-700 text-ink">{t('footer.whyTitle')}</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-soft">
              <li className="flex items-center gap-2">
                <Globe2 size={16} className="text-brand-500" /> {t('footer.why1')}
              </li>
              <li className="flex items-center gap-2">
                <Shield size={16} className="text-brand-500" /> {t('footer.why2')}
              </li>
              <li className="flex items-center gap-2">
                <Headphones size={16} className="text-brand-500" /> {t('footer.why3')}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-slate-soft sm:flex-row">
          <p>{t('footer.rights')}</p>
          <p>{t('footer.builtWith')}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-700 text-ink">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link to={href} className="text-slate-soft transition hover:text-brand-600">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
