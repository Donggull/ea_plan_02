import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled'
  inputSize?: 'sm' | 'md' | 'lg'
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', inputSize = 'md', type = 'text', label, error, ...props }, ref) => {
    const baseClasses = 'w-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'
    
    const variantClasses = {
      default: 'border-[hsl(var(--color-secondary-300))] bg-white focus:border-[hsl(var(--color-primary-500))] focus:ring-[hsl(var(--color-primary-500))]',
      filled: 'border-transparent bg-[hsl(var(--color-secondary-100))] focus:bg-white focus:border-[hsl(var(--color-primary-500))] focus:ring-[hsl(var(--color-primary-500))]'
    }
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-base rounded-lg',
      lg: 'h-12 px-5 text-lg rounded-lg'
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[hsl(var(--color-secondary-700))]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[inputSize],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input