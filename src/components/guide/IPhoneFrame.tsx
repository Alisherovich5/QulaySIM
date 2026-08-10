import type { ReactNode } from 'react'

/**
 * An iPhone drawn in CSS, to put a picture beside each written step.
 *
 * Drawn rather than photographed on purpose. Real iOS screenshots would be a
 * stack of PNGs to re-shoot at every iOS release, in three languages, and they
 * would arrive at a phone on a tethered connection as several hundred kilobytes
 * each. This is a few elements that inherit the site's own theme and stay sharp
 * at any size.
 *
 * It is a diagram, not a replica: the point is to show *where on the screen* the
 * next tap is, which is the part a written instruction communicates worst.
 * Apple's exact typography and iconography are deliberately not imitated.
 */
export function IPhoneFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="mx-auto w-full max-w-[190px]">
      <div
        // `aria-hidden` on the drawing, with the real text in the caption: a
        // screen reader gets one sentence instead of walking a fake settings menu.
        aria-hidden
        className="relative rounded-[1.75rem] bg-slate-900 p-[5px] shadow-lg ring-1 ring-black/20 dark:bg-slate-950 dark:ring-white/10"
      >
        <div className="relative overflow-hidden rounded-[1.5rem] bg-white dark:bg-slate-900">
          {/* Dynamic island. Purely a cue that this is a phone. */}
          <div className="absolute left-1/2 top-1.5 z-10 h-[14px] w-[52px] -translate-x-1/2 rounded-full bg-slate-900 dark:bg-black" />
          <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[8px] font-600 text-slate-500 dark:text-slate-400">
            <span>9:41</span>
            <span className="tracking-tight">▮▮▯ ⌁</span>
          </div>
          <div className="min-h-[230px] bg-slate-50 px-2 pb-3 dark:bg-slate-800/60">{children}</div>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-[11px] leading-snug text-slate-soft">
        {label}
      </figcaption>
    </figure>
  )
}

/** A grey iOS-style section heading. */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 pb-1 pt-2 text-[9px] font-600 uppercase tracking-wide text-slate-400">
      {children}
    </p>
  )
}

/**
 * One row of an iOS settings list.
 *
 * `highlight` is the whole reason this component exists: it marks the row the
 * customer is being told to tap, so the picture answers "which one?" without the
 * sentence having to describe its position.
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
      className={`flex items-start justify-between gap-1.5 rounded-md px-2 py-1.5 text-[10px] leading-tight ${
        highlight
          ? 'bg-brand-500 font-700 text-white'
          : 'bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      {/* Wraps rather than truncates. At phone width the frames are 143px across,
          and truncation turned the rows a customer is meant to match against
          their own screen into "Enter Details Ma…" and "Mobil int…" — the two
          longest labels, which are exactly the ones being pointed at. Two short
          lines read; an ellipsis does not. */}
      {/* Wraps at spaces only. `break-words` split "Qo'ng'iroqlar" as
          "Qo'ng'iro / qlar", which is worse than the truncation it replaced — a
          label too long for 143px is a label to shorten, not to hyphenate. */}
      <span className="min-w-0 flex-1">{children}</span>
      <span
        className={`shrink-0 whitespace-nowrap pt-px text-[9px] ${
          highlight ? 'text-white/80' : 'text-slate-400'
        }`}
      >
        {value}
        {chevron && ' ›'}
      </span>
    </div>
  )
}

/** A stack of rows with the hairlines iOS puts between them. */
export function ScreenList({ children }: { children: ReactNode }) {
  return <div className="space-y-[3px]">{children}</div>
}
