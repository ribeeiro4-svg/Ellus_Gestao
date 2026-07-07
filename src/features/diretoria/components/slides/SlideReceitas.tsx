import React from 'react';
import { ArrowUpRight, TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react';
import { fmtR, fmtPct } from '@/lib/utils/formatters';

interface SlideReceitasProps {
  kpis: {
    receitaMes: number;
    [key: string]: any;
  };
  fluxo: any[];
  composicao: { categoria: string; valor: number }[];
}

export default function SlideReceitas({ kpis, fluxo, composicao }: SlideReceitasProps) {
  const receitaBruta = kpis.receitaMes;
  const metaReceita = kpis.receitaMes * 0.95; // meta sugerida (se bater 100% eh pq alcancou a meta q era menor)
  const percentualMeta = metaReceita > 0 ? (receitaBruta / metaReceita) : 1;
  const isAboveMeta = percentualMeta >= 1;

  const valMensalidades = composicao.filter(c => c.categoria.toLowerCase().includes('mensalidad')).reduce((s, c) => s + c.valor, 0);
  const valAdesoes = composicao.filter(c => c.categoria.toLowerCase().includes('ades')).reduce((s, c) => s + c.valor, 0);
  const valOutras = composicao.filter(c => !c.categoria.toLowerCase().includes('mensalidad') && !c.categoria.toLowerCase().includes('ades')).reduce((s, c) => s + c.valor, 0);

  const breakdown = [
    { label: 'Mensalidades Recorrentes', value: valMensalidades },
    { label: 'Novas Adesões', value: valAdesoes },
    { label: 'Outras Receitas', value: valOutras },
  ].filter(i => i.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      {/* Decoração */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <h1 className="text-4xl font-black mb-2 flex items-center gap-3 relative z-10">
        <ArrowUpRight className="text-emerald-400" size={36} /> Análise de Receitas
      </h1>
      <p className="text-white/50 text-lg mb-10 relative z-10">
        Decomposição das entradas financeiras e atingimento das metas do período.
      </p>

      <div className="flex-1 flex gap-6 relative z-10">
        {/* Painel Principal */}
        <div className="flex flex-col gap-6 w-1/3">
          <div className="bg-[#06140f]/80 backdrop-blur-sm border border-emerald-500/20 rounded-3xl p-8 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={80} />
            </div>
            <p className="text-emerald-400 font-bold uppercase tracking-wider mb-2 text-sm">Receita Bruta Total</p>
            <p className="text-5xl font-black text-white mb-2">{fmtR(receitaBruta)}</p>
            <div className="flex items-center gap-2 text-sm font-semibold mt-4">
              <span className={`px-2 py-1 rounded ${isAboveMeta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {fmtPct(percentualMeta * 100)} da Meta
              </span>
              <span className="text-white/40">atingido</span>
            </div>
          </div>

          <div className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex-1 flex flex-col justify-center hover:border-white/20 transition-colors">
            <p className="text-white/40 font-bold uppercase tracking-wider mb-2 text-sm flex items-center gap-2">
              <Target size={16} /> Meta Planejada
            </p>
            <p className="text-3xl font-black text-white/80">{fmtR(metaReceita)}</p>
          </div>
        </div>

        {/* Painel Detalhado */}
        <div className="flex-1 bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col">
          <h2 className="text-xl font-bold text-white/90 flex items-center gap-2 mb-8">
            <BarChart3 className="text-emerald-400" size={20} /> Composição da Receita
          </h2>
          
          <div className="flex-1 flex flex-col justify-center gap-8">
            {breakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white/70 font-semibold">{item.label}</span>
                  <span className="text-2xl font-black">{fmtR(item.value)}</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" 
                    style={{ width: `${(item.value / receitaBruta) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs font-bold text-emerald-400/80">{fmtPct((item.value / receitaBruta) * 100)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
