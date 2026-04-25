
'use client'
import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, Info } from 'lucide-react'
import { importarNFSeAction } from '@/features/fiscal/actions/nfseActions'
import { fmtR, fmtData } from '@/lib/utils/formatters'

export default function NFSeImportZone({ onImported }: { onImported: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previews, setPreviews] = useState<any[]>([])
  const [results, setResults] = useState<{ file: string; ok: boolean; msg: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.name.endsWith('.xml'))
    if (!arr.length) return alert('Selecione arquivos .xml de NFS-e')
    
    setImporting(true)
    const newPreviews = []
    
    for (const file of arr) {
      const content = await file.text()
      const res = await importarNFSeAction(content)
      if (res.success && res.data) {
        newPreviews.push({ ...res.data, fileName: file.name })
      } else {
        setResults(prev => [...prev, { file: file.name, ok: false, msg: res.error || 'Erro desconhecido' }])
      }
    }
    
    setPreviews(newPreviews)
    setImporting(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-16 rounded-[32px] border-2 border-dashed cursor-pointer transition-all ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
        }`}
      >
        <input ref={inputRef} type="file" accept=".xml" multiple className="hidden" onChange={e => e.target.files && processFiles(e.target.files)} />
        <div className={`w-16 h-16 rounded-3xl mb-4 flex items-center justify-center transition-all ${dragging ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100 shadow-sm'}`}>
          <Upload size={32} />
        </div>
        <p className="text-sm font-black text-slate-700">Arraste arquivos XML de NFS-e aqui</p>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Suporta ABRASF e Padrão Nacional ADN</p>
        
        {importing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
            <Loader2 size={32} className="text-blue-600 animate-spin mb-2" />
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Analisando XML...</span>
          </div>
        )}
      </div>

      {/* Previews (Para Escrituração Manual/Lote) */}
      {previews.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">📋 Notas Identificadas ({previews.length})</h3>
            <button 
              onClick={() => { setPreviews([]); onImported(); }}
              className="px-6 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Ver na Lista para Escriturar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previews.map((p, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">NFS-e {p.nota.numero_nfse}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{fmtData(p.nota.data_emissao)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{fmtR(p.nota.valor_bruto)}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Líquido: {fmtR(p.nota.valor_liquido)}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Prestador</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{p.prestador.razao_social}</p>
                  <p className="text-[10px] text-slate-500">{p.prestador.cnpj}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {results.filter(r => !r.ok).length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest px-2">⚠️ Falhas no Processamento</h3>
          {results.filter(r => !r.ok).map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <XCircle size={16} className="text-red-500" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-700">{r.file}</span>
                <span className="text-[10px] font-bold text-red-600">{r.msg}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Info size={20} className="text-emerald-400" />
            <h4 className="text-sm font-black uppercase tracking-widest">Inteligência NFS-e ACPROBEC</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Detecção automática ABRASF / ADN
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Cálculo de Retenções Federais (IR/PCC)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Identificação automática de Prestadores
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Suporte a múltiplos arquivos (ZIP em breve)
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
      </div>
    </div>
  )
}
