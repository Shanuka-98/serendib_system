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
  const [bill, setBill] = useState(null)
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
      const [bookingRes, billRes] = await Promise.all([
        bookingAPI.getBooking(id),
        bookingAPI.getBill(id)
      ])
      
      const bookingData = bookingRes.data?.data?.booking || bookingRes.data?.data
      
      if (!bookingData) {
        toast.error('Booking not found')
        navigate('/bookings')
        return
      }
      
      setBooking(bookingData)
      setBill(billRes.data.data.bill)
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error('Failed to load booking details')
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
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-gray-700 italic">"{booking.special_requests}"</p>
                </div>
              </motion.div>
            )}

            {/* NEW: Charges & Services Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-6 flex items-center justify-between">
                <span>Charges & Services</span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {booking.payment_status === 'paid' ? 'Fully Paid' : 'Balance Due'}
                </span>
              </h2>

              <BillSummary bill={bill} />
              
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 print:hidden">
            {/* Payment Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Total Payment
              </h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Room Charge</span>
                  <span>{formatPrice(booking.total_amount)}</span>
                </div>
                {bill && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Payment Status</span>
                    <span className={`font-medium ${bill.summary.balance_due <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                      {bill.summary.balance_due <= 0 ? 'Paid' : 'Due'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2 group hover:shadow-md transition-all"
                >
                  <Download className="h-4 w-4 text-gray-600 group-hover:text-primary-600" />
                  <span>Download Receipt</span>
                </button>

                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full btn bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2 border border-red-100"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </motion.div>

            {/* Need Help? */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-xl"
            >
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Users className="h-5 w-5 mr-2 opacity-80" />
                Need Assistance?
              </h3>
              <p className="text-primary-100 text-sm mb-4 leading-relaxed">
                Our front desk is available 24/7 to help you with any questions.
              </p>
              <div className="space-y-3">
                <a href="tel:+94112345678" className="flex items-center gap-3 text-sm hover:text-white transition-colors p-2 bg-white/10 rounded-lg">
                  <Phone className="h-4 w-4" />
                  <span className="font-mono">+94 11 234 5678</span>
                </a>
                <a href="mailto:support@serendibhotels.lk" className="flex items-center gap-3 text-sm hover:text-white transition-colors p-2 bg-white/10 rounded-lg">
                  <Mail className="h-4 w-4" />
                  <span>support@serendibhotels.lk</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelBookingModal
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancel}
            reason={cancelReason}
            setReason={setCancelReason}
            loading={cancelling}
          />
        )}
      </AnimatePresence>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 15mm; size: auto; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .glass { box-shadow: none !important; border: none !important; padding: 0 !important; margin-bottom: 2rem !important; }
          .btn, .no-print, nav { display: none !important; }
          
          /* Layout Adjustments */
          .max-w-4xl { max-width: 100% !important; padding: 0 !important; }
          .grid { display: block !important; }
          .lg\\:col-span-2 { width: 100% !important; }
          
          /* Text Size & Spacing */
          h1 { font-size: 24pt !important; margin-bottom: 0.5rem !important; }
          h2 { font-size: 16pt !important; margin-bottom: 0.5rem !important; border-bottom: 1px solid #eee; padding-bottom: 0.25rem; }
          p, span { font-size: 11pt !important; }
          
          /* Hide Sidebar Elements in Print */
          .space-y-6.print\\:hidden { display: none !important; }
          
          /* Footer */
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        }
      `}</style>
    </div>
  )
}

// Inline Bill Summary Component for Booking Details
const BillSummary = ({ bill }) => {
  if (!bill) return <div className="text-sm text-gray-500 animate-pulse">Loading charges...</div>
  
  // Calculate if fully paid based on balance
  const isFullyPaid = bill.summary.balance_due <= 0

  return (
    <div className="space-y-4">
      {/* Room Charges */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <div>
          <p className="font-medium text-gray-800">Accommodation</p>
          <p className="text-xs text-gray-500">{bill.stay.nights} nights × {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.room_charges.per_night)}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.room_charges.total)}</p>
          {bill.room_charges.paid && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-100">Prepaid</span>}
        </div>
      </div>

      {/* Services */}
      {bill.services.length > 0 && (
        <div className="space-y-2 pb-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Services & Amenities</p>
          {bill.services.map((svc, i) => (
            <div key={i} className="flex justify-between items-center text-sm group hover:bg-gray-50 p-2 rounded-lg transition-colors -mx-2">
              <div>
                <p className="text-gray-700 font-medium">{svc.type}</p>
                <p className="text-xs text-gray-500">{svc.date}</p>
              </div>
              <p className="font-medium text-gray-700">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(svc.price)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Facilities */}
      {bill.facilities && bill.facilities.length > 0 && (
        <div className="space-y-2 pb-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facility Bookings</p>
          {bill.facilities.map((fac, i) => (
            <div key={i} className="flex justify-between items-center text-sm group hover:bg-gray-50 p-2 rounded-lg transition-colors -mx-2">
              <div>
                <p className="text-gray-700 font-medium">{fac.facility_name}</p>
                <p className="text-xs text-gray-500">{fac.date} • {fac.guests} Guest{fac.guests > 1 ? 's' : ''}</p>
              </div>
              <p className="font-medium text-gray-700">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(fac.price)}</p>
            </div>
          ))}
        </div>
      )}

      {bill.services.length === 0 && (!bill.facilities || bill.facilities.length === 0) && (
        <p className="text-sm text-gray-400 italic py-2">No additional services or facilities charged.</p>
      )}

      {/* Totals */}
      <div className="pt-4 border-t border-gray-200 space-y-2 text-sm bg-gray-50 p-4 rounded-xl mt-4 border border-gray-100">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.summary.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Service Charge ({(bill.service_charge_rate * 100).toFixed(0)}%)</span>
          <span>{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.summary.service_charge)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Taxes ({(bill.tax_rate * 100).toFixed(0)}%)</span>
          <span>{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.summary.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-3 mt-2 text-base">
          <span>Total</span>
          <span>{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.summary.grand_total)}</span>
        </div>
        {bill.summary.prepaid > 0 && (
          <div className="flex justify-between text-green-600 text-sm font-medium">
            <span>Paid</span>
            <span>-{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.summary.prepaid)}</span>
          </div>
        )}
        <div className={`flex justify-between font-bold text-lg pt-3 border-t border-dashed border-gray-300 mt-2 ${
          isFullyPaid ? 'text-green-600' : 'text-amber-600'
        }`}>
          <span>{isFullyPaid ? 'Balance Due' : 'Amount Due'}</span>
          <span>
            {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(bill.summary.balance_due)}
          </span>
        </div>
        {isFullyPaid && (
          <div className="text-center mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <CheckCircle className="w-3 h-3" />
              Paid in Full
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingDetailsPage
