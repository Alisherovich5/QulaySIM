import { useState } from 'react'
import { ChevronDown, LifeBuoy, MessageCircle, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface FaqItem {
  q: string
  a: string
}

export default function Support() {
  const [open, setOpen] = useState<number | null>(0)
  const { t } = useTranslation()
  const faqs = t('support.faqs', { returnObjects: true }) as FaqItem[]

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <LifeBuoy size={26} />
        </span>
        <h1 className="mt-5 text-3xl font-700">{t('support.title')}</h1>
        <p className="mt-2 text-slate-soft">{t('support.subtitle')}</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i
          return (
            <div
              key={i}
              className={`card overflow-hidden transition-shadow duration-300 ${
                isOpen ? 'shadow-lg shadow-brand-500/5 ring-brand-200' : ''
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:text-brand-600"
              >
                <span className="font-600 text-ink">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-soft transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-brand-500' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-line px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-soft">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="card flex items-start gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/5">
          <Smartphone size={20} className="mt-0.5 text-brand-500" />
          <div>
            <h3 className="font-700">{t('support.checkCompat')}</h3>
            <p className="mt-1 text-sm text-slate-soft">{t('support.checkCompatText')}</p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/5">
          <MessageCircle size={20} className="mt-0.5 text-brand-500" />
          <div>
            <h3 className="font-700">{t('support.liveChat')}</h3>
            <p className="mt-1 text-sm text-slate-soft">{t('support.liveChatText')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
