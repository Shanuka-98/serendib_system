/**
 * Animation Utilities for Framer Motion
 * Reusable animation variants and wrapper components
 */

import { motion } from 'framer-motion'

// Animation variants for page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// Stagger container for animating children
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Fade up animation for list items
export const fadeUpVariant = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Scale in animation for cards
export const scaleInVariant = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Slide in from left
export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Slide in from right
export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Button hover and tap animations
export const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
}

// Card hover animation
export const cardHoverVariants = {
  rest: { y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  hover: {
    y: -8,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Animated Page wrapper component
export function AnimatedPage({ children, className = '' }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animated card component with hover effect
export function AnimatedCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={cardHoverVariants}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Fade in when visible (scroll animation)
export function FadeInWhenVisible({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger children animation wrapper
export function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animated button component
export function AnimatedButton({ children, className = '', onClick, type = 'button', disabled = false }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

// Loading spinner with rotation
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} border-2 border-gray-200 border-t-primary-500 rounded-full ${className}`}
    />
  )
}

export default {
  pageVariants,
  staggerContainer,
  fadeUpVariant,
  scaleInVariant,
  slideInLeft,
  slideInRight,
  buttonVariants,
  cardHoverVariants,
  AnimatedPage,
  AnimatedCard,
  FadeInWhenVisible,
  StaggerContainer,
  AnimatedButton,
  LoadingSpinner,
}
