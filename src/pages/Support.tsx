import './support.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Send, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo'
import SupportActionCard from '../components/support/SupportActionCard'
import SupportCategories from '../components/support/SupportCategories'
import SupportIllustration from '../components/support/SupportIllustration'
import SupportSearch from '../components/support/SupportSearch'
import FAQAccordion, { type FaqEntry } from '../components/support/FAQAccordion'
import { api } from '../lib/api'
import { faqLd } from '../lib/structured-data'
import type { Faq } from '../lib/types'

/** Where the operator answers. Confirmed against the address the page has
 *  always linked to rather than invented for this design. */
const TELEGRAM = 'https://t.me/qulaysim_support'
const TELEGRAM_HANDLE = '@qulaysim_support'

/**
 * Folded for searching: case, and the three apostrophes Uzbek is written with.
 *
 * "To'lov", "To‘lov" and "To’lov" are the same word to a reader and three
 * different strings to `includes`. A visitor typing the straight quote their
 * keyboard produces must still find an answer written with the curly one.
 */
function fold(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[‘’ʻʼ`´']/g, "'")
    .trim()
}

/** The labels the design uses, for the category keys the API sends. A key with
 *  no label here is shown under its own name rather than hidden. */
/* The order the design lists them in. A key that is not here sorts after the
   ones that are, so a category the operator adds appears rather than vanishing. */
const CATEGORY_ORDER = ['general', 'setup', 'billing', 'data', 'device']

const CATEGORY_LABELS: Record<string, string> = {
  general: 'support.catGeneral',
  setup: 'support.catSetup',
  billing: 'support.catBilling',
  device: 'support.catDevice',
  data: 'support.catData',
}

export default function Support() {
  const { t, i18n } = useTranslation()
  const [remote, setRemote] = useState<Faq[] | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const answersRef = useRef<HTMLDivElement>(null)

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

  /* The admin's answers when they exist, the baked ones when they do not. The
     local copy has no category of its own, so it all lands under "general" —
     which is true of it, and better than inventing a split. */
  const faqs: FaqEntry[] = useMemo(() => {
    if (remote?.length) {
      return remote.map((f) => ({
        id: String(f.id),
        category: f.category || 'general',
        question: f.question,
        answer: f.answer,
      }))
    }
    const local = t('support.faqs', { returnObjects: true }) as { q: string; a: string }[]
    return local.map((f, index) => ({
      id: `local-${index}`,
      category: 'general',
      question: f.q,
      answer: f.a,
    }))
  }, [remote, t])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const faq of faqs) counts.set(faq.category, (counts.get(faq.category) ?? 0) + 1)
    const rank = (key: string) => {
      const index = CATEGORY_ORDER.indexOf(key)
      return index === -1 ? CATEGORY_ORDER.length : index
    }
    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
        label: CATEGORY_LABELS[key] ? t(CATEGORY_LABELS[key]) : key,
      }))
      .sort((a, b) => rank(a.key) - rank(b.key))
  }, [faqs, t])

  /* Search wins over the category, deliberately: a query is a question about
     everything the page knows, and answering it inside one tab is how somebody
     concludes the site has no answer. */
  const shown = useMemo(() => {
    const needle = fold(query)
    if (needle) {
      return faqs.filter(
        (f) => fold(f.question).includes(needle) || fold(f.answer).includes(needle),
      )
    }
    return category ? faqs.filter((f) => f.category === category) : faqs
  }, [faqs, query, category])

  /* The first answer is open on arrival, as the design shows it, and stays with
     whatever the list currently is — an id that has been filtered away would
     leave the panel closed with nothing explaining why. */
  const activeId = openId && shown.some((f) => f.id === openId) ? openId : (shown[0]?.id ?? null)

  const scrollToAnswers = () => {
    const el = answersRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="sup">
      <Seo
        title={t('seo.supportTitle')}
        description={t('seo.supportDescription')}
        jsonLd={
          faqLd(faqs.map((f) => ({ question: f.question, answer: f.answer }))) ?? undefined
        }
      />

      <section className="sup-hero">
        <div>
          <p className="sup-label">{t('support.eyebrow')}</p>
          <h1 className="sup-title">{t('support.heroTitle')}</h1>
          <p className="sup-lead">{t('support.heroLead')}</p>

          <SupportSearch value={query} onChange={setQuery} onSubmit={scrollToAnswers} />

          {query && shown.length === 0 && (
            <p className="sup-empty" role="status">
              {t('support.noResults')}
              <br />
              <a href={TELEGRAM} target="_blank" rel="noreferrer">
                {t('support.writeTelegram')}
              </a>
            </p>
          )}
        </div>

        <SupportIllustration />
      </section>

      <section className="sup-cards">
        <SupportActionCard
          icon={<Smartphone size={26} aria-hidden />}
          title={t('support.deviceTitle')}
          text={t('support.deviceText')}
        >
          <div className="sup-card-links">
            <Link to="/device-check">
              {t('support.deviceCta')}
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
        </SupportActionCard>

        <SupportActionCard
          icon={<BookOpen size={26} aria-hidden />}
          title={t('support.guideTitle')}
          text={t('support.guideText')}
        >
          {/* Two links, so the card cannot be one: an anchor wrapping anchors is
              invalid and reads as a third control. */}
          <div className="sup-card-links">
            <Link to="/esim-ornatish#iphone">
              iPhone
              <ArrowRight size={17} aria-hidden />
            </Link>
            <span className="sup-card-sep" aria-hidden />
            <Link to="/esim-ornatish#android">
              Android
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
        </SupportActionCard>

        <SupportActionCard
          brand
          icon={<Send size={24} aria-hidden />}
          title={t('support.contactTitle')}
          text={TELEGRAM_HANDLE}
        >
          <a className="sup-pill focus-ring" href={TELEGRAM} target="_blank" rel="noreferrer">
            {t('support.writeTelegram')}
            <ArrowRight size={17} aria-hidden />
          </a>
        </SupportActionCard>
      </section>

      <section className="sup-faq">
        <div>
          <h2 className="sup-faq-title">{t('support.faqTitle')}</h2>
          <p className="sup-faq-note">{t('support.faqNote')}</p>
          <SupportCategories
            categories={categories}
            active={category}
            onPick={setCategory}
            label={t('support.faqTitle')}
          />
        </div>

        <div ref={answersRef}>
          {shown.length ? (
            <FAQAccordion faqs={shown} openId={activeId} onToggle={setOpenId} />
          ) : (
            <div className="sup-acc">
              <p className="sup-acc-a" style={{ paddingTop: 18 }}>
                {t('support.noResults')}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
