'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import {
  Users, Calendar, Sparkles, DollarSign, Package,
  AlertTriangle, Clock, TrendingUp, CheckCircle2
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function Dashboard() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [consultasHoje, setConsultasHoje] = useState<any[]>([])
  const [trabalhosSemana, setTrabalhosSemana] = useState<any[]>([])
  const [alertasEstoque, setAlertasEstoque] = useState<any[]>([])
  const [mensal, setMensal] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/financeiro/relatorio/geral').catch(() => null),
      api.get('/consultas/hoje').catch(() => []),
      api.get('/trabalhos?status=em_andamento').catch(() => []),
      api.get('/estoque/alertas').catch(() => []),
      api.get('/financeiro/relatorio/mensal').catch(() => []),
    ]).then(([s, ch, tr, al, mn]) => {
      setStats(s)
      setConsultasHoje(Array.isArray(ch) ? ch : [])
      setTrabalhosSemana(Array.isArray(tr) ? tr.slice(0, 5) : [])
      setAlertasEstoque(Array.isArray(al) ? al : [])
      const chart = (Array.isArray(mn) ? mn : []).map((r: any) => ({
        mes: MESES[parseInt(r.mes) - 1] || r.mes,
        Entradas: r.entradas || 0,
        Saídas: r.saidas || 0,
        Lucro: r.lucro || 0,
      }))
      setMensal(chart)
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center">
        <Sparkles className="text-red-500 mx-auto mb-2 animate-pulse" size={32} />
        <p className="text-gray-500 text-sm">Carregando dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {usuario?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {usuario?.nome_templo || 'Sistema Aláfia'} — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes Ativos" value={stats?.clientesAtivos || 0} sub={`${stats?.totalClientes || 0} no total`} icon={Users} color="blue" onClick={() => router.push('/clientes')} />
        <StatCard title="Consultas Hoje" value={consultasHoje.length} sub="agendadas" icon={Calendar} color="purple" onClick={() => router.push('/consultas')} />
        <StatCard title="Trabalhos Ativos" value={stats?.totalTrabalhos || 0} sub="em andamento" icon={Sparkles} color="orange" onClick={() => router.push('/trabalhos')} />
        <StatCard title="Receita Total" value={fmt(stats?.receitaTotal)} sub={`Lucro: ${fmt(stats?.lucroLiquido)}`} icon={DollarSign} color="green" onClick={() => router.push('/financeiro')} />
      </div>

      {/* Alertas de estoque */}
      {alertasEstoque.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm">Estoque Baixo</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertasEstoque.map((item: any) => (
              <span key={item.id} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-lg cursor-pointer" onClick={() => router.push('/estoque')}>
                {item.nome}: {item.quantidade} {item.unidade} (mín: {item.quantidade_minima})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Charts + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico financeiro mensal */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Financeiro Mensal</h3>
          {mensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} />
                <Area type="monotone" dataKey="Entradas" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
                <Area type="monotone" dataKey="Saídas" stroke="#dc2626" fill="#fee2e2" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sem dados financeiros ainda</div>
          )}
        </div>

        {/* Consultas de hoje */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Consultas de Hoje</h3>
            <button onClick={() => router.push('/consultas')} className="text-xs text-red-600 hover:underline">Ver todas</button>
          </div>
          {consultasHoje.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-gray-400">
              <Calendar size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Nenhuma consulta hoje</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {consultasHoje.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => router.push('/consultas')}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.cliente_nome}</p>
                    <p className="text-xs text-gray-500">{c.tipo_nome || 'Consulta'} • {new Date(c.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <Badge label={c.status_atendimento} />
                    <p className="text-xs text-gray-500 mt-1">R$ {(c.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trabalhos ativos */}
      {trabalhosSemana.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-red-500" /> Trabalhos em Andamento
            </h3>
            <button onClick={() => router.push('/trabalhos')} className="text-xs text-red-600 hover:underline">Ver todos</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trabalhosSemana.map((t: any) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:border-red-200" onClick={() => router.push('/trabalhos')}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.cliente_nome}</p>
                  <Badge label={t.status_pagamento} />
                </div>
                <p className="text-xs text-gray-500">{t.tipo_nome || 'Trabalho'}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> {new Date(t.data_inicio).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs font-semibold text-green-700">R$ {(t.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
