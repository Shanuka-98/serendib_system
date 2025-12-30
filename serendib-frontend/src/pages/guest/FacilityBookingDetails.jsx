import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MapPin, Users, Clock, ArrowLeft, DollarSign,
  CheckCircle, AlertCircle, Trash2, FileText, Waves, Dumbbell, Sparkles, Building2, Building
} from 'lucide-react'
import api, { facilityAPI } from '../../services/api'
import { format, parseISO, isFuture } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import CancelBookingModal from '../../components/modals/CancelBookingModal'
import { formatBookingRef, formatFacilityRef } from '../../utils/helpers'

const FacilityBookingDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [quoteAction, setQuoteAction] = useState(null) // 'accept' or 'decline'
  const [isProcessing, setIsProcessing] = useState(false)

  const location = useLocation()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    // Check for payment success
    const params = new URLSearchParams(location.search)
    const paymentStatus = params.get('payment')
    const sessionId = params.get('session_id')

    if (paymentStatus === 'success' && sessionId) {
       confirmPayment(sessionId)
    } else if (paymentStatus === 'cancelled') {
       toast.error('Payment was cancelled')
       // Clean URL
       window.history.replaceState({}, document.title, window.location.pathname)
    }

    fetchBookingDetails()
  }, [id, user, location.search])

  const confirmPayment = async (sessionId) => {
      try {
          setIsProcessing(true)
          await api.post('/facility-stripe/confirm', {
              session_id: sessionId,
              booking_id: id
          })
          toast.success('Payment confirmed! Booking is now active.')
          // Remove query params
          window.history.replaceState({}, document.title, window.location.pathname)
          // Refresh details
          fetchBookingDetails()
      } catch (error) {
          console.error('Payment confirmation error:', error)
          toast.error('Failed to confirm payment. Please contact support.')
      } finally {
          setIsProcessing(false)
      }
  }

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      // Endpoint: GET /facilities/bookings/:id
      const response = await facilityAPI.getFacilityBooking(id)
      
      // Axios response.data = { success: true, data: { ...bookingObject } }
      // Backend returns data directly as the booking object in the 'data' field?
      // Let's check facilities.py get_facility_booking: 
      // return success_response(data=booking.to_dict(...))
      // So response.data.data is the booking object.
      
      const bookingData = response.data?.data
      
      if (!bookingData) {
        throw new Error('Booking data missing')
      }
      
      setBooking(bookingData)
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error(error.response?.data?.message || 'Failed to load booking details')
      navigate('/my-facility-bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (reason) => {
    try {
      setIsCancelling(true)
      await facilityAPI.updateFacilityBooking(id, { 
        status: 'cancelled',
        cancellation_reason: reason
      })
      toast.success('Booking cancelled successfully')
      setShowCancelModal(false)
      fetchBookingDetails()
    } catch (error) {
        console.error(error)
      toast.error('Failed to cancel booking')
    } finally {
        setIsCancelling(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'cancelled') return <span className="badge badge-error">Cancelled</span>
    if (status === 'completed') return <span className="badge badge-success">Completed</span>
    if (status === 'confirmed') return <span className="badge badge-primary">Confirmed</span>
    if (status === 'pending') return <span className="badge badge-warning">Pending</span>
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )

  if (!booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900">Booking Not Found</h3>
        <button onClick={() => navigate('/my-facility-bookings')} className="mt-4 btn btn-primary">
          Back to Bookings
        </button>
      </div>
    </div>
  )

  const isQuoted = booking.status === 'quoted'
  const isPast = new Date(booking.booking_date) < new Date().setHours(0,0,0,0)

  const handleQuoteResponse = async (action) => {
    setIsProcessing(true)
    try {
      if (action === 'accept') {
        // If amount is > 0, redirect to Stripe
        if (booking.total_amount > 0) {
          // Use new separate facility stripe endpoint
          const response = await api.post('/facility-stripe/checkout', {
            booking_id: booking.booking_id
          })
          // Redirect to Stripe
          window.location.href = response.data.data.checkout_url
        } else {
          // Free booking, just confirm
          await facilityAPI.updateFacilityBooking(id, { status: 'confirmed' })
          toast.success('Quote accepted! Booking confirmed.')
          setQuoteAction(null)
          fetchBookingDetails()
        }
      } else {
        await facilityAPI.updateFacilityBooking(id, { status: 'cancelled', cancellation_reason: 'Quote declined by user' })
        toast.success('Quote declined')
        setQuoteAction(null)
        fetchBookingDetails()
      }
    } catch (error) {
      console.error('Quote response error:', error)
      toast.error(error.response?.data?.message || 'Failed to process request')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const Icon = getFacilityIcon(booking.facility_type || booking.facility?.facility_type)
  
  // Logic for canCancel (same as list view)
  let canCancel = false
  // Prevent cancellation if already paid (requires manual refund)
  if (['pending', 'confirmed', 'quoted', 'inquiry'].includes(booking.status) && booking.payment_status !== 'paid') {
    const bookingDate = parseISO(booking.booking_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (bookingDate > today) canCancel = true
    else if (bookingDate.getTime() === today.getTime() && booking.start_time) {
        const [h, m] = booking.start_time.split(':').map(Number)
        const now = new Date()
        const bt = new Date(); bt.setHours(h, m, 0, 0)
        if (bt > now) canCancel = true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/my-facility-bookings')}
            className="text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Bookings
          </button>

        </div>

        {/* Status Banner for Quote */}
        {isQuoted && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Quote Received!</h2>
                <p className="text-blue-100 mb-4">
                  We've prepared a custom quote for your event. Please review the details below.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setQuoteAction('accept')}
                    className="px-6 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    Accept Offer
                  </button>
                  <button 
                    onClick={() => setQuoteAction('decline')}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors border border-blue-500"
                  >
                    Decline
                  </button>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm opacity-80">Total Amount</p>
                <p className="text-3xl font-bold">
                  {formatPrice(booking.total_amount)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Cover / Header */}
          <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {booking.event_name || booking.facility_name || booking.facility?.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  booking.status === 'quoted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  booking.status === 'inquiry' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {booking.status}
                </span>
              </div>
              <p className="text-gray-500 flex items-center gap-2 text-sm">
                <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                  {formatFacilityRef(booking.booking_id, booking.booking_date)}
                </span>
                <span>•</span>
                <span>{booking.facility?.branch_name || booking.branch_name || 'Serendib Hotel'}</span>
              </p>
            </div>
            
            {!isQuoted && (
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Price</p>
                <p className="text-2xl font-bold text-primary-600">
                  {booking.status === 'inquiry' ? 'Pending Quote' : 
                   formatPrice(booking.total_amount || 0)}
                </p>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Date & Time</h3>
                    <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-5 h-5 text-sky-500" />
                        <span className="font-medium">{format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="w-5 h-5 text-sky-500" />
                        <span className="font-medium">{booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
                    <div className="flex items-center gap-3 text-gray-700">
                        <Users className="w-5 h-5 text-sky-500" />
                        <span className="font-medium">{booking.number_of_guests} Guest{booking.number_of_guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-sky-500" />
                        <span className="font-medium">{booking.branch_name || booking.facility?.branch?.name}</span>
                    </div>
                </div>
            </div>

            <div className="border-t pt-6"></div>

            {/* Payment & Bill Info */}
            <div className="flex flex-col md:flex-row justify-between gap-6 p-6 bg-gray-50 rounded-xl">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                    <div className="flex items-center gap-2">
                        {booking.payment_status === 'paid' ? (
                            <span className="flex items-center text-green-600 font-medium">
                                <CheckCircle className="w-4 h-4 mr-1" /> Paid
                            </span>
                        ) : booking.payment_type === 'add_to_bill' ? (
                            <span className="flex items-center text-amber-600 font-medium">
                                <FileText className="w-4 h-4 mr-1" /> Added to Room Bill
                            </span>
                        ) : booking.total_amount > 0 && booking.status !== 'cancelled' && ['not_required', 'pending'].includes(booking.payment_status) ? (
                            <span className="flex items-center text-amber-600 font-medium">
                                <AlertCircle className="w-4 h-4 mr-1" /> Payment Pending
                            </span>
                        ) : (!booking.total_amount || booking.total_amount === 0) ? (
                            <span className="flex items-center text-gray-500 font-medium">
                                <CheckCircle className="w-4 h-4 mr-1 text-gray-400" /> Complimentary
                            </span>
                        ) : (
                             <span className="text-gray-700 font-medium capitalize">
                                {(booking.payment_status || 'Pending').replace(/_/g, ' ')}
                             </span>
                        )}
                    </div>
                </div>
                
                <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(booking.total_amount)}</p>
                </div>
            </div>

            {/* Link to Room Bill */}
            {booking.room_booking_id && (
                <div className="flex items-center justify-between p-4 border border-sky-100 bg-sky-50 rounded-lg">
                     <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-sky-600" />
                        <div>
                            <p className="text-sm font-medium text-sky-900">
                                Linked to Room Reservation 
                                <span className="ml-1 font-mono text-xs bg-sky-100 px-1.5 py-0.5 rounded">
                                    {formatBookingRef(booking.room_booking_id)}
                                </span>
                            </p>
                            <p className="text-xs text-sky-700">Charges for this facility appear on your room bill.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(`/bookings/${booking.room_booking_id}`)}
                        className="px-4 py-2 bg-white text-sky-600 text-sm font-medium rounded-lg border border-sky-200 hover:bg-sky-50 transition-colors shadow-sm"
                    >
                        View Full Bill
                    </button>
                </div>
            )}
            
            {/* Actions */}
            {canCancel && !isQuoted && (
                <div className="pt-4 flex justify-end">
                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Cancel Booking
                    </button>
                </div>
            )}

          </div>
        </div>
      </div>

      <CancelBookingModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        booking={booking}
        isCancelling={isCancelling}
      />

      {/* Quote Action Confirmation Modal */}
      {quoteAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className={`p-6 ${quoteAction === 'accept' ? 'bg-blue-50' : 'bg-red-50'} border-b ${quoteAction === 'accept' ? 'border-blue-100' : 'border-red-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${quoteAction === 'accept' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                  {quoteAction === 'accept' ? <DollarSign className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <h3 className={`text-lg font-bold ${quoteAction === 'accept' ? 'text-blue-900' : 'text-red-900'}`}>
                  {quoteAction === 'accept' ? 'Accept Quote' : 'Decline Quote'}
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600">
                {quoteAction === 'accept' 
                  ? (booking.total_amount > 0 
                      ? `You are about to accept the quote for Rs. ${booking.total_amount?.toLocaleString()}. You will be redirected to make a payment.`
                      : 'You are about to accept this quote. Since there is no cost, your booking will be confirmed immediately.')
                  : 'Are you sure you want to decline this quote? This will cancel your inquiry and cannot be undone.'
                }
              </p>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setQuoteAction(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleQuoteResponse(quoteAction)}
                className={`px-6 py-2 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 ${
                  quoteAction === 'accept' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                   <>Processing...</>
                ) : (
                   <>{quoteAction === 'accept' ? 'Proceed' : 'Decline Quote'}</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default FacilityBookingDetailsPage
