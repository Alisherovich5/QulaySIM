import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
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
