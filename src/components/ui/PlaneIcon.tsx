import { Plane, type LucideProps } from 'lucide-react'

/**
 * The forward mark, drawn as an aircraft.
 *
 * Lucide's plane points up and to the right at 45°, and left like that it reads
 * as ↗ — "opens somewhere else", not "carry on". Turned by exactly 45° it sits
 * where → sat and means what → meant. The turn is written here once: spread
 * over thirty call sites, one of them would sooner or later be missed.
 */
export default function PlaneIcon({ className, ...props }: LucideProps) {
  return <Plane {...props} className={className ? `rotate-45 ${className}` : 'rotate-45'} />
}
