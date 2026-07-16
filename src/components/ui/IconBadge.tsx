import type { LucideIcon } from 'lucide-react'

export type IconBadgeTone = 'brand' | 'accent' | 'gold' | 'violet' | 'amber'
export type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl'

const TONES: Record<IconBadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-500/10 text-accent-600',
  gold: 'bg-gold-500/10 text-gold-600',
  violet: 'bg-[#8938fa]/10 text-[#8938fa]',
  amber: 'bg-amber-signal/10 text-amber-signal',
}

const SIZES: Record<IconBadgeSize, { box: string; icon: number }> = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 16 },
  md: { box: 'h-11 w-11 rounded-xl', icon: 20 },
  lg: { box: 'h-12 w-12 rounded-xl', icon: 22 },
  xl: { box: 'h-14 w-14 rounded-2xl', icon: 26 },
}

interface IconBadgeProps {
  icon: LucideIcon
  tone?: IconBadgeTone
  size?: IconBadgeSize
  className?: string
}

/**
 * The tinted, rounded icon container used across the app (steps, features,
 * support tiles, order rows, passport, settings…). One place to change the look.
 */
export default function IconBadge({
  icon: Icon,
  tone = 'brand',
  size = 'md',
  className = '',
}: IconBadgeProps) {
  const s = SIZES[size]
  return (
    <span className={`grid shrink-0 place-items-center ${s.box} ${TONES[tone]} ${className}`}>
      <Icon size={s.icon} />
    </span>
  )
}
