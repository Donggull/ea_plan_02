import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  title: string
  price: string | number
  originalPrice?: string | number
  image?: string
  category?: string
  rating?: number
  reviews?: number
  discount?: string
  inStock?: boolean
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ 
    title, 
    price, 
    originalPrice, 
    image, 
    category, 
    rating = 0, 
    reviews = 0, 
    discount, 
    inStock = true, 
    variant = 'default', 
    className, 
    ...props 
  }, ref) => {
    const [imageError, setImageError] = useState(false)
    
    const defaultImage = `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop`
    const imageSrc = imageError ? `https://picsum.photos/seed/${title}/400/300` : (image || defaultImage)
    
    const renderStars = (rating: number) => {
      return Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className={cn(
            'w-4 h-4',
            index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))
    }

    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            'bg-white rounded-lg border border-[hsl(var(--color-secondary-200))] overflow-hidden hover:shadow-md transition-shadow',
            className
          )}
          {...props}
        >
          <div className="flex">
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {discount && (
                <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                  {discount}
                </div>
              )}
            </div>
            <div className="p-3 flex-1">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{title}</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg font-bold text-[hsl(var(--color-primary-600))]">{price}</span>
                {originalPrice && (
                  <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (variant === 'featured') {
      return (
        <div
          ref={ref}
          className={cn(
            'bg-white rounded-xl border border-[hsl(var(--color-secondary-200))] overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]',
            className
          )}
          {...props}
        >
          <div className="relative">
            <div className="relative h-64 bg-gray-100">
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {discount && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-sm px-2 py-1 rounded-lg font-medium">
                  {discount}
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium">품절</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {category && (
              <span className="text-xs text-[hsl(var(--color-primary-600))] font-medium uppercase tracking-wide">
                {category}
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">{title}</h3>
            
            {rating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {renderStars(rating)}
                </div>
                <span className="text-sm text-gray-600">({reviews})</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[hsl(var(--color-primary-600))]">{price}</span>
                {originalPrice && (
                  <span className="text-lg text-gray-500 line-through">{originalPrice}</span>
                )}
              </div>
              <button className="bg-[hsl(var(--color-primary-500))] text-white px-4 py-2 rounded-lg hover:bg-[hsl(var(--color-primary-600))] transition-colors">
                구매하기
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Default variant
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-lg border border-[hsl(var(--color-secondary-200))] overflow-hidden hover:shadow-md transition-shadow',
          className
        )}
        {...props}
      >
        <div className="relative">
          <div className="relative h-48 bg-gray-100">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            {discount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                {discount}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4">
          {category && (
            <span className="text-xs text-[hsl(var(--color-primary-600))] font-medium">
              {category}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 mt-1 mb-2">{title}</h3>
          
          {rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {renderStars(rating)}
              </div>
              <span className="text-sm text-gray-600">({reviews})</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[hsl(var(--color-primary-600))]">{price}</span>
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

ProductCard.displayName = 'ProductCard'

export default ProductCard