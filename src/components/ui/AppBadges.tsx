import { Apple, Play } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function StoreBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="inline-flex items-center gap-2.5 rounded-xl bg-ink px-5 py-3 text-sm font-600 text-white transition hover:opacity-90"
    >
      <Icon size={20} /> {label}
    </a>
  )
}

interface AppBadgesProps {
  androidLabel: string
  iosLabel: string
  className?: string
}

/** Google Play + App Store download badges (demo — non-functional links). */
export default function AppBadges({ androidLabel, iosLabel, className = '' }: AppBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <StoreBadge icon={Play} label={androidLabel} />
      <StoreBadge icon={Apple} label={iosLabel} />
    </div>
  )
}
