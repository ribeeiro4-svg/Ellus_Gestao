'use client'
import React, { useMemo, useState } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock, 
  Target, 
  ChevronRight, 
  Calendar,
  Briefcase,
  Activity,
  Plus,
  Trash2
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import ChartModal from '@/components/ui/ChartModal'
import SplashScreen from '@/components/ui/SplashScreen'
import { fmtR, MESES, fmtData, fmtPct, getMesIdx, getAnoIdx, getBruto, deleteCookie } from '@/lib/utils/formatters'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useMetas } from '@/lib/hooks/useMetas'
import { useProjetos } from '@/lib/hooks/useProjetos'
import { useProjecao } from '@/lib/hooks/useProjecao'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, ArcElement,
  BarController, LineController, DoughnutController
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useSearch } from '@/lib/contexts/SearchContext'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import BatchActionBar from '@/components/ui/BatchActionBar'
import LaunchDetailsModal from '@/components/ui/LaunchDetailsModal'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, 
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
  BarController, LineController, DoughnutController
)

export default function DashboardPage() {
  const { lancamentos, loading: loadingFin, limparTudo: limpFin, removerBulk, atualizarBulk } = useFinanceiro()
  const { associados, loading: loadingAssoc, limparTudo: limpAssoc } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { limparTudo: limpMetas } = useMetas()
  const { limparTudo: limpProjetos } = useProjetos()
  const { limparTudo: limpSim } = useProjecao()
  const { searchTerm, filterType, setFilterType, filterStatus, setFilterStatus } = useSearch()
  const [activeChart, setActiveChart] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleBatchDelete = async () => {
    if (confirm(`Deseja excluir os ${selectedIds.length} itens selecionados?`)) {
      await removerBulk(selectedIds)
      setSelectedIds([])
    }
  }

  const handleBatchStatus = async (status: 'pago' | 'aberto') => {
    await atualizarBulk(selectedIds, { status })
    setSelectedIds([])
  }

  const handleDetail = (item: any) => {
    setSelectedForDetail(item)
    setIsDetailModalOpen(true)
  }

  const handleClearAll = async () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os seus dados do banco de dados Cloud. Continuar?')) {
      await Promise.allSettled([limpFin(), limpAssoc(), limpMetas(), limpProjetos(), limpSim()])
      
      // Limpa a identidade para resetar totalmente a sandbox
      deleteCookie('acprobec_tenant_id')
      localStorage.removeItem('acprobec_guest_id') // Backup cleanup

      alert('Dados removidos com sucesso. A página será reiniciada para um novo rascunho.')
      window.location.href = '/' // Volta para a home limpa
    }
  }

  const loading = loadingFin || loadingAssoc

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // ── CÁLCULOS DINÂMICOS ──
  
  // 1. Financeiro (KPIS e Gráficos Consolidados)
  const { 
    recReal, 
    recProv, 
    despReal, 
    despProv, 
    resultadoData, 
    receitaTotal, 
    despesaTotal, 
    taxaRecuperada,
    saldoTotal 
  } = useMemo(() => {
    const recRealArr = Array(12).fill(0)
    const recProvArr = Array(12).fill(0)
    const despRealArr = Array(12).fill(0)
    const despProvArr = Array(12).fill(0)
    
    let kpiRec = 0
    let kpiDes = 0
    let kpiTax = 0

    lancamentos.forEach(l => {
      const mesIdx = getMesIdx(l.data)
      const anoIdx = getAnoIdx(l.data)
      const valor = l.valor || 0
      const tipo = (l.tipo || '').toLowerCase()
      const status = (l.status || '').toLowerCase()
      
      // Recuperação de Taxas
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0

      // Dados para o Gráfico (Ano Selecionado)
      if (anoIdx === selectedYear && mesIdx >= 0 && mesIdx <= 11) {
        if (tipo === 'receita') {
          if (status === 'pago') {
            recRealArr[mesIdx] = Math.round((recRealArr[mesIdx] + valor + taxaVal) * 100) / 100
          } else {
            recProvArr[mesIdx] = Math.round((recProvArr[mesIdx] + valor + taxaVal) * 100) / 100
          }
        } else {
          if (status === 'pago') {
            despRealArr[mesIdx] = Math.round((despRealArr[mesIdx] + valor) * 100) / 100
          } else {
            despProvArr[mesIdx] = Math.round((despProvArr[mesIdx] + valor) * 100) / 100
          }
        }
      }

      // Dados para os KPIs (Mês e Ano Selecionados) - Apenas Pagos para KPI de Receita Realizada
      if (anoIdx === selectedYear && mesIdx === selectedMonth) {
        if (tipo === 'receita' && status === 'pago') {
          kpiRec += valor
          kpiTax += taxaVal
        } else if (tipo === 'despesa' && status === 'pago') {
          kpiDes += valor
        }
      }
    })

    const resArr = recRealArr.map((v, i) => Math.round((v + recProvArr[i] - despRealArr[i] - despProvArr[i]) * 100) / 100)
    const totalRecBruta = Math.round((kpiRec + kpiTax) * 100) / 100

    return { 
      recReal: recRealArr,
      recProv: recProvArr,
      despReal: despRealArr,
      despProv: despProvArr,
      resultadoData: resArr, 
      receitaTotal: totalRecBruta, 
      despesaTotal: Math.round(kpiDes * 100) / 100,
      taxaRecuperada: Math.round(kpiTax * 100) / 100,
      saldoTotal: Math.round((totalRecBruta - kpiDes) * 100) / 100
    }
  }, [lancamentos, selectedMonth, selectedYear])

  // 2. Associados
  const { ativos, inadimplentes, inativos, pctInadimp } = useMemo(() => {
    const a = associados.filter(item => (item.status || '').toLowerCase().includes('ativ')).length
    const i = associados.filter(item => (item.status || '').toLowerCase().includes('inadimp')).length
    const inat = associados.filter(item => (item.status || '').toLowerCase().includes('inat')).length
    const total = associados.length || 1
    return { ativos: a, inadimplentes: i, inativos: inat, pctInadimp: (i / total) * 100 }
  }, [associados])

  // 3. Lançamentos Filtrados e Ordenados
  const filteredLancamentos = useMemo(() => {
    let result = [...lancamentos]

    // Filtro por Texto (Busca do Topbar)
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(l => 
        (l.descricao || '').toLowerCase().includes(search) ||
        (l.categoria || '').toLowerCase().includes(search) ||
        (l.valor || 0).toString().includes(search)
      )
    }

    // Filtro por Tipo
    if (filterType !== 'todos') {
      result = result.filter(l => l.tipo === filterType)
    }

    // Filtro por Status
    if (filterStatus !== 'todos') {
      result = result.filter(l => l.status === filterStatus)
    }

    // Ordenação (Mais recentes primeiro)
    return result.sort((a, b) => {
      const da = a.data ? new Date(a.data).getTime() : 0
      const db = b.data ? new Date(b.data).getTime() : 0
      return db - da
    }).map(l => {
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      return {
        ...l,
        taxaCalculada: match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
      }
    })
  }, [lancamentos, searchTerm, filterType, filterStatus])

  const ultimosLancamentos = filteredLancamentos.slice(0, 30)

  const chartConfigs: any = {
    receita: {
      title: 'Fluxo Mensal Consolidado',
      subtitle: 'Comparativo de Entradas e Saídas — Realizado vs Projetado',
      chartType: 'bar',
      insights: [
        { label: 'Receita Realizada', value: fmtR(recReal.reduce((a: number, b: number) => a + b, 0)), color: 'var(--green)', sub: 'acumulado pago' },
        { label: 'Receita Provisionada', value: fmtR(recProv.reduce((a: number, b: number) => a + b, 0)), color: 'rgba(45, 140, 111, 0.4)', sub: 'a receber' },
        { label: 'Resultado Líquido', value: fmtR(resultadoData.reduce((a: number, b: number) => a + b, 0)), color: 'var(--green)', sub: 'saldo final' },
      ],
      chartData: {
        labels: MESES,
        datasets: [
          { label: 'Receita (Paga)', data: recReal, backgroundColor: 'rgba(45, 140, 111, 0.85)', borderRadius: 5, stack: 'receita' },
          { label: 'Receita (Aberta)', data: recProv, backgroundColor: 'rgba(45, 140, 111, 0.25)', borderRadius: 5, stack: 'receita' },
          { label: 'Despesa (Paga)', data: despReal, backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 5, stack: 'despesa' },
          { label: 'Despesa (Aberta)', data: despProv, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 5, stack: 'despesa' },
          { label: 'Resultado', data: resultadoData, type: 'line', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 4 },
        ]
      },
      tableData: {
        headers: ['Mês', 'Rec. Real', 'Rec. Prov', 'Desp. Real', 'Desp. Prov'],
        rows: MESES.map((m, i) => [m, fmtR(recReal[i]), fmtR(recProv[i]), fmtR(despReal[i]), fmtR(despProv[i])])
      }
    },
    associados: {
      title: 'Composição da Carteira',
      subtitle: 'Distribuição proporcional por status',
      chartType: 'doughnut',
      insights: [
        { label: 'Total', value: associados.length, color: 'var(--accent)', sub: 'associados' },
        { label: 'Ativos', value: ativos, color: 'var(--green)', sub: 'adimplentes' },
        { label: 'Inadimplentes', value: inadimplentes, color: 'var(--red)', sub: 'necessitam ação' },
      ],
      chartData: {
        labels: [`Ativos (${ativos})`, `Inadimplentes (${inadimplentes})`, `Inativos (${inativos})`],
        datasets: [{
          data: [ativos, inadimplentes, inativos],
          backgroundColor: ['#10b981', '#ef4444', '#9ca3af'],
          hoverOffset: 10,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      tableData: {
        headers: ['Status', 'Qtd', '%'],
        rows: [
          ['Ativo', ativos, fmtPct((ativos / (associados.length || 1)) * 100)],
          ['Inadimplente', inadimplentes, fmtPct((inadimplentes / (associados.length || 1)) * 100)],
          ['Inativo', inativos, fmtPct((inativos / (associados.length || 1)) * 100)],
        ]
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative">
      {loading && <SplashScreen />}
      
      <div className={`animate-in fade-in duration-500 flex flex-col flex-1 h-full ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight">Dashboard Executivo</h1>
            <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic underline decoration-emerald-200/50">Clique nos ícones de informação para auditar os cálculos.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-100 p-1 rounded-2xl gap-1 shadow-sm">
              <button onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ChevronRight size={16} className="rotate-180" /></button>
              <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center">
                <Calendar size={14} className="text-emerald-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{MESES[selectedMonth]} {selectedYear}</span>
              </div>
              <button onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ChevronRight size={16} /></button>
            </div>

            <button 
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-3 text-[10px] font-black text-rose-600 border border-rose-100 bg-rose-50/30 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest group"
              title="Apagar todos os dados registrados"
            >
              <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
              <span>Resetar Base</span>
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-[60] overflow-visible">
        <KpiCard 
          title="Receita Realizada" 
          value={fmtR(receitaTotal)} 
          trend={12} 
          trendLabel="vs mês anterior" 
          icon={<TrendingUp size={20} />} 
          category="success" 
          explanation={{
            description: "Soma de todos os lançamentos de entrada 'Pagos' no ano, com recuperação automática de taxas bancárias.",
            formula: "Σ(Valor Líquido + Taxas Detectadas)",
            example: "Se o banco reteve R$ 5,00 de taxa em um boleto de R$ 100,00, o sistema registra os R$ 100,00 cheios para auditoria."
          }}
        />
        <KpiCard 
          title="Despesas Pagas" 
          value={fmtR(despesaTotal)} 
          trend={-5} 
          trendLabel="economia gerada" 
          icon={<TrendingDown size={20} />} 
          category="error"
          explanation={{
            description: "Total de saídas de caixa efetivamente liquidadas (Pagas) no período selecionado.",
            formula: "Σ(Lançamentos de Despesa 'Pagos')",
            example: "Pagamentos de fornecedores, impostos e custos operacionais já baixados no extrato."
          }}
        />
        <KpiCard 
          title="Resultado Líquido" 
          value={fmtR(receitaTotal - despesaTotal)} 
          trend={8} 
          trendLabel="crescimento real" 
          icon={<DollarSign size={20} />} 
          category="info" 
          explanation={{
            description: "O saldo final que sobra na conta após todas as despesas serem subtraídas das receitas brutas.",
            formula: "Receita Realizada - Despesas Pagas",
            example: "Se entrou R$ 10k e saiu R$ 7k, o resultado é R$ 3k de lucro real."
          }}
        />
        <KpiCard 
          title="Índice Inadimplência" 
          value={fmtPct(pctInadimp)} 
          trend={-2} 
          trendLabel="redução de risco" 
          icon={<AlertCircle size={20} />} 
          category="danger"
          explanation={{
            description: "Proporção de associados com status 'Inadimplente' em relação ao total de associados ativos.",
            formula: "(Inadimplentes / Total Ativos) × 100",
            example: "Se há 100 associados e 10 não pagaram, o índice é de 10%."
          }}
        />
      </div>

      <div className="charts-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChartCard 
            title="Evolução Financeira" 
            subtitle="Receita vs Despesa"
            onClick={() => setActiveChart(chartConfigs.receita)}
          >
            <div className="h-[300px] mt-4">
              <Bar 
                data={chartConfigs.receita.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10 }, callback: (v: any) => 'R$ ' + Math.round(Number(v) / 1000) + 'k' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                  }
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div>
          <ChartCard 
            title="Status Carteira" 
            subtitle="Associados"
            onClick={() => setActiveChart(chartConfigs.associados)}
          >
            <div className="h-[300px] mt-4">
              <Doughnut 
                data={chartConfigs.associados.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 20 } }
                  },
                  cutout: '70%'
                }}
              />
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="table-card flex-grow min-h-[300px] flex flex-col">
        <div className="p-5 border-b border-white/10 flex flex-col gap-4 bg-white/5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Últimos Lançamentos</h2>
            <div className="flex items-center gap-4">
              {searchTerm && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-pulse">
                  Filtrando por: "{searchTerm}"
                </span>
              )}
              <Calendar size={18} className="text-gray-400" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
               <button 
                 onClick={() => setFilterType('todos')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterType === 'todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >Todos</button>
               <button 
                 onClick={() => setFilterType('receita')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterType === 'receita' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >Receitas</button>
               <button 
                 onClick={() => setFilterType('despesa')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterType === 'despesa' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >Despesas</button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
               <button 
                 onClick={() => setFilterStatus('todos')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterStatus === 'todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >Qualquer Status</button>
               <button 
                 onClick={() => setFilterStatus('pago')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterStatus === 'pago' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}
               >Pagos</button>
               <button 
                 onClick={() => setFilterStatus('aberto')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterStatus === 'aberto' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
               >Abertos</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-b-3xl border-x border-b border-gray-100 shadow-sm overflow-hidden flex-grow">
          <DataTable 
            columns={[
              { header: 'Data', key: 'data', className: 'w-[110px]', render: (l: any) => <span className="text-xs font-medium text-gray-600">{fmtData(l.data)}</span> },
              { header: 'Descrição', key: 'descricao', className: 'min-w-[400px] whitespace-normal', render: (l: any) => <span className="text-xs font-bold text-gray-900">{l.descricao}</span> },
              { header: 'Valor', key: 'valor', className: 'w-[130px]', render: (l: any) => <span className={`text-xs font-bold ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>{l.tipo === 'receita' ? '+' : '-'}{fmtR(l.valor)}</span> },
              { header: 'Taxa', key: 'taxaCalculada', className: 'w-[100px]', render: (l: any) => (
                <span className={`text-[11px] font-black ${l.taxaCalculada > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                  {fmtR(l.taxaCalculada)}
                </span>
              )},
              { header: 'Status', key: 'status', className: 'w-[120px]', render: (l: any) => <StatusBadge status={l.status} type="lancamento" /> }
            ]} 
            data={ultimosLancamentos} 
            loading={loading} 
            selectedIds={selectedIds} 
            onSelectChange={setSelectedIds} 
            onRowClick={handleDetail}
            showFilterInputs={true}
          />
        </div>
      </div>

      <BatchActionBar 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])} 
        onDelete={handleBatchDelete} 
        onStatusChange={handleBatchStatus} 
      />

      <ChartModal 
        isOpen={!!activeChart}
        onClose={() => setActiveChart(null)}
        {...activeChart}
      />

      <LaunchDetailsModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        launch={selectedForDetail}
        linkedName={
          selectedForDetail?.associado_id 
            ? associados.find(a => a.id === selectedForDetail.associado_id)?.nome
            : selectedForDetail?.fornecedor_id 
              ? fornecedores.find(f => f.id === selectedForDetail.fornecedor_id)?.nome
              : selectedForDetail?.diretor_id 
                ? diretoria.find(d => d.id === selectedForDetail.diretor_id)?.nome
                : undefined
        }
        linkedType={
          selectedForDetail?.associado_id ? 'associado' : 
          selectedForDetail?.fornecedor_id ? 'fornecedor' : 
          selectedForDetail?.diretor_id ? 'diretor' : undefined
        }
      />
      </div>
    </div>
  )
}
