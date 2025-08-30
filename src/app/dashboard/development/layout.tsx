import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.development

export default function DevelopmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}