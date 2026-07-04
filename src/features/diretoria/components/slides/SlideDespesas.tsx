import React from 'react';
import { ArrowDownRight } from 'lucide-react';
export default function SlideDespesas() {
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
        <ArrowDownRight className="text-rose-400" size={36} /> Despesas e Ofensores
      </h1>
      <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30">
        (Placeholder: Top ofensores e reduções)
      </div>
    </div>
  );
}
