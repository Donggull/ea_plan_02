/**
 * 프로젝트별 분석 데이터 통합 관리 타입 정의
 */

// 분석 타입 열거형
export type AnalysisType = 'proposal' | 'construction' | 'operation' | 'rfp_auto'

// 분석 상태 열거형
export type AnalysisStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled'

// 활용 타입 열거형
export type UsageType = 'design' | 'publishing' | 'development'

// 선택 모드 열거형
export type SelectionMode = 'single' | 'multiple'

/**
 * 프로젝트별 분석 데이터 현황
 */
export interface ProjectAnalysisData {
  id: string
  project_id: string
  analysis_type: AnalysisType
  analysis_id: string // 각 분석 테이블의 ID (rfp_analyses, construction_tasks, operation_requests 등)
  status: AnalysisStatus
  completeness_score: number // 0-100
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * 선택된 분석 데이터 (디자인/퍼블리싱/개발용)
 */
export interface SelectedAnalysisData {
  id: string
  project_id: string
  usage_type: UsageType
  selected_analyses: string[] // project_analysis_data의 ID 배열
  selection_mode: SelectionMode
  selection_criteria: Record<string, any> // 선택 기준 및 설정
  selected_by?: string
  selected_at: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * 분석 타입별 세부 정보
 */
export interface AnalysisTypeInfo {
  type: AnalysisType
  name: string
  description: string
  icon: string
  color: string
  subCategories?: string[]
}

/**
 * 분석 데이터 요약 정보
 */
export interface AnalysisDataSummary {
  analysis_data: ProjectAnalysisData
  source_data?: any // 실제 분석 데이터 (rfp_analyses, construction_tasks 등)
  summary: {
    title: string
    description?: string
    key_points: string[]
    completeness: number
    last_updated: string
  }
}

/**
 * 프로젝트 분석 현황 대시보드용 데이터
 */
export interface ProjectAnalysisDashboard {
  project_id: string
  analyses: AnalysisDataSummary[]
  statistics: {
    total_analyses: number
    completed_analyses: number
    in_progress_analyses: number
    average_completeness: number
  }
  current_selections: {
    design?: SelectedAnalysisData
    publishing?: SelectedAnalysisData
    development?: SelectedAnalysisData
  }
}

/**
 * 분석 데이터 선택 요청
 */
export interface SelectAnalysisDataRequest {
  project_id: string
  usage_type: UsageType
  selected_analyses: string[]
  selection_mode: SelectionMode
  selection_criteria?: Record<string, any>
  notes?: string
}

/**
 * 분석 데이터 필터링 옵션
 */
export interface AnalysisDataFilter {
  analysis_types?: AnalysisType[]
  status?: AnalysisStatus[]
  completeness_min?: number
  completeness_max?: number
  date_from?: string
  date_to?: string
  search_query?: string
}

/**
 * 분석 데이터 정렬 옵션
 */
export interface AnalysisDataSort {
  field: 'created_at' | 'updated_at' | 'completeness_score' | 'analysis_type'
  direction: 'asc' | 'desc'
}

/**
 * API 응답 타입들
 */
export interface ProjectAnalysisDataResponse {
  success: boolean
  data: ProjectAnalysisData[]
  total: number
  page?: number
  limit?: number
}

export interface SelectedAnalysisDataResponse {
  success: boolean
  data: SelectedAnalysisData
}

export interface ProjectAnalysisDashboardResponse {
  success: boolean
  data: ProjectAnalysisDashboard
}

/**
 * 분석 타입별 상수 정의
 */
export const ANALYSIS_TYPES: Record<AnalysisType, AnalysisTypeInfo> = {
  proposal: {
    type: 'proposal',
    name: '제안 진행 분석',
    description: 'RFP 분석, 시장조사, 페르소나 분석, 제안서 작성, 비용 산정',
    icon: 'FileText',
    color: 'blue',
    subCategories: ['RFP 분석', '시장 조사', '페르소나 분석', '제안서 작성', '비용 산정']
  },
  construction: {
    type: 'construction',
    name: '구축 관리 분석',
    description: '현황분석, 요구사항정리, 기능정의, 화면설계, WBS 일정관리, QA관리, 종합 인사이트',
    icon: 'Settings',
    color: 'green',
    subCategories: ['현황분석정리', '요구사항정리', '기능정의', '화면설계', 'WBS 일정관리', 'QA관리', '종합 인사이트']
  },
  operation: {
    type: 'operation',
    name: '운영 관리 분석',
    description: '고객 요건 관리 - 기획, 디자인, 퍼블리싱, 개발 업무 분류 및 일정 관리',
    icon: 'Users',
    color: 'orange',
    subCategories: ['기획 요건', '디자인 요건', '퍼블리싱 요건', '개발 요건']
  },
  rfp_auto: {
    type: 'rfp_auto',
    name: 'RFP 분석 자동화',
    description: '빠른 분석 및 요구사항 자동 추출을 위한 독립적 분석 도구',
    icon: 'Brain',
    color: 'purple'
  }
}

export const USAGE_TYPES: Record<UsageType, { name: string; description: string; icon: string; color: string }> = {
  design: {
    name: '디자인',
    description: 'Figma 시안 생성 및 디자인 시스템 구축',
    icon: 'Palette',
    color: 'pink'
  },
  publishing: {
    name: '퍼블리싱',
    description: '컴포넌트 라이브러리 및 Storybook 생성',
    icon: 'Code',
    color: 'indigo'
  },
  development: {
    name: '개발',
    description: 'PRD/TRD 문서 및 API 스펙 자동 생성',
    icon: 'Terminal',
    color: 'emerald'
  }
}