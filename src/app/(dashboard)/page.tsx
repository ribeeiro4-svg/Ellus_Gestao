'use client'
import React, { useMemo, useState } from 'react'
import { 
  DollarSign, 
  Users, 
  Briefcase, 
  Activity,
  Calendar,
  Trash2
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import ChartModal from '@/components/ui/ChartModal'
import SplashScreen from '@/components/ui/SplashScreen'
import { fmtR, MESES, fmtData, fmtPct } from '@/lib/utils/formatters'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useMetas } from '@/lib/hooks/useMetas'
import { useProjetos } from '@/lib/hooks/useProjetos'
import { useProjecao } from '@/lib/hooks/useProjecao'
import { deleteCookie } from '@/lib/utils/formatters'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler, ArcElement,
  BarController, LineController, DoughnutController
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, 
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
  BarController, LineController, DoughnutController
)

export default function DashboardPage() {
  const { lancamentos, loading: loadingFin, limparTudo: limpFin } = useFinanceiro()
  const { associados, loading: loadingAssoc, limparTudo: limpAssoc } = useAssociados()
  const { limparTudo: limpMetas } = useMetas()
  const { limparTudo: limpProjetos } = useProjetos()
  const { limparTudo: limpSim } = useProjecao()
  const [activeChart, setActiveChart] = useState<any>(null)

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

  // ── CÁLCULOS DINÂMICOS ──
  
  // 1. Financeiro por mês
  const { receitaData, despesaData, resultadoData, receitaMesAtual } = useMemo(() => {
    const rec = Array(12).fill(0)
    const desp = Array(12).fill(0)
    const agora = new Date()
    const mesAtualIndex = agora.getMonth()
    let rAtual = 0

    lancamentos.forEach(l => {
      const data = l.data ? new Date(l.data) : null
      if (!data || isNaN(data.getTime())) return
      
      const mesIdx = data.getMonth()
      const valor = l.valor || 0
      
      if (l.tipo === 'receita') {
        rec[mesIdx] += valor
        if (mesIdx === mesAtualIndex) rAtual += valor
      } else {
        desp[mesIdx] += valor
      }
    })

    const res = rec.map((v, i) => v - desp[i])
    return { receitaData: rec, despesaData: desp, resultadoData: res, receitaMesAtual: rAtual }
  }, [lancamentos])

  // 2. Associados
  const { ativos, inadimplentes, inativos, pctInadimp } = useMemo(() => {
    const a = associados.filter(item => (item.status || '').toLowerCase().includes('ativ')).length
    const i = associados.filter(item => (item.status || '').toLowerCase().includes('inadimp')).length
    const inat = associados.filter(item => (item.status || '').toLowerCase().includes('inat')).length
    const total = associados.length || 1
    return { ativos: a, inadimplentes: i, inativos: inat, pctInadimp: (i / total) * 100 }
  }, [associados])

  // 3. Lançamentos recentes
  const ultimosLancamentos = useMemo(() => {
    return [...lancamentos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5)
  }, [lancamentos])

  const chartConfigs: any = {
    receita: {
      title: 'Fluxo Mensal Consolidado',
      subtitle: 'Comparativo de Entradas e Saídas — Realizado',
      chartType: 'bar',
      insights: [
        { label: 'Receita Total', value: fmtR(receitaData.reduce((a, b) => a + b, 0)), color: 'var(--green)', sub: 'acumulado no ano' },
        { label: 'Despesa Total', value: fmtR(despesaData.reduce((a, b) => a + b, 0)), color: 'var(--red)', sub: 'acumulado no ano' },
        { label: 'Resultado Líquido', value: fmtR(resultadoData.reduce((a, b) => a + b, 0)), color: 'var(--green)', sub: 'saldo positivo' },
      ],
      chartData: {
        labels: MESES,
        datasets: [
          { label: 'Receita', data: receitaData, backgroundColor: 'rgba(45, 140, 111, 0.75)', borderRadius: 5 },
          { label: 'Despesa', data: despesaData, backgroundColor: 'rgba(239, 68, 68, 0.65)', borderRadius: 5 },
          { label: 'Resultado', data: resultadoData, type: 'line', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 4 },
        ]
      },
      tableData: {
        headers: ['Mês', 'Receita', 'Despesa', 'Resultado'],
        rows: MESES.map((m, i) => [m, fmtR(receitaData[i]), fmtR(despesaData[i]), fmtR(resultadoData[i])])
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
        labels: ['Ativos', 'Inadimplentes', 'Inativos'],
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
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight">Dashboard Executivo</h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium">Análise em tempo real do desempenho da ACPROBEC.</p>
        </div>
        <button 
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-rose-600 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-widest"
          title="Apagar todos os dados registrados"
        >
          <Trash2 size={14} />
          <span>Apagar Tudo</span>
        </button>
      </div>

      <div className="kpi-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Receita (Mês Atual)" value={fmtR(receitaMesAtual)} trend={8.3} trendLabel="projeção positiva" icon={<DollarSign size={20} />} category="success" />
        <KpiCard title="Associados Ativos" value={ativos.toString()} trendLabel="na carteira" icon={<Users size={20} />} category="info" />
        <KpiCard title="Inadimplência" value={fmtPct(pctInadimp)} trend={-1.5} trendLabel="estável" icon={<Activity size={20} />} category={pctInadimp > 10 ? 'error' : 'info'} />
        <KpiCard title="Lançamentos" value={lancamentos.length.toString()} trendLabel="total registros" icon={<Briefcase size={20} />} category="purple" />
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
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Últimos Lançamentos</h2>
          <Calendar size={18} className="text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ultimosLancamentos.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">{fmtData(l.data)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-900">{l.descricao}</td>
                  <td className={`px-6 py-4 text-xs font-bold ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.tipo === 'receita' ? '+' : '-'}{fmtR(l.valor)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      l.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : 
                      l.status === 'aberto' ? 'bg-amber-50 text-amber-700' : 
                      l.status === 'parcial' ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {ultimosLancamentos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs italic">Nenhum lançamento registrado recentemente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ChartModal 
        isOpen={!!activeChart}
        onClose={() => setActiveChart(null)}
        {...activeChart}
      />
      </div>
    </div>
  )
}

