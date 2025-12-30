import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, Users, DollarSign, CheckCircle, 
  X, AlertCircle, FileText, Send, User, Phone, Mail,
  List, Shield, MapPin, Printer, ArrowLeft
} from 'lucide-react'
import { facilityAPI } from '../../services/api'
import { format, parseISO } from 'date-fns'
import { toast } from 'react-toastify'
import { formatFacilityRef, formatBookingRef } from '../../utils/helpers'
import QuoteModal from '../../components/modals/QuoteModal'

const StaffFacilityBookingDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  
  useEffect(() => {
    fetchBookingDetails()
  }, [id])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await facilityAPI.getFacilityBooking(id)
      if (response.data && response.data.data) {
        setBooking(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus, reason = '') => {
    try {
      const updateData = { status: newStatus }
      if (reason) updateData.cancellation_reason = reason
      
      await facilityAPI.updateFacilityBooking(id, updateData)
      toast.success(`Booking ${newStatus === 'cancelled' ? (booking.status === 'inquiry' ? 'inquiry declined' : 'cancelled') : 'updated'}`)
      setShowCancelModal(false)
      setCancelReason('')
      fetchBookingDetails()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleRecordPayment = async () => {
    const ref = prompt('Enter payment reference (e.g. Receipt #, Bank Transfer Ref):')
    if (ref === null) return // Cancelled
    
    try {
      await facilityAPI.updateFacilityBooking(id, { 
        payment_status: 'paid',
        payment_type: 'pay_now', // Ensure it's not on bill
        notes: `Manual payment recorded. Ref: ${ref}`
      })
      toast.success('Payment recorded successfully')
      fetchBookingDetails()
    } catch (error) {
       console.error(error)
       toast.error('Failed to record payment')
    }
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
        <button onClick={() => navigate('/staff/facility-bookings')} className="mt-4 btn btn-primary">
          Back to List
        </button>
      </div>
    </div>
  )

  const isQuoted = booking.status === 'quoted'
  const isInquiry = booking.status === 'inquiry'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate('/staff/facility-bookings')}
              className="text-gray-500 hover:text-gray-900 text-sm mb-2 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Inquiries
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {booking.event_name || booking.facility_name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                booking.status === 'inquiry' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {booking.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 mt-1 font-mono">
              Ref: {formatFacilityRef(booking.booking_id, booking.booking_date)}
            </p>
          </div>

          <div className="flex gap-2">
            {booking.status === 'quoted' && (
              <button 
                onClick={() => setShowQuoteModal(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Update Quote
              </button>
            )}

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Guest Details */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" /> Guest Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{booking.contact_name || booking.user?.full_name || booking.user_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Organization</p>
                  <p className="font-medium text-gray-900">{booking.organization || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> {booking.contact_email || booking.user?.email || '-'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> {booking.contact_phone || booking.user?.phone || '-'}
                  </p>
                </div>
              </div>
            </section>

            {/* Event Details */}
            <section className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" /> Event Details
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Facility</p>
                  <p className="font-medium">{booking.facility_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{booking.event_type || booking.facility_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{booking.booking_date ? format(parseISO(booking.booking_date), 'MMMM dd, yyyy') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {booking.start_time?.slice(0,5)} - {booking.end_time?.slice(0,5)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-medium">{booking.number_of_guests} people</p>
                </div>
              </div>
              
              {booking.special_requests && (
                <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  <p className="text-xs font-bold uppercase mb-1">Special Requests</p>
                  <p className="text-sm">{booking.special_requests}</p>
                </div>
              )}
            </section>

            {/* Billing / Quote */}
            {(isQuoted || ['confirmed', 'completed', 'pending'].includes(booking.status)) && (
              <section className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-500" /> Billing
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-medium">Rs. {(booking.base_price || 0).toLocaleString()}</span>
                  </div>
                  
                  {booking.selected_addons?.map((addon, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-gray-500">
                      <span>{addon.name} ({addon.type === 'per_person' ? 'x Guests' : 'Fixed'})</span>
                      <span>Rs. {(addon.price * (addon.type === 'per_person' ? booking.number_of_guests : 1)).toLocaleString()}</span>
                    </div>
                  ))}

                  <div className="flex justify-between py-1 text-gray-500">
                    <span>Service Charge (10%)</span>
                    <span>Rs. {(booking.service_charge || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-gray-500">
                    <span>Tax (12%)</span>
                    <span>Rs. {(booking.tax_amount || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pt-3 text-lg font-bold text-gray-900 border-t items-center">
                    <span>Total Amount</span>
                    <span className="text-primary-600">Rs. {(booking.total_amount || 0).toLocaleString()}</span>
                  </div>
                  
                  {booking.payment_status === 'paid' && (
                     <div className="mt-2 text-center py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
                        Paid in Full
                     </div>
                  )}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Staff Actions
              </h3>
              
              <div className="space-y-3">
                {/* Create Quote - Primary action for inquiries */}
                {isInquiry && (
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="w-full btn bg-primary-600 hover:bg-primary-700 text-white justify-center flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" /> Create Quote
                  </button>
                )}

                {booking.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus('confirmed')}
                    className="w-full btn bg-green-600 hover:bg-green-700 text-white justify-center"
                  >
                    Confirm Booking
                  </button>
                )}
                
                {['pending', 'confirmed'].includes(booking.status) && (
                   <button 
                    onClick={() => handleUpdateStatus('completed')}
                    className="w-full btn btn-secondary justify-center"
                  >
                    Mark as Completed
                  </button>
                )}

                {!['cancelled', 'completed'].includes(booking.status) && (
                   <button 
                    onClick={() => setShowCancelModal(true)}
                    className="w-full btn bg-white border border-red-200 text-red-600 hover:bg-red-50 justify-center"
                  >
                    {booking.status === 'inquiry' ? 'Decline Inquiry' : 'Cancel Booking'}
                  </button>
                )}

                {/* Manual Payment Recording */}
                {['quoted', 'confirmed'].includes(booking.status) && booking.payment_status !== 'paid' && (
                  <button 
                    onClick={handleRecordPayment}
                    className="w-full btn btn-primary justify-center mt-4 border-t pt-4"
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                  </button>
                )}

                {/* Print Details */}
                <button 
                  onClick={() => window.print()}
                  className="w-full btn btn-secondary justify-center mt-3 border-t pt-3"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Details
                </button>
              </div>
            </div>

            {/* Quote History / Status */}
            {booking.quote_sent_at && (
              <div className={`rounded-xl p-6 border ${
                  booking.status === 'confirmed' ? 'bg-green-50 border-green-100' : 
                  booking.status === 'cancelled' ? 'bg-red-50 border-red-100' : 
                  'bg-blue-50 border-blue-100'
              }`}>
                 <h4 className={`font-bold mb-2 ${
                     booking.status === 'confirmed' ? 'text-green-900' : 
                     booking.status === 'cancelled' ? 'text-red-900' : 
                     'text-blue-900'
                 }`}>Quote Status</h4>
                 <p className={`text-sm mb-1 ${
                     booking.status === 'confirmed' ? 'text-green-700' : 
                     booking.status === 'cancelled' ? 'text-red-700' : 
                     'text-blue-700'
                 }`}>
                   Quote sent on {format(parseISO(booking.quote_sent_at), 'MMM dd, HH:mm')}
                 </p>
                 <p className={`text-sm font-medium ${
                     booking.status === 'confirmed' ? 'text-green-800' : 
                     booking.status === 'cancelled' ? 'text-red-800' : 
                     'text-blue-800'
                 }`}>
                   {booking.status === 'confirmed' ? 'Quote Accepted' : 
                    booking.status === 'cancelled' ? 'Quote/Booking Declined' : 
                    'Waiting for guest response.'}
                 </p>
              </div>
            )}

            {booking.room_booking_id && (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                 <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                   <Bed className="w-4 h-4" /> Guest Room
                 </h4>
                 <p className="text-sm text-purple-700 mb-3">
                   Linked to room booking <span className="font-mono font-bold">{formatBookingRef(booking.room_booking_id)}</span>
                 </p>
                 <button className="text-xs text-purple-600 hover:text-purple-800 underline">
                   View Room Booking
                 </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <QuoteModal 
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        booking={booking}
        onQuoteSent={() => {
          setShowQuoteModal(false)
          fetchBookingDetails()
        }}
      />

      {/* Cancel/Decline Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="bg-red-50 p-6 border-b border-red-100">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {booking.status === 'inquiry' ? 'Decline Inquiry' : 'Cancel Booking'}
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  {booking.status === 'inquiry' 
                    ? 'This will decline the event inquiry. The guest will be notified.'
                    : 'This will cancel the booking. This action cannot be undone.'}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason {booking.status === 'inquiry' ? '(optional)' : '*'}
                  </label>
                  <textarea
                    rows="3"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder={booking.status === 'inquiry' 
                      ? 'e.g., Date unavailable, venue under renovation...'
                      : 'Please provide a reason for cancellation...'}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCancelModal(false)
                      setCancelReason('')
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('cancelled', cancelReason)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    {booking.status === 'inquiry' ? 'Decline' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Bed(props) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  )
}

export default StaffFacilityBookingDetails
