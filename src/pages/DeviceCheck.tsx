import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo'
import DeviceSearch from '../components/device/DeviceSearch'
import ManualCheck from '../components/device/ManualCheck'
import VerdictCard from '../components/device/Verdict'
import { ESIM_DEVICES, findDevices, type EsimDevice } from '../data/esimDevices'
import { detectDevice } from '../lib/deviceHint'

/* ==========================================================================
 * Device check — one question, answered by typing.
 *
 * What this page used to be: two step cards teaching a phone code. The code
 * works and it is the only method that is certain, but as the whole page it put
 * the work on the visitor: read, switch to the dialler, find the * key, come
 * back, interpret. For most people the answer was already knowable — a Redmi
 * Note 13 has no eSIM, an iPhone 13 does.
 *
 * So the page answers first and teaches second. It is now three parts, each
 * with its own file and its own props:
 *
 *   DeviceSearch  which model does the visitor mean
 *   Verdict       what the answer is, and how sure we are
 *   ManualCheck   *#06#, for a model not on the list or sold in both forms
 *
 * This file is what is left: the question, the three parts, and the two facts
 * that pass between them — which device was picked, and whether the certain
 * method is open. It was one 530-line function before the split, which is also
 * why the CTA markup had been copy-pasted five times.
 * ========================================================================== */

export default function DeviceCheck() {
  const { t } = useTranslation()

  const [picked, setPicked] = useState<EsimDevice | null>(null)
  /** Set when the verdict came from the browser rather than from typing. */
  const [detected, setDetected] = useState<'model' | 'ios' | null>(null)
  /** The iOS major version behind an 'ios' verdict — it is the evidence, so the
   *  card states it rather than asserting the conclusion on its own. */
  const [iosVersion, setIosVersion] = useState<number | null>(null)
  const [unknownModel, setUnknownModel] = useState<string | null>(null)
  const [manual, setManual] = useState(false)

  const verdictRef = useRef<HTMLDivElement>(null)
  const manualRef = useRef<HTMLDivElement>(null)

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

  /* The answer has to feel like a response. On a phone it opens below the thumb,
     so it is brought into view — but only when it is actually outside the band
     left by the sticky header and the bottom nav, so a desktop visitor who can
     already see it is never yanked around. */
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
    bring(verdictRef)
  }, [])

  const openManual = useCallback(() => {
    setManual(true)
    bring(manualRef)
  }, [])

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

      <DeviceSearch onPick={pick} onCheckExactly={openManual} />

      <VerdictCard
        ref={verdictRef}
        device={picked}
        detected={detected}
        iosVersion={iosVersion}
        unknownModel={unknownModel}
        onCheckExactly={openManual}
      />

      <ManualCheck ref={manualRef} open={manual} onToggle={() => setManual((was) => !was)} />

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-[1.55] text-slate-soft sm:mt-6 sm:text-[12.5px]">
        <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-brand-500 dark:text-brand-300" />
        {t('device.privacyNote')}
      </p>
    </div>
  )
}
