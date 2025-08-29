import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface BlogCardProps {
  title: string
  excerpt: string
  image?: string
  author: {
    name: string
    avatar?: string
  }
  publishDate: string
  readTime?: string
  category?: string
  tags?: string[]
  variant?: 'default' | 'horizontal' | 'minimal'
  className?: string
}

const BlogCard = React.forwardRef<HTMLDivElement, BlogCardProps>(
  ({ 
    title, 
    excerpt, 
    image, 
    author, 
    publishDate, 
    readTime, 
    category, 
    tags = [], 
    variant = 'default', 
    className, 
    ...props 
  }, ref) => {
    const [imageError, setImageError] = useState(false)
    const [avatarError, setAvatarError] = useState(false)
    
    const defaultImage = `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop`
    const defaultAvatar = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`
    
    const imageSrc = imageError ? `https://picsum.photos/seed/${title}/600/400` : (image || defaultImage)
    const avatarSrc = avatarError ? `https://picsum.photos/seed/${author.name}/100/100` : (author.avatar || defaultAvatar)

    if (variant === 'horizontal') {
      return (
        <article
          ref={ref}
          className={cn(
            'bg-white rounded-lg border border-[hsl(var(--color-secondary-200))] overflow-hidden hover:shadow-md transition-shadow',
            className
          )}
          {...props}
        >
          <div className="flex">
            <div className="relative w-48 h-32 flex-shrink-0">
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {category && (
                <div className="absolute top-2 left-2 bg-[hsl(var(--color-primary-500))] text-white text-xs px-2 py-1 rounded">
                  {category}
                </div>
              )}
            </div>
            <div className="p-4 flex-1">
              <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{excerpt}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <img
                    src={avatarSrc}
                    alt={author.name}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                  <span>{author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{publishDate}</span>
                  {readTime && <span>• {readTime}</span>}
                </div>
              </div>
            </div>
          </div>
        </article>
      )
    }

    if (variant === 'minimal') {
      return (
        <article
          ref={ref}
          className={cn(
            'bg-white rounded-lg border border-[hsl(var(--color-secondary-200))] p-6 hover:shadow-md transition-shadow',
            className
          )}
          {...props}
        >
          {category && (
            <span className="text-xs text-[hsl(var(--color-primary-600))] font-medium uppercase tracking-wide">
              {category}
            </span>
          )}
          <h3 className="font-bold text-gray-900 text-xl mt-2 mb-3">{title}</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">{excerpt}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={avatarSrc}
                alt={author.name}
                className="w-8 h-8 rounded-full object-cover"
                onError={() => setAvatarError(true)}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{author.name}</div>
                <div className="text-xs text-gray-500">{publishDate}</div>
              </div>
            </div>
            {readTime && (
              <span className="text-sm text-gray-500">{readTime}</span>
            )}
          </div>
        </article>
      )
    }

    // Default variant
    return (
      <article
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
            {category && (
              <div className="absolute top-3 left-3 bg-[hsl(var(--color-primary-500))] text-white text-sm px-3 py-1 rounded-full">
                {category}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">{excerpt}</p>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-[hsl(var(--color-secondary-100))] text-[hsl(var(--color-secondary-700))] px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={avatarSrc}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={() => setAvatarError(true)}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{author.name}</div>
                <div className="text-xs text-gray-500">{publishDate}</div>
              </div>
            </div>
            {readTime && (
              <span className="text-sm text-gray-500">{readTime}</span>
            )}
          </div>
        </div>
      </article>
    )
  }
)

BlogCard.displayName = 'BlogCard'

export default BlogCard