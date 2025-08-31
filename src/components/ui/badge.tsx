import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-gray-300 bg-white text-gray-900'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }