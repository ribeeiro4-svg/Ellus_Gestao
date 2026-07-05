import React from 'react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';
import { Play, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ExecutiveCockpitProps {
  onStartPresentation: () => void;
}

export default function ExecutiveCockpit({ onStartPresentation }: ExecutiveCockpitProps) {
  const { context, insights, isProcessing } = useExecutiveInsights();

  // Função provisória de Mock para o Índice de Saúde
  const indiceSaude = 91; // Mock: Isso virá do Motor de Pontuação depois
  
  // Extrai apenas os insights válidos (que "passaram" nas regras e retornaram um alerta)
  const activeAlerts = Object.values(insights).filter(r => !r.passed && r.insight);

  return (
    <div className="flex-1 w-full flex flex-col gap-6 min-h-[600px] animate-in fade-in duration-700 p-6 bg-[#020806] text-white rounded-xl border border-white/5">
      {/* Header do Cockpit */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white/90">Cockpit Executivo</h1>
          <p className="text-white/50 mt-2">Visão Geral Estratégica • {context.empresa.name} • {context.competencia}</p>
        </div>
        
        <button 
          onClick={onStartPresentation}
          disabled={isProcessing}
          className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
        >
          <Play size={20} className="fill-black" />
          <span>Iniciar Apresentação</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 flex-1">
        
        {/* Painel Esquerdo: Índice de Saúde */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <h2 className="text-white/60 font-semibold uppercase tracking-wider text-sm mb-4">Saúde Geral da Organização</h2>
          <div className="text-7xl font-black text-emerald-400 tabular-nums">
            {indiceSaude}
            <span className="text-2xl text-white/40 ml-1">/100</span>
          </div>
          <div className="mt-4 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20">
            EXCELENTE
          </div>
          
          <div className="w-full space-y-3 mt-10">
            {/* Índices setoriais (Mocks para a fundação) */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">Financeiro</span>
              <div className="flex items-center gap-3 w-1/2">
                <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[94%] rounded-full" />
                </div>
                <span className="font-bold">94</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">Associados</span>
              <div className="flex items-center gap-3 w-1/2">
                <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[90%] rounded-full" />
                </div>
                <span className="font-bold">90</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">Operacional</span>
              <div className="flex items-center gap-3 w-1/2">
                <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-[88%] rounded-full" />
                </div>
                <span className="font-bold">88</span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Central e Direito: Alertas e Insights */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex-1">
            <h2 className="text-white/90 font-bold text-lg mb-6 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              Alertas Prioritários e Insights
            </h2>
            
            <div className="space-y-4">
              {activeAlerts.length === 0 ? (
                <div className="text-white/50 text-sm">O motor não identificou riscos prioritários para o período.</div>
              ) : (
                activeAlerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="shrink-0 w-2 h-full bg-amber-400 rounded-full" />
                    <div>
                      <div className="text-amber-400 font-bold text-sm mb-1">{alert.insight?.id}</div>
                      <p className="text-white/80 text-sm leading-relaxed">{alert.insight?.text}</p>
                      {alert.insight?.explainability && (
                        <div className="mt-3 text-xs text-white/40 flex items-center gap-2">
                          <span className="bg-white/10 px-2 py-0.5 rounded">Motivo</span>
                          {alert.insight.explainability.join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
               <h3 className="text-white/70 font-semibold mb-2">Confiabilidade da Análise</h3>
               <div className="text-3xl font-black text-white/90">96%</div>
               <p className="text-white/40 text-xs mt-2">Baseada em histórico, regras estáticas e dados financeiros normalizados.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
               <h3 className="text-white/70 font-semibold mb-2">Tendência Geral</h3>
               <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp size={28} />
                  <span className="text-2xl font-black">Positiva</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
