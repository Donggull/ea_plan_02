'use client'

import { ReactNode } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { 
    darkMode,
    chatPanelOpen 
  } = useUIStore()

  return (
    <main
      className={cn(
        'transition-all duration-200 ease-in-out flex-1 overflow-auto',
        darkMode && 'bg-gray-50 dark:bg-gray-900',
        'min-h-screen',
        chatPanelOpen && 'pb-80', // 챗봇 패널이 열려있을 때 하단 여백 추가
        'md:pb-0' // 데스크탑에서는 챗봇 패널 고정 위치로 여백 제거
      )}
    >
      {/* Content Container */}
      <div className={cn(
        'container mx-auto p-6',
        'max-w-full',
        darkMode && 'text-gray-100'
      )}>
        {children}
      </div>
    </main>
  )
}