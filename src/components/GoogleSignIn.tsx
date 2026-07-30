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

declare global {
  interface Window {
    google?: GoogleGlobal
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
  const { t } = useTranslation()
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

    loadScript()
      .then(() => {
        if (!alive || !window.google || !host.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              onError(t('auth.googleFailed'))
              return
            }
            try {
              await loginWithGoogle(response.credential)
              onSuccess()
            } catch {
              // The API deliberately does not say which check failed, so the
              // only honest message is that it did not work.
              onError(t('auth.googleFailed'))
            }
          },
          // One-tap is deliberately off: it pops up unprompted on first visit,
          // before the customer has any reason to trust the page.
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        window.google.accounts.id.renderButton(host.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
        })
      })
      .catch(() => alive && setFailed(true))

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

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
      <div ref={host} className="mt-4 flex justify-center [color-scheme:light]" />
    </div>
  )
}
