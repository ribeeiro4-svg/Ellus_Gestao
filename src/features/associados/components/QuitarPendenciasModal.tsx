'use client'
import React, { useState, useEffect } from 'react'
import { DollarSign, X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useContas } from '@/lib/hooks/useContas'
import { useCancelamentos } from '@/lib/hooks/useCancelamentos'
import { HistoricoCancelamento } from '@/lib/hooks/useCancelamentos'

interface QuitarPendenciasModalProps {
  isOpen: boolean
  onClose: () => void
  item: HistoricoCancelamento | null
  onSuccess: () => void
}

export default function QuitarPendenciasModal({ isOpen, onClose, item, onSuccess }: QuitarPendenciasModalProps) {
  const [pendencias, setPendencias] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [contaId, setContaId] = useState('')
  
  const { contas } = useContas()
  const { atualizarPendencia } = useCancelamentos()
  const sb = createClient()

  useEffect(() => {
    if (isOpen && item) {
      carregarPendencias()
    } else {
      setPendencias([])
      setFormaPagamento('PIX')
      setContaId('')
    }
  }, [isOpen, item])

  const carregarPendencias = async () => {
    if (!item) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('lancamentos')
        .select('*')
        .eq('associado_id', item.associado_id)
        .eq('tipo', 'receita')
        .in('status', ['aberto', 'atrasado'])
      
      if (!error && data) {
        setPendencias(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleQuitar = async () => {
    if (!item || pendencias.length === 0) return
    if (!contaId) {
      alert('Selecione uma conta bancária.')
      return
    }

    setSaving(true)
    try {
      const ids = pendencias.map(p => p.id)
      
      const { error } = await sb.from('lancamentos')
        .update({
          forma_pagamento: formaPagamento,
          conta_id: contaId,
          status_cobranca: 'PROCESSANDO'
        })
        .in('id', ids)

      if (error) throw error

      // Atualiza o histórico de cancelamento zerando as pendências
      atualizarPendencia(item.id, 0)
      
      onSuccess()
      onClose()
    } catch (e: any) {
      console.error('Erro ao quitar pendências:', e)
      alert('Erro ao quitar pendências: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (d: string) => {
    if (!d) return '--'
    const parts = d.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return d
  }

  if (!isOpen || !item) return null

  const total = pendencias.reduce((acc, p) => acc + (Number(p.valor) || 0), 0)

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Quitar Pendências</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-1">
                Associado: <span className="text-slate-700">{item.nome}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>
              Ao quitar, estes lançamentos ficarão como <strong>Processando</strong> no financeiro, 
              aguardando baixa automática via conciliação bancária do extrato. 
              Isso limpará as pendências no histórico de cancelamento.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Lançamentos Pendentes</h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-xs font-bold">Buscando pendências...</span>
              </div>
            ) : pendencias.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-xs font-bold">
                Nenhum lançamento pendente encontrado para este associado.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendencias.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{p.descricao}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Venc: {fmtDate(p.data)}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">{fmtR(p.valor)}</span>
                  </div>
                ))}
                
                <div className="flex items-center justify-between p-4 bg-slate-800 text-white rounded-xl mt-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Total a Quitar</span>
                  <span className="text-lg font-black">{fmtR(total)}</span>
                </div>
              </div>
            )}
          </div>

          {pendencias.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                <select 
                  value={formaPagamento}
                  onChange={e => setFormaPagamento(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta de Destino</label>
                <select 
                  value={contaId}
                  onChange={e => setContaId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                >
                  <option value="" disabled>Selecione uma conta...</option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleQuitar}
            disabled={saving || pendencias.length === 0 || !contaId}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Confirmar Pagamento
          </button>
        </div>

      </div>
    </div>
  )
}
