import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Calendar, MapPin, User, CreditCard, CheckCircle, 
  X, Printer, Clock, Filter, Eye, DollarSign, RefreshCw, XCircle, AlertTriangle, Gift
} from 'lucide-react'
import { bookingAPI, paymentAPI } from '../../services/api'
import { format, parseISO, differenceInDays } from 'date-fns'
import { toast } from 'react-toastify'
import { formatBookingRef } from '../../utils/helpers'
import CancelBookingModal from '../../components/modals/CancelBookingModal'

const StaffBookingsPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentConfirmBooking, setPaymentConfirmBooking] = useState(null)
  const [cancelBooking, setCancelBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await bookingAPI.getBookings(params)
      const data = response.data.data?.bookings || []
      setBookings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (booking) => {
    // Open confirmation modal
    setPaymentConfirmBooking(booking)
  }

  const confirmPayment = async () => {
    if (!paymentConfirmBooking) return
    
    try {
      setProcessingPayment(true)
      console.log('Processing payment for booking:', paymentConfirmBooking.booking_id)
      
      const response = await paymentAPI.processPayment({
        booking_id: paymentConfirmBooking.booking_id,
        payment_method: 'cash'
      })
      
      console.log('Payment response:', response)
      toast.success('Payment marked as completed')
      
      // Close confirmation modal
      setPaymentConfirmBooking(null)
      
      // Close details modal if same booking
      if (selectedBooking?.booking_id === paymentConfirmBooking.booking_id) {
        setSelectedBooking(null)
      }
      
      // Refresh bookings list
      await fetchBookings()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  const confirmCancel = async (reason = cancelReason) => {
    if (!cancelBooking || !reason?.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }
    
    try {
      setCancelling(true)
      await bookingAPI.cancelBooking(cancelBooking.booking_id, reason)
      toast.success('Booking cancelled successfully')
      
      // Close modals
      setCancelBooking(null)
      setCancelReason('')
      setSelectedBooking(null)
      
      // Refresh bookings list
      await fetchBookings()
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handlePrintReceipt = (booking) => {
    // Create printable receipt content
    const receiptWindow = window.open('', '_blank', 'width=400,height=600')
    const checkIn = booking.check_in_date || booking.check_in
    const checkOut = booking.check_out_date || booking.check_out
    
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
          @media print { body { padding: 0; } }
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
          <div class="row"><span class="label">Guest:</span><span class="value">${booking.user?.full_name || booking.guest_name || 'Guest'}</span></div>
          <div class="row"><span class="label">Room:</span><span class="value">${booking.room?.room_number || 'N/A'}</span></div>
          <div class="row"><span class="label">Branch:</span><span class="value">${booking.room?.branch_name || booking.branch?.name || 'Hotel'}</span></div>
        </div>
        
        <div class="section">
          <h3>Stay Details</h3>
          <div class="row"><span class="label">Check-in:</span><span class="value">${checkIn ? format(parseISO(checkIn), 'MMM dd, yyyy') : 'N/A'}</span></div>
          <div class="row"><span class="label">Check-out:</span><span class="value">${checkOut ? format(parseISO(checkOut), 'MMM dd, yyyy') : 'N/A'}</span></div>
          <div class="row"><span class="label">Guests:</span><span class="value">${booking.number_of_guests || 1}</span></div>
          <div class="row"><span class="label">Nights:</span><span class="value">${booking.nights || 1}</span></div>
        </div>
        
        <div class="section">
          <h3>Payment</h3>
          <div class="row"><span class="label">Method:</span><span class="value">${booking.payment_method || 'Cash'}</span></div>
          <div class="row"><span class="label">Status:</span><span class="value">${booking.payment_status === 'completed' ? 'Paid' : 'Pending'}</span></div>
          
          ${booking.loyalty_discount > 0 ? `<div class="row" style="color: #166534"><span class="label">Loyalty:</span><span class="value">-LKR ${parseFloat(booking.loyalty_discount).toLocaleString()}</span></div>` : ''}
          ${booking.points_discount > 0 ? `<div class="row" style="color: #166534"><span class="label">Points (${booking.loyalty_points_redeemed}):</span><span class="value">-LKR ${parseFloat(booking.points_discount).toLocaleString()}</span></div>` : ''}
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

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      booking.user?.full_name?.toLowerCase().includes(search) ||
      booking.guest_name?.toLowerCase().includes(search) ||
      booking.room?.room_number?.toLowerCase().includes(search) ||
      booking.booking_id?.toString().includes(search)
    )
  })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              All Bookings
            </h1>
            <p className="text-gray-600">View and manage guest bookings</p>
          </div>
          <button 
            onClick={fetchBookings}
            className="btn btn-white flex items-center justify-center p-2 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by guest, room, or booking ID..."
                className="input pl-12 w-full"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'confirmed', 'checked_in', 'checked_out'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchTerm ? `No results for "${searchTerm}"` : 'No bookings match the selected filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => {
              const checkIn = booking.check_in_date || booking.check_in
              const checkOut = booking.check_out_date || booking.check_out
              const isPaid = booking.payment_status === 'completed' || booking.payment_status === 'paid'
              
              return (
                <motion.div
                  key={booking.booking_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {booking.room?.room_number ? `Room ${booking.room.room_number}` : 'Unassigned'}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                          {booking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {formatBookingRef(booking.booking_id)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-primary-400" />
                          <span className="truncate">{booking.user?.full_name || booking.guest_name || 'Guest'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary-400" />
                          <span>
                            {checkIn && checkOut 
                              ? `${format(parseISO(checkIn), 'MMM dd')} - ${format(parseISO(checkOut), 'MMM dd')}`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary-400" />
                          <span>{booking.room?.branch_name || booking.branch?.name || 'Hotel'}</span>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-primary-400" />
                          <span className={isPaid ? 'text-green-600' : 'text-yellow-600'}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-600">
                          {formatPrice(booking.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">{booking.nights || 1} nights</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="btn btn-secondary p-2"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {!isPaid && booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                          <button
                            onClick={() => handleMarkAsPaid(booking)}
                            disabled={processingPayment}
                            className="btn btn-primary p-2"
                            title="Mark as Paid"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                        
                        {isPaid && (
                          <button
                            onClick={() => handlePrintReceipt(booking)}
                            className="btn btn-secondary p-2"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-gray-800">
                    Booking Details
                  </h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Reference</p>
                    <p className="text-lg font-bold text-primary-600">
                      {formatBookingRef(selectedBooking.booking_id)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Guest</p>
                      <p className="font-medium">{selectedBooking.user?.full_name || selectedBooking.guest_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="font-medium">{selectedBooking.room?.room_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium">
                        {selectedBooking.check_in_date 
                          ? format(parseISO(selectedBooking.check_in_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-medium">
                        {selectedBooking.check_out_date 
                          ? format(parseISO(selectedBooking.check_out_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedBooking.status)}`}>
                        {selectedBooking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment</p>
                      <span className={`font-medium ${
                        selectedBooking.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {selectedBooking.payment_status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary-50 rounded-xl space-y-2">
                    {/* Loyalty Discount */}
                    {selectedBooking.loyalty_discount > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <div className="flex items-center">
                           <Gift className="h-4 w-4 mr-2" />
                           <span>Loyalty Savings</span>
                        </div>
                        <span>-{formatPrice(selectedBooking.loyalty_discount)}</span>
                      </div>
                    )}

                    {/* Points Redeemed */}
                    {selectedBooking.points_discount > 0 && (
                      <div className="flex justify-between text-sm text-green-700">
                        <div className="flex items-center">
                           <Gift className="h-4 w-4 mr-2" />
                           <span>Points Redeemed ({selectedBooking.loyalty_points_redeemed} pts)</span>
                        </div>
                        <span>-{formatPrice(selectedBooking.points_discount)}</span>
                      </div>
                    )}

                    {/* Promo Code Discount */}
                    {selectedBooking.promo_code && (
                      <div className="flex justify-between text-sm text-green-700">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span>Promo: {selectedBooking.promo_code}</span>
                        </div>
                        <span>-{formatPrice(selectedBooking.promo_discount || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPrice(selectedBooking.total_amount)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedBooking.special_requests && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">
                        {selectedBooking.special_requests}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    {selectedBooking.payment_status !== 'completed' && selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'checked_out' && (
                      <button
                        onClick={() => handleMarkAsPaid(selectedBooking)}
                        disabled={processingPayment}
                        className="btn btn-primary flex-1"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Mark as Paid
                      </button>
                    )}
                    
                    {selectedBooking.payment_status === 'completed' && (
                      <button
                        onClick={() => handlePrintReceipt(selectedBooking)}
                        className="btn btn-secondary flex-1"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                      </button>
                    )}
                    
                    {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'checked_out' && (
                      <button
                        onClick={() => setCancelBooking(selectedBooking)}
                        className="btn btn-secondary text-red-600 hover:bg-red-50 flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {paymentConfirmBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-start justify-center z-[60] p-4 pt-20"
            onClick={() => setPaymentConfirmBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Confirm Cash Payment
                </h3>
                <p className="text-gray-600 mb-2">
                  Mark booking <span className="font-semibold">{formatBookingRef(paymentConfirmBooking.booking_id)}</span> as paid?
                </p>
                <p className="text-2xl font-bold text-primary-600 mb-6">
                  {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(paymentConfirmBooking.total_amount || 0)}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentConfirmBooking(null)}
                    className="btn btn-secondary flex-1"
                    disabled={processingPayment}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="btn btn-primary flex-1"
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <span className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      {/* Cancel Confirmation Modal */}
      <CancelBookingModal
        isOpen={!!cancelBooking}
        onClose={() => {
          setCancelBooking(null)
          setCancelReason('')
        }}
        onConfirm={confirmCancel}
        booking={cancelBooking}
        isCancelling={cancelling}
      />
    </div>
  )
}

export default StaffBookingsPage
