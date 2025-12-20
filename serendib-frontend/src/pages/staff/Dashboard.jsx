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
    activeBookings: 0
  })
  const [todayBookings, setTodayBookings] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch today's bookings
      const bookingsResponse = await bookingAPI.getUpcoming(1)
      const bookings = bookingsResponse.data.data?.bookings || []
      
      // Filter today's check-ins and check-outs
      const today = format(new Date(), 'yyyy-MM-dd')
      const checkIns = bookings.filter(b => format(new Date(b.check_in), 'yyyy-MM-dd') === today)
      const checkOuts = bookings.filter(b => format(new Date(b.check_out), 'yyyy-MM-dd') === today)
      
      // Fetch service requests
      const requestsResponse = await serviceRequestAPI.getRequests({ status: 'pending' })
      const requests = requestsResponse.data.data || []

      setStats({
        todayCheckIns: checkIns.length,
        todayCheckOuts: checkOuts.length,
        pendingRequests: requests.length,
        activeBookings: bookings.filter(b => b.status === 'checked_in').length
      })
      
      setTodayBookings([...checkIns, ...checkOuts].slice(0, 5))
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
      title: 'Active Bookings',
      value: stats.activeBookings,
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
              <p className="text-gray-500 text-center py-8">No bookings scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div key={booking.booking_id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">
                        {booking.room?.room_number}
                      </span>
                      <span className={`badge ${
                        format(new Date(booking.check_in), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'badge-primary' : 'badge-warning'
                      }`}>
                        {format(new Date(booking.check_in), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'Check-in' : 'Check-out'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {booking.user?.full_name} • {booking.guests} guests
                    </p>
                  </div>
                ))}
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
      </div>
    </div>
  )
}

export default StaffDashboard
