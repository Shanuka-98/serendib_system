import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, User, LogOut, Calendar, Bed,
  Settings, BarChart3, Users, Building2, FileText,
  CheckCircle, AlertCircle, Award, Search, ChevronDown, 
  LayoutDashboard, Cog, ConciergeBell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

  const isGuest = user?.role === 'guest'
  const isStaff = user?.role === 'staff'
  const isAdmin = user?.role === 'admin'

  const isActive = (path) => location.pathname === path

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Guest Navigation
  const guestNavItems = [
    { path: '/rooms', label: 'Browse Rooms', icon: Search },
    { path: '/service-requests', label: 'Services', icon: ConciergeBell },
    { path: '/my-bookings', label: 'My Bookings', icon: Calendar },
    { path: '/loyalty', label: 'Rewards', icon: Award },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  // Staff Navigation with Categories (like Admin)
  const staffNavCategories = [
    {
      label: 'Operations',
      icon: CheckCircle,
      type: 'dropdown',
      items: [
        { path: '/staff/check-in-out', label: 'Check-in/Out', icon: CheckCircle },
        { path: '/staff/bookings', label: 'All Bookings', icon: Calendar },
        { path: '/staff/room-status', label: 'Room Status', icon: Bed },
      ]
    },
    {
      label: 'Services',
      icon: AlertCircle,
      type: 'dropdown',
      items: [
        { path: '/staff/services', label: 'Requests', icon: AlertCircle },
      ]
    },
  ]

  // Admin Navigation with Categories
  const adminNavCategories = [
    {
      label: 'Management',
      icon: Cog,
      type: 'dropdown',
      items: [
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/rooms', label: 'Rooms', icon: Bed },
        { path: '/admin/branches', label: 'Branches', icon: Building2 },
      ]
    },
    {
      label: 'Reports',
      icon: BarChart3,
      type: 'dropdown',
      items: [
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      ]
    },
  ]

  const getNavItems = () => {
    if (isGuest) return guestNavItems
    return []
  }

  const navItems = getNavItems()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleDropdown = (label) => {
    setActiveDropdown(activeDropdown === label ? null : label)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? (isAdmin ? '/admin' : isStaff ? '/staff' : '/') : '/'} className="flex items-center gap-1">
            <img 
              src="/logo.png" 
              alt="Serendib Hotels" 
              className="h-14 w-14 object-contain"
            />
            <span className="text-xl font-display font-bold text-gray-800 hidden sm:block">
              Serendib Hotels
            </span>
          </Link>

          {/* Desktop Navigation - Admin with Dropdowns (right-aligned) */}
          {isAuthenticated && isAdmin && (
            <div className="hidden md:flex items-center gap-2 ml-auto mr-4" ref={dropdownRef}>
              {adminNavCategories.map((item) => {
                const Icon = item.icon
                
                if (item.type === 'link') {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        isActive(item.path)
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                }

                // Dropdown menu
                const isDropdownActive = item.items?.some(i => isActive(i.path))
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        isDropdownActive || activeDropdown === item.label
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                        >
                          {item.items.map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setActiveDropdown(null)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                                  isActive(subItem.path)
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <SubIcon className="h-4 w-4" />
                                {subItem.label}
                              </Link>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}

          {/* Desktop Navigation - Staff with Dropdowns */}
          {isAuthenticated && isStaff && (
            <div className="hidden md:flex items-center gap-2 ml-auto mr-4" ref={dropdownRef}>
              {staffNavCategories.map((item) => {
                const Icon = item.icon
                const isDropdownActive = item.items?.some(i => isActive(i.path))
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        isDropdownActive || activeDropdown === item.label
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                        >
                          {item.items.map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setActiveDropdown(null)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                                  isActive(subItem.path)
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <SubIcon className="h-4 w-4" />
                                {subItem.label}
                              </Link>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}

          {/* Desktop Navigation - Guest (flat list) */}
          {isAuthenticated && isGuest && navItems.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-lavender-400 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.full_name || user?.email}
                  </span>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50"
                    >
                      <div className="px-4 pb-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                          {user?.role}
                        </span>
                      </div>

                      {isGuest && (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                          <Link
                            to="/my-bookings"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Calendar className="h-4 w-4" />
                            My Bookings
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn btn-secondary"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary hidden sm:block"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Admin Mobile Nav */}
              {isAdmin && adminNavCategories.map((item) => {
                const Icon = item.icon
                if (item.type === 'link') {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                        isActive(item.path)
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                }
                return (
                  <div key={item.label} className="space-y-1">
                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </p>
                    {item.items.map((subItem) => {
                      const SubIcon = subItem.icon
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ml-2 ${
                            isActive(subItem.path)
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <SubIcon className="h-4 w-4" />
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                )
              })}

              {/* Staff Mobile Nav */}
              {isStaff && staffNavCategories.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="space-y-1">
                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </p>
                    {item.items.map((subItem) => {
                      const SubIcon = subItem.icon
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ml-2 ${
                            isActive(subItem.path)
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <SubIcon className="h-4 w-4" />
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                )
              })}

              {/* Guest Mobile Nav */}
              {isGuest && navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                      isActive(item.path)
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar
