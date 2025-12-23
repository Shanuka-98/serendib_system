/**
 * Booking Cancel Page
 * Shown when user cancels Stripe checkout
 */

import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, ArrowLeft, Home } from 'lucide-react'

const BookingCancel = () => {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="glass rounded-3xl p-8 text-center shadow-xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-12 h-12 text-orange-500" />
          </motion.div>

          <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. Your booking has been saved but is pending payment.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your booking will be held for 24 hours. 
              Please complete payment to confirm your reservation.
            </p>
          </div>

          <div className="space-y-3">
            {bookingId && (
              <Link
                to={`/bookings/${bookingId}`}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Complete Payment
              </Link>
            )}
            <Link
              to="/bookings"
              className="btn btn-secondary w-full"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingCancel
