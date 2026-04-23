'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth-context'
import { CalendarPlus, Search, Calendar, DollarSign, ChevronRight } from 'lucide-react'

interface Consulta {
  id: number; cliente_id: number; cliente_nome?: string; cliente_telefone?: string
  tipo_consulta_id?: number; tipo_nome?: string; data_consulta: string
  valor: number; valor_pago?: number; status_pagamento: string
  status_atendimento: string; observacoes?: string; proximo_contato?: string
  atendente_nome?: string
}
interface TipoConsulta { id: number; nome: string; valor_padrao: number }
interface Cliente { id: number; nome: string; telefone: string }

const vazio = {
  cliente_id: '', tipo_consulta_id: '', tipo_nome: '', data_consulta: '',
  valor: '', status_pagamento: 'pendente', status_atendimento: 'agendado',
  observacoes: '', proximo_contato: ''
}

export function Consultas() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState<Consulta[]>([])
  const [tipos, setTipos] = useState<TipoConsulta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | null>(null)
  const [selecionado, setSelecionado] = useState<Consulta | null>(null)
  const [form, setForm] = useState({ ...vazio })
  const [saving, setSaving] = useState(false)
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0])

  const carregar = () => {
    const p = new URLSearchParams()
    if (filtroData) p.set('data', filtroData)
    Promise.all([
      api.get(`/consultas?${p}`).catch(() => []),
      api.get('/consultas/tipos/lista').catch(() => []),
      api.get('/clientes').catch(() => []),
    ]).then(([c, t, cl]) => {
      setLista(Array.isArray(c) ? c : [])
      setTipos(Array.isArray(t) ? t : [])
      setClientes(Array.isArray(cl) ? cl : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [filtroData])

  const abrir = (c?: Consulta) => {
    setSelecionado(c || null)
    setForm(c ? {
      cliente_id: String(c.cliente_id), tipo_consulta_id: String(c.tipo_consulta_id || ''),
      tipo_nome: c.tipo_nome || '', data_consulta: c.data_consulta?.slice(0, 16) || '',
      valor: String(c.valor), status_pagamento: c.status_pagamento,
      status_atendimento: c.status_atendimento, observacoes: c.observacoes || '',
      proximo_contato: c.proximo_contato?.slice(0, 16) || ''
    } : { ...vazio })
    setModal('form')
  }

  const salvar = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form, valor: parseFloat(String(form.valor)) || 0,
        tipo_consulta_id: form.tipo_consulta_id ? parseInt(form.tipo_consulta_id) : null,
        cliente_id: parseInt(form.cliente_id),
        atendente_id: usuario?.id
      }
      if (selecionado) await api.put(`/consultas/${selecionado.id}`, payload)
      else await api.post('/consultas', payload)
      carregar(); setModal(null)
    } finally { setSaving(false) }
  }

  const f = (k: keyof typeof form) => (e: any) => {
    const val = e.target.value
    setForm(p => {
      const upd = { ...p, [k]: val }
      if (k === 'tipo_consulta_id') {
        const t = tipos.find(t => t.id === parseInt(val))
        if (t) { upd.tipo_nome = t.nome; upd.valor = String(t.valor_padrao) }
      }
      return upd
    })
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"

  const totalValor = lista.reduce((s, c) => s + c.valor, 0)
  const totalPago = lista.filter(c => c.status_pagamento === 'pago').reduce((s, c) => s + c.valor, 0)

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
          <p className="text-gray-500 text-sm">{lista.length} consultas</p>
        </div>
        <button onClick={() => abrir()} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          <CalendarPlus size={15} /> Nova Consulta
        </button>
      </div>

      {/* Stats do dia */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">{lista.length}</p>
          <p className="text-xs text-gray-500 mt-1">Consultas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">R$ {totalValor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
          <p className="text-xs text-gray-500 mt-1">Valor Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-700">R$ {totalPago.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
          <p className="text-xs text-gray-500 mt-1">Recebido</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-3">
        <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
        <button onClick={() => setFiltroData('')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          Todas as Datas
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Calendar size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhuma consulta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pagamento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Atendimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{c.cliente_nome}</p>
                      <p className="text-xs text-gray-400">{c.cliente_telefone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.tipo_nome || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                      <p className="text-xs text-gray-400">{new Date(c.data_consulta).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">R$ {c.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="px-4 py-3"><Badge label={c.status_pagamento} /></td>
                    <td className="px-4 py-3"><Badge label={c.status_atendimento} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrir(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <ChevronRight size={15} />
                      </button>
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
        <Modal title={selecionado ? 'Editar Consulta' : 'Nova Consulta'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente *</label>
              <select value={form.cliente_id} onChange={f('cliente_id')} className={inputCls}>
                <option value="">Selecionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Consulta</label>
              <select value={form.tipo_consulta_id} onChange={f('tipo_consulta_id')} className={inputCls}>
                <option value="">Selecionar tipo...</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nome} — R$ {t.valor_padrao}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$)</label>
              <input type="number" value={form.valor} onChange={f('valor')} step="0.01" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Data e Hora *</label>
              <input type="datetime-local" value={form.data_consulta} onChange={f('data_consulta')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Próximo Contato</label>
              <input type="datetime-local" value={form.proximo_contato} onChange={f('proximo_contato')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status Pagamento</label>
              <select value={form.status_pagamento} onChange={f('status_pagamento')} className={inputCls}>
                <option value="pendente">Pendente</option><option value="pago">Pago</option>
                <option value="parcial">Parcial</option><option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status Atendimento</label>
              <select value={form.status_atendimento} onChange={f('status_atendimento')} className={inputCls}>
                <option value="agendado">Agendado</option><option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option><option value="nao_compareceu">Não Compareceu</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={f('observacoes')} rows={3} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
