import { Link } from 'react-router-dom'

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span
        className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl shadow-lg shadow-brand-500/30 ring-1 ring-white/10"
        style={{ background: 'linear-gradient(135deg, #1B4DFF 0%, #0D2580 60%, #0A1F5C 100%)' }}
      >
        {/* connectivity / signal mark */}
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <path
            d="M4.5 10.2a10.5 10.5 0 0 1 15 0"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 13.4a6 6 0 0 1 8 0"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17.2" r="1.9" fill="#2CE0C2" />
        </svg>
        {/* shine sweep on hover */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1/3"
          style={{
            background:
              'linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)',
            animation: 'logo-shine 4.5s ease-in-out infinite',
          }}
        />
      </span>
      <span
        className={`font-display text-xl font-700 tracking-tight ${
          light ? 'text-white' : 'text-ink'
        }`}
      >
        Qulay<span className="text-brand-500">SIM</span>
      </span>
    </Link>
  )
}
