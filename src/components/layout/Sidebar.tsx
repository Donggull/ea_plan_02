'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUIStore } from '@/stores/ui-store'
import { useMenuNavigation } from '@/hooks/useMenuNavigation'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    sidebarWidth, 
    setSidebarWidth, 
    sidebarCollapsed, 
    collapseSidebar,
    expandSidebar,
    darkMode, 
    isMobile 
  } = useUIStore()
  const { menuStructure } = useMenuNavigation()
  
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, setSidebarOpen])

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 400) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setSidebarWidth])

  const handleNavItemClick = (href: string) => {
    router.push(href)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const sidebarStyle = {
    width: sidebarCollapsed ? '64px' : `${sidebarWidth}px`,
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 z-30 h-full border-r bg-white transition-all duration-200 ease-in-out',
          darkMode && 'bg-gray-900 border-gray-700',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0'
        )}
        style={sidebarStyle}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">EA Plan</span>
            </div>
          )}
          
          {/* Collapse/Expand button */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={sidebarCollapsed ? expandSidebar : collapseSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <IconRenderer 
                icon={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} 
                size={16} 
              />
            </Button>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconRenderer icon="X" size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuStructure.map((section) => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <h3 className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {section.section}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavItemClick(item.href)}
                        className={cn(
                          'w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500 dark:bg-blue-900/20 dark:text-blue-100'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                          sidebarCollapsed && 'justify-center px-2'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <IconRenderer 
                          icon={item.icon as any} 
                          size={18} 
                          className={cn(
                            'flex-shrink-0',
                            isActive ? 'text-blue-600 dark:text-blue-400' : ''
                          )}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Resize handle */}
        {!isMobile && !sidebarCollapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500 cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => handleNavItemClick('/dashboard/settings')}
            className={cn(
              'w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              pathname === '/dashboard/settings'
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
              sidebarCollapsed && 'justify-center px-2'
            )}
            title={sidebarCollapsed ? '설정' : undefined}
          >
            <IconRenderer 
              icon="Settings" 
              size={18} 
              className="flex-shrink-0"
            />
            {!sidebarCollapsed && <span>설정</span>}
          </button>
        </div>
      </aside>
    </>
  )
}