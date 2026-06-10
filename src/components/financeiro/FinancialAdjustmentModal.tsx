'use client'
import React, { useState, useEffect } from 'react'
import { 
  X, 
  DollarSign, 
  Zap, 
  Info, 
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface FinancialAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
  onAdjust: (id: string, baseValue: number, taxValue: number) => Promise<void>
  onRemanejar: (item: any) => void
}

export default function FinancialAdjustmentModal({ 
  isOpen, 
  onClose, 
  item, 
  onAdjust,
  onRemanejar 
}: FinancialAdjustmentModalProps) {
  const [baseValue, setBaseValue] = useState(0)
  const [taxValue, setTaxValue] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      const match = (item.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const currentTax = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      setBaseValue(item.valor)
      setTaxValue(currentTax)
    }
  }, [item])

  if (!isOpen || !item) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      await onAdjust(item.id, baseValue, taxValue)
      onClose()
    } catch (error) {
      alert('Erro ao ajustar valores.')
    } finally {
      setLoading(false)
    }
  }

  const total = Number(baseValue) + Number(taxValue)

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ajustar Divergência</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Conciliação Financeira ACPROBEC</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 flex flex-col gap-6">
          
          {/* Info Bancária */}
          {item.banco_original_memo && (
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Transação Original</span>
              </div>
              <p className="text-xs font-bold text-indigo-900 mb-1">{item.banco_original_memo}</p>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-indigo-400">{fmtData(item.data)}</span>
              </div>
            </div>
          )}

          {/* Grid de Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Base (R$)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number"
                  step="0.01"
                  value={baseValue}
                  onChange={(e) => setBaseValue(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-800 outline-none ring-1 ring-slate-100 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa (R$)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number"
                  step="0.01"
                  value={taxValue}
                  onChange={(e) => setTaxValue(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black text-rose-600 outline-none ring-1 ring-slate-100 focus:ring-rose-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total no Sistema</span>
              <span className="text-lg font-black text-slate-800">{fmtR(total)}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <p className="text-[9px] font-bold text-amber-700 leading-tight">
                Certifique-se que o valor total acima coincide com o valor creditado/debitado no seu extrato bancário para evitar divergências no balanço.
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-[#0e2d22] text-white rounded-[20px] text-xs font-black uppercase tracking-[2px] shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
              Confirmar Ajustes
            </button>
            
            <button 
              onClick={() => {
                onClose()
                onRemanejar(item)
              }}
              className="w-full py-4 bg-white text-emerald-600 border border-emerald-100 rounded-[20px] text-xs font-black uppercase tracking-[2px] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              <ArrowRightLeft size={16} />
              Remanejar Valor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
