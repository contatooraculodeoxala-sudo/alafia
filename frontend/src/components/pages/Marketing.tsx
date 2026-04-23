'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { Megaphone, Plus, AtSign, Users, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Campanha {
  id: number; nome: string; canal: string; data_inicio?: string
  data_fim?: string; orcamento: number; status: string; observacoes?: string
}

const CORES = ['#f80707','#e1306c','#2563eb','#16a34a','#7c3aed']
const vazio = { nome: '', canal: 'instagram', data_inicio: '', data_fim: '', orcamento: '0', status: 'ativa', observacoes: '' }

export function Marketing() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [origens, setOrigens] = useState<any[]>([])
  const [funil, setFunil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | null>(null)
  const [selecionado, setSelecionado] = useState<Campanha | null>(null)
  const [form, setForm] = useState({ ...vazio })
  const [saving, setSaving] = useState(false)

  const carregar = () => {
    Promise.all([
      api.get('/marketing/campanhas').catch(() => []),
      api.get('/marketing/origem/stats').catch(() => []),
      api.get('/marketing/funil').catch(() => null),
    ]).then(([c, o, f]) => {
      setCampanhas(Array.isArray(c) ? c : [])
      setOrigens(Array.isArray(o) ? o : [])
      setFunil(f)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrir = (c?: Campanha) => {
    setSelecionado(c || null)
    setForm(c ? { nome: c.nome, canal: c.canal, data_inicio: c.data_inicio || '', data_fim: c.data_fim || '', orcamento: String(c.orcamento), status: c.status, observacoes: c.observacoes || '' } : { ...vazio })
    setModal('form')
  }

  const salvar = async () => {
    setSaving(true)
    try {
      const p = { ...form, orcamento: parseFloat(form.orcamento) || 0 }
      if (selecionado) await api.put(`/marketing/campanhas/${selecionado.id}`, p)
      else await api.post('/marketing/campanhas', p)
      carregar(); setModal(null)
    } finally { setSaving(false) }
  }

  const f = (k: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))
  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
  const totalOrcamento = campanhas.filter(c => c.status === 'ativa').reduce((s, c) => s + c.orcamento, 0)

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-500 text-sm">Campanhas e origem de clientes</p>
        </div>
        <button onClick={() => abrir()} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          <Plus size={15} /> Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Campanhas Ativas" value={campanhas.filter(c => c.status === 'ativa').length} icon={Megaphone} color="red" />
        <StatCard title="Orçamento Ativo" value={`R$ ${totalOrcamento.toLocaleString('pt-BR',{minimumFractionDigits:2})}`} icon={TrendingUp} color="orange" />
        <StatCard title="Clientes via Instagram" value={origens.find(o => o.origem === 'instagram')?.total || 0} icon={AtSign} color="purple" />
        <StatCard title="Total Clientes" value={origens.reduce((s, o) => s + o.total, 0)} icon={Users} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origem */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-4">Clientes por Origem</h3>
          {origens.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={origens} dataKey="total" nameKey="origem" cx="50%" cy="50%" outerRadius={70} label={false}>
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
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-800">{o.total}</span>
                      <span className="text-xs text-gray-400 ml-1">({o.ativos} ativos)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">Sem dados de origem</div>}
        </div>

        {/* Funil */}
        {funil && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-sm text-gray-900 mb-4">Funil de Conversão</h3>
            <div className="space-y-3">
              {[
                { label: 'Prospectos', value: funil.prospectos, cor: '#6b7280' },
                { label: 'Clientes Ativos', value: funil.ativos, cor: '#2563eb' },
                { label: 'Fizeram Consulta', value: funil.comConsulta, cor: '#7c3aed' },
                { label: 'Fizeram Trabalho', value: funil.comTrabalho, cor: '#f80707' },
                { label: 'Realizaram Pagamento', value: funil.pagos, cor: '#16a34a' },
              ].map((item, i) => {
                const base = funil.prospectos + funil.ativos || 1
                const pct = Math.round((item.value / base) * 100)
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-bold text-gray-900">{item.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.cor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Campanhas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Campanhas</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Carregando...</div>
        ) : campanhas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400">
            <Megaphone size={28} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhuma campanha cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Canal</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Período</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Orçamento</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campanhas.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.nome}</td>
                    <td className="px-4 py-3"><Badge label={c.canal} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.data_inicio ? new Date(c.data_inicio).toLocaleDateString('pt-BR') : '—'}
                      {c.data_fim ? ` → ${new Date(c.data_fim).toLocaleDateString('pt-BR')}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">R$ {c.orcamento.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="px-4 py-3"><Badge label={c.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrir(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
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
        <Modal title={selecionado ? 'Editar Campanha' : 'Nova Campanha'} onClose={() => setModal(null)} size="md">
          <div className="space-y-4">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label><input value={form.nome} onChange={f('nome')} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Canal</label>
                <select value={form.canal} onChange={f('canal')} className={inputCls}>
                  <option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option>
                  <option value="facebook">Facebook</option><option value="outro">Outro</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={f('status')} className={inputCls}>
                  <option value="ativa">Ativa</option><option value="pausada">Pausada</option><option value="encerrada">Encerrada</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Início</label><input type="date" value={form.data_inicio} onChange={f('data_inicio')} className={inputCls} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fim</label><input type="date" value={form.data_fim} onChange={f('data_fim')} className={inputCls} /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Orçamento (R$)</label><input type="number" value={form.orcamento} onChange={f('orcamento')} step="0.01" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label><textarea value={form.observacoes} onChange={f('observacoes')} rows={2} className={inputCls} /></div>
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
