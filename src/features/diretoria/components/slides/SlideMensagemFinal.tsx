import React from 'react';
import { CheckCircle, Download, FileText } from 'lucide-react';

export default function SlideMensagemFinal() {
  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12 relative overflow-hidden">
      {/* Decoração */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-12">
        <CheckCircle className="text-emerald-400 mb-8" size={80} />
        
        <h1 className="text-5xl font-black mb-6">Apresentação Concluída</h1>
        
        <p className="text-2xl font-light leading-relaxed text-white/80 max-w-4xl mb-12">
          "A associação encerra o período mantendo equilíbrio financeiro, crescimento da base de associados e capacidade operacional para sustentar sua expansão."
        </p>

        <div className="flex flex-col items-center gap-4">
          <button className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-emerald-900/50 uppercase tracking-widest text-sm">
            <Download size={18} />
            Baixar Ata Executiva Automática (PDF)
          </button>
          <p className="text-white/40 text-sm flex items-center gap-2">
            <FileText size={14} />
            Inclui todos os insights gerados e tarefas delegadas no Modo Conselho.
          </p>
        </div>
      </div>
    </div>
  );
}
