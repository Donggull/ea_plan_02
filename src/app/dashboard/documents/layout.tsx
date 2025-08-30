import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: '문서 관리',
  description: '문서를 업로드하고 AI 기반 검색, 분석을 수행하여 효율적으로 관리하세요.',
  path: '/dashboard/documents',
})

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}