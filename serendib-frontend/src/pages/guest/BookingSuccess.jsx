/**
 * Booking Success Page
 * Shown after successful Stripe checkout redirect
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, Home, Loader2 } from 'lucide-react'
import { stripeAPI, bookingAPI } from '../../services/api'
import { toast } from 'react-toastify'

const BookingSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const hasConfirmed = useRef(false)

  const bookingId = searchParams.get('booking_id')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasConfirmed.current) return
    
    if (bookingId && sessionId) {
      hasConfirmed.current = true
      confirmPayment()
    } else {
      setError('Missing booking information')
      setLoading(false)
    }
  }, [bookingId, sessionId])

  const confirmPayment = async () => {
    try {
      // Confirm payment with backend
      await stripeAPI.confirmPayment({
        session_id: sessionId,
        booking_id: parseInt(bookingId)
      })

      // Fetch booking details
      const response = await bookingAPI.getBooking(bookingId)
      setBooking(response.data.data.booking)
      toast.success('Payment successful! Your booking is confirmed.')
    } catch (error) {
      console.error('Error confirming payment:', error)
      // Even if confirm fails, the webhook might have already processed it
      // Try to fetch the booking anyway
      try {
        const response = await bookingAPI.getBooking(bookingId)
        setBooking(response.data.data.booking)
      } catch (fetchError) {
        setError('Unable to verify payment. Please check your bookings.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-display font-bold text-gray-800 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/bookings" className="btn btn-primary">
            View My Bookings
          </Link>
        </div>
      </div>
    )
  }

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
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your reservation. A confirmation email has been sent.
          </p>

          {booking && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
              <p className="text-xl font-bold text-primary-600 mb-3">
                #{booking.booking_id}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {booking.check_in_date} - {booking.check_out_date}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              to={`/bookings/${bookingId}`}
              className="btn btn-primary w-full"
            >
              View Booking Details
            </Link>
            <Link
              to="/"
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
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

export default BookingSuccess
