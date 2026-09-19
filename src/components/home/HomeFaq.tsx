import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Faq } from '../../lib/types'
import { CATEGORY_LABELS, categoryRank } from '../../lib/faq-categories'
import FAQAccordion, { type FaqEntry } from '../support/FAQAccordion'
import SupportCategories from '../support/SupportCategories'
import Reveal from '../Reveal'

/**
 * The landing page's FAQ — the support page's, mounted again.
 *
 * The owner asked for the two to be identical, so this is the same two
 * components and the same stylesheet (`src/design/faq.css`) rather than a
 * second version of them that agrees today and drifts next month. What differs
 * is only what has to: this one takes its answers as a prop from the landing
 * content the page already fetched, where the support page fetches its own and
 * also has a search box above them.
 *
 * Answers come from the admin (CMS), falling back to the baked i18n copy when
 * the CMS is unreachable. The fallback has no topics of its own, so the topic
 * column disappears rather than offering one topic called "General".
 */
export default function HomeFaq({ faqs }: { faqs?: Faq[] }) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const items: FaqEntry[] = useMemo(() => {
    if (faqs && faqs.length > 0) {
      return faqs.map((f) => ({
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
  }, [faqs, t])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
        label: CATEGORY_LABELS[key] ? t(CATEGORY_LABELS[key]) : key,
      }))
      .sort((a, b) => categoryRank(a.key) - categoryRank(b.key))
  }, [items, t])

  const shown = useMemo(
    () => (category ? items.filter((f) => f.category === category) : items),
    [items, category],
  )

  /* The first answer is open on arrival, as the design shows it, and stays with
     whatever the list currently is. An id that has been filtered away — or one
     from the baked copy, after the admin's answers arrive and replace it —
     would otherwise leave the panel shut with nothing explaining why. */
  const activeId = openId && shown.some((f) => f.id === openId) ? openId : (shown[0]?.id ?? null)

  if (items.length === 0) return null

  return (
    <section className="home-faq">
      <div className="container-page">
        {/* One reveal for the section, not one per row: the motion that matters
            here is the answer opening, which replies to something the visitor
            did. A staggered entrance on top of it would only be noise. */}
        <Reveal>
          <div className="sup-faq">
            <div>
              <h2 className="sup-faq-title">{t('home.faqTitle')}</h2>
              <p className="sup-faq-note">{t('home.faqSubtitle')}</p>
              {/* One topic is not a choice, so the column only appears when the
                  answers are filed under more than one. */}
              {categories.length > 1 && (
                <SupportCategories
                  categories={categories}
                  active={category}
                  onPick={setCategory}
                  label={t('home.faqTitle')}
                />
              )}
            </div>

            <div>
              <FAQAccordion faqs={shown} openId={activeId} onToggle={setOpenId} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
