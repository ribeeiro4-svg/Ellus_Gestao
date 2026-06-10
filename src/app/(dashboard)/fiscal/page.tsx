'use client'
import React, { useState } from 'react'
import { FileText, Package, Calendar, BarChart3, Upload, BookOpen, AlertTriangle, CheckCircle, Clock, TrendingUp, FileCheck, ArrowRight, Printer, History, Activity, X, Loader2 } from 'lucide-react'
import { getLogsAction } from '@/features/fiscal/actions/logActions'
import { useRouter } from 'next/navigation'
import { useNFe } from '@/features/fiscal/hooks/useNFe'
import { useProdutosEstoque } from '@/features/fiscal/hooks/useProdutosEstoque'
import { useNFSe } from '@/features/fiscal/hooks/useNFSe'
import FiscalDashboard from '@/features/fiscal/components/FiscalDashboard'
import ImportarNFe from '@/features/fiscal/components/ImportarNFe'
import ListaNFe from '@/features/fiscal/components/ListaNFe'
import EscrituracaoNFe from '@/features/fiscal/components/EscrituracaoNFe'
import PeriodosFiscais from '@/features/fiscal/components/PeriodosFiscais'
import EstoqueTab from '@/features/fiscal/components/EstoqueTab'
import NFSeModuleTab from '@/features/fiscal/components/nfse/NFSeModuleTab'
import RelatoriosFiscais from '@/features/fiscal/components/RelatoriosFiscais'

type Tab = 'dashboard' | 'importar' | 'notas' | 'escrituracao' | 'estoque' | 'periodos' | 'nfse' | 'relatorios'

export default function FiscalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [nfeParaEscriturar, setNfeParaEscriturar] = useState<string | null>(null)
  const nfeHook = useNFe()
  const estoqueHook = useProdutosEstoque()
  const nfseHook = useNFSe()

  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logFilters, setLogFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const fetchLogs = async () => {
    setLoadingLogs(true)
    const res = await getLogsAction({ 
      module: 'fiscal', 
      startDate: logFilters.startDate, 
      endDate: logFilters.endDate 
    })
    setLogs(res.data || [])
    setLoadingLogs(false)
    setShowLogs(true)
  }

  const imprimirLogsPDF = () => {
    const html = `
      <html>
        <head>
          <title>Logs de Operações Fiscais - ACPROBEC</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; color: #3b82f6; text-transform: uppercase; font-weight: 900; }
            .periodo { font-size: 10px; color: #64748b; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; text-transform: uppercase; border: 1px solid #e2e8f0; font-weight: 900; }
            td { padding: 12px; border: 1px solid #e2e8f0; font-size: 11px; }
            .timestamp { color: #64748b; font-weight: bold; }
            .badge { background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: 900; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — HISTÓRICO DE OPERAÇÕES FISCAIS</h1>
            <p>MÓDULO FISCAL</p>
            <div class="periodo">PERÍODO: ${new Date(logFilters.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} ATÉ ${new Date(logFilters.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="150">Data/Hora</th>
                <th width="120">Ação</th>
                <th>Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td class="timestamp">${new Date(l.created_at).toLocaleString()}</td>
                  <td><span class="badge">${l.acao}</span></td>
                  <td>${l.detalhes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(html)
    win?.document.close()
    setTimeout(() => win?.print(), 500)
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'importar' as Tab, label: 'Importar NF-e', icon: Upload },
    { id: 'notas' as Tab, label: 'Notas', icon: FileText, badge: nfeHook.stats.pendentes > 0 ? nfeHook.stats.pendentes : undefined },
    { id: 'escrituracao' as Tab, label: 'Escrituração', icon: BookOpen },
    { id: 'estoque' as Tab, label: 'Estoque', icon: Package, badge: estoqueHook.stats.produtosAbaixoMinimo > 0 ? estoqueHook.stats.produtosAbaixoMinimo : undefined },
    { id: 'periodos' as Tab, label: 'Períodos', icon: Calendar },
    { id: 'nfse' as Tab, label: 'NFS-e', icon: FileCheck },
    { id: 'relatorios' as Tab, label: 'Relatórios', icon: Printer },
  ]

  const getActiveIcon = () => {
    const tab = tabs.find(t => t.id === activeTab)
    const Icon = (tab as any)?.icon || FileText
    return <Icon size={28} />
  }


  const handleEscriturar = (nfeId: string) => {
    setNfeParaEscriturar(nfeId)
    setActiveTab('escrituracao')
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const periodosOpcoes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: val, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  const currentPeriod = nfeHook.filterPeriodo || 'all'

  const handlePeriodoChange = (val: string) => {
    nfeHook.setFilterPeriodo(val === 'all' ? '' : val)
    nfseHook.setPeriodo(val)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            {getActiveIcon()}
          </div>
          <div>
            <div className="flex flex-col gap-2">
              <button onClick={fetchLogs}
                className="w-fit flex items-center gap-2 px-4 py-1.5 text-[9px] font-black text-emerald-700 bg-white/80 border border-emerald-100 hover:bg-emerald-50 rounded-full transition-all shadow-sm uppercase tracking-widest">
                {loadingLogs ? <Loader2 size={12} className="animate-spin text-emerald-600" /> : <History size={12} className="text-emerald-600" />}
                Auditoria & Histórico
              </button>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Escrituração Fiscal</h1>
                {nfeHook.stats.pendentes > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full animate-pulse">
                    <AlertTriangle size={10} className="text-orange-500" />
                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">{nfeHook.stats.pendentes} Notas Pendentes</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">EFD-ICMS/IPI • Modelo 55 • SPED — ACPROBEC</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white/60 rounded-[22px] border border-white p-1.5 shadow-inner backdrop-blur-sm">
            <div className="flex items-center bg-white/80 rounded-xl px-4 py-2 border border-slate-100/50">
              <Calendar size={14} className="text-slate-400 mr-3" />
              <select 
                value={currentPeriod} 
                onChange={(e) => handlePeriodoChange(e.target.value)}
                className="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0 pr-6 cursor-pointer uppercase tracking-widest"
              >
                <option value="all">Visão Geral</option>
                {periodosOpcoes.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Switcher - Premium Interaction */}
          <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex flex-wrap items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-[14px] text-[9px] font-black uppercase tracking-wider transition-all duration-500
                    ${isActive 
                      ? 'bg-white text-[#0e2d22] shadow-md border border-slate-200/50 scale-105' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                  `}
                >
                  <Icon size={12} />
                  {tab.label}
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[7px] font-black flex items-center justify-center border-2 border-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>


      {/* Content */}
      {activeTab === 'dashboard' && <FiscalDashboard nfeHook={nfeHook} estoqueHook={estoqueHook} nfseHook={nfseHook} />}
      {activeTab === 'importar' && <ImportarNFe nfeHook={nfeHook} onImported={() => setActiveTab('notas')} />}
      {activeTab === 'notas' && <ListaNFe nfeHook={nfeHook} onEscriturar={handleEscriturar} />}
      {activeTab === 'escrituracao' && <EscrituracaoNFe nfeHook={nfeHook} nfeIdInicial={nfeParaEscriturar} />}
      {activeTab === 'estoque' && <EstoqueTab estoqueHook={estoqueHook} />}
      {activeTab === 'periodos' && <PeriodosFiscais nfeHook={nfeHook} />}
      {activeTab === 'nfse' && <NFSeModuleTab nfseHook={nfseHook} />}
      {activeTab === 'relatorios' && <RelatoriosFiscais nfeHook={nfeHook} nfseHook={nfseHook} estoqueHook={estoqueHook} />}

      {/* Painel de Logs Lateral (Fiscal) */}
      {showLogs && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[110] p-6 animate-in slide-in-from-right duration-300 border-l border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Activity size={16} className="text-blue-600" /> Auditoria Fiscal
            </h3>
            <button onClick={() => setShowLogs(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 border border-blue-100/50">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">Filtrar Período</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Início</label>
                <input 
                  type="date" 
                  value={logFilters.startDate}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold outline-none focus:ring-2 ring-blue-500/10 focus:border-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Fim</label>
                <input 
                  type="date" 
                  value={logFilters.endDate}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold outline-none focus:ring-2 ring-blue-500/10 focus:border-blue-600"
                />
              </div>
            </div>
            <button 
              onClick={fetchLogs}
              className="w-full mt-3 py-2 bg-white border border-blue-100 text-blue-600 rounded-xl text-[9px] font-black hover:bg-blue-50 transition-all uppercase tracking-widest"
            >
              Aplicar Filtro
            </button>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-center py-20 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum log fiscal registrado</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-lg">
                      {log.acao}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{log.detalhes}</p>
                </div>
              ))
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <button 
              onClick={imprimirLogsPDF}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Printer size={14} /> Imprimir Relatório Fiscal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
