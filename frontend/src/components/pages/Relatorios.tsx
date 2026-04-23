'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart3, Users, DollarSign, Calendar, TrendingUp, Download, Sparkles } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Papa from 'papaparse'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const CORES = ['#f80707','#2563eb','#16a34a','#d97706','#7c3aed','#0891b2']

export function Relatorios() {
  const [geral, setGeral] = useState<any>(null)
  const [mensal, setMensal] = useState<any[]>([])
  const [origens, setOrigens] = useState<any[]>([])
  const [funil, setFunil] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/financeiro/relatorio/geral').catch(() => null),
      api.get('/financeiro/relatorio/mensal').catch(() => []),
      api.get('/marketing/origem/stats').catch(() => []),
      api.get('/marketing/funil').catch(() => null),
    ]).then(([g, m, o, f]) => {
      setGeral(g)
      setMensal(Array.isArray(m) ? m.map((r: any) => ({
        mes: MESES[parseInt(r.mes) - 1] || r.mes,
        Entradas: r.entradas || 0, Saídas: r.saidas || 0, Lucro: r.lucro || 0
      })) : [])
      setOrigens(Array.isArray(o) ? o : [])
      setFunil(f)
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const exportarGeral = () => {
    if (!geral) return
    const data = [
      { metrica: 'Total de Clientes', valor: geral.totalClientes },
      { metrica: 'Clientes Ativos', valor: geral.clientesAtivos },
      { metrica: 'Total de Consultas', valor: geral.totalConsultas },
      { metrica: 'Total de Trabalhos', valor: geral.totalTrabalhos },
      { metrica: 'Receita Total', valor: geral.receitaTotal.toFixed(2) },
      { metrica: 'Despesas Total', valor: geral.despesasTotal.toFixed(2) },
      { metrica: 'Lucro Líquido', valor: geral.lucroLiquido.toFixed(2) },
      { metrica: 'Taxa de Fechamento (%)', valor: geral.taxaFechamento },
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([Papa.unparse(data)], { type: 'text/csv' }))
    a.download = `relatorio-geral-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportarMensal = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([Papa.unparse(mensal)], { type: 'text/csv' }))
    a.download = `relatorio-mensal-${new Date().getFullYear()}.csv`
    a.click()
  }

  const funilData = funil ? [
    { name: 'Prospectos', value: funil.prospectos },
    { name: 'Ativos', value: funil.ativos },
    { name: 'Com Consulta', value: funil.comConsulta },
    { name: 'Com Trabalho', value: funil.comTrabalho },
    { name: 'Pagaram', value: funil.pagos },
  ] : []

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center"><Sparkles className="text-red-500 mx-auto mb-2 animate-pulse" size={32} /><p className="text-gray-500 text-sm">Gerando relatórios...</p></div>
    </div>
  )

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm">Visão completa do negócio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarGeral} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> Relatório Geral
          </button>
          <button onClick={exportarMensal} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> Mensal
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clientes" value={geral?.totalClientes || 0} sub={`${geral?.clientesAtivos || 0} ativos`} icon={Users} color="blue" />
        <StatCard title="Consultas" value={geral?.totalConsultas || 0} sub={`${geral?.taxaFechamento || 0}% fechamento`} icon={Calendar} color="purple" />
        <StatCard title="Trabalhos" value={geral?.totalTrabalhos || 0} icon={Sparkles} color="orange" />
        <StatCard title="Lucro Líquido" value={fmt(geral?.lucroLiquido)} sub={`Receita: ${fmt(geral?.receitaTotal)}`} icon={DollarSign} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico mensal */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Financeiro por Mês</h3>
          {mensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={mensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`} />
                <Legend />
                <Bar dataKey="Entradas" fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="Saídas" fill="#dc2626" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">Sem dados</div>}
        </div>

        {/* Funil de clientes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Funil de Clientes</h3>
          <div className="space-y-3">
            {funilData.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{item.name}</span>
                  <span className="text-xs font-bold text-gray-900">{item.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{
                    width: `${funilData[0]?.value ? Math.round((item.value / funilData[0].value) * 100) : 0}%`,
                    backgroundColor: CORES[i % CORES.length]
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Origens */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Clientes por Origem</h3>
          {origens.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={origens} dataKey="total" nameKey="origem" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {origens.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {origens.map((o, i) => (
                  <div key={o.origem} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                      <span className="text-xs text-gray-600 capitalize">{o.origem || 'Direto'}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{o.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">Sem dados</div>}
        </div>

        {/* Resumo financeiro */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Resumo Financeiro</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Receita Total</span>
              <span className="text-sm font-bold text-green-700">{fmt(geral?.receitaTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total de Despesas</span>
              <span className="text-sm font-bold text-red-700">{fmt(geral?.despesasTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Lucro Líquido</span>
              <span className={`text-sm font-bold ${(geral?.lucroLiquido || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(geral?.lucroLiquido)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Taxa de Fechamento</span>
              <span className="text-sm font-bold text-blue-700">{geral?.taxaFechamento || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Clientes Ativos / Total</span>
              <span className="text-sm font-bold text-gray-800">{geral?.clientesAtivos || 0} / {geral?.totalClientes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
