'use client'
import React, { useState, useMemo } from 'react'
import { X, Calendar, CheckCircle2, AlertCircle, Clock, Target } from 'lucide-react'
import { fmtR, MESES } from '@/lib/utils/formatters'

interface IndicarCompetenciaModalProps {
  isOpen: boolean
  onClose: () => void
  launch: any
  lancamentos: any[]
  onSave: (id: string, mes: number, ano: number) => Promise<void>
}

export default function IndicarCompetenciaModal({ isOpen, onClose, launch, lancamentos, onSave }: IndicarCompetenciaModalProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)

  if (!isOpen || !launch) return null

  const assocLancamentos = useMemo(() => {
    return lancamentos.filter(l => l.associado_id === launch.associado_id && l.tipo === 'receita')
  }, [lancamentos, launch.associado_id])

  const handleSelect = async (mes: number) => {
    setSaving(true)
    try {
      await onSave(launch.id, mes, selectedYear)
      onClose()
    } catch (err) {
      alert('Erro ao salvar competência')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 bg-emerald-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Indicar Competência</h2>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest opacity-80 mt-1">Gestão de Recebimentos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="p-8">
          {/* Info Card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recebimento Atual</span>
              <span className="text-sm font-bold text-slate-800">{launch.descricao}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black text-emerald-600">{fmtR(launch.valor)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-500">{new Date(launch.data).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ano de Referência</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 outline-none font-bold text-xs shadow-sm"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
            <Calendar size={14} className="text-emerald-600" /> Clique no mês para vincular
          </p>

          {/* Months Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MESES.map((mes, idx) => {
              const matched = assocLancamentos.filter(l => {
                const isManual = l.competencia_mes === idx && l.competencia_ano === selectedYear
                const isAuto = !l.competencia_mes && new Date(l.data).getMonth() === idx && new Date(l.data).getFullYear() === selectedYear
                return isManual || isAuto
              })

              const hasPayment = matched.some(l => l.status === 'pago')
              const hasOpen = matched.some(l => l.status === 'aberto')
              const isCurrentTarget = launch.competencia_mes === idx && launch.competencia_ano === selectedYear

              return (
                <button
                  key={mes}
                  disabled={saving}
                  onClick={() => handleSelect(idx)}
                  className={`
                    group p-4 rounded-[24px] border transition-all text-left relative overflow-hidden
                    ${isCurrentTarget ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/10' : 'border-slate-100 bg-white hover:border-emerald-300 hover:shadow-lg'}
                    ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex flex-col gap-1 relative z-10">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${isCurrentTarget ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {mes.substring(0, 3)}
                    </span>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      {hasPayment ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600">Ok</span>
                        </div>
                      ) : hasOpen ? (
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-orange-400" />
                          <span className="text-[10px] font-bold text-orange-400">Aberto</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">Vazio</span>
                      )}
                    </div>
                  </div>
                  {isCurrentTarget && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <span>Selecione a competência correta para este recebimento</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Pago</div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Aberto</div>
            </div>
        </div>
      </div>
    </div>
  )
}
