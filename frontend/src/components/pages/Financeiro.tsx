'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, Camera, Receipt } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Papa from 'papaparse'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function Financeiro() {
  const [resumo, setResumo] = useState<any>(null)
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [mensal, setMensal] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | null>(null)
  const [periodo, setPeriodo] = useState('mes')
  const [form, setForm] = useState({ tipo: 'entrada', categoria: 'consulta', descricao: '', valor: '', data_transacao: new Date().toISOString().slice(0,16), comprovante_base64: '' })
  const [saving, setSaving] = useState(false)

  const carregar = () => {
    Promise.all([
      api.get(`/financeiro/resumo?periodo=${periodo}`).catch(() => null),
      api.get('/financeiro/transacoes?limit=50').catch(() => []),
      api.get('/financeiro/relatorio/mensal').catch(() => []),
    ]).then(([r, t, m]) => {
      setResumo(r)
      setTransacoes(Array.isArray(t) ? t : [])
      const chart = (Array.isArray(m) ? m : []).map((row: any) => ({
        mes: MESES[parseInt(row.mes) - 1] || row.mes,
        Entradas: row.entradas || 0, Saídas: row.saidas || 0, Lucro: row.lucro || 0,
      }))
      setMensal(chart)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [periodo])

  const salvar = async () => {
    setSaving(true)
    try {
      await api.post('/financeiro/transacoes', { ...form, valor: parseFloat(form.valor) || 0 })
      carregar(); setModal(null)
      setForm({ tipo: 'entrada', categoria: 'consulta', descricao: '', valor: '', data_transacao: new Date().toISOString().slice(0,16), comprovante_base64: '' })
    } finally { setSaving(false) }
  }

  const handleComprovanteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(p => ({ ...p, comprovante_base64: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const exportar = () => {
    const csv = Papa.unparse(transacoes.map(t => ({
      data: new Date(t.data_transacao).toLocaleDateString('pt-BR'),
      tipo: t.tipo, categoria: t.categoria, descricao: t.descricao,
      valor: t.valor.toFixed(2)
    })))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `financeiro-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const fmt = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const f = (k: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))
  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm">Controle de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportar} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> Exportar CSV
          </button>
          <button onClick={() => setModal('form')} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            <Plus size={15} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Filtro período */}
      <div className="flex gap-2">
        {[['hoje','Hoje'],['semana','Semana'],['mes','Este Mês'],['','Tudo']].map(([v, l]) => (
          <button key={v} onClick={() => setPeriodo(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${periodo === v ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Entradas" value={fmt(resumo?.entradas)} icon={TrendingUp} color="green" />
        <StatCard title="Saídas" value={fmt(resumo?.saidas)} icon={TrendingDown} color="red" />
        <StatCard title="Saldo" value={fmt(resumo?.saldo)} icon={DollarSign} color={(resumo?.saldo || 0) >= 0 ? 'green' : 'red'} />
      </div>

      {/* Gráfico */}
      {mensal.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => `R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`} />
              <Legend />
              <Bar dataKey="Entradas" fill="#16a34a" radius={[4,4,0,0]} />
              <Bar dataKey="Saídas" fill="#dc2626" radius={[4,4,0,0]} />
              <Bar dataKey="Lucro" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transações */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900">Últimas Transações</h3>
          <span className="text-xs text-gray-400">{transacoes.length} registros</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Carregando...</div>
        ) : transacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400">
            <p className="text-sm">Nenhuma transação registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Comprovante</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3"><Badge label={t.tipo} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{t.categoria}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{t.descricao}</td>
                    <td className="px-4 py-3 text-center">
                      {t.comprovante_base64 ? (
                        <button onClick={() => window.open(t.comprovante_base64, '_blank')} title="Ver comprovante" className="inline-block">
                          <img src={t.comprovante_base64} alt="Comprovante"
                            className="w-8 h-8 object-cover rounded border border-gray-200 hover:scale-110 transition-transform" />
                        </button>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${t.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                      {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal === 'form' && (
        <Modal title="Nova Transação" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                <select value={form.tipo} onChange={f('tipo')} className={inputCls}>
                  <option value="entrada">Entrada</option><option value="saida">Saída</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
                <select value={form.categoria} onChange={f('categoria')} className={inputCls}>
                  <option value="consulta">Consulta</option><option value="trabalho">Trabalho</option>
                  <option value="material">Material</option><option value="estoque">Estoque</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Descrição *</label><input value={form.descricao} onChange={f('descricao')} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$) *</label><input type="number" value={form.valor} onChange={f('valor')} step="0.01" className={inputCls} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Data</label><input type="datetime-local" value={form.data_transacao} onChange={f('data_transacao')} className={inputCls} /></div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Comprovante de Pagamento</label>
              {form.comprovante_base64 ? (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <img src={form.comprovante_base64} alt="Comprovante" className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Comprovante anexado</p>
                    <button type="button" onClick={() => setForm(p => ({ ...p, comprovante_base64: '' }))} className="text-xs text-red-500 hover:underline">Remover</button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-xs text-gray-500">
                  <Receipt size={14} className="text-gray-400" /> Anexar comprovante (imagem)
                  <input type="file" accept="image/*" onChange={handleComprovanteUpload} className="hidden" />
                </label>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancelar</button>
              <button onClick={salvar} disabled={saving} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
