'use client'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import { 
  DollarSign, 
  Users, 
  Target, 
  ArrowUpRight, 
  Briefcase, 
  Activity,
  Calendar
} from 'lucide-react'
import { fmtR, MESES } from '@/lib/utils/formatters'

export default function DashboardPage() {
  // MOCK DATA - Substituir pelos hooks reais após configurar Supabase
  const kpis = [
    { title: 'Receita Mensal', value: fmtR(42500), trend: 12, trendLabel: 'vs mês ant.', icon: <DollarSign />, color: 'emerald' as const },
    { title: 'Associados Ativos', value: '1,240', trend: 5.2, trendLabel: 'novos este mês', icon: <Users />, color: 'blue' as const },
    { title: 'Inadimplência', value: '4.8%', trend: -1.5, trendLabel: 'redução', icon: <Activity />, color: 'red' as const },
    { title: 'Projetos Ativos', value: '12', icon: <Briefcase />, color: 'indigo' as const },
  ]

  const labels = MESES
  const receitaData = [32000, 35000, 38000, 31000, 42000, 45000, 48000, 41000, 43000, 49000, 52000, 42500]
  const despesaData = [28000, 29000, 31000, 30500, 32000, 34000, 36000, 33000, 35000, 37000, 39000, 38000]

  return (
    <div className="space-y-8">
      {/* Header com Saudação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bem-vindo, Admin 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Aqui está o que está acontecendo com a ACPROBEC hoje.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title="Fluxo de Caixa" 
          subtitle="Receitas vs Despesas (2024)"
          actions={
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> RECEITA
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-slate-200"></div> DESPESA
              </span>
            </div>
          }
        >
          <BarChart 
            labels={labels} 
            datasets={[
              { label: 'Receita', data: receitaData, backgroundColor: '#2563eb', borderRadius: 6 },
              { label: 'Despesa', data: despesaData, backgroundColor: '#e2e8f0', borderRadius: 6 },
            ]} 
          />
        </ChartCard>

        <ChartCard 
          title="Evolução de Associados" 
          subtitle="Crescimento da base ativa"
        >
          <LineChart 
            labels={labels} 
            datasets={[
              { 
                label: 'Ativos', 
                data: [1050, 1080, 1100, 1090, 1120, 1150, 1180, 1200, 1210, 1230, 1245, 1240], 
                borderColor: '#10b981', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
              }
            ]} 
          />
        </ChartCard>
      </div>

      {/* Recent Activity / Goals Table Preview */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 tracking-tight">Metas Estratégicas</h4>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Ver todas →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Meta</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Responsável</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Progresso</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { meta: 'Redução de Inadimplência', resp: 'Maria Silva', prog: 85, color: 'emerald', prazo: '30 Mai, 2024' },
                  { meta: 'Expansão de Benefícios', resp: 'João Souza', prog: 40, color: 'blue', prazo: '15 Jun, 2024' },
                  { meta: 'Reforma da Sede', resp: 'Carlos Lima', prog: 15, color: 'amber', prazo: '20 Jul, 2024' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{row.meta}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{row.resp[0]}</div>
                        <span className="text-xs text-slate-600 font-medium">{row.resp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-${row.color}-500`} style={{ width: `${row.prog}%`, backgroundColor: row.color === 'emerald' ? '#10b981' : row.color === 'blue' ? '#2563eb' : '#f59e0b' }}></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{row.prog}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-medium text-slate-400">{row.prazo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
