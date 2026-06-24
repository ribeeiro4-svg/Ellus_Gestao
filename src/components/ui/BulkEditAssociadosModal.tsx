'use client'
import React, { useState } from 'react'
import { X, Layers, AlertCircle, Loader2 } from 'lucide-react'

interface BulkEditAssociadosModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (data: any) => Promise<void>
  contas: { id: string; nome: string }[]
}

export default function BulkEditAssociadosModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  contas
}: BulkEditAssociadosModalProps) {
  const [loading, setLoading] = useState(false)
  
  // States para os campos que podem ser editados em lote
  const [status, setStatus] = useState<string>('')
  const [recorrencia, setRecorrencia] = useState<string>('')
  const [contaRecorrencia, setContaRecorrencia] = useState<string>('')
  const [planoSaude, setPlanoSaude] = useState<string>('')
  const [termoStatus, setTermoStatus] = useState<string>('')
  const [vencimento, setVencimento] = useState<string>('')

  if (!isOpen) return null

  const hasChanges = status || recorrencia || contaRecorrencia || planoSaude || termoStatus || vencimento

  const handleSubmit = async () => {
    if (!hasChanges) return
    setLoading(true)
    
    const updateData: any = {}
    if (status) updateData.status = status
    if (recorrencia) updateData.recorrencia_ativa = recorrencia === 'true'
    if (contaRecorrencia) updateData.conta_recorrencia = contaRecorrencia
    if (planoSaude) updateData.plano_saude = planoSaude === 'Remover' ? 'Não Possui' : planoSaude
    if (termoStatus) updateData.termo_status = termoStatus
    if (vencimento) updateData.vencimento_dia = Number(vencimento)

    try {
      await onConfirm(updateData)
      onClose()
      // Resetar form
      setStatus('')
      setRecorrencia('')
      setContaRecorrencia('')
      setPlanoSaude('')
      setTermoStatus('')
      setVencimento('')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Editar em Lote</h2>
              <p className="text-sm font-bold text-slate-500">
                Você está alterando <span className="text-blue-600">{selectedCount} associados</span> simultaneamente.
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 mb-6">
            <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium text-blue-800">
              Apenas os campos preenchidos abaixo serão alterados nos associados selecionados. Os demais campos permanecerão intactos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status do Associado</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Manter Original --</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
                <option value="inadimplente">Inadimplente</option>
                <option value="abonado">Abonado</option>
              </select>
            </div>

            {/* Vencimento */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dia do Vencimento</label>
              <select
                value={vencimento}
                onChange={e => setVencimento(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Manter Original --</option>
                {Array.from({ length: 30 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Dia {String(i + 1).padStart(2, '0')}</option>
                ))}
              </select>
            </div>

            {/* Recorrência */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cobrança Recorrente</label>
              <select
                value={recorrencia}
                onChange={e => setRecorrencia(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Manter Original --</option>
                <option value="true">Ativar Recorrência</option>
                <option value="false">Parar Recorrência</option>
              </select>
            </div>

            {/* Conta Recorrência */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Conta Bancária</label>
              <select
                value={contaRecorrencia}
                onChange={e => setContaRecorrencia(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Manter Original --</option>
                {contas.map(c => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Plano de Saúde */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Plano de Saúde</label>
              <select
                value={planoSaude}
                onChange={e => setPlanoSaude(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Manter Original --</option>
                <option value="Ativo">Ativo</option>
                <option value="Aguardando Declaração">Aguardando Declaração</option>
                <option value="Remover">Remover Plano (Não Possui)</option>
              </select>
            </div>

            {/* Termo de Assinatura */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status do Termo</label>
              <select
                value={termoStatus}
                onChange={e => setTermoStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Manter Original --</option>
                <option value="Enviado ao HGU">Enviado ao HGU</option>
                <option value="Assinatura Pendente">Assinatura Pendente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {hasChanges ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo das Alterações</span>
              <span className="text-sm font-bold text-blue-600">
                {Object.values({ status, recorrencia, contaRecorrencia, planoSaude, termoStatus, vencimento }).filter(Boolean).length} campo(s) será(ão) alterado(s) em {selectedCount} associados.
              </span>
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-400 italic">
              Nenhuma alteração selecionada.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!hasChanges || loading}
              className="px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
              Aplicar a Todos
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
