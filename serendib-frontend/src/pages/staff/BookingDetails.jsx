import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Calendar, MapPin, User, CreditCard, Printer, 
  DollarSign, XCircle, Gift, Users, Bed, Clock, Phone, Mail, CheckCircle
} from 'lucide-react'
import { bookingAPI, paymentAPI } from '../../services/api'
import { format, parseISO, differenceInDays } from 'date-fns'
import { toast } from 'react-toastify'
import { formatBookingRef } from '../../utils/helpers'
import CancelBookingModal from '../../components/modals/CancelBookingModal'

const StaffBookingDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (id) {
      fetchBooking()
    }
  }, [id])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getBooking(id)
      const data = response.data?.data?.booking || response.data?.data
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error('Failed to load booking details')
      navigate('/staff/bookings')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price || 0)
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      checked_in: 'bg-green-100 text-green-700',
      checked_out: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const handleMarkAsPaid = async () => {
    try {
      setProcessingPayment(true)
      await paymentAPI.processPayment({
        booking_id: booking.booking_id,
        payment_method: 'cash'
      })
      toast.success('Payment marked as completed')
      setShowPaymentConfirm(false)
      await fetchBooking()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCancel = async (reason) => {
    try {
      setCancelling(true)
      await bookingAPI.cancelBooking(booking.booking_id, reason)
      toast.success('Booking cancelled successfully')
      setShowCancelModal(false)
      await fetchBooking()
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handlePrintReceipt = () => {
    if (!booking) return
    
    const checkIn = booking.check_in_date || booking.check_in
    const checkOut = booking.check_out_date || booking.check_out
    
    const receiptWindow = window.open('', '_blank', 'width=400,height=600')
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${formatBookingRef(booking.booking_id)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 350px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin-bottom: 15px; }
          .section h3 { margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .row .label { color: #666; }
          .row .value { font-weight: bold; }
          .total { border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; font-size: 18px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Serendib Hotels</h1>
          <p>Receipt</p>
        </div>
        <div class="section">
          <h3>Booking Details</h3>
          <div class="row"><span class="label">Reference:</span><span class="value">${formatBookingRef(booking.booking_id)}</span></div>
          <div class="row"><span class="label">Guest:</span><span class="value">${booking.user?.full_name || 'Guest'}</span></div>
          <div class="row"><span class="label">Room:</span><span class="value">${booking.room?.room_number || 'N/A'}</span></div>
          <div class="row"><span class="label">Branch:</span><span class="value">${booking.room?.branch_name || booking.branch?.name || 'Hotel'}</span></div>
        </div>
        <div class="section">
          <h3>Stay Details</h3>
          <div class="row"><span class="label">Check-in:</span><span class="value">${checkIn ? format(parseISO(checkIn), 'MMM dd, yyyy') : 'N/A'}</span></div>
          <div class="row"><span class="label">Check-out:</span><span class="value">${checkOut ? format(parseISO(checkOut), 'MMM dd, yyyy') : 'N/A'}</span></div>
          <div class="row"><span class="label">Guests:</span><span class="value">${booking.number_of_guests || 1}</span></div>
        </div>
        <div class="section">
          <h3>Payment</h3>
          ${booking.loyalty_discount > 0 ? `<div class="row" style="color: #166534"><span class="label">Loyalty:</span><span class="value">-LKR ${parseFloat(booking.loyalty_discount).toLocaleString()}</span></div>` : ''}
          ${booking.points_discount > 0 ? `<div class="row" style="color: #166534"><span class="label">Points:</span><span class="value">-LKR ${parseFloat(booking.points_discount).toLocaleString()}</span></div>` : ''}
          ${booking.promo_code ? `<div class="row" style="color: #166534"><span class="label">Promo (${booking.promo_code}):</span><span class="value">-LKR ${parseFloat(booking.promo_discount || 0).toLocaleString()}</span></div>` : ''}
          <div class="row total"><span class="label">Total:</span><span class="value">LKR ${parseFloat(booking.total_amount || 0).toLocaleString()}</span></div>
        </div>
        <div class="footer">
          <p>Thank you for staying with us!</p>
          <p>Printed: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `)
    receiptWindow.document.close()
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
          <button onClick={() => navigate('/staff/bookings')} className="btn btn-primary mt-4">
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }

  const checkIn = booking.check_in_date || booking.check_in
  const checkOut = booking.check_out_date || booking.check_out
  const isPaid = booking.payment_status === 'completed' || booking.payment_status === 'paid'
  const nights = checkIn && checkOut 
    ? differenceInDays(parseISO(checkOut), parseISO(checkIn)) 
    : booking.nights || 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/staff/bookings')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to All Bookings
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Booking Details
            </h1>
            <p className="text-lg text-primary-600 font-mono">
              {formatBookingRef(booking.booking_id)}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(booking.status)}`}>
            {booking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-display font-bold text-gray-800 mb-4">
                Guest Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary-400" />
                    {booking.user?.full_name || booking.guest_name || 'Guest'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-primary-400" />
                    {booking.guest_email || booking.user?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary-400" />
                    {booking.guest_phone || booking.user?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Guests</p>
                  <p className="font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2 text-primary-400" />
                    {booking.number_of_guests || 1} guest{(booking.number_of_guests || 1) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Room Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-display font-bold text-gray-800 mb-4">
                Room Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Room Number</p>
                  <p className="font-medium flex items-center">
                    <Bed className="h-4 w-4 mr-2 text-primary-400" />
                    {booking.room?.room_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Room Type</p>
                  <p className="font-medium">
                    {booking.room?.room_type?.charAt(0).toUpperCase() + booking.room?.room_type?.slice(1) || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-400" />
                    {booking.room?.branch_name || booking.branch?.name || 'Hotel'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Floor</p>
                  <p className="font-medium">
                    Floor {booking.room?.floor || 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stay Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-display font-bold text-gray-800 mb-4">
                Stay Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Check-in</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {checkIn ? format(parseISO(checkIn), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">After 2:00 PM</p>
                </div>
                <div className="p-4 bg-peach-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Check-out</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {checkOut ? format(parseISO(checkOut), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Before 11:00 AM</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Duration
                  </span>
                  <span className="font-semibold text-gray-800">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Special Requests */}
            {booking.special_requests && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="text-xl font-display font-bold text-gray-800 mb-4">
                  Special Requests
                </h2>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
                  {booking.special_requests}
                </p>
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

              {/* Payment Status Badge */}
              <div className={`mb-6 p-4 rounded-xl text-center ${
                isPaid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className="text-sm text-gray-500 mb-2">Payment Status</p>
                <div className={`flex items-center justify-center gap-2 text-lg font-bold ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isPaid ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Paid</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5" />
                      <span>Pending</span>
                    </>
                  )}
                </div>
              </div>

              {/* Discounts */}
              {(booking.loyalty_discount > 0 || booking.points_discount > 0 || booking.promo_code) && (
                <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-semibold mb-2 uppercase">Savings Applied</p>
                  <div className="space-y-1">
                    {booking.loyalty_discount > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span className="flex items-center">
                          <Gift className="h-3 w-3 mr-1.5" />
                          Loyalty Tier
                        </span>
                        <span className="font-medium">-{formatPrice(booking.loyalty_discount)}</span>
                      </div>
                    )}
                    {booking.points_discount > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span className="flex items-center">
                          <Gift className="h-3 w-3 mr-1.5" />
                          {booking.loyalty_points_redeemed} Points
                        </span>
                        <span className="font-medium">-{formatPrice(booking.points_discount)}</span>
                      </div>
                    )}
                    {booking.promo_code && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span className="flex items-center">
                          <CreditCard className="h-3 w-3 mr-1.5" />
                          {booking.promo_code}
                        </span>
                        <span className="font-medium">-{formatPrice(booking.promo_discount || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Total Amount - Prominent Display */}
              <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-primary-600">
                  {formatPrice(booking.total_amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{nights} night{nights !== 1 ? 's' : ''} stay</p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {!isPaid && booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                  <button
                    onClick={() => setShowPaymentConfirm(true)}
                    disabled={processingPayment}
                    className="btn btn-primary w-full"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </button>
                )}
                
                {isPaid && (
                  <button
                    onClick={handlePrintReceipt}
                    className="btn btn-secondary w-full"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </button>
                )}
                
                {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn btn-secondary w-full text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Cash Payment</h3>
              <p className="text-gray-600 mb-2">
                Mark booking <span className="font-semibold">{formatBookingRef(booking.booking_id)}</span> as paid?
              </p>
              <p className="text-2xl font-bold text-primary-600 mb-6">
                {formatPrice(booking.total_amount)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentConfirm(false)}
                  className="btn btn-secondary flex-1"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  className="btn btn-primary flex-1"
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Modal */}
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

export default StaffBookingDetails
