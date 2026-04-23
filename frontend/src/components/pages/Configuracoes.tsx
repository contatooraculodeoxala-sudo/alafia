'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Settings, Save, Check, Plus, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface TipoTrabalho { id: number; nome: string; descricao?: string; valor_padrao: number; duracao_dias: number }

const tipoVazio = { nome: '', descricao: '', valor_padrao: '', duracao_dias: '7' }

export function Configuracoes() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tipos, setTipos] = useState<TipoTrabalho[]>([])
  const [tipoForm, setTipoForm] = useState({ ...tipoVazio })
  const [editandoTipo, setEditandoTipo] = useState<TipoTrabalho | null>(null)
  const [savingTipo, setSavingTipo] = useState(false)
  const [tipoModal, setTipoModal] = useState(false)

  useEffect(() => {
    api.get('/config').then(d => setConfig(d || {})).finally(() => setLoading(false))
    api.get('/trabalhos/tipos/lista').then(t => setTipos(Array.isArray(t) ? t : []))
  }, [])

  const salvar = async () => {
    setSaving(true)
    try {
      await api.put('/config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const abrirTipoModal = (tipo?: TipoTrabalho) => {
    setEditandoTipo(tipo || null)
    setTipoForm(tipo ? { nome: tipo.nome, descricao: tipo.descricao || '', valor_padrao: String(tipo.valor_padrao), duracao_dias: String(tipo.duracao_dias) } : { ...tipoVazio })
    setTipoModal(true)
  }

  const salvarTipo = async () => {
    if (!tipoForm.nome.trim()) return
    setSavingTipo(true)
    try {
      const p = { ...tipoForm, valor_padrao: parseFloat(tipoForm.valor_padrao) || 0, duracao_dias: parseInt(tipoForm.duracao_dias) || 7 }
      if (editandoTipo) await api.put(`/trabalhos/tipos/${editandoTipo.id}`, p)
      else await api.post('/trabalhos/tipos/criar', p)
      const atualizado = await api.get('/trabalhos/tipos/lista')
      setTipos(Array.isArray(atualizado) ? atualizado : [])
      setTipoModal(false)
    } finally { setSavingTipo(false) }
  }

  const excluirTipo = async (tipo: TipoTrabalho) => {
    if (!confirm(`Desativar o tipo "${tipo.nome}"? Ele não aparecerá mais ao criar trabalhos.`)) return
    await api.delete(`/trabalhos/tipos/${tipo.id}`)
    setTipos(p => p.filter(t => t.id !== tipo.id))
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"

  if (loading) return <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm">Personalize seu sistema Aláfia</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Identidade */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Identidade do Templo</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Templo / Casa Espiritual</label>
              <input value={config.nome_templo || ''} onChange={e => setConfig(p => ({ ...p, nome_templo: e.target.value }))} className={inputCls} placeholder="Ex: Templo Aláfia, Casa de Umbanda..." />
              <p className="text-xs text-gray-400 mt-1">Este nome aparece no topo do sistema e nas telas de login</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Administradora</label>
              <input value={config.nome_admin || ''} onChange={e => setConfig(p => ({ ...p, nome_admin: e.target.value }))} className={inputCls} placeholder="Ex: Mãe Karmita" />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Contato e Redes Sociais</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Número WhatsApp (com DDD)</label>
              <input value={config.whatsapp_numero || ''} onChange={e => setConfig(p => ({ ...p, whatsapp_numero: e.target.value }))} className={inputCls} placeholder="Ex: 11999999999" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Perfil do Instagram</label>
              <input value={config.instagram_perfil || ''} onChange={e => setConfig(p => ({ ...p, instagram_perfil: e.target.value }))} className={inputCls} placeholder="@nome_do_perfil" />
            </div>
          </div>
        </div>

        {/* Tipos de Trabalho */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Tipos de Trabalho</h3>
            <button onClick={() => abrirTipoModal()} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">
              <Plus size={12} /> Novo Tipo
            </button>
          </div>
          {tipos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhum tipo cadastrado</p>
          ) : (
            <div className="space-y-2">
              {tipos.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{t.nome}</p>
                    <p className="text-xs text-gray-500">
                      R$ {(t.valor_padrao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — {t.duracao_dias} dias
                    </p>
                    {t.descricao && <p className="text-xs text-gray-400 truncate">{t.descricao}</p>}
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <button onClick={() => abrirTipoModal(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => excluirTipo(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={salvar} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
            {saved ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> {saving ? 'Salvando...' : 'Salvar Configurações'}</>}
          </button>
        </div>
      </div>

      {/* Modal Tipo de Trabalho */}
      {tipoModal && (
        <Modal title={editandoTipo ? 'Editar Tipo de Trabalho' : 'Novo Tipo de Trabalho'} onClose={() => setTipoModal(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label>
              <input value={tipoForm.nome} onChange={e => setTipoForm(p => ({ ...p, nome: e.target.value }))} className={inputCls} placeholder="Ex: Fechamento de Corpo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
              <textarea value={tipoForm.descricao} onChange={e => setTipoForm(p => ({ ...p, descricao: e.target.value }))} rows={2} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Padrão (R$)</label>
                <input type="number" value={tipoForm.valor_padrao} onChange={e => setTipoForm(p => ({ ...p, valor_padrao: e.target.value }))} step="0.01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Duração (dias)</label>
                <input type="number" value={tipoForm.duracao_dias} onChange={e => setTipoForm(p => ({ ...p, duracao_dias: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setTipoModal(false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancelar</button>
              <button onClick={salvarTipo} disabled={savingTipo || !tipoForm.nome.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
                {savingTipo ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
