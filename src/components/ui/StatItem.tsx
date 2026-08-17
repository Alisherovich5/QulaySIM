import Counter from './Counter'

interface StatItemProps {
  to: number
  label: string
  suffix?: string
  decimals?: number
}

/** Animated stat (number + label) used in the hero stats band. */
export default function StatItem({ to, label, suffix = '', decimals = 0 }: StatItemProps) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-700 text-white">
        <Counter to={to} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-1 text-sm text-brand-100">{label}</p>
    </div>
  )
}
