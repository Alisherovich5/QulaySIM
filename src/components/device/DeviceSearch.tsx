import { useMemo, useRef, useState } from 'react'
import { ArrowRight, HelpCircle, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DEVICE_BRANDS, ESIM_DEVICES, deviceLabel, findDevices, type EsimDevice } from '../../data/esimDevices'
import BrandTile from './BrandTile'
import { DeviceRow } from './shared'
import { REVEAL } from './verdictRules'

/**
 * The instrument: a search field over every model on the list, and the brands
 * beside it for somebody who would rather look than type.
 *
 * Everything about *which* model the visitor means lives here — the query, the
 * suggestion list, the keyboard, the brand browse. The page above only learns
 * the answer, through `onPick`, which is what makes this testable without
 * rendering the rest of the page.
 *
 * The brands used to be a scrolling rail of pills reading "Apple 11/14". They
 * are a grid of marks now, to the approved design: a logo is recognised before
 * a word is read, and the count moved into the accessible name rather than
 * being printed fifteen times.
 */
export default function DeviceSearch({
  onPick,
  onCheckExactly,
}: {
  onPick: (device: EsimDevice) => void
  onCheckExactly: () => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [brand, setBrand] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => findDevices(query), [query])

  const pick = (device: EsimDevice) => {
    setOpen(false)
    setQuery('')
    onPick(device)
  }

  /* What the button does, and what Enter does — the same thing, deliberately.
     A visitor who types a model and presses the green button expects the answer
     the list is already showing; a button that only submitted a form and
     cleared the field would be a second, worse way of doing what the list does. */
  const submit = () => {
    if (results.length) {
      pick(results[Math.min(cursor, results.length - 1)])
      return
    }
    // Nothing matched what they typed, so the certain method is the answer.
    onCheckExactly()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
      return
    }
    if (!results.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setCursor((c) => (c + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
    }
  }

  const brandModels = useMemo(
    () =>
      brand
        ? [...ESIM_DEVICES.filter((d) => d.brand === brand)].sort(
            (a, b) => Number(b.compatible) - Number(a.compatible) || a.model.localeCompare(b.model),
          )
        : [],
    [brand],
  )

  return (
    <section className="card elev-1 mt-5 p-4 sm:mt-7 sm:p-6 lg:p-7">
      <label htmlFor="dc-search" className="sr-only">
        {t('device.searchLabel')}
      </label>

      <div className="relative flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search
            size={19}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-soft"
          />
          <input
            id="dc-search"
            ref={inputRef}
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls="dc-results"
            aria-autocomplete="list"
            aria-activedescendant={
              open && results.length ? `dc-opt-${Math.min(cursor, results.length - 1)}` : undefined
            }
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
              setCursor(0)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            placeholder={t('dc.placeholder')}
            className="focus-ring h-14 w-full rounded-2xl bg-canvas pl-12 pr-11 text-[15px] font-500 text-ink ring-1 ring-line placeholder:font-400 placeholder:text-slate-soft sm:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label={t('common.close')}
              className="focus-ring absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-soft hover:bg-mist hover:text-ink"
            >
              <X size={15} />
            </button>
          )}

        </div>

        <button
          type="button"
          onClick={submit}
          className="focus-ring group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-7 text-[15px] font-700 text-white transition duration-200 hover:bg-brand-700 active:scale-[0.99] sm:text-base"
        >
          {t('dc.check')}
          <ArrowRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </button>

          {open && (query.length > 0 || results.length > 0) && (
            <div
              id="dc-results"
              role="listbox"
              aria-label={t('device.searchLabel')}
              className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[52vh] overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-line"
            >
              {results.length > 0 ? (
                results.map((device, index) => (
                  <DeviceRow
                    key={deviceLabel(device)}
                    id={`dc-opt-${index}`}
                    device={device}
                    active={index === Math.min(cursor, results.length - 1)}
                    onPick={() => pick(device)}
                  />
                ))
              ) : (
                <div className="px-3 py-4">
                  <p className="text-[13px] font-600 leading-snug text-ink">{t('device.noResults')}</p>
                  <p className="mt-1 text-[12px] leading-[1.5] text-slate-soft">
                    {t('device.noResultsHint')}
                  </p>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Three across on a phone, five where the design has five. Wrapped into
          six rows on a narrow screen the grid pushed the answer itself below
          the fold — the page would have been asking a question and hiding its
          own reply. */}
      <div
        role="group"
        aria-label={t('dc.brandsLabel')}
        className="mt-4 grid grid-cols-3 gap-2.5 sm:mt-5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5"
      >
        {DEVICE_BRANDS.map((entry) => (
          <BrandTile
            key={entry.brand}
            brand={entry.brand}
            selected={brand === entry.brand}
            supported={entry.supported}
            total={entry.total}
            onToggle={() => setBrand(brand === entry.brand ? null : entry.brand)}
          />
        ))}
      </div>

      {brand && (
        <div className={`mt-3 rounded-2xl bg-canvas p-2 ring-1 ring-line ${REVEAL}`}>
          <p className="px-2 py-1.5 text-[11.5px] font-600 leading-tight text-slate-soft">
            {t('device.brandStat', {
              brand,
              supported: DEVICE_BRANDS.find((b) => b.brand === brand)?.supported ?? 0,
              total: DEVICE_BRANDS.find((b) => b.brand === brand)?.total ?? 0,
            })}
          </p>
          <div className="max-h-[46vh] overflow-y-auto sm:grid sm:grid-cols-2 sm:gap-x-2">
            {brandModels.map((device) => (
              <DeviceRow key={deviceLabel(device)} device={device} onPick={() => pick(device)} />
            ))}
          </div>
        </div>
      )}

      {/* The way out for a model nobody can name: *#06# on the phone itself,
          which is the only method that is certain. */}
      <div className="mt-5 flex justify-center sm:mt-6">
        <button
          type="button"
          onClick={onCheckExactly}
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[14px] font-600 text-brand-700 transition-colors hover:text-brand-600 dark:text-accent-400 dark:hover:text-accent-300"
        >
          <HelpCircle size={17} aria-hidden />
          {t('dc.unknownModel')}
        </button>
      </div>
    </section>
  )
}
