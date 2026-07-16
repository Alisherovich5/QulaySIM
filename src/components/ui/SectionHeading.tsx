import type { ReactNode } from 'react'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  /** optional trailing element, e.g. a "View all" link (only shown when align=left) */
  action?: ReactNode
  className?: string
}

/** Reusable section title + subtitle (+ optional action) block. */
export default function SectionHeading({
  title,
  subtitle,
  align = 'left',
  action,
  className = '',
}: SectionHeadingProps) {
  if (align === 'center') {
    return (
      <div className={`text-center ${className}`}>
        <h2 className="text-2xl font-700 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mx-auto mt-2 max-w-lg text-slate-soft">{subtitle}</p>}
      </div>
    )
  }

  return (
    <div className={`flex items-end justify-between ${className}`}>
      <div>
        <h2 className="text-2xl font-700 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
