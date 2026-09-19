import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Send } from 'lucide-react'
import type { Faq } from '../../lib/types'
import { CATEGORY_LABELS, categoryRank } from '../../lib/faq-categories'
import Reveal from '../Reveal'

/** Where the operator answers. The same account the support page links to,
 *  rather than a second one invented here. */
const TELEGRAM = 'https://t.me/qulaysim_support'

interface Entry {
  id: string
  category: string
  question: string
  answer: string
}

/**
 * The landing page's FAQ: the support page's two columns, wired together.
 *
 * The topics on the left are jump links, not filters. The support page filters
 * with the same control because an operator can file a hundred answers there;
 * here there are five across four topics, and hiding four rows to reveal one is
 * a worse answer than scrolling. Picking a topic opens its first answer;
 * opening an answer lights its topic, so the two columns always agree.
 *
 * Answers come from the admin (CMS), falling back to the baked i18n copy when
 * the CMS is unreachable — the fallback has no topics of its own, so the strip
 * disappears rather than showing one topic called "General".
 *
 * Styling: `src/design/home-faq.css`. It does not share the support page's CSS
 * because that file ships in the support route's chunk and this section is on
 * the landing page's first paint.
 */
export default function HomeFaq({ faqs }: { faqs?: Faq[] }) {
  const { t } = useTranslation()
  const base = useId()

  const items: Entry[] = useMemo(() => {
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

  /* The open answer is the only state here. The active topic is read off it
     rather than stored beside it — two pieces of state that have to agree is
     how the left column ends up highlighting a topic whose answer is shut.

     `undefined` is "the visitor has not chosen yet", so the first answer is
     open; `null` is "they closed the one that was", so the panel stays shut.
     The two cannot be the same value: the list is the baked copy on first
     render and the admin's answers a moment later, and an id from the first
     list matches nothing in the second — which is how the panel ends up
     entirely closed a heartbeat after it opened. */
  const [picked, setPicked] = useState<string | null | undefined>(undefined)
  const openId =
    picked === undefined || (picked !== null && !items.some((item) => item.id === picked))
      ? (items[0]?.id ?? null)
      : picked
  const openEntry = items.find((item) => item.id === openId) ?? null

  const topics = useMemo(() => {
    const seen = new Map<string, string>()
    for (const item of items) if (!seen.has(item.category)) seen.set(item.category, item.id)
    return [...seen.entries()]
      .map(([key, firstId]) => ({
        key,
        firstId,
        label: CATEGORY_LABELS[key] ? t(CATEGORY_LABELS[key]) : key,
      }))
      .sort((a, b) => categoryRank(a.key) - categoryRank(b.key))
  }, [items, t])

  if (items.length === 0) return null

  return (
    <section className="home-faq">
      <div className="container-page">
        {/* One reveal for the whole section rather than one per row. The motion
            that matters here is the answer opening, which is a reply to
            something the visitor did; a second staggered entrance on top of it
            would only be noise. */}
        <Reveal>
          <div className="home-faq-grid">
            <div className="hf-head">
              <h2>{t('home.faqTitle')}</h2>
              <p className="hf-note">{t('home.faqSubtitle')}</p>

              {/* One topic is not a choice, so the strip only appears when the
                  answers are actually filed under more than one. */}
              {topics.length > 1 && (
                <div className="hf-topics" role="group" aria-label={t('home.faqTitle')}>
                  {topics.map((topic) => {
                    const on = openEntry?.category === topic.key
                    return (
                      <button
                        key={topic.key}
                        type="button"
                        className={`hf-topic focus-ring${on ? ' is-on' : ''}`}
                        /* Not aria-pressed: this does not stay pressed, it moves
                           the open answer. The panel's own aria-expanded says
                           what is open. */
                        onClick={() => setPicked(topic.firstId)}
                      >
                        {topic.label}
                        <ChevronRight size={18} aria-hidden />
                      </button>
                    )
                  })}
                </div>
              )}

            </div>

            <div className="hf-panel">
              {items.map((item) => {
                const open = openId === item.id
                const panelId = `${base}-${item.id}`
                return (
                  <div key={item.id} className={`hf-row${open ? ' is-open' : ''}`}>
                    <h3>
                      <button
                        type="button"
                        className="hf-q focus-ring"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setPicked(open ? null : item.id)}
                      >
                        {item.question}
                        <ChevronDown size={20} aria-hidden />
                      </button>
                    </h3>
                    {/* Kept mounted so its height has something to animate from,
                        and `inert` while shut so it is neither tabbable nor read
                        aloud. */}
                    <div className="hf-a" id={panelId} inert={!open}>
                      <div>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Last in the source, and last on a phone: the way out belongs
                after the answers, not before anybody has read one. On a wide
                screen the grid puts it back under the topics, beside them. */}
            <div className="hf-help">
              <p>{t('home.faqHelpTitle')}</p>
              <a className="focus-ring" href={TELEGRAM} target="_blank" rel="noreferrer">
                <Send size={17} aria-hidden />
                {t('support.writeTelegram')}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
