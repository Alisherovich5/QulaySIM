import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChevronDown } from 'lucide-react'

/**
 * Four questions, each its own accordion.
 *
 * A native <details> would be shorter, but its open state cannot be animated
 * consistently across browsers and its marker fights the chevron the design
 * asks for. A button carrying `aria-expanded` and a region it controls says
 * the same thing to a screen reader.
 *
 * "See all" goes to the support page, which exists. The brief is explicit that
 * no dead links are to be invented, and this is the only page that answers
 * more questions than these four.
 */

const KEYS = ['1', '2', '3', '4'] as const

export default function RouteFaq() {
  const { t } = useTranslation()
  const [open, setOpen] = useState<string | null>(null)
  const base = useId()

  return (
    <section className="rp-faq" aria-labelledby={`${base}-title`}>
      <div className="rp-faq-head">
        <h2 className="rp-faq-title" id={`${base}-title`}>
          {t('rp.faqTitle')}
        </h2>
        <Link to="/support" className="rp-faq-all">
          {t('rp.faqAll')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="rp-faq-grid">
        {KEYS.map((key) => {
          const expanded = open === key
          return (
            <div className="rp-q" key={key}>
              <h3>
                <button
                  type="button"
                  className="rp-q-btn"
                  aria-expanded={expanded}
                  aria-controls={`${base}-a${key}`}
                  id={`${base}-q${key}`}
                  onClick={() => setOpen(expanded ? null : key)}
                >
                  <span>{t(`rp.q${key}`)}</span>
                  <ChevronDown size={18} className="rp-q-chev" aria-hidden="true" />
                </button>
              </h3>
              <div
                className="rp-a"
                id={`${base}-a${key}`}
                role="region"
                aria-labelledby={`${base}-q${key}`}
                hidden={!expanded}
              >
                {t(`rp.a${key}`)}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
