import React from 'react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  current: number
  total: number
  pageSize?: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  onChange?: (page: number, pageSize?: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ 
    current, 
    total, 
    pageSize = 10,
    showSizeChanger = false,
    showQuickJumper = false,
    showTotal,
    onChange,
    onShowSizeChange,
    size = 'md',
    className,
    ...props 
  }, ref) => {
    const totalPages = Math.ceil(total / pageSize)
    const [jumpValue, setJumpValue] = React.useState('')

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }

    const buttonSizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg'
    }

    const getVisiblePages = () => {
      const delta = 2
      const range = []
      const rangeWithDots = []

      for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
        range.push(i)
      }

      if (current - delta > 2) {
        rangeWithDots.push(1, '...')
      } else {
        rangeWithDots.push(1)
      }

      rangeWithDots.push(...range)

      if (current + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages)
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages)
      }

      return rangeWithDots
    }

    const handlePageChange = (page: number) => {
      if (page !== current && page >= 1 && page <= totalPages) {
        onChange?.(page, pageSize)
      }
    }

    const handleJump = () => {
      const page = parseInt(jumpValue)
      if (page >= 1 && page <= totalPages) {
        handlePageChange(page)
        setJumpValue('')
      }
    }

    const start = (current - 1) * pageSize + 1
    const end = Math.min(current * pageSize, total)

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showTotal && (
          <div className="text-[hsl(var(--color-secondary-600))]">
            {showTotal(total, [start, end])}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(current - 1)}
            disabled={current <= 1}
            className={cn(
              'border border-[hsl(var(--color-secondary-300))] rounded',
              'hover:border-[hsl(var(--color-primary-500))] hover:text-[hsl(var(--color-primary-500))]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
              buttonSizeClasses[size]
            )}
          >
            Previous
          </button>

          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  className={cn(
                    'border rounded transition-colors',
                    page === current
                      ? 'border-[hsl(var(--color-primary-500))] bg-[hsl(var(--color-primary-500))] text-white'
                      : 'border-[hsl(var(--color-secondary-300))] hover:border-[hsl(var(--color-primary-500))] hover:text-[hsl(var(--color-primary-500))]',
                    buttonSizeClasses[size]
                  )}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() => handlePageChange(current + 1)}
            disabled={current >= totalPages}
            className={cn(
              'border border-[hsl(var(--color-secondary-300))] rounded',
              'hover:border-[hsl(var(--color-primary-500))] hover:text-[hsl(var(--color-primary-500))]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
              buttonSizeClasses[size]
            )}
          >
            Next
          </button>
        </div>

        {showQuickJumper && (
          <div className="flex items-center space-x-2">
            <span className="text-[hsl(var(--color-secondary-600))]">Go to:</span>
            <input
              type="number"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJump()}
              className="w-16 px-2 py-1 border border-[hsl(var(--color-secondary-300))] rounded text-center"
              min={1}
              max={totalPages}
            />
            <button
              onClick={handleJump}
              className="px-3 py-1 bg-[hsl(var(--color-primary-500))] text-white rounded hover:bg-[hsl(var(--color-primary-600))] transition-colors"
            >
              Go
            </button>
          </div>
        )}
      </div>
    )
  }
)

Pagination.displayName = 'Pagination'

export default Pagination