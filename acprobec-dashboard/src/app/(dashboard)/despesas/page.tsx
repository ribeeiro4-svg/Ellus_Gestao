'use client'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { TrendingDown, Search, Filter } from 'lucide-react'

export default function DespesasPage() {
  const { lancamentos, loading } = useFinanceiro()
  const despesas = lancamentos.filter(l => l.tipo === 'despesa')

  const columns = [
    { 
      header: 'Data', 
      key: 'data', 
      render: (i: any) => <span className="text-sm font-medium text-slate-700">{fmtData(i.data)}</span> 
    },
    { 
      header: 'Descrição', 
      key: 'descricao', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{i.descricao}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{i.categoria}</span>
        </div>
      )
    },
    { 
      header: 'Valor', 
      key: 'valor', 
      render: (i: any) => <span className="text-sm font-black text-red-600"> {fmtR(i.valor)}</span>
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> 
    },
  ]

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm border border-red-100">
            <TrendingDown size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Despesas</h2>
            <p className="text-slate-500 text-sm mt-1">Consulte e gerencie todas as saídas financeiras.</p>
          </div>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Total Pago</span>
          <span className="text-lg font-black text-red-600">{fmtR(despesas.reduce((acc, l) => acc + l.valor, 0))}</span>
        </div>
      </div>

      <DataTable columns={columns} data={despesas} loading={loading} />
    </div>
  )
}
