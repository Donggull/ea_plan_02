import React from 'react'
import { cn } from '@/lib/utils'

interface AccordionItem {
  key: string
  title: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

interface AccordionProps {
  items: AccordionItem[]
  defaultActiveKeys?: string[]
  activeKeys?: string[]
  onChange?: (keys: string[]) => void
  multiple?: boolean
  variant?: 'default' | 'bordered' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ 
    items, 
    defaultActiveKeys = [], 
    activeKeys: controlledActiveKeys,
    onChange,
    multiple = false,
    variant = 'default',
    size = 'md',
    className,
    ...props 
  }, ref) => {
    const [internalActiveKeys, setInternalActiveKeys] = React.useState<string[]>(
      controlledActiveKeys || defaultActiveKeys
    )

    const activeKeys = controlledActiveKeys || internalActiveKeys

    const handleToggle = (key: string) => {
      let newActiveKeys: string[]

      if (multiple) {
        newActiveKeys = activeKeys.includes(key)
          ? activeKeys.filter(k => k !== key)
          : [...activeKeys, key]
      } else {
        newActiveKeys = activeKeys.includes(key) ? [] : [key]
      }

      if (!controlledActiveKeys) {
        setInternalActiveKeys(newActiveKeys)
      }
      onChange?.(newActiveKeys)
    }

    const variantClasses = {
      default: 'border border-[hsl(var(--color-secondary-300))] rounded-lg',
      bordered: 'border-2 border-[hsl(var(--color-secondary-300))] rounded-lg',
      ghost: ''
    }

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }

    const headerSizeClasses = {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4'
    }

    const contentSizeClasses = {
      sm: 'px-3 pb-2',
      md: 'px-4 pb-3',
      lg: 'px-6 pb-4'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {items.map((item, index) => {
          const isActive = activeKeys.includes(item.key)
          const isDisabled = item.disabled

          return (
            <div
              key={item.key}
              className={cn(
                variantClasses[variant],
                variant !== 'ghost' && index === 0 && 'rounded-t-lg',
                variant !== 'ghost' && index === items.length - 1 && 'rounded-b-lg',
                variant === 'ghost' && 'border-b border-[hsl(var(--color-secondary-200))] last:border-b-0'
              )}
            >
              <button
                onClick={() => !isDisabled && handleToggle(item.key)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center justify-between text-left',
                  'hover:bg-[hsl(var(--color-secondary-50))] transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary-500))] focus:ring-inset',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  headerSizeClasses[size],
                  variant !== 'ghost' && index === 0 && 'rounded-t-lg',
                  variant !== 'ghost' && !isActive && index === items.length - 1 && 'rounded-b-lg'
                )}
              >
                <div className="font-medium text-[hsl(var(--color-secondary-900))]">
                  {item.title}
                </div>
                <svg
                  className={cn(
                    'h-5 w-5 text-[hsl(var(--color-secondary-500))] transition-transform duration-200',
                    isActive && 'rotate-180'
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isActive && (
                <div
                  className={cn(
                    'border-t border-[hsl(var(--color-secondary-200))]',
                    'text-[hsl(var(--color-secondary-700))]',
                    'animate-in slide-in-from-top-1 duration-200',
                    contentSizeClasses[size]
                  )}
                >
                  {item.content}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
)

Accordion.displayName = 'Accordion'

export default Accordion