import { ChevronRight } from 'lucide-react'

/**
 * The category column.
 *
 * The list is built from the answers themselves rather than written here: the
 * FAQs arrive from the admin with their own categories, and a hardcoded list
 * would either hide a category the operator added or show an empty one they
 * removed.
 */
export default function SupportCategories({
  categories,
  active,
  onPick,
  label,
}: {
  categories: { key: string; label: string; count: number }[]
  active: string | null
  onPick: (key: string | null) => void
  label: string
}) {
  return (
    <div className="sup-cats" role="group" aria-label={label}>
      {categories.map((category) => {
        const on = active === category.key
        return (
          <button
            key={category.key}
            type="button"
            aria-pressed={on}
            className={`sup-cat focus-ring${on ? ' is-on' : ''}`}
            /* Pressing the open one closes it, which is how somebody gets back
               to every answer without hunting for an "all" button. */
            onClick={() => onPick(on ? null : category.key)}
          >
            {category.label}
            <ChevronRight size={18} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
