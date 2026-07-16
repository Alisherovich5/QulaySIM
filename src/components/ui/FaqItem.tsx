import { ChevronDown } from 'lucide-react'
import Card from './Card'

interface FaqItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

/** A single expandable FAQ row with a smooth height/opacity transition. */
export default function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <Card
      className={`overflow-hidden transition-shadow duration-300 ${
        isOpen ? 'shadow-lg shadow-brand-500/5 ring-brand-200' : ''
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:text-brand-600"
      >
        <span className="font-600 text-ink">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-soft transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-brand-500' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="border-t border-line px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-soft">
            {answer}
          </p>
        </div>
      </div>
    </Card>
  )
}
