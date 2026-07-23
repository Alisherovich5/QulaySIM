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
    <Card className="lift p-4 sm:p-5">
      <IconBadge icon={icon} tone={tone} size="md" />
      <p className="mt-3 font-display text-xl font-700 text-ink sm:mt-4 sm:text-2xl">
        <Counter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-0.5 text-sm text-slate-soft">{label}</p>
    </Card>
  )
}
