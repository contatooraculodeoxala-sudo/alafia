'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth-context'
import { Sparkles, Plus, Pencil, Trash2, Eye, Camera, X } from 'lucide-react'

interface Trabalho {
  id: number; cliente_id: number; cliente_nome?: string; cliente_telefone?: string
  tipo_trabalho_id?: number; tipo_nome?: string; data_inicio: string
  data_fim_prevista?: string; data_fim_real?: string; valor: number
  valor_pago?: number; status_pagamento: string; status: string
  observacoes?: string; responsavel_nome?: string
  materiais?: any[]
}
interface TipoTrabalho { id: number; nome: string; valor_padrao: number; duracao_dias: number }
interface Cliente { id: number; nome: string; telefone: string }
interface ItemEstoque { id: number; nome: string; unidade: string; quantidade: number; valor_unitario: number }

const vazio = {
  cliente_id: '', tipo_trabalho_id: '', tipo_nome: '', data_inicio: '',
  data_fim_prevista: '', valor: '', status_pagamento: 'pendente',
  status: 'em_andamento', observacoes: ''
}

export function Trabalhos() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState<Trabalho[]>([])
  const [tipos, setTipos] = useState<TipoTrabalho[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estoque, setEstoque] = useState<ItemEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | 'detalhe' | 'material' | null>(null)
  const [selecionado, setSelecionado] = useState<Trabalho | null>(null)
  const [form, setForm] = useState({ ...vazio })
  const [matForm, setMatForm] = useState({ item_id: '', quantidade: '1', valor_unitario: '' })
  const [saving, setSaving] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('em_andamento')
  const [fotos, setFotos] = useState<any[]>([])
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const carregar = () => {
    const p = filtroStatus ? `?status=${filtroStatus}` : ''
    Promise.all([
      api.get(`/trabalhos${p}`).catch(() => []),
      api.get('/trabalhos/tipos/lista').catch(() => []),
      api.get('/clientes').catch(() => []),
      api.get('/estoque').catch(() => []),
    ]).then(([t, tp, cl, es]) => {
      setLista(Array.isArray(t) ? t : [])
      setTipos(Array.isArray(tp) ? tp : [])
      setClientes(Array.isArray(cl) ? cl : [])
      setEstoque(Array.isArray(es) ? es : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [filtroStatus])

  const abrir = (t?: Trabalho) => {
    setSelecionado(t || null)
    setForm(t ? {
      cliente_id: String(t.cliente_id), tipo_trabalho_id: String(t.tipo_trabalho_id || ''),
      tipo_nome: t.tipo_nome || '', data_inicio: t.data_inicio?.slice(0, 16) || '',
      data_fim_prevista: t.data_fim_prevista?.slice(0, 16) || '',
      valor: String(t.valor), status_pagamento: t.status_pagamento,
      status: t.status, observacoes: t.observacoes || ''
    } : { ...vazio })
    setModal('form')
  }

  const verDetalhe = (t: Trabalho) => {
    api.get(`/trabalhos/${t.id}`).then(data => {
      setSelecionado(data)
      setForm({
        cliente_id: String(data.cliente_id), tipo_trabalho_id: String(data.tipo_trabalho_id || ''),
        tipo_nome: data.tipo_nome || '', data_inicio: data.data_inicio?.slice(0, 16) || '',
        data_fim_prevista: data.data_fim_prevista?.slice(0, 16) || '',
        valor: String(data.valor), status_pagamento: data.status_pagamento,
        status: data.status, observacoes: data.observacoes || ''
      })
      setModal('detalhe')
    })
    api.get(`/trabalhos/${t.id}/fotos`).then(data => setFotos(Array.isArray(data) ? data : []))
  }

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const trabalhoId = selecionado?.id
    if (!file || !trabalhoId) return
    setUploadingFoto(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await api.post(`/trabalhos/${trabalhoId}/fotos`, { foto_base64: reader.result as string, descricao: '' })
        const lista = await api.get(`/trabalhos/${trabalhoId}/fotos`)
        setFotos(Array.isArray(lista) ? lista : [])
      } finally { setUploadingFoto(false) }
    }
    reader.readAsDataURL(file)
  }

  const excluirFoto = async (fotoId: number) => {
    if (!selecionado) return
    await api.delete(`/trabalhos/fotos/${fotoId}`)
    const lista = await api.get(`/trabalhos/${selecionado.id}/fotos`)
    setFotos(Array.isArray(lista) ? lista : [])
  }

  const salvar = async () => {
    setSaving(true)
    try {
      const p = {
        ...form, valor: parseFloat(String(form.valor)) || 0,
        tipo_trabalho_id: form.tipo_trabalho_id ? parseInt(form.tipo_trabalho_id) : null,
        cliente_id: parseInt(form.cliente_id), responsavel_id: usuario?.id
      }
      if (selecionado) await api.put(`/trabalhos/${selecionado.id}`, p)
      else await api.post('/trabalhos', p)
      carregar(); setModal(null)
    } finally { setSaving(false) }
  }

  const adicionarMaterial = async () => {
    if (!selecionado) return
    await api.post(`/trabalhos/${selecionado.id}/materiais`, {
      item_id: parseInt(matForm.item_id),
      quantidade: parseFloat(matForm.quantidade),
      valor_unitario: parseFloat(matForm.valor_unitario) || 0
    })
    const data = await api.get(`/trabalhos/${selecionado.id}`)
    setSelecionado(data)
    setMatForm({ item_id: '', quantidade: '1', valor_unitario: '' })
    setModal('detalhe')
  }

  const excluir = async (t: Trabalho) => {
    if (!confirm(`Excluir o trabalho de "${t.cliente_nome}"? Esta ação não pode ser desfeita.`)) return
    await api.delete(`/trabalhos/${t.id}`)
    carregar()
  }

  const f = (k: keyof typeof form) => (e: any) => {
    const val = e.target.value
    setForm(p => {
      const u = { ...p, [k]: val }
      if (k === 'tipo_trabalho_id') {
        const t = tipos.find(t => t.id === parseInt(val))
        if (t) {
          u.tipo_nome = t.nome
          u.valor = String(t.valor_padrao)
          const inicio = new Date()
          const fim = new Date(inicio.getTime() + t.duracao_dias * 24 * 60 * 60 * 1000)
          u.data_inicio = inicio.toISOString().slice(0, 16)
          u.data_fim_prevista = fim.toISOString().slice(0, 16)
        }
      }
      return u
    })
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabalhos Espirituais</h1>
          <p className="text-gray-500 text-sm">{lista.length} trabalho(s)</p>
        </div>
        <button onClick={() => abrir()} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          <Plus size={15} /> Novo Trabalho
        </button>
      </div>

      <div className="flex gap-2">
        {['em_andamento','finalizado','cancelado',''].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroStatus === s ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'Todos'}{s === 'em_andamento' ? ' (Ativos)' : s === 'finalizado' ? ' (Finalizados)' : s === 'cancelado' ? ' (Cancelados)' : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center h-32 text-gray-400">
            <Sparkles size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum trabalho encontrado</p>
          </div>
        ) : lista.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-red-600" />
              </div>
              <Badge label={t.status} />
            </div>
            <h3 className="font-bold text-gray-900">{t.cliente_nome}</h3>
            <p className="text-sm text-gray-500">{t.tipo_nome || 'Trabalho Espiritual'}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-700">R$ {t.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                <Badge label={t.status_pagamento} />
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Início: {new Date(t.data_inicio).toLocaleDateString('pt-BR')}</p>
                {t.data_fim_prevista && <p>Prev: {new Date(t.data_fim_prevista).toLocaleDateString('pt-BR')}</p>}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <button onClick={() => verDetalhe(t)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                <Eye size={13} /> Ver / Editar
              </button>
              <button onClick={() => abrir(t)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Pencil size={13} /> Editar
              </button>
              <button onClick={() => excluir(t)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {modal === 'form' && (
        <Modal title={selecionado ? 'Editar Trabalho' : 'Novo Trabalho'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente *</label>
              <select value={form.cliente_id} onChange={f('cliente_id')} className={inputCls}>
                <option value="">Selecionar cliente...</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Trabalho</label>
              <select value={form.tipo_trabalho_id} onChange={f('tipo_trabalho_id')} className={inputCls}>
                <option value="">Selecionar tipo...</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nome} — R$ {t.valor_padrao}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$)</label>
              <input type="number" value={form.valor} onChange={f('valor')} step="0.01" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Data Início</label>
              <input type="datetime-local" value={form.data_inicio} onChange={f('data_inicio')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Previsão de Conclusão</label>
              <input type="datetime-local" value={form.data_fim_prevista} onChange={f('data_fim_prevista')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status Pagamento</label>
              <select value={form.status_pagamento} onChange={f('status_pagamento')} className={inputCls}>
                <option value="pendente">Pendente</option><option value="pago">Pago</option>
                <option value="parcial">Parcial</option><option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={f('status')} className={inputCls}>
                <option value="em_andamento">Em Andamento</option><option value="pausado">Pausado</option>
                <option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option>
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

      {/* Modal Detalhe */}
      {modal === 'detalhe' && selecionado && (
        <Modal title={`Trabalho — ${selecionado.cliente_nome}`} onClose={() => setModal(null)} size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Informações</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Status</label><Badge label={form.status} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Pagamento</label><Badge label={form.status_pagamento} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Status Atual</label>
                  <select value={form.status} onChange={f('status')} className={inputCls}>
                    <option value="em_andamento">Em Andamento</option><option value="pausado">Pausado</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Status Pagamento</label>
                  <select value={form.status_pagamento} onChange={f('status_pagamento')} className={inputCls}>
                    <option value="pendente">Pendente</option><option value="pago">Pago</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
                  <textarea value={form.observacoes} onChange={f('observacoes')} rows={3} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={salvar} disabled={saving} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button onClick={() => { setModal(null); excluir(selecionado!) }} className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-700">Materiais Utilizados</h3>
                  <button onClick={() => setModal('material')} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {(!selecionado.materiais || selecionado.materiais.length === 0) ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhum material registrado</p>
                  ) : selecionado.materiais.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.item_nome}</p>
                        <p className="text-xs text-gray-500">{m.quantidade} {m.unidade}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-700">R$ {(m.quantidade * m.valor_unitario).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fotos do Trabalho */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-700">Fotos do Trabalho</h3>
                  <label className="cursor-pointer text-xs text-red-600 hover:underline flex items-center gap-1">
                    <Camera size={12} /> {uploadingFoto ? 'Enviando...' : 'Adicionar'}
                    <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" disabled={uploadingFoto} />
                  </label>
                </div>
                {fotos.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Nenhuma foto anexada</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {fotos.map((foto: any) => (
                      <div key={foto.id} className="relative group">
                        <img src={foto.foto_base64} alt={foto.descricao || 'Foto'}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(foto.foto_base64, '_blank')} />
                        <button
                          onClick={() => excluirFoto(foto.id)}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        ><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Adicionar Material */}
      {modal === 'material' && (
        <Modal title="Adicionar Material" onClose={() => setModal('detalhe')} size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item do Estoque</label>
              <select value={matForm.item_id} onChange={e => {
                const item = estoque.find(i => i.id === parseInt(e.target.value))
                setMatForm(p => ({ ...p, item_id: e.target.value, valor_unitario: item ? String(item.valor_unitario) : '' }))
              }} className={inputCls}>
                <option value="">Selecionar item...</option>
                {estoque.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.quantidade} {i.unidade} disp.)</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade</label>
                <input type="number" value={matForm.quantidade} onChange={e => setMatForm(p => ({ ...p, quantidade: e.target.value }))} step="0.1" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Unit. (R$)</label>
                <input type="number" value={matForm.valor_unitario} onChange={e => setMatForm(p => ({ ...p, valor_unitario: e.target.value }))} step="0.01" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal('detalhe')} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancelar</button>
              <button onClick={adicionarMaterial} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Adicionar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
