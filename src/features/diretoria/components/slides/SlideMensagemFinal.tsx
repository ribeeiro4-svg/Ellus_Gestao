import React from 'react';
import { CheckCircle } from 'lucide-react';
export default function SlideMensagemFinal() {
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
        <CheckCircle className="text-emerald-400" size={36} /> Mensagem Final
      </h1>
      <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30 text-center px-12">
        <p className="text-2xl font-light leading-relaxed">
          "A associação encerra o período mantendo equilíbrio financeiro, crescimento da base de associados e capacidade operacional para sustentar sua expansão."
        </p>
      </div>
    </div>
  );
}
