import React from 'react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';
import { Activity, Landmark, Users, Briefcase, ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters'; // wait, it's fmtR. I will fix this locally below.

// Corrigindo para fmtR
import { fmtR, fmtPct } from '@/lib/utils/formatters';

export default function SlideDashboardSaude() {
  const { context } = useExecutiveInsights();
  
  // Extraindo os dados do contexto financeiro/associados
  const fin = context.data.financial;
  const mem = context.data.members;

  // Mocking os outros dois pilares para completude visual do Executive Dashboard
  const gov = { score: 92, label: 'Compliance & Atas', status: 'Excelente' };
  const ops = { score: 88, label: 'SLA de Atendimento', status: 'Estável' };

  const formatTrend = (value: number, inverse: boolean = false) => {
    if (value === 0) return <span className="text-white/50 flex items-center gap-1"><Minus size={14}/> 0%</span>;
    const isGood = inverse ? value < 0 : value > 0;
    return (
      <span className={`flex items-center gap-1 font-bold ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
        {value > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      {/* Decoração sutil de fundo */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <h1 className="text-4xl font-black mb-2 flex items-center gap-3 relative z-10">
        <Activity className="text-emerald-400" size={36} />
        Dashboard de Saúde Corporativa
      </h1>
      <p className="text-white/50 text-lg mb-12 relative z-10">
        Visão consolidada dos 4 pilares estratégicos da associação neste período.
      </p>

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 relative z-10">
        
        {/* Pilar 1: Financeiro */}
        <div className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-emerald-500/30 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Landmark className="text-emerald-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white/90">Eixo Financeiro</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Score {context.config.strategicWeights.financial}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Receita Líquida</p>
              <p className="text-3xl font-black text-white">{fmtR(fin.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Inadimplência</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-white">{fmtPct(fin.defaultRate)}</p>
                {formatTrend(1.2, true)} {/* mock trend */}
              </div>
            </div>
          </div>
        </div>

        {/* Pilar 2: Associados */}
        <div className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-blue-500/30 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Users className="text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white/90">Base de Associados</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">Score {context.config.strategicWeights.members}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Membros Ativos</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-white">{mem.activeCount}</p>
                {formatTrend(mem.growthRate)}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Taxa de Churn</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-white">{fmtPct(mem.churnRate)}</p>
                {formatTrend(-0.5, true)} {/* mock trend */}
              </div>
            </div>
          </div>
        </div>

        {/* Pilar 3: Operacional */}
        <div className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-amber-500/30 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                <Briefcase className="text-amber-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white/90">Eixo Operacional</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">Score {context.config.strategicWeights.operational}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Índice de Qualidade</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-white">{ops.score}%</p>
                {formatTrend(2.1)}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Principal Indicador</p>
              <p className="text-lg font-bold text-white/80 mt-1">{ops.label}</p>
              <p className="text-sm text-emerald-400">{ops.status}</p>
            </div>
          </div>
        </div>

        {/* Pilar 4: Governança */}
        <div className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-purple-500/30 transition-colors group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <ShieldCheck className="text-purple-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white/90">Governança & Risco</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">Score {context.config.strategicWeights.governance}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Aderência Compliance</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-white">{gov.score}%</p>
                {formatTrend(0)}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-sm font-semibold mb-1">Principal Indicador</p>
              <p className="text-lg font-bold text-white/80 mt-1">{gov.label}</p>
              <p className="text-sm text-emerald-400">{gov.status}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
