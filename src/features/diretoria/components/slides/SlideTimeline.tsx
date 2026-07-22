import React from 'react';
import { GitCommit, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { fmtR } from '@/lib/utils/formatters';

export default function SlideTimeline() {
  const timelineEvents = [
    {
      id: 1,
      date: 'Jan/2026',
      title: 'Implantação do Novo ERP',
      description: 'Investimento em infraestrutura tecnológica para unificar a gestão.',
      impact: -15000,
      type: 'investment',
    },
    {
      id: 2,
      date: 'Fev/2026',
      title: 'Campanha Recuperação',
      description: 'Ação intensiva da régua de cobrança via EIP e negociações.',
      impact: 35000,
      type: 'revenue',
    },
    {
      id: 3,
      date: 'Mar/2026',
      title: 'Reajuste IPCA Anual',
      description: 'Aplicação do reajuste de 4.5% aprovado em assembleia anterior.',
      impact: 12000,
      type: 'revenue',
    },
    {
      id: 4,
      date: 'Abr/2026',
      title: 'Expansão de Benefícios',
      description: 'Adesão ao novo plano de saúde corporativo para associados.',
      impact: -8000,
      type: 'investment',
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent -translate-y-1/2 z-0" />

      <h1 className="text-4xl font-black mb-4 flex items-center gap-3 relative z-10">
        <GitCommit className="text-emerald-400" size={36} /> Executive Timeline
      </h1>
      <p className="text-white/50 text-lg mb-16 max-w-3xl relative z-10">
        Correlação direta entre as decisões estratégicas tomadas e seus reflexos no fluxo de caixa da instituição.
      </p>

      <div className="flex-1 flex items-center justify-between gap-6 relative z-10 w-full max-w-6xl mx-auto">
        {timelineEvents.map((ev, index) => {
          const isGain = ev.impact > 0;
          return (
            <div key={ev.id} className={`flex-1 flex flex-col ${index % 2 === 0 ? 'justify-end pb-8' : 'justify-start pt-8'} relative`}>
              {/* O Ponto (Node) na Linha do Tempo */}
              <div className={`absolute left-1/2 -translate-x-1/2 ${index % 2 === 0 ? 'bottom-0 translate-y-[5px]' : 'top-0 -translate-y-[5px]'} w-3 h-3 rounded-full bg-black border-2 border-emerald-400 z-20`} />
              
              {/* Linha vertical conectora */}
              <div className={`absolute left-1/2 -translate-x-1/2 ${index % 2 === 0 ? 'bottom-0 h-8' : 'top-0 h-8'} w-[1px] bg-emerald-500/30 z-10`} />

              {/* Card do Evento */}
              <div className={`bg-[#06140f]/90 backdrop-blur-md border ${isGain ? 'border-emerald-500/30' : 'border-rose-500/30'} p-5 rounded-2xl shadow-xl w-full transition-transform hover:-translate-y-2`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/50 bg-black/40 px-2 py-1 rounded-full">
                    <Calendar size={12} />
                    {ev.date}
                  </div>
                  {isGain ? (
                    <TrendingUp size={20} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={20} className="text-rose-400" />
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{ev.title}</h3>
                <p className="text-sm text-white/50 mb-4 line-clamp-2">{ev.description}</p>
                
                <div className={`text-xl font-black ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isGain ? '+' : ''}{fmtR(ev.impact)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
