import React, { useState } from 'react'
import { Info } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  subtitle?: React.ReactNode
  icon: React.ReactNode
  category?: 'success' | 'info' | 'error' | 'purple' | 'indigo' | 'danger'
  explanation?: {
    description: string
    formula: string
    example: string
  }
}

export default function KpiCard({ 
  title, 
  value, 
  trend, 
  trendLabel, 
  subtitle,
  icon, 
  category = 'info',
  explanation
}: KpiCardProps) {
  const [showAudit, setShowAudit] = useState(false)
  
  const colors = {
    success: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-emerald-600 bg-emerald-50',
    info: 'from-blue-500 to-blue-600 shadow-blue-500/20 text-blue-600 bg-blue-50',
    error: 'from-rose-500 to-rose-600 shadow-rose-500/20 text-rose-600 bg-rose-50',
    danger: 'from-rose-500 to-rose-600 shadow-rose-500/20 text-rose-600 bg-rose-50',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20 text-indigo-600 bg-indigo-50',
    purple: 'from-violet-500 to-violet-600 shadow-violet-500/20 text-violet-600 bg-violet-50'
  }

  const borderColors = {
    success: 'border-t-emerald-500',
    info: 'border-t-blue-500',
    error: 'border-t-rose-500',
    danger: 'border-t-rose-500',
    indigo: 'border-t-indigo-500',
    purple: 'border-t-violet-500'
  }

  return (
    <div 
      className={`kpi-card bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-visible group border-t-4 ${borderColors[category]}`}
      onMouseEnter={() => setShowAudit(true)}
      onMouseLeave={() => setShowAudit(false)}
      onClick={() => setShowAudit(!showAudit)}
    >
      {explanation && showAudit && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colors[category]}`}>
                 <Info size={12} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Auditoria de Dados</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[1px] mb-1">Fonte & Lógica</p>
                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">{explanation.description}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[1px] mb-1">Fórmula</p>
                <p className="text-[9px] font-black text-slate-800">{explanation.formula}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[1px] mb-1">Exemplo Prático</p>
                <p className="text-[10px] font-medium text-slate-500 italic">{explanation.example}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white/95" />
        </div>
      )}

      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[1.5px]">{title}</p>
            {explanation && <Info size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors" />}
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
          {subtitle && <div className="mt-1 leading-none">{subtitle}</div>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 flex-shrink-0 ${colors[category]}`}>
          {icon}
        </div>
      </div>
      
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-2 mt-4 relative z-10">
          {trend !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          )}
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{trendLabel}</span>
        </div>
      )}

      {/* Decorative inner glow */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity ${colors[category].split(' ')[0]}`} />
    </div>
  )
}
