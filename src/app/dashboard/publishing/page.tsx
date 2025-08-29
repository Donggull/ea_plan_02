'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Globe, Code } from 'lucide-react'
import Link from 'next/link'

export default function PublishingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">퍼블리싱 관리</h1>
          <p className="text-muted-foreground">
            웹 퍼블리싱, 프론트엔드 개발을 관리합니다
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/publishing/new">
            <Plus className="mr-2 h-4 w-4" />
            새 퍼블리싱 프로젝트
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">웹사이트</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">활성 웹사이트</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">프로젝트</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">진행 중인 프로젝트</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">배포</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">성공한 배포</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>퍼블리싱 프로젝트</CardTitle>
          <CardDescription>
            진행 중인 웹 개발 프로젝트를 확인하고 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <h3 className="text-lg font-medium">퍼블리싱 프로젝트가 없습니다</h3>
              <p className="text-muted-foreground mt-2">
                첫 번째 웹 프로젝트를 시작해보세요
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/publishing/new">
                  새 프로젝트 시작
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}