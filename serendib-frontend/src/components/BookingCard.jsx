/**
 * Booking Card Component
 * Displays booking information with status badges and actions
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calendar, MapPin, Users, Clock, CreditCard, 
  ChevronRight, X, CheckCircle, AlertCircle, Loader2
} from 'lucide-react'

// Status badge colors
const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-mint-100 text-mint-700 border-mint-200',
  checked_in: 'bg-primary-100 text-primary-700 border-primary-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-lavender-100 text-lavender-700 border-lavender-200',
}

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export function BookingCard({ booking, onCancel, showActions = true }) {
  const [cancelling, setCancelling] = useState(false)

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Calculate nights
  const calculateNights = () => {
    if (!booking.check_in_date || !booking.check_out_date) return 0
    const checkIn = new Date(booking.check_in_date)
    const checkOut = new Date(booking.check_out_date)
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  }

  const handleCancel = async () => {
    if (!onCancel) return
    setCancelling(true)
    try {
      await onCancel(booking.booking_id)
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = ['pending', 'confirmed'].includes(booking.status)
  const nights = calculateNights()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Header with Status */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-900">
            Booking #{booking.booking_id}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {booking.room?.room_type || 'Room'} - {booking.room?.room_number || 'N/A'}
          </p>
        </div>
        <span className={`
          px-3 py-1.5 rounded-full text-xs font-semibold border
          ${statusColors[booking.status] || statusColors.pending}
        `}>
          {statusLabels[booking.status] || booking.status}
        </span>
      </div>

      {/* Booking Details */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {/* Check-in */}
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Check-in
            </p>
            <p className="font-semibold text-gray-800 text-sm">
              {formatDate(booking.check_in_date)}
            </p>
          </div>

          {/* Check-out */}
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Check-out
            </p>
            <p className="font-semibold text-gray-800 text-sm">
              {formatDate(booking.check_out_date)}
            </p>
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Duration
            </p>
            <p className="font-semibold text-gray-800 text-sm">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          </div>

          {/* Guests */}
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Guests
            </p>
            <p className="font-semibold text-gray-800 text-sm">
              {booking.number_of_guests || 1} {booking.number_of_guests === 1 ? 'guest' : 'guests'}
            </p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Total Amount</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            LKR {(booking.total_amount || 0).toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3">
            <Link 
              to={`/my-bookings/${booking.booking_id}`}
              className="flex-1 btn btn-secondary text-center py-2.5 text-sm flex items-center justify-center gap-1"
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </Link>
            
            {canCancel && onCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Cancel
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Compact version for dashboard/list views
export function BookingCardCompact({ booking, onClick }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={() => onClick?.(booking)}
      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${booking.status === 'confirmed' ? 'bg-mint-100' : 'bg-primary-100'}
        `}>
          {booking.status === 'confirmed' ? (
            <CheckCircle className="w-5 h-5 text-mint-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-primary-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800 text-sm">
            {booking.room?.room_type || 'Room'} #{booking.room?.room_number}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </motion.div>
  )
}

export default BookingCard
