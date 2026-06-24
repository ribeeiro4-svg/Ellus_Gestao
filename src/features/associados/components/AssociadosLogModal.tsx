'use client'
import React from 'react'
import { X, FileText, CheckCircle2, Download, User, ShieldCheck, Zap, AlertCircle } from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export interface AssociadoLogEntry {
  data: string
  descricao: string
  associado?: string
  status: 'sucesso' | 'erro'
  mensagem: string
  valor?: number
  id_bancario?: string
}

interface AssociadosLogModalProps {
  isOpen: boolean
  onClose: () => void
  logs: AssociadoLogEntry[]
  title?: string
}

export default function AssociadosLogModal({ isOpen, onClose, logs, title = 'Relatório de Processamento' }: AssociadosLogModalProps) {
  if (!isOpen) return null

  const successCount = logs.filter(l => l.status === 'sucesso').length
  const totalValue = logs.reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(16, 185, 129) // Emerald-600
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 14, 25)
    
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 33)

    let currentY = 55

    const hasValue = totalValue > 0
    const head = hasValue 
      ? [['Data', 'Descrição', 'Associado', 'Valor', 'Status/Ação']]
      : [['Data', 'Descrição', 'Associado', 'Status/Ação']]

    const tableRows = logs.map(l => {
      const row = [
        fmtData(l.data),
        l.descricao,
        l.associado || '--',
      ]
      if (hasValue) {
        row.push(l.valor ? fmtR(l.valor) : '--')
      }
      row.push(`${l.status.toUpperCase()}: ${l.mensagem}`)
      return row
    })

    ;(doc as any).autoTable({
      startY: currentY,
      head: head,
      body: tableRows,
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    })

    doc.save(`auditoria_vencimento_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/30 shadow-inner text-white">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-white text-2xl font-black">{title}</h2>
              <p className="text-emerald-100 text-sm font-bold opacity-80 uppercase tracking-widest mt-0.5">Log de Auditoria ACPROBEC</p>
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
            <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Processados</span>
                <div className="text-2xl font-black text-slate-800">{logs.length}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                 <Zap size={20} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Sucessos</span>
                <div className="text-2xl font-black text-emerald-600">{successCount}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
                 <CheckCircle2 size={20} />
              </div>
            </div>
            {totalValue > 0 && (
              <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor Total</span>
                  <div className="text-2xl font-black text-emerald-600">{fmtR(totalValue)}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500 font-black text-xs">
                   R$
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associado</th>
                  {totalValue > 0 && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>}
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
                    {totalValue > 0 && (
                      <td className="px-6 py-4 font-black text-slate-800 text-right">
                        {log.valor ? fmtR(log.valor) : '--'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-black text-[10px] uppercase truncate">
                        {log.status === 'sucesso' ? (
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle size={12} className="text-rose-500 shrink-0" />
                        )}
                        <span className={log.status === 'sucesso' ? 'text-emerald-500' : 'text-rose-500'}>
                          {log.mensagem}
                        </span>
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
            <ShieldCheck size={14} className="text-emerald-500" /> Relatório auditado pelo ÁUREA Tech ACPROBEC
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
