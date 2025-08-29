import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProfileCardProps {
  name: string
  title: string
  avatar?: string
  coverImage?: string
  bio?: string
  stats?: Array<{ label: string; value: string | number }>
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ name, title, avatar, coverImage, bio, stats = [], variant = 'default', className, ...props }, ref) => {
    const [imageError, setImageError] = useState(false)
    const [coverError, setCoverError] = useState(false)
    
    const defaultAvatar = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`
    const defaultCover = `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=200&fit=crop`
    
    const avatarSrc = imageError ? `https://picsum.photos/seed/${name}/400/400` : (avatar || defaultAvatar)
    const coverSrc = coverError ? `https://picsum.photos/seed/${name}-cover/800/200` : (coverImage || defaultCover)

    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            'bg-white rounded-xl border border-[hsl(var(--color-secondary-200))] p-4 hover:shadow-md transition-shadow',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatarSrc}
                alt={name}
                className="w-12 h-12 rounded-full object-cover"
                onError={() => setImageError(true)}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <p className="text-sm text-gray-600 truncate">{title}</p>
            </div>
          </div>
        </div>
      )
    }

    if (variant === 'detailed') {
      return (
        <div
          ref={ref}
          className={cn(
            'bg-white rounded-xl border border-[hsl(var(--color-secondary-200))] overflow-hidden hover:shadow-lg transition-shadow',
            className
          )}
          {...props}
        >
          {/* Cover Image */}
          <div className="relative h-32 bg-gradient-to-r from-[hsl(var(--color-primary-500))] to-[hsl(var(--color-primary-600))]">
            <img
              src={coverSrc}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={() => setCoverError(true)}
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-8 mb-4">
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt={name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={() => setImageError(true)}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
            
            {/* Name & Title */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{name}</h3>
              <p className="text-gray-600">{title}</p>
            </div>
            
            {/* Bio */}
            {bio && (
              <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">{bio}</p>
            )}
            
            {/* Stats */}
            {stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Default variant
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl border border-[hsl(var(--color-secondary-200))] p-6 hover:shadow-md transition-shadow',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={avatarSrc}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-gray-600 mb-2">{title}</p>
            {bio && <p className="text-sm text-gray-600">{bio}</p>}
          </div>
        </div>
        
        {stats.length > 0 && (
          <div className="flex justify-around pt-4 mt-4 border-t border-gray-100">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

ProfileCard.displayName = 'ProfileCard'

export default ProfileCard