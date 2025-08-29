import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface GalleryImage {
  src: string
  alt: string
  title?: string
  description?: string
}

interface GalleryProps {
  images: GalleryImage[]
  variant?: 'grid' | 'masonry' | 'carousel'
  columns?: number
  gap?: 'sm' | 'md' | 'lg'
  showModal?: boolean
  className?: string
}

const Gallery = React.forwardRef<HTMLDivElement, GalleryProps>(
  ({ images, variant = 'grid', columns = 3, gap = 'md', showModal = true, className, ...props }, ref) => {
    const [selectedImage, setSelectedImage] = useState<number | null>(null)
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
    
    const handleImageError = (index: number) => {
      setImageErrors(prev => new Set([...prev, index]))
    }
    
    const getImageSrc = (image: GalleryImage, index: number) => {
      if (imageErrors.has(index)) {
        return `https://picsum.photos/seed/gallery-${index}/600/400`
      }
      return image.src || `https://images.unsplash.com/photo-150724352${index}0-abcdef?w=600&h=400&fit=crop`
    }

    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    }

    if (variant === 'masonry') {
      return (
        <div
          ref={ref}
          className={cn('columns-1 md:columns-2 lg:columns-3 xl:columns-4', gapClasses[gap], className)}
          {...props}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="break-inside-avoid mb-4 group cursor-pointer"
              onClick={() => showModal && setSelectedImage(index)}
            >
              <div className="relative overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={getImageSrc(image, index)}
                  alt={image.alt}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => handleImageError(index)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-medium">{image.title}</h3>
                    {image.description && (
                      <p className="text-white/80 text-sm">{image.description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (variant === 'carousel') {
      return (
        <div ref={ref} className={cn('relative', className)} {...props}>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 snap-start cursor-pointer"
                onClick={() => showModal && setSelectedImage(index)}
              >
                <div className="relative overflow-hidden rounded-lg bg-gray-100 h-60">
                  <img
                    src={getImageSrc(image, index)}
                    alt={image.alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={() => handleImageError(index)}
                  />
                  {image.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h3 className="text-white font-medium">{image.title}</h3>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Grid variant (default)
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <div
          className={cn(
            'grid',
            `grid-cols-1 md:grid-cols-${Math.min(columns, 4)} gap-${gap === 'sm' ? '2' : gap === 'md' ? '4' : '6'}`
          )}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="group cursor-pointer"
              onClick={() => showModal && setSelectedImage(index)}
            >
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                <img
                  src={getImageSrc(image, index)}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => handleImageError(index)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h3 className="text-white font-medium text-sm">{image.title}</h3>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && selectedImage !== null && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={getImageSrc(images[selectedImage], selectedImage)}
                alt={images[selectedImage].alt}
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {images[selectedImage].title && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white p-4 rounded">
                  <h3 className="font-medium">{images[selectedImage].title}</h3>
                  {images[selectedImage].description && (
                    <p className="text-sm opacity-80">{images[selectedImage].description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

Gallery.displayName = 'Gallery'

export default Gallery