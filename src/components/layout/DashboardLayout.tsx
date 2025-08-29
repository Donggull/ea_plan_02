'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className={cn('flex-1 transition-all duration-200', 
          sidebarOpen ? 'md:ml-64' : 'ml-0'
        )}>
          <Header />
          <main className="container mx-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}