/**
 * Service Management Page - Staff View
 * View and manage guest service requests
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertCircle, RefreshCw, Filter, CheckCircle, Clock, 
  XCircle, ChevronDown, MessageSquare, User, Bed
} from 'lucide-react'
import { serviceRequestAPI } from '../../services/api'
import { ResponsiveTable, StatusBadge } from '../../components/ResponsiveTable'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'

import { useAuth } from '../../context/AuthContext'

import { useNavigate } from 'react-router-dom'

const ServiceManagementPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allRequests, setAllRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('my_department')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Role to Service Type Mapping
  const getDepartmentServices = (roleType) => {
    const map = {
      housekeeping: ['housekeeping', 'laundry'],
      food_beverage: ['room_service', 'dining'],
      maintenance: ['maintenance'],
      concierge: ['concierge', 'transport', 'pool'],
      spa: ['spa'],
    }
    return map[roleType] || []
  }

  useEffect(() => {
    fetchRequests()
    // Set default filter based on role
    if (user?.role_type === 'manager' || user?.role_type === 'front_desk' || !user?.role_type) {
      setFilter('all')
    } else {
      setFilter('my_department')
    }
  }, [user])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await serviceRequestAPI.getRequests({})
      setAllRequests(response.data.data?.service_requests || [])
    } catch (error) {
      console.error('Error fetching service requests:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter logic
  const getFilteredRequests = () => {
    let filtered = allRequests
    
    // First, filter by department if "my_department" is selected
    // Or if the user is a specialist staff and "all" is NOT selected (optional enforcement)
    // For now, "my_department" allows explicit filtering
    
    if (filter === 'my_department') {
      const allowedServices = getDepartmentServices(user?.role_type)
      if (allowedServices.length > 0) {
        filtered = filtered.filter(r => allowedServices.includes(r.service_type))
      }
    } else if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter)
    }

    return filtered
  }

  const requests = getFilteredRequests()

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      setUpdating(true)
      await serviceRequestAPI.updateRequest(requestId, { status: newStatus })
      await fetchRequests()
      setModalOpen(false)
    } catch (error) {
      console.error('Error updating request:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Status configuration
  const statusConfig = {
    pending: { color: 'warning', icon: Clock, label: 'Pending' },
    in_progress: { color: 'info', icon: AlertCircle, label: 'In Progress' },
    completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'danger', icon: XCircle, label: 'Cancelled' },
  }

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-primary-100 text-primary-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  }

  // Stats - calculated based on role perspective
  const getStats = () => {
    let relevantRequests = allRequests
    const allowedServices = getDepartmentServices(user?.role_type)
    
    // If specialist staff, stats should reflect their department only
    if (allowedServices.length > 0 && user?.role_type !== 'manager' && user?.role_type !== 'front_desk') {
      relevantRequests = allRequests.filter(r => allowedServices.includes(r.service_type))
    }

    return {
      all: relevantRequests.length,
      pending: relevantRequests.filter(r => r.status === 'pending').length,
      in_progress: relevantRequests.filter(r => r.status === 'in_progress').length,
      completed: relevantRequests.filter(r => r.status === 'completed').length,
    }
  }

  const stats = getStats()

  // Table columns
  const columns = [
    {
      key: 'request_id',
      label: 'ID',
      render: (value) => <span className="font-mono text-sm">#{value}</span>,
    },
    {
      key: 'service_type',
      label: 'Type',
      render: (value) => (
        <span className="font-medium text-gray-800 capitalize">
          {value?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'guest_room',
      label: 'Room',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Bed className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${priorityColors[value] || priorityColors.normal}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge 
          status={statusConfig[value]?.label || value} 
          variant={statusConfig[value]?.color || 'default'} 
        />
      ),
    },
    {
      key: 'requested_at',
      label: 'Created',
      render: (value) => <span className="text-sm text-gray-500">{formatDate(value)}</span>,
    },
  ]

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
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-primary-500" />
                Service Requests
              </h1>
              <p className="text-gray-600 mt-1">Manage guest service requests</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Refresh"
              onClick={fetchRequests}
              className="btn btn-primary flex items-center justify-center p-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {[
            { key: 'my_department', label: 'My Department', count: stats.all, color: 'bg-primary-50 text-primary-700', icon: User },
            { key: 'pending', label: 'Pending', count: stats.pending, color: 'bg-amber-50 text-amber-700', icon: Clock },
            { key: 'in_progress', label: 'In Progress', count: stats.in_progress, color: 'bg-blue-50 text-blue-700', icon: AlertCircle },
            { key: 'completed', label: 'Completed', count: stats.completed, color: 'bg-mint-50 text-mint-700', icon: CheckCircle },
          ].map((item) => {
             // Only show 'My Department' if relevant
             if (item.key === 'my_department' && (user?.role_type === 'manager' || user?.role_type === 'front_desk')) {
                item.label = 'All Requests'
             }
             const Icon = item.icon
             return (
              <motion.div
                key={item.key}
                whileHover={{ y: -4 }}
                onClick={() => setFilter(item.key)}
                className={`bg-white rounded-xl p-4 shadow-soft cursor-pointer transition-all border-2 ${
                  filter === item.key ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${item.color.split(' ')[1]}`}>
                    {item.count}
                  </span>
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mt-2">{item.label}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {requests.length === 0 && !loading ? (
            <EmptyState
              icon="alert"
              title="No service requests"
              description={`There are no ${filter !== 'all' ? filter.replace('_', ' ') : ''} service requests at this time.`}
            />
          ) : (
            <ResponsiveTable
              columns={columns}
              data={requests}
              loading={loading}
              sortable={true}
              onRowClick={(row) => navigate(`/staff/services/${row.request_id}`)}
              emptyMessage="No service requests found"
            />
          )}
        </motion.div>


      </div>
    </div>
  )
}

export default ServiceManagementPage
