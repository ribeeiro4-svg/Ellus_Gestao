'use client'

import React, { useState } from 'react'
import { DADOS_ROTINA_TESOUREIRO, TarefaTesoureiro } from '../rotina-tesoureiro-data'
import { Calendar, CheckCircle2, ChevronRight, Clock, GripVertical, FileText, LayoutDashboard, Wallet, CreditCard, ArrowRight, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { POPS } from '../pops-data'

export default function RotinaGerenciavelTab() {
  const [tarefas, setTarefas] = useState<TarefaTesoureiro[]>(DADOS_ROTINA_TESOUREIRO.tarefas_iniciais)
  const [tarefaAberta, setTarefaAberta] = useState<TarefaTesoureiro | null>(null)
  const [modalTab, setModalTab] = useState<'detalhes' | 'pops'>('detalhes')
  
  const statusColumns: TarefaTesoureiro['status'][] = ['A Fazer', 'Em Andamento', 'Concluído']

  const moverTarefa = (id: string, novoStatus: TarefaTesoureiro['status']) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus } : t))
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('tarefa_id', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: TarefaTesoureiro['status']) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('tarefa_id')
    if (id) {
      moverTarefa(id, status)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Info - Rotina */}
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Rotina Semanal e Atribuições</h2>
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2"><Clock size={16} className="text-emerald-500"/> {DADOS_ROTINA_TESOUREIRO.capa.horario}</div>
            <div className="flex items-center gap-2"><Calendar size={16} className="text-emerald-500"/> {DADOS_ROTINA_TESOUREIRO.capa.reuniao}</div>
            <div className="flex items-center gap-2"><FileText size={16} className="text-emerald-500"/> Base: {DADOS_ROTINA_TESOUREIRO.capa.normativa}</div>
          </div>
        </div>
        
        {/* Atalhos Rápidos */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/resumo" className="flex items-center gap-2 bg-[#0e2d22] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors">
            <LayoutDashboard size={16}/>
            Dashboard
          </Link>
          <Link href="/financeiro" className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-200 transition-colors">
            <Wallet size={16}/>
            Financeiro
          </Link>
          <Link href="/financeiro?tab=inadimplencia" className="flex items-center gap-2 bg-rose-100 text-rose-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-200 transition-colors">
            <CreditCard size={16}/>
            Inadimplência
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map(status => (
          <div 
            key={status}
            className="bg-slate-100/50 rounded-[24px] p-4 flex flex-col gap-4 min-h-[400px] border border-slate-200/50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                {status === 'A Fazer' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                {status === 'Em Andamento' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                {status === 'Concluído' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                {status}
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100">
                {tarefas.filter(t => t.status === status).length}
              </span>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {tarefas.filter(t => t.status === status).map(tarefa => (
                <div 
                  key={tarefa.id}
                  draggable
                  onClick={() => { setTarefaAberta(tarefa); setModalTab('detalhes'); }}
                  onDragStart={(e) => handleDragStart(e, tarefa.id)}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      {tarefa.bloco}
                    </span>
                    <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-snug">
                    {tarefa.atividade}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">
                      {tarefa.periodicidade}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider" title="Base Normativa">
                      {tarefa.base_normativa}
                    </span>
                  </div>
                </div>
              ))}
              
              {tarefas.filter(t => t.status === status).length === 0 && (
                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-medium">
                  Solte as tarefas aqui
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>

      {/* Modal de Detalhes da Tarefa */}
      {tarefaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider mb-3 inline-block">
                  {tarefaAberta.bloco}
                </span>
                <h2 className="text-xl font-black text-slate-800 leading-tight pr-4">{tarefaAberta.atividade}</h2>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={14} className="text-amber-500" />
                    {tarefaAberta.periodicidade}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <FileText size={14} className="text-blue-500" />
                    {tarefaAberta.base_normativa}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setTarefaAberta(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex px-6 border-b border-slate-100 bg-white">
              <button
                onClick={() => setModalTab('detalhes')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${modalTab === 'detalhes' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Detalhes e Atalhos
              </button>
              <button
                onClick={() => setModalTab('pops')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${modalTab === 'pops' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                POPs Relacionados
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-white flex-1">
              {modalTab === 'detalhes' && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição da Atividade</h3>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {tarefaAberta.descricao_detalhada || 'Nenhuma descrição detalhada fornecida para esta atividade.'}
                    </p>
                  </div>

                  {tarefaAberta.atalhos && tarefaAberta.atalhos.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Atalhos do Sistema</h3>
                      <div className="flex flex-wrap gap-3">
                        {tarefaAberta.atalhos.map((atalho, i) => (
                          <Link 
                            key={i} 
                            href={atalho.href}
                            className="flex items-center gap-2 bg-[#0e2d22] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors shadow-sm"
                          >
                            {atalho.label}
                            <ExternalLink size={14} className="opacity-70" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'pops' && (
                <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Procedimentos Operacionais (POPs)</h3>
                  {tarefaAberta.pops && tarefaAberta.pops.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {tarefaAberta.pops.map(popCodigo => {
                        const popObj = POPS.find(p => p.codigo === popCodigo)
                        if (!popObj) return null
                        return (
                          <div key={popCodigo} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                {popObj.codigo}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{popObj.modulo}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">{popObj.titulo}</h4>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      Nenhum POP vinculado a esta atividade.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setTarefaAberta(null)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
