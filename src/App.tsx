import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CurrencyProvider } from './context/CurrencyContext'
import Home from './pages/Home'
import Destinations from './pages/Destinations'
import CountryDetail from './pages/CountryDetail'
import Checkout from './pages/Checkout'
import Account from './pages/Account'
import Login from './pages/Login'
import Register from './pages/Register'
import Support from './pages/Support'
import NotFound from './pages/NotFound'
import HeroOptions from './pages/HeroOptions'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/destinations/:slug" element={<CountryDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/support" element={<Support />} />
              <Route path="/hero-options" element={<HeroOptions />} />
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
          </CartProvider>
        </AuthProvider>
      </CurrencyProvider>
    </BrowserRouter>
  )
}
