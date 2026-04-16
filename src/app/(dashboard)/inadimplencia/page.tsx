'use client'
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { AlertTriangle, Search, Filter } from 'lucide-react'

export default function InadimplenciaPage() {
  const { associados, loading } = useAssociados()
  const inadimp = associados.filter(a => a.status === 'inadimplente')

  const columns = [
    { 
      header: 'Associado', 
      key: 'nome', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{i.nome}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{i.codigo}</span>
        </div>
      )
    },
    { 
      header: 'Mensalidade', 
      key: 'mensalidade', 
      render: (i: any) => <span className="text-sm font-black text-slate-900">{fmtR(i.mensalidade)}</span> 
    },
    { 
      header: 'Meses em Atraso', 
      key: 'meses_atraso', 
      render: (i: any) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-red-600">{i.meses_atraso || 0}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">meses</span>
        </div>
      )
    },
    { 
      header: 'Total em Aberto', 
      key: 'total', 
      render: (i: any) => <span className="text-sm font-black text-red-700">{fmtR((i.mensalidade || 0) * (i.meses_atraso || 0))}</span> 
    },
    { 
      header: 'Último Pagamento', 
      key: 'ultimo_pagamento', 
      render: (i: any) => <span className="text-xs font-medium text-slate-400">{i.ultimo_pagamento ? fmtData(i.ultimo_pagamento) : 'Nenhum registro'}</span> 
    },
  ]

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm border border-red-100">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Relatório de Inadimplência</h2>
            <p className="text-slate-500 text-sm mt-1">Controle rigoroso de associados com mensalidades em atraso.</p>
          </div>
        </div>
        <div className="bg-red-600 px-8 py-5 rounded-3xl shadow-xl shadow-red-600/20 text-white flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-relaxed">Total Devido</span>
          <span className="text-2xl font-black tracking-tight">{fmtR(inadimp.reduce((acc, a) => acc + (a.mensalidade * (a.meses_atraso || 0)), 0))}</span>
        </div>
      </div>

      <DataTable columns={columns} data={inadimp} loading={loading} />
    </div>
  )
}
