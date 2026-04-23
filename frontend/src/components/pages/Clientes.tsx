'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth-context'
import {
  UserPlus, Search, Phone, MessageCircle, Edit, Eye,
  X, Save, Copy, Users, History, Plus, Printer, Camera
} from 'lucide-react'

interface Cliente {
  id: number; nome: string; telefone: string; email?: string
  data_nascimento?: string; foto_url?: string; origem?: string
  status: string; observacoes?: string; relato_inicial?: string
  melhor_dia?: string; melhor_horario?: string; instagram?: string
  total_consultas?: number; ultima_consulta?: string; trabalhos_ativos?: number
}

interface Historico {
  id: number; tipo: string; titulo: string; descricao?: string
  usuario_nome?: string; criado_em: string
}

const campoVazio: Omit<Cliente, 'id'> = {
  nome: '', telefone: '', email: '', data_nascimento: '', foto_url: '',
  origem: 'direto', status: 'ativo', observacoes: '', relato_inicial: '',
  melhor_dia: '', melhor_horario: '', instagram: ''
}

function PrintField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-300 pb-1.5 mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function Clientes() {
  const { usuario, isAdmin } = useAuth()
  const [lista, setLista] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | 'detalhe' | 'link' | 'print' | null>(null)
  const [selecionado, setSelecionado] = useState<Cliente | null>(null)
  const [form, setForm] = useState<Omit<Cliente, 'id'>>({ ...campoVazio })
  const [historico, setHistorico] = useState<Historico[]>([])
  const [detalheCompleto, setDetalheCompleto] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const carregar = () => {
    const params = new URLSearchParams()
    if (busca) params.set('q', busca)
    if (filtroStatus) params.set('status', filtroStatus)
    api.get(`/clientes?${params}`).then(setLista).catch(() => setLista([])).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [busca, filtroStatus])

  const abrir = (c: Cliente) => {
    setSelecionado(c)
    setForm({ ...campoVazio, ...c })
    api.get(`/clientes/${c.id}`).then(data => {
      setHistorico(data.historico || [])
      setDetalheCompleto(data)
    })
    setModal('detalhe')
  }

  const novo = () => { setSelecionado(null); setForm({ ...campoVazio }); setModal('form') }

  const salvar = async () => {
    setSaving(true)
    try {
      if (selecionado) {
        await api.put(`/clientes/${selecionado.id}`, form)
      } else {
        await api.post('/clientes', { ...form, criado_por: usuario?.id })
      }
      carregar()
      setModal(null)
    } finally { setSaving(false) }
  }

  const whatsapp = (tel: string) => {
    const num = tel.replace(/\D/g, '')
    window.open(`https://wa.me/55${num}`, '_blank')
  }

  const copiarLink = () => {
    const url = `${window.location.origin}/cadastro`
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(p => ({ ...p, foto_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const f = (key: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [key]: e.target.value }))

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm">{lista.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('link')} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            <Copy size={15} /> Link Cadastro
          </button>
          <button onClick={novo} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            <UserPlus size={15} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white">
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="prospecto">Prospecto</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Users size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contato</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Origem</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Consultas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.foto_url ? (
                          <img src={c.foto_url} alt={c.nome} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 text-xs font-bold">{c.nome.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.nome}</p>
                          {c.trabalhos_ativos ? <p className="text-xs text-orange-600">{c.trabalhos_ativos} trabalho(s) ativo(s)</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.telefone}</td>
                    <td className="px-4 py-3"><Badge label={c.origem || 'direto'} /></td>
                    <td className="px-4 py-3"><Badge label={c.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.total_consultas || 0} consulta(s)
                      {c.ultima_consulta && <p className="text-xs text-gray-400">{new Date(c.ultima_consulta).toLocaleDateString('pt-BR')}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrir(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={15} /></button>
                        <button onClick={() => whatsapp(c.telefone)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><MessageCircle size={15} /></button>
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
        <Modal title={selecionado ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foto */}
            <div className="col-span-2 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              {form.foto_url ? (
                <img src={form.foto_url} alt="Foto" className="w-14 h-14 rounded-full object-cover border-2 border-red-200 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-xl">{form.nome?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Foto do Cliente</label>
                <label className="cursor-pointer flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700">
                  <Camera size={13} /> {form.foto_url ? 'Trocar foto' : 'Adicionar foto'}
                  <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
                </label>
                {form.foto_url && (
                  <button type="button" onClick={() => setForm(p => ({ ...p, foto_url: '' }))} className="text-xs text-gray-400 hover:text-red-500 mt-0.5">Remover</button>
                )}
              </div>
            </div>
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nome Completo *</label><input value={form.nome} onChange={f('nome')} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Telefone (WhatsApp) *</label><input value={form.telefone} onChange={f('telefone')} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input value={form.email} onChange={f('email')} type="email" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Data de Nascimento</label><input value={form.data_nascimento} onChange={f('data_nascimento')} type="date" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Instagram</label><input value={form.instagram} onChange={f('instagram')} className={inputCls} placeholder="@usuario" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Origem</label>
              <select value={form.origem} onChange={f('origem')} className={inputCls}>
                <option value="direto">Direto</option><option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option><option value="indicacao">Indicação</option><option value="outro">Outro</option>
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={f('status')} className={inputCls}>
                <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="prospecto">Prospecto</option>
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Melhor Dia</label><input value={form.melhor_dia} onChange={f('melhor_dia')} className={inputCls} placeholder="Ex: Terças e Quintas" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Melhor Horário</label><input value={form.melhor_horario} onChange={f('melhor_horario')} className={inputCls} placeholder="Ex: Manhã, 14h-17h" /></div>
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Relato Inicial</label><textarea value={form.relato_inicial} onChange={f('relato_inicial')} rows={3} className={inputCls} placeholder="O que o cliente está passando..." /></div>
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Observações Internas</label><textarea value={form.observacoes} onChange={f('observacoes')} rows={2} className={inputCls} /></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={salvar} disabled={saving} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Detalhe */}
      {modal === 'detalhe' && selecionado && (
        <Modal title={selecionado.nome} onClose={() => setModal(null)} size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dados */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm border-b pb-2">Informações do Cliente</h3>
              {/* Foto no detalhe */}
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                {form.foto_url ? (
                  <img src={form.foto_url} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-red-200 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-lg">{form.nome?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                )}
                <div>
                  <label className="cursor-pointer flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium">
                    <Camera size={12} /> {form.foto_url ? 'Trocar foto' : 'Adicionar foto'}
                    <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
                  </label>
                  {form.foto_url && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, foto_url: '' }))} className="text-xs text-gray-400 hover:text-red-500 mt-0.5 block">Remover</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nome</label><input value={form.nome} onChange={f('nome')} className={inputCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Telefone</label><input value={form.telefone} onChange={f('telefone')} className={inputCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input value={form.email} onChange={f('email')} className={inputCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nascimento</label><input value={form.data_nascimento} onChange={f('data_nascimento')} type="date" className={inputCls} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Origem</label>
                  <select value={form.origem} onChange={f('origem')} className={inputCls}>
                    <option value="direto">Direto</option><option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option><option value="indicacao">Indicação</option><option value="outro">Outro</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={f('status')} className={inputCls}>
                    <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="prospecto">Prospecto</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Relato Inicial</label><textarea value={form.relato_inicial} onChange={f('relato_inicial')} rows={3} className={inputCls} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label><textarea value={form.observacoes} onChange={f('observacoes')} rows={2} className={inputCls} /></div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => whatsapp(form.telefone)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button onClick={salvar} disabled={saving} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-60">
                  <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button onClick={() => setModal('print')} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200">
                  <Printer size={14} /> Imprimir Ficha
                </button>
              </div>
            </div>

            {/* Histórico CRM */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm border-b pb-2 mb-3">Histórico CRM</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historico.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sem histórico</p>}
                {historico.map(h => (
                  <div key={h.id} className="p-3 bg-gray-50 rounded-lg border-l-2 border-red-400">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-800">{h.titulo}</p>
                      <Badge label={h.tipo} />
                    </div>
                    {h.descricao && <p className="text-xs text-gray-500 mt-1">{h.descricao}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(h.criado_em).toLocaleString('pt-BR')} {h.usuario_nome ? `— ${h.usuario_nome}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Link Inteligente */}
      {modal === 'link' && (
        <Modal title="Link de Cadastro Inteligente" onClose={() => setModal(null)} size="sm">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Copy size={24} className="text-red-600" />
            </div>
            <p className="text-gray-600 text-sm">Envie este link para o cliente preencher o cadastro. Os dados entram automaticamente no sistema.</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 font-mono break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/cadastro</p>
            </div>
            <button onClick={copiarLink} className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              {linkCopiado ? '✓ Link Copiado!' : 'Copiar Link'}
            </button>
            <p className="text-xs text-gray-400">O cliente preenche nome, telefone, tipo de consulta e relato. Tudo vai direto pro sistema.</p>
          </div>
        </Modal>
      )}

      {/* Print Overlay — Ficha do Cliente */}
      {modal === 'print' && selecionado && (
        <div id="ficha-cliente-print-root" className="fixed inset-0 z-[100] bg-white overflow-auto">
          {/* Controles (ocultos ao imprimir) */}
          <div className="print:hidden sticky top-0 flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 z-10">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              <Printer size={15} /> Imprimir / Salvar PDF
            </button>
            <button onClick={() => setModal('detalhe')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100">
              <X size={15} /> Voltar
            </button>
            <span className="text-xs text-gray-400 ml-2">Ctrl+P para imprimir diretamente</span>
          </div>

          {/* Conteúdo da ficha */}
          <div className="max-w-[794px] mx-auto p-10">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between pb-6 border-b-2 border-gray-800 mb-6">
              <div className="flex items-center gap-4">
                {form.foto_url ? (
                  <img src={form.foto_url} alt={selecionado.nome} className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center">
                    <span className="text-red-600 text-2xl font-bold">{selecionado.nome.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selecionado.nome}</h1>
                  <p className="text-sm text-gray-500">Ficha do Cliente — Aláfia Sistema</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Data de impressão:</p>
                <p>{new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
              </div>
            </div>

            {/* Grid de dados */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <PrintField label="Telefone" value={selecionado.telefone} />
              <PrintField label="Email" value={selecionado.email || '—'} />
              <PrintField label="Nascimento" value={selecionado.data_nascimento ? new Date(selecionado.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} />
              <PrintField label="Origem" value={selecionado.origem || '—'} />
              <PrintField label="Status" value={selecionado.status} />
              <PrintField label="Instagram" value={selecionado.instagram || '—'} />
            </div>

            {selecionado.relato_inicial && (
              <PrintSection title="Relato Inicial">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selecionado.relato_inicial}</p>
              </PrintSection>
            )}

            {selecionado.observacoes && (
              <PrintSection title="Observações Internas">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selecionado.observacoes}</p>
              </PrintSection>
            )}

            <PrintSection title={`Consultas (${detalheCompleto?.consultas?.length || 0})`}>
              {(!detalheCompleto?.consultas || detalheCompleto.consultas.length === 0) ? (
                <p className="text-sm text-gray-400">Nenhuma consulta registrada</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Data</th>
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Valor</th>
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalheCompleto.consultas.map((c: any) => (
                      <tr key={c.id} className="border-b border-gray-100">
                        <td className="py-1.5">{new Date(c.data_consulta).toLocaleDateString('pt-BR')}</td>
                        <td className="py-1.5">{c.tipo_nome || '—'}</td>
                        <td className="py-1.5">R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-1.5">{c.status_pagamento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </PrintSection>

            <PrintSection title={`Trabalhos Espirituais (${detalheCompleto?.trabalhos?.length || 0})`}>
              {(!detalheCompleto?.trabalhos || detalheCompleto.trabalhos.length === 0) ? (
                <p className="text-sm text-gray-400">Nenhum trabalho registrado</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Início</th>
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Valor</th>
                      <th className="text-left py-1.5 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalheCompleto.trabalhos.map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-100">
                        <td className="py-1.5">{t.tipo_nome || 'Espiritual'}</td>
                        <td className="py-1.5">{new Date(t.data_inicio).toLocaleDateString('pt-BR')}</td>
                        <td className="py-1.5">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-1.5">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </PrintSection>

            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
              <p>Documento gerado pelo Sistema Aláfia — Confidencial</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
