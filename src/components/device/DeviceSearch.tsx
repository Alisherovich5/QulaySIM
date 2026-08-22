import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DEVICE_BRANDS, ESIM_DEVICES, deviceLabel, findDevices, type EsimDevice } from '../../data/esimDevices'
import { CheckExactlyButton, DeviceRow } from './shared'
import { REVEAL } from './verdictRules'

/**
 * The instrument: a search field over every model on the list.
 *
 * Everything about *which* model the visitor means lives here — the query, the
 * suggestion list, the keyboard, the brand browse. The page above only learns
 * the answer, through `onPick`, which is what makes this testable without
 * rendering the rest of the page.
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
  const supported = useMemo(() => ESIM_DEVICES.filter((d) => d.compatible).length, [])

  const pick = (device: EsimDevice) => {
    setOpen(false)
    setQuery('')
    onPick(device)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!results.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setCursor((c) => (c + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      pick(results[Math.min(cursor, results.length - 1)])
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
      <section className="card elev-1 mt-5 p-4 sm:mt-8 sm:p-6">
        <label htmlFor="dc-search" className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
          {t('device.searchLabel')}
        </label>

        <div className="relative mt-2">
          <Search
            size={18}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-soft"
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
            placeholder={t('device.searchPlaceholder')}
            className="focus-ring h-13 w-full rounded-xl bg-canvas pl-11 pr-11 font-display text-[15px] font-600 text-ink ring-1 ring-line placeholder:font-400 placeholder:text-slate-soft sm:text-base"
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
                  <CheckExactlyButton onClick={onCheckExactly} tone="loud" className="mt-2.5" />
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-2 text-[11.5px] leading-[1.5] text-slate-soft">
          {t('device.searchHint', { supported, total: ESIM_DEVICES.length })}
        </p>

        {/* Brands, for a visitor who would rather look than type.
            One scrolling row on a phone rather than a wrapped block: wrapped,
            fifteen brands took six rows and pushed the answer itself below the
            fold — the page would have been asking a question and hiding its own
            reply. It wraps once there is width to wrap into. */}
        <div className="account-tab-rail -mx-1 mt-4 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {DEVICE_BRANDS.map((entry) => (
            <button
              key={entry.brand}
              type="button"
              aria-pressed={brand === entry.brand}
              onClick={() => setBrand(brand === entry.brand ? null : entry.brand)}
              className={`focus-ring inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full px-3 text-[12.5px] font-700 ring-1 transition-colors ${
                brand === entry.brand
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : 'bg-canvas text-ink ring-line hover:ring-brand-300'
              }`}
            >
              {entry.brand}
              <span className={brand === entry.brand ? 'text-white/70' : 'text-slate-soft'}>
                {entry.supported}/{entry.total}
              </span>
            </button>
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
      </section>
  )
}
