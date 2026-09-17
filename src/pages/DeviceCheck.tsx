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

  /* The design draws the header as a floating pill from the first paint, not
     only once the page has scrolled. The class goes on <html> because the
     header is rendered by the layout, above this page in the tree — and it is
     removed on the way out, so no other route inherits it. */
  useEffect(() => {
    document.documentElement.classList.add('dc-route')
    return () => document.documentElement.classList.remove('dc-route')
  }, [])

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
    /* Deliberately NOT `.qs-page .qs-device .container-page`.
     *
     * Those three carry the previous layout — a 1184px cap, a 42px headline, a
     * 700px header — set in journey.css, and they win over the
     * utilities here by load order. The approved design is a 1410px column (63px
     * from each edge at 1536) with a 70px headline, so the page states its own
     * geometry instead of fighting rules written for the old one. Nothing else
     * on the site reads these classes, so no other page moves.
     *
     * 1474 = the 1410px column plus its own 32px padding, which is why the cap
     * is not the round number: at 1536 it centres to exactly the 63px margin
     * the design has, and below that the padding keeps a gutter instead of
     * letting the panel touch the edge. */
    /* `overflow-x-clip`, not `hidden`: the glow behind the phone is a 230px
     * circle centred on the picture and it reaches past the right edge on a
     * tablet. Clip trims it without making this a scroll container, so the
     * phone can still hang over the panel below — which `hidden` would cut. */
    <div className="dc-page mx-auto w-full max-w-[1474px] overflow-x-clip px-4 pb-20 pt-4 sm:px-8 sm:pt-6">
      <Seo title={t('seo.deviceTitle')} description={t('seo.deviceDescription')} />

      {/* The question, and the object the question is about.
       *
       * `relative`, and the phone inside it is absolutely placed: in the flow it
       * was a row item as tall as the picture, so two lines of type floated in
       * the middle of 280px of nothing. Out of the flow, the header is as tall
       * as its text and the phone hangs beside it — the design's proportion. */}
      <header className="dc-hero relative pt-6 sm:pt-10">
        {/* 45px in from the shell edge at desktop, which is x=108 at 1536 —
            the design insets the sentence from the panel below it. */}
        <div className="dc-heading-block relative z-10 max-w-2xl">
          <h1 className="dc-title font-display text-ink">
            {t('dc.title')}
          </h1>
          <p className="dc-lead mt-3 text-slate-soft">
            {t('dc.lead')}
          </p>
        </div>

        {/* A phone at the angle the render was made at, on the page's own green
            wash rather than a box the picture brought with it — the file is a
            cut-out with an alpha channel for exactly that.
            Its foot is deliberately behind the panel below: the design overlaps
            them, which is what stops the picture reading as a separate tile. */}
        <div className="pointer-events-none absolute right-0 top-2 hidden sm:block lg:top-[-4px] xl:right-[253px] xl:top-[-17px]">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(52,227,176,0.26)_0%,transparent_68%)] blur-xl xl:h-[420px] xl:w-[420px]"
          />
          <Photo
            name="device-esim"
            alt=""
            sizes="(min-width: 1280px) 302px, (min-width: 1024px) 210px, 150px"
            priority
            className="relative w-[150px] rotate-[8deg] drop-shadow-[0_28px_44px_rgba(9,46,40,0.20)] lg:w-[210px] xl:w-[302px]"
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
