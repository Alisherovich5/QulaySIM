import { useRef, type KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface SectionItem<K extends string> {
  key: K
  label: string
  icon: LucideIcon
}

interface Props<K extends string> {
  items: SectionItem<K>[]
  active: K
  onChange: (key: K) => void
  label: string
}

/**
 * The switch between the account's sections.
 *
 * It used to be a thin grey rail of six tabs that scrolled sideways on a
 * phone, and people did not notice it was there — the owner's word was that
 * it was hard to find. Here it is a row of real buttons on its own card with
 * a filled active state on a wide screen, and a three-by-two grid of tiles on
 * a phone, where squeezing six labels into one row is exactly what hid it.
 *
 * Arrow keys move along it, as they do in any tab list.
 */
export default function AccountSectionNav<K extends string>({ items, active, onChange, label }: Props<K>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + items.length) % items.length
    onChange(items[next].key)
    refs.current[next]?.focus()
  }

  return (
    <nav className="an-nav" aria-label={label}>
      <div className="an-list" role="tablist" aria-label={label}>
        {items.map((item, i) => {
          const on = item.key === active
          return (
            <button
              key={item.key}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(item.key)}
              onKeyDown={(e) => onKey(e, i)}
              className="an-item focus-ring"
            >
              <item.icon size={20} strokeWidth={1.9} aria-hidden />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
