'use client'
import { useProjetos } from '@/lib/hooks/useProjetos'
import DataTable from '@/components/ui/DataTable'
import { fmtR, fmtData, pctMeta } from '@/lib/utils/formatters'
import { Briefcase, Search, Filter, Calendar, DollarSign } from 'lucide-react'

export default function ProjetosPage() {
  const { projetos, loading } = useProjetos()

  const columns = [
    { 
      header: 'Projeto', 
      key: 'projeto', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-tight">{i.projeto}</span>
          <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{i.responsavel}</span>
        </div>
      )
    },
    { 
      header: 'Período', 
      key: 'prazo', 
      render: (i: any) => (
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={14} />
          <span className="text-[11px] font-bold uppercase tracking-widest">{i.data_inicio ? fmtData(i.data_inicio) : 'S/D'} → {i.prazo ? fmtData(i.prazo) : 'S/D'}</span>
        </div>
      )
    },
    { 
      header: 'Orçamento', 
      key: 'orcamento', 
      render: (i: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex-1 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${i.gasto >= i.orcamento ? 'bg-red-500' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min(100, (i.gasto / i.orcamento) * 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-black text-slate-400">{Math.round((i.gasto / i.orcamento) * 100 || 0)}%</span>
          </div>
          <span className="text-[11px] font-black text-slate-900 flex items-center gap-1">
             {fmtR(i.gasto)} <span className="opacity-30">/</span> {fmtR(i.orcamento)}
          </span>
        </div>
      )
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (i: any) => {
        const s = i.status.toLowerCase()
        const colors: Record<string, string> = {
          'concluido': 'bg-emerald-50 text-emerald-700 border-emerald-100',
          'em_andamento': 'bg-blue-50 text-blue-700 border-blue-100',
          'planejado': 'bg-slate-50 text-slate-600 border-slate-100',
          'atrasado': 'bg-red-50 text-red-700 border-red-100',
          'cancelado': 'bg-slate-200 text-slate-500 border-slate-300',
        }
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colors[s] || colors['planejado']}`}>
            {i.status}
          </span>
        )
      }
    },
  ]

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
            <Briefcase size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Projetos</h2>
            <p className="text-slate-500 text-sm mt-1">Planejamento e execução de iniciativas da ACPROBEC.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={16} /></div>
             <div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Investimento Total</p>
               <h4 className="text-base font-black text-slate-900 leading-tight mt-1">{fmtR(projetos.reduce((acc, p) => acc + p.orcamento, 0))}</h4>
             </div>
           </div>
        </div>
      </div>

      <DataTable columns={columns} data={projetos} loading={loading} />
    </div>
  )
}
