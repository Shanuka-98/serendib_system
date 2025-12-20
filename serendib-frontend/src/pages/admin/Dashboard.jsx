import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Bed, DollarSign, Calendar, Activity } from 'lucide-react'
import { adminAPI, analyticsAPI } from '../../services/api'

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

  const statCards = [
    {
      title: 'Total Revenue',
      value: dashboardData?.revenue?.total || 0,
      icon: DollarSign,
      color: 'from-mint-400 to-mint-600',
      format: (val) => `LKR ${val.toLocaleString()}`
    },
    {
      title: 'Total Bookings',
      value: dashboardData?.bookings?.total || 0,
      icon: Calendar,
      color: 'from-primary-400 to-primary-600',
      format: (val) => val.toLocaleString()
    },
    {
      title: 'Occupancy Rate',
      value: dashboardData?.occupancy?.rate || 0,
      icon: Bed,
      color: 'from-lavender-400 to-lavender-600',
      format: (val) => `${val}%`
    },
    {
      title: 'Active Users',
      value: dashboardData?.users?.active || 0,
      icon: Users,
      color: 'from-peach-400 to-peach-600',
      format: (val) => val.toLocaleString()
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Overview of your hotel operations</p>
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
                className={`glass rounded-2xl p-6 bg-gradient-to-br ${stat.color} text-white`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 text-white/80" />
                </div>
                <p className="text-white/80 text-sm mb-1">{stat.title}</p>
                <p className="text-4xl font-bold">{stat.format(stat.value)}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
              Recent Activity
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : Array.isArray(dashboardData?.recent_activity) && dashboardData.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recent_activity.slice(0, 5).map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Activity className="h-5 w-5 text-primary-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.action || 'Activity'}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Today's Revenue</span>
                <span className="font-bold text-gray-800">
                  LKR {dashboardData?.revenue?.today?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Pending Bookings</span>
                <span className="font-bold text-gray-800">
                  {dashboardData?.bookings?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Available Rooms</span>
                <span className="font-bold text-gray-800">
                  {dashboardData?.rooms?.available || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
