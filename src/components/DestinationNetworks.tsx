import { useTranslation } from 'react-i18next'
import { Signal } from 'lucide-react'
import { countryFaq, networkCopy, type NetworkLang } from '../lib/networks-copy'
import type { DestinationFacts } from '../lib/destination-facts'

/**
 * The networks the eSIM roams on here, named.
 *
 * The one section on a destination page whose text no other destination can
 * repeat: the operators come from the wholesaler's own catalogue, so Turkey
 * reads Turkcell/Vodafone/Türk Telekom and Georgia reads Magti/Beeline. That is
 * the point — 214 pages that were the same 161 words are what a search engine
 * treats as one page repeated.
 *
 * Renders nothing when the supplier lists no operator for the country, rather
 * than inventing one.
 */
export default function DestinationNetworks({
  iso2,
  country,
  facts,
}: {
  iso2: string
  country: string
  facts: DestinationFacts | null
}) {
  const { i18n } = useTranslation()
  const lang = ((i18n.resolvedLanguage ?? 'uz').split('-')[0] || 'uz') as NetworkLang
  const copy = networkCopy(iso2, country, lang)
  const faq = countryFaq(iso2, country, facts, lang)
  if (!copy && !faq.length) return null

  return (
    <section className="dest-networks">
      {copy && (
        <>
          <h2>{copy.heading}</h2>
          <p className="dest-networks-lead">{copy.lead}</p>
          <ul className="dest-networks-list">
            {copy.operators.map((op) => (
              <li key={op.name}>
                <Signal size={16} aria-hidden />
                <span>{op.name}</span>
                <em>{op.network}</em>
              </li>
            ))}
          </ul>
          {copy.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </>
      )}
      {faq.length > 0 && (
        <div className="dest-faq">
          {faq.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
