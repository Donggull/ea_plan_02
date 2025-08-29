import React from 'react'
import { cn } from '@/lib/utils'

interface Enhanced ButtonProps {
  variant?: string
  size?: string
  loading?: boolean
  fullWidth?: boolean
} {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    children, 
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    loadingText,
    disabled, 
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading
    
    const baseClasses = cn(
      // Base styles
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      // Hover and active states
      'hover:scale-[0.98] active:scale-[0.96]',
      // Full width
      fullWidth && 'w-full',
      // Loading state
      loading && 'cursor-wait'
    )
    
    const variantClasses = {
      primary: cn(
        'bg-[hsl(var(--color-primary-500))] text-white shadow-sm',
        'hover:bg-[hsl(var(--color-primary-600))]',
        'focus-visible:ring-[hsl(var(--color-primary-500))]',
        'active:bg-[hsl(var(--color-primary-700))]'
      ),
      secondary: cn(
        'bg-[hsl(var(--color-secondary-100))] text-[hsl(var(--color-secondary-900))] shadow-sm',
        'hover:bg-[hsl(var(--color-secondary-200))]',
        'focus-visible:ring-[hsl(var(--color-secondary-500))]'
      ),
      outline: cn(
        'border-2 border-[hsl(var(--color-primary-500))] text-[hsl(var(--color-primary-500))] bg-transparent',
        'hover:bg-[hsl(var(--color-primary-50))]',
        'focus-visible:ring-[hsl(var(--color-primary-500))]',
        'active:bg-[hsl(var(--color-primary-100))]'
      ),
      ghost: cn(
        'text-[hsl(var(--color-primary-500))] bg-transparent',
        'hover:bg-[hsl(var(--color-primary-50))]',
        'focus-visible:ring-[hsl(var(--color-primary-500))]'
      ),
      destructive: cn(
        'bg-red-500 text-white shadow-sm',
        'hover:bg-red-600',
        'focus-visible:ring-red-500',
        'active:bg-red-700'
      )
    }
    
    const sizeClasses = {
      xs: 'h-7 px-2 text-xs rounded-md gap-1',
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
      md: 'h-10 px-4 text-base rounded-lg gap-2',
      lg: 'h-12 px-6 text-lg rounded-lg gap-2.5',
      xl: 'h-14 px-8 text-xl rounded-xl gap-3'
    }

    const LoadingSpinner = () => (
      <svg 
        className="animate-spin h-4 w-4" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-describedby={loading ? 'loading-description' : undefined}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span className="truncate">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
        
        {loading && (
          <span id="loading-description" className="sr-only">
            Loading, please wait
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button