import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo'
import { DialPadFigure, IdentifierSheetFigure } from '../components/device/Figures'
import { Button } from '../components/ui'
import {
  DEVICE_BRANDS,
  ESIM_DEVICES,
  deviceLabel,
  findDevices,
  type EsimDevice,
} from '../data/esimDevices'
import { detectDevice } from '../lib/deviceHint'

/* ==========================================================================
 * Device check — one question, answered by typing.
 *
 * What this page used to be: two step cards teaching a phone code. The code
 * works and it is the only method that is certain, but as the whole page it put
 * the work on the customer — read the instruction, switch to the dialler, find
 * the * key, come back and interpret what you saw. For the great majority of
 * visitors the answer was already known before they arrived: their phone is a
 * Redmi Note 13 and it has no eSIM, or an iPhone 13 and it does.
 *
 * So the page now answers first and teaches second. A search box over ~300
 * models, ranked so a prefix beats a substring and a short name beats a long
 * one; the browser's own hint about the device it is running on, used where it
 * is actually reliable (see lib/deviceHint.ts); and the *#06# method kept in
 * full, one tap away, for the two cases that need it — a model not on the list,
 * and a model sold in both eSIM and non-eSIM variants.
 *
 * The list refuses to overstate. `regional` never renders as a plain yes, and
 * a "no" still offers the confirmation, because being wrong in that direction
 * costs somebody a sale they could have had.
 * ========================================================================== */

const DIAL_CODE = '*#06#'

/* One entrance, used only for revealed answers. `fs-rise` ends on `backwards`,
   never `both`: a held end transform turns the panel into the containing block
   for any fixed-position descendant. */
const REVEAL = 'motion-safe:animate-[fs-rise_0.42s_ease-out_backwards]'

type Verdict = 'yes' | 'regional' | 'no'

const verdictOf = (device: EsimDevice): Verdict =>
  !device.compatible ? 'no' : device.note === 'regional' ? 'regional' : 'yes'

/** The one mark that repeats everywhere on this page: a filled dot for yes, a
 *  ring for maybe, a slash for no. Never colour alone — each carries a glyph. */
function Mark({ verdict, size = 'sm' }: { verdict: Verdict; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-9 w-9' : 'h-6 w-6'
  const icon = size === 'lg' ? 17 : 12
  const tone =
    verdict === 'no'
      ? 'bg-surface text-slate-soft ring-1 ring-line'
      : verdict === 'regional'
        ? 'bg-status-warn-bg text-status-warn-ink ring-1 ring-status-warn-ink/25'
        : 'bg-accent-500/15 text-status-good-ink ring-1 ring-accent-500/35'
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full ${box} ${tone}`}>
      {verdict === 'no' ? (
        <X size={icon} strokeWidth={3} />
      ) : verdict === 'regional' ? (
        <Sparkles size={icon} strokeWidth={2.6} />
      ) : (
        <Check size={icon} strokeWidth={3.4} />
      )}
    </span>
  )
}

/**
 * The code, offered as a thing to copy. Typing `*` and `#` means switching
 * keyboards on most phones and a mistyped code silently does nothing.
 */
function CodePlate() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(DIAL_CODE)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied (insecure origin, or the user said no). The code is
      // printed right here, so there is nothing to recover from.
    }
  }, [])

  return (
    <div className="mt-3 rounded-2xl bg-mist p-4 ring-1 ring-line dark:bg-canvas">
      <p
        className="text-center font-display text-[40px] font-700 leading-none tracking-[0.14em] text-ink tabular-nums min-[360px]:text-[48px]"
        aria-label={DIAL_CODE}
      >
        {DIAL_CODE}
      </p>
      <button
        type="button"
        onClick={copy}
        aria-label={`${DIAL_CODE} — ${t('device.copyCode')}`}
        className={`focus-ring mx-auto mt-3.5 flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-700 ring-1 transition-colors ${
          copied
            ? 'bg-accent-500/10 text-status-good-ink ring-accent-500/40'
            : 'bg-surface text-ink ring-line hover:text-brand-600 hover:ring-brand-300 dark:hover:text-brand-300'
        }`}
      >
        {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
        {copied ? t('device.copied') : t('device.copyCode')}
      </button>
    </div>
  )
}

/** One of the two things a visitor can have seen in the *#06# sheet. */
function Choice({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-controls="dc-answer"
      onClick={onSelect}
      className={`focus-ring flex min-h-[54px] w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 transition-colors ${
        selected
          ? 'bg-brand-600 text-white ring-brand-600 shadow-[0_14px_28px_-20px_var(--color-brand-900)]'
          : 'bg-canvas text-ink ring-line hover:bg-surface hover:ring-brand-300'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
          selected ? 'bg-white/18 text-white' : 'bg-surface text-slate-soft ring-1 ring-line'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 font-display text-[14.5px] font-700 leading-tight">
        {label}
      </span>
    </button>
  )
}

/** A row in the suggestion list and in a brand's model list — the same row in
 *  both places, so a model looks the same however it was reached. */
function DeviceRow({
  device,
  active,
  onPick,
  id,
}: {
  device: EsimDevice
  active?: boolean
  onPick: () => void
  id?: string
}) {
  const { t } = useTranslation()
  const verdict = verdictOf(device)
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={!!active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-brand-500/10' : 'hover:bg-mist dark:hover:bg-canvas'
      }`}
    >
      <Mark verdict={verdict} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-600 leading-tight text-ink">
          {device.model}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-slate-soft">
          {device.brand}
          {device.codes?.length ? ` · ${device.codes.join(', ')}` : ''}
        </span>
      </span>
      <span
        className={`shrink-0 text-[11px] font-700 leading-none ${
          verdict === 'no' ? 'text-slate-soft' : verdict === 'regional' ? 'text-status-warn-ink' : 'text-status-good-ink'
        }`}
      >
        {t(`device.badge.${verdict}`)}
      </span>
    </button>
  )
}

export default function DeviceCheck() {
  const { t } = useTranslation()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [picked, setPicked] = useState<EsimDevice | null>(null)
  /** Set when the verdict came from the browser rather than from typing. */
  const [detected, setDetected] = useState<'model' | 'ios' | null>(null)
  /** The iOS major version behind an 'ios' verdict — it is the evidence, so the
   *  card states it rather than asserting the conclusion on its own. */
  const [iosVersion, setIosVersion] = useState<number | null>(null)
  const [unknownModel, setUnknownModel] = useState<string | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const verdictRef = useRef<HTMLDivElement>(null)
  const manualRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => findDevices(query), [query])
  const supported = useMemo(() => ESIM_DEVICES.filter((d) => d.compatible).length, [])

  /* What the browser knows about the phone in the visitor's hand, asked once.
     A model string is looked up like any other search — if the list has it, the
     answer is already on screen when the page finishes loading. */
  useEffect(() => {
    let alive = true
    void detectDevice().then((hint) => {
      if (!alive || !hint) return
      if (hint.kind === 'ios') {
        setDetected('ios')
        setIosVersion(hint.version)
        return
      }
      const match = findDevices(hint.model, 1)[0]
      if (match) {
        setPicked(match)
        setDetected('model')
      } else {
        setUnknownModel(hint.model)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const bring = (ref: React.RefObject<HTMLDivElement | null>) => {
    window.requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.top >= 0 && rect.bottom <= window.innerHeight - 80) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    })
  }

  const pick = useCallback((device: EsimDevice) => {
    setPicked(device)
    setDetected(null)
    setUnknownModel(null)
    setOpen(false)
    setQuery('')
    setChoice(null)
    bring(verdictRef)
  }, [])

  const openManual = useCallback(() => {
    setManual(true)
    bring(manualRef)
  }, [])

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

  const verdict = picked ? verdictOf(picked) : null

  return (
    <div className="container-page pb-6 pt-2 sm:py-10">
      <Seo title={t('seo.deviceTitle')} description={t('seo.deviceDescription')} />

      <Link
        to="/"
        className="focus-ring -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-600 text-slate-soft transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <ArrowLeft size={15} /> {t('device.back')}
      </Link>

      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 text-[11px] font-700 uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
          <Smartphone size={13} aria-hidden /> {t('device.eyebrow')}
        </span>
        <h1 className="mt-3 font-display text-[26px] font-700 leading-[1.1] tracking-[-0.02em] text-ink min-[360px]:text-[30px] sm:text-[42px] lg:text-[46px]">
          {t('device.title')}
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-slate-soft sm:mt-4 sm:text-[17px] sm:leading-[1.6]">
          {t('device.lead', { count: ESIM_DEVICES.length })}
        </p>
      </header>

      {/* ── The instrument ─────────────────────────────────────────────────── */}
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
                  <button
                    type="button"
                    onClick={openManual}
                    className="focus-ring mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[12.5px] font-700 text-white hover:bg-brand-700"
                  >
                    {t('device.checkExactly')} <ArrowRight size={14} />
                  </button>
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

      {/* ── The answer ─────────────────────────────────────────────────────── */}
      <div ref={verdictRef} aria-live="polite" className="scroll-mt-28">
        {detected === 'ios' && !picked && (
          <section className={`card elev-1 mt-3 p-4 sm:mt-4 sm:p-6 ${REVEAL}`}>
            <div className="flex items-start gap-3">
              <Mark verdict="yes" size="lg" />
              <div className="min-w-0">
                <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                  {t('device.detectedLabel')}
                </p>
                <h2 className="mt-1.5 font-display text-[20px] font-700 leading-tight text-ink sm:text-[24px]">
                  {t('device.iosYesTitle')}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
                  {t('device.iosYesText', { version: iosVersion ?? '' })}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Link
                    to="/destinations"
                    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[13.5px] font-700 text-white transition-colors hover:bg-brand-700"
                  >
                    {t('device.yesCta')} <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={openManual}
                    className="focus-ring inline-flex min-h-11 items-center rounded-lg bg-canvas px-4 text-[13.5px] font-700 text-ink ring-1 ring-line hover:ring-brand-300"
                  >
                    {t('device.checkExactly')}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {unknownModel && !picked && (
          <section className={`card elev-1 mt-3 p-4 sm:mt-4 sm:p-6 ${REVEAL}`}>
            <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
              {t('device.detectedLabel')}
            </p>
            <h2 className="mt-1.5 font-display text-[18px] font-700 leading-tight text-ink sm:text-[21px]">
              {unknownModel}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm">
              {t('device.detectedUnknown')}
            </p>
            <button
              type="button"
              onClick={openManual}
              className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[13.5px] font-700 text-white hover:bg-brand-700"
            >
              {t('device.checkExactly')} <ArrowRight size={16} />
            </button>
          </section>
        )}

        {picked && verdict && (
          <section key={deviceLabel(picked)} className={`mt-3 sm:mt-4 ${REVEAL}`}>
            {verdict === 'no' ? (
              <div className="card elev-1 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <Mark verdict="no" size="lg" />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                      {detected ? t('device.detectedLabel') : t('device.answerLabel')}
                    </p>
                    <h2 className="mt-1.5 font-display text-[20px] font-700 leading-tight text-ink sm:text-[24px]">
                      {deviceLabel(picked)}
                    </h2>
                    <p className="mt-1 font-display text-[15px] font-700 text-slate-soft">
                      {t('device.verdictNo')}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-sm sm:leading-6">
                      {t('device.verdictNoText')}
                    </p>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openManual}
                        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[13.5px] font-700 text-white hover:bg-brand-700"
                      >
                        {t('device.checkExactly')} <ArrowRight size={16} />
                      </button>
                      <Button to="/support" variant="ghost" className="min-h-11 px-4 text-[13.5px]">
                        {t('device.noCta')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 sm:p-6">
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-700 leading-none text-white ring-1 ring-white/25">
                    <Check size={12} strokeWidth={3.5} />
                    {detected ? t('device.detectedLabel') : t('device.answerLabel')}
                  </span>
                  <h2 className="mt-2.5 font-display text-[22px] font-700 leading-tight text-white sm:text-[26px]">
                    {deviceLabel(picked)}
                  </h2>
                  <p className="mt-1 font-display text-[15px] font-700 text-white/90">
                    {t('device.verdictYes')}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-white/85 sm:text-sm sm:leading-6">
                    {t('device.verdictYesText')}
                  </p>

                  {verdict === 'regional' && (
                    <p className="mt-3 rounded-xl bg-white/10 px-3 py-2.5 text-[12px] leading-[1.5] text-white/90 ring-1 ring-white/20">
                      {t('device.regionalNote')}
                    </p>
                  )}

                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <Link
                      to="/destinations"
                      className="focus-ring-invert inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-[13.5px] font-700 text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      {t('device.yesCta')} <ArrowRight size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={openManual}
                      className="focus-ring-invert inline-flex min-h-11 items-center rounded-lg bg-white/15 px-4 text-[13.5px] font-700 text-white ring-1 ring-white/25 hover:bg-white/25"
                    >
                      {t('device.checkExactly')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── The certain method, one tap away ───────────────────────────────── */}
      <div ref={manualRef} className="mt-6 scroll-mt-28 sm:mt-9">
        <button
          type="button"
          aria-expanded={manual}
          aria-controls="dc-manual"
          onClick={() => setManual((was) => !was)}
          className="focus-ring flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left ring-1 ring-line transition-colors hover:ring-brand-300"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14.5px] font-700 leading-tight text-ink sm:text-base">
              {t('device.manualTitle')}
            </span>
            <span className="mt-0.5 block text-[12px] leading-[1.45] text-slate-soft">
              {t('device.manualLead')}
            </span>
          </span>
          <ChevronDown
            size={18}
            aria-hidden
            className={`shrink-0 text-slate-soft transition-transform ${manual ? 'rotate-180' : ''}`}
          />
        </button>

        {manual && (
          <div id="dc-manual" className={`mt-3 grid items-start gap-3 lg:grid-cols-2 lg:gap-4 ${REVEAL}`}>
            <section className="card elev-1 p-4 sm:p-5">
              <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                {t('device.mockDialLabel')}
              </p>
              <h3 className="mt-2 font-display text-[15.5px] font-700 leading-snug text-ink sm:text-[17px]">
                {t('device.steps.dial.title')}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-[13.5px]">
                {t('device.steps.dial.text')}
              </p>
              <CodePlate />
              <div className="mt-4">
                <DialPadFigure />
                <p className="mx-auto mt-3 max-w-[38ch] text-center text-[11.5px] leading-[1.5] text-slate-soft">
                  {t('device.dialHint')}
                </p>
              </div>
            </section>

            <section className="card elev-1 p-4 sm:p-5">
              <p className="text-[10.5px] font-700 uppercase tracking-[0.16em] text-slate-soft">
                {t('device.mockResultLabel')}
              </p>
              <h3 className="mt-2 font-display text-[15.5px] font-700 leading-snug text-ink sm:text-[17px]">
                {t('device.steps.read.title')}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-slate-soft sm:text-[13.5px]">
                {t('device.steps.read.text')}
              </p>

              <div className="mt-3.5">
                <IdentifierSheetFigure />
                <p className="mt-2 text-[11.5px] leading-[1.5] text-slate-soft">
                  {t('device.mockSheetNote')}
                </p>
              </div>

              <div className="mt-4 grid gap-2.5 min-[400px]:grid-cols-2">
                <Choice
                  selected={choice === 'yes'}
                  onSelect={() => setChoice('yes')}
                  label={t('device.yesTitle')}
                  icon={<Check size={16} strokeWidth={2.8} />}
                />
                <Choice
                  selected={choice === 'no'}
                  onSelect={() => setChoice('no')}
                  label={t('device.noTitle')}
                  icon={<X size={16} strokeWidth={2.8} />}
                />
              </div>

              {/* Empty until a choice is made — the one thing this page must
                  not say in advance. */}
              <div id="dc-answer" aria-live="polite">
                {choice && (
                  <div key={choice} className={`mt-3 rounded-2xl bg-canvas p-3.5 ring-1 ring-line ${REVEAL}`}>
                    <div className="flex items-start gap-2.5">
                      <Mark verdict={choice === 'yes' ? 'yes' : 'no'} />
                      <div className="min-w-0">
                        <p className="font-display text-[14px] font-700 leading-snug text-ink">
                          {choice === 'yes' ? t('device.yesTitle') : t('device.noTitle')}
                        </p>
                        <p className="mt-1 text-[12px] leading-[1.5] text-slate-soft">
                          {choice === 'yes' ? t('device.yesText') : t('device.noText')}
                        </p>
                        {choice === 'yes' ? (
                          <Link
                            to="/destinations"
                            className="focus-ring mt-2.5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-[13px] font-700 text-white hover:bg-brand-700"
                          >
                            {t('device.yesCta')} <ArrowRight size={15} />
                          </Link>
                        ) : (
                          <Button to="/support" variant="ghost" className="mt-2.5 min-h-10 px-3.5 text-[13px]">
                            {t('device.noCta')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[12px] font-700 leading-snug text-ink">{t('device.settingsTitle')}</p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-soft">
                  <span className="font-600 text-brand-700 dark:text-brand-300">{t('device.iosLabel')}</span>{' '}
                  {t('device.iosPath')}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-soft">
                  <span className="font-600 text-brand-700 dark:text-brand-300">{t('device.androidLabel')}</span>{' '}
                  {t('device.androidPath')}
                </p>
              </div>
            </section>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-[1.55] text-slate-soft sm:mt-6 sm:text-[12.5px]">
        <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-brand-500 dark:text-brand-300" />
        {t('device.privacyNote')}
      </p>
    </div>
  )
}
