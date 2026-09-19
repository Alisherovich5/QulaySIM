import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Info, Plus, X } from 'lucide-react'
import Flag from '../Flag'
import RouteLine from './RouteLine'
import type { Country } from '../../lib/types'

/**
 * The itinerary itself: the chips, the line over them, and the one sentence
 * that says whether what is chosen can actually be sold as one eSIM.
 *
 * The badge has three states rather than two, because "no plan covers these
 * three countries" is a different thing from "you have not chosen anything
 * yet", and a page that answers both with silence leaves the visitor looking
 * at an empty tariff list with no idea why.
 */

interface Props {
  stops: Country[]
  covered: boolean
  onRemove: (iso2: string) => void
  onAdd: () => void
}

export default function DestinationSelector({ stops, covered, onRemove, onAdd }: Props) {
  const { t } = useTranslation()
  const empty = stops.length === 0
  const chipsRef = useRef<HTMLUListElement>(null)

  return (
    <section className="rp-stops" aria-label={t('rp.pickerTitle')}>
      <RouteLine chipsRef={chipsRef} count={stops.length} />

      <ul className="rp-chips" ref={chipsRef}>
        {stops.map((country) => (
          <li key={country.iso2} className="rp-chip">
            <Flag iso2={country.iso2} w={80} className="rp-chip-flag" alt="" />
            <span className="rp-chip-name">{country.name}</span>
            <button
              type="button"
              className="rp-chip-x"
              onClick={() => onRemove(country.iso2)}
              aria-label={t('rp.remove', { country: country.name })}
            >
              <X size={16} />
            </button>
          </li>
        ))}
        <li className="contents">
          <button type="button" className="rp-add" onClick={onAdd}>
            <Plus size={18} aria-hidden="true" />
            {t('rp.add')}
          </button>
        </li>
      </ul>

      <div className="rp-badge-row">
        {empty ? (
          <p className="rp-badge" data-tone="empty">
            <Info size={16} aria-hidden="true" />
            {t('rp.emptyStops')}
          </p>
        ) : covered ? (
          <p className="rp-badge">
            <span className="rp-badge-tick" aria-hidden="true">
              <Check size={12} strokeWidth={3} />
            </span>
            {t('rp.covered', { count: stops.length })}
          </p>
        ) : (
          <p className="rp-badge" data-tone="miss">
            <Info size={16} aria-hidden="true" />
            {t('rp.notCovered')}
          </p>
        )}
      </div>
    </section>
  )
}
