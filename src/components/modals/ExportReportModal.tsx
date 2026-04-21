'use client'
import React, { useState } from 'react'
import { X, FileText, Layout, DollarSign, Users, Target, Clipboard, BarChart3, Download, Info, Loader2 } from 'lucide-react'
import { generateReportHtml } from '@/lib/services/reportGenerator'
import { MESES } from '@/lib/utils/formatters'

interface ExportReportModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    metrics: any;
    financeiro: any[];
    associados: any[];
  }
}

export default function ExportReportModal({ isOpen, onClose, data }: ExportReportModalProps) {
  const [sections, setSections] = useState<string[]>(['dashboard', 'financeiro', 'associados', 'metas', 'graficos'])
  const [title, setTitle] = useState('Relatório Gerencial — ACPROBEC')
  const [period, setPeriod] = useState(`Período: ${MESES[new Date().getMonth()]} ${new Date().getFullYear()}`)
  const [treasurer, setTreasurer] = useState('Tesoureiro(a): ACPROBEC')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const toggleSection = (id: string) => {
    if (sections.includes(id)) {
      setSections(sections.filter(s => s !== id))
    } else {
      setSections([...sections, id])
    }
  }

  const handleExport = async () => {
    setIsGenerating(true)
    
    try {
      // Pequeno delay para a animação do loader
      await new Promise(r => setTimeout(r, 800))

      // Capturar gráficos da página se selecionado
      const charts: Record<string, string> = {}
      if (sections.includes('graficos')) {
        const canvases = document.querySelectorAll('canvas')
        canvases.forEach((canvas, idx) => {
          const card = canvas.closest('.chart-card')
          const chartTitle = card?.querySelector('.chart-title')?.textContent || `Gráfico ${idx + 1}`
          charts[chartTitle] = canvas.toDataURL('image/png')
        })
      }

      const html = generateReportHtml({
        title,
        period,
        treasurer,
        sections,
        charts,
        data
      })

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Relatorio_Gerencial_${new Date().getTime()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      onClose()
    } catch (error) {
      alert('Erro ao gerar relatório.')
    } finally {
      setIsGenerating(false)
    }
  }

  const sectionOptions = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout, color: 'text-blue-500' },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'associados', label: 'Associados', icon: Users, color: 'text-purple-500' },
    { id: 'metas', label: 'Metas', icon: Target, color: 'text-rose-500' },
    { id: 'projetos', label: 'Projetos', icon: Clipboard, color: 'text-amber-500' },
    { id: 'graficos', label: 'Gráficos', icon: BarChart3, color: 'text-indigo-500' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Exportar Relatório PDF</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gera um relatório profissional com gráficos e indicadores.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Seções do Relatório</h3>
            <div className="grid grid-cols-2 gap-3">
              {sectionOptions.map(opt => (
                <label 
                  key={opt.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${sections.includes(opt.id) ? 'bg-emerald-50/30 border-emerald-200 ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={sections.includes(opt.id)}
                      onChange={() => toggleSection(opt.id)}
                    />
                    <div className={`w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${opt.color}`}>
                      <opt.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${sections.includes(opt.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                    {sections.includes(opt.id) && <Download size={12} strokeWidth={4} />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Informações Adicionais</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título do Relatório"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-4 ring-emerald-500/5 focus:bg-white transition-all"
              />
              <input 
                type="text" 
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="Período"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-4 ring-emerald-500/5 focus:bg-white transition-all"
              />
              <input 
                type="text" 
                value={treasurer}
                onChange={e => setTreasurer(e.target.value)}
                placeholder="Responsável / Tesoureiro"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-4 ring-emerald-500/5 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white text-blue-500 flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
              <Info size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-tighter">Como funciona?</h4>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed mt-1">Um arquivo <strong>.html</strong> será baixado. Abra-o no Chrome ou Edge, pressione <strong>Ctrl+P</strong> e selecione "Salvar como PDF".</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleExport}
            disabled={isGenerating || sections.length === 0}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isGenerating ? 'Gerando Relatório...' : 'Baixar Relatório'}
          </button>
        </div>
      </div>
    </div>
  )
}
