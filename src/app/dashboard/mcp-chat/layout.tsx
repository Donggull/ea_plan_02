import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.mcpChat

export default function McpChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}