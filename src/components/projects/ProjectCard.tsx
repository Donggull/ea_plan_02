'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/basic/src/components/Card/Card'
import Badge from '@/basic/src/components/Badge/Badge'
import Button from '@/basic/src/components/Button/Button'
import { MoreVertical, Users, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string | null
    status?: string | null
    progress?: number | null
    priority?: string | null
    start_date?: string | null
    end_date?: string | null
    members?: Array<{
      id: string
      user?: {
        id: string
        name?: string | null
        email?: string | null
        avatar_url?: string | null
      } | null
    }>
    client_name?: string | null
  }
  view?: 'grid' | 'list'
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ProjectCard({ project, view = 'grid', onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCardClick = () => {
    router.push(`/dashboard/projects/${project.id}`)
  }

  if (view === 'list') {
    return (
      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <Badge className={getStatusColor(project.status || 'draft')}>
                {project.status || 'draft'}
              </Badge>
              {project.priority && (
                <div className={cn('w-2 h-2 rounded-full', getPriorityColor(project.priority))} />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {project.description || '설명이 없습니다.'}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{project.progress || 0}%</span>
            </div>

            {/* Members */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{project.members?.length || 0}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{formatDate(project.end_date)}</span>
            </div>

            {/* Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                className="p-1"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(project.id)
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(project.id)
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {project.description || '설명이 없습니다.'}
          </p>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-1"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(project.id)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                수정
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(project.id)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex items-center gap-2 mb-4">
        <Badge className={getStatusColor(project.status || 'draft')}>
          {project.status || 'draft'}
        </Badge>
        {project.priority && (
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', getPriorityColor(project.priority))} />
            <span className="text-xs text-gray-500">{project.priority}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">진행률</span>
          <span className="text-xs font-medium">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{project.members?.length || 0}명</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDate(project.end_date)}</span>
        </div>
      </div>

      {/* Client Info */}
      {project.client_name && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500">클라이언트</span>
          <p className="text-sm font-medium">{project.client_name}</p>
        </div>
      )}
    </Card>
  )
}