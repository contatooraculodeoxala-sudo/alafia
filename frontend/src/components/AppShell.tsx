'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Layout } from './Layout'
import { LoginPage } from './LoginPage'
import { Sparkles } from 'lucide-react'

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0000] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="text-red-500 mx-auto mb-3 animate-pulse" size={40} />
          <p className="text-red-300 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return <LoginPage />

  return <Layout>{children}</Layout>
}
