import { useEffect, useRef } from 'react'

/** Keyboard navigation, scroll lock and focus restoration for an open modal. */
export function useDialog(onClose: () => void, open = true, returnFocus?: HTMLElement | null) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  }, [onClose])

  useEffect(() => {
    const panel = ref.current
    if (!open || !panel) return
    const previousFocus = returnFocus ?? (document.activeElement as HTMLElement | null)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)
    ;(panel.querySelector<HTMLElement>('[data-dialog-focus]') || focusable()[0] || panel).focus()

    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close.current()
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) {
        event.preventDefault()
        panel.focus()
        return
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === panel)
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    const keepFocus = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node)) (focusable()[0] || panel).focus()
    }
    document.addEventListener('keydown', keydown)
    document.addEventListener('focusin', keepFocus)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('focusin', keepFocus)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open, returnFocus])
  return ref
}
