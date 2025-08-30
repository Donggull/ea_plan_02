import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.chatbot

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}