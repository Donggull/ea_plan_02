import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

export interface MenuItem {
  id: string
  label: string
  href: string
  icon: string
}

export interface MenuSection {
  section: string
  items: MenuItem[]
}

export const menuStructure: MenuSection[] = [
  {
    section: '대시보드',
    items: [
      { id: 'dashboard', label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
      { id: 'projects', label: '프로젝트 관리', href: '/dashboard/projects', icon: 'FolderOpen' }
    ]
  },
  {
    section: '기획',
    items: [
      { id: 'proposal', label: '제안 진행', href: '/dashboard/planning', icon: 'FileText' },
      { id: 'development', label: '구축 관리', href: '/planning/development', icon: 'Settings' },
      { id: 'operation', label: '운영 관리', href: '/planning/operation', icon: 'Headphones' }
    ]
  },
  {
    section: '디자인',
    items: [
      { id: 'workflow', label: '디자인 워크플로우', href: '/dashboard/design', icon: 'Palette' },
      { id: 'resources', label: '리소스 관리', href: '/design/resources', icon: 'Folder' }
    ]
  },
  {
    section: '퍼블리싱',
    items: [
      { id: 'canvas', label: '코드 캔버스', href: '/dashboard/publishing', icon: 'Code' },
      { id: 'preview', label: '실시간 미리보기', href: '/publishing/preview', icon: 'Eye' }
    ]
  },
  {
    section: '개발',
    items: [
      { id: 'environment', label: '개발 환경', href: '/dashboard/development', icon: 'Terminal' },
      { id: 'deployment', label: '배포 관리', href: '/development/deployment', icon: 'Upload' }
    ]
  },
  {
    section: 'AI',
    items: [
      { id: 'chatbot', label: '전용챗봇', href: '/dashboard/chatbot', icon: 'Bot' },
      { id: 'image-gen', label: '이미지 생성', href: '/dashboard/image-gen', icon: 'Image' }
    ]
  }
]

export function useMenuNavigation() {
  const pathname = usePathname()
  
  const activeMenuItem = useMemo(() => {
    return menuStructure
      .flatMap(section => section.items)
      .find(item => pathname.startsWith(item.href))
  }, [pathname])

  const activeSection = useMemo(() => {
    return menuStructure.find(section => 
      section.items.some(item => pathname.startsWith(item.href))
    )?.section
  }, [pathname])

  const breadcrumbs = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    
    if (pathSegments[0] === 'dashboard' && pathSegments.length > 1) {
      const breadcrumbs = [{ label: '대시보드', href: '/dashboard' }]
      
      if (activeMenuItem) {
        if (activeSection) {
          breadcrumbs.push({ label: activeSection, href: '#' })
        }
        breadcrumbs.push({ label: activeMenuItem.label, href: activeMenuItem.href })
      }
      
      return breadcrumbs
    }
    
    return [{ label: '대시보드', href: '/dashboard' }]
  }, [pathname, activeMenuItem, activeSection])

  return {
    menuStructure,
    activeMenuItem,
    activeSection,
    breadcrumbs
  }
}