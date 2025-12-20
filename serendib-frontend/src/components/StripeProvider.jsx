/**
 * Stripe Provider Component
 * Wraps the app with Stripe Elements for payment processing
 */

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

// Load Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Stripe Elements appearance customization
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0284c7',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
    '.Input:focus': {
      border: '1px solid #0284c7',
      boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.1)',
    },
  },
}

export function StripeProvider({ children }) {
  const options = {
    appearance,
    locale: 'en',
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}

export default StripeProvider
