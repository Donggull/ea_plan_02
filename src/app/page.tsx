'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'

const services = [
  {
    id: 'planning',
    title: '기획',
    description: 'RFP 분석부터 제안서 작성, 구축 및 운영 관리까지',
    route: '/dashboard/planning',
    gradient: 'from-orange-500 to-red-600',
    icon: '📋'
  },
  {
    id: 'design',
    title: '디자인',
    description: '디자인 워크플로우와 리소스 관리',
    route: '/dashboard/design',
    gradient: 'from-pink-500 to-rose-600',
    icon: '🎨'
  },
  {
    id: 'publishing',
    title: '퍼블리싱',
    description: '코드 캔버스와 실시간 미리보기',
    route: '/dashboard/publishing',
    gradient: 'from-emerald-500 to-green-600',
    icon: '💻'
  },
  {
    id: 'development',
    title: '개발',
    description: '개발 환경과 배포 관리',
    route: '/dashboard/development',
    gradient: 'from-purple-500 to-indigo-600',
    icon: '⚙️'
  },
  {
    id: 'chatbot',
    title: '전용챗봇',
    description: 'AI 통합, 커스텀 챗봇, RAG',
    route: '/dashboard/chatbot',
    gradient: 'from-blue-500 to-cyan-600',
    icon: '🤖'
  },
  {
    id: 'image',
    title: '이미지 생성',
    description: 'AI 기반 이미지 생성 도구',
    route: '/dashboard/image',
    gradient: 'from-violet-500 to-purple-600',
    icon: '🖼️'
  }
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const handleServiceClick = (route: string) => {
    if (user) {
      router.push(route)
    } else {
      router.push(`/auth/login?redirect=${encodeURIComponent(route)}`)
    }
  }

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-xl p-2">
            <span className="text-slate-900 text-2xl font-bold">E</span>
          </div>
          <span className="text-xl font-bold">EA Plan</span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300">
                {user.email}
              </span>
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-slate-900"
              >
                대시보드
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => router.push('/auth/login')}
                variant="ghost"
                className="text-white hover:bg-white hover:text-slate-900"
              >
                로그인
              </Button>
              <Button 
                onClick={() => router.push('/auth/signup')}
                variant="primary"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                회원가입
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="bg-white rounded-2xl p-4 mb-8 shadow-2xl">
          <span className="text-slate-900 text-4xl font-bold">E</span>
        </div>
        
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          EA Plan
        </h1>
        
        <p className="text-2xl text-slate-300 mb-4 max-w-3xl">
          AI 기반 통합 프로젝트 관리 플랫폼
        </p>
        <p className="text-lg text-slate-400 mb-12 max-w-3xl">
          웹·앱 서비스 개발의 모든 과정을 하나의 플랫폼에서 완성
        </p>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full mb-16">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`bg-gradient-to-br ${service.gradient} p-8 text-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                hoveredCard === service.id ? 'scale-105 shadow-2xl' : ''
              }`}
              onMouseEnter={() => setHoveredCard(service.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleServiceClick(service.route)}
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold mb-2">{service.title}</h3>
              <p className="text-sm opacity-90 mb-6">{service.description}</p>
              <Button
                variant="ghost"
                className="w-full bg-white/20 text-white border-white/30 hover:bg-white hover:text-slate-900"
                onClick={(e) => {
                  e.stopPropagation()
                  handleServiceClick(service.route)
                }}
              >
                시작하기
              </Button>
            </Card>
          ))}
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-2">🎯 통합성</h3>
            <p className="text-sm text-slate-300">기획-디자인-퍼블-개발-챗봇-이미지생성을 하나의 플랫폼에서</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-2">🚀 자동화</h3>
            <p className="text-sm text-slate-300">AI 기반 문서 생성, 코드 생성, 이미지 생성 자동화</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-2">🔗 연동성</h3>
            <p className="text-sm text-slate-300">단계별 데이터 연동으로 일관성 있는 프로젝트 관리</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-2">⚡ 효율성</h3>
            <p className="text-sm text-slate-300">RFP 분석부터 최종 배포까지 원스톱 솔루션</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold shadow-2xl transform transition-all duration-300 hover:scale-105"
        >
          {user ? '대시보드로 이동' : '지금 시작하기'}
        </Button>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-400 border-t border-slate-700">
        <p>&copy; 2024 EA Plan. All rights reserved.</p>
      </footer>
    </div>
  )
}