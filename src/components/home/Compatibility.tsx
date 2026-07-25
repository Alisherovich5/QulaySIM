import { useMemo, useState } from 'react'
import { CheckCircle2, CircleX, Search, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { deviceLabel, ESIM_DEVICES, normalizeDeviceSearch, type EsimDevice } from '../../data/esimDevices'
import Reveal from '../Reveal'
import { Button } from '../ui'

/** "Is your phone eSIM compatible?" — searchable local device catalogue. */
export default function Compatibility() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<EsimDevice | null>(null)
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => {
    const search = normalizeDeviceSearch(query)
    if (!search) return ESIM_DEVICES.slice(0, 8)
    const startsWith = ESIM_DEVICES.filter((device) => normalizeDeviceSearch(deviceLabel(device)).startsWith(search))
    const contains = ESIM_DEVICES.filter((device) => {
      const label = normalizeDeviceSearch(deviceLabel(device))
      return !startsWith.includes(device) && label.includes(search)
    })
    return [...startsWith, ...contains].slice(0, 10)
  }, [query])
  const exactMatch = useMemo(() => {
    const search = normalizeDeviceSearch(query)
    if (!search) return null
    return ESIM_DEVICES.find((device) => normalizeDeviceSearch(deviceLabel(device)) === search) ?? null
  }, [query])
  const activeDevice = selected ?? exactMatch

  const choose = (device: EsimDevice) => {
    setSelected(device)
    setQuery(deviceLabel(device))
    setOpen(false)
  }
  return (
    <section className="border-y border-line bg-surface py-12 sm:py-16">
      <div className="container-page relative z-30">
        <Reveal>
          <div className="relative mx-auto flex max-w-3xl flex-col overflow-visible">
            <div className="relative inline-flex w-fit rounded-2xl bg-brand-50 p-3 text-brand-600 ring-1 ring-line dark:bg-surface-2 dark:text-brand-300"><Smartphone size={24} /></div>
            <h2 className="relative mt-5 text-2xl font-700 text-ink sm:text-3xl">{t('home.compatTitle')}</h2>
            <p className="relative mt-2 max-w-md text-sm leading-6 text-slate-soft sm:text-base">{t('home.compatText')}</p>
            <div className="relative mt-6 max-w-xl">
              <label htmlFor="device-search" className="mb-2 block text-[15px] font-600 text-ink">
                {t('home.compatInputLabel')}
              </label>
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-soft" />
                <input
                  id="device-search"
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setSelected(null); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && suggestions[0]) choose(suggestions[0])
                    if (event.key === 'Escape') setOpen(false)
                  }}
                  placeholder={t('home.compatInputPlaceholder')}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={open && !exactMatch}
                  aria-controls="device-suggestions"
                  className="w-full rounded-2xl border border-line bg-surface py-4 pl-11 pr-11 text-[15px] text-ink outline-none transition placeholder:text-slate-soft/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                />
                {activeDevice && (
                  activeDevice.compatible
                    ? <CheckCircle2 size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-accent-600" />
                    : <CircleX size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-red-600" />
                )}
              </div>

              {open && query.trim() && !exactMatch && (
                <div id="device-suggestions" role="listbox" className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 dark:border-line dark:bg-surface dark:text-ink">
                  {suggestions.length ? suggestions.map((device) => (
                    <button
                      key={deviceLabel(device)}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(device)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none dark:hover:bg-surface-2 dark:focus:bg-surface-2"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-surface-2"><Smartphone size={15} /></span>
                        <span className="truncate"><span className="font-600">{device.brand}</span> {device.model}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-700 ${device.compatible ? 'bg-accent-500/10 text-accent-600' : 'bg-red-500/10 text-red-600'}`}>
                        {device.compatible ? t('home.compatShortYes') : t('home.compatShortNo')}
                      </span>
                    </button>
                  )) : (
                    <div className="px-3 py-4 text-sm text-slate-soft">{t('home.compatNotFound')}</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative mt-4 max-w-xl">
              {activeDevice ? (
                <div aria-live="polite" className={`h-full rounded-2xl border p-4 ${activeDevice.compatible ? 'border-emerald-300/50 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/60' : 'border-red-300/50 bg-red-50 dark:border-red-500/30 dark:bg-red-950/60'}`}>
                  <div className="flex items-start gap-3">
                    {activeDevice.compatible ? <CheckCircle2 className="mt-0.5 shrink-0 text-accent-600" /> : <CircleX className="mt-0.5 shrink-0 text-red-600" />}
                    <div>
                      <p className="font-700 text-ink">{activeDevice.compatible ? t('home.compatResultYes') : t('home.compatResultNo')}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-soft">{activeDevice.compatible ? t('home.compatResultYesText') : t('home.compatResultNoText')}</p>
                      {activeDevice.note === 'regional' && <p className="mt-2 text-xs leading-5 text-slate-soft">{t('home.compatRegionalNote')}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-slate-soft">
                  <span className="mr-1 text-xs">{t('home.compatLiveHint')}</span>
                  {['iPhone 13', 'Galaxy S24', 'Pixel 9'].map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => { setQuery(model); setSelected(null); setOpen(false) }}
                      className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-600 text-ink transition hover:-translate-y-0.5 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              {!activeDevice && query.trim() && !open && <Button to="/support" variant="ghost" className="w-full px-5 py-2.5 sm:w-fit">{t('home.compatAskSupport')}</Button>}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
