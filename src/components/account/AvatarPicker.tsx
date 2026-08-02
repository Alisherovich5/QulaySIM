import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, Camera, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, validationMessage } from '../../lib/api'
import type { AccountSummary } from '../../lib/types'

interface Props {
  summary: AccountSummary
  initials: string
  /** Called with the fresh summary the API returns, so the page updates at once. */
  onUpdated: (summary: AccountSummary) => void
}

// Must agree with MAX_UPLOAD_BYTES in the API's app/domain/avatars.py. 5 MB
// refused what a current iPhone routinely produces (5-10 MB off the camera) —
// the check exists to fail fast on absurd files, not to fail normal photos.
const MAX_BYTES = 15 * 1024 * 1024

/** What the component is waiting on — drives the label the live region reads. */
type Pending = 'upload' | 'remove' | null

/* The whole disc is the tap target, but the camera badge is the only thing in
   the accessibility tree: two controls that open the same file dialog would be
   read out twice for no gain. The disc is therefore a redundant pointer
   surface (aria-hidden, out of the tab order) and the badge is a real button
   with a real name — focus, Enter and Space all land there.

   The width is fixed rather than inherited because the badge is positioned
   against this box; a full-width flex child would fling it to the far edge of
   the header. */
const ROOT = 'group/av relative -mt-9 w-[4.5rem] shrink-0 sm:-mt-10 sm:w-20'

/* `elev-2` lives on the outer button and the white ring on the inner one:
   both are box-shadows, so on one element the later declaration would simply
   erase the other. */
const DISC =
  'elev-2 relative block h-[4.5rem] w-[4.5rem] rounded-full outline-none sm:h-20 sm:w-20 ' +
  'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ' +
  'group-hover/av:scale-[1.03] group-active/av:scale-[0.97]'

const DISC_INNER = 'relative block h-full w-full overflow-hidden rounded-full ring-4 ring-surface'

/* A calm disc from the surface tokens rather than a saturated gradient: the
   two surface steps only differ by a few percent of lightness, which reads as
   a lit object in both themes instead of a green sticker. */
const FALLBACK =
  'grid h-full w-full place-items-center bg-gradient-to-b from-surface to-surface-2 ' +
  'dark:from-surface-2 dark:to-surface font-display text-xl font-700 uppercase ' +
  'text-brand-600 dark:text-brand-300 sm:text-2xl'

const MENU_ITEM =
  'focus-ring flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-600 transition-colors'

/* One floating panel anchored to the disc, used by the actions and by the
   error in turn. It has to be opaque and lifted: the header is a busy place
   and at 390px the name sits directly underneath.

   It hangs below the disc on a phone, where the header is tall, and beside it
   from `sm` up, where the header is short and a panel below would spill past
   the card — under the next section, which paints over it.

   Placement and skin are split across two elements on purpose: the entrance
   animation writes `transform`, which would cancel the centring translate. */
const PANEL_POS =
  'absolute left-0 top-[calc(100%+0.7rem)] z-30 sm:left-[calc(100%+0.85rem)] sm:top-1/2 sm:-translate-y-1/2'

const PANEL =
  'origin-top-left rounded-2xl bg-surface shadow-xl shadow-brand-900/20 ring-1 ring-line ' +
  'motion-safe:animate-[fs-rise_180ms_cubic-bezier(0.22,1,0.36,1)_both] sm:origin-left ' +
  'dark:bg-surface-2 dark:shadow-black/60'

/**
 * The avatar, and the control for changing it.
 *
 * Circular, with the camera badge overlapping the bottom-right the way every
 * messenger does it, because that shape is what people already read as "this
 * picture is mine and I can replace it".
 *
 * Removing is real but secondary: it lives behind the badge, one tap away,
 * instead of sitting as a permanent delete link under a header that is already
 * busy — and keeping it out of the flow means the header never reflows when a
 * photo appears or goes.
 *
 * Size is checked here as well as on the server: the point is not security —
 * the server decides that — but not making someone wait for a 20 MB upload only
 * to be told no.
 */
export default function AvatarPicker({ summary, initials, onUpdated }: Props) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  const hasPhoto = Boolean(summary.avatar_url)
  const busy = pending !== null

  /* Dismissal for whatever panel is open: a press anywhere else, Escape (which
     hands focus back to the badge, so the keyboard does not get stranded), and
     focus leaving the group by Tab. The error dismisses the same way — it
     covers the name while it is up, so it must be easy to get rid of. */
  useEffect(() => {
    if (!menuOpen && !error) return
    const node = root.current

    const dismiss = () => {
      setMenuOpen(false)
      setError(null)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!node?.contains(e.target as Node)) dismiss()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      dismiss()
      trigger.current?.focus()
    }
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null
      if (next && !node?.contains(next)) setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    node?.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      node?.removeEventListener('focusout', onFocusOut)
    }
  }, [menuOpen, error])

  const send = async (file: File) => {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError(t('account.avatarTooLarge', { mb: MAX_BYTES / 1024 / 1024 }))
      // Reset here too: without it the input still holds the rejected file and
      // choosing the same one again fires no change event at all.
      if (input.current) input.current.value = ''
      return
    }
    setPending('upload')
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post<AccountSummary>('/account/avatar', body)
      onUpdated(data)
    } catch (err) {
      // The API returns a code per rule, so the reason is translatable.
      setError(validationMessage(err, t) ?? t('account.avatarFailed'))
    } finally {
      setPending(null)
      if (input.current) input.current.value = ''
    }
  }

  const remove = async () => {
    // The item being clicked is about to unmount, so hand focus back to the
    // badge first — otherwise it falls to <body> and the keyboard restarts at
    // the top of the page.
    setMenuOpen(false)
    trigger.current?.focus()
    setPending('remove')
    setError(null)
    try {
      const { data } = await api.delete<AccountSummary>('/account/avatar')
      onUpdated(data)
    } catch {
      setError(t('account.avatarFailed'))
    } finally {
      setPending(null)
    }
  }

  const pick = () => {
    setMenuOpen(false)
    trigger.current?.focus()
    input.current?.click()
  }

  /* Nothing to choose between when there is no photo yet, so the badge skips
     the menu and opens the file dialog straight away. */
  const activate = () => {
    if (busy) return
    if (hasPhoto) setMenuOpen((open) => !open)
    else pick()
  }

  /* One sentence for both the live region and the button's name, so what a
     screen reader hears announced is what it reads back on the control. */
  const status =
    pending === 'upload'
      ? t('account.avatarUploading')
      : pending === 'remove'
        ? t('account.avatarRemoving')
        : ''
  const badgeLabel = status || (hasPhoto ? t('account.avatarOptions') : t('account.avatarAdd'))

  return (
    <div ref={root} className={ROOT}>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void send(file)
        }}
      />

      <button type="button" aria-hidden="true" tabIndex={-1} onClick={activate} className={DISC}>
        <span className={DISC_INNER}>
          {summary.avatar_url ? (
            <img src={summary.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={FALLBACK}>{initials}</span>
          )}

          {/* Hairline over both states: `ink` flips with the theme, so this is a
              dark edge on light and a light edge on dark from one class. */}
          <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-ink/10" />

          {/* Interaction ring — hover, and keyboard focus landing on the badge. */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-brand-500/0 transition-[box-shadow] duration-200 group-hover/av:ring-brand-500/60 group-has-[:focus-visible]/av:ring-brand-500 dark:group-hover/av:ring-brand-300/60 dark:group-has-[:focus-visible]/av:ring-accent-400"
            aria-hidden
          />

          {/* Scrim: the pending state always, and on hover over a photo — where
              it is the only way to say "this can be replaced". Over the
              initials it is left off: there is nothing to see through it, and
              the badge already carries the invitation. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-brand-900/60 text-white transition-opacity duration-200 ${
              busy ? 'opacity-100' : hasPhoto ? 'opacity-0 group-hover/av:opacity-100' : 'opacity-0'
            }`}
          >
            {busy ? (
              <Loader2
                size={22}
                className="animate-spin motion-reduce:[animation-duration:2.4s]"
              />
            ) : (
              <Camera size={20} />
            )}
          </span>
        </span>
      </button>

      {/* 44px of button around a 32px badge: the target is finger-sized without
          the mark growing into the name beside it. */}
      <button
        ref={trigger}
        type="button"
        onClick={activate}
        aria-label={badgeLabel}
        aria-busy={busy}
        aria-disabled={busy}
        aria-haspopup={hasPhoto ? true : undefined}
        aria-expanded={hasPhoto ? menuOpen : undefined}
        aria-controls={hasPhoto && menuOpen ? menuId : undefined}
        className="group/badge absolute -bottom-2.5 -right-2.5 grid h-11 w-11 place-items-center rounded-full outline-none aria-disabled:cursor-progress"
      >
        {/* The focus outline is drawn on the 32px mark rather than on the 44px
            hit area, so the indicator hugs what the eye reads as the button. */}
        <span
          className={`grid h-8 w-8 place-items-center rounded-full text-white shadow-md shadow-brand-900/40 ring-2 ring-surface transition-[background-color,transform] duration-200 group-hover/av:bg-brand-600 group-active/av:scale-90 group-focus-visible/badge:[outline:2px_solid_var(--fs-focus)] group-focus-visible/badge:[outline-offset:3px] motion-reduce:transition-none motion-reduce:group-active/av:scale-100 dark:shadow-black/60 ${
            menuOpen ? 'bg-brand-600' : 'bg-brand-500'
          }`}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin motion-reduce:[animation-duration:2.4s]" />
          ) : (
            <Camera size={15} />
          )}
        </span>
      </button>

      {menuOpen && (
        <div className={PANEL_POS}>
          <div id={menuId} className={`${PANEL} w-52 p-1.5`}>
            <button
              type="button"
              onClick={pick}
              className={`${MENU_ITEM} text-ink hover:bg-ink/[0.06] focus-visible:bg-ink/[0.06]`}
            >
              <Camera size={16} className="shrink-0 text-slate-soft" />
              {t('account.avatarChange')}
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              className={`${MENU_ITEM} text-red-600 hover:bg-red-500/10 focus-visible:bg-red-500/10 dark:text-red-400`}
            >
              <Trash2 size={16} className="shrink-0" />
              {t('account.avatarRemove')}
            </button>
          </div>
        </div>
      )}

      {/* Floated rather than placed in the flow: the disc is 72px wide, and
          anything that grows this box shoves the name around it. */}
      {error && !menuOpen && (
        <div className={PANEL_POS}>
          <p
            role="alert"
            className={`${PANEL} flex w-56 items-start gap-2 px-3 py-2.5 text-xs leading-snug text-ink`}
          >
            <AlertCircle size={15} className="mt-px shrink-0 text-red-600 dark:text-red-400" />
            {error}
          </p>
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </div>
  )
}
