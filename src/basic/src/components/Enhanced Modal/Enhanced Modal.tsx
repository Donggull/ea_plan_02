import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  showCloseButton?: boolean
  preventBodyScroll?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    isOpen, 
    onClose, 
    title, 
    description, 
    children, 
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    preventBodyScroll = true,
    className,
    ...props 
  }, ref) => {
    const titleId = React.useId()
    const descriptionId = React.useId()

    const sizeClasses = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4'
    }

    // Body scroll 관리
    useEffect(() => {
      if (!isOpen || !preventBodyScroll) return

      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalStyle
      }
    }, [isOpen, preventBodyScroll])

    // 키보드 이벤트 처리
    useEffect(() => {
      if (!isOpen) return

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, closeOnEscape])

    // Focus trap 구현
    useEffect(() => {
      if (!isOpen) return

      const modal = document.querySelector('[data-modal="true"]')
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus()
            e.preventDefault()
          }
        }
      }

      // 첫 번째 요소에 포커스
      firstElement?.focus()

      document.addEventListener('keydown', handleTabKey)
      return () => document.removeEventListener('keydown', handleTabKey)
    }, [isOpen])

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        
        {/* Modal */}
        <div
          ref={ref}
          data-modal="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'relative w-full bg-white rounded-xl shadow-2xl',
            'max-h-[90vh] overflow-hidden',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {/* Header */}
          {(title || description || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-[hsl(var(--color-secondary-200))]">
              <div className="flex-1">
                {title && (
                  <h2 id={titleId} className="text-xl font-semibold text-[hsl(var(--color-secondary-900))]">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-[hsl(var(--color-secondary-600))]">
                    {description}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    'ml-4 p-2 rounded-lg text-[hsl(var(--color-secondary-400))]',
                    'hover:text-[hsl(var(--color-secondary-600))] hover:bg-[hsl(var(--color-secondary-100))]',
                    'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary-500))]',
                    'transition-colors'
                  )}
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

export default Modal