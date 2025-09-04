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
    section: '📊 대시보드',
    items: [
      { id: 'dashboard', label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
      { id: 'projects', label: '프로젝트 관리', href: '/dashboard/projects', icon: 'FolderOpen' }
    ]
  },
  {
    section: '📊 기획',
    items: [
      { id: 'proposal', label: '제안 진행', href: '/dashboard/planning/proposal', icon: 'FileText' },
      { id: 'rfp-analysis', label: 'RFP 분석 자동화', href: '/dashboard/planning/rfp-analysis', icon: 'Brain' },
      { id: 'rfp-analyses', label: 'RFP 분석 완료 목록', href: '/dashboard/rfp-analyses', icon: 'ListChecks' },
      { id: 'construction', label: '구축 관리', href: '/dashboard/planning/construction', icon: 'Settings' },
      { id: 'operation', label: '운영 관리', href: '/dashboard/planning/operation', icon: 'Headphones' }
    ]
  },
  {
    section: '🎨 디자인',
    items: [
      { id: 'ui-ux', label: 'UI/UX 생성', href: '/dashboard/design/ui-ux', icon: 'Palette' },
      { id: 'design-system', label: '디자인 시스템', href: '/dashboard/design/system', icon: 'Grid' }
    ]
  },
  {
    section: '💻 퍼블리싱',
    items: [
      { id: 'code-canvas', label: '코드 캔버스', href: '/dashboard/publishing/canvas', icon: 'Code' },
      { id: 'component-library', label: '컴포넌트 라이브러리', href: '/dashboard/publishing/components', icon: 'Package' }
    ]
  },
  {
    section: '⚙️ 개발',
    items: [
      { id: 'api-design', label: 'API 설계', href: '/dashboard/development/api', icon: 'Globe' },
      { id: 'test-management', label: '테스트 관리', href: '/dashboard/development/test', icon: 'CheckCircle' }
    ]
  },
  {
    section: '🤖 전용챗봇',
    items: [
      { id: 'my-chatbot', label: '내 챗봇', href: '/dashboard/chatbot/my', icon: 'Bot' },
      { id: 'public-chatbot', label: '공개 챗봇', href: '/dashboard/chatbot/public', icon: 'Users' }
    ]
  },
  {
    section: '🖼️ 이미지 생성',
    items: [
      { id: 'generation-tool', label: '생성 도구', href: '/dashboard/image-gen/tool', icon: 'Wand2' },
      { id: 'image-gallery', label: '이미지 갤러리', href: '/dashboard/image-gen/gallery', icon: 'Image' }
    ]
  },
  {
    section: '⚡ 관리자',
    items: [
      { id: 'workflow-management', label: '워크플로우 관리', href: '/dashboard/admin/workflow', icon: 'GitBranch' },
      { id: 'mcp-management', label: 'MCP 관리', href: '/dashboard/admin/mcp', icon: 'Zap' },
      { id: 'ai-models', label: 'AI 모델 관리', href: '/dashboard/admin/ai-models', icon: 'Brain' },
      { id: 'user-management', label: '회원 관리', href: '/dashboard/admin/user-management', icon: 'UserCog' }
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
          'design': '디자인',
          'publishing': '퍼블리싱', 
          'development': '개발',
          'chatbot': '전용챗봇',
          'image-gen': '이미지 생성',
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
        
        // RFP 분석 상세 페이지의 경우 분석 상세 추가
        if (subPath === 'rfp-analyses' && pathSegments.length > 2) {
          breadcrumbs.push({ 
            label: 'RFP 분석 상세', 
            href: `/dashboard/rfp-analyses/${pathSegments[2]}` 
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
              'members': '멤버 관리',
              'rfp-analyses': 'RFP 분석 완료 목록'
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