import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'

const Layout = ({ children }) => {
  const location = useLocation()
  
  // Don't show navbar on auth pages
  const hideNavbar = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)
  
  // Show footer only on guest-facing pages (not auth, admin, or staff pages)
  const showFooter = !hideNavbar && 
    !location.pathname.startsWith('/admin') && 
    !location.pathname.startsWith('/staff')

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}

export default Layout


