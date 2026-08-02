import { useEffect, useState, type FormEvent } from 'react'
import { LifeBuoy, MessageCircle, Send, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Seo from '../components/Seo'
import { api } from '../lib/api'
import { faqLd } from '../lib/structured-data'
import type { Faq } from '../lib/types'
import { Button, Card, FaqItem, IconBadge } from '../components/ui'

const UZ_PHONE_PATTERN = /^\+998 \d{2} \d{3} \d{2} \d{2}$/

function formatUzPhone(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('998')) digits = digits.slice(3)
  digits = digits.slice(0, 9)
  const chunks = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean)
  return `+998${chunks.length ? ` ${chunks.join(' ')}` : ''}`
}

export default function Support() {
  const [open, setOpen] = useState<number | null>(0)
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'en'
  const [remote, setRemote] = useState<Faq[] | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '+998', message: '' })
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [phoneError, setPhoneError] = useState(false)

  // /api/faqs does not exist — it never did, so this silently 404'd on every
  // visit and the page always showed the i18n fallback. Admin-managed FAQs live
  // in the landing content payload, which is already cached per language.
  useEffect(() => {
    let alive = true
    api
      .get<{ faqs?: Faq[] }>('/content/landing', { params: { lang } })
      .then((r) => alive && setRemote(r.data?.faqs ?? null))
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

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!UZ_PHONE_PATTERN.test(form.phone)) {
      setPhoneError(true)
      return
    }
    setSubmitState('sending')
    try {
      await api.post('/support/message', { ...form, locale: lang })
      setForm({ name: '', email: '', phone: '+998', message: '' })
      setSubmitState('sent')
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <div className="container-page flex flex-col py-8 sm:py-12">
      {/* The FAQ markup is built from the same `faqs` array the page renders
          below, so the structured data and the visible answers cannot drift
          apart — Google checks, and a mismatch costs rich results site-wide. */}
      <Seo
        title={t('seo.supportTitle')}
        description={t('seo.supportDescription')}
        jsonLd={faqLd(faqs.map((f) => ({ question: f.q, answer: f.a }))) ?? undefined}
      />
      <div className="mx-auto max-w-2xl text-center">
        <IconBadge icon={LifeBuoy} tone="brand" size="xl" className="mx-auto" />
        <h1 className="mt-5 text-3xl font-700">{t('support.title')}</h1>
        <p className="mt-2 text-slate-soft">{t('support.subtitle')}</p>
      </div>

      <div className="order-2 mx-auto mt-6 max-w-2xl space-y-3 md:order-1 md:mt-10">
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

      <div className="order-3 mx-auto mt-6 grid max-w-2xl gap-4 sm:grid-cols-2 md:order-2 md:mt-10">
        <Card hover className="flex items-start gap-3 p-5">
          <IconBadge icon={Smartphone} tone="brand" size="sm" />
          <div>
            <h3 className="font-700">{t('support.checkCompat')}</h3>
            <p className="mt-1 text-sm text-slate-soft">{t('support.checkCompatText')}</p>
          </div>
        </Card>
        <a
          href="https://t.me/qulaysim_support"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <Card hover className="h-full flex items-start gap-3 p-5">
          <IconBadge icon={MessageCircle} tone="brand" size="sm" />
          <div>
            <h3 className="font-700">{t('support.contactAdmin')}</h3>
            <p className="mt-1 text-sm text-slate-soft">{t('support.contactAdminText')}</p>
            <p className="mt-2 text-sm font-700 text-brand-600">{t('support.adminUsername')}</p>
          </div>
          </Card>
        </a>
      </div>

      <Card className="order-1 mx-auto mt-6 hidden max-w-2xl p-5 sm:p-7 md:order-3">
        <div className="flex items-start gap-3">
          <IconBadge icon={Send} tone="brand" size="sm" />
          <div>
            <h2 className="font-display text-xl font-700 text-ink">{t('support.messageTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-soft">{t('support.messageText')}</p>
          </div>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submitMessage}>
          <label className="text-sm font-600 text-ink">
            {t('support.name')}
            <input
              className="input mt-1.5 w-full"
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }))
                setSubmitState('idle')
              }}
              minLength={2}
              maxLength={80}
              required
              autoComplete="name"
            />
          </label>
          <label className="text-sm font-600 text-ink">
            {t('support.email')}
            <input
              className="input mt-1.5 w-full"
              type="email"
              value={form.email}
              onChange={(event) => {
                setForm((current) => ({ ...current, email: event.target.value }))
                setSubmitState('idle')
              }}
              required
              autoComplete="email"
            />
          </label>
          <label className="text-sm font-600 text-ink">
            {t('support.phone')}
            <input
              className="input mt-1.5 w-full"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => {
                const phone = formatUzPhone(event.target.value)
                setForm((current) => ({ ...current, phone }))
                setPhoneError(phone.length > 4 && !UZ_PHONE_PATTERN.test(phone))
                setSubmitState('idle')
              }}
              onBlur={() => setPhoneError(!UZ_PHONE_PATTERN.test(form.phone))}
              placeholder="+998 90 123 45 67"
              pattern="\\+998 [0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}"
              aria-invalid={phoneError}
              aria-describedby={phoneError ? 'support-phone-error' : undefined}
              required
              autoComplete="tel"
            />
            {phoneError && <span id="support-phone-error" className="mt-1 block text-xs font-600 text-red-600">{t('support.phoneError')}</span>}
          </label>
          <label className="text-sm font-600 text-ink sm:col-span-2">
            {t('support.message')}
            <textarea
              className="input mt-1.5 min-h-32 w-full resize-y"
              value={form.message}
              onChange={(event) => {
                setForm((current) => ({ ...current, message: event.target.value }))
                setSubmitState('idle')
              }}
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitState === 'sending'}>
              {t('support.send')} <Send size={17} />
            </Button>
            {submitState === 'sent' && <p className="mt-3 text-sm font-600 text-brand-600">{t('support.sent')}</p>}
            {submitState === 'error' && <p className="mt-3 text-sm font-600 text-red-600">{t('support.sendError')}</p>}
          </div>
        </form>
      </Card>
    </div>
  )
}
