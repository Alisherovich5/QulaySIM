import { useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * The question box.
 *
 * Searches every answer the page holds, not the selected category: somebody who
 * types "to'lov" while "Umumiy" is open is asking the site a question, not
 * filtering a list, and losing their answer to a tab they did not choose is the
 * failure this control exists to avoid. Selecting a category is what the
 * category buttons are for.
 *
 * Submitting scrolls the answers into view, because on a phone the field sits a
 * screen above them.
 */
export default function SupportSearch({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [id] = useState(() => 'sup-q')

  return (
    <div className="sup-search">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Search size={21} aria-hidden className="sup-search-icon" />
        <label htmlFor={id} className="sr-only">
          {t('support.searchLabel')}
        </label>
        <input
          id={id}
          ref={inputRef}
          type="search"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('support.searchPlaceholder')}
        />
        {value && (
          <button
            type="button"
            className="sup-clear focus-ring"
            aria-label={t('common.close')}
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
          >
            <X size={17} aria-hidden />
          </button>
        )}
        <button type="submit" className="sup-go focus-ring" aria-label={t('support.searchLabel')}>
          <ArrowRight size={21} aria-hidden />
        </button>
      </form>
    </div>
  )
}
