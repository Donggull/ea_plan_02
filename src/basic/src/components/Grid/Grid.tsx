import React from 'react'
import { cn } from '@/lib/utils'

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  }
  className?: string
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, cols = 1, gap = 'md', responsive, className, ...props }, ref) => {
    const colsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12'
    }

    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }

    const responsiveClasses = responsive ? [
      responsive.sm && `sm:${colsClasses[responsive.sm]}`,
      responsive.md && `md:${colsClasses[responsive.md]}`,
      responsive.lg && `lg:${colsClasses[responsive.lg]}`,
      responsive.xl && `xl:${colsClasses[responsive.xl]}`
    ].filter(Boolean).join(' ') : ''

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          colsClasses[cols],
          gapClasses[gap],
          responsiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'

export default Grid