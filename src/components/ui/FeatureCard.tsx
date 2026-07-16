import type { LucideIcon } from 'lucide-react'
import IconBadge, { type IconBadgeTone } from './IconBadge'
import Card from './Card'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  text: string
  tone?: IconBadgeTone
  /** 'stacked' = boxed card (steps); 'row' = inline icon beside text (why) */
  layout?: 'stacked' | 'row'
}

/** Icon + title + text feature block, in either a boxed or inline layout. */
export default function FeatureCard({
  icon,
  title,
  text,
  tone = 'brand',
  layout = 'stacked',
}: FeatureCardProps) {
  if (layout === 'row') {
    return (
      <div className="flex gap-4">
        <IconBadge icon={icon} tone={tone} size="md" />
        <div>
          <h3 className="font-700 text-ink">{title}</h3>
          <p className="mt-1 text-sm text-slate-soft">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <Card hover className="group p-7">
      <IconBadge icon={icon} tone={tone} size="lg" className="transition group-hover:scale-110" />
      <h3 className="mt-5 text-lg font-700">{title}</h3>
      <p className="mt-2 text-sm text-slate-soft">{text}</p>
    </Card>
  )
}
