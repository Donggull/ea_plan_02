'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useMenuNavigation } from '@/hooks/useMenuNavigation'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import { cn } from '@/lib/utils'

export function Header() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const { 
    toggleSidebar, 
    toggleDarkMode, 
    darkMode, 
    notifications, 
    unreadCount,
    markAsRead,
    isMobile,
    sidebarOpen 
  } = useUIStore()
  const { breadcrumbs } = useMenuNavigation()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className={cn(
      'border-b bg-white transition-all duration-200',
      darkMode && 'bg-gray-900 border-gray-700'
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconRenderer 
              icon={sidebarOpen && !isMobile ? "ChevronLeft" : "Menu"} 
              size={20} 
            />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center space-x-2">
                {index > 0 && (
                  <span className="text-gray-400">/</span>
                )}
                <button
                  onClick={() => router.push(crumb.href)}
                  className={cn(
                    'text-sm font-medium hover:text-blue-600 transition-colors',
                    index === breadcrumbs.length - 1 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-600 dark:text-gray-300'
                  )}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconRenderer 
              icon={darkMode ? "Sun" : "Moon"} 
              size={18} 
              className={darkMode ? "text-yellow-500" : "text-gray-600"}
            />
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            >
              <IconRenderer 
                icon="Bell" 
                size={18} 
                className="text-gray-600 dark:text-gray-300"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {notificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">알림</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      새로운 알림이 없습니다.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700',
                          !notification.read && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'Anonymous'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || 'Member'}
                </div>
              </div>
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-2">
                  <button
                    onClick={() => {
                      router.push('/dashboard/profile')
                      setUserMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2"
                  >
                    <IconRenderer icon="User" size={16} />
                    <span>프로필</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      handleSignOut()
                      setUserMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center space-x-2"
                  >
                    <IconRenderer icon="LogOut" size={16} />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}