import React from 'react'
import { cn } from '@/lib/utils'

interface BannerProps {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ 
    children, 
    variant = 'info', 
    size = 'md',
    dismissible = false,
    onDismiss,
    icon,
    actions,
    className,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    const variantClasses = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800'
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          'border-l-4 rounded-r-lg',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1">{children}</div>
          </div>
          
          <div className="flex items-center space-x-2">
            {actions && <div>{actions}</div>}
            
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

Banner.displayName = 'Banner'

export default Banner