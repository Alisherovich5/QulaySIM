import type { LucideIcon } from 'lucide-react'

export type StatTone = 'teal' | 'green' | 'violet' | 'amber'

interface Props {
  icon: LucideIcon
  /** A large, faint shape in the corner. Decoration, hidden from readers. */
  decor?: LucideIcon
  tone: StatTone
  label: string
  value: string
  hint?: string
  /** 0..1 — draws a bar under the value, with the hint as its caption. */
  meter?: number
}

/**
 * One of the four account figures.
 *
 * Each has its own tone so the row can be scanned by colour as well as by
 * label — teal for the eSIM itself, green for data, violet for places, amber
 * for money — and the tone stays on the icon tile, never on the number, which
 * is always the ink colour and always the largest thing on the card.
 */
export default function StatCard({ icon: Icon, decor: Decor, tone, label, value, hint, meter }: Props) {
  return (
    <div className="as-card" data-tone={tone}>
      <span className="as-icon" aria-hidden>
        <Icon size={22} strokeWidth={2} />
      </span>
      <div className="as-body">
        <p className="as-label">{label}</p>
        <p className="as-value">{value}</p>
        {meter !== undefined && (
          <span className="as-meter" role="presentation">
            <span style={{ width: `${Math.round(Math.min(1, Math.max(0, meter)) * 100)}%` }} />
          </span>
        )}
        {hint && <p className="as-hint">{hint}</p>}
      </div>
      {Decor && <Decor className="as-decor" strokeWidth={1.25} aria-hidden />}
    </div>
  )
}
