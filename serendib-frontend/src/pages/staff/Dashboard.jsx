import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Users, Clock, AlertCircle, CheckCircle, TrendingUp, Bed, RefreshCw } from 'lucide-react'
import { bookingAPI, serviceRequestAPI } from '../../services/api'
import { format } from 'date-fns'

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    pendingRequests: 0,
    upcomingBookings: 0
  })
  const [todayBookings, setTodayBookings] = useState([])
  const [upcomingBookingsList, setUpcomingBookingsList] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch upcoming bookings (7 days lookahead for better visibility)
      const bookingsResponse = await bookingAPI.getUpcoming(7)
      const bookings = bookingsResponse.data.data?.bookings || []
      
      // Filter today's check-ins and check-outs
      const today = format(new Date(), 'yyyy-MM-dd')
      const checkIns = bookings.filter(b => {
        const checkInDate = b.check_in_date || b.check_in
        return checkInDate && format(new Date(checkInDate), 'yyyy-MM-dd') === today
      })
      const checkOuts = bookings.filter(b => {
        const checkOutDate = b.check_out_date || b.check_out
        return checkOutDate && format(new Date(checkOutDate), 'yyyy-MM-dd') === today
      })
      
      // Fetch service requests
      const requestsResponse = await serviceRequestAPI.getRequests({ status: 'pending' })
      const requestsData = requestsResponse.data.data
      const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.requests || [])

      // Count upcoming bookings (confirmed bookings in the next 7 days)
      const upcomingBookings = bookings.filter(b => 
        b.status === 'confirmed' || b.status === 'pending' || b.status === 'checked_in'
      )

      setStats({
        todayCheckIns: checkIns.length,
        todayCheckOuts: checkOuts.length,
        pendingRequests: requests.length,
        upcomingBookings: upcomingBookings.length
      })
      
      // Set today's schedule
      setTodayBookings([...checkIns, ...checkOuts].slice(0, 5))
      // Set upcoming bookings (exclude today's)
      const futureBookings = upcomingBookings.filter(b => {
        const checkInDate = b.check_in_date || b.check_in
        return checkInDate && format(new Date(checkInDate), 'yyyy-MM-dd') !== today
      })
      setUpcomingBookingsList(futureBookings.slice(0, 5))
      setPendingRequests(requests.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Today\'s Check-ins',
      value: stats.todayCheckIns,
      icon: CheckCircle,
      color: 'primary',
      bg: 'from-primary-400 to-primary-600'
    },
    {
      title: 'Today\'s Check-outs',
      value: stats.todayCheckOuts,
      icon: Clock,
      color: 'peach',
      bg: 'from-peach-400 to-peach-600'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: AlertCircle,
      color: 'lavender',
      bg: 'from-lavender-400 to-lavender-600'
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings,
      icon: TrendingUp,
      color: 'mint',
      bg: 'from-mint-400 to-mint-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Staff Dashboard
            </h1>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Refresh Data"
            onClick={fetchDashboardData}
            className="btn btn-white flex items-center justify-center p-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass rounded-2xl p-6 bg-gradient-to-br ${stat.bg} text-white`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8" />
                </div>
                <p className="text-white/80 text-sm mb-1">{stat.title}</p>
                <p className="text-4xl font-bold">{stat.value}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-display font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
            to="/staff/check-in-out"
            className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Check-In / Out</h3>
            </div>
            <p className="text-sm text-gray-600">Process guest arrivals and departures</p>
          </Link>

          <Link
            to="/staff/room-status"
            className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-mint-100 rounded-xl group-hover:scale-110 transition-transform">
                <Bed className="h-6 w-6 text-mint-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Room Status</h3>
            </div>
            <p className="text-sm text-gray-600">Update room availability and status</p>
          </Link>

          <Link
            to="/staff/services"
            className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-lavender-100 rounded-xl group-hover:scale-110 transition-transform">
                <AlertCircle className="h-6 w-6 text-lavender-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Service Requests</h3>
            </div>
            <p className="text-sm text-gray-600">Manage guest requests and tasks</p>
          </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-primary-500" />
              Today's Schedule
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : todayBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings scheduled</p>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((booking) => {
                  const checkInDate = booking.check_in_date || booking.check_in
                  const isCheckIn = checkInDate && format(new Date(checkInDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  return (
                    <div key={booking.booking_id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">
                          {booking.room?.room_number}
                        </span>
                        <span className={`badge ${isCheckIn ? 'badge-primary' : 'badge-warning'}`}>
                          {isCheckIn ? 'Check-in' : 'Check-out'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {booking.user?.full_name || booking.guest_name} • {booking.number_of_guests || booking.guests || 1} guests
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Pending Service Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4 flex items-center">
              <AlertCircle className="h-6 w-6 mr-2 text-lavender-500" />
              Pending Requests
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending service requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.request_id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800 capitalize">
                        {request.service_type?.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-${request.priority === 'urgent' ? 'error' : 'warning'}`}>
                        {request.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Room {request.booking?.room?.room_number}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Upcoming Bookings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6 mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold text-gray-800 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-mint-500" />
              Upcoming Bookings
            </h2>
            <Link to="/staff/bookings" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : upcomingBookingsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming bookings in the next 7 days</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBookingsList.map((booking) => {
                const checkInDate = booking.check_in_date || booking.check_in
                const checkOutDate = booking.check_out_date || booking.check_out
                return (
                  <Link
                    key={booking.booking_id}
                    to={`/staff/bookings/${booking.booking_id}`}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">
                        Room {booking.room?.room_number || 'N/A'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {booking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {booking.user?.full_name || booking.guest_name || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {checkInDate ? format(new Date(checkInDate), 'MMM dd') : ''} - {checkOutDate ? format(new Date(checkOutDate), 'MMM dd') : ''}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default StaffDashboard
