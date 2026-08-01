import type { LucideIcon } from 'lucide-react'

export type IconBadgeTone = 'brand' | 'accent' | 'gold' | 'violet' | 'amber'
export type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl'

const TONES: Record<IconBadgeTone, string> = {
  // The ramps do not flip with the theme, so each tone names its own dark
  // value. brand-50 in particular is a near-white chip: on a dark page it read
  // as a bright square rather than a tinted one.
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  accent: 'bg-accent-500/10 text-status-good-ink',
  gold: 'bg-gold-500/10 text-gold-700 dark:text-gold-400',
  violet: 'bg-violet-signal/10 text-violet-signal',
  amber: 'bg-amber-signal/10 text-status-warn-ink',
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
