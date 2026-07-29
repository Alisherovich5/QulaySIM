import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'

export default function Layout() {
  const { pathname } = useLocation()
  // Deliberately no horizontal overflow clipping on this wrapper: body already
  // clips, and a second clipping ancestor becomes the scroll container that the
  // sticky header measures itself against — which is what unpinned it.
  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <Navbar />
      <main key={pathname} className="page-in flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
