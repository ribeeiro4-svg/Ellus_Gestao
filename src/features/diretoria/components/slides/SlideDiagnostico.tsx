import React from 'react';
import { Search, BrainCircuit, ArrowRight, Zap, ShieldAlert } from 'lucide-react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';

export default function SlideDiagnostico() {
  const { insights } = useExecutiveInsights();

  // Filtra apenas as regras que não passaram (Alertas reais)
  const activeAlerts = Object.values(insights).filter(r => !r.passed && r.insight);

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-4 flex items-center gap-3">
        <Search className="text-emerald-400" size={36} /> Diagnóstico Executivo Automático
      </h1>
      <p className="text-white/50 text-lg mb-8 max-w-3xl">
        Análise cruzada de dados financeiros e operacionais gerada pelo Motor de Inteligência.
      </p>

      <div className="flex-1 flex gap-8">
        
        {/* Coluna Esquerda: Diagnóstico Geral */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BrainCircuit size={160} />
          </div>
          
          <h2 className="text-xl font-bold text-white/90 mb-6 flex items-center gap-2">
            <BrainCircuit className="text-emerald-400" size={24} />
            Parecer do EIE (Executive Intelligence Engine)
          </h2>
          
          <div className="space-y-6 text-white/80 leading-relaxed relative z-10">
            <p>
              O cenário atual demonstra uma forte resiliência na captação de receitas, porém os níveis de liquidez 
              estão se aproximando de zonas de atenção devido ao aumento acelerado de despesas operacionais no último trimestre.
            </p>
            <p>
              A inadimplência, embora dentro das margens estabelecidas, apresenta um viés de alta nos planos corporativos, 
              o que demanda atenção imediata da área de relacionamento.
            </p>
            
            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="font-bold text-emerald-400 block mb-2">Conclusão Principal</span>
              Manter o foco em retenção e iniciar um plano de contingência para redução de 10% nas despesas fixas.
            </div>
          </div>
        </div>

        {/* Coluna Direita: Ações Sugeridas (Decision Intelligence) */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white/70 px-2 flex items-center gap-2 mb-2">
            <Zap className="text-amber-400" size={20} />
            Decision Intelligence: Ações Sugeridas
          </h2>
          
          {activeAlerts.length === 0 ? (
             <div className="flex-1 border border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400/50">
               Nenhum alerta crítico identificado no período.
             </div>
          ) : (
             <div className="space-y-4 overflow-y-auto pr-2">
                {activeAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-[#06140f] border border-amber-500/20 rounded-xl p-6 transition-all hover:border-amber-500/50">
                    <div className="flex gap-3 mb-3">
                      <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={20} />
                      <div>
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md mb-2 inline-block">
                          {alert.insight?.id}
                        </span>
                        <p className="text-white/90 font-semibold">{alert.insight?.text}</p>
                      </div>
                    </div>
                    
                    <div className="ml-8 mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-3">
                        Ação Executiva Recomendada
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-emerald-400 font-semibold bg-emerald-500/5 px-3 py-2 rounded-lg flex-1">
                          "Delegar revisão de contratos de fornecedores prioritários para reduzir custo fixo."
                        </p>
                        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
                          <span>Aprovar Tarefa</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
