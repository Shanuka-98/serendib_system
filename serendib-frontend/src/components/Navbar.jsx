import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hotel, Menu, X, User, LogOut, Calendar, Bed,
  Settings, BarChart3, Users, Building2, FileText,
  CheckCircle, AlertCircle, Award, Bell, Search
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isStaff, isGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setUserMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Guest Navigation
  const guestNavItems = [
    { path: '/rooms', label: 'Search Rooms', icon: Search },
    { path: '/my-bookings', label: 'My Bookings', icon: Calendar },
    { path: '/service-requests', label: 'Services', icon: AlertCircle },
    { path: '/loyalty', label: 'Loyalty', icon: Award },
  ]

  // Staff Navigation
  const staffNavItems = [
    { path: '/staff', label: 'Dashboard', icon: BarChart3 },
    { path: '/staff/checkin', label: 'Check-in/Out', icon: CheckCircle },
    { path: '/staff/services', label: 'Services', icon: AlertCircle },
    { path: '/staff/rooms', label: 'Room Status', icon: Bed },
  ]

  // Admin Navigation
  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/rooms', label: 'Rooms', icon: Bed },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/branches', label: 'Branches', icon: Building2 },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ]

  const getNavItems = () => {
    if (isAdmin) return adminNavItems
    if (isStaff) return staffNavItems
    if (isGuest) return guestNavItems
    return []
  }

  const navItems = getNavItems()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? (isAdmin ? '/admin' : isStaff ? '/staff' : '/rooms') : '/'} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-lavender-500 rounded-xl flex items-center justify-center shadow-lg">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-gray-800 hidden sm:block">
              Serendib Hotels
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && navItems.length > 0 && (
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
            {/* Notifications (if authenticated) */}
            {isAuthenticated && (
              <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

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
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-lg overflow-hidden"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-200 mb-2">
                          <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          <span className="inline-block mt-1 text-xs badge badge-primary capitalize">
                            {user?.role}
                          </span>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        {isGuest && (
                          <Link
                            to="/my-bookings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Calendar className="h-4 w-4" />
                            My Bookings
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Settings className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                        {isStaff && !isAdmin && (
                          <Link
                            to="/staff"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Settings className="h-4 w-4" />
                            Staff Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all mt-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
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
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false)
            setMobileMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}

export default Navbar

