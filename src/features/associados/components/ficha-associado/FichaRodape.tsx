import React, { useState } from 'react'
import { FileDown, X, Loader2 } from 'lucide-react'

interface FichaRodapeProps {
  onClose: () => void
  onExportPdf: () => Promise<void>
}

export default function FichaRodape({ onClose, onExportPdf }: FichaRodapeProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExportPdf()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
      <button 
        onClick={onClose}
        className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
      >
        Fechar
      </button>

      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="flex-1 max-w-[300px] py-4 bg-[#1D9E75] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <FileDown size={18} />
            Salvar Ficha em PDF
          </>
        )}
      </button>
    </div>
  )
}
