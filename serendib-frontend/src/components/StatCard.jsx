/**
 * Stat Card Component
 * Dashboard statistics display with trend indicators
 */

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendLabel, 
  color = 'primary',
  loading = false 
}) {
  // Color variants
  const colorVariants = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-500',
      text: 'text-primary-600',
    },
    mint: {
      bg: 'bg-mint-50',
      icon: 'bg-mint-500',
      text: 'text-mint-600',
    },
    peach: {
      bg: 'bg-peach-50',
      icon: 'bg-peach-500',
      text: 'text-peach-600',
    },
    lavender: {
      bg: 'bg-lavender-50',
      icon: 'bg-lavender-500',
      text: 'text-lavender-600',
    },
  }

  const colors = colorVariants[color] || colorVariants.primary

  // Trend display
  const getTrendDisplay = () => {
    if (trend === undefined || trend === null) return null
    
    const isPositive = trend > 0
    const isNegative = trend < 0
    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
    
    return (
      <div className={`
        flex items-center gap-1 text-xs font-medium
        ${isPositive ? 'text-mint-600' : isNegative ? 'text-red-500' : 'text-gray-500'}
      `}>
        <TrendIcon className="w-3.5 h-3.5" />
        <span>{Math.abs(trend)}%</span>
        {trendLabel && <span className="text-gray-400 ml-1">{trendLabel}</span>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-soft">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        {getTrendDisplay()}
      </div>

      {/* Value */}
      <div className="mb-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {value}
        </h3>
      </div>

      {/* Title & Subtitle */}
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}

// Grid wrapper for stat cards
export function StatCardGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  )
}

// Quick stat for inline display
export function QuickStat({ label, value, color = 'primary' }) {
  const colorClasses = {
    primary: 'text-primary-600',
    mint: 'text-mint-600',
    peach: 'text-peach-600',
    lavender: 'text-lavender-600',
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-bold ${colorClasses[color]}`}>{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  )
}

export default StatCard
