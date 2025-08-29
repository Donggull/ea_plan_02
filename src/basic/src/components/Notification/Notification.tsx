import React from 'react'
import { cn } from '@/lib/utils'

interface NotificationProps {
  title: string
  message?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  duration?: number
  onClose?: () => void
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  className?: string
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ 
    title, 
    message, 
    variant = 'info', 
    position = 'top-right',
    duration = 0,
    onClose,
    actions,
    className,
    ...props 
  }, ref) => {
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

    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    }

    const variantClasses = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800'
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          'fixed z-50 max-w-sm w-full border rounded-lg shadow-lg p-4',
          'animate-in slide-in-from-top-2 fade-in-0 duration-300',
          positionClasses[position],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">
              {title}
            </h4>
            {message && (
              <p className="text-sm opacity-90">
                {message}
              </p>
            )}
            
            {actions && actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded transition-colors',
                      action.variant === 'primary'
                        ? 'bg-current text-white'
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false)
                onClose()
              }}
              className="ml-3 text-current opacity-60 hover:opacity-100 transition-opacity"
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

Notification.displayName = 'Notification'

export default Notification