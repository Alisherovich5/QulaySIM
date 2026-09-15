import { useEffect, useState } from 'react'
import { ArrowUpRight, MessageCircle, Smartphone, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '../components/Seo'
import { api } from '../lib/api'
import { faqLd } from '../lib/structured-data'
import type { Faq } from '../lib/types'
import { FaqItem } from '../components/ui'
import { useDesignCopy } from '../lib/design-copy'

export default function Support() {
  const [open, setOpen] = useState<number | null>(0)
  const { t, i18n } = useTranslation()
  const c = useDesignCopy()
  const [remote, setRemote] = useState<Faq[] | null>(null)
  useEffect(() => {
    let active = true
    api
      .get<{ faqs?: Faq[] }>('/content/landing', { params: { lang: i18n.language } })
      .then((r) => active && setRemote(r.data.faqs ?? null))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [i18n.language])
  const faqs = remote?.length
    ? remote.map((f) => ({ q: f.question, a: f.answer }))
    : (t('support.faqs', { returnObjects: true }) as { q: string; a: string }[])
  return (
    <div className="qs-page qs-support container-page">
      <Seo
        title={t('seo.supportTitle')}
        description={t('seo.supportDescription')}
        jsonLd={faqLd(faqs.map((f) => ({ question: f.q, answer: f.a }))) ?? undefined}
      />
      <div className="support-layout">
        <div>
          <div className="page-intro">
            <p className="eyebrow">{c.help}</p>
            <h1>{c.supportTitle}</h1>
            <p>{c.supportNote}</p>
          </div>
          <div className="support-links">
            <a href="https://t.me/qulaysim_support" target="_blank" rel="noreferrer">
              <MessageCircle size={24} />
              <div>
                <strong>{t('support.contactAdmin')}</strong>
                <p>Telegram · @qulaysim_support</p>
              </div>
              <ArrowUpRight size={19} />
            </a>
            <Link to="/device-check">
              <Smartphone size={24} />
              <div>
                <strong>{c.deviceCta}</strong>
                <p>{t('support.checkCompatText')}</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
            <Link to="/esim-ornatish">
              <BookOpen size={24} />
              <div>
                <strong>{c.howLink}</strong>
                <p>iPhone · Android</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
        <div>
          <h2 className="mb-6">{c.faq}</h2>
          <div className="faq-list">
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
        </div>
      </div>
    </div>
  )
}
