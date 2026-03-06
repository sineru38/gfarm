import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '그라운드팜 | 자연 속 힐링 농장 방갈로 예약',
  description: '경기도 용인 그라운드팜에서 자연과 함께하는 하루. 방갈로 숙박, 텃밭 분양, 체험 프로그램.',
  keywords: '그라운드팜, 방갈로 예약, 용인 농장, 글램핑, 주말농장',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-serif bg-sand-50 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  )
}
