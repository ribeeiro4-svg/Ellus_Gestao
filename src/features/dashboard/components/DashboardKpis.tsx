import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import { fmtR, fmtPct } from '@/lib/utils/formatters'

interface DashboardKpisProps {
  metrics: any
}

export default function DashboardKpis({ metrics }: DashboardKpisProps) {
  const { receitaTotal, despesaTotal, trends, associadosStats } = metrics

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-[60] overflow-visible">
      <KpiCard 
        title="Receita Realizada" 
        value={fmtR(receitaTotal)} 
        trend={trends.receita} 
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
        trend={trends.despesa} 
        trendLabel="vs mês anterior" 
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
        trend={trends.resultado} 
        trendLabel="vs mês anterior" 
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
        value={fmtPct(associadosStats.pctInadimp)} 
        trend={0} 
        trendLabel="vs mês anterior" 
        icon={<AlertCircle size={20} />} 
        category="danger"
        explanation={{
          description: "Proporção de associados com status 'Inadimplente' em relação ao total de associados ativos.",
          formula: "(Inadimplentes / Total Ativos) × 100",
          example: "Se há 100 associados e 10 não pagaram, o índice é de 10%."
        }}
      />
    </div>
  )
}
