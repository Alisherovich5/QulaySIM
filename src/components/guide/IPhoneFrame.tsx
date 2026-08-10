import type { ReactNode } from 'react'

/**
 * An iPhone drawn in CSS, to put a picture beside each written step.
 *
 * Drawn rather than photographed. Real screenshots would be a stack of PNGs to
 * re-shoot at every iOS release, in three languages, arriving at a tethered phone
 * at a few hundred kilobytes each; this is a handful of elements that inherit the
 * site's theme and stay sharp at any size.
 *
 * The first version read as cheap and the owner said so. What was wrong was not
 * the idea but the proportions: a squat box with a fixed 230px screen, a flat
 * bezel and a half-empty list looks like a placeholder. A phone is recognised by
 * its shape long before its contents — so the frame now holds the real 9:19.5
 * ratio, the shell has thickness and a highlight along its top edge, and the
 * content fills the screen instead of leaving a third of it blank.
 *
 * Still a diagram, not a replica: the job is to show *where the next tap is*,
 * which is what prose communicates worst. Apple's typography and icons are
 * deliberately not imitated.
 */
export function IPhoneFrame({
  children,
  label,
  raised = false,
}: {
  children: ReactNode
  label: string
  /** Lifts one frame slightly, so a row reads as objects rather than tiles. */
  raised?: boolean
}) {
  return (
    <figure className={`mx-auto w-full max-w-[200px] ${raised ? 'sm:-translate-y-3' : ''}`}>
      {/* `aria-hidden` on the drawing, with the instruction in the caption: a
          screen reader gets one sentence instead of walking a fake settings menu.

          The shell is a gradient rather than a flat fill — a single colour is what
          makes a rounded rectangle look like a rounded rectangle instead of a
          device. */}
      <div
        aria-hidden
        className="relative rounded-[2rem] bg-gradient-to-b from-slate-600 via-slate-900 to-slate-700 p-[3px] shadow-[0_18px_36px_-14px_rgba(2,6,23,0.55)] ring-1 ring-black/30 dark:from-slate-700 dark:via-black dark:to-slate-800"
      >
        {/* A bright hairline along the top edge reads as light catching metal;
            without it the shell looks printed on. */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px rounded-full bg-white/25" />

        <div className="relative overflow-hidden rounded-[1.85rem] bg-slate-50 dark:bg-slate-900">
          {/* 9:19.5 — the shape a phone actually is. The old frame was far squarer,
              and that alone made it read as a mock-up of a mock-up. */}
          <div className="flex aspect-[9/19.5] flex-col">
            <div className="relative flex shrink-0 items-center justify-between px-3.5 pb-1 pt-2.5 text-[8px] font-700 text-slate-700 dark:text-slate-200">
              <span>9:41</span>
              {/* The island floats over the status bar rather than notching the
                  top edge, which is where recent iPhones put it. */}
              <div className="absolute left-1/2 top-2 flex h-[15px] w-[54px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2">
                <span className="h-[5px] w-[5px] rounded-full bg-slate-700" />
              </div>
              <span className="flex items-center gap-[3px]">
                <span className="inline-flex items-end gap-[1px]">
                  <i className="h-[3px] w-[2px] rounded-sm bg-current" />
                  <i className="h-[5px] w-[2px] rounded-sm bg-current" />
                  <i className="h-[7px] w-[2px] rounded-sm bg-current" />
                </span>
                <span className="ml-[1px] flex h-[6px] w-[11px] items-center rounded-[2px] border border-current p-[1px]">
                  <span className="block h-full w-2/3 rounded-[1px] bg-current" />
                </span>
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2 pb-2">{children}</div>

            <div className="mx-auto mb-1.5 h-[3px] w-16 shrink-0 rounded-full bg-slate-400/70 dark:bg-slate-500/60" />
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-[11px] leading-snug text-slate-soft">
        {label}
      </figcaption>
    </figure>
  )
}

/** A grey iOS-style section heading. */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 pt-1.5 text-[8px] font-700 uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {children}
    </p>
  )
}

/**
 * One row of an iOS settings list.
 *
 * `highlight` is why this exists: it marks the row the customer is told to tap,
 * so the picture answers "which one?" without the sentence describing a position.
 */
export function ScreenRow({
  children,
  highlight = false,
  chevron = true,
  value,
}: {
  children: ReactNode
  highlight?: boolean
  chevron?: boolean
  value?: string
}) {
  return (
    <div
      className={`flex items-start justify-between gap-1.5 px-2 py-[7px] text-[10px] leading-tight ${
        highlight
          ? 'bg-brand-500 font-700 text-white'
          : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
      }`}
    >
      {/* Wraps at spaces only. Truncation ate the two longest labels — which are
          exactly the rows being pointed at — and `break-words` split
          "Qo'ng'iroqlar" mid-word, which read worse still. A label that will not
          fit at this width is a label to shorten. */}
      <span className="min-w-0 flex-1">{children}</span>
      <span
        className={`shrink-0 whitespace-nowrap pt-px text-[9px] ${
          highlight ? 'text-white/85' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {value}
        {chevron && ' ›'}
      </span>
    </div>
  )
}

/**
 * A grouped list, the way iOS rounds a section's outer corners only.
 *
 * Divided rows inside one rounded card rather than separate floating pills —
 * the pills were part of why the first version looked unlike a settings screen.
 */
export function ScreenList({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/5">
      <div className="divide-y divide-slate-200/80 dark:divide-slate-700/60">{children}</div>
    </div>
  )
}
