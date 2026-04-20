'use client'
import React, { useMemo, useState } from 'react'
import { Trash2, ChevronRight, Calendar, Search } from 'lucide-react'
import ChartModal from '@/components/ui/ChartModal'
import SplashScreen from '@/components/ui/SplashScreen'
import { fmtR, MESES, fmtData, deleteCookie } from '@/lib/utils/formatters'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useMetas } from '@/lib/hooks/useMetas'
import { useProjetos } from '@/lib/hooks/useProjetos'
import { useProjecao } from '@/lib/hooks/useProjecao'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, ArcElement,
  BarController, LineController, DoughnutController
} from 'chart.js'
import { useSearch } from '@/lib/contexts/SearchContext'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import BatchActionBar from '@/components/ui/BatchActionBar'
import LaunchDetailsModal from '@/components/ui/LaunchDetailsModal'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import DashboardKpis from '@/features/dashboard/components/DashboardKpis'
import DashboardCharts from '@/features/dashboard/components/DashboardCharts'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler, BarController, LineController, DoughnutController)

export default function DashboardPage() {
  const { lancamentos, loading: loadingFin, limparTudo: limpFin, removerBulk, atualizarBulk } = useFinanceiro()
  const { associados, loading: loadingAssoc, limparTudo: limpAssoc } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { limparTudo: limpMetas } = useMetas(); const { limparTudo: limpProjetos } = useProjetos(); const { limparTudo: limpSim } = useProjecao()
  const { searchTerm, filterType, setFilterType, filterStatus, setFilterStatus } = useSearch()
  
  const [activeChart, setActiveChart] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const metrics = useDashboardMetrics(lancamentos, associados, selectedMonth, selectedYear)

  const filteredLancamentos = useMemo(() => {
    let result = [...lancamentos]
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(l => (l.descricao || '').toLowerCase().includes(search) || (l.categoria || '').toLowerCase().includes(search) || (l.valor || 0).toString().includes(search))
    }
    if (filterType !== 'todos') result = result.filter(l => l.tipo === filterType)
    if (filterStatus !== 'todos') result = result.filter(l => l.status === filterStatus)
    return result.sort((a, b) => (b.data ? new Date(b.data).getTime() : 0) - (a.data ? new Date(a.data).getTime() : 0)).map(l => {
      const m = (l.descricao || '').match(/\(Taxa: R\$\ s*([^)]+)\)/)
      return { ...l, taxaCalculada: m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : 0 }
    })
  }, [lancamentos, searchTerm, filterType, filterStatus])

  const handleClearAll = async () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os seus dados. Continuar?')) {
      await Promise.allSettled([limpFin(), limpAssoc(), limpMetas(), limpProjetos(), limpSim()])
      deleteCookie('acprobec_tenant_id'); localStorage.removeItem('acprobec_guest_id')
      window.location.href = '/'
    }
  }

  const loading = loadingFin || loadingAssoc

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative">
      {loading && <SplashScreen />}
      <div className={`animate-in fade-in duration-500 flex flex-col flex-1 h-full ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div><h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight">Dashboard Executivo</h1><p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic underline decoration-emerald-200/50">Clique nos ícones de informação para auditar os cálculos.</p></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-100 p-1 rounded-2xl gap-1 shadow-sm">
              <button onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={16} className="rotate-180" /></button>
              <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center"><Calendar size={14} className="text-emerald-500" /><span className="text-xs font-black text-slate-700 uppercase tracking-widest">{MESES[selectedMonth]} {selectedYear}</span></div>
              <button onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
            </div>
            <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-3 text-[10px] font-black text-rose-600 border border-rose-100 bg-rose-50/30 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest group"><Trash2 size={14} className="group-hover:rotate-12 transition-transform" /><span>Resetar Base</span></button>
          </div>
        </div>

        <DashboardKpis metrics={metrics} />
        <DashboardCharts metrics={metrics} onChartClick={setActiveChart} />

        <div className="table-card flex-grow min-h-[300px] flex flex-col">
          <div className="p-5 border-b border-white/10 flex flex-col gap-4 bg-white/5">
            <div className="flex justify-between items-center"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Últimos Lançamentos</h2><div className="flex items-center gap-4">{searchTerm && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-pulse">Filtrando por: "{searchTerm}"</span>}<Search size={18} className="text-gray-400" /></div></div>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                {['todos', 'receita', 'despesa'].map(t => <button key={t} onClick={() => setFilterType(t as any)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterType === t ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>)}
              </div>
              <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                {['todos', 'pago', 'aberto'].map(s => <button key={s} onClick={() => setFilterStatus(s as any)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{s === 'todos' ? 'Qualquer' : s}</button>)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-b-3xl border-x border-b border-gray-100 shadow-sm overflow-hidden flex-grow">
            <DataTable 
              columns={[
                { header: 'Data', key: 'data', className: 'w-[110px]', render: (l: any) => <span className="text-xs font-medium text-gray-600">{fmtData(l.data)}</span> },
                { header: 'Descrição', key: 'descricao', className: 'min-w-[400px] whitespace-normal', render: (l: any) => <span className="text-xs font-bold text-gray-900">{l.descricao}</span> },
                { header: 'Valor', key: 'valor', className: 'w-[130px]', render: (l: any) => <span className={`text-xs font-bold ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>{l.tipo === 'receita' ? '+' : '-'}{fmtR(l.valor)}</span> },
                { header: 'Status', key: 'status', className: 'w-[120px]', render: (l: any) => <StatusBadge status={l.status} type="lancamento" /> }
              ]} 
              data={filteredLancamentos.slice(0, 30)} loading={loading} selectedIds={selectedIds} onSelectChange={setSelectedIds} onRowClick={(item) => { setSelectedForDetail(item); setIsDetailModalOpen(true) }} showFilterInputs={true}
            />
          </div>
        </div>
      </div>

      <BatchActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={async () => { if (confirm('Excluir?')) { await removerBulk(selectedIds); setSelectedIds([]) } }} onStatusChange={async (status) => { await atualizarBulk(selectedIds, { status }); setSelectedIds([]) }} />
      <ChartModal isOpen={!!activeChart} onClose={() => setActiveChart(null)} {...activeChart} />
      <LaunchDetailsModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} launch={selectedForDetail} linkedName={selectedForDetail?.associado_id ? associados.find(a => a.id === selectedForDetail.associado_id)?.nome : selectedForDetail?.fornecedor_id ? fornecedores.find(f => f.id === selectedForDetail.fornecedor_id)?.nome : diretoria.find(d => d.id === selectedForDetail?.diretor_id)?.nome} linkedType={selectedForDetail?.associado_id ? 'associado' : selectedForDetail?.fornecedor_id ? 'fornecedor' : selectedForDetail?.diretor_id ? 'diretor' : undefined} />
    </div>
  )
}
