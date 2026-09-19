// Beside the components it dresses, not under pages/: this block is mounted
// from the landing page as well, and a component reaching up into pages/ is the
// dependency direction the layers audit exists to stop.
import './support.css'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Send, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Seo from '../Seo'
import SupportActionCard from './SupportActionCard'
import SupportCategories from './SupportCategories'
import SupportIllustration from './SupportIllustration'
import FAQAccordion, { type FaqEntry } from './FAQAccordion'
import { api } from '../../lib/api'
import { faqLd } from '../../lib/structured-data'
import type { Faq } from '../../lib/types'
import { CATEGORY_LABELS, categoryRank } from '../../lib/faq-categories'

/**
 * The help centre — the whole of /support, and the same block again at the foot
 * of the landing page.
 *
 * A component rather than a page because the owner asked for the help page to
 * appear on the home page as well, in place of the FAQ that used to be repeated
 * there. One implementation, mounted twice: /support passes `as="h1"` and
 * `seo`, the landing section takes the defaults and leaves the heading and the
 * structured data to the page it sits in — one h1 and one FAQPage per document,
 * which is what both of them are for.
 */

/** Where the operator answers. Confirmed against the address the page has
 *  always linked to rather than invented for this design. */
const TELEGRAM = 'https://t.me/qulaysim_support'
const TELEGRAM_HANDLE = '@qulaysim_support'

export default function SupportBody({ as = 'h2', seo = false }: { as?: 'h1' | 'h2'; seo?: boolean }) {
  const Heading = as
  const { t, i18n } = useTranslation()
  const [remote, setRemote] = useState<Faq[] | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

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
    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
        label: CATEGORY_LABELS[key] ? t(CATEGORY_LABELS[key]) : key,
      }))
      .sort((a, b) => categoryRank(a.key) - categoryRank(b.key))
  }, [faqs, t])

  /* The category buttons are the only filter now: the question box above them
     was removed at the owner's instruction. Twenty-odd answers under six
     labelled categories is a list somebody reads rather than searches, and the
     box asked a visitor to guess the wording of an answer they had not seen. */
  const shown = useMemo(
    () => (category ? faqs.filter((f) => f.category === category) : faqs),
    [faqs, category],
  )

  /* The first answer is open on arrival, as the design shows it, and stays with
     whatever the list currently is — an id that has been filtered away would
     leave the panel closed with nothing explaining why. */
  const activeId = openId && shown.some((f) => f.id === openId) ? openId : (shown[0]?.id ?? null)

  return (
    <div className="sup">
      {seo && (
        <Seo
          title={t('seo.supportTitle')}
          description={t('seo.supportDescription')}
          jsonLd={
            faqLd(faqs.map((f) => ({ question: f.question, answer: f.answer }))) ?? undefined
          }
        />
      )}

      <section className="sup-hero">
        <div>
          <p className="sup-label">{t('support.eyebrow')}</p>
          <Heading className="sup-title">{t('support.heroTitle')}</Heading>
          <p className="sup-lead">{t('support.heroLead')}</p>

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

        <div>
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
