import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: string
  size?: string
} {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variantClasses = {
      primary: 'bg-[hsl(var(--color-primary-500))] text-white hover:bg-[hsl(var(--color-primary-600))]',
      secondary: 'bg-[hsl(var(--color-secondary-200))] text-[hsl(var(--color-secondary-900))] hover:bg-[hsl(var(--color-secondary-300))]',
      outline: 'border border-[hsl(var(--color-primary-500))] text-[hsl(var(--color-primary-500))] hover:bg-[hsl(var(--color-primary-50))]',
      ghost: 'text-[hsl(var(--color-primary-500))] hover:bg-[hsl(var(--color-primary-50))]'
    }
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-base rounded-lg',
      lg: 'h-12 px-6 text-lg rounded-lg'
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button