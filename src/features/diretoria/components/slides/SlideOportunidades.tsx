import React from 'react';
import { Lightbulb } from 'lucide-react';
export default function SlideOportunidades() {
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
        <Lightbulb className="text-amber-400" size={36} /> Oportunidades
      </h1>
      <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30">
        (Placeholder: Matriz de Oportunidades com base no Trend Engine)
      </div>
    </div>
  );
}
