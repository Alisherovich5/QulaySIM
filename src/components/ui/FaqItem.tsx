import { useId } from 'react'
import { Plus, Minus } from 'lucide-react'
interface FaqItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}
export default function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  const id = useId()
  return (
    <div className="faq-item" data-open={isOpen}>
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={isOpen} aria-controls={id}>
          <span>{question}</span>
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </button>
      </h3>
      <div id={id} hidden={!isOpen}>
        <p>{answer}</p>
      </div>
    </div>
  )
}
