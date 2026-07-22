import React from 'react';
import { AlertOctagon, ShieldAlert, ArrowRight, Shield } from 'lucide-react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';

export default function SlideRiscos() {
  const { insights } = useExecutiveInsights();

  // Mocking os riscos baseados nos insights (num app real isso viria do motor de Risco)
  const risks = [
    { 
      id: 1, 
      category: 'Financeiro', 
      title: 'Alta Inadimplência', 
      severity: insights.defaultRate?.insight?.level === 'critical' ? 'Alto' : 'Médio',
      color: insights.defaultRate?.insight?.level === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: insights.defaultRate?.insight?.text || 'Taxa de inadimplência requer atenção.'
    },
    { 
      id: 2, 
      category: 'Operacional', 
      title: 'Tempo de Resposta SLA', 
      severity: 'Médio',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'O tempo médio de resposta caiu 15% nos últimos 30 dias.'
    },
    { 
      id: 3, 
      category: 'Governança', 
      title: 'Atas Pendentes', 
      severity: 'Baixo',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: '3 atas do conselho ainda não foram assinadas digitalmente.'
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/4" />

      <h1 className="text-4xl font-black mb-2 flex items-center gap-3 relative z-10">
        <AlertOctagon className="text-rose-400" size={36} /> Mapa de Riscos
      </h1>
      <p className="text-white/50 text-lg mb-10 relative z-10">
        Atritos e vulnerabilidades identificados pelo motor de diagnóstico.
      </p>

      <div className="flex-1 grid grid-cols-3 gap-6 relative z-10">
        {risks.map((risk) => (
          <div key={risk.id} className={`bg-[#06140f]/80 backdrop-blur-sm border ${risk.color.split(' ')[2]} rounded-3xl p-8 flex flex-col hover:bg-white/[0.02] transition-colors relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-6">
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${risk.color.split(' ').slice(0, 2).join(' ')}`}>
                Risco {risk.severity}
              </span>
              <ShieldAlert className={risk.color.split(' ')[0]} size={24} />
            </div>
            
            <p className="text-white/50 font-bold uppercase tracking-wider mb-2 text-sm">{risk.category}</p>
            <h3 className="text-2xl font-black text-white/90 mb-4">{risk.title}</h3>
            <p className="text-white/70 flex-1">{risk.description}</p>
            
            <button className="mt-6 flex items-center gap-2 text-sm font-bold text-white/40 group-hover:text-white/90 transition-colors w-max">
              Ver Plano de Mitigação <ArrowRight size={16} />
            </button>
          </div>
        ))}

        {/* Card Adicionar Risco */}
        <div className="bg-[#06140f]/40 backdrop-blur-sm border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-white/30 hover:bg-white/[0.02] hover:text-white/60 hover:border-white/20 transition-all cursor-pointer">
          <Shield size={48} className="mb-4 opacity-50" />
          <p className="font-bold">Mapear Novo Risco</p>
        </div>
      </div>
    </div>
  );
}
