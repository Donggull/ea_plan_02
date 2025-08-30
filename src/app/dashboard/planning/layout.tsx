import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.planning

export default function PlanningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}