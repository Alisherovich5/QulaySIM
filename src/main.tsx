import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
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
