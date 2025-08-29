'use client'

import { ReactNode, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { ChatPanel } from './ChatPanel'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { 
    darkMode,
    setIsMobile,
    chatPanelOpen
  } = useUIStore()

  // 다크모드 초기화
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [darkMode])

  // 모바일 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [setIsMobile])

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-200',
      darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    )}>
      {/* Layout Container */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Main Content */}
          <MainContent>{children}</MainContent>
        </div>
      </div>
      
      {/* Chat Panel */}
      {chatPanelOpen && <ChatPanel />}
    </div>
  )
}