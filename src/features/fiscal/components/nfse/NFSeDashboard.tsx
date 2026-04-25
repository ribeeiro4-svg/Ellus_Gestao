
'use client'
import React from 'react'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign, BarChart3, Search } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'

export default function NFSeDashboard({ nfseHook, onEscriturar }: { nfseHook: any; onEscriturar: (id: string) => void }) {
  const { stats, nfses, loading } = nfseHook

  const kpis = [
    { label: 'Total NFS-e', value: stats.total, icon: FileText, color: '#6366f1', sub: 'Serviços Tomados' },
    { label: 'Pendentes', value: stats.pendentes, icon: Clock, color: '#f59e0b', sub: 'Aguardando Escrituração' },
    { label: 'Escrituradas', value: stats.concluidas, icon: CheckCircle, color: '#10b981', sub: 'Processadas' },
    { label: 'Total Bruto', value: fmtR(stats.valorTotal), icon: DollarSign, color: '#8b5cf6', sub: 'Valor das Notas' },
    { label: 'Retenções', value: fmtR(stats.valorRetencoes), icon: TrendingUp, color: '#f43f5e', sub: 'IRRF, PCC, ISS' },
  ]

  const columns = [
    { 
      header: 'Data', 
      key: 'data_emissao', 
      render: (n: any) => <span className="text-[11px] font-bold text-slate-500">{fmtData(n.data_emissao)}</span> 
    },
    { 
      header: 'Número', 
      key: 'numero_nfse', 
      render: (n: any) => <span className="font-black text-slate-800">{n.numero_nfse}</span> 
    },
    { 
      header: 'Prestador', 
      key: 'prestador', 
      render: (n: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 truncate max-w-[200px]">{n.prestador?.nome || 'N/A'}</span>
          <span className="text-[10px] text-slate-400">{n.prestador?.cpf_cnpj || ''}</span>
        </div>
      )
    },
    { 
      header: 'Valor Bruto', 
      key: 'valor_bruto', 
      render: (n: any) => <span className="font-black text-slate-700">{fmtR(n.valor_bruto)}</span> 
    },
    { 
      header: 'Valor Líquido', 
      key: 'valor_liquido', 
      render: (n: any) => <span className="font-black text-blue-600">{fmtR(n.valor_liquido)}</span> 
    },
    { 
      header: 'Status', 
      key: 'status_escrituracao', 
      render: (n: any) => (
        <StatusBadge 
          type="lancamento"
          status={n.status_escrituracao === 'concluida' ? 'pago' : 'pendente'}
        />
      )
    },
    {
      header: 'Ações',
      key: 'acoes',
      render: (n: any) => (
        <button 
          onClick={() => onEscriturar(n.id)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
          title="Escriturar Nota"
        >
          <FileText size={16} />
        </button>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPIs */}
      <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex-1 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2 opacity-60">
                <Icon size={14} style={{ color: kpi.color }} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
              </div>
              <div className="text-xl font-black text-slate-800" style={{ color: i > 2 ? kpi.color : undefined }}>
                {kpi.value}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Lista de Notas */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" />
            Notas Fiscais de Serviços Recentes
          </h2>
        </div>
        <DataTable 
          columns={columns} 
          data={nfses} 
          loading={loading}
          getRowClassName={(n: any) => n.status_escrituracao === 'concluida' ? 'opacity-60' : ''}
        />
      </div>
    </div>
  )
}
