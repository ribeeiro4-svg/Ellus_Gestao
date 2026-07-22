'use client'
import React, { useState } from 'react'
import { Calendar as CalendarIcon, Users, Clock } from 'lucide-react'
import CalendarioAgendamentos from './CalendarioAgendamentos'
import CorretoresTab from './ResponsaveisTab'
import RelatorioAtendimentosTab from './RelatorioAtendimentosTab'
import HistoricoAdesaoTab from './HistoricoAdesaoTab'
import HistoricoAgendamentosTab from './HistoricoAgendamentosTab'
import { useHistoricoAdesao } from '@/lib/hooks/useHistoricoAdesao'

export default function AtendimentosHub() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'corretores' | 'relatorio' | 'historico_adesao' | 'historico_agendamentos'>('calendario')
  const { registrar } = useHistoricoAdesao()

  const handleRegistrarAdesao = async (dados: { nome_completo: string; cpf: string; telefone: string }) => {
    await registrar(dados)
  }

  return (
    <div className="p-4 md:p-8 w-full flex-1 flex flex-col gap-6 min-h-screen">
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full h-full">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Atendimentos Presenciais</h2>
            <p className="text-xs text-gray-500 font-medium">Controle de agendamentos e recepção de associados na sede</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 flex-wrap">
          <button
            onClick={() => setActiveTab('calendario')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-[13px] font-bold uppercase tracking-tight transition-colors ${
              activeTab === 'calendario'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <CalendarIcon size={16} />
            Calendário de Agendamentos
          </button>

          <button
            onClick={() => setActiveTab('historico_agendamentos')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-[13px] font-bold uppercase tracking-tight transition-colors ${
              activeTab === 'historico_agendamentos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Clock size={16} />
            Histórico de Agendamentos
          </button>

          <button
            onClick={() => setActiveTab('historico_adesao')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-[13px] font-bold uppercase tracking-tight transition-colors ${
              activeTab === 'historico_adesao'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Clock size={16} />
            Histórico (Não Associados - Interessados)
          </button>

          <button
            onClick={() => setActiveTab('relatorio')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-[13px] font-bold uppercase tracking-tight transition-colors ${
              activeTab === 'relatorio'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <CalendarIcon size={16} />
            Relatórios (PDF)
          </button>

          <button
            onClick={() => setActiveTab('corretores')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-[13px] font-bold uppercase tracking-tight transition-colors ${
              activeTab === 'corretores'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users size={16} />
            Cadastro de Corretores
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
          {activeTab === 'calendario' && (
            <CalendarioAgendamentos
              onStartAtendimento={() => {}}
              onRegistrarAdesao={handleRegistrarAdesao}
              onSalvarHistorico={(dados) => {
                handleRegistrarAdesao(dados)
                setActiveTab('historico_adesao')
              }}
            />
          )}
          {activeTab === 'corretores' && <CorretoresTab />}
          {activeTab === 'relatorio' && <RelatorioAtendimentosTab />}
          {activeTab === 'historico_adesao' && <HistoricoAdesaoTab />}
          {activeTab === 'historico_agendamentos' && <HistoricoAgendamentosTab />}
        </div>
      </div>
    </div>
  )
}
