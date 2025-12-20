import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Users, CreditCard, Clock,
  CheckCircle, XCircle, AlertCircle, Eye, X
} from 'lucide-react'
import { bookingAPI } from '../../services/api'
import { format, parseISO, isPast, isFuture } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const MyBookingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, past, cancelled

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchBookings()
  }, [user, filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await bookingAPI.getBookings(params)
      
      // API returns: { success: true, data: { bookings: [...], count: ... } }
      const apiResponse = response.data
      const bookingsData = apiResponse?.data?.bookings || apiResponse?.data || []
      
      // Ensure bookings is always an array
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data
      })
      toast.error('Failed to load bookings')
      setBookings([]) // Set to empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId, reason) => {
    if (!reason) {
      reason = prompt('Please provide a cancellation reason:')
      if (!reason) return
    }

    try {
      await bookingAPI.cancelBooking(bookingId, reason)
      toast.success('Booking cancelled successfully')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    }
  }

  const getStatusBadge = (booking) => {
    const status = booking.status
    // Backend returns check_in_date and check_out_date
    const checkInDate = booking.check_in_date || booking.check_in
    const checkOutDate = booking.check_out_date || booking.check_out
    
    if (!checkInDate || !checkOutDate) {
      return <span className="badge badge-warning">Unknown</span>
    }
    
    const checkIn = parseISO(checkInDate)
    const checkOut = parseISO(checkOutDate)
    const now = new Date()

    if (status === 'cancelled') {
      return <span className="badge badge-error">Cancelled</span>
    }
    if (status === 'completed') {
      return <span className="badge badge-success">Completed</span>
    }
    if (status === 'checked_in') {
      return <span className="badge badge-primary">Checked In</span>
    }
    if (isPast(checkIn) && isFuture(checkOut)) {
      return <span className="badge badge-primary">Active</span>
    }
    if (isFuture(checkIn)) {
      return <span className="badge badge-warning">Upcoming</span>
    }
    return <span className="badge badge-success">Completed</span>
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Ensure bookings is always an array before filtering
  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    if (filter === 'all') return true
    
    // Backend returns check_in_date and check_out_date
    const checkInDate = booking.check_in_date || booking.check_in
    const checkOutDate = booking.check_out_date || booking.check_out
    
    if (!checkInDate || !checkOutDate) {
      return filter === 'all' // Only show in 'all' if dates are missing
    }
    
    if (filter === 'upcoming') {
      return isFuture(parseISO(checkInDate)) && booking.status !== 'cancelled'
    }
    if (filter === 'past') {
      return isPast(parseISO(checkOutDate)) || booking.status === 'completed'
    }
    if (filter === 'cancelled') {
      return booking.status === 'cancelled'
    }
    return true
  }) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600">View and manage your hotel reservations</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'upcoming', 'past', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings found`}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn btn-secondary"
              >
                View All Bookings
              </button>
            )}
            {filter === 'all' && (
              <button
                onClick={() => navigate('/rooms')}
                className="btn btn-primary"
              >
                Search Rooms
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.booking_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-display font-bold text-gray-800 mb-1">
                          {booking.room?.room_type?.charAt(0).toUpperCase() + booking.room?.room_type?.slice(1)} Room
                        </h3>
                        <p className="text-gray-600">
                          Booking #{booking.booking_id}
                        </p>
                      </div>
                      {getStatusBadge(booking)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-5 w-5 mr-2 text-primary-500" />
                        <span>{booking.room?.branch?.name || 'Hotel'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-5 w-5 mr-2 text-primary-500" />
                        <span>{(booking.number_of_guests || booking.guests || 1)} Guest{(booking.number_of_guests || booking.guests || 1) > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                        <span>
                          {(() => {
                            const checkInDate = booking.check_in_date || booking.check_in
                            const checkOutDate = booking.check_out_date || booking.check_out
                            if (!checkInDate || !checkOutDate) return 'Date not available'
                            return `${format(parseISO(checkInDate), 'MMM dd')} - ${format(parseISO(checkOutDate), 'MMM dd, yyyy')}`
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-5 w-5 mr-2 text-primary-500" />
                        <span>
                          {(() => {
                            const checkInDate = booking.check_in_date || booking.check_in
                            const checkOutDate = booking.check_out_date || booking.check_out
                            if (!checkInDate || !checkOutDate) return 'N/A'
                            const nights = Math.ceil((parseISO(checkOutDate) - parseISO(checkInDate)) / (1000 * 60 * 60 * 24))
                            return `${nights} night${nights > 1 ? 's' : ''}`
                          })()}
                        </span>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="p-3 bg-gray-50 rounded-xl mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Special Requests:</strong> {booking.special_requests}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="md:w-64 flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {(() => {
                          let amount = booking.total_amount
                          if (!amount) {
                            const checkInDate = booking.check_in_date || booking.check_in
                            const checkOutDate = booking.check_out_date || booking.check_out
                            if (checkInDate && checkOutDate && booking.room?.price_per_night) {
                              const nights = Math.ceil((parseISO(checkOutDate) - parseISO(checkInDate)) / (1000 * 60 * 60 * 24))
                              amount = booking.room.price_per_night * nights
                            } else {
                              amount = 0
                            }
                          }
                          return formatPrice(amount)
                        })()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {booking.payment_status === 'paid' ? (
                          <span className="text-mint-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </span>
                        ) : (
                          <span className="text-warning-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/bookings/${booking.booking_id}`)}
                        className="btn btn-primary w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      {booking.status !== 'cancelled' && 
                       booking.status !== 'completed' &&
                       (() => {
                         const checkInDate = booking.check_in_date || booking.check_in
                         return checkInDate && isFuture(parseISO(checkInDate))
                       })() && (
                        <button
                          onClick={() => handleCancelBooking(booking.booking_id)}
                          className="btn btn-secondary w-full text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookingsPage
