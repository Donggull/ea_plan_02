import React from 'react'
import { cn } from '@/lib/utils'

interface PieChartData {
  label: string
  value: number
  color?: string
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  innerRadius?: number
  showLabels?: boolean
  showLegend?: boolean
  showValues?: boolean
  className?: string
}

const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  ({ 
    data, 
    size = 200,
    innerRadius = 0,
    showLabels = true,
    showLegend = true,
    showValues = false,
    className,
    ...props 
  }, ref) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const center = size / 2
    const radius = size / 2 - 10
    
    const colors = [
      'hsl(var(--color-primary-500))',
      'hsl(var(--color-secondary-500))',
      '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
    ]

    let currentAngle = 0
    const segments = data.map((item, index) => {
      const percentage = item.value / total
      const angle = percentage * 2 * Math.PI
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      
      currentAngle += angle

      const x1 = center + radius * Math.cos(startAngle)
      const y1 = center + radius * Math.sin(startAngle)
      const x2 = center + radius * Math.cos(endAngle)
      const y2 = center + radius * Math.sin(endAngle)

      const largeArcFlag = angle > Math.PI ? 1 : 0

      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ')

      // For donut chart
      const donutPathData = innerRadius > 0 ? [
        `M ${center + innerRadius * Math.cos(startAngle)} ${center + innerRadius * Math.sin(startAngle)}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${center + innerRadius * Math.cos(endAngle)} ${center + innerRadius * Math.sin(endAngle)}`,
        `L ${x2} ${y2}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
        'Z'
      ].join(' ') : pathData

      // Label position
      const labelAngle = startAngle + angle / 2
      const labelRadius = radius * 0.7
      const labelX = center + labelRadius * Math.cos(labelAngle)
      const labelY = center + labelRadius * Math.sin(labelAngle)

      return {
        ...item,
        pathData: donutPathData,
        percentage: Math.round(percentage * 100),
        color: item.color || colors[index % colors.length],
        labelX,
        labelY,
        labelAngle
      }
    })

    return (
      <div
        ref={ref}
        className={cn('flex items-center space-x-6', className)}
        {...props}
      >
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((segment, index) => (
              <g key={segment.label}>
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-sm"
                  stroke="white"
                  strokeWidth={2}
                />
              </g>
            ))}
          </svg>

          {/* Center content for donut charts */}
          {innerRadius > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-[hsl(var(--color-secondary-900))]">
                  {total}
                </div>
                <div className="text-sm text-[hsl(var(--color-secondary-500))]">
                  Total
                </div>
              </div>
            </div>
          )}

          {/* Labels on chart */}
          {showLabels && (
            <svg width={size} height={size} className="absolute inset-0">
              {segments.map((segment) => (
                <g key={segment.label}>
                  <text
                    x={segment.labelX}
                    y={segment.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-white drop-shadow-sm"
                  >
                    {segment.percentage}%
                  </text>
                  {showValues && (
                    <text
                      x={segment.labelX}
                      y={segment.labelY + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-white drop-shadow-sm"
                    >
                      {segment.value}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="space-y-2">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-[hsl(var(--color-secondary-700))]">
                  {segment.label}
                </span>
                <span className="text-sm font-medium text-[hsl(var(--color-secondary-900))]">
                  {segment.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

PieChart.displayName = 'PieChart'

export default PieChart