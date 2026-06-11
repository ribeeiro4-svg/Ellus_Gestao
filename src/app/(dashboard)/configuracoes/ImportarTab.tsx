'use client'
import React, { useRef, useState } from 'react'
import { Download, Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, RefreshCw, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useProjecao } from '@/lib/hooks/useProjecao'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { downloadTemplate } from '@/features/importar/utils/excelUtils'
import { useImportProcessor } from '@/features/importar/hooks/useImportProcessor'
import ImportPreviewTable from '@/features/importar/components/ImportPreviewTable'

export default function ImportarTab() {
  const tenantId = useTenantId()
  const { inserirBulk: bulkFinanceiro } = useFinanceiro()
  const { associados: associadosAtuais, inserirBulk: bulkAssociados } = useAssociados()
  const { cenario, salvarCenario } = useProjecao()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { loading, setLoading, preview, setPreview, ignoredCount, setIgnoredCount, processData } = useImportProcessor(associadosAtuais)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null
    if ('files' in e.target && e.target.files) file = e.target.files[0]
    else if ('dataTransfer' in e && e.dataTransfer.files) file = e.dataTransfer.files[0]

    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data: any[] = XLSX.utils.sheet_to_json(ws)
          processData(data)
        } catch (err) { setFeedback({ type: 'error', message: 'Erro na leitura do Excel.' }) }
      }
      reader.readAsBinaryString(file)
    }
  }

  const confirmImport = async () => {
    if (!preview || !tenantId || tenantId === 'LOADING') {
      setFeedback({ type: 'error', message: 'Houve um erro na identificação do inquilino ou não há dados.' })
      return
    }
    setLoading(true)
    try {
      if (preview.type === 'financeiro') {
        const { error } = await bulkFinanceiro(preview.data)
        if (error) throw new Error(String(error))
        setFeedback({ type: 'success', message: `${preview.data.length} lançamentos importados!` })
      } else if (preview.type === 'associados') {
        const res = await bulkAssociados(preview.data)
        if (res.error) throw new Error(String(res.error))
        setFeedback({ type: 'success', message: `${preview.data.length} associados importados!` })
      } else if (preview.type === 'prolabore') {
        await salvarCenario({ ...cenario, pro_labores: preview.data })
        setFeedback({ type: 'success', message: `Pro-labore atualizado!` })
      }
      setPreview(null); setIgnoredCount(0)
    } catch (err: any) { setFeedback({ type: 'error', message: err.message }) } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col flex-1 gap-6">
      {feedback && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-xs font-bold">{feedback.message}</p>
          <button onClick={() => setFeedback(null)} className="ml-auto text-[10px] uppercase font-black opacity-50">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {!preview && (
          <div className="lg:col-span-1 border rounded-[32px] p-6 bg-white space-y-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2"><Download size={18} /> Modelos</h2>
            <div className="space-y-3">
              {['financeiro', 'associados', 'prolabore'].map((type: any) => (
                <button key={type} onClick={() => downloadTemplate(type)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100"><FileSpreadsheet size={20} className="text-indigo-600" /></div><div className="text-left font-bold capitalize text-xs">{type}</div></div>
                  <Download size={16} className="text-gray-300 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`${preview ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6`}>
          {!preview ? (
            <label onDragOver={(e: any) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={(e: any) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e) }} className={`border-2 border-dashed rounded-[40px] p-8 flex flex-col items-center justify-center text-center transition-all bg-gray-50/50 flex-1 cursor-pointer ${isDragging ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-300'}`}>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-indigo-600 mb-6 border border-gray-100"><Upload size={32} /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Arraste seus arquivos aqui</h3>
              <button onClick={(e) => { e.preventDefault(); fileInputRef.current?.click() }} className="px-8 py-3 bg-[#0e2d22] text-white rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 disabled:opacity-50" disabled={loading || !tenantId}>
                {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Selecionar Arquivo'}
              </button>
            </label>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="border-[3px] border-indigo-500/10 rounded-[32px] overflow-hidden bg-white shadow-2xl">
                <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                  <div><h3 className="text-sm font-bold text-indigo-900 capitalize">Preview: {preview.type}</h3><p className="text-[10px] text-indigo-700">{preview.data.length} itens prontos.</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreview(null); setIgnoredCount(0) }} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-rose-600 flex items-center gap-2"><Trash2 size={14} /> Limpar</button>
                    <button onClick={confirmImport} disabled={loading || !tenantId} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Confirmar
                    </button>
                  </div>
                </div>
                {ignoredCount > 0 && <div className="bg-amber-100/50 p-2 px-4 border-b border-amber-200/50 text-[11px] font-bold text-amber-800">Antiduplicidade: {ignoredCount} itens ignorados.</div>}
                <ImportPreviewTable type={preview.type} data={preview.data} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={16} /></div><div><div className="text-xs font-bold text-gray-900">Validação</div><p className="text-[10px] text-gray-500">Dados conferidos antes da gravação.</p></div></div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><FileText size={16} /></div><div><div className="text-xs font-bold text-gray-900">Logs</div><p className="text-[10px] text-gray-500">Histórico de importação por usuário.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
