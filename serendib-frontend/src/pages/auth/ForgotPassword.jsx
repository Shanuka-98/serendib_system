import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Hotel, CheckCircle } from 'lucide-react'
import { authAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (error) {
      toast.error('Failed to send reset link')
    }
    
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-peach-50 to-lavender-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 shadow-2xl max-w-md text-center"
        >
          <CheckCircle className="h-16 w-16 text-mint-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link to="/login">
            <button className="btn btn-primary w-full">Back to Login</button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-peach-50 to-lavender-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-lavender-500 rounded-2xl mb-4 shadow-lg">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-4 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage

