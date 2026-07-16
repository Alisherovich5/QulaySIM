import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** adds the hover lift + soft shadow used on interactive cards */
  hover?: boolean
  className?: string
  children: ReactNode
}

/**
 * Base surface card. Wraps the `card` utility so padding/hover behaviour is
 * consistent and customised per use via `className`.
 */
export default function Card({ hover = false, className = '', children, ...rest }: CardProps) {
  const cls = [
    'card',
    hover && 'transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/5',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
