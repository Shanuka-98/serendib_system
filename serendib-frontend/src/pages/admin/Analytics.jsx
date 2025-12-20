import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, DollarSign, Bed, Users, Calendar, Building2, Filter
} from 'lucide-react'
import { analyticsAPI, adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#a855f7', '#ec4899']

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('revenue')
  const [period, setPeriod] = useState('month')
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    revenue: null,
    occupancy: null,
    bookingTrends: null,
    customerInsights: null
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [activeTab, period, branchId])

  const fetchBranches = async () => {
    try {
      const response = await adminAPI.getBranches()
      setBranches(response.data.data?.branches || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = {
        period,
        ...(branchId && { branch_id: parseInt(branchId) })
      }

      console.log('Fetching analytics with params:', params)

      const [revenueRes, occupancyRes, trendsRes, insightsRes] = await Promise.all([
        analyticsAPI.getRevenue(params).catch(err => {
          console.error('Revenue API error:', err)
          throw err
        }),
        analyticsAPI.getOccupancy({ ...params, date_from: getDateFrom(period), date_to: format(new Date(), 'yyyy-MM-dd') }).catch(err => {
          console.error('Occupancy API error:', err)
          throw err
        }),
        analyticsAPI.getBookingTrends(params).catch(err => {
          console.error('Booking trends API error:', err)
          throw err
        }),
        analyticsAPI.getCustomerInsights(params).catch(err => {
          console.error('Customer insights API error:', err)
          throw err
        })
      ])

      setData({
        revenue: revenueRes.data.data,
        occupancy: occupancyRes.data.data,
        bookingTrends: trendsRes.data.data,
        customerInsights: insightsRes.data.data
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      })
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000')
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to load analytics')
      }
    } finally {
      setLoading(false)
    }
  }

  const getDateFrom = (period) => {
    const today = new Date()
    if (period === 'week') {
      return format(new Date(today.setDate(today.getDate() - 7)), 'yyyy-MM-dd')
    } else if (period === 'quarter') {
      return format(new Date(today.setDate(today.getDate() - 90)), 'yyyy-MM-dd')
    } else if (period === 'year') {
      return format(new Date(today.setDate(today.getDate() - 365)), 'yyyy-MM-dd')
    }
    return format(new Date(today.setDate(today.getDate() - 30)), 'yyyy-MM-dd')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights into your hotel operations</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="input"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAnalytics}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'occupancy', label: 'Occupancy', icon: Bed },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'customers', label: 'Customers', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="inline h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Revenue Tab */}
        {activeTab === 'revenue' && data.revenue && (
          <RevenueAnalytics data={data.revenue} formatCurrency={formatCurrency} />
        )}

        {/* Occupancy Tab */}
        {activeTab === 'occupancy' && data.occupancy && (
          <OccupancyAnalytics data={data.occupancy} />
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && data.bookingTrends && (
          <BookingTrendsAnalytics data={data.bookingTrends} formatCurrency={formatCurrency} />
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && data.customerInsights && (
          <CustomerInsightsAnalytics data={data.customerInsights} formatCurrency={formatCurrency} />
        )}
      </div>
    </div>
  )
}

// Revenue Analytics Component
const RevenueAnalytics = ({ data, formatCurrency }) => {
  const summary = data.summary || {}
  const dailyRevenue = data.daily_revenue || []
  const revenueByBranch = data.revenue_by_branch || []
  const paymentMethods = data.payment_methods || []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <DollarSign className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.total_revenue || 0)}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Transactions</span>
            <TrendingUp className="h-5 w-5 text-mint-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{summary.total_transactions || 0}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Daily</span>
            <Calendar className="h-5 w-5 text-peach-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.avg_daily_revenue || 0)}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Transaction</span>
            <DollarSign className="h-5 w-5 text-lavender-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.avg_transaction_value || 0)}</p>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Daily Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Branch */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Revenue by Branch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByBranch}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#0ea5e9" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Occupancy Analytics Component
const OccupancyAnalytics = ({ data }) => {
  const current = data.current || {}
  const dailyOccupancy = data.daily_occupancy || []
  const branchOccupancy = data.branch_occupancy || []
  const roomTypeOccupancy = data.room_type_occupancy || []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Rooms</span>
            <Bed className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{current.total_rooms || 0}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Occupied</span>
            <Bed className="h-5 w-5 text-peach-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{current.occupied_rooms || 0}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Available</span>
            <Bed className="h-5 w-5 text-mint-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{current.available_rooms || 0}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Occupancy Rate</span>
            <TrendingUp className="h-5 w-5 text-lavender-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{current.occupancy_rate?.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* Daily Occupancy Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Daily Occupancy Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyOccupancy}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bookings" stroke="#0ea5e9" strokeWidth={2} name="Bookings" />
            <Line type="monotone" dataKey="occupancy_rate" stroke="#f97316" strokeWidth={2} name="Occupancy %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Occupancy by Branch */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Occupancy by Branch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchOccupancy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupancy_rate" fill="#0ea5e9" name="Occupancy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy by Room Type */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Occupancy by Room Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roomTypeOccupancy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="room_type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupancy_rate" fill="#10b981" name="Occupancy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Booking Trends Analytics Component
const BookingTrendsAnalytics = ({ data, formatCurrency }) => {
  const monthlyTrends = data.monthly_trends || []
  const insights = data.insights || {}
  const bookingsByStatus = data.bookings_by_status || {}

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Booking Value</span>
            <DollarSign className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(insights.avg_booking_value || 0)}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Lead Time</span>
            <Calendar className="h-5 w-5 text-mint-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{insights.avg_lead_time_days || 0} days</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Stay Length</span>
            <Bed className="h-5 w-5 text-peach-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{insights.avg_stay_length_days || 0} days</p>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Monthly Booking Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="bookings" fill="#0ea5e9" name="Bookings" />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bookings by Status */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Bookings by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={Object.entries(bookingsByStatus).map(([status, count]) => ({ status, count }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {Object.entries(bookingsByStatus).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Customer Insights Analytics Component
const CustomerInsightsAnalytics = ({ data, formatCurrency }) => {
  const topCustomers = data.top_customers || []
  const customerStats = data.customer_stats || {}

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Guests</span>
            <Users className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{customerStats.total_guests || 0}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Guests</span>
            <Users className="h-5 w-5 text-mint-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{customerStats.active_guests || 0}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Loyalty Members</span>
            <Users className="h-5 w-5 text-lavender-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {customerStats.loyalty_distribution?.total || 0}
          </p>
        </div>
      </div>

      {/* Top Customers */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-gray-800 mb-4">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={customer.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.total_bookings}</td>
                  <td className="px-6 py-4 font-semibold text-primary-600">
                    {formatCurrency(customer.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
