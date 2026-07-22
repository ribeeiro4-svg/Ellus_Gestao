export type InsightLevel = 'success' | 'warning' | 'critical' | 'info';

export interface InsightEntry {
  id: string;
  text: string;
  level: InsightLevel;
  domain: 'finance' | 'members' | 'operations' | 'governance';
  explainability: string[];
}

/**
 * Banco de Insights (Insight Catalog)
 * Centraliza os textos, alertas e explicações do sistema.
 * Evita textos "hardcoded" nos componentes e facilita futura internacionalização
 * ou substituição por um LLM real.
 */
export const INSIGHT_CATALOG: Record<string, InsightEntry> = {
  'FIN001': {
    id: 'FIN001',
    domain: 'finance',
    level: 'critical',
    text: 'A receita apresentou queda significativa em relação ao período anterior, indicando necessidade de reforçar ações de arrecadação.',
    explainability: ['Comparação de Receita Mês Atual vs Mês Anterior', 'Queda > 10%']
  },
  'FIN002': {
    id: 'FIN002',
    domain: 'finance',
    level: 'success',
    text: 'O crescimento da receita demonstra evolução positiva da capacidade de arrecadação da associação.',
    explainability: ['Comparação de Receita Mês Atual vs Mês Anterior', 'Crescimento > 10%']
  },
  'FIN003': {
    id: 'FIN003',
    domain: 'finance',
    level: 'warning',
    text: 'O índice de inadimplência permanece elevado, representando risco para o fluxo de caixa.',
    explainability: ['Inadimplência Atual > Meta de Inadimplência Configurada']
  },
  'FIN004': {
    id: 'FIN004',
    domain: 'finance',
    level: 'warning',
    text: 'O caixa disponível exige atenção, pois representa baixa cobertura das despesas operacionais.',
    explainability: ['Liquidez < 2 meses de despesas médias']
  },
  'FIN005': {
    id: 'FIN005',
    domain: 'finance',
    level: 'success',
    text: 'A associação apresenta excelente capacidade financeira para suportar investimentos ou oscilações de receita.',
    explainability: ['Liquidez > 6 meses de despesas médias']
  },
  'MEM001': {
    id: 'MEM001',
    domain: 'members',
    level: 'warning',
    text: 'A redução da base de associados impacta diretamente a receita recorrente.',
    explainability: ['Saldo Líquido de Associados < 0 no período']
  },
  'MEM002': {
    id: 'MEM002',
    domain: 'members',
    level: 'success',
    text: 'O crescimento da base fortalece a sustentabilidade financeira da associação.',
    explainability: ['Saldo Líquido de Associados > 0 no período']
  }
};

/**
 * Função auxiliar para buscar um insight pelo ID
 */
export function getInsightById(id: string): InsightEntry | null {
  return INSIGHT_CATALOG[id] || null;
}
