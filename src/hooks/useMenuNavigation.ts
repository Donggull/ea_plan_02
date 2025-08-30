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
      { id: 'rfp-analysis', label: 'RFP 분석 자동화', href: '/dashboard/rfp-analysis', icon: 'Brain' },
      { id: 'documents-planning', label: 'RFP 문서 관리', href: '/dashboard/documents?tab=upload&type=rfp', icon: 'Upload' },
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
      { id: 'chat', label: 'AI 채팅', href: '/dashboard/chat', icon: 'MessageCircle' },
      { id: 'mcp-chat', label: 'MCP 채팅', href: '/dashboard/mcp-chat', icon: 'Zap' },
      { id: 'chatbot', label: '전용챗봇', href: '/dashboard/chatbot', icon: 'Bot' },
      { id: 'image-gen', label: '이미지 생성', href: '/dashboard/image-gen', icon: 'Image' },
      { id: 'documents', label: '문서 관리', href: '/dashboard/documents', icon: 'FileText' }
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
    
    if (pathSegments[0] === 'dashboard') {
      const breadcrumbs = [{ label: '대시보드', href: '/dashboard' }]
      
      if (pathSegments.length > 1) {
        // 첫 번째 서브 경로 처리
        const subPath = pathSegments[1]
        const pathMap: { [key: string]: string } = {
          'projects': '프로젝트 관리',
          'planning': '기획',
          'rfp-analysis': 'RFP 분석 자동화',
          'design': '디자인',
          'development': '개발',
          'publishing': '퍼블리싱',
          'chat': 'AI 채팅',
          'mcp-chat': 'MCP 채팅',
          'chatbot': '전용챗봇',
          'image-gen': '이미지 생성',
          'documents': '문서 관리',
          'admin': '관리자'
        }
        
        const subLabel = pathMap[subPath] || subPath
        breadcrumbs.push({ label: subLabel, href: `/dashboard/${subPath}` })
        
        // 프로젝트 상세 페이지의 경우 프로젝트명 추가
        if (subPath === 'projects' && pathSegments.length > 2 && pathSegments[2] !== 'new') {
          breadcrumbs.push({ 
            label: '프로젝트 상세', 
            href: `/dashboard/projects/${pathSegments[2]}` 
          })
        }
        
        // 기타 하위 경로들 처리
        if (pathSegments.length > 3) {
          for (let i = 3; i < pathSegments.length; i++) {
            const segment = pathSegments[i]
            const currentPath = '/dashboard/' + pathSegments.slice(1, i + 1).join('/')
            
            // 특정 경로에 대한 라벨 매핑
            const segmentMap: { [key: string]: string } = {
              'edit': '편집',
              'new': '새로 만들기',
              'settings': '설정',
              'members': '멤버 관리'
            }
            
            const segmentLabel = segmentMap[segment] || segment
            breadcrumbs.push({ label: segmentLabel, href: currentPath })
          }
        }
      }
      
      return breadcrumbs
    }
    
    return [{ label: '대시보드', href: '/dashboard' }]
  }, [pathname])

  return {
    menuStructure,
    activeMenuItem,
    activeSection,
    breadcrumbs
  }
}