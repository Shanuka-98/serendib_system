import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MapPin, Users, CreditCard, Clock,
  CheckCircle, XCircle, Download, ArrowLeft,
  Bed, Wifi, Car, Coffee, Phone, Mail, AlertTriangle, Gift
} from 'lucide-react'
import { bookingAPI } from '../../services/api'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { formatBookingRef } from '../../utils/helpers'
import CancelBookingModal from '../../components/modals/CancelBookingModal'

const BookingDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchBookingDetails()
  }, [id, user])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getBooking(id)
      
      // API returns: { success: true, data: { booking: {...} } } or { success: true, data: {...} }
      const apiResponse = response.data
      const bookingData = apiResponse?.data?.booking || apiResponse?.data
      
      if (!bookingData) {
        toast.error('Booking not found')
        navigate('/bookings')
        return
      }
      
      setBooking(bookingData)
    } catch (error) {
      console.error('Error fetching booking:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.error(error.response?.data?.message || 'Failed to load booking details')
      navigate('/bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (reason = cancelReason) => {
    if (!reason?.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    try {
      setCancelling(true)
      await bookingAPI.cancelBooking(id, reason)
      toast.success('Booking cancelled successfully')
      setShowCancelModal(false)
      setCancelReason('')
      fetchBookingDetails()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Booking not found</h2>
          <button onClick={() => navigate('/my-bookings')} className="btn btn-primary mt-4">
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }

  // Backend returns check_in_date and check_out_date
  const checkInDate = booking.check_in_date || booking.check_in
  const checkOutDate = booking.check_out_date || booking.check_out
  
  if (!checkInDate || !checkOutDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Invalid booking data</h2>
          <p className="text-gray-600 mb-4">Booking dates are missing</p>
          <button onClick={() => navigate('/my-bookings')} className="btn btn-primary">
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }
  
  const nights = differenceInDays(parseISO(checkOutDate), parseISO(checkInDate))
  
  // Check if cancellation is allowed (24+ hours before check-in)
  const hoursUntilCheckIn = (new Date(checkInDate) - new Date()) / (1000 * 60 * 60)
  const canCancel = booking.status !== 'cancelled' && 
                    booking.status !== 'completed' &&
                    booking.status !== 'checked_in' &&
                    booking.status !== 'checked_out' &&
                    hoursUntilCheckIn >= 24

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 print:hidden"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Bookings
        </button>

        {/* Print Only Header */}
        <div className="hidden print:block mb-8 text-center border-b pb-6">
           <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Serendib Hotels</h1>
           <p className="text-gray-600">Official Booking Receipt</p>
           <p className="text-sm text-gray-500 mt-1">Generated on {format(new Date(), 'MMM dd, yyyy')}</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Booking Details
            </h1>
            <p className="text-gray-600">{formatBookingRef(booking.booking_id)}</p>
          </div>
          <div>
            {booking.status === 'cancelled' && (
              <span className="badge badge-error">Cancelled</span>
            )}
            {booking.status === 'completed' && (
              <span className="badge badge-success">Completed</span>
            )}
            {booking.status === 'checked_in' && (
              <span className="badge badge-primary">Checked In</span>
            )}
            {booking.status === 'confirmed' && checkInDate && new Date(checkInDate) > new Date() && (
              <span className="badge badge-warning">Upcoming</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 print:mb-8">
            {/* Room Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Room Information
              </h2>
              
              <div className="flex gap-4 mb-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-primary-200 to-lavender-200 flex-shrink-0">
                  {booking.room?.image_urls?.[0] ? (
                    <img
                      src={booking.room.image_urls[0]}
                      alt={booking.room.room_number}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-8 w-8 text-primary-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-gray-800 mb-2">
                    {booking.room?.room_type?.charAt(0).toUpperCase() + booking.room?.room_type?.slice(1)} Room
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Room {booking.room?.room_number} • Floor {booking.room?.floor}
                  </p>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {booking.room?.branch_name || booking.branch?.name || 'Hotel'}
                  </div>
                </div>
              </div>

              {booking.room?.amenities && booking.room.amenities.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {booking.room.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-700"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Booking Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Booking Dates
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {format(parseISO(checkInDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">After 2:00 PM</p>
                </div>
                <div className="p-4 bg-peach-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {format(parseISO(checkOutDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">Before 11:00 AM</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-800">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-semibold text-gray-800">
                    {(booking.number_of_guests || booking.guests || 1)} Guest{(booking.number_of_guests || booking.guests || 1) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Special Requests */}
            {booking.special_requests && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                  Special Requests
                </h2>
                <p className="text-gray-600">{booking.special_requests}</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 sticky top-8"
            >
              <h2 className="text-xl font-display font-bold text-gray-800 mb-4">
                Payment Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Room ({nights} nights)</span>
                  <span>{formatPrice(booking.room?.price_per_night ? booking.room.price_per_night * nights : (booking.total_amount || 0) / 1.12)}</span>
                </div>
                
                {/* Loyalty Discount */}
                {booking.loyalty_discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-2" />
                      <span>Loyalty Savings</span>
                    </div>
                    <span>-{formatPrice(booking.loyalty_discount)}</span>
                  </div>
                )}

                {/* Points Redeemed */}
                {booking.points_discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-2" />
                      <span>Points Redeemed ({booking.loyalty_points_redeemed} pts)</span>
                    </div>
                    <span>-{formatPrice(booking.points_discount)}</span>
                  </div>
                )}

                {/* Promo Code Discount */}
                {booking.promo_code && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Promo: {booking.promo_code}</span>
                    </div>
                    <span>-{formatPrice(booking.promo_discount || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Fees</span>
                  <span>{formatPrice(parseFloat(booking.total_amount) - (parseFloat(booking.total_amount) / (1 + ((booking.branch?.tax_rate || 15) / 100))))}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(booking.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  {booking.payment_status === 'completed' || booking.payment_status === 'paid' ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <span className="badge badge-warning">Pending</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 print:hidden">
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn btn-secondary w-full text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn btn-ghost w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Need Help?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    +94 11 234 5678
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    support@serendibhotels.lk
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        booking={booking}
        isCancelling={cancelling}
      />
    </div>
  )
}

export default BookingDetailsPage
