import { useEffect, useState } from 'react'
import { LifeBuoy, MessageCircle, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Faq } from '../lib/types'
import { Card, FaqItem, IconBadge } from '../components/ui'

export default function Support() {
  const [open, setOpen] = useState<number | null>(0)
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'en'
  const [remote, setRemote] = useState<Faq[] | null>(null)

  useEffect(() => {
    let alive = true
    api
      .get<Faq[]>('/faqs', { params: { lang } })
      .then((r) => alive && setRemote(r.data))
      .catch(() => alive && setRemote(null))
    return () => {
      alive = false
    }
  }, [lang])

  // Admin-managed FAQs (CMS) with i18n fallback.
  const faqs =
    remote && remote.length > 0
      ? remote.map((f) => ({ q: f.question, a: f.answer }))
      : (t('support.faqs', { returnObjects: true }) as { q: string; a: string }[])

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <IconBadge icon={LifeBuoy} tone="brand" size="xl" className="mx-auto" />
        <h1 className="mt-5 text-3xl font-700">{t('support.title')}</h1>
        <p className="mt-2 text-slate-soft">{t('support.subtitle')}</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-3">
        {faqs.map((faq, i) => (
          <FaqItem
            key={i}
            question={faq.q}
            answer={faq.a}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
        <Card hover className="flex items-start gap-3 p-5">
          <IconBadge icon={Smartphone} tone="brand" size="sm" />
          <div>
            <h3 className="font-700">{t('support.checkCompat')}</h3>
            <p className="mt-1 text-sm text-slate-soft">{t('support.checkCompatText')}</p>
          </div>
        </Card>
        <Card hover className="flex items-start gap-3 p-5">
          <IconBadge icon={MessageCircle} tone="brand" size="sm" />
          <div>
            <h3 className="font-700">{t('support.liveChat')}</h3>
            <p className="mt-1 text-sm text-slate-soft">{t('support.liveChatText')}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
