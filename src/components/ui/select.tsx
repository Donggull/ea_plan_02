import React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  className?: string
  onValueChange?: (value: string) => void
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode
  value: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, onValueChange, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onChange={(e) => {
        if (onValueChange) {
          onValueChange(e.target.value);
        }
        if (props.onChange) {
          props.onChange(e);
        }
      }}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ children, ...props }, ref) => (
    <option ref={ref} {...props}>
      {children}
    </option>
  )
)
SelectItem.displayName = 'SelectItem'

// Compatibility exports for common shadcn patterns
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectTrigger = Select
const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder}</option>

export { Select, SelectItem, SelectContent, SelectTrigger, SelectValue }