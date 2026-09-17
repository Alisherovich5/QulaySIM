import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Photo from '../components/media/Photo'
import Seo from '../components/Seo'
import DeviceSearch from '../components/device/DeviceSearch'
import ManualCheck from '../components/device/ManualCheck'
import VerdictCard from '../components/device/Verdict'
import { findDevices, type EsimDevice } from '../data/esimDevices'
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
    <div className="qs-page qs-device container-page">
      <Seo title={t('seo.deviceTitle')} description={t('seo.deviceDescription')} />

      {/* The question, and the object the question is about.
       *
       * The back link and the "QURILMA TEKSHIRUVI" eyebrow above the headline
       * are gone to the approved design. The navigation already says where the
       * visitor is — its own tab is underlined — and an eyebrow repeating the
       * page title above the page title is a label on a label. */}
      {/* `relative`, and the phone inside it is absolutely placed.
       *
       * In the grid it was a 280px-tall row item, so the header was as tall as
       * the picture and the two lines of type floated in the middle of it with
       * 150px of nothing above and below. Out of the flow, the header is as
       * tall as its text and the phone hangs beside it, which is the
       * proportion the design has. */}
      <header className="relative pt-1 sm:min-h-[210px] sm:pt-3 lg:min-h-[268px]">
        <div className="max-w-2xl lg:max-w-[560px]">
          {/* Capped so "tayyormi?" takes its own line, as the design does. Left
              to run, the question sets on one 600px line and stops reading as a
              headline — it reads as a sentence that happens to be large. */}
          <h1 className="font-display text-[28px] font-800 leading-[1.08] tracking-[-0.03em] text-ink min-[360px]:text-[32px] sm:text-[44px] lg:text-[52px]">
            {t('dc.title')}
          </h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-slate-soft sm:mt-3 sm:text-[18px] sm:leading-[1.6]">
            {t('dc.lead')}
          </p>
        </div>

        {/* A phone, at the angle the render was made at, on a green wash that
            is the page's own accent rather than a box the picture brought with
            it — the file is a cut-out with an alpha channel for exactly that.
            `priority`: it is the largest thing above the fold here. */}
        <div className="pointer-events-none absolute -top-1 right-0 hidden sm:block lg:top-0 lg:right-6">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(52,227,176,0.30)_0%,transparent_68%)] blur-xl lg:h-[250px] lg:w-[250px]"
          />
          <Photo
            name="device-esim"
            alt=""
            sizes="(min-width: 1024px) 175px, 130px"
            priority
            className="relative w-[130px] rotate-[8deg] drop-shadow-[0_24px_38px_rgba(9,46,40,0.22)] lg:w-[175px]"
          />
        </div>
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
        <ShieldCheck
          size={14}
          aria-hidden
          className="mt-px shrink-0 text-brand-500 dark:text-brand-300"
        />
        {t('device.privacyNote')}
      </p>
    </div>
  )
}
