import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  className?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white',
      outlined: 'bg-white border border-[hsl(var(--color-secondary-300))]',
      elevated: 'bg-white shadow-lg'
    }

    return (
      <div
        ref={ref}
        className={cn('rounded-lg p-6', variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card