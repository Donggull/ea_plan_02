import React from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, children, className, ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
        />
        <div
          ref={ref}
          className={cn(
            'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4',
            className
          )}
          {...props}
        >
          {title && (
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

export default Modal