import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  className?: string
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', rounded = false, className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[hsl(var(--color-secondary-100))] text-[hsl(var(--color-secondary-800))]',
      primary: 'bg-[hsl(var(--color-primary-100))] text-[hsl(var(--color-primary-800))]',
      secondary: 'bg-[hsl(var(--color-secondary-100))] text-[hsl(var(--color-secondary-800))]',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium',
          variantClasses[variant],
          sizeClasses[size],
          rounded ? 'rounded-full' : 'rounded-md',
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge