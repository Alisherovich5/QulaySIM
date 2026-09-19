import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqEntry {
  id: string
  category: string
  question: string
  answer: string
}

/**
 * The answers, one open at a time. Used by the support page and by the landing
 * page, which the owner asked to be the same thing rather than two.
 *
 * A native <button> for each question rather than a div with a click handler:
 * that is what gives it Enter, Space, a focus ring and a role without writing
 * any of them. `aria-expanded` and `aria-controls` tie it to its answer.
 *
 * The answer stays mounted rather than being removed when the row closes,
 * because the row animates to its own height and a height needs something to
 * animate from. `inert` does the job the unmounting used to: the closed answer
 * is out of the tab order and out of the accessibility tree, so a screen reader
 * is not read five answers to a question nobody asked.
 */
export default function FAQAccordion({
  faqs,
  openId,
  onToggle,
}: {
  faqs: FaqEntry[]
  openId: string | null
  onToggle: (id: string | null) => void
}) {
  const base = useId()
  return (
    <div className="sup-acc">
      {faqs.map((faq) => {
        const open = openId === faq.id
        const panelId = `${base}-${faq.id}`
        return (
          <div key={faq.id} className={`sup-acc-row${open ? ' is-open' : ''}`}>
            <h3>
              <button
                type="button"
                className="sup-acc-q focus-ring"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => onToggle(open ? null : faq.id)}
              >
                {faq.question}
                <ChevronDown size={20} aria-hidden />
              </button>
            </h3>
            <div className="sup-acc-a" id={panelId} inert={!open}>
              <div>
                <p>{faq.answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
