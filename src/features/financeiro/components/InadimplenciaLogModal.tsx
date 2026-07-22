'use client'
import React, { useState } from 'react'
import { X, FileText, History, Printer, Search, Calendar, Activity, Download } from 'lucide-react'
import { fmtData } from '@/lib/utils/formatters'

interface InadimplenciaLogModalProps {
  isOpen: boolean
  onClose: () => void
  logs: any[]
  loading: boolean
  onFilter: (filters: { startDate: string, endDate: string }) => void
}

export default function InadimplenciaLogModal({ 
  isOpen, 
  onClose, 
  logs, 
  loading,
  onFilter 
}: InadimplenciaLogModalProps) {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  if (!isOpen) return null

  const handlePrint = () => {
    const html = `
      <html>
        <head>
          <title>Relatório de Auditoria Financeira - ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; color: #4f46e5; text-transform: uppercase; font-weight: 900; }
            .periodo { font-size: 10px; color: #64748b; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; text-transform: uppercase; border: 1px solid #e2e8f0; font-weight: 900; }
            td { padding: 12px; border: 1px solid #e2e8f0; font-size: 11px; }
            .timestamp { color: #64748b; font-weight: bold; }
            .badge { background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 900; font-size: 9px; }
            .footer { margin-top: 30px; text-align: right; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — AUDITORIA DE INADIMPLÊNCIA</h1>
            <p>MÓDULO FINANCEIRO</p>
            <div class="periodo">PERÍODO: ${fmtData(filters.startDate)} ATÉ ${fmtData(filters.endDate)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="150">Data/Hora</th>
                <th width="120">Ação</th>
                <th>Detalhes da Atividade</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td class="timestamp">${new Date(l.created_at).toLocaleString('pt-BR')}</td>
                  <td><span class="badge">${l.acao}</span></td>
                  <td>${l.detalhes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | ÁUREA Tech ACPROBEC — Sistema de Gestão Unificada</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(html)
    win?.document.close()
    setTimeout(() => {
      win?.print()
      // win?.close()
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Logs de Auditoria</h2>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-indigo-200">Histórico de Inadimplência</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-3">Filtrar Período</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/60 uppercase ml-1">Início</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-[10px] font-bold text-white outline-none focus:ring-2 ring-white/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/60 uppercase ml-1">Fim</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-[10px] font-bold text-white outline-none focus:ring-2 ring-white/20"
                />
              </div>
            </div>
            <button 
              onClick={() => onFilter(filters)}
              className="w-full mt-4 py-2.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-50 transition-all uppercase tracking-widest shadow-lg shadow-black/10"
            >
              Atualizar Histórico
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Activity className="animate-spin" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Carregando Auditoria...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
              <Search size={48} strokeWidth={1.5} />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma atividade registrada</p>
            </div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="group bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                    {log.acao}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(log.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">{log.detalhes}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 shrink-0">
          <button 
            onClick={handlePrint}
            disabled={logs.length === 0 || loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Printer size={18} /> Gerar Relatório PDF
          </button>
        </div>
      </div>
    </div>
  )
}
