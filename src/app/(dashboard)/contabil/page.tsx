'use client'
import React, { useState } from 'react'
import { BookOpen, BarChart3, List, TreePine, FileBarChart, FolderOpen, Calendar, Settings, ShieldCheck, ChevronDown, Zap, Sparkles, CloudLightning, Target, FileText, RefreshCw, Activity, History, X, Printer, CheckCircle, BarChart2, AlertTriangle, BookText, Network, Building2, Tags, Coins, Flag } from 'lucide-react'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { useLancamentosContabeis } from '@/features/contabil/hooks/useLancamentosContabeis'
import ContabilDashboard from '@/features/contabil/components/ContabilDashboard'
import LivroDiario from '@/features/contabil/components/LivroDiario'
import LivroRazao from '@/features/contabil/components/LivroRazao'
import PlanoContasTree from '@/features/contabil/components/PlanoContasTree'
import Balancete from '@/features/contabil/components/Balancete'
import Demonstracoes from '@/features/contabil/components/Demonstracoes'
import Imobilizado from '@/features/contabil/components/Imobilizado'
import FechamentoPeriodos from '@/features/contabil/components/FechamentoPeriodos'
import CentrosCusto from '@/features/contabil/components/CentrosCusto'
import DFC from '@/features/contabil/components/DFC'
import PreFechamento from '@/features/contabil/components/PreFechamento'
import RelatoriosExport from '@/features/contabil/components/RelatoriosExport'
import ExecucaoRubrica from '@/features/contabil/components/ExecucaoRubrica'
import AClassificarTab from '@/features/contabil/components/AClassificarTab'

type Tab = 'dashboard' | 'lancamentos' | 'a_classificar' | 'razao' | 'plano' | 'balancete' | 'demonstracoes' | 'imobilizado' | 'periodos' | 'centros_custo' | 'dfc' | 'pre_fechamento' | 'relatorios' | 'execucao'

export default function ContabilPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const planoHook = usePlanoContas()
  const lancHook = useLancamentosContabeis()
  const [showMaintenanceMenu, setShowMaintenanceMenu] = useState(false)
  const [auditandoContas, setAuditandoContas] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logFilters, setLogFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  // Lógica de período dinâmico
  const isConsolidado = !lancHook.periodo || lancHook.periodo === 'all'
  const periodoLabel = isConsolidado ? 'Exercício 2026' : new Date(lancHook.periodo + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  
  let dataInicio = '2026-01-01'
  let dataFim: string | undefined = undefined
  
  if (!isConsolidado) {
    dataInicio = `${lancHook.periodo}-01`
    const [year, month] = lancHook.periodo.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    dataFim = `${lancHook.periodo}-${String(lastDay).padStart(2, '0')}`
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart2, color: 'emerald' },
    { id: 'lancamentos' as Tab, label: 'Livro Diário', icon: BookOpen, color: 'emerald' },
    { id: 'razao' as Tab, label: 'Livro Razão', icon: BookText, color: 'emerald' },
    { id: 'plano' as Tab, label: 'Plano de Contas', icon: Network, color: 'emerald' },
    { id: 'balancete' as Tab, label: 'Balancete', icon: BarChart3, color: 'emerald' },
    { id: 'demonstracoes' as Tab, label: 'Demonstrações', icon: FileBarChart, color: 'emerald' },
    { id: 'imobilizado' as Tab, label: 'Imobilizado', icon: Building2, color: 'emerald' },
    { id: 'periodos' as Tab, label: 'Períodos', icon: Settings, color: 'emerald' },
    { id: 'centros_custo' as Tab, label: 'CCs', icon: Tags, color: 'emerald' },
    { id: 'dfc' as Tab, label: 'DFC', icon: Coins, color: 'emerald' },
    { id: 'pre_fechamento' as Tab, label: 'Pré-Fechamento', icon: Flag, color: 'emerald' },
    { id: 'relatorios' as Tab, label: 'Relatórios', icon: FileText, color: 'emerald' },
    { id: 'execucao' as Tab, label: 'MROSC', icon: Target, color: 'emerald' },
  ]

  const getActiveIcon = () => {
    const tab = tabs.find(t => t.id === activeTab)
    const Icon = (tab as any)?.icon || BookOpen
    return <Icon size={22} />
  }


  const periodosOpcoes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: val, label: label.charAt(0).toUpperCase() + label.slice(1), key: `${val}-${i}` }
  })

  const currentPeriod = lancHook.periodo || 'all'

  const handlePeriodoChange = (val: string) => {
    lancHook.setPeriodo(val === 'all' ? '' : val)
  }

  const handleAuditoriaContas = async () => {
    setAuditandoContas(true)
    try {
      const { createMissingAccountsAction } = await import('@/features/contabil/actions/createMissingAccounts')
      const res = await createMissingAccountsAction(planoHook.tenantId)
      if (res.success) {
        alert(`Auditoria de Contas concluída!\n\n🆕 Novas contas criadas: ${res.created}\n✅ Contas já existentes: ${res.skipped}\n\nO Plano de Contas foi atualizado com sucesso.`)
        planoHook.refresh()
      }
    } catch (err) {
      alert('Erro ao processar auditoria.')
    } finally {
      setAuditandoContas(false)
    }
  }

  const fetchLogs = async () => {
    setLoadingLogs(true)
    const { getLogsAction } = await import('@/features/fiscal/actions/logActions')
    const res = await getLogsAction({ 
      module: 'contabil', 
      startDate: logFilters.startDate, 
      endDate: logFilters.endDate 
    })
    setLogs(res.data || [])
    setLoadingLogs(false)
    setShowLogs(true)
  }

  const handleCorrigirSequencia = async () => {
    setLoadingLogs(true)
    const { repararNumeracaoAction } = await import('@/features/contabil/actions/documentLinkActions')
    const res = await repararNumeracaoAction()
    setLoadingLogs(false)
    if (res.success) {
      alert(res.message)
      lancHook.refresh()
    }
  }

  const imprimirLogsPDF = () => {
    const html = `
      <html>
        <head>
          <title>Logs de Integração - ACPROBEC</title>
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ACPROBEC — HISTÓRICO DE INTEGRAÇÃO</h1>
            <p>MÓDULO CONTÁBIL</p>
            <div class="periodo">PERÍODO: ${logFilters.startDate} ATÉ ${logFilters.endDate}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="150">Data/Hora</th>
                <th width="100">Ação</th>
                <th>Detalhes do Reprocessamento</th>
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

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-700">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="relative z-50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/40 backdrop-blur-md py-3.5 px-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            {getActiveIcon()}
          </div>
          <div>
            <div className="relative mb-2">
                <button
                  onClick={() => setShowMaintenanceMenu(!showMaintenanceMenu)}
                  className={`flex items-center gap-2 px-4 py-1.5 text-[9px] font-black rounded-full transition-all shadow-sm border uppercase tracking-widest ${showMaintenanceMenu ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/80 text-emerald-700 border-emerald-100 hover:bg-emerald-50'}`}
                >
                  <ShieldCheck size={12} className={showMaintenanceMenu ? 'animate-pulse' : ''} />
                  Gestão de Integridade
                  <ChevronDown size={10} className={`transition-transform ${showMaintenanceMenu ? 'rotate-180' : ''}`} />
                </button>

              {showMaintenanceMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMaintenanceMenu(false)} />
                  <div className="absolute left-0 mt-2 w-80 bg-gradient-to-br from-[#0e2d22] to-[#163d2f] rounded-[24px] border border-white/10 shadow-2xl z-50 p-3 animate-in zoom-in-95 duration-200 backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="px-4 py-3 mb-2 border-b border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck size={10} /> Auditoria e Integridade
                        </p>
                        <p className="text-[11px] font-bold text-white/40 leading-none mt-1">Período: {periodoLabel}</p>
                      </div>
                      <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                    </div>
                    
                    <button
                      onClick={async () => {
                        setShowMaintenanceMenu(false)
                        if (confirm(`Deseja sincronizar os lançamentos de ${periodoLabel} ao Livro Diário?`)) {
                          const { sincronizarPeriodoContabil } = await import('@/features/contabil/actions/accountingActions')
                          const res: any = await sincronizarPeriodoContabil(dataInicio, dataFim)
                          if (res.success) {
                            alert(`Sincronização de ${periodoLabel} concluída!\n✅ Novos: ${res.success}\n📊 Total: ${res.total}`)
                            window.location.reload()
                          } else alert(`Erro: ${res.error}`)
                        }
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/80 hover:text-white transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                        <Zap size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">Sincronizar Período</p>
                        <p className="text-[9px] text-white/40 font-bold mt-0.5">Importar do financeiro</p>
                      </div>
                    </button>

                    <button
                      onClick={async () => {
                        setShowMaintenanceMenu(false)
                        if (confirm(`ATENÇÃO: Deseja executar o Saneamento de Auditoria em ${periodoLabel}?\n\nIsso irá corrigir erros de classificação baseando-se na ITG 2002 apenas para este período.`)) {
                          const { executarSaneamentoContabilAction } = await import('@/features/contabil/actions/executarSaneamentoContabilAction')
                          const { createMissingAccountsAction } = await import('@/features/contabil/actions/createMissingAccounts')
                          await createMissingAccountsAction(planoHook.tenantId)
                          const res = await executarSaneamentoContabilAction(planoHook.tenantId, isConsolidado ? undefined : lancHook.periodo)
                          if (res.success) {
                            alert(`Saneamento de ${periodoLabel} concluído!\n✅ ${res.fixedCount} correções aplicadas.`)
                            window.location.reload()
                          } else alert(`Erro: ${res.error}`)
                        }
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/80 hover:text-white transition-all group mt-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">Auditoria & Saneamento</p>
                        <p className="text-[9px] text-white/40 font-bold mt-0.5">Normas ITG 2002 (R1)</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowMaintenanceMenu(false); setActiveTab('a_classificar'); }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/80 hover:text-white transition-all group mt-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-inner">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">A Classificar</p>
                        <p className="text-[9px] text-white/40 font-bold mt-0.5">Pendências de classificação</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowMaintenanceMenu(false); handleAuditoriaContas(); }}
                      disabled={auditandoContas}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/80 hover:text-white transition-all group mt-1 disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                        <CheckCircle size={16} className={auditandoContas ? 'animate-spin' : ''} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">Verificar Plano</p>
                        <p className="text-[9px] text-white/40 font-bold mt-0.5">Conformidade de contas</p>
                      </div>
                    </button>

                    <div className="my-2 border-t border-white/5" />

                    <button
                      onClick={() => { setShowMaintenanceMenu(false); handleCorrigirSequencia(); }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white/40 group-hover:text-emerald-400 transition-colors">
                        <Activity size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">Corrigir Sequência</p>
                        <p className="text-[9px] text-white/30 font-bold mt-0.5">Reparar numeração do Diário</p>
                      </div>
                    </button>

                    <button
                      onClick={async () => {
                        setShowMaintenanceMenu(false)
                        if (confirm('Deseja configurar automaticamente o mapeamento das categorias financeiras e atualizar as contas de fornecedores e bancos?')) {
                          const { seedAccountingConfigAction } = await import('@/features/contabil/actions/seedAccountingConfig')
                          const { fixFornecedoresAccountsAction } = await import('@/features/contabil/actions/fixFornecedoresAccounts')
                          const { fixBankAccountsAction } = await import('@/features/contabil/actions/fixBankAccountsAction')
                          const { atualizarBancosNoDiarioAction } = await import('@/features/contabil/actions/atualizarBancosNoDiarioAction')
                          
                          await seedAccountingConfigAction(planoHook.tenantId)
                          await fixFornecedoresAccountsAction(planoHook.tenantId)
                          await fixBankAccountsAction(planoHook.tenantId)
                          await atualizarBancosNoDiarioAction(planoHook.tenantId)
                          
                          alert('Mapeamento, fornecedores e contas bancárias atualizados com sucesso!')
                        }
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group mt-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white/40 group-hover:text-emerald-400 transition-colors">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">Mapeamento Inteligente</p>
                        <p className="text-[9px] text-white/30 font-bold mt-0.5">Configuração automática</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowMaintenanceMenu(false); fetchLogs(); }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group mt-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white/40 group-hover:text-emerald-400 transition-colors">
                        <History size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider">Histórico de Logs</p>
                        <p className="text-[9px] text-white/30 font-bold mt-0.5">Auditoria de integração</p>
                      </div>
                    </button>

                    {isConsolidado && (
                      <button
                        onClick={async () => {
                          setShowMaintenanceMenu(false)
                          if (confirm('Deseja realizar a integração COMPLETA (Fiscal + Financeiro) desde Janeiro/2026? Esta operação pode levar alguns minutos.')) {
                            alert('A integração total foi iniciada. Por favor, aguarde a mensagem de conclusão (isso pode levar de 30 segundos a 2 minutos).')
                            try {
                              const { integracaoFiscalContabilTotalAction } = await import('@/features/contabil/actions/accountingActions')
                              const res = await integracaoFiscalContabilTotalAction('2026-01-01')
                              if (res.success) {
                                alert(`✅ INTEGRAÇÃO TOTAL CONCLUÍDA!\n\n${res.resumo}`)
                                window.location.reload()
                              } else {
                                alert(`❌ Erro na integração: ${res.error || 'Erro desconhecido'}`)
                              }
                            } catch (err: any) {
                              alert(`❌ Erro crítico: ${err.message}`)
                            }
                          }
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group mt-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white/40 group-hover:text-emerald-400 transition-colors">
                          <RefreshCw size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider">Integração Retroativa</p>
                          <p className="text-[9px] text-white/30 font-bold mt-0.5">Ciclo completo 2026</p>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Contabilidade</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">ITG 2002 (R1) — Livro Diário • ECD • SPED</p>
          </div>
        </div>

        {/* Tab Switcher - Premium Interaction */}
        <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner overflow-x-auto custom-scrollbar-hide no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-2 py-2 rounded-[14px] text-[9px] font-black uppercase tracking-wider transition-all duration-500 shrink-0
                  ${isActive 
                    ? 'bg-white text-[#0e2d22] shadow-md border border-slate-200/50 scale-105' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                `}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Aviso ITG 2002 */}
      {planoHook.contas.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">📘</span>
          <div>
            <p className="text-sm font-black text-indigo-800">Plano de Contas não inicializado</p>
            <p className="text-xs text-indigo-600 mt-1">
              Clique em "Inicializar Plano de Contas ITG 2002" para carregar automaticamente o plano padrão para
              associações sem fins lucrativos conforme a Norma ITG 2002 (R1) do Conselho Federal de Contabilidade.
            </p>
          </div>
        </div>
      )}

      {/* Filtro de Período Global - Visível em todas as abas */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Período Contábil</h3>
            <p className="text-[10px] font-bold text-slate-400">Dados oficiais sincronizados para todo o exercício</p>
          </div>
        </div>
        
        <select 
          value={currentPeriod} 
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700 outline-none hover:bg-slate-100 transition-all cursor-pointer min-w-[220px]"
        >
          <option value="all">Visão Consolidada (Exercício)</option>
          {periodosOpcoes.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {activeTab === 'dashboard' && <ContabilDashboard lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'lancamentos' && <LivroDiario lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'a_classificar' && <AClassificarTab lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'razao' && <LivroRazao lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'plano' && <PlanoContasTree planoHook={planoHook} />}
      {activeTab === 'balancete' && <Balancete lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'demonstracoes' && <Demonstracoes lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'imobilizado' && <Imobilizado planoHook={planoHook} />}
      {activeTab === 'periodos' && <FechamentoPeriodos />}
      {activeTab === 'centros_custo' && <CentrosCusto />}
      {activeTab === 'dfc' && <DFC lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'pre_fechamento' && <PreFechamento />}
      {activeTab === 'relatorios' && <RelatoriosExport lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'execucao' && <ExecucaoRubrica lancHook={lancHook} />}

      {/* Painel de Logs Lateral (Global) */}
      {showLogs && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[110] p-6 animate-in slide-in-from-right duration-300 border-l border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" /> Histórico de Integração
            </h3>
            <button onClick={() => setShowLogs(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl mb-6 border border-indigo-100/50">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Filtrar Período</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Início</label>
                <input 
                  type="date" 
                  value={logFilters.startDate}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold outline-none focus:ring-2 ring-indigo-500/10 focus:border-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Fim</label>
                <input 
                  type="date" 
                  value={logFilters.endDate}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold outline-none focus:ring-2 ring-indigo-500/10 focus:border-indigo-600"
                />
              </div>
            </div>
            <button 
              onClick={fetchLogs}
              className="w-full mt-3 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-[9px] font-black hover:bg-indigo-50 transition-all uppercase tracking-widest"
            >
              Aplicar Filtro
            </button>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-center py-20 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum log registrado</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-lg">
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
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Printer size={14} /> Imprimir Relatório de Logs
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
