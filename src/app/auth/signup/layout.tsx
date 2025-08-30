import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/metadata'

export const metadata: Metadata = PAGE_METADATA.auth.signup

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}