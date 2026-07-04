import React from 'react';
import { useExecutiveInsights } from '../../../../lib/eip/providers/ExecutiveInsightProvider';
import { Activity } from 'lucide-react';

export default function SlideDashboardSaude() {
  const { context } = useExecutiveInsights();
  
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
        <Activity className="text-emerald-400" size={36} />
        Dashboard de Saúde Geral
      </h1>
      <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30">
        (Placeholder: Gráficos de Governança, Financeiro, Associados e Operacional)
      </div>
    </div>
  );
}
