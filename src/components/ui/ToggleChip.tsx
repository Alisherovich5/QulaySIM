import type { ReactNode } from 'react'

interface ToggleChipProps {
  active?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

/**
 * Selectable pill used for region/filter/preset toggles
 * (Destinations, Calculator, home explorer). One styling source of truth.
 */
export default function ToggleChip({ active = false, onClick, className = '', children }: ToggleChipProps) {
  return (
    <button
      onClick={onClick}
      className={`chip ring-1 transition ${
        active
          ? 'bg-brand-500 text-white ring-brand-500'
          : 'bg-surface text-slate-soft ring-line hover:ring-brand-300'
      } ${className}`}
    >
      {children}
    </button>
  )
}
