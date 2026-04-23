'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard, Users, Calendar, Sparkles, Package,
  DollarSign, BarChart3, UserCog, Megaphone, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Bell, Shield
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', perfis: ['admin','atendente','operacional','administrativo'] },
  { href: '/clientes', icon: Users, label: 'Clientes', perfis: ['admin','atendente','administrativo'] },
  { href: '/consultas', icon: Calendar, label: 'Consultas', perfis: ['admin','atendente'] },
  { href: '/trabalhos', icon: Sparkles, label: 'Trabalhos', perfis: ['admin','atendente','operacional'] },
  { href: '/estoque', icon: Package, label: 'Estoque', perfis: ['admin','operacional','administrativo'] },
  { href: '/financeiro', icon: DollarSign, label: 'Financeiro', perfis: ['admin','administrativo'] },
  { href: '/relatorios', icon: BarChart3, label: 'Relatórios', perfis: ['admin','administrativo'] },
  { href: '/marketing', icon: Megaphone, label: 'Marketing', perfis: ['admin'] },
  { href: '/equipe', icon: UserCog, label: 'Equipe', perfis: ['admin'] },
  { href: '/configuracoes', icon: Settings, label: 'Configurações', perfis: ['admin'] },
]

interface Props { children: ReactNode }

export function Layout({ children }: Props) {
  const { usuario, logout, isAdmin } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = navItems.filter(item =>
    item.perfis.includes(usuario?.perfil || '')
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-red-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Aláfia</h1>
              <p className="text-red-300 text-xs mt-0.5 truncate max-w-[140px]">
                {usuario?.nome_templo || 'Sistema Espiritual'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {visibleItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                active
                  ? 'bg-red-600 text-white'
                  : 'text-red-200 hover:bg-red-900 hover:text-white'
              }`}
            >
              <item.icon size={19} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-red-900">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {usuario?.nome?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{usuario?.nome}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                usuario?.perfil === 'admin' ? 'bg-red-600 text-white' : 'bg-red-900 text-red-200'
              }`}>
                {usuario?.perfil}
              </span>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-red-300 hover:text-white" title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-[#1a0000] transition-all duration-300 flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#1a0000] z-50 flex flex-col lg:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <button
              className="hidden lg:block text-gray-400 hover:text-gray-600"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                {usuario?.nome_templo || 'Aláfia'}
              </h2>
              {usuario?.nome && (
                <p className="text-xs text-gray-400">Olá, {usuario.nome.split(' ')[0]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full">
                <Shield size={12} />
                <span>Admin</span>
              </div>
            )}
            <button onClick={logout} className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50" title="Sair">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
