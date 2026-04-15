'use client'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { Plus, Search, Filter } from 'lucide-react'

export default function FinanceiroPage() {
  const { lancamentos, loading } = useFinanceiro()

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
      render: (i: any) => (
        <span className={`text-sm font-black ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
          {i.tipo === 'receita' ? '+' : '-'} {fmtR(i.valor)}
        </span>
      )
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
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fluxo de Caixa</h2>
          <p className="text-slate-500 text-sm mt-1">Gestão detalhada de todos os lançamentos financeiros.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 transition-all shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou categoria..." 
            className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={16} />
          <span>Filtros</span>
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={lancamentos} 
        loading={loading}
      />
    </div>
  )
}
