import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'flushed' | 'outline'
  inputSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant = 'default', 
    inputSize = 'md', 
    type = 'text',
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    clearable = false,
    onClear,
    value,
    disabled,
    required,
    id,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const inputId = id || React.useId()
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helper ? `${inputId}-helper` : undefined
    const describedBy = [errorId, helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined

    const baseClasses = cn(
      'w-full transition-all duration-200 font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'placeholder:text-[hsl(var(--color-secondary-400))]'
    )
    
    const variantClasses = {
      default: cn(
        'border-2 border-[hsl(var(--color-secondary-300))] bg-white rounded-lg',
        'hover:border-[hsl(var(--color-secondary-400))]',
        'focus:border-[hsl(var(--color-primary-500))] focus:ring-[hsl(var(--color-primary-500))]',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
      ),
      filled: cn(
        'bg-[hsl(var(--color-secondary-100))] border-2 border-transparent rounded-lg',
        'hover:bg-[hsl(var(--color-secondary-150))]',
        'focus:bg-white focus:border-[hsl(var(--color-primary-500))] focus:ring-[hsl(var(--color-primary-500))]',
        error && 'bg-red-50 focus:border-red-500 focus:ring-red-500'
      ),
      flushed: cn(
        'border-0 border-b-2 border-[hsl(var(--color-secondary-300))] rounded-none bg-transparent',
        'hover:border-[hsl(var(--color-secondary-400))]',
        'focus:border-[hsl(var(--color-primary-500))] focus:ring-0',
        error && 'border-red-500 focus:border-red-500'
      ),
      outline: cn(
        'border-2 border-[hsl(var(--color-primary-300))] bg-transparent rounded-lg',
        'hover:border-[hsl(var(--color-primary-400))]',
        'focus:border-[hsl(var(--color-primary-500))] focus:ring-[hsl(var(--color-primary-500))]',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
      )
    }
    
    const sizeClasses = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-5 text-lg',
      xl: 'h-14 px-6 text-xl'
    }

    const iconSizeClasses = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7'
    }

    const ClearButton = () => (
      <button
        type="button"
        onClick={onClear}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full',
          'text-[hsl(var(--color-secondary-400))] hover:text-[hsl(var(--color-secondary-600))]',
          'hover:bg-[hsl(var(--color-secondary-100))] transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-primary-500))]'
        )}
        aria-label="Clear input"
      >
        <svg className={iconSizeClasses[inputSize]} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-[hsl(var(--color-secondary-700))]',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-secondary-400))]',
              iconSizeClasses[inputSize]
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              leftIcon && 'pl-10',
              (rightIcon || (clearable && value)) && 'pr-10',
              className
            )}
            {...props}
          />
          
          {clearable && value && !rightIcon && <ClearButton />}
          
          {rightIcon && !clearable && (
            <div className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-secondary-400))]',
              iconSizeClasses[inputSize]
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p id={errorId} className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </p>
        )}
        
        {helper && !error && (
          <p id={helperId} className="text-sm text-[hsl(var(--color-secondary-500))]">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input