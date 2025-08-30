import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.publishing

export default function PublishingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}