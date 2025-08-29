'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Bot,
  FileText,
  FolderOpen,
  Image,
  LayoutDashboard,
  PaintBucket,
  Settings,
  Users,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/uiStore'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '기획 관리', href: '/dashboard/planning', icon: FileText },
  { name: '디자인 관리', href: '/dashboard/design', icon: PaintBucket },
  { name: '퍼블리싱 관리', href: '/dashboard/publishing', icon: FolderOpen },
  { name: '개발 관리', href: '/dashboard/development', icon: BarChart3 },
  { name: 'AI 챗봇', href: '/dashboard/chatbot', icon: Bot },
  { name: '이미지 생성', href: '/dashboard/image-gen', icon: Image },
  { name: '관리자', href: '/dashboard/admin', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <div className="font-bold text-xl">엘루오</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col space-y-1 p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === item.href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <Link
            href="/settings"
            className={cn(
              'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname === '/settings'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>설정</span>
          </Link>
        </div>
      </aside>
    </>
  )
}