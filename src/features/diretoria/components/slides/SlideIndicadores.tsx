import React from 'react';
import { Target, TrendingUp, TrendingDown, Clock, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';
import { fmtPct } from '@/lib/utils/formatters';

export default function SlideIndicadores() {
  const { context } = useExecutiveInsights();

  // Mocking the tactical KPIs that power the engine
  const kpis = [
    { label: 'Eficácia de Cobrança', value: '84%', trend: 2.1, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'SLA Atendimento', value: '1.2h', trend: -15, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Satisfação (CSAT)', value: '92%', trend: 0.5, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Aderência Governança', value: '98%', trend: 0, icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Taxa de Conversão', value: '18%', trend: 4.2, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Chamados Pendentes', value: '14', trend: -3, icon: HelpCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2" />

      <h1 className="text-4xl font-black mb-2 flex items-center gap-3 relative z-10">
        <Target className="text-blue-400" size={36} /> Indicadores Táticos (KPIs)
      </h1>
      <p className="text-white/50 text-lg mb-10 relative z-10">
        Acompanhamento granular das métricas operacionais que compõem o Health Score.
      </p>

      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-6 relative z-10">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isGoodTrend = kpi.trend >= 0;
          
          return (
            <div key={idx} className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col justify-center hover:border-white/20 transition-colors group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <Icon className={kpi.color} size={24} />
                </div>
                {kpi.trend !== 0 && (
                  <span className={`text-sm font-bold flex items-center gap-1 ${isGoodTrend ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isGoodTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {Math.abs(kpi.trend)}%
                  </span>
                )}
                {kpi.trend === 0 && (
                  <span className="text-sm font-bold text-white/30 flex items-center gap-1">
                    --
                  </span>
                )}
              </div>
              
              <p className="text-white/50 font-bold uppercase tracking-wider mb-2 text-sm">{kpi.label}</p>
              <h3 className="text-4xl font-black text-white/90">{kpi.value}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
