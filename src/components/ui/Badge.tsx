import type { ReactNode } from 'react'

export type BadgeTone = 'brand' | 'accent' | 'gold' | 'muted' | 'onDark'

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-500 text-white',
  accent: 'bg-accent-500 text-white',
  gold: 'bg-gold-500 text-white',
  muted: 'bg-brand-50 text-brand-600',
  onDark: 'bg-white/10 text-white ring-1 ring-white/15',
}

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

/** Small pill / chip label (popular, status, hero badge…). */
export default function Badge({ tone = 'muted', className = '', children }: BadgeProps) {
  return <span className={`chip ${TONES[tone]} ${className}`}>{children}</span>
}
