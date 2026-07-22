import React from 'react'

export default function ConfigTabsContent({ activeTab }: { activeTab: string }) {
  // A aba "Geral" etc.
  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
      <h2 className="text-xl font-black text-slate-800 mb-4 capitalize">Aba: {activeTab}</h2>
      <p className="text-sm text-slate-500">Conteúdo em construção ou migrado.</p>
    </div>
  )
}
