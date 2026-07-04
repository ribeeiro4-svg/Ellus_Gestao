import React from 'react';
import { AlertOctagon } from 'lucide-react';
export default function SlideRiscos() {
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
        <AlertOctagon className="text-rose-400" size={36} /> Mapa de Riscos
      </h1>
      <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30">
        (Placeholder: Matriz gerada pelo motor Risco/Impacto/Probabilidade)
      </div>
    </div>
  );
}
