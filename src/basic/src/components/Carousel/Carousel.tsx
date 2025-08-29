import React from 'react'
import { cn } from '@/lib/utils'

interface CarouselProps {
  children: React.ReactNode[]
  autoplay?: boolean
  autoplayDelay?: number
  showArrows?: boolean
  showDots?: boolean
  infinite?: boolean
  className?: string
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ 
    children, 
    autoplay = false,
    autoplayDelay = 3000,
    showArrows = true,
    showDots = true,
    infinite = true,
    className,
    ...props 
  }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isPlaying, setIsPlaying] = React.useState(autoplay)

    const totalSlides = children.length

    React.useEffect(() => {
      if (!isPlaying || totalSlides <= 1) return

      const interval = setInterval(() => {
        setCurrentIndex(prev => infinite ? (prev + 1) % totalSlides : Math.min(prev + 1, totalSlides - 1))
      }, autoplayDelay)

      return () => clearInterval(interval)
    }, [isPlaying, autoplayDelay, totalSlides, infinite])

    const goToSlide = (index: number) => {
      setCurrentIndex(index)
    }

    const goToPrevious = () => {
      setCurrentIndex(prev => 
        infinite 
          ? (prev - 1 + totalSlides) % totalSlides 
          : Math.max(prev - 1, 0)
      )
    }

    const goToNext = () => {
      setCurrentIndex(prev => 
        infinite 
          ? (prev + 1) % totalSlides 
          : Math.min(prev + 1, totalSlides - 1)
      )
    }

    const canGoPrevious = infinite || currentIndex > 0
    const canGoNext = infinite || currentIndex < totalSlides - 1

    return (
      <div
        ref={ref}
        className={cn('relative group', className)}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(autoplay)}
        {...props}
      >
        {/* Slides Container */}
        <div className="relative overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {children.map((child, index) => (
              <div key={index} className="w-full flex-shrink-0">
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {showArrows && totalSlides > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                'bg-white bg-opacity-80 hover:bg-opacity-100',
                'rounded-full p-2 shadow-md transition-all',
                'opacity-0 group-hover:opacity-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                'bg-white bg-opacity-80 hover:bg-opacity-100',
                'rounded-full p-2 shadow-md transition-all',
                'opacity-0 group-hover:opacity-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {showDots && totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {children.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex
                    ? 'bg-white scale-125'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                )}
              />
            ))}
          </div>
        )}

        {/* Slide Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {totalSlides}
        </div>
      </div>
    )
  }
)

Carousel.displayName = 'Carousel'

export default Carousel