import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Inteligência Viagens',
    template: '%s | Inteligência Viagens',
  },
  description: 'Planeje sua viagem perfeita com inteligência artificial. Voos, hotéis e atividades em tempo real.',
  keywords: ['viagens', 'turismo', 'voos', 'hotéis', 'inteligência artificial', 'planejamento de viagem'],
  authors: [{ name: 'Inteligência Viagens' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Inteligência Viagens',
    description: 'Planeje sua viagem perfeita com IA',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F9E64',
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
              iconTheme: { primary: '#0F9E64', secondary: '#FDFAF5' },
            },
          }}
        />
      </body>
    </html>
  )
}
