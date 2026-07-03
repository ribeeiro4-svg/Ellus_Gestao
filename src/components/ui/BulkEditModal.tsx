'use client'
import React, { useState } from 'react'
import { X, Save, AlertCircle, Bookmark, CreditCard, Layers, Calendar, Target, ArrowUpCircle, ArrowDownCircle, Briefcase, CheckCircle2 } from 'lucide-react'
import { MESES } from '@/lib/utils/formatters'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: any) => void
  selectedCount: number
  categories: { id: string; nome: string }[]
  planoContas?: { id: string; codigo: string; descricao: string }[]
  contas?: { id: string; nome: string }[]
  diretores?: { id: string; nome: string }[]
  associados?: { id: string; nome: string; status?: string }[]
}

const PAYMENT_METHODS = ['PIX', 'Boleto', 'Dinheiro', 'Transferência']

export default function BulkEditModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  categories,
  planoContas,
  contas,
  diretores,
  associados
}: BulkEditModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [step, setStep] = useState<1 | 2>(1)

  if (!isOpen) return null

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }))
  }

  const handleNext = () => {
    if (Object.keys(formData).length === 0) {
      alert('Nenhum campo foi alterado.')
      return
    }
    setStep(2)
  }

  const handleConfirm = () => {
    onConfirm(formData)
    onClose()
    // reset after close
    setTimeout(() => {
      setFormData({})
      setStep(1)
    }, 300)
  }

  const formatKeyName = (k: string) => {
    const map: any = {
      status: 'Status de Pagamento',
      fixo_variavel: 'Natureza',
      categoria: 'Categoria',
      forma_pagamento: 'Forma de Pagamento',
      status_cobranca: 'Status de Cobrança',
      vencimento_dia_bulk: 'Dia de Vencimento',
      competencia_mes: 'Mês de Competência',
      competencia_ano: 'Ano de Competência',
      conta_id: 'Conta Bancária',
      conta_debito_id: 'Conta de Débito (Contábil)',
      conta_credito_id: 'Conta de Crédito (Contábil)',
      diretor_id: 'Diretor Vinculado',
      associado_id: 'Associado Individual'
    }
    return map[k] || k
  }

  const formatValueName = (k: string, v: any) => {
    if (k === 'competencia_mes') return MESES[v as number]
    if (k === 'conta_id') return contas?.find(c => c.id === v)?.nome || v
    if (k === 'conta_debito_id' || k === 'conta_credito_id') return planoContas?.find(p => p.id === v)?.descricao || v
    if (k === 'diretor_id') {
      if (v === 'null') return 'Desvincular'
      return diretores?.find(d => d.id === v)?.nome || v
    }
    if (k === 'associado_id') {
      if (v === 'null') return 'Desvincular'
      return associados?.find(a => a.id === v)?.nome || v
    }
    if (k === 'status') {
      if (v === 'pago') return 'Efetivado (Pago)'
      if (v === 'aberto') return 'Provisionado (Aberto)'
    }
    if (k === 'fixo_variavel') {
      if (v === 'fixo') return 'Fixo'
      if (v === 'variavel') return 'Variável'
    }
    return v
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Editar em Lote</h2>
              <p className="text-sm font-medium text-slate-500">
                Você selecionou <strong className="text-blue-600">{selectedCount}</strong> itens para alteração.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Step 1: Form */}
        {step === 1 && (
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <p className="text-sm text-slate-500 mb-6 bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100">
              <AlertCircle size={16} className="inline mr-2 -mt-0.5" />
              Preencha <strong>apenas os campos</strong> que deseja alterar nos {selectedCount} itens selecionados. Os demais campos permanecerão intactos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Status
                  </label>
                  <select 
                    value={formData.status || ''}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    <option value="pago">Efetivado (Pago)</option>
                    <option value="aberto">Provisionado (Aberto)</option>
                  </select>
                </div>

                {/* Natureza */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <Layers size={14} className="text-indigo-500" /> Natureza (Fixo/Variável)
                  </label>
                  <select 
                    value={formData.fixo_variavel || ''}
                    onChange={(e) => handleChange('fixo_variavel', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    <option value="fixo">Fixo</option>
                    <option value="variavel">Variável</option>
                    <option value="null">Nenhum (Remover)</option>
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <Bookmark size={14} className="text-blue-500" /> Categoria
                  </label>
                  <select 
                    value={formData.categoria || ''}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <CreditCard size={14} className="text-indigo-500" /> Forma de Pagamento
                  </label>
                  <select 
                    value={formData.forma_pagamento || ''}
                    onChange={(e) => handleChange('forma_pagamento', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Status de Cobrança */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <Layers size={14} className="text-orange-500" /> Status Cobrança
                  </label>
                  <select 
                    value={formData.status_cobranca || ''}
                    onChange={(e) => handleChange('status_cobranca', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    <option value="null">Remover (Nenhum)</option>
                    <option value="EM COBRANÇA">EM COBRANÇA</option>
                    <option value="NEGOCIADO">NEGOCIADO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {/* Banco */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <Bookmark size={14} className="text-cyan-500" /> Conta Bancária
                  </label>
                  <select 
                    value={formData.conta_id || ''}
                    onChange={(e) => handleChange('conta_id', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Manter original</option>
                    {contas?.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Vencimento */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    <Calendar size={14} className="text-rose-500" /> Dia de Vencimento
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Manter original"
                    value={formData.vencimento_dia_bulk || ''}
                    onChange={(e) => handleChange('vencimento_dia_bulk', e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Competência */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Target size={14} className="text-violet-500" /> Mês Comp.
                    </label>
                    <select 
                      value={formData.competencia_mes !== undefined ? formData.competencia_mes : ''}
                      onChange={(e) => handleChange('competencia_mes', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Manter original</option>
                      {MESES.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Target size={14} className="text-violet-500" /> Ano Comp.
                    </label>
                    <select 
                      value={formData.competencia_ano !== undefined ? formData.competencia_ano : ''}
                      onChange={(e) => handleChange('competencia_ano', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Manter original</option>
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contábil */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 truncate">
                      <ArrowUpCircle size={14} className="text-emerald-500" /> Déb. Contábil
                    </label>
                    <select 
                      value={formData.conta_debito_id || ''}
                      onChange={(e) => handleChange('conta_debito_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Manter original</option>
                      <option value="null">Automático</option>
                      {planoContas?.map(p => (
                        <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 truncate">
                      <ArrowDownCircle size={14} className="text-rose-500" /> Créd. Contábil
                    </label>
                    <select 
                      value={formData.conta_credito_id || ''}
                      onChange={(e) => handleChange('conta_credito_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Manter original</option>
                      <option value="null">Automático</option>
                      {planoContas?.map(p => (
                        <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diretor */}
                {diretores && diretores.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Briefcase size={14} className="text-pink-500" /> Diretor Vinculado
                    </label>
                    <select 
                      value={formData.diretor_id || ''}
                      onChange={(e) => handleChange('diretor_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Manter original</option>
                      <option value="null">Desvincular</option>
                      {diretores.map(d => (
                        <option key={d.id} value={d.id}>{d.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Associado */}
                {associados && associados.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      <Bookmark size={14} className="text-blue-500" /> Associado Individual
                    </label>
                    <select 
                      value={formData.associado_id || ''}
                      onChange={(e) => handleChange('associado_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Manter original</option>
                      <option value="null">Desvincular (Nenhum)</option>
                      {associados.filter(a => a.status === 'ativo').map(a => (
                        <option key={a.id} value={a.id}>{a.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Content Step 2: Summary */}
        {step === 2 && (
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Resumo das Alterações</h3>
              <p className="text-slate-500 text-sm mt-1">
                Os <strong className="text-blue-600">{selectedCount}</strong> itens selecionados sofrerão as seguintes modificações:
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
              {Object.entries(formData).map(([k, v]) => {
                if (v === '' || v === undefined) return null;
                return (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-slate-200/60 last:border-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{formatKeyName(k)}</span>
                    <span className="text-sm font-black text-slate-700">{formatValueName(k, v)}</span>
                  </div>
                )
              })}
            </div>
            
            <p className="text-center text-xs text-rose-500 font-bold mt-4">Essa ação não pode ser desfeita automaticamente.</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {step === 1 ? (
            <>
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleNext}
                disabled={Object.keys(formData).filter(k => formData[k] !== '' && formData[k] !== undefined).length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                Avançar
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleConfirm}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black transition-colors shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
              >
                <Save size={18} />
                Confirmar Alterações
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
