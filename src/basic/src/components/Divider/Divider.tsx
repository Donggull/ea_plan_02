import React from 'react'
import { cn } from '@/lib/utils'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  variant?: 'solid' | 'dashed' | 'dotted'
  thickness?: 'thin' | 'medium' | 'thick'
  color?: 'light' | 'medium' | 'dark'
  className?: string
  children?: React.ReactNode
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ 
    orientation = 'horizontal', 
    variant = 'solid', 
    thickness = 'thin',
    color = 'medium',
    className, 
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'flex items-center'
    
    const orientationClasses = {
      horizontal: 'w-full',
      vertical: 'h-full flex-col'
    }

    const variantClasses = {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted'
    }

    const thicknessClasses = {
      thin: orientation === 'horizontal' ? 'border-t' : 'border-l',
      medium: orientation === 'horizontal' ? 'border-t-2' : 'border-l-2',
      thick: orientation === 'horizontal' ? 'border-t-4' : 'border-l-4'
    }

    const colorClasses = {
      light: 'border-[hsl(var(--color-secondary-200))]',
      medium: 'border-[hsl(var(--color-secondary-300))]',
      dark: 'border-[hsl(var(--color-secondary-500))]'
    }

    const lineClasses = cn(
      'flex-1',
      variantClasses[variant],
      thicknessClasses[thickness],
      colorClasses[color]
    )

    if (!children) {
      return (
        <div
          ref={ref}
          className={cn(
            lineClasses,
            orientationClasses[orientation],
            className
          )}
          {...props}
        />
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          orientationClasses[orientation],
          className
        )}
        {...props}
      >
        <div className={lineClasses} />
        <div className={cn(
          'px-3 text-sm text-[hsl(var(--color-secondary-500))] font-medium',
          orientation === 'vertical' && 'py-3 px-0'
        )}>
          {children}
        </div>
        <div className={lineClasses} />
      </div>
    )
  }
)

Divider.displayName = 'Divider'

export default Divider