import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import CurrencySwitcher from './CurrencySwitcher'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mt-24 border-t border-line bg-surface pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
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
              className="mx-auto mt-4 inline-flex items-center gap-2 text-sm font-600 text-slate-soft transition hover:text-brand-600 sm:mx-0"
            >
              <Send size={16} className="text-brand-500" />
              {t('support.adminUsername')}
            </a>
          </div>
          <div className="flex items-center justify-center sm:justify-end">
            <CurrencySwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
