import React from 'react'
import { cn } from '@/lib/utils'

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  height?: number
  maxValue?: number
  showLabels?: boolean
  showValues?: boolean
  orientation?: 'vertical' | 'horizontal'
  variant?: 'default' | 'rounded' | 'gradient'
  className?: string
}

const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({ 
    data, 
    height = 300,
    maxValue,
    showLabels = true,
    showValues = false,
    orientation = 'vertical',
    variant = 'default',
    className,
    ...props 
  }, ref) => {
    const max = maxValue || Math.max(...data.map(item => item.value))
    const colors = [
      'hsl(var(--color-primary-500))',
      'hsl(var(--color-secondary-500))',
      '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ]

    const getBarStyle = (value: number, index: number) => {
      const percentage = (value / max) * 100
      const color = data[index].color || colors[index % colors.length]
      
      if (orientation === 'horizontal') {
        return {
          width: `${percentage}%`,
          backgroundColor: variant === 'gradient' 
            ? `linear-gradient(90deg, ${color}88, ${color})`
            : color
        }
      } else {
        return {
          height: `${percentage}%`,
          backgroundColor: variant === 'gradient' 
            ? `linear-gradient(180deg, ${color}, ${color}88)`
            : color
        }
      }
    }

    const barClasses = cn(
      'transition-all duration-300 hover:opacity-80',
      variant === 'rounded' && 'rounded-t',
      orientation === 'horizontal' && variant === 'rounded' && 'rounded-r'
    )

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        style={{ height }}
        {...props}
      >
        <div className={cn(
          'h-full flex items-end justify-center',
          orientation === 'horizontal' && 'flex-col items-start'
        )}>
          {data.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'flex flex-col items-center mx-1',
                orientation === 'horizontal' && 'flex-row my-1 mx-0 w-full'
              )}
            >
              {showLabels && orientation === 'vertical' && (
                <div className="text-xs text-[hsl(var(--color-secondary-600))] mb-2 text-center max-w-16 truncate">
                  {item.label}
                </div>
              )}
              
              <div className={cn(
                'relative group',
                orientation === 'vertical' ? 'h-full min-w-8 flex items-end' : 'w-full h-6 flex items-center'
              )}>
                <div
                  className={barClasses}
                  style={getBarStyle(item.value, index)}
                >
                  {showValues && (
                    <div className={cn(
                      'absolute text-xs font-medium text-white',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      orientation === 'vertical' 
                        ? 'top-1 left-1/2 -translate-x-1/2' 
                        : 'right-1 top-1/2 -translate-y-1/2'
                    )}>
                      {item.value}
                    </div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className={cn(
                  'absolute z-10 px-2 py-1 bg-gray-800 text-white text-xs rounded',
                  'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                  orientation === 'vertical' 
                    ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
                    : 'left-full top-1/2 -translate-y-1/2 ml-2'
                )}>
                  {item.label}: {item.value}
                </div>
              </div>

              {showLabels && orientation === 'horizontal' && (
                <div className="text-xs text-[hsl(var(--color-secondary-600))] ml-2 truncate flex-shrink-0 w-16">
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
)

BarChart.displayName = 'BarChart'

export default BarChart