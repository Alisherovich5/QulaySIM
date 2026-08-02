import { useTranslation } from 'react-i18next'

/* ==========================================================================
 * The two drawings on the device-check page.
 *
 * Both are honest line illustrations, not imitation screenshots. The previous
 * page drew a whole dark phone out of CSS — bezel gradients, a fake status
 * bar, barcode-shaped stripes — and the more faithful the cosplay got, the
 * cheaper it read, because a near-screenshot invites comparison with a real
 * one and always loses. A diagram makes no such claim: it shows only the two
 * facts the page needs (where the * and # keys are, and what an EID row looks
 * like) and lets the surrounding card supply the chrome.
 *
 * Everything is drawn with the design system's own tokens — semantic fills
 * (surface, line, ink) flip with the theme by themselves, brand strokes name
 * their dark step explicitly, exactly like the rest of the app. No external
 * assets: the CSP forbids them, and none are needed.
 * ========================================================================== */

/** One keypad key. The * and # keys are the ones people hunt for, so they are
 *  the only tinted things in the drawing. */
function Key({ x, y, label, lit }: { x: number; y: number; label: string; lit?: boolean }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={17}
        strokeWidth={lit ? 1.6 : 1.2}
        className={
          lit
            ? 'fill-brand-500/12 stroke-brand-500 dark:stroke-brand-300'
            : 'fill-surface stroke-line'
        }
      />
      <text
        x={x}
        // The asterisk glyph hangs high in every UI font; nudging it down keeps
        // it optically centred with the digits around it.
        y={label === '*' ? y + 6 : y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={label === '*' || label === '#' ? 16 : 13}
        className={
          lit
            ? 'fill-brand-600 font-700 dark:fill-brand-300'
            : 'fill-ink font-600'
        }
      >
        {label}
      </text>
    </g>
  )
}

/**
 * The dial pad with *#06# already typed. Shows the one thing people actually
 * get stuck on — the * and # keys live on the keypad's bottom row.
 */
export function DialPadFigure() {
  const KEYS: [string, boolean?][] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(
    (k) => [k, k === '*' || k === '#'],
  )
  return (
    <svg
      viewBox="0 0 240 262"
      role="presentation"
      aria-hidden
      className="mx-auto block h-auto w-full max-w-[240px]"
    >
      {/* the input field, code typed */}
      <rect x={30} y={8} width={180} height={42} rx={13} strokeWidth={1.2} className="fill-mist stroke-line" />
      <text
        x={120}
        y={31}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={21}
        letterSpacing={3}
        className="fill-ink font-display font-700"
      >
        *#06#
      </text>
      {/* caret, so the field reads as live input rather than a label */}
      <rect x={187} y={19} width={1.6} height={20} rx={0.8} className="fill-brand-500 dark:fill-brand-300">
        <animate attributeName="opacity" values="1;1;0;0" dur="1.2s" repeatCount="indefinite" />
      </rect>

      {KEYS.map(([label, lit], i) => (
        <Key key={label} x={68 + (i % 3) * 52} y={90 + Math.floor(i / 3) * 50} label={label} lit={lit} />
      ))}
    </svg>
  )
}

/**
 * The identifiers sheet, reduced to the two rows the question is about. The
 * EID row is the one being hunted, so it is the one that is lit — and its
 * digits are visibly a sample, grouped and elided, never a whole believable
 * identifier.
 */
export function IdentifierSheetFigure() {
  const { t } = useTranslation()
  return (
    <svg
      viewBox="0 0 340 158"
      role="presentation"
      aria-hidden
      className="block h-auto w-full"
    >
      <rect x={1} y={1} width={338} height={156} rx={18} strokeWidth={1.2} className="fill-surface-2 stroke-line" />

      {/* sheet header */}
      <circle cx={26} cy={27} r={8} strokeWidth={1.2} className="fill-surface stroke-line" />
      <path d="M23.2 24.2 L28.8 29.8 M28.8 24.2 L23.2 29.8" strokeWidth={1.4} strokeLinecap="round" className="stroke-slate-soft" />
      <text x={44} y={31} fontSize={12.5} className="fill-ink font-700">
        {t('device.resultTitle')}
      </text>

      {/* EID — the row that answers the question */}
      <rect x={14} y={48} width={312} height={44} rx={11} strokeWidth={1.6} className="fill-brand-500/10 stroke-brand-500 dark:stroke-brand-300" />
      <text x={28} y={75} fontSize={12} className="fill-brand-600 font-700 dark:fill-brand-300">
        EID
      </text>
      <text x={62} y={75} fontSize={13.5} letterSpacing={0.6} className="fill-ink font-mono">
        8904 4032 0074 12 …
      </text>
      <circle cx={302} cy={70} r={10} className="fill-brand-500 dark:fill-brand-400" />
      <path d="M297.5 70.2 l3 3 l6-6.4" fill="none" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" className="stroke-white dark:stroke-brand-900" />

      {/* IMEI — present on every phone, so it stays quiet */}
      <rect x={14} y={100} width={312} height={44} rx={11} strokeWidth={1.2} className="fill-surface stroke-line" />
      <text x={28} y={127} fontSize={12} className="fill-slate-soft font-700">
        IMEI
      </text>
      <text x={70} y={127} fontSize={13.5} letterSpacing={0.6} className="fill-slate-soft font-mono">
        3514 2108 7468 97 …
      </text>
    </svg>
  )
}
