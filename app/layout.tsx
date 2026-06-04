import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist, Geist_Mono, IBM_Plex_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-doc',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'PitchBack — The investor is waiting',
  description:
    'AI pitch coaching with emotional D-ID investor avatars. Interrogation Room.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${playfair.variable} ${cormorant.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
