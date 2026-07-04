import React from 'react';
import { Search } from 'lucide-react';
export default function SlideDiagnostico() {
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
        <Search className="text-emerald-400" size={36} /> Diagnóstico e Acontecimentos
      </h1>
      <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30">
        (Placeholder: Bullet-points e Driver Analysis)
      </div>
    </div>
  );
}
