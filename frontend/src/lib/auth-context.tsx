'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from './api'

interface Usuario {
  id: number
  nome: string
  email: string
  perfil: 'admin' | 'atendente' | 'operacional' | 'administrativo'
  nome_templo?: string
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isAtendente: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('alafia_token')
    const u = localStorage.getItem('alafia_usuario')
    if (t && u) {
      setToken(t)
      setUsuario(JSON.parse(u))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, senha: string) => {
    const data = await authApi.login(email, senha)
    if (data.error) throw new Error(data.error)
    localStorage.setItem('alafia_token', data.token)
    localStorage.setItem('alafia_usuario', JSON.stringify(data.user))
    setToken(data.token)
    setUsuario(data.user)
  }

  const logout = () => {
    localStorage.removeItem('alafia_token')
    localStorage.removeItem('alafia_usuario')
    setToken(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{
      usuario, token, loading,
      login, logout,
      isAdmin: usuario?.perfil === 'admin',
      isAtendente: ['admin', 'atendente'].includes(usuario?.perfil || ''),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
