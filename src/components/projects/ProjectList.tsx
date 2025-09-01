'use client'

import { useState } from 'react'
import { ProjectCard } from './ProjectCard'
import Button from '@/basic/src/components/Button/Button'
import { Grid, List, Plus, Search } from 'lucide-react'
import Input from '@/basic/src/components/Input/Input'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description?: string | null
  status?: string | null
  progress?: number | null
  priority?: string | null
  current_phase?: string | null
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

interface ProjectListProps {
  projects: Project[]
  onCreateNew?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ProjectList({ projects, onCreateNew, onEdit, onDelete }: ProjectListProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    const matchesPhase = phaseFilter === 'all' || project.current_phase === phaseFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesPhase
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">프로젝트</h1>
        <Badge className="bg-gray-100 text-gray-800">
          총 {projects.length}개
        </Badge>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="프로젝트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">모든 상태</option>
            <option value="draft">초안</option>
            <option value="active">진행중</option>
            <option value="paused">일시정지</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">모든 우선순위</option>
            <option value="urgent">긴급</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>

          {/* Phase Filter */}
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">모든 단계</option>
            <option value="proposal">제안 진행</option>
            <option value="construction">구축 관리</option>
            <option value="operation">운영 관리</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={view === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="p-2"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || phaseFilter !== 'all'
              ? '검색 조건에 맞는 프로젝트가 없습니다.'
              : '첫 번째 프로젝트를 만들어보세요.'}
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && phaseFilter === 'all' && (
            <Button
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 프로젝트 만들기
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          view === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        )}>
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              view={view}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      className
    )}>
      {children}
    </span>
  )
}