import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, Users, CreditCard, Shield, CheckCircle,
  ArrowLeft, Bed, Wifi, Car, Coffee, MapPin,
  Star, Info, AlertCircle, Gift, Tag, X
} from 'lucide-react'
import { roomAPI, bookingAPI, paymentAPI, stripeAPI, loyaltyAPI, promotionsAPI } from '../../services/api'
import { format, differenceInDays, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

// Step Indicator component for desktop
const StepIndicator = ({ steps, currentStep, className }) => (
  <div className={`items-center ${className || ''}`}>
    {steps.map((step, index) => (
      <div key={index} className="flex items-center">
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index + 1 <= currentStep
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              index + 1 <= currentStep ? 'text-gray-800' : 'text-gray-500'
            }`}
          >
            {step}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div
            className={`w-12 h-0.5 mx-3 ${
              index + 1 < currentStep ? 'bg-primary-500' : 'bg-gray-200'
            }`}
          />
        )}
      </div>
    ))}
  </div>
)

// Step Indicator component for mobile (compact version)
const StepIndicatorCompact = ({ steps, currentStep, className }) => (
  <div className={`items-center gap-2 ${className || ''}`}>
    {steps.map((step, index) => (
      <div key={index} className="flex items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            index + 1 <= currentStep
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {index + 1}
        </div>
        {index < steps.length - 1 && (
          <div
            className={`w-6 h-0.5 mx-1 ${
              index + 1 < currentStep ? 'bg-primary-500' : 'bg-gray-200'
            }`}
          />
        )}
      </div>
    ))}
  </div>
)

const BookingPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const roomId = searchParams.get('room_id')
  const checkIn = searchParams.get('check_in')
  const checkOut = searchParams.get('check_out')
  const guests = searchParams.get('guests') || '2'
  
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Booking form data
  const [formData, setFormData] = useState({
    special_requests: '',
    payment_method: 'credit_card',
    card_number: '',
    card_name: '',
    card_expiry: '',
    card_cvv: ''
  })
  
  const [bookingSummary, setBookingSummary] = useState({
    nights: 0,
    roomPrice: 0,
    subtotal: 0,
    taxes: 0,
    total: 0
  })
  
  // Loyalty program state
  const [loyalty, setLoyalty] = useState(null)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [pointsDiscount, setPointsDiscount] = useState(0)

  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) {
      toast.error('Missing booking information. Please search for rooms again.')
      navigate('/rooms')
      return
    }
    
    fetchRoomDetails()
    fetchLoyaltyProfile()
  }, [roomId])
  
  useEffect(() => {
    if (room && checkIn && checkOut) {
      calculatePricing()
    }
  }, [room, checkIn, checkOut, loyalty, pointsToRedeem, promoDiscount])
  
  const fetchLoyaltyProfile = async () => {
    try {
      const response = await loyaltyAPI.getProfile()
      setLoyalty(response.data.data?.loyalty || null)
    } catch (error) {
      // User might not have loyalty program or not a guest
      console.log('No loyalty program found')
    }
  }

  const fetchRoomDetails = async () => {
    try {
      setLoading(true)
      const response = await roomAPI.getRoom(roomId)
      setRoom(response.data.data.room)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('Failed to load room details')
      navigate('/rooms')
    } finally {
      setLoading(false)
    }
  }

  const calculatePricing = () => {
    if (!room || !checkIn || !checkOut) return
    
    const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn))
    const roomPrice = room.price_per_night || 0
    const subtotal = roomPrice * nights
    
    // Calculate tier discount
    let tierDiscount = 0
    let tierPercent = 0
    if (loyalty) {
      const discounts = { bronze: 0, silver: 5, gold: 10, platinum: 15 }
      tierPercent = discounts[loyalty.tier] || 0
      tierDiscount = subtotal * (tierPercent / 100)
    }
    setLoyaltyDiscount(tierDiscount)
    
    // Points discount (1 point = 1 LKR)
    const ptsDiscount = Math.min(pointsToRedeem, loyalty?.points || 0)
    setPointsDiscount(ptsDiscount)
    
    const discountedSubtotal = subtotal - tierDiscount - ptsDiscount - promoDiscount
    const taxes = discountedSubtotal * 0.12 // 12% tax
    const total = discountedSubtotal + taxes
    
    setBookingSummary({
      nights,
      roomPrice,
      subtotal,
      tierPercent,
      tierDiscount,
      pointsDiscount: ptsDiscount,
      promoDiscount,
      pointsToEarn: Math.floor(total / 1000) * 10,
      taxes,
      total: Math.max(0, total)
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code')
      return
    }
    
    setPromoLoading(true)
    setPromoError('')
    
    try {
      const response = await promotionsAPI.validatePromoCode({
        promo_code: promoCode.toUpperCase(),
        booking_amount: bookingSummary.subtotal,
        branch_id: room?.branch_id
      })
      
      const result = response.data.data
      
      if (result.valid) {
        setPromoDiscount(result.discount)
        setAppliedPromo(result.promotion)
        toast.success(`Promo code applied! You save ${formatPrice(result.discount)}`)
      } else {
        setPromoError(result.message || 'Invalid promo code')
        setPromoDiscount(0)
        setAppliedPromo(null)
      }
    } catch (error) {
      setPromoError(error.response?.data?.message || 'Failed to validate promo code')
      setPromoDiscount(0)
      setAppliedPromo(null)
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromoCode = () => {
    setPromoCode('')
    setPromoDiscount(0)
    setAppliedPromo(null)
    setPromoError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please login to make a booking')
      navigate('/login')
      return
    }

    setSubmitting(true)
    
    try {
      const bookingData = {
        room_id: parseInt(roomId),
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: parseInt(guests),
        special_requests: formData.special_requests || undefined,
        redeem_points: pointsToRedeem > 0 ? pointsToRedeem : undefined,
        promo_code: appliedPromo ? promoCode.toUpperCase() : undefined,
        promo_discount: promoDiscount > 0 ? promoDiscount : undefined
      }

      // Create booking
      const bookingResponse = await bookingAPI.createBooking(bookingData)
      const booking = bookingResponse.data.data.booking
      
      // Handle payment based on method
      if (formData.payment_method === 'credit_card') {
        // Redirect to Stripe Checkout for card payments
        const checkoutResponse = await stripeAPI.createCheckoutSession({
          booking_id: booking.booking_id,
          promo_code: appliedPromo ? promoCode.toUpperCase() : undefined,
          promo_discount: promoDiscount > 0 ? promoDiscount : undefined
        })
        
        // Redirect to Stripe hosted checkout page
        window.location.href = checkoutResponse.data.data.checkout_url
        return
      }
      
      // For cash payments, booking stays pending until staff collects payment at check-in
      if (formData.payment_method === 'cash') {
        toast.success('Booking created! Pay at hotel reception during check-in.')
        navigate(`/bookings/${booking.booking_id}`)
        return
      }
      
      // For any other payment method, navigate to booking
      toast.success('Booking created!')
      navigate(`/bookings/${booking.booking_id}`)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error.response?.data?.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
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
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Room not found</h2>
          <p className="text-gray-600 mb-6">The room you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/rooms')} className="btn btn-primary">
            Search Rooms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Search
        </button>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator 
            steps={['Room Selection', 'Guest Details', 'Confirmation']} 
            currentStep={2} 
            className="hidden md:flex"
          />
          <StepIndicatorCompact 
            steps={['Selection', 'Details', 'Confirm']} 
            currentStep={2} 
            className="flex md:hidden justify-center"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 lg:pb-0">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Your Selection
              </h2>
              
              <div className="flex gap-4">
                {/* Room Image */}
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-primary-200 to-lavender-200 flex-shrink-0">
                  {room.image_urls && room.image_urls[0] ? (
                    <img
                      src={room.image_urls[0]}
                      alt={room.room_number}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-8 w-8 text-primary-400" />
                    </div>
                  )}
                </div>

                {/* Room Details */}
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-gray-800 mb-2">
                    {room.room_type?.charAt(0).toUpperCase() + room.room_type?.slice(1)} Room
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Room {room.room_number} • Floor {room.floor}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {guests} Guest{guests > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {room.capacity} Bed{room.capacity > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {checkIn && format(parseISO(checkIn), 'MMM dd, yyyy')}
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {checkOut && format(parseISO(checkOut), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatPrice(room.price_per_night)}
                  </p>
                  <p className="text-sm text-gray-500">per night</p>
                </div>
              </div>
            </motion.div>

            {/* Guest Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Guest Information
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.full_name || ''}
                      className="input bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    rows={4}
                    className="input"
                    placeholder="Any special requests or preferences..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Loyalty Rewards */}
            {loyalty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Gift className="h-24 w-24" />
                </div>
                
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-4 flex items-center relative z-10">
                  <Gift className="h-6 w-6 mr-2 text-primary-500" />
                  Loyalty Rewards
                </h2>
                
                <div className="space-y-6 relative z-10">
                  {/* Status & Tier Discount */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-white rounded-xl border border-primary-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${
                          loyalty.tier === 'platinum' ? 'badge-primary' : 
                          loyalty.tier === 'gold' ? 'badge-warning' : 
                          'badge-secondary'
                        }`}>
                          {loyalty.tier.charAt(0).toUpperCase() + loyalty.tier.slice(1)} Member
                        </span>
                        {bookingSummary.tierPercent > 0 && (
                          <span className="text-sm font-bold text-green-600">
                            {bookingSummary.tierPercent}% Off Applied!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Balance: <span className="font-bold text-gray-800">{loyalty.points} points</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Earning</p>
                      <p className="font-bold text-primary-600">+{bookingSummary.pointsToEarn} pts</p>
                    </div>
                  </div>
                  
                  {/* Points Redemption */}
                  {loyalty.points > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                        <span>Redeem Points</span>
                        <span className="text-sm text-gray-500">{pointsToRedeem} pts = {formatPrice(pointsToRedeem)}</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max={Math.min(loyalty.points, bookingSummary.subtotal)} 
                        step="100"
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                        className="range range-primary w-full" 
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0</span>
                        <span>{Math.min(loyalty.points, bookingSummary.subtotal)} pts</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Promo Code Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-display font-bold text-gray-800 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-primary-500" />
                Promo Code
              </h2>
              
              {appliedPromo ? (
                <div className="flex items-center justify-between p-4 bg-mint-50 rounded-xl border border-mint-200">
                  <div>
                    <p className="font-semibold text-mint-700">{appliedPromo.title}</p>
                    <p className="text-sm text-mint-600">
                      Code: <span className="font-mono font-bold">{promoCode.toUpperCase()}</span> ({appliedPromo.discount_percentage}% off)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-mint-700">-{formatPrice(promoDiscount)}</span>
                    <button
                      onClick={removePromoCode}
                      className="text-gray-500 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-mono uppercase"
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      disabled={promoLoading}
                      className="btn btn-secondary px-6"
                    >
                      {promoLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-red-500 text-sm mt-2">{promoError}</p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4 flex items-center">
                <CreditCard className="h-6 w-6 mr-2" />
                Payment Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="credit_card">Credit/Debit Card</option>
                    <option value="cash">Cash on Arrival</option>
                  </select>
                </div>

                {formData.payment_method === 'credit_card' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Secure Payment</p>
                        <p className="text-sm text-blue-600">
                          You will be redirected to Stripe's secure checkout page to complete your payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 sticky top-8"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-6">
                Booking Summary
              </h2>

              {/* Pricing Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {formatPrice(bookingSummary.roomPrice)} × {bookingSummary.nights} night{bookingSummary.nights !== 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">{formatPrice(bookingSummary.subtotal)}</span>
                </div>
                
                {bookingSummary.tierDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Loyalty Discount ({bookingSummary.tierPercent}%)</span>
                    <span className="font-medium">-{formatPrice(bookingSummary.tierDiscount)}</span>
                  </div>
                )}
                
                {bookingSummary.pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Points Redeemed</span>
                    <span className="font-medium">-{formatPrice(bookingSummary.pointsDiscount)}</span>
                  </div>
                )}
                
                {bookingSummary.promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount</span>
                    <span className="font-medium">-{formatPrice(bookingSummary.promoDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Fees</span>
                  <span className="font-medium">{formatPrice(bookingSummary.taxes)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(bookingSummary.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 p-3 bg-mint-50 rounded-xl mb-6">
                <Shield className="h-5 w-5 text-mint-600" />
                <span className="text-sm text-mint-700 font-medium">
                  Secure Payment
                </span>
              </div>

              {/* Submit Button (Desktop) */}
              <form onSubmit={handleSubmit} className="hidden lg:block">
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="btn btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm Booking
                    </span>
                  )}
                </button>
              </form>

              {!user && (
                <p className="text-sm text-center text-gray-600 mt-4">
                  <a href="/login" className="text-primary-600 hover:underline">
                    Login
                  </a> to continue
                </p>
              )}

              {/* Cancellation Policy */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Cancellation Policy
                </h3>
                <p className="text-xs text-gray-600">
                  Free cancellation up to 24 hours before check-in. 
                  No refund for cancellations within 24 hours.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg lg:hidden z-50">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-primary-600">
              {formatPrice(bookingSummary.total)}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !user}
            className="btn btn-primary px-8 py-3 rounded-full shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
