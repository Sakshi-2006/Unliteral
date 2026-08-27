import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UNLITERAL — Translate the culture, not just the words',
  description: 'A cultural intelligence studio for localizing dialogue, scripts, and entertainment content.',
  generator: 'v0.app',
}

export const viewport: Viewport = { colorScheme: 'dark light', themeColor: '#0d0f10', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
