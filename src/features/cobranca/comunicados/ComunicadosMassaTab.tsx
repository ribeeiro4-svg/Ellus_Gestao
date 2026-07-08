'use client'
import React, { useState, useMemo } from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useComunicados } from '@/lib/hooks/useComunicados'
import FiltrosAssociados from './FiltrosAssociados'
import TabelaAssociados from './TabelaAssociados'
import GerenciadorTemplates from './GerenciadorTemplates'
import EnvioWaMe from './EnvioWaMe'
import HistoricoComunicados from './HistoricoComunicados'
import MetricasComunicados from './MetricasComunicados'
import { Megaphone, History } from 'lucide-react'
import { Associado } from '@/lib/types'

export default function ComunicadosMassaTab() {
  const [activeTab, setActiveTab] = useState<'envio' | 'historico'>('envio')
  const { associados, loading: loadingAssociados } = useAssociados()
  const { templates, historico, loadingTemplates, loadingHistorico, criarTemplate, editarTemplate, excluirTemplate, registrarEnvio, atualizarStatusEmMassa } = useComunicados()

  // Filtros state
  const [filteredAssociados, setFilteredAssociados] = useState<Associado[]>([])
  
  // Seleção state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Template e Envio state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  
  // Handle filters change
  const handleFiltrosChange = (newFiltered: Associado[]) => {
    setFilteredAssociados(newFiltered)
    // Se o filtro mudar, talvez limpar a seleção que não está mais visível, mas por segurança mantemos ou limpamos
    // Vou limpar a seleção para evitar envio para pessoas ocultas no filtro atual, ou manter apenas os que ainda estão no filtro.
    setSelectedIds(prev => prev.filter(id => newFiltered.some(a => a.id === id)))
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      <MetricasComunicados historico={historico} />

      {/* Sub-abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('envio')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-all ${activeTab === 'envio' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Megaphone size={16} />
          Nova Campanha
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-all ${activeTab === 'historico' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <History size={16} />
          Histórico e Relatórios
        </button>
      </div>

      {activeTab === 'envio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Esquerda: Filtros e Tabela (8 colunas) */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            <FiltrosAssociados 
              associados={associados} 
              onFilter={handleFiltrosChange} 
              historico={historico}
              selectedTemplateId={selectedTemplateId}
            />
            <TabelaAssociados 
              associados={filteredAssociados} 
              loading={loadingAssociados}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              historico={historico}
              selectedTemplateId={selectedTemplateId}
            />
          </div>

          {/* Direita: Templates e Envio (4 colunas) */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
            <EnvioWaMe 
              selectedAssociados={associados.filter(a => selectedIds.includes(a.id))}
              template={templates.find(t => t.id === selectedTemplateId)}
              onLogEnvio={registrarEnvio}
            />

            <GerenciadorTemplates 
              templates={templates}
              loading={loadingTemplates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={setSelectedTemplateId}
              onSave={criarTemplate}
              onUpdate={editarTemplate}
              onDelete={excluirTemplate}
            />
          </div>
        </div>
      ) : (
        <HistoricoComunicados 
          historico={historico}
          loading={loadingHistorico}
          onUpdateStatus={atualizarStatusEmMassa}
        />
      )}
    </div>
  )
}
