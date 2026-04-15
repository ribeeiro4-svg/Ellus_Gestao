'use client'
import { useMetas } from '@/lib/hooks/useMetas'
import DataTable from '@/components/ui/DataTable'
import { fmtR, fmtData, pctMeta } from '@/lib/utils/formatters'
import { Target, Search, Filter } from 'lucide-react'

export default function MetasPage() {
  const { metas, loading } = useMetas()

  const columns = [
    { 
      header: 'Meta', 
      key: 'meta', 
      render: (i: any) => <span className="text-sm font-bold text-slate-900">{i.meta}</span> 
    },
    { 
      header: 'Responsável', 
      key: 'responsavel', 
      render: (i: any) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{i.responsavel?.[0] || 'U'}</div>
          <span className="text-xs text-slate-600 font-medium">{i.responsavel}</span>
        </div>
      )
    },
    { 
      header: 'Progresso', 
      key: 'valor_realizado', 
      render: (i: any) => {
        const pct = pctMeta(i.valor_realizado, i.valor_meta)
        return (
          <div className="flex items-center gap-4 w-48">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-blue-600 shadow-sm shadow-blue-500/20'}`} 
                style={{ width: `${pct}%` }}
              ></div>
            </div>
            <span className="text-xs font-black text-slate-900 w-8">{pct}%</span>
          </div>
        )
      }
    },
    { 
      header: 'Valores', 
      key: 'valor_meta', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Meta: {fmtR(i.valor_meta)}</span>
          <span className="text-xs font-black text-blue-600 leading-tight">Realizado: {fmtR(i.valor_realizado)}</span>
        </div>
      )
    },
    { 
      header: 'Prazo', 
      key: 'prazo', 
      render: (i: any) => <span className="text-xs font-medium text-slate-400">{i.prazo ? fmtData(i.prazo) : 'S/D'}</span> 
    },
  ]

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100">
            <Target size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Metas e Objetivos</h2>
            <p className="text-slate-500 text-sm mt-1">Acompanhamento de performance e KPIs estratégicos.</p>
          </div>
        </div>
        <div className="bg-white px-8 py-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Metas Atingidas</span>
          <span className="text-2xl font-black text-emerald-600">{metas.filter(m => m.valor_realizado >= m.valor_meta && m.valor_meta > 0).length} <span className="text-xs text-slate-300 font-medium">/ {metas.length}</span></span>
        </div>
      </div>

      <DataTable columns={columns} data={metas} loading={loading} />
    </div>
  )
}
