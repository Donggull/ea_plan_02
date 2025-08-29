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

  // 브라우저 종료 시 세션 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 브라우저 종료 시 모든 세션 관련 데이터 정리
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        
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

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
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