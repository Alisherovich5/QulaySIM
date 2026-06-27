import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main key={pathname} className="page-in flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
