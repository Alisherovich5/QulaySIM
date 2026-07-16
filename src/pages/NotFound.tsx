import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12 text-center">
      <div>
        <p className="font-display text-6xl font-700 text-brand-500">404</p>
        <h1 className="mt-4 text-2xl font-700">{t('notFound.title')}</h1>
        <p className="mt-2 text-slate-soft">{t('notFound.subtitle')}</p>
        <Button to="/" className="mx-auto mt-6 w-fit px-6 py-3">
          {t('notFound.backHome')}
        </Button>
      </div>
    </div>
  )
}
