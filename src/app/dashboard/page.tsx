'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Bot,
  FileText,
  FolderOpen,
  Image,
  PaintBucket,
  Plus,
  Users
} from 'lucide-react'

const modules = [
  {
    title: '기획 관리',
    description: '프로젝트 기획, RFP 분석, 제안서 작성',
    href: '/dashboard/planning',
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    title: '디자인 관리',
    description: 'UI/UX 디자인, 브랜딩, 디자인 시스템',
    href: '/dashboard/design',
    icon: PaintBucket,
    color: 'bg-purple-500'
  },
  {
    title: '퍼블리싱 관리',
    description: '웹 퍼블리싱, 프론트엔드 개발',
    href: '/dashboard/publishing',
    icon: FolderOpen,
    color: 'bg-green-500'
  },
  {
    title: '개발 관리',
    description: '백엔드 개발, API, 데이터베이스',
    href: '/dashboard/development',
    icon: BarChart3,
    color: 'bg-orange-500'
  },
  {
    title: 'AI 챗봇',
    description: '프로젝트 컨설팅 및 업무 지원 AI',
    href: '/dashboard/chatbot',
    icon: Bot,
    color: 'bg-cyan-500'
  },
  {
    title: '이미지 생성',
    description: 'AI 기반 이미지 및 그래픽 생성',
    href: '/dashboard/image-gen',
    icon: Image,
    color: 'bg-pink-500'
  }
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            엘루오 통합 관리 플랫폼에 오신 것을 환영합니다
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/planning/new">
            <Plus className="mr-2 h-4 w-4" />
            새 프로젝트
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-md ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={module.href}>
                  시작하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              아직 프로젝트가 없습니다.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              최근 활동이 없습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}