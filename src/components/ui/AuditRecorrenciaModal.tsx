'use client'
import React, { useState } from 'react'
import { X, Target } from 'lucide-react'
import { MESES } from '@/lib/utils/formatters'

interface AuditRecorrenciaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (mes: number, ano: number) => void
  loading?: boolean
}

export default function AuditRecorrenciaModal({ isOpen, onClose, onConfirm, loading = false }: AuditRecorrenciaModalProps) {
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-emerald-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Auditoria de Recorrência</h2>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest opacity-80 mt-1">Verificar Mensalidades Faltantes</p>
              </div>
            </div>
            <button onClick={onClose} disabled={loading} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês Alvo</label>
            <select
              value={selectedMes}
              onChange={e => setSelectedMes(Number(e.target.value))}
              disabled={loading}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {MESES.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ano Alvo</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              disabled={loading}
              className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onConfirm(selectedMes, selectedYear)}
            disabled={loading}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'INICIAR AUDITORIA'}
          </button>
        </div>
      </div>
    </div>
  )
}
