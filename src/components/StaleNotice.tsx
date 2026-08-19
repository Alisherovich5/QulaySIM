import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudOff, RotateCw } from 'lucide-react'

import { STALE_EVENT } from '../lib/resilient'

/**
 * Says so when the page is showing something older than this moment.
 *
 * The last-good cache in lib/resilient.ts is what keeps a page from emptying on
 * a bad connection, and it works precisely because it will show yesterday's
 * catalogue. Prices are the thing on this site that must never lie quietly, so
 * the fallback announces itself — with the one button that can fix it.
 *
 * One listener at the root rather than a flag threaded through every page: any
 * request that falls back reaches this, including ones added later.
 */
export default function StaleNotice() {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let timer: number | undefined
    const onStale = () => {
      setShown(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setShown(false), 9000)
    }
    window.addEventListener(STALE_EVENT, onStale)
    return () => {
      window.removeEventListener(STALE_EVENT, onStale)
      window.clearTimeout(timer)
    }
  }, [])

  if (!shown) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+68px)] z-[70] flex justify-center px-3 sm:bottom-5"
    >
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink/92 px-3.5 py-2 text-white shadow-lg backdrop-blur-sm motion-safe:animate-[fs-rise_0.3s_ease-out_backwards]">
        <CloudOff size={15} aria-hidden className="shrink-0 opacity-80" />
        <span className="text-[12.5px] font-600 leading-tight">{t('common.staleData')}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="focus-ring-invert flex min-h-8 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[12px] font-700 hover:bg-white/25"
        >
          <RotateCw size={13} /> {t('common.retry')}
        </button>
      </div>
    </div>
  )
}
