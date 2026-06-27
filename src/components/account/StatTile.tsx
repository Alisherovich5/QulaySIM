import type { LucideIcon } from 'lucide-react'
import Counter from '../Counter'

interface Props {
  icon: LucideIcon
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  tone?: 'brand' | 'accent' | 'violet' | 'amber'
}

const TONES: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-500/10 text-accent-600',
  violet: 'bg-[#8938fa]/10 text-[#8938fa]',
  amber: 'bg-amber-signal/10 text-amber-signal',
}

export default function StatTile({
  icon: Icon,
  value,
  label,
  prefix,
  suffix,
  decimals = 0,
  tone = 'brand',
}: Props) {
  return (
    <div className="card lift p-5">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${TONES[tone]}`}>
        <Icon size={20} />
      </span>
      <p className="mt-4 font-display text-2xl font-700 text-ink">
        <Counter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-0.5 text-sm text-slate-soft">{label}</p>
    </div>
  )
}
