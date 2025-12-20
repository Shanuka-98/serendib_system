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

const ServiceManagementPage = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await serviceRequestAPI.getRequests(params)
      setRequests(response.data.data?.service_requests || [])
    } catch (error) {
      console.error('Error fetching service requests:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Stats
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

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
      key: 'booking',
      label: 'Room',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Bed className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value?.room?.room_number || 'N/A'}</span>
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
      key: 'created_at',
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
            { key: 'all', label: 'All Requests', count: requests.length, color: 'bg-gray-100 text-gray-700' },
            { key: 'pending', label: 'Pending', count: stats.pending, color: 'bg-amber-100 text-amber-700' },
            { key: 'in_progress', label: 'In Progress', count: stats.in_progress, color: 'bg-primary-100 text-primary-700' },
            { key: 'completed', label: 'Completed', count: stats.completed, color: 'bg-mint-100 text-mint-700' },
          ].map((item) => (
            <motion.div
              key={item.key}
              whileHover={{ y: -4 }}
              onClick={() => setFilter(item.key)}
              className={`bg-white rounded-xl p-4 shadow-soft cursor-pointer transition-all ${
                filter === item.key ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xl font-bold ${item.color.split(' ')[1]}`}>
                  {item.count}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.label}</p>
            </motion.div>
          ))}
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
              onRowClick={(row) => { setSelectedRequest(row); setModalOpen(true) }}
              emptyMessage="No service requests found"
            />
          )}
        </motion.div>

        {/* Request Detail Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Service Request #${selectedRequest?.request_id}`}
          size="lg"
        >
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Service Type:</span>
                    <span className="ml-2 font-medium text-gray-800 capitalize">
                      {selectedRequest.service_type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Room:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {selectedRequest.booking?.room?.room_number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColors[selectedRequest.priority]}`}>
                      {selectedRequest.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2">
                      <StatusBadge 
                        status={statusConfig[selectedRequest.status]?.label} 
                        variant={statusConfig[selectedRequest.status]?.color} 
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Description
                </h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">
                  {selectedRequest.description || 'No description provided.'}
                </p>
              </div>

              {/* Guest Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Guest Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl text-sm">
                  <p className="font-medium text-gray-800">
                    {selectedRequest.booking?.user?.full_name || 'N/A'}
                  </p>
                  <p className="text-gray-500">
                    {selectedRequest.booking?.user?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Update Status */}
              {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Update Status</h4>
                  <div className="flex gap-2">
                    {selectedRequest.status === 'pending' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStatusUpdate(selectedRequest.request_id, 'in_progress')}
                        disabled={updating}
                        className="flex-1 btn bg-primary-500 text-white hover:bg-primary-600"
                      >
                        Start Working
                      </motion.button>
                    )}
                    {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStatusUpdate(selectedRequest.request_id, 'completed')}
                        disabled={updating}
                        className="flex-1 btn bg-mint-500 text-white hover:bg-mint-600"
                      >
                        Mark Complete
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default ServiceManagementPage
