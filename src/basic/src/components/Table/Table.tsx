import React from 'react'
import { cn } from '@/lib/utils'

interface TableColumn<T = Record<string, unknown>> {
  key: string
  title: string
  width?: string
  render?: (value: unknown, record: T) => React.ReactNode
}

interface TableProps<T = Record<string, unknown>> {
  data: Array<T>
  columns: Array<TableColumn<T>>
  variant?: 'default' | 'striped' | 'bordered'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ data, columns, variant = 'default', size = 'md', className, ...props }, ref) => {
    const variantClasses = {
      default: 'border-collapse',
      striped: 'border-collapse [&_tbody_tr:nth-child(odd)]:bg-[hsl(var(--color-secondary-50))]',
      bordered: 'border-collapse border border-[hsl(var(--color-secondary-300))]'
    }

    const sizeClasses = {
      sm: '[&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1 text-sm',
      md: '[&_td]:px-4 [&_td]:py-2 [&_th]:px-4 [&_th]:py-3 text-base',
      lg: '[&_td]:px-6 [&_td]:py-3 [&_th]:px-6 [&_th]:py-4 text-lg'
    }

    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn(
            'w-full',
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <thead className="bg-[hsl(var(--color-secondary-100))]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'text-left font-semibold text-[hsl(var(--color-secondary-900))]',
                    'border-b border-[hsl(var(--color-secondary-300))]',
                    column.width && `w-[${column.width}]`
                  )}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr key={index} className="hover:bg-[hsl(var(--color-secondary-50))] transition-colors">
                {columns.map((column) => {
                  const value = (record as Record<string, unknown>)[column.key]
                  return (
                    <td
                      key={column.key}
                      className="border-b border-[hsl(var(--color-secondary-200))] text-[hsl(var(--color-secondary-700))]"
                    >
                      {column.render ? column.render(value, record) : String(value ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
)

Table.displayName = 'Table'

export default Table