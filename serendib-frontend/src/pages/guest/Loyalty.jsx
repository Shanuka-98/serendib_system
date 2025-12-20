import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Star, Gift, TrendingUp, Sparkles, Crown } from 'lucide-react'
import { loyaltyAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const LoyaltyPage = () => {
  const { user } = useAuth()
  const [loyalty, setLoyalty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState('')

  useEffect(() => {
    fetchLoyaltyProfile()
  }, [])

  const fetchLoyaltyProfile = async () => {
    try {
      setLoading(true)
      const response = await loyaltyAPI.getProfile()
      setLoyalty(response.data.data)
    } catch (error) {
      console.error('Error fetching loyalty:', error)
      toast.error('Failed to load loyalty profile')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (e) => {
    e.preventDefault()
    try {
      await loyaltyAPI.redeemPoints(parseInt(redeemPoints))
      toast.success('Points redeemed successfully!')
      setRedeemPoints('')
      fetchLoyaltyProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem points')
    }
  }

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-orange-400 to-orange-600',
      silver: 'from-gray-300 to-gray-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600'
    }
    return colors[tier] || colors.bronze
  }

  const getTierIcon = (tier) => {
    if (tier === 'platinum') return Crown
    if (tier === 'gold') return Star
    return Award
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loyalty profile...</p>
        </div>
      </div>
    )
  }

  if (!loyalty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">
            No Loyalty Profile
          </h2>
          <p className="text-gray-600">Your loyalty profile will be created after your first booking.</p>
        </div>
      </div>
    )
  }

  const TierIcon = getTierIcon(loyalty.tier)
  const nextTier = loyalty.next_tier
  const pointsNeeded = loyalty.points_to_next_tier || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-display font-bold text-gray-800 mb-8">
          Loyalty Program
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tier Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`lg:col-span-2 glass rounded-2xl p-8 bg-gradient-to-br ${getTierColor(loyalty.tier)} text-white`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <TierIcon className="h-8 w-8" />
                  <h2 className="text-3xl font-display font-bold">
                    {loyalty.tier?.charAt(0).toUpperCase() + loyalty.tier?.slice(1)} Member
                  </h2>
                </div>
                <p className="text-white/80">Since {new Date(loyalty.join_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-white/80 mb-1">Current Points</p>
                <p className="text-4xl font-bold">{loyalty.points || 0}</p>
              </div>
              <div>
                <p className="text-white/80 mb-1">Lifetime Points</p>
                <p className="text-4xl font-bold">{loyalty.lifetime_points || 0}</p>
              </div>
            </div>

            {nextTier && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Progress to {nextTier}</span>
                  <span className="font-semibold">{pointsNeeded} points needed</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white rounded-full h-3 transition-all"
                    style={{
                      width: `${Math.min(100, ((loyalty.lifetime_points || 0) / (loyalty.lifetime_points + pointsNeeded)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Benefits Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-display font-bold text-gray-800 mb-4 flex items-center">
              <Gift className="h-5 w-5 mr-2 text-lavender-500" />
              Your Benefits
            </h3>
            <ul className="space-y-3">
              {loyalty.benefits?.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Sparkles className="h-4 w-4 text-lavender-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Redeem Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <h3 className="text-2xl font-display font-bold text-gray-800 mb-4">
            Redeem Points
          </h3>
          <form onSubmit={handleRedeem} className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                className="input"
                placeholder="Enter points to redeem"
                min="100"
                max={loyalty.points}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                100 points = 100 LKR discount • Available: {loyalty.points} points
              </p>
            </div>
            <button
              type="submit"
              disabled={!redeemPoints || parseInt(redeemPoints) > loyalty.points}
              className="btn btn-primary disabled:opacity-50"
            >
              Redeem
            </button>
          </form>
        </motion.div>

        {/* Tiers Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-2xl font-display font-bold text-gray-800 mb-6">
            Membership Tiers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['bronze', 'silver', 'gold', 'platinum'].map((tier) => {
              const isCurrent = loyalty.tier === tier
              return (
                <div
                  key={tier}
                  className={`p-4 rounded-xl border-2 ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {tier === 'platinum' ? (
                      <Crown className="h-5 w-5 text-purple-500" />
                    ) : tier === 'gold' ? (
                      <Star className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Award className="h-5 w-5 text-orange-500" />
                    )}
                    <h4 className="font-bold text-gray-800 capitalize">{tier}</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    {tier === 'bronze' && '0+ points'}
                    {tier === 'silver' && '1,000+ points'}
                    {tier === 'gold' && '3,000+ points'}
                    {tier === 'platinum' && '5,000+ points'}
                  </p>
                  {isCurrent && (
                    <span className="badge badge-primary mt-2">Current</span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoyaltyPage
