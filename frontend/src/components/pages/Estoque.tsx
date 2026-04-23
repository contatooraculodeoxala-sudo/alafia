'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Package, Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface Item {
  id: number; nome: string; categoria_id?: number; categoria_nome?: string
  quantidade: number; unidade: string; quantidade_minima: number
  valor_unitario: number; fornecedor?: string
  historico?: any[]
}
interface Cat { id: number; nome: string }

const vazio = {
  nome: '', categoria_id: '', quantidade: '0', unidade: 'un',
  quantidade_minima: '5', valor_unitario: '0', fornecedor: ''
}

export function Estoque() {
  const [lista, setLista] = useState<Item[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | 'entrada' | 'saida' | 'detalhe' | null>(null)
  const [selecionado, setSelecionado] = useState<Item | null>(null)
  const [form, setForm] = useState({ ...vazio })
  const [movForm, setMovForm] = useState({ quantidade: '1', motivo: '' })
  const [saving, setSaving] = useState(false)
  const [filtroAlerta, setFiltroAlerta] = useState(false)

  const carregar = () => {
    const p = filtroAlerta ? '?alerta=1' : ''
    Promise.all([
      api.get(`/estoque${p}`).catch(() => []),
      api.get('/estoque/categorias').catch(() => []),
    ]).then(([e, c]) => {
      setLista(Array.isArray(e) ? e : [])
      setCats(Array.isArray(c) ? c : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [filtroAlerta])

  const abrir = (item?: Item) => {
    setSelecionado(item || null)
    setForm(item ? {
      nome: item.nome, categoria_id: String(item.categoria_id || ''),
      quantidade: String(item.quantidade), unidade: item.unidade,
      quantidade_minima: String(item.quantidade_minima),
      valor_unitario: String(item.valor_unitario), fornecedor: item.fornecedor || ''
    } : { ...vazio })
    setModal('form')
  }

  const detalhe = (item: Item) => {
    api.get(`/estoque/${item.id}`).then(d => { setSelecionado(d); setModal('detalhe') })
  }

  const salvar = async () => {
    setSaving(true)
    try {
      const p = {
        ...form, quantidade: parseFloat(form.quantidade) || 0,
        quantidade_minima: parseFloat(form.quantidade_minima) || 5,
        valor_unitario: parseFloat(form.valor_unitario) || 0,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null
      }
      if (selecionado) await api.put(`/estoque/${selecionado.id}`, p)
      else await api.post('/estoque', p)
      carregar(); setModal(null)
    } finally { setSaving(false) }
  }

  const mover = async (tipo: 'entrada' | 'saida') => {
    if (!selecionado) return
    await api.post(`/estoque/${selecionado.id}/${tipo}`, movForm)
    carregar(); setModal(null); setMovForm({ quantidade: '1', motivo: '' })
  }

  const alertas = lista.filter(i => i.quantidade <= i.quantidade_minima)
  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
  const f = (k: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-500 text-sm">{lista.length} itens cadastrados</p>
        </div>
        <button onClick={() => abrir()} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          <Plus size={15} /> Novo Item
        </button>
      </div>

      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer" onClick={() => setFiltroAlerta(true)}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <p className="text-amber-800 font-semibold text-sm">{alertas.length} ite(ns) com estoque baixo</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setFiltroAlerta(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filtroAlerta ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Todos
        </button>
        <button onClick={() => setFiltroAlerta(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filtroAlerta ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Alertas ({alertas.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Package size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum item cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quantidade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mínimo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor Unit.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
                      {item.fornecedor && <p className="text-xs text-gray-400">{item.fornecedor}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.categoria_nome || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${item.quantidade <= item.quantidade_minima ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.quantidade} {item.unidade}
                      </span>
                      {item.quantidade <= item.quantidade_minima && (
                        <AlertTriangle size={12} className="inline ml-1 text-amber-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.quantidade_minima} {item.unidade}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">R$ {item.valor_unitario.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelecionado(item); setModal('entrada') }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Entrada">
                          <TrendingUp size={15} />
                        </button>
                        <button onClick={() => { setSelecionado(item); setModal('saida') }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Saída">
                          <TrendingDown size={15} />
                        </button>
                        <button onClick={() => abrir(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Package size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modal === 'form' && (
        <Modal title={selecionado ? 'Editar Item' : 'Novo Item no Estoque'} onClose={() => setModal(null)} size="md">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label><input value={form.nome} onChange={f('nome')} className={inputCls} /></div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
              <select value={form.categoria_id} onChange={f('categoria_id')} className={inputCls}>
                <option value="">Sem categoria</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Unidade</label><input value={form.unidade} onChange={f('unidade')} className={inputCls} placeholder="un, kg, L..." /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade Inicial</label><input type="number" value={form.quantidade} onChange={f('quantidade')} step="0.1" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Estoque Mínimo</label><input type="number" value={form.quantidade_minima} onChange={f('quantidade_minima')} step="1" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Valor Unitário (R$)</label><input type="number" value={form.valor_unitario} onChange={f('valor_unitario')} step="0.01" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fornecedor</label><input value={form.fornecedor} onChange={f('fornecedor')} className={inputCls} /></div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Entrada/Saída */}
      {(modal === 'entrada' || modal === 'saida') && selecionado && (
        <Modal title={`${modal === 'entrada' ? 'Entrada' : 'Saída'} de Estoque — ${selecionado.nome}`} onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade</label>
              <input type="number" value={movForm.quantidade} onChange={e => setMovForm(p => ({ ...p, quantidade: e.target.value }))} step="0.1" className={inputCls} />
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Motivo</label>
              <input value={movForm.motivo} onChange={e => setMovForm(p => ({ ...p, motivo: e.target.value }))} className={inputCls} placeholder={modal === 'entrada' ? 'Compra, reposição...' : 'Uso em trabalho, descarte...'} />
            </div>
            <p className="text-xs text-gray-500">Estoque atual: <strong>{selecionado.quantidade} {selecionado.unidade}</strong></p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancelar</button>
              <button onClick={() => mover(modal as 'entrada' | 'saida')} className={`flex-1 py-2 text-white rounded-lg text-sm ${modal === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Registrar {modal === 'entrada' ? 'Entrada' : 'Saída'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
