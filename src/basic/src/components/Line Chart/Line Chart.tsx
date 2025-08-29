import React from 'react'
import { cn } from '@/lib/utils'

interface LineChartData {
  x: number | string
  y: number
}

interface LineChartProps {
  data: LineChartData[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  showDots?: boolean
  showGrid?: boolean
  smooth?: boolean
  className?: string
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({ 
    data, 
    width = 400,
    height = 200,
    color = 'hsl(var(--color-primary-500))',
    strokeWidth = 2,
    showDots = true,
    showGrid = true,
    smooth = false,
    className,
    ...props 
  }, ref) => {
    const padding = 20
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    const maxY = Math.max(...data.map(d => d.y))
    const minY = Math.min(...data.map(d => d.y))
    const maxX = data.length - 1

    const getX = (index: number) => padding + (index / maxX) * chartWidth
    const getY = (value: number) => padding + (1 - (value - minY) / (maxY - minY)) * chartHeight

    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.y) }))

    const pathD = smooth
      ? generateSmoothPath(points)
      : `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`

    return (
      <div
        ref={ref}
        className={cn('inline-block', className)}
        {...props}
      >
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid */}
          {showGrid && (
            <g className="opacity-20">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={ratio}
                  x1={padding}
                  y1={padding + ratio * chartHeight}
                  x2={padding + chartWidth}
                  y2={padding + ratio * chartHeight}
                  stroke="hsl(var(--color-secondary-400))"
                  strokeWidth={1}
                />
              ))}
              {/* Vertical grid lines */}
              {data.map((_, i) => (
                <line
                  key={i}
                  x1={getX(i)}
                  y1={padding}
                  x2={getX(i)}
                  y2={padding + chartHeight}
                  stroke="hsl(var(--color-secondary-400))"
                  strokeWidth={1}
                />
              ))}
            </g>
          )}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            className="drop-shadow-sm"
          />

          {/* Dots */}
          {showDots && points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="white"
                stroke={color}
                strokeWidth={2}
                className="drop-shadow-sm hover:r-6 transition-all cursor-pointer"
              />
              {/* Tooltip */}
              <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={point.x - 20}
                  y={point.y - 30}
                  width={40}
                  height={20}
                  fill="rgba(0,0,0,0.8)"
                  rx={4}
                />
                <text
                  x={point.x}
                  y={point.y - 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize={12}
                >
                  {data[i].y}
                </text>
              </g>
            </g>
          ))}

          {/* Axis labels */}
          <g className="text-xs fill-[hsl(var(--color-secondary-600))]">
            {/* Y-axis labels */}
            {[minY, (minY + maxY) / 2, maxY].map((value, i) => (
              <text
                key={value}
                x={padding - 10}
                y={padding + i * (chartHeight / 2) + 4}
                textAnchor="end"
              >
                {Math.round(value)}
              </text>
            ))}
            
            {/* X-axis labels */}
            {data.map((d, i) => (
              <text
                key={i}
                x={getX(i)}
                y={height - 5}
                textAnchor="middle"
              >
                {d.x}
              </text>
            ))}
          </g>
        </svg>
      </div>
    )
  }
)

// Helper function for smooth curves
function generateSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x},${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    
    if (i === 1) {
      const cp1x = prev.x + (curr.x - prev.x) / 3
      const cp1y = prev.y
      const cp2x = curr.x - (next ? (next.x - prev.x) / 6 : (curr.x - prev.x) / 3)
      const cp2y = curr.y
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`
    } else if (i === points.length - 1) {
      const cp1x = prev.x + (curr.x - points[i - 2].x) / 6
      const cp1y = prev.y
      const cp2x = curr.x - (curr.x - prev.x) / 3
      const cp2y = curr.y
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`
    } else {
      const cp1x = prev.x + (curr.x - points[i - 2].x) / 6
      const cp1y = prev.y
      const cp2x = curr.x - (next.x - prev.x) / 6
      const cp2y = curr.y
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`
    }
  }
  
  return path
}

LineChart.displayName = 'LineChart'

export default LineChart