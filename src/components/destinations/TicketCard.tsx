import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Flag from '../Flag'
import type { Country } from '../../lib/types'

/**
 * One destination, as a boarding pass.
 *
 * A single anchor rather than a card with a button inside it: the whole shape
 * goes to the same place, and a nested control inside a link is two tab stops
 * and one confusing announcement for the same destination. The chevron is
 * decoration on top of the link, not a second target.
 *
 * The notches that make it a ticket are in CSS — see `.dx-ticket` — because
 * they have to survive the card changing colour underneath them.
 */
export default function TicketCard({
  country,
  price,
  onPrefetch,
}: {
  country: Country
  /** Already formatted in the visitor's currency. */
  price: string
  onPrefetch?: () => void
}) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/destinations/${country.slug}`}
      className="dx-ticket focus-ring"
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-label={t('dx.countryPlans', { country: country.name })}
    >
      <div className="dx-ticket-top">
        <span className="dx-flag">
          <Flag iso2={country.iso2} w={160} alt="" />
        </span>
        <span className="dx-name">{country.name}</span>
        <span className="dx-go" aria-hidden>
          <ChevronRight size={18} />
        </span>
      </div>
      <hr className="dx-ticket-sep" />
      <div className="dx-ticket-foot">
        <span className="dx-from">{t('dx.from')}</span>
        <span className="dx-price">{price}</span>
      </div>
    </Link>
  )
}
