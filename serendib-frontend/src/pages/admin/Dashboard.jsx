/**
 * Admin Dashboard
 * Overview of hotel operations with stats, recent activity, and branch performance
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Users, Bed, DollarSign, Calendar, Activity,
  Building2, AlertCircle, ChevronRight, RefreshCw, BarChart3
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import { StatCard, StatCardGrid } from '../../components/StatCard'
import { EmptyState } from '../../components/EmptyState'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getDashboard()
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (value) => {
    return `LKR ${(value || 0).toLocaleString()}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const overview = dashboardData?.overview || {}
  const revenue = dashboardData?.revenue || {}
  const branches = dashboardData?.branches || []
  const recentActivity = dashboardData?.recent_activity || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Overview of your hotel operations</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchDashboardData}
              className="p-2 bg-primary-500 text-white rounded-xl shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </motion.div>

        {/* Primary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <StatCardGrid>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(revenue.total)}
              subtitle={`This month: ${formatCurrency(revenue.this_month)}`}
              icon={DollarSign}
              color="mint"
              trend={15}
              trendLabel="vs last month"
            />
            <StatCard
              title="Total Bookings"
              value={overview.total_bookings}
              subtitle={`${overview.active_bookings} active`}
              icon={Calendar}
              color="primary"
            />
            <StatCard
              title="Occupancy Rate"
              value={`${overview.occupancy_rate}%`}
              subtitle={`${overview.available_rooms} rooms available`}
              icon={Bed}
              color="lavender"
            />
            <StatCard
              title="Active Users"
              value={overview.total_users}
              subtitle={`${overview.total_guests} guests, ${overview.total_staff} staff`}
              icon={Users}
              color="peach"
            />
          </StatCardGrid>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Pending Bookings', value: overview.pending_bookings, path: '/admin/bookings', color: 'bg-amber-100 text-amber-700' },
            { label: 'Service Requests', value: overview.pending_service_requests, path: '/admin/services', color: 'bg-red-100 text-red-700' },
            { label: 'Total Rooms', value: overview.total_rooms, path: '/admin/rooms', color: 'bg-primary-100 text-primary-700' },
            { label: 'Branches', value: branches.length, path: '/admin/branches', color: 'bg-lavender-100 text-lavender-700' },
          ].map((item, index) => (
            <Link key={index} to={item.path}>
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl p-4 shadow-soft hover:shadow-lg transition-all cursor-pointer"
              >
                <p className={`text-xl sm:text-2xl font-bold ${item.color.split(' ')[1]}`}>
                  {item.value || 0}
                </p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                Branch Performance
              </h2>
              <Link to="/admin/branches" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {branches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No branch data available</p>
            ) : (
              <div className="space-y-4">
                {branches.map((branch, index) => (
                  <motion.div
                    key={branch.branch_id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{branch.name}</p>
                        <p className="text-sm text-gray-500">{branch.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{(branch.occupancy_rate || 0).toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">{branch.total_rooms} rooms</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-soft p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Recent Activity
              </h2>
            </div>

            <div className="space-y-4">
              {/* Recent Bookings */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Recent Bookings</p>
                {(recentActivity.bookings || []).slice(0, 3).map((booking, index) => (
                  <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        Booking #{booking.booking_id}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(booking.booking_date)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-mint-100 text-mint-700' :
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent Payments */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Recent Payments</p>
                {(recentActivity.payments || []).slice(0, 3).map((payment, index) => (
                  <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 bg-mint-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-mint-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/admin/audit-logs">
              <button className="w-full mt-4 btn btn-secondary text-center">
                View All Activity
              </button>
            </Link>
          </motion.div>
        </div>


      </div>
    </div>
  )
}

export default AdminDashboard
