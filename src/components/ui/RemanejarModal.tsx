import React, { useState, useEffect, useMemo } from 'react'
import { X, Target, UserPlus, Info, ArrowRightLeft, DollarSign, RefreshCw } from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import type { Lancamento, Associado } from '@/lib/types'

interface RemanejarModalProps {
  isOpen: boolean
  onClose: () => void
  original: Lancamento | null
  associados: Associado[]
  lancamentos: Lancamento[]
  onConfirm: (idOriginal: string, targetAssociadoId: string, valor: number, novaDesc: string, targetLancamentoId?: string) => Promise<any>
}

export default function RemanejarModal({ isOpen, onClose, original, associados, lancamentos, onConfirm }: RemanejarModalProps) {
  const [targetId, setTargetId] = useState('')
  const [targetLancamentoId, setTargetLancamentoId] = useState('')
  const [valor, setValor] = useState(0)
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  // Calcula o valor bruto (líquido + taxa escondida)
  const valorBruto = useMemo(() => {
    if (!original) return 0
    const match = (original.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
    return Number(original.valor) + taxaVal
  }, [original])

  const targetLancamentos = useMemo(() => {
    if (!targetId || !lancamentos) return []
    return lancamentos.filter(l => 
      l.associado_id === targetId && 
      (l.status === 'atrasado' || l.status === 'aberto' || l.status === 'parcial')
    ).sort((a, b) => b.data.localeCompare(a.data))
  }, [targetId, lancamentos])

  useEffect(() => {
    if (original) {
      setValor(valorBruto)
      setDesc(original.descricao.replace(/\(Taxa: R\$\s*[^)]+\)/, '').replace('[ENCONTRO DE CONTAS]', '').trim())
    }
  }, [original, valorBruto])

  useEffect(() => {
    setTargetLancamentoId('')
  }, [targetId])

  if (!isOpen || !original) return null

  const handleConfirm = async () => {
    if (!targetId) return alert('Selecione o associado de destino.')
    if (valor <= 0 || valor > valorBruto) return alert('Valor inválido.')
    
    // Se não selecionou um lançamento, a descrição é obrigatória
    if (!targetLancamentoId && !desc) return alert('Informe a descrição para o novo associado.')

    setLoading(true)
    try {
      const res = await onConfirm(original.id, targetId, valor, desc, targetLancamentoId || undefined)
      if (res?.error) alert(res.error)
      else onClose()
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Remanejar Lançamento</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encontro de Contas / Split</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-none">
          
          {/* Info Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Info size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Origem Atual</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{original.descricao}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] font-bold text-slate-400">{fmtData(original.data)}</span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {fmtR(valorBruto)} <span className="text-[9px] opacity-60">(Bruto)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <UserPlus size={12} /> Selecionar Destino
              </label>
              <select 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all appearance-none cursor-pointer"
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
              >
                <option value="">Selecione um Associado...</option>
                {associados.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.cpf || 'S/ CPF'}){a.email ? ` - ${a.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {targetId && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <ArrowRightLeft size={12} /> Vincular a Lançamento Existente (Opcional)
                </label>
                <select 
                  className="w-full px-5 py-3.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  value={targetLancamentoId}
                  onChange={e => {
                    setTargetLancamentoId(e.target.value)
                    if (e.target.value) {
                      const l = targetLancamentos.find(x => x.id === e.target.value)
                      if (l) {
                        const saldoDevedor = Number(l.valor) - (l.valor_pago_ec || 0)
                        setValor(Math.min(valorBruto, Math.max(0, saldoDevedor)))
                        setDesc(l.descricao)
                      }
                    }
                  }}
                >
                  <option value="">-- Criar novo lançamento --</option>
                  {targetLancamentos.map(l => (
                    <option key={l.id} value={l.id}>{fmtData(l.data)} - {l.descricao} ({fmtR(l.valor)})</option>
                  ))}
                </select>
                <p className="text-[9px] text-emerald-600 font-bold ml-1 uppercase tracking-tight">
                  {targetLancamentos.length > 0 
                    ? `Encontrado(s) ${targetLancamentos.length} lançamento(s) pendente(s).` 
                    : 'Nenhum lançamento pendente para este associado.'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <DollarSign size={12} /> Valor a Remanejar
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-extrabold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all"
                  value={valor}
                  onChange={e => setValor(Number(e.target.value))}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold ml-1 italic">* Valor será descontado do lançamento original.</p>
            </div>

            <div className={`space-y-2 transition-opacity ${targetLancamentoId ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Target size={12} /> {targetLancamentoId ? 'Descrição Vinculada' : 'Nova Descrição (P/ Destino)'}
              </label>
              <input 
                type="text" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                placeholder="Ex: Mensalidade - Aretha Oliveira"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                readOnly={!!targetLancamentoId}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white border border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Confirmar Remanejo'}
          </button>
        </div>

      </div>
    </div>
  )
}
