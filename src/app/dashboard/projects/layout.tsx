import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.projects

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}