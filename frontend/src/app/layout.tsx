import Script from 'next/script'
import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aláfia — Sistema de Gestão Espiritual',
  description: 'Sistema completo de gestão para trabalhos espirituais'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
        <Script src="https://cdn.jsdelivr.net/npm/@nxcode/sdk@latest/dist/nxcode.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  )
}
 