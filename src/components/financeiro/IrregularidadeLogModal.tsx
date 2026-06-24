'use client'
import React from 'react'
import { X, FileText, CheckCircle2, Download, ShieldCheck, Target, AlertTriangle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface LogEntry {
  status: 'MANTIDO' | 'EXCLUÍDO'
  associado: string
  descricao: string
  motivo?: string
}

interface IrregularidadeLogModalProps {
  isOpen: boolean
  onClose: () => void
  results: {
    countDeleted: number
    countSkipped: number
    logs: LogEntry[]
  } | null
}

export default function IrregularidadeLogModal({ isOpen, onClose, results }: IrregularidadeLogModalProps) {
  if (!isOpen || !results) return null

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(225, 29, 72) // Rose-600
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Irregularidades', 14, 25)
    
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 33)

    // Resumo
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text('Resumo da Operação de Rastreio', 14, 55)
    
    doc.setFontSize(10)
    doc.text(`Total de Analisados: ${results.logs.length}`, 14, 65)
    doc.text(`Mensalidades Excluídas: ${results.countDeleted}`, 14, 70)
    doc.text(`Registros Protegidos: ${results.countSkipped}`, 14, 75)
    doc.text(`Critério: Mensalidade no mesmo mês da Adesão`, 14, 80)

    // Tabela
    const tableRows = results.logs.map(l => [
      l.status,
      l.associado,
      l.descricao,
      l.motivo || '--'
    ])

    ;(doc as any).autoTable({
      startY: 90,
      head: [['Status', 'Associado', 'Descrição', 'Motivo/Ação']],
      body: tableRows,
      headStyles: { fillColor: [225, 29, 72] }, // Rose-600
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 241, 242] } // Rose-50
    })

    doc.save(`irregularidades_log_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/30 shadow-inner">
              <Target className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-white text-2xl font-black">Relatório de Irregularidades</h2>
              <p className="text-rose-100 text-sm font-bold opacity-80 uppercase tracking-widest mt-0.5">Auditoria de Adesões vs Mensalidades</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[24px] border border-rose-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Excluídos</span>
              <div className="text-3xl font-black text-rose-600">{results.countDeleted}</div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-amber-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Protegidos</span>
              <div className="text-3xl font-black text-amber-600">{results.countSkipped}</div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total Analisado</span>
              <div className="text-3xl font-black text-slate-700">{results.logs.length}</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {results.logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase ${log.status === 'EXCLUÍDO' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{log.associado}</td>
                    <td className="px-6 py-4 font-bold text-slate-500">{log.descricao}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 italic">
                        {log.status === 'EXCLUÍDO' ? <CheckCircle2 size={12} className="text-rose-500" /> : <AlertTriangle size={12} className="text-amber-500" />}
                        {log.motivo}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-xs font-bold text-slate-400 italic flex items-center gap-2">
            <ShieldCheck size={14} className="text-rose-500" /> Auditoria de Integridade Financeira - ÁUREA Tech
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExportPDF}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-rose-100 active:scale-95"
            >
              <Download size={20} /> BAIXAR RELATÓRIO PDF
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black transition-all hover:text-slate-700 uppercase tracking-widest text-[11px]"
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
