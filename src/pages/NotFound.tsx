import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui'
import Seo from '../components/Seo'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="qs-page qs-not-found container-page grid min-h-[65vh] place-items-center py-12 text-center">
      {/* noindex because this renders under whatever URL was mistyped, and a
          soft 404 collecting index entries for addresses that never existed is
          how a small catalogue ends up looking like a large broken one. */}
      <Seo title={t('seo.notFoundTitle')} description={t('seo.notFoundDescription')} noindex />
      <div>
        <img src="/hero-globe.webp" alt="" width="200" height="200" className="mx-auto mb-5" />
        <p className="not-found-code">404</p>
        <h1 className="mt-4 text-2xl font-700">{t('notFound.title')}</h1>
        <p className="mt-2 text-slate-soft">{t('notFound.subtitle')}</p>
        <Button to="/" className="mx-auto mt-6 w-fit px-6 py-3">
          {t('notFound.backHome')}
        </Button>
      </div>
    </div>
  )
}
