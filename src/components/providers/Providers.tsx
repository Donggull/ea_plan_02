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
        staleTime: Infinity, // 수동으로 무효화하지 않는 한 데이터를 항상 fresh로 간주
        gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 유지 (메모리에 보관)
        refetchOnWindowFocus: false, // 창 포커스 시 재요청 완전 비활성화
        refetchOnMount: false, // 컴포넌트 마운트 시 재요청 완전 비활성화
        refetchOnReconnect: false, // 네트워크 재연결 시 재요청 완전 비활성화
        refetchInterval: false, // 자동 주기적 재요청 완전 비활성화
        refetchIntervalInBackground: false, // 백그라운드 자동 재요청 비활성화
        retry: false, // 실패시 재시도 완전 비활성화
        retryOnMount: false, // 마운트 시 재시도 완전 비활성화
        networkMode: 'online', // 온라인일 때만 요청 수행
        structuralSharing: false, // 구조적 공유 비활성화 (불필요한 리렌더링 방지)
      },
      mutations: {
        retry: false, // mutation 실패시 재시도 완전 비활성화
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