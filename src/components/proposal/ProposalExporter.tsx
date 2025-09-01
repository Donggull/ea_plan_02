'use client'

import { useState } from 'react'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Globe,
  Settings,
  Check,
  Loader2
} from 'lucide-react'
import Button from '@/basic/src/components/Button/Button'
import type { ProposalDocument, ProposalSection } from '@/types/proposal'

interface ProposalExporterProps {
  proposalDocument: ProposalDocument
  sections: ProposalSection[]
  onExport?: (format: string, options: ExportOptions) => void
}

interface ExportOptions {
  format: 'pdf' | 'docx' | 'pptx' | 'html'
  includeComments: boolean
  includeMetadata: boolean
  includeTOC: boolean
  includePageNumbers: boolean
  includeWatermark: boolean
  watermarkText?: string
  pageSize: 'A4' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export default function ProposalExporter({ 
  proposalDocument, 
  sections,
  onExport 
}: ProposalExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'pptx' | 'html'>('pdf')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeComments: false,
    includeMetadata: true,
    includeTOC: true,
    includePageNumbers: true,
    includeWatermark: false,
    watermarkText: '',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 25,
      bottom: 25,
      left: 25,
      right: 25
    }
  })

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: '인쇄 및 공유에 최적화',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    {
      id: 'docx',
      name: 'Word',
      description: '편집 가능한 문서',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'pptx',
      name: 'PowerPoint',
      description: '프레젠테이션 형식',
      icon: <Presentation className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    {
      id: 'html',
      name: 'HTML',
      description: '웹 페이지 형식',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-green-100 text-green-700 border-green-200'
    }
  ]

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // 진행 상황 시뮬레이션
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // 실제 내보내기 로직 구현
      const exportData = prepareExportData()
      
      // 형식에 따른 내보내기 처리
      switch (selectedFormat) {
        case 'pdf':
          await exportToPDF(exportData)
          break
        case 'docx':
          await exportToWord(exportData)
          break
        case 'pptx':
          await exportToPowerPoint(exportData)
          break
        case 'html':
          await exportToHTML(exportData)
          break
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      // 성공 후 처리
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        if (onExport) {
          onExport(selectedFormat, exportOptions)
        }
      }, 1000)

    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const prepareExportData = () => {
    // 내보낼 데이터 준비
    const visibleSections = sections.filter(s => s.is_visible)
    
    return {
      title: proposalDocument.title,
      metadata: proposalDocument.metadata,
      sections: visibleSections,
      options: exportOptions,
      generatedAt: new Date().toISOString()
    }
  }

  const exportToPDF = async (data: any) => {
    // PDF 내보내기 시뮬레이션
    // 실제 구현에서는 jsPDF 또는 서버 API 사용
    const content = generateHTMLContent(data)
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${proposalDocument.title}_${new Date().getTime()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToWord = async (data: any) => {
    // Word 내보내기 시뮬레이션
    // 실제 구현에서는 docx 라이브러리 사용
    const content = generateHTMLContent(data)
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${proposalDocument.title}_${new Date().getTime()}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPowerPoint = async (data: any) => {
    // PowerPoint 내보내기 시뮬레이션
    // 실제 구현에서는 pptxgenjs 라이브러리 사용
    const content = generateHTMLContent(data)
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${proposalDocument.title}_${new Date().getTime()}.pptx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToHTML = async (data: any) => {
    // HTML 내보내기
    const content = generateHTMLContent(data)
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${proposalDocument.title}_${new Date().getTime()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateHTMLContent = (data: any) => {
    let html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body { 
            font-family: 'Malgun Gothic', sans-serif; 
            line-height: 1.6; 
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          h3 { color: #7f8c8d; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .toc { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .toc h2 { margin-top: 0; }
          .toc ul { list-style: none; padding-left: 0; }
          .toc li { margin: 5px 0; }
          .toc a { text-decoration: none; color: #3498db; }
          .watermark { 
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(0,0,0,0.05);
            z-index: -1;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
    `

    // 워터마크 추가
    if (exportOptions.includeWatermark && exportOptions.watermarkText) {
      html += `<div class="watermark">${exportOptions.watermarkText}</div>`
    }

    // 제목
    html += `<h1>${data.title}</h1>`

    // 메타데이터
    if (exportOptions.includeMetadata) {
      html += `
        <div class="metadata">
          <p><strong>작성일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
          <p><strong>버전:</strong> ${proposalDocument.version}</p>
          <p><strong>상태:</strong> ${proposalDocument.status}</p>
        </div>
      `
    }

    // 목차
    if (exportOptions.includeTOC && data.sections.length > 0) {
      html += `
        <div class="toc">
          <h2>목차</h2>
          <ul>
      `
      data.sections.forEach((section: ProposalSection, index: number) => {
        html += `<li><a href="#section-${index}">${index + 1}. ${section.title}</a></li>`
      })
      html += `
          </ul>
        </div>
      `
    }

    // 섹션 내용
    data.sections.forEach((section: ProposalSection, index: number) => {
      html += `
        <div id="section-${index}" class="section">
          <h2>${index + 1}. ${section.title}</h2>
          ${section.content || '<p>내용이 없습니다.</p>'}
        </div>
      `
    })

    // 페이지 번호 (인쇄 시)
    if (exportOptions.includePageNumbers) {
      html += `
        <style>
          @page { 
            @bottom-right { 
              content: counter(page); 
            } 
          }
        </style>
      `
    }

    html += `
      </body>
      </html>
    `

    return html
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          제안서 내보내기
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          제안서를 다양한 형식으로 내보낼 수 있습니다
        </p>
      </div>

      {/* 형식 선택 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {exportFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => setSelectedFormat(format.id as any)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedFormat === format.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg inline-flex ${format.color} mb-2`}>
              {format.icon}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {format.name}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {format.description}
            </p>
          </button>
        ))}
      </div>

      {/* 고급 옵션 */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Settings className="h-4 w-4" />
          {showAdvancedOptions ? '옵션 숨기기' : '고급 옵션'}
        </button>

        {showAdvancedOptions && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {/* 포함 옵션 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTOC}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeTOC: e.target.checked
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">목차 포함</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includePageNumbers}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includePageNumbers: e.target.checked
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">페이지 번호 포함</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeMetadata: e.target.checked
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">메타데이터 포함</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeWatermark}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeWatermark: e.target.checked
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">워터마크 추가</span>
              </label>
            </div>

            {/* 워터마크 텍스트 */}
            {exportOptions.includeWatermark && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  워터마크 텍스트
                </label>
                <input
                  type="text"
                  value={exportOptions.watermarkText}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    watermarkText: e.target.value
                  })}
                  placeholder="예: CONFIDENTIAL"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
            )}

            {/* 페이지 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  페이지 크기
                </label>
                <select
                  value={exportOptions.pageSize}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    pageSize: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  방향
                </label>
                <select
                  value={exportOptions.orientation}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    orientation: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="portrait">세로</option>
                  <option value="landscape">가로</option>
                </select>
              </div>
            </div>

            {/* 여백 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                여백 (mm)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  value={exportOptions.margins.top}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    margins: {
                      ...exportOptions.margins,
                      top: parseInt(e.target.value)
                    }
                  })}
                  placeholder="위"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center"
                />
                <input
                  type="number"
                  value={exportOptions.margins.bottom}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    margins: {
                      ...exportOptions.margins,
                      bottom: parseInt(e.target.value)
                    }
                  })}
                  placeholder="아래"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center"
                />
                <input
                  type="number"
                  value={exportOptions.margins.left}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    margins: {
                      ...exportOptions.margins,
                      left: parseInt(e.target.value)
                    }
                  })}
                  placeholder="왼쪽"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center"
                />
                <input
                  type="number"
                  value={exportOptions.margins.right}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    margins: {
                      ...exportOptions.margins,
                      right: parseInt(e.target.value)
                    }
                  })}
                  placeholder="오른쪽"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 내보내기 정보 */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              내보낼 준비가 되었습니다
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {sections.filter(s => s.is_visible).length}개 섹션, 
              약 {Math.ceil(proposalDocument.metadata.word_count / 250)}페이지
            </p>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              내보내기 진행 중...
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {exportProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 내보내기 버튼 */}
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            내보내는 중...
          </>
        ) : exportProgress === 100 ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            완료!
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {selectedFormat.toUpperCase()}로 내보내기
          </>
        )}
      </Button>
    </div>
  )
}