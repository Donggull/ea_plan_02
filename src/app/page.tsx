'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/basic/src/components/Button/Button'
import Card from '@/basic/src/components/Card/Card'

const services = [
  {
    id: 'proposal',
    title: '제안 진행',
    description: 'RFP 분석부터 제안서 작성까지',
    route: '/dashboard/planning',
    gradient: 'from-orange-500 to-red-600',
    icon: '📋'
  },
  {
    id: 'development',
    title: '구축 관리',
    description: '요구사항 정리부터 QA까지',
    route: '/dashboard/development',
    gradient: 'from-pink-500 to-rose-600',
    icon: '🔧'
  },
  {
    id: 'operation',
    title: '운영 관리',
    description: '업무 분배와 일정 관리',
    route: '/dashboard',
    gradient: 'from-emerald-500 to-green-600',
    icon: '⚙️'
  },
  {
    id: 'chatbot',
    title: 'AI 챗봇',
    description: 'AI 모델로 스마트한 업무 지원',
    route: '/dashboard/chatbot',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🤖'
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
        
        <p className="text-2xl text-slate-300 mb-12 max-w-2xl">
          웹·앱 서비스 기획의 새로운 경험
        </p>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mb-16">
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