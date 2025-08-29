'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, PaintBucket, Image, Palette } from 'lucide-react'
import Link from 'next/link'

export default function DesignPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">디자인 관리</h1>
          <p className="text-muted-foreground">
            UI/UX 디자인, 브랜딩, 디자인 시스템을 관리합니다
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/design/new">
            <Plus className="mr-2 h-4 w-4" />
            새 디자인 프로젝트
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">디자인 작업</CardTitle>
            <PaintBucket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">진행 중인 디자인</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">브랜드 자산</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">브랜드 가이드</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이미지 자산</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">저장된 이미지</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>디자인 프로젝트</CardTitle>
          <CardDescription>
            진행 중인 디자인 작업을 확인하고 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PaintBucket className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <h3 className="text-lg font-medium">디자인 프로젝트가 없습니다</h3>
              <p className="text-muted-foreground mt-2">
                첫 번째 디자인 프로젝트를 시작해보세요
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/design/new">
                  새 디자인 시작
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}