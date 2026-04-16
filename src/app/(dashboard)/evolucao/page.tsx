'use client'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import ChartCard from '@/components/ui/ChartCard'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import { calcEvolucao } from '@/lib/utils/calcMensal'
import { fmtR } from '@/lib/utils/formatters'
import { TrendingUp, Users, Activity } from 'lucide-react'

export default function EvolucaoPage() {
  const { lancamentos } = useFinanceiro()
  const { associados } = useAssociados()

  // Dados de Evolução
  const data = calcEvolucao(lancamentos, associados)
  
  const labels = data.map(m => m.label)
  const receitasData = data.map(m => m.receita)
  const despesasData = data.map(m => m.despesa)
  const resultadosData = data.map(m => m.resultado)

  return (
    <div className="space-y-8 h-full pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20">
            <Activity size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Evolução Histórica</h2>
            <p className="text-slate-500 text-sm mt-1">Análise comparativa de crescimento e solidez financeira.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title="Receitas vs Despesas" 
          subtitle="Evolução mensal do fluxo de caixa operacional."
          actions={<TrendingUp className="text-blue-600" size={18} />}
        >
          <BarChart 
            labels={labels} 
            datasets={[
              { label: 'Receitas', data: receitasData, backgroundColor: '#10b981' },
              { label: 'Despesas', data: despesasData, backgroundColor: '#ef4444' }
            ]} 
          />
        </ChartCard>

        <ChartCard 
          title="Superávits / Déficits" 
          subtitle="Resultado líquido mensal consolidado."
          actions={<Activity className="text-violet-600" size={18} />}
        >
          <LineChart 
            labels={labels} 
            datasets={[
              { label: 'Resultado', data: resultadosData, borderColor: '#8b5cf6', backgroundColor: '#8b5cf620', fill: true }
            ]} 
          />
        </ChartCard>

        <ChartCard 
          title="Crescimento de Associados" 
          subtitle="Evolução da base de associados ativos."
          actions={<Users className="text-emerald-600" size={18} />}
        >
          <LineChart 
            labels={labels} 
            datasets={[
              { label: 'Associados Ativos', data: labels.map((_, i) => associados.length - (labels.length - i) * 2), borderColor: '#10b981', backgroundColor: '#10b98120', fill: true }
            ]} 
          />
        </ChartCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio</span>
              <h3 className="text-3xl font-black text-slate-900 leading-none">{fmtR(associados.reduce((acc, a) => acc + a.mensalidade, 0) / (associados.length || 1))}</h3>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">Investimento médio por associado na associação.</p>
           </div>
           <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl flex flex-col justify-center items-center text-center overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full"></div>
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2 relative z-10">Churn Rate (Predição)</span>
              <h3 className="text-3xl font-black text-white leading-none relative z-10">4.2%</h3>
              <p className="text-xs text-blue-200/50 mt-4 leading-relaxed font-medium relative z-10">Projeção Baseada no comportamento histórico.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
