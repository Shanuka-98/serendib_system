import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Users, Clock,
  CheckCircle, AlertCircle, Eye, X, Waves, Dumbbell, Sparkles, Building2, Building, Trash2
} from 'lucide-react'
import { facilityAPI } from '../../services/api'
import { format, parseISO, isPast, isFuture, isToday } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import EmptyState from '../../components/EmptyState'
import CancelBookingModal from '../../components/modals/CancelBookingModal'

const MyFacilityBookingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, current, past, cancelled
  const [activeCategory, setActiveCategory] = useState('events') // 'events' | 'facilities' | 'all'

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchBookings()
  }, [user, filter, activeCategory])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter === 'cancelled') params.status = 'cancelled'
      
      const response = await facilityAPI.getFacilityBookings(params)
      const data = response.data.data || []
      
      
      // Client-side filtering
      let filtered = data.filter(b => {
        // Category Filter
        let matchesCategory = true
        if (activeCategory === 'events') {
          matchesCategory = ['event_hall', 'meeting_room'].includes(b.facility_type || b.facility?.facility_type)
        } else if (activeCategory === 'facilities') {
          matchesCategory = ['pool', 'gym', 'spa'].includes(b.facility_type || b.facility?.facility_type)
        }
        if (!matchesCategory) return false

        // Status Filter
        if (filter === 'upcoming') {
           return (isFuture(parseISO(b.booking_date)) || isToday(parseISO(b.booking_date))) && b.status !== 'cancelled'
        } else if (filter === 'past') {
           return isPast(parseISO(b.booking_date)) || b.status === 'completed'
        } else if (filter === 'cancelled') {
           return b.status === 'cancelled'
        }
        return true
      })
      
      setBookings(filtered)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load facility bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const openCancelModal = (e, booking) => {
    e.stopPropagation()
    setBookingToCancel(booking)
    setShowCancelModal(true)
  }

  const handleCancel = async (reason) => {
    if (!bookingToCancel) return

    try {
      setIsCancelling(true)
      await facilityAPI.updateFacilityBooking(bookingToCancel.booking_id, { 
        status: 'cancelled',
        cancellation_reason: reason || 'User requested cancellation'
      })
      toast.success('Booking cancelled successfully')
      fetchBookings()
      setShowCancelModal(false)
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusBadge = (booking) => {
    const status = booking.status
    const date = parseISO(booking.booking_date)
    
    if (status === 'cancelled') return <span className="badge badge-error">Cancelled</span>
    if (status === 'completed') return <span className="badge badge-success">Completed</span>
    if (status === 'confirmed') return <span className="badge badge-primary">Confirmed</span>
    if (status === 'pending') return <span className="badge badge-warning">Pending</span>
    if (status === 'inquiry') return <span className="badge badge-info">Inquiry Sent</span>
    if (status === 'quoted') return <span className="badge badge-accent">Quote Received</span>
    
    return <span className="badge badge-ghost">{status}</span>
  }

  const getFacilityIcon = (type) => {
    switch (type) {
      case 'pool': return Waves
      case 'gym': return Dumbbell
      case 'spa': return Sparkles
      case 'event_hall': return Building2
      case 'meeting_room': return Building
      default: return Building2
    }
  }

  const formatPrice = (price) => {
    if (!price) return 'Free'
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Facility Bookings</h1>
          <p className="text-gray-600">Manage your reservations for pools, spas, and events</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
           <button
             onClick={() => setActiveCategory('events')}
             className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
               activeCategory === 'events' 
                 ? 'border-sky-600 text-sky-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             <Building2 className="w-4 h-4" />
             Event Inquiries
           </button>
           <button
             onClick={() => setActiveCategory('facilities')}
             className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
               activeCategory === 'facilities' 
                 ? 'border-sky-600 text-sky-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             <Waves className="w-4 h-4" />
             Facility Reservations
           </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'upcoming', 'past', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No bookings found"
            description="You haven't made any facility bookings yet."
            action={() => navigate('/facilities')}
            actionLabel="Browse Facilities"
          />
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking, index) => {
              const Icon = getFacilityIcon(booking.facility_type || booking.facility?.facility_type)
              
              // Robust check for cancellation eligibility
              let canCancel = false
              if (booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'inquiry') {
                const bookingDate = parseISO(booking.booking_date) // This is local date at 00:00
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                // If booking date is in future, can cancel
                if (bookingDate > today) {
                  canCancel = true
                } 
                // If booking is today, check time
                else if (bookingDate.getTime() === today.getTime() && booking.start_time) {
                  // Compare time
                  const [hours, minutes] = booking.start_time.split(':').map(Number)
                  const now = new Date()
                  const bookingTime = new Date()
                  bookingTime.setHours(hours, minutes, 0, 0)
                  
                  if (bookingTime > now) {
                    canCancel = true
                  }
                }
              }

              return (
                <motion.div
                  key={booking.booking_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/facilities/bookings/${booking.booking_id}`)}
                  className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="p-4 bg-sky-50 rounded-xl h-fit group-hover:bg-sky-100 transition-colors">
                      <Icon className="w-8 h-8 text-sky-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-sky-700 transition-colors">
                            {booking.facility_name || booking.facility?.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                        {getStatusBadge(booking)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-500" />
                          {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-sky-500" />
                          {booking.number_of_guests} Guest{booking.number_of_guests > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-500" />
                          {booking.branch_name || booking.facility?.branch?.name}
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatPrice(booking.total_amount)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-2 min-w-[120px]">
                      {canCancel && (
                        <button
                          onClick={(e) => openCancelModal(e, booking)}
                          className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition-colors z-10 relative flex items-center justify-center gap-2 shadow-sm"
                        >
                           <Trash2 className="w-4 h-4" />
                           Cancel
                        </button>
                      )}
                      {booking.status === 'quoted' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/facilities/bookings/${booking.booking_id}`)
                          }}
                          className="px-4 py-2 bg-sky-500 text-white hover:bg-sky-600 rounded-lg text-sm font-medium transition-colors z-10 relative"
                        >
                          View Quote
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      {/* Cancel Confirmation Modal */}
      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        booking={bookingToCancel}
        isCancelling={isCancelling}
      />
    </div>
  )
}

export default MyFacilityBookingsPage
