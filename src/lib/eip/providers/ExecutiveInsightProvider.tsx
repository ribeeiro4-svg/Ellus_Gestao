'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ExecutiveContext, createInitialExecutiveContext } from '../core/ExecutiveContext';
import { evaluateRevenueTrend, evaluateLiquidity, evaluateDefaultRate, RuleResult } from '../domains/finance/rules/financialRules';

interface ExecutiveInsightState {
  context: ExecutiveContext;
  updateContext: (partial: Partial<ExecutiveContext>) => void;
  insights: Record<string, RuleResult>;
  isProcessing: boolean;
}

const InsightContext = createContext<ExecutiveInsightState | undefined>(undefined);

export function ExecutiveInsightProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<ExecutiveContext>(createInitialExecutiveContext());
  const [insights, setInsights] = useState<Record<string, RuleResult>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Função para injetar atualizações no Contexto Central
  const updateContext = (partial: Partial<ExecutiveContext>) => {
    setContext((prev) => ({ ...prev, ...partial }));
  };

  // Motor Principal: Recalcula os insights sempre que o contexto (indicadores, metas, etc) muda
  useEffect(() => {
    setIsProcessing(true);

    // TODO: Num cenário real, isso poderia usar Web Workers ou ser assíncrono se houver IA.
    // Aqui rodamos os domínios de forma síncrona.
    const newInsights: Record<string, RuleResult> = {
      revenue: evaluateRevenueTrend(context),
      liquidity: evaluateLiquidity(context),
      defaultRate: evaluateDefaultRate(context),
    };

    setInsights(newInsights);
    setIsProcessing(false);
  }, [context]);

  return (
    <InsightContext.Provider value={{ context, updateContext, insights, isProcessing }}>
      {children}
    </InsightContext.Provider>
  );
}

export function useExecutiveInsights() {
  const ctx = useContext(InsightContext);
  if (ctx === undefined) {
    throw new Error('useExecutiveInsights must be used within an ExecutiveInsightProvider');
  }
  return ctx;
}
