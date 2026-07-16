import type { LucideIcon } from 'lucide-react'
import Counter from '../Counter'
import Card from '../ui/Card'
import IconBadge, { type IconBadgeTone } from '../ui/IconBadge'

interface Props {
  icon: LucideIcon
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  tone?: IconBadgeTone
}

export default function StatTile({
  icon,
  value,
  label,
  prefix,
  suffix,
  decimals = 0,
  tone = 'brand',
}: Props) {
  return (
    <Card className="lift p-5">
      <IconBadge icon={icon} tone={tone} size="md" />
      <p className="mt-4 font-display text-2xl font-700 text-ink">
        <Counter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-0.5 text-sm text-slate-soft">{label}</p>
    </Card>
  )
}
