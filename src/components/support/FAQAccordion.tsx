import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqEntry {
  id: string
  category: string
  question: string
  answer: string
}

/**
 * The answers, one open at a time.
 *
 * A native <button> for each question rather than a div with a click handler:
 * that is what gives it Enter, Space, a focus ring and a role without writing
 * any of them. `aria-expanded` and `aria-controls` tie it to its answer, and
 * the answer is removed from the DOM when closed rather than hidden, so a
 * screen reader does not read five answers to a question nobody asked.
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
            {open && (
              <div className="sup-acc-a" id={panelId}>
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
