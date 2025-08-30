import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.chat

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}