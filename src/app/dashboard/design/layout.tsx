import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.design

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}