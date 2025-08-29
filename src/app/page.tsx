'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconRenderer } from '@/components/icons/IconRenderer'
import Button from '@/basic/src/components/Button/Button'
import { cn } from '@/lib/utils'

const categories = [
  {
    id: 'proposal',
    title: '제안 진행',
    description: 'RFP 분석부터 제안서 작성까지',
    icon: 'FileText',
    color: 'from-orange-400 to-orange-600',
    action: '제안 시작하기'
  },
  {
    id: 'development', 
    title: '구축 관리',
    description: '요구사항 정리부터 QA까지',
    icon: 'Settings',
    color: 'from-pink-400 to-pink-600',
    action: '구축 관리하기'
  },
  {
    id: 'operation',
    title: '운영 관리', 
    description: '업무 분배와 일정 관리',
    icon: 'Headphones',
    color: 'from-green-400 to-green-600',
    action: '운영 시작하기'
  },
  {
    id: 'ai-chat',
    title: 'AI 챗봇',
    description: 'AI 모델로 스마트한 업무 지원',
    icon: 'Bot',
    color: 'from-blue-400 to-blue-600',
    action: 'AI와 대화하기'
  }
]

export default function HomePage() {
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGetStarted = () => {
    router.push('/dashboard')
  }

  const handleCardClick = (_categoryId: string) => {
    router.push('/dashboard')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2 text-white">EA Plan</div>
          <div className="text-gray-400">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xl">E</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <IconRenderer icon="FileText" size={18} />
              <span>제안진행</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <IconRenderer icon="Settings" size={18} />
              <span>구축관리</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <IconRenderer icon="Headphones" size={18} />
              <span>운영관리</span>
            </button>
          </nav>
        </div>
        
        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={handleGetStarted}
            className="text-white bg-blue-600 hover:bg-blue-700 px-6 py-2"
          >
            대시보드
          </Button>
          <Button
            variant="ghost"
            onClick={handleGetStarted}
            className="text-white bg-purple-600 hover:bg-purple-700 px-6 py-2"
          >
            프로젝트
          </Button>
          <button className="text-gray-300 hover:text-white p-2">
            <IconRenderer icon="Settings" size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <p className="text-gray-400 text-lg mb-4">기획자를 위한 AI 통합 플랫폼</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">웹·앱 서비스 기획의</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              새로운 경험
            </span>
          </h1>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={cn(
                'relative group cursor-pointer transform transition-all duration-300 hover:scale-105',
                hoveredCard === category.id ? 'z-20' : 'z-10'
              )}
              onMouseEnter={() => setHoveredCard(category.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(category.id)}
              style={{
                animationDelay: `${index * 150}ms`
              }}
            >
              {/* Background Glow Effect */}
              <div className={cn(
                'absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl',
                `bg-gradient-to-r ${category.color}`
              )} />
              
              {/* Card */}
              <div className={cn(
                'relative bg-gradient-to-br rounded-2xl p-8 h-80 flex flex-col justify-between',
                `${category.color}`,
                'shadow-2xl group-hover:shadow-3xl transition-shadow duration-300'
              )}>
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <IconRenderer 
                      icon={category.icon as any} 
                      size={32} 
                      className="text-white" 
                    />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-sm mb-6 leading-relaxed">
                    {category.description}
                  </p>
                </div>
                
                {/* Action Button */}
                <div className="flex-shrink-0">
                  <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 group-hover:bg-white/30 flex items-center justify-center space-x-2">
                    <span>{category.action}</span>
                    <IconRenderer icon="ChevronRight" size={16} />
                  </button>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 opacity-20">
                  <div className="w-20 h-20 rounded-full bg-white/10 blur-xl" />
                </div>
                <div className="absolute bottom-4 left-4 opacity-10">
                  <div className="w-16 h-16 rounded-full bg-white/20 blur-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
          >
            지금 시작하기
          </Button>
        </div>
      </main>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      </div>
    </div>
  )
}
