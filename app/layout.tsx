import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap', // 폰트 로딩 시 충돌 방지
})

export const metadata: Metadata = {
  title: "Analytics Dashboard",
  description: "E-commerce analytics dashboard with Apple-inspired design",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning을 추가하여 브라우저와 서버의 미세한 차이로 인한 튕김 방지
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}