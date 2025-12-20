import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react'
import { serviceRequestAPI } from '../../services/api'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const ServiceRequestsPage = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    service_type: 'room_service',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await serviceRequestAPI.getRequests()
      
      // API returns: { success: true, data: { service_requests: [...], count: ... } }
      const apiResponse = response.data
      const requestsData = apiResponse?.data?.service_requests || apiResponse?.data || []
      
      // Ensure requests is always an array
      setRequests(Array.isArray(requestsData) ? requestsData : [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data
      })
      toast.error('Failed to load service requests')
      setRequests([]) // Set to empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await serviceRequestAPI.createRequest(formData)
      toast.success('Service request submitted successfully')
      setShowForm(false)
      setFormData({ service_type: 'room_service', description: '', priority: 'medium' })
      fetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'badge-warning', text: 'Pending' },
      in_progress: { icon: AlertCircle, color: 'badge-primary', text: 'In Progress' },
      completed: { icon: CheckCircle, color: 'badge-success', text: 'Completed' },
      cancelled: { icon: XCircle, color: 'badge-error', text: 'Cancelled' }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`badge ${badge.color} flex items-center`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Service Requests
            </h1>
            <p className="text-gray-600">Request hotel services and assistance</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </button>
        </div>

        {/* Request Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-6"
          >
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
              Submit Service Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="room_service">Room Service</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="concierge">Concierge</option>
                  <option value="laundry">Laundry</option>
                  <option value="spa">Spa</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={4}
                  required
                  placeholder="Describe your service request..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : !Array.isArray(requests) || requests.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">
              No service requests
            </h3>
            <p className="text-gray-600 mb-6">
              Submit a request to get assistance from our staff
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Create Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(requests) && requests.map((request, index) => (
              <motion.div
                key={request.request_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-display font-bold text-gray-800 mb-1">
                      {request.service_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Request #{request.request_id} • {format(new Date(request.requested_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-gray-600 mb-4">{request.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="badge badge-secondary">
                    Priority: {request.priority}
                  </span>
                  {request.assigned_staff && (
                    <span>Assigned to: {request.assigned_staff.full_name}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceRequestsPage
