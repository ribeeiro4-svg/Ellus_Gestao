'use client'
import { useState } from 'react'
import DropZone from '@/components/importar/DropZone'
import DataTable from '@/components/ui/DataTable'
import { parseCSV, parseExcel } from '@/lib/utils/csvParser'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useMetas } from '@/lib/hooks/useMetas'
import { useProjetos } from '@/lib/hooks/useProjetos'
import { Database, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

type ImportType = 'financeiro' | 'associados' | 'metas' | 'projetos'

export default function ImportarPage() {
  const [type, setType] = useState<ImportType>('financeiro')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Hooks
  const fin = useFinanceiro()
  const ass = useAssociados()
  const met = useMetas()
  const pro = useProjetos()

  const handleFileSelect = async (file: File) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setData([])

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    const result = isExcel ? await parseExcel<any>(file) : await parseCSV<any>(file)

    if (result.errors.length > 0) {
      setError(result.errors[0])
    } else {
      setData(result.data)
    }
    setLoading(false)
  }

  const handleImport = async () => {
    if (data.length === 0) return
    setSending(true)
    setError(null)

    try {
      let result;
      switch (type) {
        case 'financeiro': result = await fin.inserirBulk(data); break;
        case 'associados': result = await ass.inserirBulk(data); break;
        case 'metas':      result = await met.inserirBulk(data); break;
        case 'projetos':   result = await pro.inserirBulk(data); break;
      }

      if (result?.error) {
        setError(result.error.message || 'Erro ao salvar no banco.')
      } else {
        setSuccess('Dados importados com sucesso!')
        setData([])
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.')
    } finally {
      setSending(false)
    }
  }

  const TYPES = [
    { id: 'financeiro', label: 'Financeiro', icon: Database },
    { id: 'associados', label: 'Associados', icon: FileSpreadsheet },
    { id: 'metas',      label: 'Metas',       icon: Database },
    { id: 'projetos',   label: 'Projetos',    icon: Database },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Importação de Dados</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Alimente o sistema ACPROBEC enviando seus arquivos CSV ou Excel. Escolha o tipo de dado abaixo para começar.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => { setType(t.id as ImportType); setData([]) }}
            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-4 ${
              type === t.id 
                ? 'border-blue-600 bg-blue-50/50 text-blue-600 scale-105 shadow-xl shadow-blue-600/10' 
                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
            }`}
          >
            <t.icon size={24} />
            <span className="text-xs font-bold uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <DropZone onFileSelect={handleFileSelect} />
        
        {loading && (
          <div className="flex items-center justify-center gap-3 text-slate-400 py-8">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Processando arquivo...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={20} className="shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {data.length > 0 && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{data.length}</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">registros encontrados</span>
              </div>
              <button 
                onClick={handleImport}
                disabled={sending}
                className="flex items-center gap-2 bg-blue-600 text-white text-xs font-black px-8 py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:bg-slate-300 active:scale-95"
              >
                {sending ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
                <span>Processar e Salvar no Banco</span>
              </button>
            </div>

            <div className="max-h-[400px] overflow-auto rounded-[24px] border border-slate-200 shadow-inner">
              <DataTable 
                columns={Object.keys(data[0] || {}).map(k => ({ header: k, key: k }))} 
                data={data.slice(0, 10)} 
              />
              {data.length > 10 && (
                <div className="p-4 text-center bg-slate-50 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Exibindo apenas os primeiros 10 registros do arquivo...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
