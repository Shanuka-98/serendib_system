import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Calendar, MapPin, User, CreditCard, Printer, 
  DollarSign, XCircle, Gift, Clock, Users, Bed
} from 'lucide-react'
import { bookingAPI, paymentAPI } from '../../services/api'
import { format, parseISO, differenceInDays } from 'date-fns'
import { toast } from 'react-toastify'
import { formatBookingRef } from '../../utils/helpers'
import CancelBookingModal from './CancelBookingModal'

const BookingDetailsModal = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  booking: initialBooking = null,
  onUpdate 
}) => {
  const [booking, setBooking] = useState(initialBooking)
  const [loading, setLoading] = useState(!initialBooking)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (isOpen && bookingId && !initialBooking) {
      fetchBooking()
    } else if (initialBooking) {
      setBooking(initialBooking)
    }
  }, [isOpen, bookingId, initialBooking])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getBooking(bookingId)
      const data = response.data?.data?.booking || response.data?.data
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error('Failed to load booking details')
      onClose()
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
      
      // Refresh booking data
      await fetchBooking()
      onUpdate?.()
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
      
      // Refresh booking data
      await fetchBooking()
      onUpdate?.()
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

  if (!isOpen) return null

  const checkIn = booking?.check_in_date || booking?.check_in
  const checkOut = booking?.check_out_date || booking?.check_out
  const isPaid = booking?.payment_status === 'completed' || booking?.payment_status === 'paid'
  const nights = checkIn && checkOut 
    ? differenceInDays(parseISO(checkOut), parseISO(checkIn)) 
    : booking?.nights || 1

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading booking details...</p>
              </div>
            ) : booking ? (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-gray-800">
                    Booking Details
                  </h2>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Reference */}
                <div className="p-4 bg-gray-50 rounded-xl mb-4">
                  <p className="text-sm text-gray-500 mb-1">Reference</p>
                  <p className="text-lg font-bold text-primary-600">
                    {formatBookingRef(booking.booking_id)}
                  </p>
                </div>
                
                {/* Guest & Room Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Guest</p>
                    <p className="font-medium flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary-400" />
                      {booking.user?.full_name || booking.guest_name || 'Guest'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Room</p>
                    <p className="font-medium flex items-center">
                      <Bed className="h-4 w-4 mr-2 text-primary-400" />
                      {booking.room?.room_number || 'N/A'}
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
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary-400" />
                      {booking.number_of_guests || 1} guest{(booking.number_of_guests || 1) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-primary-50 rounded-xl">
                    <p className="text-xs text-gray-500">Check-in</p>
                    <p className="font-medium">
                      {checkIn ? format(parseISO(checkIn), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-peach-50 rounded-xl">
                    <p className="text-xs text-gray-500">Check-out</p>
                    <p className="font-medium">
                      {checkOut ? format(parseISO(checkOut), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Status Row */}
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                      {booking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment</p>
                    <span className={`font-medium ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                {/* Payment Summary */}
                <div className="p-4 bg-primary-50 rounded-xl mb-4 space-y-2">
                  {booking.loyalty_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <div className="flex items-center">
                        <Gift className="h-4 w-4 mr-2" />
                        <span>Loyalty Savings</span>
                      </div>
                      <span>-{formatPrice(booking.loyalty_discount)}</span>
                    </div>
                  )}
                  {booking.points_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <div className="flex items-center">
                        <Gift className="h-4 w-4 mr-2" />
                        <span>Points ({booking.loyalty_points_redeemed} pts)</span>
                      </div>
                      <span>-{formatPrice(booking.points_discount)}</span>
                    </div>
                  )}
                  {booking.promo_code && (
                    <div className="flex justify-between text-sm text-green-700">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>Promo: {booking.promo_code}</span>
                      </div>
                      <span>-{formatPrice(booking.promo_discount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-primary-100">
                    <span className="text-gray-700 font-medium">Total Amount</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(booking.total_amount)}
                    </span>
                  </div>
                </div>
                
                {/* Special Requests */}
                {booking.special_requests && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">
                      {booking.special_requests}
                    </p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {!isPaid && booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                    <button
                      onClick={() => setShowPaymentConfirm(true)}
                      disabled={processingPayment}
                      className="btn btn-primary flex-1"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </button>
                  )}
                  
                  {isPaid && (
                    <button
                      onClick={handlePrintReceipt}
                      className="btn btn-secondary flex-1"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Receipt
                    </button>
                  )}
                  
                  {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="btn btn-secondary text-red-600 hover:bg-red-50 flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600">Booking not found</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Payment Confirmation */}
      <AnimatePresence>
        {showPaymentConfirm && booking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowPaymentConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        booking={booking}
        isCancelling={cancelling}
      />
    </>
  )
}

export default BookingDetailsModal
