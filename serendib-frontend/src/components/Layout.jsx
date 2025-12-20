import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  const location = useLocation()
  
  // Don't show navbar on auth pages
  const hideNavbar = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <main>{children}</main>
    </div>
  )
}

export default Layout

