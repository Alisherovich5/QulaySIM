import { useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, validationMessage } from '../../lib/api'
import type { AccountSummary } from '../../lib/types'

interface Props {
  summary: AccountSummary
  initials: string
  /** Called with the fresh summary the API returns, so the page updates at once. */
  onUpdated: (summary: AccountSummary) => void
}

const MAX_BYTES = 5 * 1024 * 1024

/**
 * The avatar, and the control for changing it.
 *
 * The picture is the button — that is how every app people already use behaves,
 * and it saves a row of controls in a header that is already busy. The file
 * input stays in the DOM but hidden, because a styled `<label>` wrapping a real
 * input is the only version that keeps keyboard and screen-reader behaviour.
 *
 * Size is checked here as well as on the server: the point is not security —
 * the server decides that — but not making someone wait for a 20 MB upload only
 * to be told no.
 */
export default function AvatarPicker({ summary, initials, onUpdated }: Props) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (file: File) => {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError(t('account.avatarTooLarge', { mb: MAX_BYTES / 1024 / 1024 }))
      return
    }
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post<AccountSummary>('/account/avatar', body)
      onUpdated(data)
    } catch (err) {
      // The API returns a code per rule, so the reason is translatable.
      setError(validationMessage(err, t) ?? t('account.avatarFailed'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.delete<AccountSummary>('/account/avatar')
      onUpdated(data)
    } catch {
      setError(t('account.avatarFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative -mt-9 shrink-0 sm:-mt-10">
      <label
        className="group relative block h-[4.5rem] w-[4.5rem] cursor-pointer sm:h-20 sm:w-20"
        aria-label={t('account.avatarChange')}
      >
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void send(file)
          }}
        />
        {summary.avatar_url ? (
          <img
            src={summary.avatar_url}
            alt=""
            className="h-full w-full rounded-2xl object-cover shadow-lg shadow-brand-500/30 ring-4 ring-surface"
          />
        ) : (
          <span className="grid h-full w-full place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-xl font-700 uppercase text-white shadow-lg shadow-brand-500/30 ring-4 ring-surface sm:text-2xl">
            {initials}
          </span>
        )}

        {/* The hint sits on the image on hover and is always visible on touch,
            where there is no hover to reveal it. */}
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center rounded-2xl bg-brand-950/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-0"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
        </span>
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white ring-2 ring-surface md:hidden"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
        </span>
      </label>

      {summary.avatar_url && !busy && (
        <button
          type="button"
          onClick={() => void remove()}
          className="mt-2 flex items-center gap-1 text-[11px] font-600 text-slate-soft transition hover:text-red-500"
        >
          <Trash2 size={11} /> {t('account.avatarRemove')}
        </button>
      )}
      {error && (
        <p className="absolute left-0 top-full mt-1 w-52 text-[11px] leading-snug text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
