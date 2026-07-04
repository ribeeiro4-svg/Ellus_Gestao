export type ComparisonMode = 'previous_month' | 'same_month_last_year' | 'annual_average' | 'budget' | 'custom';
export type Scenario = 'conservative' | 'expected' | 'optimistic';

export interface EIPGoals {
  inadimplencia: number; // e.g., 10 for 10%
  liquidez: number; // e.g., 3 for 3 months
  crescimento: number; // e.g., 5 for 5%
}

export interface EIPWeights {
  finance: number; // e.g., 40
  members: number; // e.g., 25
  operations: number; // e.g., 20
  governance: number; // e.g., 15
}

export interface EIPCompanyInfo {
  name: string;
  id: string;
  segment?: string;
}

export interface EIPPreferences {
  theme: 'dark' | 'light';
  showAnimations: boolean;
}

/**
 * O Coração do Estado do Executive Intelligence Platform (EIP).
 * Agrupa absolutamente todos os dados necessários para que os Engines
 * (Rules, Trends, Forecast) executem suas lógicas sem precisarem de 
 * dezenas de parâmetros espalhados.
 */
export interface ExecutiveContext {
  /** Mês/Ano de referência da análise (ex: "2026-06") */
  competencia: string;
  
  /** Base de comparação selecionada pelo executivo */
  comparacao: ComparisonMode;
  
  /** Cenário de projeção atual */
  cenario: Scenario;
  
  /** Metas da associação para o período */
  metas: EIPGoals;
  
  /** Pesos estratégicos para o cálculo do Health Score */
  pesos: EIPWeights;
  
  /** Dados da associação */
  empresa: EIPCompanyInfo;
  
  /** 
   * Indicadores brutos já normalizados pela camada de Dados.
   * Estes são os valores puros (ex: receitaAtual, receitaAnterior, caixaAtual).
   * O formato será tipado conforme evoluímos os domínios.
   */
  indicadores: Record<string, any>;
  
  /** 
   * Histórico de meses anteriores para alimentar o Trend Engine 
   * e o Forecast Engine.
   */
  historico: Record<string, any>[];
  
  /**
   * Eventos da Executive Timeline (ex: "Aumento de Mensalidade", "Campanha")
   * que ocorreram no período, para explicar variações.
   */
  eventos: any[];
  
  /** Preferências de exibição da apresentação */
  preferencias: EIPPreferences;
}

/**
 * Função utilitária para criar um ExecutiveContext inicial (default).
 */
export function createInitialExecutiveContext(): ExecutiveContext {
  return {
    competencia: new Date().toISOString().slice(0, 7), // YYYY-MM
    comparacao: 'previous_month',
    cenario: 'expected',
    metas: {
      inadimplencia: 10,
      liquidez: 3,
      crescimento: 5,
    },
    pesos: {
      finance: 40,
      members: 25,
      operations: 20,
      governance: 15,
    },
    empresa: {
      name: 'Associação Modelo',
      id: 'default',
    },
    indicadores: {},
    historico: [],
    eventos: [],
    preferencias: {
      theme: 'dark',
      showAnimations: true,
    },
  };
}
