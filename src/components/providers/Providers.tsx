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
        staleTime: 1000 * 60 * 30, // 30분간 데이터를 fresh로 간주 (기존 5분에서 확장)
        gcTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지 (메모리에 보관)
        refetchOnWindowFocus: false, // 창 포커스 시 재요청 완전 비활성화
        refetchOnMount: false, // 컴포넌트 마운트 시 재요청 비활성화
        refetchOnReconnect: false, // 네트워크 재연결 시 재요청 비활성화
        refetchInterval: false, // 자동 주기적 재요청 비활성화
        retry: 1, // 실패시 재시도 횟수 최소화
        retryOnMount: false, // 마운트 시 재시도 비활성화
        networkMode: 'online', // 온라인일 때만 요청 수행
      },
      mutations: {
        retry: 1, // mutation 실패시 재시도 횟수 최소화
        networkMode: 'online', // 온라인일 때만 mutation 수행
      },
    },
  }))

  // localStorage를 사용하여 세션 유지하므로 브라우저 종료 시 정리 로직 제거
  useEffect(() => {
    // Auth 초기화는 RouteGuard에서 처리됨
    console.log('Providers mounted')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouteGuard>
        {children}
      </RouteGuard>
    </QueryClientProvider>
  )
}