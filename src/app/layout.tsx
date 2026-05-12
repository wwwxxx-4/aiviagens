import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://cotacao.mesquitaturismo.com.br'
const OG_IMAGE = `${SITE_URL.replace(/\/$/, '')}/og-default.svg`

export const metadata: Metadata = {
  title: {
    default: 'Mesquita Turismo — Sua proposta de viagem',
    template: '%s | Mesquita Turismo',
  },
  description: 'Sua proposta de viagem personalizada — Mesquita Turismo',
  keywords: [
    'viagens',
    'turismo',
    'voos',
    'hotéis',
    'inteligência artificial',
    'Mesquita Turismo',
  ],
  authors: [{ name: 'Mesquita Turismo' }],
  metadataBase: new URL(SITE_URL),
  applicationName: 'Mesquita Turismo',
  appleWebApp: {
    capable: true,
    title: 'Mesquita Turismo',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Mesquita Turismo',
    locale: 'pt_BR',
    title: 'Sua proposta de viagem — Mesquita Turismo',
    description:
      'Voos, hotéis, atividades e tudo o que você precisa para a viagem perfeita, organizado por uma agência especializada.',
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Mesquita Turismo — Sua proposta de viagem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sua proposta de viagem — Mesquita Turismo',
    description:
      'Voos, hotéis, atividades organizados por uma agência especializada.',
    images: [OG_IMAGE],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#185FA5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontSize: '14px',
              background: '#1A1A1A',
              color: '#FDFAF5',
              borderRadius: '10px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#177CBC', secondary: '#FDFAF5' },
            },
          }}
        />
      </body>
    </html>
  )
}
