/**
 * Modal Component
 * Reusable animated modal dialog with backdrop
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true,
  className = '',
  headerIcon: HeaderIcon = null,
  align = 'center',
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex justify-center p-4 ${
          align === 'top' ? 'items-start pt-20' : 'items-center'
        }`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`
              relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden
              ${sizeClasses[size]} ${className}
            `}
          >
            {/* Header with gradient */}
            {(title || showClose) && (
              <div className="bg-gradient-to-r from-primary-500 to-lavender-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  {title && (
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {HeaderIcon && <HeaderIcon className="w-5 h-5" />}
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  )}
                </div>
              </div>
            )}
            
            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Confirmation modal with actions
export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" align="top">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {cancelText}
        </button>
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
        >
          {loading ? 'Processing...' : confirmText}
        </motion.button>
      </div>
    </Modal>
  )
}

export default Modal
