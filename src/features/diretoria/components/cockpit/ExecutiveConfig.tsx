import React from 'react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';
import { Settings, Target, Scale, Save } from 'lucide-react';

interface ExecutiveConfigProps {
  onClose: () => void;
}

export default function ExecutiveConfig({ onClose }: ExecutiveConfigProps) {
  const { context, updateContext } = useExecutiveInsights();

  // Função provisória para simular o "Salvar" 
  const handleSave = () => {
    // Aqui no futuro poderia disparar um salvamento no banco de dados
    onClose();
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 animate-in fade-in duration-700 p-6 bg-[#020806] text-white rounded-xl border border-white/5">
      <div className="flex justify-between items-start border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white/90 flex items-center gap-3">
            <Settings className="text-emerald-400" />
            Parâmetros do Motor (EIE)
          </h1>
          <p className="text-white/50 mt-1">Calibre as metas e os pesos estratégicos para a inteligência artificial calcular os Scores.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg font-semibold transition-all border border-white/5"
        >
          <Save size={18} />
          <span>Salvar e Voltar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Painel de Metas */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Target size={20} />
            Metas do Período
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
              <label className="block text-sm font-semibold text-white/70 mb-2">Tolerância de Inadimplência (%)</label>
              <input 
                type="number" 
                value={context.metas.inadimplencia} 
                onChange={(e) => updateContext({ metas: { ...context.metas, inadimplencia: Number(e.target.value) } })}
                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-white/40 mt-2">Alertas dispararão se a inadimplência ultrapassar este valor.</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
              <label className="block text-sm font-semibold text-white/70 mb-2">Liquidez Desejada (Meses de Caixa)</label>
              <input 
                type="number" 
                value={context.metas.liquidez} 
                onChange={(e) => updateContext({ metas: { ...context.metas, liquidez: Number(e.target.value) } })}
                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Painel de Pesos */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Scale size={20} />
            Pesos do Health Score (%)
          </h2>
          
          <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-white/70">Financeiro</span>
                <span className="text-emerald-400">{context.pesos.finance}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={context.pesos.finance}
                onChange={(e) => updateContext({ pesos: { ...context.pesos, finance: Number(e.target.value) } })}
                className="w-full accent-emerald-500"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-white/70">Associados</span>
                <span className="text-emerald-400">{context.pesos.members}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={context.pesos.members}
                onChange={(e) => updateContext({ pesos: { ...context.pesos, members: Number(e.target.value) } })}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-white/70">Operacional</span>
                <span className="text-emerald-400">{context.pesos.operations}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={context.pesos.operations}
                onChange={(e) => updateContext({ pesos: { ...context.pesos, operations: Number(e.target.value) } })}
                className="w-full accent-emerald-500"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-white/70">Governança</span>
                <span className="text-emerald-400">{context.pesos.governance}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={context.pesos.governance}
                onChange={(e) => updateContext({ pesos: { ...context.pesos, governance: Number(e.target.value) } })}
                className="w-full accent-emerald-500"
              />
            </div>
            
            <div className="pt-4 mt-2 border-t border-white/10 flex justify-between text-sm">
              <span className="text-white/50">Total Distribuído</span>
              <span className={`font-bold ${
                (context.pesos.finance + context.pesos.members + context.pesos.operations + context.pesos.governance) === 100 
                  ? 'text-emerald-400' 
                  : 'text-red-400'
              }`}>
                {context.pesos.finance + context.pesos.members + context.pesos.operations + context.pesos.governance}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
