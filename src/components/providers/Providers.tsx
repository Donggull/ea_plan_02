'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import RouteGuard from '@/components/auth/RouteGuard'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  }))

  // 브라우저 종료 시 세션 정리 (다른 창 이동은 제외)
  useEffect(() => {
    let isNavigating = false

    // 페이지 내 네비게이션 감지
    const handleRouteChange = () => {
      isNavigating = true
      setTimeout(() => {
        isNavigating = false
      }, 1000) // 1초 후 네비게이션 플래그 해제
    }

    // 브라우저 이벤트 감지
    const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
      // 페이지 내 네비게이션 중이면 세션 정리하지 않음
      if (isNavigating) {
        console.log('Page navigation detected, preserving session')
        return
      }

      // 실제 브라우저 종료나 탭 종료 시에만 세션 정리
      console.log('Browser closing detected, clearing session...')
      
      if (typeof window !== 'undefined') {
        // sessionStorage는 자동으로 브라우저 종료 시 삭제되므로 강제 정리 불필요
        // 대신 localStorage만 정리 (혹시 사용하는 경우를 대비)
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Supabase 관련 쿠키들 제거
        const cookies = document.cookie.split(';')
        cookies.forEach(cookie => {
          const [name] = cookie.split('=')
          if (name.trim().includes('supabase') || name.trim().includes('sb-')) {
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
          }
        })
      }
    }

    // 페이지 변경 감지를 위한 이벤트들 (SPA 네비게이션)
    window.addEventListener('popstate', handleRouteChange)
    
    // 링크 클릭 감지 (페이지 내 네비게이션)
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'A' || target.closest('a')) {
        handleRouteChange()
      }
    }
    window.addEventListener('click', handleLinkClick)
    
    // 브라우저 종료 감지
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('click', handleLinkClick)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouteGuard>
        {children}
      </RouteGuard>
    </QueryClientProvider>
  )
}