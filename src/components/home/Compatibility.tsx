import { useMemo, useState } from 'react'
import { CheckCircle2, CircleX, Search, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { deviceLabel, ESIM_DEVICES, normalizeDeviceSearch, type EsimDevice } from '../../data/esimDevices'
import Reveal from '../Reveal'
import { Button, Card } from '../ui'

// Default device names (proper nouns) used when the CMS list is empty.
const DEFAULT_DEVICES = [
  'iPhone XS / 11 / 12 / 13 / 14 / 15',
  'Google Pixel 3 and newer',
  'Samsung Galaxy S20 / S21 / S22 / S23',
  'Samsung Galaxy Z Flip / Fold',
  'iPad Pro / Air (2018+)',
  'Huawei P40 / Mate 40 Pro',
]

function deviceBrand(name: string) {
  const value = name.toLowerCase()
  if (value.includes('iphone') || value.includes('ipad')) return 'Apple'
  if (value.includes('galaxy') || value.includes('samsung')) return 'Samsung'
  if (value.includes('pixel') || value.includes('google')) return 'Google'
  if (value.includes('huawei')) return 'Huawei'
  return 'Other'
}

/** "Is your phone eSIM compatible?" — copy + admin-managed device list. */
export default function Compatibility({ devices }: { devices?: string[] }) {
  const { t } = useTranslation()
  const list = devices && devices.length > 0 ? devices : DEFAULT_DEVICES
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<EsimDevice | null>(null)
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState('All')
  const brands = useMemo(() => ['All', ...Array.from(new Set(list.map(deviceBrand)))], [list])
  const activeBrand = brands.includes(brand) ? brand : 'All'
  const visibleDevices = activeBrand === 'All' ? list : list.filter((device) => deviceBrand(device) === activeBrand)
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
    <section className="container-page relative z-30 py-16">
      <div className="relative overflow-visible rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 py-8 shadow-xl sm:px-8 sm:py-10 lg:px-12">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="relative grid items-stretch gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <Reveal>
          <div className="flex h-full flex-col">
            <div className="inline-flex rounded-2xl bg-white/10 p-3 text-white"><Smartphone size={24} /></div>
            <h2 className="mt-5 text-2xl font-700 text-white sm:text-3xl">{t('home.compatTitle')}</h2>
            <p className="mt-3 max-w-md leading-6 text-white/80">{t('home.compatText')}</p>
            <div className="relative mt-7 max-w-md">
              <label htmlFor="device-search" className="mb-2 block text-[15px] font-600 text-white">
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
                  className="w-full rounded-2xl border border-white/20 bg-white py-4 pl-11 pr-11 text-[15px] text-slate-900 shadow-lg outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-4 focus:ring-accent-400/20 dark:border-line dark:bg-surface dark:text-ink dark:placeholder:text-slate-soft"
                />
                {activeDevice && (
                  activeDevice.compatible
                    ? <CheckCircle2 size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-accent-600" />
                    : <CircleX size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-red-600" />
                )}
              </div>

              {open && query.trim() && !exactMatch && (
                <div id="device-suggestions" role="listbox" className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-2xl dark:border-line dark:bg-surface dark:text-ink">
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

            <div className="mt-4 min-h-34 max-w-md">
              {activeDevice ? (
                <div aria-live="polite" className={`h-full rounded-2xl border p-4 shadow-lg ${activeDevice.compatible ? 'border-emerald-300/50 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/60' : 'border-red-300/50 bg-red-50 dark:border-red-500/30 dark:bg-red-950/60'}`}>
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
                <div className="h-full rounded-2xl border border-white/12 bg-white/7 p-4 text-white/80">
                  <p className="text-sm leading-5">{t('home.compatLiveHint')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['iPhone 13', 'Galaxy S24', 'Pixel 9'].map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => { setQuery(model); setSelected(null); setOpen(false) }}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-600 text-white transition hover:-translate-y-0.5 hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-accent-400"
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {!activeDevice && query.trim() && !open && <Button to="/support" variant="ghost" className="mt-4 px-6 py-3">{t('home.compatAskSupport')}</Button>}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <Card className="border-0 bg-white/95 p-6 shadow-2xl backdrop-blur dark:bg-surface/95 sm:p-7">
            <p className="text-xs font-600 uppercase tracking-wide text-slate-soft">
              {t('home.compatListTitle')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('home.compatListTitle')}>
              {brands.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBrand(item)}
                  aria-pressed={activeBrand === item}
                  className={`rounded-full px-3 py-1.5 text-xs font-700 transition ${
                    activeBrand === item
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-mist text-slate-soft ring-1 ring-line hover:text-brand-600 hover:ring-brand-300'
                  }`}
                >
                  {item === 'All' ? t('home.exploreAll') : item}
                </button>
              ))}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {visibleDevices.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-500" />
                  {d}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
        </div>
      </div>
    </section>
  )
}
