/**
 * Empty State Component
 * Displays when no data is available with optional action
 */

import { motion } from 'framer-motion'
import { 
  Search, Calendar, FileText, Users, Inbox, 
  ShoppingBag, AlertCircle, CheckCircle 
} from 'lucide-react'

// Icon mapping
const icons = {
  search: Search,
  calendar: Calendar,
  file: FileText,
  users: Users,
  inbox: Inbox,
  cart: ShoppingBag,
  alert: AlertCircle,
  success: CheckCircle,
}

export function EmptyState({ 
  icon = 'inbox',
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  action,
  actionLabel = 'Get Started',
  variant = 'default',
  className = '',
}) {
  const Icon = typeof icon === 'string' ? icons[icon] || Inbox : icon

  const variantStyles = {
    default: {
      bg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      btnClass: 'btn btn-primary',
    },
    success: {
      bg: 'bg-mint-100',
      iconColor: 'text-mint-500',
      btnClass: 'btn btn-primary',
    },
    warning: {
      bg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
  }

  const styles = variantStyles[variant] || variantStyles.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 px-4 ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`w-20 h-20 ${styles.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
      >
        <Icon className={`w-10 h-10 ${styles.iconColor}`} />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action}
          className={`px-6 py-2.5 rounded-xl font-semibold ${styles.btnClass}`}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

// Compact inline empty state
export function InlineEmptyState({ message = 'No items', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-8 text-gray-400 ${className}`}>
      <Inbox className="w-5 h-5" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

// Error state
export function ErrorState({ 
  title = 'Something went wrong',
  description = 'We could not load the data. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 px-4 ${className}`}
    >
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white"
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  )
}

export default EmptyState
