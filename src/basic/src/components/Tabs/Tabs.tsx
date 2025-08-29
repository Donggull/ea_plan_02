import React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  key: string
  label: string
  content: React.ReactNode
  disabled?: boolean
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultActiveKey?: string
  activeKey?: string
  onChange?: (key: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ 
    tabs, 
    defaultActiveKey, 
    activeKey: controlledActiveKey, 
    onChange, 
    variant = 'default',
    size = 'md',
    className,
    ...props 
  }, ref) => {
    const [internalActiveKey, setInternalActiveKey] = React.useState(
      controlledActiveKey || defaultActiveKey || tabs[0]?.key
    )

    const activeKey = controlledActiveKey || internalActiveKey

    const handleTabChange = (key: string) => {
      if (!controlledActiveKey) {
        setInternalActiveKey(key)
      }
      onChange?.(key)
    }

    const variantClasses = {
      default: {
        container: 'border-b border-[hsl(var(--color-secondary-300))]',
        tab: 'border-b-2 border-transparent hover:border-[hsl(var(--color-secondary-300))]',
        active: 'border-[hsl(var(--color-primary-500))] text-[hsl(var(--color-primary-600))]',
        inactive: 'text-[hsl(var(--color-secondary-600))] hover:text-[hsl(var(--color-secondary-900))]'
      },
      pills: {
        container: '',
        tab: 'rounded-lg hover:bg-[hsl(var(--color-secondary-100))]',
        active: 'bg-[hsl(var(--color-primary-500))] text-white',
        inactive: 'text-[hsl(var(--color-secondary-600))] hover:text-[hsl(var(--color-secondary-900))]'
      },
      underline: {
        container: '',
        tab: 'border-b-2 border-transparent hover:border-[hsl(var(--color-secondary-300))]',
        active: 'border-[hsl(var(--color-primary-500))] text-[hsl(var(--color-primary-600))]',
        inactive: 'text-[hsl(var(--color-secondary-600))] hover:text-[hsl(var(--color-secondary-900))]'
      }
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }

    const activeTab = tabs.find(tab => tab.key === activeKey)

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className={cn('flex space-x-1', variantClasses[variant].container)}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeKey
            const isDisabled = tab.disabled

            return (
              <button
                key={tab.key}
                onClick={() => !isDisabled && handleTabChange(tab.key)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center space-x-2 font-medium transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary-500))] focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  sizeClasses[size],
                  variantClasses[variant].tab,
                  isActive 
                    ? variantClasses[variant].active 
                    : variantClasses[variant].inactive
                )}
              >
                {tab.icon && (
                  <span className="flex-shrink-0">{tab.icon}</span>
                )}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          {activeTab?.content}
        </div>
      </div>
    )
  }
)

Tabs.displayName = 'Tabs'

export default Tabs