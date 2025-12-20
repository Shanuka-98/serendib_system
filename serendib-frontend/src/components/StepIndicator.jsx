/**
 * Step Indicator Component
 * Shows progress through multi-step forms like booking and checkout
 */

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function StepIndicator({ steps, currentStep, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isUpcoming = stepNumber > currentStep

        return (
          <div key={step} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold text-sm transition-all duration-300
                  ${isCompleted 
                    ? 'bg-mint-500 text-white' 
                    : isCurrent 
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100' 
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  stepNumber
                )}
              </motion.div>
              
              {/* Step Label */}
              <span 
                className={`
                  mt-2 text-sm font-medium hidden sm:block
                  ${isCurrent ? 'text-primary-600' : 'text-gray-500'}
                `}
              >
                {step}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-12 sm:w-24 mx-2 sm:mx-4 h-0.5 bg-gray-200 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-mint-500"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Compact version for mobile
export function StepIndicatorCompact({ steps, currentStep, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {steps.map((_, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <motion.div
            key={index}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`
              h-2 rounded-full transition-all duration-300
              ${isCurrent ? 'w-8 bg-primary-500' : 'w-2'}
              ${isCompleted ? 'bg-mint-500' : 'bg-gray-300'}
            `}
          />
        )
      })}
      <span className="ml-2 text-sm text-gray-600">
        Step {currentStep} of {steps.length}
      </span>
    </div>
  )
}

export default StepIndicator
