const badgeClass = 'h-9 w-[76px] rounded-lg border border-line bg-surface shadow-sm'

/** Crisp, local SVG payment marks — no remote images or logo font dependency. */
export default function PaymentMethodBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:justify-end" aria-label="Visa, Mastercard, Uzcard, Humo">
      <svg viewBox="0 0 76 36" role="img" aria-label="Visa" className={badgeClass}>
        <rect width="76" height="36" rx="7" fill="#173A8F" />
        <text x="38" y="23" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="15" fontStyle="italic" fontWeight="700">VISA</text>
      </svg>
      <svg viewBox="0 0 76 36" role="img" aria-label="Mastercard" className={badgeClass}>
        <rect width="76" height="36" rx="7" fill="#fff" />
        <circle cx="31" cy="16" r="9" fill="#eb001b" />
        <circle cx="43" cy="16" r="9" fill="#f79e1b" fillOpacity="0.94" />
        <text x="38" y="30" textAnchor="middle" fill="#182235" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700">mastercard</text>
      </svg>
      <svg viewBox="0 0 76 36" role="img" aria-label="Uzcard" className={badgeClass}>
        <rect width="76" height="36" rx="7" fill="#fff" />
        <path d="M9 9h58v5H9z" fill="#0b9e9a" />
        <path d="M9 23h58v4H9z" fill="#0b9e9a" fillOpacity="0.24" />
        <text x="38" y="21" textAnchor="middle" fill="#087d79" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700">UZCARD</text>
      </svg>
      <svg viewBox="0 0 76 36" role="img" aria-label="Humo" className={badgeClass}>
        <rect width="76" height="36" rx="7" fill="#fff" />
        <path d="M9 9h58v3H9z" fill="#7639a8" />
        <path d="M9 24h58v3H9z" fill="#e8449a" />
        <text x="38" y="22" textAnchor="middle" fill="#7639a8" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700">HUMO</text>
      </svg>
    </div>
  )
}
