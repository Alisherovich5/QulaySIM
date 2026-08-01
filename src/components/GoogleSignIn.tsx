import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type GoogleGlobal = {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

/**
 * Whether the rendered button is a real one.
 *
 * When the page's origin is not on the OAuth client's allow-list, Google still
 * injects an iframe and logs the reason to the console — but the button does
 * nothing when clicked. A dead control is worse than no control: it reads as a
 * broken site rather than a feature that is not available, and the operator
 * only finds out when someone complains.
 */
function buttonIsLive(host: HTMLElement): boolean {
  // The iframe specifically, and it must have a box. Broadening this to "any
  // descendant with a size" was tried and reverted: GSI leaves a sized wrapper
  // behind even when it refuses the origin, so the looser test called a dead
  // button live and switched the detection off. Measured on production, the
  // working button IS a sized accounts.google.com iframe.
  const frame = host.querySelector('iframe')
  return Boolean(frame && frame.clientWidth > 0 && frame.clientHeight > 0)
}

declare global {
  interface Window {
    google?: GoogleGlobal
  }
}

/**
 * The reasons the API accepts. It rejects anything else with a 422, so this
 * list has to stay in step with GoogleFailureReason in the backend's
 * app/schemas/auth.py.
 */
type FailureReason =
  | 'script_blocked'
  | 'button_not_rendered'
  | 'popup_failed_to_open'
  | 'popup_closed'
  | 'credential_missing'
  | 'unknown'

/** The error_callback types GSI documents; anything else is reported as unknown. */
const KNOWN_GSI_ERRORS: FailureReason[] = ['popup_failed_to_open', 'popup_closed']

/**
 * Reasons already reported on this page load.
 *
 * The render effect re-runs whenever the interface language changes, so one
 * stuck button would otherwise file the same report several times and make the
 * log read like repeated attempts. One line per distinct fault per page load
 * is enough to tell the operator what happened.
 */
const reported = new Set<FailureReason>()

/**
 * Tell the API that Google sign-in died in the browser.
 *
 * Everything GSI says when it refuses goes to the console: the origin is not
 * allow-listed, the popup would not open. None of it reaches the server, so a
 * failed sign-in is invisible unless the person happens to report it. This
 * turns it into a log line.
 *
 * Deliberately fire-and-forget — never awaited, every error swallowed. The
 * report is worth strictly less than the page it runs on, and a diagnostic
 * that produces a second error is worse than no diagnostic at all.
 */
function report(reason: FailureReason): void {
  if (reported.has(reason)) return
  reported.add(reason)
  try {
    void api.post('/auth/google/failed', { reason }).catch(() => {})
  } catch {
    // Also guarded synchronously: this runs inside GSI's own callback, and a
    // throw crossing back into their code could take the button with it.
  }
}

/** Loaded once per page, however many buttons ask for it. */
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('gsi failed')))
      if (window.google) resolve()
      return
    }
    const tag = document.createElement('script')
    tag.src = SCRIPT_SRC
    tag.async = true
    tag.defer = true
    tag.onload = () => resolve()
    tag.onerror = () => reject(new Error('gsi failed'))
    document.head.appendChild(tag)
  })
  return scriptPromise
}

interface Props {
  /** Where to go once signed in. */
  onSuccess: () => void
  onError: (message: string) => void
}

/**
 * "Continue with Google", rendered only when the server says it is configured.
 *
 * The client id comes from `/auth/providers` rather than the front-end build,
 * so switching Google on is a server environment change instead of a rebuild —
 * and a deployment without one shows nothing here rather than a button that
 * cannot work.
 */
export default function GoogleSignIn({ onSuccess, onError }: Props) {
  const { t, i18n } = useTranslation()
  const { loginWithGoogle } = useAuth()
  const [clientId, setClientId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    api
      .get<{ google_client_id: string }>('/auth/providers')
      .then((r) => alive && setClientId(r.data.google_client_id || ''))
      .catch(() => alive && setClientId(''))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!clientId || !host.current) return
    let alive = true
    const timers: number[] = []

    loadScript()
      .catch((error: unknown) => {
        // Only the script load itself. Reporting from the chain's tail instead
        // would label any later fault a blocked script, which is exactly the
        // kind of wrong evidence this endpoint exists to avoid.
        report('script_blocked')
        throw error
      })
      .then(() => {
        if (!alive || !window.google || !host.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              report('credential_missing')
              onError(t('auth.googleFailed'))
              return
            }
            try {
              await loginWithGoogle(response.credential)
              onSuccess()
            } catch {
              // Not reported: this one already reached /auth/google, so the
              // server logged why it refused. Only the failures that never
              // arrive need a report.
              //
              // The API deliberately does not say which check failed, so the
              // only honest message is that it did not work.
              onError(t('auth.googleFailed'))
            }
          },
          // GSI's own failure channel: the popup blocked, or closed before it
          // handed anything back. It never fires for a rejected origin — that
          // case is caught by the liveness poll below.
          error_callback: (error?: { type?: string }) => {
            const type = error?.type as FailureReason | undefined
            report(type && KNOWN_GSI_ERRORS.includes(type) ? type : 'unknown')
          },
          // One-tap is deliberately off: it pops up unprompted on first visit,
          // before the customer has any reason to trust the page.
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        // Google needs a pixel width and will not take a percentage, so it is
        // measured from the slot it renders into. A fixed 320 overflowed the
        // card on a 390px phone by 14px — the button is inside a max-w-md card
        // with p-8, which leaves 286px.
        const available = host.current.getBoundingClientRect().width
        window.google.accounts.id.renderButton(host.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          // Google takes its button language from the browser unless told
          // otherwise, so an English page showed an Uzbek button and vice versa.
          // This is the language the visitor actually chose.
          locale: i18n.language.split('-')[0],
          // Google clamps to 200–400 itself, but doing it here keeps a narrow
          // slot from producing a button wider than its container.
          width: Math.round(Math.min(400, Math.max(200, available))),
        })

        // Google renders the iframe asynchronously and, on a rejected origin,
        // gives up without calling anything back — so the only reliable signal
        // is that nothing with a size ever appeared.
        //
        // Polled rather than checked once: a single deadline would call a slow
        // render a failure and hide a button that was about to work. This gives
        // up only after five seconds of nothing.
        const deadline = Date.now() + 5000
        const poll = window.setInterval(() => {
          if (!alive || !host.current) {
            window.clearInterval(poll)
            return
          }
          if (buttonIsLive(host.current)) {
            window.clearInterval(poll)
          } else if (Date.now() > deadline) {
            window.clearInterval(poll)
            // Nothing with a size ever appeared, and GSI said why only in the
            // console. Reported before the "unavailable" text goes up, so the
            // log can tell this apart from a button that did render and then
            // failed later — which is the distinction nobody can make today.
            report('button_not_rendered')
            setFailed(true)
          }
        }, 300)
        timers.push(poll)
      })
      .catch(() => alive && setFailed(true))

    return () => {
      alive = false
      timers.forEach(window.clearInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, i18n.language])

  // Nothing at all until the server confirms a client id: an empty slot is
  // better than a placeholder that never becomes a button.
  if (clientId === null || clientId === '') return null

  if (failed) {
    return (
      <p className="text-center text-xs text-slate-soft">{t('auth.googleUnavailable')}</p>
    )
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-600 uppercase tracking-wide text-slate-soft">
          {t('auth.or')}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      {/* Google renders its own button in here; its markup is fixed by the
          brand guidelines, so it is centred rather than restyled. */}
      <div ref={host} className="mt-4 flex w-full justify-center [color-scheme:light]" />
    </div>
  )
}
