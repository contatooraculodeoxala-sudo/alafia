'use client'

import { useState } from 'react'
import { publicApi } from '@/lib/api'
import { Sparkles, CheckCircle, Send, AlertCircle } from 'lucide-react'

type Step = 'form' | 'success' | 'error'

export default function CadastroPublico() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '', data_nascimento: '',
    tipo_consulta: '', tipo_trabalho: '', relato_inicial: '',
    melhor_dia: '', melhor_horario: ''
  })

  const f = (k: keyof typeof form) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await publicApi.cadastrar(form)
      if (res.success) setStep('success')
      else setStep('error')
    } catch { setStep('error') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
        <p className="text-gray-500 text-sm">Seus dados foram recebidos com sucesso. Em breve nossa equipe entrará em contato pelo WhatsApp para agendar seu atendimento.</p>
        <p className="text-gray-400 text-xs mt-4">Que a paz e a luz do Aláfia esteja com você ✨</p>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ocorreu um problema</h2>
        <p className="text-gray-500 text-sm mb-4">Não conseguimos enviar seu cadastro. Tente novamente ou entre em contato diretamente pelo WhatsApp.</p>
        <button onClick={() => setStep('form')} className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700">Tentar Novamente</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Aláfia</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha o formulário para iniciar seu atendimento</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={enviar} className="space-y-5">
            {/* Dados pessoais */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                📋 Seus Dados
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome Completo *</label>
                  <input value={form.nome} onChange={f('nome')} required className={inputCls} placeholder="Seu nome completo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Telefone (WhatsApp) *</label>
                  <input value={form.telefone} onChange={f('telefone')} required type="tel" className={inputCls} placeholder="(11) 99999-9999" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input value={form.email} onChange={f('email')} type="email" className={inputCls} placeholder="seu@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Nascimento</label>
                    <input value={form.data_nascimento} onChange={f('data_nascimento')} type="date" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de atendimento */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                🌟 Tipo de Atendimento
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Consulta</label>
                  <select value={form.tipo_consulta} onChange={f('tipo_consulta')} className={inputCls}>
                    <option value="">Selecione...</option>
                    <option value="espiritual_geral">Consulta Espiritual Geral</option>
                    <option value="amorosa">Consulta Amorosa</option>
                    <option value="financeira">Consulta Financeira</option>
                    <option value="direcionamento">Direcionamento Espiritual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Trabalho (se necessário)</label>
                  <select value={form.tipo_trabalho} onChange={f('tipo_trabalho')} className={inputCls}>
                    <option value="">Selecione...</option>
                    <option value="limpeza">Limpeza Espiritual</option>
                    <option value="protecao">Proteção Espiritual</option>
                    <option value="abertura_caminhos">Abertura de Caminhos</option>
                    <option value="amoroso">Trabalho Amoroso</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Relato */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                💬 Seu Relato
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Conte brevemente o que está passando e o que busca *
                </label>
                <textarea
                  value={form.relato_inicial}
                  onChange={f('relato_inicial')}
                  required
                  rows={4}
                  className={inputCls}
                  placeholder="Descreva sua situação e o que você busca com nosso atendimento..."
                />
                <p className="text-xs text-gray-400 mt-1">Suas informações são tratadas com total sigilo e respeito.</p>
              </div>
            </div>

            {/* Disponibilidade */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                📅 Disponibilidade
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Melhor Dia</label>
                  <select value={form.melhor_dia} onChange={f('melhor_dia')} className={inputCls}>
                    <option value="">Qualquer dia</option>
                    <option value="segunda">Segunda-feira</option>
                    <option value="terca">Terça-feira</option>
                    <option value="quarta">Quarta-feira</option>
                    <option value="quinta">Quinta-feira</option>
                    <option value="sexta">Sexta-feira</option>
                    <option value="sabado">Sábado</option>
                    <option value="domingo">Domingo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Melhor Horário</label>
                  <select value={form.melhor_horario} onChange={f('melhor_horario')} className={inputCls}>
                    <option value="">Qualquer horário</option>
                    <option value="manha">Manhã (8h-12h)</option>
                    <option value="tarde">Tarde (13h-17h)</option>
                    <option value="noite">Noite (18h-21h)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {loading ? 'Enviando...' : 'Enviar Cadastro'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Ao enviar, você concorda com o tratamento dos seus dados para fins de atendimento espiritual.
          </p>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Aláfia — Sistema de Gestão Espiritual
        </p>
      </div>
    </div>
  )
}
