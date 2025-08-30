import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.auth.login

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}