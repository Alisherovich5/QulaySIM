import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import Flag from '../Flag'
import { useDialog } from '../../lib/useDialog'
import { normaliseIso } from '../../lib/route-plan'
import type { Country } from '../../lib/types'

/**
 * Adding a stop: a centred modal on a desktop, a bottom sheet on a phone.
 *
 * Both are the same element — only the CSS moves it — so there is one piece of
 * focus management, one Escape handler and one scroll lock rather than two
 * implementations that drift apart. `useDialog` already holds all three; this
 * component is a list and a search box.
 *
 * A country already on the itinerary stays in the list, disabled and labelled,
 * instead of disappearing. A list that silently drops what you just picked
 * makes you doubt whether the click registered.
 */

/** Curly and straight apostrophes are the same letter to someone searching. */
const APOSTROPHES = /[‘’ʻʼ`´']/g

function fold(value: string, lang: string) {
  return value.toLocaleLowerCase(lang).replace(APOSTROPHES, '')
}

interface Props {
  countries: Country[]
  chosen: readonly string[]
  onAdd: (country: Country) => void
  onClose: () => void
}

export default function CountryPicker({ countries, chosen, onAdd, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const panel = useDialog(onClose)

  const taken = useMemo(() => new Set(chosen.map(normaliseIso)), [chosen])

  const shown = useMemo(() => {
    const q = fold(query.trim(), i18n.language)
    const list = q
      ? countries.filter((c) => fold(c.name, i18n.language).includes(q) || fold(c.iso2, 'en').startsWith(q))
      : countries
    // Popular first while nothing is typed: the list is four hundred long and
    // the top of it is otherwise whatever the alphabet decided.
    return [...list]
      .sort((a, b) => {
        if (!q && a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1
        return a.name.localeCompare(b.name, i18n.language)
      })
      .slice(0, 80)
  }, [countries, query, i18n.language])

  return (
    <>
      <div className="rp-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className="rp-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rp-picker-title"
        tabIndex={-1}
      >
        <div className="rp-sheet-head">
          <h2 className="rp-sheet-title" id="rp-picker-title">
            {t('rp.pickerTitle')}
          </h2>
          <button type="button" className="rp-sheet-close" onClick={onClose} aria-label={t('rp.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="rp-search">
          <Search size={18} />
          <input
            data-dialog-focus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('rp.pickerSearch')}
            aria-label={t('rp.pickerSearch')}
            autoComplete="off"
          />
        </div>

        <div className="rp-list">
          {shown.length === 0 ? (
            <p className="rp-empty">{t('rp.pickerEmpty')}</p>
          ) : (
            shown.map((country) => {
              const added = taken.has(normaliseIso(country.iso2))
              return (
                <button
                  key={country.id}
                  type="button"
                  className="rp-option"
                  disabled={added}
                  onClick={() => onAdd(country)}
                >
                  <Flag iso2={country.iso2} w={80} className="rp-chip-flag" alt="" />
                  <span>{country.name}</span>
                  {added && <span className="rp-option-tag">{t('rp.pickerAdded')}</span>}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
