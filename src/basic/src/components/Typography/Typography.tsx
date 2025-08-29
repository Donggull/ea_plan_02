import React from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'code'
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ variant = 'body', children, className, as, ...props }, ref) => {
    const variantClasses = {
      h1: 'text-4xl font-bold text-gray-900 leading-tight',
      h2: 'text-3xl font-bold text-gray-800 leading-tight',
      h3: 'text-2xl font-semibold text-gray-700 leading-tight',
      h4: 'text-xl font-medium text-gray-700 leading-tight',
      body: 'text-base text-gray-600 leading-relaxed',
      small: 'text-sm text-gray-500 leading-relaxed',
      code: 'font-mono text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded'
    }

    const defaultElement = {
      h1: 'h1',
      h2: 'h2', 
      h3: 'h3',
      h4: 'h4',
      body: 'p',
      small: 'span',
      code: 'code'
    }

    const Component = (as || defaultElement[variant]) as keyof JSX.IntrinsicElements

    return (
      <Component
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Typography.displayName = 'Typography'

export default Typography