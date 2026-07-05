import React from 'react';
import { ArrowDownRight, AlertTriangle, FileText, PieChart } from 'lucide-react';
import { fmtR, fmtPct } from '@/lib/utils/formatters';

interface SlideDespesasProps {
  kpis: {
    despesaTotal: number;
    metaDespesa: number;
    [key: string]: any;
  };
  fluxo: any[];
}

export default function SlideDespesas({ kpis, fluxo }: SlideDespesasProps) {
  const percentualMeta = kpis.metaDespesa > 0 ? (kpis.despesaTotal / kpis.metaDespesa) : 1;
  const isAboveMeta = percentualMeta > 1; // Para despesa, maior que 1 é ruim

  // Mock top ofensores for presentation depth
  const ofensores = [
    { label: 'Folha de Pagamento & Encargos', value: kpis.despesaTotal * 0.55 },
    { label: 'Fornecedores e TI', value: kpis.despesaTotal * 0.25 },
    { label: 'Marketing e Campanhas', value: kpis.despesaTotal * 0.12 },
    { label: 'Despesas Administrativas', value: kpis.despesaTotal * 0.08 },
  ];

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      {/* Decoração */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-rose-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/3" />

      <h1 className="text-4xl font-black mb-2 flex items-center gap-3 relative z-10">
        <ArrowDownRight className="text-rose-400" size={36} /> Despesas & Ofensores
      </h1>
      <p className="text-white/50 text-lg mb-10 relative z-10">
        Composição de custos operacionais e limites estabelecidos.
      </p>

      <div className="flex-1 flex gap-6 relative z-10">
        {/* Painel Principal */}
        <div className="flex flex-col gap-6 w-1/3">
          <div className="bg-[#06140f]/80 backdrop-blur-sm border border-rose-500/20 rounded-3xl p-8 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-rose-500/40 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle size={80} className="text-rose-400" />
            </div>
            <p className="text-rose-400 font-bold uppercase tracking-wider mb-2 text-sm">Saídas Totais</p>
            <p className="text-5xl font-black text-white mb-2">{fmtR(kpis.despesaTotal)}</p>
            <div className="flex items-center gap-2 text-sm font-semibold mt-4">
              <span className={`px-2 py-1 rounded ${isAboveMeta ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {fmtPct(percentualMeta * 100)} do Orçamento
              </span>
              <span className="text-white/40">consumido</span>
            </div>
          </div>

          <div className="bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex-1 flex flex-col justify-center hover:border-white/20 transition-colors">
            <p className="text-white/40 font-bold uppercase tracking-wider mb-2 text-sm flex items-center gap-2">
              <FileText size={16} /> Teto Orçamentário
            </p>
            <p className="text-3xl font-black text-white/80">{fmtR(kpis.metaDespesa)}</p>
          </div>
        </div>

        {/* Painel Detalhado */}
        <div className="flex-1 bg-[#06140f]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col">
          <h2 className="text-xl font-bold text-white/90 flex items-center gap-2 mb-8">
            <PieChart className="text-rose-400" size={20} /> Principais Ofensores (Top 4)
          </h2>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            {ofensores.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white/70 font-semibold">{item.label}</span>
                  <span className="text-xl font-black">{fmtR(item.value)}</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full" 
                    style={{ width: `${(item.value / kpis.despesaTotal) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs font-bold text-rose-400/80">{fmtPct((item.value / kpis.despesaTotal) * 100)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
