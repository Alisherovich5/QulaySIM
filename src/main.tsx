import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './design/journey.css'
import './design/navigation.css'
import './design/photo-media.css'
/* Last: it is the layer that decides what colour the site is. */
import './design/travel-palette.css'
// Last: the device-check page's exact numbers, which nothing else may outrank.
import './design/device-check.css'
import './design/footer.css'
import './design/destinations.css'
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Field measurement, after the app is on screen: every performance target in
// the plan is a p75 of real visits, and only the visitor's browser can report
// that. Started last and dynamically, so it cannot delay what it measures.
void import('./lib/vitals').then(({ startVitals }) => startVitals())

// Crashes the error boundaries never see — a listener, not a 30 KB SDK. See
// lib/report-error.ts for why.
void import('./lib/report-error').then(({ installErrorReporting }) => installErrorReporting())

/**
 * The offline copy, registered last of all.
 *
 * Only in a real deployment: the prerender pass and the browser tests both run
 * against localhost, and a worker caching those would make both of them depend
 * on which run came before. See public/sw.js for what it does and does not
 * touch — auth, checkout and account are never cached.
 */
if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  !['localhost', '127.0.0.1'].includes(location.hostname)
) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // A denied registration (private mode, unsupported webview) costs the
      // offline copy and nothing else — every belt above still applies.
    })
  })
}
