'use client'

import { useState } from 'react'
import { Sparkles, Wand2, Target, FileText, Lightbulb, RefreshCw } from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import type { ProposalSection } from '@/types/proposal'

interface ContentGeneratorProps {
  section: ProposalSection
  projectContext?: any
  onGenerate: (content: string) => void
  existingContent?: string
}

interface GenerationOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  prompts: string[]
}

export default function ContentGenerator({ 
  section, 
  projectContext, 
  onGenerate,
  existingContent 
}: ContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [tone, setTone] = useState<'professional' | 'casual' | 'technical'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')

  const generationOptions: GenerationOption[] = [
    {
      id: 'auto',
      title: '자동 생성',
      description: '섹션 유형에 맞는 내용을 자동으로 생성합니다',
      icon: <Sparkles className="h-5 w-5" />,
      prompts: ['섹션 유형과 프로젝트 컨텍스트를 기반으로 적절한 내용 생성']
    },
    {
      id: 'improve',
      title: '내용 개선',
      description: '기존 내용을 개선하고 보완합니다',
      icon: <Wand2 className="h-5 w-5" />,
      prompts: ['기존 내용을 전문적으로 개선', '누락된 핵심 포인트 추가']
    },
    {
      id: 'objectives',
      title: '목표 기반',
      description: '프로젝트 목표를 중심으로 내용을 생성합니다',
      icon: <Target className="h-5 w-5" />,
      prompts: ['프로젝트 목표 달성 전략', '성공 지표 및 KPI 정의']
    },
    {
      id: 'technical',
      title: '기술 설명',
      description: '기술적 접근 방법과 아키텍처를 설명합니다',
      icon: <FileText className="h-5 w-5" />,
      prompts: ['기술 스택 선정 이유', '시스템 아키텍처 설계']
    },
    {
      id: 'benefits',
      title: '이점 강조',
      description: '제안의 주요 이점과 가치를 강조합니다',
      icon: <Lightbulb className="h-5 w-5" />,
      prompts: ['비즈니스 가치 제안', 'ROI 및 투자 효과']
    }
  ]

  const generateContent = async () => {
    setIsGenerating(true)
    
    try {
      // 실제 구현에서는 AI API를 호출합니다
      // 여기서는 시뮬레이션을 위한 더미 콘텐츠를 생성합니다
      const _option = generationOptions.find(opt => opt.id === selectedOption)
      
      let content = ''
      
      // 섹션 타입에 따른 기본 콘텐츠 생성
      switch (section.type) {
        case 'executive_summary':
          content = generateExecutiveSummary()
          break
        case 'company_intro':
          content = generateCompanyIntro()
          break
        case 'understanding':
          content = generateProjectUnderstanding()
          break
        case 'approach':
          content = generateApproach()
          break
        case 'timeline':
          content = generateTimeline()
          break
        case 'budget':
          content = generateBudget()
          break
        default:
          content = generateGenericContent()
      }
      
      setGeneratedContent(content)
      
      // 2초 후 생성 완료 시뮬레이션
      setTimeout(() => {
        setIsGenerating(false)
        onGenerate(content)
      }, 2000)
      
    } catch (error) {
      console.error('Content generation failed:', error)
      setIsGenerating(false)
    }
  }

  const generateExecutiveSummary = () => {
    return `
      <h2>제안 요약</h2>
      <p>본 제안서는 ${projectContext?.projectName || '프로젝트'}의 성공적인 구현을 위한 종합적인 솔루션을 제시합니다.</p>
      
      <h3>핵심 목표</h3>
      <ul>
        <li>디지털 전환을 통한 업무 효율성 ${length === 'long' ? '대폭 ' : ''}향상</li>
        <li>고객 경험 개선을 통한 만족도 증대</li>
        <li>데이터 기반 의사결정 체계 구축</li>
        <li>확장 가능한 시스템 아키텍처 구현</li>
      </ul>
      
      <h3>제안 가치</h3>
      <p>우리의 솔루션은 검증된 방법론과 최신 기술을 결합하여, 귀사의 비즈니스 목표 달성을 지원합니다. 
      ${tone === 'professional' ? '체계적인 프로젝트 관리와 리스크 관리를 통해 성공적인 프로젝트 완수를 보장합니다.' : 
        '실용적이고 효과적인 접근 방식으로 빠른 성과를 만들어냅니다.'}</p>
      
      <h3>예상 효과</h3>
      <ul>
        <li>운영 비용 ${length === 'short' ? '절감' : '30% 이상 절감'}</li>
        <li>처리 시간 ${length === 'short' ? '단축' : '50% 단축'}</li>
        <li>사용자 만족도 ${length === 'short' ? '향상' : '40% 향상'}</li>
      </ul>
    `
  }

  const generateCompanyIntro = () => {
    return `
      <h2>회사 소개</h2>
      <p>저희는 ${tone === 'professional' ? '업계 선도적인' : '혁신적인'} IT 솔루션 전문 기업으로, 
      다양한 산업 분야에서 성공적인 프로젝트를 수행해 왔습니다.</p>
      
      <h3>핵심 역량</h3>
      <ul>
        <li>15년 이상의 풍부한 프로젝트 경험</li>
        <li>200명 이상의 전문 인력 보유</li>
        <li>ISO 9001, CMMI Level 3 인증 획득</li>
        <li>24/7 기술 지원 체계 운영</li>
      </ul>
      
      <h3>주요 실적</h3>
      <ul>
        <li>대기업 ERP 시스템 구축 (50+ 프로젝트)</li>
        <li>공공기관 디지털 전환 프로젝트 (30+ 사례)</li>
        <li>글로벌 기업 클라우드 마이그레이션 (20+ 프로젝트)</li>
      </ul>
      
      ${length === 'long' ? `
      <h3>차별화 요소</h3>
      <p>저희는 단순한 기술 구현을 넘어, 고객의 비즈니스 성공을 위한 전략적 파트너로서 함께합니다. 
      애자일 방법론과 DevOps 문화를 통해 빠르고 안정적인 서비스 제공을 보장합니다.</p>
      ` : ''}
    `
  }

  const generateProjectUnderstanding = () => {
    return `
      <h2>프로젝트 이해</h2>
      <p>귀사의 요구사항을 면밀히 분석한 결과, 다음과 같은 핵심 과제를 식별하였습니다.</p>
      
      <h3>현황 분석</h3>
      <ul>
        <li>레거시 시스템의 유지보수 비용 증가</li>
        <li>부서 간 데이터 연계 부족</li>
        <li>수동 프로세스로 인한 업무 지연</li>
        <li>실시간 의사결정 지원 도구 부재</li>
      </ul>
      
      <h3>핵심 요구사항</h3>
      <ul>
        <li>통합 플랫폼 구축을 통한 업무 효율화</li>
        <li>클라우드 기반 확장 가능한 아키텍처</li>
        <li>모바일 환경 지원</li>
        <li>보안 및 컴플라이언스 준수</li>
      </ul>
      
      ${tone === 'technical' ? `
      <h3>기술적 고려사항</h3>
      <ul>
        <li>마이크로서비스 아키텍처 적용</li>
        <li>컨테이너 기반 배포 환경</li>
        <li>API 우선 설계 원칙</li>
        <li>DevSecOps 파이프라인 구축</li>
      </ul>
      ` : ''}
    `
  }

  const generateApproach = () => {
    return `
      <h2>접근 방법</h2>
      <p>프로젝트의 성공적인 수행을 위해 ${tone === 'professional' ? '체계적이고 검증된' : '실용적이고 효과적인'} 방법론을 적용합니다.</p>
      
      <h3>개발 방법론</h3>
      <p>애자일 스크럼 방법론을 기반으로 하여, 2주 단위 스프린트를 통해 지속적인 가치 전달을 수행합니다.</p>
      
      <h3>단계별 접근</h3>
      <ol>
        <li><strong>분석 단계:</strong> 상세 요구사항 분석 및 아키텍처 설계</li>
        <li><strong>설계 단계:</strong> UI/UX 설계 및 데이터베이스 모델링</li>
        <li><strong>개발 단계:</strong> 반복적 개발 및 지속적 통합</li>
        <li><strong>테스트 단계:</strong> 단위/통합/성능 테스트</li>
        <li><strong>배포 단계:</strong> 단계적 롤아웃 및 모니터링</li>
      </ol>
      
      ${length === 'long' ? `
      <h3>품질 보증</h3>
      <ul>
        <li>코드 리뷰 및 정적 분석 도구 활용</li>
        <li>자동화된 테스트 커버리지 80% 이상 유지</li>
        <li>성능 벤치마킹 및 최적화</li>
        <li>보안 취약점 스캐닝 및 조치</li>
      </ul>
      ` : ''}
    `
  }

  const generateTimeline = () => {
    return `
      <h2>프로젝트 일정</h2>
      <p>전체 프로젝트는 ${length === 'short' ? '6개월' : '8개월'}간 진행되며, 주요 마일스톤은 다음과 같습니다.</p>
      
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="border p-2">단계</th>
            <th class="border p-2">기간</th>
            <th class="border p-2">주요 산출물</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border p-2">프로젝트 착수</td>
            <td class="border p-2">2주</td>
            <td class="border p-2">착수 보고서, 프로젝트 계획서</td>
          </tr>
          <tr>
            <td class="border p-2">요구사항 분석</td>
            <td class="border p-2">4주</td>
            <td class="border p-2">요구사항 명세서, 아키텍처 설계서</td>
          </tr>
          <tr>
            <td class="border p-2">설계</td>
            <td class="border p-2">6주</td>
            <td class="border p-2">화면 설계서, ERD, API 명세서</td>
          </tr>
          <tr>
            <td class="border p-2">개발</td>
            <td class="border p-2">12주</td>
            <td class="border p-2">소스코드, 단위테스트 결과</td>
          </tr>
          <tr>
            <td class="border p-2">테스트</td>
            <td class="border p-2">4주</td>
            <td class="border p-2">테스트 시나리오, 테스트 결과서</td>
          </tr>
          <tr>
            <td class="border p-2">안정화</td>
            <td class="border p-2">2주</td>
            <td class="border p-2">운영 매뉴얼, 인수인계 문서</td>
          </tr>
        </tbody>
      </table>
    `
  }

  const generateBudget = () => {
    return `
      <h2>예산 계획</h2>
      <p>프로젝트 예산은 다음과 같이 구성됩니다.</p>
      
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="border p-2">항목</th>
            <th class="border p-2">세부 내용</th>
            <th class="border p-2">비용 (만원)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border p-2">인건비</td>
            <td class="border p-2">개발팀 ${length === 'short' ? '5명' : '8명'} × ${length === 'short' ? '6개월' : '8개월'}</td>
            <td class="border p-2 text-right">24,000</td>
          </tr>
          <tr>
            <td class="border p-2">소프트웨어 라이선스</td>
            <td class="border p-2">개발 도구, 서버 라이선스</td>
            <td class="border p-2 text-right">3,000</td>
          </tr>
          <tr>
            <td class="border p-2">인프라 비용</td>
            <td class="border p-2">클라우드 서버, 네트워크</td>
            <td class="border p-2 text-right">2,000</td>
          </tr>
          <tr>
            <td class="border p-2">기타 경비</td>
            <td class="border p-2">출장, 회의, 교육</td>
            <td class="border p-2 text-right">1,000</td>
          </tr>
          <tr class="font-bold">
            <td class="border p-2" colspan="2">총 예산</td>
            <td class="border p-2 text-right">30,000</td>
          </tr>
        </tbody>
      </table>
      
      ${tone === 'professional' ? `
      <h3>결제 조건</h3>
      <ul>
        <li>계약금: 계약 시 30%</li>
        <li>중도금: 개발 완료 시 40%</li>
        <li>잔금: 검수 완료 후 30%</li>
      </ul>
      ` : ''}
    `
  }

  const generateGenericContent = () => {
    return `
      <h2>${section.title}</h2>
      <p>이 섹션은 ${section.title}에 대한 상세한 내용을 포함합니다.</p>
      
      <h3>주요 내용</h3>
      <ul>
        <li>핵심 포인트 1</li>
        <li>핵심 포인트 2</li>
        <li>핵심 포인트 3</li>
      </ul>
      
      <p>추가적인 설명이 필요한 부분입니다. ${tone === 'professional' ? '체계적이고 전문적인 접근을 통해' : '실용적인 방법으로'} 
      최상의 결과를 도출하겠습니다.</p>
    `
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI 콘텐츠 생성
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {section.title} 섹션의 내용을 AI가 자동으로 생성합니다
        </p>
      </div>

      {/* 생성 옵션 선택 */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          생성 방식 선택
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {generationOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedOption === option.id
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {option.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 톤 선택 */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          문체 선택
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setTone('professional')}
            className={`px-4 py-2 rounded-lg border ${
              tone === 'professional'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            전문적
          </button>
          <button
            onClick={() => setTone('casual')}
            className={`px-4 py-2 rounded-lg border ${
              tone === 'casual'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            친근한
          </button>
          <button
            onClick={() => setTone('technical')}
            className={`px-4 py-2 rounded-lg border ${
              tone === 'technical'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            기술적
          </button>
        </div>
      </div>

      {/* 길이 선택 */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          내용 길이
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setLength('short')}
            className={`px-4 py-2 rounded-lg border ${
              length === 'short'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            간단히
          </button>
          <button
            onClick={() => setLength('medium')}
            className={`px-4 py-2 rounded-lg border ${
              length === 'medium'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            보통
          </button>
          <button
            onClick={() => setLength('long')}
            className={`px-4 py-2 rounded-lg border ${
              length === 'long'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            상세히
          </button>
        </div>
      </div>

      {/* 커스텀 프롬프트 */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          추가 지시사항 (선택사항)
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="AI에게 추가로 전달할 지시사항을 입력하세요..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      {/* 생성 버튼 */}
      <div className="flex gap-3">
        <Button
          onClick={generateContent}
          disabled={!selectedOption || isGenerating}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex-1"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              콘텐츠 생성
            </>
          )}
        </Button>

        {existingContent && (
          <Button
            variant="outline"
            onClick={() => setGeneratedContent(existingContent)}
          >
            기존 내용 복원
          </Button>
        )}
      </div>

      {/* 생성된 콘텐츠 미리보기 */}
      {generatedContent && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            생성된 콘텐츠 미리보기
          </h4>
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: generatedContent }}
          />
        </div>
      )}
    </div>
  )
}