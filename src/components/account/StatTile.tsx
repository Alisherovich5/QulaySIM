import type { LucideIcon } from 'lucide-react'
export type StatTone = 'brand' | 'accent' | 'violet' | 'amber'
interface Props {
  icon: LucideIcon
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  tone?: StatTone
  featured?: boolean
  live?: boolean
  meter?: { ratio: number; caption: string }
}
export default function StatTile({
  icon: Icon,
  value,
  label,
  prefix,
  suffix,
  decimals = 0,
  live = false,
  meter,
}: Props) {
  const pct = meter ? Math.min(1, Math.max(0, meter.ratio)) : 0
  return (
    <div className="account-stat">
      <div className="stat-label">
        <span>{label}</span>
        {live ? <span className="signal-dot" /> : <Icon size={18} />}
      </div>
      <p className="stat-value">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </p>
      {meter && (
        <div className="stat-meter">
          <div>
            <span style={{ width: Math.round(pct * 100) + '%' }} />
          </div>
          <p>{meter.caption}</p>
        </div>
      )}
    </div>
  )
}
