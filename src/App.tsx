import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { basenameFor, langFromPath } from './lib/seo'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CurrencyProvider } from './context/CurrencyContext'
import Home from './pages/Home'

/**
 * Only the landing page ships in the entry bundle. Everything else loads on
 * navigation — previously a first-time visitor downloaded the account
 * dashboard, checkout and support pages before seeing the hero.
 */
const Destinations = lazy(() => import('./pages/Destinations'))
const CountryDetail = lazy(() => import('./pages/CountryDetail'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Account = lazy(() => import('./pages/Account'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Support = lazy(() => import('./pages/Support'))
const DeviceCheck = lazy(() => import('./pages/DeviceCheck'))
const GuideWhatIsEsim = lazy(() => import('./pages/GuideWhatIsEsim'))
const GuideInstallEsim = lazy(() => import('./pages/GuideInstallEsim'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/**
 * Deliberately plain: a spinner that appears for the ~100 ms a chunk takes on
 * a warm connection reads as jank. This only holds the page height steady.
 */
function RouteFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" />
}

/**
 * Read once, at module load, and never again.
 *
 * The prefix is part of the address rather than of the application state:
 * switching language is a full navigation to the other edition, which reloads
 * this file. Recomputing it on render would be pointless, and making it
 * reactive would create a window where the router's basename and the address
 * bar disagree — every link on the page would point somewhere wrong.
 */
const ROUTER_BASENAME = basenameFor(
  langFromPath(typeof window === 'undefined' ? '/' : window.location.pathname),
)

export default function App() {
  return (
    // With a basename set, every existing `<Link to="/support">` resolves to
    // `/ru/support` by itself and every `<Route path="/support">` matches with
    // the prefix stripped. That is why adding two more language editions of the
    // whole site touched neither the route table nor a single link.
    <BrowserRouter basename={ROUTER_BASENAME}>
      <CurrencyProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/destinations" element={<Destinations />} />
                  <Route path="/destinations/:slug" element={<CountryDetail />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/device-check" element={<DeviceCheck />} />
                  {/* Uzbek slugs on purpose: the pages exist to catch Uzbek
                      searches, and the URL is part of what matches a query. The
                      ru/en editions live under their language prefix with the
                      same slug, like every other page. */}
                  <Route path="/esim-nima" element={<GuideWhatIsEsim />} />
                  <Route path="/esim-ornatish" element={<GuideInstallEsim />} />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </CurrencyProvider>
    </BrowserRouter>
  )
}
