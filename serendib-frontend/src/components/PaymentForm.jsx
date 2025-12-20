/**
 * Payment Form Component
 * Stripe card input with validation and processing
 */

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { stripeAPI } from '../services/api'

// Card element styling options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
}

export function PaymentForm({ booking, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)

  const handleCardChange = (event) => {
    setCardComplete(event.complete)
    if (event.error) {
      setError(event.error.message)
    } else {
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Create payment intent on backend
      const intentResponse = await stripeAPI.createPaymentIntent({
        booking_id: booking.booking_id,
        amount: booking.total_amount,
      })

      const { clientSecret, paymentIntentId } = intentResponse.data.data

      // 2. Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: booking.user?.full_name || 'Guest',
              email: booking.user?.email,
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message)
        onError?.(stripeError)
      } else if (paymentIntent.status === 'succeeded') {
        // 3. Confirm payment on backend
        await stripeAPI.confirmPayment({
          payment_intent_id: paymentIntentId,
          booking_id: booking.booking_id,
        })

        setSuccess(true)
        onSuccess?.(paymentIntent)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed'
      setError(errorMessage)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Payment Successful!
        </h3>
        <p className="text-green-600">
          Your booking has been confirmed. Check your email for details.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Input Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Card Details</h3>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <CardElement 
            options={cardElementOptions} 
            onChange={handleCardChange}
          />
        </div>
        
        <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Your payment is secured with 256-bit encryption
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Payment Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={!stripe || loading || !cardComplete}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className={`
          w-full py-4 rounded-xl font-semibold text-lg
          flex items-center justify-center gap-3
          transition-all duration-200
          ${loading || !cardComplete
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pay LKR {booking.total_amount?.toLocaleString() || '0.00'}
          </>
        )}
      </motion.button>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 pt-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>Powered by Stripe</span>
        </div>
      </div>
    </form>
  )
}

export default PaymentForm
