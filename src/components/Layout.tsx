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
    <div
      className="site-shell flex min-h-screen min-w-0 flex-col"
      data-page={pathname === '/' ? 'home' : pathname.split('/')[1]}
    >
      <Navbar />
      {/* No bottom padding for the fixed mobile nav here: the footer sits
          below this and already reserves that space, so reserving it twice
          left 68px of dead air above the footer. */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content" key={pathname} className="page-in flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
