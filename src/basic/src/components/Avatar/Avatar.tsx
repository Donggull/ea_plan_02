import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'circle' | 'square'
  className?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, size = 'md', variant = 'circle', className, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl'
    }

    const variantClasses = {
      circle: 'rounded-full',
      square: 'rounded-lg'
    }

    const showFallback = !src || imageError || !imageLoaded

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden',
          'bg-[hsl(var(--color-secondary-100))] text-[hsl(var(--color-secondary-600))]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {src && !imageError && (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className={cn(
              'h-full w-full object-cover transition-opacity',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {showFallback && (
          <span className="font-medium">
            {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
          </span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export default Avatar