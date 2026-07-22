import React from 'react';
import { Lightbulb, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';

export default function SlideOportunidades() {
  const { insights } = useExecutiveInsights();

  const opportunities = [
    { 
      id: 1, 
      category: 'Crescimento', 
      title: 'Aumento de Receita', 
      impact: 'Alto Impacto',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: insights.revenue?.insight?.text || 'A receita tem potencial para superar a meta neste trimestre.'
    },
    { 
      id: 2, 
      category: 'Expansão', 
      title: 'Campanha de Adesões', 
      impact: 'Médio Impacto',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      description: 'O custo de aquisição (CAC) caiu 10%. Ótimo momento para acelerar o marketing.'
    },
    { 
      id: 3, 
      category: 'Otimização', 
      title: 'Readequação de Contratos', 
      impact: 'Alto Impacto',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description: 'Renegociar os 3 maiores fornecedores de TI pode economizar até 8% ao ano.'
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/3 translate-x-1/4" />

      <h1 className="text-4xl font-black mb-2 flex items-center gap-3 relative z-10">
        <Lightbulb className="text-amber-400" size={36} /> Mapa de Oportunidades
      </h1>
      <p className="text-white/50 text-lg mb-10 relative z-10">
        Alavancas de crescimento e otimizações identificadas pelo Motor de Tendências.
      </p>

      <div className="flex-1 grid grid-cols-3 gap-6 relative z-10">
        {opportunities.map((opp) => (
          <div key={opp.id} className={`bg-[#06140f]/80 backdrop-blur-sm border ${opp.color.split(' ')[2]} rounded-3xl p-8 flex flex-col hover:bg-white/[0.02] transition-colors relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-6">
              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${opp.color.split(' ').slice(0, 2).join(' ')}`}>
                {opp.impact}
              </span>
              <TrendingUp className={opp.color.split(' ')[0]} size={24} />
            </div>
            
            <p className="text-white/50 font-bold uppercase tracking-wider mb-2 text-sm">{opp.category}</p>
            <h3 className="text-2xl font-black text-white/90 mb-4">{opp.title}</h3>
            <p className="text-white/70 flex-1">{opp.description}</p>
            
            <button className="mt-6 flex items-center gap-2 text-sm font-bold text-white/40 group-hover:text-white/90 transition-colors w-max">
              Explorar Viabilidade <ArrowUpRight size={16} />
            </button>
          </div>
        ))}

        {/* Card Nova Oportunidade */}
        <div className="bg-[#06140f]/40 backdrop-blur-sm border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-white/30 hover:bg-white/[0.02] hover:text-white/60 hover:border-white/20 transition-all cursor-pointer">
          <Zap size={48} className="mb-4 opacity-50" />
          <p className="font-bold">Registrar Ideia / Insight</p>
        </div>
      </div>
    </div>
  );
}
