import React from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  duration?: number
  onClose?: () => void
  className?: string
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, variant = 'default', duration = 5000, onClose, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          onClose?.()
        }, duration)
        return () => clearTimeout(timer)
      }
    }, [duration, onClose])

    const variantClasses = {
      default: 'bg-white border-[hsl(var(--color-secondary-300))]',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200'
    }

    const iconClasses = {
      default: 'text-[hsl(var(--color-secondary-500))]',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500'
    }

    const getIcon = () => {
      switch (variant) {
        case 'success':
          return (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        case 'warning':
          return (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        case 'error':
          return (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        default:
          return (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
      }
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          'fixed top-4 right-4 z-50 max-w-sm w-full',
          'border rounded-lg shadow-lg p-4',
          'animate-in slide-in-from-top-2 fade-in-0 duration-300',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start space-x-3">
          <div className={cn('flex-shrink-0', iconClasses[variant])}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                {title}
              </h4>
            )}
            {description && (
              <p className="text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false)
                onClose()
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }
)

Toast.displayName = 'Toast'

export default Toast