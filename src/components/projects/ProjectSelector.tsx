'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Search, Plus, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface Project {
  id: string
  name: string
  description?: string | null
  status?: string | null
}

interface ProjectSelectorProps {
  selectedProjectId?: string | null
  onProjectChange?: (project: Project | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ProjectSelector({ 
  selectedProjectId, 
  onProjectChange, 
  placeholder = "프로젝트 선택", 
  className,
  disabled = false
}: ProjectSelectorProps) {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user, loadProjects])

  const loadProjects = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // 사용자가 참여한 프로젝트들 조회
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          project:projects(
            id,
            name,
            description,
            status
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const projectList = data
        ?.map(item => item.project)
        .filter(Boolean) as Project[]

      setProjects(projectList || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleProjectSelect = (project: Project) => {
    onProjectChange?.(project)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600'
      case 'completed':
        return 'bg-blue-100 text-blue-600'
      case 'paused':
        return 'bg-yellow-100 text-yellow-600'
      case 'cancelled':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'completed':
        return '완료'
      case 'paused':
        return '일시정지'
      case 'cancelled':
        return '취소'
      case 'draft':
        return '초안'
      default:
        return '상태 없음'
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className={cn(
            'truncate',
            selectedProject ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            {selectedProject?.name || placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="프로젝트 검색..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Projects List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-sm text-gray-500">
                  로딩 중...
                </div>
              ) : filteredProjects.length > 0 ? (
                <>
                  {/* Clear Selection */}
                  <button
                    type="button"
                    onClick={() => handleProjectSelect(null as any)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                  >
                    선택 해제
                  </button>
                  
                  {/* Project Options */}
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleProjectSelect(project)}
                      className={cn(
                        'w-full px-3 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        selectedProjectId === project.id && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {project.description}
                            </div>
                          )}
                        </div>
                        {project.status && (
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full ml-2',
                            getStatusColor(project.status)
                          )}>
                            {getStatusText(project.status)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-6 text-center">
                  <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {searchTerm ? '검색 결과가 없습니다' : '참여 중인 프로젝트가 없습니다'}
                  </p>
                  {!searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        // 프로젝트 생성 페이지로 이동 또는 생성 모달 열기
                        window.location.href = '/dashboard/projects/new'
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      새 프로젝트 만들기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}