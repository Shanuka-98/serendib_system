import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Filter, Bed } from 'lucide-react'
import { serviceRequestAPI, bookingAPI, serviceAPI } from '../../services/api'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { formatBookingRef } from '../../utils/helpers'

const ServiceRequestsPage = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [bookings, setBookings] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    booking_id: '',
    service_type: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch data in parallel
      const [requestsRes, bookingsRes, servicesRes] = await Promise.all([
        serviceRequestAPI.getRequests(),
        bookingAPI.getBookings(),
        serviceAPI.getServices()
      ])

      // Handle Requests
      const requestsData = requestsRes.data?.data?.service_requests || requestsRes.data?.data || []
      setRequests(Array.isArray(requestsData) ? requestsData : [])

      // Handle Bookings
      const allBookings = bookingsRes.data?.data?.bookings || []
      const bookingsData = allBookings.filter(b => ['confirmed', 'checked_in'].includes(b.status))
      setBookings(bookingsData)

      // Handle Services
      const servicesData = servicesRes.data?.data?.services || []
      setServiceTypes(servicesData)
      
      // Set defaults
      if (bookingsData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          booking_id: bookingsData[0].booking_id,
          service_type: servicesData.length > 0 ? servicesData[0].code : ''
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load service data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.booking_id) {
      toast.error('Please select a valid booking/room')
      return
    }

    try {
      await serviceRequestAPI.createRequest(formData)
      toast.success('Service request submitted successfully')
      setShowForm(false)
      setFormData({ 
        booking_id: bookings.length > 0 ? bookings[0].booking_id : '',
        service_type: serviceTypes.length > 0 ? serviceTypes[0].code : '', 
        description: '', 
        priority: 'medium' 
      })
      fetchData() // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request')
    }
  }

  // Helper to find selected service details
  const selectedService = serviceTypes.find(s => s.code === formData.service_type)

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
            onClick={() => {
              if (bookings.length === 0) {
                toast.info('You need an active booking to make requests')
                return
              }
              setShowForm(!showForm)
            }}
            className="btn btn-primary"
            disabled={bookings.length === 0}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </button>
        </div>

        {/* No Bookings Warning */}
        {bookings.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">No Active Bookings</p>
              <p className="text-sm text-amber-700">
                You must have a confirmed or checked-in booking to request services.
              </p>
            </div>
          </div>
        )}

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
                  Select Room / Booking
                </label>
                <div className="relative">
                  <select
                    value={formData.booking_id}
                    onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                    className="input pl-10"
                    required
                  >
                    {bookings.map(booking => (
                      <option key={booking.booking_id} value={booking.booking_id}>
                        Room {booking.room?.room_number} • {formatBookingRef(booking.booking_id)} • {booking.branch?.name}
                      </option>
                    ))}
                  </select>
                  <Bed className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

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
                  <option value="" disabled>Select a service...</option>
                  {serviceTypes.map(service => (
                    <option key={service.id} value={service.code}>
                      {service.name} • {service.is_chargeable 
                        ? `LKR ${service.base_price?.toLocaleString()}` 
                        : 'Complimentary'}
                    </option>
                  ))}
                </select>
                {selectedService?.is_chargeable && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Warning: LKR {selectedService.base_price?.toLocaleString()} will be added to your room bill.
                  </p>
                )}
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
