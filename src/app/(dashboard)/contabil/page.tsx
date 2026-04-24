'use client'
import React, { useState } from 'react'
import { BookOpen, BarChart3, List, TreePine, FileBarChart, FolderOpen } from 'lucide-react'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { useLancamentosContabeis } from '@/features/contabil/hooks/useLancamentosContabeis'
import ContabilDashboard from '@/features/contabil/components/ContabilDashboard'
import LivroDiario from '@/features/contabil/components/LivroDiario'
import PlanoContasTree from '@/features/contabil/components/PlanoContasTree'
import Balancete from '@/features/contabil/components/Balancete'
import Demonstracoes from '@/features/contabil/components/Demonstracoes'
import Imobilizado from '@/features/contabil/components/Imobilizado'
import FechamentoPeriodos from '@/features/contabil/components/FechamentoPeriodos'
import CentrosCusto from '@/features/contabil/components/CentrosCusto'
import DFC from '@/features/contabil/components/DFC'
import PreFechamento from '@/features/contabil/components/PreFechamento'
import RelatoriosExport from '@/features/contabil/components/RelatoriosExport'

type Tab = 'dashboard' | 'lancamentos' | 'plano' | 'balancete' | 'demonstracoes' | 'imobilizado' | 'periodos' | 'centros_custo' | 'dfc' | 'pre_fechamento' | 'relatorios'

export default function ContabilPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const planoHook = usePlanoContas()
  const lancHook = useLancamentosContabeis()

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Dashboard' },
    { id: 'lancamentos' as Tab, label: '📒 Livro Diário', badge: lancHook.stats.total },
    { id: 'plano' as Tab, label: '🏗️ Plano de Contas' },
    { id: 'balancete' as Tab, label: '📈 Balancete' },
    { id: 'demonstracoes' as Tab, label: '📑 Demonstrações' },
    { id: 'imobilizado' as Tab, label: '🏢 Imobilizado' },
    { id: 'periodos' as Tab, label: '⚙️ Períodos' },
    { id: 'centros_custo' as Tab, label: '🏷️ CCs' },
    { id: 'dfc' as Tab, label: '💸 DFC' },
    { id: 'pre_fechamento' as Tab, label: '🏁 Pré-Fechamento' },
    { id: 'relatorios' as Tab, label: '📄 Relatórios' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Contabilidade</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ITG 2002 (R1) • Livro Diário • ECD • SPED Contábil</p>
          </div>
        </div>
        <div className="flex gap-2">
          {planoHook.contas.length === 0 && (
            <button
              onClick={() => planoHook.inicializarPlanoContas()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
            >
              🚀 Inicializar Plano de Contas ITG 2002
            </button>
          )}
          <button
            onClick={async () => {
              if (confirm('Deseja integrar todos os lançamentos pagos de Janeiro/2026 até hoje ao Livro Diário?')) {
                const { sincronizarPeriodoContabil } = await import('@/features/contabil/actions/accountingActions')
                const res = await sincronizarPeriodoContabil('2026-01-01')
                if (res.success) {
                  if (res.errors && res.errors.length > 0) {
                    alert(`Sucesso Parcial! ${res.count} de ${res.total} lançamentos foram sincronizados.\n\nPrimeiro Erro: ${res.errors[0]}`)
                  } else {
                    alert(`Sucesso! ${res.count} de ${res.total} lançamentos foram sincronizados.`)
                  }
                  window.location.reload()
                } else alert(`Erro na sincronização: ${res.error}`)
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-amber-600 bg-white border border-amber-100 hover:bg-amber-50 rounded-xl transition-all shadow-sm"
          >
            🔄 Sincronizar Retroativos
          </button>
          <button
            onClick={async () => {
              if (confirm('Deseja configurar automaticamente o mapeamento das categorias financeiras e atualizar as contas de fornecedores?')) {
                const { seedAccountingConfigAction } = await import('@/features/contabil/actions/seedAccountingConfig')
                const { fixFornecedoresAccountsAction } = await import('@/features/contabil/actions/fixFornecedoresAccounts')
                const res = await seedAccountingConfigAction()
                const fixRes = await fixFornecedoresAccountsAction()
                if (res.success) alert(`Mapeamento configurado! ${fixRes.count ? fixRes.count + ' fornecedores atualizados.' : ''}`)
                else alert(`Erro ao configurar: ${res.error}`)
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-indigo-600 bg-white border border-indigo-100 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
          >
            ⚙️ Mapeamento Automático
          </button>
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

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <ContabilDashboard lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'lancamentos' && <LivroDiario lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'plano' && <PlanoContasTree planoHook={planoHook} />}
      {activeTab === 'balancete' && <Balancete lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'demonstracoes' && <Demonstracoes lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'imobilizado' && <Imobilizado planoHook={planoHook} />}
      {activeTab === 'periodos' && <FechamentoPeriodos />}
      {activeTab === 'centros_custo' && <CentrosCusto />}
      {activeTab === 'dfc' && <DFC lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'pre_fechamento' && <PreFechamento />}
      {activeTab === 'relatorios' && <RelatoriosExport lancHook={lancHook} planoHook={planoHook} />}
    </div>
  )
}
