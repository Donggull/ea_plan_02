import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EA Plan - 웹·앱 서비스 기획의 새로운 경험',
  description: 'AI 기반 웹·앱 서비스 기획 플랫폼으로 RFP 분석부터 구축 관리, 운영까지 통합 솔루션을 제공합니다.',
  keywords: 'EA Plan, 웹 개발, 앱 개발, 서비스 기획, AI, 프로젝트 관리',
  authors: [{ name: 'EA Plan Team' }],
  openGraph: {
    title: 'EA Plan - 웹·앱 서비스 기획의 새로운 경험',
    description: 'AI 기반 웹·앱 서비스 기획 플랫폼',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
