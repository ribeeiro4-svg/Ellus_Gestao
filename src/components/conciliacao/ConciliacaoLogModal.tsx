'use client'
import React from 'react'
import { X, FileText, CheckCircle2, Download, ExternalLink, Calendar, DollarSign, User, ShieldCheck } from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface LogEntry {
  data: string
  descricao: string
  valor: number
  tipo: string
  associado?: string
  status: 'sucesso' | 'erro'
  mensagem: string
  id_bancario?: string
  atualizou_cpf?: boolean
  novo_cpf?: string
}

interface ConciliacaoLogModalProps {
  isOpen: boolean
  onClose: () => void
  logs: LogEntry[]
}

export default function ConciliacaoLogModal({ isOpen, onClose, logs }: ConciliacaoLogModalProps) {
  if (!isOpen) return null

  const successCount = logs.filter(l => l.status === 'sucesso').length
  const totalValue = logs.reduce((acc, curr) => acc + curr.valor, 0)
  const cpfUpdates = logs.filter(l => l.atualizou_cpf).length

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(16, 185, 129) // Emerald-600
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Conciliação', 14, 25)
    
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 33)

    // Resumo
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text('Resumo da Operação', 14, 55)
    
    doc.setFontSize(10)
    doc.text(`Total de Lançamentos: ${logs.length}`, 14, 65)
    doc.text(`Sucessos: ${successCount}`, 14, 70)
    doc.text(`Valor Total Conciliado: ${fmtR(totalValue)}`, 14, 75)
    doc.text(`CPFs Atualizados: ${cpfUpdates}`, 14, 80)

    // Tabela
    const tableRows = logs.map(l => [
      fmtData(l.data),
      l.descricao.substring(0, 40),
      l.associado || '--',
      fmtR(l.valor),
      l.mensagem
    ])

    ;(doc as any).autoTable({
      startY: 90,
      head: [['Data', 'Descrição', 'Associado', 'Valor', 'Status/Ação']],
      body: tableRows,
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 255, 250] }
    })

    const updatedCpfLogs = logs.filter(l => l.atualizou_cpf && l.associado && l.novo_cpf)
    if (updatedCpfLogs.length > 0) {
      doc.addPage()
      
      // Header Nova Página
      doc.setFillColor(79, 70, 229) // Indigo-600
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Auditoria de Cadastros (CPFs)', 14, 25)

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text('Os seguintes associados tiveram seus CPFs atualizados automaticamente:', 14, 55)

      const cpfTableRows = updatedCpfLogs.map(l => [
        l.associado,
        l.novo_cpf
      ])

      ;(doc as any).autoTable({
        startY: 65,
        head: [['Nome do Associado', 'CPF Extraído']],
        body: cpfTableRows,
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10 }
      })
    }

    doc.save(`conciliacao_log_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/30 shadow-inner">
              <FileText className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-white text-2xl font-black font-outfit">Relatório de Conciliação</h2>
              <p className="text-emerald-100 text-sm font-bold opacity-80 uppercase tracking-widest mt-0.5">Log de Processamento Concluído</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Lançamentos</span>
              <div className="text-2xl font-black text-emerald-600">{logs.length}</div>
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Sucesso</span>
              <div className="text-2xl font-black text-emerald-600">{successCount}</div>
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor Total</span>
              <div className="text-2xl font-black text-emerald-600">{fmtR(totalValue)}</div>
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-indigo-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CPFs Atualizados</span>
              <div className="text-2xl font-black text-indigo-600">{cpfUpdates}</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status/Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">{fmtData(log.data)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 truncate max-w-[200px]">{log.descricao}</td>
                    <td className="px-6 py-4 font-bold text-slate-600">
                      {log.associado ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                          <User size={12} /> {log.associado}
                        </div>
                      ) : '--'}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-right">{fmtR(log.valor)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-1.5 font-black text-[10px] uppercase ${log.status === 'sucesso' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.status === 'sucesso' ? <CheckCircle2 size={12} /> : <X size={12} />}
                          {log.mensagem}
                        </div>
                        {log.atualizou_cpf && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                              <ShieldCheck size={10} /> CPF ATUALIZADO
                            </div>
                            {log.novo_cpf && (
                              <span className="text-[10px] font-mono font-bold text-slate-400 ml-1">
                                {log.novo_cpf}
                              </span>
                            )}
                          </div>
                        )}
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
            <ShieldCheck size={14} className="text-emerald-500" /> Relatório auditado pelo Inovacont ACPROBEC
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExportPDF}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-emerald-100 active:scale-95"
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
