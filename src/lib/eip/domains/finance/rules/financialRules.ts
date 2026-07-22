import { ExecutiveContext } from '../../../core/ExecutiveContext';
import { InsightEntry, getInsightById } from '../../../catalog/insightCatalog';

export interface RuleResult {
  passed: boolean;
  insight: InsightEntry | null;
  value: number;
}

/**
 * Avalia a Variação da Receita
 * Se caiu mais de 10% -> FIN001
 * Se subiu mais de 10% -> FIN002
 */
export function evaluateRevenueTrend(ctx: ExecutiveContext): RuleResult {
  const currentRevenue = ctx.indicadores?.receitaAtual || 0;
  const previousRevenue = ctx.indicadores?.receitaAnterior || 0;
  
  if (previousRevenue === 0) return { passed: true, insight: null, value: 0 };
  
  const varPercent = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  
  if (varPercent <= -10) {
    return { passed: false, insight: getInsightById('FIN001'), value: varPercent };
  }
  
  if (varPercent >= 10) {
    return { passed: true, insight: getInsightById('FIN002'), value: varPercent };
  }
  
  return { passed: true, insight: null, value: varPercent };
}

/**
 * Avalia o Fluxo de Caixa (Liquidez)
 * Caixa / Despesas Médias = Meses de Sobrevida
 * Menos que 2 meses -> FIN004
 * Mais que 6 meses -> FIN005
 */
export function evaluateLiquidity(ctx: ExecutiveContext): RuleResult {
  const cash = ctx.indicadores?.saldoAtual || 0;
  const avgExpenses = ctx.indicadores?.despesaMedia || 1; // avoid division by zero
  
  const months = cash / avgExpenses;
  
  if (months < 2) {
    return { passed: false, insight: getInsightById('FIN004'), value: months };
  }
  
  if (months > 6) {
    return { passed: true, insight: getInsightById('FIN005'), value: months };
  }
  
  return { passed: true, insight: null, value: months };
}

/**
 * Avalia a Inadimplência contra a Meta configurada no Contexto
 * Acima da meta -> FIN003
 */
export function evaluateDefaultRate(ctx: ExecutiveContext): RuleResult {
  const currentDefaultRate = ctx.indicadores?.inadimplenciaAtual || 0;
  const target = ctx.metas.inadimplencia || 10;
  
  if (currentDefaultRate > target) {
    return { passed: false, insight: getInsightById('FIN003'), value: currentDefaultRate };
  }
  
  return { passed: true, insight: null, value: currentDefaultRate };
}
