'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { UserCog, Plus, Edit, Shield } from 'lucide-react'

interface Membro {
  id: number; nome: string; email: string; perfil: string; ativo: number
  nome_templo?: string; total_consultas_atendidas?: number; total_trabalhos?: number
}

const vazio = { nome: '', email: '', senha: '', perfil: 'atendente', nome_templo: '', ativo: 1 }

export function Equipe() {
  const [lista, setLista] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'form' | null>(null)
  const [selecionado, setSelecionado] = useState<Membro | null>(null)
  const [form, setForm] = useState({ ...vazio })
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = () => {
    api.get('/equipe').then(d => setLista(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrir = (m?: Membro) => {
    setSelecionado(m || null)
    setErro('')
    setForm(m ? { nome: m.nome, email: m.email, senha: '', perfil: m.perfil, nome_templo: m.nome_templo || '', ativo: m.ativo } : { ...vazio })
    setModal('form')
  }

  const salvar = async () => {
    setSaving(true); setErro('')
    try {
      if (selecionado) await api.put(`/equipe/${selecionado.id}`, form)
      else await api.post('/equipe', form)
      carregar(); setModal(null)
    } catch (e: any) { setErro(e.message || 'Erro ao salvar') }
    finally { setSaving(false) }
  }

  const desativar = async (id: number) => {
    if (!confirm('Desativar este membro?')) return
    await api.delete(`/equipe/${id}`)
    carregar()
  }

  const f = (k: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))
  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"

  const perfilDesc: Record<string, string> = {
    admin: 'Acesso total ao sistema',
    atendente: 'Clientes, consultas, trabalhos',
    operacional: 'Trabalhos e estoque',
    administrativo: 'Estoque e financeiro',
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-500 text-sm">{lista.length} membros cadastrados</p>
        </div>
        <button onClick={() => abrir()} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          <Plus size={15} /> Novo Membro
        </button>
      </div>

      {/* Tabela de permissões */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Níveis de Acesso</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(perfilDesc).map(([p, desc]) => (
            <div key={p} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Badge label={p} />
              <p className="text-xs text-gray-500 mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Membro</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Perfil</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Atendimentos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">{m.nome.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.nome}</p>
                          {m.nome_templo && <p className="text-xs text-gray-400">{m.nome_templo}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.email}</td>
                    <td className="px-4 py-3"><Badge label={m.perfil} /></td>
                    <td className="px-4 py-3"><Badge label={m.ativo ? 'ativo' : 'inativo'} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.total_consultas_atendidas || 0} consul. · {m.total_trabalhos || 0} trab.
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrir(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                        {m.ativo ? (
                          <button onClick={() => desativar(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs px-2">Desativar</button>
                        ) : null}
                      </div>
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
        <Modal title={selecionado ? 'Editar Membro' : 'Novo Membro da Equipe'} onClose={() => setModal(null)} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nome Completo *</label><input value={form.nome} onChange={f('nome')} className={inputCls} /></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label><input type="email" value={form.email} onChange={f('email')} className={inputCls} /></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Senha {selecionado ? '(deixe vazio para manter)' : '*'}</label><input type="password" value={form.senha} onChange={f('senha')} className={inputCls} /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Perfil *</label>
                <select value={form.perfil} onChange={f('perfil')} className={inputCls}>
                  <option value="atendente">Atendente</option>
                  <option value="operacional">Operacional</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={String(form.ativo)} onChange={e => setForm(p => ({ ...p, ativo: parseInt(e.target.value) }))} className={inputCls}>
                  <option value="1">Ativo</option><option value="0">Inativo</option>
                </select>
              </div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Templo</label><input value={form.nome_templo} onChange={f('nome_templo')} className={inputCls} /></div>
            </div>
            {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{erro}</div>}
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
