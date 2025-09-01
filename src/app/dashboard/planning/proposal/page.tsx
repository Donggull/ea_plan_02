'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Clock, CheckCircle, Upload, Search } from 'lucide-react'
import Link from 'next/link'

export default function ProposalPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">제안 진행</h1>
          <p className="text-muted-foreground">
            프로젝트 제안, RFP 분석, 제안서 작성을 관리합니다
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/planning/proposal/new">
            <Plus className="mr-2 h-4 w-4" />
            새 제안 프로젝트
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">진행 중인 제안</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">완료된 제안</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">총 제안서</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              RFP 문서 업로드
            </CardTitle>
            <CardDescription>
              새 제안 프로젝트 시작을 위한 RFP 문서를 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              RFP, 요구사항서, 사업계획서 등의 문서를 업로드하여 AI 분석과 함께 제안 프로젝트를 시작할 수 있습니다.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/planning/rfp-analysis">
                <Upload className="mr-2 h-4 w-4" />
                RFP 분석 자동화로 시작
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              문서 검색 및 분석
            </CardTitle>
            <CardDescription>
              기존 프로젝트 문서를 검색하고 분석하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              업로드된 문서들을 검색하고, AI를 활용한 내용 분석 및 인사이트를 얻을 수 있습니다.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/documents?tab=search">
                <Search className="mr-2 h-4 w-4" />
                문서 검색
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>제안 프로젝트 목록</CardTitle>
          <CardDescription>
            현재 진행 중인 제안 프로젝트들을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <h3 className="text-lg font-medium">제안 프로젝트가 없습니다</h3>
              <p className="text-muted-foreground mt-2">
                RFP 문서를 업로드하여 첫 번째 제안 프로젝트를 시작해보세요
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button asChild>
                  <Link href="/dashboard/planning/rfp-analysis">
                    <Upload className="mr-2 h-4 w-4" />
                    RFP 분석으로 시작
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    직접 시작
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}