import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { basenameFor, langFromPath } from './lib/seo'
import Layout from './components/Layout'
import StaleNotice from './components/StaleNotice'
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
const V2Home = lazy(() => import('./v2/Home'))
const V2Country = lazy(() => import('./v2/Country'))
const Global = lazy(() => import('./pages/Global'))
const CountryDetail = lazy(() => import('./pages/CountryDetail'))
const RegionDetail = lazy(() => import('./pages/RegionDetail'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Account = lazy(() => import('./pages/Account'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Support = lazy(() => import('./pages/Support'))
const DeviceCheck = lazy(() => import('./pages/DeviceCheck'))
const GuideWhatIsEsim = lazy(() => import('./pages/GuideWhatIsEsim'))
const GuideInstallEsim = lazy(() => import('./pages/GuideInstallEsim'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
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
            {/* Announces a page drawn from the last-good cache. See lib/resilient.ts. */}
            <StaleNotice />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Yangi interfeys -- o'z ramkasi bilan, Layout'siz.
                    Ataylab alohida manzilda: hozirgi sayt bir piksel ham
                    o'zgarmaydi va ikkalasini telefonda navbat bilan ochib
                    solishtirish mumkin. */}
                <Route path="/yangi" element={<V2Home />} />
                <Route path="/yangi/:slug" element={<V2Country />} />

                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/destinations" element={<Destinations />} />
                  {/* Its own address: a customer who does not yet know their whole
                      itinerary is exactly who this is for, and has no country page
                      to arrive on. */}
                  <Route path="/global" element={<Global />} />
                  {/* The static segment outranks :slug in v6 route ranking, so a
                      region page never falls through to the country page. */}
                  <Route path="/destinations/region/:slug" element={<RegionDetail />} />
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
                  <Route path="/oferta" element={<LegalPage doc="oferta" />} />
                  <Route path="/qaytarish" element={<LegalPage doc="refund" />} />
                  <Route path="/maxfiylik" element={<LegalPage doc="privacy" />} />
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
