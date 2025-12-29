import React from 'react'
import { Loader2 } from 'lucide-react'

export const LoadingSpinner = ({ size = 'medium', className = '', fullScreen = false }) => {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  }

  const spinner = (
    <Loader2 
      className={`animate-spin text-primary-600 ${sizes[size] || sizes.medium} ${className}`} 
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return <div className="flex justify-center p-4">{spinner}</div>
}
