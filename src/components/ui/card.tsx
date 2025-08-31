import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  className?: string
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  className?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-white p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
)
CardContent.displayName = 'CardContent'

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold', className)} {...props}>
      {children}
    </h3>
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-600', className)} {...props}>
      {children}
    </p>
  )
)
CardDescription.displayName = 'CardDescription'

export { Card, CardContent, CardHeader, CardTitle, CardDescription }