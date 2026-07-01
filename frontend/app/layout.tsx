import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '书签管理器 - Bookmark Manager',
  description: '高效管理数千个书签的专业工具',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/bookmark-favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="overflow-hidden font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex h-screen flex-col overflow-hidden bg-background">
            <div className="min-h-0 flex-1 overflow-hidden">
              {children}
            </div>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 shrink-0 items-center justify-center border-t border-border bg-background px-4 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              京ICP备2023017216号-1
            </a>
          </div>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
