import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.image

export default function ImageGenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}